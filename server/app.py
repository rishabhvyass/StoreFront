from __future__ import annotations

import hashlib
import hmac
import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from uuid import uuid4

import jwt
import requests as http_requests
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token
except ImportError:  # pragma: no cover - handled at runtime
    google_requests = None
    google_id_token = None


BASE_DIR = Path(__file__).resolve().parent


def load_env_file(path: Path):
    if not path.exists():
        return

    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        cleaned = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), cleaned)


load_env_file(BASE_DIR / ".env")
load_env_file(BASE_DIR.parent / ".env")

DB_PATH = Path(os.getenv("DATABASE_PATH", BASE_DIR / "appareldesk.sqlite3"))
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_EXP_DAYS = int(os.getenv("JWT_EXP_DAYS", "7"))
PORT = int(os.getenv("PORT", "5001"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_COMPANY_NAME = os.getenv("RAZORPAY_COMPANY_NAME", "ShopFront")

ARRAY_FIELDS = {"colors", "images", "items"}
OBJECT_FIELDS = {"address"}
BOOL_FIELDS = {"published", "automatic_invoicing"}
VALID_PAYMENT_METHODS = {"razorpay", "upi", "card", "net_banking", "cod"}
LEGACY_SEED_PRODUCTS = (
    (
        "Classic Linen Shirt",
        "A breathable linen shirt for warm-weather dressing.",
    ),
    (
        "Tailored Cotton Trousers",
        "Smart everyday trousers with a clean taper.",
    ),
    (
        "Soft Knit Midi Dress",
        "A relaxed midi silhouette with a polished finish.",
    ),
    (
        "Everyday Overshirt",
        "An unpublished sample product for backend review flows.",
    ),
)
UNSPLASH_IMAGE_SETS = {
    "men": [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80",
    ],
    "women": [
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    ],
    "children": [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=80",
    ],
    "beauty": [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    ],
    "default": [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
    ],
}

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_iso_date(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        try:
            return datetime.fromisoformat(f"{value}T00:00:00")
        except ValueError:
            return None


def is_in_range(value: str | None, start_date: str | None, end_date: str | None) -> bool:
    target = parse_iso_date(value)
    if not target:
        return False

    start = parse_iso_date(start_date)
    end = parse_iso_date(end_date)

    if start and target < start:
        return False
    if end and target > end:
        return False
    return True


def coerce_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def coerce_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def slugify_text(value: str | None) -> str:
    if not value:
        return ""

    return "-".join("".join(char.lower() if char.isalnum() else " " for char in value).split())


def pick_unsplash_image_set(
    product_name: str | None = None,
    product_category: str | None = None,
    product_type: str | None = None,
) -> str:
    catalog_text = " ".join(
        part for part in [product_name or "", product_category or "", product_type or ""] if part
    ).lower()

    keyword_map = {
        "dress": "women",
        "skirt": "women",
        "beauty": "beauty",
        "lip": "beauty",
        "makeup": "beauty",
        "perfume": "beauty",
        "kid": "children",
        "child": "children",
        "children": "children",
        "boy": "children",
        "girl": "children",
        "men": "men",
        "shirt": "men",
        "tshirt": "men",
        "tee": "men",
        "trouser": "men",
        "pant": "men",
        "jean": "men",
        "women": "women",
        "kurti": "women",
        "kurta": "women",
        "top": "women",
    }

    for keyword, image_set in keyword_map.items():
        if keyword in catalog_text:
            return image_set

    normalized_category = slugify_text(product_category)
    if normalized_category in UNSPLASH_IMAGE_SETS:
        return normalized_category

    return "default"


def resolve_product_images(
    product_name: str | None = None,
    product_category: str | None = None,
    product_type: str | None = None,
    images=None,
) -> list[str]:
    if isinstance(images, list):
        cleaned_images = [image for image in images if image]
        if cleaned_images:
            return cleaned_images
    elif isinstance(images, str) and images.strip():
        return [images.strip()]

    image_set = pick_unsplash_image_set(product_name, product_category, product_type)
    return UNSPLASH_IMAGE_SETS.get(image_set, UNSPLASH_IMAGE_SETS["default"])


def serialize_value(value):
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return value


def deserialize_value(field: str, value):
    if value is None:
        if field in ARRAY_FIELDS:
            return []
        if field in OBJECT_FIELDS:
            return {}
        return value

    if field in ARRAY_FIELDS or field in OBJECT_FIELDS:
        if isinstance(value, (dict, list)):
            return value
        try:
            return json.loads(value)
        except (TypeError, json.JSONDecodeError):
            return [] if field in ARRAY_FIELDS else {}

    if field in BOOL_FIELDS:
        return bool(value)

    return value


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None

    record = dict(row)
    for key, value in list(record.items()):
        record[key] = deserialize_value(key, value)
    return record


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        g.db = connection
    return g.db


def ensure_column_exists(table_name: str, column_name: str, column_definition: str):
    existing_columns = {
        row["name"]
        for row in get_db().execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name in existing_columns:
        return

    get_db().execute(
        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
    )
    get_db().commit()


def normalize_payment_method(value) -> str | None:
    normalized = str(value or "upi").strip().lower().replace("-", "_").replace(" ", "_")
    aliases = {
        "cash": "cod",
        "cash_on_delivery": "cod",
        "netbanking": "net_banking",
        "credit_card": "card",
        "debit_card": "card",
        "online": "razorpay",
        "razor_pay": "razorpay",
        "razorpay_checkout": "razorpay",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if normalized in VALID_PAYMENT_METHODS else None


@app.teardown_appcontext
def close_db(_error):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def fetch_one(query: str, params=()) -> dict | None:
    return row_to_dict(get_db().execute(query, params).fetchone())


def fetch_all(query: str, params=()) -> list[dict]:
    rows = get_db().execute(query, params).fetchall()
    return [row_to_dict(row) for row in rows]


def execute(query: str, params=()):
    connection = get_db()
    connection.execute(query, params)
    connection.commit()


def insert_record(table: str, data: dict):
    columns = list(data.keys())
    placeholders = ", ".join(["?"] * len(columns))
    serialized = [serialize_value(data[column]) for column in columns]
    get_db().execute(
        f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})",
        serialized,
    )
    get_db().commit()


def update_record(table: str, record_id: str, data: dict, id_field: str = "id"):
    if not data:
        return

    assignments = ", ".join([f"{column} = ?" for column in data.keys()])
    values = [serialize_value(value) for value in data.values()]
    values.append(record_id)
    get_db().execute(
        f"UPDATE {table} SET {assignments} WHERE {id_field} = ?",
        values,
    )
    get_db().commit()


def init_db():
    get_db().executescript(
        """
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            mobile TEXT,
            address TEXT,
            type TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            mobile TEXT,
            address TEXT,
            role TEXT NOT NULL,
            contact_id TEXT,
            auth_provider TEXT NOT NULL DEFAULT 'local',
            picture TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            product_name TEXT NOT NULL,
            product_type TEXT,
            product_category TEXT,
            material TEXT,
            colors TEXT,
            current_stock INTEGER NOT NULL DEFAULT 0,
            sales_price REAL NOT NULL DEFAULT 0,
            sales_tax REAL NOT NULL DEFAULT 0,
            purchase_price REAL NOT NULL DEFAULT 0,
            purchase_tax REAL NOT NULL DEFAULT 0,
            published INTEGER NOT NULL DEFAULT 1,
            rating REAL NOT NULL DEFAULT 0,
            description TEXT,
            brand TEXT,
            images TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payment_terms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            early_payment_discount INTEGER NOT NULL DEFAULT 0,
            discount_percentage REAL NOT NULL DEFAULT 0,
            discount_days INTEGER NOT NULL DEFAULT 0,
            early_pay_discount_computation TEXT,
            example_preview TEXT
        );

        CREATE TABLE IF NOT EXISTS discount_offers (
            id TEXT PRIMARY KEY,
            name TEXT,
            discount_percentage REAL NOT NULL DEFAULT 0,
            available_on TEXT,
            start_date TEXT,
            end_date TEXT,
            extra TEXT
        );

        CREATE TABLE IF NOT EXISTS coupon_codes (
            id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            discount_offer_id TEXT,
            expiration_date TEXT,
            contact TEXT,
            status TEXT NOT NULL DEFAULT 'unused',
            extra TEXT
        );

        CREATE TABLE IF NOT EXISTS sale_orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            payment_term_id TEXT,
            payment_method TEXT NOT NULL DEFAULT 'upi',
            payment_gateway TEXT,
            razorpay_order_id TEXT,
            razorpay_payment_id TEXT,
            razorpay_signature TEXT,
            payment_verified_at TEXT,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            discount_amount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            coupon_code TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            order_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            invoice_id TEXT
        );

        CREATE TABLE IF NOT EXISTS customer_invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT NOT NULL,
            sale_order_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            payment_term_id TEXT,
            payment_method TEXT NOT NULL DEFAULT 'upi',
            items TEXT NOT NULL,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            discount_amount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            invoice_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unpaid',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            order_date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            bill_id TEXT
        );

        CREATE TABLE IF NOT EXISTS vendor_bills (
            id TEXT PRIMARY KEY,
            bill_number TEXT NOT NULL,
            purchase_order_id TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_total REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            invoice_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unpaid',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            invoice_id TEXT,
            bill_id TEXT,
            amount REAL NOT NULL DEFAULT 0,
            payment_date TEXT NOT NULL,
            payment_method TEXT NOT NULL DEFAULT 'cash',
            reference_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            automatic_invoicing INTEGER NOT NULL DEFAULT 0
        );
        """
    )
    ensure_column_exists("sale_orders", "payment_method", "TEXT NOT NULL DEFAULT 'upi'")
    ensure_column_exists("sale_orders", "payment_gateway", "TEXT")
    ensure_column_exists("sale_orders", "razorpay_order_id", "TEXT")
    ensure_column_exists("sale_orders", "razorpay_payment_id", "TEXT")
    ensure_column_exists("sale_orders", "razorpay_signature", "TEXT")
    ensure_column_exists("sale_orders", "payment_verified_at", "TEXT")
    ensure_column_exists("customer_invoices", "payment_method", "TEXT NOT NULL DEFAULT 'upi'")
    ensure_column_exists("payments", "reference_id", "TEXT")
    get_db().commit()


def seed_settings():
    existing = fetch_one("SELECT * FROM settings WHERE id = 1")
    if existing:
        return

    insert_record("settings", {"id": 1, "automatic_invoicing": False})


def seed_payment_terms():
    existing = fetch_one("SELECT id FROM payment_terms LIMIT 1")
    if existing:
        return

    insert_record(
        "payment_terms",
        {
            "id": str(uuid4()),
            "name": "Immediate Payment",
            "early_payment_discount": False,
            "discount_percentage": 0,
            "discount_days": 0,
            "early_pay_discount_computation": None,
            "example_preview": "Payment Terms: Immediate Payment",
        },
    )


def hide_legacy_seed_products():
    connection = get_db()
    for product_name, description in LEGACY_SEED_PRODUCTS:
        connection.execute(
            """
            UPDATE products
            SET published = 0
            WHERE brand = ?
              AND product_name = ?
              AND description = ?
            """,
            ("StudioCo", product_name, description),
        )
    connection.commit()


def seed_default_admin():
    existing_user = fetch_one("SELECT * FROM users WHERE email = ?", ("admin@appareldesk.local",))
    if existing_user:
        return

    existing_contact = fetch_one(
        "SELECT * FROM contacts WHERE email = ?",
        ("admin@appareldesk.local",),
    )
    contact_id = existing_contact["id"] if existing_contact else str(uuid4())
    user_id = str(uuid4())
    contact = existing_contact or {
        "id": contact_id,
        "name": "ApparelDesk Admin",
        "email": "admin@appareldesk.local",
        "mobile": "9999999999",
        "address": {
            "city": "Demo City",
            "state": "Demo State",
            "pincode": "400001",
        },
        "type": "both",
        "created_at": now_iso(),
    }
    user = {
        "id": user_id,
        "name": "ApparelDesk Admin",
        "email": "admin@appareldesk.local",
        "password": generate_password_hash("admin123"),
        "mobile": "9999999999",
        "address": {
            "city": "Demo City",
            "state": "Demo State",
            "pincode": "400001",
        },
        "role": "internal",
        "contact_id": contact_id,
        "auth_provider": "local",
        "picture": None,
        "created_at": now_iso(),
    }

    if not existing_contact:
        insert_record("contacts", contact)
    insert_record("users", user)


def bootstrap():
    init_db()
    seed_settings()
    seed_payment_terms()
    seed_default_admin()
    hide_legacy_seed_products()


def get_user_by_id(user_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))


def get_contact_by_id(contact_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM contacts WHERE id = ?", (contact_id,))


def get_product_by_id(product_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM products WHERE id = ?", (product_id,))


def get_payment_term_by_id(payment_term_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM payment_terms WHERE id = ?", (payment_term_id,))


def get_discount_offer_by_id(discount_offer_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM discount_offers WHERE id = ?", (discount_offer_id,))


def get_sale_order_by_id(order_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM sale_orders WHERE id = ?", (order_id,))


def get_customer_invoice_by_id(invoice_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM customer_invoices WHERE id = ?", (invoice_id,))


def get_vendor_bill_by_id(bill_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM vendor_bills WHERE id = ?", (bill_id,))


def get_purchase_order_by_id(order_id: str | None) -> dict | None:
    return fetch_one("SELECT * FROM purchase_orders WHERE id = ?", (order_id,))


def find_user_by_email(email: str | None) -> dict | None:
    if not email:
        return None
    return fetch_one("SELECT * FROM users WHERE lower(email) = lower(?)", (email,))


def find_contact_by_email(email: str | None) -> dict | None:
    if not email:
        return None
    return fetch_one("SELECT * FROM contacts WHERE lower(email) = lower(?)", (email,))


def build_safe_user(user: dict, contact: dict | None = None) -> dict:
    contact = contact or {}
    return {
        "id": user["id"],
        "name": contact.get("name") or user.get("name"),
        "email": contact.get("email") or user.get("email"),
        "role": user.get("role"),
        "contact_id": user.get("contact_id"),
        "mobile": contact.get("mobile") or user.get("mobile") or "",
        "address": contact.get("address") or user.get("address") or {},
        "picture": user.get("picture"),
        "auth_provider": user.get("auth_provider", "local"),
    }


def create_token(user: dict) -> str:
    payload = {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "contact_id": user.get("contact_id"),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def authenticate_token(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Access token required"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
        except jwt.PyJWTError:
            return jsonify({"error": "Invalid or expired token"}), 403

        user = get_user_by_id(payload.get("id"))
        if not user:
            return jsonify({"error": "User not found"}), 404

        g.current_user = user
        g.current_auth = payload
        return fn(*args, **kwargs)

    return wrapper


def get_optional_user_from_token() -> dict | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        return None

    return get_user_by_id(payload.get("id"))


def require_internal():
    if g.current_user.get("role") != "internal":
        return jsonify({"error": "Access denied"}), 403
    return None


def ensure_google_auth_available():
    if google_requests is None or google_id_token is None:
        return jsonify({"error": "Google auth dependencies are not installed"}), 500
    if not GOOGLE_CLIENT_ID:
        return jsonify({"error": "GOOGLE_CLIENT_ID is not configured on the Flask backend"}), 500
    return None


def sync_contact_for_user(user: dict, payload: dict) -> dict | None:
    contact_id = user.get("contact_id")
    if not contact_id:
        return None

    contact = get_contact_by_id(contact_id)
    if not contact:
        return None

    updates = {
        "name": payload.get("name", contact.get("name")),
        "email": payload.get("email", contact.get("email")),
        "mobile": payload.get("mobile", contact.get("mobile", "")),
        "address": payload.get("address", contact.get("address", {})),
    }
    update_record("contacts", contact_id, updates)
    return get_contact_by_id(contact_id)


def settings_payload() -> dict:
    settings = fetch_one("SELECT * FROM settings WHERE id = 1")
    return {
        "automaticInvoicing": bool(settings.get("automatic_invoicing")) if settings else False
    }


def discount_offer_payload(offer: dict) -> dict:
    if not offer:
        return {}

    extra = offer.get("extra") or {}
    payload = {
        "id": offer["id"],
        "name": offer.get("name"),
        "discount_percentage": coerce_float(offer.get("discount_percentage")),
        "available_on": offer.get("available_on"),
        "start_date": offer.get("start_date"),
        "end_date": offer.get("end_date"),
    }
    payload.update(extra)
    return payload


def coupon_payload(coupon: dict) -> dict:
    if not coupon:
        return {}

    extra = coupon.get("extra") or {}
    payload = {
        "id": coupon["id"],
        "code": coupon["code"],
        "discount_offer_id": coupon.get("discount_offer_id"),
        "expiration_date": coupon.get("expiration_date"),
        "contact": coupon.get("contact"),
        "status": coupon.get("status", "unused"),
    }
    payload.update(extra)
    return payload


def product_payload(product: dict) -> dict:
    if not product:
        return {}

    product_images = resolve_product_images(
        product_name=product.get("product_name"),
        product_category=product.get("product_category"),
        product_type=product.get("product_type"),
        images=product.get("images"),
    )

    return {
        "id": product["id"],
        "product_name": product.get("product_name"),
        "product_type": product.get("product_type"),
        "product_category": product.get("product_category"),
        "material": product.get("material"),
        "colors": product.get("colors") or [],
        "current_stock": coerce_int(product.get("current_stock")),
        "sales_price": coerce_float(product.get("sales_price")),
        "sales_tax": coerce_float(product.get("sales_tax")),
        "purchase_price": coerce_float(product.get("purchase_price")),
        "purchase_tax": coerce_float(product.get("purchase_tax")),
        "published": bool(product.get("published")),
        "rating": coerce_float(product.get("rating")),
        "description": product.get("description"),
        "brand": product.get("brand"),
        "images": product_images,
        "created_at": product.get("created_at"),
    }


def get_payment_total(invoice_id: str | None = None, bill_id: str | None = None) -> float:
    if invoice_id:
        result = fetch_one(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ?",
            (invoice_id,),
        )
        return coerce_float(result.get("total"))

    if bill_id:
        result = fetch_one(
            "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE bill_id = ?",
            (bill_id,),
        )
        return coerce_float(result.get("total"))

    return 0.0


def build_sale_order_payload(
    data: dict,
    resolved_customer_id: str | None,
    payment_method: str,
    *,
    status: str = "draft",
) -> tuple[dict | None, str | None, tuple | None]:
    items = data.get("items") or []
    coupon_code = data.get("coupon_code")
    payment_term_id = data.get("payment_term_id")

    if not items:
        return None, None, (jsonify({"error": "At least one order item is required"}), 400)
    if not resolved_customer_id:
        return None, None, (jsonify({"error": "Customer is required"}), 400)
    if not payment_method:
        return None, None, (jsonify({"error": "Please select a valid payment method"}), 400)

    customer = get_contact_by_id(resolved_customer_id)
    if not customer:
        return None, None, (jsonify({"error": "Customer contact not found"}), 404)

    payment_term = get_payment_term_by_id(payment_term_id) if payment_term_id else None
    if not payment_term:
        payment_term = fetch_one("SELECT * FROM payment_terms LIMIT 1")

    if not payment_term:
        return None, None, (jsonify({"error": "Payment settings are unavailable right now"}), 400)

    subtotal = 0.0
    tax_total = 0.0
    discount_amount = 0.0
    resolved_items = []

    for item in items:
        product = get_product_by_id(item.get("product_id"))
        is_external_item = local_or_external_item(item)

        if not product and not is_external_item:
            return (
                None,
                None,
                (jsonify({"error": f"Product {item.get('product_id')} not found"}), 400),
            )

        quantity = max(coerce_int(item.get("quantity"), 1), 1)
        unit_price = coerce_float(item.get("unit_price"))
        tax_rate = coerce_float(item.get("tax_rate"))

        if product and coerce_int(product.get("current_stock")) < quantity:
            return (
                None,
                None,
                (jsonify({"error": f"{product.get('product_name')} is out of stock"}), 400),
            )

        line_subtotal = quantity * unit_price
        line_tax = line_subtotal * (tax_rate / 100)
        subtotal += line_subtotal
        tax_total += line_tax

        resolved_items.append(
            {
                "product_id": item.get("product_id"),
                "external_id": item.get("external_id"),
                "external_source": item.get("external_source"),
                "product_name": (
                    product.get("product_name") if product else item.get("product_name") or "Catalog Product"
                ),
                "product_category": (
                    product.get("product_category") if product else item.get("product_category")
                ),
                "brand": product.get("brand") if product else item.get("brand"),
                "image_url": (
                    resolve_product_images(
                        product_name=product.get("product_name"),
                        product_category=product.get("product_category"),
                        product_type=product.get("product_type"),
                        images=product.get("images"),
                    )[0]
                    if product
                    else item.get("image_url")
                ),
                "quantity": quantity,
                "unit_price": unit_price,
                "tax_rate": tax_rate,
            }
        )

    coupon_to_mark = None
    if coupon_code:
        coupon = fetch_one(
            "SELECT * FROM coupon_codes WHERE code = ? AND status = 'unused'",
            (coupon_code,),
        )
        if not coupon:
            return None, None, (jsonify({"error": "Invalid or expired promo code"}), 400)

        if coupon.get("expiration_date") and parse_iso_date(coupon["expiration_date"]) < datetime.now(
            timezone.utc
        ):
            return None, None, (jsonify({"error": "Coupon code has expired"}), 400)

        if coupon.get("contact") and coupon["contact"] != resolved_customer_id:
            return None, None, (jsonify({"error": "This coupon is not valid for your account"}), 400)

        discount_offer = get_discount_offer_by_id(coupon.get("discount_offer_id"))
        if not discount_offer or discount_offer.get("available_on") != "website":
            return None, None, (jsonify({"error": "Promo code is not available on website orders"}), 400)

        now = datetime.now(timezone.utc)
        if discount_offer.get("start_date") and parse_iso_date(discount_offer["start_date"]) > now:
            return None, None, (jsonify({"error": "Discount offer has not started yet"}), 400)
        if discount_offer.get("end_date") and parse_iso_date(discount_offer["end_date"]) < now:
            return None, None, (jsonify({"error": "Discount offer has expired"}), 400)

        discount_amount = subtotal * (
            coerce_float(discount_offer.get("discount_percentage")) / 100
        )
        coupon_to_mark = coupon["code"]

    total = subtotal + tax_total - discount_amount
    order_id = str(uuid4())
    sale_order = {
        "id": order_id,
        "order_number": f"SO-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "customer_id": resolved_customer_id,
        "payment_term_id": payment_term["id"],
        "payment_method": payment_method,
        "payment_gateway": "razorpay" if payment_method == "razorpay" else None,
        "razorpay_order_id": None,
        "razorpay_payment_id": None,
        "razorpay_signature": None,
        "payment_verified_at": None,
        "items": resolved_items,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "discount_amount": discount_amount,
        "total": total,
        "coupon_code": coupon_code,
        "status": status,
        "order_date": now_iso(),
        "created_at": now_iso(),
        "invoice_id": None,
    }
    return sale_order, coupon_to_mark, None


def mark_coupon_code_used(coupon_code: str | None, customer_id: str | None):
    if not coupon_code or not customer_id:
        return

    coupon = fetch_one(
        "SELECT * FROM coupon_codes WHERE code = ? AND status = 'unused'",
        (coupon_code,),
    )
    if coupon:
        update_record(
            "coupon_codes",
            coupon["id"],
            {"status": "used", "contact": customer_id},
        )


def apply_inventory_to_order_items(items: list[dict]):
    for item in items:
        product = get_product_by_id(item.get("product_id"))
        if not product:
            continue

        next_stock = max(
            coerce_int(product.get("current_stock")) - coerce_int(item.get("quantity"), 1),
            0,
        )
        update_record("products", product["id"], {"current_stock": next_stock})


def sync_customer_invoice_status(invoice_id: str | None):
    invoice = get_customer_invoice_by_id(invoice_id)
    if not invoice:
        return

    paid_amount = get_payment_total(invoice_id=invoice["id"])
    status = "paid" if paid_amount >= coerce_float(invoice.get("total")) else "partial"
    update_record("customer_invoices", invoice["id"], {"status": status})


def record_customer_invoice_payment(
    invoice_id: str | None,
    amount: float,
    payment_method: str,
    *,
    reference_id: str | None = None,
):
    if not invoice_id:
        return None

    if reference_id:
        existing_payment = fetch_one(
            "SELECT * FROM payments WHERE reference_id = ?",
            (reference_id,),
        )
        if existing_payment:
            sync_customer_invoice_status(invoice_id)
            return existing_payment

    payment = {
        "id": str(uuid4()),
        "invoice_id": invoice_id,
        "bill_id": None,
        "amount": coerce_float(amount),
        "payment_date": now_iso(),
        "payment_method": payment_method,
        "reference_id": reference_id,
        "created_at": now_iso(),
    }
    insert_record("payments", payment)
    sync_customer_invoice_status(invoice_id)
    return payment


def maybe_create_invoice_for_order(order: dict):
    settings = fetch_one("SELECT * FROM settings WHERE id = 1")
    if not settings or not settings.get("automatic_invoicing"):
        return None

    if order.get("invoice_id"):
        return get_customer_invoice_by_id(order["invoice_id"])

    existing_invoice = fetch_one(
        "SELECT * FROM customer_invoices WHERE sale_order_id = ?",
        (order["id"],),
    )
    if existing_invoice:
        update_record("sale_orders", order["id"], {"invoice_id": existing_invoice["id"]})
        return existing_invoice

    invoice_id = str(uuid4())
    payment_term = get_payment_term_by_id(order.get("payment_term_id"))
    due_date = datetime.now(timezone.utc)
    if payment_term and payment_term.get("name") != "Immediate Payment":
        due_date = datetime.now(timezone.utc) + timedelta(days=15)

    invoice_status = "paid" if order.get("status") == "paid" else "unpaid"
    if invoice_status == "paid":
        due_date = datetime.now(timezone.utc)

    invoice = {
        "id": invoice_id,
        "invoice_number": f"INV-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "sale_order_id": order["id"],
        "customer_id": order["customer_id"],
        "payment_term_id": order["payment_term_id"],
        "payment_method": order.get("payment_method") or "upi",
        "items": order["items"],
        "subtotal": order["subtotal"],
        "tax_total": order["tax_total"],
        "discount_amount": order["discount_amount"],
        "total": order["total"],
        "invoice_date": now_iso(),
        "due_date": due_date.isoformat(),
        "status": invoice_status,
        "created_at": now_iso(),
    }
    insert_record("customer_invoices", invoice)
    update_record("sale_orders", order["id"], {"invoice_id": invoice_id})
    return invoice


def finalize_sale_order(
    order_id: str,
    *,
    capture_payment: bool = False,
    payment_reference_id: str | None = None,
):
    order = get_sale_order_by_id(order_id)
    if not order:
        return None

    apply_inventory_to_order_items(order.get("items") or [])
    maybe_create_invoice_for_order(order)
    finalized_order = get_sale_order_by_id(order_id)

    if capture_payment and finalized_order and finalized_order.get("invoice_id"):
        record_customer_invoice_payment(
            finalized_order["invoice_id"],
            coerce_float(finalized_order.get("total")),
            finalized_order.get("payment_method") or "razorpay",
            reference_id=payment_reference_id,
        )

    return get_sale_order_by_id(order_id)


def local_or_external_item(item: dict) -> bool:
    return bool(item.get("external_source") and item.get("external_id"))


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/")
def index():
    return jsonify(
        {
            "message": "ApparelDesk Flask backend is running",
            "api_base": "/api",
            "health": "/api/health",
        }
    )


@app.get("/api")
def api_index():
    return jsonify(
        {
            "message": "ApparelDesk API is running",
            "health": "/api/health",
            "auth": {
                "login": "/api/auth/login",
                "register": "/api/auth/register",
                "google": "/api/auth/google",
            },
        }
    )


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    mobile = (data.get("mobile") or "").strip()
    address = data.get("address") or {}

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if find_user_by_email(email):
        return jsonify({"error": "User already exists"}), 400

    contact_id = str(uuid4())
    user_id = str(uuid4())
    created_at = now_iso()

    contact = {
        "id": contact_id,
        "name": name,
        "email": email,
        "mobile": mobile,
        "address": address,
        "type": "customer",
        "created_at": created_at,
    }
    user = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "mobile": mobile,
        "address": address,
        "role": "portal",
        "contact_id": contact_id,
        "auth_provider": "local",
        "picture": None,
        "created_at": created_at,
    }

    insert_record("contacts", contact)
    insert_record("users", user)

    return (
        jsonify(
            {
                "message": "User registered successfully",
                "token": create_token(user),
                "user": build_safe_user(user, contact),
            }
        ),
        201,
    )


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = find_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    stored_password = user.get("password")
    if not stored_password:
        return jsonify({"error": "This account uses Google sign-in"}), 400

    if not check_password_hash(stored_password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    contact = get_contact_by_id(user.get("contact_id"))
    return jsonify({"token": create_token(user), "user": build_safe_user(user, contact)})


@app.post("/api/auth/google")
def google_auth():
    availability_error = ensure_google_auth_available()
    if availability_error:
        return availability_error

    data = request.get_json(silent=True) or {}
    credential = data.get("credential")
    if not credential:
        return jsonify({"error": "Google credential is required"}), 400

    try:
        token_info = google_id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception as error:  # pragma: no cover - depends on external provider
        return jsonify({"error": f"Google token verification failed: {error}"}), 401

    email = (token_info.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Google account did not provide an email address"}), 400

    name = (token_info.get("name") or email.split("@")[0]).strip()
    picture = token_info.get("picture")

    user = find_user_by_email(email)
    contact = find_contact_by_email(email)
    created_at = now_iso()

    if not contact:
        contact = {
            "id": str(uuid4()),
            "name": name,
            "email": email,
            "mobile": "",
            "address": {},
            "type": "customer",
            "created_at": created_at,
        }
        insert_record("contacts", contact)

    if not user:
        user = {
            "id": str(uuid4()),
            "name": name,
            "email": email,
            "password": None,
            "mobile": "",
            "address": {},
            "role": "portal",
            "contact_id": contact["id"],
            "auth_provider": "google",
            "picture": picture,
            "created_at": created_at,
        }
        insert_record("users", user)
    else:
        updates = {
            "name": name,
            "contact_id": user.get("contact_id") or contact["id"],
            "auth_provider": user.get("auth_provider") or "google",
            "picture": picture,
        }
        update_record("users", user["id"], updates)
        user = get_user_by_id(user["id"])

    update_record(
        "contacts",
        contact["id"],
        {
            "name": name,
            "email": email,
        },
    )
    contact = get_contact_by_id(contact["id"])

    return jsonify(
        {
            "message": "Authenticated with Google successfully",
            "token": create_token(user),
            "user": build_safe_user(user, contact),
        }
    )


@app.get("/api/auth/profile")
@authenticate_token
def get_profile():
    contact = get_contact_by_id(g.current_user.get("contact_id"))
    return jsonify({"user": build_safe_user(g.current_user, contact)})


@app.put("/api/auth/profile")
@authenticate_token
def update_profile():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or g.current_user.get("name") or "").strip()
    email = (data.get("email") or g.current_user.get("email") or "").strip().lower()
    mobile = (data.get("mobile") or g.current_user.get("mobile") or "").strip()
    address = data.get("address") or g.current_user.get("address") or {}
    password = data.get("password") or ""

    duplicate_user = find_user_by_email(email)
    if duplicate_user and duplicate_user["id"] != g.current_user["id"]:
        return jsonify({"error": "Email is already in use"}), 400

    user_updates = {
        "name": name,
        "email": email,
        "mobile": mobile,
        "address": address,
    }
    if password:
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        user_updates["password"] = generate_password_hash(password)

    update_record("users", g.current_user["id"], user_updates)
    updated_user = get_user_by_id(g.current_user["id"])
    updated_contact = sync_contact_for_user(
        updated_user,
        {
            "name": name,
            "email": email,
            "mobile": mobile,
            "address": address,
        },
    )

    return jsonify(
        {
            "message": "Profile updated successfully",
            "token": create_token(updated_user),
            "user": build_safe_user(updated_user, updated_contact),
        }
    )


@app.get("/api/users")
@authenticate_token
def get_users():
    access_error = require_internal()
    if access_error:
        return access_error

    users = fetch_all("SELECT * FROM users ORDER BY created_at DESC")
    result = []
    for user in users:
        result.append(build_safe_user(user, get_contact_by_id(user.get("contact_id"))))
    return jsonify(result)


@app.post("/api/users")
@authenticate_token
def create_user():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    mobile = (data.get("mobile") or "").strip()
    address = data.get("address") or {}
    role = data.get("role") or "portal"

    if find_user_by_email(email):
        return jsonify({"error": "User already exists"}), 400

    contact_id = str(uuid4())
    created_at = now_iso()
    contact = {
        "id": contact_id,
        "name": name,
        "email": email,
        "mobile": mobile,
        "address": address,
        "type": "both" if role == "internal" else "customer",
        "created_at": created_at,
    }
    user = {
        "id": str(uuid4()),
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "mobile": mobile,
        "address": address,
        "role": role,
        "contact_id": contact_id,
        "auth_provider": "local",
        "picture": None,
        "created_at": created_at,
    }

    insert_record("contacts", contact)
    insert_record("users", user)
    return jsonify(build_safe_user(user, contact)), 201


@app.get("/api/contacts")
@authenticate_token
def get_contacts():
    contacts = fetch_all("SELECT * FROM contacts ORDER BY created_at DESC")
    return jsonify(contacts)


@app.post("/api/contacts")
@authenticate_token
def create_contact():
    data = request.get_json(silent=True) or {}
    contact = {
        "id": str(uuid4()),
        "name": data.get("name"),
        "email": data.get("email"),
        "mobile": data.get("mobile"),
        "address": data.get("address") or {},
        "type": data.get("type") or "customer",
        "created_at": now_iso(),
    }
    insert_record("contacts", contact)
    return jsonify(contact), 201


@app.put("/api/contacts/<contact_id>")
@authenticate_token
def update_contact(contact_id):
    existing = get_contact_by_id(contact_id)
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    data = request.get_json(silent=True) or {}
    updates = {
        "name": data.get("name", existing.get("name")),
        "email": data.get("email", existing.get("email")),
        "mobile": data.get("mobile", existing.get("mobile")),
        "address": data.get("address", existing.get("address") or {}),
        "type": data.get("type", existing.get("type")),
    }
    update_record("contacts", contact_id, updates)
    return jsonify(get_contact_by_id(contact_id))


@app.get("/api/products")
def get_products():
    optional_user = get_optional_user_from_token()
    if optional_user and optional_user.get("role") == "internal":
        products = fetch_all("SELECT * FROM products ORDER BY created_at DESC")
    else:
        products = fetch_all(
            "SELECT * FROM products WHERE published = 1 ORDER BY created_at DESC"
        )
    return jsonify([product_payload(product) for product in products])


@app.post("/api/products")
@authenticate_token
def create_product():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    product = {
        "id": str(uuid4()),
        "product_name": data.get("product_name"),
        "product_type": data.get("product_type"),
        "product_category": data.get("product_category"),
        "material": data.get("material"),
        "colors": data.get("colors") or [],
        "current_stock": coerce_int(data.get("current_stock")),
        "sales_price": coerce_float(data.get("sales_price")),
        "sales_tax": coerce_float(data.get("sales_tax")),
        "purchase_price": coerce_float(data.get("purchase_price")),
        "purchase_tax": coerce_float(data.get("purchase_tax")),
        "published": bool(data.get("published")),
        "rating": coerce_float(data.get("rating"), 0),
        "description": data.get("description"),
        "brand": data.get("brand") or "ShopFront",
        "images": resolve_product_images(
            product_name=data.get("product_name"),
            product_category=data.get("product_category"),
            product_type=data.get("product_type"),
            images=data.get("images"),
        ),
        "created_at": now_iso(),
    }
    insert_record("products", product)
    return jsonify(product_payload(product)), 201


@app.put("/api/products/<product_id>")
@authenticate_token
def update_product(product_id):
    access_error = require_internal()
    if access_error:
        return access_error

    existing = get_product_by_id(product_id)
    if not existing:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json(silent=True) or {}
    updates = {
        "product_name": data.get("product_name", existing.get("product_name")),
        "product_type": data.get("product_type", existing.get("product_type")),
        "product_category": data.get("product_category", existing.get("product_category")),
        "material": data.get("material", existing.get("material")),
        "colors": data.get("colors", existing.get("colors") or []),
        "current_stock": coerce_int(data.get("current_stock", existing.get("current_stock"))),
        "sales_price": coerce_float(data.get("sales_price", existing.get("sales_price"))),
        "sales_tax": coerce_float(data.get("sales_tax", existing.get("sales_tax"))),
        "purchase_price": coerce_float(
            data.get("purchase_price", existing.get("purchase_price"))
        ),
        "purchase_tax": coerce_float(data.get("purchase_tax", existing.get("purchase_tax"))),
        "published": bool(data.get("published", existing.get("published"))),
        "rating": coerce_float(data.get("rating", existing.get("rating"))),
        "description": data.get("description", existing.get("description")),
        "brand": data.get("brand", existing.get("brand")) or "ShopFront",
        "images": resolve_product_images(
            product_name=data.get("product_name", existing.get("product_name")),
            product_category=data.get("product_category", existing.get("product_category")),
            product_type=data.get("product_type", existing.get("product_type")),
            images=data.get("images", existing.get("images") or []),
        ),
    }
    update_record("products", product_id, updates)
    return jsonify(product_payload(get_product_by_id(product_id)))


@app.get("/api/payment-terms")
@authenticate_token
def get_payment_terms():
    return jsonify(fetch_all("SELECT * FROM payment_terms"))


@app.post("/api/payment-terms")
@authenticate_token
def create_payment_term():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    payment_term = {
        "id": str(uuid4()),
        "name": data.get("name"),
        "early_payment_discount": bool(data.get("early_payment_discount")),
        "discount_percentage": coerce_float(data.get("discount_percentage")),
        "discount_days": coerce_int(data.get("discount_days")),
        "early_pay_discount_computation": data.get("early_pay_discount_computation"),
        "example_preview": data.get("example_preview"),
    }
    insert_record("payment_terms", payment_term)
    return jsonify(payment_term), 201


@app.get("/api/discount-offers")
@authenticate_token
def get_discount_offers():
    offers = fetch_all("SELECT * FROM discount_offers ORDER BY rowid DESC")
    return jsonify([discount_offer_payload(offer) for offer in offers])


@app.post("/api/discount-offers")
@authenticate_token
def create_discount_offer():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    known_keys = {"name", "discount_percentage", "available_on", "start_date", "end_date"}
    offer = {
        "id": str(uuid4()),
        "name": data.get("name"),
        "discount_percentage": coerce_float(data.get("discount_percentage")),
        "available_on": data.get("available_on"),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "extra": {key: value for key, value in data.items() if key not in known_keys},
    }
    insert_record("discount_offers", offer)
    return jsonify(discount_offer_payload(offer)), 201


@app.get("/api/coupon-codes")
@authenticate_token
def get_coupon_codes():
    coupons = fetch_all("SELECT * FROM coupon_codes ORDER BY rowid DESC")
    return jsonify([coupon_payload(coupon) for coupon in coupons])


@app.post("/api/coupon-codes")
@authenticate_token
def create_coupon_code():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    known_keys = {"code", "discount_offer_id", "expiration_date", "contact", "status"}
    coupon = {
        "id": str(uuid4()),
        "code": data.get("code"),
        "discount_offer_id": data.get("discount_offer_id"),
        "expiration_date": data.get("expiration_date"),
        "contact": data.get("contact"),
        "status": data.get("status") or "unused",
        "extra": {key: value for key, value in data.items() if key not in known_keys},
    }
    insert_record("coupon_codes", coupon)
    return jsonify(coupon_payload(coupon)), 201


@app.post("/api/coupon-codes/validate")
@authenticate_token
def validate_coupon_code():
    data = request.get_json(silent=True) or {}
    code = data.get("code")
    contact_id = data.get("contact_id")
    coupon = fetch_one(
        "SELECT * FROM coupon_codes WHERE code = ? AND status = 'unused'",
        (code,),
    )

    if not coupon:
        return jsonify({"error": "Invalid or used coupon code"}), 400

    if coupon.get("expiration_date") and parse_iso_date(coupon["expiration_date"]) < datetime.now(
        timezone.utc
    ):
        return jsonify({"error": "Coupon code has expired"}), 400

    if coupon.get("contact") and coupon["contact"] != contact_id:
        return jsonify({"error": "This coupon is not valid for your account"}), 400

    discount_offer = get_discount_offer_by_id(coupon.get("discount_offer_id"))
    if discount_offer:
        now = datetime.now(timezone.utc)
        if discount_offer.get("start_date") and parse_iso_date(discount_offer["start_date"]) > now:
            return jsonify({"error": "Discount offer has not started yet"}), 400
        if discount_offer.get("end_date") and parse_iso_date(discount_offer["end_date"]) < now:
            return jsonify({"error": "Discount offer has expired"}), 400

    return jsonify(
        {
            "valid": True,
            "coupon": coupon_payload(coupon),
            "discountOffer": discount_offer_payload(discount_offer),
        }
    )


@app.get("/api/sale-orders")
@authenticate_token
def get_sale_orders():
    if g.current_user.get("role") == "portal":
        orders = fetch_all(
            "SELECT * FROM sale_orders WHERE customer_id = ? ORDER BY created_at DESC",
            (g.current_user.get("contact_id"),),
        )
    else:
        orders = fetch_all("SELECT * FROM sale_orders ORDER BY created_at DESC")
    return jsonify(orders)


@app.post("/api/sale-orders")
@authenticate_token
def create_sale_order():
    data = request.get_json(silent=True) or {}
    payment_method = normalize_payment_method(data.get("payment_method"))
    resolved_customer_id = (
        data.get("customer_id")
        if g.current_user.get("role") == "internal"
        else g.current_user.get("contact_id")
    )

    if payment_method == "razorpay":
        return jsonify({"error": "Use Razorpay checkout for online payments"}), 400

    sale_order, coupon_to_mark, error_response = build_sale_order_payload(
        data,
        resolved_customer_id,
        payment_method,
        status="draft",
    )
    if error_response:
        return error_response

    insert_record("sale_orders", sale_order)
    mark_coupon_code_used(coupon_to_mark, resolved_customer_id)
    finalized_order = finalize_sale_order(sale_order["id"])
    return jsonify(finalized_order or get_sale_order_by_id(sale_order["id"])), 201


@app.get("/api/customer-invoices")
@authenticate_token
def get_customer_invoices():
    if g.current_user.get("role") == "portal":
        invoices = fetch_all(
            "SELECT * FROM customer_invoices WHERE customer_id = ? ORDER BY created_at DESC",
            (g.current_user.get("contact_id"),),
        )
    else:
        invoices = fetch_all("SELECT * FROM customer_invoices ORDER BY created_at DESC")
    return jsonify(invoices)


@app.post("/api/customer-invoices")
@authenticate_token
def create_customer_invoice():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    sale_order = get_sale_order_by_id(data.get("sale_order_id"))
    if not sale_order:
        return jsonify({"error": "Sale order not found"}), 404

    if sale_order.get("invoice_id"):
        existing_invoice = get_customer_invoice_by_id(sale_order["invoice_id"])
        if existing_invoice:
            return jsonify(existing_invoice)

    payment_term = get_payment_term_by_id(sale_order.get("payment_term_id"))
    due_date = datetime.now(timezone.utc)
    if payment_term and payment_term.get("name") != "Immediate Payment":
        due_date = datetime.now(timezone.utc) + timedelta(days=15)

    invoice_status = "paid" if sale_order.get("status") == "paid" else "unpaid"
    if invoice_status == "paid":
        due_date = datetime.now(timezone.utc)

    invoice_id = str(uuid4())
    invoice = {
        "id": invoice_id,
        "invoice_number": f"INV-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "sale_order_id": sale_order["id"],
        "customer_id": sale_order["customer_id"],
        "payment_term_id": sale_order["payment_term_id"],
        "payment_method": sale_order.get("payment_method") or "upi",
        "items": sale_order["items"],
        "subtotal": sale_order["subtotal"],
        "tax_total": sale_order["tax_total"],
        "discount_amount": sale_order["discount_amount"],
        "total": sale_order["total"],
        "invoice_date": now_iso(),
        "due_date": due_date.isoformat(),
        "status": invoice_status,
        "created_at": now_iso(),
    }
    insert_record("customer_invoices", invoice)
    update_record("sale_orders", sale_order["id"], {"invoice_id": invoice_id})
    return jsonify(invoice), 201


@app.get("/api/purchase-orders")
@authenticate_token
def get_purchase_orders():
    access_error = require_internal()
    if access_error:
        return access_error
    return jsonify(fetch_all("SELECT * FROM purchase_orders ORDER BY created_at DESC"))


@app.post("/api/purchase-orders")
@authenticate_token
def create_purchase_order():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    items = data.get("items") or []
    subtotal = 0.0
    tax_total = 0.0

    for item in items:
        line_subtotal = coerce_int(item.get("quantity"), 1) * coerce_float(item.get("unit_price"))
        line_tax = line_subtotal * (coerce_float(item.get("tax_rate")) / 100)
        subtotal += line_subtotal
        tax_total += line_tax

    purchase_order = {
        "id": str(uuid4()),
        "order_number": f"PO-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "vendor_id": data.get("vendor_id"),
        "items": items,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "total": subtotal + tax_total,
        "status": "draft",
        "order_date": now_iso(),
        "created_at": now_iso(),
        "bill_id": None,
    }
    insert_record("purchase_orders", purchase_order)
    return jsonify(purchase_order), 201


@app.get("/api/vendor-bills")
@authenticate_token
def get_vendor_bills():
    access_error = require_internal()
    if access_error:
        return access_error
    return jsonify(fetch_all("SELECT * FROM vendor_bills ORDER BY created_at DESC"))


@app.post("/api/vendor-bills")
@authenticate_token
def create_vendor_bill():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    purchase_order = get_purchase_order_by_id(data.get("purchase_order_id"))
    if not purchase_order:
        return jsonify({"error": "Purchase order not found"}), 404

    bill_id = str(uuid4())
    vendor_bill = {
        "id": bill_id,
        "bill_number": f"VB-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "purchase_order_id": purchase_order["id"],
        "vendor_id": purchase_order["vendor_id"],
        "items": purchase_order["items"],
        "subtotal": purchase_order["subtotal"],
        "tax_total": purchase_order["tax_total"],
        "total": purchase_order["total"],
        "invoice_date": data.get("invoice_date") or now_iso(),
        "due_date": data.get("due_date") or now_iso(),
        "status": "unpaid",
        "created_at": now_iso(),
    }
    insert_record("vendor_bills", vendor_bill)
    update_record("purchase_orders", purchase_order["id"], {"bill_id": bill_id})

    for item in purchase_order["items"]:
        product = get_product_by_id(item.get("product_id"))
        if product:
            update_record(
                "products",
                product["id"],
                {"current_stock": coerce_int(product.get("current_stock")) + coerce_int(item.get("quantity"), 1)},
            )

    return jsonify(vendor_bill), 201


@app.post("/api/payments/razorpay/order")
@authenticate_token
def create_razorpay_checkout_order():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return (
            jsonify(
                {
                    "error": (
                        "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and "
                        "RAZORPAY_KEY_SECRET on the backend."
                    )
                }
            ),
            500,
        )

    data = request.get_json(silent=True) or {}
    resolved_customer_id = (
        data.get("customer_id")
        if g.current_user.get("role") == "internal"
        else g.current_user.get("contact_id")
    )

    sale_order, _coupon_to_mark, error_response = build_sale_order_payload(
        data,
        resolved_customer_id,
        "razorpay",
        status="pending_payment",
    )
    if error_response:
        return error_response

    amount_in_paise = int(round(coerce_float(sale_order.get("total")) * 100))
    if amount_in_paise <= 0:
        return jsonify({"error": "Razorpay checkout requires an order total above Rs 0"}), 400

    customer = get_contact_by_id(resolved_customer_id) or {}
    razorpay_payload = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": sale_order["order_number"][:40],
        "notes": {
            "local_order_id": sale_order["id"],
            "customer_id": resolved_customer_id,
        },
    }

    try:
        response = http_requests.post(
            "https://api.razorpay.com/v1/orders",
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            json=razorpay_payload,
            timeout=20,
        )
        response.raise_for_status()
    except http_requests.RequestException as exc:
        details = None
        if exc.response is not None:
            try:
                details = exc.response.json()
            except ValueError:
                details = exc.response.text or None

        return (
            jsonify(
                {
                    "error": "Could not start Razorpay checkout right now",
                    "details": details,
                }
            ),
            502,
        )

    razorpay_order = response.json()
    sale_order["razorpay_order_id"] = razorpay_order.get("id")
    insert_record("sale_orders", sale_order)

    return (
        jsonify(
            {
                "local_order_id": sale_order["id"],
                "order_number": sale_order["order_number"],
                "key_id": RAZORPAY_KEY_ID,
                "company_name": RAZORPAY_COMPANY_NAME,
                "description": f"Order {sale_order['order_number']}",
                "razorpay_order_id": razorpay_order.get("id"),
                "amount": razorpay_order.get("amount", amount_in_paise),
                "currency": razorpay_order.get("currency", "INR"),
                "prefill": {
                    "name": customer.get("name") or g.current_user.get("name"),
                    "email": customer.get("email") or g.current_user.get("email"),
                    "contact": customer.get("mobile") or g.current_user.get("mobile") or "",
                },
                "notes": {
                    "local_order_id": sale_order["id"],
                    "order_number": sale_order["order_number"],
                },
            }
        ),
        201,
    )


@app.post("/api/payments/razorpay/verify")
@authenticate_token
def verify_razorpay_payment():
    if not RAZORPAY_KEY_SECRET:
        return jsonify({"error": "Razorpay verification is not configured on the backend"}), 500

    data = request.get_json(silent=True) or {}
    local_order = get_sale_order_by_id(data.get("local_order_id"))
    if not local_order:
        return jsonify({"error": "Local order not found"}), 404

    if (
        g.current_user.get("role") == "portal"
        and local_order.get("customer_id") != g.current_user.get("contact_id")
    ):
        return jsonify({"error": "You do not have access to this order"}), 403

    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return jsonify({"error": "Incomplete Razorpay verification payload"}), 400

    if local_order.get("payment_method") != "razorpay":
        return jsonify({"error": "This order is not a Razorpay order"}), 400

    if local_order.get("razorpay_order_id") != razorpay_order_id:
        return jsonify({"error": "Razorpay order mismatch"}), 400

    if (
        local_order.get("payment_verified_at")
        and local_order.get("razorpay_payment_id") == razorpay_payment_id
    ):
        return jsonify(local_order)

    payload = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        return jsonify({"error": "Razorpay payment verification failed"}), 400

    update_record(
        "sale_orders",
        local_order["id"],
        {
            "status": "paid",
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
            "payment_verified_at": now_iso(),
            "payment_gateway": "razorpay",
        },
    )

    updated_order = get_sale_order_by_id(local_order["id"])
    mark_coupon_code_used(updated_order.get("coupon_code"), updated_order.get("customer_id"))
    finalized_order = finalize_sale_order(
        updated_order["id"],
        capture_payment=True,
        payment_reference_id=razorpay_payment_id,
    )
    return jsonify(finalized_order or get_sale_order_by_id(updated_order["id"]))


@app.post("/api/payments/razorpay/cancel")
@authenticate_token
def cancel_razorpay_order():
    data = request.get_json(silent=True) or {}
    local_order = get_sale_order_by_id(data.get("local_order_id"))
    if not local_order:
        return jsonify({"error": "Local order not found"}), 404

    if (
        g.current_user.get("role") == "portal"
        and local_order.get("customer_id") != g.current_user.get("contact_id")
    ):
        return jsonify({"error": "You do not have access to this order"}), 403

    if local_order.get("payment_method") != "razorpay":
        return jsonify({"error": "This order is not a Razorpay order"}), 400

    if local_order.get("payment_verified_at"):
        return jsonify(local_order)

    update_record("sale_orders", local_order["id"], {"status": "cancelled"})
    return jsonify(get_sale_order_by_id(local_order["id"]))


@app.get("/api/payments")
@authenticate_token
def get_payments():
    access_error = require_internal()
    if access_error:
        return access_error
    return jsonify(fetch_all("SELECT * FROM payments ORDER BY created_at DESC"))


@app.post("/api/payments")
@authenticate_token
def create_payment():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    payment = {
        "id": str(uuid4()),
        "invoice_id": data.get("invoice_id"),
        "bill_id": data.get("bill_id"),
        "amount": coerce_float(data.get("amount")),
        "payment_date": data.get("payment_date") or now_iso(),
        "payment_method": data.get("payment_method") or "cash",
        "reference_id": data.get("reference_id"),
        "created_at": now_iso(),
    }
    insert_record("payments", payment)

    if payment.get("invoice_id"):
        sync_customer_invoice_status(payment["invoice_id"])

    if payment.get("bill_id"):
        bill = get_vendor_bill_by_id(payment["bill_id"])
        if bill:
            paid_amount = get_payment_total(bill_id=bill["id"])
            status = "paid" if paid_amount >= coerce_float(bill.get("total")) else "partial"
            update_record("vendor_bills", bill["id"], {"status": status})

    return jsonify(payment), 201


@app.get("/api/reports/sales-by-products")
@authenticate_token
def report_sales_by_products():
    access_error = require_internal()
    if access_error:
        return access_error

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    report = {}
    orders = fetch_all("SELECT * FROM sale_orders")

    for order in orders:
        if not is_in_range(order.get("order_date"), start_date, end_date):
            continue

        for item in order.get("items") or []:
            product = get_product_by_id(item.get("product_id"))
            if not product:
                continue

            if item["product_id"] not in report:
                report[item["product_id"]] = {
                    "product_name": product.get("product_name"),
                    "sold_quantity": 0,
                    "total_received_amount": 0,
                }

            report[item["product_id"]]["sold_quantity"] += coerce_int(item.get("quantity"), 1)
            line_total = (
                coerce_int(item.get("quantity"), 1)
                * coerce_float(item.get("unit_price"))
                * (1 + coerce_float(item.get("tax_rate")) / 100)
            )
            report[item["product_id"]]["total_received_amount"] += line_total

    return jsonify(list(report.values()))


@app.get("/api/reports/purchase-by-products")
@authenticate_token
def report_purchase_by_products():
    access_error = require_internal()
    if access_error:
        return access_error

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    report = {}
    bills = fetch_all("SELECT * FROM vendor_bills")

    for bill in bills:
        if not is_in_range(bill.get("invoice_date"), start_date, end_date):
            continue

        for item in bill.get("items") or []:
            product = get_product_by_id(item.get("product_id"))
            if not product:
                continue

            if item["product_id"] not in report:
                report[item["product_id"]] = {
                    "product_name": product.get("product_name"),
                    "purchased_quantity": 0,
                    "total_paid_amount": 0,
                }

            report[item["product_id"]]["purchased_quantity"] += coerce_int(item.get("quantity"), 1)
            line_total = (
                coerce_int(item.get("quantity"), 1)
                * coerce_float(item.get("unit_price"))
                * (1 + coerce_float(item.get("tax_rate")) / 100)
            )
            report[item["product_id"]]["total_paid_amount"] += line_total

    return jsonify(list(report.values()))


@app.get("/api/reports/sales-by-customers")
@authenticate_token
def report_sales_by_customers():
    access_error = require_internal()
    if access_error:
        return access_error

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    report = {}
    orders = fetch_all("SELECT * FROM sale_orders")

    for order in orders:
        if not is_in_range(order.get("order_date"), start_date, end_date):
            continue

        customer_id = order.get("customer_id")
        if customer_id not in report:
            contact = get_contact_by_id(customer_id)
            report[customer_id] = {
                "customer_name": contact.get("name") if contact else "Unknown",
                "total_orders": 0,
                "paid_amount": 0,
                "unpaid_amount": 0,
            }

        report[customer_id]["total_orders"] += 1
        invoice = fetch_one(
            "SELECT * FROM customer_invoices WHERE sale_order_id = ?",
            (order["id"],),
        )
        if invoice:
            paid_amount = get_payment_total(invoice_id=invoice["id"])
            report[customer_id]["paid_amount"] += paid_amount
            report[customer_id]["unpaid_amount"] += coerce_float(invoice.get("total")) - paid_amount
        else:
            report[customer_id]["unpaid_amount"] += coerce_float(order.get("total"))

    return jsonify(list(report.values()))


@app.get("/api/reports/purchase-by-vendors")
@authenticate_token
def report_purchase_by_vendors():
    access_error = require_internal()
    if access_error:
        return access_error

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    report = {}
    bills = fetch_all("SELECT * FROM vendor_bills")

    for bill in bills:
        if not is_in_range(bill.get("invoice_date"), start_date, end_date):
            continue

        vendor_id = bill.get("vendor_id")
        if vendor_id not in report:
            contact = get_contact_by_id(vendor_id)
            report[vendor_id] = {
                "vendor_name": contact.get("name") if contact else "Unknown",
                "total_orders": 0,
                "paid_amount": 0,
                "unpaid_amount": 0,
            }

        report[vendor_id]["total_orders"] += 1
        paid_amount = get_payment_total(bill_id=bill["id"])
        report[vendor_id]["paid_amount"] += paid_amount
        report[vendor_id]["unpaid_amount"] += coerce_float(bill.get("total")) - paid_amount

    return jsonify(list(report.values()))


@app.get("/api/settings")
@authenticate_token
def get_settings():
    access_error = require_internal()
    if access_error:
        return access_error
    return jsonify(settings_payload())


@app.put("/api/settings")
@authenticate_token
def update_settings():
    access_error = require_internal()
    if access_error:
        return access_error

    data = request.get_json(silent=True) or {}
    update_record(
        "settings",
        "1",
        {"automatic_invoicing": bool(data.get("automaticInvoicing"))},
        id_field="id",
    )
    return jsonify(settings_payload())


with app.app_context():
    bootstrap()


if __name__ == "__main__":
    print(f"Flask backend running on port {PORT}")
    print("Default internal user: admin@appareldesk.local / admin123")
    app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)

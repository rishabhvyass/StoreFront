# Flask Backend

This backend is set up for local development with Flask and for production deployment
on Render with PostgreSQL and Gunicorn.

## Local setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy values from `.env.example` into `server/.env` and point `DATABASE_URL` to a
   PostgreSQL database.
4. Start the backend:

```bash
python app.py
```

The API runs on `http://localhost:5001/api` by default.

## Render deployment

Render service settings:

```bash
Root directory: server
Build command: pip install -r requirements.txt
Start command: gunicorn app:app
```

Required environment variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=long-random-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_COMPANY_NAME=ShopFront
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-flask-app.onrender.com
```

Generate a strong JWT secret with:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Google Auth

Set `GOOGLE_CLIENT_ID` in the backend and `REACT_APP_GOOGLE_CLIENT_ID` in the frontend
to the same Google OAuth client ID. The login and signup pages both use Google Identity
Services and send the Google credential to `POST /api/auth/google`.

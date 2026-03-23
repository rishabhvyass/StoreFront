import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiHeart,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import BrandLoader from "../components/BrandLoader";
import { useApp } from "../context/AppContext";
import { catalogAPI } from "../services/api";
import { formatCurrencyINR } from "../utils/currency";
import "../styles/Home.css";

const companyHighlights = [
  {
    title: "Curated catalog",
    copy: "We hand-pick practical products across lifestyle, home, beauty, and everyday tech."
  },
  {
    title: "Clear pricing",
    copy: "Product details, previous-price context, and quick comparisons stay easy to scan."
  },
  {
    title: "Responsive support",
    copy: "We focus on faster answers, smoother order follow-up, and simpler customer care."
  },
  {
    title: "Reliable checkout",
    copy: "Cart, account, and order flows are built to stay straightforward from browse to delivery."
  }
];

const formatCategoryLabel = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildCategories = (catalogProducts = []) =>
  Array.from(
    new Set(
      catalogProducts.map((product) => product.product_category).filter(Boolean)
    )
  )
    .sort((left, right) => left.localeCompare(right))
    .map((slug) => ({
      slug,
      name: formatCategoryLabel(slug),
    }));

const Home = () => {
  const { user } = useApp();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const fetchCatalog = async () => {
      try {
        const productsResponse = await catalogAPI.getAll();
        const catalogProducts = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : [];

        setProducts(catalogProducts);
        setCategories(buildCategories(catalogProducts));
      } catch (err) {
        console.error("Error fetching products", err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [user]);

  const trendingProducts = useMemo(() => products.slice(0, 5), [products]);
  const categoryItems = categories.slice(0, 6);
  const featuredCategories = categoryItems.slice(0, 2).map((category) => {
    const matchingProduct = products.find(
      (product) => product.product_category === category.slug
    );

    return {
      title: category.name,
      subtitle:
        matchingProduct?.brand ||
        matchingProduct?.description ||
        "Browse products in this collection",
      image: matchingProduct?.images?.[0] || "",
      slug: category.slug,
    };
  });
  const getProductImage = (product) =>
    product.images?.[0] || "";

  const handleSearch = () => {
    if (!user) {
      navigate("/register");
      return;
    }

    const trimmedSearch = search.trim();
    navigate(trimmedSearch ? `/shop?search=${encodeURIComponent(trimmedSearch)}` : "/shop");
  };

  if (loading) {
    return <BrandLoader message="Loading storefront..." />;
  }

  return (
    <div className="landing-shell">
      <div className="landing-frame">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1 className="landing-hero-title">
              Discover curated products
              <br />
              for every need.
            </h1>
            <p className="landing-hero-subtitle">
              Fast search, clear details, and one-stop picks.
            </p>

            {user ? (
              <div className="landing-search-row">
                <label className="landing-search-field" htmlFor="landing-search">
                  <input
                    id="landing-search"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products, brands, or categories"
                  />
                  <FiSearch />
                </label>
                <button type="button" className="landing-search-button" onClick={handleSearch}>
                  SEARCH
                </button>
              </div>
            ) : (
              <div className="landing-guest-cta-row">
                <Link to="/register" className="landing-search-button landing-auth-cta">
                  SIGN UP
                </Link>
                <Link to="/login" className="landing-guest-link">
                  Already have an account? Login
                </Link>
              </div>
            )}
          </div>

          <div className="landing-hero-art" aria-hidden="true">
            <span className="landing-hero-spark landing-hero-spark-1" />
            <span className="landing-hero-spark landing-hero-spark-2" />
            <span className="landing-hero-dot landing-hero-dot-1" />
            <span className="landing-hero-dot landing-hero-dot-2" />
            <span className="landing-hero-thread landing-hero-thread-1" />
            <span className="landing-hero-thread landing-hero-thread-2" />

            <div className="landing-hero-blob">
              <span className="landing-hero-wave landing-hero-wave-1" />
              <span className="landing-hero-wave landing-hero-wave-2" />
            </div>

            <div className="landing-hero-orb landing-hero-orb-left" />
            <div className="landing-hero-orb landing-hero-orb-top" />
            <div className="landing-hero-orb landing-hero-orb-bottom" />
            <div className="landing-hero-gift">
              <span />
            </div>
          </div>
        </section>

        {user ? (
          <>
            <section className="landing-categories">
              <h2 className="landing-section-heading">Categories</h2>
              {categoryItems.length > 0 ? (
                <div className="landing-category-grid">
                  {categoryItems.map((item, index) => (
                    <button
                      type="button"
                      key={item.slug}
                      className="landing-category-card"
                      onClick={() => navigate(`/shop?category=${encodeURIComponent(item.slug)}`)}
                    >
                      <span>{item.name}</span>
                      <div className={`landing-category-glow glow-${(index % 6) + 1}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="landing-empty-panel">
                  No storefront categories yet. Publish a product from the admin panel and it
                  will appear here.
                </div>
              )}
            </section>

            <section className="landing-content-grid">
              <div className="landing-main">
                <div className="landing-panel-heading landing-panel-heading-wide">
                  <div className="landing-panel-title">
                    <FiTrendingUp />
                    <span>Trending</span>
                  </div>
                  <div className="landing-panel-controls">
                    <button type="button" aria-label="Previous">
                      <FiChevronLeft />
                    </button>
                    <button type="button" aria-label="Next">
                      <FiChevronRight />
                    </button>
                  </div>
                </div>

                {trendingProducts.length > 0 ? (
                  <div className="landing-trending-grid">
                    {trendingProducts.map((product, index) => (
                      <article
                        key={product.id}
                        className={`landing-product-card ${index === 0 ? "landing-product-card-featured" : ""}`}
                      >
                        <div className="landing-product-image">
                          <img src={getProductImage(product)} alt={product.product_name} />
                        </div>
                        <div className="landing-product-meta">
                          <div className="landing-product-copy">
                            <h3>{product.product_name}</h3>
                            <p className="landing-product-price">
                              <strong>{formatCurrencyINR(product.sales_price)}</strong>
                              {product.previous_price && (
                                <span>{formatCurrencyINR(product.previous_price)}</span>
                              )}
                            </p>
                          </div>
                          <button type="button" className="landing-product-icon" aria-label="Save item">
                            {index === 1 ? <FiStar /> : <FiHeart />}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="landing-empty-panel">
                    No live products yet. Add and publish items in the admin dashboard to fill
                    this trending section.
                  </div>
                )}

                <div className="landing-panel-heading landing-panel-heading-wide">
                  <div className="landing-panel-title">
                    <FiGrid />
                    <span>Top categories</span>
                  </div>
                </div>

                {featuredCategories.length > 0 ? (
                  <div className="landing-feature-grid">
                    {featuredCategories.map((category) => (
                      <article key={category.slug} className="landing-feature-card">
                        <img src={category.image} alt={category.title} />
                        <div className="landing-feature-overlay">
                          <h3>{category.title}</h3>
                          <p>{category.subtitle}</p>
                          <button
                            type="button"
                            onClick={() => navigate(`/shop?category=${encodeURIComponent(category.slug)}`)}
                          >
                            SHOP
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="landing-empty-panel">
                    Featured collections will show up here as soon as your admin catalog has
                    published products.
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="landing-gate-card">
            <p className="landing-company-kicker">Members only browsing</p>
            <h2 className="landing-section-heading">Create an account to unlock the live catalog.</h2>
            <p className="landing-gate-copy">
              Sign up to browse products, open categories, search the catalog, add items to cart,
              and place orders. We keep the active storefront visible only to registered users.
            </p>
            <div className="landing-gate-actions">
              <Link to="/register" className="landing-search-button landing-auth-cta">
                CREATE ACCOUNT
              </Link>
              <Link to="/login" className="landing-gate-secondary">
                LOGIN
              </Link>
            </div>
          </section>
        )}

        <section className="landing-company">
          <div className="landing-company-shell">
            <article className="landing-company-copy">
              <p className="landing-company-kicker">About company</p>
              <h2 className="landing-section-heading">
                Built to make everyday shopping feel clearer and faster.
              </h2>
              <p className="landing-company-lead">
                ShopFront brings together curated products, cleaner discovery, and
                dependable customer support in one storefront. We focus on practical
                picks, straightforward pricing, and a smoother path from browsing to
                checkout.
              </p>
            </article>

            <div className="landing-company-grid">
              {companyHighlights.map((item) => (
                <article key={item.title} className="landing-company-card">
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footer-brand">
            <h3>ShopFront</h3>
            <p>
              Curated products for everyday living, with clear details, simpler
              discovery, and a more dependable shopping experience.
            </p>
          </div>

          <div className="landing-footer-links">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to={user ? "/shop" : "/register"}>{user ? "Shop" : "Sign up"}</Link>
            <Link to="/contact">Contact</Link>
            <Link to={user ? "/customer-portal?tab=profile" : "/login"}>
              {user ? "Account" : "Login"}
            </Link>
          </div>

          <div className="landing-footer-links">
            <h4>Company</h4>
            <p className="landing-footer-detail">
              <FiMapPin />
              <span>200 Market Street, San Francisco</span>
            </p>
            <a href="mailto:support@shopfront.co" className="landing-footer-detail">
              <FiMail />
              <span>support@shopfront.co</span>
            </a>
            <a href="tel:+18005550123" className="landing-footer-detail">
              <FiPhone />
              <span>+1 (800) 555-0123</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;

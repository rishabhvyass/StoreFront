import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMessageCircle,
  FiStar,
} from "react-icons/fi";
import BrandLoader from "../components/BrandLoader";
import { catalogAPI } from "../services/api";
import { useApp } from "../context/AppContext";
import { formatCurrencyINR } from "../utils/currency";
import "../styles/Shop.css";

const reviews = [
  {
    author: "Jordan P.",
    rating: 5,
    title: "Excellent quality",
    body:
      "Fantastic product and materials feel premium, sizing matched the guide, and images on the product page were accurate. Quick add-to-cart and fast shipping made checkout painless.",
    date: "Dec 15, 2023",
  },
  {
    author: "Aisha K.",
    rating: 5,
    title: "Love the design",
    body: "Stylish, well-made, and true to size.",
    date: "Jan 4, 2024",
  },
  {
    author: "Sam R.",
    rating: 5,
    title: "Perfect fit",
    body:
      "Exceeded expectations. The product gallery, clear variant selection, and optimistic add-to-cart animation made the whole experience smooth.",
    date: "Mar 10, 2024",
  },
  {
    author: "Theo L.",
    rating: 5,
    title: "Very happy",
    body: "Great value and fast delivery.",
    date: "Mar 2, 2024",
  },
  {
    author: "Noah T.",
    rating: 4,
    title: "Highly recommend",
    body: "Added to cart instantly; checkout was seamless.",
    date: "Feb 20, 2024",
  },
];

const sizes = ["M", "L", "XL"];

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

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useApp();

  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const productsResponse = await catalogAPI.getAll();
        const catalogProducts = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : [];

        setProducts(catalogProducts);
        setCategories(buildCategories(catalogProducts));
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const allProducts = products;

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.product_category === activeCategory;

      const matchesSearch =
        !searchQuery ||
        [product.product_name, product.brand, product.product_category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchQuery));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, allProducts, searchQuery]);

  useEffect(() => {
    if (filteredProducts.length === 0) {
      setSelectedProductId(null);
      return;
    }

    const hasActiveProduct = filteredProducts.some(
      (product) => product.id === selectedProductId
    );

    if (!hasActiveProduct) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  const selectedProduct = useMemo(() => {
    return (
      filteredProducts.find((product) => product.id === selectedProductId) ||
      filteredProducts[0] ||
      null
    );
  }, [filteredProducts, selectedProductId]);

  const productImages = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    const images =
      selectedProduct.images && selectedProduct.images.length > 0
        ? selectedProduct.images
        : [];

    return images.slice(0, 4);
  }, [selectedProduct]);

  const recommendedProducts = useMemo(() => {
    const source =
      filteredProducts.length > 1
        ? filteredProducts
        : activeCategory !== "all"
          ? allProducts.filter((product) => product.product_category === activeCategory)
          : allProducts;

    return source
      .filter((product) => product.id !== selectedProduct?.id)
      .slice(0, 4);
  }, [activeCategory, allProducts, filteredProducts, selectedProduct]);

  const reviewItems = useMemo(() => {
    if (selectedProduct?.reviews?.length) {
      return selectedProduct.reviews.slice(0, 4).map((review, index) => ({
        author: review.reviewerName || `Customer ${index + 1}`,
        rating: Math.max(1, Math.round(review.rating || selectedProduct.rating || 4)),
        title: "Customer review",
        body: review.comment || "Great product.",
        date: review.date
          ? new Date(review.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recent",
      }));
    }

    return reviews;
  }, [selectedProduct]);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedColorIndex(0);
    setQuantity(1);
  }, [selectedProductId]);

  const handleAddToCart = () => {
    if (!selectedProduct) {
      return;
    }

    for (let index = 0; index < quantity; index += 1) {
      addToCart(selectedProduct);
    }
  };

  const handleCategoryChange = (categorySlug) => {
    const nextParams = new URLSearchParams(searchParams);

    if (categorySlug === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", categorySlug);
    }

    setSearchParams(nextParams);
  };

  const productColors =
    selectedProduct?.colors?.length > 0
      ? selectedProduct.colors
      : ["#ead1ff", "#f3e6ff", "#efefef"];

  const currentPrice = Number(selectedProduct?.sales_price || 0);
  const originalPrice = Number(
    selectedProduct?.original_price || currentPrice + 13
  );
  const currentRating = Number(selectedProduct?.rating || 4.8);

  if (loading) {
    return <BrandLoader message="Loading products..." />;
  }

  return (
    <div className="shop-detail-page">
      <div className="shop-detail-frame">
        <div className="shop-breadcrumbs">
          <span>Home</span>
          <span>/</span>
          <span>Shop</span>
          {activeCategory !== "all" && (
            <>
              <span>/</span>
              <span>{formatCategoryLabel(activeCategory)}</span>
            </>
          )}
          {selectedProduct && (
            <>
              <span>/</span>
              <strong>{selectedProduct.product_name}</strong>
            </>
          )}
        </div>

        <section className="shop-category-strip" id="shop-categories">
          <button
            type="button"
            className={`shop-category-pill ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => handleCategoryChange("all")}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.slug}
              className={`shop-category-pill ${
                activeCategory === category.slug ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </section>

        {selectedProduct ? (
          <section className="shop-featured-card">
            <div className="shop-gallery-column">
              <div className="shop-thumbnail-list">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${selectedProduct.id}-thumb-${index}`}
                    className={`shop-thumbnail ${activeImageIndex === index ? "active" : ""}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img src={image} alt={`${selectedProduct.product_name} ${index + 1}`} />
                  </button>
                ))}
              </div>

              <div className="shop-main-image">
                <img
                  src={productImages[activeImageIndex] || selectedProduct.images?.[0] || ""}
                  alt={selectedProduct.product_name}
                />
              </div>
            </div>

            <div className="shop-product-summary">
              <h1>{selectedProduct.product_name}</h1>

              <div className="shop-rating-row">
                <div className="shop-stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FiStar
                      key={index}
                      className={index < Math.round(currentRating) ? "filled" : ""}
                    />
                  ))}
                </div>
                <span>({currentRating.toFixed(1)} / 5) {reviewItems.length}</span>
              </div>

              <div className="shop-price-row">
                <strong>{formatCurrencyINR(currentPrice)}</strong>
                <span>{formatCurrencyINR(originalPrice)}</span>
              </div>

              <div className="shop-copy-row">
                <p>
                  {selectedProduct.description ||
                    "Carefully selected product details with clear product information."}
                </p>
                <button type="button">
                  {selectedProduct.shipping_information || "Ships in 3-5 business days"}
                </button>
              </div>

              <div className="shop-option-block">
                <span className="shop-option-label">Category</span>
                <span className="shop-option-value">
                  {formatCategoryLabel(selectedProduct.product_category)}
                </span>
                <div className="shop-product-tags">
                  <span>{selectedProduct.brand || "ShopFront"}</span>
                  <span>{selectedProduct.current_stock || 0} in stock</span>
                </div>
              </div>

              <div className="shop-option-block">
                <span className="shop-option-label">Color</span>
                <span className="shop-option-value">Selected option</span>
                <div className="shop-color-row">
                  {productColors.map((color, index) => (
                    <button
                      type="button"
                      key={`${color}-${index}`}
                      className={`shop-color-swatch ${
                        selectedColorIndex === index ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColorIndex(index)}
                      aria-label={`Color ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="shop-variant-row">
                <label className="shop-select-group">
                  <span>Size</span>
                  <small>Med</small>
                  <select
                    value={selectedSize}
                    onChange={(event) => setSelectedSize(event.target.value)}
                  >
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="shop-select-group shop-qty-group">
                  <span>Qty</span>
                  <small>&nbsp;</small>
                  <select
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="shop-action-row">
                <button
                  type="button"
                  className="shop-add-button"
                  onClick={handleAddToCart}
                >
                  ADD
                </button>
                <button type="button" className="shop-favorite-button" aria-label="Favorite">
                  <FiHeart />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="shop-empty-state">
            <h2>No products found</h2>
            <p>Try a different category or clear the active search to see more products.</p>
            <button type="button" onClick={() => setSearchParams({})}>
              Reset filters
            </button>
          </section>
        )}

        {selectedProduct && (
          <>
            <section className="shop-section">
              <h2 className="shop-section-title">Recommended</h2>
              {recommendedProducts.length > 0 ? (
                <div className="shop-recommended-grid">
                  {recommendedProducts.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      className="shop-recommended-card"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <div className="shop-recommended-image">
                        <img src={product.images?.[0]} alt={product.product_name} />
                      </div>
                      <div className="shop-recommended-meta">
                        <div>
                          <h3>{product.product_name}</h3>
                          <p>{formatCurrencyINR(product.sales_price || 14.99)}</p>
                        </div>
                        <FiHeart />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="shop-empty-state shop-empty-state-compact">
                  <h2>No recommended products yet</h2>
                  <p>Publish a few more items in the admin panel to build this section out.</p>
                </div>
              )}
            </section>

            <section className="shop-feedback-section">
              <div className="shop-feedback-sidebar">
                <div className="shop-panel-heading">
                  <FiBarChart2 />
                  <span>Rating</span>
                </div>

                <div className="shop-rating-card">
                  <strong>{currentRating.toFixed(1)}</strong>
                  <span>/5</span>
                  <div className="shop-rating-stars">★★★★★</div>
                  <small>{reviewItems.length} reviews</small>
                  <div className="shop-rating-bars">
                    {[5, 4, 3, 2, 1].map((score, index) => (
                      <div key={score} className="shop-rating-bar-row">
                        <label>{score}★</label>
                        <div className="shop-rating-track">
                          <div
                            className="shop-rating-fill"
                            style={{ width: `${[82, 48, 24, 12, 8][index]}%` }}
                          />
                        </div>
                        <span>{[12, 7, 4, 2, 1][index]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <select className="shop-filter-select" defaultValue="Sort by">
                  <option>Sort by</option>
                  <option>Newest</option>
                  <option>Highest rated</option>
                </select>
                <select className="shop-filter-select" defaultValue="All content (images, text)">
                  <option>All content (images, text)</option>
                  <option>Images only</option>
                  <option>Text only</option>
                </select>
                <select className="shop-filter-select" defaultValue="Filter by stars">
                  <option>Filter by stars</option>
                  <option>5 stars</option>
                  <option>4 stars & up</option>
                </select>
              </div>

              <div className="shop-review-column">
                <div className="shop-panel-heading shop-panel-heading-wide">
                  <div className="shop-panel-title">
                    <FiMessageCircle />
                    <span>Reviews</span>
                  </div>
                  <div className="shop-panel-controls">
                    <button type="button" aria-label="Previous reviews">
                      <FiChevronLeft />
                    </button>
                    <button type="button" aria-label="Next reviews">
                      <FiChevronRight />
                    </button>
                  </div>
                </div>

                <div className="shop-review-grid">
                  {reviewItems.map((review) => (
                    <article key={`${review.author}-${review.date}`} className="shop-review-card">
                      <div className="shop-review-header">
                        <strong>{review.author}</strong>
                        <span>{"★".repeat(review.rating)}</span>
                      </div>
                      <h3>{review.title}</h3>
                      <p>{review.body}</p>
                      <small>{review.date}</small>
                    </article>
                  ))}
                </div>

                <button type="button" className="shop-more-button">
                  MORE
                </button>
              </div>
            </section>
          </>
        )}

        <section className="shop-newsletter-bar">
          <p>Join our newsletter for launch offers.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Enter your email"
            />
            <button type="submit">SUBSCRIBE</button>
          </form>
        </section>

        <footer className="shop-footer">
          <div className="shop-footer-brand">
            <h3>ShopFront</h3>
            <div className="shop-footer-socials">
              <span>f</span>
              <span>t</span>
              <span>◎</span>
            </div>
          </div>

          <div className="shop-footer-links">
            <div>
              <h4>Help</h4>
              <a href="/" onClick={(event) => event.preventDefault()}>
                FAQ
              </a>
              <a href="/" onClick={(event) => event.preventDefault()}>
                Customer Service
              </a>
              <a href="/" onClick={(event) => event.preventDefault()}>
                How-to guides
              </a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="/" onClick={(event) => event.preventDefault()}>
                Privacy Policy
              </a>
              <a href="/" onClick={(event) => event.preventDefault()}>
                Sitemap
              </a>
              <a href="/" onClick={(event) => event.preventDefault()}>
                Subscriptions
              </a>
            </div>
            <div>
              <h4>Contact us</h4>
              <a href="mailto:support@shopfront.com">support@shopfront</a>
              <a href="tel:+18005550123">+1 (800) 555-0123</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Shop;

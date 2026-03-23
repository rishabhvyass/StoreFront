import React, { useState } from 'react';
import './ProductListing.css';

const ProductListing = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 340]);
  const [sortBy, setSortBy] = useState('featured');

  const categories = [
    'T-Shirts & Tops',
    'Outerwear',
    'Bottoms',
    'Dresses'
  ];

  const colors = [
    { name: 'black', hex: '#000000' },
    { name: 'white', hex: '#FFFFFF' },
    { name: 'green', hex: '#10b981' },
    { name: 'blue', hex: '#3b82f6' },
    { name: 'orange', hex: '#f97316' },
    { name: 'grey', hex: '#6b7280' }
  ];

  const products = [
    {
      id: 1,
      name: 'Essential Oversized Tee',
      category: 'T-Shirts',
      price: 45.00,
      originalPrice: null,
      image: '/api/placeholder/300/400',
      isNew: true,
      discount: null
    },
    {
      id: 2,
      name: 'Structured Utility Jacket',
      category: 'Outerwear',
      price: 120.00,
      originalPrice: null,
      image: '/api/placeholder/300/400',
      isNew: false,
      discount: null
    },
    {
      id: 3,
      name: 'Minimalist Tunic Dress',
      category: 'Dresses',
      price: 68.00,
      originalPrice: null,
      image: '/api/placeholder/300/400',
      isNew: false,
      discount: null
    },
    {
      id: 4,
      name: 'Oxford Cotton Shirt',
      category: 'T-Shirts',
      price: 89.00,
      originalPrice: null,
      image: '/api/placeholder/300/400',
      isNew: false,
      discount: null
    },
    {
      id: 5,
      name: 'Vintage Wash Denim',
      category: 'Bottoms',
      price: 145.00,
      originalPrice: null,
      image: '/api/placeholder/300/400',
      isNew: false,
      discount: null
    },
    {
      id: 6,
      name: 'Pleated Midi Skirt',
      category: 'Bottoms',
      price: 75.00,
      originalPrice: null,
      image: '/api/placeholder/300/400',
      isNew: false,
      discount: 20
    }
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleColorChange = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handlePriceChange = (index, value) => {
    const newRange = [...priceRange];
    newRange[index] = value;
    setPriceRange(newRange);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setPriceRange([0, 340]);
  };

  return (
    <div className="product-listing">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon"></div>
            <span>ApparelDesk</span>
          </div>
        </div>
        <div className="header-center">
          <div className="search-bar">
            <input type="text" placeholder="Search for products, brands and more..." />
            <div className="search-icon"></div>
          </div>
        </div>
        <div className="header-right">
          <div className="user-icon"></div>
          <div className="cart-icon">
            <div className="notification-dot"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Summer Collection 2024</h1>
          <p>Discover the new season essentials. Minimalist, ethical, and fashion-forward designs for the modern wardrobe.</p>
          <div className="hero-buttons">
            <button className="btn-primary">Shop Now</button>
            <button className="btn-secondary">View Lookbook</button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h2>Filters</h2>
            <button className="clear-all" onClick={clearAllFilters}>Clear All</button>
          </div>

          {/* Category Filter */}
          <div className="filter-section">
            <h3>Category</h3>
            <div className="checkbox-group">
              {categories.map((category) => (
                <label key={category} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  <span className="checkmark"></span>
                  {category}
                </label>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="filter-section">
            <h3>Color</h3>
            <div className="color-options">
              {colors.map((color) => (
                <button
                  key={color.name}
                  className={`color-swatch ${selectedColors.includes(color.name) ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorChange(color.name)}
                  title={color.name}
                ></button>
              ))}
            </div>
          </div>

          {/* Material Filter */}
          <div className="filter-section">
            <h3>Material</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Cotton
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Denim
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Linen
              </label>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-range">
              <div className="price-slider">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceChange(0, parseInt(e.target.value))}
                  className="slider slider-min"
                />
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceChange(1, parseInt(e.target.value))}
                  className="slider slider-max"
                />
              </div>
              <div className="price-inputs">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="product-grid-section">
          <div className="grid-header">
            <p>Showing 124 Products</p>
            <div className="sort-dropdown">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  <img src={product.image} alt={product.name} />
                  {product.isNew && <span className="product-badge new">New</span>}
                  {product.discount && (
                    <span className="product-badge discount">-{product.discount}%</span>
                  )}
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">
                    <span className="current-price">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="original-price">${product.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="page-nav prev">&lt;</button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((page) => (
              <button
                key={page}
                className={`page-number ${page === 1 ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button className="page-nav next">&gt;</button>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="logo">
              <div className="logo-icon"></div>
              <span>ApparelDesk</span>
            </div>
            <p>Redefining fashion commerce with minimalist aesthetics and enterprise-grade performance.</p>
          </div>
          
          <div className="footer-section">
            <h4>Shop</h4>
            <ul>
              <li><a href="#">New Arrivals</a></li>
              <li><a href="#">Best Sellers</a></li>
              <li><a href="#">Men</a></li>
              <li><a href="#">Women</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Returns & Exchanges</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Stay in the loop</h4>
            <div className="newsletter">
              <input type="email" placeholder="Enter your email" />
              <button className="newsletter-btn">
                <div className="arrow-icon"></div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 ApparelDesk Inc. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductListing;

import React, { useState } from 'react';
import './ProductDetail.css';

const ProductDetail = () => {
  const [selectedColor, setSelectedColor] = useState('slate-grey');
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const product = {
    name: "The Oxford Essential Shirt",
    price: "$89.00",
    rating: 4.8,
    reviews: 120,
    color: "Slate Grey",
    description: "Crafted from premium Italian cotton, this Oxford shirt strikes the perfect balance between professional polish and weekend comfort. Features mother-of-pearl buttons and a tailored fit that moves with you.",
    availability: "In Stock, ready to ship"
  };

  const colors = [
    { name: 'slate-grey', hex: '#708090' },
    { name: 'black', hex: '#000000' },
    { name: 'white', hex: '#FFFFFF' },
    { name: 'navy', hex: '#000080' }
  ];

  const sizes = ['XS', 'S', 'M', 'L'];
  const images = [
    '/api/placeholder/600/800',
    '/api/placeholder/150/150',
    '/api/placeholder/150/150',
    '/api/placeholder/150/150',
    '/api/placeholder/150/150'
  ];

  const relatedProducts = [
    { name: 'Essential Chino', price: '$79.00', image: '/api/placeholder/300/400' },
    { name: 'Classic Denim Jacket', price: '$120.00', image: '/api/placeholder/300/400' },
    { name: 'Core Tee', price: '$35.00', image: '/api/placeholder/300/400' },
    { name: 'Court Sneaker', price: '$145.00', image: '/api/placeholder/300/400' }
  ];

  return (
    <div className="product-detail">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon"></div>
            <span>ApparelDesk</span>
          </div>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link">New Arrivals</a>
          <a href="#" className="nav-link">Men</a>
          <a href="#" className="nav-link">Women</a>
          <a href="#" className="nav-link">Accessories</a>
        </nav>
        <div className="header-right">
          <div className="search-bar">
            <input type="text" placeholder="Search products..." />
            <div className="search-icon"></div>
          </div>
          <div className="icon-bag"></div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span>Home</span> &gt; <span>Men</span> &gt; <span>Shirts</span> &gt; <span>Oxford Essential</span>
      </div>

      {/* Product Section */}
      <div className="product-container">
        <div className="product-images">
          <div className="main-image">
            <img src={images[activeImage]} alt="Product" />
            <button className="zoom-btn">Hover to Zoom</button>
          </div>
          <div className="thumbnail-images">
            {images.slice(1).map((img, index) => (
              <div key={index} className="thumbnail">
                <img src={img} alt={`Thumbnail ${index + 1}`} onClick={() => setActiveImage(index + 1)} />
                {index === 3 && <div className="view-all">View All</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-meta">
            <span className="color">Color: {product.color}</span>
            <span className="price">{product.price}</span>
          </div>
          
          <div className="rating">
            <div className="stars">★★★★★</div>
            <span>{product.rating} ({product.reviews} reviews)</span>
          </div>

          <p className="description">{product.description}</p>

          <div className="color-options">
            <span>Color:</span>
            {colors.map((color) => (
              <button
                key={color.name}
                className={`color-swatch ${selectedColor === color.name ? 'selected' : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => setSelectedColor(color.name)}
              ></button>
            ))}
          </div>

          <div className="size-options">
            <span>Size:</span>
            {sizes.map((size) => (
              <button
                key={size}
                className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
            <a href="#" className="size-guide">Size Guide</a>
          </div>

          <div className="availability">
            <span className="in-stock">{product.availability}</span>
          </div>

          <div className="quantity-selector">
            <span>Quantity:</span>
            <div className="quantity-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <input type="number" value={quantity} readOnly />
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <button className="add-to-cart">
            <div className="cart-icon"></div>
            Add to Cart
          </button>

          <div className="accordion">
            <div className="accordion-item">
              <button className="accordion-header">Shipping & Returns</button>
              <div className="accordion-content">
                <p>Free shipping on orders over $100. Easy returns within 30 days.</p>
              </div>
            </div>
            <div className="accordion-item">
              <button className="accordion-header">Fabric & Care</button>
              <div className="accordion-content">
                <p>100% Italian cotton. Machine wash cold, tumble dry low.</p>
              </div>
            </div>
          </div>

          <div className="trust-badges">
            <div className="badge">
              <div className="badge-icon secure"></div>
              <span>Secure Checkout</span>
            </div>
            <div className="badge">
              <div className="badge-icon sustainable"></div>
              <span>Sustainable</span>
            </div>
            <div className="badge">
              <div className="badge-icon support"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h2>Customer Reviews</h2>
        <div className="reviews-summary">
          <div className="overall-rating">
            <div className="rating-number">{product.rating}</div>
            <div className="stars">★★★★★</div>
            <span>Based on {product.reviews} reviews</span>
          </div>
          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="rating-bar">
                <span>{stars} ★</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 7 : 2}%` }}></div>
                </div>
                <span>{stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 7 : 2}%</span>
              </div>
            ))}
          </div>
        </div>
        <button className="write-review">Write a Review</button>
      </div>

      {/* Related Products */}
      <div className="related-products">
        <h2>You Might Also Like</h2>
        <div className="related-grid">
          {relatedProducts.map((product, index) => (
            <div key={index} className="related-product-card">
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <span className="price">{product.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="logo">
              <div className="logo-icon"></div>
              <span>ApparelDesk</span>
            </div>
            <p>© 2024 ApparelDesk Inc. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;

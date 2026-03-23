import React from 'react';
import './Footer.css';

const Footer = ({ variant = 'default' }) => {
  return (
    <footer className="app-footer">
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
  );
};

export default Footer;

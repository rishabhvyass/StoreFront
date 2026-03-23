import React from 'react';
import './Header.css';

const Header = ({ showSearch = true, showIcons = true, variant = 'default' }) => {
  const getPlaceholder = () => {
    switch(variant) {
      case 'product':
        return 'Search products...';
      case 'listing':
        return 'Search for products, brands and more...';
      default:
        return 'Search for products, brands and more...';
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon"></div>
            <span>ApparelDesk</span>
          </div>
        </div>
        
        {showSearch && (
          <div className="header-center">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder={getPlaceholder()} 
              />
              <div className="search-icon"></div>
            </div>
          </div>
        )}
        
        {showIcons && (
          <div className="header-right">
            <div className="user-icon"></div>
            <div className="cart-icon">
              <div className="notification-dot"></div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

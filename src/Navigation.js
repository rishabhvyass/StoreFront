import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiMoon,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiSun,
  FiUser
} from "react-icons/fi";
import { useApp } from "./context/AppContext";

const Navigation = () => {
  const { user, logout, getCartItemCount, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartItemCount();
  const isGuest = !user;
  const accountPath = user?.role === 'internal' ? '/backend' : '/customer-portal?tab=profile';
  const isBackendView = user?.role === 'internal' && location.pathname.startsWith('/backend');
  const isPortalView = user?.role !== 'internal' && location.pathname.startsWith('/customer-portal');

  const storefrontNavItems = [
    {
      label: 'Home',
      to: '/',
      isActive: () => location.pathname === '/'
    },
    ...(!isGuest
      ? [
          {
            label: 'Shop',
            to: '/shop',
            isActive: () => location.pathname === '/shop' && location.hash !== '#shop-categories'
          },
          {
            label: 'Categories',
            to: '/shop#shop-categories',
            isActive: () => location.pathname === '/shop' && location.hash === '#shop-categories'
          }
        ]
      : []),
    {
      label: 'Contact',
      to: '/contact',
      isActive: () => location.pathname === '/contact'
    }
  ];

  const customerNavItems = [
    {
      label: 'Profile',
      to: '/customer-portal?tab=profile',
      isActive: () =>
        location.pathname === '/customer-portal'
        && (new URLSearchParams(location.search).get('tab') || 'profile') === 'profile'
    },
    {
      label: 'Orders',
      to: '/customer-portal?tab=orders',
      isActive: () =>
        location.pathname === '/customer-portal'
        && new URLSearchParams(location.search).get('tab') === 'orders'
    },
    {
      label: 'Invoices',
      to: '/customer-portal?tab=invoices',
      isActive: () =>
        location.pathname === '/customer-portal'
        && new URLSearchParams(location.search).get('tab') === 'invoices'
    },
    {
      label: 'Shop',
      to: '/shop',
      isActive: () => location.pathname === '/shop'
    }
  ];

  const backendNavItems = [
    {
      label: 'Dashboard',
      to: '/backend',
      isActive: () => location.pathname === '/backend'
    },
    {
      label: 'Products',
      to: '/backend/products',
      isActive: () => location.pathname === '/backend/products'
    },
    {
      label: 'Orders',
      to: '/backend/orders',
      isActive: () => location.pathname === '/backend/orders'
    },
    {
      label: 'Invoices',
      to: '/backend/invoices',
      isActive: () => location.pathname === '/backend/invoices'
    },
    {
      label: 'Reports',
      to: '/backend/reports',
      isActive: () => location.pathname === '/backend/reports'
    },
    {
      label: 'Settings',
      to: '/backend/settings',
      isActive: () => location.pathname === '/backend/settings'
    }
  ];

  const navItems = isBackendView
    ? backendNavItems
    : isPortalView
      ? customerNavItems
      : storefrontNavItems;

  const modeLabel = isBackendView
    ? 'Backend mode'
    : isPortalView
      ? 'My account'
      : 'Storefront';

  const brandTitle = isBackendView ? 'Admin Desk' : 'ShopFront';
  const searchPath = isBackendView ? '/backend/products' : '/shop';
  const utilityLink = user?.role === 'internal'
    ? {
        label: isBackendView ? 'Storefront' : 'Admin',
        to: isBackendView ? '/' : '/backend'
      }
    : null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className={`custom-nav${isBackendView ? ' custom-nav-backend' : ''}`}>
      <div className="nav-left">
        <Link to={isBackendView ? '/backend' : '/'} className="nav-brand-block" title={brandTitle}>
          <span className="nav-brand-icon">
            <FiShoppingBag />
          </span>
          <span className="nav-brand-copy">
            <strong className="nav-brand-label">{brandTitle}</strong>
            <small className="nav-brand-mode">{modeLabel}</small>
          </span>
        </Link>
      </div>

      <div className="nav-center">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`nav-link-item${item.isActive() ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        {utilityLink ? (
          <Link to={utilityLink.to} className="nav-utility-link">
            {utilityLink.label}
          </Link>
        ) : null}

        <button
          className={`nav-icon-btn theme-toggle-btn${theme === 'dark' ? ' active' : ''}`}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>

        {user ? (
          <>
            <button className="nav-icon-btn" onClick={() => navigate(searchPath)} title="Search">
              <FiSearch />
            </button>

            <NavLink to="/cart" className="nav-icon-btn cart-icon-wrapper" title="Cart">
              <FiShoppingCart />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>

            <NavLink
              to={accountPath}
              className="nav-icon-btn"
              title={user.role === 'internal' ? 'Dashboard' : 'My account'}
            >
              <FiUser />
            </NavLink>
            <button className="nav-icon-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </>
        ) : (
          <div className="nav-auth-actions">
            <NavLink to="/login" className="nav-auth-link nav-auth-link-secondary">
              Login
            </NavLink>
            <NavLink to="/register" className="nav-auth-link nav-auth-link-primary">
              Signup
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

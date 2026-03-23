import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBox,
  FiDatabase,
  FiFileText,
  FiLayers,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiUsers
} from 'react-icons/fi';
import BrandLoader from '../components/BrandLoader';
import { saleOrdersAPI, customerInvoicesAPI, productsAPI, contactsAPI } from '../services/api';
import '../styles/Management.css';
import '../styles/Dashboard.css';

const BackendDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalInvoices: 0,
    totalProducts: 0,
    totalContacts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, invoices, products, contacts] = await Promise.all([
          saleOrdersAPI.getAll(),
          customerInvoicesAPI.getAll(),
          productsAPI.getAll(),
          contactsAPI.getAll()
        ]);

        setStats({
          totalOrders: orders.data.length,
          totalInvoices: invoices.data.length,
          totalProducts: products.data.length,
          totalContacts: contacts.data.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <BrandLoader message="Loading dashboard..." />;
  }

  const statCards = [
    {
      label: 'Sale Orders',
      value: stats.totalOrders,
      description: 'Track website orders, fulfillment status, and invoice conversion.',
      link: '/backend/orders',
      action: 'Open orders',
      icon: <FiShoppingBag />,
      tone: 'primary'
    },
    {
      label: 'Invoices',
      value: stats.totalInvoices,
      description: 'Review customer invoices and keep billing flows tidy.',
      link: '/backend/invoices',
      action: 'View invoices',
      icon: <FiFileText />,
      tone: 'soft'
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      description: 'Manage published inventory, stock counts, and pricing.',
      link: '/backend/products',
      action: 'Manage products',
      icon: <FiBox />,
      tone: 'neutral'
    },
    {
      label: 'Contacts',
      value: stats.totalContacts,
      description: 'Customer and vendor contacts stored in the Flask database.',
      link: '/backend/settings',
      action: 'Check settings',
      icon: <FiUsers />,
      tone: 'neutral'
    }
  ];

  const quickLinks = [
    {
      title: 'Products',
      copy: 'Add, edit, and publish inventory records.',
      link: '/backend/products',
      icon: <FiBox />
    },
    {
      title: 'Sale Orders',
      copy: 'Review incoming orders and create invoices.',
      link: '/backend/orders',
      icon: <FiShoppingBag />
    },
    {
      title: 'Reports',
      copy: 'Switch between sales and purchase reporting views.',
      link: '/backend/reports',
      icon: <FiLayers />
    },
    {
      title: 'Settings',
      copy: 'Configure invoice automation and admin behavior.',
      link: '/backend/settings',
      icon: <FiSettings />
    }
  ];

  const systemNotes = [
    {
      label: 'API',
      value: 'Flask live',
      icon: <FiActivity />
    },
    {
      label: 'Storage',
      value: 'SQLite synced',
      icon: <FiDatabase />
    },
    {
      label: 'Auth',
      value: 'JWT + Google',
      icon: <FiShield />
    }
  ];

      return (
    <div className="backend-shell">
      <div className="backend-frame dashboard-container">
        <section className="dashboard-top-grid">
          <article className="dashboard-intro-card">
            <div className="backend-hero-copy">
              <p className="backend-kicker">Admin workspace</p>
              <h1>Backend Dashboard</h1>
              <p className="backend-subtitle">
                Manage your catalog, orders, invoices, and reporting from the same
                visual system as the storefront.
              </p>

              <div className="dashboard-action-row">
                <Link to="/backend/products" className="dashboard-primary-link">
                  <span>Manage catalog</span>
                  <FiArrowRight />
                </Link>
                <Link to="/backend/orders" className="dashboard-secondary-link">
                  <span>Review orders</span>
                  <FiArrowRight />
                </Link>
              </div>

              <div className="dashboard-note-row">
                {systemNotes.map((note) => (
                  <div key={note.label} className="dashboard-note-chip">
                    <span className="dashboard-note-icon">{note.icon}</span>
                    <div>
                      <small>{note.label}</small>
                      <strong>{note.value}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <aside className="dashboard-hero-card">
            <p className="backend-kicker">Overview</p>
            <div className="dashboard-preview-board">
              <article className="dashboard-preview-card dashboard-preview-card-large">
                <span>Orders in system</span>
                <strong>{stats.totalOrders}</strong>
                <small>Live sales flow across storefront and admin.</small>
              </article>

              <article className="dashboard-preview-card">
                <span>Invoices</span>
                <strong>{stats.totalInvoices}</strong>
              </article>

              <article className="dashboard-preview-card">
                <span>Products</span>
                <strong>{stats.totalProducts}</strong>
              </article>

              <article className="dashboard-preview-card dashboard-preview-card-accent dashboard-preview-card-wide">
                <span>Contacts</span>
                <strong>{stats.totalContacts}</strong>
                <small>Customer and vendor records in one place.</small>
              </article>
            </div>
          </aside>
        </section>

        <section className="stats-grid dashboard-stats-panel">
          {statCards.map((card) => (
            <article key={card.label} className={`stat-card stat-card-${card.tone}`}>
              <div className="stat-card-top">
                <span className="stat-card-icon">{card.icon}</span>
                <p>{card.label}</p>
              </div>
              <strong className="stat-number">{card.value}</strong>
              <p className="stat-copy">{card.description}</p>
              <Link to={card.link} className="stat-link">
                <span>{card.action}</span>
                <FiArrowRight />
              </Link>
            </article>
          ))}
        </section>

        <section className="quick-links">
          <div className="dashboard-section-head">
            <div>
              <p className="backend-kicker">Navigation</p>
              <h2>Control Center</h2>
              <p className="dashboard-section-copy">
                Jump into the parts of the backend you touch most often.
              </p>
            </div>
          </div>

          <div className="links-grid">
            {quickLinks.map((item) => (
              <Link key={item.title} to={item.link} className="link-card">
                <div className="link-card-main">
                  <span className="link-card-icon">{item.icon}</span>
                  <div className="link-card-copy">
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </div>
                <span className="link-card-action">
                  <span>Open</span>
                  <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BackendDashboard;

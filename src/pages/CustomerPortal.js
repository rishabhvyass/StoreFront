import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiLogOut,
  FiPackage,
  FiSave
} from 'react-icons/fi';
import BrandLoader from '../components/BrandLoader';
import { authAPI, saleOrdersAPI, customerInvoicesAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatCurrencyINR } from '../utils/currency';
import { formatPaymentMethod } from '../utils/payment';
import '../styles/CustomerPortal.css';

const VALID_TABS = ['profile', 'orders', 'invoices'];

const createProfileForm = (profile) => ({
  name: profile?.name || '',
  email: profile?.email || '',
  mobile: profile?.mobile || '',
  line1: profile?.address?.line1 || profile?.address?.street || '',
  city: profile?.address?.city || '',
  state: profile?.address?.state || '',
  pincode: profile?.address?.pincode || '',
  country: profile?.address?.country || '',
  password: '',
  confirmPassword: ''
});

const formatPrice = (value) => formatCurrencyINR(value);

const CustomerPortal = () => {
  const { user, logout, updateProfile } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(user);
  const [profileForm, setProfileForm] = useState(createProfileForm(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const activeTab = VALID_TABS.includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'profile';

  const portalInitials = useMemo(() => {
    const source = profileForm.name || profile?.name || 'User';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [profile, profileForm.name]);

  const formattedAddress = [
    profile?.address?.line1 || profile?.address?.street,
    profile?.address?.city,
    profile?.address?.state,
    profile?.address?.pincode,
    profile?.address?.country
  ]
    .filter(Boolean)
    .join(', ');

  const switchTab = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchPortalData = async () => {
      try {
        const [ordersResponse, invoicesResponse, profileResponse] = await Promise.all([
          saleOrdersAPI.getAll(),
          customerInvoicesAPI.getAll(),
          authAPI.getProfile()
        ]);

        setOrders(ordersResponse.data);
        setInvoices(invoicesResponse.data);
        setProfile(profileResponse.data.user);
        setProfileForm(createProfileForm(profileResponse.data.user));
      } catch (fetchError) {
        console.error('Error fetching portal data:', fetchError);
        setError('Unable to load your account details right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [user]);

  const handleProfileChange = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (profileForm.password && profileForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (profileForm.password !== profileForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      mobile: profileForm.mobile.trim(),
      address: {
        line1: profileForm.line1.trim(),
        city: profileForm.city.trim(),
        state: profileForm.state.trim(),
        pincode: profileForm.pincode.trim(),
        country: profileForm.country.trim()
      }
    };

    if (profileForm.password) {
      payload.password = profileForm.password;
    }

    setSaving(true);
    const result = await updateProfile(payload);
    setSaving(false);

    if (result.success) {
      setProfile(result.user);
      setProfileForm(createProfileForm(result.user));
      setSuccessMessage('Profile updated successfully.');
    } else {
      setError(result.error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const downloadInvoice = (invoice) => {
    const invoiceText = `
INVOICE
Invoice Number: ${invoice.invoice_number}
Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Items:
${invoice.items.map(item => `
  Product: ${item.product_name || item.product_id}
  Quantity: ${item.quantity}
  Unit Price: ${formatPrice(item.unit_price)}
  Tax: ${item.tax_rate}%
`).join('')}

Subtotal: ${formatPrice(invoice.subtotal)}
Tax: ${formatPrice(invoice.tax_total)}
Discount: ${formatPrice(invoice.discount_amount)}
Total: ${formatPrice(invoice.total)}

Status: ${invoice.status}
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `invoice-${invoice.invoice_number}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <BrandLoader message="Loading your account..." />;
  }

  return (
    <div className="customer-portal-container">
      <div className="portal-header-card">
        <div>
          <p className="portal-kicker">Customer portal</p>
          <h1>My Account</h1>
          <p className="portal-subtitle">
            Update your profile, manage saved address details, review orders, and
            download invoices from one place.
          </p>
        </div>

        <div className="portal-header-actions">
          <button
            type="button"
            className="portal-secondary-button"
            onClick={() => switchTab('orders')}
          >
            <FiPackage />
            <span>My Orders</span>
          </button>
          <button
            type="button"
            className="portal-logout-button"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="tabs portal-tabs">
        <button
          className={activeTab === 'profile' ? 'tab active' : 'tab'}
          onClick={() => switchTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'orders' ? 'tab active' : 'tab'}
          onClick={() => switchTab('orders')}
        >
          My Orders
        </button>
        <button
          className={activeTab === 'invoices' ? 'tab active' : 'tab'}
          onClick={() => switchTab('invoices')}
        >
          My Invoices
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="portal-profile-grid">
          <aside className="portal-profile-summary">
            <div className="portal-avatar">{portalInitials || 'U'}</div>
            <h2>{profile?.name || 'Customer'}</h2>
            <p>{profile?.email || user?.email}</p>

            <div className="portal-summary-meta">
              <div>
                <span>Role</span>
                <strong>{profile?.role === 'internal' ? 'Internal' : 'Customer'}</strong>
              </div>
              <div>
                <span>Mobile</span>
                <strong>{profile?.mobile || 'Not added yet'}</strong>
              </div>
              <div>
                <span>Address</span>
                <strong>
                  {formattedAddress || 'Add your address details'}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="portal-secondary-button portal-full-button"
              onClick={() => switchTab('orders')}
            >
              <FiPackage />
              <span>View order history</span>
            </button>

            <button
              type="button"
              className="portal-logout-button portal-full-button"
              onClick={handleLogout}
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </aside>

          <form className="portal-profile-form-card" onSubmit={handleSaveProfile}>
            <div className="portal-form-heading">
              <div>
                <p className="portal-kicker">Profile details</p>
                <h2>Edit account information</h2>
              </div>
              <button
                type="submit"
                className="portal-primary-button"
                disabled={saving}
              >
                <FiSave />
                <span>{saving ? 'Saving...' : 'Save changes'}</span>
              </button>
            </div>

            {error && <div className="portal-alert portal-alert-error">{error}</div>}
            {successMessage && (
              <div className="portal-alert portal-alert-success">{successMessage}</div>
            )}

            <div className="portal-form-grid">
              <label className="portal-field portal-field-full">
                <span>Full Name</span>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                  required
                />
              </label>

              <label className="portal-field portal-field-full">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="portal-field portal-field-full">
                <span>Mobile</span>
                <input
                  type="tel"
                  name="mobile"
                  value={profileForm.mobile}
                  onChange={handleProfileChange}
                  placeholder="10 digit mobile number"
                />
              </label>

              <label className="portal-field portal-field-full">
                <span>Address Line</span>
                <input
                  type="text"
                  name="line1"
                  value={profileForm.line1}
                  onChange={handleProfileChange}
                  placeholder="Street, building, apartment"
                />
              </label>

              <label className="portal-field">
                <span>City</span>
                <input
                  type="text"
                  name="city"
                  value={profileForm.city}
                  onChange={handleProfileChange}
                  placeholder="City"
                />
              </label>

              <label className="portal-field">
                <span>State</span>
                <input
                  type="text"
                  name="state"
                  value={profileForm.state}
                  onChange={handleProfileChange}
                  placeholder="State"
                />
              </label>

              <label className="portal-field">
                <span>Pincode</span>
                <input
                  type="text"
                  name="pincode"
                  value={profileForm.pincode}
                  onChange={handleProfileChange}
                  placeholder="Pincode"
                />
              </label>

              <label className="portal-field">
                <span>Country</span>
                <input
                  type="text"
                  name="country"
                  value={profileForm.country}
                  onChange={handleProfileChange}
                  placeholder="Country"
                />
              </label>

              <label className="portal-field">
                <span>New Password</span>
                <input
                  type="password"
                  name="password"
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  placeholder="Leave blank to keep current password"
                />
              </label>

              <label className="portal-field">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profileForm.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="Confirm new password"
                />
              </label>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="portal-section-card">
          <div className="portal-section-heading">
            <div>
              <p className="portal-kicker">Purchases</p>
              <h2>My Orders</h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="portal-empty-copy">No orders found yet.</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>Order #{order.order_number}</h3>
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <p>Date: {new Date(order.order_date).toLocaleDateString()}</p>
                  <p>Payment Method: {formatPaymentMethod(order.payment_method)}</p>
                  <p>Total: {formatPrice(order.total)}</p>
                  {order.coupon_code && (
                    <p>Coupon Applied: {order.coupon_code}</p>
                  )}
                  <div className="order-items">
                    <h4>Items</h4>
                    {order.items.map((item, index) => (
                      <div key={`${order.id}-${index}`} className="order-item">
                        <span>{item.product_name || item.product_id}</span>
                        <span>Qty: {item.quantity}</span>
                        <span>Price: {formatPrice(item.unit_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="portal-section-card">
          <div className="portal-section-heading">
            <div>
              <p className="portal-kicker">Billing</p>
              <h2>My Invoices</h2>
            </div>
          </div>

          {invoices.length === 0 ? (
            <p className="portal-empty-copy">No invoices found yet.</p>
          ) : (
            <div className="invoices-list">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="invoice-card">
                  <div className="invoice-header">
                    <h3>Invoice #{invoice.invoice_number}</h3>
                    <span className={`status-badge ${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                  <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
                  <p>Payment Method: {formatPaymentMethod(invoice.payment_method)}</p>
                  <p>Total: {formatPrice(invoice.total)}</p>
                  <div className="invoice-actions">
                    <button
                      className="portal-primary-button"
                      onClick={() => downloadInvoice(invoice)}
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;

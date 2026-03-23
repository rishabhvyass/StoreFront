import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiFacebook,
  FiHash,
  FiInstagram,
  FiPackage,
  FiShield,
  FiTwitter
} from 'react-icons/fi';
import { SiRazorpay } from 'react-icons/si';
import BrandLoader from '../components/BrandLoader';
import { saleOrdersAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';
import { formatPaymentMethod } from '../utils/payment';
import '../styles/CheckoutSuccess.css';

const formatPrice = (value) => formatCurrencyINR(value);

const formatDate = (value) => {
  if (!value) {
    return 'Today';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getItemCount = (items = []) =>
  items.reduce((count, item) => count + Number(item.quantity || 0), 0);

const CheckoutSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await saleOrdersAPI.getAll();
        const foundOrder = response.data.find((entry) => entry.id === orderId);
        setOrder(foundOrder || null);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="success-shell">
        <div className="success-frame">
          <section className="success-loading-panel">
            <BrandLoader message="Preparing your confirmation..." compact />
          </section>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="success-shell">
        <div className="success-frame">
          <section className="success-missing-panel">
            <div className="success-check-badge">
              <FiPackage />
            </div>
            <p className="success-kicker">Order status</p>
            <h1>We could not find that order</h1>
            <p>
              The confirmation details are unavailable right now. You can head back to the
              shop or open your portal to review recent orders.
            </p>
            <div className="success-action-row">
              <Link to="/customer-portal?tab=orders" className="success-primary-link">
                View my orders
              </Link>
              <Link to="/shop" className="success-secondary-link">
                Continue shopping
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const itemCount = getItemCount(order.items);

  return (
    <div className="success-shell">
      <div className="success-frame">
        <section className="success-hero-section">
          <div className="success-hero-card">
            <div className="success-copy-column">
              <div className="success-check-badge">
                <FiCheckCircle />
              </div>
              <p className="success-kicker">Order confirmed</p>
              <h1>Order Placed Successfully!</h1>
              <p className="success-lead">
                Thank you for shopping with us. Your order is in and our team is already
                preparing it for dispatch.
              </p>

              <div className="success-chip-row">
                <div className="success-chip">
                  <FiPackage />
                  <span>{itemCount} item{itemCount === 1 ? '' : 's'}</span>
                </div>
                <div className="success-chip">
                  <FiClock />
                  <span>{formatDate(order.order_date)}</span>
                </div>
                {order.payment_method === 'razorpay' && order.payment_verified_at && (
                  <div className="success-chip">
                    <FiShield />
                    <span>Payment verified by Razorpay</span>
                  </div>
                )}
              </div>

              <div className="success-action-row">
                <Link to="/customer-portal?tab=orders" className="success-primary-link">
                  View my orders
                </Link>
                <Link to="/shop" className="success-secondary-link">
                  Keep shopping
                </Link>
              </div>
            </div>

            <aside className="success-summary-card">
              <p className="success-summary-label">Order summary</p>

              <div className="success-summary-list">
                <div className="success-summary-row">
                  <span>Order number</span>
                  <strong>{order.order_number}</strong>
                </div>
                <div className="success-summary-row">
                  <span>Status</span>
                  <strong>{order.status || 'Confirmed'}</strong>
                </div>
                <div className="success-summary-row">
                  <span>Order ID</span>
                  <strong className="success-summary-code">{order.id}</strong>
                </div>
                <div className="success-summary-row">
                  <span>Payment method</span>
                  <strong>{formatPaymentMethod(order.payment_method)}</strong>
                </div>
                {order.payment_gateway && (
                  <div className="success-summary-row">
                    <span>Gateway</span>
                    <strong>{order.payment_gateway}</strong>
                  </div>
                )}
                {order.razorpay_order_id && (
                  <div className="success-summary-row">
                    <span>Razorpay order</span>
                    <strong className="success-summary-code">{order.razorpay_order_id}</strong>
                  </div>
                )}
                {order.razorpay_payment_id && (
                  <div className="success-summary-row">
                    <span>Payment ID</span>
                    <strong className="success-summary-code">{order.razorpay_payment_id}</strong>
                  </div>
                )}
                <div className="success-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatPrice(order.subtotal)}</strong>
                </div>
                <div className="success-summary-row">
                  <span>Tax</span>
                  <strong>{formatPrice(order.tax_total)}</strong>
                </div>
                {Number(order.discount_amount || 0) > 0 && (
                  <div className="success-summary-row">
                    <span>Discount</span>
                    <strong>-{formatPrice(order.discount_amount)}</strong>
                  </div>
                )}
                <div className="success-summary-row success-total-row">
                  <span>Total</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>

              {order.coupon_code && (
                <p className="success-summary-note">
                  Promo applied:
                  {' '}
                  {order.coupon_code}
                </p>
              )}
            </aside>
          </div>
        </section>

        <section className="success-detail-grid">
          <article className="success-info-card">
            <p className="success-panel-kicker">Next steps</p>
            <h2>What happens now</h2>
            <div className="success-steps">
              <div className="success-step">
                <span>01</span>
                <div>
                  <h3>Order review</h3>
                  <p>We are checking stock and packaging your products for shipment.</p>
                </div>
              </div>
              <div className="success-step">
                <span>02</span>
                <div>
                  <h3>Dispatch update</h3>
                  <p>You will see shipping progress in your customer portal after fulfillment.</p>
                </div>
              </div>
              <div className="success-step">
                <span>03</span>
                <div>
                  <h3>Need changes?</h3>
                  <p>Contact support if you need help with billing, address updates, or questions.</p>
                </div>
              </div>
            </div>
          </article>

          <article className="success-info-card success-support-card">
            <p className="success-panel-kicker">Need anything else?</p>
            <h2>We are here to help</h2>
            <p className="success-support-copy">
              Keep browsing or jump into your portal if you want to review invoices, orders,
              and account details in one place.
            </p>

            <div className="success-support-links">
              <Link to="/customer-portal?tab=profile">
                Open customer portal
                <FiArrowRight />
              </Link>
              <Link to="/contact">
                Contact support
                <FiArrowRight />
              </Link>
            </div>
          </article>

          {order.payment_method === 'razorpay' && (order.razorpay_order_id || order.razorpay_payment_id) && (
            <article className="success-info-card success-reference-card">
              <p className="success-panel-kicker">Payment references</p>
              <h2>Saved for your records</h2>
              <div className="success-reference-list">
                <div className="success-reference-row">
                  <span className="success-reference-icon">
                    <SiRazorpay />
                  </span>
                  <div>
                    <p>Gateway</p>
                    <strong>Razorpay Test Mode</strong>
                  </div>
                </div>
                {order.razorpay_order_id && (
                  <div className="success-reference-row">
                    <span className="success-reference-icon">
                      <FiHash />
                    </span>
                    <div>
                      <p>Razorpay order ID</p>
                      <strong>{order.razorpay_order_id}</strong>
                    </div>
                  </div>
                )}
                {order.razorpay_payment_id && (
                  <div className="success-reference-row">
                    <span className="success-reference-icon">
                      <FiShield />
                    </span>
                    <div>
                      <p>Razorpay payment ID</p>
                      <strong>{order.razorpay_payment_id}</strong>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}
        </section>

        <div className="success-newsletter-bar">
          <p>Join our newsletter for launch offers.</p>
          <form
            className="success-newsletter-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <footer className="success-footer">
          <div className="success-footer-brand">
            <h3>ShopFront</h3>
            <div className="success-footer-socials">
              <a href="https://facebook.com" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a href="https://twitter.com" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="https://instagram.com" aria-label="Instagram">
                <FiInstagram />
              </a>
            </div>
          </div>

          <div className="success-footer-links">
            <div>
              <h4>Help</h4>
              <Link to="/shop">FAQ</Link>
              <Link to="/shop">Customer Service</Link>
              <Link to="/shop">How-to guides</Link>
            </div>
            <div>
              <h4>Support</h4>
              <Link to="/contact">Privacy Policy</Link>
              <Link to="/contact">Sitemap</Link>
              <Link to="/contact">Subscriptions</Link>
            </div>
            <div>
              <h4>Contact us</h4>
              <Link to="/contact">support@shopfront</Link>
              <Link to="/contact">+1 (800) 555-0123</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

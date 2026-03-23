import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCreditCard,
  FiFacebook,
  FiInstagram,
  FiShield,
  FiTruck,
  FiTrash2,
  FiTwitter
} from 'react-icons/fi';
import { SiRazorpay } from 'react-icons/si';
import { useApp } from '../context/AppContext';
import { paymentTermsAPI, couponCodesAPI, paymentsAPI, saleOrdersAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';
import { CHECKOUT_PAYMENT_OPTIONS, formatPaymentMethod } from '../utils/payment';
import '../styles/Cart.css';

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
let razorpayScriptPromise;
const PAYMENT_OPTION_META = {
  razorpay: {
    title: 'Razorpay',
    description: 'UPI, cards, wallets, and net banking in one secure popup.',
    icon: SiRazorpay
  },
  cod: {
    title: 'Cash on Delivery',
    description: 'Pay when your order reaches you. Best for offline checkout.',
    icon: FiTruck
  }
};

const getItemName = (item) => item.product_name || item.name || 'Product';

const getItemSubtitle = (item) => item.brand || item.category || 'ShopFront Studio';

const getItemImage = (item) => {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }

  if (typeof item.image === 'string' && item.image.trim()) {
    return item.image;
  }

  return 'https://via.placeholder.com/160x160/f1f1f1/8f8f8f?text=Item';
};

const formatPrice = (value) => formatCurrencyINR(value);

const loadRazorpayCheckout = async () => {
  if (window.Razorpay) {
    return true;
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, clearCart, user } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const tax = cart.reduce((sum, item) => {
    const itemTotal = (item.sales_price || item.price || 0) * item.quantity;
    return sum + (itemTotal * (item.sales_tax || 0) / 100);
  }, 0);
  const discount = appliedCoupon ? subtotal * (appliedCoupon.discountOffer.discount_percentage / 100) : 0;
  const total = subtotal + tax - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a valid promo code.');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      const response = await couponCodesAPI.validate({
        code: couponCode,
        contact_id: user.contact_id || user.id
      });

      if (response.data.valid) {
        setAppliedCoupon({
          code: couponCode,
          discountOffer: response.data.discountOffer
        });
      }
    } catch (error) {
      setCouponError(error.response?.data?.error || 'Invalid promo code');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError('');

    try {
      const paymentTermsResponse = await paymentTermsAPI.getAll();
      const immediatePaymentTerm = paymentTermsResponse.data.find(
        (paymentTerm) => paymentTerm.name === 'Immediate Payment'
      ) || paymentTermsResponse.data[0];

      if (!immediatePaymentTerm) {
        setCheckoutError('Payment settings are unavailable right now. Please try again.');
        return;
      }

      const items = cart.map((item) => ({
        product_id: item.id,
        external_id: item.external_id || null,
        external_source: item.external_source || null,
        product_name: getItemName(item),
        product_category: item.product_category || item.category || null,
        brand: item.brand || null,
        image_url: getItemImage(item),
        quantity: item.quantity,
        unit_price: item.sales_price || item.price || 0,
        tax_rate: item.sales_tax || 0
      }));

      const checkoutPayload = {
        customer_id: user.contact_id || user.id,
        payment_term_id: immediatePaymentTerm.id,
        items,
        coupon_code: appliedCoupon?.code || null
      };

      if (selectedPaymentMethod === 'cod') {
        const orderResponse = await saleOrdersAPI.create({
          ...checkoutPayload,
          payment_method: 'cod'
        });

        clearCart();
        handleRemoveCoupon();
        navigate(`/checkout/success/${orderResponse.data.id}`);
        return;
      }

      const isRazorpayLoaded = await loadRazorpayCheckout();
      if (!isRazorpayLoaded || !window.Razorpay) {
        setCheckoutError('Razorpay checkout could not load. Please refresh and try again.');
        return;
      }

      const orderResponse = await paymentsAPI.createRazorpayOrder(checkoutPayload);
      const razorpayOrder = orderResponse.data;

      const paymentResult = await new Promise((resolve, reject) => {
        let settled = false;

        const rejectWithCleanup = (message, shouldCancel = false) => {
          if (settled) {
            return;
          }

          settled = true;

          if (shouldCancel && razorpayOrder.local_order_id) {
            paymentsAPI.cancelRazorpayOrder({
              local_order_id: razorpayOrder.local_order_id
            }).catch(() => {});
          }

          reject(new Error(message));
        };

        const razorpay = new window.Razorpay({
          key: razorpayOrder.key_id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: razorpayOrder.company_name || 'ShopFront',
          description: razorpayOrder.description || 'Secure online payment',
          order_id: razorpayOrder.razorpay_order_id,
          prefill: razorpayOrder.prefill || {},
          notes: razorpayOrder.notes || {},
          theme: {
            color: '#8d24f1'
          },
          modal: {
            ondismiss: () => rejectWithCleanup('Razorpay checkout was cancelled.', true)
          },
          handler: (response) => {
            if (settled) {
              return;
            }

            settled = true;
            resolve(response);
          }
        });

        razorpay.on('payment.failed', (event) => {
          rejectWithCleanup(
            event.error?.description || 'Razorpay payment failed. Please try again.',
            true
          );
        });

        razorpay.open();
      });

      const verifyResponse = await paymentsAPI.verifyRazorpayPayment({
        local_order_id: razorpayOrder.local_order_id,
        ...paymentResult
      });

      clearCart();
      handleRemoveCoupon();
      navigate(`/checkout/success/${verifyResponse.data.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setCheckoutError(
        error.response?.data?.error || error.message || 'Error processing order. Please try again.'
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-shell">
        <div className="cart-frame">
          <div className="cart-empty-panel">
            <p className="cart-empty-kicker">Your Cart</p>
            <h1>Your cart is empty</h1>
            <p>Looks like you have not added anything yet. Let&apos;s head back to the shop.</p>
            <button className="cart-primary-button" onClick={() => navigate('/shop')}>
              Continue shopping
            </button>
          </div>

          <div className="cart-newsletter-bar">
            <p>Join our newsletter for launch offers.</p>
            <form
              className="cart-newsletter-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>

          <footer className="cart-footer">
            <div className="cart-footer-brand">
              <h3>ShopFront</h3>
              <div className="cart-footer-socials">
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

            <div className="cart-footer-links">
              <div>
                <h4>Help</h4>
                <a href="/shop">FAQ</a>
                <a href="/shop">Customer Service</a>
                <a href="/shop">How-to guides</a>
              </div>
              <div>
                <h4>Support</h4>
                <a href="/contact">Privacy Policy</a>
                <a href="/contact">Sitemap</a>
                <a href="/contact">Subscriptions</a>
              </div>
              <div>
                <h4>Contact us</h4>
                <a href="/contact">support@shopfront</a>
                <a href="/contact">+1 (800) 555-0123</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-shell">
      <div className="cart-frame">
        <div className="cart-main-grid">
          <section className="cart-items-panel">
            <button className="cart-continue-link" onClick={() => navigate('/shop')}>
              <FiArrowLeft />
              <span>Continue shopping</span>
            </button>

            <h1 className="cart-page-title">Your Cart</h1>

            <div className="cart-item-list">
              {cart.map((item) => {
                const unitPrice = item.sales_price || item.price || 0;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <article key={item.id} className="cart-line-item">
                    <div className="cart-line-media">
                      <img src={getItemImage(item)} alt={getItemName(item)} />
                    </div>

                    <div className="cart-line-body">
                      <div className="cart-line-head">
                        <div>
                          <h2>{getItemName(item)}</h2>
                          <p>{getItemSubtitle(item)}</p>
                        </div>

                        <button
                          className="cart-remove-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <span>Remove</span>
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="cart-line-footer">
                        <div className="cart-price-block">
                          <strong>{formatPrice(lineTotal)}</strong>
                          {item.quantity > 1 && <span>{formatCurrencyINR(unitPrice)} each</span>}
                        </div>

                        <label className="cart-qty-field">
                          <span>Qty</span>
                          <select
                            value={item.quantity}
                            onChange={(event) => updateCartQuantity(item.id, Number(event.target.value))}
                          >
                            {QUANTITY_OPTIONS.map((quantity) => (
                              <option key={quantity} value={quantity}>
                                {quantity}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="cart-summary-panel">
            <div className="cart-summary-card">
              <h2>Your Cart</h2>

              <div className="cart-summary-list">
                {cart.map((item) => {
                  const unitPrice = item.sales_price || item.price || 0;

                  return (
                    <div key={`summary-${item.id}`} className="cart-summary-line">
                      <span>
                        {item.quantity}
                        {'x '}
                        {getItemName(item)}
                      </span>
                      <strong>{formatPrice(unitPrice * item.quantity)}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="cart-promo-block">
                <div className="cart-promo-row">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  <button
                    type="button"
                    onClick={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
                    disabled={isApplyingCoupon}
                  >
                    {isApplyingCoupon ? '...' : appliedCoupon ? 'Remove' : 'Apply'}
                  </button>
                </div>

                {couponError && <p className="cart-status-text cart-status-error">{couponError}</p>}
                {appliedCoupon && (
                  <p className="cart-status-text cart-status-success">
                    {appliedCoupon.code} applied for {appliedCoupon.discountOffer.discount_percentage}% off
                  </p>
                )}
              </div>

              <div className="cart-payment-block">
                <p className="cart-payment-title">Payment method</p>
                <div className="cart-payment-grid">
                  {CHECKOUT_PAYMENT_OPTIONS.map((option) => {
                    const Icon = PAYMENT_OPTION_META[option.value]?.icon || FiCreditCard;

                    return (
                    <button
                      key={option.value}
                      type="button"
                      className={`cart-payment-option ${
                        selectedPaymentMethod === option.value ? 'active' : ''
                      }`}
                      onClick={() => setSelectedPaymentMethod(option.value)}
                    >
                      <span className="cart-payment-option-icon">
                        <Icon />
                      </span>
                      <span className="cart-payment-option-copy">
                        <strong>{PAYMENT_OPTION_META[option.value]?.title || option.label}</strong>
                        <small>{PAYMENT_OPTION_META[option.value]?.description || option.label}</small>
                      </span>
                    </button>
                    );
                  })}
                </div>
                <p className="cart-status-text">
                  Selected: {formatPaymentMethod(selectedPaymentMethod)}
                </p>
                <p className="cart-payment-help">
                  <FiShield />
                  <span>
                    {selectedPaymentMethod === 'razorpay'
                      ? 'You will complete the payment in Razorpay’s secure checkout window.'
                      : 'You can place the order now and pay the courier at delivery.'}
                  </span>
                </p>
              </div>

              {(tax > 0 || discount > 0) && (
                <div className="cart-summary-meta">
                  {discount > 0 && (
                    <div className="cart-summary-line cart-summary-meta-row">
                      <span>Discount</span>
                      <strong>-{formatPrice(discount)}</strong>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="cart-summary-line cart-summary-meta-row">
                      <span>Estimated tax</span>
                      <strong>{formatPrice(tax)}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="cart-total-row">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <button
                className="cart-checkout-button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut
                  ? 'Processing...'
                  : selectedPaymentMethod === 'cod'
                    ? 'Place COD Order'
                    : 'Pay with Razorpay'}
              </button>

              {checkoutError && (
                <p className="cart-status-text cart-status-error cart-checkout-error">
                  {checkoutError}
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className="cart-newsletter-bar">
          <p>Join our newsletter for launch offers.</p>
          <form
            className="cart-newsletter-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <footer className="cart-footer">
          <div className="cart-footer-brand">
            <h3>ShopFront</h3>
            <div className="cart-footer-socials">
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

          <div className="cart-footer-links">
            <div>
              <h4>Help</h4>
              <a href="/shop">FAQ</a>
              <a href="/shop">Customer Service</a>
              <a href="/shop">How-to guides</a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="/contact">Privacy Policy</a>
              <a href="/contact">Sitemap</a>
              <a href="/contact">Subscriptions</a>
            </div>
            <div>
              <h4>Contact us</h4>
              <a href="/contact">support@shopfront</a>
              <a href="/contact">+1 (800) 555-0123</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Cart;

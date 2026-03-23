import React, { useState } from 'react';
import './Checkout.css';

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [promoCode, setPromoCode] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiration: '',
    cvc: '',
    name: ''
  });

  const cartItems = [
    {
      id: 1,
      name: 'Oversized Cotton Tee',
      color: 'White',
      size: 'M',
      price: 45.00,
      quantity: 1,
      image: '/api/placeholder/80/80'
    },
    {
      id: 2,
      name: 'Slim Fit Denim',
      color: 'Blue',
      size: '32',
      price: 89.00,
      quantity: 1,
      image: '/api/placeholder/80/80'
    }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 0; // Free shipping
  const discount = promoCode.toLowerCase() === 'save20' ? subtotal * 0.2 : 0;
  const total = subtotal + shipping - discount;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleCardDetailsChange = (field, value) => {
    setCardDetails({
      ...cardDetails,
      [field]: value
    });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiration = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="checkout">
      {/* Header */}
      <header className="checkout-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon"></div>
            <span>ApparelDesk</span>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <input type="text" placeholder="Search for products, brands and more..." />
              <div className="search-icon"></div>
            </div>
            <div className="user-icon"></div>
            <div className="cart-icon">
              <div className="notification-dot"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <span>Home</span> &gt; <span>Shopping Bag</span> &gt; <span>Checkout</span>
      </div>

      <div className="checkout-container">
        <div className="checkout-main">
          {/* Shopping Bag Section */}
          <section className="shopping-bag">
            <h2>Shopping Bag</h2>
            <div className="bag-items">
              {cartItems.map((item) => (
                <div key={item.id} className="bag-item">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p>Color: {item.color}</p>
                    <p>Size: {item.size}</p>
                    <p className="item-price">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="item-quantity">
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Method Section */}
          <section className="payment-method">
            <h2>Payment Method</h2>
            <div className="payment-options">
              <button
                className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodChange('card')}
              >
                Card
              </button>
              <button
                className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodChange('upi')}
              >
                UPI / Wallet
              </button>
              <button
                className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
                onClick={() => handlePaymentMethodChange('cod')}
              >
                COD
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="card-details">
                <div className="card-input-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) => handleCardDetailsChange('number', formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div className="card-row">
                  <div className="card-input-group">
                    <label>Expiration</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiration}
                      onChange={(e) => handleCardDetailsChange('expiration', formatExpiration(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="card-input-group">
                    <label>CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvc}
                      onChange={(e) => handleCardDetailsChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 3))}
                      maxLength={3}
                    />
                  </div>
                </div>
                <div className="card-input-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => handleCardDetailsChange('name', e.target.value)}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div className="upi-details">
                <div className="upi-input-group">
                  <label>UPI ID</label>
                  <input type="text" placeholder="yourname@upi" />
                </div>
                <div className="upi-apps">
                  <button className="upi-app gpay">GPay</button>
                  <button className="upi-app phonepe">PhonePe</button>
                  <button className="upi-app paytm">Paytm</button>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="cod-details">
                <p>Cash on Delivery available for orders above $500</p>
                <p>You will pay when the delivery arrives at your doorstep.</p>
              </div>
            )}
          </section>
        </div>

        {/* Order Summary */}
        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
          </div>
          {discount > 0 && (
            <div className="summary-line discount">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="promo-code">
            <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button className="apply-btn">Apply</button>
          </div>

          <button className="place-order-btn">Place Order</button>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;

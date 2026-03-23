import React from "react";

const AddCart = ({ cart, addToCart }) => {
  return (
    <div className="cart-section">
      <h2 className="cart-title">🛒 Shopping Cart</h2>
      {Array.isArray(cart) && cart.length > 0 ? (
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <h4 className="cart-item-title">{item.title}</h4>
                <p className="cart-item-brand">{item.brand}</p>
              </div>
              <div className="cart-item-details">
                <p className="cart-item-quantity">
                  Quantity: <strong>{item.quantity}</strong>
                </p>
                <p className="cart-item-price">
                  ${((item.price - item.price * (item.discountPercentage / 100)) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          <div className="cart-total">
            <h3>Total: ${cart.reduce((total, item) => {
              const discountedPrice = item.price - item.price * (item.discountPercentage / 100);
              return total + (discountedPrice * item.quantity);
            }, 0).toFixed(2)}</h3>
          </div>
        </div>
      ) : (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <p>Add some products to get started!</p>
        </div>
      )}
    </div>
  );
};

export default AddCart;

const PAYMENT_METHOD_LABELS = {
  razorpay: 'Online Payment (Razorpay)',
  upi: 'UPI',
  card: 'Debit / Credit Card',
  net_banking: 'Net Banking',
  cod: 'Cash on Delivery'
};

export const CHECKOUT_PAYMENT_OPTIONS = [
  { value: 'razorpay', label: PAYMENT_METHOD_LABELS.razorpay },
  { value: 'cod', label: PAYMENT_METHOD_LABELS.cod }
];

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const formatPaymentMethod = (value = 'razorpay') =>
  PAYMENT_METHOD_LABELS[value] || PAYMENT_METHOD_LABELS.razorpay;

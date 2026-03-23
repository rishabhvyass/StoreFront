const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export const formatCurrencyINR = (value) => INR_FORMATTER.format(Number(value || 0));


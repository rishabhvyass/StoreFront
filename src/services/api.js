import axios from 'axios';
import { getApiBaseUrl, withAppBase } from '../utils/appRuntime';

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const storefrontApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/google'].some((path) =>
      requestUrl.includes(path)
    );
    const hasToken = Boolean(localStorage.getItem('token'));
    const shouldRedirect =
      hasToken &&
      !isAuthRequest &&
      (error.response?.status === 401 || error.response?.status === 403);

    if (shouldRedirect) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        const loginPath = withAppBase('/login');
        const currentPath = window.location.pathname;
        if (currentPath !== loginPath) {
          window.location.assign(loginPath);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: async () => ({ data: { message: 'Logged out successfully' } })
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data)
};

// Contacts APIs
export const contactsAPI = {
  getAll: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data)
};

// Products APIs
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data)
};

export const catalogAPI = {
  getAll: () => storefrontApi.get('/products')
};

// Payment Terms APIs
export const paymentTermsAPI = {
  getAll: () => api.get('/payment-terms'),
  create: (data) => api.post('/payment-terms', data)
};

// Discount Offers APIs
export const discountOffersAPI = {
  getAll: () => api.get('/discount-offers'),
  create: (data) => api.post('/discount-offers', data)
};

// Coupon Codes APIs
export const couponCodesAPI = {
  getAll: () => api.get('/coupon-codes'),
  create: (data) => api.post('/coupon-codes', data),
  validate: (data) => api.post('/coupon-codes/validate', data)
};

// Sale Orders APIs
export const saleOrdersAPI = {
  getAll: () => api.get('/sale-orders'),
  create: (data) => api.post('/sale-orders', data)
};

// Customer Invoices APIs
export const customerInvoicesAPI = {
  getAll: () => api.get('/customer-invoices'),
  create: (data) => api.post('/customer-invoices', data)
};

// Purchase Orders APIs
export const purchaseOrdersAPI = {
  getAll: () => api.get('/purchase-orders'),
  create: (data) => api.post('/purchase-orders', data)
};

// Vendor Bills APIs
export const vendorBillsAPI = {
  getAll: () => api.get('/vendor-bills'),
  create: (data) => api.post('/vendor-bills', data)
};

// Payments APIs
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  create: (data) => api.post('/payments', data),
  createRazorpayOrder: (data) => api.post('/payments/razorpay/order', data),
  verifyRazorpayPayment: (data) => api.post('/payments/razorpay/verify', data),
  cancelRazorpayOrder: (data) => api.post('/payments/razorpay/cancel', data)
};

// Reports APIs
export const reportsAPI = {
  salesByProducts: (params) => api.get('/reports/sales-by-products', { params }),
  purchaseByProducts: (params) => api.get('/reports/purchase-by-products', { params }),
  salesByCustomers: (params) => api.get('/reports/sales-by-customers', { params }),
  purchaseByVendors: (params) => api.get('/reports/purchase-by-vendors', { params })
};

// Settings APIs
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export default api;

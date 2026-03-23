import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPackage, FiUserPlus } from 'react-icons/fi';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useApp } from '../context/AppContext';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const { register, authenticateWithGoogle, loading } = useApp();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });

    if (errors[event.target.name]) {
      setErrors({
        ...errors,
        [event.target.name]: ''
      });
    }
  };

  const handleGoogleSignup = async (credential) => {
    setError('');
    const result = await authenticateWithGoogle(credential);
    if (result.success) {
      navigate(result.user?.role === 'internal' ? '/backend' : '/');
    } else {
      setError(result.error);
    }
    return result;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password
    };

    const result = await register(userData);
    if (result.success) {
      navigate(result.user?.role === 'internal' ? '/backend' : '/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-frame auth-frame-wide">
        <div className="auth-layout">
          <section className="auth-showcase auth-showcase-register">
            <p className="auth-showcase-kicker">New customer</p>
            <h1>Create your storefront account.</h1>
            <p className="auth-showcase-copy">
              Register once to manage orders, save profile details later, and keep your
              shopping experience connected across the storefront.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <FiUserPlus />
                <span>Quick sign up with only the essentials</span>
              </div>
              <div className="auth-feature-item">
                <FiPackage />
                <span>Track placed orders from your portal after purchase</span>
              </div>
            </div>

            <div className="auth-support-card">
              <small>Already registered?</small>
              <strong>Login and continue</strong>
              <span>Your cart and order history stay connected to the same account.</span>
            </div>
          </section>

          <section className="auth-form-panel">
            <p className="auth-form-kicker">Sign up</p>
            <h2>Create Account</h2>
            <p className="auth-form-copy">
              Fill in the basics below and we&apos;ll create your customer portal access.
            </p>

            {error && <div className="auth-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form auth-form-grid">
              <label className="auth-field auth-field-full">
                <span>Full Name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
                {errors.name && <small className="error-text">{errors.name}</small>}
              </label>

              <label className="auth-field auth-field-full">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                {errors.email && <small className="error-text">{errors.email}</small>}
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
                {errors.password && <small className="error-text">{errors.password}</small>}
              </label>

              <label className="auth-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  minLength="6"
                  required
                />
                {errors.confirmPassword && (
                  <small className="error-text">{errors.confirmPassword}</small>
                )}
              </label>

              <button type="submit" className="auth-submit-button auth-field-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <GoogleAuthButton context="signup" onCredential={handleGoogleSignup} />

            <p className="auth-form-switch">
              Already have an account?
              {' '}
              <Link to="/login">Login here</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Register;

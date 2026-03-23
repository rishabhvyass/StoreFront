import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiShoppingBag } from 'react-icons/fi';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useApp } from '../context/AppContext';
import '../styles/Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, authenticateWithGoogle, loading } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate(result.user?.role === 'internal' ? '/backend' : '/');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setError('');
    const result = await authenticateWithGoogle(credential);
    if (result.success) {
      navigate(result.user?.role === 'internal' ? '/backend' : '/');
    } else {
      setError(result.error);
    }
    return result;
  };

  return (
    <div className="auth-shell">
      <div className="auth-frame auth-frame-compact">
        <div className="auth-layout">
          <section className="auth-showcase auth-showcase-login">
            <p className="auth-showcase-kicker">Welcome back</p>
            <h1>Sign in to continue shopping.</h1>
            <p className="auth-showcase-copy">
              Pick up where you left off, review orders, and move from cart to checkout
              in the same storefront flow.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature-item">
                <FiShoppingBag />
                <span>Saved cart and quick reorders</span>
              </div>
              <div className="auth-feature-item">
                <FiLock />
                <span>Secure account access for portal customers</span>
              </div>
              <div className="auth-feature-item">
                <FiShield />
                <span>Admin users are routed straight to the backend</span>
              </div>
            </div>

            <div className="auth-support-card">
              <small>Demo admin access</small>
              <strong>admin@appareldesk.local</strong>
              <span>password: admin123</span>
            </div>
          </section>

          <section className="auth-form-panel">
            <p className="auth-form-kicker">Login</p>
            <h2>Access your account</h2>
            <p className="auth-form-copy">
              Sign in to track purchases, manage invoices, and keep your checkout moving.
            </p>

            {error && <div className="auth-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button type="submit" className="auth-submit-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <GoogleAuthButton context="signin" onCredential={handleGoogleLogin} />

            <p className="auth-form-switch">
              Don&apos;t have an account?
              {' '}
              <Link to="/register">Create one here</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;

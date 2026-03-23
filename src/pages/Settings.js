import React, { useState, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';
import BrandLoader from '../components/BrandLoader';
import { settingsAPI } from '../services/api';
import '../styles/Management.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    automaticInvoicing: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  if (loading) {
    return <BrandLoader message="Loading settings..." />;
  }

  return (
    <div className="backend-shell">
      <div className="backend-frame management-container">
        <section className="management-header-card">
          <div>
            <p className="backend-kicker">Configuration</p>
            <h1>Settings</h1>
            <p className="backend-subtitle">
              Keep core admin behavior aligned with the storefront experience and your
              billing workflow.
            </p>
          </div>
        </section>

        <section className="settings-card">
          <div className="table-card-header">
            <div>
              <p className="backend-kicker">Billing preference</p>
              <h2>Invoice automation</h2>
            </div>
            <span className="settings-card-icon">
              <FiSettings />
            </span>
          </div>

          <div className="settings-toggle-row">
            <label className="form-checkbox">
              <input
                type="checkbox"
                name="automaticInvoicing"
                checked={settings.automaticInvoicing}
                onChange={handleChange}
              />
              <span>Automatic Invoicing</span>
            </label>
            <span className={`status-badge ${settings.automaticInvoicing ? 'paid' : 'draft'}`}>
              {settings.automaticInvoicing ? 'Enabled' : 'Manual'}
            </span>
          </div>

          <p className="form-help">
            When enabled, customer invoices are automatically created after successful
            website payments. When disabled, invoices must be created manually from sale
            orders in the backend.
          </p>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;

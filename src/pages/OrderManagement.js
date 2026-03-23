import React, { useState, useEffect } from 'react';
import { FiFileText, FiShoppingBag } from 'react-icons/fi';
import BrandLoader from '../components/BrandLoader';
import { saleOrdersAPI, customerInvoicesAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';
import { formatPaymentMethod } from '../utils/payment';
import '../styles/Management.css';

const OrderManagement = ({ initialTab = 'sale-orders' }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'sale-orders') {
          const response = await saleOrdersAPI.getAll();
          setOrders(response.data);
        } else {
          const response = await customerInvoicesAPI.getAll();
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const createInvoice = async (orderId) => {
    try {
      await customerInvoicesAPI.create({ sale_order_id: orderId });
      alert('Invoice created successfully');

      if (activeTab === 'sale-orders') {
        const response = await saleOrdersAPI.getAll();
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice');
    }
  };

  if (loading) {
    return <BrandLoader message="Loading orders..." />;
  }

  const draftCount = orders.filter((order) => order.status === 'draft').length;
  const paidCount = orders.filter((order) => order.status === 'paid').length;

  return (
    <div className="backend-shell">
      <div className="backend-frame management-container">
        <section className="management-header-card">
          <div>
            <p className="backend-kicker">Operations</p>
            <h1>Order Management</h1>
            <p className="backend-subtitle">
              Switch between sale orders and customer invoices without leaving the
              current admin flow.
            </p>
          </div>

          <div className="management-tabs">
            <button
              className={activeTab === 'sale-orders' ? 'tab active' : 'tab'}
              onClick={() => {
                setActiveTab('sale-orders');
                setLoading(true);
              }}
            >
              Sale Orders
            </button>
            <button
              className={activeTab === 'invoices' ? 'tab active' : 'tab'}
              onClick={() => {
                setActiveTab('invoices');
                setLoading(true);
              }}
            >
              Customer Invoices
            </button>
          </div>
        </section>

        <section className="management-overview-grid">
          <article className="overview-card">
            <p>{activeTab === 'sale-orders' ? 'Sale orders' : 'Invoices'}</p>
            <strong>{orders.length}</strong>
          </article>
          <article className="overview-card">
            <p>Draft / open</p>
            <strong>{draftCount}</strong>
          </article>
          <article className="overview-card">
            <p>Paid</p>
            <strong>{paidCount}</strong>
          </article>
        </section>

        <section className="table-card">
          <div className="table-card-header">
            <div>
              <p className="backend-kicker">Records</p>
              <h2>{activeTab === 'sale-orders' ? 'Sale orders' : 'Customer invoices'}</h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              {activeTab === 'sale-orders' ? <FiShoppingBag /> : <FiFileText />}
              <p>No {activeTab === 'sale-orders' ? 'orders' : 'invoices'} found yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{activeTab === 'sale-orders' ? 'Order Number' : 'Invoice Number'}</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number || order.invoice_number}</td>
                      <td>{order.customer_id}</td>
                      <td>{new Date(order.order_date || order.invoice_date).toLocaleDateString()}</td>
                      <td>{formatPaymentMethod(order.payment_method)}</td>
                      <td>{formatCurrencyINR(order.total)}</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-row">
                          {activeTab === 'sale-orders' && !order.invoice_id && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => createInvoice(order.id)}
                            >
                              Create Invoice
                            </button>
                          )}
                          {activeTab === 'invoices' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => alert('View invoice details')}
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OrderManagement;

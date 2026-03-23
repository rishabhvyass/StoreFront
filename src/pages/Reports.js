import React, { useState, useEffect } from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import BrandLoader from '../components/BrandLoader';
import { reportsAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';
import '../styles/Management.css';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales-products');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (!dateRange.start_date || !dateRange.end_date) {
      setData([]);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      try {
        let response;
        const params = {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date
        };

        switch (activeReport) {
          case 'sales-products':
            response = await reportsAPI.salesByProducts(params);
            break;
          case 'purchase-products':
            response = await reportsAPI.purchaseByProducts(params);
            break;
          case 'sales-customers':
            response = await reportsAPI.salesByCustomers(params);
            break;
          case 'purchase-vendors':
            response = await reportsAPI.purchaseByVendors(params);
            break;
          default:
            return;
        }

        setData(response.data);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [activeReport, dateRange]);

  const getReportColumns = () => {
    switch (activeReport) {
      case 'sales-products':
        return ['Product Name', 'Sold Quantity', 'Total Received Amount'];
      case 'purchase-products':
        return ['Product Name', 'Purchased Quantity', 'Total Paid Amount'];
      case 'sales-customers':
        return ['Customer Name', 'Total Orders', 'Paid Amount', 'Unpaid Amount'];
      case 'purchase-vendors':
        return ['Vendor Name', 'Total Orders', 'Paid Amount', 'Unpaid Amount'];
      default:
        return [];
    }
  };

  const getReportTitle = () => {
    switch (activeReport) {
      case 'sales-products':
        return 'Sales Report by Products';
      case 'purchase-products':
        return 'Purchase Report by Products';
      case 'sales-customers':
        return 'Sales Report by Customers';
      case 'purchase-vendors':
        return 'Purchase Report by Vendors';
      default:
        return 'Report';
    }
  };

  const isCurrencyColumn = (columnIndex) => {
    switch (activeReport) {
      case 'sales-products':
      case 'purchase-products':
        return columnIndex === 2;
      case 'sales-customers':
      case 'purchase-vendors':
        return columnIndex === 2 || columnIndex === 3;
      default:
        return false;
    }
  };

  return (
    <div className="backend-shell">
      <div className="backend-frame management-container">
        <section className="management-header-card">
          <div>
            <p className="backend-kicker">Analytics</p>
            <h1>Reports</h1>
            <p className="backend-subtitle">
              Compare sales and purchase activity with the same clean UI language as
              the storefront.
            </p>
          </div>
        </section>

        <section className="report-filter-card">
          <div className="table-card-header">
            <div>
              <p className="backend-kicker">Filters</p>
              <h2>Choose date range and report type</h2>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="management-tabs report-tabs">
            <button
              className={activeReport === 'sales-products' ? 'tab active' : 'tab'}
              onClick={() => setActiveReport('sales-products')}
            >
              Sales by Products
            </button>
            <button
              className={activeReport === 'purchase-products' ? 'tab active' : 'tab'}
              onClick={() => setActiveReport('purchase-products')}
            >
              Purchase by Products
            </button>
            <button
              className={activeReport === 'sales-customers' ? 'tab active' : 'tab'}
              onClick={() => setActiveReport('sales-customers')}
            >
              Sales by Customers
            </button>
            <button
              className={activeReport === 'purchase-vendors' ? 'tab active' : 'tab'}
              onClick={() => setActiveReport('purchase-vendors')}
            >
              Purchase by Vendors
            </button>
          </div>
        </section>

        {loading ? (
          <BrandLoader message="Loading report..." compact />
        ) : (
          <section className="table-card">
            <div className="table-card-header">
              <div>
                <p className="backend-kicker">Output</p>
                <h2>{getReportTitle()}</h2>
              </div>
            </div>

            {data.length === 0 ? (
              <div className="empty-state">
                <FiBarChart2 />
                <p>No data available for the selected date range.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {getReportColumns().map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, i) => (
                          <td key={i}>
                            {isCurrencyColumn(i) ? formatCurrencyINR(value) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Reports;

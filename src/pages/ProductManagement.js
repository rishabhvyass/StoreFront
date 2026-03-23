import React, { useState, useEffect } from 'react';
import { FiBox, FiEdit3, FiImage, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import BrandLoader from '../components/BrandLoader';
import { productsAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';
import '../styles/Management.css';

const INITIAL_FORM_STATE = {
  product_name: '',
  product_category: 'men',
  product_type: '',
  material: '',
  colors: [],
  current_stock: 0,
  sales_price: 0,
  sales_tax: 0,
  purchase_price: 0,
  purchase_tax: 0,
  published: true,
  images: []
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not prepare the selected image.'));
    image.src = src;
  });

const prepareProductImage = async (file) => {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    return sourceDataUrl;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.86);
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setSaveError(
        error.response?.data?.error ||
        'Product service is unavailable right now. Please make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name === 'colors') {
      const colors = value.split(',').map(c => c.trim());
      setFormData({ ...formData, colors });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSaveError('Please choose an image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setSaveError('Please upload an image smaller than 8 MB.');
      return;
    }

    setIsUploadingImage(true);
    setSaveError('');

    try {
      const preparedImage = await prepareProductImage(file);
      setFormData((current) => ({
        ...current,
        images: [preparedImage]
      }));
    } catch (error) {
      console.error('Error preparing image:', error);
      setSaveError(error.message || 'Could not prepare the selected image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((current) => ({
      ...current,
      images: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
      } else {
        await productsAPI.create(formData);
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData(INITIAL_FORM_STATE);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      const message =
        error.response?.data?.error ||
        'Product service is unavailable right now. Please make sure the backend is running.';
      setSaveError(message);
      alert(message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      colors: Array.isArray(product.colors) ? product.colors : [],
      images: Array.isArray(product.images) ? product.images : []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // Note: Delete endpoint would need to be added to backend
      alert('Delete functionality needs to be implemented in backend');
    }
  };

  if (loading) {
    return <BrandLoader message="Loading products..." />;
  }

  const publishedCount = products.filter((product) => product.published).length;
  const lowStockCount = products.filter((product) => Number(product.current_stock || 0) <= 10).length;

  return (
    <div className="backend-shell">
      <div className="backend-frame management-container">
        <section className="management-header-card">
          <div>
            <p className="backend-kicker">Catalog admin</p>
            <h1>Product Management</h1>
            <p className="backend-subtitle">
              Add and refine catalog records with the same visual language as the
              storefront.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setSaveError('');
            setFormData(INITIAL_FORM_STATE);
          }}>
            <FiPlus />
            <span>Add New Product</span>
          </button>
        </section>

        <section className="management-overview-grid">
          <article className="overview-card">
            <p>Total products</p>
            <strong>{products.length}</strong>
          </article>
          <article className="overview-card">
            <p>Published</p>
            <strong>{publishedCount}</strong>
          </article>
          <article className="overview-card">
            <p>Low stock</p>
            <strong>{lowStockCount}</strong>
          </article>
        </section>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="table-card-header">
                <div>
                  <p className="backend-kicker">Catalog form</p>
                  <h2>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                {saveError && (
                  <p className="cart-status-text cart-status-error">{saveError}</p>
                )}
                <p className="backend-subtitle">
                  Upload your own product image if you want it shown on the storefront.
                  If you leave it empty, we will keep using the curated fallback photo set.
                </p>
                <div className="form-group">
                  <label>Product Image</label>
                  <div className="product-image-field">
                    <div className="product-image-preview">
                      {formData.images?.[0] ? (
                        <img src={formData.images[0]} alt={formData.product_name || 'Product preview'} />
                      ) : (
                        <div className="product-image-placeholder">
                          <FiImage />
                          <span>No custom image yet</span>
                        </div>
                      )}
                    </div>
                    <div className="product-image-controls">
                      <label className={`btn btn-secondary product-image-upload ${isUploadingImage ? 'disabled' : ''}`}>
                        <FiUpload />
                        <span>{isUploadingImage ? 'Preparing...' : formData.images?.[0] ? 'Replace Image' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                        />
                      </label>
                      {formData.images?.[0] && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleRemoveImage}
                        >
                          <FiX />
                          <span>Remove Image</span>
                        </button>
                      )}
                      <p className="form-help">
                        Best for product photos from your own device. The uploaded image will be
                        used first on the storefront and product page.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      name="product_name"
                      value={formData.product_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="product_category"
                      value={formData.product_category}
                      onChange={handleChange}
                      required
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="children">Children</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Type</label>
                    <input
                      type="text"
                      name="product_type"
                      value={formData.product_type}
                      onChange={handleChange}
                      placeholder="e.g., shirt, pant, kurta"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Material</label>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      placeholder="e.g., cotton, nylon"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Colors (comma-separated)</label>
                  <input
                    type="text"
                    name="colors"
                    value={formData.colors.join(', ')}
                    onChange={handleChange}
                    placeholder="e.g., red, blue, green"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Stock</label>
                    <input
                      type="number"
                      name="current_stock"
                      value={formData.current_stock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sales Price (INR)</label>
                    <input
                      type="number"
                      name="sales_price"
                      value={formData.sales_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Sales Tax (%)</label>
                    <input
                      type="number"
                      name="sales_tax"
                      value={formData.sales_tax}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Purchase Price (INR)</label>
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="published"
                      checked={formData.published}
                      onChange={handleChange}
                    />
                    <span>Published (visible on website)</span>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="table-card">
          <div className="table-card-header">
            <div>
              <p className="backend-kicker">Inventory</p>
              <h2>Product list</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <FiBox />
              <p>No products yet. Add your first catalog item to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Stock</th>
                    <th>Sales Price (INR)</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="management-product-thumb">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.product_name} />
                          ) : (
                            <span>No image</span>
                          )}
                        </div>
                      </td>
                      <td>{product.product_name}</td>
                      <td>{product.product_category}</td>
                      <td>{product.product_type}</td>
                      <td>{product.current_stock || 0}</td>
                      <td>{formatCurrencyINR(product.sales_price)}</td>
                      <td>
                        <span className={`status-badge ${product.published ? 'paid' : 'draft'}`}>
                          {product.published ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-row">
                          <button className="btn btn-sm btn-primary" onClick={() => handleEdit(product)}>
                            <FiEdit3 />
                            <span>Edit</span>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                            <FiTrash2 />
                            <span>Delete</span>
                          </button>
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

export default ProductManagement;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Plus, Edit2, Trash2, Search, MapPin, CheckCircle, Clock, 
  Eye, Package, AlertTriangle, XCircle, LogOut, Upload, FileText, Tag, Check, X
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

export function OwnerDashboard() {
  const { user, isAuthenticated, isOwner, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Shop Edit Form State
  const [profileForm, setProfileForm] = useState({
    shopName: '',
    shopType: 'clothing',
    address: '',
    landmark: '',
    gstNumber: '',
    imageFile: null,
  });

  // Product Form State (for both Add and Edit)
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'mens',
    subtype: 'Shirts',
    price: '',
    description: '',
    stockQuantity: '10',
    imageFile: null,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Authorization check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true, state: { message: 'Please log in to access the owner portal' } });
      return;
    }
    if (!isOwner) {
      navigate('/auth', { replace: true, state: { message: 'Owner access required' } });
      return;
    }

    loadOwnerData();
  }, [isAuthenticated, isOwner, navigate]);

  const loadOwnerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, items] = await Promise.all([
        fetchApi('/owner/dashboard'),
        fetchApi('/owner/catalogue'),
      ]);
      setDashboardData(dash);
      setCatalogue(Array.isArray(items) ? items : []);

      if (dash?.shop) {
        setProfileForm({
          shopName: dash.shop.shopName || '',
          shopType: dash.shop.shopType || 'clothing',
          address: dash.shop.location?.address || '',
          landmark: dash.shop.landmark || '',
          gstNumber: dash.shop.gstNumber || '',
          imageFile: null,
        });
      }
    } catch (err) {
      console.error('Failed to load owner data:', err);
      setError(err.message || 'Could not load your shop dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // --- SHOP PROFILE HANDLERS ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      // 1. Update text profile
      const updatedShop = await fetchApi('/owner/shop', {
        method: 'PATCH',
        body: JSON.stringify({
          shopName: profileForm.shopName,
          shopType: profileForm.shopType,
          address: profileForm.address,
          landmark: profileForm.landmark,
          gstNumber: profileForm.gstNumber,
        }),
      });

      // 2. Upload image if provided
      if (profileForm.imageFile) {
        const formData = new FormData();
        formData.append('image', profileForm.imageFile);
        await fetchApi('/owner/shop/image', {
          method: 'POST',
          body: formData,
        });
      }

      setShowProfileModal(false);
      showToast('Shop profile updated successfully! 🏬', 'success');
      loadOwnerData();
    } catch (err) {
      setFormError(err.message || 'Failed to update shop profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- ADD PRODUCT HANDLERS ---
  const handleOpenAddModal = () => {
    setProductForm({
      name: '',
      type: 'mens',
      subtype: 'General',
      price: '',
      description: '',
      stockQuantity: '10',
      imageFile: null,
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!productForm.name || !productForm.price || !productForm.type || !productForm.subtype) {
      setFormError('Name, price, type, and subtype are required');
      setFormSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('type', productForm.type);
      formData.append('subtype', productForm.subtype);
      formData.append('price', Number(productForm.price));
      formData.append('description', productForm.description || '');

      const stockNum = Math.max(0, parseInt(productForm.stockQuantity || '0', 10));
      formData.append('sizes', JSON.stringify([{ label: 'Standard', stock: stockNum }]));

      if (productForm.imageFile) {
        formData.append('image', productForm.imageFile);
      }

      await fetchApi('/owner/catalogue', {
        method: 'POST',
        body: formData,
      });

      setShowAddModal(false);
      showToast('Product added to catalogue! 🛍️', 'success');
      loadOwnerData();
    } catch (err) {
      setFormError(err.message || 'Failed to add product');
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- EDIT PRODUCT HANDLERS ---
  const handleOpenEditModal = (item) => {
    const totalStk = Array.isArray(item.sizes)
      ? item.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)
      : (item.stock || 0);

    setEditingItem(item);
    setProductForm({
      name: item.name || '',
      type: item.type || 'mens',
      subtype: item.subtype || 'General',
      price: item.price !== undefined ? String(item.price) : '',
      description: item.description || '',
      stockQuantity: String(totalStk),
      imageFile: null,
    });
    setFormError(null);
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setFormSubmitting(true);
    setFormError(null);

    try {
      const stockNum = Math.max(0, parseInt(productForm.stockQuantity || '0', 10));

      await fetchApi(`/owner/catalogue/${editingItem._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: productForm.name,
          type: productForm.type,
          subtype: productForm.subtype,
          price: Number(productForm.price),
          description: productForm.description,
          sizes: [{ label: 'Standard', stock: stockNum }],
        }),
      });

      if (productForm.imageFile) {
        const formData = new FormData();
        formData.append('image', productForm.imageFile);
        await fetchApi(`/owner/catalogue/${editingItem._id}/image`, {
          method: 'POST',
          body: formData,
        });
      }

      setEditingItem(null);
      showToast('Product details saved! ✏️', 'success');
      loadOwnerData();
    } catch (err) {
      setFormError(err.message || 'Failed to update product');
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- DELETE PRODUCT HANDLERS ---
  const handleDeleteProduct = async () => {
    if (!deletingItem) return;
    setFormSubmitting(true);
    try {
      await fetchApi(`/owner/catalogue/${deletingItem._id}`, {
        method: 'DELETE',
      });
      setDeletingItem(null);
      showToast('Product removed from catalogue', 'info');
      loadOwnerData();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Helper calculation for stats
  const shop = dashboardData?.shop;
  const totalItems = catalogue.length;
  
  const getItemStock = (item) => {
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      return item.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
    }
    return Number(item.stock || 0);
  };

  const inStockCount = catalogue.filter((i) => getItemStock(i) > 3).length;
  const lowStockCount = catalogue.filter((i) => {
    const s = getItemStock(i);
    return s > 0 && s <= 3;
  }).length;
  const outOfStockCount = catalogue.filter((i) => getItemStock(i) === 0).length;

  // Filter catalogue
  const filteredCatalogue = catalogue.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtype && item.subtype.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      item.category === selectedCategoryFilter ||
      item.type === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith('http') ? img : img.startsWith('/uploads/') ? img : `/uploads/${img}`;
  };

  if (!isAuthenticated || !isOwner) return null;

  return (
    <div className="owner-dashboard-wrapper">
      <Header />

      <main className="container owner-dashboard-main">
        {loading ? (
          <div className="owner-loading-state">
            <div className="spinner"></div>
            <p>Loading your shop dashboard & catalogue...</p>
          </div>
        ) : error ? (
          <div className="owner-error-state">
            <AlertTriangle size={36} />
            <p>{error}</p>
            <button onClick={loadOwnerData} className="btn-primary">
              Retry Loading
            </button>
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <div className="owner-header-banner">
              <div className="shop-identity-wrap">
                <div className="shop-avatar">
                  <ImageWithFallback src={shop?.image} alt={shop?.shopName} variant="shop" fallbackText={shop?.shopName} shopType={shop?.shopType} shopName={shop?.shopName} />
                </div>
                <div className="shop-meta-info">
                  <div className="shop-title-row">
                    <h1>{shop?.shopName || 'My Local Shop'}</h1>
                    <span className="badge-shop-type">{shop?.shopType || 'Retail'}</span>
                    {shop?.verified ? (
                      <span className="badge-verified"><CheckCircle size={14} /> Verified Merchant</span>
                    ) : (
                      <span className="badge-unverified"><Clock size={14} /> Verification Pending</span>
                    )}
                  </div>
                  <div className="shop-address-row">
                    <MapPin size={16} />
                    <span>{shop?.location?.address || 'No address specified'}</span>
                    {shop?.landmark && <span className="landmark-tag">(Landmark: {shop.landmark})</span>}
                  </div>
                  {shop?.gstNumber && (
                    <div className="shop-gst-row">
                      <FileText size={14} /> GSTIN: {shop.gstNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="owner-header-actions">
                <button className="btn-edit-profile" onClick={() => setShowProfileModal(true)}>
                  <Edit2 size={16} /> Edit Shop Profile
                </button>
                <button className="btn-logout" onClick={logout}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>

            {/* Stat Cards Row */}
            <div className="owner-stats-grid">
              <div className="owner-stat-card">
                <div className="stat-icon-wrap primary">
                  <Package size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Total Catalogue</span>
                  <strong className="stat-value">{totalItems}</strong>
                </div>
              </div>

              <div className="owner-stat-card">
                <div className="stat-icon-wrap success">
                  <CheckCircle size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">In-Stock Products</span>
                  <strong className="stat-value">{inStockCount}</strong>
                </div>
              </div>

              <div className="owner-stat-card">
                <div className="stat-icon-wrap warning">
                  <AlertTriangle size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Low-Stock Items</span>
                  <strong className="stat-value">{lowStockCount}</strong>
                </div>
              </div>

              <div className="owner-stat-card">
                <div className="stat-icon-wrap danger">
                  <XCircle size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Out of Stock</span>
                  <strong className="stat-value">{outOfStockCount}</strong>
                </div>
              </div>

              <div className="owner-stat-card">
                <div className="stat-icon-wrap info">
                  <Eye size={22} />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Total Customer Visits</span>
                  <strong className="stat-value">{dashboardData?.visits || 0}</strong>
                </div>
              </div>
            </div>

            {/* Catalogue Section Header */}
            <div className="catalogue-section">
              <div className="catalogue-top-bar">
                <div className="catalogue-heading">
                  <h2>Inventory Catalogue</h2>
                  <p>Manage product pricing, stock availability, and images visible to local buyers.</p>
                </div>
                <button className="btn-add-product" onClick={handleOpenAddModal}>
                  <Plus size={18} /> Add New Product
                </button>
              </div>

              {/* Filters & Search */}
              <div className="catalogue-controls-bar">
                <div className="search-input-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search catalogue by product name, type, or subtype..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="category-filter-chips">
                  <button
                    className={selectedCategoryFilter === 'all' ? 'active' : ''}
                    onClick={() => setSelectedCategoryFilter('all')}
                  >
                    All Items ({catalogue.length})
                  </button>
                  <button
                    className={selectedCategoryFilter === 'mens' ? 'active' : ''}
                    onClick={() => setSelectedCategoryFilter('mens')}
                  >
                    Men
                  </button>
                  <button
                    className={selectedCategoryFilter === 'womens' ? 'active' : ''}
                    onClick={() => setSelectedCategoryFilter('womens')}
                  >
                    Women
                  </button>
                </div>
              </div>

              {/* Catalogue Grid */}
              {filteredCatalogue.length === 0 ? (
                <div className="empty-catalogue-box">
                  <Package size={48} className="empty-icon" />
                  <h3>No Products Found</h3>
                  <p>
                    {searchQuery
                      ? 'No items match your search term. Try a different query.'
                      : 'Your catalogue is currently empty. Click "Add New Product" to list your first shelf item!'}
                  </p>
                  {!searchQuery && (
                    <button className="btn-add-product" onClick={handleOpenAddModal}>
                      <Plus size={18} /> Add Product Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="owner-product-grid">
                  {filteredCatalogue.map((item) => {
                    const totalStk = getItemStock(item);
                    const mainImage = item.image || (item.images && item.images.length > 0 ? item.images[0] : null);

                    return (
                      <div key={item._id} className="owner-product-card">
                        <div className="product-card-img-wrap">
                          <ImageWithFallback src={mainImage} alt={item.name} variant="product" fallbackText={item.name} category={item.category} type={item.type} subtype={item.subtype} productName={item.name} />
                          <span className="product-type-badge">{item.subtype || item.type || 'Item'}</span>
                        </div>

                        <div className="product-card-body">
                          <h3 className="product-card-title">{item.name}</h3>

                          <div className="product-card-meta">
                            <span className="product-price">
                              ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            </span>
                            <StockBadge stock={totalStk} sizes={item.sizes} />
                          </div>

                          {item.description && (
                            <p className="product-desc-snippet">{item.description}</p>
                          )}

                          <div className="product-card-actions">
                            <button
                              className="btn-action-edit"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              <Edit2 size={16} /> Edit
                            </button>
                            <button
                              className="btn-action-delete"
                              onClick={() => setDeletingItem(item)}
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* --- MODAL 1: EDIT SHOP PROFILE --- */}
      {showProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Shop Profile</h3>
              <button className="btn-close-modal" onClick={() => setShowProfileModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="modal-error-banner">{formError}</div>}

            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  value={profileForm.shopName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, shopName: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Shop Category</label>
                <select
                  value={profileForm.shopType}
                  onChange={(e) => setProfileForm((p) => ({ ...p, shopType: e.target.value }))}
                  className="select-input"
                >
                  <option value="footwear">Footwear</option>
                  <option value="clothing">Clothing</option>
                  <option value="ornaments">Jewellery & Ornaments</option>
                  <option value="accessories">Accessories & Bags</option>
                  <option value="hardware">Hardware & Tools</option>
                </select>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Landmark</label>
                <input
                  type="text"
                  value={profileForm.landmark}
                  onChange={(e) => setProfileForm((p) => ({ ...p, landmark: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  value={profileForm.gstNumber}
                  onChange={(e) => setProfileForm((p) => ({ ...p, gstNumber: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Update Shop Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileForm((p) => ({ ...p, imageFile: e.target.files[0] }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD PRODUCT --- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Product to Catalogue</h3>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="modal-error-banner">{formError}</div>}

            <form onSubmit={handleAddProduct} className="modal-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Leather Oxford Shoes"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Type / Target Group *</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm((p) => ({ ...p, type: e.target.value }))}
                    className="select-input"
                  >
                    <option value="mens">Men</option>
                    <option value="womens">Women</option>
                    <option value="children">Children</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bags">Bags</option>
                    <option value="tools">Tools</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subtype / Item Type *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sneakers, Kurti, Ring"
                    value={productForm.subtype}
                    onChange={(e) => setProductForm((p) => ({ ...p, subtype: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1499"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe material, features, sizes, etc."
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductForm((p) => ({ ...p, imageFile: e.target.files[0] }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Adding...' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT PRODUCT --- */}
      {editingItem && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="btn-close-modal" onClick={() => setEditingItem(null)}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className="modal-error-banner">{formError}</div>}

            <form onSubmit={handleSaveEditProduct} className="modal-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Type / Target Group *</label>
                  <input
                    type="text"
                    value={productForm.type}
                    onChange={(e) => setProductForm((p) => ({ ...p, type: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Subtype / Item Type *</label>
                  <input
                    type="text"
                    value={productForm.subtype}
                    onChange={(e) => setProductForm((p) => ({ ...p, subtype: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm((p) => ({ ...p, stockQuantity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Replace Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductForm((p) => ({ ...p, imageFile: e.target.files[0] }))}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CONFIRM DELETE --- */}
      {deletingItem && (
        <div className="modal-backdrop">
          <div className="modal-content modal-sm">
            <div className="modal-header">
              <h3>Confirm Product Deletion</h3>
              <button className="btn-close-modal" onClick={() => setDeletingItem(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-pad">
              <p>
                Are you sure you want to delete <strong>"{deletingItem.name}"</strong> from your catalogue?
              </p>
              <p className="sub-text">
                This item will no longer appear in local customer searches or on your shop page.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDeletingItem(null)}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteProduct}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <LocationModal />
    </div>
  );
}

export default OwnerDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation as useReactRouterLocation } from 'react-router-dom';
import { User, Mail, Phone, Lock, Store, ChevronRight, Check, MapPin, Tag, FileText, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import './AuthPage.css';

export function AuthPage() {
  const navigate = useNavigate();
  const reactRouterLocation = useReactRouterLocation();
  const { login, registerCustomer, registerOwner, isAuthenticated, isOwner } = useAuth();

  // State for tabs
  const [roleTab, setRoleTab] = useState('customer'); // 'customer' or 'owner'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [isVerifying, setIsVerifying] = useState(false);

  // Customer Form State
  const [customerData, setCustomerData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
  });

  // Owner Form State
  const [ownerData, setOwnerData] = useState({
    name: '',
    email: '',
    password: '',
    shopName: '',
    shopType: 'clothing',
    address: '',
    area: '',
    landmark: '',
    gstNumber: '',
    code: '',
  });

  // Shop Photo upload state
  const [shopImageFile, setShopImageFile] = useState(null);
  const [shopImagePreview, setShopImagePreview] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stateMessage, setStateMessage] = useState('');

  // Handle redirect messages if passed via state
  useEffect(() => {
    if (reactRouterLocation.state?.message) {
      setStateMessage(reactRouterLocation.state.message);
    }
  }, [reactRouterLocation.state]);

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isOwner ? '/owner/dashboard' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, isOwner, navigate]);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPG, PNG, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB');
      return;
    }

    setError(null);
    setShopImageFile(file);
    setShopImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setShopImageFile(null);
    if (shopImagePreview) {
      URL.revokeObjectURL(shopImagePreview);
      setShopImagePreview(null);
    }
  };

  const syncPendingWishlist = async () => {
    const pendingItemId = sessionStorage.getItem('pendingWishlistId');
    if (pendingItemId) {
      try {
        await fetchApi('/wishlist', {
          method: 'POST',
          body: JSON.stringify({ itemId: pendingItemId }),
        });
        sessionStorage.removeItem('pendingWishlistId');
      } catch (err) {
        console.error('Failed to sync pending wishlist item', err);
      }
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (authMode === 'register') {
      if (!customerData.name || !customerData.mobile || !customerData.email || !customerData.password) {
        setError('All customer fields are required');
        return;
      }
      if (customerData.mobile.length !== 10) {
        setError('Mobile number must be 10 digits');
        return;
      }
      if (customerData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setLoading(true);
      try {
        await registerCustomer({
          name: customerData.name,
          mobile: customerData.mobile,
          email: customerData.email,
          password: customerData.password,
        });
        await syncPendingWishlist();
        navigate('/dashboard');
      } catch (err) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      if (!customerData.email || !customerData.password) {
        setError('Email and password are required');
        return;
      }
      setLoading(true);
      try {
        await login(customerData.email, customerData.password);
        await syncPendingWishlist();
        navigate('/dashboard');
      } catch (err) {
        setError('Invalid email or password');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // SAFETY GUARD: Login mode must ALWAYS call login(), never register.
    if (authMode === 'login') {
      if (!ownerData.email || !ownerData.password) {
        setError('Email and password are required');
        return;
      }
      setLoading(true);
      try {
        await login(ownerData.email, ownerData.password);
      } catch (err) {
        setError('Invalid email or password. Please check your credentials.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Register mode
    if (!isVerifying) {
      if (!ownerData.name || !ownerData.email || !ownerData.password || !ownerData.shopName || !ownerData.address) {
        setError('Name, email, password, shop name, and address are required');
        return;
      }
      if (ownerData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setIsVerifying(true);
    } else {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('name', ownerData.name);
        formData.append('email', ownerData.email);
        formData.append('password', ownerData.password);
        formData.append('shopName', ownerData.shopName);
        formData.append('shopType', ownerData.shopType);
        formData.append('address', ownerData.address);
        if (ownerData.area) formData.append('area', ownerData.area);
        if (ownerData.landmark) formData.append('landmark', ownerData.landmark);
        if (ownerData.gstNumber) formData.append('gstNumber', ownerData.gstNumber);
        if (shopImageFile) formData.append('image', shopImageFile);

        await registerOwner(formData);
        navigate('/owner/dashboard');
      } catch (err) {
        setError(err.message || 'Owner registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <Header />
      <main className="auth-page-main">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{roleTab === 'customer' ? 'Welcome to Getsy' : 'Getsy for Business'}</h1>
            <p>
              {roleTab === 'customer'
                ? 'Discover and shop from local stores around you.'
                : 'Manage your local shop catalogue and reach nearby customers.'}
            </p>
          </div>

          {stateMessage && <div className="state-message">{stateMessage}</div>}

          <div className="auth-tabs">
            <button
              className={`auth-tab ${roleTab === 'customer' ? 'active' : ''}`}
              onClick={() => {
                setRoleTab('customer');
                setIsVerifying(false);
                setError(null);
              }}
            >
              <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Customer
            </button>
            <button
              className={`auth-tab ${roleTab === 'owner' ? 'active' : ''}`}
              onClick={() => {
                setRoleTab('owner');
                setIsVerifying(false);
                setError(null);
              }}
            >
              <Store size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Shop Owner
            </button>
          </div>

          <div className="auth-toggle">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => {
                setAuthMode('login');
                setIsVerifying(false);
                setError(null);
              }}
            >
              Log In
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => {
                setAuthMode('register');
                setIsVerifying(false);
                setError(null);
              }}
            >
              {roleTab === 'customer' ? 'Create Account' : 'Register Shop'}
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {roleTab === 'customer' ? (
            /* CUSTOMER FORM */
            <form className="auth-form" onSubmit={handleCustomerSubmit}>
              {authMode === 'register' && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={customerData.name}
                        onChange={handleCustomerChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input
                        type="tel"
                        name="mobile"
                        placeholder="10-digit mobile number"
                        value={customerData.mobile}
                        onChange={handleCustomerChange}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={customerData.email}
                    onChange={handleCustomerChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="password"
                    placeholder={authMode === 'register' ? 'Min 6 characters' : 'Enter password'}
                    value={customerData.password}
                    onChange={handleCustomerChange}
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn-submit" disabled={loading}>
                {loading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Continue'}
                {!loading && <ChevronRight size={18} />}
              </button>
            </form>
          ) : (
            /* SHOP OWNER FORM */
            <form className="auth-form" onSubmit={handleOwnerSubmit}>
              {!isVerifying ? (
                <>
                  {authMode === 'register' && (
                    <>
                      <div className="form-group">
                        <label>Owner Full Name</label>
                        <div className="input-with-icon">
                          <User size={18} />
                          <input
                            type="text"
                            name="name"
                            placeholder="Owner Name"
                            value={ownerData.name}
                            onChange={handleOwnerChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Shop Name</label>
                        <div className="input-with-icon">
                          <Store size={18} />
                          <input
                            type="text"
                            name="shopName"
                            placeholder="e.g. Apex Footwear"
                            value={ownerData.shopName}
                            onChange={handleOwnerChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Shop Category / Type</label>
                        <div className="input-with-icon">
                          <Tag size={18} />
                          <select name="shopType" value={ownerData.shopType} onChange={handleOwnerChange} className="select-input">
                            <option value="footwear">Footwear</option>
                            <option value="clothing">Clothing</option>
                            <option value="ornaments">Jewellery & Ornaments</option>
                            <option value="accessories">Accessories & Bags</option>
                            <option value="hardware">Hardware & Tools</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Address / Street</label>
                        <div className="input-with-icon">
                          <MapPin size={18} />
                          <input
                            type="text"
                            name="address"
                            placeholder="e.g. Main Road, Sangamner"
                            value={ownerData.address}
                            onChange={handleOwnerChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Landmark (Optional)</label>
                        <div className="input-with-icon">
                          <MapPin size={18} />
                          <input
                            type="text"
                            name="landmark"
                            placeholder="e.g. Near Bus Stand"
                            value={ownerData.landmark}
                            onChange={handleOwnerChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>GST Number (Optional)</label>
                        <div className="input-with-icon">
                          <FileText size={18} />
                          <input
                            type="text"
                            name="gstNumber"
                            placeholder="e.g. 27AAAAA0000A1Z5"
                            value={ownerData.gstNumber}
                            onChange={handleOwnerChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Shop Photo / Shop Logo (Optional)</label>
                        {shopImagePreview ? (
                          <div className="image-preview-wrapper">
                            <img src={shopImagePreview} alt="Shop Preview" className="image-preview-img" />
                            <button
                              type="button"
                              className="btn-remove-image"
                              onClick={handleRemoveImage}
                              title="Remove photo"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="image-upload-box">
                            <label htmlFor="shop-image-input" className="image-upload-label">
                              <Upload size={22} />
                              <span><strong>Click to upload shop photo</strong> (JPG, PNG, WEBP max 5MB)</span>
                            </label>
                            <input
                              id="shop-image-input"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImageChange}
                              style={{ display: 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input
                        type="email"
                        name="email"
                        placeholder="owner@example.com"
                        value={ownerData.email}
                        onChange={handleOwnerChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input
                        type="password"
                        name="password"
                        placeholder={authMode === 'register' ? 'Min 6 characters' : 'Enter password'}
                        value={ownerData.password}
                        onChange={handleOwnerChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn-submit" disabled={loading}>
                    {loading ? 'Please wait...' : authMode === 'login' ? 'Log In to Shop Portal' : 'Continue'}
                    {!loading && <ChevronRight size={18} />}
                  </button>
                </>
              ) : (
                <div className="verification-step">
                  <h3>Verify Owner Registration</h3>
                  <p>Enter the 4-digit code sent to your email.</p>

                  <div className="verification-code-input">
                    <input
                      type="text"
                      maxLength="4"
                      name="code"
                      value={ownerData.code}
                      onChange={handleOwnerChange}
                      placeholder="----"
                      autoFocus
                    />
                  </div>
                  <div className="demo-hint">Demo verification code: any 4 digits (e.g. 1234)</div>

                  <button type="submit" className="auth-btn-submit" disabled={loading || ownerData.code.length < 4}>
                    {loading ? 'Registering Shop...' : 'Verify & Register Shop'}
                    {!loading && <Check size={18} />}
                  </button>
                  <button
                    type="button"
                    className="btn-back-link"
                    onClick={() => setIsVerifying(false)}
                  >
                    ← Back to edit details
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
      <Footer />
      <LocationModal />
    </div>
  );
}

export default AuthPage;

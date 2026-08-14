import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Trash2, LogOut, MapPin, Navigation, Eye,
  User, Phone, Mail, Store, Compass, Sparkles, ChevronRight,
  ShoppingBag, Star,
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { StockBadge } from '../components/products/StockBadge';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationCtx } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../services/api';
import './CustomerDashboard.css';

export function CustomerDashboard() {
  const { user, logout, isAuthenticated, isCustomer, updateProfile } = useAuth();
  const { location, openModal } = useLocationCtx();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phone editing state
  const [editingMobile, setEditingMobile] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const [mobileSaving, setMobileSaving] = useState(false);
  const [mobileError, setMobileError] = useState('');

  useEffect(() => {
    if (user?.mobile) {
      setMobileInput(user.mobile);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) {
      navigate('/auth', { replace: true, state: { message: 'Please log in to access your dashboard' } });
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch Wishlist
        const wishlistData = await fetchApi('/wishlist').catch(() => []);
        setWishlist(Array.isArray(wishlistData) ? wishlistData : []);

        // Fetch Nearby Shops based on location
        let shopUrl = '/shops?radius=10';
        if (location?.lat && location?.lng) {
          shopUrl += `&lat=${location.lat}&lng=${location.lng}`;
        }
        const shopsData = await fetchApi(shopUrl).catch(() => []);
        setNearbyShops(Array.isArray(shopsData) ? shopsData.slice(0, 4) : []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Could not load your dashboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, isCustomer, location, navigate]);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/');
  };

  const handleSaveMobile = async (e) => {
    e.preventDefault();
    setMobileError('');
    const cleanMobile = mobileInput.trim();
    if (!/^\d{10}$/.test(cleanMobile)) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return;
    }

    setMobileSaving(true);
    try {
      await updateProfile({ mobile: cleanMobile });
      showToast('Mobile number updated successfully! 📱', 'success');
      setEditingMobile(false);
    } catch (err) {
      setMobileError(err.message || 'Failed to update mobile number');
    } finally {
      setMobileSaving(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await fetchApi(`/wishlist/${itemId}`, { method: 'DELETE' });
      setWishlist(prev => prev.filter(w => (w.item?._id || w.item?.id) !== itemId));
      showToast('Removed from Wishlist', 'info');
    } catch (err) {
      console.error('Failed to remove item', err);
      showToast('Could not remove item from wishlist', 'error');
    }
  };

  const getDirectionsUrl = (shop) => {
    if (!shop || typeof shop !== 'object') return '#';
    if (shop?.location?.lat && shop?.location?.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${shop.location.lat},${shop.location.lng}`;
    }
    const query = encodeURIComponent(`${shop?.shopName || ''} ${shop?.location?.address || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  if (!isAuthenticated || !isCustomer) return null;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const locationLabel = location?.name || location?.area || location?.address || null;
  const hasWishlist = !loading && !error && wishlist.length > 0;

  return (
    <div className="cd-wrapper">
      <Header />

      <main className="cd-main">
        {/* ── 1. HERO / WELCOME SECTION ────────────────────────────── */}
        <section className="cd-hero">
          <div className="cd-hero-inner container">
            <div className="cd-hero-text">
              <p className="cd-hero-eyebrow">Your Dashboard</p>
              <h1 className="cd-hero-title">Welcome back, <span>{firstName}!</span></h1>
              <p className="cd-hero-subtitle">
                Discover products available from local shops near you.
              </p>
              <div className="cd-hero-actions">
                <button
                  className="cd-btn-primary"
                  onClick={() => navigate('/discover')}
                >
                  <Compass size={18} /> Explore Local Shops
                </button>
                <button
                  className="cd-btn-secondary"
                  onClick={() => navigate('/discover')}
                >
                  Browse Categories <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="cd-hero-stats">
              <div className="cd-stat-card">
                <Heart size={22} className="cd-stat-icon pink" />
                <div>
                  <div className="cd-stat-value">{loading ? '—' : wishlist.length}</div>
                  <div className="cd-stat-label">Saved Items</div>
                </div>
              </div>
              <div className="cd-stat-card">
                <User size={22} className="cd-stat-icon blue" />
                <div>
                  <div className="cd-stat-value truncate">{user?.email}</div>
                  <div className="cd-stat-label">Account Email</div>
                </div>
              </div>
              <div className="cd-stat-card">
                <Phone size={22} className="cd-stat-icon teal" />
                <div style={{ width: '100%' }}>
                  {editingMobile ? (
                    <form onSubmit={handleSaveMobile} style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                      <input
                        type="tel"
                        value={mobileInput}
                        onChange={(e) => setMobileInput(e.target.value)}
                        placeholder="10 digits"
                        maxLength="10"
                        style={{ width: '90px', padding: '2px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        autoFocus
                      />
                      <button type="submit" disabled={mobileSaving} style={{ padding: '2px 6px', fontSize: '0.75rem', background: '#2563EB', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingMobile(false)} style={{ padding: '2px 6px', fontSize: '0.75rem', background: '#64748B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className="cd-stat-value">{user?.mobile || 'Not set'}</span>
                      <button
                        onClick={() => setEditingMobile(true)}
                        style={{ background: 'none', border: 'none', color: '#BFDBFE', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: '0 0 0 8px' }}
                      >
                        {user?.mobile ? 'Edit' : 'Add Phone'}
                      </button>
                    </div>
                  )}
                  {mobileError && <div style={{ color: '#FECACA', fontSize: '0.7rem', marginTop: '2px' }}>{mobileError}</div>}
                  <div className="cd-stat-label">Mobile Number</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. LOCATION STRIP ────────────────────────────────────── */}
        <section className="cd-location-strip">
          <div className="container cd-location-inner">
            <MapPin size={20} className="cd-loc-icon" />
            {locationLabel ? (
              <div className="cd-loc-text">
                <strong>📍 {locationLabel}</strong>
                <span>Showing products and shops around your location.</span>
              </div>
            ) : (
              <div className="cd-loc-text">
                <strong>No location selected</strong>
                <span>Set your location to see nearby shops and products.</span>
              </div>
            )}
            <button
              className="cd-loc-btn"
              onClick={openModal}
            >
              {locationLabel ? 'Change Location' : 'Set Location'}
            </button>
          </div>
        </section>

        {/* ── 3. MY WISHLIST / RECOMMENDATIONS SECTION ─────────────── */}
        <section className="cd-section container">
          <div className="cd-section-header">
            <div className="cd-section-title-group">
              <Star size={22} className="cd-section-icon" />
              <h2 className="cd-section-title">Recommended For You</h2>
            </div>
            {hasWishlist && (
              <Link to="/discover" className="cd-section-link">
                See all shops <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {loading ? (
            <SkeletonCard variant="product-card" count={4} />
          ) : error ? (
            <div className="cd-error-card">{error}</div>
          ) : wishlist.length === 0 ? (
            <div className="cd-empty-recommendations">
              <div className="cd-empty-rec-inner">
                <div className="cd-empty-rec-icon">
                  <Sparkles size={36} />
                </div>
                <h3>Recommendations will appear here</h3>
                <p>
                  Once local shops add products, you'll see recommendations based on
                  what's available near you. Save items to your wishlist to keep track
                  of things you love.
                </p>
                <button
                  className="cd-btn-primary"
                  onClick={() => navigate('/discover')}
                >
                  <Store size={18} /> Explore Local Shops
                </button>
              </div>
            </div>
          ) : (
            <div className="cd-wishlist-grid">
              {wishlist.map((wishlistItem) => {
                const product = wishlistItem?.item || {};
                const shop = product?.shop || product?.shopId;
                const isShopObject = shop && typeof shop === 'object';
                const itemId = product?._id || product?.id;
                const imageSrc = product?.image || (product?.images && product?.images[0]);

                return (
                  <div key={wishlistItem.wishlistId || itemId || Math.random()} className="cd-wish-card">
                    <div className="cd-wish-img-wrap">
                      <ImageWithFallback
                        src={imageSrc}
                        alt={product?.name || 'Product Image'}
                        variant="product"
                        fallbackText={product?.name || 'Item'}
                        category={product?.category}
                        type={product?.type}
                        subtype={product?.subtype}
                        productName={product?.name}
                      />
                    </div>

                    <div className="cd-wish-content">
                      <div className="cd-wish-title-row">
                        <h3 className="cd-wish-title">{product?.name || 'Unknown Item'}</h3>
                        <div className="cd-wish-price">
                          ₹{Number(product?.price || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ marginBottom: '0.875rem' }}>
                        <StockBadge stock={product?.stock || product?.totalStock} sizes={product?.sizes} />
                      </div>

                      {isShopObject && (
                        <div className="cd-wish-shop">
                          <MapPin size={15} />
                          <div>
                            <strong>{shop.shopName || 'Local Shop'}</strong>
                            <span>
                              {shop.location?.address}{shop.landmark ? ` · ${shop.landmark}` : ''}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="cd-wish-actions">
                        {itemId && (
                          <Link to={`/products/${itemId}`} className="cd-wish-btn primary">
                            <Eye size={15} /> View Details
                          </Link>
                        )}
                        {isShopObject && (
                          <a
                            href={getDirectionsUrl(shop)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cd-wish-btn"
                            title="Get Directions"
                          >
                            <Navigation size={15} />
                          </a>
                        )}
                        {itemId && (
                          <button
                            className="cd-wish-remove"
                            onClick={() => handleRemoveItem(itemId)}
                            title="Remove from Wishlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 4. EXPLORE LOCAL SHOPS CTA SECTION ───────────────────── */}
        <section className="cd-explore-section">
          <div className="container cd-explore-inner">
            <div className="cd-explore-text">
              <ShoppingBag size={28} className="cd-explore-icon" />
              <h2>Discover What's Available Nearby</h2>
              <p>
                Explore local shops and see what's actually on their shelves.
                From clothing and footwear to hardware and jewellery — find it
                all without leaving your neighbourhood.
              </p>
              <div className="cd-explore-actions">
                <button
                  className="cd-btn-explore"
                  onClick={() => navigate('/discover')}
                >
                  <Compass size={18} /> Explore Shops
                </button>
                {user && (
                  <button
                    className="cd-btn-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                )}
              </div>
            </div>
            <div className="cd-explore-visual" aria-hidden="true">
              <div className="cd-explore-badge">
                <Store size={40} />
                <span>Local Shops</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LocationModal />
    </div>
  );
}

export default CustomerDashboard;

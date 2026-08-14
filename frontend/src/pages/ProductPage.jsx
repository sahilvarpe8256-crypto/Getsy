import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, MapPin, Navigation, ArrowLeft, Share2, Store,
  Star, CheckCircle, ShieldCheck, Truck, Package, MessageSquare, Sparkles
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { getDemoProductGallery } from '../utils/demoImages';
import { StockBadge } from '../components/products/StockBadge';
import { VariantSelector } from '../components/products/VariantSelector';
import { ProductCard } from '../components/products/ProductCard';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { fetchApi } from '../services/api';
import { calculateDistance } from '../utils/haversine';
import './ProductPage.css';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();
  const { isAuthenticated, isCustomer } = useAuth();
  const { showToast } = useToast();

  const [item, setItem] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // 1. Fetch item and shop details
  useEffect(() => {
    const loadProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemData = await fetchApi(`/items/${id}`);
        setItem(itemData);

        if (Array.isArray(itemData.sizes) && itemData.sizes.length > 0) {
          const available = itemData.sizes.find((s) => s.stock > 0);
          if (available) setSelectedSize(available.size || available.label);
        }

        let shopObj = null;
        if (typeof itemData.shopId === 'object' && itemData.shopId !== null) {
          shopObj = itemData.shopId;
          setShop(shopObj);
          fetchShopReviews(shopObj._id);
        } else if (itemData.shopId) {
          try {
            shopObj = await fetchApi(`/shops/${itemData.shopId}`);
            setShop(shopObj);
            fetchShopReviews(itemData.shopId);
          } catch (shopErr) {
            console.warn('Shop details fetch failed:', shopErr);
          }
        }

        if (itemData.category) {
          fetchRecommendations(itemData.category, id);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Product details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [id]);

  // Fetch shop reviews
  const fetchShopReviews = async (shopId) => {
    setReviewsLoading(true);
    try {
      const data = await fetchApi(`/shops/${shopId}/reviews`);
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch product recommendations from same category
  const fetchRecommendations = async (category, currentItemId) => {
    setRecLoading(true);
    try {
      const data = await fetchApi(`/search?category=${encodeURIComponent(category)}`);
      const items = data.items || [];
      const filtered = items.filter(i => i._id !== currentItemId && i.id !== currentItemId).slice(0, 4);
      setRecommendations(filtered);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  // 2. Check wishlist status
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated && isCustomer) {
        try {
          const list = await fetchApi('/wishlist');
          const isSaved = Array.isArray(list) && list.some(w => {
            const itemId = String(w.item?._id || w.item?.id || '');
            return itemId && itemId === String(id);
          });
          setIsWishlisted(isSaved);
        } catch {
          setIsWishlisted(false);
        }
      } else {
        setIsWishlisted(false);
      }
    };
    checkWishlistStatus();
  }, [id, isAuthenticated, isCustomer]);

  // Handle Wishlist Toggle
  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingWishlistId', id);
      navigate('/auth', { state: { message: 'Please log in or sign up to save items to your wishlist' } });
      return;
    }

    if (!isCustomer) {
      showToast('Only customer accounts can save to wishlist', 'info');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await fetchApi(`/wishlist/${id}`, { method: 'DELETE' });
        setIsWishlisted(false);
        showToast('Removed from your Wishlist', 'info');
      } else {
        await fetchApi('/wishlist', {
          method: 'POST',
          body: JSON.stringify({ itemId: id })
        });
        setIsWishlisted(true);
        showToast('Added to your Wishlist! ❤️', 'success');
      }
    } catch (err) {
      console.error('Wishlist toggle error', err);
      showToast('Failed to update wishlist. Please try again.', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Get Directions URL
  const getDirectionsUrl = () => {
    if (shop?.location?.lat && shop?.location?.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${shop.location.lat},${shop.location.lng}`;
    }
    const query = encodeURIComponent(`${shop?.shopName || ''} ${shop?.location?.address || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const dbImages = item?.images && item.images.length > 0
    ? item.images
    : item?.image
    ? [item.image]
    : [];

  // If no database images, provide demo gallery images for a rich product page
  const imagesList = dbImages.length > 0
    ? dbImages
    : getDemoProductGallery({ category: item?.category, type: item?.type, subtype: item?.subtype, name: item?.name });

  const currentImage = imagesList[activeImageIndex] || null;

  const distance = location && shop?.location?.lat && shop?.location?.lng
    ? calculateDistance(location.lat, location.lng, shop.location.lat, shop.location.lng)
    : null;

  const handleBackNavigation = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/discover');
    }
  };

  return (
    <div className="product-page-wrapper">
      <Header />

      <main className="product-page-main">
        <div className="container">
          {/* Breadcrumbs */}
          <nav className="product-breadcrumbs">
            <button className="btn-back" onClick={handleBackNavigation}>
              <ArrowLeft size={16} /> Back
            </button>
            <span className="crumb-sep">/</span>
            <Link to="/discover">Discover</Link>
            {shop && (
              <>
                <span className="crumb-sep">/</span>
                <Link to={`/shops/${shop._id}`}>{shop.shopName}</Link>
              </>
            )}
            <span className="crumb-sep">/</span>
            <span className="crumb-current">{item?.name || 'Product Details'}</span>
          </nav>

          {error ? (
            <div className="product-error-card">
              <h3>Product Not Found</h3>
              <p>{error}</p>
              <Link to="/discover" className="btn-primary-soft">
                Return to Discovery Page
              </Link>
            </div>
          ) : loading ? (
            <SkeletonCard variant="detail-hero" />
          ) : (
            <div className="product-layout-content">
              {/* ── 1. TOP SECTION: GALLERY + MAIN INFO ──────────────── */}
              <div className="product-details-grid">
                {/* Left Column: Gallery */}
                <div className="product-image-section">
                  <div className="product-main-image-wrap">
                    <ImageWithFallback
                      src={currentImage}
                      alt={item.name}
                      variant="product"
                      fallbackText={item.name}
                      category={item.category}
                      type={item.type}
                      subtype={item.subtype}
                      productName={item.name}
                    />
                  </div>
                  {imagesList.length > 1 && (
                    <div className="product-thumbnails-row">
                      {imagesList.map((img, idx) => (
                        <button
                          key={idx}
                          className={`thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                          onClick={() => setActiveImageIndex(idx)}
                        >
                          <ImageWithFallback src={img} alt={`Thumb ${idx + 1}`} variant="product" category={item.category} type={item.type} subtype={item.subtype} productName={item.name} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Product Specs & Actions */}
                <div className="product-info-section">
                  {shop && (
                    <Link to={`/shops/${shop._id}`} className="product-shop-brand">
                      <Store size={16} /> {shop.shopName}
                    </Link>
                  )}

                  <h1 className="product-title">{item.name}</h1>

                  <div className="product-price-stock-row">
                    <div className="product-price-box">
                      <span className="product-main-price">
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <StockBadge stock={item.stock || item.totalStock} sizes={item.sizes} />
                  </div>

                  {/* Size / Variant Selector */}
                  {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                    <div className="product-variant-block">
                      <label className="variant-block-label">Select Option / Size</label>
                      <VariantSelector
                        sizes={item.sizes}
                        selectedSize={selectedSize}
                        onSelectSize={setSelectedSize}
                      />
                    </div>
                  )}

                  {/* Primary Actions */}
                  <div className="product-cta-group">
                    <button
                      className={`btn-wishlist ${isWishlisted ? 'wishlisted' : ''}`}
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading}
                    >
                      <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                      {isWishlisted ? '❤️ Saved in Wishlist' : '♡ Add to Wishlist'}
                    </button>

                    <a
                      href={getDirectionsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-visit-shop"
                    >
                      <Navigation size={20} /> Visit Shop / Directions
                    </a>
                  </div>

                  {/* Hyperlocal Assurance Badges */}
                  <div className="product-assurances">
                    <div className="assurance-item">
                      <ShieldCheck size={18} className="assure-icon" />
                      <span>Verified Local Merchant</span>
                    </div>
                    <div className="assurance-item">
                      <Truck size={18} className="assure-icon" />
                      <span>In-Store Pickup Available</span>
                    </div>
                    <div className="assurance-item">
                      <Package size={18} className="assure-icon" />
                      <span>Live Stock Guarantee</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. PRODUCT DESCRIPTION ─────────────────────────── */}
              <section className="product-detail-section">
                <h2 className="section-heading">Product Description</h2>
                <div className="section-card">
                  {item.description ? (
                    <p className="product-description-text">{item.description}</p>
                  ) : (
                    <p className="product-description-empty">No description provided by the shop.</p>
                  )}
                </div>
              </section>

              {/* ── 3. PRODUCT DETAILS / SPECIFICATIONS ────────────── */}
              <section className="product-detail-section">
                <h2 className="section-heading">Product Details</h2>
                <div className="section-card">
                  <div className="specs-grid">
                    <div className="spec-row">
                      <span className="spec-label">Category</span>
                      <span className="spec-value">{item.category || 'General'}</span>
                    </div>
                    {item.type && (
                      <div className="spec-row">
                        <span className="spec-label">Type</span>
                        <span className="spec-value">{item.type}</span>
                      </div>
                    )}
                    {item.subtype && (
                      <div className="spec-row">
                        <span className="spec-label">Subtype</span>
                        <span className="spec-value">{item.subtype}</span>
                      </div>
                    )}
                    <div className="spec-row">
                      <span className="spec-label">Stock Status</span>
                      <span className="spec-value">
                        {item.totalStock > 0 ? `${item.totalStock} available` : 'Out of stock'}
                      </span>
                    </div>
                    {shop?.gstNumber && (
                      <div className="spec-row">
                        <span className="spec-label">GST Registered</span>
                        <span className="spec-value">{shop.gstNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── 4. SHOP & DELIVERY DETAILS ──────────────────────── */}
              {shop && (
                <section className="product-detail-section">
                  <h2 className="section-heading">Shop & Delivery</h2>
                  <div className="section-card shop-details-card">
                    <div className="shop-details-left">
                      <div className="shop-avatar-wrap">
                        <ImageWithFallback src={shop.image} alt={shop.shopName} variant="shop" fallbackText={shop.shopName} shopType={shop.shopType} shopName={shop.shopName} />
                      </div>
                      <div className="shop-details-info">
                        <h3>{shop.shopName}</h3>
                        <p className="shop-type-text">{shop.shopType} Merchant</p>
                        <p className="shop-address-text">
                          <MapPin size={15} /> {shop.location?.address}
                          {shop.landmark ? ` (Near ${shop.landmark})` : ''}
                        </p>
                        {distance !== null && (
                          <p className="shop-distance-text">
                            <Navigation size={15} /> {distance.toFixed(1)} km away from your location
                          </p>
                        )}
                        <p className="shop-radius-text">
                          <Truck size={15} /> Hyperlocal Delivery Radius: 10 km
                        </p>
                      </div>
                    </div>
                    <div className="shop-details-right">
                      <Link to={`/shops/${shop._id}`} className="btn-secondary-outline">
                        <Store size={16} /> View Shop Catalogue
                      </Link>
                      <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary-filled">
                        <Navigation size={16} /> Get Directions
                      </a>
                    </div>
                  </div>
                </section>
              )}

              {/* ── 5. REVIEWS SECTION ─────────────────────────────── */}
              <section className="product-detail-section">
                <h2 className="section-heading">Customer Reviews</h2>
                <div className="section-card">
                  {reviewsLoading ? (
                    <div className="reviews-loading">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    <div className="reviews-list">
                      {reviews.map((rev) => (
                        <div key={rev._id} className="review-item">
                          <div className="review-header">
                            <span className="review-author">{rev.customerId?.name || 'Verified Buyer'}</span>
                            <span className="review-rating">
                              <Star size={14} fill="currentColor" /> {rev.rating}/5
                            </span>
                          </div>
                          {rev.comment && <p className="review-comment">{rev.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-reviews-box">
                      <MessageSquare size={32} className="empty-rev-icon" />
                      <h4>No reviews yet</h4>
                      <p>Reviews from verified buyers will appear here once customers purchase and review this item.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── 6. RECOMMENDATIONS SECTION ──────────────────────── */}
              <section className="product-detail-section">
                <h2 className="section-heading">You May Also Like</h2>
                {recLoading ? (
                  <SkeletonCard variant="product-card" count={4} />
                ) : recommendations.length > 0 ? (
                  <div className="recommendations-grid">
                    {recommendations.map((recItem) => (
                      <ProductCard
                        key={recItem._id}
                        item={recItem}
                        shopName={recItem.shopId?.shopName}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="section-card empty-rec-card">
                    <Sparkles size={28} className="empty-rec-icon" />
                    <p>No similar recommendations available in this category right now.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <LocationModal />
    </div>
  );
}

export default ProductPage;

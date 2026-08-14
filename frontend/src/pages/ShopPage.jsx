import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Navigation, Star, Eye, CheckCircle, Search, ArrowLeft, Share2, Phone } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ProductCard } from '../components/products/ProductCard';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { useLocation } from '../context/LocationContext';
import { fetchApi } from '../services/api';
import { calculateDistance } from '../utils/haversine';
import './ShopPage.css';

export function ShopPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();

  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadCatalogue = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApi(`/shops/${id}/catalogue`);
        setShop(data.shop);
        setItems(data.items || []);
      } catch (err) {
        console.error('Failed to load shop catalogue:', err);
        setError('Shop not found or failed to load catalogue.');
      } finally {
        setLoading(false);
      }
    };

    loadCatalogue();
  }, [id]);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const distance = location && shop?.location?.lat && shop?.location?.lng
    ? calculateDistance(location.lat, location.lng, shop.location.lat, shop.location.lng)
    : null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shop?.shopName || 'Getsy Shop',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDirectionsUrl = () => {
    if (shop?.location?.lat && shop?.location?.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${shop.location.lat},${shop.location.lng}`;
    }
    const query = encodeURIComponent(`${shop?.shopName || ''} ${shop?.location?.address || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const handleBackNavigation = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/discover');
    }
  };

  return (
    <div className="shop-page-wrapper">
      <Header />

      <main className="shop-page-main">
        <div className="container">
          <button className="back-link-btn" onClick={handleBackNavigation}>
            <ArrowLeft size={16} /> Back to Discover
          </button>

          {error ? (
            <div className="shop-error-card">
              <h3>Shop Not Found</h3>
              <p>{error}</p>
              <Link to="/discover" className="btn-primary-soft">
                Explore Other Shops Nearby
              </Link>
            </div>
          ) : loading ? (
            <SkeletonCard variant="product-card" count={6} />
          ) : (
            <>
              {/* Shop Hero Card */}
              <div className="shop-hero-card">
                <div className="shop-hero-image-col">
                  <ImageWithFallback src={shop.image} alt={shop.shopName} variant="shop" fallbackText={shop.shopName} shopType={shop.shopType} shopName={shop.shopName} />
                </div>

                <div className="shop-hero-info-col">
                  <div className="shop-hero-badges">
                    <span className="shop-type-tag">{shop.shopType}</span>
                    {shop.verified && (
                      <span className="shop-verified-tag">
                        <CheckCircle size={14} /> Verified Merchant
                      </span>
                    )}
                  </div>

                  <h1 className="shop-hero-title">{shop.shopName}</h1>

                  <div className="shop-hero-meta-list">
                    <div className="meta-row">
                      <MapPin size={16} className="meta-icon" />
                      <span>
                        {shop.location?.address}
                        {shop.landmark ? ` (Landmark: ${shop.landmark})` : ''}
                      </span>
                    </div>

                    {distance !== null && (
                      <div className="meta-row distance-highlight">
                        <Navigation size={16} className="meta-icon" />
                        <span>{distance.toFixed(1)} km away from your selected location</span>
                      </div>
                    )}

                    <div className="meta-row stats-row">
                      <div className="stat-pill">
                        <Star size={16} className="star-icon" fill="currentColor" />
                        <strong>{shop.rating?.toFixed(1) || '4.5'}</strong>
                        <span>({shop.reviewCount || 12} reviews)</span>
                      </div>

                      <div className="stat-pill">
                        <Eye size={16} className="eye-icon" />
                        <strong>{shop.visitCount || 0}</strong>
                        <span>shelf views</span>
                      </div>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="shop-hero-actions">
                    <a
                      href={getDirectionsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-directions"
                    >
                      <Navigation size={18} /> Get Directions
                    </a>

                    <button className="btn-share" onClick={handleShare}>
                      <Share2 size={18} /> {copied ? 'Link Copied!' : 'Share Shop'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Catalogue Search & Header */}
              <div className="catalogue-section-header">
                <div className="catalogue-title-wrap">
                  <h2>Live In-Store Catalogue</h2>
                  <p>Real-time physical inventory on the shelf at {shop.shopName}</p>
                </div>

                <div className="catalogue-search-bar">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search in this shop's inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Grid */}
              {filteredItems.length > 0 ? (
                <div className="products-grid">
                  {filteredItems.map((item) => (
                    <ProductCard key={item._id} item={item} shopName={shop.shopName} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="search"
                  title="No Matching Products Found"
                  description={
                    searchQuery
                      ? `No items matching "${searchQuery}" in this shop's catalogue.`
                      : 'This shop has not uploaded any catalogue items yet.'
                  }
                  actionLabel={searchQuery ? 'Clear Search' : undefined}
                  onAction={searchQuery ? () => setSearchQuery('') : undefined}
                />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <LocationModal />
    </div>
  );
}

export default ShopPage;

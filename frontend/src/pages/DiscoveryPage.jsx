import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { fetchApi } from '../services/api';
import { calculateDistance } from '../utils/haversine';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { EmptyState } from '../components/common/EmptyState';
import { ShopCard } from '../components/discovery/ShopCard';
import './DiscoveryPage.css';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'ornaments', label: 'Ornaments' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'hardware', label: 'Hardware' }
];

export function DiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { location, promptLocation } = useAppLocation();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Prompt location if not set
  useEffect(() => {
    if (!location) {
      promptLocation();
    }
  }, [location, promptLocation]);

  // Update URL when search or category changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, activeCategory, setSearchParams]);

  // Fetch results (refetches when debouncedQuery, activeCategory, or location changes!)
  useEffect(() => {
    let isCancelled = false;
    
    // Clear old results immediately on location/query/category change
    setShops([]);
    setLoading(true);
    setError(null);

    const fetchResults = async () => {
      try {
        let endpoint = '/shops';
        let queryParams = [];
        
        if (debouncedQuery) {
          endpoint = '/search';
          queryParams.push(`q=${encodeURIComponent(debouncedQuery)}`);
        }
        
        if (activeCategory && activeCategory !== 'all') {
          queryParams.push(`category=${encodeURIComponent(activeCategory)}`);
        }

        if (location?.lat && location?.lng) {
          queryParams.push(`lat=${location.lat}`);
          queryParams.push(`lng=${location.lng}`);
          queryParams.push(`radius=10`);
        }
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        const url = `${endpoint}${queryString}`;
        
        const data = await fetchApi(url);
        if (isCancelled) return;
        
        let fetchedShops = [];
        if (endpoint === '/search') {
          fetchedShops = data.shops || [];
        } else {
          fetchedShops = data || [];
        }
        
        // Strict distance calculation & 10 km radius enforcement
        if (location?.lat && location?.lng) {
          fetchedShops = fetchedShops
            .map(shop => {
              const distance = shop.distance !== undefined && shop.distance !== null
                ? shop.distance
                : calculateDistance(
                    location.lat, 
                    location.lng, 
                    shop.location?.lat, 
                    shop.location?.lng
                  );
              return { ...shop, distance };
            })
            .filter(shop => shop.distance !== null && shop.distance <= 10)
            .sort((a, b) => a.distance - b.distance);
        }
        
        if (!isCancelled) {
          setShops(fetchedShops);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch discovery data:', err);
          setError('Failed to load results. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, activeCategory, location]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleLocationClick = () => {
    promptLocation();
  };

  return (
    <div className="discovery-page-layout">
      <Header />
      
      <main className="discovery-main">
        {/* Search Header Section */}
        <div className="discovery-header-section">
          <div className="discovery-container">
            <div className="search-bar-container">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  className="discovery-search-input"
                  placeholder="Search for shops, brands, or items..."
                  value={query}
                  onChange={handleSearchChange}
                />
              </div>
              
              <button 
                className="location-display-btn" 
                onClick={handleLocationClick}
                title="Change Location"
              >
                <MapPin size={18} className="location-icon" />
                <span className="location-text">
                  {location ? (location.area || location.name || 'Current Location') : 'Set Location'}
                </span>
              </button>
            </div>

            {/* Category Chips */}
            <div className="category-chips-wrapper">
              <div className="category-chips-scroll">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="discovery-container results-section">
          <div className="results-header">
            <h2 className="results-title">
              {debouncedQuery 
                ? `Search results for "${debouncedQuery}"` 
                : (activeCategory !== 'all' 
                    ? `${CATEGORIES.find(c => c.id === activeCategory)?.label} Shops` 
                    : 'Discover Local Shops')}
            </h2>
            <span className="results-count">{shops.length} results</span>
          </div>

          {error && (
            <div className="discovery-error-state">
              <AlertCircle size={40} className="error-icon" />
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <SkeletonCard variant="shop-card" count={6} />
          ) : (
            <>
              {shops.length > 0 ? (
                <div className="shops-grid">
                  {shops.map(shop => (
                    <ShopCard 
                      key={shop._id} 
                      shop={shop} 
                      distance={shop.distance} 
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="search"
                  title="No Local Shops Found"
                  description="We couldn't find any shops matching your search query or selected category."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setQuery('');
                    setActiveCategory('all');
                  }}
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
};

export default DiscoveryPage;

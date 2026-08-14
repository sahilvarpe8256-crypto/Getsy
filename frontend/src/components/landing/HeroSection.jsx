import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import './HeroSection.css';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const { location, promptLocation } = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const searchAction = () => {
      navigate(`/discover?q=${encodeURIComponent(query)}`);
    };

    if (location) {
      searchAction();
    } else {
      promptLocation(searchAction);
    }
  };

  return (
    <section className="hero-section">
      <div className="container hero-container">
        {/* Shelf Visibility Pill Badge */}
        <div className="hero-pill animate-fade-in">
          <MapPin size={14} className="text-teal" />
          <span>Real-time local shelf visibility</span>
        </div>

        {/* Hero Main Heading */}
        <h1 className="hero-title animate-fade-in">
          See what's really on the shelf,<br />before you walk in
        </h1>

        {/* Hero Subtitle */}
        <p className="hero-subtitle animate-fade-in">
          Search live inventory of local shops near you — no more store-hopping, endless phone calls, or wasted trips.
        </p>

        {/* Large Prominent Search Pill */}
        <form className="hero-search-box animate-fade-in" onSubmit={handleSearch}>
          <Search size={20} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by category, product, or shop name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="hero-search-btn">
            Search
          </button>
        </form>

        {/* Location Hint */}
        <div className="hero-location-hint">
          {location ? (
            <span>
              📍 Showing local results around <strong>{location.name}</strong>
            </span>
          ) : (
            <span>📍 Choose your city/village to see live local inventory</span>
          )}
        </div>
      </div>
    </section>
  );
}

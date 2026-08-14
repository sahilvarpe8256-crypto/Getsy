import React, { useState } from 'react';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';
import './LocationModal.css';

export function LocationModal() {
  const { isModalOpen, closeModal, setLocation, PRESET_LOCATIONS } = useLocation();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [geoError, setGeoError] = useState(null);

  if (!isModalOpen) return null;

  const handleSetLocationWithToast = (loc) => {
    setLocation(loc);
    showToast(`Location set to ${loc.name} 📍`, 'success');
  };

  const handleUseGPS = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSetLocationWithToast({
          name: 'My Current Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isGPS: true,
        });
      },
      () => {
        setGeoError('Could not get position. Please choose a preset city below.');
      }
    );
  };

  const handleSearchPlaces = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGeoError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=3&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setGeoError('Place search failed. Please try a preset town below.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="location-modal-overlay" onClick={closeModal}>
      <div className="location-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <MapPin size={20} className="text-teal" /> Choose Your Discovery Location
          </h3>
          <button className="close-btn" onClick={closeModal}>
            <X size={20} />
          </button>
        </div>

        <p className="modal-sub">
          Getsy matches you with real physical shops nearby. Select your city or town to see what's on the shelf.
        </p>

        {geoError && <div className="modal-error">{geoError}</div>}

        {/* GPS Button */}
        <button className="gps-btn" onClick={handleUseGPS}>
          <Navigation size={18} />
          <span>Use my current location</span>
        </button>

        {/* City Search Form */}
        <form className="modal-search-form" onSubmit={handleSearchPlaces}>
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search city, town or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="search-btn" disabled={isSearching}>
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results-list">
            {searchResults.map((res) => (
              <button
                key={res.place_id}
                className="result-item"
                onClick={() =>
                  handleSetLocationWithToast({
                    name: res.display_name.split(',')[0],
                    lat: parseFloat(res.lat),
                    lng: parseFloat(res.lon),
                  })
                }
              >
                <MapPin size={16} />
                <span>{res.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Preset Cities */}
        <div className="presets-section">
          <h4>Popular Nearby Hubs</h4>
          <div className="presets-grid">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.name}
                className="preset-chip"
                onClick={() => handleSetLocationWithToast(preset)}
              >
                📍 {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

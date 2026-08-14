import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Grid, User, LogOut, Heart, MessageSquare } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export function Header() {
  const { location, openModal } = useLocation();
  const { user, isAuthenticated, logout, isOwner } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="getsy-header">
      <div className="container header-content">
        {/* Brand Logo & Name */}
        <Link to="/" className="brand-link">
          <img src="/getsy-logo.png" alt="Getsy Logo" className="brand-logo" />
          <span className="brand-title">Getsy</span>
        </Link>

        {/* Location Picker Badge */}
        <button className="location-badge-btn" onClick={openModal}>
          <MapPin size={16} className="location-icon" />
          <span className="location-text">
            {location ? `📍 ${location.name}` : 'Select Location'}
          </span>
          <span className="location-sub">▼</span>
        </button>

        {/* Right Navigation Controls */}
        <nav className="header-nav">
          <Link to="/discover" className="nav-item">
            <Grid size={18} />
            <span>Categories</span>
          </Link>

          <Link to="/discover" className="nav-item">
            <Search size={18} />
            <span>Search</span>
          </Link>

          {isAuthenticated && (
            <Link to="/community" className="nav-item">
              <MessageSquare size={18} />
              <span>Community</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="user-menu">
              <Link to={isOwner ? '/owner/dashboard' : '/dashboard'} className="nav-item user-btn">
                <User size={18} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button onClick={logout} className="logout-btn" title="Log out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-signup">
              Sign Up / Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

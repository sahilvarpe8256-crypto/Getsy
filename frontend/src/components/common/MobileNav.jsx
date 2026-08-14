import React from 'react';
import { NavLink, useLocation as useReactRouterLocation } from 'react-router-dom';
import { Home, Compass, MessageSquare, Heart, Store, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './MobileNav.css';

export function MobileNav() {
  const { isAuthenticated, isOwner } = useAuth();
  const reactRouterLocation = useReactRouterLocation();

  // Hide on auth page
  if (reactRouterLocation.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/discover" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <Compass size={20} />
        <span>Discover</span>
      </NavLink>

      {isAuthenticated && (
        <NavLink to="/community" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Community</span>
        </NavLink>
      )}

      {isAuthenticated ? (
        isOwner ? (
          <NavLink to="/owner/dashboard" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <Store size={20} />
            <span>Portal</span>
          </NavLink>
        ) : (
          <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <Heart size={20} />
            <span>Wishlist</span>
          </NavLink>
        )
      ) : (
        <NavLink to="/auth" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Log In</span>
        </NavLink>
      )}
    </nav>
  );
}

export default MobileNav;

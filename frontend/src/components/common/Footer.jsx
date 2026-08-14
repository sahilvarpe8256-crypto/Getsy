import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  return (
    <footer className="getsy-footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="footer-logo-wrap">
            <img src="/getsy-logo.png" alt="Getsy Logo" className="footer-logo" />
            <span className="footer-title">Getsy</span>
          </div>
          <p className="footer-tagline">
            Hyperlocal product-discovery platform for Indian towns & cities.
            See what's really on the shelf before you walk in.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/discover">Footwear</Link>
            <Link to="/discover">Clothing</Link>
            <Link to="/discover">Ornaments</Link>
            <Link to="/discover">Accessories</Link>
            <Link to="/discover">Hardware</Link>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/community">Community Requests</Link>
            <Link to="/auth">Shop Owner Login</Link>
            <Link to="/auth">Customer Sign Up</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#about">About Getsy</a>
            <a href="#support">Support</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© 2026 Getsy. All rights reserved. Know before you go.</p>
        </div>
      </div>
    </footer>
  );
}

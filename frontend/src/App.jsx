import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { ToastProvider } from './context/ToastContext';
import { MobileNav } from './components/common/MobileNav';
import { LandingPage } from './pages/LandingPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { CommunityPage } from './pages/CommunityPage';
import './components/common/Toast.css';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/discover" element={<DiscoveryPage />} />
            <Route path="/shops/:id" element={<ShopPage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/community" element={<CommunityPage />} />
          </Routes>
          <MobileNav />
        </ToastProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

import React from 'react';
import { Header } from '../components/common/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { SupportingSection } from '../components/landing/SupportingSection';
import { Footer } from '../components/common/Footer';
import { LocationModal } from '../components/common/LocationModal';

export function LandingPage() {
  return (
    <div className="landing-page-wrap">
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <SupportingSection />
      </main>
      <Footer />
      <LocationModal />
    </div>
  );
}

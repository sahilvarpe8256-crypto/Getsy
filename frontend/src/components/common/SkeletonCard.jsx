import React from 'react';
import './SkeletonCard.css';

export function SkeletonCard({ variant = 'shop-card', count = 1 }) {
  const items = Array.from({ length: count });

  if (variant === 'shop-card') {
    return (
      <div className="skeleton-grid">
        {items.map((_, i) => (
          <div key={i} className="skeleton-shop-card">
            <div className="skeleton-image shimmer"></div>
            <div className="skeleton-body">
              <div className="skeleton-line title shimmer"></div>
              <div className="skeleton-line text shimmer"></div>
              <div className="skeleton-line pill shimmer"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'product-card') {
    return (
      <div className="skeleton-grid">
        {items.map((_, i) => (
          <div key={i} className="skeleton-product-card">
            <div className="skeleton-image product shimmer"></div>
            <div className="skeleton-body">
              <div className="skeleton-line title shimmer"></div>
              <div className="skeleton-row">
                <div className="skeleton-line price shimmer"></div>
                <div className="skeleton-line badge shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail-hero') {
    return (
      <div className="skeleton-detail-hero">
        <div className="skeleton-image hero-img shimmer"></div>
        <div className="skeleton-hero-info">
          <div className="skeleton-line lg-title shimmer"></div>
          <div className="skeleton-line subtitle shimmer"></div>
          <div className="skeleton-line price-lg shimmer"></div>
          <div className="skeleton-block shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-default">
      {items.map((_, i) => (
        <div key={i} className="skeleton-block shimmer"></div>
      ))}
    </div>
  );
}

export default SkeletonCard;

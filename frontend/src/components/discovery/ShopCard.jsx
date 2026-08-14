import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Navigation, Eye, CheckCircle } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';
import './ShopCard.css';

export function ShopCard({ shop, distance }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/shops/${shop._id}`);
  };

  const displayDistance = distance ?? shop.distance;

  return (
    <div className="shop-card" onClick={handleCardClick}>
      <div className="shop-card-image-wrapper">
        <ImageWithFallback
          src={shop.image}
          alt={shop.shopName}
          variant="shop"
          fallbackText={shop.shopName}
          shopType={shop.shopType}
          shopName={shop.shopName}
        />
        {shop.verified && (
          <div className="shop-verified-badge">
            <CheckCircle size={14} /> Verified
          </div>
        )}
        <div className="shop-type-badge">{shop.shopType}</div>
      </div>
      
      <div className="shop-card-content">
        <h3 className="shop-card-title">{shop.shopName}</h3>
        
        <div className="shop-card-meta">
          <div className="shop-meta-item">
            <MapPin size={14} className="meta-icon" />
            <span>{shop.location?.area || shop.location?.address || 'Unknown Area'}</span>
          </div>
          {displayDistance !== null && displayDistance !== undefined && (
            <div className="shop-meta-item distance-badge">
              <Navigation size={14} className="meta-icon" />
              <span>{typeof displayDistance === 'number' ? displayDistance.toFixed(1) : displayDistance} km</span>
            </div>
          )}
        </div>

        <div className="shop-card-footer">
          <div className="shop-rating">
            <Star size={16} className="star-icon" fill="currentColor" />
            <span className="rating-value">{shop.rating?.toFixed(1) || 'New'}</span>
            {shop.reviewCount > 0 && <span className="review-count">({shop.reviewCount})</span>}
          </div>
          <div className="shop-visits">
            <Eye size={14} className="visit-icon" />
            <span>{shop.visitCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StockBadge } from './StockBadge';
import { ImageWithFallback } from '../common/ImageWithFallback';
import './ProductCard.css';

export function ProductCard({ item, shopName }) {
  const navigate = useNavigate();
  
  if (!item) return null;

  const rawImage = item.image || (item.images && item.images.length > 0 ? item.images[0] : null);

  const handleClick = () => {
    navigate(`/products/${item._id}`);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-card-image">
        <ImageWithFallback
          src={rawImage}
          alt={item.name}
          variant="product"
          fallbackText={item.name}
          category={item.category}
          type={item.type}
          subtype={item.subtype}
          productName={item.name}
        />
      </div>
      <div className="product-card-content">
        {shopName && <div className="product-card-shop">{shopName}</div>}
        <h3 className="product-card-title">{item.name}</h3>
        <div className="product-card-category">{item.category || item.type}</div>
        <div className="product-card-price">₹{item.price}</div>
        <div className="product-card-stock">
          <StockBadge stock={item.stock} sizes={item.sizes} />
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

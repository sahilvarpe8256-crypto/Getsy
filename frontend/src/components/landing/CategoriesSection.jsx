import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { getDemoCategoryImage } from '../../utils/demoImages';
import './CategoriesSection.css';

const PRIMARY_CATEGORIES = [
  {
    id: 'footwear',
    name: 'Footwear',
    count: 'Sneakers, Shoes, Sandals',
    color: '#EF4444',
    bg: '#FEE2E2',
    image: '/images/categories/footwear.jpg',
  },
  {
    id: 'clothing',
    name: 'Clothing',
    count: 'Kurtis, Shirts, Sarees, Dresses',
    color: '#0D9488',
    bg: '#CCFBF1',
    image: '/images/categories/clothing.jpg',
  },
  {
    id: 'ornaments',
    name: 'Ornaments',
    count: 'Gold, Silver, Jewellery',
    color: '#D97706',
    bg: '#FEF3C7',
    image: '/images/categories/ornaments.jpg',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    count: 'Bags, Watches, Eyewear',
    color: '#2563EB',
    bg: '#DBEAFE',
    image: '/images/categories/accessories.jpg',
  },
  {
    id: 'hardware',
    name: 'Hardware',
    count: 'Tools, Electrical, Fixtures',
    color: '#475569',
    bg: '#F1F5F9',
    image: '/images/categories/hardware.jpg',
  },
];

function CategoryImage({ cat }) {
  const [useFallback, setUseFallback] = useState(false);
  const src = useFallback ? getDemoCategoryImage(cat.id) : cat.image;

  return (
    <img
      src={src}
      alt={cat.name}
      className="category-image"
      onError={() => {
        if (!useFallback) setUseFallback(true);
      }}
    />
  );
}

export function CategoriesSection() {
  const { location, promptLocation } = useLocation();
  const navigate = useNavigate();

  const handleCategoryClick = (catId) => {
    const action = () => {
      navigate(`/discover?category=${catId}`);
    };

    if (location) {
      action();
    } else {
      promptLocation(action);
    }
  };

  return (
    <section className="categories-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Browse Catalogues</span>
          <h2 className="section-title">Explore What's Available Nearby</h2>
        </div>

        <div className="category-cards-grid">
          {PRIMARY_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="category-card"
              onClick={() => handleCategoryClick(cat.id)}
            >
              <div className="category-image-wrap">
                <CategoryImage cat={cat} />
              </div>
              <h3 className="category-name">{cat.name}</h3>
              <p className="category-sub">{cat.count}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

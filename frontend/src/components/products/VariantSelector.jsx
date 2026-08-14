import React from 'react';
import './VariantSelector.css';

export function VariantSelector({ sizes, selectedSize, onSelectSize }) {
  if (!sizes || sizes.length === 0) return null;

  return (
    <div className="variant-selector">
      <div className="variant-selector-title">Select Size:</div>
      <div className="variant-chips">
        {sizes.map((s, index) => {
          const sizeLabel = s.label || s.size;
          const isOutOfStock = s.stock <= 0;
          const isSelected = selectedSize === sizeLabel;
          
          return (
            <button
              key={index}
              className={`variant-chip ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
              onClick={() => !isOutOfStock && onSelectSize(sizeLabel)}
              disabled={isOutOfStock}
              type="button"
            >
              {sizeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VariantSelector;

import React from 'react';
import './StockBadge.css';

export function StockBadge({ stock, sizes }) {
  let totalStock = 0;
  
  if (Array.isArray(sizes) && sizes.length > 0) {
    totalStock = sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
  } else {
    totalStock = Number(stock || 0);
  }

  if (totalStock <= 0) {
    return (
      <span className="stock-badge out-of-stock">
        🔴 Out of Stock
      </span>
    );
  } else if (totalStock <= 3) {
    return (
      <span className="stock-badge low-stock">
        🟡 Low Stock ({totalStock} left)
      </span>
    );
  } else {
    return (
      <span className="stock-badge in-stock">
        🟢 In Stock ({totalStock} available)
      </span>
    );
  }
}

export default StockBadge;

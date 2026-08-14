import React, { useState, useMemo } from 'react';
import { ShoppingBag, Store } from 'lucide-react';
import { getImageUrl } from '../../utils/image';
import { getDemoShopImage, getDemoProductImage } from '../../utils/demoImages';
import './ImageWithFallback.css';

export function ImageWithFallback({
  src,
  alt = '',
  className = '',
  variant = 'product', // 'product' | 'shop'
  fallbackText,
  style = {},
  // Demo image metadata — pass these so we can resolve a demo image when src is empty
  shopType,      // for shop images: 'clothing', 'shoes', 'ornaments', etc.
  category,      // for product images: item.category
  type,          // for product images: item.type ('mens', 'womens', etc.)
  subtype,       // for product images: item.subtype ('Kurti', 'Sneakers', etc.)
  productName,   // for product images: item.name (used for keyword matching + determinism)
  shopName,      // for shop images: shop.shopName (used for determinism)
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const [demoError, setDemoError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const resolvedUrl = getImageUrl(src);

  // Compute demo image URL (only used when no database image exists)
  const demoUrl = useMemo(() => {
    if (variant === 'shop') {
      return getDemoShopImage(shopType, shopName || fallbackText);
    }
    return getDemoProductImage({ category, type, subtype, name: productName || fallbackText });
  }, [variant, shopType, shopName, category, type, subtype, productName, fallbackText]);

  // Determine which image to display:
  // Priority: database image → demo image → grey placeholder
  const useDemo = (!resolvedUrl || hasError) && demoUrl && !demoError;
  const activeUrl = resolvedUrl && !hasError ? resolvedUrl : useDemo ? demoUrl : null;

  // Grey icon placeholder — only shown when both database and demo images are unavailable
  if (!activeUrl) {
    return (
      <div className={`img-fallback-container variant-${variant} ${className}`} style={style}>
        {variant === 'shop' ? (
          <div className="img-fallback-icon-wrap">
            <Store className="img-fallback-icon" size={24} />
            <span className="img-fallback-text">{fallbackText || 'Shop Photo'}</span>
          </div>
        ) : (
          <div className="img-fallback-icon-wrap">
            <ShoppingBag className="img-fallback-icon" size={24} />
            <span className="img-fallback-text">{fallbackText || 'No Image'}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`img-with-fallback-wrap ${className}`} style={style}>
      {!loaded && <div className="img-skeleton-loader" />}
      <img
        src={activeUrl}
        alt={alt}
        className={`img-with-fallback-img variant-${variant} ${loaded ? 'loaded' : 'loading'}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (resolvedUrl && !hasError) {
            // Database image failed — try demo image next
            setHasError(true);
            setLoaded(false);
          } else if (useDemo) {
            // Demo image also failed — show grey placeholder
            setDemoError(true);
            setLoaded(false);
          }
        }}
        {...props}
      />
    </div>
  );
}

export default ImageWithFallback;

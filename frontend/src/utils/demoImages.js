/**
 * demoImages.js — Local demo image provider for GETSY 3.0 prototype.
 *
 * Uses 100% local realistic JPG photographs stored in `/images/demo/`
 * to guarantee instant, high-quality, offline presentation.
 *
 * Priority chain (handled by ImageWithFallback):
 *   1. Database image (shop.image / item.images[]) — always wins
 *   2. Local demo photo from `/images/demo/`
 *   3. Grey icon placeholder
 */

function simpleHash(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick(arr, seed) {
  if (!arr || arr.length === 0) return null;
  return arr[simpleHash(seed) % arr.length];
}

// ─── LOCAL REALISTIC SHOP STOREFRONT PHOTOGRAPHS ───────────────────────────
const SHOP_IMAGES = {
  clothing: [
    '/images/demo/shop_clothing_1.jpg',
    '/images/demo/shop_clothing_2.jpg',
  ],
  clothes: [
    '/images/demo/shop_clothing_1.jpg',
    '/images/demo/shop_clothing_2.jpg',
  ],
  footwear: [
    '/images/demo/shop_shoes_1.jpg',
    '/images/demo/shop_shoes_2.jpg',
  ],
  shoes: [
    '/images/demo/shop_shoes_1.jpg',
    '/images/demo/shop_shoes_2.jpg',
  ],
  ornaments: [
    '/images/demo/shop_ornaments_1.jpg',
    '/images/demo/shop_ornaments_2.jpg',
  ],
  accessories: [
    '/images/demo/shop_accessories_1.jpg',
  ],
  hardware: [
    '/images/demo/shop_hardware_1.jpg',
  ],
};

// ─── LOCAL REALISTIC PRODUCT PHOTOGRAPHS ───────────────────────────────────
const PRODUCT_IMAGES = {
  // Clothing
  kurti: [
    '/images/demo/kurti_2.jpg',
  ],
  lehenga: [
    '/images/demo/kurti_2.jpg',
    '/images/demo/shop_clothing_1.jpg',
  ],
  kurta: [
    '/images/demo/kurta_1.jpg',
    '/images/demo/kurta_2.jpg',
  ],

  // Footwear
  sneakers: [
    '/images/demo/sneakers_1.jpg',
    '/images/demo/sneakers_2.jpg',
  ],
  heels: [
    '/images/demo/heels_1.jpg',
  ],
  'school shoes': [
    '/images/demo/school_shoes_2.jpg',
    '/images/demo/sneakers_1.jpg',
  ],

  // Jewellery / Ornaments
  necklace: [
    '/images/demo/necklace_1.jpg',
  ],
  anklets: [
    '/images/demo/anklets_1.jpg',
    '/images/demo/anklets_2.jpg',
  ],
  earrings: [
    '/images/demo/earrings_1.jpg',
    '/images/demo/earrings_2.jpg',
  ],

  // Accessories & Hardware
  handbag: [
    '/images/demo/handbag_1.jpg',
  ],
  watch: [
    '/images/demo/watch_1.jpg',
  ],
  drill: [
    '/images/demo/drill_1.jpg',
  ],
};

// ─── Category-level fallbacks ──────────────────────────────────────────────
const CATEGORY_PRODUCT_FALLBACKS = {
  clothing: [
    '/images/demo/kurti_2.jpg',
    '/images/demo/kurta_1.jpg',
    '/images/demo/shop_clothing_1.jpg',
  ],
  clothes: [
    '/images/demo/kurti_2.jpg',
    '/images/demo/kurta_1.jpg',
  ],
  footwear: [
    '/images/demo/sneakers_1.jpg',
    '/images/demo/sneakers_2.jpg',
    '/images/demo/heels_1.jpg',
  ],
  shoes: [
    '/images/demo/sneakers_1.jpg',
    '/images/demo/sneakers_2.jpg',
  ],
  ornaments: [
    '/images/demo/necklace_1.jpg',
    '/images/demo/earrings_1.jpg',
    '/images/demo/anklets_1.jpg',
  ],
  accessories: [
    '/images/demo/handbag_1.jpg',
    '/images/demo/watch_1.jpg',
  ],
  hardware: [
    '/images/demo/drill_1.jpg',
    '/images/demo/shop_hardware_1.jpg',
  ],
};

const GENERIC_PRODUCT_FALLBACKS = [
  '/images/demo/product_generic.jpg',
  '/images/demo/sneakers_1.jpg',
  '/images/demo/handbag_1.jpg',
];

const GENERIC_SHOP_FALLBACKS = [
  '/images/demo/shop_generic.jpg',
  '/images/demo/shop_clothing_1.jpg',
  '/images/demo/shop_shoes_1.jpg',
];

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

export function getDemoShopImage(shopType, shopName) {
  const type = (shopType || '').toLowerCase().trim();
  const pool = SHOP_IMAGES[type] || GENERIC_SHOP_FALLBACKS;
  return pick(pool, shopName || type);
}

export function getDemoProductImage(meta = {}) {
  const { category, type, subtype, name } = meta;
  const seed = `${name || ''}${subtype || ''}${type || ''}`;
  const subtypeLower = (subtype || '').toLowerCase().trim();
  const nameLower = (name || '').toLowerCase().trim();
  const categoryLower = (category || '').toLowerCase().trim();

  if (PRODUCT_IMAGES[subtypeLower]) {
    return pick(PRODUCT_IMAGES[subtypeLower], seed);
  }

  for (const [keyword, images] of Object.entries(PRODUCT_IMAGES)) {
    if (nameLower.includes(keyword) || subtypeLower.includes(keyword)) {
      return pick(images, seed);
    }
  }

  if (CATEGORY_PRODUCT_FALLBACKS[categoryLower]) {
    return pick(CATEGORY_PRODUCT_FALLBACKS[categoryLower], seed);
  }

  return pick(GENERIC_PRODUCT_FALLBACKS, seed);
}

export function getDemoProductGallery(meta = {}) {
  const { category, type, subtype, name } = meta;
  const subtypeLower = (subtype || '').toLowerCase().trim();
  const nameLower = (name || '').toLowerCase().trim();
  const categoryLower = (category || '').toLowerCase().trim();

  let pool = null;

  if (PRODUCT_IMAGES[subtypeLower]) {
    pool = PRODUCT_IMAGES[subtypeLower];
  } else {
    for (const [keyword, images] of Object.entries(PRODUCT_IMAGES)) {
      if (nameLower.includes(keyword) || subtypeLower.includes(keyword)) {
        pool = images;
        break;
      }
    }
  }

  if (!pool) {
    pool = CATEGORY_PRODUCT_FALLBACKS[categoryLower] || GENERIC_PRODUCT_FALLBACKS;
  }

  const result = [];
  const seen = new Set();
  for (let i = 0; i < Math.min(3, pool.length); i++) {
    const img = pool[i];
    if (!seen.has(img)) {
      seen.add(img);
      result.push(img);
    }
  }
  return result;
}

export function getDemoCategoryImage(categoryId) {
  const id = (categoryId || '').toLowerCase().trim();
  const pool = SHOP_IMAGES[id] || GENERIC_SHOP_FALLBACKS;
  return pool[0] || GENERIC_SHOP_FALLBACKS[0];
}

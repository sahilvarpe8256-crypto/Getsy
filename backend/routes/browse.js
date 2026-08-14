const express = require("express");
const Shop = require("../models/Shop");
const CatalogueItem = require("../models/CatalogueItem");

const router = express.Router();

// Expanded PRD Category list (Footwear, Clothing, Ornaments, Accessories, Hardware)
const CATEGORIES = {
  footwear: {
    label: "Footwear",
    types: {
      mens: { label: "Men", subtypes: ["Sneakers", "Formal", "Sandals", "Boots"] },
      womens: { label: "Women", subtypes: ["Heels", "Flats", "Sneakers", "Sandals"] },
      kids: { label: "Kids", subtypes: ["School shoes", "Sandals", "Sneakers"] },
    },
  },
  clothing: {
    label: "Clothing",
    types: {
      mens: { label: "Men", subtypes: ["Shirt", "Kurta", "Trousers", "Jeans", "T-Shirt"] },
      womens: { label: "Women", subtypes: ["Kurti", "Top", "Lehenga", "Saree", "Dress"] },
      children: { label: "Children", subtypes: ["T-Shirt", "Frock", "Shorts", "Nightwear"] },
      aged: { label: "Senior citizen", subtypes: ["Nightwear", "Shawl", "Comfort wear"] },
    },
  },
  ornaments: {
    label: "Ornaments",
    types: {
      gold: { label: "Gold", subtypes: ["Necklace", "Earrings", "Bangles", "Ring"] },
      silver: { label: "Silver", subtypes: ["Necklace", "Anklets", "Rings", "Pendant"] },
      imitation: { label: "Imitation", subtypes: ["Necklace", "Earrings", "Set"] },
    },
  },
  accessories: {
    label: "Accessories",
    types: {
      bags: { label: "Bags", subtypes: ["Handbag", "Backpack", "Wallet", "Clutch"] },
      watches: { label: "Watches", subtypes: ["Analog", "Digital", "Smartwatch"] },
      eyewear: { label: "Eyewear", subtypes: ["Sunglasses", "Frames"] },
    },
  },
  hardware: {
    label: "Hardware",
    types: {
      tools: { label: "Tools", subtypes: ["Drill", "Hand Tools", "Power Tools"] },
      fixtures: { label: "Fixtures", subtypes: ["Taps", "Locks", "Electrical", "Paint"] },
    },
  },
  // Backward compatibility aliases
  clothes: {
    label: "Clothes",
    types: {
      mens: { label: "Men", subtypes: ["Shirt", "Kurta", "Trousers"] },
      womens: { label: "Women", subtypes: ["Kurti", "Top", "Lehenga", "Saree"] },
      children: { label: "Children", subtypes: ["T-Shirt", "Frock", "Shorts"] },
    },
  },
  shoes: {
    label: "Shoes",
    types: {
      mens: { label: "Men", subtypes: ["Sneakers", "Formal", "Sandals"] },
      womens: { label: "Women", subtypes: ["Heels", "Flats", "Sneakers"] },
    },
  },
};

// Haversine distance calculator in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function processShopsLocation(shopsArr, userLat, userLng, maxRadius = 10) {
  let processed = shopsArr.map((shop) => {
    const shopObj = shop.toObject ? shop.toObject() : { ...shop };
    if (userLat != null && userLng != null && shopObj.location?.lat != null && shopObj.location?.lng != null) {
      const dist = calculateDistance(userLat, userLng, shopObj.location.lat, shopObj.location.lng);
      shopObj.distance = dist;
    } else {
      shopObj.distance = null;
    }
    return shopObj;
  });

  if (userLat != null && userLng != null) {
    // STRICT LOCATION RELEVANCE: Only include shops with valid coordinates within maxRadius (10 km)
    processed = processed.filter((s) => s.distance !== null && s.distance <= maxRadius);
    // Sort by distance (nearest first)
    processed.sort((a, b) => a.distance - b.distance);
  }

  return processed;
}

router.get("/categories", (req, res) => {
  res.json(CATEGORIES);
});

// Unified Search Endpoint (PRD §6)
router.get("/search", async (req, res) => {
  try {
    const { q, category, lat, lng, radius } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const maxRadius = radius ? parseFloat(radius) : 10;

    if (!q && !category) {
      const rawShops = await Shop.find({ verified: true }).limit(50);
      const shops = processShopsLocation(rawShops, userLat, userLng, maxRadius);
      return res.json({ shops, items: [] });
    }

    const regex = q ? new RegExp(q.trim(), "i") : null;

    // Search shops by name, category, or address
    const shopFilter = { verified: true };
    if (category) shopFilter.shopType = new RegExp(category, "i");
    if (regex) {
      shopFilter.$or = [
        { shopName: regex },
        { shopType: regex },
        { "location.address": regex },
        { "location.area": regex },
        { landmark: regex },
      ];
    }
    const rawShops = await Shop.find(shopFilter);
    const shops = processShopsLocation(rawShops, userLat, userLng, maxRadius);

    // Search catalogue items by name, category, type, subtype, or description
    const itemFilter = { status: "active" };
    if (category) itemFilter.category = new RegExp(category, "i");
    if (regex) {
      itemFilter.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
        { type: regex },
        { subtype: regex },
      ];
    }
    const rawItems = await CatalogueItem.find(itemFilter).populate("shopId").limit(50);

    let items = rawItems.map((item) => {
      const itemObj = item.toObject();
      if (userLat != null && userLng != null && itemObj.shopId?.location?.lat != null) {
        const dist = calculateDistance(userLat, userLng, itemObj.shopId.location.lat, itemObj.shopId.location.lng);
        if (itemObj.shopId) itemObj.shopId.distance = dist;
        itemObj.distance = dist;
      } else {
        itemObj.distance = null;
      }
      return itemObj;
    });

    if (userLat != null && userLng != null) {
      // STRICT LOCATION RELEVANCE for items
      items = items.filter((item) => item.distance !== null && item.distance <= maxRadius);
      items.sort((a, b) => a.distance - b.distance);
    }

    res.json({ shops, items });
  } catch (err) {
    res.status(500).json({ error: "Search failed", detail: err.message });
  }
});

// Find shops (optional type+subtype query, or all verified shops)
router.get("/shops", async (req, res) => {
  try {
    const { type, subtype, category, lat, lng, radius } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const maxRadius = radius ? parseFloat(radius) : 10;

    if (type && subtype) {
      const items = await CatalogueItem.find({ type, subtype, status: "active" }).select("shopId sizes");
      const shopIds = [...new Set(items.map((i) => i.shopId.toString()))];
      const rawShops = await Shop.find({ _id: { $in: shopIds }, verified: true });
      const processed = processShopsLocation(rawShops, userLat, userLng, maxRadius);
      const result = processed.map((shop) => {
        const shopItems = items.filter((i) => i.shopId.toString() === shop._id.toString());
        const inStock = shopItems.some((i) => i.sizes.some((s) => s.stock > 0));
        return { ...shop, inStockForQuery: inStock };
      });
      return res.json(result);
    }

    const filter = { verified: true };
    if (category) filter.shopType = new RegExp(category, "i");

    const rawShops = await Shop.find(filter);
    const shops = processShopsLocation(rawShops, userLat, userLng, maxRadius);
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: "Search failed", detail: err.message });
  }
});

// Fetch single shop details by ID
router.get("/shops/:id", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: "Failed to load shop", detail: err.message });
  }
});

// Shop's full catalogue (increments visit count)
router.get("/shops/:id/catalogue", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    // Only count this as a fresh visit once per browser session (see frontend),
    // so re-opening the same shop's catalogue page (e.g. going back from an
    // item) doesn't inflate the count.
    if (req.query.countVisit !== "false") {
      shop.visitCount += 1;
      await shop.save();
    }

    // If the customer arrived here from a specific category search, only show
    // items matching that type+subtype — not the shop's entire catalogue.
    const { type, subtype } = req.query;
    const filter = { shopId: shop._id, status: "active" };
    if (type) filter.type = type;
    if (subtype) filter.subtype = subtype;

    const items = await CatalogueItem.find(filter);
    res.json({ shop, items });
  } catch (err) {
    res.status(500).json({ error: "Failed to load catalogue", detail: err.message });
  }
});

// Fetch single item details by ID with populated shopId
router.get("/items/:id", async (req, res) => {
  try {
    const item = await CatalogueItem.findById(req.params.id).populate("shopId");
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to load item", detail: err.message });
  }
});

module.exports = router;

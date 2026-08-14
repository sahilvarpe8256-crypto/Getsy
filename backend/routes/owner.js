const express = require("express");
const Shop = require("../models/Shop");
const CatalogueItem = require("../models/CatalogueItem");
const Booking = require("../models/Booking");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();
router.use(requireAuth, requireRole("owner"));

async function myShop(req) {
  return Shop.findOne({ ownerId: req.user.userId });
}

// Wraps multer's single-file middleware so upload errors (bad file type, too
// large, etc.) come back as a normal JSON error instead of crashing the request.
function handleImageUpload(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// ---- Set or update this shop's precise map location ----
router.patch("/shop/location", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const { lat, lng, label } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng (numbers) are required" });
    }

    shop.location.lat = lat;
    shop.location.lng = lng;
    if (label) shop.location.area = label;
    await shop.save();

    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: "Failed to save shop location", detail: err.message });
  }
});

const { resolveCoordinates } = require("../utils/geocoder");

// ---- Update shop profile (text fields) ----
router.patch("/shop", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const { shopName, shopType, landmark, address, area, gstNumber, lat, lng } = req.body;
    if (shopName !== undefined) shop.shopName = shopName;
    if (shopType !== undefined) shop.shopType = shopType;
    if (landmark !== undefined) shop.landmark = landmark;
    if (address !== undefined) shop.location.address = address;
    if (area !== undefined) shop.location.area = area;
    if (gstNumber !== undefined) shop.gstNumber = gstNumber;

    if (address !== undefined || area !== undefined || lat !== undefined || lng !== undefined) {
      const newAddr = address !== undefined ? address : shop.location.address;
      const newArea = area !== undefined ? area : shop.location.area;
      const coords = resolveCoordinates(newAddr, newArea, lat, lng);
      shop.location.lat = coords.lat;
      shop.location.lng = coords.lng;
    }

    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: "Failed to update shop profile", detail: err.message });
  }
});

// ---- Upload or replace shop image ----
router.post("/shop/image", handleImageUpload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file received" });

    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    shop.image = `/uploads/${req.file.filename}`;
    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: "Failed to upload shop image", detail: err.message });
  }
});

// ---- Dashboard summary ----
router.get("/dashboard", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const bookingsCount = await Booking.countDocuments({ shopId: shop._id });
    const activeReservations = await Booking.countDocuments({ shopId: shop._id, status: "reserved" });

    res.json({
      shop,
      visits: shop.visitCount,
      bookingsCount,
      activeReservations,
      rating: shop.rating,
      reviewCount: shop.reviewCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard", detail: err.message });
  }
});

// ---- Add catalogue item (multipart/form-data, optional "image" file field) ----
router.post("/catalogue", handleImageUpload, async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const { type, subtype, name, description, price } = req.body;
    if (!type || !subtype || !name || !price) {
      return res.status(400).json({ error: "type, subtype, name and price are required" });
    }

    // sizes may arrive as a JSON string (multipart form) or an array (JSON request)
    let sizes = req.body.sizes;
    if (typeof sizes === "string") {
      try { sizes = JSON.parse(sizes); } catch { sizes = null; }
    }

    const images = [];
    if (req.file) images.push(`/uploads/${req.file.filename}`);

    const item = await CatalogueItem.create({
      shopId: shop._id,
      category: shop.shopType,
      type,
      subtype,
      name,
      description,
      price,
      images,
      sizes: Array.isArray(sizes) && sizes.length ? sizes : [{ label: "Standard", stock: 0 }],
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to add item", detail: err.message });
  }
});

// ---- Upload or replace the photo on an existing item ----
router.post("/catalogue/:id/image", handleImageUpload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file received (field name must be 'image')" });

    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const item = await CatalogueItem.findOne({ _id: req.params.id, shopId: shop._id });
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.images = [`/uploads/${req.file.filename}`];
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to upload image", detail: err.message });
  }
});

// ---- List my catalogue ----
router.get("/catalogue", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });
    const items = await CatalogueItem.find({ shopId: shop._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to load catalogue", detail: err.message });
  }
});

// ---- Edit catalogue item (price, stock, images, status) ----
router.patch("/catalogue/:id", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const item = await CatalogueItem.findOne({ _id: req.params.id, shopId: shop._id });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const { price, images, sizes, status, description, name, type, subtype } = req.body;
    if (price !== undefined) item.price = price;
    if (images !== undefined) item.images = images;
    if (sizes !== undefined) item.sizes = sizes;
    if (status !== undefined) item.status = status;
    if (description !== undefined) item.description = description;
    if (name !== undefined) item.name = name;
    if (type !== undefined) item.type = type;
    if (subtype !== undefined) item.subtype = subtype;

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item", detail: err.message });
  }
});

// ---- Delete a catalogue item ----
router.delete("/catalogue/:id", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const item = await CatalogueItem.findOneAndDelete({ _id: req.params.id, shopId: shop._id });
    if (!item) return res.status(404).json({ error: "Item not found" });

    res.json({ ok: true, deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item", detail: err.message });
  }
});

// ---- Incoming bookings for my shop ----
router.get("/bookings", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });
    const bookings = await Booking.find({ shopId: shop._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load bookings", detail: err.message });
  }
});

// ---- Confirm a customer showed up in-store ----
router.patch("/bookings/:id/confirm", async (req, res) => {
  try {
    const shop = await myShop(req);
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const booking = await Booking.findOne({ _id: req.params.id, shopId: shop._id });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "reserved") {
      return res.status(400).json({ error: `Booking is already "${booking.status}"` });
    }

    booking.status = "confirmed_in_store";
    booking.confirmedAt = new Date();
    await booking.save();

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm booking", detail: err.message });
  }
});

module.exports = router;

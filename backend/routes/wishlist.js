const express = require("express");
const Wishlist = require("../models/Wishlist");
const CatalogueItem = require("../models/CatalogueItem");
const Shop = require("../models/Shop");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get customer's wishlist with populated item and shop details
router.get("/", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const list = await Wishlist.find({ customerId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "itemId",
        populate: { path: "shopId", select: "shopName location rating reviewCount image landmark" },
      });

    // Format output cleanly
    const items = list
      .filter((entry) => entry.itemId) // filter out deleted products
      .map((entry) => {
        const item = entry.itemId;
        return {
          wishlistId: entry._id,
          savedAt: entry.createdAt,
          item: {
            id: item._id,
            name: item.name,
            price: item.price,
            images: item.images,
            category: item.category,
            type: item.type,
            subtype: item.subtype,
            sizes: item.sizes,
            totalStock: (item.sizes || []).reduce((sum, s) => sum + s.stock, 0),
            shop: item.shopId,
          },
        };
      });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wishlist", detail: err.message });
  }
});

// Add item to wishlist
router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: "itemId is required" });

    const item = await CatalogueItem.findById(itemId);
    if (!item) return res.status(404).json({ error: "Product not found" });

    const existing = await Wishlist.findOne({ customerId: req.user.userId, itemId });
    if (existing) {
      return res.status(200).json({ message: "Already in wishlist", wishlist: existing });
    }

    const created = await Wishlist.create({
      customerId: req.user.userId,
      itemId,
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to wishlist", detail: err.message });
  }
});

// Remove item from wishlist
router.delete("/:itemId", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { itemId } = req.params;
    await Wishlist.findOneAndDelete({ customerId: req.user.userId, itemId });
    res.json({ ok: true, removedItemId: itemId });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from wishlist", detail: err.message });
  }
});

module.exports = router;

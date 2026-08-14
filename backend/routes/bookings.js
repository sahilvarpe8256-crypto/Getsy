const express = require("express");
const CatalogueItem = require("../models/CatalogueItem");
const Booking = require("../models/Booking");
const Shop = require("../models/Shop");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function generateCode() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DK-${Date.now().toString().slice(-6)}${rand}`;
}

// ---- Create a reservation (atomic stock decrement) ----
router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { itemId, size } = req.body;
    if (!itemId || !size) return res.status(400).json({ error: "itemId and size are required" });

    // Guard against a customer hoarding stock with many open reservations
    const activeCount = await Booking.countDocuments({ customerId: req.user.userId, status: "reserved" });
    if (activeCount >= 3) {
      return res.status(429).json({ error: "You already have 3 active reservations. Complete or cancel one first." });
    }

    // Atomic conditional update: only succeeds if that size still has stock.
    // This is what prevents two customers reserving the same last unit.
    const updated = await CatalogueItem.findOneAndUpdate(
      { _id: itemId, sizes: { $elemMatch: { label: size, stock: { $gt: 0 } } } },
      { $inc: { "sizes.$.stock": -1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ error: "That size just went out of stock. Please pick another." });
    }

    const shop = await Shop.findById(updated.shopId);

    const hours = Number(process.env.RESERVATION_HOURS || 48);
    const booking = await Booking.create({
      code: generateCode(),
      customerId: req.user.userId,
      shopId: updated.shopId,
      itemId: updated._id,
      itemNameSnapshot: updated.name,
      itemImageSnapshot: updated.images && updated.images[0] ? updated.images[0] : undefined,
      shopNameSnapshot: shop ? shop.shopName : undefined,
      shopLocationSnapshot: shop ? {
        address: shop.location.address,
        lat: shop.location.lat,
        lng: shop.location.lng,
      } : undefined,
      priceSnapshot: updated.price,
      size,
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: "Booking failed", detail: err.message });
  }
});

// ---- Customer's own bookings ----
router.get("/me", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to load bookings", detail: err.message });
  }
});

// ---- Cancel a reservation (releases stock back) ----
router.patch("/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user.userId });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "reserved") {
      return res.status(400).json({ error: `Cannot cancel a booking with status "${booking.status}"` });
    }

    booking.status = "cancelled";
    await booking.save();

    await CatalogueItem.updateOne(
      { _id: booking.itemId, "sizes.label": booking.size },
      { $inc: { "sizes.$.stock": 1 } }
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Cancel failed", detail: err.message });
  }
});

module.exports = router;

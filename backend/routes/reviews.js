const express = require("express");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

const router = express.Router();

// Get reviews for a specific shop
router.get("/shops/:shopId/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ shopId: req.params.shopId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews", detail: err.message });
  }
});

// Get reviews for a specific item (via item bookings)
router.get("/items/:itemId/reviews", async (req, res) => {
  try {
    const bookings = await Booking.find({ itemId: req.params.itemId }).select("_id");
    const bookingIds = bookings.map((b) => b._id);
    const reviews = await Review.find({ bookingId: { $in: bookingIds } })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch item reviews", detail: err.message });
  }
});

module.exports = router;

const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ---- Get current user profile ----
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      role: user.role,
      location: user.location || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user profile", detail: err.message });
  }
});

// ---- Update user profile (name, mobile) ----
router.patch("/me/profile", requireAuth, async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (mobile) {
      const cleanMobile = mobile.trim();
      if (!/^\d{10}$/.test(cleanMobile)) {
        return res.status(400).json({ error: "Mobile number must be a 10-digit number" });
      }
      updates.mobile = cleanMobile;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      role: user.role,
      location: user.location || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile", detail: err.message });
  }
});

// ---- Set or update the current user's location ----
router.patch("/me/location", requireAuth, async (req, res) => {
  try {
    const { lat, lng, label } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng (numbers) are required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { location: { lat, lng, label } } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ location: user.location });
  } catch (err) {
    res.status(500).json({ error: "Failed to save location", detail: err.message });
  }
});

module.exports = router;

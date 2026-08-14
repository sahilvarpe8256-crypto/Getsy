const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Shop = require("../models/Shop");
const { signAccessToken, signRefreshToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

function issueTokens(user, shopId) {
  const payload = { userId: user._id.toString(), role: user.role };
  if (shopId) payload.shopId = shopId.toString();
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function formatUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    role: user.role,
    email: user.email,
    mobile: user.mobile || null,
    location: user.location || null,
  };
}

// ---- Register customer ----
router.post("/register/customer", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ error: "name, mobile, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ role: "customer", name, mobile, email, passwordHash });

    const tokens = issueTokens(user);
    res.status(201).json({ user: formatUserResponse(user), ...tokens });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", detail: err.message });
  }
});

const { resolveCoordinates } = require("../utils/geocoder");

// ---- Register owner (creates User + Shop together) ----
router.post("/register/owner", upload.single("image"), async (req, res) => {
  let user = null;
  try {
    const { name, email, password, shopName, shopType, address, area, landmark, gstNumber, lat, lng } = req.body;
    let image = req.body.image || null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    if (!name || !email || !password || !shopName || !shopType || !address) {
      return res.status(400).json({ error: "name, email, password, shopName, shopType and address are required" });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ error: "An account with this email already exists" });

    const coords = resolveCoordinates(address, area, lat, lng);

    const passwordHash = await bcrypt.hash(password, 12);
    user = await User.create({ role: "owner", name, email: cleanEmail, passwordHash });

    let shop;
    try {
      shop = await Shop.create({
        ownerId: user._id,
        shopName,
        shopType,
        landmark,
        image,
        location: {
          address,
          area: area || address,
          lat: coords.lat,
          lng: coords.lng,
        },
        gstNumber,
        verified: true,
      });
    } catch (shopErr) {
      if (user && user._id) {
        await User.deleteOne({ _id: user._id });
      }
      throw shopErr;
    }

    const tokens = issueTokens(user, shop._id);
    res.status(201).json({
      user: formatUserResponse(user),
      shop,
      ...tokens,
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", detail: err.message });
  }
});

// ---- Login (shared by both roles) ----
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    user.lastLoginAt = new Date();
    await user.save();

    let shop = null;
    if (user.role === "owner") {
      shop = await Shop.findOne({ ownerId: user._id });
    }

    const tokens = issueTokens(user, shop ? shop._id : null);
    res.json({
      user: formatUserResponse(user),
      shop,
      ...tokens,
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", detail: err.message });
  }
});

// ---- Refresh access token ----
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = signAccessToken({
      userId: decoded.userId,
      role: decoded.role,
      shopId: decoded.shopId,
    });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

module.exports = router;

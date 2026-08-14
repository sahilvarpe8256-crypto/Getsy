const express = require("express");
const CommunityRequest = require("../models/CommunityRequest");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

function handleImageUpload(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// ---- Community Feed (accessible to public & logged-in users) ----
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== "all" ? { category } : {};
    const posts = await CommunityRequest.find(filter)
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to load community feed", detail: err.message });
  }
});

// ---- Customer posts a request (multipart/form-data or JSON) ----
router.post("/", requireAuth, requireRole("customer"), handleImageUpload, async (req, res) => {
  try {
    const { category, description } = req.body;
    if (!category || !description) {
      return res.status(400).json({ error: "category and description are required" });
    }

    let imageUrl = req.body.imageUrl || null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await CommunityRequest.create({
      customerId: req.user.userId,
      category,
      description,
      imageUrl,
    });

    const populated = await CommunityRequest.findById(post._id).populate("customerId", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to post request", detail: err.message });
  }
});

// ---- Owner replies "I have this in stock" ----
router.post("/:id/reply", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const shop = await Shop.findOne({ ownerId: req.user.userId });
    if (!shop) return res.status(404).json({ error: "Shop not found for this account" });

    const post = await CommunityRequest.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Request not found" });

    post.replies.push({ shopId: shop._id, shopName: shop.shopName, message });
    await post.save();

    const populated = await CommunityRequest.findById(post._id).populate("customerId", "name email");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to reply to request", detail: err.message });
  }
});

// ---- Customer updates status (e.g. close request) ----
router.patch("/:id/status", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({ error: "status must be 'open' or 'closed'" });
    }

    const post = await CommunityRequest.findOne({ _id: req.params.id, customerId: req.user.userId });
    if (!post) return res.status(404).json({ error: "Request not found or unauthorized" });

    post.status = status;
    await post.save();

    const populated = await CommunityRequest.findById(post._id).populate("customerId", "name email");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update request status", detail: err.message });
  }
});

// ---- Customer deletes their request ----
router.delete("/:id", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const post = await CommunityRequest.findOneAndDelete({ _id: req.params.id, customerId: req.user.userId });
    if (!post) return res.status(404).json({ error: "Request not found or unauthorized" });

    res.json({ ok: true, deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete request", detail: err.message });
  }
});

module.exports = router;

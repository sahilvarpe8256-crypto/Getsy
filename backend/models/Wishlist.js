const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "CatalogueItem", required: true },
  },
  { timestamps: true }
);

wishlistSchema.index({ customerId: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);

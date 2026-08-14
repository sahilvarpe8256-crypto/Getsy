const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shopName: { type: String, required: true },
    shopType: {
      type: String,
      required: true,
      enum: ["clothes", "clothing", "shoes", "footwear", "ornaments", "accessories", "hardware"],
    },
    image: { type: String },
    landmark: { type: String },
    location: {
      address: { type: String, required: true },
      area: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    gstNumber: { type: String },
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);

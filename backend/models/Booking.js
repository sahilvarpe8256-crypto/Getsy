const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "CatalogueItem", required: true },
    itemNameSnapshot: { type: String, required: true },
    itemImageSnapshot: { type: String },
    shopNameSnapshot: { type: String },
    shopLocationSnapshot: {
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    priceSnapshot: { type: Number, required: true },
    size: { type: String, required: true },
    status: {
      type: String,
      enum: ["reserved", "expired", "cancelled", "confirmed_in_store", "paid"],
      default: "reserved",
    },
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    confirmedAt: { type: Date },
    commissionAmount: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);

const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const catalogueItemSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    category: { type: String, enum: ["clothes", "shoes", "ornaments", "footwear", "clothing", "accessories", "hardware"], required: true },
    type: { type: String, required: true },     // e.g. "womens", "mens", "gold"
    subtype: { type: String, required: true },  // e.g. "Kurti", "Sneakers"
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: [{ type: String }],
    sizes: { type: [sizeSchema], default: [{ label: "Standard", stock: 0 }] },
    status: { type: String, enum: ["active", "hidden"], default: "active" },
  },
  { timestamps: true }
);

// Denormalized field used for fast "in stock" filtering
catalogueItemSchema.virtual("totalStock").get(function () {
  return this.sizes.reduce((sum, s) => sum + s.stock, 0);
});
catalogueItemSchema.set("toJSON", { virtuals: true });

catalogueItemSchema.index({ category: 1, type: 1, subtype: 1, shopId: 1 });
catalogueItemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("CatalogueItem", catalogueItemSchema);

const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    shopName: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const communityRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityRequest", communityRequestSchema);

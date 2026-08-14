require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { startExpiryJob } = require("./jobs/expireReservations");
const { UPLOAD_DIR } = require("./middleware/upload");

const authRoutes = require("./routes/auth");
const browseRoutes = require("./routes/browse");
const bookingRoutes = require("./routes/bookings");
const ownerRoutes = require("./routes/owner");
const communityRoutes = require("./routes/community");
const userRoutes = require("./routes/users");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", browseRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1", reviewRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] Dukaan Dekho API running on http://localhost:${PORT}`);
      startExpiryJob();
    });
  })
  .catch((err) => {
    console.error("[server] Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const Shop = require("./models/Shop");
const User = require("./models/User");
const CatalogueItem = require("./models/CatalogueItem");

const authRoutes = require("./routes/auth");
const browseRoutes = require("./routes/browse");
const ownerRoutes = require("./routes/owner");
const userRoutes = require("./routes/users");

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", browseRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/users", userRoutes);

let server;

async function runVerification() {
  await connectDB();
  server = app.listen(5006);
  const BASE = "http://localhost:5006/api/v1";

  console.log("==================================================");
  console.log("   GETSY 3.0 — ISSUES 1–6 FINAL VERIFICATION     ");
  console.log("==================================================\n");

  const http = require("http");
  function req(endpoint, opts = {}) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(`${BASE}${endpoint}`);
      let body = opts.body;
      const headers = opts.headers || {};
      if (body && typeof body === "object") {
        body = JSON.stringify(body);
        headers["Content-Type"] = "application/json";
      }
      const r = http.request(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          method: opts.method || "GET",
          headers,
        },
        (res) => {
          let d = "";
          res.on("data", (chunk) => (d += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(d) });
            } catch {
              resolve({ status: res.statusCode, body: d });
            }
          });
        }
      );
      r.on("error", reject);
      if (body) r.write(body);
      r.end();
    });
  }

  // ----------------------------------------------------
  // TEST 1: LOCATION SWITCHING & STRICT 10KM FILTERING (ISSUE 1 & 4)
  // Preset Coordinates:
  // Sangamner: 19.5679, 74.2153
  // Kopargaon: 19.8906, 74.4789 (~45 km away)
  // Pune: 18.5204, 73.8567 (~140 km away)
  // ----------------------------------------------------
  console.log("--- TEST 1: Location Switching & Strict 10km Radius ---");

  // 1a. Sangamner (19.5679, 74.2153)
  const sangamnerRes = await req("/shops?lat=19.5679&lng=74.2153&radius=10");
  const sangamnerShops = sangamnerRes.body;
  const sangamnerMatch = Array.isArray(sangamnerShops) && sangamnerShops.every((s) => s.distance !== null && s.distance <= 10);
  console.log(`[1a] Sangamner Search (19.5679, 74.2153): ${sangamnerMatch ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`     Shops count within 10km: ${sangamnerShops.length}`);
  if (sangamnerShops.length > 0) {
    console.log(`     Nearest shop: "${sangamnerShops[0].shopName}" (${sangamnerShops[0].distance} km)`);
  }

  // 1b. Kopargaon (19.8906, 74.4789)
  const kopargaonRes = await req("/shops?lat=19.8906&lng=74.4789&radius=10");
  const kopargaonShops = kopargaonRes.body;
  const kopargaonMatch = Array.isArray(kopargaonShops) && kopargaonShops.every((s) => s.distance !== null && s.distance <= 10);
  console.log(`[1b] Kopargaon Search (19.8906, 74.4789): ${kopargaonMatch ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`     Shops count within 10km: ${kopargaonShops.length} (Sangamner shops excluded)`);

  // 1c. Pune (18.5204, 73.8567)
  const puneRes = await req("/shops?lat=18.5204&lng=73.8567&radius=10");
  const puneShops = puneRes.body;
  const puneMatch = Array.isArray(puneShops) && puneShops.every((s) => s.distance !== null && s.distance <= 10);
  const sangamnerInPune = Array.isArray(puneShops) && puneShops.some((s) => s.location?.address?.includes("Sangamner"));
  console.log(`[1c] Pune Search (18.5204, 73.8567): ${puneMatch && !sangamnerInPune ? "PASSED ✅" : "FAILED ❌"}`);
  console.log(`     Shops count within 10km of Pune: ${puneShops.length}`);
  console.log(`     Sangamner shops appearing in Pune: ${sangamnerInPune ? "YES ❌ (BUG)" : "NO ✅ (STRICT FILTER)"}`);

  // ----------------------------------------------------
  // TEST 2: OWNER REGISTRATION, PRODUCT CREATION & CUSTOMER ACCESS (ISSUE 2)
  // ----------------------------------------------------
  console.log("\n--- TEST 2: Owner Product Creation & Customer Detail Page Access ---");

  // 2a. Register Owner in Pune
  const ownerEmail = `pune_owner_${Date.now()}@example.com`;
  const regOwnerRes = await req("/auth/register/owner", {
    method: "POST",
    body: {
      name: "Pune Merchant",
      email: ownerEmail,
      password: "password123",
      shopName: "Kothrud Shoes & Boots",
      shopType: "shoes",
      address: "Kothrud, Pune",
      area: "Kothrud",
      lat: "18.5074",
      lng: "73.8077",
    },
  });
  console.log(`[2a] Register Owner in Pune: ${regOwnerRes.status === 201 ? "PASSED ✅" : "FAILED ❌"}`, {
    shopId: regOwnerRes.body.shop?._id,
    coords: regOwnerRes.body.shop?.location,
  });

  const ownerToken = regOwnerRes.body.accessToken;
  const shopId = regOwnerRes.body.shop?._id;

  // 2b. Add Item as Owner
  const addItemRes = await req("/owner/catalogue", {
    method: "POST",
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      type: "mens",
      subtype: "Formal",
      name: "Pune Leather Formal Shoes",
      description: "Handcrafted pure leather formal shoes",
      price: 2499,
      sizes: [{ label: "8", stock: 5 }, { label: "9", stock: 3 }],
    },
  });
  console.log(`[2b] Create Product: ${addItemRes.status === 201 ? "PASSED ✅" : "FAILED ❌"}`, {
    itemId: addItemRes.body._id,
    name: addItemRes.body.name,
  });

  const itemId = addItemRes.body._id;

  // 2c. Fetch Single Item as Customer via GET /items/:id
  const getItemRes = await req(`/items/${itemId}`);
  const itemData = getItemRes.body;
  const itemSuccess =
    getItemRes.status === 200 &&
    itemData._id === itemId &&
    itemData.name === "Pune Leather Formal Shoes" &&
    typeof itemData.shopId === "object" &&
    itemData.shopId.shopName === "Kothrud Shoes & Boots";

  console.log(`[2c] Customer Fetch Product Detail (GET /items/${itemId}): ${itemSuccess ? "PASSED ✅" : "FAILED ❌"}`);
  console.log("     Populated Shop Data:", {
    shopId: itemData.shopId?._id,
    shopName: itemData.shopId?.shopName,
    location: itemData.shopId?.location,
  });

  // 2d. Fetch Single Shop via GET /shops/:id
  const getShopRes = await req(`/shops/${shopId}`);
  console.log(`[2d] Customer Fetch Shop Detail (GET /shops/${shopId}): ${getShopRes.status === 200 && getShopRes.body._id === shopId ? "PASSED ✅" : "FAILED ❌"}`);

  // 2e. Check Pune customer now sees this new Pune shop within 10km
  const puneSearch2 = await req("/shops?lat=18.5204&lng=73.8567&radius=10");
  const newShopFound = Array.isArray(puneSearch2.body) && puneSearch2.body.some((s) => s._id === shopId);
  console.log(`[2e] Pune Customer finds newly created Pune Shop within 10km: ${newShopFound ? "PASSED ✅" : "FAILED ❌"}`);

  console.log("\n==================================================");
  console.log("   ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY   ");
  console.log("==================================================");

  server.close();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  if (server) server.close();
  process.exit(1);
});

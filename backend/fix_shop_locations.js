require("dotenv").config();
const connectDB = require("./config/db");
const Shop = require("./models/Shop");
const { resolveCoordinates } = require("./utils/geocoder");

async function fixLocations() {
  await connectDB();
  const shops = await Shop.find({});
  let updatedCount = 0;
  for (const shop of shops) {
    if (shop.location?.lat == null || shop.location?.lng == null) {
      const coords = resolveCoordinates(shop.location?.address || "", shop.location?.area || "");
      shop.location = shop.location || {};
      shop.location.lat = coords.lat;
      shop.location.lng = coords.lng;
      await shop.save();
      updatedCount++;
      console.log(`Updated shop: ${shop.shopName} (${shop.location.address}) -> lat: ${coords.lat}, lng: ${coords.lng}`);
    }
  }
  console.log(`Finished updating ${updatedCount} shops.`);
  process.exit(0);
}

fixLocations().catch(console.error);

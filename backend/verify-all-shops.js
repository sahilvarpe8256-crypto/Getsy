require("dotenv").config();
const connectDB = require("./config/db");
const Shop = require("./models/Shop");

async function run() {
  await connectDB();
  const result = await Shop.updateMany({ verified: false }, { $set: { verified: true } });
  console.log(`Verified ${result.modifiedCount} shop(s) that were previously hidden from search.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

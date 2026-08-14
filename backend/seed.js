require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Shop = require("./models/Shop");
const CatalogueItem = require("./models/CatalogueItem");

async function run() {
  await connectDB();
  console.log("Checking demo data (this never touches real accounts or products)...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Approximate coordinates around Sangamner, Maharashtra - fine for a prototype;
  // real shops will pin their exact spot using the in-app map picker.
  const ownersData = [
    {
      name: "Meena Joshi", email: "meena@shop.test",
      shopName: "Meena Fashion House", shopType: "clothes",
      address: "College Road, Sangamner", area: "College Road", gstNumber: "27ABCDE1234F1Z5",
      lat: 19.5705, lng: 74.2140,
      items: [
        { type: "womens", subtype: "Kurti", name: "Cotton Printed Kurti", price: 799,
          sizes: [{ label: "S", stock: 4 }, { label: "M", stock: 5 }, { label: "L", stock: 3 }, { label: "XL", stock: 2 }] },
        { type: "womens", subtype: "Lehenga", name: "Wedding Lehenga", price: 4999,
          sizes: [{ label: "M", stock: 1 }, { label: "L", stock: 1 }] },
        { type: "mens", subtype: "Kurta", name: "Festive Silk Kurta", price: 1299,
          sizes: [{ label: "M", stock: 0 }, { label: "L", stock: 0 }, { label: "XL", stock: 0 }] },
      ],
    },
    {
      name: "Rahul Patil", email: "rahul@shop.test",
      shopName: "Rahul's Footwear", shopType: "shoes",
      address: "Panchavati Road, Sangamner", area: "Panchavati Road", gstNumber: "27PQRSX5678K1Z2",
      lat: 19.5650, lng: 74.2190,
      items: [
        { type: "mens", subtype: "Sneakers", name: "Runner Sneakers", price: 1499,
          sizes: [{ label: "7", stock: 3 }, { label: "8", stock: 2 }, { label: "9", stock: 2 }, { label: "10", stock: 1 }] },
        { type: "womens", subtype: "Heels", name: "Block Heels", price: 1299,
          sizes: [{ label: "5", stock: 0 }, { label: "6", stock: 0 }, { label: "7", stock: 0 }] },
        { type: "kids", subtype: "School shoes", name: "Velcro School Shoes", price: 699,
          sizes: [{ label: "1", stock: 4 }, { label: "2", stock: 4 }, { label: "3", stock: 4 }] },
      ],
    },
    {
      name: "Om Shah", email: "om@shop.test",
      shopName: "Om Jewellers", shopType: "ornaments",
      address: "Sarafa Bazaar, Sangamner", area: "Sarafa Bazaar", gstNumber: "27LMNOP4321J1Z9",
      lat: 19.5690, lng: 74.2205,
      items: [
        { type: "gold", subtype: "Necklace", name: "Temple Design Necklace", price: 48500,
          sizes: [{ label: "Standard", stock: 1 }] },
        { type: "silver", subtype: "Anklets", name: "Oxidised Anklets", price: 899,
          sizes: [{ label: "Standard", stock: 6 }] },
        { type: "imitation", subtype: "Earrings", name: "Kundan Earrings", price: 349,
          sizes: [{ label: "Standard", stock: 3 }] },
      ],
    },
  ];

  for (const o of ownersData) {
    const existing = await User.findOne({ email: o.email });
    if (existing) {
      console.log(`Already exists, skipping: ${o.shopName} (${o.email})`);
      continue;
    }

    const user = await User.create({ role: "owner", name: o.name, email: o.email, passwordHash });
    const shop = await Shop.create({
      ownerId: user._id,
      shopName: o.shopName,
      shopType: o.shopType,
      location: { address: o.address, area: o.area, lat: o.lat, lng: o.lng },
      gstNumber: o.gstNumber,
      verified: true,
      rating: 4.5,
      reviewCount: 150,
      visitCount: 300,
    });
    for (const item of o.items) {
      await CatalogueItem.create({ shopId: shop._id, category: o.shopType, ...item });
    }
    console.log(`Seeded shop: ${o.shopName} (login: ${o.email} / password123)`);
  }

  const existingCustomer = await User.findOne({ email: "priya@customer.test" });
  if (!existingCustomer) {
    const customer = await User.create({
      role: "customer", name: "Priya Sharma", email: "priya@customer.test",
      mobile: "9876543210", passwordHash,
      // A village roughly 10km from Sangamner town - matches the "customer lives
      // in a village 10km away" example scenario. Approximate, for demo purposes.
      location: { lat: 19.6350, lng: 74.2600, label: "Village near Sangamner (~10 km away)" },
    });
    console.log(`Seeded customer login: ${customer.email} / password123`);
  } else {
    console.log("Demo customer already exists, skipping.");
  }

  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

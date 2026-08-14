const Booking = require("../models/Booking");
const CatalogueItem = require("../models/CatalogueItem");

// Finds "reserved" bookings past their expiry, marks them expired,
// and gives the stock back to the catalogue item. This is the other half
// of the atomic-stock guarantee described in the architecture doc (§5) -
// stock only ever changes through the booking-create path or this one.
async function expireStaleReservations() {
  const stale = await Booking.find({ status: "reserved", expiresAt: { $lt: new Date() } });

  for (const booking of stale) {
    booking.status = "expired";
    await booking.save();

    await CatalogueItem.updateOne(
      { _id: booking.itemId, "sizes.label": booking.size },
      { $inc: { "sizes.$.stock": 1 } }
    );
  }

  if (stale.length) {
    console.log(`[jobs] expired ${stale.length} stale reservation(s), stock released`);
  }
}

function startExpiryJob(intervalMs = 5 * 60 * 1000) {
  expireStaleReservations().catch((err) => console.error("[jobs] expiry run failed:", err.message));
  setInterval(() => {
    expireStaleReservations().catch((err) => console.error("[jobs] expiry run failed:", err.message));
  }, intervalMs);
}

module.exports = { startExpiryJob, expireStaleReservations };

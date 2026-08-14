# Dukaan Dekho — Run this on your PC

This is the complete, working project. Everything below is real — the backend is a
real Node.js + MongoDB server, and the frontend page talks to it live (not mock data).

## 1. Folder layout (exactly what you should have)

```
getsee/
├── docker-compose.yml
├── README.md                 (this file)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── seed.js
│   ├── .env
│   ├── .env.example
│   ├── uploads/               (product photos get saved here automatically)
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── middleware/upload.js
│   ├── jobs/expireReservations.js
│   ├── models/  (User.js, Shop.js, CatalogueItem.js, Booking.js, Review.js, CommunityRequest.js)
│   └── routes/  (auth.js, browse.js, bookings.js, owner.js, community.js)
└── frontend/
    └── index.html            (the whole website — one file)
```

You don't need to create or rename anything — just save the `getsee` folder exactly
as downloaded, onto your Desktop.

---

## 2. Easiest way to run it: Docker Desktop (recommended)

You only need **one program installed**: Docker Desktop.

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop (free)
2. Open it once so it's running in the background.
3. Open a terminal (Mac: Terminal app / Windows: PowerShell or Command Prompt).
4. Go to the folder:
   ```
   cd Desktop/getsee
   ```
5. Run:
   ```
   docker-compose up
   ```
   Wait about 30–60 seconds the first time (it downloads MongoDB and installs the backend).
   You'll see a line that says `[server] Dukaan Dekho API running on http://localhost:5000`.
6. Now open the **frontend**: go to the `getsee/frontend` folder and **double-click `index.html`**.
   It opens in your browser and is already talking to the backend.

To stop everything later: go back to the terminal and press `Ctrl + C`, or run
`docker-compose down`.

### Demo logins (already seeded into the database)

| Role | Email | Password |
|---|---|---|
| Customer | `priya@customer.test` | `password123` |
| Owner — Meena Fashion House (clothes) | `meena@shop.test` | `password123` |
| Owner — Rahul's Footwear (shoes) | `rahul@shop.test` | `password123` |
| Owner — Om Jewellers (ornaments) | `om@shop.test` | `password123` |

You can also just click "Register" and create your own customer or owner account —
that goes into the real database too.

**Note:** the Docker setup checks for the 3 demo shops every time you run `docker-compose up`
and only creates the ones that don't exist yet — it never deletes or resets anything, so your
real bookings, products, and uploaded photos are always safe across restarts.

---

## 3. Alternative: running without Docker (if you'd rather not install Docker)

You'd need two things installed instead: **Node.js** (https://nodejs.org, get the LTS version)
and **MongoDB Community Server** (https://www.mongodb.com/try/download/community) running locally.

1. Install both, then make sure MongoDB is running (it usually starts automatically as a service).
2. Open a terminal in `getsee/backend` and run:
   ```
   npm install
   npm run seed
   npm start
   ```
3. You should see `Dukaan Dekho API running on http://localhost:5000`.
4. Open `getsee/frontend/index.html` by double-clicking it.

---

## 4. What's actually real here vs. what's simplified

**Real:** registration/login (passwords hashed, JWT auth), browsing by category → type →
subtype, live per-size stock that decrements the instant someone books (and can't go negative
even if two people click at once), owner dashboard pulling real numbers from the database,
community requests/replies, automatic reservation expiry after 48 hours releasing stock back.

**Real, from earlier updates too:** owners can upload real product photos (saved locally to
`backend/uploads/`, no cloud account needed), and shops require no manual "verification" step
to appear in search — both are already working, this update just adds the map layer on top.

**Now includes:** a real map, with no API key needed. It uses OpenStreetMap (via Leaflet.js)
instead of Google Maps — visually it's the same idea (a street map with a search box and a
draggable pin), but completely free and with nothing to sign up for.

*Fixed in this update:* the map now loads from a more reliable CDN, there are manual
latitude/longitude number fields as a backup in case the map itself ever fails to load on
your network, and the "Add a new product" form now requires a stock quantity up front instead
of silently defaulting to 0 (out of stock) when left blank.

- Right after registering, both customers and owners are taken to a map screen: search your
  city/village, then drag the pin (or click the map) to fine-tune your exact spot.
- Customers can revisit this anytime via **"📍 My location"** in the top bar. Owners get
  **"📍 Shop location"** the same way, plus a reminder banner on their dashboard if they
  haven't pinned it yet.
- Once your location is set, shop search results show real distance from you (in km) and
  sort nearest-first, and the shop page + your active bookings both get a **"🧭 Get
  directions"** button that opens Google Maps for turn-by-turn directions from wherever you
  are when you tap it.
- The demo data is set around **Sangamner, Maharashtra** as requested — the 3 demo shops are
  pinned there, and the demo customer's home location is placed roughly 10 km outside town to
  match the "village customer" scenario. All coordinates are approximate/for-demo, since real
  ones get set by actually using the map picker.

One honest caveat: the place-name search uses Nominatim, a free community geocoding service —
it's reliable for normal use but is rate-limited and occasionally won't recognize a very small
or obscure village by name. If that happens, just search for the nearest town instead and then
drag the pin the rest of the way to the exact spot.

**Still simplified for this version** (on purpose, so you have something running today):
- Community requests are text-only for now — the same upload approach used for products can
  be added there too.
- No real payment processing — the architecture doc covers how to add Razorpay when you're ready.

These are all straightforward to add later without changing anything else — just let me
know when you want to tackle the next one.

## 5. If something doesn't work

- **"Cannot reach API server" banner in the browser:** the backend isn't running. Check the
  terminal running `docker-compose up` for errors, or make sure MongoDB is running if you
  went the non-Docker route.
- **A shop you registered doesn't show up when browsing as a customer:** this was a bug in
  an earlier version (new shops needed manual "verification" that nothing ever granted).
  It's fixed for any *new* registration. If you already created a shop before this fix,
  run this once to unlock it:
  - Docker: `docker-compose exec backend npm run verify-shops`
  - Non-Docker: `cd backend && npm run verify-shops`
- **The map doesn't load, or place search does nothing:** unlike the rest of this app, the
  map tiles and place search need an internet connection (they come from OpenStreetMap's free
  public servers, not your local backend). Everything else — logging in, browsing, booking —
  still works offline once the page and its scripts have loaded once.
- **Port already in use:** something else on your PC is using port 5000 or 27017. Close it,
  or change `PORT`/`ports:` in `docker-compose.yml` and update the `API` constant near the
  top of `frontend/index.html` to match.

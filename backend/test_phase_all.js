require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const browseRoutes = require('./routes/browse');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', browseRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', reviewRoutes);

let server;

async function runInMemoryTest() {
  await connectDB();
  server = app.listen(5005);
  const BASE = 'http://localhost:5005/api/v1';

  console.log('=== TESTING UPDATED GETSY 3.0 BACKEND ROUTES ===\n');

  const http = require('http');
  function req(endpoint, opts = {}) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(`${BASE}${endpoint}`);
      let body = opts.body;
      const headers = opts.headers || {};
      if (body && typeof body === 'object') {
        body = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      }
      const r = http.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: opts.method || 'GET',
        headers,
      }, (res) => {
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, body: d }); }
        });
      });
      r.on('error', reject);
      if (body) r.write(body);
      r.end();
    });
  }

  // 1. Customer Register
  const testEmail = `cust_${Date.now()}@example.com`;
  const regRes = await req('/auth/register/customer', {
    method: 'POST',
    body: { name: 'New Customer', mobile: '9988776655', email: testEmail, password: 'password123' },
  });
  console.log('[1] Customer Registration with Mobile:', regRes.status === 201 && regRes.body.user.mobile === '9988776655' ? 'PASSED ✅' : 'FAILED ❌', regRes.body.user);

  const token = regRes.body.accessToken;

  // 2. GET /users/me
  const getMe = await req('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('[2] GET /users/me:', getMe.status === 200 && getMe.body.mobile === '9988776655' ? 'PASSED ✅' : 'FAILED ❌', getMe.body);

  // 3. PATCH /users/me/profile
  const patchMe = await req('/users/me/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { mobile: '9876543210' },
  });
  console.log('[3] PATCH /users/me/profile:', patchMe.status === 200 && patchMe.body.mobile === '9876543210' ? 'PASSED ✅' : 'FAILED ❌', patchMe.body);

  // 4. Location Search (10km default)
  const locSearch = await req('/search?lat=19.5761&lng=74.2070&radius=10');
  console.log('[4] Location Search (10km radius):', locSearch.status === 200 ? 'PASSED ✅' : 'FAILED ❌', {
    shopsFound: locSearch.body.shops?.length,
    firstShopDistance: locSearch.body.shops?.[0]?.distance,
  });

  // 5. Read-only Reviews
  const shopsRes = await req('/shops');
  if (shopsRes.body && shopsRes.body.length > 0) {
    const shopId = shopsRes.body[0]._id;
    const revs = await req(`/shops/${shopId}/reviews`);
    console.log('[5] Read-only Shop Reviews:', revs.status === 200 ? 'PASSED ✅' : 'FAILED ❌', `Count: ${revs.body.length}`);
  }

  // 6. Owner Registration & Login
  const ownerEmail = `owner_${Date.now()}@example.com`;
  const regOwner = await req('/auth/register/owner', {
    method: 'POST',
    body: {
      name: 'Shop Owner',
      email: ownerEmail,
      password: 'password123',
      shopName: 'Apex Electronics',
      shopType: 'hardware',
      address: 'Main Market, Sangamner',
    },
  });
  console.log('[6a] Owner Registration:', regOwner.status === 201 ? 'PASSED ✅' : 'FAILED ❌', regOwner.body.user, regOwner.body.shop);

  const ownerLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: ownerEmail, password: 'password123' },
  });
  console.log('[6b] Owner Login:', ownerLogin.status === 200 && ownerLogin.body.user.role === 'owner' ? 'PASSED ✅' : 'FAILED ❌', {
    user: ownerLogin.body.user,
    shopName: ownerLogin.body.shop?.shopName,
  });

  server.close();
  process.exit(0);
}

runInMemoryTest().catch(err => {
  console.error(err);
  if (server) server.close();
  process.exit(1);
});

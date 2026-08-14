const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof Buffer)) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers,
    };

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING GETSY 3.0 ACCEPTANCE TESTS A-H ===\n');

  // Test 1: Health Check
  const health = await request('/health');
  console.log('[1] Health Check:', health.status === 200 && health.body.ok ? 'PASSED ✅' : 'FAILED ❌', health.body);

  // Test A: Location-aware search
  const locSearch = await request('/search?lat=19.5761&lng=74.2070&radius=10');
  console.log('[Test A] Location Search (10km radius):', locSearch.status === 200 ? 'PASSED ✅' : 'FAILED ❌', {
    shopsCount: locSearch.body.shops?.length || 0,
    firstShopDistance: locSearch.body.shops?.[0]?.distance,
  });

  // Test B: Customer Registration & GET /me + PATCH /me/profile
  const testEmail = `testcust_${Date.now()}@example.com`;
  const regCust = await request('/auth/register/customer', {
    method: 'POST',
    body: {
      name: 'Test Customer',
      mobile: '9876543210',
      email: testEmail,
      password: 'password123',
    },
  });
  console.log('[Test C1] Customer Register with mobile:', regCust.status === 201 && regCust.body.user.mobile === '9876543210' ? 'PASSED ✅' : 'FAILED ❌', regCust.body.user);

  const token = regCust.body.accessToken;

  // Test GET /me
  const getMe = await request('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('[Test C2] GET /users/me:', getMe.status === 200 && getMe.body.email === testEmail ? 'PASSED ✅' : 'FAILED ❌', getMe.body);

  // Test PATCH /me/profile
  const patchMe = await request('/users/me/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { mobile: '9123456789' },
  });
  console.log('[Test C3] PATCH /users/me/profile:', patchMe.status === 200 && patchMe.body.mobile === '9123456789' ? 'PASSED ✅' : 'FAILED ❌', patchMe.body);

  // Test D: Wishlist
  const shopsRes = await request('/shops');
  if (shopsRes.body && shopsRes.body.length > 0) {
    const firstShopId = shopsRes.body[0]._id;
    const catalogueRes = await request(`/shops/${firstShopId}/catalogue`);
    if (catalogueRes.body.items && catalogueRes.body.items.length > 0) {
      const itemId = catalogueRes.body.items[0]._id;

      // Add to wishlist
      const addWish = await request('/wishlist', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { itemId },
      });
      console.log('[Test D1] Add to Wishlist:', addWish.status === 201 ? 'PASSED ✅' : 'FAILED ❌');

      // Get wishlist
      const getWish = await request('/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Test D2] Get Wishlist:', getWish.status === 200 && getWish.body.length > 0 ? 'PASSED ✅' : 'FAILED ❌', `Items: ${getWish.body.length}`);

      // Delete from wishlist
      const delWish = await request(`/wishlist/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Test D3] Remove from Wishlist:', delWish.status === 200 ? 'PASSED ✅' : 'FAILED ❌');
    }
  }

  // Test E: Read-only Reviews
  if (shopsRes.body && shopsRes.body.length > 0) {
    const shopId = shopsRes.body[0]._id;
    const shopRev = await request(`/shops/${shopId}/reviews`);
    console.log('[Test E] Read-only Shop Reviews:', shopRev.status === 200 ? 'PASSED ✅' : 'FAILED ❌', `Reviews: ${shopRev.body.length}`);
  }

  // Test F: Owner Login
  const ownerLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'owner@example.com',
      password: 'password123',
    },
  });
  console.log('[Test F] Owner Login:', ownerLogin.status === 200 && ownerLogin.body.user.role === 'owner' ? 'PASSED ✅' : 'FAILED ❌', {
    role: ownerLogin.body.user?.role,
    shopName: ownerLogin.body.shop?.shopName,
  });

  // Test H: Community feed
  const commFeed = await request('/community');
  console.log('[Test H] Community Feed:', commFeed.status === 200 ? 'PASSED ✅' : 'FAILED ❌', `Posts: ${commFeed.body.length}`);

  console.log('\n=== ALL ACCEPTANCE TESTS COMPLETE ===');
}

runTests().catch(console.error);

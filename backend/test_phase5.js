const express = require('express');
const jwt = require('jsonwebtoken');
const { signAccessToken, signRefreshToken, requireAuth, requireRole } = require('./middleware/auth');
const CatalogueItem = require('./models/CatalogueItem');
const Shop = require('./models/Shop');

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';

async function testPhase5Logic() {
  console.log('--- PHASE 5 UNIT & SECURITY LOGIC CHECKS ---');

  // 1. Test JWT Access & Refresh Tokens
  const payload = { userId: '507f1f77bcf86cd799439011', role: 'owner', shopId: '507f1f77bcf86cd799439022' };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  console.log('[TEST 1] Access Token generated:', !!accessToken);
  console.log('[TEST 2] Refresh Token generated:', !!refreshToken);

  const decodedAccess = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
  if (decodedAccess.role !== 'owner' || decodedAccess.userId !== payload.userId) {
    throw new Error('JWT Access token verification failed!');
  }
  console.log('[TEST 3] Access Token verified cleanly for role:', decodedAccess.role);

  // 2. Test Middleware Role Protection
  const mockCustomerReq = { user: { userId: '123', role: 'customer' } };
  const mockOwnerReq = { user: { userId: '456', role: 'owner' } };

  let forbiddenError = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        forbiddenError = { code, data };
      },
    }),
  };

  const ownerMiddleware = requireRole('owner');

  // Customer attempting owner action
  ownerMiddleware(mockCustomerReq, mockRes, () => {});
  if (!forbiddenError || forbiddenError.code !== 403) {
    throw new Error('Customer was not properly blocked by requireRole("owner")!');
  }
  console.log('[TEST 4] Customer access to owner route correctly BLOCKED (403 Forbidden):', forbiddenError.data.error);

  // Owner attempting owner action
  let ownerPassed = false;
  ownerMiddleware(mockOwnerReq, mockRes, () => {
    ownerPassed = true;
  });
  if (!ownerPassed) {
    throw new Error('Owner was incorrectly blocked!');
  }
  console.log('[TEST 5] Owner access to owner route PASSED authorization check.');

  // 3. Test CatalogueItem Schema & Virtual totalStock calculation
  const testItem = new CatalogueItem({
    shopId: '507f1f77bcf86cd799439022',
    category: 'footwear',
    type: 'mens',
    subtype: 'Formal',
    name: 'Test Oxford Shoes',
    price: 2999,
    sizes: [
      { label: '7', stock: 2 },
      { label: '8', stock: 5 },
      { label: '9', stock: 0 },
    ],
  });

  if (testItem.category !== 'footwear') {
    throw new Error('CatalogueItem category enum test failed!');
  }
  if (testItem.totalStock !== 7) {
    throw new Error(`totalStock calculation mismatch! Expected 7, got ${testItem.totalStock}`);
  }
  console.log('[TEST 6] CatalogueItem Schema expanded enum & virtual totalStock calculation PASSED (Total Stock: 7).');

  console.log('\n🎉 ALL PHASE 5 SECURITY & LOGIC CHECKS PASSED SUCCESSFULLY!');
}

testPhase5Logic().catch((err) => {
  console.error('Test Failed:', err.message);
  process.exit(1);
});

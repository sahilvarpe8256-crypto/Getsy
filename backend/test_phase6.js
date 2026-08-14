require('dotenv').config();
const jwt = require('jsonwebtoken');
const CommunityRequest = require('./models/CommunityRequest');
const Shop = require('./models/Shop');
const { requireAuth, requireRole } = require('./middleware/auth');

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';

async function testPhase6Logic() {
  console.log('--- PHASE 6 COMMUNITY SYSTEM SECURITY & LOGIC CHECKS ---');

  // 1. Role Authorization Verification
  const customerReq = { user: { userId: '507f1f77bcf86cd799439011', role: 'customer' } };
  const ownerReq = { user: { userId: '507f1f77bcf86cd799439022', role: 'owner' } };

  let responseData = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        responseData = { code, data };
      },
    }),
  };

  const customerGuard = requireRole('customer');
  const ownerGuard = requireRole('owner');

  // Check 1: Owner trying to post customer request -> Should be blocked (403)
  customerGuard(ownerReq, mockRes, () => {});
  if (!responseData || responseData.code !== 403) {
    throw new Error('Owner was not blocked from customer-only route!');
  }
  console.log('[TEST 1] Owner access to customer post route correctly BLOCKED (403 Forbidden):', responseData.data.error);

  // Check 2: Customer trying to reply as shop owner -> Should be blocked (403)
  responseData = null;
  ownerGuard(customerReq, mockRes, () => {});
  if (!responseData || responseData.code !== 403) {
    throw new Error('Customer was not blocked from owner-only reply route!');
  }
  console.log('[TEST 2] Customer access to merchant reply route correctly BLOCKED (403 Forbidden):', responseData.data.error);

  // Check 3: Customer passing customer guard -> Should pass
  let customerPassed = false;
  customerGuard(customerReq, mockRes, () => { customerPassed = true; });
  if (!customerPassed) {
    throw new Error('Customer was incorrectly blocked from customer route!');
  }
  console.log('[TEST 3] Customer access to customer post route PASSED.');

  // Check 4: Owner passing owner guard -> Should pass
  let ownerPassed = false;
  ownerGuard(ownerReq, mockRes, () => { ownerPassed = true; });
  if (!ownerPassed) {
    throw new Error('Owner was incorrectly blocked from owner reply route!');
  }
  console.log('[TEST 4] Owner access to merchant reply route PASSED.');

  // 2. CommunityRequest Schema Verification
  const mockPost = new CommunityRequest({
    customerId: '507f1f77bcf86cd799439011',
    category: 'footwear',
    description: 'Looking for Size 9 formal Oxford shoes in Sangamner',
    status: 'open',
    replies: [
      {
        shopId: '507f1f77bcf86cd799439033',
        shopName: 'Apex Footwear',
        message: 'We have 3 pairs in stock! Visit us on Main Road.',
      },
    ],
  });

  if (mockPost.replies.length !== 1 || mockPost.replies[0].shopName !== 'Apex Footwear') {
    throw new Error('CommunityRequest reply schema mismatch!');
  }
  console.log('[TEST 5] CommunityRequest Schema & Merchant Reply Embedding PASSED.');

  console.log('\n🎉 ALL PHASE 6 SECURITY & LOGIC TESTS PASSED SUCCESSFULLY!');
}

testPhase6Logic().catch((err) => {
  console.error('Test Failed:', err.message);
  process.exit(1);
});

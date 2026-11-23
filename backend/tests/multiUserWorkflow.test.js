import test from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';
import { Expense } from '../src/models/Expense.js';
import { Settlement } from '../src/models/Settlement.js';
import { GroupInvitation } from '../src/models/GroupInvitation.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: data };
}

test('Multi-User Collaborative Workflow & Security Tests', async (t) => {
  // Setup DB and Server
  await connectDB();
  const app = createApp();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Clean test database
  await User.deleteMany({});
  await Group.deleteMany({});
  await Expense.deleteMany({});
  await Settlement.deleteMany({});
  await GroupInvitation.deleteMany({});

  let ashutoshToken, rahulToken, amanToken;
  let ashutoshUser, rahulUser, amanUser;
  let goaGroupId;
  let expense1Id;

  await t.test('1-3: Register Ashutosh, Rahul, and Aman', async () => {
    // Register Ashutosh
    const resA = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Ashutosh Kumar',
        username: 'ashutosh',
        email: 'ashutosh@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert.equal(resA.status, 201);
    assert.equal(resA.body.success, true);
    ashutoshToken = resA.body.accessToken;
    ashutoshUser = resA.body.user;

    // Register Rahul
    const resR = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Rahul Sharma',
        username: 'rahul',
        email: 'rahul@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert.equal(resR.status, 201);
    rahulToken = resR.body.accessToken;
    rahulUser = resR.body.user;

    // Register Aman
    const resM = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Aman Verma',
        username: 'aman',
        email: 'aman@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert.equal(resM.status, 201);
    amanToken = resM.body.accessToken;
    amanUser = resM.body.user;
  });

  await t.test('4: Ashutosh logs in via username and password', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'ashutosh',
        password: 'password123'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.accessToken);
    ashutoshToken = res.body.accessToken;
  });

  await t.test('5: Ashutosh creates a group named "Goa Trip 2026"', async () => {
    const res = await request('/api/groups', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ashutoshToken}` },
      body: {
        name: 'Goa Trip 2026',
        description: 'Beach fun and celebrations',
        category: 'Trip'
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.group.name, 'Goa Trip 2026');
    assert.equal(res.body.group.members.length, 1);
    assert.equal(res.body.group.members[0].role, 'OWNER');
    goaGroupId = res.body.group._id;
  });

  let rahulInviteId, amanInviteId;

  await t.test('6: Ashutosh invites Rahul and Aman by username', async () => {
    // Invite Rahul
    const resR = await request(`/api/groups/${goaGroupId}/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ashutoshToken}` },
      body: { identifier: 'rahul' }
    });
    assert.equal(resR.status, 201);
    rahulInviteId = resR.body.invitation._id;

    // Invite Aman
    const resA = await request(`/api/groups/${goaGroupId}/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ashutoshToken}` },
      body: { identifier: 'aman' }
    });
    assert.equal(resA.status, 201);
    amanInviteId = resA.body.invitation._id;
  });

  await t.test('7-8: Rahul and Aman accept their invitations', async () => {
    // Rahul accepts
    const resR = await request(`/api/invitations/${rahulInviteId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    assert.equal(resR.status, 200);
    assert.equal(resR.body.groupId, goaGroupId);

    // Aman accepts
    const resA = await request(`/api/invitations/${amanInviteId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${amanToken}` }
    });
    assert.equal(resA.status, 200);
    assert.equal(resA.body.groupId, goaGroupId);
  });

  await t.test('9-10: All three users log in and verify they see the SAME group', async () => {
    const resA = await request('/api/groups', {
      headers: { Authorization: `Bearer ${ashutoshToken}` }
    });
    assert.equal(resA.body.groups.length, 1);
    assert.equal(resA.body.groups[0]._id, goaGroupId);
    assert.equal(resA.body.groups[0].membersCount, 3);

    const resR = await request('/api/groups', {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    assert.equal(resR.body.groups.length, 1);
    assert.equal(resR.body.groups[0]._id, goaGroupId);

    const resM = await request('/api/groups', {
      headers: { Authorization: `Bearer ${amanToken}` }
    });
    assert.equal(resM.body.groups.length, 1);
    assert.equal(resM.body.groups[0]._id, goaGroupId);
  });

  await t.test('11-13: Ashutosh adds ₹1500 expense with equal split (₹500 each)', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ashutoshToken}` },
      body: {
        groupId: goaGroupId,
        description: 'Beach Shack Dinner',
        amount: 1500,
        paidBy: ashutoshUser.id,
        splitType: 'EQUAL',
        category: 'Food & Dining',
        participants: [ashutoshUser.id, rahulUser.id, amanUser.id]
      }
    });
    assert.equal(res.status, 201);
    expense1Id = res.body.expense._id;

    // Verify balances returned from backend:
    // Total = 1500. Ashutosh paid 1500. Share is 500 each.
    // Ashutosh: net +1000.
    // Rahul: net -500.
    // Aman: net -500.
    const balances = res.body.balances.balances;
    const aBal = balances.find((b) => b.userId === ashutoshUser.id);
    const rBal = balances.find((b) => b.userId === rahulUser.id);
    const mBal = balances.find((b) => b.userId === amanUser.id);

    assert.equal(aBal.netBalance, 1000);
    assert.equal(rBal.netBalance, -500);
    assert.equal(mBal.netBalance, -500);

    // Check Rahul sees the same expense and balances
    const expResR = await request(`/api/expenses/group/${goaGroupId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    assert.equal(expResR.body.expenses.length, 1);
    assert.equal(expResR.body.expenses[0].description, 'Beach Shack Dinner');

    const balResR = await request(`/api/balances/groups/${goaGroupId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const rBalCheck = balResR.body.balances.balances.find((b) => b.userId === rahulUser.id);
    assert.equal(rBalCheck.netBalance, -500);
  });

  await t.test('14-15: Rahul adds ₹900 expense for watersports (₹300 each)', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: {
        groupId: goaGroupId,
        description: 'Watersports Activity',
        amount: 900,
        paidBy: rahulUser.id,
        splitType: 'EQUAL',
        category: 'Entertainment',
        participants: [ashutoshUser.id, rahulUser.id, amanUser.id]
      }
    });
    assert.equal(res.status, 201);

    // Current State:
    // Ashutosh: paid 1500, share = 500 + 300 = 800. Net = +700.
    // Rahul: paid 900, share = 500 + 300 = 800. Net = +100.
    // Aman: paid 0, share = 500 + 300 = 800. Net = -800.
    // Total net sum = +700 + 100 - 800 = 0!
    const balances = res.body.balances.balances;
    const aBal = balances.find((b) => b.userId === ashutoshUser.id);
    const rBal = balances.find((b) => b.userId === rahulUser.id);
    const mBal = balances.find((b) => b.userId === amanUser.id);

    assert.equal(aBal.netBalance, 700);
    assert.equal(rBal.netBalance, 100);
    assert.equal(mBal.netBalance, -800);

    // Simplified settlements:
    // Aman owes 800 total:
    // Aman pays Ashutosh 700, Aman pays Rahul 100!
    const suggestions = res.body.balances.simplifiedDebts;
    assert.equal(suggestions.length, 2);
  });

  await t.test('16-17: Aman settles ₹800 dues (₹700 to Ashutosh, ₹100 to Rahul)', async () => {
    // Aman settles 700 with Ashutosh
    const resSetA = await request('/api/settlements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${amanToken}` },
      body: {
        groupId: goaGroupId,
        fromUser: amanUser.id,
        toUser: ashutoshUser.id,
        amount: 700,
        paymentMethod: 'UPI',
        autoConfirm: true
      }
    });
    assert.equal(resSetA.status, 201);
    assert.equal(resSetA.body.settlement.status, 'CONFIRMED');

    // Aman settles 100 with Rahul
    const resSetR = await request('/api/settlements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${amanToken}` },
      body: {
        groupId: goaGroupId,
        fromUser: amanUser.id,
        toUser: rahulUser.id,
        amount: 100,
        paymentMethod: 'CASH',
        autoConfirm: true
      }
    });
    assert.equal(resSetR.status, 201);

    // Now all balances in Goa Trip must be EXACTLY ZERO!
    const finalBalRes = await request(`/api/balances/groups/${goaGroupId}`, {
      headers: { Authorization: `Bearer ${ashutoshToken}` }
    });
    const finalBalances = finalBalRes.body.balances.balances;
    for (const b of finalBalances) {
      assert.equal(b.netBalancePaise, 0);
      assert.equal(b.isSettled, true);
    }
  });

  await t.test('Edge Case: Duplicate username rejection (case-insensitive)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Ashutosh Duplicate',
        username: 'ASHUTOSH', // Same as ashutosh
        email: 'different@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /already taken/i);
  });

  await t.test('Edge Case: Duplicate email rejection', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Another User',
        username: 'another_user',
        email: 'ashutosh@test.com', // Duplicate email
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /already exists/i);
  });

  await t.test('Edge Case: Unauthorized group access prevention', async () => {
    // Register outsider
    const resOut = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Outsider User',
        username: 'outsider',
        email: 'outsider@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    const outsiderToken = resOut.body.accessToken;

    // Outsider tries to access Goa Trip details
    const resGet = await request(`/api/groups/${goaGroupId}`, {
      headers: { Authorization: `Bearer ${outsiderToken}` }
    });
    assert.equal(resGet.status, 403);
  });

  await t.test('Edge Case: Invalid expense split sum rejection', async () => {
    // Total is 1000, but sum of exact shares is 800
    const res = await request('/api/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ashutoshToken}` },
      body: {
        groupId: goaGroupId,
        description: 'Faulty Split',
        amount: 1000,
        paidBy: ashutoshUser.id,
        splitType: 'EXACT',
        participants: [
          { user: ashutoshUser.id, amount: 400 },
          { user: rahulUser.id, amount: 400 } // Total 800 != 1000
        ]
      }
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Sum of shares.*must exactly match/i);
  });

  await t.test('Edge Case: Google authentication linking and login', async () => {
    const res = await request('/api/auth/google', {
      method: 'POST',
      body: {
        email: 'ashutosh@test.com',
        name: 'Ashutosh Kumar',
        googleId: 'google-oauth2-id-12345',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.accessToken);
    assert.equal(res.body.user.username, 'ashutosh');
  });

  // Teardown
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import { db } from './src/db/store.js';

async function testAdminProfileEdit() {
  console.log('================================================================');
  console.log('TEST: RESOLVEAI ADMIN USERNAME & DETAILS EDIT OPTION');
  console.log('================================================================\n');

  await db.ready();

  const base = 'http://localhost:5001';

  // Seed or lookup admin user
  let admin = db.findOne('users', u => u.role === 'admin' || u.email === 'admin@resolveai.io');
  if (!admin) {
    admin = db.insert('users', {
      id: 'usr-admin-01',
      name: 'Sarah Chen (Admin)',
      email: 'admin@resolveai.io',
      role: 'admin',
      department: 'Executive Operations',
      created_at: new Date().toISOString()
    });
  }

  const originalName = admin.name;
  const originalDepartment = admin.department || 'Executive Operations';

  const adminToken = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // TEST 1: GET /api/auth/me
  console.log('TEST 1: GET /api/auth/me (Current Admin Profile)');
  const getMeRes = await fetch(`${base}/api/auth/me`, { headers });
  if (!getMeRes.ok) throw new Error(`GET /api/auth/me failed: ${getMeRes.status}`);
  const getMeData = await getMeRes.json();
  console.log(`✓ PASS: Current Admin: ${getMeData.user.name} (${getMeData.user.email}) - Role: ${getMeData.user.role}`);

  // TEST 2: Validation - Reject short username (< 2 chars)
  console.log('\nTEST 2: Validation - Reject short username (< 2 chars)');
  const invalidNameRes = await fetch(`${base}/api/auth/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ name: 'A' })
  });
  if (invalidNameRes.status === 400) {
    console.log('✓ PASS: Rejected short username with 400 Bad Request');
  } else {
    throw new Error(`Expected 400 for short name, got ${invalidNameRes.status}`);
  }

  // TEST 3: Validation - Reject invalid email format
  console.log('\nTEST 3: Validation - Reject invalid email format');
  const invalidEmailRes = await fetch(`${base}/api/auth/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ email: 'not-an-email' })
  });
  if (invalidEmailRes.status === 400) {
    console.log('✓ PASS: Rejected invalid email format with 400 Bad Request');
  } else {
    throw new Error(`Expected 400 for invalid email, got ${invalidEmailRes.status}`);
  }

  // TEST 4: Successfully Update Admin Username and Details
  console.log('\nTEST 4: PATCH /api/auth/me - Update Admin Username, Phone & Department');
  const newName = 'Sarah Chen - Chief AI Officer';
  const newDept = 'Autonomous Platform & Security Directorate';
  const newPhone = '+1 (415) 800-4499';

  const updateRes = await fetch(`${base}/api/auth/me`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      name: newName,
      department: newDept,
      phone: newPhone
    })
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`PATCH /api/auth/me failed (${updateRes.status}): ${errText}`);
  }

  const updateData = await updateRes.json();
  if (!updateData.success || updateData.user.name !== newName) {
    throw new Error(`Expected name to be "${newName}", got "${updateData.user?.name}"`);
  }
  console.log(`✓ PASS: Admin profile updated successfully:`);
  console.log(`  Name: ${updateData.user.name}`);
  console.log(`  Department: ${updateData.user.department}`);
  console.log(`  Phone: ${updateData.user.phone}`);
  console.log(`  Refreshed Token Issued: ${Boolean(updateData.token)}`);

  // TEST 5: Verify Persistence with Refreshed Token
  console.log('\nTEST 5: Verify Persistence with Refreshed Token');
  const verifyRes = await fetch(`${base}/api/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${updateData.token}`
    }
  });
  const verifyData = await verifyRes.json();
  if (verifyData.user.name !== newName || verifyData.user.department !== newDept) {
    throw new Error('Persisted profile does not match updated values');
  }
  console.log(`✓ PASS: Read-after-write confirmed: ${verifyData.user.name} (${verifyData.user.department})`);

  // CLEANUP: Restore original admin name
  console.log('\nTEST 6: Cleanup - Restore original admin name');
  await fetch(`${base}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${updateData.token}`
    },
    body: JSON.stringify({
      name: originalName,
      department: originalDepartment
    })
  });
  console.log(`✓ Restored admin name to "${originalName}"`);

  console.log('\n================================================================');
  console.log('✅ ALL ADMIN PROFILE & DETAILS EDIT TESTS PASSED 100%!');
  console.log('================================================================\n');
}

testAdminProfileEdit()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  });

import http from 'http';
import app from './src/server.js';
import { db } from './src/db/store.js';

async function run() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`[TEST] Test server listening on ${baseUrl}`);

  try {
    const testEmail = `newuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Alice Wonderland';
    const testPhone = '+1 (555) 987-6543';

    console.log(`[TEST 1] Registering new user: ${testEmail}`);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        phone: testPhone
      })
    });

    if (!regRes.ok) {
      const err = await regRes.text();
      throw new Error(`Registration failed: ${err}`);
    }

    const regData = await regRes.json();
    console.log('✓ Registration succeeded:', {
      userId: regData.user?.id,
      email: regData.user?.email,
      role: regData.user?.role,
      customerId: regData.user?.customerId
    });

    if (!regData.user?.customerId) {
      throw new Error('Expected customerId to be returned on registration');
    }

    console.log(`\n[TEST 2] Signing into the newly created account: ${testEmail}`);
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        scope: 'customer'
      })
    });

    if (!loginRes.ok) {
      const err = await loginRes.text();
      throw new Error(`Login failed with status ${loginRes.status}: ${err}`);
    }

    const loginData = await loginRes.json();
    console.log('✓ Login succeeded:', {
      userId: loginData.user?.id,
      email: loginData.user?.email,
      role: loginData.user?.role,
      customerId: loginData.user?.customerId,
      hasToken: !!loginData.token
    });

    if (loginData.user?.email !== testEmail.toLowerCase()) {
      throw new Error(`Email mismatch in login response: ${loginData.user?.email}`);
    }
    if (loginData.user?.role !== 'customer') {
      throw new Error(`Expected role 'customer', got '${loginData.user?.role}'`);
    }

    console.log('\n[TEST 3] Accessing /api/customer/me using login token');
    const meRes = await fetch(`${baseUrl}/customer/me`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (!meRes.ok) {
      const err = await meRes.text();
      throw new Error(`/customer/me failed: ${err}`);
    }

    const meData = await meRes.json();
    console.log('✓ Customer profile loaded:', {
      customerId: meData.customer?.id,
      customerName: meData.customer?.name,
      customerEmail: meData.customer?.email,
      customerPhone: meData.customer?.phone
    });

    console.log('\n=============================================');
    console.log('✓ VERIFICATION COMPLETE: ALL TESTS PASSED!');
    console.log('=============================================');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

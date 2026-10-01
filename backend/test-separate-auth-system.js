import { app } from './src/server.js';
import http from 'http';
import { handleClientMock } from '../frontend/src/services/clientMockStore.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('======================================================');
  console.log('STARTING SEPARATE AUTHENTICATION & RBAC SECURITY AUDIT');
  console.log('======================================================');

  // Start test server
  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test backend server running on ${baseUrl}\n`);

  // --- TEST 1: Customer Registration Security & Role Spoofing Prevention ---
  console.log('--- TEST 1: Customer Registration Role Enforcement ---');
  const testEmail = `attacker-${Date.now()}@domain.com`;
  const spoofRegister = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Privilege Escalation Attempt',
      email: testEmail,
      password: 'password123',
      role: 'admin' // Attempting to escalate to admin
    })
  });

  if (spoofRegister.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(spoofRegister.data)}`);
  }
  if (spoofRegister.data.user?.role !== 'customer') {
    throw new Error(`CRITICAL: Role spoofing succeeded! Role assigned was ${spoofRegister.data.user?.role}`);
  }
  console.log('✓ PASS: Public registration forced role to "customer" (ignored client-supplied role=admin)');

  // --- TEST 2: Customer Account Attempting Staff Console Login ---
  console.log('\n--- TEST 2: Customer Blocked from Staff Console Login ---');
  const staffLoginAttempt = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      scope: 'staff' // Declaring staff login
    })
  });

  if (staffLoginAttempt.status !== 403) {
    throw new Error(`Expected 403 Forbidden for customer on staff login, got ${staffLoginAttempt.status}`);
  }
  console.log('✓ PASS: Customer credentials rejected from staff login with 403 Forbidden:', staffLoginAttempt.data.message);

  // --- TEST 3: Customer Login into Customer Portal ---
  console.log('\n--- TEST 3: Customer Login into Customer Portal ---');
  const customerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      scope: 'customer'
    })
  });

  if (customerLogin.status !== 200 || !customerLogin.data.token) {
    throw new Error(`Customer login failed: ${JSON.stringify(customerLogin.data)}`);
  }
  const customerToken = customerLogin.data.token;
  console.log('✓ PASS: Customer successfully authenticated into customer portal. Token generated.');

  // --- TEST 4: Customer Blocked from ALL Staff Backend Endpoints ---
  console.log('\n--- TEST 4: Customer Token Rejected from Staff Endpoints ---');
  const endpointsToTest = [
    { method: 'GET', path: '/api/customers', name: 'Global CRM Customer List' },
    { method: 'GET', path: '/api/orders', name: 'Global Orders List' },
    { method: 'GET', path: '/api/supervisor/status', name: 'Supervisor Telemetry' },
    { method: 'GET', path: '/api/autonomy/settings', name: 'Autonomy Settings' },
    { method: 'POST', path: '/api/autonomy/disable', name: 'Disable Autonomy' },
    { method: 'POST', path: '/api/autonomy/emergency-stop', name: 'Emergency Stop' },
    { method: 'GET', path: '/api/policies', name: 'Internal Policy List' },
    { method: 'POST', path: '/api/policies', name: 'Create Policy' },
    { method: 'GET', path: '/api/approvals', name: 'Internal Approvals Queue' },
    { method: 'POST', path: '/api/approvals/app-001/approve', name: 'Approve Action' },
    { method: 'GET', path: '/api/activity', name: 'Company Audit Logs' },
    { method: 'POST', path: '/api/system/reset', name: 'System Reset' }
  ];

  for (const ep of endpointsToTest) {
    const res = await request(ep.path, {
      method: ep.method,
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`CRITICAL SECURITY FAILURE: Customer accessed ${ep.path} (${ep.name}) with status ${res.status}!`);
    }
    console.log(`✓ PASS: ${ep.method} ${ep.path} rejected with 403 Forbidden (${ep.name})`);
  }

  // --- TEST 5: Customer Can Access Customer Portal Endpoints ---
  console.log('\n--- TEST 5: Customer Can Access Customer-Scoped Endpoints ---');
  const custMe = await request('/api/customer/me', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (custMe.status !== 200) {
    throw new Error(`Failed to access customer profile: ${custMe.status}`);
  }
  console.log('✓ PASS: Customer successfully accessed /api/customer/me');

  const custOrders = await request('/api/customer/orders', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  if (custOrders.status !== 200) {
    throw new Error(`Failed to access customer orders: ${custOrders.status}`);
  }
  console.log('✓ PASS: Customer successfully accessed /api/customer/orders');

  // --- TEST 6: Staff Authentications (Manager & Admin) ---
  console.log('\n--- TEST 6: Staff Login Matrix ---');
  // Manager
  const managerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'manager@resolveai.io',
      password: 'password123',
      scope: 'staff'
    })
  });
  if (managerLogin.status !== 200 || managerLogin.data.user?.role !== 'manager') {
    throw new Error(`Manager login failed: ${JSON.stringify(managerLogin.data)}`);
  }
  const managerToken = managerLogin.data.token;
  console.log('✓ PASS: Manager authenticated via staff login (role: manager)');

  // Admin
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@resolveai.io',
      password: 'password123',
      scope: 'staff'
    })
  });
  if (adminLogin.status !== 200 || adminLogin.data.user?.role !== 'admin') {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log('✓ PASS: Admin authenticated via staff login (role: admin)');

  // --- TEST 7: Manager vs Admin Operational Boundaries ---
  console.log('\n--- TEST 7: Manager vs Admin Operational Boundaries ---');
  // Manager can read supervisor and toggle pause
  const managerSupervisor = await request('/api/supervisor/status', {
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (managerSupervisor.status !== 200) {
    throw new Error(`Manager failed to read supervisor status: ${managerSupervisor.status}`);
  }
  console.log('✓ PASS: Manager authorized to access /api/supervisor/status');

  // Manager CANNOT execute admin-only system reset or settings patch
  const managerResetAttempt = await request('/api/system/reset', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (managerResetAttempt.status !== 403) {
    throw new Error(`Expected 403 for manager calling /api/system/reset, got ${managerResetAttempt.status}`);
  }
  console.log('✓ PASS: Manager correctly blocked from Admin-only /api/system/reset (403 Forbidden)');

  // Manager CANNOT delete tickets (Admin only)
  const managerDeleteTicket = await request('/api/tickets/tkt-001', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (managerDeleteTicket.status !== 403) {
    throw new Error(`Expected 403 for manager deleting ticket, got ${managerDeleteTicket.status}`);
  }
  console.log('✓ PASS: Manager correctly blocked from Admin-only ticket deletion (403 Forbidden)');

  // --- TEST 8: Client Mock Store Parity Verification ---
  console.log('\n--- TEST 8: Client Mock Store Parity Verification ---');
  // 1. Staff scope on customer credentials throws error
  let mockError = '';
  try {
    handleClientMock('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'elena.rostova@acmecorp.com', password: 'password123', scope: 'staff' })
    });
  } catch (e) {
    mockError = e.message;
  }
  if (!mockError.includes('Staff access required')) {
    throw new Error(`Expected staff access required error in clientMockStore, got: ${mockError}`);
  }
  console.log('✓ PASS: clientMockStore correctly rejected customer on staff login with:', mockError);

  // 2. Register via clientMockStore forces customer role
  const mockReg = handleClientMock('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Hacker', email: `hacker-${Date.now()}@test.io`, password: 'password123', role: 'admin' })
  });
  if (mockReg.user?.role !== 'customer') {
    throw new Error(`Expected clientMockStore register to enforce role: 'customer', got: ${mockReg.user?.role}`);
  }
  console.log('✓ PASS: clientMockStore registration forced role to "customer"');

  console.log('\n======================================================');
  console.log('ALL 8 SECURITY & SEPARATE AUTHENTICATION SUITES PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
}).finally(() => {
  if (server) server.close();
  process.exit(0);
});

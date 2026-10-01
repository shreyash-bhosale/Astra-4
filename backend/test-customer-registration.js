import assert from 'assert';
import http from 'http';

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runRegistrationTests() {
  console.log('====================================================');
  console.log('TESTING RESOLVEAI CUSTOMER REGISTRATION & ONBOARDING');
  console.log('====================================================\n');

  const testEmail = `newcustomer_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  // 1. Valid Registration
  console.log('1. Valid Customer Registration (POST /api/auth/register)');
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Jane Foster',
      email: testEmail,
      phone: '+1 555 982 1204',
      password: testPassword
    })
  });

  assert.strictEqual(regRes.status, 201, `Expected status 201, got ${regRes.status}: ${JSON.stringify(regRes.data)}`);
  assert.strictEqual(regRes.data.user.role, 'customer', 'New account must have role: customer');
  assert.strictEqual(regRes.data.user.voice_updates_enabled, false, 'Voice updates must be OFF by default');
  assert.ok(regRes.data.token, 'Token must be issued');
  console.log(`✓ Registration succeeded. Role: ${regRes.data.user.role}, Voice Enabled: ${regRes.data.user.voice_updates_enabled}\n`);

  const customerToken = regRes.data.token;

  // 2. Role Tampering Attempt (Privilege Escalation Prevention)
  console.log('2. Privilege Escalation Prevention (Attempting role: admin)');
  const tamperEmail = `hacker_${Date.now()}@example.com`;
  const tamperRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Malicious Attacker',
      email: tamperEmail,
      password: testPassword,
      role: 'admin' // Attempting to escalate to admin
    })
  });

  assert.strictEqual(tamperRes.status, 201);
  assert.strictEqual(tamperRes.data.user.role, 'customer', 'Server must ignore client role and force role: customer');
  console.log('✓ PASS: Injected role "admin" was securely overridden to "customer"\n');

  // 3. Duplicate Account Prevention
  console.log('3. Duplicate Email Prevention');
  const dupRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Jane Foster Duplicate',
      email: testEmail,
      password: testPassword
    })
  });

  assert.strictEqual(dupRes.status, 400);
  assert.ok(dupRes.data.error.includes('already exists'), 'Error must inform user account exists');
  console.log(`✓ PASS: Duplicate registration rejected with 400: "${dupRes.data.error}"\n`);

  // 4. Password and Email Validation
  console.log('4. Validation (Weak password & malformed email)');
  const weakRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Short Pass',
      email: 'valid@example.com',
      password: '123' // too short
    })
  });
  assert.strictEqual(weakRes.status, 400, 'Weak password must be rejected');

  const invalidEmailRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bad Email',
      email: 'not-an-email',
      password: testPassword
    })
  });
  assert.strictEqual(invalidEmailRes.status, 400, 'Malformed email must be rejected');
  console.log('✓ PASS: Weak password (<6 chars) and malformed email properly rejected\n');

  // 5. Login with New Account
  console.log('5. Customer Login with New Credentials (POST /api/auth/login)');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });

  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.data.user.role, 'customer');
  console.log(`✓ PASS: Logged in successfully as ${loginRes.data.user.name} (${loginRes.data.user.role})\n`);

  // 6. Access Customer Portal Profile & Orders
  console.log('6. Access Customer Profile (GET /api/customer/me)');
  const profileRes = await request('/api/customer/me', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });

  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.data.customer.email, testEmail);
  console.log(`✓ Profile retrieved: ${profileRes.data.customer.name} (Tier: ${profileRes.data.customer.tier})\n`);

  // 7. Customer Raises an Issue
  console.log('7. Create Ticket from Customer Portal (POST /api/customer/tickets)');
  const ticketRes = await request('/api/customer/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      title: 'Packaging was crushed upon arrival',
      description: 'The shipping box arrived heavily damaged and the internal product seal was torn.',
      category: 'Damaged Product'
    })
  });

  assert.strictEqual(ticketRes.status, 201);
  const newTicketId = ticketRes.data.ticket.id;
  console.log(`✓ Ticket created: #${newTicketId} (Status: ${ticketRes.data.ticket.customerSafeStatus.label})\n`);

  // 8. Voice Updates Preference Management (OFF by default, user enables)
  console.log('8. Voice Preferences Management (PATCH /api/customer/preferences)');
  // Verify default was OFF
  assert.strictEqual(profileRes.data.customer.voice_updates_enabled, false);

  // Enable Voice Updates
  const enableVoiceRes = await request('/api/customer/preferences', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      phone: '+1 555 982 1204',
      voice_updates_enabled: true,
      voice_update_frequency: 'important',
      voice_call_start: '09:00',
      voice_call_end: '20:00',
      timezone: 'America/New_York'
    })
  });

  assert.strictEqual(enableVoiceRes.status, 200);
  assert.strictEqual(enableVoiceRes.data.customer.voice_updates_enabled, true);
  assert.strictEqual(enableVoiceRes.data.customer.timezone, 'America/New_York');
  console.log('✓ PASS: Voice updates enabled by customer with calling window 09:00 - 20:00\n');

  // Disable Voice Updates
  const disableVoiceRes = await request('/api/customer/preferences', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      voice_updates_enabled: false
    })
  });
  assert.strictEqual(disableVoiceRes.status, 200);
  assert.strictEqual(disableVoiceRes.data.customer.voice_updates_enabled, false);
  console.log('✓ PASS: Voice updates toggled OFF cleanly\n');

  // 9. AI Support Chat for Authenticated Customer
  console.log('9. Customer AI Chatbot Scoped to New Customer');
  const chatRes = await request('/api/customer/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      message: 'What is the status of my crushed packaging issue?'
    })
  });

  assert.strictEqual(chatRes.status, 200);
  assert.ok(chatRes.data.reply.length > 10, 'Chatbot must return helpful reply');
  console.log(`✓ AI Support responded: "${chatRes.data.reply.slice(0, 80)}..."\n`);

  // 10. Cross-Tenant Ticket Isolation (Intruder test)
  console.log('10. Cross-Customer Isolation (Accessing unauthorized ticket)');
  const crossRes = await request('/api/customer/tickets/tkt-001', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert.strictEqual(crossRes.status, 403, 'Must return 403 Forbidden when accessing another customer ticket');
  console.log('✓ PASS: Intruder attempt returned HTTP 403 Forbidden\n');

  // 11. Password Recovery Flow
  console.log('11. Password Recovery Flow (POST /api/auth/forgot-password & reset-password)');
  const forgotRes = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail })
  });
  assert.strictEqual(forgotRes.status, 200);
  assert.ok(forgotRes.data.message.includes('password reset link has been dispatched'));

  const resetRes = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'BrandNewPassword456!'
    })
  });
  assert.strictEqual(resetRes.status, 200);
  assert.ok(resetRes.data.message.includes('Password successfully updated'));

  // Verify login with new password
  const newLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'BrandNewPassword456!'
    })
  });
  assert.strictEqual(newLoginRes.status, 200);
  console.log('✓ PASS: Password reset and re-authentication with new credentials verified\n');

  console.log('====================================================');
  console.log('ALL CUSTOMER REGISTRATION & AUTH TESTS PASSED!');
  console.log('====================================================');
}

runRegistrationTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});

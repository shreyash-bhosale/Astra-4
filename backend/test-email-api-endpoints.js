import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import { app } from './src/server.js';

async function testEndpoints() {
  let base = 'http://localhost:5001';
  let server = null;
  try {
    const ping = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(800) });
    if (!ping.ok) throw new Error();
  } catch (e) {
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    base = `http://localhost:${server.address().port}`;
  }

  console.log(`Testing Authenticated HTTP Endpoints on ${base}...\n`);

  try {
    // Generate valid test JWT for manager user
  const token = jwt.sign(
    { id: 'usr-manager-01', email: 'manager@resolveai.io', role: 'manager' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. GET /api/tickets/tkt-001/emails
  console.log('1. GET /api/tickets/tkt-001/emails (Authenticated)');
  const res1 = await fetch(`${base}/api/tickets/tkt-001/emails`, {
    headers: authHeaders
  });
  if (!res1.ok) {
    const errText = await res1.text();
    throw new Error(`GET /emails failed with HTTP ${res1.status}: ${errText}`);
  }
  const data1 = await res1.json();
  console.log(`✓ Fetched ${data1.length} emails for ticket tkt-001`);

  // 2. POST /api/tickets/tkt-001/send-update (Valid Recipient)
  console.log('\n2. POST /api/tickets/tkt-001/send-update (Authorized Recipient)');
  const res2 = await fetch(`${base}/api/tickets/tkt-001/send-update`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      recipient: 'elena.rostova@acmecorp.com',
      subject: 'ResolveAI — Manual Ticket Update',
      message: 'Hello Elena, we have updated your case notes and our team is verifying the courier tracking.'
    })
  });
  if (!res2.ok) {
    const errText = await res2.text();
    throw new Error(`POST /send-update failed: ${res2.status} - ${errText}`);
  }
  const data2 = await res2.json();
  console.log('✓ Manual update dispatched:', data2.messageId);

  // 3. POST /api/tickets/tkt-001/send-update (Unauthorized Recipient Rejection)
  console.log('\n3. POST /api/tickets/tkt-001/send-update (Unauthorized Recipient Rejection)');
  const res3 = await fetch(`${base}/api/tickets/tkt-001/send-update`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      recipient: 'attacker@random-external-domain.com',
      subject: 'Security Probe',
      message: 'This should be blocked by backend customer validation.'
    })
  });
  if (res3.status === 400) {
    const errJson = await res3.json();
    console.log('✓ Correctly rejected unauthorized recipient:', errJson.error);
  } else {
    throw new Error(`Expected HTTP 400 for unauthorized recipient, got ${res3.status}`);
  }

  // 4. POST /api/emails/:id/retry
  if (data1.length > 0) {
    const testId = data1[0].id;
    console.log(`\n4. POST /api/emails/${testId}/retry`);
    const res4 = await fetch(`${base}/api/emails/${testId}/retry`, {
      method: 'POST',
      headers: authHeaders
    });
    const data4 = await res4.json();
    console.log('✓ Retry endpoint response:', data4.message || data4.status);
  }

  console.log('\n====================================================');
  console.log('ALL HTTP EMAIL API ENDPOINT TESTS PASSED SUCCESSFULLY');
  console.log('====================================================');
  } finally {
    if (server) {
      server.close();
    }
  }
}

testEndpoints().catch(err => {
  console.error('API endpoint test failed:', err);
  process.exit(1);
});

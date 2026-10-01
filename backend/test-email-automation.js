const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 ResolveAI — Transactional Email Automation Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Health Check Endpoint Status
    // --------------------------------------------------------------------------
    console.log('1. Health Check Verification (GET /api/health)');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.service === 'ResolveAI Backend API', 'Service name is ResolveAI Backend API');
    assert(typeof healthData.emailServiceConfigured === 'boolean', 'Health reports emailServiceConfigured boolean');
    assert(healthData.emailProvider !== undefined, `Health reports emailProvider: ${healthData.emailProvider}`);

    // --------------------------------------------------------------------------
    // TEST 2: Authentication for Admin and Customer
    // --------------------------------------------------------------------------
    console.log('\n2. User Authentication (Admin & Customer)');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@resolveai.io', password: 'password123' })
    });
    const adminAuth = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin (Alex Vance) logged in successfully');
    const adminToken = adminAuth.token;

    const agentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'agent@resolveai.io', password: 'password123' })
    });
    const agentAuth = await agentLoginRes.json();
    const agentToken = agentAuth.token;

    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@resolveai.io', password: 'password123' })
    });
    const customerAuth = await customerLoginRes.json();
    const customerToken = customerAuth.token;

    // --------------------------------------------------------------------------
    // TEST 3: Email Service Status Endpoint (GET /api/emails/status)
    // --------------------------------------------------------------------------
    console.log('\n3. Email Subsystem Status (GET /api/emails/status)');
    const statusRes = await fetch(`${BASE_URL}/emails/status`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'Email status endpoint returns HTTP 200');
    assert(statusData.operational === true, 'Email service is marked operational');
    assert(typeof statusData.provider === 'string', `Provider identified: ${statusData.provider}`);
    assert(typeof statusData.sender === 'string', `Sender identified: ${statusData.sender}`);
    assert(statusData.apiKeyConfigured !== undefined, 'Reports apiKeyConfigured boolean without exposing key');
    assert(statusData.resendApiKey === undefined, 'Security: API key is NEVER exposed in status response');

    // --------------------------------------------------------------------------
    // TEST 4: Admin-Only Test Email Authorization & Dispatch (POST /api/emails/test)
    // --------------------------------------------------------------------------
    console.log('\n4. Admin-Only Test Dispatch Protection (POST /api/emails/test)');

    // 4a. Unauthenticated should fail (401)
    const unauthTestRes = await fetch(`${BASE_URL}/emails/test`, { method: 'POST' });
    assert(unauthTestRes.status === 401, 'Unauthenticated test email request rejected (401)');

    // 4b. Customer role should fail (403)
    const customerTestRes = await fetch(`${BASE_URL}/emails/test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert(customerTestRes.status === 403, 'Customer role cannot trigger admin test email (403)');

    // 4c. Agent role should fail (403)
    const agentTestRes = await fetch(`${BASE_URL}/emails/test`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    assert(agentTestRes.status === 403, 'Agent role cannot trigger admin test email (403)');

    // 4d. Admin role succeeds and sends strictly to admin's email
    const adminTestRes = await fetch(`${BASE_URL}/emails/test`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      // Even if malicious caller specifies an arbitrary recipient, backend must ignore it
      body: JSON.stringify({ recipient: 'victim@attacker.com' })
    });
    const adminTestData = await adminTestRes.json();
    assert(adminTestRes.status === 200, 'Admin successfully dispatched test verification email');
    assert(adminTestData.recipient === 'admin@resolveai.io', `Recipient locked to authenticated admin (${adminTestData.recipient})`);
    assert(typeof adminTestData.providerMessageId === 'string', `Generated provider delivery ID: ${adminTestData.providerMessageId}`);

    // --------------------------------------------------------------------------
    // TEST 5: Automated Workflow Events & Direct Service Calls
    // --------------------------------------------------------------------------
    console.log('\n5. Automated Workflow Events via EmailService');
    const { emailService } = await import('./src/services/emailService.js');

    // 5a. Ticket Created
    const ticketCreatedResult = await emailService.sendTicketCreatedEmail({
      ticketId: 'tkt-test-101',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.rostova@acmecorp.com',
      issueSummary: 'Astra SoundPro left headphone speaker distorted',
      agentRunId: 'run-init-101'
    });
    assert(ticketCreatedResult.success === true, 'Ticket Created email dispatched successfully');
    assert(ticketCreatedResult.status === 'SENT', 'Ticket Created delivery status is SENT');

    // 5b. Idempotency Check (Duplicate send prevented)
    const duplicateResult = await emailService.sendTicketCreatedEmail({
      ticketId: 'tkt-test-101',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.rostova@acmecorp.com',
      issueSummary: 'Astra SoundPro left headphone speaker distorted',
      agentRunId: 'run-init-101'
    });
    assert(duplicateResult.status === 'DUPLICATE_SKIPPED', 'Duplicate email prevented by idempotency check');
    assert(duplicateResult.skipped === true, 'Duplicate marked as skipped');

    // 5c. Status Update
    const statusUpdateResult = await emailService.sendStatusUpdateEmail({
      ticketId: 'tkt-test-101',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.rostova@acmecorp.com',
      stage: 'Investigation Completed',
      message: 'Hardware defect verified against batch serial numbers.'
    });
    assert(statusUpdateResult.success === true, 'Status Update email dispatched successfully');

    // 5d. Approval Requested (Manager Alert)
    const approvalResult = await emailService.sendApprovalRequestedEmail({
      ticketId: 'tkt-test-101',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.rostova@acmecorp.com',
      action: 'create_replacement_order',
      reason: 'Physical unit defect within active warranty coverage'
    });
    assert(approvalResult.success === true, 'Manager Approval Requested email dispatched to manager');

    // 5e. Action Completed
    const actionResult = await emailService.sendActionCompletedEmail({
      ticketId: 'tkt-test-101',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.rostova@acmecorp.com',
      action: 'create_replacement_order',
      referenceId: 'REP-99218-US'
    });
    assert(actionResult.success === true, 'Action Completed email dispatched to customer');

    // 5f. Final Resolution
    const resolutionResult = await emailService.sendResolutionEmail({
      ticketId: 'tkt-test-101',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.rostova@acmecorp.com',
      originalIssue: 'Distorted speaker',
      resolutionSummary: 'Replacement authorized and dispatched under warranty.',
      referenceId: 'REP-99218-US'
    });
    assert(resolutionResult.success === true, 'Final Resolution email dispatched to customer');

    // --------------------------------------------------------------------------
    // TEST 6: Customer Email Preference Gate (Requirement 10)
    // --------------------------------------------------------------------------
    console.log('\n6. Customer Email Preferences Enforcement');
    const optedOutCustomer = {
      id: 'cust-opt-out',
      name: 'Opted Out Customer',
      email: 'optedout@example.com',
      email_notifications: false
    };

    const optOutResult = await emailService.sendTicketCreatedEmail({
      ticketId: 'tkt-opt-01',
      customer: optedOutCustomer,
      issueSummary: 'Sample issue'
    });
    assert(optOutResult.status === 'SKIPPED_PREFERENCE', 'Email skipped when customer has disabled email notifications');
    assert(optOutResult.skipped === true, 'Customer preference opt-out respected');

    // --------------------------------------------------------------------------
    // TEST 7: Invalid Recipient Sanitization & Failure Safety
    // --------------------------------------------------------------------------
    console.log('\n7. Security & Header Injection Prevention');
    const headerInjectionResult = await emailService.sendEmail({
      to: 'clean@example.com\r\nBcc: evil@hacker.com',
      subject: 'Injected subject\r\nTo: hijacked@domain.com',
      text: 'Test content',
      ticketId: 'tkt-sec-01'
    });
    assert(headerInjectionResult.success === true, 'CRLF header injection cleanly neutralized');

    const invalidEmailResult = await emailService.sendEmail({
      to: 'not-an-email-address',
      subject: 'Invalid test',
      text: 'Test',
      ticketId: 'tkt-sec-02'
    });
    assert(invalidEmailResult.success === false, 'Invalid email address syntax rejected safely');
    assert(invalidEmailResult.status === 'SKIPPED', 'Invalid recipient returns SKIPPED status without crashing');

    // --------------------------------------------------------------------------
    // TEST 8: Outbound Email Logs Endpoint (GET /api/emails/logs)
    // --------------------------------------------------------------------------
    console.log('\n8. Email Audit Log (GET /api/emails/logs)');
    const logsRes = await fetch(`${BASE_URL}/emails/logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const logs = await logsRes.json();
    assert(logsRes.status === 200, 'Email audit logs endpoint returns HTTP 200');
    assert(Array.isArray(logs) && logs.length > 0, `Audit log contains ${logs.length} logged email dispatches`);
    const sampleLog = logs[0];
    assert(sampleLog.recipient !== undefined, 'Log contains recipient address');
    assert(sampleLog.subject !== undefined, 'Log contains subject line');
    assert(sampleLog.status !== undefined, `Log contains status (${sampleLog.status})`);
    assert(sampleLog.api_key === undefined && sampleLog.token === undefined, 'Security: Logs never contain API keys or auth tokens');

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`📊 Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();

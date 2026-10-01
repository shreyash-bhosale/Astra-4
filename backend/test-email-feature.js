import { emailService } from './src/services/emailService.js';
import { db } from './src/db/repository.js';

async function runTests() {
  console.log('====================================================');
  console.log('RESOLVEAI — EMAIL AUTOMATION SYSTEM COMPREHENSIVE TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Sanitization & Email Injection Protection
  console.log('--- TEST 1: Email Injection & Sanitization ---');
  const dirtySubject = 'Urgent Update\r\nBcc: attacker@evil.com\nSubject: Injected';
  const cleanSubject = emailService.sanitizeHeader(dirtySubject);
  assert(
    !cleanSubject.includes('\r') && !cleanSubject.includes('\n') && !cleanSubject.includes('Bcc:'),
    `Header injection prevented: "${cleanSubject}"`
  );

  // TEST 2: Email Address Validation
  console.log('\n--- TEST 2: Recipient Validation ---');
  assert(emailService.isValidEmail('customer@example.com'), 'Valid email passes');
  assert(!emailService.isValidEmail('invalid-email-format'), 'Malformed email rejected');
  assert(!emailService.isValidEmail('user@domain..com'), 'Double dot rejected');

  // TEST 3: Transactional Template Generation
  console.log('\n--- TEST 3: Responsive Template Generation ---');
  const rendered = emailService.renderTemplate('taskStarted', {
    customerName: 'Elena Rostova',
    ticketId: 'tkt-001',
    issueSummary: 'Noise canceling defect reported on SoundPro ANC',
    status: 'INVESTIGATING',
    timestamp: new Date().toISOString()
  });
  assert(rendered.subject.includes('Your Request Is Being Processed'), 'Template subject correct');
  assert(rendered.html.includes('Elena Rostova'), 'Template HTML includes customer name');
  assert(rendered.html.includes('tkt-001'), 'Template HTML includes ticket ID');
  assert(rendered.text.includes('Elena Rostova'), 'Plaintext fallback generated');

  // TEST 4: Dispatch Event - Task Started
  console.log('\n--- TEST 4: Automatic Event Dispatch (Task Started) ---');
  const runId = `run_${Date.now()}`;
  const startResult = await emailService.notifyTaskStarted({
    ticketId: 'tkt-001',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@techcorp.io',
    issueSummary: 'Astra SoundPro ear cup crackle during ANC mode',
    status: 'INVESTIGATING',
    agentRunId: runId
  });
  assert(startResult.success === true, 'Task Started email dispatched');
  assert(startResult.messageId && (startResult.messageId.startsWith('msg_') || startResult.messageId.length >= 10), `Provider message ID returned: ${startResult.messageId}`);

  // TEST 5: Idempotency / Duplicate Prevention
  console.log('\n--- TEST 5: Idempotency & Duplicate Prevention ---');
  const dupResult = await emailService.notifyTaskStarted({
    ticketId: 'tkt-001',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@techcorp.io',
    issueSummary: 'Astra SoundPro ear cup crackle during ANC mode',
    status: 'INVESTIGATING',
    agentRunId: runId
  });
  assert(dupResult.skipped === true, 'Identical event execution safely skipped (duplicate prevented)');

  // TEST 6: Manager Approval Notification
  console.log('\n--- TEST 6: Manager Internal Approval Gate Notification ---');
  const approvalResult = await emailService.notifyApprovalRequested({
    ticketId: 'tkt-001',
    customerName: 'Elena Rostova',
    action: 'Replacement Shipment Provisioning',
    reason: 'Warranty coverage valid, exceeds tier-1 automated refund budget',
    evidence: { orderId: 'ord-8832', warrantyDaysRemaining: 4 },
    policy: 'POL-001 (Section 3B)'
  });
  assert(approvalResult.success === true, 'Approval requested email dispatched to supervisor');

  // TEST 7: Action Completed & Final Resolution
  console.log('\n--- TEST 7: Action Completed & Final Resolution ---');
  const actionResult = await emailService.notifyActionCompleted({
    ticketId: 'tkt-001',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@techcorp.io',
    action: 'Replacement Unit Dispatched',
    referenceId: 'REP-77382',
    status: 'ACTION_EXECUTED'
  });
  assert(actionResult.success === true, 'Action completed notification sent');

  const resolutionResult = await emailService.notifyFinalResolution({
    ticketId: 'tkt-001',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@techcorp.io',
    originalIssue: 'Astra SoundPro ear cup crackle during ANC mode',
    resolutionSummary: 'Replacement authorized and priority courier label generated',
    referenceId: 'REP-77382',
    resolutionStatus: 'RESOLVED'
  });
  assert(resolutionResult.success === true, 'Final resolution notification sent');

  // TEST 8: Database & Audit Trail Persistence
  console.log('\n--- TEST 8: Database Audit Trail Verification ---');
  const ticketEmails = await emailService.getTicketEmails('tkt-001');
  assert(ticketEmails.length >= 4, `Found ${ticketEmails.length} logged email notifications for tkt-001`);
  
  const sentEmails = ticketEmails.filter(e => e.status === 'SENT');
  assert(sentEmails.length >= 3, `Dispatched emails marked SENT: ${sentEmails.length}`);

  const auditLogs = await db.find('audit_logs', { ticket_id: 'tkt-001' });
  const emailAudits = auditLogs.filter(a =>
    a.agent === 'Communication Agent' ||
    a.agent === 'CommunicationAgent' ||
    (a.event_type && a.event_type.startsWith('EMAIL_')) ||
    (a.action && a.action.startsWith('EMAIL_'))
  );
  assert(emailAudits.length > 0, `Recorded ${emailAudits.length} safe audit trail events for email operations`);

  // TEST 9: Retry Handling on Failed Email
  console.log('\n--- TEST 9: Retry System ---');
  // Inject a simulated failed email record
  const failedRecord = await db.insert('email_notifications', {
    ticket_id: 'tkt-001',
    event_type: 'TASK_UPDATE',
    recipient: 'elena.rostova@techcorp.io',
    subject: 'ResolveAI — Update on Ticket tkt-001',
    html_body: '<p>Update test</p>',
    text_body: 'Update test',
    status: 'FAILED',
    attempt_count: 1,
    error_message: 'Temporary provider 503 network timeout'
  });

  const retryResult = await emailService.retryEmail(failedRecord.id);
  assert(retryResult.success === true, 'Failed email successfully retried');
  assert(retryResult.email.status === 'SENT', 'Retried email transitioned to SENT');
  assert(retryResult.email.attempt_count === 2, `Attempt count incremented to ${retryResult.email.attempt_count}`);

  // TEST 10: Non-blocking Resilience (Business operation does not break if email fails)
  console.log('\n--- TEST 10: Non-blocking Resilience ---');
  const invalidResult = await emailService.notifyTaskStarted({
    ticketId: 'tkt-001',
    customerName: 'No Email User',
    customerEmail: null,
    issueSummary: 'Testing null email robustness',
    status: 'OPEN'
  });
  assert(invalidResult.skipped === true, 'Missing customer email returns skipped without throwing exception');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});

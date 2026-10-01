import { db } from './src/db/store.js';
import { supervisorAgent } from './src/agents/supervisorAgent.js';
import { orchestratorAgent } from './src/agents/orchestrator.js';

async function runTests() {
  console.log('===============================================================');
  console.log('⚡ RESOLVEAI AUTONOMOUS APPROVAL & REJECTION TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✕ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // Ensure clean active state for test run
  supervisorAgent.updateAutonomySettings({
    enabled: true,
    paused: false,
    emergency_stopped: false,
    approval_mode: 'HYBRID',
    autonomous_approvals_enabled: true,
    refund_limit: 1000,
    permissions: {
      allow_replacements: true,
      allow_shipping: true,
      allow_notifications: true,
      allow_status_changes: true,
      allow_refunds: false
    }
  }, { name: 'Admin Test' });

  // 1. Check Autonomy Settings Defaults
  const settings = supervisorAgent.getAutonomySettings();
  assert(settings.approval_mode !== undefined, 'Settings include approval_mode');
  assert(settings.permissions?.allow_replacements === true, 'Settings allow replacements by default');
  assert(settings.permissions?.allow_shipping === true, 'Settings allow shipping by default');
  assert(settings.permissions?.allow_refunds === false, 'Settings restrict refunds by default');
  assert(settings.restricted_tools?.includes('modify_authentication'), 'Authentication modification is permanently restricted');

  // 2. Test Evaluation on Existing Approval appr-002 (Damaged/Wrong Keyboard within 14 days)
  console.log('\n--- Test 2: Evaluate Eligible Replacement Request (TKT-002 / appr-002) ---');
  const evalEligible = await supervisorAgent.evaluateApprovalRequest('appr-002');
  console.log('Evaluation Result:', JSON.stringify({
    decision: evalEligible.decision,
    action: evalEligible.action,
    policy: evalEligible.policy,
    reason: evalEligible.reason,
    evidenceChecks: evalEligible.evidenceChecks
  }, null, 2));

  assert(evalEligible.decision === 'APPROVE', 'Supervisor evaluates eligible replacement request as APPROVE');
  assert(evalEligible.policyAllows === true, 'policyAllows is true');
  assert(evalEligible.autonomousPermission === true, 'autonomousPermission is true');
  assert(evalEligible.evidenceValidated === true, 'evidenceValidated is true');

  // 3. Test Ineligible Request Evaluation (Warranty expired > 14 days)
  console.log('\n--- Test 3: Evaluate Ineligible Claim (Expired Warranty > 14 days) ---');
  // Create an expired warranty ticket & approval
  const expiredApproval = db.insert('approvals', {
    id: 'appr-test-expired-01',
    ticket_id: 'tkt-004', // delivered 48 days ago
    action: 'create_replacement_request',
    status: 'PENDING',
    reason: 'Customer requesting replacement for headphones delivered 48 days ago',
    evidence: {
      orderId: 'ORD-7311',
      daysSinceDelivery: 48,
      policyCited: 'POL-001 (Section 1 - 14-day warranty threshold)'
    }
  });

  const evalExpired = await supervisorAgent.evaluateApprovalRequest(expiredApproval.id);
  console.log('Expired Claim Decision:', evalExpired.decision, '| Reason:', evalExpired.reason);
  assert(evalExpired.decision === 'REJECT', 'Supervisor autonomously REJECTS claim when policy eligibility fails');
  assert(evalExpired.policyAllows === false, 'policyAllows is false for expired claim');

  // 4. Test Escalation for High-Risk / Disallowed Action (Refund)
  console.log('\n--- Test 4: Evaluate Restricted Action (Financial Refund without permission) ---');
  const refundApproval = db.insert('approvals', {
    id: 'appr-test-refund-01',
    ticket_id: 'tkt-001',
    action: 'refund_order',
    status: 'PENDING',
    reason: 'Customer requests full cash refund of $349',
    evidence: {
      orderId: 'ORD-4821',
      amount: 349
    }
  });

  const evalRefund = await supervisorAgent.evaluateApprovalRequest(refundApproval.id);
  console.log('Refund Decision:', evalRefund.decision, '| Reason:', evalRefund.reason);
  assert(evalRefund.decision === 'ESCALATE', 'Supervisor ESCALATES financial refund when permission is not granted');

  // 5. Test Escalation when Order Exceeds Autonomous Financial Ceiling
  console.log('\n--- Test 5: Evaluate Order Exceeding Autonomous Limit ($8,500) ---');
  const highValOrder = db.insert('orders', {
    id: 'ORD-9999',
    customer_id: 'cust-101',
    product_name: 'Studio Master Broadcast Console 64-Ch',
    amount: 8500.00,
    status: 'DELIVERED',
    delivery_date: '2026-09-29T10:00:00.000Z'
  });

  const highValTicket = db.insert('tickets', {
    id: 'tkt-highval-01',
    customer_id: 'cust-101',
    order_id: 'ORD-9999',
    title: 'Defective Broadcast Console Channel Strip',
    category: 'damaged_product',
    status: 'OPEN'
  });

  const highValApproval = db.insert('approvals', {
    id: 'appr-test-highval-01',
    ticket_id: highValTicket.id,
    action: 'create_replacement_request',
    status: 'PENDING',
    reason: 'Damaged channel strip on studio console',
    evidence: {
      orderId: 'ORD-9999',
      daysSinceDelivery: 2
    }
  });

  const evalHighVal = await supervisorAgent.evaluateApprovalRequest(highValApproval.id);
  console.log('High Value Order Decision:', evalHighVal.decision, '| Reason:', evalHighVal.reason);
  assert(evalHighVal.decision === 'ESCALATE', 'Supervisor ESCALATES when order amount exceeds autonomous limit');

  // 6. Test Pause and Emergency Stop Controls
  console.log('\n--- Test 6: Verify Emergency Stop & Pause Behavior ---');
  supervisorAgent.updateAutonomySettings({ paused: true }, { name: 'Admin' });
  const evalPaused = await supervisorAgent.evaluateApprovalRequest('appr-002');
  assert(evalPaused.decision === 'ESCALATE', 'When autonomous approvals are PAUSED, requests ESCALATE to human review');

  // Resume
  supervisorAgent.updateAutonomySettings({ paused: false, enabled: true, autonomous_approvals_enabled: true }, { name: 'Admin' });

  // 7. Test End-to-End Orchestrator Autonomous Approval Workflow
  console.log('\n--- Test 7: End-to-End Autonomous Approval Workflow Execution ---');
  // Create fresh ticket for Elena Rostova with damaged headphones
  const freshTicket = db.insert('tickets', {
    id: `tkt-auto-${Date.now()}`,
    customer_id: 'cust-101',
    order_id: 'ORD-4821',
    title: 'My Astra headphones headband snapped upon unboxing',
    description: 'The shipping box arrived crushed and the left ear cup hinge is broken. Need replacement.',
    status: 'OPEN',
    priority: 'high',
    category: 'damaged_product'
  });

  console.log(`Launching orchestrator workflow for fresh ticket #${freshTicket.id}...`);
  const workflowResult = await orchestratorAgent.runWorkflow({ ticketId: freshTicket.id });
  console.log('Workflow Execution Status:', workflowResult.status);

  assert(workflowResult.status === 'RESOLVED', 'Ticket was resolved autonomously without human intervention');

  const resolvedTicket = db.findById('tickets', freshTicket.id);
  assert(resolvedTicket.status === 'RESOLVED', 'Ticket status updated to RESOLVED in database');
  assert(resolvedTicket.customer_response !== null, 'Customer response was formulated and stored');

  const runs = db.find('agent_runs', r => r.ticket_id === freshTicket.id);
  assert(runs.length > 0 && runs[0].status === 'COMPLETED', 'Agent run completed successfully');

  // Check audit trail for autonomous approval event
  const audits = db.find('audit_logs', a => a.ticket_id === freshTicket.id);
  const autoApprovalAudit = audits.find(a => a.event_type === 'SUPERVISOR_AUTONOMOUS_APPROVAL');
  assert(autoApprovalAudit !== undefined, 'Audit trail contains SUPERVISOR_AUTONOMOUS_APPROVAL event');

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(0)}%)`);
  console.log('===============================================================\n');

  if (passed === total) {
    console.log('🎉 ALL AUTONOMOUS APPROVAL & REJECTION ACCEPTANCE CRITERIA SATISFIED!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

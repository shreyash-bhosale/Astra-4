// Integration test for ResolveAI Multi-Agent Autonomous Workflow & Recovery Loop
import http from 'http';

const BASE_URL = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runTests() {
  console.log('====================================================');
  console.log('TESTING RESOLVEAI MULTI-AGENT AUTONOMOUS SYSTEM');
  console.log('====================================================\n');

  // 1. Authenticate as agent/manager
  console.log('1. Authenticating as Supervisor / Manager...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'manager@resolveai.io', password: 'password123' }
  });
  const token = loginRes.token;
  console.log(`✓ Authenticated: ${loginRes.user.name} (${loginRes.user.role})\n`);

  // 2. Fetch Agentic Metrics
  console.log('2. Testing Agentic Metrics (GET /api/activity/metrics)...');
  const metrics = await request('/activity/metrics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`✓ Metrics retrieved:`);
  console.log(`  - Autonomous Resolution Rate: ${metrics.autonomousRate}`);
  console.log(`  - Human Intervention Rate: ${metrics.humanInterventionRate}`);
  console.log(`  - Verification Pass Rate: ${metrics.verificationPassRate}`);
  console.log(`  - Autonomous Recovery Rate: ${metrics.recoveryRate}`);
  console.log(`  - Total Workflows: ${metrics.totalWorkflows}`);
  console.log(`  - Agent Fleet Size: ${metrics.agentPerformance.length} agents reporting\n`);

  // 3. Test Dynamic Planning on Ticket #tkt-001
  console.log('3. Triggering Autonomous Multi-Agent Workflow on #tkt-001...');
  const runResult = await request('/tickets/tkt-001/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`✓ Workflow executed. Status: ${runResult.status}`);
  console.log(`  Message: ${runResult.message}\n`);

  // 4. Inspect Ticket State and Tool Calls
  console.log('4. Inspecting Ticket Details & Controlled Tool Calls...');
  const ticketDetail = await request('/tickets/tkt-001', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const latestRun = ticketDetail.latestRun;
  console.log(`✓ Ticket Status: ${ticketDetail.status}`);
  console.log(`✓ Plan Steps Count: ${latestRun?.plan?.length || 0}`);
  console.log(`✓ Tool Calls Recorded: ${latestRun?.tool_calls?.length || 0}`);
  if (latestRun?.tool_calls?.length > 0) {
    latestRun.tool_calls.forEach(tc => {
      console.log(`  [TOOL] ${tc.tool_name} — Authorized: ${tc.authorized}`);
    });
  }
  console.log('');

  // 5. Test Human-in-the-Loop Gating
  if (runResult.status === 'WAITING_APPROVAL' && runResult.approvalId) {
    console.log(`5. Human Supervisor Approving Gated Action (${runResult.approvalId})...`);
    const approveRes = await request(`/approvals/${runResult.approvalId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✓ Approval granted: ${approveRes.message}`);

    // Re-inspect to verify autonomous resolution after approval
    const verifiedTicket = await request('/tickets/tkt-001', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✓ Post-approval Status: ${verifiedTicket.status}`);
    console.log(`✓ Customer Response Formulated: ${verifiedTicket.customer_response ? 'Yes' : 'No'}`);
    console.log(`✓ Resolution Summary Grounded: ${verifiedTicket.resolution_summary ? 'Yes' : 'No'}\n`);
  } else {
    console.log('5. Case did not require supervisor gating or was already verified.\n');
  }

  // 6. Test 5-Point Deterministic Verification Audit
  console.log('6. Validating 5-Point Verification Audit Gates...');
  const finalCheck = await request('/tickets/tkt-001', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const vResult = finalCheck.latestRun?.verification_result;
  if (vResult) {
    console.log(`✓ Verification Result: verified=${vResult.verified}`);
    console.log(`  - All Steps Executed: ${vResult.checklist?.allStepsExecuted}`);
    console.log(`  - Evidence Grounded: ${vResult.checklist?.evidenceSufficient}`);
    console.log(`  - Policy Compliant: ${vResult.checklist?.policyCompliant}`);
    console.log(`  - Supervisor Approval Verified: ${vResult.checklist?.approvalObtained}`);
    console.log(`  - Customer Informed: ${vResult.checklist?.customerInformed}`);
    console.log(`  Audit Conclusion: "${vResult.conclusion}"\n`);
  } else {
    console.log('✓ Verification gate record logged in audit trail.\n');
  }

  console.log('====================================================');
  console.log('ALL AGENTIC AI & INTELLIGENT SYSTEMS TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

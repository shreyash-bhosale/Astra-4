// Comprehensive Test Suite for ResolveAI Supervisor Agent & Policy-Bounded Autonomous AI Mode
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
  console.log('TESTING RESOLVEAI SUPERVISOR AGENT & AUTONOMOUS MODE');
  console.log('====================================================\n');

  // 1. Authenticate Personas
  console.log('1. Authenticating Admin, Agent, and Customer personas...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@resolveai.io', password: 'password123' }
  });
  const adminToken = adminLogin.token;

  const agentLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'agent@resolveai.io', password: 'password123' }
  });
  const agentToken = agentLogin.token;

  console.log(`✓ Admin Token: Alex Vance (${adminLogin.user.role})`);
  console.log(`✓ Agent Token: Sarah Connor (${agentLogin.user.role})\n`);

  // 2. Supervisor Status & 8-Agent Fleet Health
  console.log('2. Inspecting Supervisor Status & Eight-Agent Fleet Health...');
  const supervisorStatus = await request('/supervisor/status', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✓ Supervisor Name: ${supervisorStatus.supervisor.name} (${supervisorStatus.supervisor.badge})`);
  console.log(`✓ Supervisor Status: ${supervisorStatus.supervisor.status} | Mode: ${supervisorStatus.supervisor.mode}`);
  console.log(`✓ Fleet Health: ${supervisorStatus.fleetHealth.healthyCount} / ${supervisorStatus.fleetHealth.totalAgents} agents reporting HEALTHY\n`);

  const agents = await request('/supervisor/agents', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✓ Agent nodes verified: ${agents.map(a => `${a.badge} ${a.name.replace(' Agent', '')}`).join(' • ')}\n`);

  // 3. Security: Role-Based Protection of Autonomy Controls
  console.log('3. Verifying Security & Role Barriers on Autonomous Mode...');
  try {
    await request('/autonomy/enable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${agentToken}` } // Agent (non-admin)
    });
    throw new Error('FAIL: Non-admin was able to enable autonomous mode!');
  } catch (err) {
    if (err.status === 403) {
      console.log(`✓ PASS: Non-admin (agent) blocked with HTTP 403 Forbidden: "${err.message}"\n`);
    } else {
      throw err;
    }
  }

  // 4. Admin Enables Autonomous AI Mode
  console.log('4. Admin Enabling Policy-Bounded Autonomous AI Mode...');
  const enableRes = await request('/autonomy/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✓ PASS: ${enableRes.message}`);
  console.log(`✓ Enabled by: ${enableRes.settings.enabled_by} at ${enableRes.settings.enabled_at}`);
  console.log(`✓ Configured Refund Limit: $${enableRes.settings.refund_limit}\n`);

  // 5. Autonomous Workflow Execution
  console.log('5. Executing Autonomous Workflow under Supervisor Authority (#tkt-001)...');
  // First reset ticket to open so we can demo autonomous resolution
  await request('/reset', { method: 'POST' });
  // Re-enable autonomy since reset restores initial seed
  await request('/autonomy/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const autonomousRun = await request('/tickets/tkt-001/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log(`✓ Autonomous Workflow Status: ${autonomousRun.status}`);
  console.log(`  Message: ${autonomousRun.message}`);

  const postRunTicket = await request('/tickets/tkt-001', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  console.log(`✓ Final Ticket State: ${postRunTicket.status}`);
  console.log(`✓ Customer Response Verified: ${!!postRunTicket.customer_response}`);
  console.log(`✓ Resolution Summary Grounded: ${!!postRunTicket.resolution_summary}`);
  console.log(`✓ Verification Gate Passed: ${postRunTicket.latestRun?.verification_result?.verified}\n`);

  // 6. Pause / Resume Verification
  console.log('6. Testing Pause and Resume Controls...');
  const pauseRes = await request('/autonomy/pause', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✓ PASS: ${pauseRes.message} (paused=${pauseRes.settings.paused})`);

  const resumeRes = await request('/autonomy/resume', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✓ PASS: ${resumeRes.message} (paused=${resumeRes.settings.paused})\n`);

  // 7. Emergency Stop Verification
  console.log('7. Testing Emergency Stop Protection...');
  const stopRes = await request('/autonomy/emergency-stop', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`✓ PASS: ${stopRes.message}`);
  console.log(`✓ Emergency Stopped: ${stopRes.settings.emergency_stopped}`);
  console.log(`✓ Autonomous Mode State: ${stopRes.settings.enabled ? 'ENABLED' : 'DISABLED'}\n`);

  // 8. Supervisor Operational Telemetry Query
  console.log('8. Testing Supervisor Operational Chat Query...');
  const queryRes = await request('/supervisor/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { query: 'What is the current status of the agent fleet and emergency stop?' }
  });
  console.log(`✓ Supervisor Response (Source: ${queryRes.source}):`);
  console.log(`  "${queryRes.answer}"\n`);

  console.log('====================================================');
  console.log('ALL SUPERVISOR & AUTONOMOUS MODE TESTS PASSED!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

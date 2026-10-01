import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import { app } from './src/server.js';

async function testWorkflowEmailDispatch() {
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

  console.log(`Testing End-to-End Autonomous Email Flow in Orchestrator on ${base}...\n`);

  try {
    const token = jwt.sign(
      { id: 'usr-manager-01', email: 'manager@resolveai.io', role: 'manager' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

  // 1. Create a fresh ticket for Elena Rostova
  console.log('1. Creating fresh test ticket for customer elena.rostova@acmecorp.com...');
  const createRes = await fetch(`${base}/api/tickets`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Astra ANC Headset crackling noise during flights',
      description: 'Customer reports hardware distortion in left ear cup after 10 days of purchase.',
      customer_id: 'cust-101',
      order_id: 'ord-201',
      priority: 'high'
    })
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create ticket: ${err}`);
  }
  const ticket = await createRes.json();
  console.log(`✓ Ticket created: #${ticket.id}`);

  // 2. Trigger Autonomous Orchestrator Run
  console.log(`\n2. Triggering autonomous agent execution for Ticket #${ticket.id}...`);
  const runRes = await fetch(`${base}/api/tickets/${ticket.id}/run`, {
    method: 'POST',
    headers: authHeaders
  });
  const runResult = await runRes.json();
  console.log(`✓ Orchestrator run status: ${runResult.status}`);

  // 3. Inspect Dispatched Emails
  console.log(`\n3. Inspecting email notifications dispatched for Ticket #${ticket.id}...`);
  const emailsRes = await fetch(`${base}/api/tickets/${ticket.id}/emails`, {
    headers: authHeaders
  });
  if (!emailsRes.ok) {
    const errText = await emailsRes.text();
    throw new Error(`GET /emails returned HTTP ${emailsRes.status}: ${errText}`);
  }
  const emails = await emailsRes.json();
  console.log(`✓ Dispatched ${emails.length} total notifications:`);
  emails.forEach(e => {
    console.log(`   - [${e.status}] ${e.event_type} -> To: ${e.recipient} | MsgID: ${e.provider_message_id}`);
  });

  if (emails.length === 0) {
    throw new Error('Expected at least 1 automated email notification to be dispatched!');
  }

  // 4. If waiting approval, authorize it and check subsequent emails
  if (runResult.status === 'WAITING_APPROVAL' && runResult.pendingApproval) {
    console.log(`\n4. Authorizing pending approval gate #${runResult.pendingApproval.id}...`);
    const apprRes = await fetch(`${base}/api/approvals/${runResult.pendingApproval.id}/approve`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ notes: 'Authorized replacement per warranty compliance.' })
    });
    const apprResult = await apprRes.json();
    console.log(`✓ Approval authorized! Workflow status: ${apprResult.workflowStatus?.status}`);

    const finalEmailsRes = await fetch(`${base}/api/tickets/${ticket.id}/emails`, {
      headers: authHeaders
    });
    const finalEmails = await finalEmailsRes.json();
    console.log(`✓ Post-approval total notifications: ${finalEmails.length}`);
    finalEmails.forEach(e => {
      console.log(`   - [${e.status}] ${e.event_type} -> To: ${e.recipient} | MsgID: ${e.provider_message_id}`);
    });
  }

  console.log('\n====================================================');
  console.log('ORCHESTRATOR AUTONOMOUS EMAIL DISPATCH VERIFIED!');
  console.log('====================================================');
  } finally {
    if (server) {
      server.close();
    }
  }
}

testWorkflowEmailDispatch().catch(err => {
  console.error('Workflow email test failed:', err);
  process.exit(1);
});

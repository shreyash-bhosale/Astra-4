const BASE_URL = 'http://localhost:5001/api';

async function runAudit() {
  console.log('\n======================================================');
  console.log('🚀 RESOLVEAI FULL SYSTEM AUDIT & VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - ${details}`);
      failed++;
    }
  };

  // 1. Authenticate as Admin
  console.log('--- Phase 1: Authentication & RBAC ---');
  let adminToken = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@resolveai.io', password: 'password123' })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(Boolean(adminToken), 'Admin login successful', `Received token: ${Boolean(adminToken)}`);
    assert(data.user.role === 'admin', 'Admin role verified', `Role: ${data.user.role}`);
  } catch (err) {
    assert(false, 'Admin login failed', err.message);
  }

  // 2. Authenticate as Customer
  let customerToken = '';
  let customerUser = null;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@resolveai.io', password: 'password123' })
    });
    const data = await res.json();
    customerToken = data.token;
    customerUser = data.user;
    assert(Boolean(customerToken), 'Customer login successful', `Received token: ${Boolean(customerToken)}`);
    assert(data.user.role === 'customer', 'Customer role verified', `Role: ${data.user.role}`);
  } catch (err) {
    assert(false, 'Customer login failed', err.message);
  }

  // 3. BUG 01: Policy Creation & Persistence
  console.log('\n--- Phase 2: BUG 01 Policy Creation & Persistence ---');
  let createdPolicyId = '';
  try {
    const createRes = await fetch(`${BASE_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Expedited Express Freight Policy',
        category: 'damaged_product',
        content: 'Express courier replacements are authorized for priority commercial customers within 14 days of dispatch.',
        active: true
      })
    });
    const policyData = await createRes.json();
    createdPolicyId = policyData.id;
    assert(createRes.status === 201 && policyData.id && policyData.id.startsWith('POL-'), 'Policy creation succeeds with formatted POL-xxx ID', `ID: ${policyData.id}`);

    // Verify persistence via GET /policies
    const listRes = await fetch(`${BASE_URL}/policies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const list = await listRes.json();
    const found = list.find(p => p.id === createdPolicyId);
    assert(Boolean(found), 'Newly created policy persists in policies list', `Found: ${Boolean(found)}`);

    // Validation failure test
    const invalidRes = await fetch(`${BASE_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'AB', // too short
        category: 'c',
        content: 'short' // too short
      })
    });
    assert(invalidRes.status === 400, 'Invalid policy rejected with 400 Bad Request', `Status: ${invalidRes.status}`);
  } catch (err) {
    assert(false, 'Policy test failed', err.message);
  }

  // 4. BUG 02 & BUG 06: Supervisor Telemetry & Context-Aware Chat
  console.log('\n--- Phase 3: BUG 02 & BUG 06 Supervisor AI Telemetry ---');
  try {
    // General fleet query
    const q1Res = await fetch(`${BASE_URL}/supervisor/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ query: 'What is the current autonomous mode status and refund limit?' })
    });
    const q1Data = await q1Res.json();
    assert(Boolean(q1Data.answer) && q1Data.answer.length > 20, 'Supervisor answers autonomous mode telemetry query', q1Data.answer);

    // Specific ticket query (e.g. ticket #1)
    const tktListRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tickets = await tktListRes.json();
    const sampleTkt = tickets[0];

    const q2Res = await fetch(`${BASE_URL}/supervisor/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ query: `What is happening with ticket ${sampleTkt.id}?` })
    });
    const q2Data = await q2Res.json();
    assert(Boolean(q2Data.answer) && q2Data.answer.toLowerCase().includes(sampleTkt.id.slice(0, 6).toLowerCase()), 'Supervisor inspects specific ticket contextually', q2Data.answer);
  } catch (err) {
    assert(false, 'Supervisor telemetry query failed', err.message);
  }

  // 5. BUG 11: Customer Orders Count and Spend Aggregation
  console.log('\n--- Phase 4: BUG 11 Customer Orders & Spend Aggregation ---');
  try {
    const custRes = await fetch(`${BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const custData = await custRes.json();
    assert(Array.isArray(custData) && custData.length > 0, 'Customers list retrieved', `Count: ${custData.length}`);

    // Check Elena Rostova (cust-101) who has Order ORD-4821 ($349)
    const elena = custData.find(c => c.id === 'cust-101' || c.email.includes('elena'));
    assert(Boolean(elena), 'Found sample customer record (Elena Rostova)');
    if (elena) {
      assert(elena.ordersCount >= 1, `Customer ordersCount correctly calculated: ${elena.ordersCount}`, `Expected >= 1, got ${elena.ordersCount}`);
      assert(elena.totalSpent >= 349, `Customer totalSpent correctly aggregated: $${elena.totalSpent}`, `Expected >= 349, got ${elena.totalSpent}`);
    }
  } catch (err) {
    assert(false, 'Customer aggregation failed', err.message);
  }

  // 6. BUG 08: Internal Notes Saving & Persistence
  console.log('\n--- Phase 5: BUG 08 Internal Notes Persistence ---');
  try {
    const tktListRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tickets = await tktListRes.json();
    const testTicket = tickets[0];

    const noteText1 = `Audit verification note: RMA package confirmed at warehouse - ${Date.now()}`;
    const addRes1 = await fetch(`${BASE_URL}/tickets/${testTicket.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ note: noteText1 })
    });
    const addData1 = await addRes1.json();
    assert(addData1.success === true && Array.isArray(addData1.notes), 'Internal note 1 added successfully');

    // Add note 2
    const noteText2 = `Second private internal note: Carrier tracking synced - ${Date.now()}`;
    const addRes2 = await fetch(`${BASE_URL}/tickets/${testTicket.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ note: noteText2 })
    });
    const addData2 = await addRes2.json();
    assert(addData2.notes.length >= 2, 'Multiple internal notes persist distinctly without overwriting');

    // Empty note validation
    const emptyRes = await fetch(`${BASE_URL}/tickets/${testTicket.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ note: '   ' })
    });
    assert(emptyRes.status === 400, 'Empty/whitespace internal note rejected with 400', `Status: ${emptyRes.status}`);
  } catch (err) {
    assert(false, 'Internal notes test failed', err.message);
  }

  // 7. BUG 10: Central Execution Guard (Pause / Emergency Stop Enforcement)
  console.log('\n--- Phase 6: BUG 10 Execution Control Plane (Pause / Stop Enforcement) ---');
  try {
    const tktListRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tickets = await tktListRes.json();
    const testTicket = tickets[0];

    // Trigger Pause
    await fetch(`${BASE_URL}/autonomy/pause`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Attempt workflow run while paused
    const pausedRunRes = await fetch(`${BASE_URL}/tickets/${testTicket.id}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(pausedRunRes.status === 403, 'Execution blocked when Autonomous AI is PAUSED', `Status: ${pausedRunRes.status}`);

    // Trigger Emergency Stop
    await fetch(`${BASE_URL}/autonomy/emergency-stop`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Attempt workflow run while emergency stopped
    const stopRunRes = await fetch(`${BASE_URL}/tickets/${testTicket.id}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(stopRunRes.status === 403, 'Execution blocked when EMERGENCY STOP is engaged', `Status: ${stopRunRes.status}`);

    // Resume / Re-enable
    const enableRes = await fetch(`${BASE_URL}/autonomy/enable`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const enableData = await enableRes.json();
    assert(enableData.settings.enabled === true && !enableData.settings.paused && !enableData.settings.emergency_stopped, 'Autonomous AI Mode restored cleanly');
  } catch (err) {
    assert(false, 'Execution control plane test failed', err.message);
  }

  // 8. BUG 05 & BUG 07: Customer Portal Multiple Issues & Order Linking
  console.log('\n--- Phase 7: BUG 05 & BUG 07 Customer Portal Issues & Orders ---');
  try {
    // 8a. Customer orders
    const ordRes = await fetch(`${BASE_URL}/customer/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const orders = await ordRes.json();
    assert(Array.isArray(orders), 'Customer can view own orders list', `Orders count: ${orders.length}`);

    const linkedOrderId = orders.length > 0 ? orders[0].id : null;

    // 8b. Create First Issue
    const issue1Res = await fetch(`${BASE_URL}/customer/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        title: `Test Issue 1 - Damaged Packaging ${Date.now()}`,
        description: 'Outer carton was crushed and headband hinge arrived loose.',
        category: 'damaged_product',
        order_id: linkedOrderId
      })
    });
    const issue1Data = await issue1Res.json();
    assert(issue1Res.status === 201 && issue1Data.ticket?.id, 'Customer successfully created Issue 1', `ID: ${issue1Data.ticket?.id}`);

    // 8c. Create Second Issue (verifying multiple issues allowed without lock)
    const issue2Res = await fetch(`${BASE_URL}/customer/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        title: `Test Issue 2 - Missing Audio Jack Cable ${Date.now()}`,
        description: 'The 3.5mm braided aux cable was missing from the accessory pouch.',
        category: 'missing_item',
        order_id: linkedOrderId
      })
    });
    const issue2Data = await issue2Res.json();
    assert(issue2Res.status === 201 && issue2Data.ticket?.id, 'Customer successfully created Issue 2 (Multiple issues permitted)', `ID: ${issue2Data.ticket?.id}`);
  } catch (err) {
    assert(false, 'Customer multiple issues test failed', err.message);
  }

  // 9. Customer Data Isolation & Privacy
  console.log('\n--- Phase 8: Security & Customer Isolation ---');
  try {
    // Create another customer
    const otherCustRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Attacker User',
        email: `attacker-${Date.now()}@test.io`,
        password: 'password123'
      })
    });
    const otherCustData = await otherCustRes.json();

    // Login as attacker
    const attackerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: otherCustData.user.email,
        password: 'password123'
      })
    });
    const attackerToken = (await attackerLoginRes.json()).token;

    // Attacker attempts to view Customer A's tickets
    const tktListRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allTickets = await tktListRes.json();
    const victimTicket = allTickets.find(t => t.customer_id === customerUser.id || t.customer_id === 'cust-101');

    if (victimTicket) {
      const probeRes = await fetch(`${BASE_URL}/customer/tickets/${victimTicket.id}`, {
        headers: { Authorization: `Bearer ${attackerToken}` }
      });
      assert(probeRes.status === 403, 'Customer data isolation verified: Unauthorized ticket access returns 403 Forbidden', `Status: ${probeRes.status}`);
    }
  } catch (err) {
    assert(false, 'Customer data isolation test failed', err.message);
  }

  console.log('\n======================================================');
  console.log(`📊 AUDIT RESULTS SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();

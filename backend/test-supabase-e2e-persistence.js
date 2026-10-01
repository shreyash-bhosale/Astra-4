import { createServer } from 'http';
import app from './src/server.js';
import { getSupabaseClient } from './src/db/supabaseClient.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';

async function run() {
  console.log('========================================================');
  console.log('STARTING SUPABASE & BACKEND E2E PERSISTENCE VERIFICATION');
  console.log('========================================================');

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client failed to initialize');
  }

  const server = createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`✓ Test backend server running on ${baseUrl}`);

  const adminToken = jwt.sign(
    { id: 'usr-admin-01', email: 'admin@resolveai.io', role: 'admin', name: 'Alex Vance' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Policy Create -> Supabase Verify -> Refresh Read
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Policy End-to-End Write & Supabase Persistence ---');
    const policyPayload = {
      title: `E2E Verified Policy ${timestamp}`,
      category: 'Warranty & Claims',
      content: 'Automated test policy asserting full write-through persistence to Supabase PostgreSQL.',
      active: true
    };

    const polRes = await fetch(`${baseUrl}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(policyPayload)
    });

    if (polRes.status !== 201) {
      throw new Error(`Policy creation failed with status ${polRes.status}: ${await polRes.text()}`);
    }

    const createdPolicy = await polRes.json();
    console.log(`✓ Backend returned HTTP 201: Policy ID = ${createdPolicy.id}`);

    // Verify directly in Supabase PostgreSQL
    const { data: supaPolicy, error: spErr } = await supabase
      .from('policies')
      .select('*')
      .eq('id', createdPolicy.id)
      .single();

    if (spErr || !supaPolicy) {
      throw new Error(`Policy NOT found in Supabase PostgreSQL: ${spErr?.message}`);
    }
    console.log(`✓ Confirmed in Supabase PostgreSQL: "${supaPolicy.title}" (active = ${supaPolicy.active})`);

    // Verify Read-After-Write (Page Refresh Simulation)
    const listRes = await fetch(`${baseUrl}/policies`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const allPolicies = await listRes.json();
    const foundInList = allPolicies.some(p => p.id === createdPolicy.id);
    if (!foundInList) {
      throw new Error('Newly created policy did not appear in refreshed GET /api/policies');
    }
    console.log(`✓ Read-after-write confirmed: Policy returned from fresh GET /api/policies`);

    // ----------------------------------------------------
    // TEST 2: Ticket Create -> Supabase Verify -> Refresh Read
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Ticket End-to-End Write & Supabase Persistence ---');
    const ticketPayload = {
      title: `E2E Ticket ${timestamp}`,
      description: 'Customer ticket write-through test validating persistence in PostgreSQL.',
      priority: 'high',
      category: 'damaged_product'
    };

    const tktRes = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(ticketPayload)
    });

    if (tktRes.status !== 201) {
      throw new Error(`Ticket creation failed with status ${tktRes.status}: ${await tktRes.text()}`);
    }

    const createdTicket = await tktRes.json();
    console.log(`✓ Backend returned HTTP 201: Ticket ID = ${createdTicket.id}`);

    // Verify directly in Supabase PostgreSQL
    const { data: supaTicket, error: stErr } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', createdTicket.id)
      .single();

    if (stErr || !supaTicket) {
      throw new Error(`Ticket NOT found in Supabase PostgreSQL: ${stErr?.message}`);
    }
    console.log(`✓ Confirmed in Supabase PostgreSQL: "${supaTicket.title}" (status = ${supaTicket.status})`);

    // Verify Read-After-Write (Page Refresh Simulation)
    const ticketsListRes = await fetch(`${baseUrl}/tickets`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const allTickets = await ticketsListRes.json();
    const foundTicket = allTickets.some(t => t.id === createdTicket.id);
    if (!foundTicket) {
      throw new Error('Newly created ticket did not appear in refreshed GET /api/tickets');
    }
    console.log(`✓ Read-after-write confirmed: Ticket returned from fresh GET /api/tickets`);

    // ----------------------------------------------------
    // TEST 3: Autonomy State Update & PostgreSQL Persistence
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Autonomy State Update & PostgreSQL Persistence ---');
    const pauseRes = await fetch(`${baseUrl}/autonomy/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (pauseRes.status !== 200) {
      throw new Error(`Pause failed with HTTP ${pauseRes.status}`);
    }
    const pauseData = await pauseRes.json();
    console.log(`✓ Autonomy execution paused: paused = ${pauseData.settings.paused}`);

    // Read back after refresh
    const getAutonomyRes = await fetch(`${baseUrl}/autonomy/settings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const refreshedAutonomy = await getAutonomyRes.json();
    if (refreshedAutonomy.paused !== true) {
      throw new Error(`Expected autonomy.paused to be true, got ${refreshedAutonomy.paused}`);
    }
    console.log(`✓ Read-after-write confirmed: GET /api/autonomy/settings returned paused = true`);

    // Resume autonomy
    const resumeRes = await fetch(`${baseUrl}/autonomy/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const resumeData = await resumeRes.json();
    console.log(`✓ Autonomy resumed: paused = ${resumeData.settings.paused}`);

    // ----------------------------------------------------
    // CLEANUP TEST RECORDS
    // ----------------------------------------------------
    console.log('\n--- CLEANING UP TEST ARTIFACTS ---');
    await supabase.from('policies').delete().eq('id', createdPolicy.id);
    await supabase.from('tickets').delete().eq('id', createdTicket.id);
    console.log('✓ Test policy and test ticket removed from Supabase');

    console.log('\n========================================================');
    console.log('ALL SUPABASE E2E PERSISTENCE TESTS PASSED 100%!');
    console.log('========================================================\n');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

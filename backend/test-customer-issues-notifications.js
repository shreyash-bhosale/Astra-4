import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import { db } from './src/db/store.js';

async function runCustomerIssuesAndNotificationsTest() {
  console.log('================================================================');
  console.log('TEST: RESOLVEAI CUSTOMER ISSUES PERSISTENCE & NOTIFICATIONS');
  console.log('================================================================\n');

  // Wait for database store to be ready
  await db.ready();

  const base = 'http://localhost:5001';

  // Seed / ensure customer A and customer B exist
  const customerA = db.find('customers', c => c.email === 'customer@resolveai.io')[0] || db.insert('customers', {
    id: 'cust-test-a',
    name: 'Elena Rostova',
    email: 'customer@resolveai.io',
    user_id: 'usr-customer-01',
    tier: 'Premium',
    created_at: new Date().toISOString()
  });

  const customerB = db.find('customers', c => c.email === 'intruder@othercompany.com')[0] || db.insert('customers', {
    id: 'cust-test-b',
    name: 'Intruder Bob',
    email: 'intruder@othercompany.com',
    user_id: 'usr-customer-02',
    tier: 'Standard',
    created_at: new Date().toISOString()
  });

  // Use seeded order for Customer A
  let orderA = db.findById('orders', 'ORD-4821') || db.find('orders', o => o.customer_id === customerA.id)[0];
  if (!orderA) {
    orderA = db.insert('orders', {
      id: 'ORD-4821',
      customer_id: customerA.id,
      product_name: 'SoundPro ANC-X9 Headphones',
      amount: 349.99,
      status: 'DELIVERED',
      created_at: new Date().toISOString()
    });
  }

  // Use seeded order for Customer B (Marcus Vance cust-102)
  let orderB = db.findById('orders', 'ORD-5190') || db.find('orders', o => o.customer_id !== customerA.id)[0];
  if (!orderB) {
    orderB = db.insert('orders', {
      id: 'ORD-5190',
      customer_id: customerB.id,
      product_name: 'Titanium Tactile Keyboard',
      amount: 229.00,
      status: 'DELIVERED',
      created_at: new Date().toISOString()
    });
  }

  // Issue tokens
  const tokenA = jwt.sign(
    { id: customerA.user_id || 'usr-customer-01', email: customerA.email, name: customerA.name, role: 'customer' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const headersA = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenA}`
  };

  const tokenB = jwt.sign(
    { id: customerB.user_id || 'usr-customer-02', email: customerB.email, name: customerB.name, role: 'customer' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const headersB = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenB}`
  };

  // TEST 1: Prevent Order Spoofing (Customer A tries to attach Customer B's order)
  console.log('TEST 1: Security - Reject issue creation with another customer\'s order');
  const spoofRes = await fetch(`${base}/api/issues`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      title: 'Attempting to claim refund on someone else order',
      description: 'I am trying to use another customer order id.',
      order_id: orderB.id
    })
  });

  if (spoofRes.status === 403) {
    console.log('✓ PASS: Rejected with HTTP 403 Forbidden as expected.');
  } else {
    throw new Error(`Expected HTTP 403 Forbidden, got ${spoofRes.status}`);
  }

  // TEST 2: Create Issue via POST /api/issues with valid order
  console.log('\nTEST 2: Create Issue via POST /api/issues with valid order');
  const createRes = await fetch(`${base}/api/issues`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      title: 'SoundPro ANC Hinge Crack Issue',
      description: 'The right hinge developed a stress fracture after regular folding.',
      category: 'damaged_product',
      order_id: orderA.id
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`POST /api/issues failed (${createRes.status}): ${errText}`);
  }

  const createdData = await createRes.json();
  if (!createdData.success || !createdData.ticket?.id) {
    throw new Error(`Invalid response structure: ${JSON.stringify(createdData)}`);
  }
  const ticketA = createdData.ticket;
  console.log(`✓ PASS: Ticket #${ticketA.id} created successfully with status ${ticketA.status}`);
  console.log(`  Title: ${ticketA.title}`);
  console.log(`  Order Attached: ${ticketA.orderId || ticketA.order_id}`);

  // TEST 3: Retrieve Issues via GET /api/issues and GET /api/customer/tickets
  console.log('\nTEST 3: Retrieve Issues via GET /api/issues (Session-Derived Identity)');
  const getIssuesRes = await fetch(`${base}/api/issues`, { headers: headersA });
  if (!getIssuesRes.ok) throw new Error(`GET /api/issues failed: ${getIssuesRes.status}`);
  const issuesList = await getIssuesRes.json();

  if (!Array.isArray(issuesList) || issuesList.length === 0) {
    throw new Error('Expected non-empty array of issues');
  }

  const foundCreated = issuesList.find(t => t.id === ticketA.id);
  if (!foundCreated) {
    throw new Error(`Created ticket #${ticketA.id} not found in customer issues list!`);
  }
  console.log(`✓ PASS: Found ticket #${foundCreated.id} in issues list.`);
  console.log(`  Customer-safe status: ${JSON.stringify(foundCreated.customerSafeStatus)}`);
  console.log(`  Order data: ${JSON.stringify(foundCreated.order)}`);

  // TEST 4: Customer Isolation - Customer B cannot see Customer A's issue
  console.log('\nTEST 4: Customer Isolation - Customer B cannot see Customer A\'s issues');
  const issuesBRes = await fetch(`${base}/api/issues`, { headers: headersB });
  const issuesListB = await issuesBRes.json();
  const leakedTicket = issuesListB.find(t => t.id === ticketA.id);
  if (leakedTicket) {
    throw new Error(`SECURITY BREACH: Customer B can see Customer A ticket #${ticketA.id}!`);
  }
  console.log('✓ PASS: Customer B cannot see Customer A\'s tickets.');

  // TEST 5: Notifications Panel - Fetch notifications for Customer A
  console.log('\nTEST 5: Notifications Panel - Fetch notifications for Customer A');
  const notifsRes = await fetch(`${base}/api/notifications`, { headers: headersA });
  if (!notifsRes.ok) throw new Error(`GET /api/notifications failed: ${notifsRes.status}`);
  const notifs = await notifsRes.json();

  console.log(`✓ PASS: Retrieved ${notifs.length} notifications for Customer A.`);
  const ticketNotif = notifs.find(n => n.ticketId === ticketA.id || n.ticket_id === ticketA.id);
  if (!ticketNotif) {
    throw new Error(`Notification for ticket #${ticketA.id} was not generated!`);
  }
  console.log(`  Notification found: "${ticketNotif.subject || ticketNotif.title}" (Read: ${ticketNotif.read})`);

  // TEST 6: Mark Single Notification Read via PATCH /api/notifications/:id/read
  console.log(`\nTEST 6: Mark Notification Read via PATCH /api/notifications/${ticketNotif.id}/read`);
  const markReadRes = await fetch(`${base}/api/notifications/${ticketNotif.id}/read`, {
    method: 'PATCH',
    headers: headersA
  });
  if (!markReadRes.ok) throw new Error(`PATCH /api/notifications/:id/read failed: ${markReadRes.status}`);
  const markReadData = await markReadRes.json();
  console.log(`✓ PASS: Notification marked read: ${markReadData.notification?.id} (is_read: ${markReadData.notification?.read})`);

  // TEST 7: Mark All Notifications Read via POST /api/notifications/mark-all-read
  console.log('\nTEST 7: Mark All Notifications Read');
  const markAllRes = await fetch(`${base}/api/notifications/mark-all-read`, {
    method: 'POST',
    headers: headersA
  });
  if (!markAllRes.ok) throw new Error(`POST /api/notifications/mark-all-read failed: ${markAllRes.status}`);
  const markAllData = await markAllRes.json();
  console.log(`✓ PASS: ${markAllData.message}`);

  // Verify unread count is 0
  const refreshedNotifsRes = await fetch(`${base}/api/notifications`, { headers: headersA });
  const refreshedNotifs = await refreshedNotifsRes.json();
  const unreadCount = refreshedNotifs.filter(n => !n.read && !n.is_read).length;
  if (unreadCount !== 0) {
    throw new Error(`Expected 0 unread notifications, got ${unreadCount}`);
  }
  console.log('✓ PASS: Verified 0 unread notifications after mark-all-read.');

  console.log('\n================================================================');
  console.log('✅ ALL CUSTOMER PERSISTENCE, HISTORY & NOTIFICATION TESTS PASSED!');
  console.log('================================================================\n');
}

runCustomerIssuesAndNotificationsTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  });

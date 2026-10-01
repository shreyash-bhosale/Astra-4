import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';

async function testCustomerPortal() {
  console.log('====================================================');
  console.log('TESTING RESOLVEAI CUSTOMER PORTAL & MANAGER UPGRADE');
  console.log('====================================================\n');

  const base = 'http://localhost:5001';

  // Customer Token: Elena Rostova
  const customerToken = jwt.sign(
    { id: 'usr-customer-01', email: 'customer@resolveai.io', name: 'Elena Rostova', role: 'customer' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const custHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${customerToken}`
  };

  // Manager Token: James Rodriguez
  const managerToken = jwt.sign(
    { id: 'usr-manager-01', email: 'manager@resolveai.io', name: 'James Rodriguez', role: 'manager' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const mgrHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${managerToken}`
  };

  // 1. GET /api/customer/me
  console.log('1. GET /api/customer/me');
  const meRes = await fetch(`${base}/api/customer/me`, { headers: custHeaders });
  if (!meRes.ok) throw new Error(`GET /customer/me failed: ${meRes.status}`);
  const meData = await meRes.json();
  console.log(`✓ Customer profile resolved: ${meData.customer.name} (${meData.customer.email}) - Open tickets: ${meData.stats.openTickets}`);

  // 2. GET /api/customer/orders
  console.log('\n2. GET /api/customer/orders');
  const ordersRes = await fetch(`${base}/api/customer/orders`, { headers: custHeaders });
  const orders = await ordersRes.json();
  console.log(`✓ Fetched ${orders.length} customer orders.`);

  // 3. POST /api/customer/tickets (Raise an Issue)
  console.log('\n3. POST /api/customer/tickets (Raise an Issue from Portal)');
  const createTicketRes = await fetch(`${base}/api/customer/tickets`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      title: 'SoundPro Headband Cushion Separation',
      description: 'The leatherette stitching came loose after gentle daily use. Requesting replacement.',
      category: 'damaged_product',
      order_id: orders.length > 0 ? orders[0].id : null
    })
  });
  if (!createTicketRes.ok) {
    const errText = await createTicketRes.text();
    throw new Error(`Failed to create customer ticket: ${errText}`);
  }
  const createdTicketData = await createTicketRes.json();
  const newTicketId = createdTicketData.ticket.id;
  console.log(`✓ Ticket created: #${newTicketId} (Status: ${createdTicketData.ticket.customerSafeStatus.label})`);

  // 4. GET /api/customer/tickets
  console.log('\n4. GET /api/customer/tickets (Customer Issue History)');
  const ticketsRes = await fetch(`${base}/api/customer/tickets`, { headers: custHeaders });
  const tickets = await ticketsRes.json();
  console.log(`✓ Fetched ${tickets.length} tickets for customer. Latest: #${tickets[0].id}`);

  // 5. GET /api/customer/tickets/:id/timeline
  console.log(`\n5. GET /api/customer/tickets/${newTicketId}/timeline`);
  const timelineRes = await fetch(`${base}/api/customer/tickets/${newTicketId}/timeline`, { headers: custHeaders });
  const timeline = await timelineRes.json();
  console.log(`✓ Timeline has ${timeline.length} milestones. First: ${timeline[0].title}`);

  // 6. Cross-Customer Isolation Security Test
  console.log('\n6. Cross-Customer Data Isolation Test (Accessing Another Customer Ticket)');
  const intruderToken = jwt.sign(
    { id: 'usr-customer-intruder', email: 'intruder@othercompany.com', name: 'Intruder', role: 'customer' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
  const intruderRes = await fetch(`${base}/api/customer/tickets/${newTicketId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${intruderToken}`
    }
  });
  if (intruderRes.status === 403) {
    console.log('✓ PASS: Unauthorized customer was blocked with HTTP 403 Forbidden.');
  } else {
    throw new Error(`Expected HTTP 403 for cross-customer ticket access, got ${intruderRes.status}`);
  }

  // 7. POST /api/customer/chat (AI Customer Support Chat)
  console.log('\n7. POST /api/customer/chat (AI Customer Support Assistant)');
  const chatRes = await fetch(`${base}/api/customer/chat`, {
    method: 'POST',
    headers: custHeaders,
    body: JSON.stringify({
      message: 'What is the current status of my damaged headphones ticket?'
    })
  });
  const chatData = await chatRes.json();
  console.log(`✓ AI Support replied: "${chatData.reply.substring(0, 100)}..."`);
  console.log(`✓ Suggested Action Chips: ${chatData.suggestedActions?.join(' | ')}`);

  // 8. Manager Assignment: POST /api/tickets/:id/assign
  console.log(`\n8. POST /api/tickets/${newTicketId}/assign (Assign to Manager James Rodriguez)`);
  const assignRes = await fetch(`${base}/api/tickets/${newTicketId}/assign`, {
    method: 'POST',
    headers: mgrHeaders,
    body: JSON.stringify({ userId: 'usr-manager-01' })
  });
  const assignData = await assignRes.json();
  console.log(`✓ Ticket #${newTicketId} assigned to: ${assignData.assignedUser?.name}`);

  // 9. Manager Internal Note: POST /api/tickets/:id/notes
  console.log(`\n9. POST /api/tickets/${newTicketId}/notes (Private Internal Note)`);
  const noteRes = await fetch(`${base}/api/tickets/${newTicketId}/notes`, {
    method: 'POST',
    headers: mgrHeaders,
    body: JSON.stringify({ note: 'Customer is VIP Enterprise tier. Expedite warranty inspection upon return.' })
  });
  const noteData = await noteRes.json();
  console.log(`✓ Internal note added. Total notes: ${noteData.notes.length}`);

  // 10. Global Command Palette Search: GET /api/system/search?q=SoundPro
  console.log('\n10. GET /api/system/search?q=SoundPro (Command Palette ⌘ K)');
  const searchRes = await fetch(`${base}/api/system/search?q=SoundPro`, { headers: mgrHeaders });
  const searchData = await searchRes.json();
  console.log(`✓ Global search returned: ${searchData.tickets.length} tickets, ${searchData.orders.length} orders`);

  console.log('\n====================================================');
  console.log('ALL CUSTOMER PORTAL & MANAGER UPGRADE API TESTS PASSED!');
  console.log('====================================================');
}

testCustomerPortal().catch(err => {
  console.error('Customer Portal test failed:', err);
  process.exit(1);
});

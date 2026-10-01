// Client-Side Resilient Demo Store for Offline & Cloud Preview Deployments
// Ensures the live Vercel preview works smoothly even before backend URL is configured

const SEED_DATA = {
  users: [
    { id: 'usr-agent-01', name: 'Sarah Connor', email: 'agent@resolveai.io', role: 'agent' },
    { id: 'usr-manager-01', name: 'James Rodriguez', email: 'manager@resolveai.io', role: 'manager' },
    { id: 'usr-admin-01', name: 'Alex Vance', email: 'admin@resolveai.io', role: 'admin' }
  ],
  customers: [
    { id: 'cust-101', name: 'Elena Rostova', email: 'elena.rostova@acmecorp.com', phone: '+1 (415) 555-0192', tier: 'VIP Enterprise', company: 'Acme Corp' },
    { id: 'cust-102', name: 'Marcus Vance', email: 'marcus.v@technova.io', phone: '+1 (206) 555-0144', tier: 'Standard', company: 'TechNova Labs' },
    { id: 'cust-103', name: 'Sophia Chen', email: 'sophia.c@designlab.org', phone: '+1 (650) 555-0188', tier: 'Pro', company: 'Studio Chen Design' },
    { id: 'cust-104', name: 'David Kim', email: 'david.kim@apexai.dev', phone: '+1 (510) 555-0133', tier: 'Standard', company: 'Apex AI Systems' }
  ],
  orders: [
    {
      id: 'ORD-4821',
      customer_id: 'cust-101',
      product_name: 'Astra SoundPro Wireless ANC Headphones (Graphite Silver)',
      amount: 349.00,
      status: 'DELIVERED',
      order_date: '2026-09-24T11:20:00.000Z',
      delivery_date: '2026-09-27T15:45:00.000Z',
      tracking_number: 'TRK-983421-US',
      items: [{ sku: 'HP-ANC-GR', name: 'Astra SoundPro ANC Headphones', qty: 1, price: 349.00 }]
    },
    {
      id: 'ORD-5190',
      customer_id: 'cust-102',
      product_name: 'Titanium Tactile Keyboard Studio Edition (Linear Silver)',
      amount: 229.00,
      status: 'DELIVERED',
      order_date: '2026-09-18T09:00:00.000Z',
      delivery_date: '2026-09-21T13:10:00.000Z',
      tracking_number: 'TRK-881240-US',
      items: [{ sku: 'KB-TITAN-LN', name: 'Titanium Tactile Keyboard', qty: 1, price: 229.00 }]
    },
    {
      id: 'ORD-6042',
      customer_id: 'cust-103',
      product_name: 'UltraWide 4K Studio Creator Monitor 34-inch',
      amount: 480.00,
      status: 'PROCESSING',
      order_date: '2026-09-30T14:15:00.000Z',
      items: [{ sku: 'MON-UW-34', name: 'UltraWide 4K Studio Creator Monitor', qty: 1, price: 480.00 }]
    },
    {
      id: 'ORD-7110',
      customer_id: 'cust-104',
      product_name: 'Ergonomic Magnetic Palm Rest (Walnut Wood)',
      amount: 89.00,
      status: 'DELIVERED',
      order_date: '2026-09-10T10:00:00.000Z',
      delivery_date: '2026-09-13T12:00:00.000Z',
      tracking_number: 'TRK-771920-US',
      items: [{ sku: 'ACC-PLM-WN', name: 'Ergonomic Palm Rest', qty: 1, price: 89.00 }]
    }
  ],
  policies: [
    {
      id: 'POL-001',
      title: 'Damaged & Defective Product Replacement Policy',
      category: 'Warranty & Replacement',
      content: 'Customers are eligible for an immediate replacement if a product arrives damaged in transit or exhibits manufacturing defects within 14 days of confirmed delivery.',
      active: true
    },
    {
      id: 'POL-002',
      title: 'Wrong Item Received Return & Reship Policy',
      category: 'Fulfillment & Logistics',
      content: 'If a customer receives an incorrect product variant or wrong SKU, ResolveAI will immediately authorize the correct item dispatch at zero cost.',
      active: true
    },
    {
      id: 'POL-003',
      title: 'Pre-Dispatch Order Cancellation Policy',
      category: 'Order Modifications',
      content: 'Customers may cancel an order for a 100% full refund before warehouse status moves to DISPATCHED or SHIPPED.',
      active: true
    },
    {
      id: 'POL-004',
      title: 'Standard Refund Processing Policy',
      category: 'Refunds & Returns',
      content: 'Refunds for returned items are processed within 3 business days of warehouse receipt. Refunds exceeding $150 require supervisor approval.',
      active: true
    }
  ],
  tickets: [
    {
      id: 'tkt-001',
      customer_id: 'cust-101',
      order_id: 'ORD-4821',
      title: 'My headphones arrived damaged. I want a replacement.',
      description: 'The shipping box was crushed upon delivery yesterday. The left earcup is cracked and there is no audio output from the left driver. I need a replacement unit dispatched.',
      status: 'OPEN',
      priority: 'high',
      category: 'damaged_product',
      assigned_user_id: 'usr-agent-01',
      resolution_summary: null,
      customer_response: null,
      created_at: '2026-09-28T16:00:00.000Z'
    },
    {
      id: 'tkt-002',
      customer_id: 'cust-102',
      order_id: 'ORD-5190',
      title: 'I ordered linear switches, but received clicky switches.',
      description: 'I unboxed my Titanium Keyboard and discovered it has loud clicky switches instead of the Linear Silver variant I selected at checkout. Please send the correct variant.',
      status: 'WAITING_APPROVAL',
      priority: 'medium',
      category: 'wrong_item',
      assigned_user_id: 'usr-agent-01',
      created_at: '2026-09-22T10:15:00.000Z'
    },
    {
      id: 'tkt-003',
      customer_id: 'cust-103',
      order_id: 'ORD-6042',
      title: 'Please cancel my order before it ships.',
      description: 'I accidentally ordered two monitors instead of one. Please cancel order #ORD-6042 before warehouse fulfillment dispatches it.',
      status: 'OPEN',
      priority: 'urgent',
      category: 'cancellation',
      assigned_user_id: null,
      created_at: '2026-09-30T15:00:00.000Z'
    },
    {
      id: 'tkt-004',
      customer_id: 'cust-104',
      order_id: 'ORD-7110',
      title: 'Requesting refund for return received last week.',
      description: 'Tracking shows my return package was delivered to your warehouse 4 days ago. When will the refund be issued?',
      status: 'OPEN',
      priority: 'low',
      category: 'refund_request',
      assigned_user_id: null,
      created_at: '2026-09-29T11:30:00.000Z'
    }
  ],
  approvals: [
    {
      id: 'appr-002',
      ticket_id: 'tkt-002',
      run_id: 'run-seed-02',
      step_id: 'step-04',
      action: 'create_replacement_request',
      status: 'PENDING',
      reason: 'Wrong switch variant received on Order #ORD-5190 within 14-day warranty period.',
      evidence: { orderId: 'ORD-5190', policyCited: 'POL-002: Wrong Item Received Return & Reship Policy' },
      requested_by: 'Action Agent',
      created_at: '2026-09-22T10:18:00.000Z'
    }
  ],
  audit_logs: [
    {
      id: 'log-001',
      ticket_id: 'tkt-002',
      event_type: 'TRIAGE_COMPLETED',
      agent: 'Triage Agent',
      description: 'Categorized as wrong_item with medium priority.',
      created_at: '2026-09-22T10:15:30.000Z'
    },
    {
      id: 'log-002',
      ticket_id: 'tkt-002',
      event_type: 'APPROVAL_REQUESTED',
      agent: 'Action Agent',
      description: 'Approval requested for create_replacement_request.',
      created_at: '2026-09-22T10:18:00.000Z'
    }
  ]
};

function getStorage() {
  try {
    const raw = localStorage.getItem('resolveai_demo_store');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const fresh = JSON.parse(JSON.stringify(SEED_DATA));
  saveStorage(fresh);
  return fresh;
}

function saveStorage(data) {
  try {
    localStorage.setItem('resolveai_demo_store', JSON.stringify(data));
  } catch (e) {}
}

export function handleClientMock(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const store = getStorage();
  const body = options.body ? JSON.parse(options.body) : {};

  // Auth: /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const cleanEmail = (body.email || '').trim().toLowerCase();
    const user = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (user) {
      if (user.password && body.password && user.password !== body.password) {
        throw new Error('Invalid email or password');
      }
      return { token: 'mock-jwt-demo-token', user };
    }
    return { token: 'mock-jwt-demo-token', user: store.users[0] };
  }

  // Auth: /auth/register
  if (endpoint === '/auth/register' && method === 'POST') {
    const cleanEmail = (body.email || '').trim().toLowerCase();
    const existing = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('User already exists with this email');
    }
    const newUser = { id: `usr-${Date.now()}`, name: body.name, email: cleanEmail, role: body.role || 'agent', password: body.password };
    store.users.push(newUser);
    saveStorage(store);
    return { token: 'mock-jwt-demo-token', user: newUser };
  }

  // Auth: /auth/me
  if (endpoint === '/auth/me') {
    return { user: store.users[0] };
  }

  // Tickets: GET /tickets
  if (endpoint.startsWith('/tickets') && !endpoint.includes('/run') && method === 'GET') {
    const parts = endpoint.split('/');
    if (parts.length === 3 && parts[2]) {
      // /tickets/:id
      const id = parts[2].split('?')[0];
      const ticket = store.tickets.find(t => t.id === id);
      if (!ticket) throw new Error('Ticket not found');
      const customer = store.customers.find(c => c.id === ticket.customer_id);
      const order = store.orders.find(o => o.id === ticket.order_id);
      const audit_logs = store.audit_logs.filter(l => l.ticket_id === id);
      return { ...ticket, customer, order, audit_logs };
    }
    return store.tickets;
  }

  // Tickets: POST /tickets
  if (endpoint === '/tickets' && method === 'POST') {
    const newTkt = {
      id: `tkt-${Date.now().toString().slice(-4)}`,
      ...body,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };
    store.tickets.unshift(newTkt);
    saveStorage(store);
    return newTkt;
  }

  // Tickets: Run AI Workflow /tickets/:id/run
  if (endpoint.includes('/run') && method === 'POST') {
    const ticketId = endpoint.split('/')[2];
    const ticket = store.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.status === 'OPEN') {
      ticket.status = 'WAITING_APPROVAL';
      const approval = {
        id: `appr-${Date.now().toString().slice(-4)}`,
        ticket_id: ticketId,
        action: 'create_replacement_request',
        status: 'PENDING',
        reason: 'Order delivered within 14-day warranty period. Physical replacement requires supervisor approval gate.',
        evidence: { orderId: ticket.order_id || 'ORD-4821', policyCited: 'POL-001: Damaged & Defective Product Replacement Policy' },
        requested_by: 'Action Agent',
        created_at: new Date().toISOString()
      };
      store.approvals.unshift(approval);
      store.audit_logs.push({
        id: `log-${Date.now()}`,
        ticket_id: ticketId,
        event_type: 'APPROVAL_REQUESTED',
        agent: 'Action Agent',
        description: 'Approval requested for create_replacement_request.',
        created_at: new Date().toISOString()
      });
      saveStorage(store);
      return { status: 'WAITING_APPROVAL', message: 'Action paused. Human supervisor approval required to proceed.' };
    }

    if (ticket.status === 'WAITING_APPROVAL') {
      ticket.status = 'RESOLVED';
      ticket.resolution_summary = "Action 'create_replacement_request' verified under POL-001. Response generated with 100% factual alignment.";
      ticket.customer_response = "Dear Customer, We have verified your claim. Replacement shipment REP-7466 has been authorized and dispatched.";
      store.audit_logs.push({
        id: `log-${Date.now()}`,
        ticket_id: ticketId,
        event_type: 'TICKET_RESOLVED',
        agent: 'Verification Agent',
        description: 'Autonomous resolution verified and finalized. All audit gates satisfied.',
        created_at: new Date().toISOString()
      });
      saveStorage(store);
      return { status: 'RESOLVED', message: 'Ticket successfully resolved autonomously.' };
    }

    return { status: ticket.status, message: 'Workflow completed.' };
  }

  // Approvals: GET /approvals
  if (endpoint.startsWith('/approvals') && !endpoint.includes('/approve') && method === 'GET') {
    return store.approvals;
  }

  // Approvals: POST /approvals/:id/approve
  if (endpoint.includes('/approve') && method === 'POST') {
    const apprId = endpoint.split('/')[2];
    const appr = store.approvals.find(a => a.id === apprId);
    if (appr) {
      appr.status = 'APPROVED';
      const ticket = store.tickets.find(t => t.id === appr.ticket_id);
      if (ticket) {
        ticket.status = 'RESOLVED';
        ticket.resolution_summary = `Supervisor approved ${appr.action}. Replacement provisioned and dispatched.`;
        ticket.customer_response = 'Dear Customer, your replacement order has been approved and dispatched.';
      }
      saveStorage(store);
    }
    return { success: true, message: 'Action approved successfully.' };
  }

  // Customers, Orders, Policies, Activity, Health
  if (endpoint.startsWith('/customers')) return store.customers;
  if (endpoint.startsWith('/orders')) return store.orders;
  if (endpoint.startsWith('/policies')) return store.policies;
  if (endpoint.startsWith('/activity')) return store.audit_logs;
  if (endpoint === '/health') return { status: 'ONLINE', mode: 'CLIENT_MOCK_READY' };
  if (endpoint === '/reset') {
    saveStorage(JSON.parse(JSON.stringify(SEED_DATA)));
    return { success: true, message: 'Demo reset' };
  }

  return {};
}

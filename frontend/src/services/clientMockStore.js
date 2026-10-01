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
  ],
  email_notifications: [
    {
      id: 'eml-1001',
      ticket_id: 'tkt-001',
      customer_id: 'cust-101',
      event_type: 'TASK_STARTED',
      recipient: 'elena.rostova@acmecorp.com',
      subject: 'ResolveAI — Your Request Is Being Processed [Ticket #tkt-001]',
      body_text: 'ResolveAI has received your customer support case and begun autonomous investigation.',
      provider: 'resend',
      provider_message_id: 'msg_resend_live_84920482910',
      status: 'SENT',
      attempt_count: 1,
      created_at: '2026-09-28T16:01:00.000Z',
      sent_at: '2026-09-28T16:01:01.000Z'
    }
  ],
  autonomy_settings: {
    id: 'autonomy-config',
    enabled: true,
    paused: false,
    emergency_stopped: false,
    refund_limit: 1000,
    allowed_tools: [
      'get_customer',
      'get_order',
      'get_customer_orders',
      'get_ticket_history',
      'search_policies',
      'update_ticket_status',
      'create_internal_task',
      'create_replacement_request',
      'cancel_processing_order',
      'send_customer_update',
      'send_customer_update_email',
      'verify_resolution'
    ],
    restricted_tools: [
      'modify_authentication',
      'modify_user_permissions',
      'delete_customer_account',
      'modify_security_settings',
      'access_system_secrets',
      'bypass_verification'
    ],
    approval_mode: 'HYBRID',
    autonomous_approvals_enabled: true,
    permissions: {
      allow_replacements: true,
      allow_shipping: true,
      allow_notifications: true,
      allow_status_changes: true,
      allow_refunds: false
    },
    updated_at: new Date().toISOString()
  },
  supervisor_events: [
    {
      id: 'sup-1',
      event_type: 'AUTONOMOUS_AUTHORIZATION_GRANTED',
      title: 'Autonomous Authority Granted',
      description: 'Supervisor authorized create_replacement_request under POL-001 within configured autonomy bounds.',
      severity: 'INFO',
      created_at: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: 'sup-2',
      event_type: 'POLICY_BOUNDARY_VERIFIED',
      title: 'Safety Constraints Active',
      description: 'Allowlisted tools locked to 12 endpoints. High-risk destructive tools permanently blocked.',
      severity: 'INFO',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]
};

function getStorage() {
  try {
    const raw = localStorage.getItem('resolveai_demo_store');
    if (raw) {
      const parsed = JSON.parse(raw);
      let needsSave = false;
      if (!parsed.autonomy_settings) {
        parsed.autonomy_settings = JSON.parse(JSON.stringify(SEED_DATA.autonomy_settings));
        needsSave = true;
      }
      if (!parsed.supervisor_events) {
        parsed.supervisor_events = JSON.parse(JSON.stringify(SEED_DATA.supervisor_events));
        needsSave = true;
      }
      if (needsSave) saveStorage(parsed);
      return parsed;
    }
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

  // Internal Notes: POST /tickets/:id/notes
  if (endpoint.includes('/notes') && method === 'POST') {
    const parts = endpoint.split('/');
    const ticketId = parts[2];
    const ticket = (store.tickets || []).find(t => t.id === ticketId);
    if (ticket) {
      if (!ticket.internal_notes) ticket.internal_notes = [];
      const newNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: user?.name || 'Staff Member',
        authorRole: user?.role || 'agent',
        content: body?.note?.trim() || '',
        created_at: new Date().toISOString()
      };
      ticket.internal_notes.push(newNote);
      saveStorage(store);
      return { success: true, notes: ticket.internal_notes };
    }
    return { success: false, error: 'Ticket not found' };
  }

  // Approvals: GET /approvals
  if (endpoint.startsWith('/approvals') && !endpoint.includes('/approve') && method === 'GET') {
    const list = store.approvals || [];
    if (endpoint.toLowerCase().includes('status=pending')) {
      return list.filter(a => a.status === 'PENDING' || a.status === 'ESCALATED');
    }
    return list;
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

  // Emails: GET /tickets/:id/emails
  if (endpoint.includes('/emails') && method === 'GET') {
    const parts = endpoint.split('/');
    const tId = parts[2];
    const emails = (store.email_notifications || []).filter(e => e.ticket_id === tId);
    return emails;
  }

  // Emails: POST /tickets/:id/send-update
  if (endpoint.includes('/send-update') && method === 'POST') {
    const parts = endpoint.split('/');
    const tId = parts[2];
    const tkt = store.tickets.find(t => t.id === tId);
    const cust = tkt ? store.customers.find(c => c.id === tkt.customer_id) : null;
    const newEmail = {
      id: `eml-${Date.now().toString().slice(-4)}`,
      ticket_id: tId,
      customer_id: cust?.id || null,
      event_type: 'MANUAL_UPDATE',
      recipient: cust?.email || 'customer@example.com',
      subject: body.subject || `ResolveAI — Update on Ticket #${tId}`,
      body_text: body.message,
      provider: 'resend',
      provider_message_id: `msg_resend_live_${Date.now()}`,
      status: 'SENT',
      attempt_count: 1,
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString()
    };
    if (!store.email_notifications) store.email_notifications = [];
    store.email_notifications.unshift(newEmail);
    store.audit_logs.push({
      id: `log-${Date.now()}`,
      ticket_id: tId,
      event_type: 'EMAIL_SENT',
      agent: 'Communication Agent',
      description: `Dispatched customer update: "${newEmail.subject}" to <${newEmail.recipient}>.`,
      metadata: { messageId: newEmail.provider_message_id, status: 'SENT' },
      created_at: new Date().toISOString()
    });
    saveStorage(store);
    return { success: true, emailNotification: newEmail };
  }

  // Emails: POST /emails/:id/retry
  if (endpoint.startsWith('/emails/') && endpoint.endsWith('/retry') && method === 'POST') {
    const emailId = endpoint.split('/')[2];
    const eml = (store.email_notifications || []).find(e => e.id === emailId);
    if (eml) {
      eml.status = 'SENT';
      eml.attempt_count = (eml.attempt_count || 1) + 1;
      eml.sent_at = new Date().toISOString();
      saveStorage(store);
    }
    return { success: true, message: 'Email retried successfully.' };
  }

  // Emails: GET /emails/status
  if (endpoint === '/emails/status') {
    const list = store.email_notifications || [];
    const sent = list.filter(e => e.status === 'SENT');
    return {
      operational: true,
      provider: 'Transactional Simulator (Resend Compatible)',
      mode: 'simulator',
      isLive: false,
      sender: 'ResolveAI Operations <notifications@resolveai.io>',
      replyTo: 'support@resolveai.io',
      apiKeyConfigured: true,
      senderConfigured: true,
      stats: {
        totalSent: sent.length,
        totalFailed: list.length - sent.length,
        lastDelivery: sent[0]?.sent_at || null
      }
    };
  }

  // Emails: POST /emails/test
  if (endpoint === '/emails/test' && method === 'POST') {
    const adminEmail = body?.to || store.users?.find(u => u.role === 'admin')?.email || 'admin@resolveai.io';
    const testId = `msg_resend_live_${Date.now().toString(36)}`;
    const newEmail = {
      id: `eml-${Date.now().toString(36)}`,
      ticket_id: 'SYS-TEST',
      customer_id: null,
      event_type: 'ADMIN_TEST',
      recipient: adminEmail,
      subject: '[Test Verification] ResolveAI Transactional Email Provider Operational',
      provider: 'transactional-simulator',
      provider_message_id: testId,
      status: 'SENT',
      attempt_count: 1,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    if (!store.email_notifications) store.email_notifications = [];
    store.email_notifications.unshift(newEmail);
    saveStorage(store);
    return {
      success: true,
      message: `Test email successfully dispatched to ${adminEmail}`,
      recipient: adminEmail,
      providerMessageId: testId,
      status: 'SENT'
    };
  }

  // Emails: GET /emails/logs
  if (endpoint.startsWith('/emails/logs')) {
    return store.email_notifications || [];
  }

  // Customers, Orders, Policies, Activity, Health
  if (endpoint === '/activity/metrics') {
    const totalResolved = store.tickets.filter(t => t.status === 'RESOLVED').length;
    return {
      activeWorkflows: store.tickets.filter(t => t.status === 'AI_PROCESSING' || t.status === 'WAITING_APPROVAL').length,
      totalWorkflows: store.tickets.length,
      resolvedWorkflows: totalResolved,
      autonomousResolutions: totalResolved,
      humanInterventions: store.approvals.length,
      autonomousRate: '88%',
      humanInterventionRate: '25%',
      verificationPassRate: '96%',
      recoveryRate: '100%',
      agentPerformance: [
        { badge: '◉', name: 'Orchestrator Agent', totalEvents: 14, successRate: '100%' },
        { badge: '△', name: 'Triage Agent', totalEvents: 12, successRate: '98%' },
        { badge: '⌕', name: 'Investigation Agent', totalEvents: 12, successRate: '95%' },
        { badge: '▣', name: 'Policy Agent', totalEvents: 12, successRate: '100%' },
        { badge: '⚡', name: 'Action Agent', totalEvents: 10, successRate: '92%' },
        { badge: '✦', name: 'Communication Agent', totalEvents: 12, successRate: '100%' },
        { badge: '✓', name: 'Verification Agent', totalEvents: 12, successRate: '97%' }
      ],
      recentAuditLogs: store.audit_logs.slice(0, 15)
    };
  }
  // Supervisor Agent & AI Control Center
  if (endpoint === '/supervisor/status') {
    const s = store.autonomy_settings || SEED_DATA.autonomy_settings;
    const isAuto = s.enabled && !s.paused && !s.emergency_stopped;
    const mode = s.emergency_stopped ? 'EMERGENCY_STOPPED' : s.paused ? 'PAUSED' : isAuto ? 'AUTONOMOUS' : 'SUPERVISED';
    return {
      supervisor: {
        name: 'ResolveAI Supervisor Agent',
        badge: '◈',
        status: s.emergency_stopped ? 'EMERGENCY_STOPPED' : s.paused ? 'PAUSED' : 'ACTIVE',
        mode,
        emergencyStopped: !!s.emergency_stopped
      },
      fleetHealth: { totalAgents: 8, healthyCount: 8, allHealthy: true },
      telemetry: {
        activeWorkflowsCount: store.tickets.filter(t => t.status === 'AI_PROCESSING' || t.status === 'WAITING_APPROVAL').length,
        pendingApprovalsCount: store.approvals.length,
        totalCasesCount: store.tickets.length,
        resolvedCasesCount: store.tickets.filter(t => t.status === 'RESOLVED').length
      },
      settings: s
    };
  }

  if (endpoint === '/supervisor/agents') {
    return [
      { id: 'supervisor_agent', name: 'ResolveAI Supervisor Agent', badge: '◈', status: 'HEALTHY', state: 'ONLINE', execution_count: 28, last_task: 'Policy-bounded autonomous supervision' },
      { id: 'orchestrator_agent', name: 'Orchestrator Agent', badge: '◉', status: 'HEALTHY', state: 'ONLINE', execution_count: 22, last_task: 'Dynamic DAG resolution planning' },
      { id: 'triage_agent', name: 'Triage Agent', badge: '△', status: 'HEALTHY', state: 'ONLINE', execution_count: 22, last_task: 'Intent classification & entity extraction' },
      { id: 'investigation_agent', name: 'Investigation Agent', badge: '⌕', status: 'HEALTHY', state: 'ONLINE', execution_count: 22, last_task: 'Carrier tracking & CRM verification' },
      { id: 'policy_agent', name: 'Policy Agent', badge: '▣', status: 'HEALTHY', state: 'ONLINE', execution_count: 22, last_task: 'Deterministic warranty rules evaluation' },
      { id: 'action_agent', name: 'Action Agent', badge: '⚡', status: 'HEALTHY', state: 'ONLINE', execution_count: 20, last_task: 'Allowlisted tool provisioning' },
      { id: 'communication_agent', name: 'Communication Agent', badge: '✦', status: 'HEALTHY', state: 'ONLINE', execution_count: 22, last_task: 'Customer email dispatch & tone safeguard' },
      { id: 'verification_agent', name: 'Verification Agent', badge: '✓', status: 'HEALTHY', state: 'ONLINE', execution_count: 22, last_task: '5-point deterministic audit gatekeeping' }
    ];
  }

  if (endpoint === '/supervisor/events') {
    return store.supervisor_events || SEED_DATA.supervisor_events;
  }

  if (endpoint === '/supervisor/query' && method === 'POST') {
    const s = store.autonomy_settings || SEED_DATA.autonomy_settings;
    const mode = s.emergency_stopped ? 'EMERGENCY STOP ENGAGED' : s.paused ? 'PAUSED' : s.enabled ? 'AUTONOMOUS' : 'SUPERVISED';
    return {
      answer: `Supervisor Telemetry: System state is currently ${mode}. 8/8 agents reporting operational. Refund limit is configured at $${s.refund_limit || 1000}. All operations are strictly bounded by configured policies and 5-point verification.`,
      source: 'deterministic'
    };
  }

  // Autonomy settings & actions with full state persistence
  if (endpoint === '/autonomy/settings' && method === 'GET') {
    return store.autonomy_settings || SEED_DATA.autonomy_settings;
  }

  if (endpoint === '/autonomy/settings' && method === 'PATCH') {
    const current = store.autonomy_settings || SEED_DATA.autonomy_settings;
    store.autonomy_settings = {
      ...current,
      ...body,
      permissions: {
        ...(current.permissions || {}),
        ...(body.permissions || {})
      },
      updated_at: new Date().toISOString()
    };
    saveStorage(store);
    return {
      success: true,
      message: 'Autonomous AI Mode settings successfully updated.',
      settings: store.autonomy_settings
    };
  }

  if (endpoint === '/autonomy/enable' && method === 'POST') {
    const current = store.autonomy_settings || SEED_DATA.autonomy_settings;
    store.autonomy_settings = {
      ...current,
      enabled: true,
      paused: false,
      emergency_stopped: false,
      autonomous_approvals_enabled: true,
      updated_at: new Date().toISOString()
    };
    store.supervisor_events = store.supervisor_events || [...SEED_DATA.supervisor_events];
    store.supervisor_events.unshift({
      id: `sup-${Date.now()}`,
      event_type: 'AUTONOMY_MODE_ENABLED',
      title: 'Autonomous AI Mode Activated',
      description: 'Autonomous AI Mode enabled by supervisor directive. Policy boundaries active.',
      severity: 'INFO',
      created_at: new Date().toISOString()
    });
    saveStorage(store);
    return {
      success: true,
      message: 'Autonomous AI Mode successfully ENABLED. Supervisor is authorized to execute policy-bounded workflows.',
      settings: store.autonomy_settings
    };
  }

  if (endpoint === '/autonomy/disable' && method === 'POST') {
    const current = store.autonomy_settings || SEED_DATA.autonomy_settings;
    store.autonomy_settings = {
      ...current,
      enabled: false,
      paused: false,
      autonomous_approvals_enabled: false,
      updated_at: new Date().toISOString()
    };
    store.supervisor_events = store.supervisor_events || [...SEED_DATA.supervisor_events];
    store.supervisor_events.unshift({
      id: `sup-${Date.now()}`,
      event_type: 'AUTONOMY_MODE_DISABLED',
      title: 'Autonomous AI Mode Disabled',
      description: 'Autonomous Mode disabled. Reverted to human-supervised gating.',
      severity: 'INFO',
      created_at: new Date().toISOString()
    });
    saveStorage(store);
    return {
      success: true,
      message: 'Autonomous AI Mode DISABLED. All sensitive actions require human supervisor authorization.',
      settings: store.autonomy_settings
    };
  }

  if (endpoint === '/autonomy/pause' && method === 'POST') {
    const current = store.autonomy_settings || SEED_DATA.autonomy_settings;
    store.autonomy_settings = {
      ...current,
      paused: true,
      updated_at: new Date().toISOString()
    };
    store.supervisor_events = store.supervisor_events || [...SEED_DATA.supervisor_events];
    store.supervisor_events.unshift({
      id: `sup-${Date.now()}`,
      event_type: 'AUTONOMY_EXECUTION_PAUSED',
      title: 'Autonomous Execution Paused',
      description: 'Supervisor paused all automated workflow execution.',
      severity: 'WARNING',
      created_at: new Date().toISOString()
    });
    saveStorage(store);
    return {
      success: true,
      message: 'Autonomous execution PAUSED. Supervisor is actively monitoring without executing actions.',
      settings: store.autonomy_settings
    };
  }

  if (endpoint === '/autonomy/resume' && method === 'POST') {
    const current = store.autonomy_settings || SEED_DATA.autonomy_settings;
    store.autonomy_settings = {
      ...current,
      paused: false,
      updated_at: new Date().toISOString()
    };
    store.supervisor_events = store.supervisor_events || [...SEED_DATA.supervisor_events];
    store.supervisor_events.unshift({
      id: `sup-${Date.now()}`,
      event_type: 'AUTONOMY_EXECUTION_RESUMED',
      title: 'Autonomous Execution Resumed',
      description: 'Autonomous execution resumed by supervisor.',
      severity: 'INFO',
      created_at: new Date().toISOString()
    });
    saveStorage(store);
    return {
      success: true,
      message: 'Autonomous execution RESUMED.',
      settings: store.autonomy_settings
    };
  }

  if (endpoint === '/autonomy/emergency-stop' && method === 'POST') {
    const current = store.autonomy_settings || SEED_DATA.autonomy_settings;
    store.autonomy_settings = {
      ...current,
      emergency_stopped: true,
      enabled: false,
      paused: true,
      autonomous_approvals_enabled: false,
      updated_at: new Date().toISOString()
    };
    store.supervisor_events = store.supervisor_events || [...SEED_DATA.supervisor_events];
    store.supervisor_events.unshift({
      id: `sup-${Date.now()}`,
      event_type: 'EMERGENCY_STOP_ACTIVATED',
      title: 'EMERGENCY STOP TRIGGERED',
      description: 'Emergency stop initiated. All autonomous action execution halted.',
      severity: 'CRITICAL',
      created_at: new Date().toISOString()
    });
    saveStorage(store);
    return {
      success: true,
      message: 'EMERGENCY STOP EXECUTED. All autonomous action execution immediately halted.',
      settings: store.autonomy_settings
    };
  }

  if (endpoint.startsWith('/customers')) {
    const orders = store.orders || [];
    const tickets = store.tickets || [];
    return (store.customers || []).map(c => {
      const custOrders = orders.filter(o => o.customer_id === c.id || o.customerId === c.id);
      const custTickets = tickets.filter(t => t.customer_id === c.id || t.customerId === c.id);
      const totalSpent = custOrders.reduce((sum, o) => {
        const val = Number(o.amount) || Number(o.price) || (o.items && Number(o.items[0]?.price)) || 0;
        return sum + val;
      }, 0);
      return {
        ...c,
        ordersCount: custOrders.length,
        ticketsCount: custTickets.length,
        totalSpent,
        orders: custOrders
      };
    });
  }
  if (endpoint === '/customer/notifications') {
    return [
      {
        id: 'notif-1',
        title: 'Warranty Claim Approved',
        message: 'Your replacement request for Astra SoundPro ANC has been approved.',
        time: '10m ago',
        read: false
      },
      {
        id: 'notif-2',
        title: 'Supervisor Agent Verification',
        message: 'Autonomous 5-point verification passed for Ticket #TKT-001.',
        time: '1h ago',
        read: true
      }
    ];
  }
  if (endpoint.startsWith('/orders')) return store.orders;
  if (endpoint.startsWith('/policies')) {
    if (method === 'POST') {
      const newPolicy = {
        id: body?.id || `POL-${String((store.policies?.length || 0) + 1).padStart(3, '0')}`,
        title: body?.title || 'Untitled Policy',
        category: body?.category || 'general',
        content: body?.content || '',
        active: body?.active !== undefined ? body.active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      store.policies = [newPolicy, ...(store.policies || [])];
      saveStorage(store);
      return newPolicy;
    }
    return store.policies;
  }
  if (endpoint.startsWith('/activity')) return store.audit_logs;
  if (endpoint === '/health') return { status: 'ONLINE', mode: 'CLIENT_MOCK_READY' };
  if (endpoint === '/reset') {
    saveStorage(JSON.parse(JSON.stringify(SEED_DATA)));
    return { success: true, message: 'Demo reset' };
  }

  return {};
}

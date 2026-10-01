import bcrypt from 'bcryptjs';

export const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  const users = [
    {
      id: 'usr-agent-01',
      name: 'Sarah Connor',
      email: 'agent@resolveai.io',
      password_hash: defaultPasswordHash,
      role: 'agent',
      created_at: '2026-09-20T08:00:00.000Z'
    },
    {
      id: 'usr-manager-01',
      name: 'James Rodriguez',
      email: 'manager@resolveai.io',
      password_hash: defaultPasswordHash,
      role: 'manager',
      created_at: '2026-09-15T08:00:00.000Z'
    },
    {
      id: 'usr-admin-01',
      name: 'Alex Vance',
      email: 'admin@resolveai.io',
      password_hash: defaultPasswordHash,
      role: 'admin',
      created_at: '2026-09-10T08:00:00.000Z'
    }
  ];

  const customers = [
    {
      id: 'cust-101',
      name: 'Elena Rostova',
      email: 'elena.rostova@acmecorp.com',
      phone: '+1 (415) 555-0192',
      tier: 'VIP Enterprise',
      company: 'Acme Corp',
      created_at: '2025-11-12T10:00:00.000Z'
    },
    {
      id: 'cust-102',
      name: 'Marcus Vance',
      email: 'marcus.v@technova.io',
      phone: '+1 (206) 555-0144',
      tier: 'Standard',
      company: 'TechNova Labs',
      created_at: '2026-01-08T14:30:00.000Z'
    },
    {
      id: 'cust-103',
      name: 'Sophia Chen',
      email: 'sophia.c@designlab.org',
      phone: '+1 (650) 555-0188',
      tier: 'Pro',
      company: 'Studio Chen Design',
      created_at: '2026-03-01T09:15:00.000Z'
    },
    {
      id: 'cust-104',
      name: 'David Kim',
      email: 'david.kim@apexai.dev',
      phone: '+1 (510) 555-0133',
      tier: 'Standard',
      company: 'Apex AI Systems',
      created_at: '2026-02-18T16:45:00.000Z'
    }
  ];

  const orders = [
    {
      id: 'ORD-4821',
      customer_id: 'cust-101',
      product_name: 'Astra SoundPro Wireless ANC Headphones (Graphite Silver)',
      amount: 349.00,
      status: 'DELIVERED',
      order_date: '2026-09-24T11:20:00.000Z',
      delivery_date: '2026-09-27T15:45:00.000Z',
      tracking_number: 'TRK-983421-US',
      items: [
        { sku: 'HP-ANC-GR', name: 'Astra SoundPro ANC Headphones', qty: 1, price: 349.00 }
      ]
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
      items: [
        { sku: 'KB-TITAN-LN', name: 'Titanium Tactile Keyboard', qty: 1, price: 229.00 }
      ]
    },
    {
      id: 'ORD-6204',
      customer_id: 'cust-103',
      product_name: 'UltraView 4K OLED Studio Monitor 32-inch',
      amount: 899.00,
      status: 'PROCESSING',
      order_date: '2026-09-30T22:15:00.000Z',
      delivery_date: null,
      tracking_number: 'TRK-PENDING-STAGE',
      items: [
        { sku: 'MON-4K-32', name: 'UltraView 4K OLED Studio Monitor', qty: 1, price: 899.00 }
      ]
    },
    {
      id: 'ORD-7311',
      customer_id: 'cust-104',
      product_name: 'Astra SoundPro Wireless ANC Headphones (Midnight Matte)',
      amount: 349.00,
      status: 'DELIVERED',
      order_date: '2026-08-10T14:00:00.000Z',
      delivery_date: '2026-08-14T17:30:00.000Z',
      tracking_number: 'TRK-442190-US',
      items: [
        { sku: 'HP-ANC-MM', name: 'Astra SoundPro ANC Headphones', qty: 1, price: 349.00 }
      ]
    }
  ];

  const policies = [
    {
      id: 'POL-001',
      title: 'Damaged & Defective Product Replacement Policy',
      category: 'damaged_product',
      content: `1. Eligibility: Customers reporting that an item arrived damaged, crushed, or defective within 14 calendar days of confirmed carrier delivery qualify for an expedited replacement at no additional charge.
2. Verification: The customer must provide an order reference and state the nature of damage (e.g. cracked headband, broken seal).
3. Authorization & Safety Gate: While AI may triage and verify eligibility, creating a warehouse physical replacement dispatch order (create_replacement_request) is classified as MEDIUM RISK and strictly requires Human Supervisor Approval before execution.
4. Return requirement: For products under $400, return shipping of the damaged unit may be waived at manager discretion to maximize customer delight.`,
      active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'POL-002',
      title: '30-Day Return & Full Refund Policy',
      category: 'refund_request',
      content: `1. Eligibility: Customers can request a full monetary refund within 30 calendar days of confirmed delivery for any standard item.
2. Condition: Items older than 30 calendar days are strictly ineligible for automated refunds and require manual escalation.
3. Approval Gate: Direct financial refunds are HIGH RISK and always require human manager approval. The Action Agent cannot initiate bank or gateway refunds autonomously.`,
      active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'POL-003',
      title: 'Pre-Shipment Order Cancellation Policy',
      category: 'cancellation',
      content: `1. Eligibility: If an order status is 'PROCESSING' or 'PENDING' and has not reached 'SHIPPED' or 'OUT_FOR_DELIVERY', cancellation is permitted.
2. Action: AI Action Agent is authorized to autonomously cancel the processing order and notify the warehouse fulfillment queue without human approval.`,
      active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'POL-004',
      title: 'VIP Enterprise Priority & Escalation Policy',
      category: 'escalation',
      content: `1. Criteria: Enterprise VIP tier accounts or tickets with high sentiment distress must be flagged with priority 'high' or 'urgent'.
2. If any policy check is ambiguous or customer requirements fall outside standard workflows, the case must be escalated to Tier-2 Customer Operations Lead rather than rejected outright.`,
      active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z'
    }
  ];

  const tickets = [
    {
      id: 'tkt-001',
      customer_id: 'cust-101',
      order_id: 'ORD-4821',
      title: 'My headphones arrived damaged. I want a replacement.',
      description: 'The shipping box looked crushed and when I opened the Astra SoundPro headphones, the left headband hinge was snapped. The sound crackles. Please send me a replacement unit as soon as possible.',
      status: 'OPEN',
      priority: 'high',
      category: 'damaged_product',
      assigned_user_id: 'usr-agent-01',
      resolution_summary: null,
      customer_response: null,
      created_at: '2026-10-01T09:31:00.000Z',
      updated_at: '2026-10-01T09:31:00.000Z'
    },
    {
      id: 'tkt-002',
      customer_id: 'cust-102',
      order_id: 'ORD-5190',
      title: 'Received wrong switch type on Titanium Keyboard',
      description: 'I ordered the Linear Silver switches, but upon unboxing the Titanium Tactile Keyboard, it clearly has Clicky Blue switches installed. Requesting exchange for the correct model.',
      status: 'WAITING_APPROVAL',
      priority: 'medium',
      category: 'wrong_product',
      assigned_user_id: 'usr-agent-01',
      resolution_summary: 'Customer received mismatched switch variant. Exchange order #REP-5191 provisioned, pending supervisor approval.',
      customer_response: null,
      created_at: '2026-10-01T08:14:00.000Z',
      updated_at: '2026-10-01T08:16:00.000Z'
    },
    {
      id: 'tkt-003',
      customer_id: 'cust-103',
      order_id: 'ORD-6204',
      title: 'Request to cancel monitor order before dispatch',
      description: 'Hello, I realized I ordered the 32-inch monitor by mistake instead of the 27-inch model. The order was placed an hour ago. Can you cancel it immediately so I am not charged shipping?',
      status: 'RESOLVED',
      priority: 'medium',
      category: 'cancellation',
      assigned_user_id: 'usr-agent-01',
      resolution_summary: 'Autonomous cancellation executed. Order ORD-6204 was in PROCESSING stage. Order cancelled in warehouse system. Customer notified.',
      customer_response: 'Dear Sophia, your order ORD-6204 has been successfully cancelled before shipment. No charges were captured, and your invoice has been updated.',
      created_at: '2026-10-01T07:20:00.000Z',
      updated_at: '2026-10-01T07:22:30.000Z'
    },
    {
      id: 'tkt-004',
      customer_id: 'cust-104',
      order_id: 'ORD-7311',
      title: 'Request refund for headphones purchased 2 months ago',
      description: 'I bought these headphones back in August and would like a full refund. I do not have the original box anymore.',
      status: 'ESCALATED',
      priority: 'low',
      category: 'refund_request',
      assigned_user_id: 'usr-manager-01',
      resolution_summary: 'Order delivered 48 days ago, exceeding the 30-day refund window in POL-002. Escalated to Tier-2 Customer Operations Lead for discretionary store credit review.',
      customer_response: 'Hello David, your request has been routed to our Customer Care Leadership team for review, as the standard 30-day return window has passed.',
      created_at: '2026-09-30T16:00:00.000Z',
      updated_at: '2026-09-30T16:04:00.000Z'
    }
  ];

  const approvals = [
    {
      id: 'appr-002',
      ticket_id: 'tkt-002',
      run_id: 'run-seed-002',
      step_id: 'step-004',
      action: 'create_replacement_request',
      status: 'PENDING',
      reason: 'Wrong switch variant received on Order #ORD-5190 within 14-day warranty period.',
      evidence: {
        orderId: 'ORD-5190',
        product: 'Titanium Tactile Keyboard',
        daysSinceDelivery: 10,
        policyCited: 'POL-001 (Section 3 - Medium Risk Safety Gate)',
        replacementSku: 'KB-TITAN-LN'
      },
      requested_by: 'Action Agent',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-10-01T08:16:00.000Z'
    }
  ];

  const agent_runs = [
    {
      id: 'run-seed-002',
      ticket_id: 'tkt-002',
      status: 'WAITING_APPROVAL',
      objective: 'Verify replacement eligibility for mismatched keyboard switch model',
      risk_level: 'medium',
      plan: [
        { step: 1, agent: 'triage_agent', action: 'classify_intent', status: 'COMPLETED' },
        { step: 2, agent: 'investigation_agent', action: 'retrieve_order', status: 'COMPLETED' },
        { step: 3, agent: 'policy_agent', action: 'evaluate_policy', status: 'COMPLETED' },
        { step: 4, agent: 'action_agent', action: 'create_replacement_request', status: 'WAITING_APPROVAL', requiresApproval: true }
      ],
      started_at: '2026-10-01T08:14:10.000Z',
      completed_at: null
    },
    {
      id: 'run-seed-003',
      ticket_id: 'tkt-003',
      status: 'COMPLETED',
      objective: 'Resolve order cancellation request before warehouse dispatch',
      risk_level: 'low',
      plan: [
        { step: 1, agent: 'triage_agent', action: 'classify_intent', status: 'COMPLETED' },
        { step: 2, agent: 'investigation_agent', action: 'retrieve_order', status: 'COMPLETED' },
        { step: 3, agent: 'policy_agent', action: 'check_cancellation_policy', status: 'COMPLETED' },
        { step: 4, agent: 'action_agent', action: 'cancel_processing_order', status: 'COMPLETED', requiresApproval: false },
        { step: 5, agent: 'communication_agent', action: 'generate_customer_response', status: 'COMPLETED' },
        { step: 6, agent: 'verification_agent', action: 'verify_resolution', status: 'COMPLETED' }
      ],
      started_at: '2026-10-01T07:20:10.000Z',
      completed_at: '2026-10-01T07:22:30.000Z'
    }
  ];

  const agent_steps = [];
  const audit_logs = [
    {
      id: 'log-001',
      ticket_id: 'tkt-003',
      event_type: 'PLAN_GENERATED',
      agent: 'Orchestrator Agent',
      description: 'Autonomous 6-step resolution plan formulated for order cancellation.',
      metadata: { stepsCount: 6, riskLevel: 'low' },
      created_at: '2026-10-01T07:20:15.000Z'
    },
    {
      id: 'log-002',
      ticket_id: 'tkt-003',
      event_type: 'ORDER_VERIFIED',
      agent: 'Investigation Agent',
      description: 'Order #ORD-6204 confirmed in PROCESSING status. No carrier tracking assigned.',
      metadata: { orderId: 'ORD-6204', amount: 899.00 },
      created_at: '2026-10-01T07:20:45.000Z'
    },
    {
      id: 'log-003',
      ticket_id: 'tkt-003',
      event_type: 'POLICY_EVALUATED',
      agent: 'Policy Agent',
      description: 'POL-003 permits autonomous cancellation prior to carrier fulfillment.',
      metadata: { policyId: 'POL-003', permitted: true },
      created_at: '2026-10-01T07:21:10.000Z'
    },
    {
      id: 'log-004',
      ticket_id: 'tkt-003',
      event_type: 'ACTION_EXECUTED',
      agent: 'Action Agent',
      description: 'Order status changed to CANCELLED in database and warehouse dispatch queue.',
      metadata: { orderId: 'ORD-6204', status: 'CANCELLED' },
      created_at: '2026-10-01T07:21:40.000Z'
    },
    {
      id: 'log-005',
      ticket_id: 'tkt-003',
      event_type: 'WORKFLOW_VERIFIED',
      agent: 'Verification Agent',
      description: 'All 6 plan steps verified. Audit trail recorded. Ticket transitioned to RESOLVED.',
      metadata: { verified: true },
      created_at: '2026-10-01T07:22:30.000Z'
    }
  ];

  return {
    users,
    customers,
    orders,
    policies,
    tickets,
    agent_runs,
    agent_steps,
    approvals,
    audit_logs
  };
};

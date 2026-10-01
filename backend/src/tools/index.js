import { db } from '../db/store.js';

export const tools = {
  // Retrieve customer profile
  async getCustomer({ customerId }) {
    if (!customerId) return { error: 'Customer ID required' };
    const customer = db.findById('customers', customerId);
    if (!customer) return { found: false, message: 'Customer not found' };
    return { found: true, customer };
  },

  // Retrieve order details
  async getOrder({ orderId }) {
    if (!orderId) return { error: 'Order ID required' };
    const order = db.findById('orders', orderId);
    if (!order) return { found: false, message: 'Order not found' };
    return { found: true, order };
  },

  // Retrieve customer order history
  async getCustomerOrders({ customerId }) {
    if (!customerId) return { error: 'Customer ID required' };
    const orders = db.find('orders', o => o.customer_id === customerId);
    return { count: orders.length, orders };
  },

  // Retrieve ticket history for customer
  async getTicketHistory({ customerId }) {
    if (!customerId) return { error: 'Customer ID required' };
    const history = db.find('tickets', t => t.customer_id === customerId);
    return { count: history.length, tickets: history };
  },

  // Search active policies
  async searchPolicies({ category, query }) {
    const allPolicies = db.find('policies', p => p.active);
    let matched = allPolicies;

    if (category) {
      const catMatch = allPolicies.filter(p => p.category.toLowerCase() === category.toLowerCase());
      if (catMatch.length > 0) matched = catMatch;
    }

    if (query) {
      const q = query.toLowerCase();
      const textMatch = matched.filter(p => 
        p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
      );
      if (textMatch.length > 0) matched = textMatch;
    }

    return { count: matched.length, policies: matched };
  },

  // Update ticket status
  async updateTicketStatus({ ticketId, status, resolutionSummary, customerResponse }) {
    const updates = { status };
    if (resolutionSummary) updates.resolution_summary = resolutionSummary;
    if (customerResponse) updates.customer_response = customerResponse;
    const updated = db.update('tickets', ticketId, updates);
    return { success: !!updated, ticket: updated };
  },

  // Create an internal task
  async createInternalTask({ ticketId, title, assigneeRole, priority = 'medium' }) {
    const task = {
      id: `task-${Date.now()}`,
      ticket_id: ticketId,
      title,
      assignee_role: assigneeRole,
      priority,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    return { success: true, task };
  },

  // Create an escalation
  async createEscalation({ ticketId, reason, priority = 'high', routeTo = 'Tier-2 Customer Operations Lead' }) {
    db.update('tickets', ticketId, {
      status: 'ESCALATED',
      priority
    });
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'ESCALATION_TRIGGERED',
      agent: 'Action Agent',
      description: `Escalated to ${routeTo}: ${reason}`,
      metadata: { reason, priority, routeTo }
    });
    return { success: true, status: 'ESCALATED', routeTo, reason };
  },

  // Create replacement order request
  async createReplacementRequest({ ticketId, orderId, reason, replacementSku, autoApprove = false }) {
    const replacementId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const result = {
      replacementId,
      ticketId,
      orderId,
      reason,
      replacementSku,
      status: autoApprove ? 'DISPATCHED' : 'AWAITING_APPROVAL'
    };

    db.logAudit({
      ticket_id: ticketId,
      event_type: 'REPLACEMENT_PROVISIONED',
      agent: 'Action Agent',
      description: `Replacement request ${replacementId} created. Status: ${result.status}`,
      metadata: result
    });

    return result;
  }
};

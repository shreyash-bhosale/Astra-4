import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { emailService } from '../services/emailService.js';
import { aiService } from '../services/aiService.js';
import { config } from '../config/env.js';

// Customer-friendly status mapping
export const getCustomerSafeStatus = (status) => {
  switch (status) {
    case 'OPEN':
    case 'RECEIVED':
      return {
        label: 'Received',
        badge: 'var(--status-open-text)',
        bg: 'var(--status-open-bg)',
        description: 'Your request has been received and queued for review.'
      };
    case 'AI_PROCESSING':
      return {
        label: 'Investigating',
        badge: 'var(--status-proc-text)',
        bg: 'var(--status-proc-bg)',
        description: 'ResolveAI is actively reviewing your order history and details.'
      };
    case 'WAITING_APPROVAL':
      return {
        label: 'In Review',
        badge: 'var(--status-appr-text)',
        bg: 'var(--status-appr-bg)',
        description: 'Our team is reviewing the best solution for your case.'
      };
    case 'ACTION_IN_PROGRESS':
      return {
        label: 'Processing Solution',
        badge: 'var(--status-appr-text)',
        bg: 'var(--status-appr-bg)',
        description: 'Approved action is being executed (replacement / credit dispatch).'
      };
    case 'RESOLVED':
      return {
        label: 'Resolved',
        badge: 'var(--status-res-text)',
        bg: 'var(--status-res-bg)',
        description: 'Your issue has been verified and fully resolved.'
      };
    case 'FAILED':
    case 'ESCALATED':
      return {
        label: 'Escalated',
        badge: '#dc2626',
        bg: '#fee2e2',
        description: 'Escalated to our senior tier operations team for personal handling.'
      };
    default:
      return {
        label: status || 'In Progress',
        badge: 'var(--text-secondary)',
        bg: 'var(--bg-tertiary)',
        description: 'Your case is currently being handled.'
      };
  }
};

// Helper to resolve customer identity from auth session
const resolveCustomerFromUser = (user) => {
  if (!user) return null;
  // Match by customer email or ID
  let customer = db.findOne('customers', c =>
    (c.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
    c.id === user.id ||
    c.id === user.customer_id
  );

  if (!customer) {
    // If not found in seeds, create on the fly so any new registrant has a working customer profile
    customer = db.insert('customers', {
      id: `cust-${uuidv4().slice(0, 8)}`,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      tier: 'Standard',
      company: 'Individual Account',
      phone: '+1 (555) 019-2834',
      created_at: new Date().toISOString()
    });
  }

  return customer;
};

// 1. GET /api/customer/me
export const getCustomerProfile = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const tickets = db.find('tickets', t => t.customer_id === customer.id) || [];
    const orders = db.find('orders', o => o.customer_id === customer.id) || [];

    const stats = {
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'FAILED').length,
      resolvedTickets: tickets.filter(t => t.status === 'RESOLVED').length,
      totalOrders: orders.length
    };

    return res.json({
      customer,
      stats
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET /api/customer/tickets
export const getCustomerTickets = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const tickets = db.find('tickets', t => t.customer_id === customer.id) || [];

    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const sanitizedTickets = tickets.map(ticket => {
      const order = ticket.order_id ? db.findById('orders', ticket.order_id) : null;
      const statusInfo = getCustomerSafeStatus(ticket.status);

      return {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category || 'General Issue',
        priority: ticket.priority,
        status: ticket.status,
        customerSafeStatus: statusInfo,
        order: order ? { id: order.id, productName: order.product_name, amount: order.amount } : null,
        created_at: ticket.created_at,
        customer_response: ticket.customer_response,
        resolution_summary: ticket.status === 'RESOLVED' ? ticket.resolution_summary : null
      };
    });

    return res.json(sanitizedTickets);
  } catch (err) {
    next(err);
  }
};

// 3. POST /api/customer/tickets
export const createCustomerTicket = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const { title, description, category, order_id, preferred_contact } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({ error: 'Issue subject must be at least 3 characters.' });
    }
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please describe the issue in at least 5 characters.' });
    }

    // Verify order belongs to customer if provided
    let verifiedOrderId = null;
    if (order_id) {
      const order = db.findById('orders', order_id);
      if (order && order.customer_id === customer.id) {
        verifiedOrderId = order.id;
      }
    }

    const ticketId = `tkt-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket = db.insert('tickets', {
      id: ticketId,
      title: title.trim(),
      description: description.trim(),
      customer_id: customer.id,
      order_id: verifiedOrderId,
      priority: category === 'damaged_product' || category === 'missing_item' ? 'high' : 'medium',
      category: category || 'general',
      status: 'OPEN',
      created_at: new Date().toISOString()
    });

    // Record safe audit log
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'CUSTOMER_TICKET_CREATED',
      agent: 'CustomerPortal',
      description: `Customer ${customer.name} raised issue #${ticketId}: "${newTicket.title}"`,
      metadata: { category: newTicket.category, orderId: verifiedOrderId }
    });

    // Dispatch automated confirmation email (safely non-blocking)
    try {
      await emailService.notifyTaskStarted({
        ticket: newTicket,
        customer,
        issueSummary: newTicket.description
      });
    } catch (emailErr) {
      console.warn('[EMAIL] Automated task started email notice:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Issue submitted successfully.',
      ticket: {
        id: newTicket.id,
        title: newTicket.title,
        status: newTicket.status,
        customerSafeStatus: getCustomerSafeStatus(newTicket.status),
        created_at: newTicket.created_at
      }
    });
  } catch (err) {
    next(err);
  }
};

// 4. GET /api/customer/tickets/:id
export const getCustomerTicketById = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const { id: ticketId } = req.params;

    const ticket = db.findById('tickets', ticketId);
    if (!ticket) {
      return res.status(404).json({ error: `Ticket #${ticketId} not found` });
    }

    // Authorization check: Customer can only view their own ticket
    if (ticket.customer_id !== customer.id) {
      return res.status(403).json({ error: 'Access denied: You can only view tickets linked to your account.' });
    }

    const order = ticket.order_id ? db.findById('orders', ticket.order_id) : null;
    const statusInfo = getCustomerSafeStatus(ticket.status);

    return res.json({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      customerSafeStatus: statusInfo,
      order: order ? {
        id: order.id,
        productName: order.product_name,
        amount: order.amount,
        status: order.status,
        deliveryDate: order.delivery_date
      } : null,
      created_at: ticket.created_at,
      customer_response: ticket.customer_response,
      resolution_summary: ticket.status === 'RESOLVED' ? ticket.resolution_summary : null
    });
  } catch (err) {
    next(err);
  }
};

// 5. GET /api/customer/tickets/:id/timeline
export const getCustomerTicketTimeline = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const { id: ticketId } = req.params;

    const ticket = db.findById('tickets', ticketId);
    if (!ticket) {
      return res.status(404).json({ error: `Ticket #${ticketId} not found` });
    }

    if (ticket.customer_id !== customer.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const auditLogs = db.find('audit_logs', l => l.ticket_id === ticketId) || [];
    const timeline = [];

    // Milestone 1: Issue Submitted
    timeline.push({
      id: 'step-1',
      title: 'Issue Received',
      description: `Your request was logged and placed in the ResolveAI autonomous queue.`,
      timestamp: ticket.created_at,
      completed: true
    });

    const hasTriage = auditLogs.some(l => l.event_type.includes('TRIAGE'));
    const hasInvest = auditLogs.some(l => l.event_type.includes('INVESTIGATION'));
    const hasPolicy = auditLogs.some(l => l.event_type.includes('POLICY'));
    const hasApproval = auditLogs.some(l => l.event_type.includes('APPROVAL'));
    const hasAction = auditLogs.some(l => l.event_type.includes('REPLACEMENT') || l.event_type.includes('ACTION'));
    const isResolved = ticket.status === 'RESOLVED';

    if (hasTriage || hasInvest) {
      const invLog = auditLogs.find(l => l.event_type.includes('INVESTIGATION'));
      timeline.push({
        id: 'step-2',
        title: 'Investigation Completed',
        description: 'Order delivery verification and item history checked against warehouse telemetry.',
        timestamp: invLog?.created_at || ticket.created_at,
        completed: true
      });
    }

    if (hasPolicy) {
      const polLog = auditLogs.find(l => l.event_type.includes('POLICY'));
      timeline.push({
        id: 'step-3',
        title: 'Warranty & Policy Evaluated',
        description: 'Case audited against consumer warranty rules and damage replacement eligibility.',
        timestamp: polLog?.created_at || ticket.created_at,
        completed: true
      });
    }

    if (hasApproval) {
      timeline.push({
        id: 'step-4',
        title: 'Solution Under Operational Review',
        description: 'A supervisor gate was evaluated to authorize warranty fulfillment.',
        timestamp: new Date(new Date(ticket.created_at).getTime() + 60000).toISOString(),
        completed: hasAction || isResolved
      });
    }

    if (hasAction) {
      timeline.push({
        id: 'step-5',
        title: 'Fulfillment Action Executed',
        description: 'Replacement unit authorized and logistics dispatch order generated.',
        timestamp: new Date(new Date(ticket.created_at).getTime() + 120000).toISOString(),
        completed: true
      });
    }

    if (isResolved) {
      timeline.push({
        id: 'step-6',
        title: 'Issue Verified & Resolved',
        description: ticket.resolution_summary || 'All verification gates passed. Case closed successfully.',
        timestamp: new Date(new Date(ticket.created_at).getTime() + 180000).toISOString(),
        completed: true
      });
    }

    return res.json(timeline);
  } catch (err) {
    next(err);
  }
};

// 6. GET /api/customer/orders
export const getCustomerOrders = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const orders = db.find('orders', o => o.customer_id === customer.id) || [];
    const tickets = db.find('tickets', t => t.customer_id === customer.id) || [];

    const result = orders.map(order => {
      const relatedTickets = tickets
        .filter(t => t.order_id === order.id)
        .map(t => ({ id: t.id, title: t.title, status: t.status }));

      return {
        id: order.id,
        productName: order.product_name,
        amount: Number(order.amount).toFixed(2),
        status: order.status,
        deliveryDate: order.delivery_date,
        items: [
          { name: order.product_name, quantity: 1, price: Number(order.amount).toFixed(2) }
        ],
        relatedTickets
      };
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

// 7. GET /api/customer/notifications
export const getCustomerNotifications = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const emails = db.find('email_notifications', e => e.recipient === customer.email || e.customer_id === customer.id) || [];

    emails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const notifications = emails.map(email => ({
      id: email.id,
      ticketId: email.ticket_id,
      title: email.subject,
      eventType: email.event_type,
      status: email.status,
      timestamp: email.sent_at || email.created_at
    }));

    return res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// 8. POST /api/customer/chat (AI Customer Support Assistant)
export const customerChat = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const tickets = db.find('tickets', t => t.customer_id === customer.id) || [];
    const orders = db.find('orders', o => o.customer_id === customer.id) || [];

    // Contextual dossier for authenticated customer only
    const customerContext = {
      customerName: customer.name,
      tier: customer.tier,
      orders: orders.map(o => ({
        id: o.id,
        product: o.product_name,
        amount: `$${o.amount}`,
        status: o.status,
        delivered: o.delivery_date
      })),
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.title,
        status: getCustomerSafeStatus(t.status).label,
        resolution: t.status === 'RESOLVED' ? t.resolution_summary : null,
        customerResponse: t.customer_response
      }))
    };

    let reply = '';
    const suggestedActions = [];

    // Default suggested actions
    if (tickets.length > 0) {
      suggestedActions.push(`Status of #${tickets[0].id}`);
    }
    suggestedActions.push('View my orders');
    suggestedActions.push('Raise an issue');

    // Attempt Gemini call with strict hallucination guardrails
    if (config.geminiApiKey) {
      try {
        const prompt = `You are ResolveAI's friendly, concise, and trustworthy Customer Support AI Assistant.
You are assisting ${customer.name}.
CRITICAL DATA PRIVACY & SAFETY RULES:
1. You ONLY have access to the verified customer records provided below.
2. NEVER mention internal agent reasoning, prompts, raw database keys, or supervisor approval discussions.
3. NEVER invent tracking IDs, refund amounts, delivery dates, or policies not in the dossier.
4. If the user asks about something not in their dossier, politely state: "I don't have enough verified information about that on file, but I would be glad to help you raise a new support issue."
5. Keep your tone empathetic, clear, calm, and professional (Apple-like simplicity).

VERIFIED CUSTOMER DOSSIER:
${JSON.stringify(customerContext, null, 2)}

CUSTOMER QUESTION:
"${message}"

Respond directly to the customer in 2 to 4 concise sentences:`;

        const generated = await aiService.generateText({ prompt });
        if (generated) {
          reply = generated;
        }
      } catch (geminiErr) {
        console.warn('[CHATBOT] Gemini fallback notice:', geminiErr.message);
      }
    }

    // Deterministic fallback if Gemini is rate limited (e.g. 429) or offline
    if (!reply) {
      const lower = message.toLowerCase();
      if (lower.includes('status') || lower.includes('ticket') || lower.includes('headphones') || lower.includes('issue')) {
        if (tickets.length > 0) {
          const t = tickets[0];
          const st = getCustomerSafeStatus(t.status);
          reply = `Your ticket #${t.id} ("${t.title}") is currently marked as ${st.label}. ${st.description}`;
        } else {
          reply = `You currently have no open support tickets. If you are experiencing an issue with a recent order, feel free to use the "Raise an Issue" button.`;
        }
      } else if (lower.includes('order') || lower.includes('item') || lower.includes('delivery')) {
        if (orders.length > 0) {
          const o = orders[0];
          reply = `Your most recent order is #${o.id} for "${o.product_name}" (${o.status}). Delivery date: ${new Date(o.delivery_date).toLocaleDateString()}.`;
        } else {
          reply = `We could not find any active orders linked to your profile at this moment.`;
        }
      } else if (lower.includes('replacement') || lower.includes('refund')) {
        const resolved = tickets.find(t => t.status === 'RESOLVED');
        if (resolved) {
          reply = `Regarding your replacement request for ticket #${resolved.id}: it has been approved and verified. ${resolved.resolution_summary || 'Your replacement shipment is on its way.'}`;
        } else {
          reply = `Our replacement policy covers items reported damaged within 14 days of delivery. Our automated agents and operations team will evaluate warranty eligibility once you raise an issue.`;
        }
      } else {
        reply = `Hello ${customer.name}! I am your ResolveAI Support Assistant. I can help you check the status of your tickets, review recent orders, or explain our return and warranty policies. How can I assist you today?`;
      }
    }

    return res.json({
      reply,
      suggestedActions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

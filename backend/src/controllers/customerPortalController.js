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
  // Match by customer user_id first, then email or ID
  let customer = db.findOne('customers', c =>
    c.user_id === user.id ||
    (c.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
    c.id === user.id ||
    c.id === user.customer_id
  );

  if (!customer) {
    // If not found, create on the fly and link directly to user.id
    customer = db.insert('customers', {
      id: `cust-${uuidv4().slice(0, 8)}`,
      user_id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      tier: 'Standard',
      company: 'Individual Account',
      phone: user.phone || '+1 (555) 019-2834',
      created_at: new Date().toISOString()
    });
  } else if (!customer.user_id && user.id) {
    db.update('customers', customer.id, { user_id: user.id });
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

// 2. GET /api/customer/tickets (or /api/customer/issues)
export const getCustomerTickets = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized: Unable to resolve customer identity.' });
    }

    const tickets = db.find('tickets', t => t.customer_id === customer.id) || [];
    tickets.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const sanitizedTickets = tickets.map(ticket => {
      const order = ticket.order_id ? db.findById('orders', ticket.order_id) : null;
      const statusInfo = getCustomerSafeStatus(ticket.status);

      return {
        id: ticket.id,
        title: ticket.title,
        subject: ticket.title,
        description: ticket.description,
        category: ticket.category || 'General Issue',
        priority: ticket.priority || 'medium',
        status: ticket.status,
        customerSafeStatus: statusInfo,
        order: order
          ? {
              id: order.id,
              productName: order.product_name,
              amount: order.amount,
              status: order.status
            }
          : null,
        orderId: ticket.order_id || null,
        order_id: ticket.order_id || null,
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

// 3. POST /api/customer/tickets (or /api/customer/issues)
export const createCustomerTicket = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized: Unable to resolve customer account.' });
    }

    const {
      title,
      subject,
      description,
      category = 'general',
      priority,
      order_id,
      orderId,
      preferred_contact
    } = req.body;

    const effectiveTitle = (title || subject || '').trim();
    const effectiveOrderId = order_id || orderId || null;

    if (!effectiveTitle || effectiveTitle.length < 3) {
      return res.status(400).json({ error: 'Issue subject must be at least 3 characters.' });
    }
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please describe the issue in at least 5 characters.' });
    }

    // Verify order ownership strictly: return 403 Forbidden if order belongs to another customer
    let verifiedOrderId = null;
    if (effectiveOrderId) {
      const order = db.findById('orders', effectiveOrderId);
      if (!order) {
        return res.status(404).json({ error: `Order #${effectiveOrderId} was not found.` });
      }
      if (order.customer_id !== customer.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to attach this order.' });
      }
      verifiedOrderId = order.id;
    }

    const ticketId = `tkt-${Math.floor(100 + Math.random() * 900)}`;
    const effectivePriority = priority || (category === 'damaged_product' || category === 'missing_item' ? 'high' : 'medium');

    const newTicket = db.insert('tickets', {
      id: ticketId,
      title: effectiveTitle,
      description: description.trim(),
      customer_id: customer.id,
      order_id: verifiedOrderId,
      priority: effectivePriority,
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

    // Create an in-portal notification for the customer
    db.insert('email_notifications', {
      id: `notif-${uuidv4().slice(0, 8)}`,
      ticket_id: ticketId,
      customer_id: customer.id,
      event_type: 'TICKET_CREATED',
      recipient: customer.email,
      subject: `Support Ticket #${ticketId} Received: ${effectiveTitle}`,
      body_text: `Your support request regarding "${effectiveTitle}" has been received and queued for investigation.`,
      status: 'SENT',
      sent_at: new Date().toISOString()
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
        subject: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: newTicket.status,
        customerSafeStatus: getCustomerSafeStatus(newTicket.status),
        orderId: verifiedOrderId,
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

// 7. GET /api/customer/notifications (or /api/notifications)
export const getCustomerNotifications = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const emails = db.find('email_notifications', e =>
      (e.recipient && e.recipient.toLowerCase() === customer.email.toLowerCase()) ||
      e.customer_id === customer.id
    ) || [];

    emails.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const notifications = emails.map(email => ({
      id: email.id,
      ticketId: email.ticket_id,
      title: email.subject,
      subject: email.subject,
      message: email.body_text || email.subject,
      eventType: email.event_type,
      status: email.status,
      read: Boolean(email.read || email.is_read),
      is_read: Boolean(email.read || email.is_read),
      timestamp: email.sent_at || email.created_at,
      created_at: email.created_at
    }));

    return res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// 7b. PATCH /api/customer/notifications/:id/read (or /api/notifications/:id/read)
export const markNotificationRead = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const { id } = req.params;

    const notif = db.findById('email_notifications', id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify ownership
    if (
      notif.customer_id &&
      notif.customer_id !== customer.id &&
      notif.recipient.toLowerCase() !== customer.email.toLowerCase()
    ) {
      return res.status(403).json({ error: 'Forbidden: Notification does not belong to your account' });
    }

    const updated = db.update('email_notifications', id, {
      read: true,
      is_read: true
    });

    return res.json({
      success: true,
      notification: {
        id: updated.id,
        read: true,
        is_read: true
      }
    });
  } catch (err) {
    next(err);
  }
};

// 7c. POST /api/customer/notifications/mark-all-read (or /api/notifications/read-all)
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const notifs = db.find('email_notifications', e =>
      (e.recipient && e.recipient.toLowerCase() === customer.email.toLowerCase()) ||
      e.customer_id === customer.id
    ) || [];

    for (const n of notifs) {
      if (!n.read) {
        db.update('email_notifications', n.id, {
          read: true,
          is_read: true
        });
      }
    }

    return res.json({ success: true, message: 'All notifications marked as read' });
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

// 8. PATCH /api/customer/preferences
export const updateCustomerPreferences = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);
    const {
      name,
      phone,
      voice_updates_enabled,
      voice_update_frequency,
      voice_call_start,
      voice_call_end,
      timezone,
      email_notifications,
      resolution_alerts
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (voice_updates_enabled !== undefined) updates.voice_updates_enabled = Boolean(voice_updates_enabled);
    if (voice_update_frequency !== undefined) updates.voice_update_frequency = voice_update_frequency;
    if (voice_call_start !== undefined) updates.voice_call_start = voice_call_start;
    if (voice_call_end !== undefined) updates.voice_call_end = voice_call_end;
    if (timezone !== undefined) updates.timezone = timezone;
    if (email_notifications !== undefined) updates.email_notifications = Boolean(email_notifications);
    if (resolution_alerts !== undefined) updates.resolution_alerts = Boolean(resolution_alerts);

    const updatedCustomer = db.update('customers', customer.id, updates);

    // Sync user record if authenticated
    if (req.user?.id) {
      db.update('users', req.user.id, updates);
    }

    return res.json({
      success: true,
      message: 'Preferences updated successfully.',
      customer: updatedCustomer
    });
  } catch (err) {
    next(err);
  }
};

// 9. DELETE /api/customer/account
export const deleteCustomerAccount = async (req, res, next) => {
  try {
    const customer = resolveCustomerFromUser(req.user);

    db.remove('customers', customer.id);
    if (req.user?.id) {
      db.remove('users', req.user.id);
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};


import { db } from '../db/store.js';
import { emailService } from '../services/emailService.js';
import { SendCustomerEmailSchema } from '../validators/index.js';

// 1. GET /api/emails/status (Admin & Operations System Status)
export const getEmailStatus = async (req, res, next) => {
  try {
    const status = emailService.getStatus();
    return res.json(status);
  } catch (err) {
    next(err);
  }
};

// 2. POST /api/emails/test (Protected Admin-Only Test Dispatch)
export const sendTestEmail = async (req, res, next) => {
  try {
    // Only send to the authenticated admin's verified email address
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authenticated administrator account required.' });
    }

    const customRecipient = req.body?.to || req.body?.targetRecipient;
    const targetRecipient = (customRecipient && typeof customRecipient === 'string' && customRecipient.includes('@'))
      ? customRecipient.trim()
      : req.user.email;

    const result = await emailService.sendTestEmail({ 
      adminUser: req.user,
      targetRecipient
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error || 'Failed to dispatch test verification email through configured provider.',
        status: result.status
      });
    }

    return res.json({
      success: true,
      message: `Test email successfully dispatched to ${targetRecipient}`,
      recipient: targetRecipient,
      providerMessageId: result.messageId,
      notificationId: result.notificationId,
      status: result.status
    });
  } catch (err) {
    next(err);
  }
};

// 3. GET /api/emails/logs (Admin & Supervisor Email Delivery Log)
export const getEmailLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const notifications = db.find('email_notifications') || [];

    // Sort descending by created_at
    const sorted = [...notifications].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Sanitize records (never leak internal secrets)
    const sanitized = sorted.slice(0, limit).map(n => ({
      id: n.id,
      ticket_id: n.ticket_id,
      customer_id: n.customer_id,
      event_type: n.event_type,
      recipient: n.recipient,
      subject: n.subject,
      provider: n.provider,
      provider_message_id: n.provider_message_id,
      status: n.status,
      attempt_count: n.attempt_count,
      error_message: n.error_message,
      sent_at: n.sent_at,
      created_at: n.created_at
    }));

    return res.json(sanitized);
  } catch (err) {
    next(err);
  }
};

// 4. POST /api/tickets/:id/send-update (Manual Customer Care Dispatch)
export const sendTicketUpdateEmail = async (req, res, next) => {
  try {
    const { id: ticketId } = req.params;
    const validated = SendCustomerEmailSchema.parse(req.body);

    const ticket = db.findById('tickets', ticketId);
    if (!ticket) {
      return res.status(404).json({ error: `Ticket #${ticketId} not found` });
    }

    const customer = ticket.customer_id ? db.findById('customers', ticket.customer_id) : null;
    if (!customer) {
      return res.status(400).json({ error: 'Cannot send update: No customer record linked to this ticket.' });
    }

    if (!customer.email) {
      return res.status(400).json({ error: 'Cannot send update: Customer does not have a registered email address.' });
    }

    if (validated.recipient && validated.recipient.toLowerCase().trim() !== customer.email.toLowerCase().trim()) {
      return res.status(400).json({
        error: `Unauthorized recipient address. Updates for Case #${ticketId} can only be dispatched to the customer on record (<${customer.email}>).`
      });
    }

    const result = await emailService.sendManualUpdate({
      ticket,
      customer,
      customSubject: validated.subject,
      message: validated.message,
      senderUser: req.user
    });

    return res.status(200).json({
      success: result.success,
      status: result.status,
      messageId: result.messageId,
      notificationId: result.notificationId,
      recipient: customer.email
    });
  } catch (err) {
    next(err);
  }
};

// 5. GET /api/tickets/:id/emails (Emails linked to ticket)
export const getTicketEmails = async (req, res, next) => {
  try {
    const { id: ticketId } = req.params;
    const ticket = db.findById('tickets', ticketId);
    if (!ticket) {
      return res.status(404).json({ error: `Ticket #${ticketId} not found` });
    }

    const emails = db.find('email_notifications', e => e.ticket_id === ticketId);
    emails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json(emails);
  } catch (err) {
    next(err);
  }
};

// 6. POST /api/emails/:id/retry (Controlled retry for failed notification)
export const retryEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await emailService.retryEmail(id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

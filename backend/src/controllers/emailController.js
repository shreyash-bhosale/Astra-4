import { db } from '../db/store.js';
import { emailService } from '../services/emailService.js';
import { SendCustomerEmailSchema } from '../validators/index.js';

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

export const retryEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await emailService.retryEmail(id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

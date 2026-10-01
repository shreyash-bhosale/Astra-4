import { db } from '../db/store.js';

export const listActivity = async (req, res, next) => {
  try {
    const logs = db.find('audit_logs');
    const populated = logs.map(l => {
      const ticket = l.ticket_id ? db.findById('tickets', l.ticket_id) : null;
      return {
        ...l,
        ticket: ticket ? { id: ticket.id, title: ticket.title, status: ticket.status } : null
      };
    });
    populated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(populated);
  } catch (err) {
    next(err);
  }
};

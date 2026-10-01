import { db } from '../db/store.js';
import { config } from '../config/env.js';

export const getHealth = (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ResolveAI Backend API',
    version: '1.0.0',
    geminiConfigured: !!config.geminiApiKey,
    geminiModel: config.geminiModel,
    supabaseConfigured: !!config.supabaseUrl
  });
};

export const getSettings = (req, res) => {
  const usersCount = db.find('users').length;
  const ticketsCount = db.find('tickets').length;
  const policiesCount = db.find('policies').length;
  const approvalsCount = db.find('approvals').length;

  return res.json({
    geminiModel: config.geminiModel,
    hasApiKey: !!config.geminiApiKey,
    maxAgentSteps: 10,
    maxRetries: 2,
    approvalPolicy: 'Strict Safety Gate (Physical replacements & refunds require human review)',
    stats: {
      usersCount,
      ticketsCount,
      policiesCount,
      approvalsCount
    }
  });
};

export const resetDatabase = (req, res) => {
  db.reset();
  return res.json({
    success: true,
    message: 'Database reset to initial demo seeds.'
  });
};

export const globalSearch = (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json({ tickets: [], customers: [], orders: [], approvals: [] });
  }

  const tickets = (db.find('tickets') || [])
    .filter(t => t.id.toLowerCase().includes(query) || t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query)))
    .slice(0, 6)
    .map(t => ({ id: t.id, title: t.title, status: t.status, category: t.category }));

  const customers = (db.find('customers') || [])
    .filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query) || (c.company && c.company.toLowerCase().includes(query)))
    .slice(0, 6)
    .map(c => ({ id: c.id, name: c.name, email: c.email, company: c.company, tier: c.tier }));

  const orders = (db.find('orders') || [])
    .filter(o => o.id.toLowerCase().includes(query) || o.product_name.toLowerCase().includes(query))
    .slice(0, 6)
    .map(o => ({ id: o.id, productName: o.product_name, amount: o.amount, status: o.status }));

  const approvals = (db.find('approvals') || [])
    .filter(a => a.id.toLowerCase().includes(query) || a.action.toLowerCase().includes(query) || (a.reason && a.reason.toLowerCase().includes(query)))
    .slice(0, 6)
    .map(a => ({ id: a.id, action: a.action, status: a.status, ticketId: a.ticket_id }));

  return res.json({ tickets, customers, orders, approvals });
};

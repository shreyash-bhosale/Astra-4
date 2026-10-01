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

  const defaultWorkspace = {
    id: 'ws-default',
    orgName: 'ResolveAI Operations',
    publicEmail: 'support@resolveai.io',
    description: 'Autonomous customer operations and intelligent resolution workspace.',
    websiteUrl: 'https://resolveai.io',
    location: 'San Francisco, CA',
    maxAgentSteps: 10,
    safetyGateMode: 'Strict Human-in-the-Loop',
    notifications: {
      inApp: true,
      email: true,
      voice: false
    }
  };

  const stored = db.findById('workspace_settings', 'ws-default') || defaultWorkspace;

  return res.json({
    geminiModel: config.geminiModel,
    hasApiKey: !!config.geminiApiKey,
    maxAgentSteps: stored.maxAgentSteps || 10,
    maxRetries: 2,
    approvalPolicy: 'Strict Safety Gate (Physical replacements & refunds require human review)',
    workspace: stored,
    stats: {
      usersCount,
      ticketsCount,
      policiesCount,
      approvalsCount
    }
  });
};

export const updateSettings = (req, res) => {
  const updates = req.body || {};
  let current = db.findById('workspace_settings', 'ws-default');
  if (!current) {
    current = db.insert('workspace_settings', {
      id: 'ws-default',
      orgName: updates.orgName || 'ResolveAI Operations',
      publicEmail: updates.publicEmail || 'support@resolveai.io',
      description: updates.description || 'Autonomous customer operations and intelligent resolution workspace.',
      websiteUrl: updates.websiteUrl || 'https://resolveai.io',
      location: updates.location || 'San Francisco, CA',
      maxAgentSteps: Number(updates.maxAgentSteps) || 10,
      safetyGateMode: updates.safetyGateMode || 'Strict Human-in-the-Loop',
      notifications: updates.notifications || { inApp: true, email: true, voice: false },
      updated_at: new Date().toISOString()
    });
  } else {
    current = db.update('workspace_settings', 'ws-default', {
      ...updates,
      updated_at: new Date().toISOString()
    });
  }
  return res.json({ success: true, settings: current });
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

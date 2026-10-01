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

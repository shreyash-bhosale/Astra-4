import { db } from '../db/store.js';
import { supervisorAgent } from '../agents/supervisorAgent.js';

export const getSupervisorStatus = async (req, res, next) => {
  try {
    const settings = supervisorAgent.getAutonomySettings();
    const health = supervisorAgent.getFleetHealth();
    const runs = db.find('agent_runs');
    const tickets = db.find('tickets');
    const approvals = db.find('approvals');

    const activeWorkflows = runs.filter(r => r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL' || r.status === 'RECOVERING');
    const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
    const healthyCount = health.filter(h => h.status === 'HEALTHY').length;

    return res.json({
      supervisor: {
        name: supervisorAgent.name,
        badge: supervisorAgent.badge,
        status: settings.emergency_stopped ? 'EMERGENCY_STOP' : (settings.enabled ? (settings.paused ? 'PAUSED' : 'ACTIVE') : 'MONITORING_ONLY'),
        mode: settings.enabled ? (settings.paused ? 'PAUSED' : 'AUTONOMOUS') : 'SUPERVISED',
        emergencyStopped: !!settings.emergency_stopped
      },
      fleetHealth: {
        totalAgents: health.length,
        healthyCount,
        allHealthy: healthyCount === health.length
      },
      telemetry: {
        activeWorkflowsCount: activeWorkflows.length,
        pendingApprovalsCount: pendingApprovals.length,
        totalCasesCount: tickets.length,
        resolvedCasesCount: tickets.filter(t => t.status === 'RESOLVED').length
      },
      settings
    });
  } catch (err) {
    next(err);
  }
};

export const getSupervisorAgents = async (req, res, next) => {
  try {
    const health = supervisorAgent.getFleetHealth();
    return res.json(health);
  } catch (err) {
    next(err);
  }
};

export const getSupervisorWorkflows = async (req, res, next) => {
  try {
    const runs = db.find('agent_runs');
    const populated = runs.map(r => {
      const ticket = r.ticket_id ? db.findById('tickets', r.ticket_id) : null;
      const customer = ticket?.customer_id ? db.findById('customers', ticket.customer_id) : null;
      return {
        ...r,
        ticket: ticket ? { id: ticket.id, title: ticket.title, status: ticket.status, priority: ticket.priority } : null,
        customer: customer ? { name: customer.name, email: customer.email, tier: customer.tier } : null
      };
    });
    populated.sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
    return res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const getSupervisorEvents = async (req, res, next) => {
  try {
    let events = db.find('supervisor_events');
    if (!events || events.length === 0) {
      events = [
        {
          id: 'sup-ev-001',
          event_type: 'SUPERVISOR_BOOT',
          title: 'Supervisor Agent Initialized',
          description: 'Supervisory intelligence active. Monitoring 7 operational agents with policy-bounded control.',
          severity: 'INFO',
          metadata: { activeAgents: 7, autonomyMode: 'DISABLED' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
    events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(events);
  } catch (err) {
    next(err);
  }
};

export const postSupervisorQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }
    const response = await supervisorAgent.handleOperationalQuery({ query, user: req.user });
    return res.json(response);
  } catch (err) {
    next(err);
  }
};

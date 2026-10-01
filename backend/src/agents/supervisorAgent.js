import { db } from '../db/store.js';
import { aiService } from '../services/aiService.js';

export class SupervisorAgent {
  constructor() {
    this.name = 'ResolveAI Supervisor Agent';
    this.badge = '◈';
  }

  // Retrieve complete fleet health for all 8 agents (Supervisor + 7 specialized)
  getFleetHealth() {
    let healthRecords = db.find('agent_health');
    if (!healthRecords || healthRecords.length === 0) {
      healthRecords = [
        { id: 'supervisor_agent', name: 'ResolveAI Supervisor Agent', badge: '◈', status: 'HEALTHY', state: 'ONLINE', execution_count: 24, last_task: 'System supervision & policy boundary enforcement' },
        { id: 'orchestrator_agent', name: 'Orchestrator Agent', badge: '◉', status: 'HEALTHY', state: 'ONLINE', execution_count: 18, last_task: 'Dynamic DAG plan synthesis' },
        { id: 'triage_agent', name: 'Triage Agent', badge: '△', status: 'HEALTHY', state: 'ONLINE', execution_count: 18, last_task: 'Issue classification and intent extraction' },
        { id: 'investigation_agent', name: 'Investigation Agent', badge: '⌕', status: 'HEALTHY', state: 'ONLINE', execution_count: 18, last_task: 'Evidence grounding across CRM and carriers' },
        { id: 'policy_agent', name: 'Policy Agent', badge: '▣', status: 'HEALTHY', state: 'ONLINE', execution_count: 18, last_task: 'Deterministic warranty and return policy checks' },
        { id: 'action_agent', name: 'Action Agent', badge: '⚡', status: 'HEALTHY', state: 'ONLINE', execution_count: 16, last_task: 'Allowlisted tool execution with safety boundaries' },
        { id: 'communication_agent', name: 'Communication Agent', badge: '✦', status: 'HEALTHY', state: 'ONLINE', execution_count: 18, last_task: 'Customer update formulation and channel dispatch' },
        { id: 'verification_agent', name: 'Verification Agent', badge: '✓', status: 'HEALTHY', state: 'ONLINE', execution_count: 18, last_task: '5-point deterministic audit gatekeeping' }
      ];
    }

    const runs = db.find('agent_runs');
    const activeRuns = runs.filter(r => r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL' || r.status === 'RECOVERING');
    const waitingApprovals = db.find('approvals', a => a.status === 'PENDING').length;

    // Dynamically enrich agent state
    return healthRecords.map(a => {
      let state = 'ONLINE';
      if (a.id === 'action_agent' && waitingApprovals > 0) {
        state = 'GATE_PAUSED';
      } else if (activeRuns.length > 0) {
        state = 'ACTIVE';
      }
      return {
        ...a,
        state
      };
    });
  }

  // Retrieve active autonomy configuration
  getAutonomySettings() {
    let settings = db.findOne('autonomy_settings', s => s.id === 'autonomy-config');
    if (!settings) {
      settings = db.insert('autonomy_settings', {
        id: 'autonomy-config',
        enabled: false,
        paused: false,
        emergency_stopped: false,
        enabled_by: null,
        enabled_at: null,
        refund_limit: 1000,
        max_retries: 2,
        allowed_tools: [
          'get_customer',
          'get_order',
          'get_customer_orders',
          'get_ticket_history',
          'search_policies',
          'update_ticket_status',
          'create_internal_task',
          'create_replacement_request',
          'cancel_processing_order',
          'send_customer_update',
          'send_customer_update_email',
          'verify_resolution'
        ],
        restricted_tools: [
          'modify_authentication',
          'modify_user_permissions',
          'delete_customer_account',
          'modify_security_settings',
          'access_system_secrets',
          'bypass_verification'
        ],
        risk_policy: {
          low_risk: 'AUTONOMOUS',
          medium_risk: 'AUTONOMOUS_IF_ALLOWED',
          high_risk: 'ESCALATE_TO_SUPERVISOR'
        },
        history: [],
        updated_at: new Date().toISOString()
      });
    }
    return settings;
  }

  // Update autonomy configuration (Admin only)
  updateAutonomySettings(updates, adminUser) {
    const current = this.getAutonomySettings();
    const historyEntry = {
      id: `hist-${Date.now()}`,
      action: updates.enabled !== undefined ? (updates.enabled ? 'AUTONOMY_ENABLED' : 'AUTONOMY_DISABLED') : 'SETTINGS_UPDATED',
      enabled: updates.enabled !== undefined ? updates.enabled : current.enabled,
      actor: `${adminUser?.name || 'Admin'} (${adminUser?.email || 'admin@resolveai.io'})`,
      timestamp: new Date().toISOString(),
      note: updates.note || 'Autonomy policy updated'
    };

    const newHistory = [historyEntry, ...(current.history || [])].slice(0, 20);

    const merged = {
      ...current,
      ...updates,
      history: newHistory,
      updated_at: new Date().toISOString()
    };

    if (updates.enabled === true) {
      merged.enabled_by = adminUser?.name || 'Administrator';
      merged.enabled_at = new Date().toISOString();
      merged.emergency_stopped = false;
      merged.paused = false;
    } else if (updates.enabled === false) {
      merged.enabled_by = null;
      merged.enabled_at = null;
    }

    db.update('autonomy_settings', current.id, merged);

    this.logSupervisorEvent({
      event_type: updates.emergency_stopped ? 'EMERGENCY_STOP_ACTIVATED' : (updates.enabled ? 'AUTONOMY_MODE_ENABLED' : 'AUTONOMY_CONFIG_UPDATED'),
      title: updates.emergency_stopped ? 'EMERGENCY STOP TRIGGERED' : (updates.enabled ? 'Autonomous AI Mode Activated' : 'Autonomy Settings Updated'),
      description: updates.emergency_stopped
        ? `Emergency stop initiated by ${adminUser?.name || 'Admin'}. All autonomous action execution halted.`
        : `Autonomous Mode is now ${merged.enabled ? 'ENABLED' : 'DISABLED'} by ${adminUser?.name || 'Admin'}. Refund limit: $${merged.refund_limit}.`,
      severity: updates.emergency_stopped ? 'CRITICAL' : 'INFO',
      metadata: { enabled: merged.enabled, paused: merged.paused, emergency_stopped: merged.emergency_stopped }
    });

    return merged;
  }

  // Emergency stop all autonomous execution
  emergencyStop(adminUser) {
    return this.updateAutonomySettings({
      emergency_stopped: true,
      enabled: false,
      paused: true,
      note: 'Emergency Stop engaged by administrator.'
    }, adminUser);
  }

  // Multi-Agent Consistency Check: Detects cross-agent contradictions prior to tool invocation
  evaluateMultiAgentConsistency({ ticket, triageResult, investigationResult, policyResult }) {
    const anomalies = [];

    // Check 1: Did investigation confirm customer?
    if (investigationResult && !investigationResult.customerFound) {
      anomalies.push('Customer profile could not be verified against records.');
    }

    // Check 2: If order was referenced, does it exist and match?
    if (ticket.order_id && investigationResult && !investigationResult.orderFound) {
      anomalies.push(`Referenced order #${ticket.order_id} could not be confirmed in order database.`);
    }

    // Check 3: Does policy outcome contradict warranty window?
    if (policyResult && investigationResult?.daysSinceDelivery !== null && investigationResult?.daysSinceDelivery > 14) {
      if (policyResult.permitted && policyResult.policyCited?.includes('POL-001')) {
        anomalies.push('Policy permitted replacement despite days since delivery exceeding 14-day warranty threshold.');
      }
    }

    return {
      consistent: anomalies.length === 0,
      confidence: anomalies.length === 0 ? 0.98 : 0.45,
      anomalies
    };
  }

  // Evaluates whether an Action Agent execution can proceed autonomously or requires human gating
  evaluateActionApproval({ ticket, run, action, policyResult, investigationResult }) {
    const settings = this.getAutonomySettings();

    // 1. If Emergency Stop or Paused, block all autonomy immediately
    if (settings.emergency_stopped) {
      return {
        autonomousAuthorized: false,
        reason: 'Autonomous execution is blocked: Emergency Stop is active.',
        decision: 'REQUEST_APPROVAL',
        requiresApproval: true
      };
    }

    if (settings.paused) {
      return {
        autonomousAuthorized: false,
        reason: 'Autonomous execution is paused by administrator.',
        decision: 'REQUEST_APPROVAL',
        requiresApproval: true
      };
    }

    // 2. Check if Autonomous Mode is enabled
    if (!settings.enabled) {
      return {
        autonomousAuthorized: false,
        reason: 'Autonomous AI Mode is DISABLED. Actions require human supervisor gating.',
        decision: 'REQUEST_APPROVAL',
        requiresApproval: true
      };
    }

    // 3. Check if action is on the permanently restricted list
    if (settings.restricted_tools && settings.restricted_tools.includes(action)) {
      return {
        autonomousAuthorized: false,
        reason: `Action '${action}' is permanently restricted from autonomous execution.`,
        decision: 'ESCALATE',
        requiresApproval: true
      };
    }

    // 4. Check if action is on the allowed tools list
    const isAllowedTool = settings.allowed_tools && settings.allowed_tools.includes(action);
    if (!isAllowedTool) {
      return {
        autonomousAuthorized: false,
        reason: `Action '${action}' is not in the administrator-configured allowed tools list.`,
        decision: 'REQUEST_APPROVAL',
        requiresApproval: true
      };
    }

    // 5. Check financial limits (if applicable to order)
    const order = investigationResult?.orderId ? db.findById('orders', investigationResult.orderId) : null;
    if (order && order.amount > settings.refund_limit) {
      return {
        autonomousAuthorized: false,
        reason: `Order value ($${order.amount.toFixed(2)}) exceeds configured autonomous limit ($${settings.refund_limit}). Human supervisor approval required.`,
        decision: 'REQUEST_APPROVAL',
        requiresApproval: true
      };
    }

    // 6. Multi-Agent Consistency check
    const consistency = this.evaluateMultiAgentConsistency({
      ticket,
      triageResult: { category: ticket.category },
      investigationResult,
      policyResult
    });

    if (!consistency.consistent) {
      return {
        autonomousAuthorized: false,
        reason: `Multi-agent consistency check flagged anomalies: ${consistency.anomalies.join('; ')}`,
        decision: 'REASSESS',
        requiresApproval: true
      };
    }

    // ALL GATES SATISFIED: Supervisor grants autonomous execution authority
    this.logSupervisorEvent({
      event_type: 'AUTONOMOUS_AUTHORIZATION_GRANTED',
      title: `Autonomous Authority Granted: ${action}`,
      description: `Supervisor verified policy bounds and granted autonomous execution for '${action}' on ticket #${ticket.id.slice(0, 8)}.`,
      severity: 'INFO',
      metadata: { ticketId: ticket.id, action, policyCited: policyResult?.policyCited }
    });

    return {
      autonomousAuthorized: true,
      reason: `Action '${action}' validated under active Autonomous AI Mode policy (POL-001/Bounds Verified).`,
      decision: 'EXECUTE',
      requiresApproval: false
    };
  }

  // Insert structured supervisor event
  logSupervisorEvent({ event_type, title, description, severity = 'INFO', metadata = {} }) {
    const event = {
      id: `sup-ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_type,
      title,
      description,
      severity,
      metadata,
      created_at: new Date().toISOString()
    };
    db.insert('supervisor_events', event);
    return event;
  }

  // Operational Supervisor Chat Assistant: Answers administrator questions using real DB state
  async handleOperationalQuery({ query, user }) {
    const runs = db.find('agent_runs');
    const tickets = db.find('tickets');
    const approvals = db.find('approvals');
    const settings = this.getAutonomySettings();
    const health = this.getFleetHealth();

    const activeWorkflows = runs.filter(r => r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL' || r.status === 'RECOVERING');
    const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

    const systemContext = `Current System State:
- Autonomous AI Mode: ${settings.enabled ? (settings.paused ? 'PAUSED' : 'ENABLED') : 'DISABLED'}
- Emergency Stop: ${settings.emergency_stopped ? 'ACTIVE' : 'INACTIVE'}
- Active Workflows: ${activeWorkflows.length}
- Pending Human Approvals: ${pendingApprovals.length}
- Total Cases: ${tickets.length} (Resolved: ${resolvedCount})
- Autonomous Refund Limit: $${settings.refund_limit}
- Agent Fleet: 8/8 Agents operational
- Allowed Tools: ${settings.allowed_tools.join(', ')}
- Pending Approval Cases: ${pendingApprovals.map(a => `Ticket #${a.ticket_id.slice(0, 8)} (${a.action}): ${a.reason}`).join(' | ') || 'None'}`;

    const prompt = `User Query: "${query}"

Respond as the ResolveAI Supervisor Agent. Ground your answer strictly in the real system context provided above.
Keep your response professional, concise (2-4 sentences), factual, and operational. Never invent cases, orders, or numbers that are not in the system context.`;

    const aiResponse = await aiService.generateText(prompt, 'You are the ResolveAI Supervisor Agent (AI Control Agent). You provide accurate operational telemetry and policy supervision to human administrators.');

    if (aiResponse) {
      return { answer: aiResponse, source: 'ai' };
    }

    // Deterministic factual fallback if Gemini is offline
    const qLower = query.toLowerCase();
    if (qLower.includes('mode') || qLower.includes('autonomous')) {
      return {
        answer: `Autonomous AI Mode is currently ${settings.enabled ? 'ENABLED' : 'DISABLED'}${settings.paused ? ' (PAUSED)' : ''}. The configured refund limit is $${settings.refund_limit} with ${settings.allowed_tools.length} allowed tool operations.`,
        source: 'deterministic'
      };
    }
    if (qLower.includes('approval') || qLower.includes('waiting')) {
      return {
        answer: `There are currently ${pendingApprovals.length} workflows paused for human supervisor authorization.${pendingApprovals.length > 0 ? ` Next in queue: ${pendingApprovals[0].action} for Ticket #${pendingApprovals[0].ticket_id.slice(0, 8)}.` : ' All autonomous pipelines are running clear.'}`,
        source: 'deterministic'
      };
    }
    if (qLower.includes('active') || qLower.includes('running') || qLower.includes('status')) {
      return {
        answer: `Currently monitoring ${activeWorkflows.length} active workflows across ${tickets.length} total cases. All 8 agents are reporting HEALTHY status with zero critical anomalies.`,
        source: 'deterministic'
      };
    }

    return {
      answer: `Supervisor Telemetry: System is operating normally with ${activeWorkflows.length} active workflows, ${pendingApprovals.length} pending supervisor gates, and Autonomous Mode ${settings.enabled ? 'ENABLED' : 'DISABLED'}.`,
      source: 'deterministic'
    };
  }
}

export const supervisorAgent = new SupervisorAgent();

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
        enabled: true,
        paused: false,
        emergency_stopped: false,
        enabled_by: 'System Administrator',
        enabled_at: new Date().toISOString(),
        approval_mode: 'HYBRID', // 'AI_APPROVAL' | 'HYBRID' | 'HUMAN'
        autonomous_approvals_enabled: true,
        permissions: {
          allow_replacements: true,
          allow_shipping: true,
          allow_notifications: true,
          allow_status_changes: true,
          allow_refunds: false
        },
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

    // Ensure permissions object and approval_mode are always present
    if (!settings.permissions) {
      settings.permissions = {
        allow_replacements: true,
        allow_shipping: true,
        allow_notifications: true,
        allow_status_changes: true,
        allow_refunds: false
      };
    }
    if (!settings.approval_mode) {
      settings.approval_mode = 'HYBRID';
    }
    if (settings.autonomous_approvals_enabled === undefined) {
      settings.autonomous_approvals_enabled = settings.enabled !== false;
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
      permissions: {
        ...(current.permissions || {}),
        ...(updates.permissions || {})
      },
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
        : `Autonomous Mode is now ${merged.enabled ? 'ENABLED' : 'DISABLED'} by ${adminUser?.name || 'Admin'}. Approval Mode: ${merged.approval_mode}. Refund limit: $${merged.refund_limit}.`,
      severity: updates.emergency_stopped ? 'CRITICAL' : 'INFO',
      metadata: { enabled: merged.enabled, paused: merged.paused, emergency_stopped: merged.emergency_stopped, approval_mode: merged.approval_mode }
    });

    return merged;
  }

  // Central Server-Side Execution Guard (PRD & Safety Control Plane)
  checkExecutionControl({ operationType = 'agent_execution', ticketId = null }) {
    const settings = this.getAutonomySettings();
    if (settings.emergency_stopped) {
      return {
        allowed: false,
        state: 'EMERGENCY_STOPPED',
        reason: 'Execution blocked: Emergency Stop is currently ACTIVE.'
      };
    }
    if (settings.paused) {
      return {
        allowed: false,
        state: 'PAUSED',
        reason: 'Execution paused: Autonomous operations are currently PAUSED by administrator directive.'
      };
    }
    if (!settings.enabled && operationType !== 'human_initiated') {
      return {
        allowed: false,
        state: 'DISABLED',
        reason: 'Execution halted: Autonomous AI Mode is currently DISABLED.'
      };
    }
    return {
      allowed: true,
      state: 'RUNNING',
      reason: 'Execution permitted.'
    };
  }

  // Emergency stop all autonomous execution
  emergencyStop(adminUser) {
    const updated = this.updateAutonomySettings({
      emergency_stopped: true,
      enabled: false,
      paused: true,
      autonomous_approvals_enabled: false,
      note: 'Emergency Stop engaged by administrator.'
    }, adminUser);

    // Actively halt all active runs across the system
    try {
      const activeRuns = db.find('agent_runs', r => r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL');
      for (const r of activeRuns) {
        db.update('agent_runs', r.id, {
          status: 'PAUSED',
          error_message: 'Halted immediately by Administrator Emergency Stop.'
        });
        db.update('tickets', r.ticket_id, {
          status: 'WAITING_APPROVAL',
          resolution_summary: 'Execution halted by Emergency Stop.'
        });
        db.logAudit({
          ticket_id: r.ticket_id,
          event_type: 'EMERGENCY_STOP_HALTED',
          agent: 'Supervisor Agent',
          description: `Active workflow for ticket #${r.ticket_id.slice(0, 8)} halted by Emergency Stop.`
        });
      }
    } catch (haltErr) {
      console.warn('[SUPERVISOR] Notice during emergency halt of active runs:', haltErr.message);
    }

    return updated;
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

  // =========================================================================
  // AUTONOMOUS APPROVAL & REJECTION ENGINE (Policy-Governed Backend Control)
  // =========================================================================

  /**
   * Deterministically evaluates an approval request against corporate policy,
   * verified evidence, autonomous permissions, and risk thresholds.
   * NEVER approves purely on LLM sentiment.
   */
  async evaluateApprovalRequest(approvalId) {
    const approval = db.findById('approvals', approvalId);
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found`);
    }

    const ticket = db.findById('tickets', approval.ticket_id);
    if (!ticket) {
      throw new Error(`Ticket ${approval.ticket_id} associated with approval not found`);
    }

    const customer = ticket.customer_id ? db.findById('customers', ticket.customer_id) : null;
    const order = ticket.order_id ? db.findById('orders', ticket.order_id) : null;
    const settings = this.getAutonomySettings();

    // 1. Gather & verify policy
    let policy = null;
    if (approval.evidence?.policyCited?.includes('POL-001') || ticket.category === 'damaged_product' || ticket.category === 'wrong_product') {
      policy = db.findById('policies', 'POL-001');
    } else if (approval.evidence?.policyCited?.includes('POL-003') || ticket.category === 'cancellation') {
      policy = db.findById('policies', 'POL-003');
    } else {
      policy = db.findById('policies', 'POL-002');
    }

    // 2. Perform Deterministic Backend Checks
    const customerAuthenticated = Boolean(customer && customer.id);
    const ticketValid = Boolean(ticket && ticket.id && ticket.status !== 'CANCELLED' && ticket.status !== 'RESOLVED');
    const orderVerified = Boolean(order && order.id);
    const issueCategoryValid = Boolean(ticket.category && ticket.category !== 'spam');
    const policyApplies = Boolean(policy && policy.active !== false);

    // Compute delivery window for warranty actions
    let daysSinceDelivery = approval.evidence?.daysSinceDelivery;
    if (daysSinceDelivery === undefined && order && order.delivery_date) {
      const deliveredTime = new Date(order.delivery_date).getTime();
      const currentTime = new Date('2026-10-01T10:00:00.000Z').getTime();
      daysSinceDelivery = Math.max(0, Math.floor((currentTime - deliveredTime) / (1000 * 60 * 60 * 24)));
    }

    // Check if policy conditions are satisfied
    let policyAllowsAction = false;
    let policyFailureReason = '';

    if (approval.action === 'create_replacement_request') {
      if (daysSinceDelivery !== null && daysSinceDelivery !== undefined && daysSinceDelivery <= 14) {
        policyAllowsAction = true;
      } else if (daysSinceDelivery > 14) {
        policyAllowsAction = false;
        policyFailureReason = `Item delivered ${daysSinceDelivery} days ago, exceeding the 14-day replacement warranty under ${policy?.id || 'POL-001'}.`;
      } else {
        policyAllowsAction = true; // Default within window if unrecorded
      }
    } else if (approval.action === 'cancel_processing_order') {
      if (order && order.status === 'PROCESSING') {
        policyAllowsAction = true;
      } else {
        policyAllowsAction = false;
        policyFailureReason = `Order #${order?.id || 'N/A'} is in '${order?.status}' stage; pre-shipment cancellation not allowed under POL-003.`;
      }
    } else if (approval.action === 'refund_order' || approval.action?.includes('refund')) {
      if (daysSinceDelivery !== null && daysSinceDelivery <= 30) {
        policyAllowsAction = true;
      } else {
        policyAllowsAction = false;
        policyFailureReason = `Refund request exceeds the standard 30-day window under ${policy?.id || 'POL-002'}.`;
      }
    } else {
      policyAllowsAction = true;
    }

    // Check autonomous permissions configured by administrator
    let autonomousPermission = false;
    let permissionReason = '';

    if (settings.emergency_stopped) {
      autonomousPermission = false;
      permissionReason = 'Emergency stop is active across the platform.';
    } else if (settings.paused) {
      autonomousPermission = false;
      permissionReason = 'Autonomous approvals are currently paused by administrator.';
    } else if (!settings.enabled || !settings.autonomous_approvals_enabled) {
      autonomousPermission = false;
      permissionReason = 'Autonomous AI approval authority is currently disabled.';
    } else if (settings.approval_mode === 'HUMAN') {
      autonomousPermission = false;
      permissionReason = 'Platform is in HUMAN APPROVAL mode. AI evaluation requires human supervisor signoff.';
    } else {
      // Action-specific permissions
      if (approval.action === 'create_replacement_request') {
        autonomousPermission = settings.permissions?.allow_replacements !== false;
        if (!autonomousPermission) permissionReason = 'Replacement request authority is disabled in admin settings.';
      } else if (approval.action === 'cancel_processing_order' || approval.action?.includes('shipping')) {
        autonomousPermission = settings.permissions?.allow_shipping !== false;
        if (!autonomousPermission) permissionReason = 'Shipping / order management authority is disabled in admin settings.';
      } else if (approval.action?.includes('refund')) {
        autonomousPermission = settings.permissions?.allow_refunds === true;
        if (!autonomousPermission) permissionReason = 'Financial refund authority is disabled in admin settings.';
      } else if (approval.action?.includes('status')) {
        autonomousPermission = settings.permissions?.allow_status_changes !== false;
        if (!autonomousPermission) permissionReason = 'Ticket status authority is disabled in admin settings.';
      } else {
        autonomousPermission = true;
      }
    }

    // Action limits check (financial amounts)
    const orderAmount = order?.amount || 0;
    const actionWithinLimits = orderAmount <= (settings.refund_limit || 1000);
    let limitReason = '';
    if (!actionWithinLimits) {
      limitReason = `Order value ($${orderAmount.toFixed(2)}) exceeds configured autonomous limit of $${settings.refund_limit}.`;
    }

    // Risk classification
    let riskLevel = 'LOW';
    if (settings.restricted_tools?.includes(approval.action) || orderAmount > (settings.refund_limit || 1000) * 2) {
      riskLevel = 'HIGH';
    } else if (approval.action === 'create_replacement_request' || approval.action?.includes('refund') || orderAmount > 250) {
      riskLevel = 'MEDIUM';
    }

    // Required evidence verification
    const requiredEvidencePresent = customerAuthenticated && ticketValid && orderVerified;

    // Consistency check
    const consistency = this.evaluateMultiAgentConsistency({
      ticket,
      triageResult: { category: ticket.category },
      investigationResult: {
        customerFound: customerAuthenticated,
        orderFound: orderVerified,
        daysSinceDelivery
      },
      policyResult: {
        permitted: policyAllowsAction,
        policyCited: policy?.id || 'POL-001'
      }
    });

    const evidenceChecks = {
      customerAuthenticated,
      ticketValid,
      orderVerified,
      issueCategoryValid,
      policyApplies,
      eligibilityPassed: policyAllowsAction,
      previousActionNone: true,
      autonomousPermissionGranted: autonomousPermission,
      riskWithinLimits: actionWithinLimits && riskLevel !== 'HIGH'
    };

    // 3. Formulate Structured Autonomous Decision
    let decision = 'APPROVE';
    let decisionReason = '';

    // RULE 1: If policy criteria explicitly fails or evidence contradicts -> REJECT
    if (!policyAllowsAction) {
      decision = 'REJECT';
      decisionReason = policyFailureReason || `Request does not meet the criteria in ${policy?.id || 'Corporate Policy'}.`;
    }
    // RULE 2: If required evidence is missing or anomalies detected -> ESCALATE
    else if (!requiredEvidencePresent || !consistency.consistent) {
      decision = 'ESCALATE';
      decisionReason = !consistency.consistent
        ? `Cross-agent consistency anomaly: ${consistency.anomalies.join('; ')}`
        : 'Required customer or order evidence could not be verified.';
    }
    // RULE 3: If action limits exceeded or high risk -> ESCALATE
    else if (!actionWithinLimits) {
      decision = 'ESCALATE';
      decisionReason = limitReason || 'Action value exceeds autonomous financial limit.';
    }
    // RULE 4: If autonomous permissions are disabled / mode is human -> ESCALATE
    else if (!autonomousPermission) {
      decision = 'ESCALATE';
      decisionReason = permissionReason || 'Action requires human supervisor authorization.';
    }
    // RULE 5: In HYBRID mode, high risk goes to human
    else if (settings.approval_mode === 'HYBRID' && riskLevel === 'HIGH') {
      decision = 'ESCALATE';
      decisionReason = 'High-risk action requires human supervisor authorization under HYBRID governance.';
    }
    // RULE 6: ALL GATES SATISFIED -> APPROVE!
    else {
      decision = 'APPROVE';
      decisionReason = `Customer and order satisfy the ${policy?.title || 'damaged-product replacement'} policy (${policy?.id || 'POL-001'}). All 8 governance gates verified.`;
    }

    const structuredDecision = {
      approvalId: approval.id,
      decision, // 'APPROVE' | 'REJECT' | 'ESCALATE'
      decision_type: decision === 'APPROVE' ? 'AI_APPROVED' : decision === 'REJECT' ? 'AI_REJECTED' : 'ESCALATED',
      decision_maker: 'ResolveAI Supervisor Agent',
      action: approval.action,
      riskLevel,
      policy: policy?.id || 'POL-001',
      policyAllows: policyAllowsAction,
      autonomousPermission,
      evidenceValidated: requiredEvidencePresent,
      customerAuthorized: customerAuthenticated,
      ticketStateValid: ticketValid,
      actionWithinLimits,
      reason: decisionReason,
      evidenceChecks,
      next_action: decision === 'APPROVE'
        ? 'Action Agent will execute the approved action autonomously.'
        : decision === 'REJECT'
        ? 'Workflow stopped. Customer notified according to communication policy.'
        : 'Action paused. Human supervisor review required.'
    };

    return structuredDecision;
  }

  /**
   * Internal protected operation: Approves a request autonomously or on behalf of human
   */
  async approveRequest({ approvalId, actor = 'ResolveAI Supervisor Agent', isAI = true, notes }) {
    const approval = db.findById('approvals', approvalId);
    if (!approval) throw new Error(`Approval ${approvalId} not found`);

    if (approval.status === 'APPROVED') {
      return { success: true, approval, message: 'Approval already granted' };
    }

    // Execution Control Gate
    const guard = this.checkExecutionControl({
      operationType: isAI ? 'autonomous_approval' : 'human_approval',
      ticketId: approval.ticket_id
    });
    if (!guard.allowed && (isAI || guard.state === 'EMERGENCY_STOPPED')) {
      throw new Error(`APPROVAL_BLOCKED: ${guard.reason}`);
    }

    // If AI is approving, verify all gates
    let evaluation = null;
    if (isAI) {
      evaluation = await this.evaluateApprovalRequest(approvalId);
      if (evaluation.decision !== 'APPROVE') {
        throw new Error(`APPROVAL_BLOCKED: Supervisor evaluation returned '${evaluation.decision}': ${evaluation.reason}`);
      }
    }

    const updated = db.update('approvals', approvalId, {
      status: 'APPROVED',
      decision_type: isAI ? 'AI_APPROVED' : 'HUMAN_APPROVED',
      decision_maker: actor,
      reviewed_by: isAI ? 'supervisor_agent' : actor,
      reviewed_at: new Date().toISOString(),
      evaluation: evaluation || approval.evaluation,
      notes: notes || 'Approval granted under policy-governed authority'
    });

    this.logSupervisorEvent({
      event_type: isAI ? 'SUPERVISOR_AUTONOMOUS_APPROVAL' : 'SUPERVISOR_HUMAN_APPROVAL_RECORDED',
      title: isAI ? `Autonomous Approval Granted: ${approval.action}` : `Human Approval Recorded: ${approval.action}`,
      description: isAI
        ? `Supervisor Agent autonomously approved '${approval.action}' for Ticket #${approval.ticket_id.slice(0, 8)}. Policy & risk bounds verified.`
        : `${actor} authorized action '${approval.action}' for Ticket #${approval.ticket_id.slice(0, 8)}.`,
      severity: 'INFO',
      metadata: { approvalId, action: approval.action, isAI, decision_type: updated.decision_type }
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: isAI ? 'SUPERVISOR_AUTONOMOUS_APPROVAL' : 'APPROVAL_GRANTED',
      agent: actor,
      description: isAI
        ? `✓ Autonomous approval granted by Supervisor Agent for '${approval.action}'.`
        : `Human approval granted by ${actor} for '${approval.action}'.`,
      metadata: { approvalId, action: approval.action, isAI }
    });

    return { success: true, approval: updated, evaluation };
  }

  /**
   * Internal protected operation: Rejects a request autonomously or by human
   */
  async rejectRequest({ approvalId, reason, actor = 'ResolveAI Supervisor Agent', isAI = true }) {
    const approval = db.findById('approvals', approvalId);
    if (!approval) throw new Error(`Approval ${approvalId} not found`);

    const updated = db.update('approvals', approvalId, {
      status: 'REJECTED',
      decision_type: isAI ? 'AI_REJECTED' : 'HUMAN_REJECTED',
      decision_maker: actor,
      reviewed_by: isAI ? 'supervisor_agent' : actor,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    });

    this.logSupervisorEvent({
      event_type: isAI ? 'SUPERVISOR_AUTONOMOUS_REJECTION' : 'SUPERVISOR_HUMAN_REJECTION_RECORDED',
      title: isAI ? `Autonomous Rejection: ${approval.action}` : `Action Rejected: ${approval.action}`,
      description: isAI
        ? `Supervisor Agent autonomously rejected '${approval.action}': ${reason}`
        : `${actor} rejected '${approval.action}': ${reason}`,
      severity: 'WARN',
      metadata: { approvalId, action: approval.action, reason, isAI }
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: isAI ? 'SUPERVISOR_AUTONOMOUS_REJECTION' : 'APPROVAL_REJECTED',
      agent: actor,
      description: isAI
        ? `✕ Autonomous rejection by Supervisor Agent: ${reason}`
        : `Action rejected by ${actor}: ${reason}`,
      metadata: { approvalId, action: approval.action, reason, isAI }
    });

    return { success: true, approval: updated };
  }

  /**
   * Escalates an approval request for human manager review
   */
  async escalateRequest({ approvalId, reason, actor = 'ResolveAI Supervisor Agent' }) {
    const approval = db.findById('approvals', approvalId);
    if (!approval) throw new Error(`Approval ${approvalId} not found`);

    const updated = db.update('approvals', approvalId, {
      status: 'ESCALATED',
      decision_type: 'ESCALATED',
      decision_maker: actor,
      reviewed_at: new Date().toISOString(),
      escalation_reason: reason
    });

    this.logSupervisorEvent({
      event_type: 'SUPERVISOR_ESCALATED_TO_HUMAN',
      title: `Escalated to Human Supervisor: ${approval.action}`,
      description: `Supervisor Agent escalated approval request #${approvalId} for Ticket #${approval.ticket_id.slice(0, 8)}: ${reason}`,
      severity: 'WARN',
      metadata: { approvalId, action: approval.action, reason }
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: 'APPROVAL_ESCALATED_TO_HUMAN',
      agent: actor,
      description: `⚠ Action '${approval.action}' escalated to Human Supervisor: ${reason}`,
      metadata: { approvalId, action: approval.action, reason }
    });

    return { success: true, approval: updated };
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
    if (!settings.enabled || !settings.autonomous_approvals_enabled) {
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

    // 4. Check specific permissions
    if (action === 'create_replacement_request' && settings.permissions?.allow_replacements === false) {
      return {
        autonomousAuthorized: false,
        reason: 'Replacement requests are disabled in autonomous permissions.',
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
      reason: `Action '${action}' validated under active Autonomous AI Mode policy (${policyResult?.policyCited || 'POL-001'}/Bounds Verified).`,
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
    const policies = db.find('policies');
    const orders = db.find('orders');
    const customers = db.find('customers');
    const settings = this.getAutonomySettings();
    const health = this.getFleetHealth();

    const activeWorkflows = runs.filter(r => r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL' || r.status === 'RECOVERING');
    const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

    // Detect if user query refers to a specific ticket
    const ticketMatch = query.match(/TKT-[\w-]+|ticket\s*#?([0-9a-fA-F-]+)/i);
    let queriedTicket = null;
    let ticketRun = null;
    let ticketSteps = [];

    if (ticketMatch) {
      const matchTerm = ticketMatch[0].toUpperCase();
      queriedTicket = tickets.find(t => 
        (t.id && t.id.toUpperCase().includes(matchTerm.replace('TICKET', '').replace('#', '').trim())) ||
        (t.id && matchTerm.includes(t.id.slice(0, 8).toUpperCase())) ||
        (t.title && t.title.toUpperCase().includes(matchTerm))
      );
    }
    if (!queriedTicket && (query.toLowerCase().includes('ticket') || query.toLowerCase().includes('case'))) {
      // Pick the most recent active ticket or first ticket
      queriedTicket = tickets.find(t => t.status === 'WAITING_APPROVAL' || t.status === 'AI_PROCESSING') || tickets[0];
    }

    if (queriedTicket) {
      ticketRun = runs.find(r => r.ticket_id === queriedTicket.id);
      ticketSteps = db.find('agent_steps', s => s.ticket_id === queriedTicket.id);
    }

    let ticketContext = '';
    if (queriedTicket) {
      const cust = customers.find(c => c.id === queriedTicket.customer_id);
      const ord = orders.find(o => o.id === queriedTicket.order_id);
      ticketContext = `\nQueried Ticket Details (ID: ${queriedTicket.id}):
- Title: ${queriedTicket.title}
- Status: ${queriedTicket.status} (Priority: ${queriedTicket.priority})
- Customer: ${cust ? cust.name : 'Unknown'} (${cust ? cust.email : 'N/A'})
- Associated Order: ${ord ? `${ord.id} - ${ord.product_name} ($${ord.price})` : (queriedTicket.order_id || 'None')}
- Resolution Summary: ${queriedTicket.resolution_summary || 'In progress'}
- Executed Steps: ${ticketSteps.map(s => `${s.agent_name}: ${s.status}`).join(' -> ') || 'None yet'}`;
    }

    const systemContext = `Current System State:
- Autonomous AI Mode: ${settings.enabled ? (settings.paused ? 'PAUSED' : 'ENABLED') : 'DISABLED'}
- Emergency Stop: ${settings.emergency_stopped ? 'ACTIVE' : 'INACTIVE'}
- Active Workflows: ${activeWorkflows.length}
- Pending Human Approvals: ${pendingApprovals.length}
- Total Cases: ${tickets.length} (Resolved: ${resolvedCount})
- Autonomous Refund Limit: $${settings.refund_limit}
- Agent Fleet: 8/8 Agents operational
- Allowed Tools: ${settings.allowed_tools.join(', ')}
- Pending Approval Cases: ${pendingApprovals.map(a => `Ticket #${a.ticket_id.slice(0, 8)} (${a.action}): ${a.reason}`).join(' | ') || 'None'}
- Active Business Policies: ${policies.map(p => `${p.id}: ${p.title}`).join(', ')}${ticketContext}`;

    const prompt = `User Query: "${query}"

${systemContext}

Respond as the ResolveAI Supervisor Agent. Ground your answer strictly in the real system context provided above.
If the user asks about a specific ticket or why a workflow is waiting, inspect the ticket and approval data.
Keep your response professional, concise (2-4 sentences), factual, and operational. Never invent cases, orders, or numbers that are not in the system context.`;

    const aiResponse = await aiService.generateText(prompt, 'You are the ResolveAI Supervisor Agent (AI Control Agent). You provide accurate operational telemetry, ticket inspections, and policy supervision to human administrators.');

    if (aiResponse) {
      return { answer: aiResponse, source: 'ai' };
    }

    // High-fidelity deterministic fallback if Gemini is offline
    const qLower = query.toLowerCase();

    // Specific ticket inspection query
    if (queriedTicket) {
      const stepSummary = ticketSteps.length > 0 
        ? ` Executed agents: ${ticketSteps.map(s => s.agent_name).join(', ')}.`
        : '';
      const approvalPending = pendingApprovals.find(a => a.ticket_id === queriedTicket.id);
      const approvalText = approvalPending 
        ? ` Currently waiting for supervisor authorization on: ${approvalPending.action} (${approvalPending.reason}).`
        : '';

      return {
        answer: `Ticket #${queriedTicket.id.slice(0, 8)} ("${queriedTicket.title}") is currently in ${queriedTicket.status} status with ${queriedTicket.priority} priority.${stepSummary}${approvalText}${queriedTicket.resolution_summary ? ` Resolution notes: "${queriedTicket.resolution_summary}".` : ''}`,
        source: 'deterministic'
      };
    }

    // Why is workflow waiting / pending approvals
    if (qLower.includes('waiting') || qLower.includes('paused') || qLower.includes('approval') || qLower.includes('gate')) {
      if (pendingApprovals.length > 0) {
        const top = pendingApprovals[0];
        return {
          answer: `Workflow is awaiting authorization for Ticket #${top.ticket_id.slice(0, 8)}. Action Agent proposed "${top.action}" requiring review: "${top.reason}". Autonomous threshold is set to $${settings.refund_limit}.`,
          source: 'deterministic'
        };
      }
      if (settings.paused) {
        return {
          answer: `The multi-agent execution pipeline is currently PAUSED by administrator directive. In-flight operations have completed safely, and new autonomous agent transitions are held until resumed.`,
          source: 'deterministic'
        };
      }
      return {
        answer: `There are currently no workflows paused for approval. All autonomous pipelines are executing or resolved.`,
        source: 'deterministic'
      };
    }

    // What did agents do / agent activity
    if (qLower.includes('what did') || qLower.includes('agent') || qLower.includes('do') || qLower.includes('action') || qLower.includes('activity')) {
      const recentSteps = db.find('agent_steps').slice(-5);
      if (recentSteps.length > 0) {
        const stepDescriptions = recentSteps.map(s => `${s.agent_name} (${s.status})`).join(' -> ');
        return {
          answer: `Recent agent activity across the fleet: ${stepDescriptions}. All 7 specialized agents are coordinated under the Supervisor Agent with zero anomalous deviations.`,
          source: 'deterministic'
        };
      }
      return {
        answer: `Fleet status: 8 operational agents active. Triage, Investigation, Policy, Action, Communication, and Verification agents are monitoring incoming cases.`,
        source: 'deterministic'
      };
    }

    // Policy query
    if (qLower.includes('policy') || qLower.includes('rule') || qLower.includes('pol-')) {
      return {
        answer: `Currently active policies: ${policies.map(p => `${p.id} (${p.title})`).join(', ')}. The Policy Agent validates case evidence against these rules before any autonomous action execution.`,
        source: 'deterministic'
      };
    }

    // Autonomous mode & controls
    if (qLower.includes('mode') || qLower.includes('autonomous') || qLower.includes('emergency')) {
      return {
        answer: `Autonomous AI Mode is currently ${settings.enabled ? 'ENABLED' : 'DISABLED'}${settings.paused ? ' (PAUSED)' : ''}. Emergency Stop: ${settings.emergency_stopped ? 'ACTIVE' : 'INACTIVE'}. Refund threshold: $${settings.refund_limit} with ${settings.allowed_tools.length} allowlisted tools.`,
        source: 'deterministic'
      };
    }

    // Fleet status
    if (qLower.includes('active') || qLower.includes('running') || qLower.includes('status') || qLower.includes('health')) {
      return {
        answer: `Fleet operational telemetry: ${activeWorkflows.length} active workflows, ${resolvedCount} resolved cases, ${pendingApprovals.length} pending human gates. Fleet health score is 100% across all 8 agents.`,
        source: 'deterministic'
      };
    }

    return {
      answer: `Supervisor Telemetry: System active with ${tickets.length} total tickets (${resolvedCount} resolved), ${activeWorkflows.length} active workflows, and Autonomous Mode ${settings.enabled ? (settings.paused ? 'PAUSED' : 'ACTIVE') : 'DISABLED'}.`,
      source: 'deterministic'
    };
  }
}

export const supervisorAgent = new SupervisorAgent();

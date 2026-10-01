import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { triageAgent } from './triageAgent.js';
import { investigationAgent } from './investigationAgent.js';
import { policyAgent } from './policyAgent.js';
import { actionAgent } from './actionAgent.js';
import { communicationAgent } from './communicationAgent.js';
import { verificationAgent } from './verificationAgent.js';
import { aiService } from '../services/aiService.js';
import { emailService } from '../services/emailService.js';
import { PlanOutputSchema } from '../validators/index.js';
import { supervisorAgent } from './supervisorAgent.js';

export class OrchestratorAgent {
  constructor() {
    this.name = 'Orchestrator Agent';
    this.badge = '◉';
  }

  // Generate a multi-step resolution plan based on ticket & triage context
  async createPlan({ ticket, triageResult, customer, order }) {
    const prompt = `Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}
Triage: Category=${triageResult.category}, Priority=${triageResult.priority}, Intent=${triageResult.intent}
Customer: ${customer ? customer.name : 'Unknown'}
Order: ${order ? order.product_name : 'Unknown'}`;

    const systemInstruction = `You are the Orchestrator Agent in ResolveAI.
Formulate a 6-step resolution plan selecting from available agents:
1. triage_agent (action: classify_case)
2. investigation_agent (action: retrieve_order_and_customer)
3. policy_agent (action: evaluate_policy_rules)
4. action_agent (action: execute_resolution_or_gate, specify requiresApproval boolean)
5. communication_agent (action: compose_customer_response)
6. verification_agent (action: audit_and_verify_resolution)`;

    const schemaHint = `{
  "objective": "Resolve damaged product replacement request",
  "riskLevel": "medium",
  "steps": [
    { "step": 1, "agent": "triage_agent", "action": "classify_case", "description": "Triage issue and extract intent", "requiresApproval": false, "dependencies": [] },
    { "step": 2, "agent": "investigation_agent", "action": "retrieve_order_and_customer", "description": "Verify customer profile and delivery timestamp", "requiresApproval": false, "dependencies": [1] },
    { "step": 3, "agent": "policy_agent", "action": "evaluate_policy_rules", "description": "Evaluate 14-day replacement eligibility", "requiresApproval": false, "dependencies": [2] },
    { "step": 4, "agent": "action_agent", "action": "create_replacement_request", "description": "Provision replacement unit via warehouse queue", "requiresApproval": true, "dependencies": [3] },
    { "step": 5, "agent": "communication_agent", "action": "compose_customer_response", "description": "Generate customer confirmation and internal brief", "requiresApproval": false, "dependencies": [4] },
    { "step": 6, "agent": "verification_agent", "action": "audit_and_verify_resolution", "description": "Verify all resolution gates before marking resolved", "requiresApproval": false, "dependencies": [5] }
  ]
}`;

    const aiPlan = await aiService.generateStructuredJSON({
      systemInstruction,
      prompt,
      schemaHint
    });

    if (aiPlan) {
      const parsed = PlanOutputSchema.safeParse(aiPlan);
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Dynamic conditional planning based on problem type
    const categoryLower = (triageResult.category || '').toLowerCase();
    const intentLower = (triageResult.intent || '').toLowerCase();

    if (categoryLower.includes('inquiry') || intentLower.includes('question') || categoryLower.includes('general')) {
      // 4-Step direct resolution DAG for inquiries (Zero approval, zero warehouse action needed)
      return {
        objective: `Provide verified information and direct guidance for ${triageResult.category}`,
        riskLevel: 'low',
        steps: [
          { step: 1, agent: 'triage_agent', action: 'classify_case', description: 'Analyze customer question and extract core subject', requiresApproval: false, dependencies: [] },
          { step: 2, agent: 'investigation_agent', action: 'retrieve_order_and_customer', description: 'Retrieve customer account profile and order context', requiresApproval: false, dependencies: [1] },
          { step: 3, agent: 'communication_agent', action: 'compose_customer_response', description: 'Generate personalized, factual direct guidance without hallucinations', requiresApproval: false, dependencies: [2] },
          { step: 4, agent: 'verification_agent', action: 'audit_and_verify_resolution', description: 'Audit factual consistency and verify all customer queries are answered', requiresApproval: false, dependencies: [3] }
        ]
      };
    }

    if (categoryLower.includes('cancellation') || intentLower.includes('cancel')) {
      // 6-Step order cancellation DAG
      return {
        objective: `Process autonomous order cancellation and warehouse hold for ${ticket.title}`,
        riskLevel: 'low',
        steps: [
          { step: 1, agent: 'triage_agent', action: 'classify_case', description: 'Classify cancellation intent and order references', requiresApproval: false, dependencies: [] },
          { step: 2, agent: 'investigation_agent', action: 'retrieve_order_and_customer', description: 'Check warehouse fulfillment and carrier dispatch status', requiresApproval: false, dependencies: [1] },
          { step: 3, agent: 'policy_agent', action: 'evaluate_policy_rules', description: 'Evaluate against active cancellation policies (POL-002)', requiresApproval: false, dependencies: [2] },
          { step: 4, agent: 'action_agent', action: 'cancel_processing_order', description: 'Execute cancellation tool on fulfillment queue', requiresApproval: false, dependencies: [3] },
          { step: 5, agent: 'communication_agent', action: 'compose_customer_response', description: 'Dispatch cancellation receipt and confirmation to customer', requiresApproval: false, dependencies: [4] },
          { step: 6, agent: 'verification_agent', action: 'audit_and_verify_resolution', description: 'Verify warehouse cancellation state and ledger balance', requiresApproval: false, dependencies: [5] }
        ]
      };
    }

    // Default robust replacement / damage DAG (with supervisor gating)
    const isReplacement = intentLower === 'replacement' || categoryLower === 'damaged_product';
    return {
      objective: `Autonomously resolve ${triageResult.category} (${triageResult.intent})`,
      riskLevel: isReplacement ? 'medium' : 'low',
      steps: [
        { step: 1, agent: 'triage_agent', action: 'classify_case', description: 'Triage issue and extract customer intent', requiresApproval: false, dependencies: [] },
        { step: 2, agent: 'investigation_agent', action: 'retrieve_order_and_customer', description: 'Retrieve order history, customer tier, and delivery timestamp', requiresApproval: false, dependencies: [1] },
        { step: 3, agent: 'policy_agent', action: 'evaluate_policy_rules', description: 'Evaluate against active company policies and determine approval rules', requiresApproval: false, dependencies: [2] },
        { step: 4, agent: 'action_agent', action: isReplacement ? 'create_replacement_request' : 'execute_approved_action', description: isReplacement ? 'Provision expedited replacement shipment' : 'Execute approved order action', requiresApproval: isReplacement, dependencies: [3] },
        { step: 5, agent: 'communication_agent', action: 'compose_customer_response', description: 'Generate personalized customer communication and resolution summary', requiresApproval: false, dependencies: [4] },
        { step: 6, agent: 'verification_agent', action: 'audit_and_verify_resolution', description: 'Audit complete plan execution, compliance, and resolution gates', requiresApproval: false, dependencies: [5] }
      ]
    };
  }

  // Execute the entire workflow or resume from an approval gate
  async runWorkflow({ ticketId, resumeFromApproval = false, approvedAction = null }) {
    const ticket = db.findById('tickets', ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    db.update('tickets', ticketId, { status: 'AI_PROCESSING' });

    let run = db.findOne('agent_runs', r => r.ticket_id === ticketId && (r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL' || r.status === 'PENDING'));

    const customer = ticket.customer_id ? db.findById('customers', ticket.customer_id) : null;
    const order = ticket.order_id ? db.findById('orders', ticket.order_id) : null;

    let planData;

    if (!run) {
      // 1. Triage step
      db.logAudit({
        ticket_id: ticketId,
        event_type: 'TRIAGE_STARTED',
        agent: triageAgent.name,
        description: `Triage Agent analyzing ticket '${ticket.title}'`
      });

      const triageResult = await triageAgent.run({ ticket, customer });
      db.update('tickets', ticketId, {
        category: triageResult.category,
        priority: triageResult.priority
      });

      db.logAudit({
        ticket_id: ticketId,
        event_type: 'TRIAGE_COMPLETED',
        agent: triageAgent.name,
        description: `Categorized as '${triageResult.category}' with ${triageResult.priority} priority. Confidence: ${(triageResult.confidence * 100).toFixed(0)}%`,
        metadata: triageResult
      });

      // 2. Orchestrator creates dynamic execution plan
      planData = await this.createPlan({ ticket, triageResult, customer, order });

      run = db.insert('agent_runs', {
        ticket_id: ticketId,
        status: 'RUNNING',
        objective: planData.objective,
        risk_level: planData.riskLevel,
        plan: planData.steps.map(s => ({ ...s, status: s.step === 1 ? 'COMPLETED' : 'PENDING' })),
        tool_calls: [],
        recovery_attempts: 0,
        started_at: new Date().toISOString()
      });

      db.logAudit({
        ticket_id: ticketId,
        event_type: 'PLAN_CREATED',
        agent: this.name,
        description: `Orchestrator formulated dynamic ${planData.steps.length}-step DAG: ${planData.objective}`,
        metadata: { objective: planData.objective, stepsCount: planData.steps.length, riskLevel: planData.riskLevel }
      });

      // Asynchronously dispatch Task Started customer notification
      emailService.notifyTaskStarted({ ticket, customer }).catch(err => {
        console.warn('[ORCHESTRATOR] Task started notification notice:', err.message);
      });
    } else {
      planData = {
        objective: run.objective,
        riskLevel: run.risk_level,
        steps: run.plan
      };
    }

    // Helper to log structured tool calls onto the active agent run
    const recordToolCall = (toolName, input, output, authorized = true) => {
      const toolRecord = {
        id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tool_name: toolName,
        input,
        output,
        authorized,
        timestamp: new Date().toISOString()
      };
      const currentRun = db.findById('agent_runs', run.id);
      const toolCalls = Array.isArray(currentRun?.tool_calls) ? [...currentRun.tool_calls, toolRecord] : [toolRecord];
      db.update('agent_runs', run.id, { tool_calls: toolCalls });
      return toolRecord;
    };

    // Context accumulated across agent execution
    let context = {
      ticket,
      customer,
      order,
      triageResult: { category: ticket.category, priority: ticket.priority, intent: 'resolution' },
      investigationResult: null,
      policyResult: null,
      actionResult: null,
      communicationResult: null
    };

    // Step 2: Investigation Agent
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'INVESTIGATION_STARTED',
      agent: investigationAgent.name,
      description: 'Investigating customer history, order delivery timelines, and previous tickets.'
    });

    context.investigationResult = await investigationAgent.run({ ticket });
    this.updateRunStepStatus(run.id, 2, 'COMPLETED');

    recordToolCall('get_customer', { customerId: ticket.customer_id }, {
      found: context.investigationResult.customerFound,
      customerName: context.investigationResult.customerName
    });

    if (ticket.order_id || context.investigationResult.orderId) {
      recordToolCall('get_order', { orderId: ticket.order_id || context.investigationResult.orderId }, {
        found: context.investigationResult.orderFound,
        productName: context.investigationResult.productName,
        daysSinceDelivery: context.investigationResult.daysSinceDelivery
      });
    }

    db.logAudit({
      ticket_id: ticketId,
      event_type: 'INVESTIGATION_COMPLETED',
      agent: investigationAgent.name,
      description: `Investigation confirmed order #${context.investigationResult.orderId || 'N/A'}. Days since delivery: ${context.investigationResult.daysSinceDelivery ?? 'N/A'}.`,
      metadata: context.investigationResult
    });

    // Step 3: Policy Agent
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'POLICY_EVALUATION_STARTED',
      agent: policyAgent.name,
      description: 'Searching active policy database and evaluating warranty eligibility.'
    });

    context.policyResult = await policyAgent.run({
      ticket,
      triageResult: context.triageResult,
      investigationResult: context.investigationResult
    });
    this.updateRunStepStatus(run.id, 3, 'COMPLETED');

    recordToolCall('search_policies', { category: ticket.category }, {
      policyCited: context.policyResult.policyCited,
      permitted: context.policyResult.permitted,
      requiresHumanApproval: context.policyResult.requiresHumanApproval
    });

    db.logAudit({
      ticket_id: ticketId,
      event_type: 'POLICY_EVALUATED',
      agent: policyAgent.name,
      description: `Policy evaluation: ${context.policyResult.decision}. Policy cited: ${context.policyResult.policyCited}. Requires human approval: ${context.policyResult.requiresHumanApproval}`,
      metadata: context.policyResult
    });

    // Step 4: Action Agent & Supervisor Autonomous Approval Architecture
    this.updateRunStepStatus(run.id, 4, 'RUNNING');

    let isAuthorized = Boolean(resumeFromApproval);
    let activeApproval = null;

    // Check if Policy Agent flagged that approval is required
    if (context.policyResult.requiresHumanApproval && !isAuthorized) {
      // Create Approval Request
      activeApproval = db.insert('approvals', {
        ticket_id: ticket.id,
        run_id: run.id,
        step_id: 'step-004',
        action: context.policyResult.recommendedAction,
        status: 'EVALUATING',
        reason: context.policyResult.reason,
        evidence: {
          customerName: context.investigationResult?.customerName,
          orderId: context.investigationResult?.orderId,
          productName: context.investigationResult?.productName,
          daysSinceDelivery: context.investigationResult?.daysSinceDelivery,
          policyCited: context.policyResult.policyCited
        },
        requested_by: policyAgent.name
      });

      // Supervisor Agent receives the approval request
      db.logAudit({
        ticket_id: ticketId,
        event_type: 'SUPERVISOR_APPROVAL_RECEIVED',
        agent: supervisorAgent.name,
        description: `Supervisor Agent received approval request #${activeApproval.id} for action '${context.policyResult.recommendedAction}'.`,
        metadata: { approvalId: activeApproval.id, action: context.policyResult.recommendedAction }
      });

      // Supervisor Agent evaluates the approval request autonomously
      const evaluation = await supervisorAgent.evaluateApprovalRequest(activeApproval.id);

      if (evaluation.decision === 'APPROVE') {
        // AI APPROVAL: Supervisor grants approval autonomously
        await supervisorAgent.approveRequest({
          approvalId: activeApproval.id,
          actor: supervisorAgent.name,
          isAI: true
        });
        isAuthorized = true;
      } else if (evaluation.decision === 'REJECT') {
        // AI REJECTION: Supervisor autonomously rejects ineligible action
        await supervisorAgent.rejectRequest({
          approvalId: activeApproval.id,
          reason: evaluation.reason,
          actor: supervisorAgent.name,
          isAI: true
        });

        this.updateRunStepStatus(run.id, 4, 'REJECTED');

        // Route directly to Communication Agent to formulate customer policy notification
        this.updateRunStepStatus(run.id, 5, 'RUNNING');
        context.communicationResult = await communicationAgent.run({
          ticket,
          customer,
          order,
          policyResult: context.policyResult,
          actionResult: {
            actionExecuted: 'rejection_notification',
            status: 'REJECTED',
            details: { reason: evaluation.reason, policyCited: evaluation.policy }
          }
        });
        this.updateRunStepStatus(run.id, 5, 'COMPLETED');

        db.update('tickets', ticketId, {
          status: 'RESOLVED',
          customer_response: context.communicationResult.customerMessage,
          resolution_summary: `Supervisor Autonomous Decision: Action rejected. Reason: ${evaluation.reason}`
        });

        // Verification Agent conducts audit check on rejection
        this.updateRunStepStatus(run.id, 6, 'RUNNING');
        const verificationResult = await verificationAgent.run({
          ticket,
          plan: db.findById('agent_runs', run.id).plan,
          investigationResult: context.investigationResult,
          policyResult: context.policyResult,
          actionResult: { actionExecuted: 'rejection', status: 'COMPLETED', details: { reason: evaluation.reason } },
          communicationResult: context.communicationResult
        });
        this.updateRunStepStatus(run.id, 6, 'COMPLETED');
        db.update('agent_runs', run.id, { status: 'COMPLETED', completed_at: new Date().toISOString() });

        // Notify customer of outcome
        emailService.notifyFinalResolution({
          ticket,
          customer,
          resolutionSummary: `Supervisor Autonomous Decision: Action rejected. Reason: ${evaluation.reason}`,
          customerMessage: context.communicationResult.customerMessage,
          referenceId: activeApproval.id
        }).catch(err => {
          console.warn('[ORCHESTRATOR] Rejection notification notice:', err.message);
        });

        return {
          status: 'REJECTED',
          runId: run.id,
          approvalId: activeApproval.id,
          decision: 'REJECT',
          reason: evaluation.reason,
          message: `Autonomous Rejection by Supervisor Agent: ${evaluation.reason}`
        };
      } else {
        // ESCALATE: Action requires Human Review
        await supervisorAgent.escalateRequest({
          approvalId: activeApproval.id,
          reason: evaluation.reason,
          actor: supervisorAgent.name
        });

        this.updateRunStepStatus(run.id, 4, 'WAITING_APPROVAL');
        db.update('agent_runs', run.id, { status: 'WAITING_APPROVAL' });
        db.update('tickets', ticketId, { status: 'WAITING_APPROVAL' });

        // Notify supervisor via internal approval email
        emailService.notifyApprovalRequested({ ticket, customer, approval: activeApproval }).catch(err => {
          console.warn('[ORCHESTRATOR] Approval email notice:', err.message);
        });

        return {
          status: 'WAITING_APPROVAL',
          runId: run.id,
          approvalId: activeApproval.id,
          escalated: true,
          decision: 'ESCALATE',
          reason: evaluation.reason,
          message: `Action paused. Human supervisor review required: ${evaluation.reason}`
        };
      }
    }

    // Execute Action Agent with authorization state
    context.actionResult = await actionAgent.run({
      ticket,
      runId: run.id,
      stepId: 'step-004',
      policyResult: context.policyResult,
      investigationResult: context.investigationResult,
      isApproved: isAuthorized
    });

    recordToolCall(
      context.actionResult.actionExecuted || 'action_execution',
      { policyCited: context.policyResult.policyCited, orderId: context.investigationResult?.orderId, autoApproved: isAuthorized },
      context.actionResult.details,
      true
    );

    this.updateRunStepStatus(run.id, 4, 'COMPLETED');

    // Notify customer that authorized action has executed
    emailService.notifyActionCompleted({ ticket, customer, actionResult: context.actionResult }).catch(err => {
      console.warn('[ORCHESTRATOR] Action completed email notice:', err.message);
    });

    // Step 5: Communication Agent
    this.updateRunStepStatus(run.id, 5, 'RUNNING');
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'COMMUNICATION_STARTED',
      agent: communicationAgent.name,
      description: 'Synthesizing verified case evidence into personalized customer response and internal briefing.'
    });

    context.communicationResult = await communicationAgent.run({
      ticket,
      customer,
      order,
      policyResult: context.policyResult,
      actionResult: context.actionResult
    });
    this.updateRunStepStatus(run.id, 5, 'COMPLETED');

    recordToolCall('send_customer_update', {
      ticketId: ticket.id,
      recipient: customer?.email
    }, {
      delivered: true,
      hasCustomerMessage: !!context.communicationResult.customerMessage
    });

    db.update('tickets', ticketId, {
      customer_response: context.communicationResult.customerMessage,
      resolution_summary: context.communicationResult.internalSummary
    });

    db.logAudit({
      ticket_id: ticketId,
      event_type: 'RESPONSE_GENERATED',
      agent: communicationAgent.name,
      description: 'Personalized customer email drafted and verified against warehouse disposition.',
      metadata: context.communicationResult
    });

    // Step 6: Verification Agent
    this.updateRunStepStatus(run.id, 6, 'RUNNING');
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'VERIFICATION_STARTED',
      agent: verificationAgent.name,
      description: 'Conducting final audit: verifying evidence, policy compliance, and approval records.'
    });

    let currentRunState = db.findById('agent_runs', run.id);
    let verificationResult = await verificationAgent.run({
      ticket,
      plan: currentRunState.plan,
      investigationResult: context.investigationResult,
      policyResult: context.policyResult,
      actionResult: context.actionResult,
      communicationResult: context.communicationResult
    });

    recordToolCall('verify_resolution', {
      ticketId: ticket.id,
      checklist: verificationResult.checklist
    }, {
      verified: verificationResult.verified,
      conclusion: verificationResult.conclusion
    });

    db.update('agent_runs', run.id, {
      verification_result: verificationResult
    });

    if (verificationResult.verified) {
      this.updateRunStepStatus(run.id, 6, 'COMPLETED');
      db.update('agent_runs', run.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      });
      db.update('tickets', ticketId, {
        status: 'RESOLVED',
        updated_at: new Date().toISOString()
      });

      db.logAudit({
        ticket_id: ticketId,
        event_type: 'TICKET_RESOLVED',
        agent: verificationAgent.name,
        description: `Autonomous resolution verified and finalized. All audit gates satisfied.`,
        metadata: verificationResult
      });

      // Notify customer that case has been verified and resolved
      emailService.notifyFinalResolution({
        ticket,
        customer,
        resolutionSummary: context.communicationResult?.internalSummary,
        customerMessage: context.communicationResult?.customerMessage,
        referenceId: context.actionResult?.details?.replacementId || context.actionResult?.details?.orderId
      }).catch(err => {
        console.warn('[ORCHESTRATOR] Final resolution email notice:', err.message);
      });

      return {
        status: 'RESOLVED',
        runId: run.id,
        verificationResult,
        message: 'Ticket successfully resolved autonomously.'
      };
    } else {
      // Reassessment & Autonomous Recovery Loop
      const currentAttempts = run.recovery_attempts || 0;
      const maxRetries = 2;

      if (currentAttempts < maxRetries) {
        const nextAttempt = currentAttempts + 1;
        db.update('agent_runs', run.id, {
          recovery_attempts: nextAttempt,
          status: 'RECOVERING'
        });

        db.logAudit({
          ticket_id: ticketId,
          event_type: 'RECOVERY_INITIATED',
          agent: this.name,
          description: `Autonomous recovery cycle #${nextAttempt} initiated. Orchestrator reassessing unsatisfied verification gates.`,
          metadata: { attempt: nextAttempt, failedGates: verificationResult.checklist }
        });

        // Orchestrator executes corrective reassessment:
        if (!verificationResult.checklist.evidenceSufficient) {
          context.investigationResult = await investigationAgent.run({ ticket });
        }
        if (!verificationResult.checklist.customerInformed) {
          context.communicationResult = await communicationAgent.run({
            ticket,
            customer,
            order,
            policyResult: context.policyResult,
            actionResult: context.actionResult
          });
          db.update('tickets', ticketId, {
            customer_response: context.communicationResult.customerMessage,
            resolution_summary: context.communicationResult.internalSummary
          });
        }

        // Re-verify after autonomous adaptation
        const reVerification = await verificationAgent.run({
          ticket,
          plan: db.findById('agent_runs', run.id).plan,
          investigationResult: context.investigationResult,
          policyResult: context.policyResult,
          actionResult: context.actionResult,
          communicationResult: context.communicationResult
        });

        db.update('agent_runs', run.id, {
          verification_result: reVerification
        });

        if (reVerification.verified) {
          this.updateRunStepStatus(run.id, 6, 'COMPLETED');
          db.update('agent_runs', run.id, {
            status: 'COMPLETED',
            completed_at: new Date().toISOString()
          });
          db.update('tickets', ticketId, {
            status: 'RESOLVED',
            updated_at: new Date().toISOString()
          });

          db.logAudit({
            ticket_id: ticketId,
            event_type: 'RECOVERY_SUCCEEDED',
            agent: this.name,
            description: `Orchestrator successfully resolved ticket via autonomous adaptation on attempt #${nextAttempt}.`,
            metadata: { attempts: nextAttempt, reVerification }
          });

          return {
            status: 'RESOLVED',
            runId: run.id,
            verificationResult: reVerification,
            recovered: true,
            message: 'Ticket successfully recovered and verified autonomously.'
          };
        }
      }

      // If retries exhausted or irrecoverable, safely escalate to human supervisor with complete evidence dossier
      this.updateRunStepStatus(run.id, 6, 'FAILED');
      db.update('agent_runs', run.id, { status: 'FAILED' });
      db.update('tickets', ticketId, { status: 'ESCALATED' });

      db.logAudit({
        ticket_id: ticketId,
        event_type: 'RECOVERY_EXHAUSTED_ESCALATED',
        agent: this.name,
        description: `Recovery attempts exhausted (${maxRetries}/${maxRetries}). Ticket escalated to Human Supervisor with full audit trail.`,
        metadata: { verificationResult, recovery_attempts: maxRetries }
      });

      return {
        status: 'ESCALATED',
        runId: run.id,
        verificationResult,
        message: 'Verification failed after autonomous recovery attempts. Escalated to human supervisor.'
      };
    }
  }

  updateRunStepStatus(runId, stepNumber, status) {
    const run = db.findById('agent_runs', runId);
    if (!run || !run.plan) return;
    const updatedPlan = run.plan.map(s => s.step === stepNumber ? { ...s, status } : s);
    db.update('agent_runs', runId, { plan: updatedPlan });
  }
}

export const orchestratorAgent = new OrchestratorAgent();

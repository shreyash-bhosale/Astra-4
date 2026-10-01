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

    // Default robust 6-step plan
    const isReplacement = triageResult.intent === 'replacement' || triageResult.category === 'damaged_product';
    return {
      objective: `Autonomously resolve ${triageResult.category} (${triageResult.intent})`,
      riskLevel: isReplacement ? 'medium' : 'low',
      steps: [
        { step: 1, agent: 'triage_agent', action: 'classify_case', description: 'Triage issue and extract customer intent', requiresApproval: false, dependencies: [] },
        { step: 2, agent: 'investigation_agent', action: 'retrieve_order_and_customer', description: 'Retrieve order history, customer tier, and delivery timestamp', requiresApproval: false, dependencies: [1] },
        { step: 3, agent: 'policy_agent', action: 'evaluate_policy_rules', description: 'Evaluate against active company policies and determine approval rules', requiresApproval: false, dependencies: [2] },
        { step: 4, agent: 'action_agent', action: isReplacement ? 'create_replacement_request' : 'cancel_processing_order', description: isReplacement ? 'Provision expedited replacement shipment' : 'Execute approved order action', requiresApproval: isReplacement, dependencies: [3] },
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

      // 2. Orchestrator creates execution plan
      planData = await this.createPlan({ ticket, triageResult, customer, order });

      run = db.insert('agent_runs', {
        ticket_id: ticketId,
        status: 'RUNNING',
        objective: planData.objective,
        risk_level: planData.riskLevel,
        plan: planData.steps.map(s => ({ ...s, status: s.step === 1 ? 'COMPLETED' : 'PENDING' })),
        started_at: new Date().toISOString()
      });

      db.logAudit({
        ticket_id: ticketId,
        event_type: 'PLAN_CREATED',
        agent: this.name,
        description: `Orchestrator formulated ${planData.steps.length}-step resolution plan: ${planData.objective}`,
        metadata: { objective: planData.objective, stepsCount: planData.steps.length }
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

    // Step 2: Investigation
    db.logAudit({
      ticket_id: ticketId,
      event_type: 'INVESTIGATION_STARTED',
      agent: investigationAgent.name,
      description: 'Investigating customer history, order delivery timelines, and previous tickets.'
    });

    context.investigationResult = await investigationAgent.run({ ticket });
    this.updateRunStepStatus(run.id, 2, 'COMPLETED');

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

    db.logAudit({
      ticket_id: ticketId,
      event_type: 'POLICY_EVALUATED',
      agent: policyAgent.name,
      description: `Policy evaluation: ${context.policyResult.decision}. Policy cited: ${context.policyResult.policyCited}. Requires human approval: ${context.policyResult.requiresHumanApproval}`,
      metadata: context.policyResult
    });

    // Step 4: Action Agent
    this.updateRunStepStatus(run.id, 4, 'RUNNING');
    context.actionResult = await actionAgent.run({
      ticket,
      runId: run.id,
      stepId: 'step-004',
      policyResult: context.policyResult,
      investigationResult: context.investigationResult,
      isApproved: resumeFromApproval
    });

    if (context.actionResult.status === 'WAITING_APPROVAL') {
      this.updateRunStepStatus(run.id, 4, 'WAITING_APPROVAL');
      db.update('agent_runs', run.id, { status: 'WAITING_APPROVAL' });

      // Notify supervisor via internal approval requested email
      const approval = db.findById('approvals', context.actionResult.approvalId);
      if (approval) {
        emailService.notifyApprovalRequested({ ticket, customer, approval }).catch(err => {
          console.warn('[ORCHESTRATOR] Approval email notice:', err.message);
        });
      }

      return {
        status: 'WAITING_APPROVAL',
        runId: run.id,
        approvalId: context.actionResult.approvalId,
        message: 'Action paused. Human supervisor approval required to proceed.'
      };
    }

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

    const verificationResult = await verificationAgent.run({
      ticket,
      plan: db.findById('agent_runs', run.id).plan,
      investigationResult: context.investigationResult,
      policyResult: context.policyResult,
      actionResult: context.actionResult,
      communicationResult: context.communicationResult
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
      this.updateRunStepStatus(run.id, 6, 'FAILED');
      db.update('agent_runs', run.id, { status: 'FAILED' });
      db.update('tickets', ticketId, { status: 'FAILED' });

      db.logAudit({
        ticket_id: ticketId,
        event_type: 'VERIFICATION_FAILED',
        agent: verificationAgent.name,
        description: `Verification gate rejected ticket resolution: ${verificationResult.conclusion}`,
        metadata: verificationResult
      });

      return {
        status: 'FAILED',
        runId: run.id,
        verificationResult,
        message: 'Resolution failed verification gates.'
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

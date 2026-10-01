import { tools } from '../tools/index.js';
import { db } from '../db/store.js';

export class ActionAgent {
  constructor() {
    this.name = 'Action Agent';
    this.badge = '⚡';
  }

  async run({ ticket, runId, stepId, policyResult, investigationResult, isApproved = false }) {
    const action = policyResult.recommendedAction;
    const requiresApproval = policyResult.requiresHumanApproval && !isApproved;

    // If human approval is strictly required and not yet granted, create approval request & pause
    if (requiresApproval) {
      const approval = db.insert('approvals', {
        ticket_id: ticket.id,
        run_id: runId,
        step_id: stepId,
        action,
        status: 'PENDING',
        reason: policyResult.reason,
        evidence: {
          customerName: investigationResult.customerName,
          orderId: investigationResult.orderId,
          productName: investigationResult.productName,
          daysSinceDelivery: investigationResult.daysSinceDelivery,
          policyCited: policyResult.policyCited
        },
        requested_by: this.name
      });

      db.update('tickets', ticket.id, { status: 'WAITING_APPROVAL' });

      db.logAudit({
        ticket_id: ticket.id,
        event_type: 'APPROVAL_REQUESTED',
        agent: this.name,
        description: `Human approval requested for sensitive action '${action}' (${approval.id})`,
        metadata: { approvalId: approval.id, action }
      });

      return {
        actionExecuted: action,
        status: 'WAITING_APPROVAL',
        requiresApproval: true,
        approvalId: approval.id,
        details: { approval },
        resultMessage: `Workflow paused. Approval ${approval.id} generated for supervisor review.`
      };
    }

    // Otherwise execute the approved or low-risk tool
    let result = null;
    let message = '';

    if (action === 'create_replacement_request') {
      result = await tools.createReplacementRequest({
        ticketId: ticket.id,
        orderId: investigationResult.orderId,
        reason: policyResult.reason,
        replacementSku: 'HP-ANC-GR-EXP',
        autoApprove: true
      });
      message = `Replacement order ${result.replacementId} successfully provisioned and queued with warehouse logistics.`;
    } else if (action === 'cancel_processing_order') {
      const order = db.findById('orders', investigationResult.orderId);
      if (order) {
        db.update('orders', order.id, { status: 'CANCELLED' });
      }
      result = { cancelledOrderId: investigationResult.orderId };
      message = `Order ${investigationResult.orderId} successfully cancelled before shipment.`;
    } else if (action === 'create_escalation') {
      result = await tools.createEscalation({
        ticketId: ticket.id,
        reason: policyResult.reason
      });
      message = `Ticket escalated to Tier-2 Customer Operations Lead.`;
    } else {
      result = { action };
      message = `Action ${action} executed successfully.`;
    }

    db.logAudit({
      ticket_id: ticket.id,
      event_type: 'TOOL_EXECUTED',
      agent: this.name,
      description: message,
      metadata: result
    });

    return {
      actionExecuted: action,
      status: 'COMPLETED',
      requiresApproval: false,
      details: result,
      resultMessage: message
    };
  }
}

export const actionAgent = new ActionAgent();

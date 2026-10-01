import { db } from '../db/store.js';
import { orchestratorAgent } from '../agents/orchestrator.js';
import { supervisorAgent } from '../agents/supervisorAgent.js';
import { emailService } from '../services/emailService.js';

export const listApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;
    let approvals = db.find('approvals');

    if (status) {
      if (status.toUpperCase() === 'PENDING') {
        approvals = approvals.filter(a => a.status === 'PENDING' || a.status === 'ESCALATED');
      } else {
        approvals = approvals.filter(a => a.status.toLowerCase() === status.toLowerCase());
      }
    }

    const populated = approvals.map(a => {
      const ticket = db.findById('tickets', a.ticket_id);
      const customer = ticket?.customer_id ? db.findById('customers', ticket.customer_id) : null;
      const order = ticket?.order_id ? db.findById('orders', ticket.order_id) : null;
      const reviewer = a.reviewed_by ? db.findById('users', a.reviewed_by) : null;

      // Determine decision type badge if not explicitly set
      let decisionType = a.decision_type;
      if (!decisionType) {
        if (a.status === 'APPROVED') {
          decisionType = a.decision_maker?.includes('Supervisor') || a.reviewed_by === 'supervisor_agent' ? 'AI_APPROVED' : 'HUMAN_APPROVED';
        } else if (a.status === 'REJECTED') {
          decisionType = a.decision_maker?.includes('Supervisor') || a.reviewed_by === 'supervisor_agent' ? 'AI_REJECTED' : 'HUMAN_REJECTED';
        } else if (a.status === 'ESCALATED') {
          decisionType = 'ESCALATED';
        }
      }

      return {
        ...a,
        decision_type: decisionType,
        decision_maker: a.decision_maker || (decisionType === 'AI_APPROVED' || decisionType === 'AI_REJECTED' ? 'ResolveAI Supervisor Agent' : (reviewer ? reviewer.name : null)),
        ticket: ticket ? { id: ticket.id, title: ticket.title, priority: ticket.priority, status: ticket.status, category: ticket.category } : null,
        customer: customer ? { id: customer.id, name: customer.name, email: customer.email, tier: customer.tier } : null,
        order: order ? { id: order.id, product_name: order.product_name, amount: order.amount, delivery_date: order.delivery_date, status: order.status } : null,
        reviewer: reviewer ? { name: reviewer.name, role: reviewer.role } : null
      };
    });

    populated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint for inspecting the Supervisor's policy & evidence evaluation on an approval request
 */
export const evaluateApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const evaluation = await supervisorAgent.evaluateApprovalRequest(id);
    return res.json(evaluation);
  } catch (err) {
    next(err);
  }
};

/**
 * Triggers the Supervisor Agent to evaluate and execute its autonomous approval decision
 */
export const aiDecideApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approval = db.findById('approvals', id);
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    const evaluation = await supervisorAgent.evaluateApprovalRequest(id);

    if (evaluation.decision === 'APPROVE') {
      await supervisorAgent.approveRequest({
        approvalId: id,
        actor: 'ResolveAI Supervisor Agent',
        isAI: true
      });

      // Resume orchestrator workflow!
      const workflowResult = await orchestratorAgent.runWorkflow({
        ticketId: approval.ticket_id,
        resumeFromApproval: true,
        approvedAction: approval.action
      });

      return res.json({
        success: true,
        decision: 'APPROVE',
        decision_type: 'AI_APPROVED',
        approval: db.findById('approvals', id),
        evaluation,
        workflowResult
      });
    } else if (evaluation.decision === 'REJECT') {
      await supervisorAgent.rejectRequest({
        approvalId: id,
        reason: evaluation.reason,
        actor: 'ResolveAI Supervisor Agent',
        isAI: true
      });

      return res.json({
        success: true,
        decision: 'REJECT',
        decision_type: 'AI_REJECTED',
        approval: db.findById('approvals', id),
        evaluation
      });
    } else {
      await supervisorAgent.escalateRequest({
        approvalId: id,
        reason: evaluation.reason,
        actor: 'ResolveAI Supervisor Agent'
      });

      return res.json({
        success: true,
        decision: 'ESCALATE',
        decision_type: 'ESCALATED',
        approval: db.findById('approvals', id),
        evaluation
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Human supervisor approval
 */
export const approveAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approval = db.findById('approvals', id);

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status === 'APPROVED') {
      return res.status(400).json({ error: 'Approval is already APPROVED' });
    }

    // Update approval status as HUMAN APPROVED
    const actorName = req.user?.name || 'Human Supervisor';
    const updated = db.update('approvals', id, {
      status: 'APPROVED',
      decision_type: 'HUMAN_APPROVED',
      decision_maker: actorName,
      reviewed_by: req.user?.id || 'usr-manager-01',
      reviewed_at: new Date().toISOString()
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: 'APPROVAL_GRANTED',
      agent: actorName,
      description: `Human Supervisor (${actorName}) authorized action '${approval.action}' for ticket #${approval.ticket_id.slice(0, 8)}`,
      metadata: { approvalId: id, action: approval.action, actor: actorName, isHuman: true }
    });

    const ticket = db.findById('tickets', approval.ticket_id);
    const customer = ticket?.customer_id ? db.findById('customers', ticket.customer_id) : null;
    if (ticket && customer) {
      emailService.notifyApprovalCompleted({ ticket, customer, approval }).catch(err => {
        console.warn('[APPROVAL] Approval completed notification notice:', err.message);
      });
    }

    // Automatically resume orchestrator workflow!
    const resumeResult = await orchestratorAgent.runWorkflow({
      ticketId: approval.ticket_id,
      resumeFromApproval: true,
      approvedAction: approval.action
    });

    return res.json({
      success: true,
      approval: updated,
      workflowStatus: resumeResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Human supervisor rejection
 */
export const rejectAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Rejected by supervisor review' } = req.body;
    const approval = db.findById('approvals', id);

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    const actorName = req.user?.name || 'Human Supervisor';
    const updated = db.update('approvals', id, {
      status: 'REJECTED',
      decision_type: 'HUMAN_REJECTED',
      decision_maker: actorName,
      reviewed_by: req.user?.id || 'usr-manager-01',
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    });

    db.update('tickets', approval.ticket_id, {
      status: 'RESOLVED',
      resolution_summary: `Human Supervisor (${actorName}) rejected automated action: ${reason}. Case closed with policy guidance.`
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: 'APPROVAL_REJECTED',
      agent: actorName,
      description: `Human Supervisor (${actorName}) rejected action '${approval.action}': ${reason}`,
      metadata: { approvalId: id, reason, isHuman: true }
    });

    return res.json({
      success: true,
      approval: updated,
      message: `Action rejected by ${actorName}.`
    });
  } catch (err) {
    next(err);
  }
};

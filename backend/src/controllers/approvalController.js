import { db } from '../db/store.js';
import { orchestratorAgent } from '../agents/orchestrator.js';
import { emailService } from '../services/emailService.js';

export const listApprovals = async (req, res, next) => {
  try {
    const { status } = req.query;
    let approvals = db.find('approvals');

    if (status) {
      approvals = approvals.filter(a => a.status.toLowerCase() === status.toLowerCase());
    }

    const populated = approvals.map(a => {
      const ticket = db.findById('tickets', a.ticket_id);
      const customer = ticket?.customer_id ? db.findById('customers', ticket.customer_id) : null;
      const order = ticket?.order_id ? db.findById('orders', ticket.order_id) : null;
      const reviewer = a.reviewed_by ? db.findById('users', a.reviewed_by) : null;

      return {
        ...a,
        ticket: ticket ? { id: ticket.id, title: ticket.title, priority: ticket.priority, status: ticket.status } : null,
        customer: customer ? { name: customer.name, email: customer.email, tier: customer.tier } : null,
        order: order ? { id: order.id, product_name: order.product_name, amount: order.amount } : null,
        reviewer: reviewer ? { name: reviewer.name, role: reviewer.role } : null
      };
    });

    populated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const approveAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approval = db.findById('approvals', id);

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'PENDING') {
      return res.status(400).json({ error: `Approval is already ${approval.status}` });
    }

    // Update approval status
    db.update('approvals', id, {
      status: 'APPROVED',
      reviewed_by: req.user?.id || 'usr-manager-01',
      reviewed_at: new Date().toISOString()
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: 'APPROVAL_GRANTED',
      agent: req.user ? req.user.name : 'Human Supervisor',
      description: `Authorized sensitive action '${approval.action}' for ticket #${approval.ticket_id.slice(0, 8)}`,
      metadata: { approvalId: id, action: approval.action }
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
      approval: db.findById('approvals', id),
      workflowStatus: resumeResult
    });
  } catch (err) {
    next(err);
  }
};

export const rejectAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Rejected by supervisor review' } = req.body;
    const approval = db.findById('approvals', id);

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    db.update('approvals', id, {
      status: 'REJECTED',
      reviewed_by: req.user?.id || 'usr-manager-01',
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    });

    db.update('tickets', approval.ticket_id, {
      status: 'ESCALATED',
      resolution_summary: `Supervisor rejected automated action: ${reason}. Escalated for manual tier-2 handling.`
    });

    db.logAudit({
      ticket_id: approval.ticket_id,
      event_type: 'APPROVAL_REJECTED',
      agent: req.user ? req.user.name : 'Human Supervisor',
      description: `Supervisor rejected action '${approval.action}': ${reason}`,
      metadata: { approvalId: id, reason }
    });

    return res.json({
      success: true,
      approval: db.findById('approvals', id),
      message: 'Action rejected and ticket escalated to Tier-2 supervisor queue.'
    });
  } catch (err) {
    next(err);
  }
};

// ResolveAI Transactional Email Templates
// Responsive, accessible, branded HTML with plain-text fallbacks

const sanitize = (str = '') => {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getBaseLayout = ({ title, preheader, contentHtml, ticketId, status = 'IN PROGRESS' }) => {
  const statusColor = status === 'RESOLVED' ? '#10b981' : status === 'WAITING_APPROVAL' ? '#f59e0b' : '#3b82f6';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitize(title)}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0d13; color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
    .card { background-color: #131722; border: 1px solid #1f293d; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { padding: 28px 32px 20px; border-bottom: 1px solid #1f293d; display: flex; align-items: center; justify-content: space-between; }
    .logo-badge { display: inline-block; background: #ffffff; color: #000000; font-weight: 900; font-size: 16px; padding: 6px 12px; border-radius: 8px; letter-spacing: -0.03em; }
    .ticket-pill { background: #1f293d; color: #9ca3af; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #d1d5db; }
    .h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.02em; }
    .status-badge { display: inline-block; background: rgba(255,255,255,0.05); border: 1px solid ${statusColor}; color: ${statusColor}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 6px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .highlight-box { background: #1a202c; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #1f293d; font-size: 12px; color: #6b7280; text-align: center; }
    .button { display: inline-block; background: #ffffff; color: #000000; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 999px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="logo-badge">ResolveAI</span>
        ${ticketId ? `<span class="ticket-pill">Ticket #${sanitize(ticketId)}</span>` : ''}
      </div>
      <div class="content">
        <div class="status-badge">${sanitize(status)}</div>
        <h1 class="h1">${sanitize(title)}</h1>
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">This is an automated operational notification dispatched by ResolveAI Customer Operations.</p>
        <p style="margin: 0;">Case Reference: #${sanitize(ticketId || 'GEN-01')} &bull; Powered by Autonomous Multi-Agent AI</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const emailTemplates = {
  // 1. Task Started
  taskStarted: ({ customerName = 'Valued Customer', ticketId, issueSummary, status = 'PROCESSING', timestamp }) => {
    const timeStr = timestamp ? new Date(timestamp).toUTCString() : new Date().toUTCString();
    const title = 'Your Request Is Being Processed';
    const subject = `ResolveAI — Your Request Is Being Processed [Ticket #${ticketId}]`;

    const contentHtml = `
      <p>Hello ${sanitize(customerName)},</p>
      <p>ResolveAI has received your customer support case and our autonomous multi-agent system has begun investigating your request.</p>
      <div class="highlight-box">
        <strong>Reported Issue:</strong><br>
        ${sanitize(issueSummary)}
      </div>
      <p><strong>Timeline:</strong> Started at ${sanitize(timeStr)}</p>
      <p>Our triage and investigation agents are examining policy guidelines and order fulfillment records. You will receive an immediate update once resolution steps are determined.</p>
    `;

    const text = `Hello ${customerName},

ResolveAI has received your customer support case and our autonomous multi-agent system has begun investigating your request.

Ticket #${ticketId}
Reported Issue: ${issueSummary}
Status: ${status}
Started: ${timeStr}

You will receive an update once resolution steps are determined.

— ResolveAI Customer Operations`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status }),
      text
    };
  },

  // 2. Task Update
  taskUpdate: ({ customerName = 'Valued Customer', ticketId, stage, message, status = 'IN PROGRESS' }) => {
    const title = `Update on Ticket #${ticketId}`;
    const subject = `ResolveAI — Update on Ticket #${ticketId}`;

    const contentHtml = `
      <p>Hello ${sanitize(customerName)},</p>
      <p>An important milestone was completed regarding your support case:</p>
      <div class="highlight-box">
        <strong>Stage:</strong> ${sanitize(stage)}<br>
        <strong>Details:</strong> ${sanitize(message)}
      </div>
      <p>Our autonomous operations platform is executing subsequent verification gates.</p>
    `;

    const text = `Hello ${customerName},

Update regarding Ticket #${ticketId}:
Stage: ${stage}
Details: ${message}
Current Status: ${status}

— ResolveAI Customer Operations`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status }),
      text
    };
  },

  // 3. Approval Requested (Internal Manager Alert)
  approvalRequested: ({ managerName = 'Support Supervisor', ticketId, customerName, actionRequested, evidence, policy, reason, approvalUrl }) => {
    const title = `Action Approval Required: Ticket #${ticketId}`;
    const subject = `[Action Required] ResolveAI Approval Requested — Ticket #${ticketId}`;

    const contentHtml = `
      <p>Attention ${sanitize(managerName)},</p>
      <p>The ResolveAI Action Agent has reached a sensitive operational threshold and paused for required supervisor authorization.</p>
      <div class="highlight-box">
        <strong>Customer:</strong> ${sanitize(customerName)}<br>
        <strong>Action Requested:</strong> <code>${sanitize(actionRequested)}</code><br>
        <strong>Policy Cited:</strong> ${sanitize(policy)}<br>
        <strong>Reason:</strong> ${sanitize(reason)}
      </div>
      ${evidence ? `<p style="font-size: 13px; color: #9ca3af;"><strong>Evidence Summary:</strong> ${sanitize(typeof evidence === 'object' ? JSON.stringify(evidence) : evidence)}</p>` : ''}
      <a href="${approvalUrl || 'http://localhost:5173/approvals'}" class="button" style="color: #000000 !important;">Review & Authorize in Dashboard &rarr;</a>
    `;

    const text = `Attention ${managerName},

Action Approval Required for Ticket #${ticketId}:
Customer: ${customerName}
Action Requested: ${actionRequested}
Policy Cited: ${policy}
Reason: ${reason}

Please log in to the ResolveAI Supervisor Dashboard to review and approve:
${approvalUrl || 'http://localhost:5173/approvals'}`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status: 'WAITING_APPROVAL' }),
      text
    };
  },

  // 4. Approval Completed
  approvalCompleted: ({ customerName = 'Valued Customer', ticketId, actionApproved, status = 'APPROVED' }) => {
    const title = 'Your Request Has Been Approved';
    const subject = `ResolveAI — Your Request Has Been Approved [Ticket #${ticketId}]`;

    const contentHtml = `
      <p>Hello ${sanitize(customerName)},</p>
      <p>Good news! Your customer operations request has been formally reviewed and approved by our management team.</p>
      <div class="highlight-box">
        <strong>Action Authorized:</strong> ${sanitize(actionApproved)}<br>
        <strong>Status:</strong> Approved & Queued for Fulfillment
      </div>
      <p>Our autonomous action system is executing the authorized workflow now.</p>
    `;

    const text = `Hello ${customerName},

Good news! Your request for Ticket #${ticketId} has been approved:
Action Authorized: ${actionApproved}
Status: ${status}

— ResolveAI Customer Operations`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status }),
      text
    };
  },

  // 5. Action Completed
  actionCompleted: ({ customerName = 'Valued Customer', ticketId, action, referenceId, status = 'COMPLETED' }) => {
    const title = 'Your Resolution Action Has Been Processed';
    const subject = `ResolveAI — Replacement & Resolution Executed [Ticket #${ticketId}]`;

    const contentHtml = `
      <p>Hello ${sanitize(customerName)},</p>
      <p>The action associated with your case has been successfully executed in our fulfillment systems.</p>
      <div class="highlight-box">
        <strong>Action Executed:</strong> ${sanitize(action)}<br>
        <strong>Reference ID:</strong> <code>${sanitize(referenceId || 'N/A')}</code>
      </div>
      <p>Fulfillment dispatch has been confirmed. You will receive active tracking details as soon as the item leaves our warehouse.</p>
    `;

    const text = `Hello ${customerName},

Your resolution action for Ticket #${ticketId} has been processed:
Action: ${action}
Reference ID: ${referenceId || 'N/A'}
Status: ${status}

— ResolveAI Customer Operations`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status }),
      text
    };
  },

  // 6. Final Resolution
  finalResolution: ({ customerName = 'Valued Customer', ticketId, originalIssue, resolutionSummary, customerMessage, referenceId, timestamp }) => {
    const title = 'Your Issue Has Been Resolved';
    const subject = `ResolveAI — Your Issue Has Been Resolved [Ticket #${ticketId}]`;
    const timeStr = timestamp ? new Date(timestamp).toUTCString() : new Date().toUTCString();

    const contentHtml = `
      <p>Hello ${sanitize(customerName)},</p>
      <p>We are pleased to inform you that case <strong>#${sanitize(ticketId)}</strong> has been verified and fully resolved.</p>
      <div class="highlight-box">
        <strong>Resolution Summary:</strong><br>
        ${sanitize(resolutionSummary || 'Case concluded with complete verification compliance.')}
      </div>
      ${customerMessage ? `<div style="background: rgba(255,255,255,0.03); border: 1px solid #1f293d; border-radius: 8px; padding: 16px; margin: 16px 0; font-style: italic;">"${sanitize(customerMessage).replace(/\n/g, '<br>')}"</div>` : ''}
      <p><strong>Resolved Timestamp:</strong> ${sanitize(timeStr)}</p>
      ${referenceId ? `<p><strong>Fulfillment Reference:</strong> <code>${sanitize(referenceId)}</code></p>` : ''}
      <p>Thank you for your patience and for choosing ResolveAI.</p>
    `;

    const text = `Hello ${customerName},

Case #${ticketId} has been verified and fully resolved.

Original Issue: ${originalIssue || 'Reported Support Request'}
Resolution Summary: ${resolutionSummary || 'Completed'}
Resolved At: ${timeStr}
${referenceId ? `Fulfillment Reference: ${referenceId}\n` : ''}
${customerMessage ? `\n"${customerMessage}"\n` : ''}

Thank you for your patience.
— ResolveAI Customer Operations`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status: 'RESOLVED' }),
      text
    };
  },

  // 7. Manual Custom Update
  manualUpdate: ({ customerName = 'Valued Customer', ticketId, customSubject, message, agentName = 'Customer Support Lead' }) => {
    const title = customSubject || `Direct Update on Ticket #${ticketId}`;
    const subject = customSubject.startsWith('ResolveAI') ? customSubject : `ResolveAI — ${customSubject} [Ticket #${ticketId}]`;

    const contentHtml = `
      <p>Hello ${sanitize(customerName)},</p>
      <p>A member of our customer care team has sent you an update regarding Ticket #${sanitize(ticketId)}:</p>
      <div class="highlight-box">
        ${sanitize(message).replace(/\n/g, '<br>')}
      </div>
      <p style="margin-top: 24px; color: #9ca3af; font-size: 14px;">Dispatched by: <strong>${sanitize(agentName)}</strong></p>
    `;

    const text = `Hello ${customerName},

Update regarding Ticket #${ticketId}:

${message}

Dispatched by: ${agentName}
— ResolveAI Customer Operations`;

    return {
      subject,
      html: getBaseLayout({ title, contentHtml, ticketId, status: 'COMMUNICATED' }),
      text
    };
  }
};

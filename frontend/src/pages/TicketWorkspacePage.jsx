import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import RejectionModal from '../components/RejectionModal';
import SendUpdateModal from '../components/SendUpdateModal';
import EmailNotificationList from '../components/EmailNotificationList';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Package,
  User,
  RefreshCw,
  FileCheck,
  Mail,
  UserCheck,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Terminal,
  Layers
} from 'lucide-react';

export default function TicketWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [targetApproval, setTargetApproval] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

  // Email notifications & manual update state
  const [emails, setEmails] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [sendUpdateOpen, setSendUpdateOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendEmailError, setSendEmailError] = useState('');
  const [retryingEmailId, setRetryingEmailId] = useState(null);

  // Ticket assignment & internal notes state
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const retryCountRef = useRef(0);

  const fetchTicket = useCallback(async () => {
    try {
      const data = await api.getTicket(id);
      setTicket(data);
      retryCountRef.current = 0;
    } catch (err) {
      retryCountRef.current += 1;
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEmails = useCallback(async () => {
    try {
      setEmailLoading(true);
      const emailList = await api.getTicketEmails(id);
      setEmails(emailList || []);
    } catch (err) {
      console.warn('Failed to load ticket emails:', err);
    } finally {
      setEmailLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
    fetchEmails();

    let timeoutId = null;
    let isCancelled = false;

    const scheduleNextPoll = () => {
      if (isCancelled) return;
      if (document.visibilityState === 'hidden') return;

      // Stop polling when case reaches terminal resolution
      if (ticket && (ticket.status === 'RESOLVED' || ticket.status === 'FAILED' || ticket.status === 'ESCALATED')) {
        return;
      }

      // Exponential backoff on errors, capped at 25s
      const delay = Math.min(3500 * Math.pow(1.5, retryCountRef.current), 25000);
      timeoutId = setTimeout(async () => {
        await fetchTicket();
        scheduleNextPoll();
      }, delay);
    };

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTicket();
        scheduleNextPoll();
      } else {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fetchTicket, ticket?.status]);

  const handleRunAI = async () => {
    setError('');
    setActionError('');
    setRunning(true);
    try {
      const result = await api.runWorkflow(id);
      await Promise.all([fetchTicket(), fetchEmails()]);
      if (result.status === 'RESOLVED') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setError(err.message || 'AI workflow error');
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async (approvalId) => {
    setApproving(true);
    setActionError('');
    try {
      const res = await api.approve(approvalId);
      await Promise.all([fetchTicket(), fetchEmails()]);
      if (res.workflowStatus?.status === 'RESOLVED') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setActionError(err.message || 'Approval authorization failed');
    } finally {
      setApproving(false);
    }
  };

  const handleSendCustomerUpdate = async (payload) => {
    setSendingEmail(true);
    setSendEmailError('');
    try {
      await api.sendTicketUpdateEmail(id, payload);
      setSendUpdateOpen(false);
      await Promise.all([fetchEmails(), fetchTicket()]);
    } catch (err) {
      setSendEmailError(err.message || 'Failed to send update email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRetryEmail = async (emailId) => {
    setRetryingEmailId(emailId);
    try {
      await api.retryEmail(emailId);
      await fetchEmails();
    } catch (err) {
      console.error('Email retry failed:', err);
      setActionError(err.message || 'Failed to retry email delivery');
    } finally {
      setRetryingEmailId(null);
    }
  };

  const handleOpenRejectModal = (approval) => {
    setTargetApproval(approval);
    setRejectionError('');
    setRejectionModalOpen(true);
  };

  const handleConfirmReject = async (reason) => {
    if (!targetApproval) return;
    setRejecting(true);
    setRejectionError('');
    try {
      await api.reject(targetApproval.id, reason);
      setRejectionModalOpen(false);
      setTargetApproval(null);
      await fetchTicket();
    } catch (err) {
      setRejectionError(err.message || 'Rejection failed');
    } finally {
      setRejecting(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleAssignTicket = async (userId) => {
    setAssigning(true);
    setAssignSuccess('');
    setActionError('');
    try {
      await api.assignTicket(id, userId || null);
      setTicket(prev => ({
        ...prev,
        assigned_user_id: userId || null
      }));
      setAssignSuccess('Assignment updated');
      setTimeout(() => setAssignSuccess(''), 3000);
      fetchTicket();
    } catch (err) {
      setActionError(err.message || 'Failed to update assignment');
    } finally {
      setAssigning(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    const cleanNote = noteContent.trim();
    if (!cleanNote) return;
    setAddingNote(true);
    setActionError('');
    try {
      const res = await api.addTicketInternalNote(id, cleanNote);
      if (res && res.notes) {
        setTicket(prev => ({
          ...prev,
          internal_notes: res.notes
        }));
      } else {
        await fetchTicket();
      }
      setNoteContent('');
    } catch (err) {
      setActionError(err.message || 'Failed to add internal note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading case workspace...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Ticket Not Found</h2>
        <button onClick={() => navigate('/tickets')} className="btn-secondary" style={{ marginTop: '16px' }}>
          Back to Tickets
        </button>
      </div>
    );
  }

  const latestRun = ticket.latestRun;
  const planSteps = latestRun?.plan || [
    { step: 1, agent: 'triage_agent', action: 'classify_intent', description: 'Triage issue category and customer intent', status: 'PENDING' },
    { step: 2, agent: 'investigation_agent', action: 'retrieve_order', description: 'Retrieve order history and delivery timestamp', status: 'PENDING' },
    { step: 3, agent: 'policy_agent', action: 'check_policy_eligibility', description: 'Evaluate against company warranty policies', status: 'PENDING' },
    { step: 4, agent: 'action_agent', action: 'create_replacement_request', description: 'Provision replacement shipment (Requires Supervisor Gate)', status: 'PENDING' },
    { step: 5, agent: 'communication_agent', action: 'generate_customer_response', description: 'Draft customer notification email', status: 'PENDING' },
    { step: 6, agent: 'verification_agent', action: 'verify_resolution', description: 'Audit 5-point verification checklist before closing', status: 'PENDING' }
  ];

  const pendingApproval = ticket.pendingApproval;

  return (
    <div style={{ maxWidth: '1600px', marginInline: 'auto' }}>
      {/* Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/tickets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Case #{ticket.id}
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: ticket.status === 'RESOLVED' ? 'var(--status-res-bg)' : ticket.status === 'WAITING_APPROVAL' ? 'var(--status-appr-bg)' : 'var(--status-open-bg)',
                  color: ticket.status === 'RESOLVED' ? 'var(--status-res-text)' : ticket.status === 'WAITING_APPROVAL' ? 'var(--status-appr-text)' : 'var(--status-open-text)'
                }}
              >
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Created: {new Date(ticket.created_at).toLocaleString()} • Priority: <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{ticket.priority}</strong>
            </div>
          </div>
        </div>

        {/* Start / Run Autonomous Agent Button & Manual Send Update */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setSendEmailError('');
              setSendUpdateOpen(true);
            }}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingInline: '16px'
            }}
          >
            <Mail size={16} />
            <span>Send Update</span>
          </button>

          <button
            onClick={handleRunAI}
            disabled={running || ticket.status === 'RESOLVED' || ticket.status === 'WAITING_APPROVAL'}
            className="btn-primary"
            style={{
              opacity: running || ticket.status === 'RESOLVED' || ticket.status === 'WAITING_APPROVAL' ? 0.6 : 1,
              cursor: running || ticket.status === 'RESOLVED' || ticket.status === 'WAITING_APPROVAL' ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={16} className={running ? 'spin' : ''} />
            <span>
              {running ? 'Agents Collaborating...' : ticket.status === 'RESOLVED' ? 'Ticket Verified & Resolved' : ticket.status === 'WAITING_APPROVAL' ? 'Waiting for Approval Gate' : 'Run ResolveAI'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '24px', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 3-Column Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '24px' }}>
        {/* Left Column (Columns 1-4): Ticket & Context Dossier */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }} className="workspace-left-col">
          {/* Issue Statement */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Customer Issue Statement
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              "{ticket.title}"
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </p>
          </div>

          {/* Customer CRM Record */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                <User size={15} />
                <span>Customer Profile</span>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--status-proc-bg)', color: 'var(--status-proc-text)' }}>
                {ticket.customer?.tier || 'Standard'}
              </span>
            </div>

            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{ticket.customer?.name || 'Customer Record'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ticket.customer?.email}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ticket.customer?.phone}</div>
            {ticket.customer?.company && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
                Org: {ticket.customer?.company}
              </div>
            )}
          </div>

          {/* Transaction & Order Dossier */}
          {ticket.order && (
            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  <Package size={15} />
                  <span>Verified Order</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)' }}>
                  #{ticket.order.id}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{ticket.order.product_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Value:</span>
                <span style={{ fontWeight: 700 }}>${Number(ticket.order.amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Carrier Status:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{ticket.order.status}</span>
              </div>
              {ticket.order.delivery_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Delivered:</span>
                  <span>{new Date(ticket.order.delivery_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Manager Ticket Assignment */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                <UserCheck size={15} />
                <span>Assigned Staff</span>
              </div>
              {assignSuccess && (
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ✓ {assignSuccess}
                </span>
              )}
            </div>

            <select
              value={ticket.assigned_user_id || ''}
              onChange={(e) => handleAssignTicket(e.target.value)}
              disabled={assigning}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Unassigned (Queue)</option>
              <option value="usr-agent-01">Sarah Connor (Support Agent)</option>
              <option value="usr-manager-01">James Rodriguez (Operations Manager)</option>
              <option value="usr-admin-01">Marcus Vance (Lead Administrator)</option>
            </select>
          </div>

          {/* Private Internal Notes (Staff-only) */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                <Lock size={15} color="var(--accent-amber)" />
                <span>Internal Notes</span>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                Staff Only
              </span>
            </div>

            {/* Notes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
              {(!ticket.internal_notes || ticket.internal_notes.length === 0) ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No internal notes yet.
                </div>
              ) : (
                ticket.internal_notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                        {note.author} ({note.authorRole || 'staff'})
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {note.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddInternalNote} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add private note..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={addingNote || !noteContent.trim()}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: (!noteContent.trim() || addingNote) ? 0.6 : 1
                }}
              >
                {addingNote ? (
                  <RefreshCw size={13} className="spin" />
                ) : (
                  <Send size={13} />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Center Column (Columns 5-8): Resolution Plan & Approval Modal */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '20px' }} className="workspace-center-col">
          {/* Action Error Banner */}
          {actionError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.88rem' }}>
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          )}

          {/* Human Approval Gate Alert (When Paused) */}
          {pendingApproval && (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                boxShadow: 'var(--shadow-card)',
                animation: 'fadeUp 0.4s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                <ShieldAlert size={18} />
                <span>Human Supervisor Approval Gate</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#78350f', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Authorization Required: {pendingApproval.action}
              </h3>
              <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '16px' }}>
                {pendingApproval.reason}
              </p>

              {pendingApproval.evidence && (
                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #fef3c7', fontSize: '0.82rem', marginBottom: '20px' }}>
                  <div style={{ fontWeight: 700, color: '#451a03', marginBottom: '6px' }}>Verified Evidence Dossier:</div>
                  <ul style={{ paddingLeft: '18px', color: '#78350f', lineHeight: 1.6 }}>
                    <li>Item: {pendingApproval.evidence.productName || pendingApproval.evidence.product || 'Astra SoundPro Wireless ANC Headphones'}</li>
                    <li>Carrier Delivery: Within 14-day warranty requirement</li>
                    <li>Policy Governing Action: {pendingApproval.evidence.policyCited || 'POL-001 (Section 3)'}</li>
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleApprove(pendingApproval.id)}
                  disabled={approving}
                  className="btn-primary"
                  style={{ flex: 1, height: '44px', fontSize: '0.92rem' }}
                >
                  <Check size={16} />
                  <span>{approving ? 'Executing...' : 'Authorize Action & Resume'}</span>
                </button>

                <button
                  onClick={() => handleOpenRejectModal(pendingApproval)}
                  disabled={approving}
                  className="btn-secondary"
                  style={{ height: '44px', color: '#b91c1c', borderColor: '#fca5a5', fontSize: '0.92rem' }}
                >
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Autonomous Resolution Plan Checklist */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Autonomous Resolution Plan
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Generated by Orchestrator Agent • 6-Step DAG Execution
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)' }}>
                Risk: {latestRun?.risk_level || 'Medium'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {planSteps.map((step, idx) => {
                const isCompleted = step.status === 'COMPLETED';
                const isRunning = step.status === 'RUNNING';
                const isWaiting = step.status === 'WAITING_APPROVAL';

                return (
                  <div
                    key={step.step || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isRunning ? 'var(--bg-secondary)' : isWaiting ? '#fffbeb' : 'var(--bg-tertiary)',
                      border: '1px solid',
                      borderColor: isRunning ? '#000000' : isWaiting ? '#fed7aa' : 'transparent',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {isCompleted ? (
                        <CheckCircle2 size={18} color="var(--accent-emerald)" />
                      ) : isRunning ? (
                        <RefreshCw size={18} color="#000000" className="spin" />
                      ) : isWaiting ? (
                        <ShieldAlert size={18} color="var(--accent-amber)" />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border-strong)' }}></div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isCompleted || isRunning ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          Step {step.step}: {step.action.replace(/_/g, ' ')}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {step.agent?.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5-Point Deterministic Verification Gate Card */}
          {latestRun?.verification_result && (
            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color={latestRun.verification_result.verified ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>5-Point Verification Audit Gate</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Enforced by Verification Agent before granting RESOLVED state
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {latestRun.recovery_attempts > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                      Recovered (Attempt #{latestRun.recovery_attempts})
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: latestRun.verification_result.verified ? 'var(--status-res-bg)' : 'var(--status-esc-bg)',
                      color: latestRun.verification_result.verified ? 'var(--status-res-text)' : 'var(--status-esc-text)'
                    }}
                  >
                    {latestRun.verification_result.verified ? 'AUDIT PASSED' : 'GATE REJECTED'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'All Prior Steps Executed', passed: latestRun.verification_result.checklist?.allStepsExecuted },
                  { label: 'Evidence Grounded & Verified', passed: latestRun.verification_result.checklist?.evidenceSufficient },
                  { label: 'Company Policy Compliant', passed: latestRun.verification_result.checklist?.policyCompliant },
                  { label: 'Supervisor Approval Obtained', passed: latestRun.verification_result.checklist?.approvalObtained },
                  { label: 'Customer Response Formulated', passed: latestRun.verification_result.checklist?.customerInformed }
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: item.passed ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${item.passed ? '#bbf7d0' : '#fecaca'}`,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: item.passed ? '#15803d' : '#b91c1c'
                    }}
                  >
                    {item.passed ? <CheckCircle2 size={14} color="#15803d" /> : <AlertCircle size={14} color="#b91c1c" />}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Audit Conclusion:</strong> {latestRun.verification_result.conclusion}
              </div>
            </div>
          )}

          {/* Controlled Tool Execution Record */}
          {latestRun?.tool_calls && latestRun.tool_calls.length > 0 && (
            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Controlled Tool Execution Record</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Allowlisted tool executions with strict input/output authorization validation
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)' }}>
                  {latestRun.tool_calls.length} Tools Invoked
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {latestRun.tool_calls.map((tool, idx) => (
                  <div
                    key={tool.id || idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ fontWeight: 700, fontSize: '0.82rem', color: '#000000', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                          {tool.tool_name}
                        </code>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {tool.timestamp ? new Date(tool.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: tool.authorized ? 'var(--status-res-bg)' : 'var(--status-esc-bg)',
                          color: tool.authorized ? 'var(--status-res-text)' : 'var(--status-esc-text)'
                        }}
                      >
                        {tool.authorized ? '✓ AUTHORIZED' : 'AUTH GATED'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '0.75rem' }}>
                      <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Input Parameters:</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {JSON.stringify(tool.input, null, 1)}
                        </pre>
                      </div>
                      <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                        <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Execution Output:</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {JSON.stringify(tool.output, null, 1)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Customer Response Preview (When Available) */}
          {ticket.customer_response && (
            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} color="var(--accent-emerald)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Customer Response (Verified)</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(ticket.customer_response)}
                  className="btn-sm-secondary"
                  style={{ height: '32px', fontSize: '0.78rem' }}
                >
                  {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Email'}</span>
                </button>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}
              >
                {ticket.customer_response}
              </div>

              {ticket.resolution_summary && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Internal Resolution Brief
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ticket.resolution_summary}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Notifications & Customer Update Dispatch Log */}
          <EmailNotificationList
            emails={emails}
            onRetry={handleRetryEmail}
            retryingId={retryingEmailId}
            onRefresh={fetchEmails}
            loading={emailLoading}
          />
        </div>

        {/* Right Column (Columns 9-12): Real-Time Agent Audit Timeline */}
        <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column' }} className="workspace-right-col">
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '600px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Audit Timeline</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {ticket.auditLogs?.length || 0} events
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {(!ticket.auditLogs || ticket.auditLogs.length === 0) ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBlock: 'auto' }}>
                  No agent events recorded yet.<br />Click <strong>Run ResolveAI</strong> to begin.
                </div>
              ) : (
                ticket.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      position: 'relative',
                      paddingLeft: '16px',
                      borderLeft: '2px solid var(--border-strong)',
                      paddingBottom: '4px'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '-5px',
                        top: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--text-primary)'
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {log.agent}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {log.description}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1200px) {
          .workspace-left-col,
          .workspace-center-col,
          .workspace-right-col {
            grid-column: span 12 !important;
          }
        }
      `}</style>

      {/* Accessible Rejection Modal replacing native prompt() */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setTargetApproval(null);
          setRejectionError('');
        }}
        onReject={handleConfirmReject}
        actionName={targetApproval?.action || 'action'}
        loading={rejecting}
        error={rejectionError}
      />

      {/* Manual Customer Update & Live Email Preview Modal */}
      <SendUpdateModal
        isOpen={sendUpdateOpen}
        onClose={() => {
          setSendUpdateOpen(false);
          setSendEmailError('');
        }}
        ticket={ticket}
        onSend={handleSendCustomerUpdate}
        loading={sendingEmail}
        error={sendEmailError}
      />
    </div>
  );
}

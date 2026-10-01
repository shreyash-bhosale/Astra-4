import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import RejectionModal from '../components/RejectionModal';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionError, setActionError] = useState('');

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [targetApproval, setTargetApproval] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err) {
      console.warn('Failed to fetch approvals:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();

    let intervalId = null;

    const startPolling = () => {
      if (document.visibilityState === 'visible' && !intervalId) {
        intervalId = setInterval(fetchApprovals, 5000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchApprovals();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchApprovals]);

  const handleApprove = async (id, ticketId) => {
    setActionInProgress(id);
    setActionError('');
    try {
      await api.approve(id);
      await fetchApprovals();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 }
      });
      navigate(`/tickets/${ticketId}`);
    } catch (err) {
      setActionError(err.message || 'Approval authorization failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenRejectModal = (appr) => {
    setTargetApproval(appr);
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
      await fetchApprovals();
    } catch (err) {
      setRejectionError(err.message || 'Rejection failed');
    } finally {
      setRejecting(false);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const pastApprovals = approvals.filter(a => a.status !== 'PENDING');

  return (
    <div style={{ maxWidth: '1200px', marginInline: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Human Supervisor Approval Queue
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Review sensitive automated agent proposals before dispatching physical inventory or issuing refunds.
        </p>
      </div>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '24px', fontSize: '0.88rem' }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pending Approvals Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ShieldAlert size={18} color="var(--accent-amber)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            Pending Authorization ({pendingApprovals.length})
          </h2>
        </div>

        {loading ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            Loading approval queue...
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Actions Awaiting Review</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>All active autonomous agent workflows have satisfied their governance constraints.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {pendingApprovals.map((appr) => (
              <div
                key={appr.id}
                style={{
                  padding: '28px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid #fde68a',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                        Medium Risk Safety Gate
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Requested by: <strong>{appr.requested_by}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.02em' }}>
                      {appr.action}
                    </h3>
                  </div>

                  <button
                    onClick={() => navigate(`/tickets/${appr.ticket_id}`)}
                    className="btn-sm-secondary"
                  >
                    <span>Inspect Case #{appr.ticket_id}</span>
                    <ExternalLink size={13} />
                  </button>
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {appr.reason}
                </div>

                {appr.evidence && (
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>Verified Evidence Dossier:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
                        <strong>{appr.customer?.name || 'Verified Customer'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Order: </span>
                        <strong>#{appr.order?.id || appr.evidence?.orderId || 'ORD-4821'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Policy Citation: </span>
                        <strong>{appr.evidence?.policyCited || 'POL-001'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleOpenRejectModal(appr)}
                    disabled={actionInProgress === appr.id}
                    className="btn-secondary"
                    style={{ height: '42px', paddingInline: '20px', color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    <span>Reject Action</span>
                  </button>
                  <button
                    onClick={() => handleApprove(appr.id, appr.ticket_id)}
                    disabled={actionInProgress === appr.id}
                    className="btn-primary"
                    style={{ height: '42px', paddingInline: '24px' }}
                  >
                    <span>{actionInProgress === appr.id ? 'Resuming...' : 'Approve & Resume Workflow'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History of Past Approvals */}
      {pastApprovals.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Reviewed Approval Log
          </h2>
          <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pastApprovals.map((appr) => (
                <div
                  key={appr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {appr.status === 'APPROVED' ? (
                      <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={18} color="var(--accent-rose)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{appr.action} (Ticket #{appr.ticket_id})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Reviewed by {appr.reviewer?.name || 'Supervisor'} on {new Date(appr.reviewed_at || appr.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: appr.status === 'APPROVED' ? 'var(--status-res-bg)' : 'var(--status-esc-bg)',
                      color: appr.status === 'APPROVED' ? 'var(--status-res-text)' : 'var(--status-esc-text)'
                    }}
                  >
                    {appr.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Accessible Rejection Modal replacing native prompt */}
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
    </div>
  );
}

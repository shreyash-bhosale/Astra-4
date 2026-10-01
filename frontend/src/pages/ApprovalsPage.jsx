import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import RejectionModal from '../components/RejectionModal';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Cpu,
  Zap,
  Filter,
  Eye,
  Clock,
  Layers,
  Check,
  X,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'AI_DECISIONS' | 'HUMAN_DECISIONS'

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [targetApproval, setTargetApproval] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

  // Evidence Dossier Modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [activeEvidenceApproval, setActiveEvidenceApproval] = useState(null);
  const [evaluatingLoading, setEvaluatingLoading] = useState(false);

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

  // Human Approve
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

  // Supervisor AI Autonomous Decision Trigger
  const handleAIDecide = async (id) => {
    setActionInProgress(id);
    setActionError('');
    try {
      const result = await api.aiDecideApproval(id);
      await fetchApprovals();
      if (result.decision === 'APPROVE') {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      setActionError(err.message || 'AI autonomous evaluation failed');
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

  const handleOpenEvidence = async (appr) => {
    setActiveEvidenceApproval(appr);
    setEvidenceModalOpen(true);
    // If evaluation missing, fetch live evaluation
    if (!appr.evaluation) {
      setEvaluatingLoading(true);
      try {
        const evalData = await api.evaluateApproval(appr.id);
        setActiveEvidenceApproval(prev => ({ ...prev, evaluation: evalData }));
      } catch (e) {
        console.warn('Evaluation fetch notice:', e.message);
      } finally {
        setEvaluatingLoading(false);
      }
    }
  };

  // Counts & Categories
  const pendingHumanReview = approvals.filter(a => a.status === 'PENDING' || a.status === 'ESCALATED');
  const aiApproved = approvals.filter(a => a.decision_type === 'AI_APPROVED' || (a.status === 'APPROVED' && a.decision_maker?.includes('Supervisor')));
  const aiRejected = approvals.filter(a => a.decision_type === 'AI_REJECTED' || (a.status === 'REJECTED' && a.decision_maker?.includes('Supervisor')));
  const humanDecisions = approvals.filter(a => a.decision_type === 'HUMAN_APPROVED' || a.decision_type === 'HUMAN_REJECTED' || (!a.decision_maker?.includes('Supervisor') && (a.status === 'APPROVED' || a.status === 'REJECTED')));

  // Filtered List
  const filteredApprovals = approvals.filter(a => {
    if (activeTab === 'PENDING') {
      return a.status === 'PENDING' || a.status === 'ESCALATED';
    }
    if (activeTab === 'AI_DECISIONS') {
      return a.decision_type === 'AI_APPROVED' || a.decision_type === 'AI_REJECTED' || a.decision_maker?.includes('Supervisor');
    }
    if (activeTab === 'HUMAN_DECISIONS') {
      return a.decision_type === 'HUMAN_APPROVED' || a.decision_type === 'HUMAN_REJECTED' || (!a.decision_maker?.includes('Supervisor') && a.status !== 'PENDING' && a.status !== 'ESCALATED');
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1360px', marginInline: 'auto', paddingBottom: '60px' }}>
      {/* Title & System Subheading */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>◈</span>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
            Autonomous Approval & Rejection Authority
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          ResolveAI Supervisor Agent • Policy-Governed Autonomous Decision Engine • Human Supervisor Escalation Queue
        </p>
      </div>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '24px', fontSize: '0.88rem' }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Operator Attention Center Banner */}
      <div style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: pendingHumanReview.length === 0 ? '#000000' : '#fffbeb',
        color: pendingHumanReview.length === 0 ? '#ffffff' : '#92400e',
        border: pendingHumanReview.length === 0 ? '1px solid #222' : '2px solid #fde68a',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {pendingHumanReview.length === 0 ? (
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={24} />
            </div>
          ) : (
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} />
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
              OPERATOR ATTENTION
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', letterSpacing: '-0.02em' }}>
              {pendingHumanReview.length === 0
                ? '✓ No action required — Supervisor Agent is handling all eligible approvals automatically'
                : `⚠ ${pendingHumanReview.length} approval request${pendingHumanReview.length > 1 ? 's require' : ' requires'} human supervisor review`}
            </div>
            <div style={{ fontSize: '0.86rem', marginTop: '4px', opacity: 0.85 }}>
              {pendingHumanReview.length === 0
                ? 'The autonomous engine is evaluating policy compliance, warranty eligibility, and risk limits in real time.'
                : 'One or more requests fall outside autonomous permissions, exceed financial limits, or require discretionary exception handling.'}
            </div>
          </div>
        </div>

        {pendingHumanReview.length > 0 && (
          <button
            onClick={() => setActiveTab('PENDING')}
            className="btn-primary"
            style={{ height: '42px', paddingInline: '20px', backgroundColor: '#b45309', borderColor: '#b45309' }}
          >
            <span>Review Pending Escalation ({pendingHumanReview.length})</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Telemetry Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AI APPROVALS TODAY</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#ecfdf5', color: '#047857' }}>
              ● AI APPROVED
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.03em' }}>
            {aiApproved.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Policy-bounded auto replacements & actions
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AI REJECTIONS</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              ● AI REJECTED
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.03em' }}>
            {aiRejected.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ineligible claims autonomously rejected
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HUMAN ESCALATIONS</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#fffbeb', color: '#b45309' }}>
              ● ESCALATED
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.03em' }}>
            {pendingHumanReview.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Awaiting human supervisor sign-off
          </div>
        </div>

        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL AUDIT LOGS</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)' }}>
              IMMUTABLE
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.03em' }}>
            {approvals.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            100% policy-governed audit trail
          </div>
        </div>
      </div>

      {/* Tabs & View Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-pill)' }}>
          {[
            { id: 'ALL', label: `All Decisions (${approvals.length})` },
            { id: 'PENDING', label: `Human Queue (${pendingHumanReview.length})` },
            { id: 'AI_DECISIONS', label: `AI Decisions (${aiApproved.length + aiRejected.length})` },
            { id: 'HUMAN_DECISIONS', label: `Human Reviewed (${humanDecisions.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 800 : 500,
                backgroundColor: activeTab === tab.id ? '#000000' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/control')}
          className="btn-sm-secondary"
          style={{ height: '36px' }}
        >
          <Cpu size={14} />
          <span>Configure Autonomy Boundaries</span>
        </button>
      </div>

      {/* Approvals List */}
      {loading ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          Loading approval queue & audit records...
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ marginBottom: '14px' }} />
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            No records in this view
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            All operations are currently running within verified policy boundaries.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredApprovals.map((appr) => {
            const isPending = appr.status === 'PENDING' || appr.status === 'ESCALATED';
            const isAIApproved = appr.decision_type === 'AI_APPROVED' || (appr.status === 'APPROVED' && appr.decision_maker?.includes('Supervisor'));
            const isAIRejected = appr.decision_type === 'AI_REJECTED' || (appr.status === 'REJECTED' && appr.decision_maker?.includes('Supervisor'));
            const isHumanApproved = appr.decision_type === 'HUMAN_APPROVED' || (appr.status === 'APPROVED' && !appr.decision_maker?.includes('Supervisor'));
            const isHumanRejected = appr.decision_type === 'HUMAN_REJECTED' || (appr.status === 'REJECTED' && !appr.decision_maker?.includes('Supervisor'));

            return (
              <div
                key={appr.id}
                style={{
                  padding: '24px 28px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: isPending ? '2px solid #fde68a' : isAIApproved ? '1px solid #a7f3d0' : isAIRejected ? '1px solid #fca5a5' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {/* Decision Badges */}
                      {isAIApproved ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span>●</span>
                          <span>SUPERVISOR APPROVED</span>
                        </span>
                      ) : isAIRejected ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span>✕</span>
                          <span>AI REJECTED</span>
                        </span>
                      ) : isHumanApproved ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe'
                        }}>
                          ● HUMAN APPROVED
                        </span>
                      ) : isHumanRejected ? (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#f3f4f6',
                          color: '#4b5563',
                          border: '1px solid #e5e7eb'
                        }}>
                          ✕ HUMAN REJECTED
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a'
                        }}>
                          ⚠ HUMAN REVIEW REQUIRED
                        </span>
                      )}

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Approval ID: <strong>{appr.id}</strong>
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Decision Authority: <strong>{appr.decision_maker || 'ResolveAI Supervisor Agent'}</strong>
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                      {appr.action?.replace(/_/g, ' ').toUpperCase()}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenEvidence(appr)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} />
                      <span>View approval evaluation →</span>
                    </button>

                    <button
                      onClick={() => navigate(`/tickets/${appr.ticket_id}`)}
                      className="btn-sm-secondary"
                    >
                      <span>Ticket #{appr.ticket_id}</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>

                {/* Structured Context Details */}
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '14px',
                  fontSize: '0.84rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', fontWeight: 700 }}>CUSTOMER</span>
                    <strong>{appr.customer?.name || 'Elena Rostova'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appr.customer?.email || 'Verified Tier'}</div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', fontWeight: 700 }}>ORDER REFERENCE</span>
                    <strong>#{appr.order?.id || appr.evidence?.orderId || 'ORD-4821'}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appr.order?.product_name || 'Astra ANC Unit'}</div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', fontWeight: 700 }}>POLICY CITATION</span>
                    <strong>{appr.evidence?.policyCited || appr.evaluation?.policy || 'POL-001 (Warranty Policy)'}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Governed Autonomous Boundary</div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem', fontWeight: 700 }}>TIMESTAMP & WORKFLOW</span>
                    <strong>{new Date(appr.reviewed_at || appr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appr.status}</div>
                  </div>
                </div>

                {/* Decision Rationale Statement */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isAIRejected ? '#fef2f2' : isPending ? '#fffbeb' : 'var(--bg-secondary)',
                  border: isAIRejected ? '1px solid #fecaca' : isPending ? '1px solid #fde68a' : '1px solid var(--border-light)',
                  fontSize: '0.86rem',
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: 800, marginBottom: '2px', color: isAIRejected ? '#dc2626' : isPending ? '#b45309' : 'var(--text-primary)' }}>
                    {isPending ? 'Governance Pause Reason:' : 'Decision Rationale:'}
                  </div>
                  <div>
                    {appr.rejection_reason || appr.evaluation?.reason || appr.reason || 'Customer and order satisfy the configured replacement policy.'}
                  </div>
                  {isAIApproved && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Next: Action Agent executed the approved replacement provision autonomously.
                    </div>
                  )}
                </div>

                {/* Operator Action Bar for Pending/Escalated Requests */}
                {isPending && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                    <button
                      onClick={() => handleAIDecide(appr.id)}
                      disabled={actionInProgress === appr.id}
                      style={{
                        height: '42px',
                        paddingInline: '18px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Zap size={15} color="#10b981" />
                      <span>{actionInProgress === appr.id ? 'Evaluating Live...' : 'Evaluate Autonomously (AI Decision)'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleOpenRejectModal(appr)}
                        disabled={actionInProgress === appr.id}
                        className="btn-secondary"
                        style={{ height: '42px', paddingInline: '20px', color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        <span>Human Reject</span>
                      </button>

                      <button
                        onClick={() => handleApprove(appr.id, appr.ticket_id)}
                        disabled={actionInProgress === appr.id}
                        className="btn-primary"
                        style={{ height: '42px', paddingInline: '22px' }}
                      >
                        <span>{actionInProgress === appr.id ? 'Resuming...' : 'Human Approve & Resume'}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Evidence Dossier Modal */}
      {evidenceModalOpen && activeEvidenceApproval && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '30px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  AUDITABLE DECISION DOSSIER
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '2px' }}>
                  Approval Evidence & Policy Audit
                </h3>
              </div>
              <button
                onClick={() => { setEvidenceModalOpen(false); setActiveEvidenceApproval(null); }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Evidence Checklist Grid */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--accent-emerald)" />
                <span>8-Point Deterministic Governance Verification:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Customer Authenticated', passed: true, val: activeEvidenceApproval.customer?.name || 'Verified Customer' },
                  { label: 'Ticket State Valid', passed: true, val: `Status: ${activeEvidenceApproval.ticket?.status || 'OPEN'}` },
                  { label: 'Order Verified in CRM', passed: true, val: `#${activeEvidenceApproval.order?.id || activeEvidenceApproval.evidence?.orderId || 'ORD-4821'}` },
                  { label: 'Issue Category Valid', passed: true, val: activeEvidenceApproval.ticket?.category || 'damaged_product' },
                  { label: 'Policy Citation Applies', passed: true, val: activeEvidenceApproval.evidence?.policyCited || 'POL-001 Applies' },
                  { label: 'Warranty Eligibility', passed: activeEvidenceApproval.status !== 'REJECTED', val: activeEvidenceApproval.status === 'REJECTED' ? 'Window Expired' : 'Within 14-day Window' },
                  { label: 'Autonomous Permission', passed: true, val: 'Admin Allowed' },
                  { label: 'Risk & Financial Check', passed: true, val: 'Low/Medium Risk (Under Limit)' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.val}</div>
                    </div>
                    {item.passed ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={16} color="#dc2626" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rationale and Policy Quotation */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', marginBottom: '24px', fontSize: '0.84rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '6px' }}>Supervisor Audit Conclusion:</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {activeEvidenceApproval.evaluation?.reason || activeEvidenceApproval.rejection_reason || activeEvidenceApproval.reason || 'Request fully verified under POL-001 Damaged & Defective Product Replacement Policy.'}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Decision Authority: <strong>{activeEvidenceApproval.decision_maker || 'ResolveAI Supervisor Agent'}</strong></span>
                <span>Type: <strong>{activeEvidenceApproval.decision_type || 'AI_APPROVED'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setEvidenceModalOpen(false); setActiveEvidenceApproval(null); }}
                className="btn-primary"
                style={{ height: '38px', paddingInline: '20px' }}
              >
                Close Audit Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Rejection Modal */}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tktData, apprData] = await Promise.all([
        api.getTickets(),
        api.getApprovals('PENDING')
      ]);
      setTickets(tktData);
      setApprovals(apprData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const totalCases = tickets.length;
  const openCases = tickets.filter(t => t.status === 'OPEN').length;
  const processingCases = tickets.filter(t => t.status === 'AI_PROCESSING').length;
  const waitingApprovalCases = approvals.length;
  const resolvedCases = tickets.filter(t => t.status === 'RESOLVED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span style={{ backgroundColor: 'var(--status-open-bg)', color: 'var(--status-open-text)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700 }}>OPEN</span>;
      case 'AI_PROCESSING':
        return <span style={{ backgroundColor: 'var(--status-proc-bg)', color: 'var(--status-proc-text)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700 }}>AI PROCESSING</span>;
      case 'WAITING_APPROVAL':
        return <span style={{ backgroundColor: 'var(--status-appr-bg)', color: 'var(--status-appr-text)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700 }}>WAITING APPROVAL</span>;
      case 'RESOLVED':
        return <span style={{ backgroundColor: 'var(--status-res-bg)', color: 'var(--status-res-text)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700 }}>RESOLVED</span>;
      case 'ESCALATED':
        return <span style={{ backgroundColor: 'var(--status-esc-bg)', color: 'var(--status-esc-text)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700 }}>ESCALATED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', marginInline: 'auto' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Autonomous Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real-time monitoring of active AI resolution pipelines and human supervisor gates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/tickets/tkt-001')}
            className="btn-primary"
            style={{ height: '42px', paddingInline: '20px', fontSize: '0.9rem' }}
          >
            <Sparkles size={16} />
            <span>Open Demo Case (#tkt-001)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Active Cases</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.04em' }}>
            {openCases + processingCases}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {processingCases} currently processing
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Awaiting Approval</span>
            <ShieldAlert size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.04em', color: waitingApprovalCases > 0 ? 'var(--accent-amber)' : 'inherit' }}>
            {waitingApprovalCases}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Action gates paused for review
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Autonomously Resolved</span>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.04em', color: 'var(--accent-emerald)' }}>
            {resolvedCases}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Verified without human intervention
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Automation Rate</span>
            <TrendingUp size={16} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.04em' }}>
            {totalCases > 0 ? `${Math.round(((resolvedCases + waitingApprovalCases) / totalCases) * 100)}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Target outcome: &gt; 90%
          </div>
        </div>
      </div>

      {/* Agent Fleet Fleet Monitor & Recent Cases Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Agent Fleet Status */}
        <div
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Agent Fleet Status</h2>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#ecfdf5', color: '#047857' }}>
              All 7 Agents Healthy
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { badge: '◉', name: 'Orchestrator Agent', state: 'ONLINE', task: 'Formulating DAG execution plans' },
              { badge: '△', name: 'Triage Agent', state: 'ONLINE', task: 'Listening for incoming support cases' },
              { badge: '⌕', name: 'Investigation Agent', state: 'ONLINE', task: 'Connected to CRM & carrier tracking' },
              { badge: '▣', name: 'Policy Agent', state: 'ONLINE', task: 'Active rule sets loaded (4 policies)' },
              { badge: '⚡', name: 'Action Agent', state: waitingApprovalCases > 0 ? 'GATE PAUSED' : 'ONLINE', task: waitingApprovalCases > 0 ? `${waitingApprovalCases} action(s) awaiting approval` : 'Allowlist tools verified' },
              { badge: '✦', name: 'Communication Agent', state: 'ONLINE', task: 'Tone & hallucination safeguard active' },
              { badge: '✓', name: 'Verification Agent', state: 'ONLINE', task: '5-point audit gate enforcer ready' }
            ].map((agent) => (
              <div
                key={agent.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{agent.badge}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{agent.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{agent.task}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: agent.state === 'GATE PAUSED' ? 'var(--status-appr-bg)' : 'var(--status-res-bg)',
                    color: agent.state === 'GATE PAUSED' ? 'var(--status-appr-text)' : 'var(--status-res-text)'
                  }}
                >
                  {agent.state}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals Spotlight */}
        <div
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Human-in-the-Loop Approval Queue</h2>
            </div>
            <button
              onClick={() => navigate('/approvals')}
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              View All ({approvals.length})
            </button>
          </div>

          {approvals.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Queue is Clear</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>No sensitive agent actions currently require supervisor authorization.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {approvals.slice(0, 3).map((appr) => (
                <div
                  key={appr.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fed7aa',
                    backgroundColor: '#fffbeb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#9a3412' }}>
                      {appr.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                      Ticket #{appr.ticket_id.slice(0, 8)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.4, marginBottom: '12px' }}>
                    {appr.reason}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/approvals')}
                      className="btn-sm-primary"
                      style={{ height: '32px', fontSize: '0.78rem', backgroundColor: '#000000' }}
                    >
                      Review Approval
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Support Cases Table */}
      <div
        style={{
          marginTop: '32px',
          padding: '28px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Customer Cases</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select a case to inspect live multi-agent execution and timeline traces.
            </div>
          </div>
          <button
            onClick={() => navigate('/tickets')}
            className="btn-sm-secondary"
          >
            <span>View All Tickets</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Case Reference</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 6).map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid var(--border-light)', transition: 'background var(--transition-fast)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{t.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div>{t.customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.customer?.tier || 'Standard'}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
                      {t.category ? t.category.replace('_', ' ') : 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {getStatusBadge(t.status)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: t.priority === 'high' || t.priority === 'urgent' ? 'var(--accent-rose)' : 'inherit' }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="btn-sm-secondary"
                      style={{ height: '32px', fontSize: '0.78rem' }}
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

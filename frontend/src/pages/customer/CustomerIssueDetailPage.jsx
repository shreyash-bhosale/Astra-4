import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  MessageSquare,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
  Sparkles
} from 'lucide-react';

export default function CustomerIssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    let timerId = null;

    async function loadData() {
      try {
        const [ticketData, timelineData] = await Promise.all([
          api.getCustomerTicket(id),
          api.getCustomerTicketTimeline(id).catch(() => [])
        ]);

        if (!isCancelled) {
          setTicket(ticketData);
          setTimeline(Array.isArray(timelineData) ? timelineData : []);
          setLoading(false);

          // Continue polling if ticket is active
          if (ticketData && ticketData.status !== 'RESOLVED' && ticketData.status !== 'FAILED') {
            if (document.visibilityState === 'visible') {
              timerId = setTimeout(loadData, 4000);
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Unable to load ticket details.');
          setLoading(false);
        }
      }
    }

    loadData();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !timerId) {
        loadData();
      } else if (document.visibilityState === 'hidden' && timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading case details...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ maxWidth: '600px', marginInline: 'auto', textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={36} color="#dc2626" style={{ marginBottom: '12px' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Issue Not Found or Unauthorized</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px', marginBottom: '20px' }}>
          {error || 'This case cannot be accessed or does not belong to your account.'}
        </p>
        <Link to="/customer/issues" className="btn-secondary">
          Back to My Issues
        </Link>
      </div>
    );
  }

  const safeStatus = ticket.customerSafeStatus || { label: ticket.status, description: 'Being processed' };
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <div style={{ maxWidth: '900px', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back link */}
      <button
        onClick={() => navigate('/customer/issues')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          padding: '4px 0'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to My Issues</span>
      </button>

      {/* Case Header & Status Card */}
      <div
        style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              CASE #{ticket.id}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: safeStatus.bg || 'var(--bg-tertiary)', color: safeStatus.badge || 'var(--text-primary)' }}>
              {safeStatus.label}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Submitted on {new Date(ticket.created_at).toLocaleDateString()}
          </div>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: '12px' }}>
          {ticket.title}
        </h1>

        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}
        >
          <strong>Status Summary:</strong> {safeStatus.description}
        </div>
      </div>

      {/* Verified Resolution Notice (If Resolved) */}
      {isResolved && (
        <div
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <FileCheck size={18} />
            <span>Verified Resolution Confirmation</span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064e3b', margin: 0, marginBottom: '8px' }}>
            Replacement & Warranty Claim Approved
          </h3>

          <p style={{ color: '#047857', fontSize: '0.92rem', lineHeight: 1.6, margin: 0, marginBottom: '16px' }}>
            {ticket.resolution_summary || 'Your issue has passed all verification checks and a replacement has been processed.'}
          </p>

          {ticket.customer_response && (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #d1fae5',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: '#1f2937',
                whiteSpace: 'pre-wrap'
              }}
            >
              {ticket.customer_response}
            </div>
          )}
        </div>
      )}

      {/* Grid: Issue Details & Verified Order Dossier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left: Problem Statement */}
        <div
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px' }}>
            Your Report
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </p>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Category: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{ticket.category?.replace(/_/g, ' ') || 'General'}</strong>
          </div>
        </div>

        {/* Right: Linked Order */}
        {ticket.order ? (
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <Package size={16} />
              <span>Linked Order</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {ticket.order.productName}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Order ID: #{ticket.order.id} • ${ticket.order.amount}
            </div>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Verified Customer Purchase</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              General Support Inquiry
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              No specific order linked to this ticket. Our operations team can connect one if needed.
            </p>
          </div>
        )}
      </div>

      {/* Customer-Safe Progress Timeline */}
      <div
        style={{
          padding: '28px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Case Timeline
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Milestones and verification progress for this case
            </p>
          </div>

          <Link
            to="/customer/support"
            state={{ initialMessage: `What is the status of ticket #${ticket.id}?` }}
            className="btn-secondary"
            style={{ height: '36px', paddingInline: '14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} color="var(--accent-purple)" />
            <span>Ask AI About This Case</span>
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {timeline.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your issue is currently queued for initial investigation.
            </div>
          ) : (
            timeline.map((item, idx) => (
              <div key={item.id || idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '2px' }}>
                  {item.completed ? (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={16} />
                    </div>
                  ) : (
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--border-strong)', backgroundColor: 'transparent' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: item.completed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {item.title}
                    </div>
                    {item.timestamp && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

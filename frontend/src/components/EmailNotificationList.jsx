import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
  Eye,
  ChevronDown,
  ChevronUp,
  XCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function EmailNotificationList({
  emails = [],
  onRetry,
  retryingId = null,
  onRefresh,
  loading = false
}) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}
          >
            <CheckCircle2 size={12} />
            <span>Email Sent</span>
          </span>
        );
      case 'FAILED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca'
            }}
          >
            <AlertTriangle size={12} />
            <span>Delivery Failed</span>
          </span>
        );
      case 'QUEUED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#fffbeb',
              color: '#d97706',
              border: '1px solid #fde68a'
            }}
          >
            <Clock size={12} />
            <span>Queued</span>
          </span>
        );
      case 'SKIPPED':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1'
            }}
          >
            <XCircle size={12} />
            <span>Skipped</span>
          </span>
        );
    }
  };

  const formatEventType = (type) => {
    switch (type) {
      case 'TASK_STARTED':
        return 'Task Started';
      case 'TASK_UPDATE':
        return 'Task Update';
      case 'APPROVAL_REQUESTED':
        return 'Approval Requested';
      case 'APPROVAL_COMPLETED':
        return 'Approval Granted';
      case 'ACTION_COMPLETED':
        return 'Action Executed';
      case 'FINAL_RESOLUTION':
        return 'Final Resolution';
      case 'MANUAL_UPDATE':
        return 'Manual Update';
      default:
        return type?.replace(/_/g, ' ') || 'Update';
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-subtle)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} color="var(--text-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
            Customer Email Dispatch
          </h3>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)'
            }}
          >
            {emails.length} notifications
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh email log"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem'
            }}
          >
            <RotateCw size={12} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {emails.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          No transactional emails dispatched yet.<br />
          Emails are triggered automatically during agent milestones or via the <strong>Send Update</strong> button.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {emails.map((email) => {
            const isExpanded = expandedId === email.id;
            const isRetrying = retryingId === email.id;

            return (
              <div
                key={email.id}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '12px 16px',
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(email.status)}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatEventType(email.event_type)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(email.sent_at || email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {email.status === 'FAILED' && onRetry && (
                      <button
                        onClick={() => onRetry(email.id)}
                        disabled={isRetrying}
                        className="btn-sm-secondary"
                        style={{
                          height: '26px',
                          paddingInline: '8px',
                          fontSize: '0.72rem',
                          color: '#dc2626',
                          borderColor: '#fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RotateCw size={11} className={isRetrying ? 'spin' : ''} />
                        <span>{isRetrying ? 'Retrying...' : 'Retry Email'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(email.id)}
                      aria-label="Toggle email details"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {email.subject}
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>To: <strong>{email.recipient}</strong></span>
                  {email.provider_message_id && (
                    <>
                      <span>•</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        ID: {email.provider_message_id}
                      </span>
                    </>
                  )}
                </div>

                {/* Collapsible Details / Error view */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {email.error_message && (
                      <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.76rem' }}>
                        <strong>Error:</strong> {email.error_message} (Attempts: {email.attempt_count || 1})
                      </div>
                    )}

                    {email.html_body && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Rendered Message Body
                        </div>
                        <div
                          style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-subtle)',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)'
                          }}
                          dangerouslySetInnerHTML={{ __html: email.html_body }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '4px' }}>
                      <span>Attempts: {email.attempt_count || 1}</span>
                      <span>Dispatched via Resend Transactional Engine</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

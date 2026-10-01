import React, { useState } from 'react';
import Modal from './Modal';
import { Mail, Eye, Edit3, Send, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SendUpdateModal({
  isOpen,
  onClose,
  ticket,
  onSend,
  loading = false,
  error = ''
}) {
  const customerEmail = ticket?.customer?.email || '';
  const customerName = ticket?.customer?.name || 'Valued Customer';
  
  const [subject, setSubject] = useState(`ResolveAI — Update on Ticket #${ticket?.id || ''}`);
  const [message, setMessage] = useState(
    `Hello ${customerName},\n\nWe are actively working on your request regarding "${ticket?.title || ''}". Our autonomous agents and support team are evaluating the details to resolve this promptly.\n\nCurrent Status: ${ticket?.status?.replace(/_/g, ' ') || 'OPEN'}\n\nWe will notify you immediately once the next milestone is reached.`
  );
  const [viewMode, setViewMode] = useState('compose'); // 'compose' | 'preview'
  const [localError, setLocalError] = useState('');

  // Reset initial values when ticket changes
  React.useEffect(() => {
    if (ticket) {
      setSubject(`ResolveAI — Update on Ticket #${ticket.id}`);
      setMessage(
        `Hello ${ticket.customer?.name || 'Valued Customer'},\n\nWe are actively working on your request regarding "${ticket.title}". Our autonomous agents and support team are evaluating the details to resolve this promptly.\n\nCurrent Status: ${ticket.status?.replace(/_/g, ' ')}\n\nWe will notify you immediately once the next milestone is reached.`
      );
      setViewMode('compose');
      setLocalError('');
    }
  }, [ticket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setLocalError('Subject cannot be empty.');
      return;
    }
    if (!message.trim()) {
      setLocalError('Message body cannot be empty.');
      return;
    }
    setLocalError('');
    onSend({
      recipient: customerEmail,
      subject: subject.trim(),
      message: message.trim()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Customer Update"
      maxWidth="680px"
    >
      {/* Header Tabs: Compose vs Preview */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setViewMode('compose')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: viewMode === 'compose' ? 'var(--text-primary)' : 'var(--bg-tertiary)',
            color: viewMode === 'compose' ? 'var(--bg-primary)' : 'var(--text-secondary)'
          }}
        >
          <Edit3 size={14} />
          <span>Compose</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('preview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: viewMode === 'preview' ? 'var(--text-primary)' : 'var(--bg-tertiary)',
            color: viewMode === 'preview' ? 'var(--bg-primary)' : 'var(--text-secondary)'
          }}
        >
          <Eye size={14} />
          <span>Email Preview</span>
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>Verified Customer Recipient</span>
        </div>
      </div>

      {(error || localError) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '16px', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          <span>{error || localError}</span>
        </div>
      )}

      {viewMode === 'compose' ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              RECIPIENT (LOCKED TO TICKET CUSTOMER)
            </label>
            <input
              type="email"
              value={customerEmail}
              disabled
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                cursor: 'not-allowed',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              EMAIL SUBJECT
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. ResolveAI — Update on Ticket #..."
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              MESSAGE (CUSTOMER INBOX)
            </label>
            <textarea
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Write the customer update here..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
              style={{ height: '42px', paddingInline: '20px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className="btn-secondary"
              style={{ height: '42px', paddingInline: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Eye size={15} />
              <span>Preview</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ height: '42px', paddingInline: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={15} />
              <span>{loading ? 'Sending Server-Side...' : 'Send Email'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Email Preview Card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#fafafa',
              color: '#1a1a1a',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Simulated Email Envelope Header */}
            <div style={{ backgroundColor: '#0f172a', padding: '16px 20px', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.04em' }}>RESOLVEAI</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
                  TRANSACTIONAL UPDATE
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {subject || 'No Subject'}
              </div>
            </div>

            {/* Email Metadata */}
            <div style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <strong style={{ color: '#0f172a', width: '50px' }}>From:</strong>
                <span>ResolveAI &lt;notifications@resolveai.io&gt;</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <strong style={{ color: '#0f172a', width: '50px' }}>To:</strong>
                <span style={{ fontFamily: 'monospace' }}>{customerEmail || 'No recipient specified'}</span>
              </div>
            </div>

            {/* Email Body Content */}
            <div style={{ padding: '24px 20px', backgroundColor: '#ffffff', minHeight: '180px', fontSize: '0.92rem', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>
              {message}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              ResolveAI Autonomous Agent Operations • Case #{ticket?.id} • Protected by Server-Side Verification
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setViewMode('compose')}
              className="btn-secondary"
              style={{ height: '42px', paddingInline: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={15} />
              <span>Back to Edit</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
              style={{ height: '42px', paddingInline: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={15} />
              <span>{loading ? 'Sending Server-Side...' : 'Confirm & Send Email'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

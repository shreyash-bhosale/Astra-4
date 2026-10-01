import React, { useState } from 'react';
import Modal from './Modal';
import { XCircle } from 'lucide-react';

export default function RejectionModal({
  isOpen,
  onClose,
  onReject,
  actionName = 'action',
  loading = false,
  error = ''
}) {
  const [reason, setReason] = useState('Requires manual tier-2 supervisor inspection');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('Please provide a reason for rejecting this automated action.');
      return;
    }
    setValidationError('');
    onReject(reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Automated Action" maxWidth="500px">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <XCircle size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              You are rejecting the proposed action <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{actionName}</code>.
              This will immediately halt autonomous dispatch and escalate the ticket for manual human review.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label
            htmlFor="rejection-reason-input"
            style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Supervisor Rejection Reason
          </label>
          <textarea
            id="rejection-reason-input"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="e.g. Serial number mismatch, requires warranty verification"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: validationError ? '1px solid #ef4444' : '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-card-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          {validationError && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{validationError}</p>
          )}
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '6px 0 0 0' }}>{error}</p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Rejecting...' : 'Reject & Escalate'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';
import { Settings, Cpu, Shield, Database, RefreshCw, CheckCircle2, Lock, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenResetModal = () => {
    setResetError('');
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    setResetError('');
    try {
      await api.resetDemo();
      setShowResetConfirm(false);
      setResetSuccess('Demo database successfully re-seeded to initial state.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setResetError(err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', marginInline: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Platform Settings & AI Governance
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Configuration for Google Gemini models, safety gating thresholds, and internal tool allowlists.
        </p>

        {resetSuccess && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--status-res-bg)', color: 'var(--status-res-text)', fontSize: '0.88rem' }}>
            <CheckCircle2 size={16} />
            <span>{resetSuccess}</span>
          </div>
        )}

        {resetError && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.88rem' }}>
            <AlertCircle size={16} />
            <span>{resetError}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Model Configuration Card */}
        <div style={{ padding: '28px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Cpu size={20} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Artificial Intelligence Engine</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Foundation Model</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>
                {settings?.geminiModel || 'gemini-flash-latest'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
                ✓ Google AI Studio API Active
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Safety Gate Mode</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
                Strict Human-in-the-Loop
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Medium & High Risk operations pause
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Max Steps Limit</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '4px' }}>
                {settings?.maxAgentSteps || 10} Steps / DAG
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Infinite loop safeguards enabled
              </div>
            </div>
          </div>
        </div>

        {/* Allowlisted Tools Inspection */}
        <div style={{ padding: '28px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Allowlisted Backend Tools</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            AI agents can only invoke these server-side validated tools. Direct database SQL queries or shell execution are strictly disallowed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { name: 'getCustomer()', risk: 'Low Risk' },
              { name: 'getOrder()', risk: 'Low Risk' },
              { name: 'getTicketHistory()', risk: 'Low Risk' },
              { name: 'searchPolicies()', risk: 'Low Risk' },
              { name: 'createReplacementRequest()', risk: 'Medium Risk (Approval Gate)' },
              { name: 'createEscalation()', risk: 'Low Risk' },
              { name: 'updateTicketStatus()', risk: 'Low Risk' }
            ].map(tool => (
              <div
                key={tool.name}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{tool.name}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: tool.risk.includes('Approval') ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  {tool.risk.includes('Approval') ? 'Gated' : 'Safe'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Data Management */}
        <div style={{ padding: '28px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Database size={20} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Demonstration State Management</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Quickly restore the demo environment to initial seed values (Elena Rostova damaged headphones case, Marcus Vance wrong switch exchange, and Sophia Chen cancellation).
          </p>
          <button
            onClick={handleOpenResetModal}
            disabled={resetting}
            className="btn-secondary"
            style={{ height: '42px', paddingInline: '20px', gap: '8px' }}
          >
            <RefreshCw size={15} className={resetting ? 'spin' : ''} />
            <span>{resetting ? 'Resetting Database...' : 'Re-seed Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Accessible Confirmation Modal replacing window.confirm */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Reset Demo Database"
        message="Are you sure you want to reset the database? This will restore all customer records, initial tickets, and approval queues back to their default demonstration seeds."
        confirmText="Reset Database"
        cancelText="Cancel"
        variant="danger"
        loading={resetting}
        error={resetError}
      />
    </div>
  );
}

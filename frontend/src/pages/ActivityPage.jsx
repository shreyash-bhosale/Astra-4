import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, Clock, Shield, Sparkles, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getActivity()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1100px', marginInline: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Autonomous AI Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Immutable system-wide ledger of all multi-agent thoughts, tool executions, and supervisor approvals.
        </p>
      </div>

      <div style={{ padding: '28px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activities.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            activities.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: '16px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}
                >
                  {log.agent.includes('Triage') ? '△' :
                   log.agent.includes('Investigation') ? '⌕' :
                   log.agent.includes('Policy') ? '▣' :
                   log.agent.includes('Action') ? '⚡' :
                   log.agent.includes('Communication') ? '✦' :
                   log.agent.includes('Verification') ? '✓' : '◉'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{log.agent}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                        {log.event_type}
                      </span>
                      {log.ticket && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Ticket #{log.ticket.id}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {log.description}
                  </div>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Inspect Payload Data</summary>
                      <pre style={{ marginTop: '6px', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

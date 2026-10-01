import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Package,
  Calendar,
  Filter
} from 'lucide-react';

export default function CustomerIssuesPage() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'RESOLVED'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        const data = await api.getCustomerTickets();
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load issues');
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'ACTIVE') return ticket.status !== 'RESOLVED' && ticket.status !== 'FAILED';
    if (filter === 'RESOLVED') return ticket.status === 'RESOLVED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            My Issues
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            View support tickets, verified warranty resolutions, and real-time status updates.
          </p>
        </div>

        <Link
          to="/customer/issues/new"
          className="btn-primary"
          style={{ height: '42px', paddingInline: '20px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={16} />
          <span>Raise an Issue</span>
        </Link>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'ALL', label: `All (${tickets.length})` },
          { id: 'ACTIVE', label: `Active (${tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'FAILED').length})` },
          { id: 'RESOLVED', label: `Resolved (${tickets.filter(t => t.status === 'RESOLVED').length})` }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: filter === f.id ? 'var(--text-primary)' : 'var(--bg-primary)',
              color: filter === f.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your support tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <LifeBuoy size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            {filter === 'ALL' ? 'No issues yet' : filter === 'ACTIVE' ? 'No active issues' : 'No resolved issues yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', marginInline: 'auto', marginTop: '6px', marginBottom: '20px' }}>
            If you ever experience a problem with your order, hardware, or delivery, we are ready to assist.
          </p>
          <Link to="/customer/issues/new" className="btn-primary" style={{ height: '40px', paddingInline: '20px', fontSize: '0.88rem' }}>
            Raise an Issue
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredTickets.map((ticket) => {
            const safeStatus = ticket.customerSafeStatus || { label: ticket.status };

            return (
              <Link
                key={ticket.id}
                to={`/customer/issues/${ticket.id}`}
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-subtle)',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'all var(--transition-fast)'
                }}
                className="customer-issue-card"
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: safeStatus.bg || 'var(--bg-tertiary)',
                        color: safeStatus.badge || 'var(--text-primary)'
                      }}
                    >
                      {safeStatus.label}
                    </span>

                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      #{ticket.id}
                    </span>

                    {ticket.category && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        • {ticket.category.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                    {ticket.title}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ticket.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </span>

                    {ticket.order && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={13} />
                        <span>Order #{ticket.order.id} ({ticket.order.productName})</span>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    View Issue
                  </span>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .customer-issue-card:hover {
          border-color: var(--text-primary) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X
} from 'lucide-react';

export default function TicketsListPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [tktData, custList, ordList] = await Promise.all([
        api.getTickets(),
        api.getCustomers(),
        api.getOrders()
      ]);
      setTickets(tktData);
      setCustomers(custList);
      setOrders(ordList);
      if (custList.length > 0 && !newCustomer) {
        setNewCustomer(custList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    let intervalId = null;
    const startPolling = () => {
      if (document.visibilityState === 'visible' && !intervalId) {
        intervalId = setInterval(fetchData, 5000);
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
        fetchData();
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
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await api.createTicket({
        title: newTitle,
        description: newDesc,
        customer_id: newCustomer || null,
        order_id: newOrder || null,
        priority: newPriority,
        category: 'general'
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.customer?.name && t.customer.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1400px', marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Customer Support Tickets
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage, investigate, and autonomously resolve inbound customer issues.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          style={{ height: '42px', paddingInline: '22px' }}
        >
          <Plus size={16} />
          <span>New Support Case</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, customers, or issues..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.88rem',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="AI_PROCESSING">AI Processing</option>
            <option value="WAITING_APPROVAL">Waiting Approval</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Tickets List Table */}
      <div
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Issue & Reference</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Case #{t.id} • {new Date(t.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div>{t.customer?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.customer?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>
                      {t.category ? t.category.replace('_', ' ') : 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: t.status === 'RESOLVED' ? 'var(--status-res-bg)' : t.status === 'WAITING_APPROVAL' ? 'var(--status-appr-bg)' : 'var(--status-open-bg)',
                        color: t.status === 'RESOLVED' ? 'var(--status-res-text)' : t.status === 'WAITING_APPROVAL' ? 'var(--status-appr-text)' : 'var(--status-open-text)'
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="btn-sm-secondary"
                    >
                      <span>Workspace</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              boxShadow: 'var(--shadow-elevated)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Create New Support Case</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Issue Subject
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Headphones arrived damaged. I want a replacement."
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Detailed Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the defect, delivery issue, or customer request..."
                  required
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Customer
                  </label>
                  <select
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)' }}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company || 'Personal'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Linked Order (Optional)
                  </label>
                  <select
                    value={newOrder}
                    onChange={(e) => setNewOrder(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">None / Unassigned</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>#{o.id} - {o.product_name.substring(0, 24)}...</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.85rem', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ height: '42px', paddingInline: '20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                  style={{ height: '42px', paddingInline: '24px' }}
                >
                  {creating ? 'Creating...' : 'Create & Open Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

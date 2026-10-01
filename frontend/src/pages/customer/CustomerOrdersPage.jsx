import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  Truck,
  ExternalLink
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await api.getCustomerOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Order History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review past purchases, carrier delivery timestamps, and associated warranty claims.
          </p>
        </div>

        <Link
          to="/customer/issues/new"
          className="btn-secondary"
          style={{ height: '40px', paddingInline: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={15} />
          <span>Report an Issue</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Package size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            No orders found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', marginInline: 'auto', marginTop: '6px' }}>
            We could not find past purchases linked to your registered email address.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => {
            const hasIssues = order.relatedTickets && order.relatedTickets.length > 0;

            return (
              <div
                key={order.id}
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Package size={20} color="var(--text-primary)" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                          {order.productName}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600 }}>
                          #{order.id}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Order Total: <strong>${order.amount}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: order.status === 'DELIVERED' ? '#ecfdf5' : 'var(--bg-tertiary)',
                        color: order.status === 'DELIVERED' ? '#059669' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Truck size={12} />
                      <span>{order.status}</span>
                    </span>

                    <button
                      onClick={() => navigate('/customer/issues/new', { state: { orderId: order.id } })}
                      className="btn-sm-secondary"
                      style={{ height: '34px', paddingInline: '12px', fontSize: '0.8rem' }}
                    >
                      Report Problem
                    </button>
                  </div>
                </div>

                {/* Delivery Date & Linked Tickets Footer */}
                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>
                      Delivered: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'In Transit'}
                    </span>
                  </div>

                  {hasIssues && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>Active Case:</span>
                      {order.relatedTickets.map((t) => (
                        <Link
                          key={t.id}
                          to={`/customer/issues/${t.id}`}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            textDecoration: 'none'
                          }}
                        >
                          #{t.id} ({t.status})
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

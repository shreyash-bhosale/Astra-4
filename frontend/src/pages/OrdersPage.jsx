import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Package, Truck, Calendar, DollarSign, CheckCircle2, Clock } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', marginInline: 'auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Orders & Transactions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Fulfillment transactions cross-referenced by the AI Investigation Agent to evaluate warranty timelines.
        </p>
      </div>

      <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-subtle)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Order ID</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Product</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Delivery Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                    #{o.id}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div>{o.customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customer?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{o.product_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Tracking: {o.tracking_number || 'Pending'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                    ${Number(o.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: o.status === 'DELIVERED' ? 'var(--status-res-bg)' : o.status === 'PROCESSING' ? 'var(--status-proc-bg)' : 'var(--status-open-bg)',
                        color: o.status === 'DELIVERED' ? 'var(--status-res-text)' : o.status === 'PROCESSING' ? 'var(--status-proc-text)' : 'var(--status-open-text)'
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                    {o.delivery_date ? new Date(o.delivery_date).toLocaleString() : 'In Transit / Not Delivered'}
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

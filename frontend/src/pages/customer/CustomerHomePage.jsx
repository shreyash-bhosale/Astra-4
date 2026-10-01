import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  PlusCircle,
  MessageSquare,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  LifeBuoy,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function CustomerHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [profileRes, ticketsRes] = await Promise.all([
          api.getCustomerProfile().catch(() => null),
          api.getCustomerTickets().catch(() => [])
        ]);

        setProfileData(profileRes);
        setRecentTickets(Array.isArray(ticketsRes) ? ticketsRes.slice(0, 4) : []);
      } catch (err) {
        setError('Unable to load customer overview');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const customerName = profileData?.customer?.name || user?.name || 'Valued Customer';
  const firstName = customerName.split(' ')[0];
  const stats = profileData?.stats || {
    openTickets: recentTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'FAILED').length,
    resolvedTickets: recentTickets.filter(t => t.status === 'RESOLVED').length,
    totalOrders: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Hero Banner */}
      <div
        style={{
          padding: '36px 32px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              CUSTOMER CARE PORTAL
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
              Active Support
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Welcome, {firstName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '6px', maxWidth: '540px' }}>
            How can we help you today? Check ongoing inquiries, review orders, or submit a new warranty claim.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            to="/customer/issues/new"
            className="btn-primary"
            style={{
              height: '46px',
              paddingInline: '22px',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PlusCircle size={18} />
            <span>Raise an Issue</span>
          </Link>

          <Link
            to="/customer/support"
            className="btn-secondary"
            style={{
              height: '46px',
              paddingInline: '18px',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} color="var(--accent-purple)" />
            <span>Ask AI Support</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Issues</span>
            <Clock size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px' }}>
            {stats.openTickets}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Being processed by ResolveAI
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Resolved</span>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '10px' }}>
            {stats.resolvedTickets}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Verified customer solutions
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Tier</span>
            <ShieldCheck size={16} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '12px' }}>
            {profileData?.customer?.tier || 'VIP Enterprise'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Expedited warranty eligibility
          </div>
        </div>
      </div>

      {/* Two Supportive Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <Link
          to="/customer/support"
          style={{
            textDecoration: 'none',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
          }}
          className="customer-hover-card"
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <MessageSquare size={22} color="var(--text-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                ResolveAI Support Assistant
              </h3>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              Ask questions about your recent shipment, current ticket status, or warranty replacement rules.
            </p>
          </div>
        </Link>

        <Link
          to="/customer/orders"
          style={{
            textDecoration: 'none',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
          }}
          className="customer-hover-card"
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Package size={22} color="var(--text-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Order History & Shipments
              </h3>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              View verified products, delivery dates, carrier updates, and link issues directly to your items.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Issues Section */}
      <div
        style={{
          padding: '28px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Recent Issues
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Track progress, verified solutions, and customer updates
            </p>
          </div>

          <Link
            to="/customer/issues"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Loading your issues...
          </div>
        ) : recentTickets.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>
              No issues reported yet
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', marginInline: 'auto', marginBottom: '16px' }}>
              If you ever experience a problem with your order or device, we are here to help.
            </p>
            <Link to="/customer/issues/new" className="btn-primary" style={{ height: '38px', paddingInline: '18px', fontSize: '0.85rem' }}>
              Raise an Issue
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTickets.map((ticket) => {
              const safeStatus = ticket.customerSafeStatus || { label: ticket.status };

              return (
                <Link
                  key={ticket.id}
                  to={`/customer/issues/${ticket.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="customer-ticket-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: safeStatus.bg || 'var(--bg-primary)',
                        color: safeStatus.badge || 'var(--text-primary)'
                      }}
                    >
                      {safeStatus.label}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {ticket.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Case #{ticket.id} • {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      View Details
                    </span>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .customer-hover-card:hover {
          border-color: var(--text-primary) !important;
          transform: translateY(-2px);
        }
        .customer-ticket-row:hover {
          border-color: var(--text-primary) !important;
          background-color: var(--bg-primary) !important;
        }
      `}</style>
    </div>
  );
}

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginSelectionPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        position: 'relative'
      }}
    >
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.35rem',
                letterSpacing: '-0.04em',
                marginBottom: '16px'
              }}
            >
              R
            </div>
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Welcome to ResolveAI
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '8px' }}>
            Select your authentication portal to proceed
          </p>
        </div>

        {/* Portals Selection Grid */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}
        >
          {/* Card 1: Customer Login */}
          <div
            style={{
              padding: '32px 28px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px'
                }}
              >
                <User size={22} color="var(--text-primary)" />
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-blue, #2563eb)',
                  marginBottom: '6px'
                }}
              >
                Customer Support Portal
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
                Customer Login
              </h2>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Access your support account to track existing issues, check order statuses, file new tickets, and communicate with ResolveAI.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Real-time issue timeline & tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>AI warranty & replacement self-service</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Free account creation for all users</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate('/customer/login')}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '46px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Customer Login</span>
                <ArrowRight size={16} />
              </button>
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                New customer?{' '}
                <Link to="/customer/register" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Create account
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Staff / Admin Login */}
          <div
            style={{
              padding: '32px 28px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
            }}
          >
            <div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px'
                }}
              >
                <Shield size={22} color="var(--text-primary)" />
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-purple, #8b5cf6)',
                  marginBottom: '6px'
                }}
              >
                Internal Operations
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
                Admin / Manager
              </h2>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Internal ResolveAI Console for authorized operations managers, support operators, and system administrators.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Multi-agent fleet telemetry & supervisor</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Approvals queue & policy gating</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>Emergency stop & autonomous bounds</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate('/staff/login')}
                className="btn-secondary"
                style={{
                  width: '100%',
                  height: '46px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderColor: 'var(--border-default)'
                }}
              >
                <Shield size={16} />
                <span>Staff Login</span>
                <ArrowRight size={16} />
              </button>
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Restricted access • Authorized personnel only
              </div>
            </div>
          </div>
        </div>

        {/* Back to landing link */}
        <div style={{ marginTop: '28px', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Return to ResolveAI Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

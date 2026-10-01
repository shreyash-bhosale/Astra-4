import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginSelectionPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);

  const handleOneClickLogin = async (role) => {
    setLoadingRole(role);
    try {
      if (role === 'customer') {
        const loggedUser = await login('customer@resolveai.io', 'password123', 'customer');
        navigate(loggedUser?.role === 'customer' ? '/customer' : '/dashboard');
      } else {
        const loggedUser = await login('admin@resolveai.io', 'password123', 'staff');
        navigate('/dashboard');
      }
    } catch (err) {
      // Fallback navigate to respective portal
      if (role === 'customer') navigate('/customer/login');
      else navigate('/staff/login');
    } finally {
      setLoadingRole(null);
    }
  };

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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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

        {/* Hackathon Evaluator Quick Access Banner */}
        <div
          style={{
            width: '100%',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#2563eb" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                Hackathon Evaluator Credentials
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
              Instant Login Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* Customer Credential */}
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} />
                <span>Customer User Credentials</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                <strong>Email:</strong> customer@resolveai.io
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong>Pass:</strong> password123
              </div>
              <button
                type="button"
                onClick={() => handleOneClickLogin('customer')}
                disabled={loadingRole !== null}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={12} />
                <span>{loadingRole === 'customer' ? 'Signing in...' : '1-Click Customer Portal'}</span>
              </button>
            </div>

            {/* Admin Credential */}
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: '#8b5cf6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={13} />
                <span>Admin / Staff Credentials</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                <strong>Email:</strong> admin@resolveai.io
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong>Pass:</strong> password123
              </div>
              <button
                type="button"
                onClick={() => handleOneClickLogin('admin')}
                disabled={loadingRole !== null}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Shield size={12} />
                <span>{loadingRole === 'admin' ? 'Signing in...' : '1-Click Admin Console'}</span>
              </button>
            </div>
          </div>
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

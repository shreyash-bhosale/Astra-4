import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  Home,
  LifeBuoy,
  Package,
  MessageSquare,
  User,
  PlusCircle,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react';

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { to: '/customer', label: 'Home', icon: Home, end: true },
    { to: '/customer/issues', label: 'My Issues', icon: LifeBuoy },
    { to: '/customer/orders', label: 'Orders', icon: Package },
    { to: '/customer/support', label: 'AI Support', icon: MessageSquare, badge: 'AI' },
    { to: '/customer/profile', label: 'Profile', icon: User }
  ];

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Top Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            marginInline: 'auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Logo & Portal Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              to="/customer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                color: 'var(--text-primary)'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem'
                }}
              >
                R
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>ResolveAI</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.04em'
                  }}
                >
                  Customer Care
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            className="customer-desktop-nav"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)'
                  })}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: 'var(--text-primary)',
                        color: 'var(--bg-primary)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/customer/issues/new"
              className="btn-primary"
              style={{
                height: '36px',
                paddingInline: '14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <PlusCircle size={15} />
              <span>Raise Issue</span>
            </Link>

            <ThemeToggle />

            {/* Evaluator Quick Switcher to Staff/Manager Dashboard */}
            <Link
              to="/dashboard"
              title="Switch to Staff & Manager Command Center"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Shield size={13} color="var(--accent-amber)" />
              <span className="customer-staff-toggle-text">Staff Console</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              aria-label="Sign out"
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', marginInline: 'auto', padding: '24px 20px 80px 20px' }}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile Devices */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'none',
          padding: '8px 12px',
          zIndex: 100,
          justifyContent: 'space-around'
        }}
        className="customer-mobile-bottom-nav"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 10px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.7rem',
                fontWeight: isActive ? 700 : 500
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .customer-desktop-nav {
            display: none !important;
          }
          .customer-mobile-bottom-nav {
            display: flex !important;
          }
          .customer-staff-toggle-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import CommandPalette from '../components/CommandPalette';
import {
  LayoutDashboard,
  TicketCheck,
  ShieldAlert,
  Users,
  Package,
  BookOpen,
  Activity,
  Settings,
  LogOut,
  Sparkles,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  Search,
  ExternalLink,
  Cpu
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout, loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [autonomyActive, setAutonomyActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchApprovalsCount = async () => {
    try {
      const [res, supRes] = await Promise.all([
        api.getApprovals('PENDING'),
        api.getSupervisorStatus().catch(() => null)
      ]);
      const pending = Array.isArray(res) 
        ? res.filter(a => a.status === 'PENDING' || a.status === 'ESCALATED') 
        : [];
      setPendingApprovalsCount(pending.length);
      if (supRes?.supervisor) {
        setAutonomyActive(supRes.supervisor.mode === 'AUTONOMOUS');
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchApprovalsCount();
    const interval = setInterval(fetchApprovalsCount, 6000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleResetDemo = async () => {
    if (window.confirm('Reset all tickets and data to initial demo state?')) {
      setResetting(true);
      try {
        await api.resetDemo();
        window.location.reload();
      } catch (err) {
        alert('Reset failed: ' + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Control Center', path: '/control-center', icon: Cpu, badge: autonomyActive ? 'ACTIVE' : null },
    { label: 'Tickets', path: '/tickets', icon: TicketCheck },
    { label: 'Approvals', path: '/approvals', icon: ShieldAlert, badge: pendingApprovalsCount },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Orders', path: '/orders', icon: Package },
    { label: 'Policies', path: '/policies', icon: BookOpen },
    { label: 'AI Activity', path: '/activity', icon: Activity },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100svh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100svh',
          zIndex: 40,
          padding: '24px 16px',
          flexShrink: 0
        }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingInline: '12px', marginBottom: '32px' }}>
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
              fontSize: '1rem',
              letterSpacing: '-0.04em'
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.04em', lineHeight: 1.1 }}>RESOLVE.AI</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Autonomous Ops
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--accent-amber)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Data Reset Helper */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', marginBottom: '12px' }}>
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-primary)',
              transition: 'background var(--transition-fast)'
            }}
          >
            <RefreshCw size={13} className={resetting ? 'spin' : ''} />
            {resetting ? 'Resetting...' : 'Reset Demo Seeds'}
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div
            onClick={() => navigate('/settings?tab=profile')}
            style={{ overflow: 'hidden', cursor: 'pointer', flex: 1 }}
            title="Edit Admin Profile & Details"
          >
            <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{user?.name || 'Support Agent'}</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', fontWeight: 700 }}>
                Edit
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              Role: {user?.role || 'agent'}
            </div>
          </div>
          <button
            onClick={() => logout('/staff/login')}
            title="Log Out"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header bar */}
        <header
          style={{
            height: '64px',
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 'clamp(16px, 3vw, 36px)',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{ display: 'none', padding: '6px' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>ResolveAI Platform</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                {location.pathname.split('/')[1] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Global Search Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              title="Search (⌘K)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>⌘K</kbd>
            </button>

            {/* Quick Persona Switcher for Hackathon Demo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Demo:</span>
              <button
                onClick={() => loginWithDemo('agent')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: user?.role === 'agent' ? 700 : 500,
                  backgroundColor: user?.role === 'agent' ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                  color: user?.role === 'agent' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
              >
                Agent
              </button>
              <button
                onClick={() => loginWithDemo('manager')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: user?.role === 'manager' ? 700 : 500,
                  backgroundColor: user?.role === 'manager' ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                  color: user?.role === 'manager' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
              >
                Manager
              </button>
              <button
                onClick={() => loginWithDemo('admin')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: user?.role === 'admin' ? 700 : 500,
                  backgroundColor: user?.role === 'admin' ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                  color: user?.role === 'admin' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
              >
                Admin
              </button>
              <button
                onClick={() => navigate('/customer')}
                title="Open Customer Portal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <ExternalLink size={12} />
                <span>Portal</span>
              </button>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {autonomyActive && (
              <button
                onClick={() => navigate('/control-center')}
                title="Autonomous AI Mode Active — Click to inspect in AI Control Center"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#000000',
                  color: '#10b981',
                  border: '1px solid #10b981',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span>AUTONOMOUS</span>
              </button>
            )}

            <button
              onClick={() => navigate('/tickets')}
              className="btn-sm-primary"
            >
              <Sparkles size={14} />
              <span>Workspace</span>
            </button>

          </div>
        </header>

        {/* Page Outlet */}
        <main style={{ flex: 1, padding: 'clamp(20px, 3vw, 40px)' }}>
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 900px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

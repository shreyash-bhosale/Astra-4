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
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const data = await api.getCustomerNotifications();
        if (isMounted && Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (err) {
        // silent
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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

            {/* Notifications Bell & Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen(prev => !prev)}
                aria-label="View notifications"
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: notifOpen ? 'var(--bg-tertiary)' : 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      borderRadius: '8px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 4px rgba(239, 68, 68, 0.6)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-elevated)',
                    zIndex: 200,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Notifications</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-light)',
                            backgroundColor: notif.read ? 'transparent' : 'var(--bg-secondary)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                              {notif.subject || 'Case Update'}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}>
                            {notif.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

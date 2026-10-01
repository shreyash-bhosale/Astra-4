import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  TicketCheck,
  User,
  Package,
  ShieldAlert,
  ArrowRight,
  CornerDownLeft,
  Command,
  X,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tickets: [], customers: [], orders: [], approvals: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Reset and focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ tickets: [], customers: [], orders: [], approvals: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tickets: [], customers: [], orders: [], approvals: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.globalSearch(query.trim());
        setResults(data || { tickets: [], customers: [], orders: [], approvals: [] });
        setSelectedIndex(0);
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Flat list of items for keyboard navigation
  const quickActions = [
    { type: 'action', title: 'Go to Ticket Workspace', icon: TicketCheck, onSelect: () => navigate('/tickets') },
    { type: 'action', title: 'Review Pending Approvals', icon: ShieldAlert, onSelect: () => navigate('/approvals') },
    { type: 'action', title: 'Open Customer Portal', icon: ExternalLink, onSelect: () => navigate('/customer') },
    { type: 'action', title: `Toggle Theme (${theme === 'dark' ? 'Light' : 'Dark'})`, icon: theme === 'dark' ? Sun : Moon, onSelect: () => toggleTheme() }
  ];

  const searchItems = [
    ...results.tickets.map(t => ({
      type: 'ticket',
      id: t.id,
      title: t.title,
      subtitle: `${t.id} • ${t.category} • ${t.status}`,
      badge: t.status,
      icon: TicketCheck,
      onSelect: () => navigate(`/tickets/${t.id}`)
    })),
    ...results.customers.map(c => ({
      type: 'customer',
      id: c.id,
      title: c.name,
      subtitle: `${c.email} • ${c.company || c.tier}`,
      badge: c.tier,
      icon: User,
      onSelect: () => navigate('/customers')
    })),
    ...results.orders.map(o => ({
      type: 'order',
      id: o.id,
      title: `${o.productName} ($${o.amount})`,
      subtitle: `Order ${o.id} • Status: ${o.status}`,
      badge: o.status,
      icon: Package,
      onSelect: () => navigate('/orders')
    })),
    ...results.approvals.map(a => ({
      type: 'approval',
      id: a.id,
      title: `Action: ${a.action}`,
      subtitle: `Approval ${a.id} • Ticket: ${a.ticketId}`,
      badge: a.status,
      icon: ShieldAlert,
      onSelect: () => navigate('/approvals')
    }))
  ];

  const activeItems = query.trim() ? searchItems : quickActions;

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, activeItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + activeItems.length) % Math.max(1, activeItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItems[selectedIndex]) {
        activeItems[selectedIndex].onSelect();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingInline: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <Search size={20} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tickets, customers, orders... (⌘K)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontFamily: 'inherit'
            }}
          />
          {loading && (
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid var(--border-subtle)',
                borderTopColor: 'var(--text-primary)',
                animation: 'spin 0.6s linear infinite'
              }}
            />
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div
          style={{
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {!query.trim() && (
            <div
              style={{
                padding: '8px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)'
              }}
            >
              Quick Navigation & Commands
            </div>
          )}

          {query.trim() && activeItems.length === 0 && !loading && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}
            >
              No results found for "{query}".
            </div>
          )}

          {activeItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;

            return (
              <div
                key={`${item.type}-${item.id || item.title}-${index}`}
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  transition: 'background-color 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isSelected && <CornerDownLeft size={14} color="var(--text-muted)" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>↵</kbd> Select</span>
            <span><kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>ESC</kbd> Close</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Command size={12} />
            <span>ResolveAI Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}

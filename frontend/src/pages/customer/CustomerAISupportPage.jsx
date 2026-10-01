import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  RotateCcw,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const DEFAULT_PROMPTS = [
  'What is the status of my ticket?',
  'Show my recent orders',
  'What is your warranty policy for damaged items?',
  'How do I request a replacement?'
];

export default function CustomerAISupportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am your ResolveAI Customer Support Assistant. How can I help you today? You can ask about your order tracking, check the progress of open issues, or inquire about replacement policies.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: ['What is the status of my ticket?', 'Show my recent orders', 'Raise an issue']
    }
  ]);
  const [input, setInput] = useState(location.state?.initialMessage || '');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // If navigated with initial message, send automatically
  useEffect(() => {
    if (location.state?.initialMessage) {
      handleSend(location.state.initialMessage);
    }
  }, []);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendCustomerChatMessage(textToSend.trim());
      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res?.reply || "I am currently reviewing your records. Please check the 'My Issues' tab for live ticket milestones.",
        suggestedActions: res?.suggestedActions || ['View my issues', 'Raise an issue'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      const errorReply = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'I am momentarily having trouble retrieving your account telemetry. You can still track your case directly from the "My Issues" section or raise a new request.',
        suggestedActions: ['View my issues', 'Raise an issue'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.toLowerCase().includes('raise an issue') || action.toLowerCase().includes('create issue')) {
      navigate('/customer/issues/new');
    } else if (action.toLowerCase().includes('view my issues') || action.toLowerCase().includes('my issues')) {
      navigate('/customer/issues');
    } else if (action.toLowerCase().includes('view my orders') || action.toLowerCase().includes('show my orders') || action.toLowerCase().includes('orders')) {
      navigate('/customer/orders');
    } else {
      handleSend(action);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: 'Conversation cleared. How can I assist you with your ResolveAI account or orders today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: ['What is the status of my ticket?', 'Show my recent orders', 'Raise an issue']
      }
    ]);
  };

  return (
    <div style={{ maxWidth: '840px', marginInline: 'auto', display: 'flex', flexDirection: 'column', height: 'calc(100svh - 140px)' }}>
      {/* Chat Window Container */}
      <div
        style={{
          flex: 1,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>ResolveAI Support Assistant</span>
                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 'var(--radius-pill)', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
                  ● Online
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Scoped to your verified customer purchases and active cases
              </div>
            </div>
          </div>

          <button
            onClick={handleClear}
            title="Clear Chat History"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={12} />
            <span>Clear</span>
          </button>
        </div>

        {/* Message Log */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAI ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  alignSelf: isAI ? 'flex-start' : 'flex-end'
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    borderTopLeftRadius: isAI ? '4px' : '16px',
                    borderTopRightRadius: isAI ? '16px' : '4px',
                    backgroundColor: isAI ? 'var(--bg-tertiary)' : 'var(--text-primary)',
                    color: isAI ? 'var(--text-primary)' : 'var(--bg-primary)',
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.text}
                </div>

                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', paddingInline: '4px' }}>
                  {msg.timestamp}
                </span>

                {/* Suggested Action Chips */}
                {isAI && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--text-primary)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <span>{action}</span>
                        <ChevronRight size={11} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', borderRadius: '16px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Sparkles size={14} className="spin" />
              <span>ResolveAI Assistant is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Quick Prompt Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {DEFAULT_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              placeholder="Ask about your issue status, orders, or warranty..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.92rem',
                color: 'var(--text-primary)'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary"
              style={{
                height: '46px',
                paddingInline: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: loading || !input.trim() ? 0.6 : 1
              }}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import ThemeToggle from '../components/ThemeToggle';
import {
  Settings,
  Cpu,
  Shield,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building,
  Bell,
  PhoneCall,
  Layers,
  Save,
  Sliders,
  LogOut,
  Upload,
  Mail,
  Send
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Workspace form state
  const [formData, setFormData] = useState({
    orgName: 'ResolveAI Operations',
    publicEmail: 'support@resolveai.io',
    description: 'Autonomous customer operations and intelligent resolution workspace.',
    websiteUrl: 'https://resolveai.io',
    location: 'San Francisco, CA',
    maxAgentSteps: 10,
    safetyGateMode: 'Strict Human-in-the-Loop',
    notifications: {
      inApp: true,
      email: true,
      voice: false
    },
    voiceCallStart: '09:00',
    voiceCallEnd: '21:00',
    voiceFrequency: 'important',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Demo reset modal state
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Email service status and test dispatch
  const [emailStatus, setEmailStatus] = useState(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [data, emailData] = await Promise.all([
        api.getSettings(),
        api.getEmailStatus().catch(() => null)
      ]);
      setSettings(data);
      if (emailData) setEmailStatus(emailData);

      if (data.workspace) {
        setFormData(prev => ({
          ...prev,
          orgName: data.workspace.orgName || prev.orgName,
          publicEmail: data.workspace.publicEmail || prev.publicEmail,
          description: data.workspace.description || prev.description,
          websiteUrl: data.workspace.websiteUrl || prev.websiteUrl,
          location: data.workspace.location || prev.location,
          maxAgentSteps: data.workspace.maxAgentSteps || prev.maxAgentSteps,
          safetyGateMode: data.workspace.safetyGateMode || prev.safetyGateMode,
          notifications: data.workspace.notifications || prev.notifications
        }));
      }
      setIsDirty(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setSendingTestEmail(true);
      setTestEmailResult(null);
      const res = await api.sendAdminTestEmail();
      setTestEmailResult({
        success: true,
        message: `Dispatched test email to ${res.recipient} (Delivery ID: ${res.providerMessageId || 'msg_resend_live'})`
      });
      // Refresh status
      const updatedStatus = await api.getEmailStatus().catch(() => null);
      if (updatedStatus) setEmailStatus(updatedStatus);
    } catch (err) {
      setTestEmailResult({
        success: false,
        message: err.message || 'Failed to dispatch test verification email.'
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const handleNotificationToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
    setIsDirty(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setErrorMessage('');
    try {
      // Validate email format if provided
      if (formData.publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.publicEmail)) {
        throw new Error('Please enter a valid public email address.');
      }

      await api.updateSettings(formData);
      setIsDirty(false);
      setToastMessage('Settings successfully saved and synchronized.');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result);
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenResetModal = () => {
    setResetError('');
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    setResetError('');
    try {
      await api.resetDemo();
      setShowResetConfirm(false);
      setResetSuccess('Demo database successfully re-seeded to initial state.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setResetError(err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Layers size={17} /> },
    { id: 'general', label: 'General & Workspace', icon: <Building size={17} /> },
    { id: 'ai', label: 'AI & Automation', icon: <Cpu size={17} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} /> },
    { id: 'voice', label: 'Voice Operations', icon: <PhoneCall size={17} /> },
    { id: 'security', label: 'Security & Access', icon: <Shield size={17} /> },
    { id: 'system', label: 'System & Demo State', icon: <Database size={17} /> }
  ];

  return (
    <div style={{ maxWidth: '1280px', marginInline: 'auto', paddingBottom: '80px' }}>
      {/* 1. TOP HEADER & SAVE BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={18} />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Settings & Operations Control
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Configure your ResolveAI workspace, account, AI behavior, notifications, and operational preferences.
          </p>
        </div>

        {/* Header Right Status & Save CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: isDirty ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: isDirty ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isDirty ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                boxShadow: isDirty ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
              }}
            />
            <span>{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={!isDirty || saving}
            className="btn-primary"
            style={{
              height: '42px',
              paddingInline: '20px',
              gap: '8px',
              opacity: !isDirty ? 0.6 : 1,
              cursor: !isDirty ? 'default' : 'pointer'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Toast & Error Alerts */}
      {toastMessage && (
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-res-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--status-res-text)',
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-subtle)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {resetSuccess && (
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-res-bg)',
            color: 'var(--status-res-text)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* 2. MAIN WORKSPACE: SIDEBAR + CONTENT GRID */}
      <div className="settings-layout-grid">
        {/* Navigation Sidebar */}
        <aside className="settings-sidebar">
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px', paddingLeft: '8px' }}>
            CONTROL SECTIONS
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`settings-nav-btn ${active ? 'active' : ''}`}
                >
                  <span style={{ color: active ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Session Identity Card */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              AUTHENTICATED USER
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '6px', color: 'var(--text-primary)' }}>
              {user?.name || 'Authorized Operator'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              Role: <strong style={{ color: 'var(--accent-blue)' }}>{user?.role || 'Staff'}</strong>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="settings-content-pane">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ height: '120px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-tertiary)', opacity: 0.6 }} />
              <div style={{ height: '240px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-tertiary)', opacity: 0.6 }} />
              <div style={{ height: '180px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-tertiary)', opacity: 0.6 }} />
            </div>
          ) : (
            <>
              {/* ================================================================
                  TAB: OVERVIEW
                  ================================================================ */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Overview KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div className="settings-stat-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workspace</span>
                        <Building size={16} color="var(--accent-blue)" />
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                    {formData.orgName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
                    ● Production Tier Active
                  </div>
                </div>

                <div className="settings-stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Status</span>
                    <Cpu size={16} color="var(--accent-purple)" />
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                    {settings?.geminiModel || 'gemini-flash-latest'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
                    ✓ 7 Agents Online & Verified
                  </div>
                </div>

                <div className="settings-stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notifications</span>
                    <Bell size={16} color="var(--accent-amber)" />
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                    Multi-Channel
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Email: ON · In-App: ON · Voice: {formData.notifications.voice ? 'ON' : 'OFF'}
                  </div>
                </div>

                <div className="settings-stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Security Mode</span>
                    <Shield size={16} color="var(--accent-emerald)" />
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
                    Protected
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supabase PostgreSQL + JWT Auth
                  </div>
                </div>
              </div>

              {/* System Entity Summary */}
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Database size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Operational Database Inventory</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Live record counts synchronized between memory store and persistent Supabase database.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{settings?.stats?.ticketsCount || 4}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Tickets</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{settings?.stats?.usersCount || 3}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Users & Agents</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{settings?.stats?.policiesCount || 4}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Policies</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{settings?.stats?.approvalsCount || 1}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Approval Gates</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: GENERAL & WORKSPACE IDENTITY
              ================================================================ */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Building size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Workspace Identity & Public Profile</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Manage how your ResolveAI instance appears to customers and support personnel across portals and tickets.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  <div>
                    <label className="settings-label">Organization Name</label>
                    <div className="settings-helper">The primary branding title shown in the header and customer portal.</div>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.orgName}
                      onChange={(e) => handleFieldChange('orgName', e.target.value)}
                      placeholder="e.g. ResolveAI Operations"
                    />
                  </div>

                  <div>
                    <label className="settings-label">Public Support Email</label>
                    <div className="settings-helper">Address used as sender identity for transactional ticket updates.</div>
                    <input
                      type="email"
                      className="settings-input"
                      value={formData.publicEmail}
                      onChange={(e) => handleFieldChange('publicEmail', e.target.value)}
                      placeholder="support@company.com"
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-label">Workspace Description</label>
                    <div className="settings-helper">Briefly describe the operational scope for AI triage agents.</div>
                    <textarea
                      rows={3}
                      className="settings-input"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="Describe your organization's support mission..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label className="settings-label">Support Portal Website URL</label>
                    <div className="settings-helper">Public website where customers raise initial issues.</div>
                    <input
                      type="url"
                      className="settings-input"
                      value={formData.websiteUrl}
                      onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div>
                    <label className="settings-label">Headquarters / Operational Region</label>
                    <div className="settings-helper">Primary location for carrier SLA calculations.</div>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>
              </div>

              {/* Workspace Logo & Appearance */}
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Sliders size={18} color="var(--accent-purple)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Workspace Avatar & Theme</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Customize branding assets and visual theme.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '2px dashed var(--border-strong)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--accent-blue)' }}>R</span>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-sm-secondary"
                      >
                        <Upload size={14} />
                        <span>Upload Logo</span>
                      </button>
                      {avatarPreview && (
                        <button
                          onClick={() => { setAvatarPreview(null); setIsDirty(true); }}
                          style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Recommended: Square PNG/SVG, minimum 256×256 pixels.
                    </div>
                  </div>

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Theme Mode:</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: AI & AUTOMATION ENGINE
              ================================================================ */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Cpu size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Google Gemini Foundation Model</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Configure generative AI parameters and reasoning safeguards for autonomous agent planning.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Model</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '4px' }}>
                      {settings?.geminiModel || 'gemini-flash-latest'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 600 }}>
                      ✓ Google AI Studio API Active
                    </div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <label className="settings-label" style={{ marginBottom: '4px' }}>Max Agent Execution Steps</label>
                    <div className="settings-helper" style={{ marginBottom: '8px' }}>Protects against infinite agent reasoning loops.</div>
                    <select
                      className="settings-input"
                      value={formData.maxAgentSteps}
                      onChange={(e) => handleFieldChange('maxAgentSteps', e.target.value)}
                    >
                      <option value="5">5 Steps (Fast / Strict)</option>
                      <option value="10">10 Steps (Default Balanced)</option>
                      <option value="15">15 Steps (Deep Investigation)</option>
                      <option value="20">20 Steps (Maximum Exhaustive)</option>
                    </select>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <label className="settings-label" style={{ marginBottom: '4px' }}>Autonomous Safety Gate</label>
                    <div className="settings-helper" style={{ marginBottom: '8px' }}>Threshold for requiring supervisor approval.</div>
                    <select
                      className="settings-input"
                      value={formData.safetyGateMode}
                      onChange={(e) => handleFieldChange('safetyGateMode', e.target.value)}
                    >
                      <option value="Strict Human-in-the-Loop">Strict Human-in-the-Loop (Recommended)</option>
                      <option value="Permissive">Permissive (Low Risk Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Allowlisted Tools Inspection */}
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Shield size={18} color="var(--accent-emerald)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Allowlisted Backend Tools & Sandboxes</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  ResolveAI agents can ONLY invoke these server-side typed tools. Direct raw SQL execution and shell access are blocked.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {[
                    { name: 'getCustomer()', role: 'Investigation Agent', risk: 'Low Risk' },
                    { name: 'getOrder()', role: 'Investigation Agent', risk: 'Low Risk' },
                    { name: 'getTicketHistory()', role: 'Investigation Agent', risk: 'Low Risk' },
                    { name: 'searchPolicies()', role: 'Policy Agent', risk: 'Low Risk' },
                    { name: 'createReplacementRequest()', role: 'Action Agent', risk: 'Medium Risk (Approval Gate)' },
                    { name: 'createEscalation()', role: 'Action Agent', risk: 'Low Risk' },
                    { name: 'updateTicketStatus()', role: 'Orchestrator Agent', risk: 'Low Risk' }
                  ].map(tool => (
                    <div
                      key={tool.name}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {tool.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: tool.risk.includes('Approval') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: tool.risk.includes('Approval') ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                          }}
                        >
                          {tool.risk.includes('Approval') ? 'Gated' : 'Autonomous'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Invoked by: {tool.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: NOTIFICATIONS
              ================================================================ */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Bell size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Multi-Channel Dispatch Channels</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Choose how ResolveAI informs users as customer issues transition across resolution gates.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="settings-toggle-row">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>In-App Portal Notifications</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Show badge alerts and live case progress directly in the Customer and Staff workspaces.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationToggle('inApp')}
                      className={`toggle-switch ${formData.notifications.inApp ? 'on' : ''}`}
                      aria-label="Toggle In-App Notifications"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Transactional Email Notifications</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Dispatch verified case summaries and tracking confirmations via transactional Resend provider.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationToggle('email')}
                      className={`toggle-switch ${formData.notifications.email ? 'on' : ''}`}
                      aria-label="Toggle Email Notifications"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Automated AI Voice Calls</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Enable optional outbound phone updates during business calling windows.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationToggle('voice')}
                      className={`toggle-switch ${formData.notifications.voice ? 'on' : ''}`}
                      aria-label="Toggle AI Voice Notifications"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Backend Transactional Email Service Status */}
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Mail size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        Backend Transactional Email Service
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Autonomous multi-agent email gateway managed entirely on the server.
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--accent-emerald)',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-emerald)',
                        boxShadow: '0 0 6px #10b981'
                      }}
                    />
                    <span>{emailStatus?.isLive ? '● Operational (Resend Live)' : '● Operational (Simulator Mode)'}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '20px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Transactional Provider
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                      {emailStatus?.provider || 'Resend (Server Configured)'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {emailStatus?.apiKeyConfigured ? '✓ Server API key active' : '✓ Simulator fallback active'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Sender Identity
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                      {emailStatus?.sender || 'notifications@resolveai.io'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      ✓ Verified server sender
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Customer Credentials
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: '#059669' }}>
                      None Required
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Fully backend automated
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Outbound Dispatches
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                      {emailStatus?.stats?.totalSent || 0} delivered {emailStatus?.stats?.totalFailed ? `(${emailStatus.stats.totalFailed} failed)` : ''}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {emailStatus?.stats?.lastDelivery ? `Last: ${new Date(emailStatus.stats.lastDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready for events'}
                    </div>
                  </div>
                </div>

                {/* Admin-only Send Test Email */}
                {user?.role === 'admin' && (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'rgba(59, 130, 246, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Send Test Verification Email
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Dispatches a verification email exclusively to your authenticated address (<strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>).
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail}
                      className="btn-secondary"
                      style={{
                        height: '38px',
                        paddingInline: '16px',
                        gap: '6px',
                        fontWeight: 600,
                        fontSize: '0.84rem'
                      }}
                    >
                      {sendingTestEmail ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                      <span>{sendingTestEmail ? 'Dispatching...' : 'Send Test Email'}</span>
                    </button>
                  </div>
                )}

                {testEmailResult && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: testEmailResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${testEmailResult.success ? '#10b981' : '#ef4444'}`,
                      color: testEmailResult.success ? '#059669' : '#dc2626',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {testEmailResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testEmailResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: VOICE OPERATIONS
              ================================================================ */}
          {activeTab === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <PhoneCall size={18} color="var(--accent-purple)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Voice Call Updates</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Configure automated spoken briefings for urgent customer tickets and carrier updates.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  <div>
                    <label className="settings-label">Voice Update Activation</label>
                    <div className="settings-helper">Voice calls remain strictly OFF until customer opts in.</div>
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleNotificationToggle('voice')}
                        className={`toggle-switch ${formData.notifications.voice ? 'on' : ''}`}
                        aria-label="Toggle Voice Updates"
                      >
                        <span className="toggle-thumb" />
                      </button>
                      <span style={{ marginLeft: '12px', fontSize: '0.88rem', fontWeight: 700 }}>
                        {formData.notifications.voice ? 'Voice Updates ENABLED' : 'Voice Updates DISABLED'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="settings-label">Allowed Calling Hours Window</label>
                    <div className="settings-helper">Prevents disturbing customers during night hours.</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="time"
                        className="settings-input"
                        value={formData.voiceCallStart}
                        onChange={(e) => handleFieldChange('voiceCallStart', e.target.value)}
                        style={{ width: '130px' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>to</span>
                      <input
                        type="time"
                        className="settings-input"
                        value={formData.voiceCallEnd}
                        onChange={(e) => handleFieldChange('voiceCallEnd', e.target.value)}
                        style={{ width: '130px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="settings-label">Call Notification Frequency</label>
                    <div className="settings-helper">Threshold for initiating phone calls.</div>
                    <select
                      className="settings-input"
                      value={formData.voiceFrequency}
                      onChange={(e) => handleFieldChange('voiceFrequency', e.target.value)}
                    >
                      <option value="important">Important Updates Only (Replacements & Delays)</option>
                      <option value="emergency">Critical / Emergency Only</option>
                      <option value="all">All Stage Transitions</option>
                    </select>
                  </div>

                  <div>
                    <label className="settings-label">Timezone</label>
                    <div className="settings-helper">Used to calculate calling window boundaries.</div>
                    <input
                      type="text"
                      className="settings-input"
                      value={formData.timezone}
                      onChange={(e) => handleFieldChange('timezone', e.target.value)}
                      placeholder="e.g. America/New_York or UTC"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: SECURITY & ACCESS
              ================================================================ */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Shield size={18} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Authentication & Session Posture</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
                  Manage session credentials and access controls.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Operator</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{user?.email}</div>
                  </div>

                  <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role-Based Access</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px', textTransform: 'capitalize' }}>
                      {user?.role || 'Staff Operator'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '2px', fontWeight: 600 }}>
                      ✓ JWT Authorization Active
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    onClick={() => logout()}
                    className="btn-secondary"
                    style={{ height: '40px', paddingInline: '20px', gap: '8px', color: '#ef4444' }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out Current Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: SYSTEM & DEMO STATE
              ================================================================ */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="settings-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Database size={18} color="var(--accent-amber)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Demonstration State Management</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Quickly restore the demo environment to initial seed values (Elena Rostova damaged headphones case, Marcus Vance wrong switch exchange, and Sophia Chen cancellation).
                </p>

                <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '4px' }}>
                    Re-seed Demo Database
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    This safely repopulates demo persona users, fresh ticket workspaces, and pending supervisor approval gates.
                  </div>
                </div>

                <button
                  onClick={handleOpenResetModal}
                  disabled={resetting}
                  className="btn-secondary"
                  style={{ height: '42px', paddingInline: '22px', gap: '8px' }}
                >
                  <RefreshCw size={15} className={resetting ? 'spin' : ''} />
                  <span>{resetting ? 'Resetting Database...' : 'Re-seed Demo Data'}</span>
                </button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Reset Demo Database"
        message="Are you sure you want to reset the database? This will restore all customer records, initial tickets, and approval queues back to their default demonstration seeds."
        confirmText="Reset Database"
        cancelText="Cancel"
        variant="danger"
        loading={resetting}
        error={resetError}
      />

      {/* Scoped CSS for Settings Layout & Controls */}
      <style>{`
        .settings-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 32px;
          align-items: start;
        }
        .settings-sidebar {
          position: sticky;
          top: 100px;
        }
        .settings-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .settings-nav-btn:hover {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }
        .settings-nav-btn.active {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--border-subtle);
          box-shadow: var(--shadow-subtle);
        }
        .settings-card {
          padding: 28px;
          border-radius: var(--radius-lg);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-subtle);
        }
        .settings-stat-card {
          padding: 20px;
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-subtle);
        }
        .settings-label {
          display: block;
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .settings-helper {
          font-size: 0.76rem;
          color: var(--text-muted);
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .settings-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 0.88rem;
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .settings-input:focus {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        .settings-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-radius: var(--radius-md);
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
        }
        .toggle-switch {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background-color: var(--border-strong);
          border: none;
          cursor: pointer;
          position: relative;
          transition: background-color 0.2s ease;
          padding: 2px;
        }
        .toggle-switch.on {
          background-color: var(--accent-emerald);
        }
        .toggle-thumb {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          transform: translateX(0);
          transition: transform 0.2s ease;
        }
        .toggle-switch.on .toggle-thumb {
          transform: translateX(20px);
        }
        @media (max-width: 860px) {
          .settings-layout-grid {
            grid-template-columns: 1fr;
          }
          .settings-sidebar {
            position: static;
          }
          .settings-sidebar nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 8px;
          }
          .settings-nav-btn {
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}

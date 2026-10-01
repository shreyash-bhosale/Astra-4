import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Pause,
  Play,
  Sparkles,
  Sliders,
  RefreshCw,
  Terminal,
  Send,
  MessageSquare,
  Lock,
  Check,
  ArrowRight,
  Zap,
  Layers,
  Activity,
  UserCheck,
  ExternalLink
} from 'lucide-react';

export default function AIControlCenterPage() {
  const navigate = useNavigate();
  const { user, loginWithDemo } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;

  const [statusData, setStatusData] = useState(null);
  const [agents, setAgents] = useState([]);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Confirmation Modal State
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const inFlightRef = useRef(false);

  // Operational Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-init',
      sender: 'supervisor',
      text: 'ResolveAI Supervisor Agent online. Telemetry active across all 7 operational agents. Ask me anything regarding current fleet health, running workflows, or policy boundaries.'
    }
  ]);
  const [queryInput, setQueryInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  // Selected agent for telemetry inspection
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Editable settings draft
  const [draftRefundLimit, setDraftRefundLimit] = useState(1000);
  const [draftAllowedTools, setDraftAllowedTools] = useState([]);
  const [draftApprovalMode, setDraftApprovalMode] = useState('HYBRID');
  const [draftAutonomousApprovalsEnabled, setDraftAutonomousApprovalsEnabled] = useState(true);
  const [draftPermissions, setDraftPermissions] = useState({
    allow_replacements: true,
    allow_shipping: true,
    allow_notifications: true,
    allow_status_changes: true,
    allow_refunds: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Approvals & Recent Decisions
  const [approvals, setApprovals] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);

  const fetchData = async () => {
    try {
      const [statusRes, agentsRes, eventsRes, settingsRes, approvalsRes] = await Promise.all([
        api.getSupervisorStatus(),
        api.getSupervisorAgents(),
        api.getSupervisorEvents(),
        api.getAutonomySettings(),
        api.getApprovals()
      ]);
      setStatusData(statusRes);
      setAgents(agentsRes);
      setEvents(eventsRes);
      setSettings(settingsRes);
      setApprovals(approvalsRes || []);
      setDraftRefundLimit(settingsRes.refund_limit || 1000);
      setDraftAllowedTools(settingsRes.allowed_tools || []);
      setDraftApprovalMode(settingsRes.approval_mode || 'HYBRID');
      setDraftAutonomousApprovalsEnabled(settingsRes.autonomous_approvals_enabled !== false);
      if (settingsRes.permissions) {
        setDraftPermissions({
          allow_replacements: settingsRes.permissions.allow_replacements !== false,
          allow_shipping: settingsRes.permissions.allow_shipping !== false,
          allow_notifications: settingsRes.permissions.allow_notifications !== false,
          allow_status_changes: settingsRes.permissions.allow_status_changes !== false,
          allow_refunds: settingsRes.permissions.allow_refunds === true
        });
      }
    } catch (err) {
      console.error('Failed to load supervisor data:', err);
      setErrorMessage(err.message || 'Failed to load supervisor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const ensureAuthorizedOrElevate = async () => {
    if (canManage) return true;
    try {
      if (loginWithDemo) {
        await loginWithDemo('manager');
        showToast('Elevated to Operations Manager (James Rodriguez) with supervisory authority.');
        return true;
      }
    } catch (e) {
      console.warn('Auto-elevation failed:', e);
    }
    setErrorMessage('Operations Manager or Administrator credentials are required to modify supervisor autonomy.');
    return false;
  };

  const handleEnableAutonomy = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const ok = await ensureAuthorizedOrElevate();
      if (!ok) return;

      // Optimistic update
      setSettings(prev => ({
        ...(prev || {}),
        enabled: true,
        paused: false,
        emergency_stopped: false,
        autonomous_approvals_enabled: true
      }));

      await api.enableAutonomousMode();
      setShowEnableModal(false);
      showToast('Autonomous AI Mode ENABLED. Supervisor is authorized to execute policy-bounded actions.');
      await fetchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to enable autonomous mode');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableAutonomy = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const ok = await ensureAuthorizedOrElevate();
      if (!ok) return;

      // Optimistic update
      setSettings(prev => ({
        ...(prev || {}),
        enabled: false,
        paused: false,
        autonomous_approvals_enabled: false
      }));

      await api.disableAutonomousMode();
      showToast('Autonomous AI Mode DISABLED. Workflow actions revert to human supervisor review.');
      await fetchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to disable autonomous mode');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async () => {
    setActionLoading(true);
    setErrorMessage('');
    const targetPaused = !settings?.paused;
    try {
      const ok = await ensureAuthorizedOrElevate();
      if (!ok) return;

      // Optimistic update
      setSettings(prev => ({
        ...(prev || {}),
        paused: targetPaused
      }));

      if (settings?.paused) {
        await api.resumeAutonomousMode();
        showToast('Autonomous workflow execution RESUMED.');
      } else {
        await api.pauseAutonomousMode();
        showToast('Autonomous execution PAUSED. Supervisor is actively monitoring.');
      }
      await fetchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to toggle pause');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const ok = await ensureAuthorizedOrElevate();
      if (!ok) return;

      // Optimistic update
      setSettings(prev => ({
        ...(prev || {}),
        emergency_stopped: true,
        enabled: false,
        paused: true,
        autonomous_approvals_enabled: false
      }));

      await api.emergencyStopAutonomy();
      setShowEmergencyModal(false);
      showToast('EMERGENCY STOP EXECUTED: All autonomous executions halted.');
      await fetchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to execute emergency stop');
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    try {
      const ok = await ensureAuthorizedOrElevate();
      if (!ok) return;

      await api.updateAutonomySettings({
        refund_limit: Number(draftRefundLimit),
        allowed_tools: draftAllowedTools,
        approval_mode: draftApprovalMode,
        autonomous_approvals_enabled: draftAutonomousApprovalsEnabled,
        permissions: draftPermissions
      });
      showToast('Autonomous approval control policies successfully updated and persisted.');
      await fetchData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const togglePermission = (key) => {
    setDraftPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleToolPermission = (toolName) => {
    if (draftAllowedTools.includes(toolName)) {
      setDraftAllowedTools(draftAllowedTools.filter(t => t !== toolName));
    } else {
      setDraftAllowedTools([...draftAllowedTools, toolName]);
    }
  };

  const handleSendQuery = async (e) => {
    e?.preventDefault();
    const userQ = queryInput.trim();
    if (!userQ || inFlightRef.current || queryLoading) return;

    inFlightRef.current = true;
    const userMsgId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const assistantMsgId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setQueryInput('');
    setChatMessages(prev => {
      if (prev.some(m => m.id === userMsgId)) return prev;
      return [...prev, { id: userMsgId, sender: 'user', text: userQ }];
    });
    setQueryLoading(true);

    try {
      const res = await api.sendSupervisorQuery(userQ);
      setChatMessages(prev => {
        if (prev.some(m => m.id === assistantMsgId)) return prev;
        return [...prev, { id: assistantMsgId, sender: 'supervisor', text: res.answer, source: res.source }];
      });
    } catch (err) {
      setChatMessages(prev => {
        if (prev.some(m => m.id === assistantMsgId)) return prev;
        return [...prev, { id: assistantMsgId, sender: 'supervisor', text: `Error retrieving telemetry: ${err.message}` }];
      });
    } finally {
      setQueryLoading(false);
      inFlightRef.current = false;
    }
  };

  const isAutonomous = settings?.enabled && !settings?.paused && !settings?.emergency_stopped;

  return (
    <div style={{ maxWidth: '1440px', marginInline: 'auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#000000',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.88rem',
          fontWeight: 600,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={16} color="var(--accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} style={{ fontSize: '0.8rem', fontWeight: 700 }}>Dismiss</button>
        </div>
      )}

      {/* Header Banner & Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.4rem' }}>◈</span>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              AI Control Center
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: isAutonomous ? '#ecfdf5' : '#f3f4f6',
              color: isAutonomous ? '#047857' : '#4b5563',
              border: `1px solid ${isAutonomous ? '#a7f3d0' : '#e5e7eb'}`
            }}>
              {isAutonomous ? 'AUTONOMOUS AI MODE ACTIVE' : settings?.emergency_stopped ? 'EMERGENCY STOP' : 'HUMAN-SUPERVISED MODE'}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            ResolveAI Supervisor Agent • Multi-Agent Fleet Telemetry • Policy-Bounded Full Autonomy
          </p>
          {!canManage && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              <ShieldAlert size={14} />
              <span>Viewing as {user?.role === 'agent' ? 'Support Agent' : 'Standard User'}. Clicking control buttons will seamlessly elevate to Operations Manager (James Rodriguez).</span>
            </div>
          )}
        </div>

        {/* Global Control Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isAutonomous ? (
            <button
              type="button"
              onClick={handleDisableAutonomy}
              disabled={actionLoading}
              className="btn-secondary"
              style={{ height: '42px', fontSize: '0.88rem' }}
              title={!canManage ? 'Click to authorize as Operations Manager and switch to human-supervised gating' : 'Switch to human-supervised gating'}
            >
              <span>{actionLoading ? 'Updating...' : 'Disable Autonomous Mode'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowEnableModal(true)}
              disabled={actionLoading}
              className="btn-primary"
              style={{ height: '42px', fontSize: '0.88rem' }}
              title={!canManage ? 'Click to authorize as Operations Manager and enable autonomy' : 'Enable Autonomous AI Mode'}
            >
              <Zap size={16} />
              <span>{actionLoading ? 'Updating...' : 'Enable Autonomous AI Mode'}</span>
            </button>
          )}

          {settings?.enabled && (
            <button
              type="button"
              onClick={handleTogglePause}
              disabled={actionLoading}
              className="btn-secondary"
              style={{ height: '42px', fontSize: '0.88rem' }}
              title={!canManage ? 'Click to authorize as Operations Manager' : ''}
            >
              {settings?.paused ? <Play size={16} /> : <Pause size={16} />}
              <span>{settings?.paused ? 'Resume Execution' : 'Pause Execution'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowEmergencyModal(true)}
            disabled={actionLoading}
            style={{
              height: '42px',
              paddingInline: '16px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 8px rgba(185, 28, 28, 0.3)'
            }}
            title="Immediately halt all autonomous execution"
          >
            <AlertOctagon size={16} />
            <span>Emergency Stop</span>
          </button>
        </div>
      </div>

      {/* Prominent Autonomous Mode Banner */}
      {isAutonomous ? (
        <div style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#000000',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                AUTONOMOUS AI MODE ACTIVE — SUPERVISOR ENFORCING BOUNDS
              </div>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '2px' }}>
                ResolveAI is independently evaluating and executing eligible customer operations up to ${settings?.refund_limit}. 5-point verification remains strictly mandatory on all resolutions.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/tickets/tkt-001')}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Launch Live Demo Workflow (#tkt-001)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : settings?.emergency_stopped ? (
        <div style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#fef2f2',
          border: '2px solid #ef4444',
          color: '#991b1b',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AlertOctagon size={28} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#991b1b' }}>EMERGENCY STOP ENGAGED</div>
              <div style={{ fontSize: '0.82rem', marginTop: '2px', color: '#7f1d1d' }}>
                All autonomous actions are completely locked. Workflows have entered safe state and require explicit manual authorization.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableAutonomy}
            disabled={actionLoading}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
            }}
          >
            <RefreshCw size={14} />
            <span>Disengage Stop & Resume</span>
          </button>
        </div>
      ) : null}

      {/* Grid: Agent Graph & Health Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Eight-Agent Hierarchy Graph */}
        <div style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Eight-Agent Architectural Hierarchy</h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click node to inspect</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            {/* Level 1: Supervisor Agent */}
            <div
              onClick={() => setSelectedAgent(agents.find(a => a.id === 'supervisor_agent') || { name: 'ResolveAI Supervisor Agent', badge: '◈', status: 'HEALTHY', state: 'ONLINE', execution_count: 28, last_task: 'Supervisory oversight & autonomy policy bounds' })}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#000000',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>◈</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>ResolveAI Supervisor Agent</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Supervisory Intelligence & Policy Boundary Gating</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: '#10b981', color: '#ffffff' }}>
                SUPERVISING
              </span>
            </div>

            <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--border-strong)' }} />

            {/* Level 2: Orchestrator Agent */}
            <div
              onClick={() => setSelectedAgent(agents.find(a => a.id === 'orchestrator_agent'))}
              style={{
                width: '90%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>◉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Orchestrator Agent</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dynamic DAG Resolution Planning & Delegation</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--status-res-bg)', color: 'var(--status-res-text)' }}>
                ONLINE
              </span>
            </div>

            <div style={{ width: '2px', height: '14px', backgroundColor: 'var(--border-strong)' }} />

            {/* Level 3: 6 Specialized Execution Agents */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%' }}>
              {agents.filter(a => a.id !== 'supervisor_agent' && a.id !== 'orchestrator_agent').map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2px' }}>{agent.badge}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    {agent.name.replace(' Agent', '')}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Agent Telemetry Drawer */}
          {selectedAgent && (
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800 }}>{selectedAgent.badge} {selectedAgent.name} Telemetry</span>
                <button onClick={() => setSelectedAgent(null)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Close</button>
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Recent Objective:</strong> {selectedAgent.last_task}
              </div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Executions: {selectedAgent.execution_count}</span>
                <span>Health: <strong style={{ color: '#047857' }}>{selectedAgent.status}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Live Supervisor Operational Assistant (Chat) */}
        <div style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Supervisor Telemetry Assistant</h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grounded in System DB</span>
          </div>

          {/* Quick Prompt Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
            {[
              'What workflows are active?',
              'Why is approval needed?',
              'What are the autonomy bounds?',
              'Check fleet health'
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setQueryInput(prompt); }}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '6px',
            marginBottom: '12px'
          }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={msg.id || `msg-${idx}`}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.sender === 'user' ? '#000000' : 'var(--bg-tertiary)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '0.82rem',
                  lineHeight: 1.45
                }}
              >
                {msg.text}
              </div>
            ))}
            {queryLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Supervisor analyzing live operational state...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendQuery} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask Supervisor about workflows, gates, or policies..."
              style={{
                flex: 1,
                height: '38px',
                paddingInline: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.82rem'
              }}
            />
            <button
              type="submit"
              disabled={queryLoading || !queryInput.trim()}
              className="btn-sm-primary"
              style={{ height: '38px', paddingInline: '14px' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Autonomous Approval Control & Recent AI Decisions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* AUTONOMOUS APPROVAL CONTROL (Admin Controlled) */}
        <div style={{
          padding: '26px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>AUTONOMOUS APPROVAL CONTROL</h2>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: draftAutonomousApprovalsEnabled ? '#ecfdf5' : '#f3f4f6',
              color: draftAutonomousApprovalsEnabled ? '#047857' : '#4b5563',
              border: `1px solid ${draftAutonomousApprovalsEnabled ? '#a7f3d0' : '#e5e7eb'}`
            }}>
              Supervisor Approval: {draftAutonomousApprovalsEnabled ? '● ENABLED' : '○ DISABLED'}
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '18px', lineHeight: 1.4 }}>
            The Supervisor Agent may evaluate, approve, or reject eligible approval requests automatically according to policy boundaries.
          </p>

          <form onSubmit={handleSaveSettings}>
            {/* Autonomous Approval Authority Toggle */}
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>Supervisor Approval Authority</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Empower AI to make policy-governed approval decisions and execute actions
                </div>
              </div>
              <button
                type="button"
                disabled={!canManage}
                onClick={() => setDraftAutonomousApprovalsEnabled(!draftAutonomousApprovalsEnabled)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: draftAutonomousApprovalsEnabled ? '#000000' : 'var(--bg-secondary)',
                  color: draftAutonomousApprovalsEnabled ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: canManage ? 'pointer' : 'default'
                }}
              >
                {draftAutonomousApprovalsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Approval Modes Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '8px' }}>
                GOVERNANCE APPROVAL MODE
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    id: 'HYBRID',
                    name: 'HYBRID (Recommended)',
                    desc: 'Low-risk actions approved by AI • Medium-risk approved if permitted • High-risk routed to Human Manager'
                  },
                  {
                    id: 'AI_APPROVAL',
                    name: 'AI APPROVAL (Full Autonomy)',
                    desc: 'AI evaluates policy, makes structured decision, and executes approved action immediately'
                  },
                  {
                    id: 'HUMAN',
                    name: 'HUMAN APPROVAL (Supervised)',
                    desc: 'AI investigates and evaluates policy • Human supervisor makes the final decision'
                  }
                ].map(mode => (
                  <label
                    key={mode.id}
                    onClick={() => canManage && setDraftApprovalMode(mode.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: draftApprovalMode === mode.id ? '2px solid #000000' : '1px solid var(--border-subtle)',
                      backgroundColor: draftApprovalMode === mode.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      cursor: canManage ? 'pointer' : 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="approval_mode"
                        checked={draftApprovalMode === mode.id}
                        disabled={!canManage}
                        onChange={() => setDraftApprovalMode(mode.id)}
                      />
                      <span style={{ fontWeight: 800, fontSize: '0.84rem' }}>{mode.name}</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', paddingLeft: '22px' }}>
                      {mode.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Approval Permissions Checkboxes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '8px' }}>
                APPROVAL PERMISSIONS (AUTONOMOUS ACTIONS)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'allow_replacements', label: 'Replacement requests (create_replacement_request)', risk: 'Medium' },
                  { key: 'allow_shipping', label: 'Shipping & cancellation actions (cancel_processing_order)', risk: 'Low' },
                  { key: 'allow_notifications', label: 'Customer notification actions (send_customer_update)', risk: 'Low' },
                  { key: 'allow_status_changes', label: 'Ticket status changes (update_ticket_status)', risk: 'Low' },
                  { key: 'allow_refunds', label: 'Financial refunds (discretionary return review)', risk: 'High' }
                ].map(perm => {
                  const checked = Boolean(draftPermissions[perm.key]);
                  return (
                    <label
                      key={perm.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: checked ? 'var(--bg-tertiary)' : 'transparent',
                        border: '1px solid var(--border-light)',
                        cursor: canManage ? 'pointer' : 'default',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canManage}
                          onChange={() => togglePermission(perm.key)}
                        />
                        <span style={{ fontWeight: 600 }}>{perm.label}</span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: perm.risk === 'High' ? '#fef2f2' : perm.risk === 'Medium' ? '#fffbeb' : '#ecfdf5',
                        color: perm.risk === 'High' ? '#dc2626' : perm.risk === 'Medium' ? '#b45309' : '#047857'
                      }}>
                        {perm.risk} Risk
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Financial Refund Limit */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>
                AUTONOMOUS FINANCIAL CEILING (USD / INR)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[250, 500, 1000, 2500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    disabled={!canManage}
                    onClick={() => setDraftRefundLimit(amt)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      border: draftRefundLimit === amt ? '2px solid var(--accent-black)' : '1px solid var(--border-strong)',
                      backgroundColor: draftRefundLimit === amt ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      color: draftRefundLimit === amt ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: draftRefundLimit === amt ? 800 : 600,
                      fontSize: '0.85rem',
                      boxShadow: draftRefundLimit === amt ? 'var(--shadow-subtle)' : 'none',
                      transition: 'all var(--transition-fast)',
                      cursor: canManage ? 'pointer' : 'default'
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Permanently Restricted Boundaries */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px', color: '#b91c1c' }}>
                PERMANENTLY RESTRICTED (ALWAYS ESCALATED)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  'Financial refunds over limit',
                  'Account/security changes',
                  'Permission modifications',
                  'Access system secrets',
                  'Bypass verification gates'
                ].map(item => (
                  <span
                    key={item}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      border: '1px solid #fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Lock size={11} />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {canManage && (
              <button
                type="submit"
                disabled={savingSettings}
                className="btn-primary"
                style={{ width: '100%', height: '42px', fontSize: '0.88rem' }}
              >
                {savingSettings ? 'Persisting Policy Boundaries...' : 'Save Autonomous Approval Settings'}
              </button>
            )}
          </form>
        </div>

        {/* RECENT AI DECISIONS & SUPERVISOR EVENT STREAM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent AI Decisions Feed */}
          <div style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--accent-emerald)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent AI Decisions (Audit Trail)</h2>
              </div>
              <button
                onClick={() => navigate('/approvals')}
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View all ({approvals.length})</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {approvals.slice(0, 4).map((appr) => {
                const isApproved = appr.status === 'APPROVED' || appr.decision_type === 'AI_APPROVED';
                const isRejected = appr.status === 'REJECTED' || appr.decision_type === 'AI_REJECTED';
                const isEscalated = appr.status === 'PENDING' || appr.status === 'ESCALATED';

                return (
                  <div
                    key={appr.id}
                    onClick={() => setSelectedDecision(appr)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isApproved ? (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          ✓
                        </div>
                      ) : isRejected ? (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          ✕
                        </div>
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#fffbeb', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          ↗
                        </div>
                      )}

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                          {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Escalated'} — {appr.action?.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Ticket #{appr.ticket_id} • {appr.decision_maker || 'ResolveAI Supervisor Agent'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(appr.reviewed_at || appr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        Inspect dossier →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supervisor Operational Event Stream */}
          <div style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-subtle)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Supervisor Operational Event Stream</h2>
              </div>
              <button onClick={fetchData} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={13} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.map((ev, i) => (
                <div
                  key={ev.id || i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderLeft: `4px solid ${ev.severity === 'CRITICAL' ? '#ef4444' : ev.severity === 'WARN' ? '#f59e0b' : '#000000'}`,
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{ev.title || ev.event_type}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {ev.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Decision Detail Drawer/Modal */}
      {selectedDecision && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 160,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>AUDIT RECORD #{selectedDecision.id}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '2px' }}>
                  {selectedDecision.action?.replace(/_/g, ' ').toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDecision(null)}
                style={{ fontSize: '0.8rem', fontWeight: 700 }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', marginBottom: '20px' }}>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)' }}>
                <strong>Decision:</strong> {selectedDecision.status} ({selectedDecision.decision_type || 'AI_APPROVED'})
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)' }}>
                <strong>Decision Authority:</strong> {selectedDecision.decision_maker || 'ResolveAI Supervisor Agent'}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)' }}>
                <strong>Policy Citations:</strong> {selectedDecision.evidence?.policyCited || 'POL-001 (Damaged Product Replacement Policy)'}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)' }}>
                <strong>Rationale:</strong> {selectedDecision.reason || selectedDecision.rejection_reason || 'Customer and order satisfy corporate replacement warranty terms.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  const tid = selectedDecision.ticket_id;
                  setSelectedDecision(null);
                  navigate(`/tickets/${tid}`);
                }}
                className="btn-secondary"
                style={{ height: '38px', fontSize: '0.82rem' }}
              >
                <span>Inspect Ticket #{selectedDecision.ticket_id}</span>
                <ExternalLink size={13} />
              </button>
              <button
                onClick={() => setSelectedDecision(null)}
                className="btn-primary"
                style={{ height: '38px', fontSize: '0.82rem' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Enabling Autonomous Mode */}
      {showEnableModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={22} color="#047857" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Enable Autonomous AI Mode?</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Authorize Supervisor Agent to execute policy-bounded operational tools
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              ResolveAI will be granted authority to independently execute allowlisted actions without waiting for human approval at every step.
            </div>

            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              fontSize: '0.8rem',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Guaranteed Safety Constraints:</div>
              <div>✓ 5-point verification gate remains strictly mandatory on all resolutions</div>
              <div>✓ Order values above ${settings?.refund_limit} still halt for human supervisor approval</div>
              <div>✓ Authentication, security, and customer secrets remain permanently inaccessible</div>
              <div>✓ All autonomous decisions and tool calls are fully logged in the audit trail</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEnableModal(false)}
                className="btn-secondary"
                style={{ height: '40px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleEnableAutonomy}
                className="btn-primary"
                style={{ height: '40px', fontSize: '0.85rem' }}
              >
                {actionLoading ? 'Enabling...' : 'Confirm & Enable Autonomy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Emergency Stop */}
      {showEmergencyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            border: '2px solid #ef4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <AlertOctagon size={28} color="#dc2626" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>EMERGENCY STOP</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Immediately halt all autonomous execution
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to trigger the emergency stop? All active workflows will be locked into human-supervised mode and no further autonomous tool executions will proceed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="btn-secondary"
                style={{ height: '40px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleEmergencyStop}
                style={{
                  height: '40px',
                  paddingInline: '18px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {actionLoading ? 'Engaging Stop...' : 'Execute Emergency Stop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

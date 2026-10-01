import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiquidMetalHeroCanvas from '../components/LiquidMetalHeroCanvas';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loginWithDemo } = useAuth();
  const [activeAgentTab, setActiveAgentTab] = useState(0);

  // Activate scroll-driven reveal animations
  useScrollReveal();

  const handleLaunchApp = async () => {
    if (!user) {
      await loginWithDemo('agent');
    }
    navigate('/tickets/tkt-001');
  };

  const agentFleet = [
    {
      badge: '◉',
      name: 'Orchestrator Agent',
      role: 'Master Planner & Coordinator',
      desc: 'Interprets incoming customer tickets, formulates dynamic multi-step resolution plans, assigns dependencies, and enforces verified completion gates.',
      tool: 'Dynamic DAG Planner & State Machine',
      confidence: '99.4%'
    },
    {
      badge: '△',
      name: 'Triage Agent',
      role: 'Instant Intent & Category Classifier',
      desc: 'Classifies issue category (damaged product, wrong item, cancellation, refund), detects customer urgency, and extracts key entities with zero latency.',
      tool: 'Entity Extractor & Semantic Classifier',
      confidence: '96.8%'
    },
    {
      badge: '⌕',
      name: 'Investigation Agent',
      role: 'Autonomous Systems Investigator',
      desc: 'Queries customer records, cross-references transaction databases, checks order delivery timestamps, and calculates exact warranty eligibility windows.',
      tool: 'getCustomer(), getOrder(), getTicketHistory()',
      confidence: '98.9%'
    },
    {
      badge: '▣',
      name: 'Policy Agent',
      role: 'Business Rule & Regulatory Reasoner',
      desc: 'Evaluates active warranty and return policies against real case evidence. Recommends safe actions and determines if human supervisor approval is required.',
      tool: 'searchPolicies(), evaluateCompliance()',
      confidence: '97.5%'
    },
    {
      badge: '⚡',
      name: 'Action Agent',
      role: 'Gated Tool Execution Engine',
      desc: 'Executes verified internal tools—such as provisioning warehouse replacement shipments or updating ticket states—strictly pausing for human review on sensitive actions.',
      tool: 'createReplacementRequest(), updateStatus()',
      confidence: '99.1%'
    },
    {
      badge: '✦',
      name: 'Communication Agent',
      role: 'Customer & Internal Briefing Writer',
      desc: 'Drafts empathetic, highly factual customer notifications and internal leadership briefings based purely on verified evidence without hallucinations.',
      tool: 'Contextual Tone & Dispatch Formatter',
      confidence: '98.2%'
    },
    {
      badge: '✓',
      name: 'Verification Agent',
      role: 'Comprehensive Resolution Auditor',
      desc: 'Runs a rigorous 5-point verification audit before any case can be closed: checks evidence completeness, policy compliance, and supervisor approval logs.',
      tool: 'Deterministic Audit Validator',
      confidence: '100%'
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* 1. Header Navigation */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 'clamp(20px, 5vw, 80px)',
          backgroundColor: 'var(--bg-overlay)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
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
          <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.04em' }}>RESOLVE.AI</span>
        </div>

        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          <a href="#problem" style={{ transition: 'color var(--transition-fast)' }}>Problem</a>
          <a href="#agents" style={{ transition: 'color var(--transition-fast)' }}>Agent Team</a>
          <a href="#workflow" style={{ transition: 'color var(--transition-fast)' }}>Workflow</a>
          <a href="#governance" style={{ transition: 'color var(--transition-fast)' }}>Governance</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme Toggle Button */}
          <ThemeToggle />

          <button
            onClick={() => navigate('/login')}
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              transition: 'color var(--transition-fast)'
            }}
          >
            Sign In
          </button>

          <button
            onClick={handleLaunchApp}
            className="btn-sm-primary"
            style={{ height: '42px', paddingInline: '22px' }}
          >
            <span>Launch App</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section (Production-Grade Liquid Metal Hero) */}
      <main>
        <section
          aria-labelledby="hero-title"
          style={{
            position: 'relative',
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '90px',
            paddingBottom: '40px',
            overflow: 'hidden'
          }}
        >
          {/* Liquid-Metal 3D Chrome Canvas */}
          <LiquidMetalHeroCanvas />

          {/* Hero Content Container */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              maxWidth: '1280px',
              marginInline: 'auto',
              paddingInline: 'clamp(20px, 4vw, 40px)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Eyebrow Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '40px',
                paddingInline: '20px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'var(--text-primary)',
                marginBottom: '28px',
                boxShadow: 'var(--shadow-subtle)',
                backdropFilter: 'blur(10px)',
                animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both'
              }}
            >
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }}></span>
              <span>AUTONOMOUS CUSTOMER OPERATIONS</span>
            </div>

            {/* Oversized Neo-Grotesk Headline */}
            <h1
              id="hero-title"
              style={{
                fontWeight: 900,
                letterSpacing: '-0.065em',
                lineHeight: 0.92,
                fontSize: 'clamp(3.8rem, 8.5vw, 8.8rem)',
                color: 'var(--text-primary)',
                maxWidth: '1180px',
                marginInline: 'auto',
                marginBottom: '32px',
                textTransform: 'uppercase',
                animation: 'fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both'
              }}
            >
              FROM ISSUE TO RESOLUTION.<br />
              AUTONOMOUSLY.
            </h1>

            {/* Supporting Description */}
            <p
              style={{
                maxWidth: '680px',
                fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginInline: 'auto',
                marginBottom: '40px',
                fontWeight: 400,
                animation: 'fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both'
              }}
            >
              ResolveAI deploys an autonomous team of specialized AI agents that investigate customer records, reason against business policies, execute approved tools, and verify resolution with complete human oversight.
            </p>

            {/* CTA System */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                animation: 'fadeUp 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both'
              }}
            >
              <button
                onClick={handleLaunchApp}
                className="btn-primary"
                id="hero-primary-cta"
              >
                <span>Launch ResolveAI Demo</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="#workflow"
                className="btn-secondary"
                id="hero-secondary-cta"
              >
                <span>Explore Architecture</span>
              </a>
            </div>

            {/* Live Hero KPI Ticker */}
            <div
              style={{
                marginTop: '64px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '24px',
                width: '100%',
                maxWidth: '920px',
                padding: '20px 28px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-card)',
                animation: 'fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both'
              }}
            >
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.04em' }}>94.2%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Autonomous Resolution Rate
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.04em' }}>42s</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Avg. Investigation Time
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.04em' }}>100%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Audited Traceability
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.04em' }}>0 Gates</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Bypassed Without Review
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Problem Section (With Scroll Animation) */}
        <section
          id="problem"
          style={{
            paddingBlock: '120px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(20px, 4vw, 40px)' }}>
            <div className="reveal-on-scroll" style={{ maxWidth: '680px', marginBottom: '64px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                The Operational Bottleneck
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                Support is broken by manual context-switching.
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              <div
                className="reveal-on-scroll delay-100"
                style={{
                  padding: '36px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <Layers size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  Fragmented Business Systems
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Support reps constantly toggle between ticket queues, CRM customer records, warehouse shipping portals, and static PDF policies—wasting up to 70% of case time just hunting for facts.
                </p>
              </div>

              <div
                className="reveal-on-scroll delay-200"
                style={{
                  padding: '36px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <Cpu size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  Repetitive Decision Fatigue
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Checking whether a damaged item is within a 14-day warranty or whether an order can be cancelled before carrier dispatch is formulaic work that humans repeatedly redo with high inconsistency.
                </p>
              </div>

              <div
                className="reveal-on-scroll delay-300"
                style={{
                  padding: '36px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <Shield size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  The "Black-Box" AI Dilemma
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Conventional chatbots either hallucinate false promises or execute irreversible database actions without authorization. ResolveAI enforces strict Human-in-the-Loop gating on high-risk actions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Specialized Agent Fleet Showcase (With Scroll Animation) */}
        <section id="agents" style={{ paddingBlock: '120px', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(20px, 4vw, 40px)' }}>
            <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '64px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Collaborative Architecture
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                Meet the Autonomous Resolution Fleet
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '1.1rem' }}>
                Not a monolithic prompt. ResolveAI deploys 7 specialized agents, each with dedicated domain knowledge and strict tool allowlists.
              </p>
            </div>

            {/* Agent Selector Tabs */}
            <div className="reveal-on-scroll delay-100" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '40px' }}>
              {agentFleet.map((agent, idx) => (
                <button
                  key={agent.name}
                  onClick={() => setActiveAgentTab(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: activeAgentTab === idx ? 'var(--btn-primary-bg)' : 'var(--border-subtle)',
                    backgroundColor: activeAgentTab === idx ? 'var(--btn-primary-bg)' : 'var(--bg-tertiary)',
                    color: activeAgentTab === idx ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{agent.badge}</span>
                  <span>{agent.name}</span>
                </button>
              ))}
            </div>

            {/* Active Agent Spotlight Card */}
            <div
              className="reveal-on-scroll delay-200"
              style={{
                maxWidth: '920px',
                marginInline: 'auto',
                padding: '48px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-card)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '36px',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800
                    }}
                  >
                    {agentFleet[activeAgentTab].badge}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                      {agentFleet[activeAgentTab].name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {agentFleet[activeAgentTab].role}
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.02rem', marginBottom: '24px' }}>
                  {agentFleet[activeAgentTab].desc}
                </p>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Allowlisted Tooling
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {agentFleet[activeAgentTab].tool}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Validation Confidence
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                      {agentFleet[activeAgentTab].confidence}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Agent Inspector Visual */}
              <div
                style={{
                  backgroundColor: '#050507',
                  color: '#e4e4e7',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-chrome)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  </div>
                  <span style={{ color: '#71717a', fontSize: '0.7rem' }}>AGENT_RUNTIME.LOG</span>
                </div>
                <div style={{ color: '#38bdf8' }}>// Active Agent Contract Schema</div>
                <div style={{ color: '#a1a1aa' }}>{"{"}</div>
                <div style={{ paddingLeft: '16px' }}>
                  <span style={{ color: '#e4e4e7' }}>"agent"</span>: <span style={{ color: '#34d399' }}>"{agentFleet[activeAgentTab].name}"</span>,<br />
                  <span style={{ color: '#e4e4e7' }}>"model"</span>: <span style={{ color: '#34d399' }}>"gemini-flash-latest"</span>,<br />
                  <span style={{ color: '#e4e4e7' }}>"zod_validated"</span>: <span style={{ color: '#f472b6' }}>true</span>,<br />
                  <span style={{ color: '#e4e4e7' }}>"requires_approval"</span>: <span style={{ color: '#f472b6' }}>{activeAgentTab === 4 ? 'true' : 'false'}</span>
                </div>
                <div style={{ color: '#a1a1aa' }}>{"}"}</div>
                <div style={{ marginTop: '12px', color: '#4ade80' }}>✓ Schema validated & sandbox verified</div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Interactive End-to-End Workflow Section (With Scroll Animation) */}
        <section id="workflow" style={{ paddingBlock: '120px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(20px, 4vw, 40px)' }}>
            <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '64px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                End-to-End Autonomous Lifecycle
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                How a Ticket Resolves in 42 Seconds
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[
                { step: '01', title: 'Triage & Intent', agent: '△ Triage', desc: 'Customer reports crushed delivery. Classified as damaged_product with high priority.' },
                { step: '02', title: 'Evidence Retrieval', agent: '⌕ Investigation', desc: 'Order #ORD-4821 retrieved. Verified delivery 3 days ago for Astra SoundPro.' },
                { step: '03', title: 'Policy Reasoning', agent: '▣ Policy Agent', desc: 'Checks POL-001. Confirms within 14-day warranty. Flags replacement as medium risk.' },
                { step: '04', title: 'Human Approval', agent: '⚡ Action Gating', desc: 'Workflow pauses. Supervisor reviews replacement order with 1 click. Resumes immediately.' },
                { step: '05', title: 'Response & Audit', agent: '✦ Communication', desc: 'Personalized email drafted citing Replacement #REP-XXXX. Verification agent verifies 5/5.' }
              ].map((item, idx) => (
                <div
                  key={item.step}
                  className={`reveal-on-scroll delay-${(idx + 1) * 100}`}
                  style={{
                    padding: '28px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{item.step}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{item.agent}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>Autonomous Gate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Human-in-the-Loop Governance & Security (With Scroll Animation) */}
        <section id="governance" style={{ paddingBlock: '120px', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(20px, 4vw, 40px)' }}>
            <div
              className="reveal-on-scroll"
              style={{
                padding: '60px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '48px',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                  <Lock size={14} />
                  <span>Enterprise Security & Alignment</span>
                </div>
                <h2 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px' }}>
                  Supervised Agency. Zero Runaway Risk.
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '32px' }}>
                  ResolveAI never grants autonomous models direct database or banking access. All interactions occur through strictly typed, allowlisted tools with automated state recovery and immutable audit logs.
                </p>
                <button
                  onClick={handleLaunchApp}
                  className="btn-primary"
                >
                  <span>Experience Interactive Demo</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    1. Prompt Injection Hardening
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Customer ticket inputs are treated as untrusted data strings. System instructions enforce that policies cannot be overridden by user messages.
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    2. Three-Tier Risk Classification
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Low risk (triage, policy lookup) runs autonomously. Medium/High risk (dispatching physical replacements, refunds) pauses for human manager authorization.
                  </div>
                </div>

                <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    3. Verification Agent Barrier
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    No case status can transition to RESOLVED without a formal 5-point audit certificate verified by the independent Verification Agent.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Final Call to Action */}
        <section style={{ paddingBlock: '100px', backgroundColor: 'var(--bg-secondary)', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="reveal-on-scroll" style={{ maxWidth: '800px', marginInline: 'auto', paddingInline: '20px' }}>
            <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
              Transform Support into an Autonomous Machine.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '36px' }}>
              Eliminate repetitive coordination and deliver instant, policy-verified resolutions to your customers.
            </p>
            <button
              onClick={handleLaunchApp}
              className="btn-primary"
              style={{ height: '60px', paddingInline: '42px', fontSize: '1.1rem' }}
            >
              <span>Launch Live Hackathon Workspace</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingBlock: '40px',
          paddingInline: 'clamp(20px, 5vw, 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>
          © 2026 ResolveAI. Agentic AI & Intelligent Systems Hackathon Submission.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="/login" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Support Login</a>
          <a href="/api/health" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>API Health</a>
          <span>Powered by Gemini & Supabase</span>
        </div>
      </footer>

      {/* Global CSS Keyframes */}
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translate3d(0, 24px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

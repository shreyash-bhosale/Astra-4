import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CinematicAIGlobe from '../components/CinematicAIGlobe';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  CheckCircle2,
  Lock,
  Search,
  MessageSquare,
  FileCheck,
  Check,
  Activity,
  BellRing
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeAgentTab, setActiveAgentTab] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const progressAnimationRef = useRef(null);

  // Activate scroll-driven reveal animations
  useScrollReveal();

  // Handle device width check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Continuous passive scroll calculation
  useEffect(() => {
    const handleScroll = () => {
      if (progressAnimationRef.current) return;

      progressAnimationRef.current = requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY;
        const progress = totalHeight > 0 ? Math.min(1, Math.max(0, currentScroll / totalHeight)) : 0;
        setScrollProgress(progress);

        // Calculate active section index for side navigation
        // Sections: 0=Hero, 1=Understand, 2=Orchestrate, 3=Reason, 4=Approval, 5=Execute, 6=Communicate, 7=Verify
        const sectionBreaks = [0.08, 0.22, 0.36, 0.50, 0.62, 0.74, 0.86];
        let currentIdx = 0;
        for (let i = 0; i < sectionBreaks.length; i++) {
          if (progress >= sectionBreaks[i]) {
            currentIdx = i + 1;
          }
        }
        setActiveSection(currentIdx);

        progressAnimationRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
    };
  }, []);

  const handleLaunchApp = async () => {
    if (user) {
      if (user.role === 'customer') {
        navigate('/customer');
      } else {
        navigate('/tickets/tkt-001');
      }
    } else {
      navigate('/login');
    }
  };

  const scrollToAnchor = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navSections = [
    { id: 'hero', label: 'HERO' },
    { id: 'understand', label: '01 UNDERSTAND' },
    { id: 'orchestrate', label: '02 ORCHESTRATE' },
    { id: 'reason', label: '03 REASON' },
    { id: 'approval', label: '04 APPROVAL' },
    { id: 'execute', label: '05 EXECUTE' },
    { id: 'communicate', label: '06 COMMUNICATE' },
    { id: 'verify', label: '07 VERIFY' }
  ];

  const agentFleet = [
    {
      badge: '◉',
      name: 'Orchestrator Agent',
      role: 'Master Planner & Dynamic DAG Coordinator',
      desc: 'Interprets incoming customer tickets, formulates dynamic multi-step resolution plans, assigns agent dependencies, and enforces verified completion gates.',
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
      desc: 'Drafts empathetic, highly factual customer notifications across email and portal channels based purely on verified evidence without hallucinations.',
      tool: 'Contextual Tone & Multi-Channel Dispatcher',
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
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative' }}>
      {/* 1. TOP SCROLL PROGRESS BAR (Continuous 1-2px Indicator) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '2px',
          width: `${scrollProgress * 100}%`,
          background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #10b981 100%)',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
          zIndex: 100,
          pointerEvents: 'none',
          transition: 'width 0.08s linear'
        }}
      />

      {/* 2. FIXED SIDE NAVIGATION (Desktop Only) */}
      <nav
        aria-label="Section navigation"
        className="landing-side-nav"
        style={{
          position: 'fixed',
          right: '28px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 60,
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'var(--border-subtle)',
            zIndex: 1
          }}
        />

        {navSections.map((sec, idx) => {
          const isActive = activeSection === idx;
          return (
            <button
              key={sec.id}
              onClick={() => scrollToAnchor(sec.id)}
              className="side-nav-dot"
              aria-label={`Scroll to ${sec.label}`}
              style={{
                position: 'relative',
                zIndex: 2,
                width: isActive ? '12px' : '8px',
                height: isActive ? '12px' : '8px',
                borderRadius: '50%',
                backgroundColor: isActive ? 'var(--accent-blue)' : 'var(--border-strong)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 10px rgba(56, 189, 248, 0.8)' : 'none',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Tooltip on hover */}
              <span className="side-nav-tooltip">{sec.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. 3D CINEMATIC AI GLOBE CANVAS (Continuous Scroll-Driven Three.js Core) */}
      <CinematicAIGlobe scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* 4. MAIN HEADER NAVIGATION */}
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
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          onClick={() => scrollToAnchor('hero')}
        >
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

        <nav
          className="desktop-nav"
          style={{
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            gap: '28px',
            fontSize: '0.88rem',
            fontWeight: 500,
            color: 'var(--text-secondary)'
          }}
        >
          <button onClick={() => scrollToAnchor('understand')} className="nav-link-btn">Understand</button>
          <button onClick={() => scrollToAnchor('orchestrate')} className="nav-link-btn">7-Agent Fleet</button>
          <button onClick={() => scrollToAnchor('reason')} className="nav-link-btn">Reasoning</button>
          <button onClick={() => scrollToAnchor('approval')} className="nav-link-btn">Human Approval</button>
          <button onClick={() => scrollToAnchor('pipeline')} className="nav-link-btn">Pipeline</button>
          <button onClick={() => scrollToAnchor('capabilities')} className="nav-link-btn">Capabilities</button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />

          {user ? (
            <button
              onClick={() => navigate(user.role === 'customer' ? '/customer' : '/tickets/tkt-001')}
              className="btn-sm-secondary"
            >
              <span>{user.name.split(' ')[0]} ({user.role})</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                fontWeight: 600,
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                transition: 'color var(--transition-fast)'
              }}
            >
              Sign In
            </button>
          )}

          <button
            onClick={handleLaunchApp}
            className="btn-sm-primary"
            style={{ height: '40px', paddingInline: '20px' }}
          >
            <span>{user ? 'Open Portal' : 'Get Started'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 5. MAIN CONTENT WRAPPER (Z-Index above 3D Canvas) */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {/* ====================================================================
            SECTION 0: HERO — FROM ISSUE TO RESOLUTION
            ==================================================================== */}
        <section
          id="hero"
          style={{
            position: 'relative',
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '100px',
            paddingBottom: '60px',
            paddingInline: 'clamp(20px, 6vw, 100px)'
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            {/* Status Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '38px',
                paddingInline: '18px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: '28px',
                boxShadow: 'var(--shadow-subtle)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', boxShadow: '0 0 8px #10b981' }}></span>
              <span>RESOLVEAI · AI OPERATIONS CORE ONLINE</span>
            </div>

            {/* Cinematic Neo-Grotesk Headline */}
            <h1
              style={{
                fontWeight: 900,
                letterSpacing: '-0.06em',
                lineHeight: 0.94,
                fontSize: 'clamp(3.4rem, 7vw, 6.2rem)',
                color: 'var(--text-primary)',
                marginBottom: '28px',
                textTransform: 'uppercase'
              }}
            >
              From Issue to Resolution.<br />
              <span style={{ color: 'var(--accent-blue)' }}>Autonomously.</span>
            </h1>

            {/* Supporting Copy */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: '36px',
                maxWidth: '620px'
              }}
            >
              ResolveAI understands customer issues, investigates context, evaluates policy, coordinates actions, communicates updates, and verifies the final outcome — with human approval when required.
            </p>

            {/* Action CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '44px' }}>
              <button
                onClick={handleLaunchApp}
                className="btn-primary"
                id="hero-primary-cta"
                style={{ height: '54px', paddingInline: '32px', fontSize: '1rem', fontWeight: 700 }}
              >
                <span>Get Started</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => scrollToAnchor('understand')}
                className="btn-secondary"
                id="hero-secondary-cta"
                style={{ height: '54px', paddingInline: '28px', fontSize: '1rem', fontWeight: 600 }}
              >
                <span>Explore ResolveAI</span>
              </button>
            </div>

            {/* Small Trust/Status Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)'
              }}
            >
              <span>7 AI AGENTS</span>
              <span>·</span>
              <span>HUMAN-IN-THE-LOOP</span>
              <span>·</span>
              <span>VERIFIED RESOLUTION</span>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 1: CUSTOMER ISSUE (01 · UNDERSTAND)
            ==================================================================== */}
        <section
          id="understand"
          style={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '640px', marginLeft: 'auto' }}>
            <div className="reveal-on-scroll">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: '14px' }}>
                01 · UNDERSTAND
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
                Every Resolution Starts With Understanding.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '32px' }}>
                ResolveAI begins by understanding the customer's issue, context, history, and urgency before deciding what should happen next.
              </p>
            </div>

            {/* Visual Signal Card: CUSTOMER -> ISSUE -> CONTEXT */}
            <div
              className="reveal-on-scroll delay-100"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                backdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-blue)' }}>
                  Ingested Signal Stream
                </span>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                  LIVE_PARSER_ACTIVE
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>Sarah Jenkins (Standard Tier)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Classified Intent:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>Damaged Product Upon Delivery</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Extracted Entities:</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>
                    Order #ORD-4821 · Astra SoundPro
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 2: MULTI-AGENT INTELLIGENCE (02 · ORCHESTRATE)
            ==================================================================== */}
        <section
          id="orchestrate"
          style={{
            minHeight: '100svh',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div style={{ maxWidth: '1200px', marginInline: 'auto' }}>
            <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '48px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: '14px' }}>
                02 · ORCHESTRATE
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '20px' }}>
                Seven Agents. One Resolution Path.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                Not a monolithic prompt. ResolveAI deploys 7 specialized agents, each with dedicated domain knowledge and strict tool allowlists.
              </p>
            </div>

            {/* Agent Selector Tabs */}
            <div className="reveal-on-scroll delay-100" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '36px' }}>
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
                    backgroundColor: activeAgentTab === idx ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
                    color: activeAgentTab === idx ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer'
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
                padding: '44px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-card)',
                backdropFilter: 'blur(16px)',
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
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                      {agentFleet[activeAgentTab].name}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {agentFleet[activeAgentTab].role}
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.98rem', marginBottom: '24px' }}>
                  {agentFleet[activeAgentTab].desc}
                </p>

                <div style={{ display: 'flex', gap: '24px' }}>
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

              {/* Agent Runtime Log Card */}
              <div
                style={{
                  backgroundColor: '#050507',
                  color: '#e4e4e7',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-card)'
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

        {/* ====================================================================
            SECTION 3: INTELLIGENT REASONING (03 · REASON)
            ==================================================================== */}
        <section
          id="reason"
          style={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div className="reveal-on-scroll">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-purple)', marginBottom: '14px' }}>
                03 · REASON
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
                Context Before Action.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '32px' }}>
                ResolveAI evaluates customer context, investigation results, and applicable policies before taking action.
              </p>
            </div>

            {/* Visual Logic Sequence */}
            <div
              className="reveal-on-scroll delay-100"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}
            >
              <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px' }}>
                  STEP 1: INVESTIGATION
                </div>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>Order & Warranty Audit</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Delivered 3 days ago. Customer holds active warranty. Zero past abusive returns.
                </div>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px' }}>
                  STEP 2: POLICY EVALUATION
                </div>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>Policy Rule POL-001</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  "Transit damage reported within 14 days qualifies for warehouse expedited replacement."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 4: HUMAN-IN-THE-LOOP (04 · APPROVAL)
            ==================================================================== */}
        <section
          id="approval"
          style={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div style={{ maxWidth: '640px', marginLeft: 'auto' }}>
            <div className="reveal-on-scroll">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-amber)', marginBottom: '14px' }}>
                04 · APPROVAL
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
                Autonomous When Safe. Human When Necessary.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '32px' }}>
                Sensitive actions can pause for human approval before execution. No autonomous model is permitted to execute high-risk operations blindly.
              </p>
            </div>

            {/* Interactive Approval Gating Visual */}
            <div
              className="reveal-on-scroll delay-100"
              style={{
                padding: '32px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-card)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                  <Lock size={14} />
                  <span>ACTION GATING BARRIER</span>
                </span>
                <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 700 }}>
                  AWAITING REVIEW
                </span>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
                Dispatch Warehouse Replacement (#REP-4821)
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '20px' }}>
                Action Agent formulated shipping order for $249.99 item. Workflow automatically paused at supervisor threshold.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleLaunchApp}
                  className="btn-primary"
                  style={{ height: '42px', paddingInline: '20px', fontSize: '0.85rem' }}
                >
                  <Check size={14} />
                  <span>Review & Authorize in Demo</span>
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Audit ID: #appr-901
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 5: ACTION EXECUTION (05 · EXECUTE)
            ==================================================================== */}
        <section
          id="execute"
          style={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div className="reveal-on-scroll">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-rose)', marginBottom: '14px' }}>
                05 · EXECUTE
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
                From Decision to Action.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '32px' }}>
                Once an action is authorized, ResolveAI coordinates the appropriate operational workflow across enterprise backends.
              </p>
            </div>

            <div
              className="reveal-on-scroll delay-100"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px'
              }}
            >
              <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>Replacement Created</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Provisioned Replacement #REP-9411 in warehouse fulfillment system with priority carrier tracking.
                </div>
              </div>

              <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                  <Activity size={16} />
                  <span>State Synchronized</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  CRM ticket and customer portal order history updated with tracking numbers and ETA timestamps.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 6: COMMUNICATION (06 · COMMUNICATE)
            ==================================================================== */}
        <section
          id="communicate"
          style={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div style={{ maxWidth: '640px', marginLeft: 'auto' }}>
            <div className="reveal-on-scroll">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-emerald)', marginBottom: '14px' }}>
                06 · COMMUNICATE
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
                Keep Customers in the Loop.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '32px' }}>
                ResolveAI keeps customers informed as their issue moves through the resolution workflow across their preferred channels.
              </p>
            </div>

            <div
              className="reveal-on-scroll delay-100"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Customer Portal Live Updates</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Instant milestone tracking and transparent step progress.</div>
                </div>
              </div>

              <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BellRing size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Transactional Email Notifications</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Dispatched automatically via Resend with delivery receipts.</div>
                </div>
              </div>

              <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Verified Carrier Tracking & Outcomes</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Instant carrier tracking numbers and full compliance resolution certificates.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 7: VERIFICATION (07 · VERIFY)
            ==================================================================== */}
        <section
          id="verify"
          style={{
            minHeight: '100svh',
            display: 'flex',
            alignItems: 'center',
            paddingBlock: '100px',
            paddingInline: 'clamp(20px, 6vw, 100px)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div className="reveal-on-scroll">
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-emerald)', marginBottom: '14px' }}>
                07 · VERIFY
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px' }}>
                Resolution Is Not Complete Until It's Verified.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '32px' }}>
                This is the major differentiator. The independent Verification Agent runs a deterministic 5-point audit before any case can be closed.
              </p>
            </div>

            {/* 5-Point Audit Checklist Card */}
            <div
              className="reveal-on-scroll delay-100"
              style={{
                padding: '32px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                boxShadow: 'var(--shadow-card)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                  INDEPENDENT AUDIT VERIFICATION
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-emerald)', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
                  5/5 CHECKS PASSED ✓
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Customer Issue Identified & Extracted with Evidence',
                  'Fulfillment Action Completed with Tracking ID',
                  'Customer Notified via Verified Transactional Channel',
                  'Policy Compliance Validated (POL-001 / 14-Day Limit)',
                  'Immutable Audit Certificate Signed & Persisted'
                ].map((check, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} />
                    </div>
                    <span style={{ color: 'var(--text-primary)' }}>{check}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status Transition:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.06em' }}>
                  RESOLVED
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 8: CAPABILITIES (6 IMPLEMENTED PILLARS)
            ==================================================================== */}
        <section
          id="capabilities"
          style={{
            paddingBlock: '120px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(20px, 4vw, 40px)' }}>
            <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '64px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: '14px' }}>
                CAPABILITIES
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                Built for Intelligent Customer Operations.
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              {[
                { icon: <Cpu size={22} />, title: 'Agentic Resolution', desc: 'Coordinate specialized AI agents across the complete customer issue lifecycle rather than relying on brittle, single-turn prompts.' },
                { icon: <Search size={22} />, title: 'Intelligent Triage', desc: 'Understand and classify incoming customer issues, detect sentiment, and extract relevant orders and tracking IDs with zero latency.' },
                { icon: <Layers size={22} />, title: 'Autonomous Investigation', desc: 'Gather deep cross-system context from CRM records, purchase histories, and delivery logs before formulating any plan.' },
                { icon: <Shield size={22} />, title: 'Policy-Aware Actions', desc: 'Evaluate operational business policies before executing sensitive actions, preventing unauthorized refunds and returns.' },
                { icon: <Lock size={22} />, title: 'Human Approval Gating', desc: 'Keep human managers in control of high-risk actions with single-click review, full evidence inspection, and immutable audit logs.' },
                { icon: <FileCheck size={22} />, title: 'Verified Resolution', desc: 'Validate complete operational outcomes against a deterministic 5-point audit before marking any customer ticket resolved.' }
              ].map((card, i) => (
                <div
                  key={card.title}
                  className={`reveal-on-scroll delay-${(i % 3 + 1) * 100}`}
                  style={{
                    padding: '36px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                    {card.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.94rem' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 9: THE RESOLUTION PIPELINE (Visual Connected Progression)
            ==================================================================== */}
        <section
          id="pipeline"
          style={{
            paddingBlock: '120px',
            backgroundColor: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ maxWidth: '1240px', marginInline: 'auto', paddingInline: 'clamp(20px, 4vw, 40px)' }}>
            <div className="reveal-on-scroll" style={{ textAlign: 'center', maxWidth: '720px', marginInline: 'auto', marginBottom: '64px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-emerald)', marginBottom: '14px' }}>
                THE RESOLUTION PIPELINE
              </div>
              <h2 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                The Continuous Journey to Resolution
              </h2>
            </div>

            {/* Pipeline Stage Bar */}
            <div
              className="reveal-on-scroll delay-100 pipeline-container"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '12px',
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(16px)'
              }}
            >
              {[
                { label: 'CUSTOMER ISSUE', code: 'SIGNAL', color: '#38bdf8' },
                { label: 'TRIAGE', code: 'INTENT', color: '#f59e0b' },
                { label: 'INVESTIGATION', code: 'EVIDENCE', color: '#60a5fa' },
                { label: 'POLICY', code: 'COMPLIANCE', color: '#818cf8' },
                { label: 'APPROVAL', code: 'SUPERVISED', color: '#f59e0b' },
                { label: 'ACTION', code: 'EXECUTION', color: '#f43f5e' },
                { label: 'COMMUNICATION', code: 'DISPATCH', color: '#34d399' },
                { label: 'VERIFICATION', code: '5-PT AUDIT', color: '#10b981' },
                { label: 'RESOLVED', code: 'COMPLETE', color: '#10b981' }
              ].map((step, i) => (
                <div
                  key={step.label}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '90px'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: step.color, letterSpacing: '0.04em' }}>
                    0{i + 1}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBlock: '4px', letterSpacing: '-0.02em' }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {step.code}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 10: FINAL CALL TO ACTION (RESOLVE)
            ==================================================================== */}
        <section
          style={{
            paddingBlock: '140px',
            backgroundColor: 'var(--bg-secondary)',
            textAlign: 'center',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div className="reveal-on-scroll" style={{ maxWidth: '820px', marginInline: 'auto', paddingInline: '20px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: '16px' }}>
              RESOLVE
            </div>
            <h2 style={{ fontSize: 'clamp(2.6rem, 4.5vw, 4.2rem)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05, marginBottom: '24px' }}>
              Ready to Resolve What's Next?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '40px' }}>
              Bring customer issues into one intelligent workflow — from first signal to verified resolution.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={handleLaunchApp}
                className="btn-primary"
                style={{ height: '60px', paddingInline: '44px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                <span>{user ? 'Open Workspace' : 'Get Started →'}</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate('/customer')}
                className="btn-secondary"
                style={{ height: '60px', paddingInline: '32px', fontSize: '1.05rem', fontWeight: 600 }}
              >
                <span>Explore Customer Portal</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid var(--border-subtle)',
          paddingBlock: '40px',
          paddingInline: 'clamp(20px, 5vw, 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div>
          © 2026 ResolveAI. Team Astra-4 — Agentic AI & Intelligent Systems.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="/login" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Portal Login</a>
          <a href="/register" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Create Account</a>
          <a href="/api/health" target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>API Health</a>
          <span>Powered by Gemini & Supabase</span>
        </div>
      </footer>

      {/* 7. CUSTOM CSS & HOVER STATES */}
      <style>{`
        .nav-link-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.88rem;
          cursor: pointer;
          transition: color var(--transition-fast);
        }
        .nav-link-btn:hover {
          color: var(--text-primary);
        }
        .side-nav-dot:hover {
          transform: scale(1.4);
          background-color: var(--accent-blue) !important;
        }
        .side-nav-tooltip {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          background-color: var(--bg-card);
          color: var(--text-primary);
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-strong);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          box-shadow: var(--shadow-card);
        }
        .side-nav-dot:hover .side-nav-tooltip {
          opacity: 1;
          transform: translateY(-50%) translateX(-4px);
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .landing-side-nav {
            display: none !important;
          }
          .pipeline-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

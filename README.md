<div align="center">

⚡ RESOLVE.AI

Autonomous Agentic Customer Operations Platform

From customer issue to verified resolution — autonomously.

<p align="center">
  <em>Theme: Agentic AI & Intelligent Systems &nbsp;|&nbsp; Hackathon Submission</em>
</p>

<p align="center">
  <a href="https://astra-4-opal.vercel.app/">
    <img src="https://img.shields.io/badge/LIVE%20DEMO-ONLINE-7C5CFC?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/shreyash-bhosale/Astra-4">
    <img src="https://img.shields.io/badge/SOURCE%20CODE-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
  <a href="#-product-demo">
    <img src="https://img.shields.io/badge/DEMO-ANIMATED%20WALKTHROUGH-FF0000?style=for-the-badge&logo=playstation&logoColor=white" alt="Animated Demo" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-MIT-10B981?style=for-the-badge" alt="MIT License" />
  </a>
</p>

<p align="center">
  <img src="./docs/screenshots/landing_page_hero.png" alt="ResolveAI - From Issue to Resolution. Autonomously." width="95%" />
</p>

<p align="center">
  <em>
    <strong>From Issue to Resolution. Autonomously.</strong><br/>
    ResolveAI understands customer issues, investigates context, evaluates policy, coordinates actions, communicates updates, and verifies the final outcome — with human approval when required.
  </em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Three.js-Liquid%20Metal%203D-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Google%20Gemini-API%20%2B%20Fallback-4285F4?style=flat-square&logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Resend-Transactional%20Email-000000?style=flat-square&logo=resend&logoColor=white" alt="Resend" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square" alt="Zod" />
  <img src="https://img.shields.io/badge/Tests-59%20Assertions%20Passed-10B981?style=flat-square" alt="59 Assertions Passed" />
</p>

</div>

📑 Table of Contents

⚡ What is ResolveAI?

🎯 The Problem

💡 The Solution

🧠 Why ResolveAI is Actually Agentic

🤖 The 8-Agent Supervisory Topology

🛡️ AI Governance & Autonomous Control

🔐 AI Security & Defense-in-Depth

🎥 Product Demo

📧 Automated Transactional Email System

👥 Customer Care Portal

🔄 End-to-End Workflow & Architecture

🖼️ User Interface & Screenshot Gallery

🧰 Technology Stack

📁 Repository & Project Structure

🔌 REST API Documentation

🗄️ Database Architecture & Dual-Store Engine

👤 Authentication & RBAC

🔑 Environment Variables

⚙️ Installation & Local Setup

🧪 Testing & Verification Evidence

🚢 Production Deployment Guide

🎬 Hackathon Judge 3-Minute Demo Script

🏆 Why ResolveAI Matters

👥 Team & License

⚡ What is ResolveAI?

"ResolveAI understands customer issues, investigates context, evaluates policy, coordinates actions, communicates updates, and verifies the final outcome — with human approval when required."

ResolveAI is an autonomous agentic customer operations platform designed to transform unstructured support tickets into verified, policy-compliant resolutions.

Rather than functioning as a conversational chatbot that merely generates text, ResolveAI operates as an auditable operations engine:

Deconstructs support requests into a dynamic Directed Acyclic Graph (DAG) resolution plan.

Investigates CRM customer records, purchase histories, and carrier tracking timestamps.

Evaluates company policies, return rules, and warranty coverage windows.

Governs sensitive actions through autonomous approval thresholds or Human-in-the-Loop manager approval.

Provisions replacement requests and internal updates through allowlisted tools.

Dispatches transactional emails through Resend.

Audits completed resolutions through an independent 5-point verification gate.

Logs agent decisions, tool executions, approvals, and workflow events in an append-oriented audit trail.

Core Value Proposition

Customer Issue
      ↓
Understand
      ↓
Investigate
      ↓
Evaluate Policy
      ↓
Authorize
      ↓
Execute
      ↓
Communicate
      ↓
Verify
      ↓
RESOLVED

🎯 The Problem

Customer operations teams across e-commerce, consumer electronics, and SaaS frequently face operational bottlenecks caused by fragmented systems and manual coordination.

┌─────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER OPERATIONS BOTTLENECK                   │
├─────────────────────────────────────────────────────────────────────┤
│ Fragmented Data       │ CRM, orders, tracking and policies live     │
│                       │ across separate operational surfaces.      │
├───────────────────────┼─────────────────────────────────────────────┤
│ Manual Decisions      │ Warranty windows, eligibility and actions   │
│                       │ are repeatedly checked by support teams.   │
├───────────────────────┼─────────────────────────────────────────────┤
│ Black-Box AI Risk     │ Unconstrained LLMs can generate unsupported│
│                       │ claims or attempt unsafe actions.          │
├───────────────────────┼─────────────────────────────────────────────┤
│ Weak Auditability     │ Traditional workflows often lack a clear   │
│                       │ record of why an operational decision was  │
│                       │ made and which evidence supported it.      │
└─────────────────────────────────────────────────────────────────────┘

The key challenge is therefore not simply generating a response. It is safely moving from unstructured customer intent → evidence → policy → authorization → action → verified resolution.

💡 The Solution

ResolveAI replaces manual triage and unconstrained chatbot workflows with a collaborative multi-agent execution pipeline backed by deterministic policy and governance gates.

Customer Issue Intake
        ↓
Supervisor / Control Plane
        ↓
Orchestrator Agent
        ↓
Triage Agent
        ↓
Investigation Agent
        ↓
Policy Agent
        ↓
Approval Gate
   ↙         ↘
AI Approval  Human Approval
   ↘         ↙
Action Agent
        ↓
Communication Agent
        ↓
Verification Agent
        ↓
Verified Resolution
        ↓
Audit Trail

What makes the system different?

Capability

ResolveAI Approach

Planning

Dynamic DAG-based workflow planning

Reasoning

Specialized agents with bounded responsibilities

Evidence

CRM, order, ticket and policy data

Policy

Deterministic policy checks alongside AI reasoning

Execution

Allowlisted internal tools

Authorization

Autonomous threshold or human approval

Communication

Evidence-grounded transactional emails

Verification

Independent 5-point resolution audit

Observability

Agent activity + append-oriented audit trail

🧠 Why ResolveAI is Actually Agentic

ResolveAI is designed around operational agency rather than simple conversational generation.

Traditional chatbot

User → LLM → Text Response

ResolveAI

Issue
  ↓
Plan
  ↓
Delegate
  ↓
Investigate
  ↓
Reason over Evidence
  ↓
Check Policy
  ↓
Request / Evaluate Authorization
  ↓
Execute Tools
  ↓
Communicate
  ↓
Independently Verify
  ↓
Persist Outcome

Agentic properties

Dynamic DAG Planning
The Orchestrator formulates a case-specific execution plan with explicit dependencies.

Specialized Agent Decomposition
Intelligence is divided across bounded agents instead of one unrestricted prompt.

Environment Interaction
Agents query operational data and invoke registered tools.

Policy Grounding
Operational decisions are tied to verifiable policy rules and evidence.

Persistent Workflow State
Runs move through explicit states such as OPEN, INVESTIGATING, WAITING_APPROVAL, and RESOLVED.

Independent Self-Auditing
The Verification Agent checks the completed workflow before closure.

🤖 The 8-Agent Supervisory Topology

ResolveAI uses an 8-agent hierarchy consisting of:

1 Supervisor Agent — governance and control

1 Orchestrator Agent — planning and coordination

6 Specialized Execution Agents — triage, investigation, policy, action, communication, verification

flowchart TD

    subgraph Governance["1. Supervisory Governance Layer"]
        Sup["◈ Supervisor Agent<br/>AI Control Center"]
        Ctrl["Execution Control Plane<br/>Autonomous Mode<br/>Human-in-the-Loop<br/>Financial Thresholds<br/>Pause / Emergency Stop"]
        Sup --- Ctrl
    end

    subgraph Orchestration["2. Orchestration Layer"]
        Orch["◉ Orchestrator Agent<br/>Dynamic DAG Planner"]
    end

    subgraph Fleet["3. Specialized Execution Fleet"]
        Tri["△ Triage Agent"]
        Inv["⌕ Investigation Agent"]
        Pol["▣ Policy Agent"]
        Act["⚡ Action Agent"]
        Com["✦ Communication Agent"]
        Ver["✓ Verification Agent"]
    end

    subgraph Infrastructure["4. Tools, Data & Delivery"]
        Tools["Allowlisted Tools Sandbox"]
        DB[(Supabase PostgreSQL / Local Store)]
        Email["Resend Email Service"]
    end

    Sup -. "Supervises & Governs" .-> Orch
    Orch --> Tri
    Tri --> Inv
    Inv --> Pol
    Pol -->|"Approval Request"| Sup
    Sup -->|"Approve / Escalate"| Act
    Act --> Tools
    Tools --> DB
    Act --> Com
    Com --> Email
    Com --> Ver
    Ver -->|"5-Point Verification"| DB

Detailed Agent Fleet

Agent

Responsibility

Example Tools / Output

Supervisor

Fleet health, approval decisions, financial limits, control plane, emergency halts

SupervisorDecisionSchema

Orchestrator

Dynamic DAG planning, dependencies, pause/resume state

PlanOutputSchema

Triage

Intent, category, urgency and entity extraction

TriageOutputSchema

Investigation

CRM, orders, customer history and delivery evidence

getCustomer(), getOrder()

Policy

Warranty / return rules and authorization requirements

searchPolicies()

Action

Allowlisted state-changing operational actions

createReplacementRequest()

Communication

Evidence-grounded customer and internal messages

CommunicationOutputSchema

Verification

Independent 5-point resolution audit

VerificationOutputSchema

🛡️ AI Governance & Autonomous Control

ResolveAI follows a core principle:

AI can reason and recommend, but execution remains constrained by authorization gates, policy boundaries, schema validation, and backend control-plane enforcement.

AI Recommendation
       ↓
Policy Validation
       ↓
Evidence Validation
       ↓
Financial Risk Check
       ↓
┌───────────────────────────────────────┐
│          APPROVAL EVALUATION          │
│                                       │
│ Autonomous Mode + Within Threshold?   │
│             │                         │
│       ┌─────┴─────┐                   │
│      YES          NO                  │
│       ↓            ↓                  │
│ AI Supervisor   Human Manager         │
│ Approval        Approval              │
└───────┬──────────┬────────────────────┘
        ↓
Allowlisted Action
        ↓
Independent Verification

Governance capabilities

1. Autonomy Modes

Full Autonomous: Supervisor Agent evaluates eligible approval requests.

Semi-Autonomous / Gated: Sensitive actions pause for manager review.

2. Configurable Financial Thresholds

The control plane supports configurable limits such as:

$250 → $500 → $1,000 → $2,500 → Unlimited

Actions above the configured threshold can be escalated to a human manager.

3. Execution Control Plane

Pause: Blocks new autonomous workflow execution.

Emergency Stop: Halts active execution and blocks pending tool actions.

Backend enforcement prevents the frontend alone from bypassing the control state.

🔐 AI Security & Defense-in-Depth

ResolveAI uses multiple layers of controls around AI-generated decisions and operational execution.

Threat

Risk

Defense

Prompt Injection

Customer text attempts to override system instructions

Untrusted input treated as data; dedicated prompt boundaries

AI Hallucination

Unsupported order numbers, policies or actions

Structured outputs + evidence-grounded communication

Unauthorized Action

AI attempts arbitrary operations

Hardcoded allowlisted tool registry

Privilege Escalation

Customer accesses staff capabilities

JWT authentication + RBAC middleware

Cross-Tenant Access

Customer views another customer's data

Ownership checks + 403 Forbidden

Malformed AI Output

Invalid JSON or unexpected structure

Zod validation + controlled fallbacks

Duplicate Actions

Retries trigger repeated actions

Idempotency keys

Email Header Injection

CRLF attempts to modify recipients

Header sanitization + email validation

API Abuse

Excessive requests

Express rate limiting

Security architecture

Untrusted Customer Input
        ↓
Authentication / RBAC
        ↓
Input Validation
        ↓
AI Reasoning
        ↓
Structured Output Validation
        ↓
Policy / Evidence Check
        ↓
Authorization Gate
        ↓
Allowlisted Tool Registry
        ↓
Database / External Service
        ↓
Audit Log

🎥 Product Demo

Watch the complete ResolveAI workflow — from customer issue intake to investigation, policy evaluation, approval, operational execution, customer communication and independent verification.

<p align="center">
  <a href="https://astra-4-opal.vercel.app/">
    <img src="./docs/screenshots/resolveai-demo-walkthrough.gif" alt="ResolveAI Animated Walkthrough Demo" width="95%" />
  </a>
</p>

🚀 Live Production Demo

Live: https://astra-4-opal.vercel.app/

Role

Route

Demo Credentials

What to Evaluate

Admin

/staff/login

admin@resolveai.io / password123

AI Control Center, autonomy settings, audit logs

Manager

/staff/login

manager@resolveai.io / password123

Approval queue and action authorization

Support Agent

/staff/login

agent@resolveai.io / password123

Ticket workspace and autonomous workflow

Customer

/customer/login

customer@resolveai.io / password123

Issue submission, tracking and notifications

Demo credentials are intended for the deployed hackathon demonstration environment. Do not reuse these credentials for production systems.

Detailed walkthrough: docs/DEMO_SCRIPT.md

📧 Automated Transactional Email System

ResolveAI includes a transactional email subsystem powered by Resend.

Backend Event
      ↓
Email Service
      ↓
Template Renderer
      ↓
Resend API
      ↓
Customer / Manager Inbox
      ↓
Email Audit Log

Supported events

TICKET_CREATED

TICKET_STATUS_UPDATED

APPROVAL_REQUIRED

ACTION_COMPLETED

TICKET_RESOLVED

ADMIN_TEST

Development sandbox behavior

When using an unverified Resend domain, outbound email may be restricted by the provider. ResolveAI supports sandbox fallback routing so development testing can still verify the email workflow safely.

For production delivery to external recipients, configure a verified sending domain in Resend.

👥 Customer Care Portal

The dedicated /customer experience provides end users with a separate customer-facing workflow.

Customer capabilities

Customer Home — active tickets, resolved issues and account summary.

Raise an Issue — create support requests and link orders.

Issue Tracking — follow resolution progress.

Order History — view purchases and report problems.

AI Support Assistant — customer-contextual support interaction.

Profile & Notifications — manage notification preferences.

flowchart LR
    C[Customer] --> P[Customer Portal]
    P --> T[Create / Track Ticket]
    P --> O[Order History]
    P --> A[AI Support]
    T --> R[ResolveAI Workflow]
    R --> V[Verified Resolution]
    V --> N[Customer Notification]

🔄 End-to-End Workflow & Architecture

sequenceDiagram
    autonumber

    actor Customer
    actor Agent as Support Agent
    participant Orch as Orchestrator
    participant Fleet as Agent Fleet
    participant Sup as Supervisor
    actor Manager as Operations Manager
    participant Tools as Allowlisted Tools
    participant Email as Resend
    participant DB as Database / Audit Trail

    Customer->>DB: Submit support case
    DB-->>Email: Ticket created event
    Email-->>Customer: Ticket created notification

    Agent->>Orch: Run ResolveAI
    Orch->>Fleet: Triage
    Fleet->>Fleet: Investigate evidence
    Fleet->>Fleet: Evaluate policy

    Fleet-->>Sup: Request authorization

    alt Autonomous approval
        Sup->>Sup: Validate evidence + policy + threshold
        Sup-->>Orch: APPROVE
    else Human approval
        Orch->>DB: WAITING_APPROVAL
        DB-->>Email: Approval event
        Email-->>Manager: Approval required
        Manager->>DB: Approve / Reject
        Manager->>Orch: Resume workflow
    end

    Orch->>Tools: Execute approved action
    Tools->>DB: Persist operational result

    Orch->>Fleet: Communication Agent
    Fleet->>Email: Dispatch customer update

    Orch->>Fleet: Verification Agent
    Fleet->>DB: Persist verification result

    DB-->>Customer: Verified resolution

🖼️ User Interface & Screenshot Gallery

Production screenshots are stored under docs/screenshots/.

1. Futuristic Liquid-Metal Landing Page

<p align="center">
  <img src="./docs/screenshots/landing_page_hero.png" alt="ResolveAI futuristic liquid-metal landing page" width="95%" />
</p>

<p align="center">
  <img src="./docs/screenshots/landing_page_dark.png" alt="ResolveAI dark mode landing page" width="49%" />
  <img src="./docs/screenshots/landing_page_light.png" alt="ResolveAI light mode landing page" width="49%" />
</p>

2. Portal Gateway & Evaluator Authentication

<p align="center">
  <img src="./docs/screenshots/login_selection.png" alt="ResolveAI portal selection gateway" width="49%" />
  <img src="./docs/screenshots/login_page.png" alt="ResolveAI staff login and evaluator authentication" width="49%" />
</p>

3. Operations Command Center

<p align="center">
  <img src="./docs/screenshots/dashboard_overview.png" alt="ResolveAI operations command center" width="95%" />
</p>

<p align="center">
  <img src="./docs/screenshots/agent_fleet_showcase.png" alt="ResolveAI 8-agent fleet showcase" width="95%" />
</p>

4. Ticket Management

<p align="center">
  <img src="./docs/screenshots/tickets_list.png" alt="ResolveAI support ticket management console" width="95%" />
</p>

5. Autonomous Multi-Agent Workspace

<p align="center">
  <img src="./docs/screenshots/ticket_workspace_initial.png" alt="ResolveAI ticket workspace during investigation" width="49%" />
  <img src="./docs/screenshots/ticket_workspace_paused_gate.png" alt="ResolveAI workflow paused at approval gate" width="49%" />
</p>

<p align="center">
  <img src="./docs/screenshots/ticket_workspace_resolved.png" alt="ResolveAI verified resolution state" width="95%" />
</p>

6. Human-in-the-Loop Approval Queue

<p align="center">
  <img src="./docs/screenshots/human_approval_gate.png" alt="ResolveAI manager approval queue" width="95%" />
</p>

7. AI Control Center

<p align="center">
  <img src="./docs/screenshots/ai_control_center.png" alt="ResolveAI AI autonomy and safety control center" width="95%" />
</p>

8. Activity & Audit Log

<p align="center">
  <img src="./docs/screenshots/activity_audit_log.png" alt="ResolveAI activity and audit log" width="95%" />
</p>

9. Platform Settings & Email

<p align="center">
  <img src="./docs/screenshots/settings_page.png" alt="ResolveAI platform settings and transactional email controls" width="95%" />
</p>

10. Customer Care Portal

<p align="center">
  <img src="./docs/screenshots/customer_portal_home.png" alt="ResolveAI customer portal home" width="49%" />
  <img src="./docs/screenshots/customer_issues_list.png" alt="ResolveAI customer issues list" width="49%" />
</p>

<p align="center">
  <img src="./docs/screenshots/customer_submit_issue.png" alt="ResolveAI customer issue submission" width="49%" />
  <img src="./docs/screenshots/customer_orders.png" alt="ResolveAI customer order history" width="49%" />
</p>

🧰 Technology Stack

Layer

Technology

Purpose

Frontend

React 19 + Vite

Web application and UI

Routing

React Router DOM

Protected application routes

3D Visuals

Three.js

Liquid-metal hero experience

UI Icons

Lucide React

Interface iconography

Effects

Canvas Confetti

Interaction feedback

Backend

Node.js + Express

REST API and agent execution

AI

Google Gemini API

Agentic reasoning and structured generation

Fallback AI

Custom heuristic reasoner

Deterministic fallback behavior

Database

Supabase PostgreSQL

Production relational persistence

Fallback Store

File-backed JSON

Local development / fallback persistence

Validation

Zod

API and AI output validation

Authentication

JWT + bcryptjs

Authentication and password hashing

Email

Resend

Transactional notifications

Security

express-rate-limit

API abuse protection

Deployment

Vercel + backend deployment

Production hosting

📁 Repository & Project Structure

Astra-4/
├── .agents/
│   └── rules/
│       └── ui-ux.md
│
├── backend/
│   ├── data/
│   │   └── store.json
│   ├── src/
│   │   ├── agents/
│   │   │   ├── supervisorAgent.js
│   │   │   ├── actionAgent.js
│   │   │   ├── communicationAgent.js
│   │   │   ├── investigationAgent.js
│   │   │   ├── orchestrator.js
│   │   │   ├── policyAgent.js
│   │   │   ├── triageAgent.js
│   │   │   └── verificationAgent.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── validators/
│   │   └── server.js
│   ├── test-email-automation.js
│   ├── test-full-system-audit.js
│   ├── test-supervisor-autonomy.js
│   ├── package.json
│   └── render.yaml
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
├── docs/
│   ├── DEMO_SCRIPT.md
│   └── screenshots/
│
├── LICENSE
├── DEPLOYMENT.md
├── supabase-schema.sql
└── package.json

🔌 REST API Documentation

All protected routes use:

Authorization: Bearer <token>

Authentication

POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me

Tickets & Agent Execution

GET  /api/tickets
POST /api/tickets
GET  /api/tickets/:id
POST /api/tickets/:id/run
POST /api/tickets/:id/notes

Supervisor / AI Control Center

GET  /api/supervisor/status
POST /api/supervisor/settings
POST /api/supervisor/chat
POST /api/supervisor/emergency-stop

Approvals

GET  /api/approvals
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject

Transactional Email

GET  /api/emails/status
POST /api/emails/test
GET  /api/emails/logs

Customer Portal

GET  /api/customer/profile
GET  /api/customer/tickets
POST /api/customer/tickets
GET  /api/customer/orders
GET  /api/customer/notifications
POST /api/customer/chat

🗄️ Database Architecture & Dual-Store Engine

ResolveAI supports two persistence modes.

Production: Supabase PostgreSQL

Used for production relational persistence with PostgreSQL and Row Level Security.

Schema:

supabase-schema.sql

Development / Fallback: Local JSON Store

A self-healing file-backed store located at:

backend/data/store.json

Core entities

Entity

Purpose

users

Authentication, roles and account information

customers

CRM customer records

orders

Purchases, tracking and delivery timestamps

policies

Active warranty / return policies

tickets

Customer support cases

agent_runs

Agent workflow state and DAG execution

approvals

Authorization requests and decisions

email_notifications

Transactional email records

audit_logs

Agent and operational activity history

👤 Authentication & Role-Based Access Control

ResolveAI uses JWT-based authentication and role-based access control.

Evaluation Personas

Persona

Role

Portal

Credentials

Customer User

customer

/customer/login

customer@resolveai.io / password123

Alex Vance

admin

/staff/login

admin@resolveai.io / password123

James Rodriguez

manager

/staff/login

manager@resolveai.io / password123

Sarah Connor

agent

/staff/login

agent@resolveai.io / password123

Permission Matrix

Capability

Admin

Manager

Agent

Customer

View tickets and runs

✓

✓

✓

Own only

Trigger workflows

✓

✓

✓

—

Approve / reject actions

✓

✓

—

—

Configure AI autonomy

✓

—

—

—

Emergency stop

✓

—

—

—

Admin email tests

✓

—

—

—

Customer portal

—

—

—

✓

Submit customer issues

—

—

—

✓

View own orders

—

—

—

✓

Security note: The credentials above are demonstration credentials. Never commit real production credentials or secrets to source control.

🔑 Environment Variables

Create a .env file for the backend configuration.

# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=replace-with-a-secure-random-secret

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest

# Resend
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM=ResolveAI <onboarding@resend.dev>
EMAIL_REPLY_TO=support@resolveai.io
MANAGER_NOTIFICATION_EMAIL=manager@resolveai.io
EMAIL_MODE=provider
RESEND_TEST_RECIPIENT=your-verified-email@example.com

# Supabase - Optional when using local fallback store
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

Never commit .env, API keys, service-role keys, JWT secrets or other credentials to Git.

⚙️ Installation & Local Setup

Prerequisites

Node.js 18+

npm 9+

Git

Optional: Google Gemini API key

Optional: Supabase project

Optional: Resend account for transactional email testing

1. Clone

git clone https://github.com/shreyash-bhosale/Astra-4.git
cd Astra-4

2. Install dependencies

cd backend
npm install

cd ../frontend
npm install

cd ..

3. Configure environment

cp .env.example .env

Add the required environment values.

If the Gemini integration is unavailable, the project can use its deterministic fallback behavior where configured.

4. Start the backend

npm run dev:backend

Backend:

http://localhost:5001

Health check:

http://localhost:5001/api/health

5. Start the frontend

In a second terminal:

npm run dev:frontend

Frontend:

http://localhost:5173

🧪 Testing & Verification Evidence

The supplied project documentation reports the following verification evidence:

┌──────────────────────────────────────────────────────────────┐
│                  VERIFIED TEST SUITES                        │
├──────────────────────────────────────────────────────────────┤
│ Full System Audit Suite       │ 23 / 23 Assertions Passed    │
│ Transactional Email Suite     │ 36 / 36 Assertions Passed    │
│ Supervisor Autonomy Suite     │ All Stages Passed            │
│ Frontend Production Build     │ 0 Build Errors               │
├──────────────────────────────────────────────────────────────┤
│ TOTAL ASSERTIONS              │ 59 PASSED | 0 FAILED         │
└──────────────────────────────────────────────────────────────┘

Full system audit

node backend/test-full-system-audit.js

The reported checks include:

Authentication and RBAC

Policy creation and persistence

Supervisor telemetry

Customer order aggregation

Internal notes persistence

Pause / emergency-stop enforcement

Customer portal issue creation

Customer data isolation

Transactional email suite

node backend/test-email-automation.js

The reported checks include:

Health check

Authentication

Email subsystem status

Admin-only dispatch protection

Workflow-triggered emails

Customer email preferences

Header injection prevention

Email audit logs

Frontend build

cd frontend
npm run build

🚢 Production Deployment Guide

Frontend — Vercel

Recommended configuration from the supplied deployment setup:

Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist

Frontend environment:

VITE_API_URL=https://your-backend-api.com/api

Backend — Render / Railway

Environment: Node
Root Directory: backend
Build Command: npm install
Start Command: node src/server.js

Configure backend environment variables using the section above.

Production architecture

flowchart LR
    User[Browser] --> Vercel[Vercel Frontend]
    Vercel --> API[Express Backend]
    API --> Gemini[Google Gemini]
    API --> DB[(Supabase PostgreSQL)]
    API --> Resend[Resend]
    API --> Tools[Allowlisted Tools]
    Tools --> DB

🎬 Hackathon Judge 3-Minute Demo Script

Time

Stage

Action

What the Judge Sees

0:00–0:30

Product

Open the live application and show the liquid-metal landing page and agent fleet

Product identity, UI polish and agent architecture

0:30–1:00

Case Investigation

Login as Sarah Connor and run a ticket

Triage → Investigation → Policy → Approval Gate

1:00–1:45

Governance

Login as Alex Vance and open AI Control Center

Autonomy mode, financial threshold and Supervisor telemetry

1:45–2:20

Approval

Login as James Rodriguez and approve the action

Evidence review → authorization → action execution

2:20–3:00

Customer Loop

Open customer portal and inspect resolution

Customer status, tracking information, notification and verification

Recommended demo narrative

"ResolveAI doesn't just answer a support ticket.

It understands the issue,
investigates the evidence,
checks the policy,
decides whether authorization is required,
executes only approved actions,
communicates the result,
and independently verifies the resolution.

The result is an end-to-end customer operations workflow
designed around controlled autonomy."

Full demo documentation:

docs/DEMO_SCRIPT.md

🏆 Why ResolveAI Matters

1. Specialized intelligence

Eight bounded agents divide planning, classification, investigation, policy reasoning, execution, communication, governance and verification.

2. Controlled autonomy

The system is designed so AI reasoning does not automatically equal unrestricted execution.

3. Evidence-first resolution

Operational decisions are tied to customer, order and policy evidence.

4. Independent verification

A separate Verification Agent checks the completed workflow before closure.

5. Full operational loop

ResolveAI connects:

Customer
  ↓
Support
  ↓
AI Agents
  ↓
Governance
  ↓
Operational Action
  ↓
Communication
  ↓
Verification
  ↓
Audit Trail

6. Dual experience

The platform includes both:

Enterprise staff operations

Consumer customer care

🧭 Project Highlights

┌───────────────────────────────────────────────────────────────┐
│                         RESOLVE.AI                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   🤖 8-Agent Architecture                                     │
│   🧠 Dynamic DAG Orchestration                                │
│   🛡️ AI Governance & Approval Gates                           │
│   🔐 Defense-in-Depth Security                                │
│   📊 Operational Telemetry & Audit Trail                      │
│   📧 Transactional Email Automation                            │
│   👥 Staff + Customer Portals                                  │
│   🗄️ Supabase + Local Dual Store                              │
│   🧪 59 Reported Assertions Passed                            │
│   🚀 Live Production Demo                                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

👥 Team & License

Built for the Agentic AI & Intelligent Systems Hackathon.

Team

Member

Role

Sparsh Shrivastav

Team Leader

Shreyash Bhosale

Engineer

Vatsal Pithwa

Engineer

Uzair Pathan

Engineer

License

This project is licensed under the MIT License.

See LICENSE.

<div align="center">

⚡ ResolveAI

From customer issue to verified resolution — autonomously.

🚀 Live Demo · 💻 GitHub Repository

Built with React, Node.js, Google Gemini, Supabase, Resend and a multi-agent architecture.

</div>

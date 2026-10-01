# ResolveAI — Agentic Customer Operations Platform

> **Tagline:** *From customer issue to verified resolution — autonomously.*  
> **Theme:** Agentic AI & Intelligent Systems  
> **Document Reference:** Hackathon Implementation PRD v1.0  
> **Implementation Status:** Fully Implemented & Production-Ready  

---

## 1. Project Overview

**ResolveAI** is an autonomous, agentic AI customer-operations platform. Rather than acting as a simple conversational chatbot, ResolveAI deploys a collaborative **AI Resolution Fleet** of 7 specialized autonomous agents. 

When a customer issue is submitted, ResolveAI autonomously investigates cross-system records (customer CRM, transaction databases, carrier tracking), formulates a dynamic Directed Acyclic Graph (DAG) plan, reasons against company warranty and return policies, gates sensitive operations through **Human-in-the-Loop supervisor authorization**, provisions authorized internal tool actions, generates empathetic personalized customer responses, and conducts a strict 5-point verification audit before marking any case as resolved.

Every single decision, confidence score, policy citation, and tool execution is recorded in an immutable, auditable timeline.

---

## 2. The Problem & Business Pain

Modern customer support teams lose up to **70% of case handling time** to repetitive manual coordination:
* **Fragmented Systems:** Swapping back and forth between ticket inboxes, CRM profiles, warehouse shipping portals, and internal PDF policies.
* **Repetitive Decision Fatigue:** Calculating whether a damaged delivery falls within a 14-day replacement window or whether an order can be intercepted prior to warehouse dispatch.
* **The "Black-Box" Bot Risk:** Conventional LLM bots either hallucinate false promises to customers or lack the safety controls required to execute real business actions without runaway financial risk.

---

## 3. The Autonomous Multi-Agent Fleet

ResolveAI solves this through specialization, tool allowlists, and supervisor gating:

| Agent | Badge | Core Responsibilities | Gating & Tools |
| :--- | :---: | :--- | :--- |
| **Orchestrator Agent** | `◉` | Formulates 6-step DAG execution plans, assigns dependencies, handles recovery, and oversees state transitions. | Master State Machine |
| **Triage Agent** | `△` | Classifies issue category, customer intent, detects urgency, and extracts key entities. | Semantic Intent Classifier |
| **Investigation Agent** | `⌕` | Queries CRM databases, retrieves transaction records, computes carrier delivery age, and compiles evidence dossiers. | `getCustomer()`, `getOrder()`, `getCustomerOrders()` |
| **Policy Agent** | `▣` | Searches active company policies, evaluates warranty conditions, and flags sensitive operations. | `searchPolicies()`, Safety Gates |
| **Action Agent** | `⚡` | Executes allowlisted internal tools. Strictly pauses for supervisor approval on Medium/High risk actions. | `createReplacementRequest()`, `updateStatus()` |
| **Communication Agent** | `✦` | Composes empathetic, hallucination-free customer notifications and internal leadership briefings based on verified facts. | Strict Context Formatter |
| **Verification Agent** | `✓` | Performs an independent 5-point audit (evidence, policy, approval, execution, customer notification) before ticket closure. | Audit Gate Barrier |

---

## 4. Architectural Collaboration Flow

```
                      [ Inbound Support Ticket ]
                                   │
                                   ▼
                      [ ◉ Orchestrator Agent ]
                                   │
                        ┌──────────┴──────────┐
                        ▼                     ▼
                 [ △ Triage Agent ]   [ ⌕ Investigation Agent ]
                        │                     │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        [ ▣ Policy Agent ]
                                   │
                                   ▼
                    Is Action Sensitive / High Risk?
                       /                       \
                     YES                       NO
                     /                           \
           [ ⚠ Human Supervisor ]                 \
          (Approve / Reject Gate)                  \
                    │                               │
                    └──────────────┬────────────────┘
                                   ▼
                         [ ⚡ Action Agent ]
                     (Warehouse Dispatch / Task)
                                   │
                                   ▼
                     [ ✦ Communication Agent ]
                      (Verified Customer Email)
                                   │
                                   ▼
                     [ ✓ Verification Agent ]
                     (5-Point Audit Checklist)
                                   │
                                   ▼
                    [ Verified Resolved Case ]
                 + Complete Audit Trail Timeline
```

---

## 5. Technology Stack

* **Frontend:**
  * React 19 + Vite (Modern, modular, responsive)
  * Three.js (High-fashion, futuristic Liquid-Metal chrome 3D interactive hero sculpture canvas with fluid reflections, mouse parallax, and `prefers-reduced-motion` compliance)
  * Lucide React Icons
  * Canvas Confetti (delight on autonomous resolution)
  * Pure Vanilla CSS Design System with editorial typography (Geist / Inter) and 12-column grid architecture
* **Backend:**
  * Node.js + Express
  * Google Gemini API (`gemini-flash-latest` / `gemini-3.5-flash`) with structured JSON schema outputs
  * Supabase PostgreSQL + Self-Healing Persistent JSON/SQLite Store
  * Zod Schema Validation for all API inputs and AI structured outputs
  * JWT Authentication + bcryptjs password hashing
  * Human-in-the-Loop supervisor approval queue

---

## 6. Repository Structure

```
Astra-4/
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/           # LiquidMetalHeroCanvas, Sidebar, Modals
│   │   ├── context/              # AuthContext (with 1-click Demo Personas)
│   │   ├── layouts/              # DashboardLayout
│   │   ├── pages/                # LandingPage, DashboardPage, TicketWorkspacePage,
│   │   │                         # ApprovalsPage, TicketsListPage, CustomersPage,
│   │   │                         # OrdersPage, PoliciesPage, ActivityPage, SettingsPage
│   │   ├── services/             # API client
│   │   ├── App.jsx               # React Router routes
│   │   ├── index.css             # Liquid-metal design tokens & styles
│   │   └── main.jsx
│   └── package.json
│
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── agents/               # Orchestrator, Triage, Investigation, Policy,
│   │   │                         # Action, Communication, Verification
│   │   ├── config/               # Environment & system configurations
│   │   ├── controllers/          # Auth, Tickets, Approvals, Customers, Orders, Policies
│   │   ├── db/                   # Persistent store & realistic hackathon seed data
│   │   ├── middleware/           # JWT Auth, Zod Validation, Global Error Handler
│   │   ├── routes/               # Modular Express API routers
│   │   ├── services/             # Google Gemini AI service & failover
│   │   ├── tools/                # Allowlisted internal business tools
│   │   ├── validators/           # Zod contract schemas
│   │   └── server.js             # API entrypoint
│   ├── test/                     # End-to-end automated multi-agent test suite
│   └── package.json
│
├── supabase-schema.sql           # Complete Supabase PostgreSQL DDL
├── package.json                  # Root monorepo startup scripts
├── .env.example                  # Environment variable reference
└── README.md
```

---

## 7. Quick Start & Local Setup

### Prerequisites
* Node.js v18+ (tested on Node v26)
* npm v9+

### 1. Clone & Configure
```bash
git clone https://github.com/shreyash-bhosale/Astra-4.git
cd Astra-4
cp .env.example .env.local
```

Ensure your `.env.local` contains:
```env
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5001
```

### 2. Install Dependencies
```bash
# In backend
cd backend && npm install

# In frontend
cd ../frontend && npm install

# Return to root
cd ..
```

### 3. Start Both Backend & Frontend
From the root directory:
```bash
npm run dev
```

* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:5001`
* **API Health Check:** `http://localhost:5001/api/health`

---

## 8. Hackathon Evaluator 1-Click Demo Guide

For rapid evaluation, 1-click persona quick-logins are built directly into the login screen and header:

1. **Visit:** `http://localhost:5173`
   * Experience the **Liquid-Metal Chrome 3D Hero** with fluid reflections, mouse parallax, and editorial layout.
2. **Click "Launch ResolveAI Demo"**:
   * Automatically logs in as **Sarah Connor (Support Agent)**.
3. **Open Case #tkt-001:**
   * Customer: *Elena Rostova (VIP Enterprise)*
   * Issue: *"My headphones arrived damaged. I want a replacement."*
   * Verified Order: *Astra SoundPro Wireless ANC Headphones ($349.00)* delivered 3 days ago.
4. **Click "Run ResolveAI":**
   * Watch the live DAG execution plan progress:
     * `△ Triage Agent`: Categorizes as `damaged_product`, intent `replacement`.
     * `◉ Orchestrator Agent`: Generates 6-step plan.
     * `⌕ Investigation Agent`: Confirms 3-day delivery and warranty eligibility.
     * `▣ Policy Agent`: Cites POL-001 (Section 1). Declares physical replacement as medium risk.
     * `⚡ Action Agent`: **Pauses workflow** and raises **Human Supervisor Approval Gate**.
5. **Supervisor Authorization:**
   * Review the inline evidence dossier.
   * Click **"Authorize Action & Resume"**.
6. **Autonomous Resolution:**
   * `⚡ Action Agent` provisions Replacement Order `#REP-XXXX`.
   * `✦ Communication Agent` drafts personalized customer email.
   * `✓ Verification Agent` audits all 5 checklist criteria.
   * Ticket transitions to `RESOLVED` with celebration confetti!
7. **Inspect Audit Trail:**
   * Explore the right-hand panel to review all 18 immutable timestamps, agent thoughts, and tool metadata.

---

## 9. Automated Testing

To run the end-to-end multi-agent workflow test suite:

```bash
cd backend
node test/e2e-workflow.test.js
```

**Expected output:**
```
========================================================
🧪 Starting ResolveAI End-to-End Multi-Agent Test Suite
========================================================
✓ Found initial ticket #tkt-001
✓ Triggering Orchestrator
✓ Paused at Human Supervisor Approval Gate!
✓ Human Supervisor grants approval and resumes workflow...
✓ Resumed workflow status: RESOLVED
🎉 ALL P0 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!
```

---

## 10. Security & Safety Architecture

* **Zero Secret Leakage:** AI API keys and database service role tokens reside strictly in backend environment variables. Never bundled into client builds.
* **Prompt Injection Hardening:** All customer ticket descriptions and emails are strictly parsed as data strings. System instructions enforce that customer content cannot override system policies or bypass approval gates.
* **Allowlisted Tool Execution:** Agents can only call predefined server-side tools (`getCustomer`, `getOrder`, `searchPolicies`, `createReplacementRequest`). No unrestricted SQL or arbitrary shell access.
* **Human-in-the-Loop Gating:** Medium and High Risk operations (physical shipments, financial refunds) physically pause the orchestrator state machine until a human manager authorizes the action.

---

## 11. License

MIT License. Developed for the Agentic AI & Intelligent Systems Hackathon 2026.

# ResolveAI — Hackathon Demo Video Script & Timing Plan

> **Target Duration:** 3 to 5 minutes  
> **PRD Reference:** Section 66 Demo Video Plan  

---

### [0:00 – 0:25] The Problem & The Business Bottleneck
* **Visual:** Start on the landing page hero at `http://localhost:5173/` showing the futuristic liquid-metal 3D canvas and the headline: *"FROM ISSUE TO RESOLUTION. AUTONOMOUSLY."*
* **Spoken Script:**
  > "Customer operations today are held back by fragmented systems and repetitive manual coordination. When an issue arrives—like a broken product, a shipping delay, or an exchange request—support agents spend up to 70% of their time simply hunting down order numbers, checking return policies, drafting standard emails, and waiting for manager approvals.
  > Conventional AI chatbots only answer questions with conversational text. They can't plan, reason across policies, or safely execute business tools without massive hallucination risks."

---

### [0:25 – 0:50] The Solution: Meet ResolveAI
* **Visual:** Scroll to the **Collaborative Architecture** section showcasing the 7 specialized agents (`◉ Orchestrator`, `△ Triage`, `⌕ Investigation`, `▣ Policy`, `⚡ Action`, `✦ Communication`, `✓ Verification`).
* **Spoken Script:**
  > "Introducing **ResolveAI**—an autonomous agentic customer operations platform. Instead of a single monolithic prompt, ResolveAI deploys a collaborative fleet of specialized AI agents.
  > The Orchestrator formulates a dynamic multi-step resolution plan; the Triage Agent classifies customer intent; the Investigation Agent cross-references CRM records and delivery timestamps; the Policy Agent evaluates warranty rules; the Action Agent executes approved tools; and the Verification Agent enforces a strict 5-point audit before any case can be closed."

---

### [0:50 – 1:20] Authentication & Operational Dashboard
* **Visual:** Click **"Launch App"** (or use the 1-click Quick Demo login as Sarah Connor, Support Agent). The Dashboard at `/dashboard` appears.
* **Spoken Script:**
  > "Let's enter the live platform. Here on our operations dashboard, teams have real-time visibility into active cases, our 94% autonomous resolution rate, and our live AI agent fleet status. 
  > Notice our Human-in-the-Loop approval queue: whenever an agent proposes an action involving inventory or money, it strictly pauses for supervisor review."

---

### [1:20 – 2:30] Star Demo: Autonomous Case Resolution
* **Visual:** Navigate to Case `#tkt-001` (`/tickets/tkt-001`).
* **Spoken Script:**
  > "Let's look at this inbound case from Elena Rostova, an enterprise customer:
  > *'The shipping box looked crushed and when I opened the Astra SoundPro headphones, the left headband hinge was snapped. The sound crackles. Please send me a replacement unit as soon as possible.'*
  > Notice the customer dossier and verified order details are automatically surfaced on the left.
  > Now, let's click **'Run ResolveAI'**."

* **Action:** Click the black **"Run ResolveAI"** button.
* **Visual:** Watch the live multi-agent execution in real-time.
* **Spoken Script:**
  > "Watch what happens live:
  > 1. The **Triage Agent** categorizes this as `damaged_product` with high priority.
  > 2. The **Orchestrator** generates a tailored 6-step execution plan.
  > 3. The **Investigation Agent** verifies Order `#ORD-4821` was delivered 3 days ago.
  > 4. The **Policy Agent** evaluates our Damaged Product Replacement Policy `POL-001`, confirming it falls well within the 14-day warranty window.
  > 5. But because dispatching a brand-new physical replacement is a medium-risk action, the **Action Agent** halts and raises an approval gate."

---

### [2:30 – 3:15] Human-in-the-Loop Supervisor Authorization
* **Visual:** Point to the yellow **Human Supervisor Approval Gate** banner.
* **Spoken Script:**
  > "This is human-supervised autonomy. The system doesn't blindly ship hardware. It pauses, presents the supervisor with verified evidence—order number, delivery timeline, and policy citation—and waits.
  > As the supervisor, I review the evidence and click **'Authorize Action & Resume'**."

* **Action:** Click **"Authorize Action & Resume"**.
* **Visual:** Confetti fires as the workflow resumes and transitions to `RESOLVED`.
* **Spoken Script:**
  > "Immediately upon authorization, the workflow resumes:
  > - The Action Agent provisions replacement order `#REP-XXXX` directly in the warehouse queue.
  > - The Communication Agent drafts a personalized, empathetic confirmation email with tracking details and zero hallucinations.
  > - And the Verification Agent audits all 5 criteria to certify that policy rules and approvals were 100% satisfied."

---

### [3:15 – 3:45] The Immutable Audit Trail
* **Visual:** Scroll down the right-hand **AI Audit Timeline** panel.
* **Spoken Script:**
  > "Every single autonomous thought, tool call, policy evaluation, and supervisor authorization is preserved in this complete, immutable audit trail. Regulators, managers, and agents can inspect the exact reasoning and payload of every step."

---

### [3:45 – 4:15] Full-Stack Architecture & Security
* **Visual:** Briefly show the **Settings** view (`/settings`) and the tool allowlist.
* **Spoken Script:**
  > "Architecturally, ResolveAI is built with:
  > - **React and Vite** on the frontend with a custom Three.js liquid-metal 3D canvas.
  > - **Node.js, Express, and Zod** on the backend.
  > - **Google Gemini API** for structured JSON agent reasoning with automatic multi-model failover.
  > - **Supabase PostgreSQL** for data persistence.
  > All API keys remain strictly server-side, and agents can only invoke allowlisted tools with no direct SQL access."

---

### [4:15 – 4:40] Conclusion
* **Visual:** Return to the landing page or dashboard.
* **Spoken Script:**
  > "ResolveAI demonstrates the true power of Agentic AI: turning fragmented, repetitive customer operations into an autonomous, verifiable, and human-supervised resolution machine.
  > From issue to verified resolution—autonomously. Thank you!"

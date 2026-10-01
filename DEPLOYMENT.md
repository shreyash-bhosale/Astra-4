# ResolveAI Deployment Guide

This guide details step-by-step instructions for deploying ResolveAI to production for hackathon submission using **Vercel** (Frontend), **Render / Railway** (Backend), and **Supabase** (Database).

---

## 1. Supabase Database Setup

1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Select your project (or create a new one).
3. Navigate to **SQL Editor** from the left navigation.
4. Open or copy the contents of [`supabase-schema.sql`](./supabase-schema.sql).
5. Paste it into the SQL editor and click **Run**.
6. Verify that the following 9 tables are created:
   * `users`
   * `customers`
   * `orders`
   * `policies`
   * `tickets`
   * `agent_runs`
   * `agent_steps`
   * `approvals`
   * `audit_logs`

---

## 2. Backend Deployment (Render or Railway)

### Option A: Deploy on Render
1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Connect your GitHub repository: `shreyash-bhosale/Astra-4`.
4. Configure the service:
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   * `PORT`: `5001` (or Render will assign one)
   * `JWT_SECRET`: `[generate a secure random 32-character string]`
   * `GEMINI_API_KEY`: `[your Google AI Studio key]`
   * `NEXT_PUBLIC_SUPABASE_URL`: `[your Supabase URL]`
   * `SUPABASE_SERVICE_ROLE_KEY`: `[your Supabase Service Role key]`
   * `FRONTEND_URL`: `[your deployed Vercel frontend URL]`
6. Click **Deploy Web Service**.
7. Note down your public backend URL (e.g., `https://resolveai-backend.onrender.com`).
8. Verify health check: `https://resolveai-backend.onrender.com/api/health`.

---

## 3. Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** → **Project**.
2. Import the GitHub repository: `shreyash-bhosale/Astra-4`.
3. In the project configuration:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Click "Edit" and select `frontend`.
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   * `VITE_API_BASE_URL`: `https://your-backend-url.onrender.com/api` (or your local URL for testing).
5. Click **Deploy**.
6. Vercel will build and deploy the frontend with `vercel.json` handling client-side SPA routing rewrites.

---

## 4. Verification Checklist Before Submission

- [ ] Visit the deployed frontend URL: Landing page loads with 3D liquid-metal hero.
- [ ] Click "Launch ResolveAI Demo": Automatically signs in as Sarah Connor (Support Agent).
- [ ] Case `#tkt-001` (Elena Rostova, Damaged Headphones) loads.
- [ ] Click "Run ResolveAI": Multi-agent execution progresses through Triage, Investigation, Policy, and pauses at the Approval Gate.
- [ ] Click "Authorize Action & Resume": Workflow completes, provisions replacement, generates customer response, and verifies resolution.
- [ ] Inspect Audit Timeline: All timestamps and agent thoughts are persisted.
- [ ] Ensure `.env` and `.env.local` are not committed to GitHub.

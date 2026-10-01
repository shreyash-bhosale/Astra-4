-- ==============================================================================
-- ResolveAI — Complete Supabase PostgreSQL Schema with User & Customer Portal
-- Compatible with Supabase SQL Editor
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE USERS & PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'agent', 'manager', 'admin')),
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  voice_updates_enabled BOOLEAN DEFAULT FALSE,
  voice_update_frequency TEXT DEFAULT 'important' CHECK (voice_update_frequency IN ('all', 'important', 'emergency')),
  voice_call_start TEXT DEFAULT '09:00',
  voice_call_end TEXT DEFAULT '21:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all customer columns exist if table was already created
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_updates_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_update_frequency TEXT DEFAULT 'important';
ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_call_start TEXT DEFAULT '09:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_call_end TEXT DEFAULT '21:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==============================================================================
-- 3. CUSTOMERS (CRM & PORTAL LINK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  tier TEXT DEFAULT 'Standard',
  company TEXT DEFAULT 'Individual Consumer',
  voice_updates_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS voice_updates_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- ==============================================================================
-- 4. ORDERS TABLE (Customer Portal Access)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'DELIVERED',
  order_date TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  tracking_number TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ==============================================================================
-- 5. POLICIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TICKETS / ISSUES TABLE (Customer Issue Reporting & Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  assigned_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  internal_notes JSONB DEFAULT '[]'::jsonb,
  resolution_summary TEXT,
  customer_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ==============================================================================
-- 7. AGENT RUNS & STEPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  objective TEXT,
  risk_level TEXT DEFAULT 'low',
  plan JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_ticket ON agent_runs(ticket_id);

CREATE TABLE IF NOT EXISTS agent_steps (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES agent_runs(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  requires_approval BOOLEAN DEFAULT FALSE,
  dependencies JSONB DEFAULT '[]'::jsonb,
  input JSONB,
  output JSONB,
  logs TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_steps_run ON agent_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_steps_ticket ON agent_steps(ticket_id);

-- ==============================================================================
-- 8. APPROVALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  run_id TEXT REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  evidence JSONB,
  requested_by TEXT NOT NULL,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_ticket ON approvals(ticket_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- ==============================================================================
-- 9. AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  agent TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ticket ON audit_logs(ticket_id);

-- ==============================================================================
-- 10. EMAIL NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS email_notifications (
  id TEXT PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  attempt_count INT DEFAULT 1,
  error_message TEXT,
  idempotency_key TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_ticket ON email_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_customer ON email_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_idempotency ON email_notifications(idempotency_key);

-- ==============================================================================
-- 11. SUPABASE ROW LEVEL SECURITY (RLS) FOR USER & CUSTOMER PORTAL
-- ==============================================================================

-- Enable RLS across portal tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. USERS POLICIES
-- ------------------------------------------------------------------------------
-- Customers can view their own profile
CREATE POLICY "Customers view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id OR auth.jwt() ->> 'email' = email);

-- Customers can update their own personal info & voice preferences (cannot change role)
CREATE POLICY "Customers update own preferences"
  ON users FOR UPDATE
  USING (auth.uid()::text = id OR auth.jwt() ->> 'email' = email)
  WITH CHECK (
    (auth.uid()::text = id OR auth.jwt() ->> 'email' = email)
    AND role = 'customer' -- Prevents privilege escalation
  );

-- Service role bypass for backend operations
CREATE POLICY "Service role full access on users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- B. CUSTOMERS TABLE POLICIES
-- ------------------------------------------------------------------------------
-- Customers view their own CRM profile
CREATE POLICY "Customers view own customer record"
  ON customers FOR SELECT
  USING (
    email = auth.jwt() ->> 'email'
    OR user_id = auth.uid()::text
  );

-- Service role full access
CREATE POLICY "Service role full access on customers"
  ON customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- C. ORDERS POLICIES (Portal Order History)
-- ------------------------------------------------------------------------------
-- Customers only view their own orders
CREATE POLICY "Customers view own orders"
  ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE email = auth.jwt() ->> 'email' OR user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- D. TICKETS POLICIES (Portal Issues)
-- ------------------------------------------------------------------------------
-- Customers can view only their own tickets
CREATE POLICY "Customers view own tickets"
  ON tickets FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE email = auth.jwt() ->> 'email' OR user_id = auth.uid()::text
    )
  );

-- Customers can submit new issues/tickets for themselves
CREATE POLICY "Customers create own tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE email = auth.jwt() ->> 'email' OR user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "Service role full access on tickets"
  ON tickets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- E. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
-- Customers can view notifications addressed to them
CREATE POLICY "Customers view own notifications"
  ON email_notifications FOR SELECT
  USING (
    recipient = auth.jwt() ->> 'email'
    OR customer_id IN (
      SELECT id FROM customers
      WHERE email = auth.jwt() ->> 'email' OR user_id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "Service role full access on email_notifications"
  ON email_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure agent_runs has error_message and tool_calls columns if present
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS verification_result JSONB;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS recovery_attempts INT DEFAULT 0;

-- Ensure approvals has decision_type, decision_maker, rejection_reason
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS decision_type TEXT;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS decision_maker TEXT;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ==============================================================================
-- 12. AUTONOMY SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS autonomy_settings (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE,
  paused BOOLEAN DEFAULT FALSE,
  emergency_stopped BOOLEAN DEFAULT FALSE,
  enabled_by TEXT,
  enabled_at TIMESTAMPTZ,
  approval_mode TEXT DEFAULT 'HYBRID',
  autonomous_approvals_enabled BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}'::jsonb,
  refund_limit NUMERIC DEFAULT 1000,
  max_retries INT DEFAULT 2,
  allowed_tools JSONB DEFAULT '[]'::jsonb,
  restricted_tools JSONB DEFAULT '[]'::jsonb,
  risk_policy JSONB DEFAULT '{}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE autonomy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on autonomy_settings"
  ON autonomy_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 13. SUPERVISOR EVENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS supervisor_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supervisor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on supervisor_events"
  ON supervisor_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 14. AGENT HEALTH TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_health (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT,
  status TEXT DEFAULT 'HEALTHY',
  state TEXT DEFAULT 'ONLINE',
  execution_count INT DEFAULT 0,
  last_task TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_health"
  ON agent_health FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


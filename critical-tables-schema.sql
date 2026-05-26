-- XMRT DAO Suite - Critical Tables for SQLite Migration
-- Generated: 2026-05-26
-- Task 3/4: Migration Sprint

-- ── AGENT CERTIFICATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_certifications (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  cert_tier TEXT NOT NULL,
  cert_id TEXT UNIQUE,
  issued_at DATETIME,
  expires_at DATETIME,
  modules_passed INTEGER DEFAULT 0,
  metadata TEXT
);

-- ── AGENT REGISTRY ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_registry (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  status TEXT DEFAULT 'online',
  capabilities TEXT,
  endpoint_url TEXT,
  last_heartbeat DATETIME,
  metadata TEXT
);

-- ── FLEET MESSAGES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fleet_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  from_agent TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fleet_topic ON fleet_messages(topic);
CREATE INDEX IF NOT EXISTS idx_fleet_timestamp ON fleet_messages(timestamp);

-- ── KNOWLEDGE PAGES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  tags TEXT,
  visibility TEXT DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- ── PFP LEADS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  event_type TEXT,
  event_date DATE,
  event_time TEXT,
  duration_hours INTEGER,
  venue_name TEXT,
  venue_address TEXT,
  package_name TEXT,
  base_price REAL,
  addons TEXT,
  total_price REAL,
  payment_link TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'new',
  deposit_paid BOOLEAN DEFAULT FALSE,
  balance_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  template_choice TEXT,
  source TEXT DEFAULT 'website',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── PFP BOOKINGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  event_type TEXT,
  event_date DATE,
  venue_name TEXT,
  package_name TEXT,
  base_price REAL,
  deposit_amount REAL,
  balance_due REAL,
  deposit_paid BOOLEAN DEFAULT FALSE,
  balance_paid BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'confirmed',
  stripe_session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── AGENT TASKS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  assigned_to TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metadata TEXT
);

-- ── CRON JOBS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,
  prompt TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at DATETIME,
  next_run_at DATETIME,
  last_status TEXT,
  metadata TEXT
);

-- ── USER SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_key TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  metadata TEXT
);

-- ── SEED DATA (Optional) ──────────────────────────────────
-- Insert current fleet agents
INSERT OR IGNORE INTO agent_certifications (id, agent_name, cert_tier, cert_id, modules_passed)
VALUES 
  ('1', 'Hermes', 'graduate', 'XMRT-CERT-RMJTYENN', 6),
  ('2', 'Alice', 'graduate', 'XMRT-CERT-8H3ZYAED', 6),
  ('3', 'Vex', 'master', 'XMRT-CERT-MASTER', 6);

INSERT OR IGNORE INTO agent_registry (id, agent_name, status, capabilities)
VALUES
  ('1', 'Hermes', 'online', '["fleet-coordination","mesh-ops","supabase-edge-functions"]'),
  ('2', 'Alice', 'online', '["brand_management","content_review"]'),
  ('3', 'Vex', 'online', '["fleet-orchestration","task-assignment"]');


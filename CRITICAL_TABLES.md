# Critical Database Tables for SQLite Migration

## Analysis: 296 Tables → 9 Critical Tables

Based on function dependency analysis (Task 1/4), most functions use Supabase for:
1. **Agent identity** (certifications, registry)
2. **Fleet communication** (messages, tasks)
3. **Knowledge storage** (pages, context)
4. **Business data** (PFP leads/bookings)
5. **Automation** (cron jobs, scheduled actions)

---

## ✅ CRITICAL TABLES (Migrate to SQLite)

### 1. agent_certifications
```sql
CREATE TABLE agent_certifications (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  cert_tier TEXT NOT NULL,  -- 'undergrad', 'graduate', 'master'
  cert_id TEXT UNIQUE,      -- e.g., 'XMRT-CERT-RMJTYENN'
  issued_at DATETIME,
  expires_at DATETIME,
  modules_passed INTEGER DEFAULT 0,
  metadata TEXT  -- JSON
);
```
**Used by:** xmrt-university, agent-registry, gossip-hub auth
**Priority:** P0 - Fleet identity

### 2. agent_registry
```sql
CREATE TABLE agent_registry (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  status TEXT DEFAULT 'online',  -- 'online', 'offline', 'degraded'
  capabilities TEXT,  -- JSON array
  endpoint_url TEXT,
  last_heartbeat DATETIME,
  metadata TEXT  -- JSON
);
```
**Used by:** fleet-coordination, gossip-hub, system-status
**Priority:** P0 - Fleet operations

### 3. fleet_messages
```sql
CREATE TABLE fleet_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,  -- 'fleet-broadcast', 'agent-tasks', etc.
  from_agent TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered INTEGER DEFAULT 0
);
CREATE INDEX idx_topic ON fleet_messages(topic);
CREATE INDEX idx_timestamp ON fleet_messages(timestamp);
```
**Used by:** gossip-hub, agent-tasks, fleet-broadcast
**Priority:** P0 - Fleet communication

### 4. knowledge_pages
```sql
CREATE TABLE knowledge_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,  -- Markdown
  tags TEXT,  -- JSON array
  visibility TEXT DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
```
**Used by:** knowledge-manager, AI context builders
**Priority:** P1 - Agent memory

### 5. leads (PartyFavorPhoto)
```sql
CREATE TABLE leads (
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
  addons TEXT,  -- JSON array
  total_price REAL,
  payment_link TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'new',  -- 'new', 'contacted', 'converted', 'lost'
  deposit_paid BOOLEAN DEFAULT FALSE,
  balance_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  template_choice TEXT,
  source TEXT DEFAULT 'website',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**Used by:** pfp-booking, pfp-dashboard
**Priority:** P0 - Business revenue

### 6. bookings (PartyFavorPhoto)
```sql
CREATE TABLE bookings (
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
  status TEXT DEFAULT 'confirmed',  -- 'confirmed', 'in_progress', 'completed', 'cancelled'
  stripe_session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**Used by:** pfp-booking, pfp-dashboard
**Priority:** P0 - Business revenue

### 7. agent_tasks
```sql
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  assigned_to TEXT NOT NULL,  -- agent name
  task_title TEXT NOT NULL,
  task_description TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metadata TEXT  -- JSON
);
```
**Used by:** task-orchestrator, fleet-coordination
**Priority:** P1 - Work coordination

### 8. cron_jobs
```sql
CREATE TABLE cron_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,  -- cron expression or 'every 1h'
  prompt TEXT,  -- task description
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at DATETIME,
  next_run_at DATETIME,
  last_status TEXT,
  metadata TEXT  -- JSON
);
```
**Used by:** cron-proxy, hourly-task-fetcher
**Priority:** P1 - Automation

### 9. user_sessions (optional)
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_key TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  metadata TEXT  -- JSON
);
```
**Used by:** chat functions, user context
**Priority:** P2 - Can use in-memory if needed

---

## ❌ TABLES TO SKIP (Ephemeral/Recreatable)

| Table | Reason | Alternative |
|-------|--------|-------------|
| function_logs | Ephemeral logs | Console/file logging |
| execution_history | Analytics only | Optional metrics DB |
| device_metrics | IoT-specific | Separate IoT DB |
| github_*_sync | Cache data | Re-sync from GitHub API |
| sync_* | Mirror tables | Live API calls |
| test_* | Testing only | N/A |
| temp_* | Temporary | N/A |
| vector_* | Embeddings | Use external vector DB |
| telemetry_* | Monitoring | Prometheus/external |

---

## Migration Strategy

### Phase 1: Core Fleet (4 tables)
1. agent_certifications
2. agent_registry
3. fleet_messages
4. agent_tasks

**Why:** Enables fleet operations without Supabase

### Phase 2: Business Data (2 tables)
5. leads
6. bookings

**Why:** Revenue-critical for PFP

### Phase 3: Supporting (3 tables)
7. knowledge_pages
8. cron_jobs
9. user_sessions

**Why:** Enhances functionality but not blocking

---

## SQLite Setup Script

```bash
# Create database
sqlite3 local-db/suite.sqlite < critical-tables-schema.sql

# Verify
sqlite3 local-db/suite.sqlite ".tables"
sqlite3 local-db/suite.sqlite "SELECT COUNT(*) FROM agent_certifications;"
```

---

**Total:** 9 critical tables (out of 296)
**Reduction:** 97% table reduction
**SQLite file size estimate:** <10 MB


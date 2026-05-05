-- SupaClaw DenoClaw Schema
-- Apply via Supabase Dashboard > SQL Editor > New Query
-- Supports: agent_tasks, task_operations, documents bucket, realtime, RLS

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────
-- 1. Agent Tasks (DenoClaw orchestration root)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','decomposed','queued','running','checkpoint','completed','failed','cancelled')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- DenoClaw execution metadata
  checkpoint JSONB DEFAULT NULL,
  continuation_token TEXT DEFAULT NULL,
  burst_count INTEGER NOT NULL DEFAULT 0,
  max_bursts INTEGER NOT NULL DEFAULT 100,
  
  -- Routing / assignment
  assigned_function TEXT,
  target_region TEXT DEFAULT 'us-east-1',
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_checkpoint_at TIMESTAMPTZ,
  estimated_duration_sec INTEGER,
  
  -- Context
  context JSONB DEFAULT '{}',
  result JSONB DEFAULT NULL,
  error_message TEXT,
  
  -- Request tracing
  request_id UUID,
  parent_task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  
  -- Ownership
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created ON agent_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_parent ON agent_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_continuation ON agent_tasks(continuation_token);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_checkpoint ON agent_tasks(last_checkpoint_at);

-- ───────────────────────────────────────────────
-- 2. Task Operations (individual steps within a task)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tool / function invoked
  tool_name TEXT NOT NULL,
  tool_args JSONB DEFAULT '{}',
  
  -- Execution state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','skipped')),
  result JSONB DEFAULT NULL,
  error TEXT,
  
  -- Performance
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Retry logic
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  
  -- Sequence within task
  depends_on UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_operations_task ON task_operations(task_id);
CREATE INDEX IF NOT EXISTS idx_task_operations_status ON task_operations(status);
CREATE INDEX IF NOT EXISTS idx_task_operations_step ON task_operations(task_id, step_number);

-- ───────────────────────────────────────────────
-- 3. Documents bucket (for PDF operations)
-- ───────────────────────────────────────────────
-- Storage buckets are created via Storage API; this is the SQL backing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/zip', 'application/json'])
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────
-- 4. Realtime publication
-- ───────────────────────────────────────────────
BEGIN;
  -- Drop if exists to avoid conflicts
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE agent_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_operations;

-- ───────────────────────────────────────────────
-- 5. RLS Policies (row-level security)
-- ───────────────────────────────────────────────
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_operations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY agent_tasks_select_own
  ON agent_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY agent_tasks_insert_own
  ON agent_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY agent_tasks_update_own
  ON agent_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY agent_tasks_delete_own
  ON agent_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Operations visible if parent task is visible
CREATE POLICY task_operations_select_via_task
  ON task_operations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_tasks
      WHERE agent_tasks.id = task_operations.task_id
        AND agent_tasks.user_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────
-- 6. Helper Functions
-- ───────────────────────────────────────────────

-- Get task tree recursively
CREATE OR REPLACE FUNCTION get_task_tree(root_task_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  depth INTEGER,
  path UUID[]
) LANGUAGE SQL STABLE AS $$
  WITH RECURSIVE tree AS (
    SELECT id, title, status, 0 AS depth, ARRAY[id] AS path
    FROM agent_tasks WHERE id = root_task_id
    UNION ALL
    SELECT t.id, t.title, t.status, tree.depth + 1, tree.path || t.id
    FROM agent_tasks t
    JOIN tree ON t.parent_task_id = tree.id
  )
  SELECT * FROM tree;
$$;

-- Update task status with timestamp side-effects
CREATE OR REPLACE FUNCTION update_task_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'running' AND OLD.status = 'pending' THEN
    NEW.started_at := NOW();
  END IF;
  IF NEW.status IN ('completed','failed','cancelled') AND OLD.status NOT IN ('completed','failed','cancelled') THEN
    NEW.completed_at := NOW();
  END IF;
  IF NEW.status = 'checkpoint' THEN
    NEW.last_checkpoint_at := NOW();
    NEW.burst_count := OLD.burst_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_task_status ON agent_tasks;
CREATE TRIGGER trg_task_status
  BEFORE UPDATE OF status ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status();

-- ───────────────────────────────────────────────
-- 7. DenoClaw Cron (resumes checkpointed tasks)
-- ────────────────────────────────────────────
-- Supabase cron runs every 55 seconds to trigger continuation
SELECT cron.schedule(
  'denoclaw-continue-checkpoints',
  '*/1 * * * *',
  $$
    SELECT net.http_post(
      url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/denoclaw'),
      headers := jsonb_build_object(
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('action', 'continue', 'maxTasks', 10)
    ) AS request_id;
  $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ───────────────────────────────────────────────
-- 8. Seed Data (optional demo rows)
-- ───────────────────────────────────────────────
-- Uncomment below to seed demo tasks for the dashboard preview
-- INSERT INTO agent_tasks (title, description, status, priority, assigned_function, context, result)
-- VALUES
--   ('Q3 Mining Contract Signature', 'Auto-sign and watermark quarterly mining agreements', 'completed', 8, 'pdf-handler', '{"document": "mining-q3.pdf"}'::jsonb, '{"signed": true, "txHash": "0xabc..."}'::jsonb),
--   ('MESHNET Node Sync', 'Synchronize peer state across offline-first mining mesh', 'running', 9, 'meshnet-node', '{"region": "us-west", "peers": 47}'::jsonb, null),
--   ('Worker Registration Batch', 'Onboard 312 XMRT workers to pool.supportxmr.com', 'checkpoint', 7, 'worker-manager', '{"count": 312, "pool": "supportxmr.com"}'::jsonb, '{"registered": 298}'::jsonb),
--   ('Treasury Rebalance', 'Reallocate 5% yield across ETH/Sepolia vaults', 'pending', 6, 'treasury-ops', '{"targetApy": 0.05}'::jsonb, null);

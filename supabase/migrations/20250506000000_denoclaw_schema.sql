-- ==========================================
-- DenoClaw / SupaClaw Database Schema
-- Agent task orchestration tables for Supabase Edge Functions
-- ==========================================

-- Agent tasks table: top-level task tracking
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'decomposed', 'running', 'checkpoint', 'completed', 'failed', 'cancelled')),
    objective TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    priority INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error TEXT,
    result JSONB,
    parent_task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    checkpoint_data JSONB,

    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10)
);

-- Task operations table: individual operations within a task
CREATE TABLE IF NOT EXISTS task_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    sequence INT NOT NULL,
    op_type TEXT NOT NULL,
    input JSONB DEFAULT '{}',
    output JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time_ms INT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 2,

    UNIQUE (task_id, sequence)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_updated_at ON agent_tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_parent ON agent_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_operations_task_id ON task_operations(task_id);
CREATE INDEX IF NOT EXISTS idx_task_operations_status ON task_operations(status);

-- RLS policies
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_operations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on agent_tasks"
    ON agent_tasks FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on task_operations"
    ON task_operations FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own tasks
CREATE POLICY "Users can read their own tasks"
    ON agent_tasks FOR SELECT
    USING (agent_id = auth.uid()::text OR auth.role() = 'service_role');

-- Trigger to update updated_at on task changes
CREATE OR REPLACE FUNCTION update_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_timestamp ON agent_tasks;
CREATE TRIGGER trigger_update_task_timestamp
    BEFORE UPDATE ON agent_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_timestamp();

-- Storage bucket for PDF documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

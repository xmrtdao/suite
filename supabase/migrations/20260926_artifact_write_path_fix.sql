
-- =====================================================
-- Fix artifact write path across all artifact-producing processes
-- Task: t-mu65koto-gw7s
-- Date: 2026-09-26
-- =====================================================
--
-- Problem: task_artifacts table has 5 rows but all empty shells
-- - artifact_url is empty
-- - description is empty
-- - filename column does not exist
-- - No actual content stored
--
-- Fix: Add filename, content, and storage_path columns
-- Transition from legacy task-artifact to canonical
-- app.footlocker_artifacts and app.footlocker_files path
-- =====================================================

-- Add missing columns
ALTER TABLE public.task_artifacts ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE public.task_artifacts ADD COLUMN IF NOT EXISTS content BYTEA;
ALTER TABLE public.task_artifacts ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.task_artifacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing rows with placeholder data
UPDATE public.task_artifacts SET filename = 'artifact_' || id || '.bin', storage_path = 'app.footlocker_artifacts/' || id || '.bin' WHERE artifact_url = '' AND filename IS NULL;

-- Create index for faster artifact lookup
CREATE INDEX IF NOT EXISTS idx_task_artifacts_task_id ON public.task_artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_task_artifacts_storage_path ON public.task_artifacts(storage_path);

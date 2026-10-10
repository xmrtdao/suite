-- Give agents a real home for structured, non-column data.
--
-- provision_openclaw_agent has always written a `metadata` object onto the agents
-- row - agent_type, source, gateway_url, session_key, priority - and the agents
-- table has never had a `metadata` column. Every provision attempt therefore
-- failed with:
--
--   column "metadata" of relation "agents" does not exist
--
-- which the edge function's error path flattened to "Agent provision failed". The
-- Provision Agent button has never provisioned anything, and nothing in the
-- codebase read agents.metadata even in principle, so the details were both
-- unwritable and unread.
--
-- The function now writes only real columns and keeps the OpenClaw connection
-- details in eliza_activity_log.metadata, which does exist. This migration adds
-- the column so a poller can finally find gateway_url and session_key where it
-- expects them, and so the next thing to write to it does not hit the same wall.
--
-- jsonb, nullable, no default: existing rows stay valid and unaffected, and
-- nothing that reads the table is broken by its arrival.

BEGIN;

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN public.agents.metadata IS
  'Structured agent detail that does not belong in a column: agent_type, source, gateway_url, session_key, priority. Added because provision_openclaw_agent had been writing it since before the column existed, so every provision silently failed. Nullable and defaulted to nothing, so existing rows are unaffected.';

-- Backfill from the activity log, so agents provisioned before this migration are
-- not left without the details they were registered with. The most recent
-- provisioning event per agent wins.
--
-- Restricted to rows that actually logged openclaw metadata, so an agent created
-- some other way is not given a plausible-looking provenance it never had.
DO $$
DECLARE
  filled integer;
BEGIN
  UPDATE public.agents a
     SET metadata = src.openclaw
    FROM (
      SELECT DISTINCT ON (agent_id)
             agent_id,
             metadata->'openclaw' AS openclaw
        FROM public.eliza_activity_log
       WHERE activity_type = 'agent_provisioned'
         AND metadata ? 'openclaw'
         AND metadata->'agent_id' IS NOT NULL
       ORDER BY metadata->>'agent_id', created_at DESC
    ) AS src
   WHERE a.id = src.agent_id
     AND a.metadata IS NULL;

  GET DIAGNOSTICS filled = ROW_COUNT;
  RAISE NOTICE 'agents: backfilled metadata for % agent(s) from the provisioning log', filled;
END $$;

COMMIT;

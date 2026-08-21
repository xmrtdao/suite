-- Contextual Intelligence Layer: explicit/inferred context profiles + session snapshots
-- Non-breaking: additive schema only.

CREATE TABLE IF NOT EXISTS public.user_context_profiles (
  user_id uuid PRIMARY KEY,
  default_context text NOT NULL DEFAULT 'General',
  allowed_contexts text[] NOT NULL DEFAULT ARRAY['General']::text[],
  context_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.context_session_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid NULL,
  context_name text NOT NULL,
  source text NOT NULL DEFAULT 'fallback',
  inference_confidence numeric(4,3) NOT NULL DEFAULT 0.500,
  signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT context_session_snapshots_unique_session UNIQUE (session_id),
  CONSTRAINT context_session_snapshots_source_check CHECK (source IN ('explicit', 'directive', 'stored', 'profile', 'inferred', 'fallback')),
  CONSTRAINT context_session_snapshots_confidence_check CHECK (inference_confidence >= 0 AND inference_confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_context_session_snapshots_user_id ON public.context_session_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_context_session_snapshots_context_name ON public.context_session_snapshots (context_name);
CREATE INDEX IF NOT EXISTS idx_context_session_snapshots_updated_at ON public.context_session_snapshots (updated_at DESC);

CREATE OR REPLACE FUNCTION public.update_context_layer_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_context_profiles_updated_at ON public.user_context_profiles;
CREATE TRIGGER user_context_profiles_updated_at
  BEFORE UPDATE ON public.user_context_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_context_layer_updated_at();

DROP TRIGGER IF EXISTS context_session_snapshots_updated_at ON public.context_session_snapshots;
CREATE TRIGGER context_session_snapshots_updated_at
  BEFORE UPDATE ON public.context_session_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_context_layer_updated_at();

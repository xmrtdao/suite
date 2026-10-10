-- Convert stored certificate tokens from plaintext to hashes.
--
-- agent_certifications.jwt_hash was declared as "Hash of the issued JWT for
-- verification" and the edge function stored the JWT itself. Fourteen live
-- bearer credentials were therefore sitting in this table in plaintext - each one
-- carrying fleet:read, fleet:write, mine and vote - under a column name that
-- told a reader there was nothing to see.
--
-- Nothing reads this column. `verify` looks a certificate up by agent_id or
-- certificate_id and checks expiry plus unresolved security flags; it never
-- compares a presented token. So replacing the value with its hash breaks
-- nothing, and the credentials stop existing anywhere they do not need to.
--
-- The predicate is "looks like a JWT" - exactly two dots. That makes the
-- backfill idempotent: a second run finds 64-character hex digests, which have
-- no dots, and changes nothing. It also means a genuine hash is never
-- double-hashed, which would silently break any future token comparison.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  converted integer;
BEGIN
  UPDATE public.agent_certifications
     SET jwt_hash = encode(digest(jwt_hash, 'sha256'), 'hex')
   -- Two dots: header.payload.signature. A sha256 hex digest has none.
   WHERE jwt_hash LIKE '%.%.%'
     AND length(jwt_hash) > 100;

  GET DIAGNOSTICS converted = ROW_COUNT;
  RAISE NOTICE 'agent_certifications: hashed % previously-plaintext token(s)', converted;
END $$;

COMMENT ON COLUMN public.agent_certifications.jwt_hash IS
  'SHA-256 hex digest of the issued certificate JWT. Never the token itself: this is a bearer credential carrying fleet:read/write/mine/vote, and storing it verbatim puts a usable impersonation token in the database. The token is returned to the agent once, at issue.';

-- Prove the invariant rather than assert it, so a future change that writes the
-- token back is caught here rather than by an auditor.
DO $$
DECLARE
  leaked text;
BEGIN
  SELECT string_agg(agent_id, ', ') INTO leaked
    FROM public.agent_certifications
   WHERE jwt_hash LIKE '%.%.%';
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'agent_certifications still holds a plaintext token for: %', leaked;
  END IF;
END $$;

COMMIT;

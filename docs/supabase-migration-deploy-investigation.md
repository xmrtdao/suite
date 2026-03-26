# Supabase migration auto-deploy investigation (March 26, 2026)

## Findings

1. **Current GitHub automation only deploys Supabase on `main`**
   - `.github/workflows/deploy-edge-functions.yml` triggers on pushes to `main` only.
   - If your team primarily merges to/pushes `develop`, Supabase migrations never auto-apply from CI.

2. **Dev environment is not wired for automatic Supabase deployment**
   - Existing workflow uses `SUPABASE_PROJECT_ID` + `SUPABASE_DB_PASSWORD` and `environment: production`.
   - There was no separate dev workflow using dev secrets/project ref.

3. **Deleted migration files did exist in history**
   - Commit `0dcb04a386ced6502cfc1676ddd7ccbe81efa8fd` deleted:
     - `supabase/migrations/20251104195151_31bb87a6-855d-4a65-8b29-908a957c4e97.sql`
     - `supabase/migrations/20251104200836_81e3019d-0a71-411a-9e1a-3ab9235d4ae4.sql`
   - Those changes are now restored as an idempotent migration so environments that missed them can self-heal.

4. **Important location clarification**
   - Database migrations should live in `supabase/migrations/*.sql`.
   - `supabase/functions/_shared` is for shared Edge Function TypeScript code, not schema migration files.

## What was changed

- Added `.github/workflows/deploy-supabase-dev.yml`:
  - Runs on `develop` for `supabase/**` changes.
  - Uses dev secrets: `SUPABASE_DEV_PROJECT_ID`, `SUPABASE_DEV_DB_PASSWORD`.
  - Executes `supabase db push` + edge function deploys.

- Added `supabase/migrations/20260326000100_restore_deleted_communication_and_feedback_migrations.sql`:
  - Recreates `communication_logs` + `communication_rate_limits` objects and policies.
  - Reapplies `executive_feedback` rename/columns/comments updates.
  - Uses idempotent patterns (`IF NOT EXISTS`, guarded `DO $$ ... $$`).

## Required GitHub secrets for dev auto-deploy

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DEV_PROJECT_ID`
- `SUPABASE_DEV_DB_PASSWORD`

If these are missing, the dev workflow will skip deploy and report why in the summary step.

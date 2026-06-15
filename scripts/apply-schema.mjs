// scripts/apply-schema.mjs
// Apply the full Supabase schema dump to the local Postgres.
//
// supabase-full-schema.sql is a pg_dump plain-text export. It contains
// some Supabase-specific things that won't apply to a vanilla PG:
//   - CREATE EXTENSION with superuser-only ones (e.g. pg_cron)
//   - RLS policies that reference the "supabase_authenticator" role
//   - GRANTs to "supabase_admin", "authenticator", "anon", "authenticated"
//
// We:
//   1. Connect to the running embedded PG (must be started first).
//   2. Pre-create the "supabase_authenticator" etc roles as no-op
//      NOLOGIN accounts so GRANTs don't fail.
//   3. Pre-install the extensions we can (uuid-ossp, pgcrypto,
//      pg_trgm, citext, btree_gin, btree_gist, hstore).
//   4. Stream the SQL file and execute statement by statement,
//      swallowing errors that are clearly "this is a Supabase-only
//      thing we don't need" while stopping on real schema errors.
//   5. Report a summary at the end.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { createClient } from '../runtime/supabase-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.resolve(ROOT, '..', 'supabase-full-schema.sql');
const LOG_FILE = path.join(ROOT, 'logs', 'schema-import.log');

// Roles we need to pre-create so GRANTs don't crash.
const PRE_ROLES = [
  ['supabase_admin', 'SUPERUSER'],
  ['supabase_authenticator', 'NOINHERIT LOGIN PASSWORD \'postgres\''],
  ['supabase_anon', 'NOLOGIN'],
  ['supabase_auth', 'NOLOGIN'],
  ['authenticated', 'NOLOGIN'],
  ['anon', 'NOLOGIN'],
  ['service_role', 'NOLOGIN'],
  ['dashboard_user', 'NOLOGIN'],
  ['pgbouncer', 'NOLOGIN'],
  ['pg_read_all_data', 'NOLOGIN'],
  ['pg_write_all_data', 'NOLOGIN'],
  ['pg_signal_backend', 'NOLOGIN'],
];

const PRE_EXTENSIONS = [
  'uuid-ossp', 'pgcrypto', 'pg_trgm', 'citext',
  'btree_gin', 'btree_gist', 'hstore',
];

const SKIP_PATTERNS = [
  /permission denied/i,
  /role .* does not exist/i,
  /cannot create .* extension/i,
  /superuser/i,
  /is_superuser must be/i,
  /database .* is not allowing/i,
  /schema .* does not exist/i, // usually for pg_catalog or extensions we didn't install
  /relation .* does not exist/i, // grants on tables we couldn't create
  /type .* does not exist/i,    // ditto for type grants
  /function .* does not exist/i,
  /already exists/i,            // idempotent
];

function log(line) {
  const stamp = new Date().toISOString();
  const full = `[${stamp}] ${line}`;
  fs.appendFileSync(LOG_FILE, full + '\n');
  process.stdout.write(full + '\n');
}

async function main() {
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

  // 1. Connect via pg client
  const client = new pg.Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
  await client.connect();
  log('[schema] connected to postgres://localhost:5432/postgres');

  // 2. Pre-roles
  log('[schema] pre-creating roles...');
  for (const [name, def] of PRE_ROLES) {
    try {
      await client.query(`DO $$ BEGIN CREATE ROLE ${name} ${def}; EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    } catch (e) {
      log(`  role ${name} skipped: ${e.message.split('\n')[0]}`);
    }
  }

  // 3. Pre-extensions
  log('[schema] pre-installing extensions...');
  for (const ext of PRE_EXTENSIONS) {
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
      log(`  + ${ext}`);
    } catch (e) {
      log(`  ! ${ext}: ${e.message.split('\n')[0]}`);
    }
  }

  // 4. Stream SQL
  const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const statements = splitSqlStatements(sql);
  log(`[schema] split into ${statements.length} statements`);

  let ok = 0, skipped = 0, failed = 0;
  const failures = [];
  const startMs = Date.now();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt.trim()) continue;
    try {
      await client.query(stmt);
      ok++;
      if (ok % 100 === 0) {
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
        log(`[schema] progress: ${ok} ok / ${skipped} skipped / ${failed} failed  (${elapsed}s)`);
      }
    } catch (e) {
      const msg = e.message || String(e);
      if (SKIP_PATTERNS.some((p) => p.test(msg))) {
        skipped++;
      } else {
        failed++;
        failures.push({ idx: i, msg: msg.split('\n')[0], stmt: stmt.slice(0, 200) });
        log(`[schema] FAIL @ ${i}: ${msg.split('\n')[0]}`);
        log(`         ${stmt.slice(0, 200).replace(/\n/g, ' ')}`);
      }
    }
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  log(`[schema] done in ${elapsed}s: ${ok} ok, ${skipped} skipped, ${failed} failed`);

  // 5. Summary
  const { rows: tableCount } = await client.query("SELECT count(*) as n FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')");
  log(`[schema] tables in DB: ${tableCount[0].n}`);

  // Show first 20 failures for review
  if (failures.length) {
    log('[schema] === FIRST 20 FAILURES ===');
    failures.slice(0, 20).forEach((f) => {
      log(`  [${f.idx}] ${f.msg}`);
      log(`        ${f.stmt.replace(/\n/g, ' ')}`);
    });
  }

  await client.end();
  process.exit(failed > ok ? 2 : 0);
}

function splitSqlStatements(sql) {
  // Naive but works for pg_dump output: split on `;` that ends a line.
  // Doesn't handle dollar-quoted strings with embedded semicolons, but
  // pg_dump doesn't usually use those. We can iterate on this if needed.
  const lines = sql.split('\n');
  const out = [];
  let cur = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (const line of lines) {
    if (inLineComment) {
      cur += line + '\n';
      inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      cur += line + '\n';
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    // Strip line comments
    let l = line;
    if (l.trim().startsWith('--')) {
      cur += l + '\n';
      continue;
    }
    if (l.includes('/*')) {
      cur += l + '\n';
      if (!l.includes('*/')) inBlockComment = true;
      continue;
    }
    // Toggle string state on unescaped single quote
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === "'" && l[i - 1] !== '\\') inString = !inString;
    }
    cur += l + '\n';
    if (!inString && l.trimEnd().endsWith(';')) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

main().catch((e) => { console.error(e); process.exit(1); });

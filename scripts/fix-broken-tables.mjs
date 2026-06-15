// scripts/fix-broken-tables.mjs
// The supabase-full-schema.sql dump has 116 tables with one of these bugs:
//
//   A. Duplicate column in PRIMARY KEY or UNIQUE constraint:
//        CREATE TABLE foo (
//          id uuid PRIMARY KEY,
//          ...
//          CONSTRAINT foo_pkey PRIMARY KEY (id, id)   -- duplicate
//        )
//   B. "syntax error at or near null" — caused by `DEFAULT null` (lowercase)
//      embedded in a column default expression that pg_dump mis-quotes.
//      The actual `DEFAULT null` is the same as `DEFAULT NULL`; we
//      already preprocessed that, so this is something else. Looking
//      at examples, it's `DEFAULT \`null\`` or `DEFAULT 'null'::text`
//      being misinterpreted, OR a column that has `DEFAULT` followed
//      by something on a new line. We can usually recover by rewriting
//      DEFAULT clauses that end in `null` (any casing) to NULL.
//   C. Hyphenated identifiers (XMRT-Subscribe) — already handled.
//
// Strategy: for each known-broken table, try a series of transformations
// and apply. If it loads, great. If not, log the residual SQL.
//
// Output: 116 transform attempts. We'll see how many recover.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.resolve(ROOT, '..', 'supabase-full-schema.sql');
const BROKEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'logs', 'broken-tables.json'), 'utf8'));
const OUTPUT_REPORT = path.join(ROOT, 'logs', 'broken-tables-recovery.json');

function preprocess(sql) {
  return sql
    .replace(/\bUSER-DEFINED\b/g, 'public.vector')
    .replace(/DEFAULT\s+null\b/gi, 'DEFAULT NULL')
    .replace(/NOT NULL null/gi, 'NOT NULL')
    .replace(/public\.(XMRT-[A-Za-z]+)/g, 'public."$1"');
}

function extractTableStmts(sql, tableNames) {
  // Find the CREATE TABLE statement(s) for a given table name.
  const statements = splitSql(sql);
  return statements.filter((s) => {
    const m = s.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?public\.["]?([a-zA-Z0-9_-]+)["]?/i);
    return m && tableNames.includes(m[1]);
  });
}

function sanitizeDuplicateConstraints(sql) {
  // Remove duplicate column references in CONSTRAINT clauses.
  // Pattern: CONSTRAINT name PRIMARY KEY (col, col)  ->  drop the constraint
  //           CONSTRAINT name UNIQUE (col, col)        ->  drop
  // We replace the second-and-later occurrence of the same column in
  // a single constraint with nothing.
  return sql.replace(
    /CONSTRAINT\s+("[^"]+"|[a-zA-Z0-9_]+)\s+(PRIMARY KEY|UNIQUE|FOREIGN KEY)\s*\(([^)]+)\)/gi,
    (full, name, type, cols) => {
      const seen = new Set();
      const dedupedCols = cols.split(',').map((c) => c.trim()).filter((c) => {
        if (seen.has(c)) return false;
        seen.add(c);
        return true;
      });
      if (dedupedCols.length === 1 && type.toUpperCase() === 'PRIMARY KEY') {
        // The first column is likely the actual PK; drop the redundant
        // CONSTRAINT entirely (the first column declaration often has
        // PRIMARY KEY inline).
        return '';
      }
      return `CONSTRAINT ${name} ${type} (${dedupedCols.join(', ')})`;
    }
  );
}

function fixNullDefaults(sql) {
  // Last-ditch: convert any remaining stray `null` literal that's
  // clearly a DEFAULT expression. Most already caught by preprocess.
  // The actual problem case in the dump is `DEFAULT 'null'::text`
  // being unescaped to `DEFAULT null::text` somehow. We can't really
  // fix that without re-quoting.
  // Strategy: if a column default contains unquoted `null` followed
  // by `::` (cast), wrap it in quotes.
  return sql.replace(/DEFAULT\s+null\s*::/gi, "DEFAULT 'null'::");
}

function tryLoad(c, sql) {
  return c.query(sql).then(() => true, (e) => ({ error: e.message.split('\n')[0] }));
}

async function main() {
  const raw = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const fixed = preprocess(raw);
  const c = new pg.Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
  await c.connect();

  const report = {};
  let recovered = 0;

  for (const tableName of BROKEN) {
    const candidates = extractTableStmts(fixed, [tableName]);
    if (candidates.length === 0) {
      report[tableName] = { status: 'no-candidate-stmt' };
      continue;
    }
    let lastErr = 'unknown';
    let ok = false;
    for (const stmt of candidates) {
      // Try in order:
      //   1. As-is (sometimes "already exists" error means a previous
      //      load succeeded but we couldn't re-load)
      //   2. After dedup-constraint sanitizer
      //   3. After null-default fixer + dedup
      //   4. As CREATE TABLE IF NOT EXISTS (no-op if exists)
      const attempts = [
        stmt,
        sanitizeDuplicateConstraints(stmt),
        fixNullDefaults(sanitizeDuplicateConstraints(stmt)),
        stmt.replace(/CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS '),
        sanitizeDuplicateConstraints(stmt).replace(/CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS '),
      ];
      for (const attempt of attempts) {
        const r = await tryLoad(c, attempt);
        if (r === true) {
          ok = true;
          lastErr = null;
          break;
        }
        lastErr = r.error;
      }
      if (ok) break;
    }
    report[tableName] = ok
      ? { status: 'recovered' }
      : { status: 'failed', lastError: lastErr };
    if (ok) recovered++;
  }
  console.log(`[fix-broken] recovered ${recovered} / ${BROKEN.length}`);

  // Recount tables
  const { rows } = await c.query("SELECT count(*) as n FROM information_schema.tables WHERE table_schema='public'");
  console.log(`[fix-broken] public tables now: ${rows[0].n}`);

  fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2));
  await c.end();
}

function splitSql(sql) {
  const lines = sql.split('\n');
  const out = [];
  let cur = '';
  let inString = false;
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inBlockComment) {
      cur += line + '\n';
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.trim().startsWith('--')) { cur += line + '\n'; continue; }
    if (line.includes('/*')) {
      cur += line + '\n';
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }
    for (let j = 0; j < line.length; j++) {
      if (line[j] === "'" && line[j - 1] !== '\\') inString = !inString;
    }
    cur += line + '\n';
    if (!inString && line.trimEnd().endsWith(';')) { out.push(cur); cur = ''; }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

main().catch((e) => { console.error(e); process.exit(1); });

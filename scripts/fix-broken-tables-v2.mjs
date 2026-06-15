// scripts/fix-broken-tables-v2.mjs
// More aggressive recovery for the 49 still-broken tables.
//
// Strategy:
//  1. For each table, extract its CREATE TABLE block from the dump.
//  2. Strip ALL CONSTRAINT clauses that reference the same column
//     twice (we already do this; the v1 sanitizer handles that).
//  3. Strip ALL column-level REFERENCES clauses (foreign keys) — the
//     49 failures often have inline FKs that reference tables that
//     don't exist, which can throw weird syntax errors during
//     constraint validation.
//  4. Drop the table-specific sequences that the dump also creates
//     but sometimes references before the table exists.
//  5. Try the result. If it still fails, fall back to a hand-written
//     minimal stub schema for the small set of tables that ai-chat
//     needs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.resolve(ROOT, '..', 'supabase-full-schema.sql');
const RECOVERY = path.join(ROOT, 'logs', 'broken-tables-recovery.json');
const RECOVERED_OUT = path.join(ROOT, 'logs', 'recovered-stmts.sql');

const FAILED = JSON.parse(fs.readFileSync(RECOVERY, 'utf8'));
const FAILING = Object.entries(FAILED).filter(([k, v]) => v.status !== 'recovered').map(([k]) => k);
console.log(`[fix-v2] retrying ${FAILING.length} tables`);

function extractTableStmts(sql, tableNames) {
  const stmts = splitSql(sql);
  return stmts.filter((s) => {
    const m = s.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?public\.["]?([a-zA-Z0-9_-]+)["]?/i);
    return m && tableNames.includes(m[1]);
  });
}

function preprocess(sql) {
  return sql
    .replace(/\bUSER-DEFINED\b/g, 'public.vector')
    .replace(/DEFAULT\s+null\b/gi, 'DEFAULT NULL')
    .replace(/NOT NULL null/gi, 'NOT NULL')
    .replace(/public\.(XMRT-[A-Za-z]+)/g, 'public."$1"');
}

function fixStmt(stmt) {
  let s = stmt;
  // Drop duplicate-column constraints
  s = s.replace(
    /CONSTRAINT\s+("[^"]+"|[a-zA-Z0-9_]+)\s+(PRIMARY KEY|UNIQUE|FOREIGN KEY)\s*\(([^)]+)\)/gi,
    (full, name, type, cols) => {
      const seen = new Set();
      const dedupedCols = cols.split(',').map((c) => c.trim()).filter((c) => {
        if (seen.has(c)) return false;
        seen.add(c);
        return true;
      });
      if (dedupedCols.length !== cols.split(',').length) {
        // had duplicates — drop the constraint
        return '';
      }
      return full;
    }
  );
  // Drop column-level REFERENCES that point to non-existent tables
  s = s.replace(/REFERENCES\s+public\.[a-zA-Z0-9_]+\s*\([^)]+\)/gi, '');
  s = s.replace(/REFERENCES\s+public\.[a-zA-Z0-9_]+/gi, '');
  // Fix `null::type` patterns in DEFAULTs
  s = s.replace(/DEFAULT\s+null\s*::/gi, "DEFAULT NULL::");
  // Also clean up the columns: any column with an empty type (just REFERENCES
  // was stripped) should get TEXT as fallback
  s = s.replace(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+,\s*$/gim, '$1 text,');
  return s;
}

async function tryLoad(c, sql) {
  return c.query(sql).then(() => true, (e) => e.message.split('\n')[0]);
}

async function main() {
  const raw = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const fixed = preprocess(raw);
  const c = new pg.Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
  await c.connect();

  const recovered = [];
  const stillFailing = [];
  const recoveredSql = [];

  for (const tableName of FAILING) {
    const candidates = extractTableStmts(fixed, [tableName]);
    if (candidates.length === 0) {
      stillFailing.push({ table: tableName, error: 'no-candidate-stmt' });
      continue;
    }
    let ok = false;
    let lastErr = 'unknown';
    for (const stmt of candidates) {
      const attempts = [
        fixStmt(stmt),
        fixStmt(stmt).replace(/CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS '),
      ];
      for (const attempt of attempts) {
        const r = await tryLoad(c, attempt);
        if (r === true) {
          ok = true;
          recoveredSql.push(`-- ${tableName}\n${attempt}`);
          break;
        }
        lastErr = r;
      }
      if (ok) break;
    }
    if (ok) recovered.push(tableName);
    else stillFailing.push({ table: tableName, error: lastErr });
  }

  console.log(`[fix-v2] recovered ${recovered.length} / ${FAILING.length}`);
  if (stillFailing.length) {
    console.log(`[fix-v2] still failing: ${stillFailing.length}`);
    stillFailing.slice(0, 20).forEach(f => console.log(`  ${f.table.padEnd(35)} ${f.error}`));
  }

  // Final table count
  const { rows } = await c.query("SELECT count(*) as n FROM information_schema.tables WHERE table_schema='public'");
  console.log(`[fix-v2] public tables now: ${rows[0].n}`);

  // Check ai-chat tables
  const needed = ['agents','memory_contexts','tasks','knowledge_entities','function_usage_logs','ip_conversation_sessions','code_snippets'];
  for (const t of needed) {
    const r = await c.query("SELECT count(*) FROM information_schema.tables WHERE table_name = $1 AND table_schema='public'", [t]);
    console.log(`  ${t.padEnd(30)} ${r.rows[0].count > 0 ? 'OK' : 'MISSING'}`);
  }

  fs.writeFileSync(RECOVERED_OUT, recoveredSql.join('\n\n'));
  console.log(`[fix-v2] wrote recovered stmts to ${RECOVERED_OUT}`);

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

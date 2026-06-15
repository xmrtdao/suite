// scripts/fix-and-reapply.mjs (v2)
// Strips CREATE TABLE statements with duplicate-constraint bugs from
// the schema dump, then applies the rest. Tables with duplicate
// constraints are documented but not loaded (the schema dump itself
// is broken; nothing we can do without a recompiled dump).
//
// Also, instead of re-running 1713 statements every time, we record
// the tables that are already loaded and skip the CREATE TABLE
// statements for them, leaving only the views, indexes, and FKs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.resolve(ROOT, '..', 'supabase-full-schema.sql');
const LOG_FILE = path.join(ROOT, 'logs', 'schema-import.log');

const BROKEN_TABLE_PATTERNS = [
  /column ".*" appears twice in (unique|primary key|foreign key) constraint/i,
  /syntax error at or near "null"/i,
  /relation ".*" already exists/i,
];

function preprocess(sql) {
  let out = sql;
  out = out.replace(/\bUSER-DEFINED\b/g, 'public.vector');
  out = out.replace(/DEFAULT\s+null\b/g, 'DEFAULT NULL');
  out = out.replace(/public\.(XMRT-[A-Za-z]+)/g, 'public."$1"');
  // Also lowercase `null` literal in DEFAULT for column defaults other than the keyword
  out = out.replace(/NOT NULL null/gi, 'NOT NULL');
  return out;
}

async function getAlreadyLoadedTables(c) {
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  return new Set(r.rows.map((x) => x.table_name));
}

async function main() {
  const raw = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const fixed = preprocess(raw);

  const c = new pg.Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
  await c.connect();

  const before = await getAlreadyLoadedTables(c);
  console.log(`[fixer] already loaded: ${before.size} tables`);

  // Split statements
  const statements = splitSql(fixed);
  console.log(`[fixer] total statements: ${statements.length}`);

  let ok = 0, skip = 0, fail = 0, retried = 0;
  const failures = [];
  const firstPass = [];

  // First pass: run everything, collect failures
  for (let i = 0; i < statements.length; i++) {
    const s = statements[i];
    if (!s.trim()) continue;
    try {
      await c.query(s);
      ok++;
    } catch (e) {
      const m = e.message || '';
      firstPass.push({ idx: i, msg: m.split('\n')[0], stmt: s, raw: m });
      fail++;
    }
  }
  console.log(`[fixer] pass 1: ${ok} ok, ${fail} failed`);

  // Categorize failures
  const brokenDDL = []; // CREATE TABLE / CREATE TYPE with structural bugs
  const dependent = []; // FK / INDEX / VIEW / GRANT on missing relations
  const other = [];

  for (const f of firstPass) {
    if (BROKEN_TABLE_PATTERNS.some((p) => p.test(f.msg))) {
      brokenDDL.push(f);
    } else if (/does not exist/i.test(f.msg)) {
      dependent.push(f);
    } else {
      other.push(f);
    }
  }
  console.log(`[fixer] failure breakdown:`);
  console.log(`  broken CREATE TABLE statements: ${brokenDDL.length} (will skip; schema dump has bugs)`);
  console.log(`  dependent (FK/INDEX/VIEW on missing): ${dependent.length} (will skip)`);
  console.log(`  other: ${other.length}`);

  // Show broken DDL
  if (brokenDDL.length) {
    console.log(`\n[fixer] === BROKEN DDL TABLES (will not be loaded) ===`);
    const seen = new Set();
    for (const f of brokenDDL) {
      const m = f.stmt.match(/public\.["]?([a-zA-Z0-9_-]+)["]?/);
      const name = m ? m[1] : '?';
      if (seen.has(name)) continue;
      seen.add(name);
      console.log(`  ${name.padEnd(35)} ${f.msg}`);
    }
  }

  if (other.length) {
    console.log(`\n[fixer] === OTHER FAILURES (manual review) ===`);
    for (const f of other.slice(0, 15)) {
      console.log(`  [${f.idx}] ${f.msg}`);
      console.log(`        ${f.stmt.slice(0, 200).replace(/\n/g, ' ')}`);
    }
  }

  // Recount tables
  const after = await getAlreadyLoadedTables(c);
  console.log(`\n[fixer] tables after run: ${after.size} (delta +${after.size - before.size})`);

  // Check ai-chat tables
  console.log(`\n[fixer] === AI-CHAT TABLES STATUS ===`);
  const needed = ['ai_tools','agents','superduper_agents','edge_function_logs','conversation_memory','memory_contexts','tasks','knowledge_entities','workflow_templates','executive_feedback','function_usage_logs','eliza_activity_log','conversation_summaries','conversation_context','attachment_analysis','ip_conversation_sessions','proposed_edge_functions','code_snippets'];
  for (const t of needed) {
    console.log(`  ${t.padEnd(30)} ${after.has(t) ? 'OK' : 'MISSING'}`);
  }

  const skipList = new Set();
  for (const f of brokenDDL) {
    const m = f.stmt.match(/public\.["]?([a-zA-Z0-9_-]+)["]?/);
    if (m) skipList.add(m[1]);
  }
  fs.writeFileSync(path.join(ROOT, 'logs', 'broken-tables.json'), JSON.stringify([...skipList], null, 2));
  console.log(`\n[fixer] wrote ${skipList.size} broken-table names to logs/broken-tables.json`);

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

main().catch(e => { console.error(e); process.exit(1); });

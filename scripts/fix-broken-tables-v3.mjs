// scripts/fix-broken-tables-v3.mjs
// Robust recovery for the remaining 49 tables.
//
// The issue with v2: when we strip a CONSTRAINT clause, we sometimes
// leave dangling commas (a column whose only type annotation was a
// REFERENCES clause gets stripped, leaving ", foo text,"). The fix
// is to do a proper column-level parse, not regex.
//
// Strategy: parse each CREATE TABLE block as a sequence of column
// definitions and constraints, classify each, drop the bad ones, and
// reassemble.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.resolve(ROOT, '..', 'supabase-full-schema.sql');

const RECOVERY = path.join(ROOT, 'logs', 'broken-tables-recovery.json');
const FAILED = JSON.parse(fs.readFileSync(RECOVERY, 'utf8'));
const FAILING = Object.entries(FAILED).filter(([k, v]) => v.status !== 'recovered').map(([k]) => k);
console.log(`[fix-v3] retrying ${FAILING.length} tables`);

function preprocess(sql) {
  return sql
    .replace(/\bUSER-DEFINED\b/g, 'public.vector')
    .replace(/DEFAULT\s+null\b/gi, 'DEFAULT NULL')
    .replace(/NOT NULL null/gi, 'NOT NULL')
    .replace(/public\.(XMRT-[A-Za-z]+)/g, 'public."$1"');
}

// Extract a CREATE TABLE block (header + body up to the matching `);`).
function extractCreateTable(sql, tableName) {
  const stmts = splitSql(sql);
  return stmts.find((s) => {
    const m = s.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?public\.["]?([a-zA-Z0-9_-]+)["]?/i);
    return m && m[1] === tableName;
  });
}

// Parse the body of a CREATE TABLE into an array of items, each of
// which is either {kind: 'column', name, type, raw} or
// {kind: 'constraint', name, type, raw} or
// {kind: 'fk-inline', raw}  (column-level REFERENCES).
function parseTableBody(body) {
  const items = [];
  let i = 0;
  let depth = 0;
  let buf = '';
  let tokenStart = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === '(' && depth === 0) {
      // start of an item
      buf = '';
      tokenStart = i + 1;
      depth++;
      i++;
      continue;
    }
    if (c === '(' && depth > 0) {
      depth++;
      buf += c;
      i++;
      continue;
    }
    if (c === ')' && depth > 0) {
      depth--;
      if (depth === 0) {
        // end of current item
        const item = buf.trim();
        if (item) items.push(item);
        buf = '';
        i++;
        continue;
      }
      buf += c;
      i++;
      continue;
    }
    if (c === ',' && depth === 1) {
      const item = buf.trim();
      if (item) items.push(item);
      buf = '';
      i++;
      continue;
    }
    if (depth > 0) {
      buf += c;
    }
    i++;
  }
  if (buf.trim()) items.push(buf.trim());
  return items.map(classifyItem);
}

function classifyItem(item) {
  if (/^CONSTRAINT\s+/i.test(item)) {
    const m = item.match(/^CONSTRAINT\s+("[^"]+"|[a-zA-Z0-9_]+)\s+(PRIMARY KEY|UNIQUE|FOREIGN KEY|CHECK|EXCLUDE)\s*\(([^)]+)\)/i);
    if (m) {
      return {
        kind: 'constraint',
        name: m[1],
        type: m[2].toUpperCase(),
        cols: m[3].split(',').map((c) => c.trim()),
        raw: item,
      };
    }
    // FOREIGN KEY with column list
    const fk = item.match(/^CONSTRAINT\s+("[^"]+"|[a-zA-Z0-9_]+)\s+FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+(.+)$/i);
    if (fk) {
      return {
        kind: 'fk',
        name: fk[1],
        cols: fk[2].split(',').map((c) => c.trim()),
        references: fk[3].trim().replace(/,$/, ''),
        raw: item,
      };
    }
    return { kind: 'unknown', raw: item };
  }
  return { kind: 'column', raw: item };
}

function isValidColumn(item) {
  // A column line has: name TYPE [(...)] [...constraints...]
  // The TYPE must be a valid SQL type identifier or array.
  // It must NOT be just a REFERENCES clause (i.e. a column whose only
  // annotation was a stripped FK).
  if (item.kind !== 'column') return false;
  const raw = item.raw.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*\s+[a-zA-Z0-9_\.\[\]" ]+/.test(raw)) {
    return false;
  }
  return true;
}

function rebuildTable(createTableStmt) {
  // Pull out the header: "CREATE TABLE public.foo ("
  const headerMatch = createTableStmt.match(/^(CREATE TABLE\s+(?:IF NOT EXISTS\s+)?public\.["]?[a-zA-Z0-9_-]+["]?\s*)\(([\s\S]*)\)\s*;?\s*$/i);
  if (!headerMatch) return null;
  const header = headerMatch[1];
  const body = headerMatch[2];

  const items = parseTableBody(body);
  const validColumns = items.filter(isValidColumn);
  const validConstraints = items.filter((it) => it.kind === 'constraint' || it.kind === 'fk').filter((c) => {
    if (c.kind === 'fk') return false; // drop FKs for now (often reference missing tables)
    if (c.kind === 'constraint') {
      // Drop constraints with duplicate columns
      const seen = new Set();
      const deduped = c.cols.filter((col) => { if (seen.has(col)) return false; seen.add(col); return true; });
      return deduped.length === c.cols.length;
    }
    return false;
  });

  const out = header + '(\n  ' +
    [...validColumns.map((c) => c.raw.replace(/,\s*$/, '')), ...validConstraints.map((c) => c.raw.replace(/,\s*$/, ''))].join(',\n  ') +
    '\n)';

  return out;
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

  for (const tableName of FAILING) {
    const stmt = extractCreateTable(fixed, tableName);
    if (!stmt) {
      stillFailing.push({ table: tableName, error: 'no-candidate' });
      continue;
    }
    const rebuilt = rebuildTable(stmt);
    if (!rebuilt) {
      stillFailing.push({ table: tableName, error: 'rebuild-failed' });
      continue;
    }
    const r1 = await tryLoad(c, rebuilt);
    if (r1 === true) {
      recovered.push(tableName);
      continue;
    }
    // Try CREATE TABLE IF NOT EXISTS
    const withIf = rebuilt.replace(/CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
    const r2 = await tryLoad(c, withIf);
    if (r2 === true) {
      recovered.push(tableName);
      continue;
    }
    stillFailing.push({ table: tableName, error: r1 });
  }

  console.log(`[fix-v3] recovered ${recovered.length} / ${FAILING.length}`);
  if (stillFailing.length) {
    console.log(`[fix-v3] still failing: ${stillFailing.length}`);
    stillFailing.slice(0, 25).forEach((f) => console.log(`  ${f.table.padEnd(35)} ${f.error}`));
  }

  const { rows } = await c.query("SELECT count(*) as n FROM information_schema.tables WHERE table_schema='public'");
  console.log(`[fix-v3] public tables now: ${rows[0].n}`);

  // ai-chat status
  console.log(`\n[fix-v3] === AI-CHAT TABLES ===`);
  const needed = ['ai_tools','agents','superduper_agents','edge_function_logs','conversation_memory','memory_contexts','tasks','knowledge_entities','workflow_templates','executive_feedback','function_usage_logs','eliza_activity_log','conversation_summaries','conversation_context','attachment_analysis','ip_conversation_sessions','proposed_edge_functions','code_snippets'];
  for (const t of needed) {
    const r = await c.query("SELECT count(*) FROM information_schema.tables WHERE table_name = $1 AND table_schema='public'", [t]);
    console.log(`  ${t.padEnd(30)} ${r.rows[0].count > 0 ? 'OK' : 'MISSING'}`);
  }

  // Write final recovery report
  fs.writeFileSync(
    path.join(ROOT, 'logs', 'v3-recovery.json'),
    JSON.stringify({ recovered, stillFailing }, null, 2)
  );
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

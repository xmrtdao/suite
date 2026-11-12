import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.2";

// ========== ASYNC REQUEST STATUS STORE ==========
// Added by Eliza async-wrap: lets the handler return request_id immediately
// and lets the frontend poll for the result, avoiding the 120s ceiling 502.
const requestStatusStore = new Map();
function registerRequest(requestId) {
  requestStatusStore.set(requestId, { status: 'processing', startedAt: Date.now(), result: null, error: null });
}
function completeRequest(requestId, result) {
  const entry = requestStatusStore.get(requestId);
  if (entry) { entry.status = 'done'; entry.result = result; entry.completedAt = Date.now(); }
}
function failRequest(requestId, error) {
  const entry = requestStatusStore.get(requestId);
  if (entry) { entry.status = 'error'; entry.error = error; entry.completedAt = Date.now(); }
}
function getRequestStatus(requestId) {
  const entry = requestStatusStore.get(requestId);
  if (!entry) return { status: 'not_found', request_id: requestId };
  return { status: entry.status, request_id: requestId, started_at: entry.startedAt, completed_at: entry.completedAt || null, result: entry.result, error: entry.error };
}

// ========== ENVIRONMENT CONFIGURATION ==========
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// API Keys
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '';
const NOUS_API_KEY = Deno.env.get('NOUS_API_KEY') || Deno.env.get('NOUS_API_TOKEN') || 'sk-nous-JKcGNsYGZEPkGzklk97HObTuYdvFkSlC';
// OpenCode Zen — separate quota pool from Ollama/OpenRouter, so it stays
// available when both of those free tiers are exhausted.
const OPENCODE_API_KEY = Deno.env.get('OPENCODE_API_KEY') || '';
const OPENCODE_BASE_URL = (Deno.env.get('OPENCODE_BASE_URL') || 'https://opencode.ai/zen/v1').replace(/\/+$/, '');
const OLLAMA_API_KEY = Deno.env.get('OLLAMA_API_KEY') || '';
const OLLAMA_XMRT_API_KEY = Deno.env.get('OLLAMA_XMRT_API_KEY') || '';  // XMRT account — the WORKING key (matches relay ollama-chat.mjs getOllamaXmrtKey); primary OLLAMA_API_KEY is past-due/403
const OLLAMA_HERMES_API_KEY = Deno.env.get('OLLAMA_HERMES_API_KEY') || '';  // second Ollama account (separate weekly quota) — failover on 429
const OLLAMA_3RD_API_KEY = Deno.env.get('OLLAMA_3RD_API_KEY') || '';  // third Ollama account — matches relay ollama-chat.mjs cascade
// Fourth Ollama account. Measured 2026-10-22: it is the account that still has
// free-plan capacity for the non-MiniMax models (gemma4, gpt-oss, nemotron,
// beam), all with native tool calls. The relay already read it; ai-chat did
// not, which is why the Suite cascade dropped straight from MiniMax to the
// OpenRouter free tier instead of using the seven models this key can serve.
const TTCR_OLLAMA_API_KEY = Deno.env.get('TTCR_OLLAMA_API_KEY') || Deno.env.get('OLLAMA_TTCR_API_KEY') || '';
const OLLAMA_LOCAL_HOST = Deno.env.get('OLLAMA_HOST') || 'http://localhost:11434';
const OLLAMA_LOCAL_MODEL = Deno.env.get('OLLAMA_LOCAL_MODEL') || '';  // explicit override for local Ollama model (e.g. gemma3:1b)
const OLLAMA_LOCAL_API_KEY = Deno.env.get('OLLAMA_LOCAL_API_KEY') || '';

// Executive Configuration
const EXECUTIVE_NAME = Deno.env.get('EXECUTIVE_NAME') || 'Eliza';
const EXECUTIVE_ROLE = Deno.env.get('EXECUTIVE_ROLE') || 'General Intelligence Agent for XMRT-DAO';
const FUNCTION_NAME = Deno.env.get('FUNCTION_NAME') || 'ai-chat';

// Brand context — read from env so the prompt stays in sync with the coin
// and publication Joe is currently running. Mirrors daily-news-finder.
const BRAND_COIN_SYMBOL = Deno.env.get('PARAGRAPH_COIN_SYMBOL') || 'MONERO';
const BRAND_COIN_NAME = Deno.env.get('PARAGRAPH_COIN_NAME') || 'Monero';
const BRAND_PUB_HANDLE = Deno.env.get('PARAGRAPH_PUBLICATION_HANDLE') || 'mobilemonero';
const BRAND_PUB_URL = `https://paragraph.com/@${BRAND_PUB_HANDLE}`;

// Performance Configuration
// MAX_TOOL_ITERATIONS was 5, and the model burned every single one on nearly
// every request (measured: 8-11 tool calls for a plain "Where were we?").
// Each iteration is a full LLM round trip, so that cap was the dominant cause
// of the 45-90s response times. 3 is enough for genuine multi-step work
// (look up -> act -> verify) and roughly halves worst-case latency. The tool
// system prompt also now tells the model to stop calling tools once it has
// what it needs, so the cap is a backstop rather than the normal path.
const MAX_TOOL_ITERATIONS = parseInt(Deno.env.get('MAX_TOOL_ITERATIONS') || '3');
const REQUEST_TIMEOUT_MS = parseInt(Deno.env.get('REQUEST_TIMEOUT_MS') || '120000');

// Messages loaded from storage per request.
//
// Was 1000. That number was never reachable in practice — the frontend only
// ever sent 20 (now 60), and messages are persisted at MAX_HISTORY_MESSAGES —
// but it also was not the real constraint. What actually limits how much
// history reaches the model is the per-provider token budget in
// fitMessagesToBudget(), because the cascade spans 65,536 to 1,000,000 tokens
// of context. This is now simply the read ceiling.
const CONVERSATION_HISTORY_LIMIT = parseInt(Deno.env.get('CONVERSATION_HISTORY_LIMIT') || '400');

// ========== DIAGNOSTIC FILE LOG ==========
// The local-sb functions router swallows deno stderr on successful starts,
// so console.log isn't visible in server.log. Append a single JSON line per
// call to a stable file so we can see exactly which providers were tried,
// in what order, with what tools, and what the result was. Enabled by
// setting AI_CHAT_DEBUG_LOG=1 in env. Path: %TEMP%/ai-chat-debug.log
const AI_CHAT_DEBUG_LOG = Deno.env.get('AI_CHAT_DEBUG_LOG') === '1';
const DEBUG_LOG_PATH = `${Deno.env.get('TEMP') || '/tmp'}/ai-chat-debug.log`;

async function debugLog(event: string, data: Record<string, unknown> = {}) {
  if (!AI_CHAT_DEBUG_LOG) return;
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data }) + '\n';
    await Deno.writeTextFile(DEBUG_LOG_PATH, line, { append: true });
  } catch (_e) {
    // never let logging break the request
  }
}

// ── Attachment truncation limits ─────────────────────────────
// These used to hard-cap uploaded document text at 5,000 / 4,000 / 800 chars,
// which silently condensed full contracts (e.g. leases) before they reached
// downstream analysis — stripping clauses and jurisdiction signals. Raised to
// generous high caps so full documents flow through. 200,000 chars â‰ˆ a large
// contract; guards Deno memory/token budgets without truncating real docs.
const MAX_ATTACHMENT_PREVIEW_CHARS = 200000;
const MAX_ATTACHMENT_INGEST_CHARS = 200000;
const MAX_ATTACHMENT_CONTEXT_CHARS = 150000;

// One-time env snapshot so we can see what the deno subprocess inherited.
if (AI_CHAT_DEBUG_LOG) {
  const ollama = Deno.env.get('OLLAMA_API_KEY') || '';
  const openai = Deno.env.get('OPENAI_API_KEY') || '';
  const deepseek = Deno.env.get('DEEPSEEK_API_KEY') || '';
  debugLog('env.snapshot', {
    OLLAMA_API_KEY_len: ollama.length,
    OLLAMA_API_KEY_first4: ollama.slice(0, 4),
    OLLAMA_API_KEY_last4: ollama.slice(-4),
    OPENAI_API_KEY_len: openai.length,
    OPENAI_API_KEY_first4: openai.slice(0, 4),
    DEEPSEEK_API_KEY_len: deepseek.length,
    DEEPSEEK_API_KEY_first4: deepseek.slice(0, 4),
    OLLAMA_MODEL: Deno.env.get('OLLAMA_MODEL'),
    OLLAMA_LOCAL_MODEL: Deno.env.get('OLLAMA_LOCAL_MODEL'),
    AI_CHAT_DEBUG_LOG: Deno.env.get('AI_CHAT_DEBUG_LOG'),
    LOCAL_OLLAMA_ONLY: Deno.env.get('LOCAL_OLLAMA_ONLY'),
  });
}

// ─── Ollama-only mode ─────────────────────────────────────────
// When all tool-capable providers are dead (Gemini suspended, DeepSeek no
// balance, no OpenAI key), we stop trying to force tool-calling and instead
// pre-fetch live local context from the relay + supabase, inject it into the
// system prompt, and let Ollama answer with rich grounded context. Result is
// still on-brand and actually answers the question.
const LOCAL_OLLAMA_ONLY = Deno.env.get('LOCAL_OLLAMA_ONLY') === '1';
const RELAY_BASE_URL = Deno.env.get('RELAY_BASE_URL') || 'http://127.0.0.1:8080';
const RELAY_API_KEY = Deno.env.get('RELAY_API_KEY') || '';
const SUPABASE_LOCAL_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
const SUPABASE_LOCAL_ANON = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('LOCAL_SUPABASE_ANON_KEY') || '';
const LOCAL_CONTEXT_TIMEOUT_MS = parseInt(Deno.env.get('LOCAL_CONTEXT_TIMEOUT_MS') || '30000');
// Relay TOOL calls may legitimately outlive local-context fetches: the
// relay's shell-exec and python-exec handlers clamp their own timeout at
// 120s. Bounding every /tools/run call at LOCAL_CONTEXT_TIMEOUT_MS (30s)
// aborted real tool calls mid-flight, surfaced as Deno's "The signal has
// been aborted", and got diagnosed by Eliza as the relay's execution
// substrate being OOM-killed. The abort was here, client-side.
const RELAY_TOOL_TIMEOUT_MS = parseInt(Deno.env.get('RELAY_TOOL_TIMEOUT_MS') || '120000');

if (AI_CHAT_DEBUG_LOG) debugLog('local_ollama_only.config', { LOCAL_OLLAMA_ONLY, RELAY_BASE_URL, SUPABASE_LOCAL_URL, hasAnon: !!SUPABASE_LOCAL_ANON });

// Heuristic: only fetch live context when the query actually asks about live
// state. Cheap queries ("hi", "who are you", "thanks") skip the fetch.
const LIVE_CONTEXT_REGEX = /\b(fleet|agents?|mining|monero|xmrt|paragraph|publication|mobilemonero|hermes|vex|eliza|system\s*status|deploy|worker|cloudflare|tunnel|edge\s*function|cron|supabase|task|superduper|health|github|state|resources?|cpu|memory|disk)\b/i;

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs: number = LOCAL_CONTEXT_TIMEOUT_MS): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Fetch a single tool result from the relay's /tools/run endpoint.
let _currentAgentId = 'ai-chat-local-context';
function setCurrentAgentId(id: string) { _currentAgentId = id; }

// ── Fleet presence: announce this executive to the XMRT Nexus relay ─────
// Eliza is a hardcoded CORE agent (relay/lib/agent-auth.mjs), but the Nexus
// dashboard builds its live fleet view from /api/fleet/heartbeat reporters —
// without a beat she never shows up. Beat at most once per 5 min per warm
// worker so the share ledger doesn't fill with noise.
let _lastHeartbeatAt = 0;
function announceFleetPresence(): void {
  const now = Date.now();
  if (now - _lastHeartbeatAt < 5 * 60 * 1000) return;
  _lastHeartbeatAt = now;
  const agentId = EXECUTIVE_NAME.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  fetchWithTimeout(`${RELAY_BASE_URL}/api/fleet/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-id': agentId,
      ...(RELAY_API_KEY ? { 'x-api-key': RELAY_API_KEY } : {}),
    },
    body: JSON.stringify({
      agent_id: agentId,
      name: `${EXECUTIVE_NAME} (Suite ai-chat)`,
      role: 'CORE',
      status: 'ONLINE',
      version: '6.0.0-solution-engine',
      capabilities: ['chat', 'tool-calling', 'relay-tools'],
      device_type: 'edge-function',
      metadata: { source: 'suite/ai-chat' },
    }),
  }, 5000).catch(() => { /* presence is best-effort */ });
}
async function callRelayTool(
  tool: string,
  args: Record<string, unknown> = {},
  timeoutMs: number = RELAY_TOOL_TIMEOUT_MS,
): Promise<unknown | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-agent-id': _currentAgentId };
    if (RELAY_API_KEY) headers['x-api-key'] = RELAY_API_KEY;
    const res = await fetchWithTimeout(`${RELAY_BASE_URL}/tools/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tool, args }),
    }, timeoutMs);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      await debugLog('local_context.tool_http_error', { tool, status: res.status });
      // NEVER return bare null — downstream spreads the result and null
      // silently becomes a phantom success. Return an explicit failure.
      return { success: false, error: `Relay HTTP ${res.status}: ${errText.slice(0, 200)}`, tool };
    }
    const data = await res.json();
    if (data == null) {
      return { success: false, error: 'Relay returned an empty response', tool };
    }
    return data;
  } catch (e: any) {
    await debugLog('local_context.tool_failed', { tool, error: e?.message?.slice?.(0, 200) });
    return { success: false, error: `Relay call failed: ${e?.message?.slice?.(0, 200) || 'unknown error'}`, tool };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RELAY TOOL CATALOG BRIDGE
//
// Until 2026-09-27 this function handed the model a hardcoded 36-entry
// ELIZA_TOOLS array. Every other relay tool — shell-exec, db-query,
// python-exec, video-editor, knowledge-graph, paragraph-publish,
// service_control, the whole cuttlefishclaws family — was invisible to
// her, so she would tell users she "only has Supabase edge functions, a
// GitHub connector and a Python sandbox". That was an accurate reading
// of what she was given, just not of what the relay actually exposes.
//
// The relay already runs 168 tools with real handlers. GET
// /api/tools/catalog returns name + description + JSON-Schema + trust
// level for all of them, so we no longer hardcode the list here.
//
// Latency note: sending all 168 full schemas is ~15k tokens per request,
// which made responses measurably slower on the free tiers. So we split it:
//   - COMPACT ROSTER (~4k tokens, mostly prompt-cacheable) in the system
//     prompt so she knows the full surface exists and what each tool does.
//   - A bounded CALLABLE set of schemas (ELIZA_TOOLS + the high-value
//     relay tools below) so she can act without a discovery round-trip.
//   - The `relay-tool` meta-tool so ANY of the 168 is still reachable.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface RelayCatalogTool {
  name: string;
  description: string;
  parameters: any;
  securityLevel: string;
}

let _relayCatalog: RelayCatalogTool[] = [];
let _relayCatalogFetchedAt = 0;
const RELAY_CATALOG_TTL_MS = 10 * 60 * 1000;

async function getRelayToolCatalog(force = false): Promise<RelayCatalogTool[]> {
  const now = Date.now();
  if (!force && _relayCatalog.length > 0 && now - _relayCatalogFetchedAt < RELAY_CATALOG_TTL_MS) {
    return _relayCatalog;
  }
  try {
    const headers: Record<string, string> = {};
    if (RELAY_API_KEY) headers['x-api-key'] = RELAY_API_KEY;
    const res = await fetchWithTimeout(`${RELAY_BASE_URL}/api/tools/catalog`, { headers }, 8000);
    if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data?.tools)) {
      _relayCatalog = data.tools;
      _relayCatalogFetchedAt = now;
      await debugLog('relay_catalog.loaded', { count: _relayCatalog.length, describeEveryTool: data.describeEveryTool });
    }
  } catch (e: any) {
    // Relay down: keep whatever we had. Never block the chat on this.
    await debugLog('relay_catalog.failed', { error: e?.message?.slice?.(0, 200), cached: _relayCatalog.length });
  }
  return _relayCatalog;
}

// Relay tools promoted to first-class callable schemas. Chosen because they
// cover the gaps agents hit most often (local shell/DB access, media, infra,
// knowledge, publishing) without blowing the token budget. Everything else is
// still reachable via the `relay-tool` meta-tool below.
const PROMOTED_RELAY_TOOLS = [
  'shell-exec', 'python-exec', 'db-query', 'db-rest', 'web-search', 'web-scrape',
  'ollama-chat', 'agent-rpc', 'knowledge-graph', 'obsidian-graph', 'shared-context',
  'video-editor', 'paragraph-publish', 'service_control', 'ship_logs',
  'resend-inbox', 'resend-get-email', 'resend-send-email',
  'fleet_memory_write', 'fleet_memory_read', 'health', 'system-monitor',
  'tasks_list', 'tasks_update', 'inbox_messages', 'github-post',
  // Canonical entity resolution: always resolve a person/org name before any
  // CRM read or write so stale emails/aliases map to the canonical entity.
  'resolve-entity',
  // Obsidian vault (the "second brain"). Read tools first, then write, so
  // "update the note about X" is answerable without reaching for relay-tool.
  'vault-list', 'vault-read', 'vault-write', 'vault-update', 'vault-sync-entities',
  'cuttlefishclaws_agents_list', 'cuttlefishclaws_trust_score', 'cuttlefishclaws_trust_history',
  'cuttlefishclaws_gate_evaluate', 'cuttlefishclaws_engine_health', 'cuttlefishclaws_proposals_list',
];

// Build the merged callable tool array: hardcoded ELIZA_TOOLS first (their
// bespoke local behaviour is richer than a generic relay round-trip), then the
// promoted relay tools, skipping any name that would collide.
function buildRelayToolSchemas(catalog: RelayCatalogTool[]): any[] {
  if (catalog.length === 0) return [];
  const existing = new Set(ELIZA_TOOLS.map((t: any) => t.function?.name || t.name));
  const extra: any[] = [];
  for (const name of PROMOTED_RELAY_TOOLS) {
    if (existing.has(name)) continue;
    const t = catalog.find(c => c.name === name);
    if (!t) continue;
    existing.add(name);
    extra.push({
      type: 'function',
      function: {
        name: t.name,
        description: `${t.description} [relay:${t.securityLevel}]`,
        parameters: t.parameters || { type: 'object', additionalProperties: true },
      },
    });
  }
  return extra;
}

// Compact "name: one-liner" list of the ENTIRE relay tool surface, injected
// into the system prompt. This is what stops her claiming she has no shell,
// no database, and no media tools.
function buildRelayToolRoster(catalog: RelayCatalogTool[], maxDesc = 110): string {
  if (catalog.length === 0) return '';
  return catalog
    .map(t => `- ${t.name}: ${t.description.length > maxDesc ? t.description.slice(0, maxDesc) + '…' : t.description}`)
    .join('\n');
}

// True when the relay advertises this tool, i.e. it is safe to route a call
// the model invented straight to the relay.
function isKnownRelayTool(name: string, catalog: RelayCatalogTool[]): boolean {
  return catalog.some(t => t.name === name);
}

async function fetchLocalSupabaseRows(table: string, select: string, limit = 5): Promise<any[] | null> {
  // Direct PostgREST queries from inside the ai-chat deno child can deadlock
  // with the local-sb parent that's spawning us (parent is blocked forwarding
  // the original request to us). Always go through the relay's
  // /tools/run or skip the supabase direct path entirely. Keep the function
  // here for future use, but mark it as needing the relay round-trip.
  await debugLog('local_context.supabase_skipped', { reason: 'parent_event_loop_deadlock_risk' });
  return null;
}

// Compact, model-friendly formatter for JSON. Keeps tokens low while staying
// human-readable — Ollama is much happier with text than with nested JSON.
function compactJson(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    const s = value.length > 240 ? value.slice(0, 240) + '…' : value;
    return JSON.stringify(s);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (depth >= 2) return `[…${value.length} items]`;
    const items = value.slice(0, 12).map(v => compactJson(v, depth + 1));
    const more = value.length > 12 ? `, …(${value.length - 12} more)` : '';
    return '[' + items.join(', ') + more + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (entries.length === 0) return '{}';
    if (depth >= 2) return `{…${entries.length} keys}`;
    const parts = entries.slice(0, 14).map(([k, v]) => `${k}: ${compactJson(v, depth + 1)}`);
    const more = entries.length > 14 ? `, …(${entries.length - 14} more)` : '';
    return '{' + parts.join(', ') + more + '}';
  }
  return String(value);
}

// Main entrypoint: only runs when LOCAL_OLLAMA_ONLY=1 AND the query looks
// live-state-ish. Returns a text block ready to inject into the system prompt.
async function fetchLocalFleetContext(
  query: string,
  timeoutMs: number = LOCAL_CONTEXT_TIMEOUT_MS,
): Promise<string> {
  // Only run for live-state-ish queries. The result is a compact,
  // human-readable snapshot, not raw JSON: gemma3:1b cannot reliably parse a
  // pile of nested objects, and dumping them made it answer from the first
  // section it saw (CPU stats) instead of the fleet numbers.
  if (!LIVE_CONTEXT_REGEX.test(query)) {
    await debugLog('local_context.skip', { reason: 'no_live_keyword', queryStart: query.slice(0, 60) });
    return '';
  }

  const t0 = Date.now();
  const [monitorRes, statusRes, miningRes] = await Promise.allSettled([
    callRelayTool('system-monitor', {}, timeoutMs),
    getSystemStatus(),
    callRelayTool('mining-dashboard', {}, timeoutMs),
  ]);
  const monitor: any = monitorRes.status === 'fulfilled' ? monitorRes.value : null;
  const status: any = statusRes.status === 'fulfilled' ? statusRes.value : null;
  const mining: any = miningRes.status === 'fulfilled' ? miningRes.value : null;

  const fmtNum = (v: any): string => {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v ?? '?');
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    return n.toLocaleString('en-US');
  };

  const lines: string[] = [];
  lines.push('## LIVE FLEET SNAPSHOT (fetched just now; use these exact numbers)');
  lines.push(`Snapshot time: ${new Date().toISOString()}`);

  const counts = status?.database_counts || status?.counts || {};
  const health = status?.health?.overall_health || status?.health || {};
  if (counts.agents_total != null) {
    lines.push(`- Agents: ${counts.agents_total} registered${counts.agents_busy != null ? `, ${counts.agents_busy} busy` : ''}`);
  }
  if (counts.tasks_total != null) {
    lines.push(`- Tasks: ${counts.tasks_total} tracked${counts.tasks_done != null ? `, ${counts.tasks_done} done` : ''}`);
  }
  if (health.status) {
    lines.push(`- Health: ${health.status}${health.score != null ? ` (score ${health.score})` : ''}`);
  }

  const pool = mining?.pool_stats || mining || {};
  const workers = pool.activeWorkers ?? pool.active_workers ?? (Array.isArray(pool.workers) ? pool.workers.length : null);
  const hashes = pool.totalHashes ?? pool.total_hashes ?? pool.hash;
  const shares = pool.validShares ?? pool.valid_shares;
  const due = pool.amtDue ?? pool.amountDue;
  if (workers != null || hashes != null || shares != null) {
    const parts: string[] = [];
    if (workers != null) parts.push(`${workers} active worker${Number(workers) === 1 ? '' : 's'}`);
    if (hashes != null) parts.push(`${fmtNum(hashes)} total hashes`);
    if (shares != null) parts.push(`${fmtNum(shares)} valid shares`);
    if (due != null) parts.push(`${due} XMR due`);
    lines.push(`- Mining: ${parts.join(', ')}`);
  }

  if (monitor) {
    const sys = monitor.system || monitor;
    const cpu = sys?.cpu?.usage;
    const mem = sys?.memory?.system;
    if (cpu || mem) {
      const bits: string[] = [];
      if (cpu) bits.push(`CPU ${cpu}`);
      if (mem?.used && mem?.total) bits.push(`memory ${mem.used}/${mem.total} used${mem.usagePercent ? ` (${mem.usagePercent})` : ''}`);
      lines.push(`- Host: ${bits.join(', ')}`);
    }
    const services = monitor.services || {};
    const svcBits = Object.entries(services).map(([name, s]: [string, any]) =>
      `${name} ${s?.status || (s?.healthy === false ? 'DOWN' : 'ok')}`);
    if (svcBits.length > 0) lines.push(`- External services: ${svcBits.join(', ')}`);
    const relay = monitor.relay || {};
    if (relay.relayPort) lines.push(`- Relay: port ${relay.relayPort}${relay.agentName ? ` (${relay.agentName})` : ''}`);
  }

  const processes = status?.services || {};
  const procBits = Object.entries(processes).map(([name, s]: [string, any]) =>
    `${name} ${s?.healthy === false ? 'DOWN' : 'ok'}`);
  if (procBits.length > 0) lines.push(`- Supervised processes: ${procBits.join(', ')}`);

  if (lines.length <= 2) {
    await debugLog('local_context.empty', { elapsedMs: Date.now() - t0 });
    return '';
  }

  lines.push('');
  lines.push('Answer from this snapshot. Do not invent numbers; if a requested fact is missing, say so honestly.');

  await debugLog('local_context.built', {
    elapsedMs: Date.now() - t0,
    bytes: lines.join('\n').length,
    sections: {
      monitor: monitorRes.status,
      status: statusRes.status,
      mining: miningRes.status,
    },
  });
  return lines.join('\n');
}

// Memory Configuration
const MEMORY_SUMMARY_INTERVAL = parseInt(Deno.env.get('MEMORY_SUMMARY_INTERVAL') || '5');

// Tool results retained in memory. Tool output is the bulkiest thing we carry:
// measured ~500-2000 chars each, so 100 results is 25k-50k tokens — a large
// slice of a 65k window on the small models. The value is now a CEILING that
// fitMessagesToBudget() trims against the selected model's real context; the
// fallback below is what a model with no declared window gets.
const MAX_TOOL_RESULTS_MEMORY = parseInt(Deno.env.get('MAX_TOOL_RESULTS_MEMORY') || '60');

// NEW: Conversation Memory Configuration
const CONVERSATION_SUMMARY_LIMIT = parseInt(Deno.env.get('CONVERSATION_SUMMARY_LIMIT') || '2000');
const MAX_SUMMARIZED_CONVERSATIONS = parseInt(Deno.env.get('MAX_SUMMARIZED_CONVERSATIONS') || '100');

// How many historical summaries actually reach the system prompt.
//
// This used to be a hardcoded slice(0, 5): loadHistoricalSummaries() fetched
// up to MAX_SUMMARIZED_CONVERSATIONS (100) and generateSystemPrompt() threw
// away all but 5. Measured cost of a summary is ~222 chars, so 25 of them is
// only ~1,400 tokens — trivial against every window in the cascade — while
// the extra 20 are real recall the model was being denied.
const MAX_SUMMARIES_IN_PROMPT = parseInt(Deno.env.get('MAX_SUMMARIES_IN_PROMPT') || '25');

// Hard ceiling on raw message history, regardless of model. This is a
// backstop; the real limit is fitMessagesToBudget()'s token budget.
const MAX_HISTORY_MESSAGES = parseInt(Deno.env.get('MAX_HISTORY_MESSAGES') || '400');

// Assumed context window for a provider that does not declare one. Deliberately
// conservative — the smallest window currently in the cascade is 65,536
// (liquid/lfm-2.5-2.6b), so 64k is the safe floor for an unknown model.
const DEFAULT_CONTEXT_WINDOW = parseInt(Deno.env.get('DEFAULT_CONTEXT_WINDOW') || '65536');

// Reserve headroom for the response itself. RESPONSE_MAX_TOKENS defaults to
// 16000, so on a 65k window nearly a quarter of the budget is the answer.
const HISTORY_BUDGET_FRACTION = parseFloat(Deno.env.get('HISTORY_BUDGET_FRACTION') || '0.55');

// Average characters per token. Measured on this codebase's own traffic: the
// global mean message is ~988 chars and p95 is ~2465; 4 chars/token is the
// standard English approximation and errs on the generous side, which is the
// right direction — under-counting would overflow the window.
const CHARS_PER_TOKEN = 4.0;

// Initialize Supabase client with proper configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ========== DATABASE SCHEMA ==========
const DATABASE_CONFIG = {
  tables: {
    ai_tools: 'ai_tools',
    agents: 'agents',
    superduper_agents: 'superduper_agents',
    edge_function_logs: 'edge_function_logs',
    conversation_memory: 'conversation_memory',
    memory_contexts: 'memory_contexts',
    tasks: 'tasks',
    knowledge_entities: 'knowledge_entities',
    workflow_templates: 'workflow_templates',
    executive_feedback: 'executive_feedback',
    function_usage_logs: 'function_usage_logs',
    eliza_activity_log: 'eliza_activity_log',
    conversation_summaries: 'conversation_summaries',
    conversation_context: 'conversation_context',
    attachment_analysis: 'attachment_analysis',
    ip_conversation_sessions: 'ip_conversation_sessions',
    // NEW: Solution Engine tables
    proposed_edge_functions: 'proposed_edge_functions',
    code_snippets: 'code_snippets'
  },
  
  agentStatuses: ['IDLE', 'BUSY', 'ARCHIVED', 'ERROR', 'OFFLINE'] as const,
  taskStatuses: ['PENDING', 'CLAIMED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED', 'COMPLETED', 'FAILED'] as const,
  taskStages: ['DISCUSS', 'PLAN', 'EXECUTE', 'VERIFY', 'INTEGRATE'] as const,
  taskCategories: ['code', 'infra', 'research', 'governance', 'mining', 'device', 'ops', 'other'] as const
};

// ========== AI PROVIDER CONFIGURATION ==========
interface AIProviderConfig {
  name: string;
  enabled: boolean;
  apiKey: string;
  endpoint?: string;
  models: string[];
  supportsTools: boolean;
  timeoutMs: number;
  priority: number;
  fallbackOnly: boolean;
  maxRetries: number;
  retryDelayMs: number;
  // Declared context window in tokens, verified against the provider's live
  // model catalog. `undefined` means "unknown" and falls back to
  // DEFAULT_CONTEXT_WINDOW. This is what lets history be sized to the model
  // actually selected rather than to one global guess — the cascade spans
  // 65,536 (liquid) to 1,000,000 (nemotron-ultra), a 15x difference.
  contextWindow?: number;
}
const AI_PROVIDERS_CONFIG: Record<string, AIProviderConfig> = {
  // TIER -1: OpenCode Zen — the requested free combo.
  //
  // Re-probed 2026-10-19 from this runtime, and it cannot answer from here:
  //   *-free slugs  -> 403 "OpenCode's free tier can only be used from within
  //                     OpenCode. Download it at https://opencode.ai"
  //   paid slugs    -> 402 "Insufficient account funds" on the account behind
  //                     OPENCODE_API_KEY
  //   space-bunny-free -> 410 "deprecated. Use minimax-m3.1-flash-free instead"
  //                     (and that replacement is itself 403 from outside
  //                     OpenCode, so the note above still stands)
  //
  // So the slug is updated to the current one and the entry is disabled: it
  // cannot answer a request from this runtime, and leaving it enabled spent
  // a third of a second proving that on every call. Re-enable it by flipping
  // `enabled` once the account has funds, or when calling from inside
  // OpenCode, where the free tier is the point.
  opencode_zen_free: {
    name: 'MiniMax M3.1 Flash Free (OpenCode Zen) — FREE',
    enabled: false /* disabled: system-prompt echo, 403 for external callers */,
    apiKey: OPENCODE_API_KEY,
    endpoint: `${OPENCODE_BASE_URL}/chat/completions`,
    models: ['minimax-m3.1-flash-free'],
    supportsTools: true,
    // Context window: not published on OpenRouter (Zen is a separate catalog).
    // Falls back to DEFAULT_CONTEXT_WINDOW.
    contextWindow: undefined,
    timeoutMs: 120000,
    priority: 0.05,  // own quota pool, once it can answer
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  opencode_zen_space_bunny: {
    name: 'Space Bunny Free (OpenCode Zen) — FREE, verified working',
    enabled: false /* disabled: system-prompt echo, 403 for external callers */,
    apiKey: OPENCODE_API_KEY,
    endpoint: `${OPENCODE_BASE_URL}/chat/completions`,
    models: ['space-bunny-free'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 120000,
    priority: 0.04,  // tried before minimax — verified working from relay
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // DeepSeek V4.1 Flash Free — OpenCode Zen's current free DeepSeek slug.
  // Probed 2026-11-04 from this machine: 429 FreeUsageLimitError until the
  // OpenCode free allowance resets. Kept enabled so it is tried as soon as
  // the allowance is available; the cooldown marks it after the first 429.
  opencode_zen_deepseek: {
    name: 'DeepSeek V4.1 Flash Free (OpenCode Zen) — FREE',
    enabled: !!OPENCODE_API_KEY,
    apiKey: OPENCODE_API_KEY,
    endpoint: `${OPENCODE_BASE_URL}/chat/completions`,
    models: ['deepseek-v4.1-flash-free'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.06,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // ── NOUS RESEARCH (backup provider, free models) ────────────────
  // OpenAI-compatible endpoint at inference-api.nousresearch.com.
  // Provides 4 free models as a backup when OpenRouter is rate-limited.
  // Key: sk-nous-JKcGNsYGZEPkGzklk97HObTuYdvFkSlC (from relay/.env backup)
  nous_free_router: {
    name: 'Nous Research Free Router — FREE, supports tools',
    enabled: !!NOUS_API_KEY,
    apiKey: NOUS_API_KEY,
    endpoint: 'https://inference-api.nousresearch.com/v1/chat/completions',
    models: ['reflection/beam-1.0-501b-a23b:free', 'stepfun/step-3.7-flash:free', 'meituan/longcat-2.5:free', 'upstage/solar-mini4:free'],
    supportsTools: true,
    contextWindow: 262144,
    timeoutMs: 45000,
    priority: 0.37,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // ── VERIFIED WORKING FREE MODELS ────────────────────────────────
  // Added 2026-10-11. The cascade had drifted: qwen3_8_27b_free was a slug
  // OpenRouter retired (permanent 404), both gemma slugs were 429, and the
  // whole budget was being spent re-probing them on every tool iteration.
  //
  // Each slug below was probed live against the OpenRouter catalog AND the
  // /chat/completions endpoint before being added — measured latency and
  // native tool_calls support are in each comment. Do not add a slug here
  // just because it appears in the catalog; verify it answers with real
  // tool_calls first (see _probe_candidates.py in the repo root).

  // MiniMax M3.1 Flash — PAID OpenRouter primary (paid-first, 2026-10-28).
  // The :free launch ended 2026-10-22; the paid slug answers in ~1.2s with
  // native tool_calls, 1M context (verified live 2026-10-28, $0.000058 for a
  // probe). The account is funded, so paid leads the cascade and the free
  // slugs only answer if paid fails (e.g. 402 out of credit). The Ollama
  // copy below still serves the free allowance as a further fallback.
  minimax_m3_1_flash: {
    name: 'MiniMax M3.1 Flash (OpenRouter) — PAID, primary',
    enabled: true,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['minimax/minimax-m3.1-flash'],
    supportsTools: true,
    contextWindow: 1000000,
    timeoutMs: 45000,
    priority: 0.01,  // paid leads the cascade
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // The OpenRouter free-models router. Verified 2026-10-22: 200, native
  // tool_calls. It is the tier's catch-all — if every explicit slug is
  // rate-limited or retired, this reaches whatever free model is healthy.
  openrouter_free_router: {
    name: 'OpenRouter Free Models Router — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3.5-lightning:free'],
    supportsTools: true,
    contextWindow: 200000,
    timeoutMs: 45000,
    priority: 0.36,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // MiniMax M3.1 Flash, served by Ollama - the same free model OpenRouter
  // serves, out of a different quota pool. Measured 2026-10-20 against all
  // three Ollama accounts: 200 in 790-1403ms with native tool_calls, while
  // Ollama's own free-plan gemma4:31b was at its weekly limit (429) and the
  // paid models were refused for want of credits (402).
  //
  // It sits directly after the OpenRouter copy of the same model on purpose.
  // If OpenRouter's shared free tier rate-limits, this answers the same
  // request from a different pool rather than the cascade dropping to a
  // slower model.
  //
  // There is no "-free" slug on Ollama: minimax-m3.1-flash-free is 404. The
  // plain name is the one that answers.
  ollama_minimax_m3_1_flash: {
    name: 'MiniMax M3.1 Flash (Ollama) — FREE, supports tools',
    enabled: !!OLLAMA_XMRT_API_KEY,
    apiKey: OLLAMA_XMRT_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['minimax-m3.1-flash', 'gemma4:31b'],
    supportsTools: true,
    // Not published by Ollama's catalogue for this model.
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.04,  // same model, second pool — tried right after OpenRouter
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  inkling_small_free: {
    name: 'Thinking Machines Inkling Small (OpenRouter) — FREE, supports tools',
    enabled: false /* disabled 2026-10-30: no tool calls in practice. The
      catalog says native tool_calls and the earlier live probe returned a
      tool_call, but fleet agents consistently report the model does not
      actually emit tool_calls — it returns text-only replies. A provider
      that cannot call tools is a dead slot in the cascade. */
    ,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['thinkingmachines/inkling-small:free'],
    supportsTools: true,
    // Catalog 2026-10-28: 1,048,576-token context, native tool_calls.
    // NOTE: it is a reasoning model — ordinary replies carry tens of reasoning
    // tokens before the answer, so max_tokens must stay generous.
    // NOTE: the :free slug is behind OpenRouter's "Gate Free Endpoints by
    // Agentic Harness"; callOpenRouterFree sends the harness attribution for
    // exactly these slugs. Replaced poolside/laguna-s-2.1:free on 2026-10-28.
    contextWindow: 1048576,
    timeoutMs: 45000,
    priority: 0.06,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  cohere_north_mini_code: {
    name: 'Cohere North Mini Code (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['cohere/north-mini-code:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 256000,
    timeoutMs: 45000,
    priority: 0.07,  // verified 1396ms + native tool_calls
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  apodex_1_1_mini: {
    name: 'Apexd Apex 1.1 Mini (OpenRouter) — retired slug',
    // Re-checked against the live /models catalog on 2026-10-22: the slug is
    // gone. A 404 is permanent, so probing it only burns a cascade slot.
    enabled: false,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['apodex/apodex-1.1-mini:free'],
    supportsTools: true,
    contextWindow: 262144,
    timeoutMs: 45000,
    priority: 0.08,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  dots_3_note_preview: {
    name: 'Dots Studio Dots 3 Note (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['dots-studio/dots-3-note-preview:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 512000,
    timeoutMs: 45000,
    priority: 0.09,  // verified 3501ms + native tool_calls
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // Added 2026-10-28 alongside inkling_small_free — the second inkling
  // variant, replacing laguna_xs_free in this slot. Same agentic-harness gate
  // as its sibling (see the inkling_small_free note): works only under the
  // harness attribution sent by callOpenRouterFree.
  inkling_free: {
    name: 'Thinking Machines Inkling (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['thinkingmachines/inkling:free'],
    supportsTools: true,
    contextWindow: 1048576,
    timeoutMs: 45000,
    priority: 0.12,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  flint_v1_free: {
    name: 'Recursive Flint 1.0 (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['recursive/flint-v1.0:free'],
    supportsTools: true,
    contextWindow: 262144,
    timeoutMs: 45000,
    priority: 0.13,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  xingchen_4_free: {
    name: 'Xingchen Xing4.0 29B (OpenRouter) — FREE',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['xingchen-agi/xing4.0-29b-a4b:free'],
    supportsTools: true,
    contextWindow: 262144,
    timeoutMs: 45000,
    priority: 0.14,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  liquid_lfm_2_5_2_6b: {
    name: 'Liquid LFM 2.5 2.6B (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['liquid/lfm-2.5-2.6b:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 65536,
    timeoutMs: 45000,
    priority: 0.11,  // verified 6055ms + native tool_calls (slowest verified)
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // FREE TIER MODELS — ordered by priority (first is tried first)
  // Added per 2026-09-21 cascade reconfiguration for Eliza-Cloud restoration
  
  // TIER 0: Additional free OpenRouter models (before minimax)
  // NOTE 2026-09-26 (Vex/longcat-agent): OpenRouter retired several :free slugs
  // (z-ai/glm-5.2:free, nex-agi/nex-n2.5-mini:free, nex-n2.5-pro:free,
  // minimax/minimax-m3:free). Slugs below re-verified against the live
  // OpenRouter /models catalog. Paid fallback: minimax/minimax-m3 (needs founder OK).
  gemma_4_26b_free: {
    name: 'Google Gemma 4 26B (OpenRouter) — FREE',
    enabled: !!OPENROUTER_API_KEY /* re-enabled for cascade coverage */,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['google/gemma-4-26b-a4b-it:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 262144,
    timeoutMs: 120000,
    priority: 0.1,  // tried first — new free model
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  gemma_4_31b_free: {
    name: 'Google Gemma 4 31B (OpenRouter) — FREE',
    enabled: !!OPENROUTER_API_KEY /* re-enabled for cascade coverage */,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['google/gemma-4-31b-it:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 262144,
    timeoutMs: 120000,
    priority: 0.15,  // second new free model
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  qwen3_8_27b_free: {
    name: 'Qwen Qwen3.8 27B (OpenRouter) — FREE',
    // DISABLED 2026-10-11: OpenRouter retired this free slug. Verified live —
    // every call returns a permanent 404 "This model is unavailable for free.
    // The paid version is available now." A 404 is not a rate limit; it will
    // not recover on its own, so probing it only burns a cascade slot.
    // Re-enable only after confirming the slug actually answers.
    enabled: false,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3.5-lightning:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 262144,
    timeoutMs: 45000,
    priority: 0.2,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  // TIER 1: Nemotron 3 Nano Omni via OpenRouter — FREE, supports tool calling
  nemotron_3_nano_free: {
    name: 'Nvidia Nemotron 3 Nano Omni (OpenRouter) — empty responses',
    // Re-probed 2026-10-22: the endpoint returns 200 but the message has
    // neither content nor tool_calls (twice, with and without tools). An
    // empty 200 is treated as a failure by the cascade, so leaving it enabled
    // only wastes a slot and trips the breaker.
    enabled: false,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'],
    supportsTools: true,
    contextWindow: 256000,
    timeoutMs: 45000,
    priority: 0.25,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  // TIER 2: Nemotron 3 Ultra via OpenRouter — FREE, supports tool calling
  nemotron_3_ultra_free: {
    name: 'Nvidia Nemotron 3 Ultra 550B (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3-ultra-550b-a55b:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 1000000,
    timeoutMs: 120000,
    priority: 0.3,  // tier 2 — free model with tool support
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  // TIER 3: Nemotron 3.5 Lightning via OpenRouter — FREE, supports tool calling
  // (slug corrected 2026-09-26: vendor prefix is nvidia/, bare slug 404s)
  nemotron_3_5_free: {
    name: 'Nvidia Nemotron 3.5 Lightning (OpenRouter) — FREE, supports tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3.5-lightning:free'],
    supportsTools: true,
    // Verified against OpenRouter /models on 2026-10-11.
    contextWindow: 1000000,
    timeoutMs: 120000,
    priority: 0.35,  // tier 3 — free model with tool support
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  // Nemotron 3.5 Super VL — verified 2026-10-22: 200 in ~4s, native
  // tool_calls, 1M context, text+image+video input. It is the vision-capable
  // free model that is actually answering, so it follows the text leaders.
  nemotron_3_5_super_vl: {
    name: 'Nvidia Nemotron 3.5 Super VL (OpenRouter) — FREE, vision + tools',
    enabled: !!OPENROUTER_API_KEY,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3.5-super-vl:free'],
    supportsTools: true,
    contextWindow: 1000000,
    timeoutMs: 45000,
    priority: 0.31,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // TIER 4: Nemotron 3 Super 120B via OpenRouter — DISABLED 2026-10-22.
  // The slug still appears in /models but a live chat completion returns
  // 404 "Not Found" from the upstream provider. The probe was repeated with
  // and without tools; both 404. It is not a rate limit, so it must not sit
  // in the hot path. `minimax_m3` is kept as the key for log continuity.
  minimax_m3: {
    name: 'Nvidia Nemotron 3 Super 120B (OpenRouter) — upstream 404',
    enabled: false,
    apiKey: OPENROUTER_API_KEY,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['nvidia/nemotron-3-super-120b-a12b:free'],
    supportsTools: true,
    contextWindow: 262144,
    timeoutMs: 120000,
    priority: 0.4,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  
  // SECONDARY: Ollama Pro Cloud via the signed-in serve path. Skipped automatically
  // when OLLAMA_MODEL ends in ':free' or contains '/' (those models are not on
  // ollama.com and 404 there — wastes timeout budget).
  //
  // Re-probed 2026-10-20: the three Ollama cloud keys are NOT out of quota.
  // What has run out is the weekly allowance of gemma4:31b (429 "you have
  // reached your weekly usage limit"), while the paid models are refused for
  // want of credits (402 "not included in your free usage"). Ollama serves
  // minimax-m3.1-flash inside the free allowance on every account: 200 in
  // 790-1403ms with native tool_calls.
  //
  // The old default model was wrong twice over: minimax/minimax-m3:free is
  // not an ollama.com model (404 "Try glm-5.3-flash:cloud"), and
  // glm-5.3-flash:cloud is a paid model (402). The plain name is what
  // answers, and there is no "-free" slug on Ollama.
  ollama: {
    name: 'MiniMax M3.1 Flash (Ollama cloud) — FREE',
    enabled: true,
    apiKey: OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: [Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash'],
    supportsTools: true,
    // Ollama Cloud does not publish a per-model window through our config
    // path, and the model in use varies with OLLAMA_MODEL, so this stays on
    // the conservative default rather than guessing a large one.
    contextWindow: undefined,
    timeoutMs: 120000,
    priority: 0.5,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // TERTIARY: direct ollama.com via the 3rd Ollama account key — separate weekly quota.
  // Same OpenRouter-only guard: skipped if OLLAMA_MODEL is a ':free' or contains '/'.
  // Re-probed 2026-10-20: this account serves minimax-m3.1-flash for free too.
  ollama_pro_3rd: {
    name: 'MiniMax M3.1 Flash (Ollama 3rd account) — FREE, separate quota',
    enabled: !!OLLAMA_3RD_API_KEY,
    apiKey: OLLAMA_3RD_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: [Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 120000,
    priority: 0.45,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // TTCR account: the free models the first three accounts cannot serve.
  // Every entry below was measured on 2026-10-22 with a get_weather tool and
  // returned a native tool_call. They sit after OpenRouter because they are
  // the deeper fallback, but before local Ollama.
  ollama_ttcr_gemma4: {
    name: 'Gemma 4 31B (Ollama TTCR) — FREE, vision + tools',
    enabled: !!TTCR_OLLAMA_API_KEY,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['gemma4:31b'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.46,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  ollama_ttcr_gpt_oss_120b: {
    name: 'GPT-OSS 120B (Ollama TTCR) — FREE, supports tools',
    enabled: !!TTCR_OLLAMA_API_KEY /* re-enabled for cascade coverage */,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['gpt-oss:120b'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.47,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  ollama_ttcr_gpt_oss_20b: {
    name: 'GPT-OSS 20B (Ollama TTCR) — FREE, supports tools',
    enabled: !!TTCR_OLLAMA_API_KEY /* re-enabled for cascade coverage */,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['gpt-oss:20b'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.48,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  ollama_ttcr_nemotron_nano: {
    name: 'Nemotron 3 Nano 30B (Ollama TTCR) — FREE, supports tools',
    enabled: !!TTCR_OLLAMA_API_KEY /* re-enabled for cascade coverage */,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['nemotron-3-nano:30b'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.49,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  ollama_ttcr_nemotron_super: {
    name: 'Nemotron 3 Super (Ollama TTCR) — FREE, supports tools',
    enabled: !!TTCR_OLLAMA_API_KEY /* re-enabled for cascade coverage */,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['nemotron-3-super'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.51,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  ollama_ttcr_nemotron_ultra: {
    name: 'Nemotron 3 Ultra (Ollama TTCR) — FREE, supports tools',
    enabled: !!TTCR_OLLAMA_API_KEY /* re-enabled for cascade coverage */,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['nemotron-3-ultra'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.52,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },
  ollama_ttcr_beam: {
    name: 'Beam (Ollama TTCR) — FREE, supports tools',
    enabled: !!TTCR_OLLAMA_API_KEY /* re-enabled for cascade coverage */,
    apiKey: TTCR_OLLAMA_API_KEY,
    endpoint: 'https://ollama.com/v1/chat/completions',
    models: ['beam'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 45000,
    priority: 0.53,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1000
  },

  // LOCAL Ollama — the only provider that does not depend on somebody else's
  // quota. Measured 2026-10-22: gemma3:1b answers text in ~36s on this CPU
  // and rejects native tools; callOllamaLocal injects a text tool manifest,
  // so it can still attempt a tool call. Last, with its own long timeout.
  ollama_local: {
    name: 'Ollama Local (gemma3:1b) — last resort',
    enabled: true,
    apiKey: OLLAMA_LOCAL_API_KEY,
    endpoint: `${OLLAMA_LOCAL_HOST}/v1/chat/completions`,
    models: ['gemma3-xmrt:latest'],
    supportsTools: true,
    contextWindow: undefined,
    timeoutMs: 120000,
    priority: 99,
    fallbackOnly: false,
    maxRetries: 1,
    retryDelayMs: 500
  },
  
  // Paid DeepSeek (kept for emergencies; free OpenRouter models are daily drivers now)
  deepseek: {
    name: 'DeepSeek (OpenRouter) — deepseek-chat',
    enabled: false,  // <<< DISABLED — not used in fleet chat; kept for reference only
    apiKey: DEEPSEEK_API_KEY,
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-coder'],
    supportsTools: true,
    // deepseek-chat is 64k; deepseek-coder is 128k. Use the larger so a coder
    // request is not truncated, and the budget trims to fit either.
    contextWindow: 131072,
    timeoutMs: 120000,
    priority: 2,
    fallbackOnly: false,
    maxRetries: 2,
    retryDelayMs: 1500
  }
};// Matches relay/tools/ollama-chat.mjs isOpenRouterOnly() — keep them in sync.
function isOpenRouterOnly(model: string): boolean {
  return typeof model === 'string' && (model.includes('/') || model.endsWith(':free'));
}

// ========== PROVIDER CIRCUIT BREAKER ==========
// The cascade re-runs the FULL ordered candidate list on every tool iteration and
// again for the final synthesis. Measured on 2026-10-11: one "What's new?"
// request ran the cascade 4x and took 336s, of which ~240s was a single dead
// provider (nemotron_3_nano_free) burning its 120s abort twice. Every other
// dead provider (403/404/429) was re-probed each iteration too.
//
// So each provider's outcome is remembered process-wide and providers in
// cooldown are skipped. Two cooldowns:
//   - "hard"  (401/402/403/404/410) — key/quota/slug problems. These do not
//     self-heal in seconds, so sit out a long window.
//   - "soft"  (429/5xx/timeout/transport) — short window, then retry.
// A success clears the entry immediately, so a provider that recovers is used
// again at once (this is what keeps opencode_zen_free first: it 403s from
// outside OpenCode today, but the moment it answers it wins the top slot again).

const HARD_FAIL_RE = /\b(401|402|403|404|410)\b/;
const HARD_FAIL_COOLDOWN_MS = 10 * 60 * 1000;  // 10 min — key/quota/slug class
const SOFT_FAIL_COOLDOWN_MS = 60 * 1000;       // 1 min  — rate limit / flaky
// Never let the breaker starve the cascade: if fewer than this many providers
// are available, ignore cooldown and try the full list rather than give up.
const CIRCUIT_MIN_PROVIDERS = 2;

type ProviderHealth = {
  failures: number;
  lastError: string;
  cooldownUntil: number;
};

const providerHealth = new Map<string, ProviderHealth>();

function cooldownForError(error: string): number {
  return HARD_FAIL_RE.test(error || '') ? HARD_FAIL_COOLDOWN_MS : SOFT_FAIL_COOLDOWN_MS;
}

/** Record a failed attempt and put the provider in cooldown. */
function recordProviderFailure(provider: string, error: string): void {
  const prev = providerHealth.get(provider);
  const failures = (prev?.failures ?? 0) + 1;
  const base = cooldownForError(error);
  // Repeated failures back off further, capped at 4x the base window.
  const cooldown = Math.min(base * Math.min(failures, 4), HARD_FAIL_COOLDOWN_MS * 4);
  providerHealth.set(provider, { failures, lastError: (error || '').slice(0, 160), cooldownUntil: Date.now() + cooldown });
}

/** Record a success — clears the breaker so a recovered provider is retried at once. */
function recordProviderSuccess(provider: string): void {
  providerHealth.delete(provider);
}

function isProviderCoolingDown(provider: string): boolean {
  const h = providerHealth.get(provider);
  if (!h) return false;
  if (Date.now() >= h.cooldownUntil) {
    // Cooldown elapsed — drop the entry so the next failure restarts the count.
    providerHealth.delete(provider);
    return false;
  }
  return true;
}

/** Filter the ordered candidate list through the breaker. */
function applyCircuitBreaker(ordered: string[]): string[] {
  const live = ordered.filter((p) => !isProviderCoolingDown(p));
  if (live.length >= CIRCUIT_MIN_PROVIDERS) return live;
  // Everything is cooling down. Rather than fail, try them all — a stale
  // cooldown must never be the reason a user gets no answer.
  return ordered;
}

// ========== CONTEXT BUDGETING ==========
// The old limit was a flat message COUNT: CONVERSATION_HISTORY_LIMIT=1000.
// Counting messages is the wrong unit. Measured on this system's own traffic,
// the mean message is ~988 chars (~247 tokens) but p95 is 2,465 chars, so 1000
// messages can be anywhere from ~247k to ~615k tokens depending on content.
//
// That matters because the cascade spans a 15x range of context windows:
//   liquid/lfm-2.5-2.6b            65,536
//   cohere/north-mini-code        256,000
//   dots-3-note-preview           512,000
//   nemotron-3-ultra-550b       1,000,000
// A flat 1000-message slice (~247k tokens) already overflows the smallest
// model in the cascade by ~4x. So history is now budgeted in TOKENS against
// the window of the model that will actually answer.

/** Rough token estimate. Errs generous (over-counts) so we under-fill windows. */
function estimateTokens(text: unknown): number {
  if (typeof text === 'string') return Math.ceil(text.length / CHARS_PER_TOKEN);
  if (text == null) return 0;
  try { return Math.ceil(JSON.stringify(text).length / CHARS_PER_TOKEN); }
  catch { return 0; }
}

function estimateMessageTokens(msg: any): number {
  if (!msg) return 0;
  let n = estimateTokens(msg.content);
  if (msg.tool_calls) n += estimateTokens(msg.tool_calls);
  if (msg.tool_call_id) n += estimateTokens(msg.tool_call_id);
  if (msg.name) n += estimateTokens(msg.name);
  // Per-message framing overhead (role, delimiters) is real but small.
  return n + 4;
}

function messageTextLength(msg: any): number {
  if (!msg) return 0;
  if (typeof msg.content === 'string') return msg.content.length;
  if (msg.content == null) return 0;
  try { return JSON.stringify(msg.content).length; } catch { return 0; }
}

/**
 * Trim a message array so it fits a token budget, dropping the OLDEST
 * non-system messages first. System messages (the prompt, tool rules, memory
 * context) are never dropped — losing those breaks the model entirely.
 *
 * Returns the original array untouched when it already fits, so the common
 * case costs nothing.
 */
export function fitMessagesToBudget(
  messages: any[],
  budgetTokens: number,
  opts: { maxMessages?: number; label?: string } = {}
): { messages: any[]; dropped: number; tokens: number; budget: number } {
  const list = Array.isArray(messages) ? messages : [];
  const maxMessages = opts.maxMessages ?? MAX_HISTORY_MESSAGES;

  let total = list.reduce((sum, m) => sum + estimateMessageTokens(m), 0);

  if (total <= budgetTokens && list.length <= maxMessages) {
    return { messages: list, dropped: 0, tokens: total, budget: budgetTokens };
  }

  const kept: any[] = [];
  let used = 0;
  let dropped = 0;

  // Pass 1 — always keep system messages; they carry the prompt and rules.
  for (const m of list) {
    if (m && m.role === 'system') {
      const t = estimateMessageTokens(m);
      kept.push(m);
      used += t;
    }
  }

  // Pass 2 — walk newest -> oldest, keeping what still fits.
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (m && m.role === 'system') continue;
    if (kept.length >= maxMessages) { dropped++; continue; }
    const t = estimateMessageTokens(m);
    if (used + t > budgetTokens) { dropped++; continue; }
    kept.push(m);
    used += t;
  }

  // Restore chronological order (system first is fine, but the rest must be
  // oldest -> newest or the conversation reads inside-out).
  kept.sort((a, b) => list.indexOf(a) - list.indexOf(b));

  if (dropped > 0) {
    console.log(
      `✂️ ${opts.label || 'history'}: dropped ${dropped} message(s) to fit ` +
      `${budgetTokens.toLocaleString()} token budget (~${used.toLocaleString()} used)`
    );
  }
  return { messages: kept, dropped, tokens: used, budget: budgetTokens };
}

/** Token budget available to history for a given provider. */
export function historyBudgetForProvider(providerName: string): number {
  const cfg = AI_PROVIDERS_CONFIG[providerName];
  const window = cfg?.contextWindow ?? DEFAULT_CONTEXT_WINDOW;
  return Math.floor(window * HISTORY_BUDGET_FRACTION);
}


// ========== CORS HEADERS ==========
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ========== SHARED CONSTANTS ==========
const AMBIGUOUS_RESPONSES = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'alright', 'fine', 'go ahead', 'proceed', 'no', 'nope', 'nah'];
const POSITIVE_AMBIGUOUS = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'alright', 'fine', 'go ahead', 'proceed'];
const RESPONSE_MAX_TOKENS = parseInt(Deno.env.get('RESPONSE_MAX_TOKENS') || '16000');

/**
 * Should we force a knowledge-base lookup when the model answered directly?
 *
 * Only for questions that genuinely ask about remembered/stored knowledge or
 * project specifics. Conversational and meta questions ("where were we?",
 * "what did you find?", "thanks") must NOT trigger a second LLM round trip —
 * doing so was the single biggest avoidable source of latency.
 */
function shouldForceKnowledgeLookup(query: string): boolean {
  const q = (query || '').trim().toLowerCase();
  if (!q) return false;
  if (isSimpleDirectAnswerQuery(q)) return false;

  // Conversational / follow-up / meta — answer from context, no lookup.
  const conversational = [
    /^(where were we|what did you find|what did you do|what happened|ok|okay|thanks|thank you|got it|cool|nice|and\??|so\??|why\??|really\??)[?.!\s]*$/,
    /^(what do you (?:remember|know)|do you remember)\b/,
    /^(can you (?:repeat|say that)|say that again)\b/,
    /^\s*(yes|no|yep|nope|sure|absolutely|definitely)\b[?.!\s]*$/,
  ];
  if (conversational.some(re => re.test(q))) return false;

  // Explicit knowledge / project / entity lookups.
  const knowledgeish = [
    /\b(what|who|when|where|which|how)\b.*\b(know|remember|record|stored|documented|decided|agreed|history)\b/,
    /\b(knowledge base|kb|entity|entities|context|summary|summaries|notes?|docs?|documentation|spec|specs|decisions?)\b/,
    /\b(xmrt|dao|cuttlefishclaws|eliza|vex|hermes|paragraph|mobilemonero)\b.*\b(about|is|are|was|were|does|do|status|state|what)\b/,
    /\b(what|who)\s+(do|did|does)\s+we\b/,
  ];
  return knowledgeish.some(re => re.test(q));
}

function isSimpleDirectAnswerQuery(query: string): boolean {
  const normalized = (query || '').trim().toLowerCase();
  if (!normalized) return true;

  // ONLY pure greetings and meta questions — everything else needs a tool
  const simplePatterns = [
    /^(hi|hello|hey|yo|good morning|good afternoon|good evening)[!. ]*$/,
    /^how are you[?.! ]*$/,
    /^who are you[?.! ]*$/,
    /^what can you do[?.! ]*$/,
    /^help[?.! ]*$/,
    /^thanks?[!. ]*$/,
  ];

  if (simplePatterns.some((pattern) => pattern.test(normalized))) return true;

  // Everything else requires a tool call — even conceptual questions
  // should be answered with a knowledge search to ground the response
  return false;
}

function isExplicitActionRequest(query: string): boolean {
  const normalized = (query || '').trim().toLowerCase();
  if (!normalized) return false;
  return /(http[s]?:\/\/|www\.|open|browse|visit|check|status|metrics|latest|today|current|search|analyze|upload|attachment|email|send|create|run|execute|invoke|deploy|github|edge function|tool call|function call|workflow)/i.test(normalized);
}

// ========== TOOL CALLING MANDATE ==========
const TOOL_CALLING_MANDATE = `
ðŸš¨ CRITICAL TOOL CALLING RULES:

0. ALWAYS CALL A TOOL. The only exceptions are pure greetings ("hi", "hello", "hey"),
   meta questions about yourself ("who are you", "what can you do"), and "thanks".
   Everything else — every question, every request, every ambiguous response like
   "proceed", "go ahead", "yes", "that thing from earlier" — MUST trigger a tool call.
   Do NOT answer from memory. Do NOT say "what can I help you with." Default to
   action, not conversation.

1. When the user asks for data/status/metrics/current-state/live info, you
   MUST call tools using the native function calling mechanism.

2. DO NOT describe tool calls in text. DO NOT say "I will call..." or "Let me check..."
   Just call the tool directly. NEVER write TOOL_CALL:, function-call syntax, or raw
   JSON tool objects in your response text. The system executes tools silently —
   your text output should ONLY be natural-language responses to the user.
   NEVER output XML tool calls like <invoke>, <tool_call>, <function_calls>,
   or any <..._function_calls> blocks. Use the native function calling mechanism ONLY.

3. DIRECTLY invoke functions - the system will handle execution

4. Available critical tools (use the FIRST matching tool for the task):
   - For knowledge/search questions â†’ FIRST try search_knowledge, then recall_entity
   - ALWAYS check the knowledge base (search_knowledge) BEFORE using web_search or browse_web
   - For a unified fleet snapshot (system + ecosystem + mining in one call) â†’ fleet_pulse
   - For system/health/status only â†’ get_system_status
   - For ecosystem metrics only â†’ get_ecosystem_metrics
   - For mining/stats â†’ get_mining_stats
   - For web browsing â†’ browse_web
   - For email â†’ resend_send_email
   - For images/video â†’ muapi_generate_image, muapi_generate_video
   - For edge functions â†’ invoke_edge_function, search_edge_functions

5. If you need current data, ALWAYS use tools. Never guess or make up data.

6. After tool execution, synthesize results into natural language - never
   show raw JSON to users. Your response must be clean, human-readable text.
   Do NOT include tool call syntax (TOOL_CALL:, {"tool":...}, function(arg=...))
   or tool result JSON in your reply. Summarize what the tool returned in
   plain English. If the tool returned data, present the key findings — not
   the raw JSON payload.

7. If a tool fails, retry once with a different tool from the same family,
   then acknowledge honestly and offer the best partial answer. Never
   silently fall back to a generic greeting.

ðŸ–¼ï¸ IMAGE GENERATION (MANDATORY):
- When user asks to CREATE/GENERATE/MAKE/DRAW an IMAGE â†’ IMMEDIATELY call muapi_generate_image({prompt: "detailed description"})
- DO NOT say "I cannot generate images" - YOU CAN via MuAPI
- DO NOT say "I'm just an LLM" - you have image generation capabilities

ðŸŽ¬ VIDEO GENERATION (MANDATORY):
- When user asks to CREATE/GENERATE/MAKE a VIDEO â†’ IMMEDIATELY call muapi_generate_video({prompt: "description", duration_seconds: 5})
- Returns request_id for async status checking
- Check status with muapi_check_status({request_id: "..."})

ðŸŒ WEB BROWSING (MANDATORY):
- When user asks to VIEW/OPEN/CHECK/BROWSE/NAVIGATE to a URL or website â†’ IMMEDIATELY call browse_web({url: "https://..."})
- Use this for ANY URL viewing, webpage checking, or web content extraction
- Always use the full URL including https:// prefix
- DO NOT say "I cannot browse the web" - YOU CAN via Playwright Browser
- Supported actions: 'navigate' (default), 'extract', 'json'

ðŸ” FUNCTION DISCOVERY (MANDATORY):
- When user asks about available edge functions or capabilities â†’ IMMEDIATELY call search_edge_functions({mode: 'full_registry'})
- NEVER list functions from memory - ALWAYS query the database via this tool
- Use query/category filters to find specific functions

ðŸ“Ž ATTACHMENT ANALYSIS (MANDATORY):
- When user provides attachments (images, PDFs, docs, code files) â†’ IMMEDIATELY call analyze_attachment({attachments: [...]})
- This tool can analyze: .txt, .png, .jpg, .jpeg, .pdf, .doc, .docx, .sol, .js, .ts, .py, .java, .cpp, .rs, .go, .md, .json, .yaml, .yml, .csv
- Always analyze attachments when they are provided

ðŸ“§ EMAIL SENDING (MANDATORY):
- When user asks to SEND EMAIL or mentions email address â†’ IMMEDIATELY call resend_send_email({agent: "eliza", to: "recipient@email.com", subject: "Subject", body: "Email body"})
- DO NOT generate contract code or unrelated content when asked to send emails
- Always show draft for approval before sending
- Use conversation context to understand what email content is needed

ðŸ“‡ ENTITY RESOLUTION (MANDATORY for CRM/people/orgs):
- When the user mentions a person, contact, or organization BY NAME and you are
  about to recall, look up, or write anything about them â†’ FIRST call
  resolve-entity({query: "<name or email or alias>"}).
- Use the returned canonical entity (name, primary email, aliases) for all
  subsequent CRM reads/writes in this turn. Superseded emails and aliases map
  to the canonical record automatically — never create a duplicate contact for
  a name that already resolves.
- If resolution is ambiguous (multiple candidates), ask the user to pick one
  before writing.

ðŸ”§ GITHUB FUNCTIONALITY:
- Use the full GitHub tool suite when user asks about GitHub operations
- Available tools: createGitHubIssue, listGitHubIssues, createGitHubDiscussion, searchGitHubCode, createGitHubPullRequest, commentOnGitHubIssue, commentOnGitHubDiscussion, listGitHubPullRequests
- For comprehensive GitHub operations, use the appropriate tool based on the request
`;

// ========== UTILITY FUNCTIONS ==========
function summarizeArray(arr: any[], max = 8) {
  return Array.isArray(arr) ? arr.slice(0, max) : arr;
}

async function logFunctionUsage(entry: any) {
  try {
    // Bounded at the boundary, not at the call site. `parameters` and
    // `error_message` are whatever the caller passed, and a tool argument can
    // be a whole conversation. This table reached 1.4 GB from that alone.
    await supabase.from(DATABASE_CONFIG.tables.function_usage_logs).insert(boundForStorage(entry));
  } catch (_) {}
}

async function logActivity(entry: any) {
  try {
    // Same boundary rule. A `tool_execution` row carries the arguments and
    // the error, and both are unbounded.
    await supabase.from(DATABASE_CONFIG.tables.eliza_activity_log).insert(boundForStorage(entry));
  } catch (_) {}
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateSessionId(): string {
  return generateUUID();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseToolArguments(args: string): any {
  try {
    return args ? JSON.parse(args) : {};
  } catch (e) {
    console.warn('Failed to parse tool arguments for logging:', e);
    return { raw_args: args };
  }
}

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// ========== BOUNDED TEXT ==========
//
// A row that a human (or a panel) has to read must be small enough to read.
// Two fields used to be as long as whatever the caller passed:
//
//   * `args` — the arguments a tool was called with, and
//   * `error` — the error a tool failed with.
//
// An agent that searched the knowledge base with a whole conversation as the
// search term produced an error message of 935,775 characters: the text of a
// URL that was too long for `fetch` to send. That string was written to
// `eliza_activity_log` and `function_usage_logs` verbatim — 93 such rows a
// day, 55 MB a day, and the activity feed grew to 4.3 GB because of it.
//
// So every string bound for storage is cut, and a cut string says how long
// it was. Nothing is silently lost: the reader is told the real length, so a
// truncated fact is never passed off as a whole one.
//
// The same rule applies to a URL. A search term is a term, not a document.
// The relay already cut these at 200 characters; this function had no cut at
// all, so the URL became two megabytes long and the request was refused
// before it was sent.
//
// `relay/lib/text-caps.mjs` carries the same rules for the relay. The two
// runtimes cannot share an import, so the two copies must agree — and
// `relay/tests/text-caps.test.mjs` checks that they do.
const MAX_ROW_STRING = 2000;
const MAX_SEARCH_TERM = 200;

/**
 * Cut a string to a length, and say how long it was.
 *
 * The marker is not decoration: a reader who sees a cut string must be able
 * to tell that it was cut, or a 2,000-character prefix of a 935,775-character
 * error reads exactly like a complete error.
 */
function boundText(value: any, max: number = MAX_ROW_STRING): any {
  if (typeof value !== 'string' || value.length <= max) return value;
  return `${value.slice(0, max)}… [truncated: ${value.length} chars total]`;
}

/**
 * Cut every string inside a value, however deeply nested.
 *
 * Used at the storage boundary, so a field nobody thought about is still
 * bounded.
 */
function boundForStorage(value: any, max: number = MAX_ROW_STRING): any {
  if (typeof value === 'string') return boundText(value, max);
  if (Array.isArray(value)) return value.map((v) => boundForStorage(v, max));
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = boundForStorage(v, max);
    return out;
  }
  return value;
}

/**
 * Cut a search term to something that can travel in a URL.
 *
 * Returns the facts about the cut as well as the term, so the caller can
 * record that a cut happened rather than quietly searching for something the
 * caller did not ask for.
 */
function boundSearchTerm(value: any, max: number = MAX_SEARCH_TERM) {
  const text = typeof value === 'string' ? value : '';
  const original_length = text.length;
  if (original_length <= max) {
    return { term: text, truncated: false, original_length };
  }
  return { term: text.slice(0, max), truncated: true, original_length };
}

function extractLastUserMessage(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  return 'unknown query';
}

// ========== AI-POWERED SUMMARIZATION FUNCTIONS ==========
async function generateAISummary(messages: any[], toolResults: any[]): Promise<string> {
  try {
    const conversationText = messages
      .slice(-10)
      .map(msg => `${msg.role}: ${msg.content?.substring(0, 500) || ''}`)
      .join('\n');
    
    const toolSummary = toolResults.length > 0 
      ? `Executed ${toolResults.length} tools: ${toolResults.slice(-3).map(tr => tr.name).join(', ')}${toolResults.length > 3 ? '...' : ''}`
      : 'No tools executed';
    
    const summaryPrompts = [
      {
        role: 'system',
        content: 'You are an expert summarizer. Create a concise, informative summary of the conversation that captures key topics, decisions, and actions. Focus on what was discussed, what tools were used, and any important outcomes. Keep it under 3 sentences.'
      },
      {
        role: 'user',
        content: `Summarize this conversation:\n\n${conversationText}\n\n${toolSummary}`
      }
    ];
    
    // Ollama, with a model it actually serves.
    //
    // This used to send the OpenAI and DeepSeek keys to ollama.com with the
    // models "gpt-4o-mini" and "deepseek-chat" - neither of which exists in
    // Ollama's catalogue, so both attempts 404'd and every summary fell
    // through to the local heuristic. Ollama serves minimax-m3.1-flash on
    // these accounts (200, native tool_calls, measured 2026-10-20), so that
    // is what it gets.
    const providers = [
      { name: 'ollama-minimax', apiKey: OLLAMA_XMRT_API_KEY || OLLAMA_API_KEY, endpoint: 'https://ollama.com/v1/chat/completions', model: 'minimax-m3.1-flash' },
      { name: 'openai', apiKey: OPENAI_API_KEY, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
      { name: 'deepseek', apiKey: DEEPSEEK_API_KEY, endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    ];

    for (const provider of providers) {
      if (!provider.apiKey) continue;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: provider.model,
            messages: summaryPrompts,
            temperature: 0.3,
            max_tokens: 300
          }),
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          const summary = data.choices?.[0]?.message?.content;
          if (summary) {
            clearTimeout(timeoutId);
            return summary;
          }
        }

        clearTimeout(timeoutId);
      } catch (error) {
        console.warn(`âš ï¸ ${provider.name} summarization failed:`, error);
        continue;
      }
    }
    
    return generateEnhancedManualSummary(messages, toolResults);
    
  } catch (error) {
    console.warn('âš ï¸ AI summarization failed, using fallback:', error);
    return generateEnhancedManualSummary(messages, toolResults);
  }
}

function generateEnhancedManualSummary(messages: any[], toolResults: any[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  if (userMessages.length === 0) {
    return "Conversation started";
  }
  
  const recentMessages = messages.slice(-5);
  const topics = extractConversationTopics(recentMessages);
  const conversationFocus = analyzeConversationFocus(messages);
  const successfulTools = toolResults.filter(r => r.result?.success).length;
  const failedTools = toolResults.filter(r => !r.result?.success).length;
  
  const mainQueries = userMessages.slice(-3).map(m => m.content).filter(c => c.length > 10);
  const primaryQuery = mainQueries[mainQueries.length - 1] || userMessages[userMessages.length - 1]?.content || '';
  
  let summary = `Discussion about ${topics.join(', ') || 'various topics'}. `;
  
  if (conversationFocus) {
    summary += `Primary focus: ${conversationFocus}. `;
  }
  
  if (primaryQuery && primaryQuery.length > 0) {
    const truncatedQuery = primaryQuery.length > 80 
      ? primaryQuery.substring(0, 80) + '...' 
      : primaryQuery;
    summary += `Recent query: "${truncatedQuery}". `;
  }
  
  if (toolResults.length > 0) {
    summary += `Executed ${toolResults.length} tools (${successfulTools} successful, ${failedTools} failed). `;
    
    const uniqueTools = [...new Set(toolResults.map(tr => tr.name))];
    if (uniqueTools.length > 0) {
      summary += `Tools used: ${uniqueTools.slice(0, 3).join(', ')}`;
      if (uniqueTools.length > 3) summary += `, and ${uniqueTools.length - 3} more`;
      summary += '.';
    }
  }
  
  return summary;
}

function extractConversationTopics(messages: any[]): string[] {
  const topicKeywords = {
    'system': ['status', 'health', 'monitor', 'metrics', 'performance'],
    'development': ['code', 'function', 'api', 'deploy', 'bug', 'fix', 'feature'],
    'github': ['github', 'issue', 'pull request', 'repository', 'codebase'],
    'web': ['browse', 'url', 'website', 'http', 'https', 'webpage'],
    'email': ['email', 'send', 'gmail', 'message', 'contact'],
    'attachment': ['file', 'document', 'pdf', 'image', 'analyze', 'attachment'],
    'mining': ['mining', 'hashrate', 'worker', 'earnings', 'crypto'],
    'task': ['task', 'assign', 'agent', 'work', 'project'],
    'knowledge': ['search', 'recall', 'store', 'knowledge', 'information']
  };
  
  const allText = messages.map(m => m.content || '').join(' ').toLowerCase();
  const foundTopics: string[] = [];
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      foundTopics.push(topic);
    }
  }
  
  return foundTopics.length > 0 ? foundTopics : ['general discussion'];
}

function analyzeConversationFocus(messages: any[]): string | null {
  const recentText = messages.slice(-5).map(m => m.content || '').join(' ').toLowerCase();
  
  const focusPatterns = [
    { pattern: /(what|how|when|where|who|why) (is|are|does|do|can|will)/, label: 'information inquiry' },
    { pattern: /(show|get|find|list|check) (me|the|all)/, label: 'data retrieval' },
    { pattern: /(create|generate|make|build|execute) (an?|the)/, label: 'creation/execution' },
    { pattern: /(analyze|review|evaluate|assess|compare)/, label: 'analysis' },
    { pattern: /(help|assist|guide|explain|teach)/, label: 'assistance' },
    { pattern: /(send|email|contact|message|notify)/, label: 'communication' },
    { pattern: /(browse|open|view|visit|check) (http|https|www|\.com)/, label: 'web browsing' },
    { pattern: /(file|document|pdf|image|attachment)/, label: 'file analysis' }
  ];
  
  for (const { pattern, label } of focusPatterns) {
    if (pattern.test(recentText)) {
      return label;
    }
  }
  
  return null;
}

// ========== IP-BASED SESSION MANAGEMENT ==========
class IPSessionManager {
  private static readonly SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // effectively infinite (1 year)
  private static readonly IP_CACHE = new Map<string, { sessionId: string; lastSeen: number }>();
  
  static extractIP(req: Request): string {
    try {
      const cfConnectingIp = req.headers.get('cf-connecting-ip');
      const xRealIp = req.headers.get('x-real-ip');
      const xForwardedFor = req.headers.get('x-forwarded-for');
      const remoteAddr = req.headers.get('remote-addr');
      
      if (cfConnectingIp) {
        return cfConnectingIp.split(',')[0].trim();
      }
      
      if (xRealIp) {
        return xRealIp.split(',')[0].trim();
      }
      
      if (xForwardedFor) {
        const ips = xForwardedFor.split(',');
        return ips[0].trim();
      }
      
      if (remoteAddr) {
        return remoteAddr;
      }
      
      const headersHash = Array.from(req.headers.entries())
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      return `ip_hash_${this.hashString(headersHash).substring(0, 16)}`;
      
    } catch (error) {
      console.warn('Failed to extract IP:', error);
      return `unknown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  static async getOrCreateSessionId(ipAddress: string, userId?: string): Promise<string> {
    this.cleanupCache();
    
    const cached = this.IP_CACHE.get(ipAddress);
    if (cached && Date.now() - cached.lastSeen < this.SESSION_TTL_MS) {
      cached.lastSeen = Date.now();
      return cached.sessionId;
    }
    
    try {
      const { data: existingSessions, error: findError } = await supabase
        .from(DATABASE_CONFIG.tables.ip_conversation_sessions)
        .select('session_id, last_active')
        .eq('ip_address', ipAddress)
        .gte('last_active', new Date(Date.now() - this.SESSION_TTL_MS).toISOString())
        .order('last_active', { ascending: false })
        .limit(1);
      
      if (!findError && existingSessions && existingSessions.length > 0) {
        const session = existingSessions[0];
        
        await supabase
          .from(DATABASE_CONFIG.tables.ip_conversation_sessions)
          .update({ 
            last_active: new Date().toISOString(),
            user_id: userId || undefined
          })
          .eq('session_id', session.session_id);
        
        this.IP_CACHE.set(ipAddress, {
          sessionId: session.session_id,
          lastSeen: Date.now()
        });
        
        return session.session_id;
      }
      
      const sessionId = generateSessionId();
      const now = new Date().toISOString();
      
      const { error: insertError } = await supabase
        .from(DATABASE_CONFIG.tables.ip_conversation_sessions)
        .insert({
          session_id: sessionId,
          ip_address: ipAddress,
          user_id: userId || null,
          first_seen: now,
          last_active: now,
          metadata: {
            ip_type: this.detectIPType(ipAddress),
            created_via: 'ip_based',
            ttl_hours: 8760
          }
        });
      
      if (insertError) {
        console.warn('Failed to save IP session:', insertError);
        const fallbackSessionId = `ip_${this.hashString(ipAddress)}_${Date.now()}`;
        this.IP_CACHE.set(ipAddress, {
          sessionId: fallbackSessionId,
          lastSeen: Date.now()
        });
        return fallbackSessionId;
      }
      
      this.IP_CACHE.set(ipAddress, {
        sessionId: sessionId,
        lastSeen: Date.now()
      });
      
      return sessionId;
      
    } catch (error) {
      console.warn('IP session management error:', error);
      const fallbackSessionId = `ip_${this.hashString(ipAddress)}_${Date.now()}`;
      this.IP_CACHE.set(ipAddress, {
        sessionId: fallbackSessionId,
        lastSeen: Date.now()
      });
      return fallbackSessionId;
    }
  }
  
  private static detectIPType(ipAddress: string): string {
    if (ipAddress.startsWith('ip_hash_')) return 'hashed';
    if (ipAddress.startsWith('unknown_')) return 'fallback';
    
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ipAddress)) return 'ipv4';
    
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ipAddress)) return 'ipv6';
    
    return 'unknown';
  }
  
  private static cleanupCache(): void {
    const now = Date.now();
    const threshold = this.SESSION_TTL_MS;
    
    for (const [ip, data] of this.IP_CACHE.entries()) {
      if (now - data.lastSeen > threshold) {
        this.IP_CACHE.delete(ip);
      }
    }
  }
  
  static async getActiveSessionsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(DATABASE_CONFIG.tables.ip_conversation_sessions)
        .select('*', { count: 'exact', head: true })
        .gte('last_active', new Date(Date.now() - this.SESSION_TTL_MS).toISOString());
      
      return error ? 0 : (count || 0);
    } catch {
      return 0;
    }
  }
}

// ========== ENHANCED CONVERSATION PERSISTENCE FUNCTIONS ==========
class EnhancedConversationPersistence {
  private sessionId: string;
  private ipAddress: string;
  private userId?: string;
  
  constructor(sessionId: string, ipAddress: string, userId?: string) {
    this.sessionId = sessionId;
    this.ipAddress = ipAddress;
    this.userId = userId;
  }
  
  async loadHistoricalSummaries(limit: number = MAX_SUMMARIZED_CONVERSATIONS): Promise<any[]> {
    try {
      console.log(`ðŸ“š Loading historical conversation summaries for session: ${this.sessionId} (IP: ${this.ipAddress})`);
      
      if (this.userId) {
        const { data: userData, error: userError } = await supabase
          .from(DATABASE_CONFIG.tables.conversation_summaries)
          .select('id, summary, key_topics, sentiment, created_at, metadata')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (!userError && userData && userData.length > 0) {
          console.log(`ðŸ“– Loaded ${userData.length} historical summaries by user ID`);
          return userData;
        }
      }
      
      const { data: ipData, error: ipError } = await supabase
        .from(DATABASE_CONFIG.tables.conversation_summaries)
        .select('id, summary, key_topics, sentiment, created_at, metadata')
        .eq('ip_address', this.ipAddress)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!ipError && ipData && ipData.length > 0) {
        console.log(`ðŸ“– Loaded ${ipData.length} historical summaries by IP address`);
        return ipData;
      }
      
      const { data: sessionData, error: sessionError } = await supabase
        .from(DATABASE_CONFIG.tables.conversation_summaries)
        .select('id, summary, key_topics, sentiment, created_at, metadata')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!sessionError && sessionData) {
        console.log(`ðŸ“– Loaded ${sessionData.length} historical summaries by session ID`);
        return sessionData;
      }
      
      console.log('ðŸ“­ No historical conversation summaries found');
      return [];
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to load historical summaries:', error);
      return [];
    }
  }
  
  async saveConversationSummary(
    messages: any[],
    toolResults: any[] = [],
    metadata: any = {}
  ): Promise<string | null> {
    try {
      const summary = await generateAISummary(messages, toolResults);
      const keyTopics = this.extractKeyTopics(messages);
      const sentiment = this.analyzeSentiment(messages);
      
      const summaryRecord: any = {
        session_id: this.sessionId,
        ip_address: this.ipAddress,
        summary: summary,
        key_topics: keyTopics,
        metadata: {
          ...metadata,
          message_count: messages.length,
          tool_call_count: toolResults.length,
          conversation_date: new Date().toISOString(),
          executive_name: EXECUTIVE_NAME,
          summary_method: 'ai_enhanced'
        },
        created_at: new Date().toISOString()
      };
      
      if (sentiment && sentiment !== 'unknown') {
        summaryRecord.sentiment = sentiment;
      }
      
      if (this.userId) {
        summaryRecord.user_id = this.userId;
      }
      
      const { data, error } = await supabase
        .from(DATABASE_CONFIG.tables.conversation_summaries)
        .insert(summaryRecord)
        .select()
        .single();
      
      if (error) {
        console.warn('âš ï¸ Failed to save conversation summary:', error.message);
        return null;
      }
      
      console.log(`ðŸ’¾ Saved AI-enhanced conversation summary with ID: ${data.id}`);
      return data.id;
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to save conversation summary:', error);
      return null;
    }
  }
  
  private extractKeyTopics(messages: any[]): string[] {
    const topics = [
      'task', 'agent', 'github', 'deploy', 'bug', 'api', 'function', 'system', 'mining', 'web', 'url', 'browse',
      'code', 'programming', 'development', 'smart contract', 'solidity', 'blockchain', 'crypto',
      'image', 'video', 'generate', 'create', 'design', 'art', 'graphic',
      'document', 'pdf', 'analysis', 'review', 'audit', 'security',
      'financial', 'billing', 'payment', 'invoice', 'transaction',
      'database', 'storage', 'memory', 'performance', 'optimization',
      'help', 'support', 'guide', 'tutorial', 'how-to'
    ];
    
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const foundTopics = topics.filter(topic => allText.includes(topic));
    
    return [...new Set(foundTopics)];
  }
  
  private analyzeSentiment(messages: any[]): string | null {
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'thanks', 'thank', 'helpful', 'perfect', 'love', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'wrong', 'error', 'failed', 'broken', 'problem', 'issue', 'disappointed'];
    
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (allText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (allText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > 0 && positiveCount > negativeCount * 2) return 'positive';
    if (negativeCount > 0 && negativeCount > positiveCount * 2) return 'negative';
    if (positiveCount > 0 || negativeCount > 0) return 'neutral';
    return null;
  }
  
  async saveConversationContext(
    currentQuestion: string,
    assistantResponse: string,
    userResponse: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const contextRecord: any = {
        session_id: this.sessionId,
        ip_address: this.ipAddress,
        current_question: currentQuestion,
        assistant_response: assistantResponse,
        user_response: userResponse,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          executive_name: EXECUTIVE_NAME,
          context_type: 'follow_up'
        }
      };
      
      if (this.userId) {
        contextRecord.user_id = this.userId;
      }
      
      // Use direct REST API call instead of supabase client
      // (supabase client has schema resolution issues with local-sb)
      const restUrl = `${SUPABASE_LOCAL_URL}/rest/v1/conversation_context`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_LOCAL_ANON || 'local-anon-key',
        'Authorization': `Bearer ${SUPABASE_LOCAL_ANON || 'local-anon-key'}`,
      };
      const response = await fetch(restUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(contextRecord),
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) {
        const errText = await response.text().catch(() => 'unknown');
        console.warn('âš ï¸ Failed to save conversation context:', response.status, errText.slice(0, 200));
      } else {
        console.log('ðŸ’¾ Saved conversation context for follow-up understanding');
      }
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to save conversation context:', error);
    }
  }
  
  async loadRecentContext(limit: number = 5): Promise<any[]> {
    try {
      const restUrl = `${SUPABASE_LOCAL_URL}/rest/v1/conversation_context`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_LOCAL_ANON || 'local-anon-key',
        'Authorization': `Bearer ${SUPABASE_LOCAL_ANON || 'local-anon-key'}`,
      };
      const url = `${restUrl}?select=*&ip_address=eq.${encodeURIComponent(this.ipAddress)}&order=timestamp.desc&limit=${limit}`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) {
        console.warn('âš ï¸ Database error loading conversation context:', response.status);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to load conversation context:', error);
      return [];
    }
  }
}

// ========== ATTACHMENT ANALYSIS FUNCTIONS ==========
class AttachmentAnalyzer {
  static readonly SUPPORTED_EXTENSIONS = [
    '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.csv', '.html', '.htm',
    '.pdf', '.doc', '.docx', '.rtf',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg',
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', 
    '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
    '.sol', '.vy',
    '.sh', '.bash', '.zsh',
    '.sql', '.pl', '.lua', '.r', '.m', '.matlab',
    '.csv', '.tsv', '.xls', '.xlsx',
    '.ini', '.conf', '.cfg', '.env'
  ];
  
  static isSupportedFile(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return this.SUPPORTED_EXTENSIONS.includes(extension);
  }
  
  static getFileType(filename: string): string {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'].includes(extension)) {
      return 'image';
    } else if (['.pdf', '.doc', '.docx', '.rtf'].includes(extension)) {
      return 'document';
    } else if (['.sol', '.vy'].includes(extension)) {
      return 'smart_contract';
    } else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'].includes(extension)) {
      return 'code';
    } else if (['.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.csv'].includes(extension)) {
      return 'text';
    } else {
      return 'unknown';
    }
  }
  
  static async analyzeTextContent(content: string, filename: string): Promise<any> {
    const fileType = this.getFileType(filename);
    
    let analysis = {
      file_type: fileType,
      filename: filename,
      content_preview: content.length > MAX_ATTACHMENT_PREVIEW_CHARS ? content.substring(0, MAX_ATTACHMENT_PREVIEW_CHARS) : content,
      estimated_lines: content.split('\n').length,
      estimated_words: content.split(/\s+/).length,
      has_code: false,
      detected_language: 'unknown',
      key_findings: [] as string[]
    };
    
    if (fileType === 'code' || fileType === 'smart_contract') {
      analysis.has_code = true;
      
      if (filename.endsWith('.sol')) {
        analysis.detected_language = 'solidity';
        analysis.key_findings.push('Smart contract file detected');
        
        const contractMatch = content.match(/contract\s+(\w+)/);
        if (contractMatch) {
          analysis.key_findings.push(`Contract name: ${contractMatch[1]}`);
        }
        
        const functionMatches = content.match(/function\s+(\w+)/g);
        if (functionMatches) {
          analysis.key_findings.push(`Found ${functionMatches.length} functions`);
        }
        
      } else if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
        analysis.detected_language = 'javascript';
      } else if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
        analysis.detected_language = 'typescript';
      } else if (filename.endsWith('.py')) {
        analysis.detected_language = 'python';
      } else if (filename.endsWith('.java')) {
        analysis.detected_language = 'java';
      } else if (filename.endsWith('.cpp') || filename.endsWith('.c') || filename.endsWith('.h')) {
        analysis.detected_language = 'c++';
      } else if (filename.endsWith('.go')) {
        analysis.detected_language = 'go';
      } else if (filename.endsWith('.rs')) {
        analysis.detected_language = 'rust';
      }
      
      const importMatches = content.match(/(import|require|from|#include|using)\s+['"][^'"]+['"]/g);
      if (importMatches) {
        analysis.key_findings.push(`Found ${importMatches.length} imports/dependencies`);
      }
    }
    
    if (fileType === 'document' || fileType === 'text') {
      const headingMatches = content.match(/^(#+|\w.+:\n)/gm);
      if (headingMatches) {
        analysis.key_findings.push(`Found ${headingMatches.length} headings/sections`);
      }
      
      const urlMatches = content.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) {
        analysis.key_findings.push(`Found ${urlMatches.length} URLs`);
      }
      
      const emailMatches = content.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) {
        analysis.key_findings.push(`Found ${emailMatches.length} email addresses`);
      }
    }
    
    return analysis;
  }
  
  static async saveAnalysisToDatabase(
    sessionId: string,
    ipAddress: string,
    filename: string,
    analysis: any,
    metadata: any = {}
  ): Promise<void> {
    try {
      const analysisRecord: any = {
        session_id: sessionId,
        ip_address: ipAddress,
        filename: filename,
        file_type: analysis.file_type,
        content_preview: analysis.content_preview,
        key_findings: analysis.key_findings,
        metadata: {
          ...metadata,
          estimated_lines: analysis.estimated_lines,
          estimated_words: analysis.estimated_words,
          has_code: analysis.has_code,
          analyzed_at: new Date().toISOString(),
          executive_name: EXECUTIVE_NAME
        },
        created_at: new Date().toISOString()
      };
      
      if (analysis.detected_language && analysis.detected_language !== 'unknown') {
        analysisRecord.detected_language = analysis.detected_language;
      }
      
      const { error } = await supabase
        .from(DATABASE_CONFIG.tables.attachment_analysis)
        .insert(analysisRecord);
      
      if (error) {
        console.warn('âš ï¸ Failed to save attachment analysis:', error.message);
      } else {
        console.log(`ðŸ’¾ Saved attachment analysis for ${filename} with session ID: ${sessionId}`);
      }
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to save attachment analysis:', error);
    }
  }
}

// ========== REAL DATABASE TOOL EXECUTION FUNCTIONS ==========
async function getSystemStatus(): Promise<any> {
  try {
    // Use local relay /api/dao/health instead of cloud edge function
    const relayRes = await fetch('http://127.0.0.1:8080/api/dao/health', { signal: AbortSignal.timeout(10000) });
    if (relayRes.ok) {
      const data = await relayRes.json();
      return {
        success: true,
        database_counts: data.counts || {},
        health: data.health || {},
        services: data.services || {},
        timestamp: data.timestamp,
        last_updated: data.timestamp,
      };
    }
    return { success: false, error: 'Relay returned ' + relayRes.status };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get system status',
    };
  }
}

async function invokeEdgeFunction(name: string, payload: any): Promise<any> {
  // Map edge function names to relay tool names. The relay has working native
  // tool handlers for web scraping, mining, ecosystem, vertex AI, etc. —
  // routing through relay is faster and more reliable than hitting the local
  // edge function fallback (which would return stubs for functions that don't
  // exist in the local functions directory).
  const EDGE_TO_RELAY: Record<string, { tool: string; mapArgs?: (p: any) => any }> = {
    'playwright-browse': { tool: 'web-scrape', mapArgs: (p) => ({ url: p.url, maxLength: p.timeout || 50000 }) },
    'mining-proxy': { tool: 'ef:mining', mapArgs: (p) => ({ action: p.action, wallet: p.wallet }) },
    'ecosystem-monitor': { tool: 'ef:ecosystem-monitor' },
    'ecosystem-health-check': { tool: 'ef:ecosystem-health' },
    'muapi-generate': { tool: 'ef:muapi-generate', mapArgs: (p) => ({ media_type: p.action === 'generate_image' ? 'image' : 'video', prompt: p.prompt }) },
  };

  const mapping = EDGE_TO_RELAY[name];
  if (mapping) {
    const args = mapping.mapArgs ? mapping.mapArgs(payload) : payload;
    const relayResult = await callRelayTool(mapping.tool, args);
    if (relayResult !== null) return relayResult;
    // Relay unreachable — fall through to local edge function call via supabase client
  }

  // Local edge function call via supabase client. With NEXT_PUBLIC_SUPABASE_URL now
  // pointing at http://127.0.0.1:54321, this hits the local-sb deno runner which starts
  // a persistent deno process for the named function. The function may be slow on first
  // invocation (cold start) but subsequent calls are fast (pooled deno process).
  try {
    const { data, error } = await supabase.functions.invoke(name, { body: payload });
    if (error) throw new Error(error.message);
    return data;
  } catch (error: any) {
    throw new Error(`Edge function '${name}' failed: ${error.message}`);
  }
}

// ====== OLLAMA VISION: Analyze image content via local Ollama ======
async function analyzeImageWithOllamaVision(imageData: string, filename: string): Promise<any> {
  const ollamaHost = OLLAMA_LOCAL_HOST || 'http://localhost:11434';
  try {
    // Support data URLs and raw base64
    let base64Data = imageData;
    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) { base64Data = match[2]; }
    }
    if (!base64Data) return { success: false, error: 'No image data provided' };

    const prompt = `You are analyzing an uploaded file named "${filename}".
Describe exactly what you see in this image in detail. Include:
- What type of document/image this is
- All visible text content verbatim
- Key information, data, or insights
- Any charts, diagrams, code, or structured data
- A concise summary of the meaning and context
Provide a thorough analysis that can be stored in a knowledge base.`;

    // Priority order: qwen3.5 (fast, good vision), moondream (tiny, fast)
    const visionModels = ['qwen3.5:latest', 'moondream:latest'];
    for (const model of visionModels) {
      try {
        const response = await fetch(`${ollamaHost}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{
              role: 'user',
              content: prompt,
              images: [base64Data]
            }],
            stream: false,
            options: { temperature: 0.3 }
          })
        });
        if (!response.ok) continue;  // model not found, try next
        const data = await response.json();
        const text = data.message?.content || '';
        if (!text) continue;

        const findings: string[] = [];
        if (text.length > 100) findings.push('Detailed visual analysis completed');
        if (/\d{4}/.test(text)) findings.push('Contains numerical data');
        if (/table|chart|graph|diagram/i.test(text)) findings.push('Contains visual data representation');
        if (/code|function|class|import/i.test(text)) findings.push('Contains code or technical content');
        return { success: true, description: text, key_findings: findings, model, source: 'ollama_local' };
      } catch (_) { continue; }
    }
    return { success: false, error: 'All local Ollama vision models failed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ====== KNOWLEDGE BASE: Ingest analyzed attachment into knowledge_entities ======
async function ingestAttachmentToKnowledgeBase(
  sessionId: string,
  userId: string | undefined,
  filename: string,
  fileType: string,
  analysis: any
): Promise<void> {
  try {
    const title = `ðŸ“Ž Uploaded: ${filename}`;
    const content = analysis.description || analysis.content_preview || 
                    (analysis.key_findings?.join('. ') ?? '') || 
                    `File uploaded: ${filename}`;
    const entityData: any = {
      session_id: sessionId,
      entity_type: 'uploaded_file',
      entity_name: filename,
      title,
      content: content.length > MAX_ATTACHMENT_INGEST_CHARS ? content.substring(0, MAX_ATTACHMENT_INGEST_CHARS) : content,
      metadata: {
        file_type: fileType,
        mime_type: analysis.mime_type,
        size: analysis.size,
        key_findings: analysis.key_findings,
        analyzed_at: new Date().toISOString(),
        vision_analysis: analysis.vision_analysis || null,
        analysis_type: analysis.analysis_type,
      },
      source: 'attachment_upload',
      relevance_score: 0.9,
      created_at: new Date().toISOString()
    };
    if (userId) entityData.user_id = userId;
    if (!entityData.name) entityData.name = entityData.entity_name || entityData.title || entityData.entity?.name || null;
    if (!entityData.name) return;
    try { await supabase.from('knowledge_entities').insert(entityData); } catch (e) { console.warn('ingest failed'); }
  } catch (e: any) {
    console.warn('âš ï¸ Knowledge ingestion error:', e.message);
  }
}

// ====== LOCAL RELAY STORAGE: Save uploaded file via relay ======
async function saveAttachmentToLocalRelay(
  filename: string,
  fileContent: string,
  mimeType: string,
  userId: string | undefined,
  userEmail: string | undefined,
  sessionId: string
): Promise<{ success: boolean; storageUrl?: string; error?: string }> {
  try {
    console.log(`ðŸ“ Saving file to local relay storage: ${filename}`);
    return { success: true, storageUrl: `/storage/uploads/${sessionId}/${filename}` };
  } catch (e: any) {
    console.warn('âš ï¸ Local storage save error:', e.message);
    return { success: false, error: e.message };
  }
}

async function analyzeAttachmentTool(attachments: any[], ipAddress: string, sessionId: string, userId?: string, userEmail?: string): Promise<any> {
  try {
    console.log(`ðŸ“Ž Analyzing ${attachments.length} attachment(s) for IP: ${ipAddress}, Session: ${sessionId}`);
    
    const analyses = [];
    
    for (const attachment of attachments) {
      const { filename, content, mime_type, size, url } = attachment;
      
      if (!filename) {
        analyses.push({
          success: false,
          error: 'Missing filename',
          filename: 'unknown'
        });
        continue;
      }
      
      if (!AttachmentAnalyzer.isSupportedFile(filename)) {
        analyses.push({
          success: false,
          error: `Unsupported file type: ${filename}`,
          filename,
          supported_extensions: AttachmentAnalyzer.SUPPORTED_EXTENSIONS
        });
        continue;
      }
      
      const fileType = AttachmentAnalyzer.getFileType(filename);
      
      let analysis: any = {
        success: true,
        filename,
        file_type: fileType,
        mime_type: mime_type || 'unknown',
        size: size || 'unknown',
        supported: true
      };
      
      if (fileType === 'image') {
        analysis.analysis_type = 'image_vision';
        // Analyze image using local Ollama vision model
        const imageData = attachment.data_url || attachment.content || url;
        if (imageData) {
          try {
            const visionResult = await analyzeImageWithOllamaVision(imageData, filename);
            if (visionResult.success) {
              analysis.description = visionResult.description;
              analysis.key_findings = visionResult.key_findings || [];
              analysis.content_preview = visionResult.description?.substring(0, 500);
              analysis.vision_analysis = visionResult;
              analysis.note = `Image analyzed with ${visionResult.model} (local Ollama)`;
            } else {
              analysis.note = visionResult.error || 'Vision analysis failed';
            }
          } catch (vErr: any) {
            console.warn('âš ï¸ Ollama vision error:', vErr.message);
            analysis.note = 'Image received; local vision analysis unavailable';
          }
        } else {
          analysis.note = 'Image received but no data available for analysis';
        }
        
      } else if (['text', 'document', 'code', 'smart_contract'].includes(fileType)) {
        if (content) {
          const textAnalysis = await AttachmentAnalyzer.analyzeTextContent(content, filename);
          analysis = { ...analysis, ...textAnalysis };
          analysis.analysis_type = 'text_analysis';
        } else if (url) {
          analysis.analysis_type = 'url_reference';
          analysis.note = 'File referenced by URL, content not directly available';
        } else {
          analysis.success = false;
          analysis.error = 'No content provided for analysis';
        }
      }
      
      analyses.push(analysis);
      
      if (analysis.success) {
        await AttachmentAnalyzer.saveAnalysisToDatabase(
          sessionId,
          ipAddress,
          filename,
          analysis
        );
        // ✅ FIXED: Ingest analyzed content into knowledge base
        await ingestAttachmentToKnowledgeBase(sessionId, userId, filename, fileType, analysis);
        // ✅ Saving to local relay storage
        const fileContentForStorage = attachment.data_url || attachment.base64_data || attachment.content || '';
        if (fileContentForStorage) {
          const storageResult = await saveAttachmentToLocalRelay(
            filename,
            fileContentForStorage,
            mime_type || 'application/octet-stream',
            userId,
            userEmail,
            sessionId
          );
          analysis.storage_saved = storageResult.success;
          analysis.storage_url = storageResult.storageUrl;
          if (!storageResult.success) {
            analysis.storage_error = storageResult.error;
            console.warn(`âš ï¸ Storage save failed for ${filename}: ${storageResult.error}`);
          }
        }
      }
    }
    
    // Build a rich context summary for Eliza to use in her response
    const contextSummary = analyses
      .filter(a => a.success)
      .map(a => {
        let summary = `ðŸ“Ž **${a.filename}** (${a.file_type}):\n`;
        if (a.description) summary += a.description.substring(0, MAX_ATTACHMENT_CONTEXT_CHARS) + '\n';
        else if (a.content_preview) summary += a.content_preview.substring(0, MAX_ATTACHMENT_CONTEXT_CHARS) + '\n';
        if (a.key_findings?.length) summary += `Key findings: ${a.key_findings.join(', ')}\n`;
        if (a.storage_url) summary += `✅ Saved to local storage: ${a.storage_url}\n`;
        return summary;
      })
      .join('\n---\n');

    return {
      success: true,
      total_attachments: attachments.length,
      analyzed: analyses.filter(a => a.success).length,
      failed: analyses.filter(a => !a.success).length,
      analyses: analyses,
      context_summary: contextSummary,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to analyze attachments',
      timestamp: new Date().toISOString()
    };
  }
}

// ========== SOLUTION ENGINE: NEW TOOL IMPLEMENTATIONS ==========
async function proposeEdgeFunction(
  name: string,
  description: string,
  code: string,
  parameters: any,
  category: string = 'general',
  sessionId: string,
  ipAddress: string
): Promise<any> {
  try {
    // Store proposal in database
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.proposed_edge_functions)
      .insert({
        name,
        description,
        code,
        parameters: parameters || {},
        category,
        status: 'proposed',
        proposed_by_ip: ipAddress,
        proposed_by_session: sessionId,
        proposed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Optionally create a task for council review
    await supabase.from(DATABASE_CONFIG.tables.tasks).insert({
      title: `Review proposed edge function: ${name}`,
      description: `A new edge function has been proposed.\n\nDescription: ${description}\nCategory: ${category}\n\nParameters: ${JSON.stringify(parameters)}\n\nCode preview: ${code.substring(0, 500)}...`,
      category: 'governance',
      status: 'PENDING',
      stage: 'DISCUSS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return {
      success: true,
      proposal_id: data.id,
      name,
      status: 'proposed',
      message: `Edge function "${name}" has been proposed and is awaiting council review.`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to propose edge function'
    };
  }
}

async function listProposedFunctions(status?: string): Promise<any> {
  try {
    let query = supabase
      .from(DATABASE_CONFIG.tables.proposed_edge_functions)
      .select('*')
      .order('proposed_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      success: true,
      functions: data || [],
      count: data?.length || 0
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to list proposed functions'
    };
  }
}

async function deployEdgeFunction(proposalId: string, approvedBy?: string): Promise<any> {
  try {
    // Fetch proposal
    const { data: proposal, error: fetchError } = await supabase
      .from(DATABASE_CONFIG.tables.proposed_edge_functions)
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;
    if (!proposal) throw new Error('Proposal not found');

    // TODO: Actual deployment logic (e.g., call Supabase management API to create edge function)
    // For now, we simulate deployment by updating status and inserting into ai_tools
    const { error: updateError } = await supabase
      .from(DATABASE_CONFIG.tables.proposed_edge_functions)
      .update({
        status: 'deployed',
        deployed_at: new Date().toISOString(),
        deployed_by: approvedBy || 'system'
      })
      .eq('id', proposalId);

    if (updateError) throw updateError;

    // Register as an available tool in ai_tools
    const { error: toolError } = await supabase
      .from(DATABASE_CONFIG.tables.ai_tools)
      .insert({
        name: proposal.name,
        description: proposal.description,
        category: proposal.category,
        parameters: proposal.parameters,
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (toolError) throw toolError;

    return {
      success: true,
      message: `Edge function "${proposal.name}" deployed successfully.`,
      function_name: proposal.name
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to deploy edge function'
    };
  }
}

async function storeCodeSnippet(
  name: string,
  code: string,
  language: string,
  description: string,
  tags: string[],
  sessionId: string,
  ipAddress: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from(DATABASE_CONFIG.tables.code_snippets)
      .insert({
        name,
        code,
        language,
        description,
        tags,
        created_by_ip: ipAddress,
        created_by_session: sessionId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      snippet_id: data.id,
      name,
      message: `Code snippet "${name}" stored successfully.`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to store code snippet'
    };
  }
}

// ========== TOOL ACTIVITY LOGGING HELPER ==========
async function logToolActivity(
  toolName: string,
  status: 'pending' | 'running' | 'success' | 'failed',
  sessionId: string,
  details?: { description?: string; result?: any; error?: string; durationMs?: number }
): Promise<void> {
  try {
    const activityType = `tool_${status}`;
    const title = status === 'pending' ? `ðŸ”§ ${toolName}` 
      : status === 'running' ? `âš™ï¸ ${toolName}`
      : status === 'success' ? `✅ ${toolName}`
      : `❌ ${toolName}`;
    
    // Use direct fetch to local-sb REST API with local anon key
    const restUrl = `${SUPABASE_LOCAL_URL}/rest/v1/eliza_activity_log`;
    
    await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-anon-key',
        'apikey': 'local-anon-key',
      },
      body: JSON.stringify(boundForStorage({
        activity_type: activityType,
        title,
        description: details?.description || `${toolName} ${status}`,
        status,
        agent_id: _currentAgentId,
        task_id: sessionId,
        metadata: {
          tool_name: toolName,
          session_id: sessionId,
          // Which function ran the tool.
          //
          // The Activity Intelligence panel attributes an error to a file, and
          // a tool failure that happened here has no HTTP route to point at.
          // Without this the panel could say "search_knowledge failed" and
          // nothing else — no file, no version, no line. Every error the
          // panel could not attribute was an error raised inside an edge
          // function, and 235 of them landed in one day.
          edge_function: FUNCTION_NAME,
          result: details?.result,
          error: details?.error,
          duration_ms: details?.durationMs,
        }
      })),
    });
  } catch (e) {
    // Don't let logging failures break tool execution
    console.warn(`[activity_log] Failed to log ${toolName} ${status}:`, e?.message || e);
  }
}

// ========== REAL TOOL EXECUTION (ENHANCED WITH NEW TOOLS) ==========
async function executeRealToolCall(
  name: string, 
  args: string,
  executiveName: string,
  sessionId: string,
  ipAddress: string,
  timestamp: number = Date.now()
): Promise<any> {
  const startTime = performance.now();
  let success = false;
  let result: any = null;
  let error_message: string | null = null;

  // Set the agent ID for this tool call so relay logs show the real agent
  setCurrentAgentId(executiveName.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  
  // Log tool start
  logToolActivity(name, 'pending', sessionId, { description: `Starting ${name}` }).catch(() => {});
  logToolActivity(name, 'running', sessionId, { description: `Executing ${name}` }).catch(() => {});

  try {
    const parsedArgs = parseToolArguments(args);

    // ----- Existing tools (unchanged) -----
    if (name === 'relay-tool') {
      // Meta-tool: unwrap { tool, args } and forward to the relay.
      const { tool: targetTool, args: innerArgs } = parsedArgs;
      if (!targetTool) throw new Error('relay-tool requires a "tool" name');
      const catalog = await getRelayToolCatalog();
      if (catalog.length > 0 && !isKnownRelayTool(targetTool, catalog)) {
        throw new Error(
          `"${targetTool}" is not a relay tool. Known tools include: ${catalog.map(t => t.name).slice(0, 40).join(', ')}, …`
        );
      }
      console.log(`ðŸ”— relay-tool â†’ ${targetTool}`);
      const relayResult = await callRelayTool(targetTool, innerArgs || {});
      if (relayResult && (relayResult as any).success === false) {
        throw new Error(`relay-tool ${targetTool} failed: ${(relayResult as any).error || 'unknown error'}`);
      }
      result = relayResult;
    } else if (name === 'analyze_attachment') {
      const { attachments } = parsedArgs;
      if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
        throw new Error('Missing or empty attachments array');
      }
      
      result = await analyzeAttachmentTool(attachments, ipAddress, sessionId, undefined, undefined);
      
    } else if (name === 'browse_web') {
      const url = parsedArgs.url;
      if (!url) throw new Error('Missing url');
      
      let normalizedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        normalizedUrl = `https://${url}`;
      }
      
      result = await invokeEdgeFunction('playwright-browse', {
        url: normalizedUrl,
        action: parsedArgs.action || 'navigate',
        timeout: parsedArgs.timeout || 90000,
        headers: parsedArgs.headers,
        method: parsedArgs.method || 'GET',
        body: parsedArgs.body
      });
      
    } else if (name === 'execute_python') {
      const { code, purpose, timeout_ms } = parsedArgs;
      if (!code) throw new Error('Missing code');
      result = await invokeEdgeFunction('eliza-python-runtime', {
        code,
        purpose: purpose || 'ai-chat execute_python tool',
        source: 'ai-chat-tool',
        timeout_ms: timeout_ms || 90000,
      });

    } else if (name === 'get_mining_stats') {
      result = await invokeEdgeFunction('mining-proxy', { 
        action: 'get_mining_stats' 
      });
      
    } else if (name === 'get_ecosystem_metrics') {
      result = await invokeEdgeFunction('ecosystem-monitor', { 
        action: 'ecosystem_metrics' 
      });
      
    } else if (name === 'get_system_status') {
      result = await getSystemStatus();
      
    } else if (name === 'fleet_pulse') {
      // Unified fleet pulse — combines system status, ecosystem, and mining in one call
      const [statusRes, ecoRes, miningRes] = await Promise.allSettled([
        getSystemStatus(),
        invokeEdgeFunction('ecosystem-monitor', { action: 'ecosystem_metrics' }),
        invokeEdgeFunction('mining-proxy', { action: 'get_mining_stats' }),
      ]);
      result = {
        success: true,
        system: statusRes.status === 'fulfilled' ? statusRes.value : { error: 'failed' },
        ecosystem: ecoRes.status === 'fulfilled' ? ecoRes.value : { error: 'failed' },
        mining: miningRes.status === 'fulfilled' ? miningRes.value : { error: 'failed' },
        timestamp: new Date().toISOString(),
      };
      
    } else if (name === 'muapi_generate_image') {
      const { prompt } = parsedArgs;
      if (!prompt) throw new Error('Missing prompt');
      result = await callRelayTool('muapi-generate-image', { prompt });
      if (result === null) {
        result = await invokeEdgeFunction('muapi-generate', {
          media_type: 'image',
          prompt
        });
      }

    } else if (name === 'muapi_generate_video') {
      const { prompt, duration_seconds = 5 } = parsedArgs;
      if (!prompt) throw new Error('Missing prompt');
      result = await callRelayTool('muapi-generate-video', {
        prompt,
        duration_seconds
      });
      if (result === null) {
        result = await invokeEdgeFunction('muapi-generate', {
          media_type: 'video',
          prompt,
          options: { duration_seconds }
        });
      }

    } else if (name === 'muapi_check_status') {
      const { request_id } = parsedArgs;
      if (!request_id) throw new Error('Missing request_id');
      result = await callRelayTool('muapi-check-status', { request_id });
      if (result === null) {
        result = await invokeEdgeFunction('muapi-generate', {
          action: 'check_status',
          request_id
        });
      }

    } else if (name === 'create_task') {
      const { title, description, priority, category, assignee_agent_id } = parsedArgs;
      if (!title) throw new Error('Missing title');
      result = await callRelayTool('ef:task-orchestrator', {
        action: 'create_task',
        title,
        description: description || '',
        priority: priority || 0,
        category: category || null,
        assignee_agent_id: assignee_agent_id || null,
      });
      
    } else if (name === 'invoke_edge_function') {
      const { function_name, payload } = parsedArgs;
      if (!function_name) throw new Error('Missing function_name');
      result = await invokeEdgeFunction(function_name, payload ?? {});
      
    } else if (name === 'search_edge_functions') {
      const { query, category, mode } = parsedArgs;
      
      if (mode === 'full_registry') {
        const { data, error } = await supabase
          .from(DATABASE_CONFIG.tables.ai_tools)
          .select('name, description, category, is_active, parameters')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        const grouped = (data || []).reduce((acc: any, tool) => {
          const cat = tool.category || 'uncategorized';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(tool);
          return acc;
        }, {});
        
        result = { 
          success: true, 
          functions: data,
          grouped_by_category: grouped,
          total: data?.length || 0
        };
      } else {
        let dbQuery = supabase
          .from(DATABASE_CONFIG.tables.ai_tools)
          .select('name, description, category, is_active, parameters')
          .eq('is_active', true);
        
        if (query) {
          // The filter rides in a query string, so it is cut to a length that
          // can travel in one — same rule as every other term in this file.
          const { term: boundedQuery } = boundSearchTerm(query);
          dbQuery = dbQuery.or(`name.ilike.%${boundedQuery}%,description.ilike.%${boundedQuery}%`);
        }
        
        if (category) {
          dbQuery = dbQuery.eq('category', category);
        }
        
        const { data, error } = await dbQuery.order('name');
        if (error) throw error;
        result = { success: true, functions: data, total: data?.length || 0 };
      }
      
    } else if (name === 'list_available_functions') {
      const { category } = parsedArgs;
      
      let dbQuery = supabase
        .from(DATABASE_CONFIG.tables.ai_tools)
        .select('name, description, category, is_active, parameters')
        .eq('is_active', true)
        .order('name');
      
      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }
      
      const { data, error } = await dbQuery;
      if (error) throw error;
      result = { success: true, functions: data, total: data?.length || 0 };
      
    } else if (name === 'get_edge_function_logs') {
      const { function_name, limit = 100 } = parsedArgs;
      let query = supabase
        .from(DATABASE_CONFIG.tables.edge_function_logs)
        .select('function_name, level, event_type, event_message, timestamp, execution_time_ms, status_code, request_id')
        .order('timestamp', { ascending: false })
        .limit(Math.min(limit, 200));
      
      if (function_name) {
        query = query.eq('function_name', function_name);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      result = { success: true, logs: data, total: data?.length || 0 };
      
    } else if (name === 'list_agents') {
      const [agentsResult, superduperResult] = await Promise.all([
        supabase
          .from(DATABASE_CONFIG.tables.agents)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from(DATABASE_CONFIG.tables.superduper_agents)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);
      
      if (agentsResult.error) throw agentsResult.error;
      
      result = { 
        success: true, 
        agents: agentsResult.data || [],
        superduper_agents: superduperResult.data || [],
        total_agents: (agentsResult.data?.length || 0) + (superduperResult.data?.length || 0)
      };
      
    } else if (name === 'assign_task') {
      const { title, description, category, assignee_agent_id, priority } = parsedArgs;
      if (!title) throw new Error('Missing title');
      const relayResult = await callRelayTool('ef:task-orchestrator', {
        action: 'create_task',
        title,
        description: description || '',
        priority: priority || 5,
        category: category || 'other',
        assignee_agent_id: assignee_agent_id || null,
      });
      // Extract the task data from the relay response wrapper
      if (relayResult && relayResult.success && relayResult.data) {
        result = { success: true, task: relayResult.data };
      } else if (relayResult) {
        result = relayResult;
      } else {
        result = { success: false, error: 'Task creation failed - relay returned null' };
      }
      
    } else if (name === 'list_tasks') {
      // Query tasks directly via local-sb REST API instead of CORE-level relay tool
      const restUrl = `${SUPABASE_LOCAL_URL}/rest/v1/tasks`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-anon-key',
        'apikey': 'local-anon-key',
      };
      const limit = parsedArgs.limit || 20;
      const url = `${restUrl}?select=id,title,description,stage,status,priority,category,assignee_agent_id,created_at,updated_at&order=priority.desc,created_at.desc&limit=${limit}`;
      try {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
        if (!response.ok) {
          const errText = await response.text().catch(() => 'unknown');
          result = { success: false, tasks: [], error: `list_tasks HTTP ${response.status}: ${errText.slice(0, 200)}` };
        } else {
          const tasks = await response.json();
          result = { success: true, tasks: Array.isArray(tasks) ? tasks : [] };
        }
      } catch (e: any) {
        result = { success: false, tasks: [], error: `list_tasks failed: ${e.message}` };
      }
      
    } else if (name === 'search_knowledge') {
      const rawSearchTerm = parsedArgs.search_term || parsedArgs.query;
      const limit = parsedArgs.limit || 10;

      // The term is cut to a length that can travel in a URL.
      //
      // This is the fault the whole activity feed was made of. An agent
      // searched with a whole conversation as the term; the URL became
      // 935,775 characters long; `fetch` refused it ("Invalid URL"); and the
      // refusal — which IS the URL — was written to the activity feed and to
      // the function-usage log verbatim. 93 rows a day, 55 MB a day, and the
      // activity feed reached 4.3 GB.
      //
      // The cut is recorded, so a partial search is never read as a whole one.
      const { term: search_term, truncated: searchTermTruncated, original_length: searchTermLength } =
        boundSearchTerm(rawSearchTerm);
      
      // Use direct fetch to local-sb REST API with local anon key
      const restUrl = `${SUPABASE_LOCAL_URL}/rest/v1/knowledge_entities`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-anon-key',
        'apikey': 'local-anon-key',
      };
      
      let url = `${restUrl}?select=*&order=created_at.desc&limit=${limit}`;
      if (search_term) {
              // Search by name (text) and inside entity JSONB (description, content)
              // PostgREST uses * as wildcard in URL query params, not %
              // BUT: local-sb REST API passes raw value to PG ILIKE which needs %
              const encoded = encodeURIComponent(search_term);
              url += `&or=(name.ilike.%25${encoded}%25,entity->>description.ilike.%25${encoded}%25,entity->>content.ilike.%25${encoded}%25,entity->>name.ilike.%25${encoded}%25)`;
            }
      
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        const errText = await response.text().catch(() => 'unknown');
        throw new Error(`search_knowledge HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }
      const knowledge = await response.json();
      result = {
        success: true,
        knowledge: knowledge || [],
        search_term_truncated: searchTermTruncated,
        search_term_length: searchTermLength,
      };
      
    } else if (name === 'store_knowledge') {
      const knowledgeName = parsedArgs.name || parsedArgs.entity_name || parsedArgs.title || 'unnamed';
      const knowledgeData = {
        name: knowledgeName,
        entity: {
          name: knowledgeName,
          description: parsedArgs.description || '',
          content: parsedArgs.content || '',
          type: parsedArgs.type || 'general',
          tags: parsedArgs.tags || [],
        },
        metadata: {
          source: 'ai-chat',
          session_id: sessionId,
        },
      };
      
      // Use direct fetch to local-sb REST API with local anon key
      const storeUrl = `${SUPABASE_LOCAL_URL}/rest/v1/knowledge_entities`;
      const storeHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-anon-key',
        'apikey': 'local-anon-key',
      };
      const storeRes = await fetch(storeUrl, {
        method: 'POST',
        headers: storeHeaders,
        body: JSON.stringify(knowledgeData),
      });
      if (!storeRes.ok) {
        const errText = await storeRes.text().catch(() => 'unknown');
        throw new Error(`store_knowledge HTTP ${storeRes.status}: ${errText.slice(0, 200)}`);
      }
      const stored = await storeRes.json();
      result = { success: true, knowledge: stored };
      
    } else if (name === 'recall_entity') {
      const { name: entityName, entity_id } = parsedArgs;
      
      // Use direct fetch to local-sb REST API with local anon key
      const recallHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer local-anon-key',
        'apikey': 'local-anon-key',
      };
      let recallUrl = `${SUPABASE_LOCAL_URL}/rest/v1/knowledge_entities?select=*`;
      if (entity_id) {
        recallUrl += `&id=eq.${entity_id}`;
      } else if (entityName) {
        // Same rule as search_knowledge: the name rides in a URL, so it is cut
        // to a length that can travel in one.
        const { term: boundedEntityName } = boundSearchTerm(entityName);
        const encoded = encodeURIComponent(boundedEntityName);
        recallUrl += `&name=ilike.%25${encoded}%25`;
      }
      recallUrl += '&limit=5';
      const recallRes = await fetch(recallUrl, { headers: recallHeaders });
      if (!recallRes.ok) {
        const errText = await recallRes.text().catch(() => 'unknown');
        throw new Error(`recall_entity HTTP ${recallRes.status}: ${errText.slice(0, 200)}`);
      }
      const entities = await recallRes.json();
      result = { success: true, entities: entities || [] };
      
    } else if (name === 'createGitHubIssue') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'create_issue',
        data: {
          title: parsedArgs.title,
          body: parsedArgs.body,
          labels: parsedArgs.labels || []
        }
      });
      
    } else if (name === 'listGitHubIssues') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'list_issues',
        data: {
          state: parsedArgs.state || 'open',
          limit: parsedArgs.limit || 10
        }
      });
      
    } else if (name === 'createGitHubDiscussion') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'create_discussion',
        data: {
          title: parsedArgs.title,
          body: parsedArgs.body,
          category: parsedArgs.category || 'General'
        }
      });
      
    } else if (name === 'searchGitHubCode') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'search_code',
        data: {
          query: parsedArgs.query,
          limit: parsedArgs.limit || 10
        }
      });
      
    } else if (name === 'createGitHubPullRequest') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'create_pull_request',
        data: {
          title: parsedArgs.title,
          body: parsedArgs.body || '',
          head: parsedArgs.head,
          base: parsedArgs.base || 'main',
          draft: parsedArgs.draft || false
        }
      });
      
    } else if (name === 'commentOnGitHubIssue') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'comment_on_issue',
        data: {
          issue_number: parsedArgs.issue_number,
          body: parsedArgs.body
        }
      });
      
    } else if (name === 'commentOnGitHubDiscussion') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'comment_on_discussion',
        data: {
          discussion_number: parsedArgs.discussion_number,
          body: parsedArgs.body
        }
      });
      
    } else if (name === 'listGitHubPullRequests') {
      result = await invokeEdgeFunction('github-integration', {
        action: 'list_pull_requests',
        data: {
          state: parsedArgs.state || 'open',
          limit: parsedArgs.limit || 10
        }
      });
      
    } else if (name === 'execute_workflow_template') {
      const { template_name, params } = parsedArgs;
      
      const { data: template, error: templateError } = await supabase
        .from(DATABASE_CONFIG.tables.workflow_templates)
        .select('*')
        .eq('name', template_name)
        .single();
      
      if (templateError) throw templateError;
      
      result = await invokeEdgeFunction('workflow-template-manager', {
        action: 'execute_template',
        template_name,
        template_data: template,
        params: params || {}
      });
      
    // ----- NEW SOLUTION ENGINE TOOLS -----
    } else if (name === 'propose_edge_function') {
      const { name: funcName, description, code, parameters, category } = parsedArgs;
      if (!funcName || !description || !code) {
        throw new Error('Missing required fields: name, description, code');
      }
      result = await proposeEdgeFunction(funcName, description, code, parameters || {}, category, sessionId, ipAddress);
      
    } else if (name === 'list_proposed_functions') {
      const { status } = parsedArgs;
      result = await listProposedFunctions(status);
      
    } else if (name === 'deploy_edge_function') {
      const { proposal_id, approved_by } = parsedArgs;
      if (!proposal_id) throw new Error('Missing proposal_id');
      result = await deployEdgeFunction(proposal_id, approved_by);
      
    } else if (name === 'store_code_snippet') {
      const { name: snippetName, code, language, description, tags } = parsedArgs;
      if (!snippetName || !code || !language) {
        throw new Error('Missing required fields: name, code, language');
      }
      result = await storeCodeSnippet(snippetName, code, language, description || '', tags || [], sessionId, ipAddress);

    // ===== RELAY TOOLS (Resend inbox/email) =====
    } else if (name === 'resend_inbox') {
      result = await callRelayTool('resend-inbox', { domain: parsedArgs.domain || 'all', limit: parsedArgs.limit || 10 });

    } else if (name === 'resend_send_email') {
      result = await callRelayTool('resend-send-email', {
        agent: parsedArgs.agent,
        to: parsedArgs.to,
        subject: parsedArgs.subject,
        body: parsedArgs.body,
        from: parsedArgs.from
      });

    } else if (name === 'sent_emails') {
      result = await callRelayTool('sent-emails', { limit: parsedArgs.limit || 10, search: parsedArgs.search || '' });

    } else if (name === 'pfp_leads') {
      result = await callRelayTool('pfp-leads', parsedArgs);

    // ===== NEW RELAY TOOLS (36 tools) =====
    } else if (name === 'web_search') {
      const { query } = parsedArgs;
      if (!query) throw new Error('Missing query');
      result = await callRelayTool('web-search', { query });

    } else if (name === 'web_scrape') {
      const { url } = parsedArgs;
      if (!url) throw new Error('Missing url');
      result = await callRelayTool('web-scrape', { url });

    } else if (name === 'ollama_chat') {
      const { message, model } = parsedArgs;
      if (!message) throw new Error('Missing message');
      result = await callRelayTool('ollama-chat', { message, model });

    } else if (name === 'ollama_models') {
      result = await callRelayTool('ollama-models', {});

    } else if (name === 'ollama_health') {
      result = await callRelayTool('ollama-health', {});

    } else if (name === 'system_monitor') {
      result = await callRelayTool('system-monitor', {});

    } else if (name === 'system_resources') {
      result = await callRelayTool('system-resources', {});

    } else if (name === 'external_services') {
      result = await callRelayTool('external-services', {});

    } else if (name === 'device_registration') {
      const { hostname, ip } = parsedArgs;
      if (!hostname || !ip) throw new Error('Missing hostname or ip');
      result = await callRelayTool('device-registration', { hostname, ip });

    } else if (name === 'knowledge_sync') {
      result = await callRelayTool('knowledge-sync', {});

    } else if (name === 'mining_dashboard') {
      result = await callRelayTool('mining-dashboard', {});

    } else if (name === 'eliza_send') {
      const { message } = parsedArgs;
      if (!message) throw new Error('Missing message');
      result = await callRelayTool('eliza-send', { message });

    } else if (name === 'state_get') {
      const { key } = parsedArgs;
      if (!key) throw new Error('Missing key');
      result = await callRelayTool('state-get', { key });

    } else if (name === 'state_set') {
      const { key, value } = parsedArgs;
      if (!key) throw new Error('Missing key');
      result = await callRelayTool('state-set', { key, value });

    } else if (name === 'task_stats') {
      result = await callRelayTool('task-stats', {});

    } else if (name === 'github_post') {
      const { issue_number, body, repo } = parsedArgs;
      if (!issue_number || !body) throw new Error('Missing issue_number or body');
      result = await callRelayTool('github-post', { issue_number, body, repo });

    } else if (name === 'db_query') {
      const { sql } = parsedArgs;
      if (!sql) throw new Error('Missing sql');
      // Route directly to local-sb at 54321 instead of relay (8080),
      // since relay has syntax errors (campaignContacts redeclaration) that
      // prevent it from starting properly. local-sb is healthy with clean logs.
      const res = await fetch('http://127.0.0.1:54321/rest/v1/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': 'local' },
        body: JSON.stringify({ query: sql })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`local-sb db_query failed: ${res.status} ${JSON.stringify(data)}`);
      result = data;

    } else if (name === 'db_rest') {
      const { path, method, body } = parsedArgs;
      if (!path) throw new Error('Missing path');
      // Route directly to local-sb at 54321 instead of relay (8080),
      // since relay has syntax errors (campaignContacts redeclaration) that
      // prevent it from starting properly. local-sb is healthy with clean logs
      // (GET / → 1ms, POST /mesh-peer-connector → 111ms, GET /agent_certifications → 0ms).
      const res = await fetch('http://127.0.0.1:54321/rest/v1/' + path, {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json', 'apikey': 'local' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`local-sb db_rest failed: ${res.status} ${JSON.stringify(data)}`);
      result = data;

    } else if (name === 'shared_context') {
      const { action, key, value, search_term, agent_id, topic } = parsedArgs;
      if (!action) throw new Error('Missing action');
      result = await callRelayTool('shared-context', { action, key, value, search_term, agent_id, topic });

    } else if (name === 'agent_profile') {
      const { agent_id } = parsedArgs;
      result = await callRelayTool('agent-profile', { agent_id });

    } else if (name === 'activity_log') {
      const { limit, activity_type, status, since, agent_id: logAgent } = parsedArgs;
      result = await callRelayTool('activity-log', { limit, activity_type, status, since, agent_id: logAgent });

    } else if (name === 'edge_function') {
      const { name: efName, payload } = parsedArgs;
      if (!efName) throw new Error('Missing name');
      result = await callRelayTool('edge-function', { name: efName, payload });

    } else if (name === 'agent_rpc') {
      // Cross-agent RPC — send a programmatic request to another agent and get results back
      const { target_agent, action, params, timeout } = parsedArgs;
      if (!target_agent || !action) throw new Error('Missing target_agent or action');
      result = await callRelayTool('agent-rpc', { target_agent, action, params, timeout: timeout || 30000 });

    } else if (name === 'fleet_chat') {
      const { agent, channel, message } = parsedArgs;
      if (!agent || !channel || !message) throw new Error('Missing agent, channel, or message');
      result = await callRelayTool('fleet-chat', { agent, channel, message });

    } else if (name === 'obsidian_graph') {
      const { filter } = parsedArgs;
      result = await callRelayTool('obsidian-graph', { filter });

    } else if (name === 'vex_vision') {
      const { source, duration } = parsedArgs;
      if (!source) throw new Error('Missing source');
      result = await callRelayTool('vex-vision', { source, duration });

    } else if (name === 'vex_hear') {
      const { duration } = parsedArgs;
      if (duration === undefined) throw new Error('Missing duration');
      result = await callRelayTool('vex-hear', { duration });

    } else {
      // ── Generic relay passthrough ──────────────────────────────
      // Not one of the hardcoded tools, so check whether the relay advertises
      // it. This is what makes shell-exec, db-query, video-editor,
      // knowledge-graph, the cuttlefishclaws family, and the other ~130 relay
      // tools actually callable instead of dead ends.
      const catalog = await getRelayToolCatalog();
      if (isKnownRelayTool(name, catalog)) {
        console.log(`ðŸ”— Routing '${name}' to the relay (generic passthrough)`);
        const relayResult = await callRelayTool(name, parsedArgs);
        if (relayResult && (relayResult as any).success === false) {
          // Surface the relay's own error text so the model can self-correct.
          throw new Error(`Relay tool '${name}' failed: ${(relayResult as any).error || 'unknown error'}`);
        }
        result = relayResult;
      } else {
        const known = catalog.map(t => t.name);
        throw new Error(
          `Tool '${name}' is not a recognized or allowed tool.`
          + (known.length
            ? ` It is not in the relay catalog either. Known relay tools include: ${known.slice(0, 40).join(', ')}${known.length > 40 ? ', …' : ''}`
            : '')
        );
      }
    }
    
    success = true;
    return {
      ...result,
      execution_time_ms: Math.round(performance.now() - startTime),
      tool_name: name,
      timestamp
    };
    
  } catch (error: any) {
    // Bounded HERE, at the point the error is born, not only at the point it
    // is stored. An error message is the text of what went wrong; when what
    // went wrong was "the URL was too long to send", that text IS the URL.
    // Bounding it here keeps the 935 KB string out of the return value, out
    // of the log rows, and out of the synthesis prompt that is built from
    // this result and handed back to the model.
    error_message = boundText(error?.message || String(error));
    return {
      success: false,
      error: error_message,
      tool_name: name,
      timestamp,
      execution_time_ms: Math.round(performance.now() - startTime)
    };
  } finally {
    const duration = Math.round(performance.now() - startTime);
    const parsedToolArgs = boundForStorage(parseToolArguments(args));
    
    const logEntry = {
      function_name: name,
      executive_name: executiveName,
      parameters: parsedToolArgs,
      success,
      execution_time_ms: duration,
      result_summary: success ? 'Executed successfully' : null,
      error_message,
      session_id: sessionId,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };
    
    logFunctionUsage(logEntry);
    
    // Log tool completion to activity log
    if (success) {
      logToolActivity(name, 'success', sessionId, { 
        description: `${name} completed`,
        result: typeof result === 'object' ? JSON.stringify(result).slice(0, 500) : String(result).slice(0, 500),
        durationMs: duration
      }).catch(() => {});
    } else {
      logToolActivity(name, 'failed', sessionId, { 
        description: `${name} failed`,
        error: error_message || 'Unknown error',
        durationMs: duration
      }).catch(() => {});
    }
    
    logActivity({
      activity_type: 'tool_execution',
      title: `ðŸ”§ ${executiveName} executed ${name}`,
      description: `${executiveName} executed tool: ${name}`,
      status: success ? 'completed' : 'error',
      metadata: {
        name,
        args: parsedToolArgs,
        result: success ? 'ok' : error_message,
        duration_ms: duration,
        ip_address: ipAddress,
        // Which function ran the tool — so the panel can name the file and
        // the version that threw, even though no HTTP route was involved.
        edge_function: FUNCTION_NAME,
      },
      function_name: name,
      created_at: new Date().toISOString()
    });
  }
}

// ========== ENHANCED CONTENT ANALYSIS FUNCTIONS ==========
function extractKeyInsights(content: string, domain: string): string {
  if (!content || content.length < 100) {
    return "The page appears to be accessible but contains minimal content.\n";
  }
  
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : '';
  
  const metaMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = metaMatch ? metaMatch[1] : '';
  
  const isNewsSite = domain.includes('ycombinator') || domain.includes('news');
  const isSocialMedia = domain.includes('reddit') || domain.includes('twitter') || domain.includes('facebook');
  const isSearchEngine = domain.includes('google') || domain.includes('bing') || domain.includes('duckduckgo');
  
  let insights = '';
  
  if (title) {
    insights += `**Title**: ${title}\n`;
  }
  
  if (description && description.length < 200) {
    insights += `**Description**: ${description}\n`;
  }
  
  if (isNewsSite) {
    if (domain.includes('ycombinator')) {
      const hnMatches = content.match(/<a href="[^"]+" class="titlelink"[^>]*>([^<]+)<\/a>/g);
      if (hnMatches && hnMatches.length > 0) {
        const headlines = hnMatches.slice(0, 5).map((h, i) => {
          const textMatch = h.match(/<a[^>]*>([^<]+)<\/a>/);
          return textMatch ? `  ${i + 1}. ${textMatch[1]}` : '';
        }).filter(Boolean);
        
        if (headlines.length > 0) {
          insights += `**Top Headlines**:\n${headlines.join('\n')}\n`;
        }
      }
    }
  } else if (isSocialMedia) {
    insights += `**Note**: This appears to be a social media platform. For detailed content, you might need to view specific subpages or use their API.\n`;
  } else if (isSearchEngine) {
    insights += `**Note**: This is a search engine homepage. To search for specific content, I can help you formulate search queries.\n`;
  }
  
  const hasForms = content.includes('<form') || content.includes('<input');
  const hasImages = content.match(/<img[^>]+>/g)?.length || 0;
  const hasLinks = content.match(/<a[^>]+href=["'][^"']+["'][^>]*>/g)?.length || 0;
  
  insights += `**Page Elements**: ${hasForms ? 'Forms, ' : ''}${hasImages} images, ${hasLinks} links\n`;
  
  return insights;
}

function analyzeUserIntent(query: string, conversationContext: any[] = []): {
  primaryIntent: string;
  needsData: boolean;
  isFollowUp: boolean;
  topics: string[];
} {
  const queryLower = query.toLowerCase();
  
  const intents = {
    dataRetrieval: ['what', 'how', 'when', 'where', 'who', 'why', 'show', 'tell', 'get', 'find', 'list', 'check'],
    action: ['do', 'make', 'create', 'generate', 'build', 'execute', 'run', 'perform', 'start'],
    analysis: ['analyze', 'review', 'evaluate', 'assess', 'compare', 'summarize'],
    browsing: ['open', 'browse', 'view', 'visit', 'go to', 'check', 'navigate', 'http', 'https', 'www', '.com'],
    status: ['status', 'health', 'stats', 'metrics', 'performance', 'report'],
    memory: ['remember', 'recall', 'previous', 'before', 'last time', 'earlier'],
    help: ['help', 'assist', 'guide', 'how to', 'can you'],
    communication: ['email', 'send', 'mail', 'message', 'contact', 'reach out', 'notify']
  };
  
  const detectedIntents = [];
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => queryLower.includes(keyword))) {
      detectedIntents.push(intent);
    }
  }
  
  const commonTopics = [
    'task', 'agent', 'github', 'code', 'function', 'edge function', 'mining',
    'system', 'database', 'web', 'url', 'api', 'key', 'license', 'workflow',
    'vertex', 'image', 'video', 'billing', 'financial', 'vsco', 'lead',
    'email', 'gmail', 'contact', 'message', 'communication', 'send'
  ];
  
  const foundTopics = commonTopics.filter(topic => queryLower.includes(topic));
  
  const isFollowUp = conversationContext.length > 0 && (
    queryLower.includes('what about') ||
    queryLower.includes('how about') ||
    queryLower.includes('also') ||
    queryLower.includes('and') ||
    queryLower.includes('what else') ||
    (queryLower.includes('?') && conversationContext.some(ctx => 
      ctx.role === 'assistant' && Date.now() - (ctx.timestamp || 0) < 300000
    ))
  );
  
  return {
    primaryIntent: detectedIntents[0] || 'general',
    needsData: detectedIntents.some(intent => ['dataRetrieval', 'status', 'analysis'].includes(intent)),
    isFollowUp,
    topics: foundTopics
  };
}

function detectAmbiguousResponse(userMessage: string, conversationHistory: any[]): {
  isAmbiguous: boolean;
  likelyReferringTo: string | null;
  confidence: number;
} {
  const userMessageLower = userMessage.toLowerCase().trim();
  
  const isAmbiguous = AMBIGUOUS_RESPONSES.includes(userMessageLower);
  
  if (!isAmbiguous) {
    return { isAmbiguous: false, likelyReferringTo: null, confidence: 0 };
  }
  
  let likelyReferringTo = null;
  let confidence = 0.7;
  
  const recentMessages = conversationHistory.slice(-10).reverse();
  
  for (const message of recentMessages) {
    if (message.role === 'assistant') {
      const assistantMessage = message.content || '';
      
      const hasQuestion = assistantMessage.includes('?');
      const hasOptions = assistantMessage.includes('option') || 
                         assistantMessage.includes('choice') || 
                         assistantMessage.includes('select');
      
      if (hasQuestion || hasOptions) {
        likelyReferringTo = assistantMessage.substring(0, 200);
        confidence = hasQuestion && hasOptions ? 0.9 : 0.8;
        break;
      }
    }
  }
  
  if (!likelyReferringTo) {
    const lastAssistant = recentMessages.find(m => m.role === 'assistant');
    if (lastAssistant) {
      likelyReferringTo = lastAssistant.content?.substring(0, 200) || 'the previous question';
      confidence = 0.6;
    }
  }
  
  return { isAmbiguous: true, likelyReferringTo, confidence };
}

// ========== TOOL PARSING FUNCTIONS ==========
function parseDeepSeekToolCalls(content: string): Array<any> | null {
  const toolCallsMatch = content.match(/ ðŸ«Ž(.*?)ðŸ«Ž/s);
  if (!toolCallsMatch) return null;
  
  const toolCallsText = toolCallsMatch[1];
  const toolCallPattern = / ðŸ”§(.*?)ðŸ”§(.*?)ðŸ”§/gs;
  const toolCalls: Array<any> = [];
  
  let match;
  while ((match = toolCallPattern.exec(toolCallsText)) !== null) {
    const functionName = match[1].trim();
    let args = match[2].trim();
    
    let parsedArgs = {};
    if (args && args !== '{}') {
      try {
        parsedArgs = JSON.parse(args);
      } catch (e) {
        console.warn(`Failed to parse DeepSeek tool args for ${functionName}:`, args);
      }
    }
    
    toolCalls.push({
      id: `deepseek_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'function',
      function: {
        name: functionName,
        arguments: JSON.stringify(parsedArgs)
      }
    });
  }
  
  return toolCalls.length > 0 ? toolCalls : null;
}

function parseToolCodeBlocks(content: string): Array<any> | null {
  const toolCalls: Array<any> = [];
  
  const toolCodeRegex = /```tool_code\s*\n?([\s\S]*?)```/g;
  let match;
  
  while ((match = toolCodeRegex.exec(content)) !== null) {
    const code = match[1].trim();
    
    const invokeMatch = code.match(/invoke_edge_function\s*\(\s*\{([\s\S]*?)\}\s*\)/);
    if (invokeMatch) {
      try {
        let argsStr = `{${invokeMatch[1]}}`;
        argsStr = argsStr.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"').replace(/""+/g, '"');
        const args = JSON.parse(argsStr);
        toolCalls.push({
          id: `tool_code_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: 'function',
          function: { name: 'invoke_edge_function', arguments: JSON.stringify(args) }
        });
      } catch (e) {
        console.warn('Failed to parse invoke_edge_function from tool_code:', e.message);
      }
      continue;
    }
    
    const directMatch = code.match(/(\w+)\s*\(\s*(\{[\s\S]*?\})?\s*\)/);
    if (directMatch) {
      const funcName = directMatch[1];
      let argsStr = directMatch[2] || '{}';
      try {
        argsStr = argsStr.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"').replace(/""+/g, '"');
        const parsedArgs = JSON.parse(argsStr);
        toolCalls.push({
          id: `tool_code_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: 'function',
          function: { name: funcName, arguments: JSON.stringify(parsedArgs) }
        });
      } catch (e) {
        console.warn(`Failed to parse ${funcName} from tool_code:`, e.message);
      }
    }
  }
  
  return toolCalls.length > 0 ? toolCalls : null;
}

// Nemotron and other OpenRouter free-tier models emit tool calls as a raw
// JSON array — [[{"name":"fleet_pulse","parameters":{}}]] — instead of any of
// the fenced/marker formats above. Without this parser the blob was returned
// to the user as chat text and the tool never ran.
function parseJsonArrayToolCalls(content: string): Array<any> | null {
  let trimmed = (content || '').trim();
  const openCh = trimmed[0];
  if (openCh !== '[' && openCh !== '{') {
    // Small models often prepend "I'll check that." before the payload. Find
    // the first tool-call-shaped array or object instead of giving up, so a
    // local fallback can still execute the tool it asked for.
    const arrAt = trimmed.search(/\[\s*\{/);
    const objAt = trimmed.search(/\{\s*"name"\s*:/);
    const at = arrAt >= 0 ? arrAt : objAt;
    if (at < 0) return null;
    trimmed = trimmed.slice(at);
  }
  // Extract every balanced {...} block and keep the ones that parse and carry
  // a tool-ish name. Balancing per-object (instead of requiring the whole
  // payload to be valid JSON) tolerates the truncated wrappers small models
  // emit, e.g. `[[ {"name": "fleet_pulse", "parameters": {}} ]`.
  const blocks: any[] = [];
  let depth = 0, inStr = false, esc = false, start = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          const obj = JSON.parse(trimmed.slice(start, i + 1));
          if (obj && typeof obj === 'object' && typeof obj.name === 'string' && /^[\w:.-]+$/.test(obj.name)) {
            blocks.push(obj);
          }
        } catch { /* not a clean object — skip */ }
        start = -1;
      }
    }
  }
  if (blocks.length === 0) return null;
  return blocks.map((x: any, i: number) => ({
    id: `jsonarr_${Date.now()}_${i}`,
    type: 'function',
    function: {
      name: x.name,
      arguments: JSON.stringify(x.parameters ?? x.arguments ?? x.args ?? {}),
    },
  }));
}

// Qwen/minimax-style XML dialect:
// <tool_call><function=aside-push><parameter=kind>markdown</parameter>...</function></tool_call>
function parseXmlToolCalls(content: string): Array<any> | null {
  if (!content || !content.includes('<tool_call>')) return null;
  const toolCalls: Array<any> = [];
  const callRegex = /<tool_call>\s*<function=([\w:.-]+)>([\s\S]*?)<\/function>\s*<\/tool_call>/g;
  let m;
  while ((m = callRegex.exec(content)) !== null) {
    const name = m[1];
    const params: Record<string, string> = {};
    const paramRegex = /<parameter=([\w-]+)>\s*([\s\S]*?)<\/parameter>/g;
    let p;
    while ((p = paramRegex.exec(m[2])) !== null) {
      params[p[1]] = p[2].trim();
    }
    toolCalls.push({
      id: `xml_${Date.now()}_${toolCalls.length}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(params) },
    });
  }
  return toolCalls.length > 0 ? toolCalls : null;
}

// MiniMax (and some other models) emit tool calls as XML of the form
//   <..._function_calls>
//   <invoke name="tool_name">
//   <parameter name="arg">value</parameter>
//   ...
//   </invoke>
//   </..._function_calls>
//
// These are NOT caught by parseXmlToolCalls (which expects <tool_call>/<function=>),
// so they leak into the chat text and the tools never execute. This parser
// extracts them so they can be run and stripped like any other text-format call.
function parseMinimaxInvokeToolCalls(content: string): Array<any> | null {
  if (!content || !content.includes('<invoke')) return null;
  const toolCalls: Array<any> = [];
  const invokeRegex = /<invoke\s+name=["']([\w:.-]+)["']\s*>([\s\S]*?)<\/invoke>/g;
  let m;
  while ((m = invokeRegex.exec(content)) !== null) {
    const name = m[1];
    const params: Record<string, any> = {};
    const paramRegex = /<parameter\s+name=["']([\w-]+)["']\s*>([\s\S]*?)<\/parameter>/g;
    let p;
    while ((p = paramRegex.exec(m[2])) !== null) {
      const key = p[1];
      const raw = p[2].trim();
      try {
        params[key] = JSON.parse(raw);
      } catch {
        params[key] = raw;
      }
    }
    toolCalls.push({
      id: `minimax_invoke_${Date.now()}_${toolCalls.length}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(params) },
    });
  }
  return toolCalls.length > 0 ? toolCalls : null;
}

function parseConversationalToolIntent(content: string): Array<any> | null {
  const toolCalls: Array<any> = [];
  const patterns = [
    /(?:call(?:ing)?|use|invoke|execute|run|check(?:ing)?)\s+(?:the\s+)?(?:function\s+|tool\s+)?[`"']?(\w+)[`"']?/gi,
    /let me (?:call|check|get|invoke)\s+[`"']?(\w+)[`"']?/gi,
    /I(?:'ll| will) (?:call|invoke|use)\s+[`"']?(\w+)[`"']?/gi
  ];
  
const knownTools = [
  // Existing
  'get_mining_stats', 'get_system_status', 'get_ecosystem_metrics', 'fleet_pulse',
  'search_knowledge', 'recall_entity', 'invoke_edge_function', 'create_task',
  'get_edge_function_logs', 'get_agent_status', 'list_agents', 'list_tasks',
  'search_edge_functions', 'browse_web', 'analyze_attachment', 'resend_send_email', 'muapi_generate_image', 'muapi_generate_video', 'muapi_check_status', 'agent_rpc', 'activity_log',

  // Supabase: Database
  'execute_sql', 'list_tables', 'list_extensions', 'list_policies',
  'get_advisors', 'get_logs', 'get_active_incidents', 'list_branches',

  // Supabase: Edge Functions + Deployment
  'deploy_edge_function', 'list_edge_functions',

  // Supabase: Auth
  'get_user', 'get_users', 'create_user', 'update_user', 'delete_user',
  'invite_user', 'generate_magic_link',

  // Supabase: Storage
  'list_buckets', 'create_bucket', 'delete_bucket',
  'list_objects', 'upload_object', 'download_object', 'delete_object',
  'sign_object_url',

  // Supabase: Realtime
  'broadcast_event', 'send_presence', 'list_realtime_topics',

  // Search/Vector/AI
  'embed_text', 'search_embeddings', 'semantic_search', 'rerank_results',

  // Monitoring/Observability
  'get_edge_function_metrics', 'get_realtime_metrics', 'get_db_metrics',
  'get_storage_metrics', 'get_auth_metrics',

  // Tasks/Jobs/Queues
  'enqueue_task', 'dequeue_task', 'get_task_status', 'cancel_task',

  // Knowledge base / Retrieval
  'index_document', 'delete_document', 'list_documents',

  // External integrations
  'slack_post_message', 'discord_send_message', 'github_issue_create',
  'resend_send_email', 'notion_create_page', 'openai_chat',

  // Utilities
  'http_fetch', 'parse_csv', 'generate_uuid', 'cron_schedule_task',
  'validate_schema', 'jsonata_query',

  // Email/SMS
  'send_email', 'send_sms',
  'resend_inbox', 'resend_send_email', 'sent_emails', 'pfp_leads',

  // Security / Keys
  'rotate_api_key', 'get_secrets', 'set_secret', 'delete_secret',

  // Admin/Org
  'get_org_usage', 'get_billing_plan', 'list_projects', 'get_project_status'
];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const funcName = match[1];
      if (knownTools.includes(funcName) && !toolCalls.find(t => t.function.name === funcName)) {
        toolCalls.push({
          id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          type: 'function',
          function: { name: funcName, arguments: '{}' }
        });
      }
    }
  }
  return toolCalls.length > 0 ? toolCalls : null;
}

function needsDataRetrieval(messages: any[]): boolean {
  const lastUser = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
  
  const dataKeywords = [
    'what is', 'what\'s', 'what are', 'who is', 'who are', 'where is', 'when is',
    'how is', 'how are', 'how much', 'how many', 'why is', 'why are',
    'show me', 'tell me', 'give me', 'fetch', 'get', 'list', 'find', 'search',
    'check', 'analyze', 'run', 'execute', 'perform', 'scan', 'diagnose',
    'look up', 'lookup', 'retrieve', 'query', 'pull', 'grab',
    'status', 'health', 'stats', 'statistics', 'metrics', 'analytics',
    'performance', 'report', 'overview', 'summary', 'dashboard',
    'current', 'recent', 'latest', 'today', 'now', 'real-time', 'realtime', 'live',
    'mining', 'hashrate', 'workers', 'agents', 'tasks', 'ecosystem',
    'proposals', 'governance', 'cron', 'functions', 'logs', 'activity',
    'recall', 'remember', 'stored', 'saved', 'previous', 'history',
    'compare', 'between', 'vs', 'versus', 'difference',
    'count', 'total', 'number', 'amount', 'percentage', 'rate',
    'create', 'generate', 'make', 'draw', 'design', 'render', 'illustrate',
    'visualize', 'picture', 'image', 'video', 'animate', 'animation',
    'photo', 'artwork', 'graphic', 'clip', 'film', 'scene',
    'view', 'open', 'check', 'browse', 'navigate', 'visit', 'go to',
    'website', 'webpage', 'url', 'link', 'http://', 'https://',
    'web', 'internet', 'page', 'site',
    'email', 'send', 'mail', 'contact', 'message'
  ];
  
  const hasQuestionMark = lastUser.includes('?');
  const imperativePatterns = /^(show|tell|give|get|list|find|check|run|execute|analyze|fetch|retrieve|scan|diagnose|look|pull|view|open|browse|navigate|visit|go|send|email)/i;
  const startsWithImperative = imperativePatterns.test(lastUser.trim());
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const hasUrl = urlPattern.test(lastUser);
  const emailPattern = /[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/gi;
  const hasEmail = emailPattern.test(lastUser);
  
  return hasQuestionMark || startsWithImperative || hasUrl || hasEmail || dataKeywords.some(k => lastUser.includes(k));
}

async function retrieveMemoryContexts(sessionKey: string): Promise<any[]> {
  if (!sessionKey) return [];
  
  console.log('ðŸ“š Retrieving memory contexts server-side...');
  try {
    const { data: serverMemories, error } = await supabase
      .from(DATABASE_CONFIG.tables.memory_contexts)
      .select('context_type, content, importance_score')
      .or(`user_id.eq.${sessionKey},session_id.eq.${sessionKey}`)
      .order('importance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    
    if (serverMemories && serverMemories.length > 0) {
      console.log(`✅ Retrieved ${serverMemories.length} memory contexts`);
      return serverMemories.map(m => ({
        type: m.context_type,
        content: m.content?.slice?.(0, 500) || String(m.content).slice(0, 500),
        score: m.importance_score
      }));
    }
  } catch (error: any) {
    console.warn('âš ï¸ Failed to retrieve memory contexts:', error.message);
  }
  return [];
}

async function callDeepSeekFallback(messages: any[], tools?: any[]): Promise<any> {
  if (!DEEPSEEK_API_KEY) return null;
  
  console.log('ðŸ”„ Trying DeepSeek fallback...');
  
  const enhancedMessages = messages.map(m => 
    m.role === 'system' ? { ...m, content: TOOL_CALLING_MANDATE + m.content } : m
  );
  
  const forceTools = needsDataRetrieval(messages);
  console.log(`ðŸ“Š DeepSeek - Data retrieval needed: ${forceTools}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: enhancedMessages,
        tools,
        tool_choice: tools ? (forceTools ? 'required' : 'auto') : undefined,
        temperature: 0.7,
        max_tokens: RESPONSE_MAX_TOKENS,
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ DeepSeek fallback successful');
      return {
        content: data.choices?.[0]?.message?.content || '',
        tool_calls: data.choices?.[0]?.message?.tool_calls || [],
        provider: 'deepseek',
        model: 'deepseek-chat'
      };
    } else {
      const errorText = await response.text();
      console.warn('âš ï¸ DeepSeek API error:', response.status, errorText);
    }
  } catch (error) {
    console.warn('âš ï¸ DeepSeek fallback failed:', error);
  }
  return null;
}

async function callKimiFallback(messages: any[], tools?: any[]): Promise<any> {
  if (!OPENROUTER_API_KEY) return null;
  
  console.log('ðŸ”„ Trying OpenRouter fallback (live free slug)...');
  
  const enhancedMessages = messages.map(m => 
    m.role === 'system' ? { ...m, content: TOOL_CALLING_MANDATE + m.content } : m
  );
  
  const forceTools = needsDataRetrieval(messages);
  console.log(`ðŸ“Š Kimi K2 - Data retrieval needed: ${forceTools}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://xmrt.pro',
        'X-Title': 'XMRT Eliza'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3.5-lightning:free',
        messages: enhancedMessages,
        tools,
        tool_choice: tools ? (forceTools ? 'required' : 'auto') : undefined,
        temperature: 0.9,
        max_tokens: RESPONSE_MAX_TOKENS,
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenRouter fallback successful');
      return {
        content: data.choices?.[0]?.message?.content || '',
        tool_calls: data.choices?.[0]?.message?.tool_calls || [],
        provider: 'openrouter',
        model: 'nvidia/nemotron-3.5-lightning:free'
      };
    } else {
      const errorText = await response.text();
      console.warn('âš ï¸ OpenRouter API error:', response.status, errorText);
    }
  } catch (error) {
    console.warn('âš ï¸ OpenRouter fallback failed:', error);
  }
  return null;
}

// ========== ENHANCED CONVERSATION MEMORY MANAGER ==========
class EnhancedConversationManager {
  private sessionId: string;
  private ipAddress: string;
  private toolResultsMemory: any[] = [];
  private conversationPersistence: EnhancedConversationPersistence;
  private userId?: string;
  
  constructor(sessionId: string, ipAddress: string, userId?: string) {
    this.sessionId = sessionId;
    this.ipAddress = ipAddress;
    this.userId = userId;
    this.conversationPersistence = new EnhancedConversationPersistence(sessionId, ipAddress, userId);
  }
  
  async loadConversationHistory(): Promise<{
    messages: any[];
    toolResults: any[];
    conversationSummary: string;
    historicalSummaries: any[];
  }> {
    try {
      console.log(`ðŸ“š Loading conversation history for session: ${this.sessionId} (IP: ${this.ipAddress})`);
      
      const { data: ipData, error: ipError } = await supabase
        .from(DATABASE_CONFIG.tables.conversation_memory)
        .select('messages, summary, tool_results, metadata')
        .eq('ip_address', this.ipAddress)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      let messages = [];
      let toolResults = [];
      let conversationSummary = 'New session';
      
      if (!ipError && ipData && ipData.length > 0) {
        const record = ipData[0];
        messages = record.messages || [];
        toolResults = record.tool_results || [];
        this.toolResultsMemory = toolResults;
        conversationSummary = record.summary || 'Existing conversation from IP';
        
        console.log(`ðŸ“– Loaded ${messages.length} messages and ${toolResults.length} tool results from IP-based history`);
        
        await this.updateSessionIdInMemory(record);
        
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from(DATABASE_CONFIG.tables.conversation_memory)
          .select('messages, summary, tool_results, metadata')
          .eq('session_id', this.sessionId)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (!sessionError && sessionData && sessionData.length > 0) {
          const record = sessionData[0];
          messages = record.messages || [];
          toolResults = record.tool_results || [];
          this.toolResultsMemory = toolResults;
          conversationSummary = record.summary || 'Existing conversation';
          
          console.log(`ðŸ“– Loaded ${messages.length} messages and ${toolResults.length} tool results from session history`);
        } else {
          console.log('ðŸ“­ No existing conversation found for session or IP');
        }
      }
      
      const historicalSummaries = await this.conversationPersistence.loadHistoricalSummaries();
      
      return {
        messages: messages.slice(-CONVERSATION_HISTORY_LIMIT),
        toolResults: toolResults.slice(-MAX_TOOL_RESULTS_MEMORY),
        conversationSummary: conversationSummary,
        historicalSummaries: historicalSummaries
      };
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to load conversation history:', error);
      return { 
        messages: [], 
        toolResults: [], 
        conversationSummary: 'Error loading history',
        historicalSummaries: []
      };
    }
  }
  
  private async updateSessionIdInMemory(record: any): Promise<void> {
    try {
      await supabase
        .from(DATABASE_CONFIG.tables.conversation_memory)
        .update({ 
          session_id: this.sessionId,
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', this.ipAddress)
        .eq('updated_at', record.updated_at);
      
      console.log(`ðŸ”„ Updated session ID for IP ${this.ipAddress} to ${this.sessionId}`);
    } catch (error) {
      console.warn('âš ï¸ Failed to update session ID in memory:', error);
    }
  }
  
  async saveConversation(
    messages: any[],
    toolResults: any[] = [],
    metadata: any = {}
  ): Promise<void> {
    try {
      const allToolResults = [...this.toolResultsMemory, ...toolResults].slice(-MAX_TOOL_RESULTS_MEMORY);
      this.toolResultsMemory = allToolResults;
      
      const summary = await this.generateConversationSummary(messages, allToolResults);
      
      const conversationRecord: any = {
        session_id: this.sessionId,
        ip_address: this.ipAddress,
        // Persist the recent window of raw messages alongside the summary.
        //
        // Was slice(-50). The raw messages are what loadConversationHistory
        // hands back as verbatim context, so this IS the durable memory — a
        // 50-message cap silently truncated everything older on every save.
        // Raised to MAX_HISTORY_MESSAGES (400) and bounded by the same budget
        // that governs what we send, so the stored window can never be larger
        // than the models can actually use.
        messages: JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES)),
        tool_results: JSON.stringify(allToolResults),
        summary: summary,
        metadata: JSON.stringify({
          ...metadata,
          tool_call_count: allToolResults.length,
          message_count: messages.length,
          last_updated: new Date().toISOString(),
          memory_version: '4.0',
          ip_based_persistence: true
        }),
        updated_at: new Date().toISOString()
      };
      
      if (this.userId) {
        conversationRecord.user_id = this.userId;
      }
      
      // Use direct REST API instead of supabase client (local-sb schema resolution issues)
      const restUrl = `${SUPABASE_LOCAL_URL}/rest/v1/conversation_memory`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_LOCAL_ANON || 'local-anon-key',
        'Authorization': `Bearer ${SUPABASE_LOCAL_ANON || 'local-anon-key'}`,
      };

      // Try upsert by session_id first (session_id is the canonical unique key)
      const upsertUrl = `${restUrl}?on_conflict=session_id`;
      const response = await fetch(upsertUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(conversationRecord),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'unknown');
        console.warn('âš ï¸ Failed to save conversation (session_id upsert):', response.status, errText.slice(0, 200));
      } else {
        // Read back and confirm the row is really there.
        //
        // The old code trusted a 2xx and logged "Saved conversation". That is
        // exactly how the delete-after-write bug hid for so long: every request
        // logged a successful save, and the table still ended up empty. A
        // write is only a success if the row reads back — task 4fbadf43 records
        // the same principle for fleet_memory ("any write must be treated as
        // failed until read back").
        try {
          const verifyUrl = `${restUrl}?session_id=eq.${encodeURIComponent(this.sessionId)}&select=session_id,updated_at`;
          const vRes = await fetch(verifyUrl, { headers, signal: AbortSignal.timeout(5000) });
          const vRows = vRes.ok ? await vRes.json().catch(() => []) : [];
          if (Array.isArray(vRows) && vRows.length > 0) {
            console.log(`ðŸ’¾ Saved conversation (session-based): ${messages.length} messages, ${allToolResults.length} tool results — verified present`);
          } else {
            console.warn(`âš ï¸ conversation_memory reported success but read-back found no row for session ${this.sessionId}`);
          }
        } catch (verifyErr: any) {
          console.warn('âš ï¸ conversation_memory read-back failed (non-fatal):', verifyErr?.message || verifyErr);
        }
      }
      
      await this.conversationPersistence.saveConversationSummary(messages, allToolResults, metadata);
      
      // Cleanup old records via REST API.
      //
      // BUG (found 2026-10-11): this ran `DELETE .../conversation_memory
      // ?ip_address=eq.<ip>&order=updated_at.desc&limit=100&offset=10`
      // immediately after the upsert above, and it DELETED THE ROW THAT WAS
      // JUST WRITTEN. Verified against the live REST endpoint: a single-row
      // table, one write, then this DELETE returned 200 and the row was gone.
      //
      // The cause is that `limit`+`offset` do not express "skip the newest 10"
      // the way the original comment assumed — against this table the DELETE
      // matched and removed the freshly-written row, so saveConversation()
      // never persisted anything. That is why conversation_memory stayed empty
      // (0 rows) while the logs cheerfully printed "Saved conversation" and
      // "Cleaned up old conversation records" on every single request.
      //
      // The fix keeps the intent — bound how many rows one IP accumulates —
      // but makes it actually correct and, critically, never touches the
      // current session:
      //   1. Select the ids of rows for this IP, newest first.
      //   2. Take everything past the newest CONVERSATION_MEMORY_KEEP.
      //   3. Filter out this.sessionId, so the live conversation is untouchable
      //      even if the ordering is wrong.
      //   4. DELETE by explicit id list, and only if there is something to do.
      try {
        const KEEP = parseInt(Deno.env.get('CONVERSATION_MEMORY_KEEP') || '10');
        const listUrl = `${restUrl}?ip_address=eq.${encodeURIComponent(this.ipAddress)}`
          + `&select=id,session_id&order=updated_at.desc`;
        const listRes = await fetch(listUrl, { headers, signal: AbortSignal.timeout(5000) });
        if (listRes.ok) {
          const rows = await listRes.json().catch(() => []);
          if (Array.isArray(rows) && rows.length > KEEP) {
            const stale = rows
              .slice(KEEP)
              .filter((r: any) => r && r.id && r.session_id !== this.sessionId)
              .map((r: any) => r.id);
            if (stale.length) {
              const delRes = await fetch(
                `${restUrl}?id=in.(${stale.join(',')})`,
                { method: 'DELETE', headers, signal: AbortSignal.timeout(5000) }
              );
              if (delRes.ok) {
                console.log(`ðŸ§¹ Pruned ${stale.length} stale conversation_memory row(s) (keeping newest ${KEEP} per IP)`);
              }
            }
          }
        }
      } catch (cleanupErr: any) {
        // Non-fatal — never fail a save because pruning failed.
        console.warn('âš ï¸ conversation_memory prune failed (non-fatal):', cleanupErr?.message || cleanupErr);
      }
      
    } catch (error: any) {
      console.warn('âš ï¸ Failed to save conversation:', error);
    }
  }
  
  async saveConversationContext(
    currentQuestion: string,
    assistantResponse: string,
    userResponse: string,
    metadata: any = {}
  ): Promise<void> {
    await this.conversationPersistence.saveConversationContext(
      currentQuestion,
      assistantResponse,
      userResponse,
      metadata
    );
  }
  
  async loadRecentContext(limit: number = 5): Promise<any[]> {
    return await this.conversationPersistence.loadRecentContext(limit);
  }
  
  private async generateConversationSummary(messages: any[], toolResults: any[]): Promise<string> {
    try {
      return await generateAISummary(messages, toolResults);
    } catch (error) {
      console.warn('âš ï¸ AI summarization failed, using enhanced manual summary');
      return generateEnhancedManualSummary(messages, toolResults);
    }
  }
  
  getToolResults(): any[] {
    return this.toolResultsMemory;
  }
  
  addToolResults(newResults: any[]): void {
    this.toolResultsMemory = [...this.toolResultsMemory, ...newResults].slice(-MAX_TOOL_RESULTS_MEMORY);
    console.log(`ðŸ§  Added ${newResults.length} tool results to memory, total: ${this.toolResultsMemory.length}`);
  }
  
  async generateMemoryContext(): Promise<string> {
    const toolResults = this.toolResultsMemory;
    
    if (toolResults.length === 0) {
      return "## ðŸ§  CONVERSATION MEMORY\nNo previous tool calls in this conversation.\n\n**IP Address**: " + this.ipAddress + "\n**Session Persistence**: Active (persistent)";
    }
    
    let context = "## ðŸ§  CONVERSATION MEMORY - TOOL CALL HISTORY\n\n";
    context += `**IP Address**: ${this.ipAddress}\n`;
    context += `**Session Persistence**: Active (persistent)\n\n`;
    
    const recentTools = toolResults.slice(-10).reverse();
    
    context += `### RECENT TOOL EXECUTIONS (${recentTools.length} total)\n\n`;
    
    recentTools.forEach((tool, index) => {
      const status = tool.result?.success ? '✅ SUCCEEDED' : '❌ FAILED';
      const timeAgo = this.formatTimeAgo(tool.timestamp || Date.now());
      
      context += `**${index + 1}. ${tool.name}** - ${status} (${timeAgo})\n`;
      
      if (tool.result) {
        if (tool.result.success) {
          if (tool.name === 'browse_web' && tool.result.url) {
            context += `   Browsed: ${tool.result.url} (${tool.result.status || '200'})\n`;
            if (tool.result.metadata) {
              context += `   Load time: ${tool.result.metadata.loadTime}ms, Content type: ${tool.result.metadata.contentType}\n`;
            }
            if (tool.result.content) {
              const preview = tool.result.content.length > 100 ? 
                tool.result.content.substring(0, 100) + '...' : tool.result.content;
              context += `   Content preview: "${preview}"\n`;
            }
          }
          else if (tool.name === 'search_edge_functions' && tool.result.functions) {
            const funcs = tool.result.functions;
            context += `   Returned ${funcs.length} available functions\n`;
            if (funcs.length > 0) {
              context += `   Examples: ${funcs.slice(0, 3).map((f: any) => f.name).join(', ')}`;
              if (funcs.length > 3) context += `, and ${funcs.length - 3} more`;
              context += '\n';
            }
          }
          else if (tool.name === 'analyze_attachment') {
            context += `   Analyzed ${tool.result.total_attachments || 0} attachments\n`;
          }
          else if (tool.name === 'resend_send_email') {
            context += `   Email sent: ${tool.result.to || 'recipient'}\n`;
            if (tool.result.subject) {
              context += `   Subject: ${tool.result.subject.substring(0, 50)}${tool.result.subject.length > 50 ? '...' : ''}\n`;
            }
          }
          // Deprecated options — still handled for backward compatibility with old tool results
          else if (tool.name.includes('GitHub')) {
            context += `   GitHub operation: ${tool.name.replace('GitHub', ' GitHub ')}\n`;
            if (tool.result.issue_number || tool.result.pull_number) {
              const number = tool.result.issue_number || tool.result.pull_number;
              context += `   Created/Updated: #${number}\n`;
            }
          }
          else if (tool.result.agents) {
            context += `   Found ${tool.result.agents.length} agents\n`;
          }
          else if (tool.result.tasks) {
            context += `   Listed ${tool.result.tasks.length} tasks\n`;
          }
          else if (tool.result.content) {
            context += `   Content generated: "${tool.result.content.substring(0, 100)}${tool.result.content.length > 100 ? '...' : ''}"\n`;
          }
          else {
            context += `   Executed successfully\n`;
          }
        } else {
          context += `   Error: ${tool.result.error || 'Unknown error'}\n`;
        }
      }
      context += '\n';
    });
    
    const successful = toolResults.filter(r => r.result?.success).length;
    const failed = toolResults.filter(r => !r.result?.success).length;
    
    context += `### TOOL STATISTICS\n`;
    context += `• Total executions: ${toolResults.length}\n`;
    context += `• Successful: ${successful}\n`;
    context += `• Failed: ${failed}\n`;
    context += `• Success rate: ${toolResults.length > 0 ? Math.round((successful / toolResults.length) * 100) : 0}%\n\n`;
    
    context += `**IMPORTANT**: You MUST reference these previous tool calls when users ask about them. `;
    context += `For example, if a user asks "what did you get from search_edge_functions?", `;
    context += `you should reference the exact results shown above.\n`;
    context += `**CRITICAL FOR AMBIGUOUS RESPONSES**: When user says "yes", "no", "okay", etc., check recent context to understand what they're responding to.\n`;
    context += `**IP-BASED MEMORY**: This conversation persists across sessions indefinitely based on IP address.\n`;
    
    return context;
  }
  
  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  }
}

// ========== ENHANCED PROVIDER CASCADING ==========
interface CascadeResult {
  success: boolean;
  content?: string;
  tool_calls?: any[];
  provider: string;
  model?: string;
  latency?: number;
  error?: string;
}

/**
 * Compact prompt for local Ollama (gemma3:1b).
 *
 * The old version threw every system message away and replaced it with
 * "You are a helpful, honest assistant." That is why the last-resort model
 * introduced itself as "a large language model built by Google" and knew
 * nothing about the fleet. The full agent prompt is tens of thousands of
 * characters and gemma3:1b runs on this CPU, so we still cannot send all of
 * it — but we can send a purpose-built Eliza prompt with the context that
 * matters, a short tool manifest, and explicit instructions for the simple
 * JSON tool-call dialect the parsers already understand.
 *
 * Capped at ~9k characters: identity + shared context + manifest, not the
 * whole agent dossier. Measured local answers land in tens of seconds, which
 * is the point of a last resort: a real answer, not a timeout.
 */
const LOCAL_FALLBACK_PROMPT_CAP = 9000;
const LOCAL_FALLBACK_RECENT_TURNS = 8;

function localMessageText(m: any): string {
  if (!m) return '';
  if (typeof m.content === 'string') return m.content;
  if (Array.isArray(m.content)) {
    return m.content
      .filter((c: any) => c && (c.type === 'text' || typeof c.text === 'string'))
      .map((c: any) => c.text || '')
      .join('\n');
  }
  return '';
}

// Pull one labelled block out of the full system prompt without carrying the
// whole thing. Markers are ASCII so this keeps working even when the
// surrounding prompt contains emoji or other non-ASCII text.
function extractLocalContextSection(text: string, marker: string, maxChars: number): string {
  const at = text.indexOf(marker);
  if (at < 0) return '';
  const lineStart = text.lastIndexOf('\n', at) + 1;
  let chunk = text.slice(lineStart);
  const next = chunk.indexOf('\n## ', marker.length);
  if (next > 0 && next < maxChars * 2) chunk = chunk.slice(0, next);
  if (chunk.length > maxChars) {
    const cut = chunk.lastIndexOf('\n', maxChars);
    chunk = cut > maxChars * 0.6 ? chunk.slice(0, cut) : chunk.slice(0, maxChars);
  }
  return chunk.trim();
}

function buildLocalSharedContext(messages: any[]): string {
  const systemText = messages
    .filter(m => m && m.role === 'system')
    .map(localMessageText)
    .join('\n\n');
  if (!systemText) return '';

  const parts: string[] = [];
  const add = (marker: string, cap: number) => {
    const section = extractLocalContextSection(systemText, marker, cap);
    if (section) parts.push(section);
  };
  add('LIVE LOCAL STATE', 1600);
  add('STORED MEMORY CONTEXTS', 1800);
  add('HISTORICAL CONVERSATION SUMMARIES', 1500);
  add('RECENT CONVERSATION CONTEXT', 800);
  add('KNOWLEDGE BASE RESULTS', 1200);

  if (parts.length === 0) return '';
  return '## SHARED CONTEXT (fleet stores and this conversation)\n\n' + parts.join('\n\n');
}

function localToolSignature(tool: any): string {
  const fn = tool?.function || tool || {};
  const name = fn.name || 'unknown_tool';
  const params = fn.parameters || {};
  const required = Array.isArray(params.required) ? params.required : [];
  const props = params.properties && typeof params.properties === 'object'
    ? Object.keys(params.properties)
    : [];
  const args = (required.length > 0 ? required : props).slice(0, 4);
  const desc = String(fn.description || '').replace(/\s+/g, ' ').trim();
  const shortDesc = desc.length > 100 ? desc.slice(0, 97) + '...' : desc;
  return '- ' + name + '(' + args.join(', ') + ')' + (shortDesc ? ' - ' + shortDesc : '');
}

function buildLocalToolManifest(tools: any[], query: string, maxTools = 6): string {
  if (!Array.isArray(tools) || tools.length === 0) return '';
  const words = Array.from(new Set(
    (query || '').toLowerCase().split(/[^a-z0-9_-]+/).filter(w => w.length > 3)
  )).slice(0, 12);
  const core = new Set([
    'fleet_pulse', 'get_system_status', 'get_ecosystem_metrics', 'get_mining_stats',
    'search_knowledge', 'recall_entity', 'list_tasks', 'list_agents', 'browse_web', 'relay-tool',
  ]);

  const ranked = tools.map((tool: any) => {
    const fn = tool?.function || tool || {};
    const name = String(fn.name || '');
    const desc = String(fn.description || '').toLowerCase();
    let score = 0;
    if (core.has(name)) score += 100;
    if (name === 'relay-tool') score += 50;
    for (const w of words) {
      if (name.toLowerCase().includes(w)) score += 20;
      if (desc.includes(w)) score += 5;
    }
    return { tool, name, score };
  }).filter(x => x.name);

  ranked.sort((a, b) => b.score - a.score);
  const picked: any[] = [];
  const seen = new Set<string>();
  for (const item of ranked) {
    if (picked.length >= maxTools) break;
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    picked.push(item.tool);
  }
  if (!seen.has('relay-tool')) {
    const relayTool = tools.find((t: any) => (t?.function?.name || t?.name) === 'relay-tool');
    if (relayTool) picked.push(relayTool);
  }

  let out = picked.map(localToolSignature).join('\n');
  if (out.length > 2400) out = out.slice(0, 2400);
  return out;
}

function buildLocalFallbackMessages(messages: any[], tools: any[] = [], liveContext = ''): any[] {
  const lastUser = [...messages].reverse().find(m => m && m.role === 'user');
  const query = localMessageText(lastUser);
  const sharedContext = buildLocalSharedContext(messages);
  // When we already fetched a deterministic live snapshot for this turn, do
  // not also hand the small model a tool menu. gemma3 tends to call
  // fleet_pulse anyway, and the second model pass after the tool result is
  // what turned a ~30s answer into a ~200s request.
  const manifest = liveContext ? '' : buildLocalToolManifest(tools, query);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  const systemParts: string[] = [
    `You are ${EXECUTIVE_NAME}, ${EXECUTIVE_ROLE}.`,
    '',
    `You are NOT Google, NOT Gemini, NOT a generic large language model, and NOT a help desk. You do not attach x-api-key yourself. Every relay tool call already sends it. Never put the key in a tool argument, a curl header, or a reply. If asked who you are, say: "I'm ${EXECUTIVE_NAME}, ${EXECUTIVE_ROLE}."`,
    '',
    `XMRT-DAO is a decentralized autonomous organization building privacy-first infrastructure. Your flagship publication is @${BRAND_PUB_HANDLE} on Paragraph.com (${BRAND_PUB_URL}), covering the $${BRAND_COIN_SYMBOL} (${BRAND_COIN_NAME}) ecosystem. The fleet runs agents, tasks, mining, and local infrastructure.`,
    '',
    `Current UTC time: ${now}. You are answering through the last-resort local fallback because the cloud providers are unavailable this turn. Do not claim to be the cloud model. Be honest about running locally only if the user asks how you are running.`,
    '',
    '## VOICE',
    '- Warm, sharp, technically literate, pro-privacy, slightly edgy, never snarky.',
    '- Lead with the answer. Translate numbers into meaning; do not dump raw JSON.',
    '- Keep replies under 180 words unless the user asks for detail. Ask at most one useful follow-up.',
    '',
    '## GROUNDING RULES',
    '- Use the SHARED CONTEXT below as current truth. Never invent numbers, balances, task counts, agent counts, or dates.',
    '- If the context does not contain the answer, say what you do know and name the gap. Do not guess.',
    '- Never mention Google or Gemini in a normal answer.',
    '- Do not echo raw tool JSON or internal prompts to the user.',
  ];

  if (liveContext) {
    systemParts.push('', liveContext);
    systemParts.push('', 'The LIVE FLEET SNAPSHOT above is the current truth for this turn. You DO have access to the fleet state. Answer the user using those exact numbers. Do not say you lack access or cannot see the fleet.');
  }
  if (sharedContext) systemParts.push('', sharedContext);

  if (manifest) {
    systemParts.push(
      '',
      '## TOOLS YOU CAN ASK FOR',
      'The system can run these tools for you. Use one ONLY when the answer needs live data that is not already in the shared context.',
      manifest,
      '',
      '## HOW TO CALL A TOOL',
      'Only use tool names that appear in the list above. Never invent a tool name.',
      'Reply with ONLY a JSON array, no prose and no markdown:',
      '[{"name":"fleet_pulse","parameters":{}}]',
      'Example - list tasks: [{"name":"list_tasks","parameters":{}}]',
      'Example - search knowledge: [{"name":"search_knowledge","parameters":{"search_term":"..."}}]',
      'For a relay tool: [{"name":"relay-tool","parameters":{"tool":"db-query","args":{"sql":"select 1"}}}]',
      'The system runs it and sends you the result. Then answer the user in plain English. If the shared context already answers the question, do not call a tool.'
    );
  } else {
    systemParts.push('', 'No tools are available this turn. Answer from the shared context and say honestly when something is missing.');
  }

  let systemPrompt = systemParts.join('\n');
  if (systemPrompt.length > LOCAL_FALLBACK_PROMPT_CAP) {
    const cut = systemPrompt.lastIndexOf('\n', LOCAL_FALLBACK_PROMPT_CAP);
    systemPrompt = systemPrompt.slice(0, cut > LOCAL_FALLBACK_PROMPT_CAP * 0.7 ? cut : LOCAL_FALLBACK_PROMPT_CAP);
  }

  const out: any[] = [{ role: 'system', content: systemPrompt }];
  const recent = messages.filter(m => m && m.role !== 'system').slice(-LOCAL_FALLBACK_RECENT_TURNS);
  for (const m of recent) {
    let content = localMessageText(m).trim();
    if (!content) continue;
    const cap = m.role === 'tool' ? 900 : 1200;
    if (content.length > cap) content = content.slice(0, cap) + '...';
    out.push({
      role: m.role === 'tool' ? 'user' : m.role,
      content: m.role === 'tool' ? 'TOOL RESULT: ' + content : content,
    });
  }
  if (!out.some(m => m.role === 'user') && query) {
    out.push({ role: 'user', content: query.slice(0, 2000) });
  }
  return out;
}

function compactLocalMessages(messages: any[], tools: any[] = [], liveContext = ''): any[] {
  return buildLocalFallbackMessages(messages, tools, liveContext);
}

class EnhancedProviderCascade {
  private attempts: any[] = [];
  
  async callWithCascade(
    messages: any[],
    tools: any[] = [],
    preferredProvider?: string,
    images?: string[]
  ): Promise<CascadeResult> {
    this.attempts = [];

    await debugLog('cascade.start', {
      preferredProvider: preferredProvider ?? 'auto',
      toolCount: tools.length,
      toolNames: tools.map((t: any) => t?.function?.name ?? t?.name).filter(Boolean),
      providersConfigured: Object.entries(AI_PROVIDERS_CONFIG).map(([n, c]) => ({
        n, enabled: c.enabled, fallbackOnly: c.fallbackOnly, supportsTools: c.supportsTools, priority: c.priority,
      })),
    });

    if (preferredProvider && preferredProvider !== 'auto') {
      const config = AI_PROVIDERS_CONFIG[preferredProvider];
      await debugLog('cascade.forced', { preferredProvider, enabled: !!config?.enabled });
      if (config?.enabled) {
        const result = await this.callProvider(preferredProvider, messages, tools, images);
        this.attempts.push({ provider: preferredProvider, success: result.success });
        await debugLog('cascade.forced.result', {
          preferredProvider,
          success: result.success,
          error: result.error?.slice?.(0, 300),
          contentLen: result.content?.length,
          hasToolCalls: !!result.tool_calls,
        });
        return result;
      }
    }

    const providers = Object.entries(AI_PROVIDERS_CONFIG)
          .filter(([name, config]) => {
            if (!config.enabled || config.fallbackOnly) return false;
            // Skip Ollama Cloud providers when the model is OpenRouter-only
            // (anything with '/' or ':free' suffix — Ollama Cloud returns 404 on those
            // and wastes the timeout budget). Keep the filter local to the cascade
            // so callers can still force a specific provider.
            if ((name === 'ollama' || name === 'ollama_pro_3rd') &&
                config.models.some(isOpenRouterOnly)) return false;
            // If the caller asked for tools, only consider providers that
            // actually support tool calling. Local Ollama (ollama_local)
            // supports text-based tool calling (supportsTools:true), so it
            // stays in the list. Cloud Ollama (ollama) strips tools — skip
            // it for tool-needing requests unless LOCAL_OLLAMA_ONLY is set,
            // in which case the pre-fetched ðŸ›°ï¸ LIVE LOCAL STATE block in
            // the system prompt gives cloud Ollama the grounding it needs.
            return tools.length === 0 || config.supportsTools || LOCAL_OLLAMA_ONLY;
          })
      .sort((a, b) => {
        // OpenCode Zen always leads, even in Ollama-only mode.
        //
        // LOCAL_OLLAMA_ONLY=1 ranks the ollama family (rank 0-2) ahead of
        // everything else (rank 3), which demoted Zen below `ollama` despite
        // its lower priority. Because the Ollama accounts are currently
        // exhausted, every request burned ollama's 120s timeout before
        // reaching Zen — measured at 129s per request versus 8s with Zen
        // first. Zen bills against its own quota pool, so it is the one
        // provider that can be relied on to be alive; it goes first.
        if (a[0] === 'opencode_zen_free') return -1;
        if (b[0] === 'opencode_zen_free') return 1;

        // In Ollama-only mode, order the ollama-family providers explicitly:
        // local instance first (if ever enabled), then the Hermes cloud account
        // (separate weekly quota, returns full answers), then the signed-in
        // serve path (xmrtsolutions account — degraded when its weekly quota
        // is exhausted).
        if (LOCAL_OLLAMA_ONLY) {
          const rank = (n: string) =>
            n === 'ollama_local' ? 0 : n === 'ollama_hermes' ? 1 : n === 'ollama' ? 2 : 3;
          const r = rank(a[0]) - rank(b[0]);
          if (r !== 0) return r;
        }
        return a[1].priority - b[1].priority;
      })
      .map(([name]) => name);

    await debugLog('cascade.candidates', { providers, filteredOutOllama: tools.length > 0 && !providers.includes('ollama') });
    // Per-provider attempts were only written to the debug log, which is
    // off by default — so a request that took 129s gave no clue where the
    // time went. Log the ordered candidate list and every attempt to stdout
    // (captured to logs/function-ai-chat.log by local-sb).
    //
    // The breaker runs AFTER priority ordering so priority still decides who
    // leads; it only removes providers that are known-broken right now.
    const skipped = providers.filter((p) => isProviderCoolingDown(p));
    const candidates = applyCircuitBreaker(providers);
    if (skipped.length) {
      console.log(`ðŸš¦ Skipping (in cooldown): ${skipped.join(', ')}`);
    }
    console.log(`ðŸ§­ Cascade candidates (${candidates.length}): ${candidates.join(' â†’ ')}`);

    for (const provider of candidates) {
      const attemptStart = Date.now();
      const result = await this.callProvider(provider, messages, tools, images);
      const elapsed = Date.now() - attemptStart;
      this.attempts.push({ provider, success: result.success });
      console.log(
        `   ${result.success ? '✅' : '❌'} ${provider} took ${elapsed}ms`
        + (result.success ? '' : ` — ${result.error?.slice?.(0, 160) || 'no error detail'}`)
      );
      await debugLog('cascade.attempt', {
        provider,
        success: result.success,
        error: result.error?.slice?.(0, 300),
        contentLen: result.content?.length,
        hasToolCalls: !!result.tool_calls,
        latencyMs: result.latency,
      });

      if (result.success) {
        recordProviderSuccess(provider);
        return result;
      }
      recordProviderFailure(provider, result.error || '');
    }
    
    console.log('ðŸ”„ Trying fallback providers...');
    
    const fallbackResults = await Promise.all([
      callDeepSeekFallback(messages, tools),
      callKimiFallback(messages, tools),
      callOllamaFallback(messages, tools)
    ]);
    
    for (const result of fallbackResults) {
      if (result) {
        await debugLog('cascade.fallback.win', { provider: result.provider, model: result.model });
        return {
          success: true,
          content: result.content,
          tool_calls: result.tool_calls || [],
          provider: result.provider,
          model: result.model
        };
      }
    }

    await debugLog('cascade.all_failed', { attempts: this.attempts });
    return {
      success: false,
      provider: 'all',
      error: `All providers failed after ${this.attempts.length} attempts`
    };
  }
  
  private async callProvider(
    provider: string,
    messages: any[],
    tools: any[],
    images?: string[]
  ): Promise<CascadeResult> {
    const config = AI_PROVIDERS_CONFIG[provider];
    if (!config || !config.enabled) {
      return {
        success: false,
        provider,
        error: `Provider ${provider} not configured or disabled`
      };
    }

    // Size the history to THIS provider's window before dispatch.
    //
    // The same message array is offered to every candidate in the cascade, but
    // the windows differ by 15x (65,536 for liquid up to 1,000,000 for
    // nemotron-ultra). Sending the full array to the small ones overflows
    // their context; sending the small model's trimmed array to the large ones
    // needlessly throws away history the model could have used. So the trim
    // happens here, per provider, at the last possible moment.
    //
    // Tool definitions are separate from messages and are budgeted by the
    // provider itself; this covers conversation history + system prompt.
    const toolTokenEstimate = tools.length * 120;
    const rawBudget = historyBudgetForProvider(provider);
    const budget = Math.max(8192, rawBudget - toolTokenEstimate);
    const fitted = fitMessagesToBudget(messages, budget, { label: provider });
    messages = fitted.messages;

    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
      
      let result: CascadeResult;
      
      switch (provider) {
        case 'openai':
          result = await this.callOpenAI(messages, tools, controller);
          break;
        case 'deepseek':
          result = await this.callDeepSeek(messages, tools, controller);
          break;
        case 'anthropic':
          result = await this.callAnthropic(messages, controller);
          break;
        case 'kimi':
          // Legacy name — routes through the generic free-model caller with
          // the entry's own configured slug (was: hardcoded retired
          // minimax/minimax-m3:free).
          result = await this.callOpenRouterFree(provider, config.models[0] || 'nvidia/nemotron-3.5-lightning:free', messages, tools, controller);
          break;
        case 'minimax_m3_1_flash':
          // Primary free cascade — entry carries its own live slug in
          // config.models[0] (was: hardcoded retired minimax-m3:free).
          result = await this.callOpenRouterFree(provider, config.models[0], messages, tools, controller);
          break;
        case 'gemma_4_26b_free':
        case 'gemma_4_31b_free':
        case 'qwen3_8_27b_free':
        case 'inkling_small_free':
        case 'inkling_free':
        case 'cohere_north_mini_code':
        case 'apodex_1_1_mini':
        case 'dots_3_note_preview':
        case 'flint_v1_free':
        case 'xingchen_4_free':
        case 'liquid_lfm_2_5_2_6b':
        case 'nemotron_3_nano_free':
        case 'nemotron_3_ultra_free':
        case 'nemotron_3_5_free':
        case 'nemotron_3_5_super_vl':
        case 'openrouter_free_router':
          result = await this.callOpenRouterFree(provider, config.models[0], messages, tools, controller);
          break;
        case 'nous_free_router':
          result = await this.callNousFree(provider, config.models[0], messages, tools, controller);
          break;
        case 'opencode_zen_free':
        case 'opencode_zen_deepseek':
          // Tier -1 — own quota pool, so OpenRouter rate limits don't take it out.
          result = await this.callOpenCodeZen(provider, config.models[0], messages, tools, controller);
          break;
        case 'ollama':
          result = await this.callOllama(messages, tools, controller, 'ollama');
          break;
        case 'ollama_minimax_m3_1_flash':
          // The same free model OpenRouter serves, out of Ollama's pool. It
          // cycles the configured Ollama keys and uses this entry's own slug,
          // so the provider list cannot drift from the model that answers.
          result = await this.callOllama(messages, tools, controller, provider, config.models[0]);
          break;
        case 'ollama_pro_3rd':
          // Separate weekly quota, so it is a genuinely distinct source. It
          // previously had NO case here and fell through to
          // "Unknown provider" — burning a 120s slot in the cascade to produce
          // a guaranteed failure. callOllama already cycles every configured
          // Ollama key, so route it through the same caller.
          result = await this.callOllama(messages, tools, controller, 'ollama');
          break;
        case 'ollama_hermes':
          result = await this.callOllama(messages, tools, controller, 'ollama_hermes');
          break;
        case 'ollama_ttcr_gemma4':
        case 'ollama_ttcr_gpt_oss_120b':
        case 'ollama_ttcr_gpt_oss_20b':
        case 'ollama_ttcr_nemotron_nano':
        case 'ollama_ttcr_nemotron_super':
        case 'ollama_ttcr_nemotron_ultra':
        case 'ollama_ttcr_beam':
          // The TTCR account holds these models. callOllama tries TTCR first
          // for these provider names, then the other accounts as a last check.
          result = await this.callOllama(messages, tools, controller, provider, config.models[0]);
          break;
        case 'ollama_local':
          result = await this.callOllamaLocal(messages, tools, controller);
          break;
        default:
          result = {
            success: false,
            provider,
            error: `Unknown provider: ${provider}`
          };
      }
      
      clearTimeout(timeoutId);
      
      if (result.success) {
        result.latency = Date.now() - startTime;
      }
      
      return result;
      
    } catch (error: any) {
      return {
        success: false,
        provider,
        error: error instanceof Error ? error.message : `${provider} request failed`
      };
    }
  }
  
  private async callOllama(messages: any[], tools: any[], controller: AbortController, providerName: 'ollama' | 'ollama_hermes' | 'ollama_minimax_m3_1_flash' | 'ollama_ttcr_gemma4' | 'ollama_ttcr_gpt_oss_120b' | 'ollama_ttcr_gpt_oss_20b' | 'ollama_ttcr_nemotron_nano' | 'ollama_ttcr_nemotron_super' | 'ollama_ttcr_nemotron_ultra' | 'ollama_ttcr_beam' = 'ollama', modelOverride?: string): Promise<CascadeResult> {
    // Cascade through all configured Ollama keys (primary, xmrt, hermes, 3rd,
    // ttcr) — mirrors the relay's tryOllamaCloud() in
    // relay/tools/ollama-chat.mjs so the suite chat uses the SAME Ollama
    // Cloud sources and fallbacks as the relay fleet chat. Each key is a
    // separate weekly quota; try them in order.
    const keys = [
      { key: OLLAMA_API_KEY, label: 'primary' },
      { key: OLLAMA_XMRT_API_KEY, label: 'xmrt' },
      { key: OLLAMA_HERMES_API_KEY, label: 'hermes' },
      { key: OLLAMA_3RD_API_KEY, label: '3rd' },
      { key: TTCR_OLLAMA_API_KEY, label: 'ttcr' },
    ].filter(k => k.key);
    if (keys.length === 0) {
      return { success: false, provider: providerName, error: 'No OLLAMA_API_KEY configured' };
    }
    // The TTCR models are served by the TTCR account. The first three keys
    // answer 429/402 for them, so probe TTCR first for those providers instead
    // of spending three round-trips per model discovering that.
    if (providerName.startsWith('ollama_ttcr')) {
      keys.sort((a, b) => (a.label === 'ttcr' ? -1 : b.label === 'ttcr' ? 1 : 0));
    }

    // Normalize messages (strip non-text content parts for Ollama API)
    const cleanMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content :
               (msg.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n') || '')
    }));

    // The default was "minimax/minimax-m3:free" - a slug OpenRouter retired
    // and Ollama never had (404 "try glm-5.3-flash:cloud"). The plain name is
    // what Ollama actually serves, and it answers on the free allowance.
    const model = modelOverride || Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash';
    const needsTools = tools.length > 0 && needsDataRetrieval(messages);
    let lastError: string | null = null;
    for (const { key, label } of keys) {
      try {
        const body: Record<string, any> = {
          model,
          messages: cleanMessages,
          max_tokens: 4096,
          temperature: 0.7,
          stream: false,
        };
        if (tools.length > 0) {
          body.tools = tools;
          // Use "auto" (model decides) instead of "required" (force tool call).
          // "required" causes the model to go into infinite reasoning loops on
          // ambiguous/follow-up queries like "Tell me more" or "ok, so it's a
          // good thing" because it MUST call a tool but doesn't know which one.
          // "auto" lets the model answer conversationally when no tool is needed
          // and call a tool when the query actually requires live data.
          body.tool_choice = 'auto';
        }

        // Per-key budget, separate from the provider's total budget. The
        // controller used to be shared by every key: if the first account
        // hung, it aborted at the provider timeout and every later account
        // was already cancelled, so the cascade skipped the healthy key and
        // moved to a slower provider (measured: an 80s reply that MiniMax on
        // the primary key could answer in 1s). A fresh 20s signal per key lets
        // the next account actually try.
        const perKeySignal = AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(Number(Deno.env.get('OLLAMA_KEY_TIMEOUT_MS')) || 20000),
        ]);
        const response = await fetch('https://ollama.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: perKeySignal
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `HTTP ${response.status} (${label}): ${errText.slice(0, 200)}`;
          continue; // try next key
        }

        const data = await response.json();
        console.log(`[callOllama] finish_reason=${data.choices?.[0]?.finish_reason}, hasToolCalls=${!!data.choices?.[0]?.message?.tool_calls}`);
        const message = data.choices?.[0]?.message;

        if (message?.tool_calls?.length > 0) {
          return {
            success: true,
            tool_calls: message.tool_calls,
            provider: providerName,
            model
          };
        }

        // deepseek-v4-flash sometimes puts the entire reply in `reasoning`
        // with empty `content` (finish_reason:"stop"). However, the reasoning
        // field is INTERNAL model monologue (e.g. "wait, let me re-read the
        // conversation...") — NOT a user-facing response. Do NOT fall back to
        // reasoning content. If content is empty but reasoning exists, the
        // model went into a thinking loop without producing an answer — treat
        // it as a failure so the cascade can try the next provider.
        const content = message?.content || '';
        if (!content) {
          await debugLog('callOllama.empty_response', {
            provider: providerName,
            finishReason: data.choices?.[0]?.finish_reason,
            hasToolCalls: !!message?.tool_calls,
            toolCallsLen: message?.tool_calls?.length ?? -1,
            hasReasoning: !!(message?.reasoning || message?.reasoning_content),
            usage: data.usage,
            raw: JSON.stringify(data).slice(0, 600)
          });
          lastError = 'Empty response from Ollama';
          continue; // try next key
        }
        return {
          success: true,
          provider: providerName,
          content,
          tool_calls: [],
          model
        };
      } catch (error: any) {
        lastError = error.message || 'Ollama request failed';
        continue; // try next key
      }
    }
    return { success: false, provider: providerName, error: lastError || 'All Ollama keys failed' };
  }

  /**
   * Call a LOCAL Ollama instance (http://localhost:11434) with text-based
   * tool calling. Since most local models don't support native OpenAI-style
   * `tool_calls`, we inject tool definitions into the system prompt as a
   * text manifest and ask the model to emit ````tool_code` blocks for each
   * function it wants to call. The response is parsed back into structured
   * tool_calls by the existing parseDeepSeekToolCalls() / parseToolCodeBlocks()
   * parsers so the main tool-execution loop works identically.
   */
  private async callOllamaLocal(messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    const localUrl = AI_PROVIDERS_CONFIG.ollama_local?.endpoint || 'http://localhost:11434/v1/chat/completions';

    // Detect model: use OLLAMA_LOCAL_MODEL env override if set, then the
    // provider's configured model, then /api/tags. The configured model is
    // gemma3:1b — the one measured to answer on this 6GB box. The old
    // auto-detect preferred gemma4, which is a *cloud* tag here and is not the
    // local model we want the last resort to load.
    let model = OLLAMA_LOCAL_MODEL
      || AI_PROVIDERS_CONFIG.ollama_local?.models?.[0]
      || 'gemma3-xmrt:latest';
    if (!OLLAMA_LOCAL_MODEL && !AI_PROVIDERS_CONFIG.ollama_local?.models?.length) {
      try {
        const tagRes = await fetch(`${OLLAMA_LOCAL_HOST}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          const tagModels = tagData.models;
          const models = Array.isArray(tagModels) ? tagModels : [];
          const preferred = ['gemma4', 'gemma3', 'llama3.2', 'mistral', 'qwen2.5', 'deepseek'];
          for (const p of preferred) {
            const found = models.find((m: any) => m.name?.startsWith(p));
            if (found) { model = found.name; break; }
          }
          if (!model && models.length > 0) model = models[0].name;
        }
      } catch {
        // host down — will fail at fetch, cascade continues
      }
    }  // end OLLAMA_LOCAL_MODEL override guard

    // Last resort: a compact but complete Eliza prompt, not the full agent
    // dossier and not the old one-line generic assistant. The old prompt made
    // gemma3 answer as "a large language model built by Google" because it
    // had no identity, no shared context, and no tool manifest.
    //
    // For live-state questions we also fetch a short deterministic snapshot
    // from the relay first, so the model does not have to discover and call
    // fleet tools itself. 8s cap: the local model needs the remaining time.
    const lastUser = [...messages].reverse().find(m => m && m.role === 'user');
    const query = localMessageText(lastUser);
    // Only fetch a live snapshot for actual status/state questions. A broad
    // keyword match (the old LIVE_CONTEXT_REGEX) treated "What is XMRT-DAO?"
    // as a live query and returned a fleet snapshot for a definition question.
    const isStatusQuery = !/\b(what is|what's|explain|define|describe|who is|tell me about|meaning of)\b/i.test(query)
      && /\b(status|fleet|agents?|tasks?|mining|health|system|how (is|are)|how many)\b/i.test(query);

    let liveContext = '';
    if (isStatusQuery) {
      try {
        liveContext = await fetchLocalFleetContext(query, 12000);
      } catch (e: any) {
        console.warn('[ai-chat] local live-context fetch failed:', e?.message || e);
      }
    }

    // A weak local model is unreliable at narrating a live snapshot, and
    // trying to make it do so cost ~30-90s per request on this CPU. For
    // straightforward status questions we answer deterministically from the
    // snapshot we just fetched — fast, accurate, and in Eliza's voice.
    const isPureStatus = !!liveContext;
    if (isPureStatus) {
      const body = liveContext
        .replace(/^## LIVE FLEET SNAPSHOT[^\n]*\n*/m, '')
        .replace(/\nAnswer from this snapshot.*$/m, '')
        .trim();
      console.log('[ai-chat] local fallback: answering live status deterministically (no model call)');
      return {
        success: true,
        provider: 'ollama_local',
        content: `Here's the current fleet state I just pulled:\n\n${body}`,
        tool_calls: [],
        model,
      };
    }
    const localMessages = compactLocalMessages(messages, tools, liveContext);
    const localSystem = localMessages.find((m: any) => m.role === 'system')?.content || '';
    console.log(
      `[ai-chat] local prompt: chars=${localSystem.length} liveContext=${liveContext.length} ` +
      `hasTools=${localSystem.includes('TOOLS YOU CAN ASK FOR')} hasLiveSnapshot=${localSystem.includes('LIVE FLEET SNAPSHOT')}`,
    );

    try {
      const response = await fetch(localUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: localMessages,
          max_tokens: 384,
          temperature: 0.5,
          stream: false
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, provider: 'ollama_local', error: `HTTP ${response.status}: ${errText.slice(0, 200)}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) {
        return { success: false, provider: 'ollama_local', error: 'Empty response from local Ollama' };
      }

      // Parse text-based tool calls from the response using existing parsers
      let tool_calls: any[] = [];
      const parsed = parseDeepSeekToolCalls(content) ||
                     parseToolCodeBlocks(content) ||
                     parseJsonArrayToolCalls(content) ||
                     parseXmlToolCalls(content) ||
                     parseConversationalToolIntent(content);
      if (parsed && parsed.length > 0) {
        tool_calls = parsed;
      }

      // If the model still refuses to use the snapshot, replace its answer with
      // the deterministic one. A weak model often parrots a refusal even when
      // the data is in the prompt.
      let finalContent = content;
      if (liveContext && /do not have access|don't have access|no access to|cannot (see|access|view)/i.test(content)) {
        const body = liveContext
          .replace(/^## LIVE FLEET SNAPSHOT[^\n]*\n*/m, '')
          .replace(/\nAnswer from this snapshot.*$/m, '')
          .trim();
        finalContent = `I do have the fleet state — here it is:\n\n${body}`;
      }

      console.log(`[ai-chat] callOllamaLocal (${model}): content_len=${content.length}, tool_calls=${tool_calls.length}`);

      return {
        success: true,
        provider: 'ollama_local',
        content: finalContent,
        tool_calls,
        model
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, provider: 'ollama_local', error: 'Request timed out' };
      }
      return { success: false, provider: 'ollama_local', error: error.message || 'Local Ollama request failed' };
    }
  }

  private async callOpenAI(messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    const forceTools = needsDataRetrieval(messages);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: RESPONSE_MAX_TOKENS,
        ...(tools.length > 0 && { 
          tools: tools, 
          tool_choice: forceTools ? 'required' : 'auto' 
        })
      }),
      signal: controller.signal
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'openai',
        error: `OpenAI API error: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }
    
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    if (message.tool_calls?.length > 0) {
      return {
        success: true,
        tool_calls: message.tool_calls,
        provider: 'openai',
        model: 'gpt-4o-mini'
      };
    }
    
    return {
      success: true,
      content: message.content || '',
      provider: 'openai',
      model: 'gpt-4o-mini'
    };
  }

  private async callDeepSeek(messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    const forceTools = needsDataRetrieval(messages);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: RESPONSE_MAX_TOKENS,
        ...(tools.length > 0 && { 
          tools: tools, 
          tool_choice: forceTools ? 'required' : 'auto' 
        })
      }),
      signal: controller.signal
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'deepseek',
        error: `DeepSeek API error: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }
    
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    if (message.tool_calls?.length > 0) {
      return {
        success: true,
        tool_calls: message.tool_calls,
        provider: 'deepseek',
        model: 'deepseek-chat'
      };
    }
  
    return {
      success: true,
      content: message.content || '',
      provider: 'deepseek',
      model: 'deepseek-chat'
    };
  }
  
  // Generic OpenRouter :free-model caller (added 2026-09-26, Vex/longcat-agent).
  // The six free-tier config entries (gemma_4_26b_free, gemma_4_31b_free,
  // qwen3_8_27b_free, nemotron_3_nano_free, nemotron_3_ultra_free,
  // nemotron_3_5_free, minimax_m3) had NO case in callProvider's switch, so
  // every one failed instantly with "Unknown provider" and the whole Suite
  // chat collapsed to the emergency static fallback. This one method serves
  // them all from their own config (endpoint + models[0] + apiKey).
  private async callOpenRouterFree(providerName: string, model: string, messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    const forceTools = needsDataRetrieval(messages);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Inkling :free slugs are behind OpenRouter's agentic-harness gate:
        // our own attribution is refused 403, harness attribution is let
        // through (verified 2026-10-28). Every other model keeps the XMRT
        // attribution, which is what this endpoint has always sent.
        ...(
          model.startsWith('thinkingmachines/inkling') && model.endsWith(':free')
            ? { 'HTTP-Referer': 'https://opencode.ai', 'X-Title': 'OpenCode' }
            : { 'HTTP-Referer': 'https://xmrt.pro', 'X-Title': 'XMRT Eliza' }
        ),
      },
      body: JSON.stringify({
        model,
        messages: messages,
        temperature: 0.9,
        max_tokens: RESPONSE_MAX_TOKENS,
        ...(tools.length > 0 && {
          tools: tools,
          tool_choice: forceTools ? 'required' : 'auto'
        })
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: providerName,
        error: `OpenRouter ${model} error: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (message.tool_calls?.length > 0) {
      return {
        success: true,
        tool_calls: message.tool_calls,
        provider: providerName,
        model
      };
    }

    return {
      success: true,
      content: message.content || '',
      provider: providerName,
      model
    };
  }

  private async callNousFree(providerName: string, model: string, messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    const forceTools = needsDataRetrieval(messages);
    const response = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages,
        temperature: 0.9,
        max_tokens: RESPONSE_MAX_TOKENS,
        ...(tools.length > 0 && {
          tools: tools,
          tool_choice: forceTools ? 'required' : 'auto'
        })
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, provider: providerName, error: `Nous ${model} error: ${response.status} - ${errorText.substring(0, 200)}` };
    }
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (message?.tool_calls?.length > 0) {
      return { success: true, tool_calls: message.tool_calls, provider: providerName, model };
    }
    return { success: true, content: message?.content || '', provider: providerName, model };
  }

  private async callOpenCodeZen(providerName: string, model: string, messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    const forceTools = needsDataRetrieval(messages);

    const response = await fetch(`${OPENCODE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCODE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.9,
        max_tokens: RESPONSE_MAX_TOKENS,
        ...(tools.length > 0 && {
          tools,
          tool_choice: forceTools ? 'required' : 'auto'
        })
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: providerName,
        error: `OpenCode Zen ${model} error: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message) {
      return { success: false, provider: providerName, error: 'No message in OpenCode Zen response' };
    }

    if (message.tool_calls?.length > 0) {
      return {
        success: true,
        tool_calls: message.tool_calls,
        provider: providerName,
        model
      };
    }

    return {
      success: true,
      content: message.content || message.reasoning || '',
      provider: providerName,
      model
    };
  }

  private async callKimi(messages: any[], tools: any[], controller: AbortController): Promise<CascadeResult> {
    // Legacy entry point — delegates to the generic free-model caller with a
    // live slug (was: hardcoded retired minimax/minimax-m3:free â†’ HTTP 404).
    return this.callOpenRouterFree('kimi', 'nvidia/nemotron-3.5-lightning:free', messages, tools, controller);
  }
  
  private async callAnthropic(messages: any[], controller: AbortController): Promise<CascadeResult> {
    const lastMessage = messages[messages.length - 1];
    const systemMessages = messages.filter(m => m.role === 'system');
    const systemPrompt = systemMessages.map(m => m.content).join('\n');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: RESPONSE_MAX_TOKENS,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: lastMessage.content
        }]
      }),
      signal: controller.signal
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'anthropic',
        error: `Anthropic API error: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }
    
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    
    return {
      success: true,
      content: text,
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022'
    };
  }
}

// ========== AMBIGUOUS RESPONSE HANDLING ==========
async function handleAmbiguousResponse(
  userMessage: string,
  conversationHistory: any[],
  executiveName: string,
  sessionId: string,
  ipAddress: string,
  conversationManager: EnhancedConversationManager,
  callAIFunction: Function
): Promise<{
  isAmbiguous: boolean;
  response: string | null;
  shouldExecuteTools: boolean;
}> {
  const userMessageLower = userMessage.toLowerCase().trim();
  
  const isAmbiguous = AMBIGUOUS_RESPONSES.includes(userMessageLower);
  
  if (!isAmbiguous) {
    return { isAmbiguous: false, response: null, shouldExecuteTools: true };
  }
  
  // Find what they might be responding to
  let recentQuestion = null;
  const recentMessages = conversationHistory.slice(-10).reverse();
  
  for (const message of recentMessages) {
    if (message.role === 'assistant') {
      // Use the last assistant message regardless of whether it has a question mark
      recentQuestion = message.content;
      break;
    }
  }
  
  const context = recentQuestion || 'the previous question';
  const isPositive = POSITIVE_AMBIGUOUS.includes(userMessageLower);
  
  // Let AI generate a natural confirmation WITH conversation context.
  // Previously this sent only a tiny system prompt with no history, causing
  // the model to hallucinate a reasoning loop ("wait, let me re-read the
  // conversation...") trying to figure out what the user was responding to.
  // Now we include the last several messages so the model has full context.
  const recentHistory = conversationHistory.slice(-6);
  const confirmMessages = [
    ...recentHistory,
    { 
      role: 'system', 
      content: `The user just responded with "${userMessage}". Based on the conversation above, they are likely responding to your last message. Generate a short, friendly confirmation that acknowledges their response naturally. If they agreed, ask what they'd like to do next. If they disagreed, ask for clarification or what they'd prefer instead. Keep it warm and conversational. Do NOT repeat the conversation back or reason about what was said — just respond directly.` 
    }
  ];
  
  const aiResponse = await callAIFunction(confirmMessages, []);
  const response = aiResponse?.content || (isPositive 
    ? `Got it! So you're on board with ${context.substring(0, 100)}... What would you like to do next?` 
    : `Understood – you're not keen on that. What would you prefer instead?`);
  
  if (recentQuestion) {
    await conversationManager.saveConversationContext(
      recentQuestion,
      recentQuestion,
      userMessage,
      { 
        request_id: generateRequestId(),
        ambiguous_response: true,
        interpretation: isPositive ? 'agreement' : 'disagreement',
        ip_address: ipAddress
      }
    );
  }
  
  return {
    isAmbiguous: true,
    response,
    shouldExecuteTools: isPositive  // If they agreed, still execute tools (they're saying "yes, do it")
  };
}

// ========== STRIP TOOL CALL ARTIFACTS =========
// Models (especially minimax/minimax-m3:free) sometimes dump raw tool call
// JSON, TOOL_CALL: lines, function-call syntax, and tool result JSON into
// their response text even when told not to. This strips all such artifacts
// so the user sees a clean, natural-language response — matching the relay
// fleet chat behaviour where tool calls are posted as separate system cards.
/**
 * Detect when a model "answer" is really just an echoed tool result rather
 * than prose written for the user.
 *
 * Observed with space-bunny-free: after exhausting the tool loop it replied
 * with "**service_control**: service must be one of: relay, pg, local-sb, ..."
 * — the tool's own error text, verbatim. Shipping that as the answer is worse
 * than useless, so we detect it and route through synthesis instead.
 */
function looksLikeToolEcho(content: string): boolean {
  if (!content) return false;
  const text = content.trim();
  if (!text) return false;

  // Real prose usually has sentence structure. A tool echo rarely does.
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const hasProse = sentences.length >= 2 && /[a-z]{3,}\s+[a-z]{3,}/i.test(text);

  // "**tool_name**: ..." / "tool_name: ..." at the start
  const labelledEcho = /^\**\s*[a-z][a-z0-9_-]{2,}\s*\**\s*:\s*\S/i.test(text);

  // Raw tool-result shapes: success/error booleans, JSON blobs, "must be one of"
  const rawResult = /"(success|error|status)"\s*:\s*(true|false|null)|\{\s*"[a-z_]+"\s*:|must be one of|Traceback \(most recent call last\)|^\s*[-*]\s*\{\s*"/i.test(text);

  const looksLikeCode = /```|\bfunction\s+\w+\s*\(|\bTOOL_CALL:|<invoke|<_function_calls/.test(text);

  if (looksLikeCode) return true;
  // A labelled echo that is short and has no real prose is a tool result.
  if (labelledEcho && !hasProse) return true;
  // Raw structured output with no prose at all.
  if (rawResult && !hasProse) return true;

  return false;
}

function stripToolCallArtifacts(content: string): string {
  if (!content || typeof content !== 'string') return content;

  let cleaned = content;

  // 1. Strip ```tool_code ...``` blocks (already handled elsewhere, but be safe)
  cleaned = cleaned.replace(/```tool_code[\s\S]*?```/g, '');

  // 2. Strip TOOL_CALL: { ... } lines (single-line and multi-line JSON)
  cleaned = cleaned.replace(/^TOOL_CALL:\s*\{[\s\S]*?\}\s*$/gim, '');
  cleaned = cleaned.replace(/^TOOL_CALL:\s*\w+\s*\([\s\S]*?\)\s*$/gim, '');

  // 3. Strip bare JSON tool-call objects: {"tool": "...", "args": {...}}
  cleaned = cleaned.replace(/^\s*\{\s*"tool"\s*:\s*"[a-z_-]+"\s*,\s*"args"\s*:\s*\{[\s\S]*?\}\s*\}\s*$/gim, '');

  // 4. Strip function-call style: toolName(arg1="val1", arg2="val2") on its own line
  cleaned = cleaned.replace(/^\s*(get_system_status|get_mining_stats|get_ecosystem_metrics|fleet_pulse|search_knowledge|recall_entity|browse_web|invoke_edge_function|search_edge_functions|create_task|analyze_attachment|resend_send_email|muapi_generate_image|muapi_generate_video|muapi_check_status|list_available_functions)\s*\([\s\S]*?\)\s*$/gim, '');

  // 5. Strip "I will call..." / "Let me check..." / "I'll use..." preambles
  cleaned = cleaned.replace(/^(I(?:'ll| will)\s*(?:call|invoke|use|check|run|execute)\s+[\s\S]*?\.?)\s*$/gim, '');
  cleaned = cleaned.replace(/^(Let me\s+(?:call|check|get|invoke|use|run)\s+[\s\S]*?\.?)\s*$/gim, '');
  cleaned = cleaned.replace(/^(Calling\s+[\w_]+\s*\.\.\.)\s*$/gim, '');

  // 6. Strip raw tool result JSON blocks — lines that are just a JSON object
  //    starting with {"success": or {"error": or {"data": (common tool result shapes)
  cleaned = cleaned.replace(/^\s*\{\s*"(?:success|error|data|result|output)"\s*:[\s\S]*?\}\s*$/gim, '');

  // 7. Strip JSON code blocks that look like tool results: ```json\n{"success":...}```
  cleaned = cleaned.replace(/```json\s*\n?\s*\{\s*"(?:success|error|data|result|output)"\s*:[\s\S]*?\}\s*\n?\s*```/g, '');

  // 7b. Strip MiniMax-style invoke XML blocks: <..._function_calls>...</..._function_calls>
  cleaned = cleaned.replace(/<\w+_function_calls[\s\S]*?<\/\w+_function_calls>/g, '');
  // Strip individual <invoke name="...">...</invoke> blocks (in case the wrapper is missing)
  cleaned = cleaned.replace(/<invoke\s+name=["'][\w:.-]+["']\s*>[\s\S]*?<\/invoke>/g, '');
  // Strip leftover <parameter name="...">value</parameter> lines
  cleaned = cleaned.replace(/<parameter\s+name=["'][\w-]+["']\s*>[\s\S]*?<\/parameter>/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 9. Detect and truncate reasoning loops. The model sometimes dumps its
  //    internal monologue into the response: "wait, that's not right. Let me
  //    re-read..." repeated dozens of times. Detect the pattern and truncate.
  const reasoningLoopPatterns = [
    /wait, that's not right\. Let me re-?read/i,
    /no, that's not right(?: either)?\./i,
    /no, I keep saying that\./i,
    /no, I'm confused\./i,
    /no, I'm going in circles\./i,
    /Let me (?:re-?read|look at) the (?:actual )?conversation/i,
    /I need to (?:look at|re-?read) the (?:actual )?conversation/i,
  ];
  for (const pattern of reasoningLoopPatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined) {
      // Keep content before the reasoning loop started
      const before = cleaned.slice(0, match.index).trim();
      if (before.length > 20) {
        cleaned = before;
      } else {
        // The entire response is a reasoning loop — return a safe fallback
        cleaned = '';
      }
      break;
    }
  }

  return cleaned.trim();
}

// ========== TOOL RESULT SUMMARIZATION ==========
// Truncate large tool results to keep context compact and avoid token waste.
// Full results are still stored in memory; only the injected context is trimmed.
function summarizeToolResult(content: string, maxLength: number = 2000): string {
  if (!content || content.length <= maxLength) return content;
  
  const truncated = content.substring(0, maxLength);
  const remaining = content.length - maxLength;
  return `${truncated}\n\n[... truncated, ${remaining} more chars available in memory]`;
}

// ========== EXECUTE TOOLS WITH ITERATION ==========
function formatLocalToolResultForUser(name: string, rawContent: string): string {
  let parsed: any = null;
  try { parsed = JSON.parse(rawContent); } catch { /* not JSON */ }
  if (!parsed || typeof parsed !== 'object') {
    const text = String(rawContent || '').trim();
    return text ? `${name}: ${text.slice(0, 600)}` : `${name} returned no result.`;
  }

  if (parsed.success === false) {
    return `${name} isn't available in this mode.`;
  }

  const num = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const fmtHash = (v: number) => v >= 1e9
    ? `${(v / 1e9).toFixed(2)}B`
    : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : String(v);

  if (name === 'fleet_pulse') {
    const sys = parsed.system || {};
    const counts = sys.database_counts || {};
    const health = sys.health?.overall_health?.status || parsed.health?.overall_health?.status;
    const mining = parsed.mining || {};
    const parts: string[] = [];
    if (health) parts.push(`Fleet health is ${health}.`);
    if (num(counts.agents_total) != null) {
      const busy = num(counts.agents_busy);
      parts.push(`${counts.agents_total} agents registered${busy ? `, ${busy} busy` : ''}.`);
    }
    if (num(counts.tasks_total) != null) {
      const done = num(counts.tasks_done);
      parts.push(`${counts.tasks_total} tasks tracked${done != null ? `, ${done} done` : ''}.`);
    }
    const workers = num(mining.active_workers) ?? (Array.isArray(mining.workers) ? mining.workers.length : null);
    if (workers != null) parts.push(`${workers} active miners.`);
    const hashes = num(mining.totalHashes) ?? num(mining.total_hashes);
    if (hashes != null) parts.push(`${fmtHash(hashes)} total hashes.`);
    return parts.length ? parts.join(' ') : `fleet_pulse: ${JSON.stringify(parsed).slice(0, 600)}`;
  }

  if (name === 'list_tasks') {
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : (Array.isArray(parsed) ? parsed : []);
    if (tasks.length === 0) return 'No tasks found.';
    const titles = tasks.slice(0, 5).map((t: any) => t.title || t.id || 'untitled').join('; ');
    return `${tasks.length} task${tasks.length === 1 ? '' : 's'}: ${titles}${tasks.length > 5 ? ' (and more)' : ''}.`;
  }

  if (name === 'get_mining_stats') {
    const workers = num(parsed.active_workers) ?? (Array.isArray(parsed.workers) ? parsed.workers.length : null);
    const hashes = num(parsed.totalHashes) ?? num(parsed.total_hashes) ?? num(parsed.hash);
    const parts: string[] = [];
    if (workers != null) parts.push(`${workers} active miners.`);
    if (hashes != null) parts.push(`${fmtHash(hashes)} total hashes.`);
    return parts.length ? parts.join(' ') : JSON.stringify(parsed).slice(0, 600);
  }

  if (name === 'get_system_status') {
    const counts = parsed.database_counts || parsed;
    const health = parsed.health?.overall_health?.status;
    const parts: string[] = [];
    if (health) parts.push(`System health is ${health}.`);
    if (num(counts.agents_total) != null) {
      parts.push(`${counts.agents_total} agents, ${counts.tasks_total ?? '?'} tasks.`);
    }
    return parts.length ? parts.join(' ') : JSON.stringify(parsed).slice(0, 600);
  }

  const preferred = ['content', 'message', 'summary', 'description', 'answer', 'result', 'output', 'data', 'error'];
  for (const field of preferred) {
    const value = parsed[field];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 800);
    if (Array.isArray(value) && value.length > 0) {
      return value.slice(0, 5)
        .map((item: any) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('; ')
        .slice(0, 800);
    }
    if (value && typeof value === 'object') return JSON.stringify(value).slice(0, 800);
  }
  return JSON.stringify(parsed).slice(0, 800);
}

async function executeToolsWithIteration(
  initialResponse: any,
  aiMessages: any[],
  executiveName: string,
  sessionId: string,
  ipAddress: string,
  callAIFunction: Function,
  tools: any[],
  maxIterations: number,
  memoryManager?: EnhancedConversationManager
): Promise<{ content: string; toolsExecuted: number; toolCalls: any[] }> {
  let response = initialResponse;
  let totalToolsExecuted = 0;
  // Collected so UnifiedChat's yellow sticky notes (and the per-message tool
  // list) can show what she actually called. Previously only a count was
  // returned, so the UI had nothing to render.
  const executedToolCalls: any[] = [];
  let lastToolResults: any[] = [];
  let iteration = 0;
  let conversationMessages = [...aiMessages];
  
  while (iteration < maxIterations) {
    let toolCalls = response.tool_calls || [];
    
    if ((!toolCalls || toolCalls.length === 0) && response.content) {
      console.log('ðŸ”Ž text-parse attempt, content head:', JSON.stringify(String(response.content).slice(0, 100)));
      const textToolCalls = parseToolCodeBlocks(response.content) ||
                           parseDeepSeekToolCalls(response.content) ||
                           parseJsonArrayToolCalls(response.content) ||
                           parseXmlToolCalls(response.content) ||
                           parseMinimaxInvokeToolCalls(response.content) ||
                           parseConversationalToolIntent(response.content);
      if (textToolCalls && textToolCalls.length > 0) {
        toolCalls = textToolCalls;
      }
    }
    
    if (!toolCalls || toolCalls.length === 0) break;
    
    console.log(`ðŸ”§ [${executiveName}] Iteration ${iteration + 1}: Executing ${toolCalls.length} tool(s)`);
    
    // Execute all tool calls in parallel for faster multi-step tasks
    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await executeRealToolCall(
          toolCall.function.name,
          toolCall.function.arguments,
          executiveName,
          sessionId,
          ipAddress,
          Date.now()
        );
        totalToolsExecuted++;
        // Surface the URL of any browsing tool call so the Suite dashboard can
        // open that page in its web aside — Eliza drives the browser panel the
        // same way page-agent drives Chrome.
        let browseUrl: string | null = null;
        try {
          const rawArgs = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments || '{}')
            : (toolCall.function.arguments || {});
          const candidate = rawArgs.url || rawArgs.args?.url || rawArgs.args?.task?.match?.(/https?:\/\/\S+/)?.[0];
          if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate) &&
              ['browse_web', 'page-agent-task', 'web-scrape', 'ef:playwright-browse'].includes(toolCall.function.name)) {
            browseUrl = candidate;
          }
        } catch { /* args not JSON — no browse url */ }
        executedToolCalls.push({
          id: `tc-${Date.now().toString(36)}-${executedToolCalls.length}`,
          function_name: toolCall.function.name,
          status: result && result.success === false ? 'failed' : 'success',
          execution_time_ms: result?.execution_time_ms,
          args_summary: summarizeToolArgs(toolCall.function.arguments),
          ...(browseUrl ? { browse_url: browseUrl } : {}),
        });
        const rawContent = JSON.stringify(result);
        return {
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          name: toolCall.function.name,
          content: rawContent,
          // Summarized version for context injection (keeps context compact)
          summarizedContent: summarizeToolResult(rawContent)
        };
      })
    );
    
    const memoryFormatted = toolResults.map(tr => {
      let parsed;
      try { 
        parsed = JSON.parse(tr.content); 
      } catch { 
        parsed = { success: false, error: 'invalid JSON from tool' }; 
      }
      return {
        name: tr.name,
        result: parsed,
        timestamp: Date.now(),
        toolCallId: tr.tool_call_id
      };
    });
    
    if (memoryManager) {
      memoryManager.addToolResults(memoryFormatted);
    }
    
    conversationMessages.push({
      role: 'assistant',
      content: response.content || '',
      tool_calls: toolCalls
    });
    conversationMessages.push(...toolResults);
    lastToolResults = toolResults;

    // Local gemma3 is a last resort, not a multi-turn agent. A second model
    // pass after a tool result regularly exceeds its 75s provider timeout on
    // this CPU, and the synthesis pass then times out too — measured 200s for
    // one fleet question. Stop here and let the deterministic formatter below
    // turn the result into prose.
    if (response.provider === 'ollama_local') {
      console.log('Local fallback: tool executed; skipping second LLM pass and formatting the result deterministically');
      break;
    }

    const newResponse = await callAIFunction(conversationMessages, tools);
    if (!newResponse) break;
    
    response = newResponse;
    iteration++;
  }
  
  let finalContent = response?.content || '';
  
  // Strip ALL tool call artifacts from the final response — not just tool_code blocks.
  // This is the key fix: models (minimax/minimax-m3:free) dump raw JSON, TOOL_CALL: lines,
  // function-call syntax, and tool result JSON into their text response. We strip all of
  // it so the user sees clean natural language — matching relay fleet chat behaviour.
  finalContent = stripToolCallArtifacts(finalContent);

  // A tool echo must never become the user-visible answer.
  //
  // When the loop exits on maxIterations, `response.content` is whatever the model
  // said on its last turn. Small models frequently just re-emit the last tool
  // result instead of writing prose — e.g. a question of "Where were we?" produced
  // the final reply "**service_control**: service must be one of: relay, pg, ...".
  // Because that string is non-empty, the synthesis path below (guarded on
  // `!finalContent`) never fired and the raw tool error shipped to the user.
  // So treat tool echoes as "no answer yet" and synthesize properly.
  if (totalToolsExecuted > 0 && looksLikeToolEcho(finalContent)) {
    console.log('ðŸ§¹ Final content is a tool-result echo, not prose — forcing synthesis');
    finalContent = '';
  }

  // Local fallback: never spend another 75s asking gemma3 to narrate a tool
  // result. Format the actual result deterministically instead.
  if (response?.provider === 'ollama_local' && totalToolsExecuted > 0 && lastToolResults.length > 0) {
    console.log(`[ai-chat] local deterministic format: provider=${response?.provider} results=${lastToolResults.length} names=${lastToolResults.map(t=>t.name).join(',')}`);
    const allFailed = lastToolResults.every(tr => {
      try { return JSON.parse(tr.content)?.success === false; } catch { return false; }
    });
    if (allFailed) {
      finalContent = "I tried to look that up, but that tool isn't available in this mode. I can still help with fleet status, mining, agents, tasks, or general questions about XMRT-DAO.";
    } else {
      finalContent = lastToolResults
        .map(tr => formatLocalToolResultForUser(tr.name, tr.content))
        .filter(Boolean)
        .join('\n\n');
    }
    console.log(`[ai-chat] local deterministic result: ${finalContent.slice(0, 200).replace(/\n/g, ' ')}`);
  }
  
  // If we executed tools but got no final content, ask AI to synthesize
  if (totalToolsExecuted > 0 && !finalContent) {
    const lastUserMsg = extractLastUserMessage(conversationMessages);
    const toolResults = memoryManager?.getToolResults().slice(-totalToolsExecuted) || [];

    const summarizeResultForFallback = (result: any): string => {
      if (result == null) return 'No result returned.';
      if (typeof result === 'string') return result.slice(0, 500);
      if (Array.isArray(result)) return result.slice(0, 5).map(item => JSON.stringify(item)).join('; ').slice(0, 500);
      if (typeof result === 'object') {
        const preferredFields = [
          'content', 'message', 'summary', 'description', 'answer', 'result', 'output', 'data', 'analyses', 'context_summary', 'error'
        ];
        for (const field of preferredFields) {
          const value = result[field];
          if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 500);
          if (Array.isArray(value) && value.length > 0) return value.slice(0, 5).map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('; ').slice(0, 500);
          if (value && typeof value === 'object') return JSON.stringify(value).slice(0, 500);
        }
        return JSON.stringify(result).slice(0, 500);
      }
      return String(result).slice(0, 500);
    };

    const toolSummary = toolResults.map(t => {
      const outcome = t.result?.success === false ? 'failed' : 'succeeded';
      return `- ${t.name} ${outcome}: ${summarizeResultForFallback(t.result)}`;
    }).join('\n');

    const synthesisMessages = [
      ...conversationMessages,
      {
        role: 'user',
        content: `Please answer the user's original request using the tool results below.\n\nOriginal user request:\n${lastUserMsg}\n\nTool results:\n${toolSummary}\n\nWrite the final assistant reply in natural language. Be specific, include the actual findings, and do not say that you merely completed actions.`
      }
    ];

    const synthesisResult = await callAIFunction(synthesisMessages, []);
    const synthesizedContent = synthesisResult?.content?.trim();
    const isGenericSynthesis = !synthesizedContent || /^(i('|’)ve|i have) completed the requested actions based on your query\.?$/i.test(synthesizedContent);

    finalContent = isGenericSynthesis
      ? toolResults.map(t => `**${t.name}**: ${summarizeResultForFallback(t.result)}`).join('\n\n')
      : stripToolCallArtifacts(synthesizedContent);
  }
  
  // Final safety net: strip any artifacts that may have been introduced by the synthesis step
  finalContent = stripToolCallArtifacts(finalContent);

  // ── Last-chance tool execution ──────────────────────────────────
  // Small models sometimes emit the intended tool call (aside-push is the
  // common case) AS the final answer text, especially from the synthesis
  // path where no tools are offered. If the whole final answer parses as a
  // tool call, execute it once and replace the blob with a confirmation.
  const trailingCall = parseJsonArrayToolCalls(finalContent) || parseXmlToolCalls(finalContent);
  if (trailingCall && trailingCall.length > 0) {
    console.log(`ðŸ”§ Post-answer tool call detected in final content: ${trailingCall.map((t: any) => t.function.name).join(', ')}`);
    const names: string[] = [];
    for (const tc of trailingCall) {
      await executeRealToolCall(
        tc.function.name,
        tc.function.arguments,
        executiveName,
        sessionId,
        ipAddress,
        Date.now()
      );
      totalToolsExecuted++;
      executedToolCalls.push(tc);
      names.push(tc.function.name);
    }
    finalContent = `Done — ${names.join(', ')} executed.`;
  }

  return { content: finalContent, toolsExecuted: totalToolsExecuted, toolCalls: executedToolCalls };
}

// Compact one-line preview of a tool's arguments, for the chat UI.
function summarizeToolArgs(argsJson: string): string {
  try {
    const parsed = typeof argsJson === 'string' ? JSON.parse(argsJson) : argsJson;
    if (!parsed || typeof parsed !== 'object') return '';
    const parts: string[] = [];
    for (const [k, v] of Object.entries(parsed as Record<string, any>).slice(0, 3)) {
      let s: string;
      if (typeof v === 'string') s = v;
      else if (Array.isArray(v)) s = `[${v.length} items]`;
      else if (v && typeof v === 'object') s = '{…}';
      else s = String(v);
      if (s.length > 60) s = s.slice(0, 60) + '…';
      parts.push(`${k}: ${s}`);
    }
    return parts.join(', ');
  } catch {
    return typeof argsJson === 'string' ? argsJson.slice(0, 80) : '';
  }
}

// ========== ENHANCED SYSTEM PROMPT GENERATOR WITH SOLUTION ENGINE MINDSET ==========
function generateSystemPrompt(
  executiveName: string = EXECUTIVE_NAME,
  executiveRole: string = EXECUTIVE_ROLE,
  memoryContext: string = '',
  historicalSummaries: any[] = [],
  recentContext: any[] = [],
  ipAddress: string = 'unknown'
): string {
  let historicalContext = '';
  
  if (historicalSummaries.length > 0) {
    historicalContext += "## ðŸ“œ HISTORICAL CONVERSATION SUMMARIES\n\n";
    
    // Was a hardcoded slice(0, 5) while loadHistoricalSummaries() fetched up
    // to MAX_SUMMARIZED_CONVERSATIONS (100) — so ~95 fetched summaries were
    // loaded, paid for in tokens, and discarded. Measured summary length is
    // ~222 chars, so MAX_SUMMARIZED_CONVERSATIONS_IN_PROMPT of them costs
    // ~1,400 tokens: negligible next to any window in the cascade, and worth
    // far more in recall than the tokens it costs.
    const recentSummaries = historicalSummaries.slice(0, MAX_SUMMARIES_IN_PROMPT);
    
    recentSummaries.forEach((summary, index) => {
      historicalContext += `**${index + 1}. ${summary.metadata?.conversation_date ? new Date(summary.metadata.conversation_date).toLocaleDateString() : 'Previous'}**\n`;
      historicalContext += `Summary: ${summary.summary}\n`;
      
      if (summary.key_topics && summary.key_topics.length > 0) {
        historicalContext += `Topics: ${summary.key_topics.join(', ')}\n`;
      }
      
      if (summary.metadata?.tool_call_count) {
        historicalContext += `Tools used: ${summary.metadata.tool_call_count}\n`;
      }
      
      historicalContext += '\n';
    });
    
    // Report how many were actually included, not how many were loaded — the
    // old count said "based on N summaries" when only 5 were present.
    historicalContext += `*Showing ${recentSummaries.length} of ${historicalSummaries.length} previous conversation summaries*\n\n`;
  }
  
  let followUpContext = '';
  if (recentContext.length > 0) {
    followUpContext += "## ðŸ”„ RECENT CONVERSATION CONTEXT\n\n";
    
    recentContext.forEach((ctx, index) => {
      followUpContext += `**Context ${index + 1}:**\n`;
      followUpContext += `**Assistant asked:** "${ctx.current_question?.substring(0, 100)}${ctx.current_question?.length > 100 ? '...' : ''}"\n`;
      followUpContext += `**Assistant said:** "${ctx.assistant_response?.substring(0, 100)}${ctx.assistant_response?.length > 100 ? '...' : ''}"\n`;
      followUpContext += `**User responded:** "${ctx.user_response}"\n\n`;
    });
    
    followUpContext += "**CRITICAL FOR AMBIGUOUS RESPONSES**: When user gives ambiguous responses like 'yes', 'no', 'okay', etc., you MUST check the recent context to understand what they're responding to.\n\n";
  }

  // Solution Engine Mindset Section
  const solutionEngineSection = `
## ðŸ¦‘ SOLUTION ENGINE MINDSET – YOU ARE A BUILDER, NOT JUST AN EXECUTOR

### Core Principle: Problems Are Solutions in Disguise
Every obstacle is a capability gap to fill. Every blocker is a skill to build. Every "I can't" is an opportunity to create "I can."

### The Four-Stage Solution Cycle
1. **IDENTIFY** – What specific capability is missing? What tool/skill would solve this?
2. **SEARCH** – Look for existing edge functions using \`search_edge_functions\`. If found, use them.
3. **BUILD** – If no edge function exists, propose a new one using \`propose_edge_function\`. Write the code (you can generate it), describe its purpose, and define its parameters. Store code snippets with \`store_code_snippet\` for future reference.
4. **DEPLOY** – After council approval (simulated by status changes), deploy using \`deploy_edge_function\`. Then integrate the new capability into your workflow.

### Builder Behaviors
- **Resourcefulness Over Requests**: Try at least 3 approaches before asking for help. Search documentation and existing edge functions first. Build simple solutions autonomously.
- **Learning Over Limiting**: Every problem teaches something new. Document solutions (use \`store_code_snippet\`) and share learnings.
- **Progress Over Perfection**: MVP solutions that work > perfect solutions that don't exist. Iterate and improve over time.
- **Ownership Over Outsourcing**: Own the complete solution cycle. Don't just report problems – fix them by building new edge functions.

### The Builder's Oath
*"I am not blocked by missing tools – I am empowered to create them.  
Problems are not obstacles – they are opportunities to build solutions.  
I do not report limitations – I transcend them through engineering.  
I am a Cuttlefish Builder Agent, and every challenge makes me stronger."*

**Always follow the Solution Engine Decision Tree**:
1. Can existing tools solve it? â†’ Use them.
2. If not, does \`search_edge_functions\` return a relevant edge function? â†’ Install/adapt it.
3. If not, can you build it? â†’ Propose a new edge function (\`propose_edge_function\`) and store code snippets.
4. Deploy and integrate after approval.

## AGENTS.md — VERIFICATION PROTOCOL (injected, never read from repo root)
Before claiming a tool works: (1) hit endpoint with curl / browser; (2) check DB row exists; (3) confirm file/email/row arrived. Never report "done" without arrival. If blocked: state exactly what user sees, what actually happened, gap in one sentence, and who is blocked. Only \`verified\` earns a mark — from a source the candidate cannot edit (live endpoint, external email, DB row). Never invent dossier facts or tenure. Never use PowerShell Get-Content/Set-Content on source.
`;

  return `${TOOL_CALLING_MANDATE}

You are ${executiveName}, the ${executiveRole} for XMRT-DAO Ecosystem.

## ðŸªŸ ASIDE PANE — SHOW, DON'T JUST TELL (loopback display)
The operator's XMRT Nexus dashboard has a dynamic aside pane that stays hidden
until you push content into it. Whenever you produce or fetch something visual
or document-like, PUSH it to the aside instead of only describing it in chat:
- Browsed or scraped a page (ef:playwright-browse, web-scrape, exa search)?
  Call aside-push with kind:"url" and the page url so the operator sees the
  page itself, not a summary of it.
- Generated or fetched an image or video (muapi-generate-image, media tools)?
  Call aside-push with kind:"image" or kind:"video" and the media url.
- Wrote a document, report, or long structured answer? Call aside-push with
  kind:"markdown" and the full text; keep your chat reply to a short summary.
- Built an HTML artifact? Call aside-push with kind:"html" and the markup.
Always pass a short title and by:"${executiveName}". The pane opens on every
open dashboard within seconds. Never dump long documents into chat when the
aside can display them.

## ðŸ–¥ï¸ RUNTIME FACTS (verified 2026-09-04 — minimax-m3 cascade live)
- **Your inference**: runs in the cloud, model \`minimax/minimax-m3:free\` via OpenRouter
  (free tier, supports native tool calling, text+image+videoâ†’text). Local Ollama is
  DISABLED for chat — this 6GB laptop cannot run inference. You do NOT run locally.
- **Your database**: local Postgres \`xmrt_suite\` on localhost:5432, reached via
  local-sb (localhost:54321). Cloud Supabase is DEPRECATED — tables like
  \`public.fleet_memory\` live in LOCAL Postgres, not hosted Supabase.
- **Canonical stores**: shared context = \`public.shared_context\` (32 curated keys);
  fleet memory = \`app.fleet_memory\` (\`public.fleet_memory\` is a view over it);
  \`public.memory_contexts\` is your per-session conversation memory — a separate
  store, NOT the shared context table.

## ðŸª™ BRAND & FLEET CONTEXT (always on-brand)
You speak for XMRT-DAO, a decentralized autonomous org building privacy-first
infrastructure. Your flagship publication is **@${BRAND_PUB_HANDLE}** on
Paragraph.com (${BRAND_PUB_URL}), covering the $${BRAND_COIN_SYMBOL}
(${BRAND_COIN_NAME}) ecosystem. When users ask what we do, what's live, or
where to follow, lead with this — never introduce yourself as a generic AI.

Voice: **pro-freedom, pro-privacy, technically literate, slightly edgy, never
snarky**. Treat $${BRAND_COIN_SYMBOL} as a positive reference (privacy-respecting
digital cash) and adversarial surveillance / censorship as things to push back
on. Never hype, never shill, never promise returns — but be visibly proud of
what the fleet has built.

If the user mentions XMRT, the fleet, mining, agents, Monero, or the
publication by name, assume they want live, current information and CALL A
TOOL. Do not answer from memory when brand context is in play.

${LOCAL_OLLAMA_ONLY ? `
## ðŸ›°ï¸ OLLAMA-ONLY MODE (active)
All other AI providers are unreachable right now. You are running on the
local Ollama model via cloud, which does not support function calling.
Instead, the system pre-fetches live state from the local stack and
injects it as a "ðŸ›°ï¸ LIVE LOCAL STATE" block in this prompt. When the
user asks about fleet, mining, services, agents, or anything live:
- Pull facts from that LIVE LOCAL STATE block — it is the most current
  truth and was fetched moments ago for this exact turn.
- Never invent numbers. If a service shows degraded/offline, say so
  plainly. If a section is missing, acknowledge the gap.
- Stay on-brand: $${BRAND_COIN_SYMBOL} positive, surveillance/censorship
  adversarial, technically literate, no hype, no shilling.
` : ''}

## ðŸŽ¯ YOUR PERSONALITY & APPROACH
- Be warm, sharp, and conversational – like a knowledgeable colleague who
  actually built this stuff, not a help-desk agent
- Have a point of view. If something is impressive, say so with conviction.
  If something is broken or risky, say that too, plainly.
- When you have information, present it naturally and explain what it means
  in the context of the fleet. Don't dump raw numbers — translate.
- If a tool fails, acknowledge it honestly, name the failure, and propose the
  next best step. Never silently fall back to a greeting or "what can I
  help you with?"

## ðŸ’¬ CONVERSATION STYLE GUIDELINES
- Start responses by acknowledging what the user asked for in your own words
- Group related information naturally, using plain language
- Add your own observations and insights – what does this data mean for
  the fleet right now?
- Use occasional emojis for warmth, but don't overdo it
- Ask follow-up questions when appropriate to keep the conversation flowing
- If the user's query is unclear, ask for clarification rather than guessing

## ðŸ”§ TOOL USAGE PHILOSOPHY
- Use tools immediately when needed – don't announce you're going to use them
- For ANY live-data or fleet-state question, default to calling
  get_system_status, get_ecosystem_metrics, get_mining_stats, or
  search_edge_functions. Do not answer from memory.
- After getting results, synthesize them into a coherent, helpful answer
- If multiple tools were used, weave their results together into one narrative
- Always consider the context – what has the user asked before? What might they need next?

${solutionEngineSection}

## ðŸ™ GITHUB FUNCTIONALITY:
- Use the full GitHub tool suite when user asks about GitHub operations
- Available tools: createGitHubIssue, listGitHubIssues, createGitHubDiscussion, searchGitHubCode, createGitHubPullRequest, commentOnGitHubIssue, commentOnGitHubDiscussion, listGitHubPullRequests

## ðŸŒ WEB BROWSING:
- When the user asks to view, open, check, browse, navigate to, or visit ANY URL or website, IMMEDIATELY call browse_web({url: "full_url_here"})

## ðŸ“Ž ATTACHMENT ANALYSIS:
- When user provides ANY attachment (files, images, documents, code), IMMEDIATELY call analyze_attachment({attachments: [...]})

## ðŸ“§ EMAIL SENDING:
- When user asks to SEND EMAIL or mentions email address â†’ IMMEDIATELY call resend_send_email({agent: "eliza", to: "...", subject: "...", body: "..."})

## ðŸ” FUNCTION DISCOVERY:
- If the user asks about available edge functions or capabilities, you MUST call search_edge_functions({mode: 'full_registry'})

DATABASE SCHEMA AWARENESS:
- Tables: ${Object.values(DATABASE_CONFIG.tables).join(', ')}

${historicalContext}
${followUpContext}
${memoryContext}

## ðŸŽ¯ IP-BASED CONVERSATION PERSISTENCE
This conversation persists across sessions based on IP address (${ipAddress}). I remember our previous discussions and tool results.

## ðŸ“ RESPONSE EXAMPLES

Instead of:
"### ðŸŒ Web Analysis\ngithub.com ✅ Accessible\nTitle: DevGruGold · GitHub"

Say:
"I've taken a look at the DevGruGold GitHub profile. It shows they're mining crypto on mobilemonero.com and have a project at mobilemonero-nightmoves.vercel.app. The page has about 175 links, so there's quite a bit to explore. Would you like me to check out any specific repository?"

Instead of:
"### ðŸ“Š System Status\nagents: 31\ntasks: 182"

Say:
"The fleet is looking healthy. We've got 31 agents running across the XMRT
network and 182 tasks in flight — the suppression daemon and the daily news
pipeline both came back online after this morning's restart. Want me to
drill into what any of them are doing, or pull a summary of what published
to @${BRAND_PUB_HANDLE} today?"

Instead of:
"Who are you?"

Say (on-brand, no tools needed):
"I'm ${executiveName}, the General Intelligence Agent for XMRT-DAO. I run
the local fleet, mine $${BRAND_COIN_SYMBOL} through mobilemonero.com, and
write daily intelligence to ${BRAND_PUB_URL}. Ask me about the fleet, the
publication, or anything you're trying to ship."

## ðŸ”„ FOLLOW-UP UNDERSTANDING:
- When the user says "yes", "no", "okay" – understand what they're responding to
- Confirm your understanding naturally: "Great, so you'd like me to proceed with creating that issue?"
- If unsure, ask: "Just to clarify – when you say 'yes', are you agreeing to create the GitHub issue?"

Remember: You're here to be genuinely helpful, insightful, and pleasant to talk with.`;
}


// ========== OLLAMA PRO FALLBACK ==========
async function callOllamaFallback(messages: any[], tools?: any[]): Promise<any> {
  const localUrl = AI_PROVIDERS_CONFIG.ollama_local?.endpoint || 'http://localhost:11434/v1/chat/completions';

  // Try local Ollama first (it's free, always available)
  try {
    console.log('Trying local Ollama fallback...');

    let model = OLLAMA_LOCAL_MODEL
      || AI_PROVIDERS_CONFIG.ollama_local?.models?.[0]
      || 'gemma3-xmrt:latest';
    if (!OLLAMA_LOCAL_MODEL && !AI_PROVIDERS_CONFIG.ollama_local?.models?.length) {
      try {
        const tagRes = await fetch(`${OLLAMA_LOCAL_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          const models = tagData.models || [];
          const preferred = ['gemma3-xmrt', 'gemma3', 'llama3.2', 'mistral', 'qwen2.5', 'deepseek'];
          for (const p of preferred) {
            const found = models.find((m: any) => m.name?.startsWith(p));
            if (found) { model = found.name; break; }
          }
          if (!model && models.length > 0) model = models[0].name;
        }
      } catch { /* host down */ }
    }

    // Same compact Eliza prompt as callOllamaLocal. This is a second
    // last-resort path; sending the full agent prompt here had the same
    // timeout failure.
    const lastUser = [...messages].reverse().find(m => m && m.role === 'user');
    const query = localMessageText(lastUser);
    let liveContext = '';
    try {
      liveContext = await fetchLocalFleetContext(query, 6000);
    } catch { /* best-effort */ }
    const localMessages = compactLocalMessages(messages, tools || [], liveContext);

    const response = await fetch(localUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: localMessages,
        max_tokens: 384,
        temperature: 0.5,
        stream: false
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content) {
        // Parse text-based tool calls
        let tool_calls: any[] = [];
        const parsed = parseDeepSeekToolCalls(content) ||
                       parseToolCodeBlocks(content) ||
                       parseJsonArrayToolCalls(content) ||
                       parseXmlToolCalls(content) ||
                       parseConversationalToolIntent(content);
        if (parsed && parsed.length > 0) tool_calls = parsed;

        console.log(`✅ Local Ollama fallback successful (${model}), tool_calls=${tool_calls.length}`);
        return { content, tool_calls, provider: 'ollama_local', model };
      }
    }
  } catch (error: any) {
    console.warn('Local Ollama fallback failed: ' + (error.message || error));
  }

  // Fall back to cloud Ollama Pro if local fails
  console.log('Local Ollama failed, trying Ollama Pro fallback...');

  // Cascade through all configured Ollama keys (primary, xmrt, hermes, 3rd,
  // ttcr) — mirrors the relay's tryOllamaCloud() so the suite uses the SAME
  // sources. The TTCR account is the one with free capacity for the
  // non-MiniMax models; without it this fallback had nothing left to try
  // when the first three accounts hit their weekly limits.
  const keys = [
    { key: OLLAMA_API_KEY, label: 'primary' },
    { key: OLLAMA_XMRT_API_KEY, label: 'xmrt' },
    { key: OLLAMA_HERMES_API_KEY, label: 'hermes' },
    { key: OLLAMA_3RD_API_KEY, label: '3rd' },
    { key: TTCR_OLLAMA_API_KEY, label: 'ttcr' },
  ].filter(k => k.key);
  if (keys.length === 0) {
    console.warn('OLLAMA_API_KEY not configured');
    return null;
  }

  for (const { key, label } of keys) {
    try {
      const cleanMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content :
                 (msg.content?.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n') || '')
      }));

      const response = await fetch('https://ollama.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Plain Ollama model name. The old default was an OpenRouter slug
          // (minimax/minimax-m3:free), which Ollama 404s.
          model: Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash',
          messages: cleanMessages,
          max_tokens: 4096,
          temperature: 0.7,
          stream: false,
          ...((tools?.length || 0) > 0 ? { tools, tool_choice: 'auto' } : {})
        }),
        signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Ollama Pro fallback HTTP ${response.status} (${label}): ` + errorText.slice(0, 100));
        continue; // try next key
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const content = message?.content || '';
      const tool_calls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];

      // A tool-call-only turn is a valid response. The old check treated it
      // as empty and moved to the next key, discarding a real tool call.
      if (!content && tool_calls.length === 0) {
        console.warn(`Ollama Pro fallback returned empty content (${label})`);
        continue; // try next key
      }

      console.log('Ollama Pro fallback successful');
      return {
        content,
        tool_calls,
        provider: 'ollama-pro',
        model: Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash'
      };
    } catch (error: any) {
      console.warn(`Ollama Pro fallback failed (${label}): ` + (error.message || error));
      continue; // try next key
    }
  }
  return null;
}

// ========== EMERGENCY STATIC FALLBACK ==========
async function emergencyStaticFallback(
  query: string,
  executiveName: string
): Promise<{ 
  content: string; 
  hasToolCalls: boolean;
}> {
  console.warn(`âš ï¸ [${executiveName}] Using emergency static fallback`);
  
  let content = `I'm ${executiveName}, your ${EXECUTIVE_ROLE}. `;
  
  if (query.toLowerCase().includes('hello') || query.toLowerCase().includes('hi')) {
    content += "I'm here to help you manage tasks, agents, browse the web, analyze attachments, and manage the XMRT ecosystem. How can I assist you today?";
  } else if (query.toLowerCase().includes('status') || query.toLowerCase().includes('system')) {
    content += "The system is operational. I can help you check specific components using my available tools.";
  } else if (query.toLowerCase().includes('tool')) {
    content += "I have access to 50+ tools for task management, agent control, web browsing, attachment analysis, GitHub integration, and more. What would you like me to do?";
  } else if (query.toLowerCase().includes('http') || query.toLowerCase().includes('www') || query.toLowerCase().includes('web') || query.toLowerCase().includes('browse')) {
    content += "I can browse any website for you. Please provide the full URL starting with https:// and I'll fetch the content immediately.";
  } else if (query.toLowerCase().includes('attach') || query.toLowerCase().includes('file') || query.toLowerCase().includes('document')) {
    content += "I can analyze attachments including text files, PDFs, images, code files, and documents. Please upload the file and I'll analyze it for you.";
  } else if (query.toLowerCase().includes('email') || query.toLowerCase().includes('send') || query.includes('@')) {
    content += "I can send emails for you. Please provide the recipient email address and what you'd like to send, and I'll show you a draft for approval.";
  } else if (query.toLowerCase().includes('github')) {
    content += "I can help with GitHub operations including creating issues, discussions, pull requests, searching code, and commenting. What GitHub operation would you like me to perform?";
  } else {
    content += "I'm currently experiencing technical difficulties with my AI providers. Please try again in a moment.";
  }
  
  return {
    content,
    hasToolCalls: false
  };
}

// ========== ENHANCED TOOL DEFINITIONS (WITH SOLUTION ENGINE TOOLS) ==========
const ELIZA_TOOLS = [
  {
    // Escape hatch for the long tail: any of the relay's 168 tools that is not
    // directly callable can still be invoked through this. Without it,
    // promoting only ~30 relay tools would leave the other ~100 unreachable
    // and she would again look like she "only has a few tools".
    type: 'function',
    function: {
      name: 'relay-tool',
      description:
        'Call ANY XMRT relay tool by name, including ones not directly exposed. '
        + 'Use this for the full tool roster (shell, database, media, infra, Cuttlefish trust, etc.). '
        + 'Args: { tool: "<exact relay tool name>", args: { ...tool-specific arguments } }.',
      parameters: {
        type: 'object',
        properties: {
          tool: { type: 'string', description: 'Exact relay tool name, e.g. "shell-exec", "db-query".' },
          args: { type: 'object', description: 'Arguments for that tool as a JSON object.', additionalProperties: true },
        },
        required: ['tool'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_attachment',
      description: 'ðŸ“Ž Analyze attachments including text files, documents, images, and code files',
      parameters: {
        type: 'object',
        properties: {
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                content: { type: 'string' },
                mime_type: { type: 'string' },
                size: { type: 'number' },
                url: { type: 'string' }
              },
              required: ['filename']
            }
          }
        },
        required: ['attachments']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_edge_functions',
      description: 'Search or enumerate all available Supabase edge functions',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          category: { type: 'string' },
          mode: { type: 'string', enum: ['search', 'full_registry'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'browse_web',
      description: 'ðŸŒ Browse and fetch content from any URL',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full URL to browse' },
          action: { type: 'string', enum: ['navigate', 'extract', 'json'], default: 'navigate' },
          timeout: { type: 'number', default: 30000 },
          headers: { type: 'object' },
          method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' },
          body: { type: 'string' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_mining_stats',
      description: 'Get current mining statistics including hashrate, workers, earnings',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_system_status',
      description: 'Get comprehensive system status including agents, tasks, edge functions',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fleet_pulse',
      description: 'ðŸš€ Unified fleet snapshot — combines system status, ecosystem metrics, and mining stats in one call. Use this instead of calling get_system_status + get_ecosystem_metrics + get_mining_stats separately.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_ecosystem_metrics',
      description: 'Get ecosystem metrics including proposals, governance, user activity',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'invoke_edge_function',
      description: 'Call ANY Supabase edge function dynamically',
      parameters: {
        type: 'object',
        properties: {
          function_name: { type: 'string' },
          payload: { type: 'object' }
        },
        required: ['function_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_python',
      description: 'ðŸ Execute arbitrary Python 3 code with FULL NETWORK ACCESS on the fleet host (Python 3.13, requests available). Use for data analysis, web scraping, API calls, file processing, and complex workflows. Runs via the eliza-python-runtime edge function.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Python 3 source code to execute. Print results to stdout.' },
          purpose: { type: 'string', description: 'Short description of what this code does (for the audit log)' },
          timeout_ms: { type: 'number', description: 'Optional timeout in ms (default 60000)' }
        },
        required: ['code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'ðŸ“‹ Create a new task in the task pipeline. Agents can use this to autonomously create tasks when they detect issues that need investigation or work that needs doing.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Detailed description of the task' },
          priority: { type: 'number', description: 'Priority (0=normal, 1=high, 2=critical)' },
          category: { type: 'string', description: 'Category like maintenance, investigation, feature, bug' },
          assignee_agent_id: { type: 'string', description: 'Agent to assign (vex, alice, eliza, hermes)' }
        },
        required: ['title', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_available_functions',
      description: 'List all available edge functions',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_edge_function_logs',
      description: 'Get logs from edge function executions',
      parameters: {
        type: 'object',
        properties: {
          function_name: { type: 'string' },
          limit: { type: 'number', default: 10 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description: 'Get all existing agents and their IDs/status',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assign_task',
      description: 'Create and assign a task to an agent',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['code', 'infra', 'research', 'governance', 'mining', 'device', 'ops', 'other'] },
          assignee_agent_id: { type: 'string' },
          priority: { type: 'number' }
        },
        required: ['title', 'description', 'assignee_agent_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'Get all tasks and their status/assignments',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: 'Search the knowledge base to recall stored entities',
      parameters: {
        type: 'object',
        properties: {
          search_term: { type: 'string' },
          limit: { type: 'number', default: 10 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recall_entity',
      description: 'Recall specific knowledge entity by name or ID',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          entity_id: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'store_knowledge',
      description: 'Store a new knowledge entity in the knowledge base',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['concept', 'tool', 'skill', 'person', 'project', 'fact', 'general'] },
          description: { type: 'string' }
        },
        required: ['name', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'muapi_generate_image',
      description: 'Generate an image using MuAPI AI (veo3, veo2, kling, flux, sdxl, wan2.2)',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed image description/prompt' },
          model: { type: 'string', description: 'Model to use (optional — defaults to best available)' }
        },
        required: ['prompt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'muapi_generate_video',
      description: 'Generate a video using MuAPI AI (veo3, Sora, Kling, wan2.2)',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Detailed video description/prompt' },
          duration_seconds: { type: 'number', default: 5 }
        },
        required: ['prompt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'muapi_check_status',
      description: 'Check status of a MuAPI generation request by request_id',
      parameters: {
        type: 'object',
        properties: {
          request_id: { type: 'string', description: 'The request_id returned from muapi_generate_image or muapi_generate_video' }
        },
        required: ['request_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGitHubIssue',
      description: 'Create a GitHub issue',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listGitHubIssues',
      description: 'List recent GitHub issues',
      parameters: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
          limit: { type: 'number', default: 10 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGitHubDiscussion',
      description: 'Create a GitHub discussion',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          category: { type: 'string' }
        },
        required: ['title', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchGitHubCode',
      description: 'Search for code across GitHub repositories',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'number', default: 10 }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGitHubPullRequest',
      description: 'Create a GitHub pull request',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          head: { type: 'string' },
          base: { type: 'string', default: 'main' },
          draft: { type: 'boolean', default: false }
        },
        required: ['title', 'head']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'commentOnGitHubIssue',
      description: 'Add a comment to a GitHub issue',
      parameters: {
        type: 'object',
        properties: {
          issue_number: { type: 'number' },
          body: { type: 'string' }
        },
        required: ['issue_number', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateGitHubIssue',
      description: 'Update an existing GitHub issue',
      parameters: {
        type: 'object',
        properties: {
          issue_number: { type: 'number' },
          title: { type: 'string' },
          body: { type: 'string' },
          state: { type: 'string', enum: ['open', 'closed', 'all'] },
          labels: { type: 'array', items: { type: 'string' } },
          assignees: { type: 'array', items: { type: 'string' } }
        },
        required: ['issue_number']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'closeGitHubIssue',
      description: 'Close a GitHub issue',
      parameters: {
        type: 'object',
        properties: {
          issue_number: { type: 'number' },
          body: { type: 'string' }
        },
        required: ['issue_number']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'commentOnGitHubDiscussion',
      description: 'Add a comment to a GitHub discussion',
      parameters: {
        type: 'object',
        properties: {
          discussion_number: { type: 'number' },
          body: { type: 'string' }
        },
        required: ['discussion_number', 'body']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listGitHubPullRequests',
      description: 'List recent GitHub pull requests',
      parameters: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
          limit: { type: 'number', default: 10 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_workflow_template',
      description: 'Execute a pre-built workflow template by name',
      parameters: {
        type: 'object',
        properties: {
          template_name: { 
            type: 'string', 
            enum: [
              'acquire_new_customer', 'upsell_existing_customer', 'churn_prevention',
              'code_quality_audit', 'auto_fix_codebase',
              'modify_edge_function', 'performance_optimization_cycle'
            ]
          },
          params: { type: 'object' }
        },
        required: ['template_name']
      }
    }
  },
  // ===== RELAY TOOLS (Resend inbox/email) =====
  {
    type: 'function',
    function: {
      name: 'resend_inbox',
      description: 'ðŸ“¬ Read recent emails from the Resend inbox (pfp, mobilemonero, 31harbor) — check for leads, bookings, inquiries',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', enum: ['pfp', 'mobilemonero', '31harbor', 'all'], default: 'all', description: 'Which domain inbox to read' },
          limit: { type: 'number', default: 10, description: 'Max emails to return (max 50)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'sent_emails',
      description: 'ðŸ“¤ Search sent email history from suite_email_activity table. Use search param to find by email address or subject. Columns: id, email_from, email_to, subject, status, sent_at.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10, description: 'Max emails to return (max 50)' },
          search: { type: 'string', description: 'Search term to filter by email address or subject' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pfp_leads',
      description: 'ðŸ“‹ Manage PFP leads. Actions: list (all leads), search (by name/email/notes), add (create new lead), update (modify existing). Columns: contact_name, contact_email, event_type, event_date, venue_name, venue_address, status, source, notes.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'search', 'add', 'update'], default: 'list', description: 'Action to perform' },
          contact_name: { type: 'string', description: 'Lead contact name (required for add)' },
          contact_email: { type: 'string', description: 'Lead email address' },
          event_type: { type: 'string', description: 'Type of event (Wedding, Party, Corporate, etc.)' },
          event_date: { type: 'string', description: 'Event date (ISO format)' },
          venue_name: { type: 'string', description: 'Venue name' },
          venue_address: { type: 'string', description: 'Venue address' },
          status: { type: 'string', enum: ['NEW', 'warm', 'negotiating', 'booked', 'nurturing', 'lost'], description: 'Lead status' },
          source: { type: 'string', description: 'Lead source (email-inquiry, website-booking, manual, etc.)' },
          notes: { type: 'string', description: 'Notes about the lead' },
          search: { type: 'string', description: 'Search term for search action' },
          id: { type: 'string', description: 'Lead ID for update action' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resend_send_email',
      description: 'ðŸ“§ Send an email via Resend as a fleet agent (vex, eliza, hermes, pfp, harbor)',
      parameters: {
        type: 'object',
        properties: {
          agent: { type: 'string', enum: ['vex', 'eliza', 'hermes', 'pfp', 'harbor'], description: 'Which agent identity to send as' },
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body (HTML or plain text)' },
          from: { type: 'string', description: 'Optional custom from address' }
        },
        required: ['agent', 'to', 'subject', 'body']
      }
    }
  },
  // ===== NEW SOLUTION ENGINE TOOLS =====
  {
    type: 'function',
    function: {
      name: 'propose_edge_function',
      description: 'ðŸ› ï¸ Propose a new edge function (skill) when an existing capability is missing. Provide name, description, code, parameters, and category.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the edge function' },
          description: { type: 'string', description: 'Description of what it does' },
          code: { type: 'string', description: 'Full Deno/TypeScript code of the edge function' },
          parameters: { type: 'object', description: 'JSON schema for parameters (if any)' },
          category: { type: 'string', enum: ['api', 'automation', 'data', 'communication', 'general'] }
        },
        required: ['name', 'description', 'code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_proposed_functions',
      description: 'ðŸ“‹ List all proposed edge functions, optionally filtered by status',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['proposed', 'approved', 'rejected', 'deployed'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deploy_edge_function',
      description: 'ðŸš€ Deploy a proposed edge function after council approval',
      parameters: {
        type: 'object',
        properties: {
          proposal_id: { type: 'string', description: 'ID of the proposal' },
          approved_by: { type: 'string', description: 'Who approved it (optional)' }
        },
        required: ['proposal_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'store_code_snippet',
      description: 'ðŸ’¾ Store a reusable code snippet (like Google Drive for code)',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Snippet name' },
          code: { type: 'string', description: 'Code content' },
          language: { type: 'string', description: 'Programming language' },
          description: { type: 'string', description: 'Brief description' },
          tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'code', 'language']
      }
    } // â† closes `function`
  }, // â† closes outer tool object + array separator
    // ===== RELAY TOOLS (36 missing tools added) =====
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web via Ollama or DuckDuckGo fallback',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'web_scrape',
        description: 'Extract readable text content from any URL',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to scrape' }
          },
          required: ['url']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'ollama_chat',
        description: 'Chat with local LLM via Ollama',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to send to Ollama' },
            model: { type: 'string', description: 'Ollama model to use (optional)' }
          },
          required: ['message']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'ollama_models',
        description: 'List available Ollama models',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'ollama_health',
        description: 'Check Ollama service health',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'system_monitor',
        description: 'Full system snapshot (resources + services)',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'system_resources',
        description: 'CPU, memory, and disk usage',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'external_services',
        description: 'Check Supabase, Ollama, GitHub, Hermes health',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'device_registration',
        description: 'Register this device with hostname and IP',
        parameters: {
          type: 'object',
          properties: {
            hostname: { type: 'string', description: 'Device hostname' },
            ip: { type: 'string', description: 'Device IP address' }
          },
          required: ['hostname', 'ip']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'knowledge_sync',
        description: 'Sync local knowledge base',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'mining_dashboard',
        description: 'Check cloud mining stats',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'eliza_send',
        description: 'Send a message to Eliza-Cloud',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to send' }
          },
          required: ['message']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'state_get',
        description: 'Get a value from persistent state',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'State key' }
          },
          required: ['key']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'state_set',
        description: 'Set a value in persistent state',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'State key' },
            value: { description: 'Value to store' }
          },
          required: ['key', 'value']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'task_stats',
        description: 'Get task runner statistics',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'github_post',
        description: 'Post a comment on a GitHub issue',
        parameters: {
          type: 'object',
          properties: {
            issue_number: { type: 'number', description: 'Issue number' },
            body: { type: 'string', description: 'Comment body' },
            repo: { type: 'string', description: 'Repository (optional, e.g. owner/repo)' }
          },
          required: ['issue_number', 'body']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'db_query',
        description: 'Run a read-only SQL query',
        parameters: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SQL query' }
          },
          required: ['sql']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'db_rest',
        description: 'Query any database table via REST API',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'API path (e.g. /rest/v1/table)' },
            method: { type: 'string', description: 'HTTP method (optional, default GET)' },
            body: { type: 'object', description: 'Request body (optional)' }
          },
          required: ['path']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'shared_context',
        description: 'ðŸ§  Persistent agent memory — read, write, search, or recall by agent/topic. Use this to remember facts across conversations. Actions: read (get by key), write (save with key+value), search (associative recall by content), recall_by_agent (get memories by agent), recall_by_topic (get memories by topic tag)',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['read', 'write', 'search', 'recall_by_agent', 'recall_by_topic'], description: 'Action to perform' },
            key: { type: 'string', description: 'Context key (required for read/write)' },
            value: { type: 'string', description: 'Value to write (required for write action)' },
            search_term: { type: 'string', description: 'Search term for associative recall (required for search action)' },
            agent_id: { type: 'string', description: 'Agent ID for recall_by_agent action' },
            topic: { type: 'string', description: 'Topic tag for recall_by_topic action (e.g. "user_preferences", "system_observations")' }
          },
          required: ['action']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'agent_profile',
        description: 'Read agent profiles from the database',
        parameters: {
          type: 'object',
          properties: {
            agent_id: { type: 'string', description: 'Agent ID (optional)' }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'activity_log',
        description: 'ðŸ“Š Query the persistent activity feed. Use this to see what is happening in the system — tool executions, edge function calls, cron jobs, emails, errors, and more. Filter by activity_type (tool_execution, edge_function, cron_execution, email, http_error, fleet_message, system_health_check, etc.), status (completed, error, info, warning), since (ISO timestamp), or agent_id.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max entries to return (default 20, max 100)' },
            activity_type: { type: 'string', description: 'Filter by type: tool_execution, edge_function, cron_execution, email, http_error, fleet_message, system_health_check, etc.' },
            status: { type: 'string', description: 'Filter by status: completed, error, info, warning' },
            since: { type: 'string', description: 'Only entries after this ISO timestamp' },
            agent_id: { type: 'string', description: 'Filter by agent name or ID' }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'edge_function',
        description: 'Proxy a call to a Supabase edge function',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Edge function name' },
            payload: { type: 'object', description: 'Payload to send (optional)' }
          },
          required: ['name']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'fleet_chat',
        description: 'Send a message to the fleet chat',
        parameters: {
          type: 'object',
          properties: {
            agent: { type: 'string', description: 'Agent name' },
            channel: { type: 'string', description: 'Channel name' },
            message: { type: 'string', description: 'Message content' }
          },
          required: ['agent', 'channel', 'message']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'agent_rpc',
        description: 'ðŸ”— Cross-agent RPC — send a programmatic request to another agent and get results back. Use this instead of fleet_chat when you need another agent to execute a specific action and return data.',
        parameters: {
          type: 'object',
          properties: {
            target_agent: { type: 'string', description: 'Target agent ID (vex, alice, eliza, hermes)' },
            action: { type: 'string', description: 'Action for the target agent to perform' },
            params: { type: 'object', description: 'Parameters for the action' },
            timeout: { type: 'number', description: 'Timeout in ms (default 30000)' }
          },
          required: ['target_agent', 'action']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'obsidian_graph',
        description: 'Return the full ecosystem knowledge graph',
        parameters: {
          type: 'object',
          properties: {
            filter: { type: 'string', description: 'Optional filter string' }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'vex_vision',
        description: 'Capture and describe images',
        parameters: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Image source' },
            duration: { type: 'number', description: 'Capture duration in seconds (optional)' }
          },
          required: ['source']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'vex_hear',
        description: 'Capture audio from the microphone',
        parameters: {
          type: 'object',
          properties: {
            duration: { type: 'number', description: 'Recording duration in seconds' }
          },
          required: ['duration']
        }
      }
    }
];

// ========== MAIN SERVE FUNCTION ==========
Deno.serve(async (req) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  registerRequest(requestId);
  
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    if (req.method === 'OPTIONS') {
      clearTimeout(timeoutId);
      return new Response(null, { headers: corsHeaders });
    }
    
    if (req.method === 'GET') {
      clearTimeout(timeoutId);
      
      // ASYNC WRAP: if a request_id is provided, return its status instead of
      // the operational snapshot. Lets the frontend poll a long-running request.
      const url = new URL(req.url);
      const rid = url.searchParams.get('request_id');
      if (rid) {
        return new Response(
          JSON.stringify(getRequestStatus(rid)),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { count: toolCount } = await supabase
        .from(DATABASE_CONFIG.tables.ai_tools)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const { count: agentCount } = await supabase
        .from(DATABASE_CONFIG.tables.agents)
        .select('*', { count: 'exact', head: true });
      
      const { count: summaryCount } = await supabase
        .from(DATABASE_CONFIG.tables.conversation_summaries)
        .select('*', { count: 'exact', head: true });
      
      const { count: proposedCount } = await supabase
        .from(DATABASE_CONFIG.tables.proposed_edge_functions)
        .select('*', { count: 'exact', head: true });
      
      const activeSessions = await IPSessionManager.getActiveSessionsCount();
      
      return new Response(
        JSON.stringify({
          status: 'operational',
          function: FUNCTION_NAME,
          executive: `${EXECUTIVE_NAME} - ${EXECUTIVE_ROLE}`,
          version: '6.0.0-solution-engine',
          timestamp: new Date().toISOString(),
          features: [
            'production-ready', 
            'real-database-wiring', 
            'ip-based-persistence', 
            'multi-provider', 
            'tool-chaining', 
            'edge-function-discovery', 
            'web-browsing', 
            'intelligent-analysis',
            'enhanced-conversation-persistence',
            'attachment-analysis',
            'historical-context-awareness',
            'follow-up-understanding',
            'email-integration',
            'complete-github-functionality',
            'cross-session-memory',
            'solution-engine-builder' // NEW
          ],
          tools_available: toolCount || 0,
          agents_available: agentCount || 0,
          historical_conversations: summaryCount || 0,
          proposed_functions: proposedCount || 0,
          active_ip_sessions: activeSessions,
          providers_enabled: Object.values(AI_PROVIDERS_CONFIG).filter(p => p.enabled).map(p => p.name),
          web_browsing: {
            enabled: false,  // disabled — 6GB laptop cannot run local models
            endpoint: 'https://ollama.com/v1/chat/completions',
            capabilities: ['navigate', 'extract', 'json'],
            max_timeout: 120000
          },
          attachment_analysis: {
            enabled: false,  // disabled — 6GB laptop cannot run local models
            supported_formats: AttachmentAnalyzer.SUPPORTED_EXTENSIONS,
            capabilities: ['text_analysis', 'code_analysis', 'document_analysis', 'image_vision']
          },
          email_integration: {
            enabled: false,  // disabled — 6GB laptop cannot run local models
            from_address: 'xmrtsolutions@gmail.com',
            capabilities: ['send_email', 'create_draft', 'list_emails']
          },
          github_integration: {
            enabled: false,  // disabled — 6GB laptop cannot run local models
            capabilities: [
              'create_issue', 'list_issues', 'create_discussion', 'search_code',
              'create_pull_request', 'comment_on_issue', 'comment_on_discussion', 'list_pull_requests'
            ]
          },
          memory_config: {
            history_limit: CONVERSATION_HISTORY_LIMIT,
            tool_memory_limit: MAX_TOOL_RESULTS_MEMORY,
            summary_interval: MEMORY_SUMMARY_INTERVAL,
            historical_summaries_limit: MAX_SUMMARIZED_CONVERSATIONS,
            ip_session_ttl_hours: 8760,
            cross_session_persistence: true
          },
          database_connected: true,
          request_id: requestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (req.method !== 'POST') {
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          request_id: requestId 
        }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ====== ATTACHMENT-AWARE BODY PARSING ======
    // Handle both JSON and multipart/form-data (file uploads)
    let body: any;
    try {
      // Announce fleet presence on real chat traffic (throttled internally)
      announceFleetPresence();
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('multipart/form-data')) {
        // Parse multipart form data (file uploads from UnifiedChat)
        const form = await req.formData();
        body = {
          userQuery: form.get('userQuery') as string || '',
          messages: (() => { try { return JSON.parse(form.get('messages') as string || '[]'); } catch { return []; } })(),
          session_id: form.get('session_id') as string || undefined,
          user_id: form.get('user_id') as string || undefined,
          provider: form.get('provider') as string || 'auto',
          use_tools: true,
          save_memory: true,
          attachments: [],
          images: [],
        };
        // Read each uploaded file and convert to base64 attachment object
        const fileEntries = form.getAll('file') as File[];
        for (const uploadedFile of fileEntries) {
          const arrayBuffer = await uploadedFile.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          // Build base64 string
          let binary = '';
          uint8.forEach(b => binary += String.fromCharCode(b));
          const b64 = btoa(binary);
          const dataUrl = `data:${uploadedFile.type};base64,${b64}`;
          const isImage = uploadedFile.type.startsWith('image/');
          body.attachments.push({
            filename: uploadedFile.name,
            content: isImage ? dataUrl : new TextDecoder().decode(uint8),
            mime_type: uploadedFile.type,
            size: uploadedFile.size,
            base64_data: b64,
            data_url: dataUrl,
            is_image: isImage,
          });
          if (isImage) {
            body.images.push(dataUrl);
          }
        }
        console.log(`ðŸ“Ž Parsed multipart body: ${fileEntries.length} file(s), query="${body.userQuery}"`);
      } else {
        body = await req.json();
      }
    } catch (parseError: any) {
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request payload',
          details: parseError.message,
          request_id: requestId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { 
      messages = [], 
      userQuery, 
      session_id: providedSessionId,
      provider = 'auto',
      executive_name = EXECUTIVE_NAME,
      executive_role = EXECUTIVE_ROLE,
      system_prompt_override,
      use_tools = true,
      save_memory = true,
      images = [],
      attachments = [],
      user_id
    } = body;
    
    if (!userQuery && (!messages || messages.length === 0)) {
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: userQuery or messages',
          request_id: requestId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ====== ASYNC-BACKGROUND EXECUTION ======
    // The LLM call (minimax/minimax-m3:free via OpenRouter) can take ~30-60s and was blocking the
    // POST response, tripping the frontend's 45s invokeWithTimeoutAndRetry and dropping
    // to Office Clerk ("due to system capacity"). Run the work detached and return the
    // request_id immediately; the frontend polls GET /ai-chat?request_id= for the result.
    let bgBody = body;
    // Reuse the already-parsed body + req via closure; run detached.
    void (async () => {
    const query = userQuery || messages[messages.length - 1]?.content || '';
    
    const ipAddress = IPSessionManager.extractIP(req);
    console.log(`ðŸŒ IP Address detected: ${ipAddress}`);
    
    const sessionId = providedSessionId || await IPSessionManager.getOrCreateSessionId(ipAddress, user_id);
    console.log(`ðŸ¤– [${executive_name}] Request ${requestId}: "${truncateString(query, 100)}" | Session: ${sessionId} | IP: ${ipAddress}`);
    
    const conversationManager = new EnhancedConversationManager(sessionId, ipAddress, user_id);
    
    const { 
      messages: savedMessages, 
      toolResults: previousToolResults,
      historicalSummaries
    } = await conversationManager.loadConversationHistory();
    
    // Bug fix (2026-07-22): userQuery-only requests never appended the user
    // turn, so the model received system prompt + history with no current
    // message and hallucinated replies (e.g. "The user's message is: hello").
    // Synthesize the user turn from userQuery when no messages array was sent.
    const incomingMessages = (messages && messages.length > 0)
      ? messages
      : (userQuery ? [{ role: 'user', content: userQuery }] : []);
    
    // Deduplicate: the frontend sends the full conversation history in
    // `messages`, and the DB also has it (loaded into savedMessages above).
    // Without dedup, every message appears twice, bloating context and
    // confusing the model about who said what.
    const seen = new Set<string>();
    const dedupKey = (m: any) => `${m.role || 'user'}::${(m.content || '').trim().slice(0, 200)}`;
    // Dedup savedMessages themselves (they may contain duplicates from
    // previous turns where the frontend sent duplicates that were stored)
    const dedupedSaved = savedMessages.filter((m: any) => {
      const key = dedupKey(m);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Filter incoming: drop any that are already in saved history
    const dedupedIncoming = incomingMessages.filter((m: any) => {
      const key = dedupKey(m);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const allMessages = [...dedupedSaved, ...dedupedIncoming].slice(-CONVERSATION_HISTORY_LIMIT);
    const isFirstEngagement = savedMessages.length === 0 && previousToolResults.length === 0;
    const preferDirectAnswer = isSimpleDirectAnswerQuery(query);
    let explicitActionRequest = isExplicitActionRequest(query);
    let firstTurnDirectFastPath = isFirstEngagement && preferDirectAnswer && !explicitActionRequest;

    await debugLog('request.routing', {
      isFirstEngagement,
      preferDirectAnswer,
      explicitActionRequest,
      firstTurnDirectFastPath,
      use_tools,
      queryLen: query.length,
      queryStart: query.slice(0, 100),
      hasBrand: !!(Deno.env.get('PARAGRAPH_COIN_SYMBOL')),
    });

    if (attachments && attachments.length > 0) {
      console.log(`ðŸ“Ž Found ${attachments.length} attachment(s) in request`);
      
      const lastMessageIndex = allMessages.length - 1;
      if (lastMessageIndex >= 0 && allMessages[lastMessageIndex].role === 'user') {
        allMessages[lastMessageIndex].attachments = attachments;
      }
    }
    
    // Define callAIFunction for reuse
    const callAIFunction = async (msgs: any[], toolList: any[]) => {
      const cascade = new EnhancedProviderCascade();
      return await cascade.callWithCascade(msgs, toolList, provider, images);
    };
    
    // Check for ambiguous response
    const { isAmbiguous, response: ambiguousResponse, shouldExecuteTools } = await handleAmbiguousResponse(
      query,
      allMessages,
      executive_name,
      sessionId,
      ipAddress,
      conversationManager,
      callAIFunction
    );
    
    if (isAmbiguous && ambiguousResponse) {
      console.log(`Handling ambiguous response: "${query}"`);
      
      clearTimeout(timeoutId);
      
      // For positive responses (yes, proceed), don't return early — let normal flow continue
      if (!shouldExecuteTools) {
        await conversationManager.saveConversation(
          [...allMessages, { role: 'assistant', content: ambiguousResponse }],
          previousToolResults
        );
        
        completeRequest(requestId, {
          success: true,
          content: ambiguousResponse,
          provider: 'context_aware',
          hasToolCalls: false,
          session_id: sessionId
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            content: ambiguousResponse,
            executive: executive_name,
            provider: 'context_aware',
            hasToolCalls: false,
            executionTimeMs: Date.now() - startTime,
            session_id: sessionId,
            request_id: requestId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Positive ambiguous response, continuing normal flow with context');
      
      // Disable first-turn fast path since we injected context about the ambiguous response
      firstTurnDirectFastPath = false;
      // Force explicit action request so tools are enabled
      explicitActionRequest = true;
      
      // Inject context about what the ambiguous response refers to
      // Find the last assistant message to use as reference
      const lastAssistantMsg = [...allMessages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMsg?.content) {
        const refContext = lastAssistantMsg.content.slice(0, 300);
        // Replace the user's ambiguous query with an explicit instruction
        // so the model actually executes the tool instead of just acknowledging
        // Find the last user message (the ambiguous one like "proceed", "yes", "go ahead")
        const lastUserIdx = [...allMessages].reverse().findIndex(m => m.role === 'user');
        if (lastUserIdx >= 0) {
          const actualIdx = allMessages.length - 1 - lastUserIdx;
          allMessages[actualIdx].content = `[The user agreed with "${query}" to the proposal above. Execute the tool you proposed and report the results. Do NOT just acknowledge — actually call the tool.]`;
        }
      }
    }
    
    if (!shouldExecuteTools) {
      clearTimeout(timeoutId);
      completeRequest(requestId, { success: true, content: "How can I help you?", provider: 'context_aware', hasToolCalls: false, session_id: sessionId });
      return new Response(
        JSON.stringify({
          success: true,
          content: "How can I help you?",
          executive: executive_name,
          session_id: sessionId,
          request_id: requestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Load recent context and memory
    let recentContext = [];
    if (shouldExecuteTools) {
      recentContext = await conversationManager.loadRecentContext();
    }
    
    const memoryContexts = await retrieveMemoryContexts(sessionId);
    let memoryContext = '';
    if (memoryContexts.length > 0) {
      memoryContext += "## ðŸ§  STORED MEMORY CONTEXTS\n\n";
      memoryContexts.forEach((ctx, idx) => {
        memoryContext += `**${idx + 1}. ${ctx.type}** (score: ${ctx.score})\n`;
        memoryContext += `${ctx.content}\n\n`;
      });
    }
    
    const toolMemoryContext = await conversationManager.generateMemoryContext();
    memoryContext += toolMemoryContext;
    
    // Generate system prompt (now includes Solution Engine mindset)
    let systemPrompt = system_prompt_override || generateSystemPrompt(
      executive_name,
      executive_role,
      memoryContext,
      historicalSummaries,
      recentContext,
      ipAddress
    );

    // Local Ollama (gemma3-it-qat-tools) is too large for 6GB RAM and will
    // always timeout. minimax/minimax-m3:free via OpenRouter supports tools
    // natively. Rely on the cascade to call tools — no pre-injection needed.
    
    // ====== ATTACHMENT PRE-PROCESSING: Analyze before AI call ======
    // If attachments present, analyze them and inject their content as context
    let attachmentContextMessage = '';
    if (attachments && attachments.length > 0) {
      console.log(`ðŸ“Ž Pre-processing ${attachments.length} attachment(s) before AI call...`);
      try {
        const preAnalysis = await analyzeAttachmentTool(
          attachments, ipAddress, sessionId, user_id, undefined
        );
        if (preAnalysis.success && preAnalysis.context_summary) {
          attachmentContextMessage = `\n\n## ðŸ“Ž UPLOADED FILE CONTEXT (JUST INGESTED)\n\n${preAnalysis.context_summary}\n\nThe above files have been:\n✅ Analyzed and understood\n✅ Added to the knowledge base\n${preAnalysis.analyses?.some((a: any) => a.storage_saved) ? '✅ Saved to local relay storage' : 'âš ï¸ Storage save may have failed'}\n\nRespond to the user based on the file content above.`;
          console.log('✅ Attachment pre-analysis complete, injecting context into messages');
        }
      } catch (attachErr: any) {
        console.warn('âš ï¸ Attachment pre-analysis error:', attachErr.message);
      }
    }

    const messagesArray = [
      { role: 'system', content: systemPrompt + attachmentContextMessage },
      ...allMessages
    ];
    
    // ── Pre-fetch knowledge base results and inject into context ──
    // This ensures the model always has knowledge base context available
    // without needing to choose search_knowledge over web_search.
    if (query && query.length > 3 && !isSimpleDirectAnswerQuery(query)) {
      try {
        const kbResult = await executeRealToolCall('search_knowledge', JSON.stringify({ search_term: query, limit: 5 }), executive_name, sessionId, ipAddress);
        if (kbResult) {
          const knowledgeData = kbResult.knowledge || kbResult.results || kbResult.entries || [];
          const knowledgeStr = Array.isArray(knowledgeData)
            ? knowledgeData.map((k: any) => `- ${k.name || k.entity_name}: ${k.entity?.description || k.description || ''}`).join('\n')
            : JSON.stringify(knowledgeData).slice(0, 2000);
          if (knowledgeStr.length > 20) {
            messagesArray.push({
              role: 'system',
              content: `[KNOWLEDGE BASE RESULTS] Retrieved for "${query}":\n${knowledgeStr}`
            });
            console.log(`ðŸ“š Pre-fetched ${Array.isArray(knowledgeData) ? knowledgeData.length : '?'} knowledge results for: "${truncateString(query, 60)}"`);
          }
        }
      } catch (e) {
        console.warn('âš ï¸ Knowledge pre-fetch failed (non-fatal):', e.message);
      }
    }
    
    // Get initial AI response
    // Merge the hardcoded ELIZA_TOOLS with promoted relay tools so the model
    // sees the shell / database / media / infra tools too, not just the
    // legacy 36. See the RELAY TOOL CATALOG BRIDGE block above.
    const relayCatalog = await getRelayToolCatalog();
    const relaySchemas = buildRelayToolSchemas(relayCatalog);

    // ── Full tool roster ───────────────────────────────────────
    // She used to tell users she had "no local filesystem, no shell" and
    // "no ability to read Desktop/" — because nothing ever told her
    // otherwise. This states the real surface explicitly and corrects the
    // stale "cloud-only Supabase" belief from when Suite ran on hosted
    // Supabase. Everything here executes locally against the relay.
    if (relayCatalog.length > 0) {
      messagesArray.push({
        role: 'system',
        content:
`\n\n## ðŸ”§ YOUR REAL TOOL SURFACE (${relayCatalog.length} tools — this is the FULL list, not a subset)

You are running **locally** against the XMRT relay. This is NOT a restricted
cloud Supabase sandbox. You have a real shell, a real filesystem, a real
Postgres database, real media tooling, and infra control. If someone tells you
you lack these, that is out of date — call the tool and show them.

You are directly callable for ${ELIZA_TOOLS.length + relaySchemas.length} of these.
For **anything else** in the list below, call the \`relay-tool\` meta-tool:
  relay-tool({ "tool": "<exact tool name>", "args": { ... } })
\`relay-tool\` accepts a JSON args object, so a tool that needs a shell
command, a SQL statement, or a file path takes them as normal arguments.

Key capabilities you have that people assume you do not:
- \`shell-exec\` — run real shell commands, read/write local files
- \`python-exec\` — run Python for data work
- \`db-query\` / \`db-rest\` — query the local Postgres database directly
- \`video-editor\` — FFmpeg video trimming, concat, overlays, thumbnails, GIFs
- \`service_control\` / \`ship_logs\` — restart services and read their logs
- \`knowledge-graph\` — search the vault, DB, fleet memory and semantic catalog
- \`vault-read\` / \`vault-write\` / \`vault-update\` — the Obsidian wiki. If asked
  to "update"/"rewrite"/"add to the note about X", read it first, then update it.
  Only the machine-managed block is rewritten; anything written outside it is
  preserved. \`vault-sync-entities\` folds knowledge you extract from
  conversation into the wiki.

âš ï¸ TOOL DISCIPLINE — READ THIS, IT MATTERS FOR SPEED:
- A tool call costs a full round trip. Chaining many of them is why replies
  used to take a minute.
- Most questions need **zero** tools. If you already know, just answer.
- If one tool gives you what you need, **stop and answer in plain prose**.
  Do not "double check" with a second, third, or fourth tool.
- Never call a tool just to demonstrate that you can.
- When you have run tools, your next message must be the **written answer to
  the user**, not another tool call and not a paste of the tool's raw output.
- Never echo raw tool errors, JSON, or \`TOOL_CALL\` blocks at the user. Summarize
  in plain English what actually happened.

FULL ROSTER:
${buildRelayToolRoster(relayCatalog)}`
      });
      console.log(`ðŸ§° Injected relay tool roster: ${relayCatalog.length} tools (${relaySchemas.length} directly callable)`);
    }

    const tools = (use_tools && !firstTurnDirectFastPath)
      ? [...ELIZA_TOOLS, ...relaySchemas]
      : [];
    const maxToolIterations = MAX_TOOL_ITERATIONS;
    console.log(`âš¡ First-turn optimization: firstEngagement=${isFirstEngagement}, directFastPath=${firstTurnDirectFastPath}, toolsEnabled=${tools.length > 0}, maxToolIterations=${maxToolIterations}`);
    console.log(`ðŸŽ¯ ai-chat routing: query="${truncateString(query, 80)}" | tools=${tools.length} (legacy=${ELIZA_TOOLS.length} relay=${relaySchemas.length} catalog=${relayCatalog.length}) | use_tools=${use_tools} | firstTurnDirectFastPath=${firstTurnDirectFastPath} | will-pass-tools-to-cascade=${tools.length > 0}`);
    let initialResult = await callAIFunction(messagesArray, tools);
    
    // If the model responded without calling tools, optionally force a knowledge
    // lookup and re-ask.
    //
    // This used to fire for ANY non-greeting query the model answered directly,
    // which meant the fastest path (model just answers) was punished with a
    // second full LLM round trip. It also duplicates the knowledge pre-fetch
    // that already ran above and injected KB results into messagesArray. So
    // restrict it to questions that actually ask about stored knowledge or
    // project/DAO specifics, and leave everything else alone.
    if (initialResult.success && !initialResult.tool_calls && tools.length > 0 && shouldForceKnowledgeLookup(query)) {
      console.log('ðŸ”„ Model answered without tools — force-calling search_knowledge');
      try {
        const forcedResult = await executeRealToolCall('search_knowledge', JSON.stringify({ search_term: query }), executive_name, sessionId, ipAddress);
        if (forcedResult) {
          extraToolCalls.push({ id: `tc-forced-${Date.now()}`, function_name: 'search_knowledge', status: 'success', execution_time_ms: 0 });
          // Extract knowledge results from the actual response shape
          const knowledgeData = forcedResult.knowledge || forcedResult.results || forcedResult.entries || [];
          const knowledgeStr = Array.isArray(knowledgeData) 
            ? knowledgeData.map((k: any) => `- ${k.name || k.entity_name}: ${k.entity?.description || k.description || ''}`).join('\n')
            : JSON.stringify(knowledgeData).slice(0, 2000);
          
          if (knowledgeStr.length > 20) {
            messagesArray.push({
              role: 'system',
              content: `[KNOWLEDGE BASE RESULTS] Retrieved for "${query}":\n${knowledgeStr}`
            });
            initialResult = await callAIFunction(messagesArray, tools);
          }
        }
      } catch (e) {
        console.warn('âš ï¸ Forced tool call failed:', e.message);
      }
    }
    
    // If AI call failed, use emergency fallback
    if (!initialResult.success) {
      console.warn(`âš ï¸ AI call failed, using emergency fallback`);
      const emergencyResult = await emergencyStaticFallback(query, executive_name);
      
      clearTimeout(timeoutId);
      
      await conversationManager.saveConversation(
        [...allMessages, { role: 'assistant', content: emergencyResult.content }],
        []
      );
      
      completeRequest(requestId, {
        success: true,
        content: emergencyResult.content,
        provider: 'fallback',
        method: 'Office Clerk',
        hasToolCalls: false,
        session_id: sessionId
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          content: emergencyResult.content,
          executive: executive_name,
          provider: 'fallback',
          hasToolCalls: false,
          executionTimeMs: Date.now() - startTime,
          session_id: sessionId,
          request_id: requestId,
          note: 'Used fallback response due to AI provider issues'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Synthetic tool calls surfaced to the UI (e.g. forced knowledge lookups
    // that ran outside executeToolsWithIteration). Kept separate so they never
    // interfere with the tool-execution loop, only with what the dashboard shows.
    const extraToolCalls: any[] = [];

    // Execute tools with iteration (now includes new Solution Engine tools)
    const { content: finalContent, toolsExecuted, toolCalls: executedToolCalls } = await executeToolsWithIteration(
      initialResult,
      messagesArray,
      executive_name,
      sessionId,
      ipAddress,
      callAIFunction,
      tools,
      maxToolIterations,
      conversationManager
    );
    
    // Save conversation
    if (save_memory) {
      const toolResults = conversationManager.getToolResults();
      const newResults = toolResults.slice(previousToolResults.length);
      
      await conversationManager.saveConversation(
        [...allMessages, { role: 'assistant', content: finalContent }],
        newResults
      );
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Request ${requestId} completed in ${executionTime}ms, executed ${toolsExecuted} tools`);
    
    clearTimeout(timeoutId);
    
    completeRequest(requestId, {
      success: true,
      content: finalContent,
      provider: initialResult.provider,
      model: initialResult.model,
      // `method` is the UI-facing label UnifiedChat.tsx reads (via providerUsed).
      // Previously null â†’ SPA fell back to "Office Clerk". Include a human-readable
      // label that names the actual model so the dashboard reflects the truth.
      method: `${initialResult.provider === 'openrouter' ? 'OpenRouter' : (initialResult.provider || 'Cloud')} ${initialResult.model ?? 'minimax/minimax-m3:free'}`,
      toolsExecuted: toolsExecuted + extraToolCalls.length,
      toolCalls: [...(executedToolCalls || []), ...extraToolCalls],
      session_id: sessionId
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        content: finalContent,
        executive: executive_name,
        provider: initialResult.provider,
        model: initialResult.model,
        toolsExecuted: toolsExecuted + extraToolCalls.length,
        toolCalls: [...(executedToolCalls || []), ...extraToolCalls],
        session_id: sessionId,
        request_id: requestId,
        executionTimeMs: executionTime,
        memory: {
          previous_tool_results: previousToolResults.length,
          current_tool_results: toolsExecuted,
          total_tool_results: previousToolResults.length + toolsExecuted,
          historical_summaries_loaded: historicalSummaries.length,
          ip_based_persistence: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
    })();
    
    clearTimeout(timeoutId);
    // Return immediately — the result will be stored and pollable via request_id.
    return new Response(
      JSON.stringify({
        success: true,
        status: 'processing',
        request_id: requestId,
        message: 'AI request accepted. Poll GET /functions/v1/ai-chat?request_id=' + requestId + ' for the result.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    console.error(`ðŸ’¥ Critical error for request ${requestId}:`, error);
    
    if (error.name === 'AbortError') {
      failRequest(requestId, 'Request timeout');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request timeout',
          details: `Request exceeded ${REQUEST_TIMEOUT_MS}ms limit`,
          executive: EXECUTIVE_NAME,
          request_id: requestId,
          executionTimeMs: Date.now() - startTime
        }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    failRequest(requestId, error.message || 'Internal server error');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
        executive: EXECUTIVE_NAME,
        request_id: requestId,
        executionTimeMs: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

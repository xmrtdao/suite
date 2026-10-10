// Suite telemetry — the data source behind the dashboard's Unified data module.
//
// Served by the relay at /api/suite/telemetry (same origin as the SPA, so no
// CORS and no separate base URL). Two things the SPA cannot work out for itself:
// where this tenant sits in the ecosystem graph, and how much of the database
// is actually reclaimable. Neither is answerable from a table the SPA can query.

export interface TelemetryTable {
  schema: string;
  name: string;
  qualified: string;
  onDisk: number;
  /** Main fork only — pg_relation_size does not include TOAST. */
  heap: number;
  /** Out-of-line storage for wide jsonb/text values. Live data, not free space. */
  toast: number;
  indexes: number;
  /** Free space map + visibility map + init fork. */
  maps: number;
  toastPct: number;
  indexPct: number;
  /** From pg_class.reltuples — the planner's estimate, not a count. */
  estRows: number;
  rowsAreEstimate: true;
  hasCreatedAt: boolean;
}

export interface TelemetryLogGrowth {
  qualified: string;
  present: boolean;
  reason?: string;
  oldest?: string | null;
  newest?: string | null;
  retentionDays?: number | null;
  rows24h?: number;
  rows7d?: number;
  onDisk?: number | null;
  toast?: number | null;
}

export interface TelemetryGraphNode {
  id: string;
  label: string;
  category: string;
  source: string;
  status: string | null;
  description: string | null;
  /** Present on the galaxy-core view only. */
  degree?: number;
  /** True for the tenant's own one-hop neighbours. */
  isNeighbour?: boolean;
}

export interface GraphView {
  nodes: TelemetryGraphNode[];
  edges: { source: string; target: string; type: string }[];
  depth?: number;
  omittedNodes?: number;
  omittedEdges?: number;
  cap?: number;
}

/**
 * Headline counts, read from the tables that actually hold them.
 *
 * These previously came from fetchDashboardStats(), which returned hardcoded
 * zeros for four fields and read a health endpoint whose response had none of
 * the fields it looked for — so "System Health 100%" was a fallback constant.
 */
export interface TelemetryStats {
  executions: {
    source: string;
    lifetime: number;
    /** True when `lifetime` is pg_class.reltuples rather than a count. */
    lifetimeIsEstimate: boolean;
    last24h: number;
    last7d: number;
  };
  knowledgeEntities: number;
  sharedContext: number;
  memoryContexts: number;
  workflows: { templates: number; executions: number; generated: number };
  tasks: { total: number; byStatus: Record<string, number> };
  agents: { total: number; byStatus: Record<string, number> };
}

export interface SuiteTelemetry {
  generatedAt: string;
  tenant: { node: string; host: string };
  storage: {
    databaseBytes: number;
    topTables: TelemetryTable[];
    growth: TelemetryLogGrowth[];
    totals: {
      countedBytes: number;
      toastBytes: number;
      indexBytes: number;
      mapBytes: number;
      toastPctOfDatabase: number;
      indexPctOfDatabase: number;
    };
  } | null;
  workflows: {
    jobs: number;
    active: number;
    inactive: number;
    lastRunFailed: number;
    withFailures: number;
    lastRunAt: string | null;
    mostRuns: number;
  } | null;
  stats: TelemetryStats | null;
  graph: {
    root: string;
    host: string;
    /** The tenant's immediate neighbourhood: what it directly touches. */
    slice: GraphView;
    /** The galaxy's backbone, for perspective on where that sits. */
    core: GraphView;
    totals: { nodes: number; edges: number; byCategory: Record<string, number> };
    rootFound: boolean;
  } | null;
  warnings: string[];
  tookMs: number;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / Math.pow(1024, i);
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function formatCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** "3 min ago" / "2 h ago" — null when the timestamp is missing, never "now". */
export function formatAge(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return 'unknown';
  if (ms < 0) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

/**
 * Fetch telemetry. The endpoint does real work (~9s on this database, mostly the
 * galaxy's own external health probes), so callers should poll on the order of a
 * minute rather than treat this as a live socket.
 */
export async function fetchSuiteTelemetry(
  signal?: AbortSignal
): Promise<SuiteTelemetry> {
  // Same-origin by design: the SPA is always served by the relay, which is also
  // what proxies /rest/v1 and /functions/v1. A configured base URL here would
  // break on the tunnel, the same way a hardcoded VITE_SUPABASE_URL does.
  const res = await fetch('/api/suite/telemetry', {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`telemetry request failed (${res.status})`);
  }
  return (await res.json()) as SuiteTelemetry;
}

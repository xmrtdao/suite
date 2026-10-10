import { useEffect, useRef, useState } from 'react';
import {
  fetchSuiteTelemetry,
  formatAge,
  formatBytes,
  formatCount,
  type SuiteTelemetry,
} from '@/services/suiteTelemetry';
import { EcosystemGraph } from '@/components/EcosystemGraph';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  HardDrive,
  Network,
  RefreshCw,
  Workflow,
} from 'lucide-react';

// How often to ask. The endpoint costs ~5-10s of real work (catalog scans plus
// the galaxy's own outbound probes), so this is a slow poll by design and the
// age of the data is always on screen. Pretending otherwise would mean showing
// a number that is quietly two minutes stale.
const POLL_MS = 60_000;

export interface NexusDataPoint {
  id: string;
  label: string;
  detail?: string;
  kind: 'stat' | 'health' | 'endpoint';
  status?: 'healthy' | 'degraded' | 'error' | 'unknown';
  icon: React.ReactNode;
  value?: number;
  suffix?: string;
  path?: string;
}

export interface NexusPipelineStage {
  id: string;
  label: string;
  value: number;
}

export interface NexusEndpoint {
  id: string;
  name: string;
  path: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  metric: string;
}

export interface UnifiedDataModuleProps {
  /** Fleet counters, owned by the dashboard's own 30s poll. */
  dataPoints?: NexusDataPoint[];
  pipeline?: NexusPipelineStage[];
  /** Per-subsystem health from the system-status edge function. */
  endpoints?: NexusEndpoint[];
}

const STATUS_DOT: Record<string, string> = {
  healthy: 'bg-emerald-500',
  up: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  error: 'bg-red-500',
  down: 'bg-red-500',
  unknown: 'bg-muted-foreground/50',
};

function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warn' | 'good';
}) {
  return (
    <div className="rounded border border-border/50 bg-background/60 px-1.5 py-1">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'font-mono text-[13px] font-semibold tabular-nums',
          tone === 'warn' && 'text-amber-600',
          tone === 'good' && 'text-emerald-600'
        )}
      >
        {value}
      </div>
      {hint && <div className="truncate text-[9px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function UnifiedDataModule({
  dataPoints = [],
  pipeline = [],
  endpoints = [],
}: UnifiedDataModuleProps) {
  const [data, setData] = useState<SuiteTelemetry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showAllTables, setShowAllTables] = useState(false);
  // 'slice' = what this tenant touches; 'core' = the galaxy backbone it sits in.
  const [graphView, setGraphView] = useState<'slice' | 'core'>('slice');
  const abortRef = useRef<AbortController | null>(null);

  const load = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const t = await fetchSuiteTelemetry(ac.signal);
      if (ac.signal.aborted) return;
      setData(t);
      setError(null);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message || 'telemetry unavailable');
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      abortRef.current?.abort();
    };
  }, []);

  const storage = data?.storage ?? null;
  const wf = data?.workflows ?? null;
  const graph = data?.graph ?? null;

  // An earlier version reported a "reclaimable" figure derived from
  // on_disk - heap - indexes and told the reader a VACUUM would return 2.4GB
  // of it. pg_relation_size() counts only the main fork, so that difference was
  // mostly the TOAST relation holding live jsonb payloads; a real VACUUM on
  // the three worst tables reclaimed 0.2MB. The panel now reports actual
  // composition instead of a reclaimability claim that turned out to be false.
  const toastPct = storage?.totals.toastPctOfDatabase ?? 0;
  const indexPct = storage?.totals.indexPctOfDatabase ?? 0;
  const shown = showAllTables ? storage?.topTables ?? [] : (storage?.topTables ?? []).slice(0, 6);

  return (
    <div className="glass-card rounded-xl border border-primary/15 bg-background/65 p-1.5 shadow-lg shadow-primary/5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Network className="h-3 w-3 text-primary" />
            XMRT Nexus
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {data
              ? `Live backend telemetry · ${graph?.totals.nodes ?? 0} nodes in galaxy · this SPA shown in context`
              : 'Live backend telemetry for this tenant.'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/70 px-1.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            {data ? formatAge(data.generatedAt) : 'loading'}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/70 px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-background"
            aria-expanded={open}
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? 'Minimize' : 'Expand'}
          </button>
        </div>
      </div>

      {!open ? (
        <div className="rounded-md border border-dashed border-border/60 bg-background/40 px-2 py-1.5 text-[10px] text-muted-foreground">
          {error
            ? `Telemetry unavailable — ${error}`
            : 'Minimized to preserve dashboard space. Expand for live node, workflow and storage telemetry.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {error && (
            <p role="alert" className="flex items-center gap-1 rounded border border-destructive/40 bg-destructive/10 px-1.5 py-1 text-[10px] text-destructive">
              <AlertTriangle className="h-3 w-3" /> {error}
            </p>
          )}

          {data?.warnings?.length ? (
            <p className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-1 text-[10px] text-amber-700">
              Partial data — {data.warnings.join('; ')}
            </p>
          ) : null}

          {/* ── Headline numbers ── */}
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
            <Stat
              label="Database"
              value={formatBytes(storage?.databaseBytes)}
              hint={`${storage?.topTables.length ?? 0} largest tables`}
            />
            <Stat
              label="TOAST payloads"
              value={formatBytes(storage?.totals.toastBytes)}
              hint={`${toastPct}% of database · live jsonb`}
            />
            <Stat
              label="Indexes"
              value={formatBytes(storage?.totals.indexBytes)}
              hint={`${indexPct}% of database`}
              tone={indexPct >= 25 ? 'warn' : 'default'}
            />
            <Stat
              label="Workflows"
              value={wf ? `${wf.active}/${wf.jobs}` : '—'}
              hint={wf ? `${wf.inactive} inactive` : undefined}
            />
            <Stat
              label="Last run"
              value={wf ? formatAge(wf.lastRunAt) : '—'}
              hint={wf?.lastRunFailed ? `${wf.lastRunFailed} failed last run` : 'no failures'}
              tone={wf?.lastRunFailed ? 'warn' : 'good'}
            />
            <Stat
              label="This SPA"
              value={graph ? `${graph.slice.nodes.length - 1}` : '—'}
              hint={graph ? `connections, of ${graph.totals.nodes} galaxy nodes` : undefined}
            />
          </div>

          {/* ── Fleet counters ── */}
          {dataPoints.length > 0 && (
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {dataPoints.map((p) => (
                <div
                  key={p.id}
                  className="rounded border border-border/50 bg-background/60 px-1.5 py-1"
                  title={p.path ? `${p.label} · ${p.path}` : p.label}
                >
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                    {p.icon}
                    <span className="truncate">{p.label}</span>
                  </div>
                  <div
                    className={cn(
                      'font-mono text-[13px] font-semibold tabular-nums text-foreground',
                      p.kind === 'health' && p.status === 'degraded' && 'text-amber-600',
                      p.kind === 'health' && p.status === 'error' && 'text-red-600'
                    )}
                  >
                    {/* A card with no number shows its metric rather than a bare
                        dash — "–" on its own says nothing. */}
                    {p.value != null ? `${p.value}${p.suffix ?? ''}` : (p.detail ?? '—')}
                  </div>
                  {p.detail != null && p.value != null && (
                    <div className="truncate text-[9px] text-muted-foreground">{p.detail}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Per-subsystem endpoint health ── */}
          {endpoints.length > 0 && (
            <div className="rounded-md border border-border/50 bg-background/45 px-1.5 py-1">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[9px] font-medium text-foreground">Subsystems</p>
                <p className="text-[9px] text-muted-foreground">
                  {endpoints.filter((e) => e.status === 'healthy').length}/{endpoints.length}{' '}
                  answering
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 sm:grid-cols-3 lg:grid-cols-6">
                {endpoints.map((e) => (
                  <li key={e.id} className="flex min-w-0 items-center gap-1 text-[9px]">
                    <span
                      aria-hidden="true"
                      className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[e.status] ?? STATUS_DOT.unknown)}
                    />
                    <span className="truncate text-foreground">{e.name}</span>
                    <span className="ml-auto shrink-0 truncate font-mono tabular-nums text-muted-foreground">
                      {e.metric}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Task pipeline ── */}
          {pipeline.length > 0 && (
            <div className="rounded-md border border-border/50 bg-background/45 px-1.5 py-1">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[9px] font-medium text-foreground">Task pipeline</p>
                <p className="text-[9px] text-muted-foreground">capture → execute</p>
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${pipeline.length}, minmax(0, 1fr))` }}
              >
                {pipeline.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="relative rounded-sm border border-border/50 bg-background/70 px-1 py-0.5"
                  >
                    <div className="truncate text-[8px] text-muted-foreground">{stage.label}</div>
                    <div className="text-[10px] font-semibold text-foreground">
                      <AnimatedCounter end={stage.value} />
                    </div>
                    {index < pipeline.length - 1 && (
                      <div className="pointer-events-none absolute -right-1.5 top-1/2 h-px w-2 -translate-y-1/2 bg-primary/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-1.5 lg:grid-cols-2">
            {/* ── Ecosystem position ── */}
            <section className="rounded-md border border-border/50 bg-background/45 p-1.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
                  <Network className="h-3 w-3 text-primary" />
                  Where this tenant sits
                </h3>
                <div className="flex items-center gap-1">
                  <div
                    role="group"
                    aria-label="Graph scope"
                    className="flex overflow-hidden rounded border border-border/60"
                  >
                    {(['slice', 'core'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setGraphView(v)}
                        aria-pressed={graphView === v}
                        className={cn(
                          'px-1.5 py-0.5 text-[9px] font-medium transition-colors',
                          graphView === v
                            ? 'bg-primary/15 text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {v === 'slice' ? 'This SPA' : 'Galaxy'}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {graph
                      ? `${graph.totals.nodes} nodes / ${graph.totals.edges} edges total`
                      : '—'}
                  </span>
                </div>
              </div>
              {graph ? (
                graph.rootFound ? (
                  <>
                    <EcosystemGraph
                      key={graphView}
                      nodes={(graphView === 'slice' ? graph.slice : graph.core).nodes}
                      edges={(graphView === 'slice' ? graph.slice : graph.core).edges}
                      root={graph.root}
                    />
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {graphView === 'slice'
                        ? `${graph.slice.nodes.length} direct connections. The tenant is ringed; everything else is what it touches.`
                        : `${graph.core.nodes.length} highest-degree nodes of ${graph.totals.nodes} — the backbone everything else hangs from. ${graph.core.omittedNodes} lower-degree nodes and ${graph.core.omittedEdges} edges omitted to keep it legible. Big filled dot is a major hub; small dots are this SPA's own connections.`}
                    </p>
                  </>
                ) : (
                  <p className="px-1 py-2 text-[10px] text-amber-700">
                    The galaxy has no node named “{graph.root}”, so this SPA’s place
                    in it cannot be shown. That is a gap in the vault
                    documentation, not a lack of data.
                  </p>
                )
              ) : (
                <p className="px-1 py-2 text-[10px] text-muted-foreground">
                  Ecosystem graph unavailable.
                </p>
              )}
            </section>

            {/* ── Storage pressure / pruning ── */}
            <section className="rounded-md border border-border/50 bg-background/45 p-1.5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
                  <HardDrive className="h-3 w-3 text-primary" />
                  Storage pressure
                </h3>
                <span className="text-[9px] text-muted-foreground">
                  on disk = rows + TOAST + indexes + maps
                </span>
              </div>

              {storage ? (
                <>
                  <p className="mb-1 rounded border border-border/50 bg-muted/20 px-1.5 py-1 text-[9px] leading-snug text-muted-foreground">
                    Of the largest tables, <strong className="font-mono text-foreground">{formatBytes(storage.totals.toastBytes)}</strong> is TOAST —
                    out-of-line <code className="font-mono">jsonb</code>/text payloads that are live data, not free space —
                    and <strong className="font-mono text-foreground">{formatBytes(storage.totals.indexBytes)}</strong> is index overhead.
                    Both are real bytes; neither is reclaimed by a VACUUM.
                  </p>

                  <table className="w-full text-[9px]">
                    <caption className="sr-only">
                      Largest tables by on-disk size, split into live rows, TOAST
                      payloads, indexes and internal maps
                    </caption>
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th scope="col" className="font-medium">table</th>
                        <th scope="col" className="text-right font-medium">on disk</th>
                        <th scope="col" className="text-right font-medium">rows ~</th>
                        <th scope="col" className="w-[38%] font-medium">split</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((t) => {
                        const pct = (n: number) =>
                          t.onDisk > 0 ? `${Math.round((n / t.onDisk) * 100)}%` : '0%';
                        return (
                          <tr key={t.qualified} className="align-middle">
                            <td className="max-w-0 truncate pr-1 font-mono text-foreground">
                              {t.qualified}
                            </td>
                            <td className="text-right font-mono tabular-nums text-foreground">
                              {formatBytes(t.onDisk)}
                            </td>
                            <td className="text-right font-mono tabular-nums text-muted-foreground">
                              {formatCount(t.estRows)}
                            </td>
                            <td className="pl-1">
                              <span className="flex h-2 w-full overflow-hidden rounded-sm bg-muted/30">
                                <span className="bg-primary/70" style={{ width: pct(t.heap) }} title={`rows ${formatBytes(t.heap)}`} />
                                <span className="bg-violet-400/70" style={{ width: pct(t.toast) }} title={`TOAST payloads ${formatBytes(t.toast)}`} />
                                <span className="bg-slate-400/60" style={{ width: pct(t.indexes) }} title={`indexes ${formatBytes(t.indexes)}`} />
                                <span className="bg-muted-foreground/30" style={{ width: pct(t.maps) }} title={`free space map + visibility map ${formatBytes(t.maps)}`} />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block size-2 rounded-sm bg-primary/70" /> rows
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block size-2 rounded-sm bg-violet-400/70" /> TOAST payloads
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block size-2 rounded-sm bg-slate-400/60" /> index
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block size-2 rounded-sm bg-muted-foreground/30" /> maps
                    </span>
                    <span className="ml-auto">
                      rows are planner estimates
                    </span>
                  </div>

                  {(storage.topTables.length ?? 0) > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllTables((v) => !v)}
                      className="mt-1 text-[9px] text-primary underline-offset-2 hover:underline"
                    >
                      {showAllTables ? 'Show fewer' : `Show all ${storage.topTables.length}`}
                    </button>
                  )}

                  {/* Growth: the rate is what tells you whether pruning is
                      needed, not the snapshot size. */}
                  <div className="mt-1.5 border-t border-border/50 pt-1">
                    <h4 className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Activity className="h-2.5 w-2.5" /> log accumulation
                    </h4>
                    <ul className="space-y-0.5">
                      {storage.growth.map((g) => (
                        <li
                          key={g.qualified}
                          className="flex items-baseline justify-between gap-2 font-mono text-[9px]"
                        >
                          <span className="max-w-0 truncate text-foreground">{g.qualified}</span>
                          {g.present ? (
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {formatCount(g.rows24h)}/24h · {g.retentionDays}d retained ·{' '}
                              {formatBytes(g.onDisk)}
                            </span>
                          ) : (
                            <span className="shrink-0 text-amber-700">table absent</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="px-1 py-2 text-[10px] text-muted-foreground">
                  Storage metrics unavailable.
                </p>
              )}
            </section>
          </div>

          {wf && (
            <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Workflow className="h-2.5 w-2.5" />
              {wf.jobs} registered jobs · {wf.active} active · busiest has run{' '}
              {formatCount(wf.mostRuns)} times
              {wf.withFailures > 0 && ` · ${wf.withFailures} with recorded failures`}
              <Database className="ml-1 h-2.5 w-2.5" />
              read in {data?.tookMs ?? 0}ms
            </p>
          )}
        </div>
      )}
    </div>
  );
}

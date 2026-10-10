import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TelemetryGraphNode } from '@/services/suiteTelemetry';
import { cn } from '@/lib/utils';

interface EcosystemGraphProps {
  nodes: TelemetryGraphNode[];
  edges: { source: string; target: string; type: string }[];
  root: string;
  className?: string;
}

interface Sim {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isRoot: boolean;
}

// Light palette to sit inside the Suite's light theme, and deliberately not the
// relay galaxy's neon-on-black. Categories are told apart by size and label as
// well as hue, so the graph is still readable without colour vision.
const CATEGORY_STYLE: Record<string, { fill: string; ring: string }> = {
  spa: { fill: '#4f46e5', ring: '#312e81' },
  backend: { fill: '#0891b2', ring: '#0e7490' },
  infra: { fill: '#0d9488', ring: '#0f766e' },
  db: { fill: '#a16207', ring: '#854d0e' },
  system: { fill: '#475569', ring: '#334155' },
  tunnel: { fill: '#7c3aed', ring: '#5b21b6' },
  cert: { fill: '#be185d', ring: '#9d174d' },
  catalog: { fill: '#94a3b8', ring: '#64748b' },
  agent: { fill: '#16a34a', ring: '#15803d' },
};

const DEFAULT_STYLE = { fill: '#64748b', ring: '#475569' };
const styleFor = (c: string) => CATEGORY_STYLE[c] ?? DEFAULT_STYLE;

const EDGE_STYLE: Record<string, string> = {
  'routes-to': '#7c3aed',
  'exposed-via': '#a78bfa',
  'has-table': '#a16207',
  'belongs-to': '#a16207',
  'documented-as': '#94a3b8',
  'catalogued-as': '#cbd5e1',
  'source-code': '#334155',
  'wiki-link': '#cbd5e1',
};

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function EcosystemGraph({ nodes, edges, root, className }: EcosystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef<Sim[]>([]);
  const rafRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const adjacency = useMemo(() => {
    const m = new Map<string, { other: string; type: string }[]>();
    for (const e of edges) {
      if (!byId.has(e.source) || !byId.has(e.target)) continue;
      if (!m.has(e.source)) m.set(e.source, []);
      if (!m.has(e.target)) m.set(e.target, []);
      m.get(e.source)!.push({ other: e.target, type: e.type });
      m.get(e.target)!.push({ other: e.source, type: e.type });
    }
    return m;
  }, [edges, byId]);

  // Seed positions on a ring, then let the sim relax them.
  // Seeding radially (rather than all-at-origin) avoids the degenerate case
  // where every node starts on the same pixel and the first tick explodes.
  const seed = useCallback(
    (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const others = nodes.filter((n) => n.id !== root);
      const ring = Math.min(w, h) * 0.32;
      // A ring that grows with the graph: 16 nodes need less room to untangle
      // than 90, and at 90 a fixed radius packs the labels on top of each other.
      const ringScale = others.length > 40 ? 0.42 : 0.32;
      simRef.current = nodes.map((n) => {
        const isRoot = n.id === root;
        const idx = others.findIndex((o) => o.id === n.id);
        const angle = (idx / Math.max(1, others.length)) * Math.PI * 2;
        const r = Math.min(w, h) * ringScale;
        return {
          id: n.id,
          x: isRoot ? cx : cx + Math.cos(angle) * r,
          y: isRoot ? cy : cy + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
          // Radius encodes importance. The galaxy-core view carries a real
          // degree, so hubs read as hubs; the slice view falls back to in-view
          // degree. Either way a hub is visibly bigger than a leaf.
          r: isRoot
            ? 7
            : 2.5 +
              Math.min(
                isRoot ? 0 : 6,
                Math.sqrt(
                  n.degree ?? adjacency.get(n.id)?.length ?? 1
                ) * (n.degree != null ? 0.9 : 1.3)
              ),
          isRoot,
        };
      });
    },
    [nodes, root, adjacency]
  );

  const step = useCallback(() => {
    const s = simRef.current;
    if (!s.length) return false;
    const cx = size.w / 2;
    const cy = size.h / 2;
    const k = 0.016;
    let energy = 0;

    // Repulsion between every pair. O(n²) is the right call at this size — a
    // Barnes-Hut quadtree would cost more in complexity than it saves on 16
    // points, and would be dead code the moment the slice is the unit of work.
    for (let i = 0; i < s.length; i++) {
      for (let j = i + 1; j < s.length; j++) {
        let dx = s[i].x - s[j].x;
        let dy = s[i].y - s[j].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Coincident: nudge apart deterministically so the sim cannot stall.
          dx = (i - j) * 0.5 + 0.1;
          dy = (j - i) * 0.5 + 0.1;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        const f = (900 * k) / d2;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        s[i].vx += fx; s[i].vy += fy;
        s[j].vx -= fx; s[j].vy -= fy;
      }
    }

    // Springs along real edges only — the layout is the dependency graph, not
    // an arbitrary hairball.
    for (const [a, list] of adjacency) {
      const ia = s.findIndex((n) => n.id === a);
      if (ia < 0) continue;
      for (const { other } of list) {
        const ib = s.findIndex((n) => n.id === other);
        if (ib < 0 || ib === ia) continue;
        const dx = s[ib].x - s[ia].x;
        const dy = s[ib].y - s[ia].y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = ((d - 70) / d) * 0.045;
        s[ia].vx += dx * f; s[ia].vy += dy * f;
        s[ib].vx -= dx * f; s[ib].vy -= dy * f;
      }
    }

    // Weak gravity toward centre keeps disconnected parts on screen.
    for (const n of s) {
      n.vx += (cx - n.x) * 0.012;
      n.vy += (cy - n.y) * 0.012;
      n.vx *= 0.82;
      n.vy *= 0.82;
      n.x += n.vx;
      n.y += n.vy;
      const pad = n.r + 6;
      n.x = Math.min(size.w - pad, Math.max(pad, n.x));
      n.y = Math.min(size.h - pad, Math.max(pad, n.y));
      energy += Math.abs(n.vx) + Math.abs(n.vy);
    }
    return energy > 0.35;
  }, [size, adjacency]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w, h } = size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pos = new Map(simRef.current.map((n) => [n.id, n]));

    for (const e of edges) {
      const a = pos.get(e.source);
      const b = pos.get(e.target);
      if (!a || !b) continue;
      const touched = hovered === e.source || hovered === e.target ||
        selected === e.source || selected === e.target;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = EDGE_STYLE[e.type] ?? '#cbd5e1';
      ctx.globalAlpha = touched ? 0.95 : 0.4;
      ctx.lineWidth = touched ? 1.6 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const rootNode = simRef.current.find((n) => n.isRoot);
    const active = hovered ?? selected;

    for (const n of simRef.current) {
      const meta = byId.get(n.id);
      if (!meta) continue;
      const st = styleFor(meta.category);
      const isActive = active === n.id;
      const dim = active != null && !isActive && !neighbourIds(active).has(n.id);

      ctx.globalAlpha = dim ? 0.25 : 1;

      if (n.isRoot) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${st.fill}22`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = st.fill;
      ctx.fill();
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeStyle = isActive ? st.ring : '#ffffff';
      ctx.stroke();

      // Labels only for the root, the selection and its neighbours. Drawing all
      // 16 at module size turns the canvas into grey mush.
      if (n.isRoot || isActive || (!active && rootNode && n.id === rootNode.id)) {
        ctx.font = `${n.isRoot ? 600 : 500} ${n.isRoot ? 11 : 10}px ui-sans-serif, system-ui, sans-serif`;
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(truncate(meta.label, 22), n.x, n.y + n.r + 3);
      }
    }
    ctx.globalAlpha = 1;
  }, [edges, byId, hovered, selected, size]);

  function neighbourIds(id: string): Set<string> {
    return new Set([id, ...(adjacency.get(id) ?? []).map((a) => a.other)]);
  }

  // ── Size tracking ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Run the sim, then stop ──
  useEffect(() => {
    if (!size.w || !size.h || !nodes.length) return;
    seed(size.w, size.h);

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      // Settle synchronously instead of animating: same layout, no motion.
      for (let i = 0; i < 220; i++) if (!step()) break;
      draw();
      return;
    }

    let ticks = 0;
    const loop = () => {
      const moving = step();
      draw();
      ticks++;
      // ~4s of animation then freeze. A graph that never stops moving is noise,
      // and it keeps the main thread busy on a page that also runs a chat.
      if (moving && ticks < 240) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, nodes, seed, step, draw]);

  // Repaint on hover/selection without restarting the simulation.
  useEffect(() => {
    if (!rafRef.current) draw();
  }, [hovered, selected, draw]);

  // Don't animate a panel nobody is looking at.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !rafRef.current && simRef.current.length) {
          draw();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [draw]);

  const pick = useCallback((pt: { x: number; y: number }): string | null => {
    // Hit radius is padded well past the drawn radius — a 3.5px dot is not a
    // pointer target, and the whole point is that this is explorable.
    for (const n of simRef.current) {
      if (Math.hypot(n.x - pt.x, n.y - pt.y) <= Math.max(10, n.r + 7)) {
        return n.id;
      }
    }
    return null;
  }, []);

  const active = hovered ?? selected;
  const activeMeta = active ? byId.get(active) : null;
  const activeNeighbours = active
    ? (adjacency.get(active) ?? []).map((a) => ({
        label: byId.get(a.other)?.label ?? a.other,
        type: a.type,
      }))
    : [];

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        ref={wrapRef}
        className="relative h-[190px] w-full overflow-hidden rounded-md border border-border/60 bg-gradient-to-br from-background to-primary/[0.04]"
      >
        <canvas
          ref={canvasRef}
          width={size.w}
          height={size.h}
          className="absolute inset-0 h-full w-full"
          style={{ width: size.w, height: size.h }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHovered(pick({ x: e.clientX - r.left, y: e.clientY - r.top }));
          }}
          onMouseLeave={() => setHovered(null)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const hit = pick({ x: e.clientX - r.left, y: e.clientY - r.top });
            setSelected((prev) => (hit && hit !== prev ? hit : null));
          }}
        />

        {!nodes.length && (
          <p className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
            No ecosystem data returned.
          </p>
        )}

        {activeMeta && (
          <div className="pointer-events-none absolute left-1.5 top-1.5 max-w-[62%] rounded border border-border/70 bg-background/95 px-1.5 py-1 text-[9px] shadow-sm">
            <div className="font-semibold text-foreground">{activeMeta.label}</div>
            <div className="text-muted-foreground">
              {activeMeta.category}
              {activeMeta.status ? ` · ${activeMeta.status}` : ''}
            </div>
            {activeMeta.description && (
              <div className="mt-0.5 line-clamp-2 text-muted-foreground/80">
                {activeMeta.description}
              </div>
            )}
            {activeNeighbours.length > 0 && (
              <div className="mt-0.5 text-muted-foreground/80">
                → {activeNeighbours.map((n) => `${truncate(n.label, 18)} (${n.type})`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* The canvas is not reachable by keyboard or screen reader, so the same
          information is also present as text. Not a fallback — the primary
          accessible representation of the same data. */}
      <ul className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground">
        {nodes.map((n) => (
          <li key={n.id} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelected((p) => (p === n.id ? null : n.id))}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              aria-pressed={selected === n.id}
              className={cn(
                'inline-flex items-center gap-1 rounded px-0.5 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                selected === n.id && 'bg-primary/15 text-foreground'
              )}
            >
              <span
                aria-hidden="true"
                className="inline-block size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: styleFor(n.category).fill }}
              />
              {truncate(n.label, 24)}
              {n.id === root && <span className="text-primary">(this SPA)</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

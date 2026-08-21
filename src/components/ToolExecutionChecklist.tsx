import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────
interface ChecklistItem {
  id: string;
  toolName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  durationMs?: number;
  createdAt: number; // Date.now()
}

interface ToolExecutionChecklistProps {
  sessionId: string;
}

// ── Helpers ────────────────────────────────────────────────────────
const STATUS_ICON: Record<ChecklistItem['status'], string> = {
  pending: '○',
  running: '◌',
  success: '✓',
  failed: '✗',
};

const STATUS_COLOR: Record<ChecklistItem['status'], string> = {
  pending: 'text-amber-600/60',
  running: 'text-amber-700',
  success: 'text-emerald-600',
  failed: 'text-rose-600',
};

const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-2', '-rotate-2', 'rotate-0'];

// ── Component ──────────────────────────────────────────────────────
export const ToolExecutionChecklist = ({ sessionId }: ToolExecutionChecklistProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Schedule removal after 30s
  const scheduleRemoval = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      timersRef.current.delete(id);
    }, 30_000);

    timersRef.current.set(id, timer);
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  // Subscribe to eliza_activity_log INSERT events
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`tool-checklist-${sessionId}`)
      .on<Record<string, any>>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'eliza_activity_log',
          filter: `agent_id=eq.ai-chat`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          const row = payload.new;
          if (!row || !row.activity_type?.startsWith('tool_')) return;

          // Only show items matching this session
          if (row.task_id !== sessionId) return;

          const activityType: string = row.activity_type;
          const toolName: string = row.metadata?.tool_name || row.title?.replace(/^[○◌✓✗🔧⚙️✅❌]\s*/, '') || 'Unknown';
          const status = activityType.replace('tool_', '') as ChecklistItem['status'];
          const durationMs: number | undefined = row.metadata?.duration_ms ?? undefined;

          setItems((prev) => {
            // For pending/running, replace any existing entry for same tool
            if (status === 'pending' || status === 'running') {
              const existing = prev.find(
                (i) => i.toolName === toolName && (i.status === 'pending' || i.status === 'running')
              );
              if (existing) {
                return prev.map((i) =>
                  i.id === existing.id
                    ? { ...i, status, durationMs, createdAt: Date.now() }
                    : i
                );
              }
            }

            // For success/failed, update the matching running/pending item
            if (status === 'success' || status === 'failed') {
              const existing = prev.find(
                (i) => i.toolName === toolName && (i.status === 'pending' || i.status === 'running')
              );
              if (existing) {
                const updated = prev.map((i) =>
                  i.id === existing.id
                    ? { ...i, status, durationMs, createdAt: Date.now() }
                    : i
                );
                // Schedule removal for completed items
                const completed = updated.find((i) => i.id === existing.id);
                if (completed) scheduleRemoval(completed.id);
                return updated;
              }
            }

            // New item
            const newItem: ChecklistItem = {
              id: `${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              toolName,
              status,
              durationMs,
              createdAt: Date.now(),
            };

            // Schedule removal for terminal states
            if (status === 'success' || status === 'failed') {
              scheduleRemoval(newItem.id);
            }

            return [...prev, newItem];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, scheduleRemoval]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-2 top-24 z-50 sm:absolute sm:right-6 sm:top-36 sm:z-40">
      <div className="relative">
        {items.map((item, index) => {
          const rotation = ROTATIONS[index % ROTATIONS.length];
          const isTerminal = item.status === 'success' || item.status === 'failed';

          return (
            <div
              key={item.id}
              className={`absolute right-0 w-[140px] rounded-[2px] border bg-gradient-to-br p-2.5 shadow-[0_14px_32px_rgba(120,93,10,0.18)] transition-all duration-500 sm:w-[170px] sm:p-3 ${rotation} ${
                item.status === 'failed'
                  ? 'border-rose-400/80 from-rose-200/95 via-red-100 to-rose-50 shadow-[0_14px_32px_rgba(127,29,29,0.22)]'
                  : 'border-amber-300/70 from-yellow-100 via-amber-50 to-yellow-50'
              } ${isTerminal ? 'opacity-80' : 'opacity-100'}`}
              style={{
                top: `${index * 78}px`,
                zIndex: Math.max(50 - index * 5, 1),
              }}
              aria-hidden="true"
            >
              {/* Pin dot */}
              <div
                className={`absolute left-1/2 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_3px_rgba(120,93,10,0.18)] sm:h-3.5 sm:w-3.5 ${
                  item.status === 'failed' ? 'bg-rose-100/90' : 'bg-amber-50/80'
                }`}
              />

              {/* Content */}
              <div className="mt-3 border-t border-amber-500/15 pt-2">
                {/* Status row */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${STATUS_COLOR[item.status]}`}>
                    {STATUS_ICON[item.status]}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-900/70 sm:text-[10px]">
                    Tool
                  </span>
                </div>

                {/* Tool name */}
                <p className="mt-0.5 text-[10px] font-medium leading-snug text-amber-950/90 sm:text-[11px]">
                  {item.toolName}
                </p>

                {/* Duration */}
                {item.durationMs !== undefined && (
                  <p className="mt-0.5 text-[8px] font-mono text-amber-700/60 sm:text-[9px]">
                    {item.durationMs < 1000
                      ? `${item.durationMs}ms`
                      : `${(item.durationMs / 1000).toFixed(1)}s`}
                  </p>
                )}

                {/* Spinning indicator for running */}
                {item.status === 'running' && (
                  <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-amber-200/50">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-400/60" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolExecutionChecklist;

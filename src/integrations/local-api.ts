// ─────────────────────────────────────────────────────────────
// Local Suite API — drop-in replacement for cloud Supabase
// for tasks, agents, and activity log in the STAE visualizer.
// All calls go to the local relay at /api/suite/*.
// ─────────────────────────────────────────────────────────────

import { relayAuthHeaders } from '@/integrations/relay-auth';

interface LocalResponse<T> {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
}

// ── Tasks ──────────────────────────────────────────────────────

export async function fetchTasks(options?: {
  organization_id?: string;
  no_org?: boolean;
  status_in?: string[];
  assignee_agent_id?: string;
  limit?: number;
  offset?: number;
}): Promise<LocalResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.organization_id) params.set('organization_id', options.organization_id);
    if (options?.no_org) params.set('no_org', 'true');
    if (options?.status_in?.length) params.set('status_in', options.status_in.join(','));
    if (options?.assignee_agent_id) params.set('assignee_agent_id', options.assignee_agent_id);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const qs = params.toString();
    const res = await fetch(`/api/suite/tasks${qs ? '?' + qs : ''}`, { headers: relayAuthHeaders() });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

export async function fetchTaskById(id: string): Promise<LocalResponse<any>> {
  try {
    const res = await fetch(`/api/suite/tasks/${id}`, { headers: relayAuthHeaders() });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

export async function createTask(data: Record<string, any>): Promise<LocalResponse<any>> {
  try {
    const res = await fetch('/api/suite/tasks', {
      method: 'POST',
      headers: relayAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const json = await res.json();
    return { data: json, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

export async function updateTask(id: string, data: Record<string, any>): Promise<LocalResponse<any>> {
  try {
    const res = await fetch(`/api/suite/tasks/${id}`, {
      method: 'PATCH',
      headers: relayAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const json = await res.json();
    return { data: json, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

export async function deleteTask(id: string): Promise<LocalResponse<null>> {
  try {
    const res = await fetch(`/api/suite/tasks/${id}`, { method: 'DELETE', headers: relayAuthHeaders() });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    return { data: null, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

// ── Agents ─────────────────────────────────────────────────────

export async function fetchAgents(options?: {
  status_in?: string[];
}): Promise<LocalResponse<any[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.status_in?.length) params.set('status_in', options.status_in.join(','));
    const qs = params.toString();
    const res = await fetch(`/api/suite/agents${qs ? '?' + qs : ''}`, { headers: relayAuthHeaders() });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

// ── Activity Log — POST to relay to keep a record ─────────────────

export async function createActivityLog(entry: {
  activity_type: string;
  title: string;
  description?: string;
  status?: string;
  task_id?: string | null;
  agent_id?: string | null;
  metadata?: Record<string, any>;
}): Promise<LocalResponse<any>> {
  try {
    // POST to the /api/suite/activity-log endpoint (inline if not yet defined, fallback to no-op)
    const res = await fetch('/api/suite/activity-log', {
      method: 'POST',
      headers: relayAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(entry),
    });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const json = await res.json();
    return { data: json, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

export async function updateAgent(id: string, data: Record<string, any>): Promise<LocalResponse<any>> {
  try {
    const res = await fetch(`/api/suite/agents/${id}`, {
      method: 'PATCH',
      headers: relayAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const json = await res.json();
    return { data: json, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

// ── Polling subscriptions (replaces Supabase realtime channels) ──

export function subscribeTasks(
  callback: (payload: { eventType: string; new: any }) => void,
  intervalMs: number = 3000
): () => void {
  let knownIds = new Set<string>();
  const tick = async () => {
    const { data } = await fetchTasks({ status_in: ['PENDING', 'IN_PROGRESS', 'CLAIMED', 'BLOCKED'], limit: 50 });
    if (!data) return;
    for (const task of data) {
      if (!knownIds.has(task.id)) {
        knownIds.add(task.id);
        callback({ eventType: 'INSERT', new: task });
      }
    }
    // Check for updates: compare tasks we previously knew
    // Simple approach: just fire UPDATE for every task in the current set (component handles dedup via filter)
    // Actually the component's handler already does setTasks(prev => ...filter...) so this is fine
    for (const task of data) {
      callback({ eventType: 'UPDATE', new: task });
    }
  };
  tick(); // immediate first tick
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}

export function subscribeAgents(
  callback: (payload: { eventType: string; new: any }) => void,
  intervalMs: number = 5000
): () => void {
  let knownIds = new Set<string>();
  const tick = async () => {
    const { data } = await fetchAgents({ status_in: ['IDLE', 'BUSY', 'OFFLINE', 'ERROR', 'ARCHIVED', 'UNKNOWN'] });
    if (!data) return;
    for (const agent of data) {
      if (!knownIds.has(agent.id)) {
        knownIds.add(agent.id);
        callback({ eventType: 'INSERT', new: agent });
      }
    }
    for (const agent of data) {
      callback({ eventType: 'UPDATE', new: agent });
    }
  };
  tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}

// ── Dashboard stats ─────────────────────────────────────────────

function formatBytesShort(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return 'unknown size';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export async function fetchDashboardStats(): Promise<{
  activeAgents: number;
  activeTasks: number;
  totalExecutions: number;
  totalExecutionsIsEstimate: boolean;
  executionsLast24h: number;
  knowledgeEntitiesTotal: number;
  userContextKnowledge: number;
  userWorkflows: number;
  healthScore: number;
  healthStatus: 'healthy' | 'degraded' | 'critical' | 'unknown';
  healthIssues: string[];
}> {
  const defaults = {
    activeAgents: 0,
    activeTasks: 0,
    totalExecutions: 0,
    totalExecutionsIsEstimate: false,
    executionsLast24h: 0,
    knowledgeEntitiesTotal: 0,
    userContextKnowledge: 0,
    userWorkflows: 0,
    healthScore: 0,
    healthStatus: 'unknown' as 'healthy' | 'degraded' | 'critical' | 'unknown',
    healthIssues: [] as string[],
  };

  try {
    // Health and the counts come from the same relay telemetry endpoint the
    // Nexus panel uses, so the two panels can never disagree.
    //
    // Previously: health came from /api/suite/health, whose body is
    // {ok, companies} — it has no health_score or status field, so every read
    // missed and `healthScore` fell back to the literal 100 below. That is why
    // the dashboard showed "System Health 100%" unconditionally: it was a
    // default, not a measurement. The score is now derived from signals that
    // are actually reported, and unknown when they are missing.
    const [tasksRes, agentsRes, teleRes] = await Promise.all([
      fetch('/api/suite/tasks?status_in=PENDING,IN_PROGRESS,CLAIMED,BLOCKED', { headers: relayAuthHeaders() }),
      fetch('/api/suite/agents?status_in=IDLE,BUSY', { headers: relayAuthHeaders() }),
      fetch('/api/suite/telemetry', { headers: relayAuthHeaders() }),
    ]);

    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    const agents = agentsRes.ok ? await agentsRes.json() : [];
    const tele = teleRes.ok ? await teleRes.json() : null;
    const stats = tele?.stats ?? null;
    const storage = tele?.storage ?? null;
    const wf = tele?.workflows ?? null;

    const healthIssues: string[] = [];

    // Health is scored only from signals that are actually reported.
    //
    // It previously leaned on a "reclaimable bytes" figure that turned out to
    // be TOAST storage — live jsonb payloads, not free space. A VACUUM run
    // against the three worst tables reclaimed 0.2MB, so the penalty was
    // charging the system for data it legitimately holds. Replaced with two
    // things that are true and actionable: how much of the database is index
    // overhead (measured, and reducible), and whether scheduled work is
    // failing.
    const indexPct = storage?.totals?.indexPctOfDatabase ?? 0;
    const failedJobs = wf?.lastRunFailed ?? 0;
    const jobsWithFailures = wf?.withFailures ?? 0;

    if (indexPct >= 25) {
      healthIssues.push(
        `${indexPct}% of the database is indexes (${formatBytesShort(storage?.totals?.indexBytes)})`
      );
    }
    if (failedJobs > 0) {
      healthIssues.push(`${failedJobs} scheduled job(s) failed on last run`);
    }

    let healthScore = 0;
    let healthStatus: 'healthy' | 'degraded' | 'critical' | 'unknown' = 'unknown';
    if (storage || wf || stats) {
      // An absent signal costs points rather than being read as "fine".
      let penalty = 0;
      penalty += Math.min(40, Math.round(indexPct));
      penalty += Math.min(30, failedJobs * 10);
      penalty += jobsWithFailures > 0 ? 10 : 0;
      healthScore = Math.max(0, 100 - penalty);
      healthStatus =
        healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'critical';
    }

    return {
      ...defaults,
      activeAgents: Array.isArray(agents) ? agents.length : 0,
      activeTasks: Array.isArray(tasks) ? tasks.length : 0,
      totalExecutions: stats?.executions?.lifetime ?? 0,
      totalExecutionsIsEstimate: !!stats?.executions?.lifetimeIsEstimate,
      executionsLast24h: stats?.executions?.last24h ?? 0,
      knowledgeEntitiesTotal: stats?.knowledgeEntities ?? 0,
      // shared_context is what the old /api/suite/knowledge-stats would have
      // returned had it existed; it never did — that path 404s.
      userContextKnowledge: stats?.sharedContext ?? 0,
      userWorkflows: stats?.workflows?.templates ?? 0,
      healthScore,
      healthStatus,
      healthIssues,
    };
  } catch (e) {
    return defaults;
  }
}

// ── Knowledge stats ─────────────────────────────────────────────

export async function fetchKnowledgeStats(): Promise<{
  knowledgeEntitiesTotal: number;
  userContextKnowledge: number;
  userWorkflows: number;
}> {
  try {
    const [entitiesRes, workflowsRes] = await Promise.all([
      fetch('/api/suite/knowledge-stats', { headers: relayAuthHeaders() }),
      fetch('/api/suite/workflow-stats', { headers: relayAuthHeaders() }),
    ]);
    const entities = entitiesRes.ok ? await entitiesRes.json() : {};
    const workflows = workflowsRes.ok ? await workflowsRes.json() : {};
    return {
      knowledgeEntitiesTotal: entities.total ?? 0,
      userContextKnowledge: entities.userContext ?? 0,
      userWorkflows: workflows.active ?? 0,
    };
  } catch {
    return { knowledgeEntitiesTotal: 0, userContextKnowledge: 0, userWorkflows: 0 };
  }
}
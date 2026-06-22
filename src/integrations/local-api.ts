// ─────────────────────────────────────────────────────────────
// Local Suite API — drop-in replacement for cloud Supabase
// for tasks, agents, and activity log in the STAE visualizer.
// All calls go to the local relay at /api/suite/*.
// ─────────────────────────────────────────────────────────────

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
    const res = await fetch(`/api/suite/tasks${qs ? '?' + qs : ''}`);
    if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message } };
  }
}

export async function fetchTaskById(id: string): Promise<LocalResponse<any>> {
  try {
    const res = await fetch(`/api/suite/tasks/${id}`);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/suite/tasks/${id}`, { method: 'DELETE' });
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
    const res = await fetch(`/api/suite/agents${qs ? '?' + qs : ''}`);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

export async function fetchDashboardStats(): Promise<{
  activeAgents: number;
  activeTasks: number;
  totalExecutions: number;
  knowledgeEntitiesTotal: number;
  userContextKnowledge: number;
  userWorkflows: number;
  healthScore: number;
  healthStatus: string;
  healthIssues: string[];
}> {
  const defaults = {
    activeAgents: 0,
    activeTasks: 0,
    totalExecutions: 0,
    knowledgeEntitiesTotal: 0,
    userContextKnowledge: 0,
    userWorkflows: 0,
    healthScore: 100,
    healthStatus: 'healthy' as string,
    healthIssues: [] as string[],
  };

  try {
    const [tasksRes, agentsRes, healthRes] = await Promise.all([
      fetch('/api/suite/tasks?status_in=PENDING,IN_PROGRESS,CLAIMED,BLOCKED'),
      fetch('/api/suite/agents?status_in=IDLE,BUSY'),
      fetch('/api/suite/health'),
    ]);

    const tasks = tasksRes.ok ? await tasksRes.json() : [];
    const agents = agentsRes.ok ? await agentsRes.json() : [];
    let healthScore = 100, healthStatus = 'healthy', healthIssues: string[] = [];

    if (healthRes.ok) {
      const h = await healthRes.json();
      healthScore = h.health_score ?? 100;
      healthStatus = h.status ?? 'healthy';
      if (h.issues_count && h.issues_count > 0) {
        healthIssues = [`${h.issues_count} issue(s) detected`];
      }
    }

    return {
      ...defaults,
      activeAgents: Array.isArray(agents) ? agents.length : 0,
      activeTasks: Array.isArray(tasks) ? tasks.length : 0,
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
      fetch('/api/suite/knowledge-stats'),
      fetch('/api/suite/workflow-stats'),
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
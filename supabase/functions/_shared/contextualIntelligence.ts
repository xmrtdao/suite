export interface ContextResolutionInput {
  explicitContext?: string | null;
  directive?: string | null;
  inferredContext?: string | null;
  storedContext?: string | null;
  profileDefaultContext?: string | null;
}

export interface ContextResolutionResult {
  activeContext: string;
  source: 'explicit' | 'directive' | 'stored' | 'profile' | 'inferred' | 'fallback';
  confidence: number;
}

const CONTEXT_KEYWORD_MAP: Array<{ context: string; keywords: string[] }> = [
  { context: 'XMRT-DAO Governance', keywords: ['dao', 'proposal', 'vote', 'governance', 'treasury', 'council'] },
  { context: 'Infrastructure Development', keywords: ['infra', 'infrastructure', 'deploy', 'vercel', 'supabase', 'migration', 'edge function'] },
  { context: 'Agent Operations', keywords: ['agent', 'agents', 'task', 'assignment', 'workflow', 'delegate'] },
  { context: 'Project Alpha Marketing', keywords: ['marketing', 'campaign', 'brand', 'social', 'content', 'growth'] },
  { context: 'Knowledge & Memory', keywords: ['memory', 'recall', 'knowledge', 'remember', 'context'] },
];

export function normalizeContextName(value?: string | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized.slice(0, 120) : null;
}

export function parseContextDirective(message?: string | null): string | null {
  if (!message) return null;
  const trimmed = message.trim();
  const patterns = [
    /(?:switch|set|change)\s+(?:to\s+)?(?:the\s+)?context\s*(?:to|as)?\s*[:\-]?\s*"([^"]+)"/i,
    /(?:switch|set|change)\s+to\s+"([^"]+)"\s+context/i,
    /(?:context|workspace|lens)\s*[:=]\s*([^\n]+)/i,
    /in\s+(?:the\s+)?([a-z0-9\-\s]{3,80})\s+context/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return normalizeContextName(match[1]);
    }
  }

  return null;
}

export function inferContextFromText(inputText: string, history: any[] = []): { context: string | null; confidence: number; signals: string[] } {
  const fullText = [inputText, ...history.slice(-4).map(m => m?.content || '')]
    .join(' ')
    .toLowerCase();

  let best: { context: string | null; confidence: number; signals: string[] } = {
    context: null,
    confidence: 0,
    signals: [],
  };

  for (const candidate of CONTEXT_KEYWORD_MAP) {
    const hits = candidate.keywords.filter((k) => fullText.includes(k));
    if (hits.length === 0) continue;

    const confidence = Math.min(0.95, 0.35 + hits.length * 0.15);
    if (confidence > best.confidence) {
      best = {
        context: candidate.context,
        confidence,
        signals: hits,
      };
    }
  }

  return best;
}

export function resolveActiveContext(input: ContextResolutionInput): ContextResolutionResult {
  const explicit = normalizeContextName(input.explicitContext);
  if (explicit) return { activeContext: explicit, source: 'explicit', confidence: 1 };

  const directive = normalizeContextName(input.directive);
  if (directive) return { activeContext: directive, source: 'directive', confidence: 0.98 };

  const stored = normalizeContextName(input.storedContext);
  if (stored) return { activeContext: stored, source: 'stored', confidence: 0.92 };

  const profile = normalizeContextName(input.profileDefaultContext);
  if (profile) return { activeContext: profile, source: 'profile', confidence: 0.9 };

  const inferred = normalizeContextName(input.inferredContext);
  if (inferred) return { activeContext: inferred, source: 'inferred', confidence: 0.75 };

  return { activeContext: 'General', source: 'fallback', confidence: 0.5 };
}

export function buildContextLensBlock(resolved: ContextResolutionResult, signals: string[] = []): string {
  const signalText = signals.length > 0 ? signals.join(', ') : 'none';
  return `## 🧭 CONTEXTUAL INTELLIGENCE LAYER\n\n` +
    `Active context: **${resolved.activeContext}**\n` +
    `Selection source: **${resolved.source}**\n` +
    `Confidence: **${(resolved.confidence * 100).toFixed(0)}%**\n` +
    `Signals: ${signalText}\n\n` +
    `Rules:\n` +
    `- Prioritize memories and tool outputs that match the active context first.\n` +
    `- Reuse recent tool outputs from this context before re-running the same tool.\n` +
    `- If the user asks to switch context, confirm once and immediately apply it.\n` +
    `- If confidence is low and answer quality would suffer, ask a brief context-clarifying question.\n`;
}

export function buildRecentEntityRecallBlock(toolResults: any[]): string {
  if (!toolResults || toolResults.length === 0) return '';

  const recent = toolResults.slice(-15).reverse();
  const agents = new Map<string, string>();
  const tasks = new Map<string, string>();

  for (const tool of recent) {
    const result = tool?.result;
    if (!result || result.success === false) continue;

    const toolAgents = Array.isArray(result.agents) ? result.agents : [];
    for (const agent of toolAgents) {
      const id = String(agent?.id || agent?.agent_id || '').trim();
      if (!id) continue;
      agents.set(id, String(agent?.name || agent?.display_name || 'unknown'));
    }

    const toolTasks = Array.isArray(result.tasks) ? result.tasks : [];
    for (const task of toolTasks) {
      const id = String(task?.id || task?.task_id || '').trim();
      if (!id) continue;
      tasks.set(id, String(task?.title || task?.name || 'untitled'));
    }
  }

  if (agents.size === 0 && tasks.size === 0) return '';

  let block = '### ⚡ SHORT-TERM RECALL CACHE\n';
  block += 'Use these IDs directly when the user references recently listed entities.\n';

  if (agents.size > 0) {
    block += `- Recent agent IDs (${agents.size}): ${Array.from(agents.entries()).slice(0, 8).map(([id, name]) => `${id} (${name})`).join(', ')}\n`;
  }

  if (tasks.size > 0) {
    block += `- Recent task IDs (${tasks.size}): ${Array.from(tasks.entries()).slice(0, 8).map(([id, title]) => `${id} (${title})`).join(', ')}\n`;
  }

  block += '\n';
  return block;
}

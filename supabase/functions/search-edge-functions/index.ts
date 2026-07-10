import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const FUNCTION_NAME = 'search-edge-functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RegistryFunction = {
  name: string;
  url: string;
  description: string;
  capabilities: string[];
  category: string;
  example_use: string;
  required_params?: string[];
  supported_actions?: Array<{ name: string; description: string; required: string[]; optional?: string[] }>;
  example_payload?: Record<string, unknown>;
  notes?: string[];
};

type UsageTracker = {
  success: (metadata?: Record<string, unknown>) => Promise<void>;
  failure: (errorMessage: string, statusCode?: number) => Promise<void>;
};

const FALLBACK_FUNCTIONS: RegistryFunction[] = [
  {
    name: 'search-edge-functions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/search-edge-functions',
    description: 'Semantic and keyword search across edge functions, with full registry mode.',
    capabilities: ['find edge functions', 'search by capability', 'list full function registry'],
    category: 'ecosystem',
    example_use: '{"query":"github issue automation"}',
    required_params: ['query'],
  },
  {
    name: 'list-available-functions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/list-available-functions',
    description: 'List deployed edge functions and categories.',
    capabilities: ['list all functions', 'filter by category'],
    category: 'ecosystem',
    example_use: 'GET /functions/v1/list-available-functions',
  },
  {
    name: 'universal-edge-invoker',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/universal-edge-invoker',
    description: 'Invoke any registered edge function via a single interface.',
    capabilities: ['invoke edge function', 'dynamic routing'],
    category: 'ecosystem',
    example_use: '{"function_name":"system-health","payload":{}}',
  },
  {
    name: 'python-executor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/python-executor',
    description: 'Run Python code with controlled execution context and tool access.',
    capabilities: ['execute python', 'tool orchestration'],
    category: 'code-execution',
    example_use: '{"code":"print(42)"}',
  },
  {
    name: 'github-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/github-integration',
    description: 'Manage GitHub repositories, issues, PRs, and file operations.',
    capabilities: ['create issue', 'create pull request', 'read/write repository files'],
    category: 'github',
    example_use: '{"action":"create_issue","owner":"org","repo":"repo","title":"Bug"}',
  },
  {
    name: 'system-health',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/system-health',
    description: 'Check overall platform and dependency health status.',
    capabilities: ['health checks', 'status diagnostics'],
    category: 'monitoring',
    example_use: '{"scope":"full"}',
  }
];

function makeUsageTracker(functionName: string, req: Request): UsageTracker {
  const startedAt = Date.now();

  const getExecutionSource = (): string => {
    const schedulerHeader = req.headers.get('x-supabase-scheduler');
    if (schedulerHeader === 'true' || schedulerHeader === '1') return 'supabase_native';

    const vercelCron = req.headers.get('x-vercel-cron');
    if (vercelCron === '1' || vercelCron === 'true') return 'vercel_cron';

    const userAgent = req.headers.get('user-agent') || '';
    if (userAgent.includes('pg_net') || userAgent.includes('PostgreSQL')) return 'pg_cron';

    return 'api';
  };

  const writeLog = async (payload: Record<string, unknown>) => {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !serviceRoleKey) return;

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      await supabase.from('eliza_function_usage').insert(payload);
    } catch (error) {
      console.warn('⚠️ Usage logging skipped:', error instanceof Error ? error.message : String(error));
    }
  };

  return {
    success: async (metadata = {}) => {
      await writeLog({
        function_name: functionName,
        success: true,
        execution_time_ms: Date.now() - startedAt,
        invoked_by: 'system',
        parameters: metadata,
        metadata,
        execution_source: getExecutionSource(),
        deployment_version:
          Deno.env.get('DEPLOYMENT_VERSION') ||
          Deno.env.get('VERCEL_GIT_COMMIT_REF') ||
          new Date().toISOString().split('T')[0],
        deployment_id: Deno.env.get('DEPLOYMENT_ID') || Deno.env.get('VERCEL_DEPLOYMENT_ID'),
        git_commit_hash: Deno.env.get('GIT_COMMIT_SHA') || Deno.env.get('VERCEL_GIT_COMMIT_SHA'),
      });
    },
    failure: async (errorMessage: string, statusCode = 500) => {
      await writeLog({
        function_name: functionName,
        success: false,
        execution_time_ms: Date.now() - startedAt,
        invoked_by: 'system',
        error_message: errorMessage,
        metadata: { status_code: statusCode },
        execution_source: getExecutionSource(),
        deployment_version:
          Deno.env.get('DEPLOYMENT_VERSION') ||
          Deno.env.get('VERCEL_GIT_COMMIT_REF') ||
          new Date().toISOString().split('T')[0],
        deployment_id: Deno.env.get('DEPLOYMENT_ID') || Deno.env.get('VERCEL_DEPLOYMENT_ID'),
        git_commit_hash: Deno.env.get('GIT_COMMIT_SHA') || Deno.env.get('VERCEL_GIT_COMMIT_SHA'),
      });
    },
  };
}

async function loadRegistry(): Promise<RegistryFunction[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return FALLBACK_FUNCTIONS;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/list-available-functions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
        'x-forwarded-by': FUNCTION_NAME,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.warn(`⚠️ list-available-functions returned ${response.status}; using fallback registry`);
      return FALLBACK_FUNCTIONS;
    }

    const payload = await response.json();
    const functions = Array.isArray(payload?.functions) ? payload.functions : [];

    const normalized = functions
      .filter((fn: any) => fn && typeof fn.name === 'string')
      .map((fn: any): RegistryFunction => ({
        name: fn.name,
        url: fn.url ?? `${supabaseUrl}/functions/v1/${fn.name}`,
        description: typeof fn.description === 'string' ? fn.description : `Edge function: ${fn.name}`,
        capabilities: Array.isArray(fn.capabilities)
          ? fn.capabilities.filter((value: unknown) => typeof value === 'string')
          : [],
        category: typeof fn.category === 'string' ? fn.category : 'ecosystem',
        example_use: typeof fn.example_use === 'string' ? fn.example_use : `Invoke ${fn.name}`,
        required_params: Array.isArray(fn.required_params)
          ? fn.required_params.filter((value: unknown) => typeof value === 'string')
          : undefined,
        supported_actions: Array.isArray(fn.supported_actions) ? fn.supported_actions : undefined,
        example_payload: typeof fn.example_payload === 'object' && fn.example_payload !== null
          ? fn.example_payload
          : undefined,
        notes: Array.isArray(fn.notes)
          ? fn.notes.filter((value: unknown) => typeof value === 'string')
          : undefined,
      }));

    if (normalized.length > 0) {
      return normalized;
    }

    return FALLBACK_FUNCTIONS;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to load registry dynamically: ${message}`);
    return FALLBACK_FUNCTIONS;
  }
}

const stopWords = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'your', 'you',
  'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should',
  'can', 'ensure', 'add', 'such', 'even', 'if', 'not', 'found', 'item', 'task',
  'steps', 'step', 'mechanism', 'using', 'use', 'execute', 'plan', 'help', 'please'
]);

function normalizeToken(token: string): string {
  const cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  if (cleaned.length <= 3) return cleaned;

  const suffixes = ['ization', 'ation', 'ition', 'ments', 'ment', 'ions', 'ion', 'ing', 'ed', 'es', 's'];
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix) && cleaned.length - suffix.length >= 4) {
      return cleaned.slice(0, -suffix.length);
    }
  }
  return cleaned;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((token) => normalizeToken(token))
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function scoreFunction(fn: RegistryFunction, queryLower: string, queryTokens: string[]): number {
  if (queryTokens.length === 0 && !queryLower) return 1;

  const tokenSet = new Set(queryTokens);
  const includesQueryOrToken = (value: string): boolean => {
    const normalized = value.toLowerCase();
    if (queryLower && normalized.includes(queryLower)) return true;
    return tokenize(value).some((token) => tokenSet.has(token));
  };

  const fieldTokenOverlap = (value: string): number => {
    const fieldTokens = tokenize(value);
    if (fieldTokens.length === 0 || queryTokens.length === 0) return 0;
    const overlap = fieldTokens.filter((token) => tokenSet.has(token)).length;
    return overlap / Math.max(queryTokens.length, fieldTokens.length);
  };

  let score = 0;

  if (queryLower && fn.name.toLowerCase() === queryLower) score += 100;
  else if (includesQueryOrToken(fn.name)) score += 50;

  if (includesQueryOrToken(fn.description)) score += 30;
  score += Math.round(fieldTokenOverlap(fn.description) * 35);

  const capabilityMatch = fn.capabilities.some((cap) => includesQueryOrToken(cap));
  if (capabilityMatch) score += 40;

  const capabilityOverlapScore = fn.capabilities
    .map((cap) => fieldTokenOverlap(cap))
    .reduce((max, current) => Math.max(max, current), 0);
  score += Math.round(capabilityOverlapScore * 45);

  if (includesQueryOrToken(fn.example_use)) score += 20;
  score += Math.round(fieldTokenOverlap(fn.example_use) * 20);

  return score;
}

Deno.serve(async (req) => {
  const usageTracker = makeUsageTracker(FUNCTION_NAME, req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = typeof body?.mode === 'string' ? body.mode : 'search';
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const category = typeof body?.category === 'string' && body.category.trim().length > 0
      ? body.category.trim()
      : undefined;
    const limit = typeof body?.limit === 'number' && Number.isFinite(body.limit) ? body.limit : undefined;

    const registry = await loadRegistry();
    const scoped = category
      ? registry.filter((fn) => fn.category.toLowerCase() === category.toLowerCase())
      : registry;

    const maxResults = limit && limit > 0 ? Math.min(limit, 100) : 25;
    const wantsFullRegistry = mode === 'full_registry' || mode === 'list_all' || query.length === 0;

    let results = scoped;

    if (!wantsFullRegistry) {
      const queryLower = query.toLowerCase();
      const queryTokens = tokenize(queryLower);

      results = scoped
        .map((fn) => ({ ...fn, relevance_score: scoreFunction(fn, queryLower, queryTokens) }))
        .filter((fn) => (fn.relevance_score ?? 0) > 0)
        .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

      if (results.length === 0 && query.length > 0) {
        results = scoped
          .map((fn) => ({ ...fn, relevance_score: 1 }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    } else {
      results = scoped
        .map((fn) => ({ ...fn, relevance_score: query.length > 0 ? 1 : undefined }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    results = results.slice(0, maxResults);

    console.log(`🔍 search-edge-functions mode=${mode} query="${query}" category=${category ?? 'all'} results=${results.length}`);

    await usageTracker.success({
      mode,
      query,
      category,
      results_count: results.length,
      total_functions_searched: scoped.length,
      returned_fallback_registry: registry === FALLBACK_FUNCTIONS,
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        query,
        category,
        total_functions_searched: scoped.length,
        total_results: results.length,
        results,
        functions: results,
        message: wantsFullRegistry
          ? `Returned ${results.length} function(s) from registry`
          : `Found ${results.length} matching function(s) for "${query}"`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error searching edge functions:', message);
    await usageTracker.failure(message, 500);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

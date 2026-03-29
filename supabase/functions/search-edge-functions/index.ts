import { EDGE_FUNCTIONS_REGISTRY } from '../_shared/edgeFunctionRegistry.ts';
import { startUsageTracking } from '../_shared/functionUsageLogger.ts';

const FUNCTION_NAME = 'search-edge-functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, { method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, limit } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Searching edge functions for: "${query}"${category ? ` (category: ${category})` : ''}`);

    // Filter by category if provided
    let functions = category 
      ? EDGE_FUNCTIONS_REGISTRY.filter((f: any) => f.category === category)
      : EDGE_FUNCTIONS_REGISTRY;

    // Search across name, description, capabilities, and example_use
    // with lightweight stemming and token overlap so natural-language checklist
    // items such as "Execute plan" can still match functions with
    // descriptions like "Create execution plan".
    const queryLower = query.toLowerCase().trim();
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'your', 'you',
      'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should',
      'can', 'ensure', 'add', 'such', 'even', 'if', 'not', 'found', 'item', 'task',
      'steps', 'step', 'mechanism', 'using', 'use'
    ]);

    const normalizeToken = (token: string): string => {
      const cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      if (cleaned.length <= 3) return cleaned;

      const suffixes = ['ization', 'ation', 'ition', 'ments', 'ment', 'ions', 'ion', 'ing', 'ed', 'es', 's'];
      for (const suffix of suffixes) {
        if (cleaned.endsWith(suffix) && cleaned.length - suffix.length >= 4) {
          return cleaned.slice(0, -suffix.length);
        }
      }

      return cleaned;
    };

    const tokenize = (value: string): string[] => value
      .toLowerCase()
      .split(/\s+/)
      .map((token: string) => normalizeToken(token))
      .filter((token: string) => token.length >= 3 && !stopWords.has(token));

    const queryTokens = tokenize(queryLower);
    const queryTokenSet = new Set(queryTokens);
    const maxResults = typeof limit === 'number' && limit > 0
      ? Math.min(limit, 25)
      : 10;

    const fieldTokenOverlap = (value: string): number => {
      const fieldTokens = tokenize(value);
      if (fieldTokens.length === 0 || queryTokens.length === 0) return 0;
      const overlap = fieldTokens.filter((token) => queryTokenSet.has(token)).length;
      return overlap / Math.max(queryTokens.length, fieldTokens.length);
    };

    const includesQueryOrToken = (value: string): boolean => {
      const normalized = value.toLowerCase();
      if (normalized.includes(queryLower)) return true;

      const valueTokens = tokenize(value);
      return valueTokens.some((token) => queryTokenSet.has(token));
    };

    const results = functions
      .map((fn: any) => {
        let score = 0;

        // Exact name match gets highest score
        if (fn.name.toLowerCase() === queryLower) score += 100;
        else if (includesQueryOrToken(fn.name)) score += 50;

        // Description matches (direct + overlap)
        const description = typeof fn.description === 'string' ? fn.description : '';
        if (includesQueryOrToken(description)) score += 30;
        score += Math.round(fieldTokenOverlap(description) * 35);

        // Capability matches
        const capabilities = Array.isArray(fn.capabilities) ? fn.capabilities : [];
        const capabilityMatch = capabilities.some((cap: string) =>
          includesQueryOrToken(cap)
        );
        if (capabilityMatch) score += 40;

        const capabilityOverlapScore = capabilities
          .map((cap: string) => fieldTokenOverlap(cap))
          .reduce((max: number, current: number) => Math.max(max, current), 0);
        score += Math.round(capabilityOverlapScore * 45);

        // Example use matches
        const exampleUse = typeof fn.example_use === 'string' ? fn.example_use : '';
        if (includesQueryOrToken(exampleUse)) score += 20;
        score += Math.round(fieldTokenOverlap(exampleUse) * 20);

        return { ...fn, relevance_score: score };
      })
      .filter((fn: any) => fn.relevance_score > 0)
      .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
      .slice(0, maxResults);

    console.log(`✅ Found ${results.length} matching functions`);
    await usageTracker.success({ query, results_count: results.length });

    return new Response(
      JSON.stringify({
        query,
        category,
        results,
        // Legacy alias for existing callers that expect `functions`
        functions: results,
        total_functions_searched: functions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error searching edge functions:', error);
    await usageTracker.failure(error.message, 500);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

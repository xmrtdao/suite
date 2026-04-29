/**
 * superduper-business-growth — Business Strategist Agent
 * Market research, growth opportunities, competitive analysis
 * Uses: opportunity-scanner, ecosystem-health-check, ai-chat
 *
 * Deploy: supabase functions deploy superduper-business-growth
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhd291Z2R0endtZWp4cWtrcXJqIiwicmlkIjoiMjQwNDQyMjM2MjAwNDQxNjAwIiwic3ViIjoiYW5vbiIsImV4cCI6MTc0NjQ2Njk0Nn0.9XaQZ8XJjqqL-jd5BKAj9U1Z8G4mN6P-9oW3YfT2QkqY'
const BASE = 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1'

async function call(name: string, payload: object): Promise<unknown> {
  const r = await fetch(`${BASE}/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
  })
  return r.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { action, ...params } = await req.json() as { action?: string; task?: string; context?: Record<string, unknown>; [k: string]: unknown }
    switch (action) {
      case 'analyze_market': {
        const [ops, eco] = await Promise.all([
          call('opportunity-scanner', {}) as Promise<{ opportunities?: unknown[] }>,
          call('ecosystem-health-check', {}) as Promise<{ status?: string }>,
        ])
        const opportunities = ops?.opportunities || []
        return jsonResponse({
          action: 'analyze_market',
          market_opportunities: opportunities,
          ecosystem_status: eco?.status,
          recommendations: opportunities.length > 0
            ? `Found ${opportunities.length} opportunities. Top priority: ${(opportunities[0] as { name?: string })?.name || 'unknown'}`
            : 'No opportunities found. Consider expanding mining operations or governance participation.',
          timestamp: new Date().toISOString(),
        })
      }
      case 'find_opportunities': {
        const data = await call('opportunity-scanner', {}) as { opportunities?: unknown[]; count?: number }
        return jsonResponse({
          action: 'find_opportunities',
          opportunities: data?.opportunities || [],
          count: data?.opportunities?.length || 0,
          timestamp: new Date().toISOString(),
        })
      }
      case 'competitive_analysis': {
        const tasks = await call('task-orchestrator', { action: 'performance_report' }) as { report?: unknown }
        return jsonResponse({
          action: 'competitive_analysis',
          summary: 'XMRT-DAO competitive positioning:',
          strengths: ['Decentralized mining infrastructure', 'AI-driven governance (Eliza)', '119 edge functions operational', 'Active treasury management'],
          differentiators: ['AI executive personas for automated decisions', 'Edge function ecosystem vs traditional smart contracts'],
          opportunities: ['Expand AI governance capabilities', 'Integrate more mining pools', 'Grow community participation in proposals'],
          threats: ['Centralized mining pool concentration', 'Regulatory uncertainty around DAO structures', 'Competition from other AI-DAO projects'],
          agent_tasks: tasks,
          timestamp: new Date().toISOString(),
        })
      }
      case 'growth_recommendations': {
        const [ops, gov] = await Promise.all([
          call('opportunity-scanner', {}),
          call('list-function-proposals', {}),
        ])
        return jsonResponse({
          action: 'growth_recommendations',
          short_term: [
            'Configure DEEPSEEK_API_KEY to enable AI-powered social content generation',
            'Fix 8 code-bug functions to restore full operational capacity',
            'Authorize Google Sheets for data-driven decision making',
          ],
          medium_term: [
            'Deploy muapi-media-generator for content creation capabilities',
            'Build Supercuper content-media cinematographer integration',
            'Expand governance participation to increase proposal volume',
          ],
          long_term: [
            'Integrate additional mining pools for hashrate diversity',
            'Build automated treasury investment strategies',
            'Scale AI agent team for 24/7 autonomous operations',
          ],
          opportunities_found: (ops as { count?: number })?.count || 0,
          active_proposals: ((gov as { proposals?: unknown[] })?.proposals || []).length,
          timestamp: new Date().toISOString(),
        })
      }
      default:
        return jsonResponse({
          available_actions: ['analyze_market', 'find_opportunities', 'competitive_analysis', 'growth_recommendations'],
          description: 'Business strategist — market research, opportunities, competitive analysis',
        })
    }
  } catch (e) { return jsonResponse({ error: String(e) }, 500) }
})
function jsonResponse(d: unknown, s = 200): Response { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
/**
 * superduper-router — Supercuper delegation router
 * Routes requests from Eliza to specialist superduper agents.
 * The router that makes the Supercuper team actually work.
 *
 * Usage from Eliza:
 *   POST /functions/v1/superduper-router
 *   {
 *     agent_name: 'content-media',   // maps to superduper-content-media
 *     task: 'Generate a cinematic image of a futuristic city',
 *     context: { ... }               // optional context from Eliza
 *   }
 *
 * Deploy: supabase functions deploy superduper-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhd291Z2R0endtZWp4cWtrcXJqIiwicmlkIjoiMjQwNDQyMjM2MjAwNDQxNjAwIiwic3ViIjoiYW5vbiIsImV4cCI6MTc0NjQ2Njk0Nn0.9XaQZ8XJjqqL-jd5BKAj9U1Z8G4mN6P-9oW3YfT2QkqY'
const BASE_URL = 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1'

// Agent registry — maps agent names to edge functions + their capabilities
const AGENT_REGISTRY: Record<string, {
  function_name: string
  description: string
  capabilities: string[]
  default_action?: string
}> = {
  'content-media': {
    function_name: 'superduper-content-media',
    description: 'Cinematographer — image/video generation, visual content creation',
    capabilities: ['generate_image', 'generate_video', 'generate_slideshow', 'lip_sync', 'list_models', 'estimate_cost'],
  },
  'business-growth': {
    function_name: 'superduper-business-growth',
    description: 'Business Strategist — market research, growth opportunities, competitive analysis',
    capabilities: ['analyze_market', 'find_opportunities', 'competitive_analysis', 'growth_recommendations'],
  },
  'code-architect': {
    function_name: 'superduper-code-architect',
    description: 'Code Architect — architecture review, code quality, best practices',
    capabilities: ['review_code', 'suggest_improvements', 'architecture_design', 'security_audit'],
  },
  'design-brand': {
    function_name: 'superduper-design-brand',
    description: 'Brand Designer — logo concepts, visual identity, brand assets',
    capabilities: ['logo_concepts', 'color_palette', 'brand_guidelines', 'visual_identity'],
  },
  'social-viral': {
    function_name: 'superduper-social-viral',
    description: 'Social Strategist — viral content, community engagement, growth',
    capabilities: ['viral_content', 'engagement_strategy', 'hashtag_analysis', 'community_insights'],
  },
  'finance-investment': {
    function_name: 'superduper-finance-investment',
    description: 'Finance Advisor — treasury management, investment analysis, risk assessment',
    capabilities: ['analyze_treasury', 'investment_recommendations', 'risk_assessment', 'allocation_strategy'],
  },
  'integration': {
    function_name: 'superduper-integration',
    description: 'Integration Specialist — API connections, system interoperability',
    capabilities: ['check_api_health', 'suggest_integrations', 'workflow_automation', 'data_sync'],
  },
  'research-intelligence': {
    function_name: 'superduper-research-intelligence',
    description: 'Research Analyst — deep research, data synthesis, intelligence reports',
    capabilities: ['deep_research', 'synthesize_data', 'competitive_intelligence', 'market_analysis'],
  },
  'development-coach': {
    function_name: 'superduper-development-coach',
    description: 'Dev Coach — code review, learning paths, skill development',
    capabilities: ['code_review', 'learning_path', 'skill_assessment', 'best_practices_teaching'],
  },
  'domain-experts': {
    function_name: 'superduper-domain-experts',
    description: 'Domain Expert — specialized knowledge across fields',
    capabilities: ['answer_expert', 'research_topic', 'explain_concept', 'provide_knowledge'],
  },
  'communication-outreach': {
    function_name: 'superduper-communication-outreach',
    description: 'Comms Specialist — messaging, outreach, stakeholder communication',
    capabilities: ['draft_message', 'outreach_strategy', 'stakeholder_comms', 'tone_advice'],
  },
  // Aliases
  'cinematographer': { function_name: 'superduper-content-media', description: 'Cinematographer', capabilities: ['generate_image', 'generate_video'] },
  'media': { function_name: 'superduper-content-media', description: 'Media', capabilities: ['generate_image', 'generate_video'] },
  'content': { function_name: 'superduper-content-media', description: 'Content', capabilities: ['generate_image', 'generate_video'] },
  'business': { function_name: 'superduper-business-growth', description: 'Business', capabilities: ['analyze_market', 'find_opportunities'] },
  'code': { function_name: 'superduper-code-architect', description: 'Code', capabilities: ['review_code', 'suggest_improvements'] },
  'design': { function_name: 'superduper-design-brand', description: 'Design', capabilities: ['logo_concepts', 'brand_guidelines'] },
  'social': { function_name: 'superduper-social-viral', description: 'Social', capabilities: ['viral_content', 'engagement_strategy'] },
}

interface RouterRequest {
  agent_name: string
  task: string
  context?: Record<string, unknown>
  action?: string
  options?: Record<string, unknown>
}

async function delegateToAgent(functionName: string, task: string, context: Record<string, unknown>, action?: string, options?: Record<string, unknown>): Promise<{ success: boolean; response: unknown; agent: string; latency_ms: number; error?: string }> {
  const start = Date.now()

  // Build the payload to send to the specialist agent
  const payload: Record<string, unknown> = {
    ...(action ? { action } : {}),
    task,
    context,
    ...(options || {}),
  }

  try {
    const resp = await fetch(`${BASE_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    const latency = Date.now() - start
    const data = await resp.json().catch(() => ({}))

    return {
      success: resp.ok,
      response: data,
      agent: functionName,
      latency_ms: latency,
      error: !resp.ok ? `HTTP ${resp.status}` : undefined,
    }
  } catch (e) {
    const latency = Date.now() - start
    return {
      success: false,
      response: null,
      agent: functionName,
      latency_ms: latency,
      error: String(e).slice(0, 200),
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json() as RouterRequest
    const { agent_name, task, context, action, options } = body

    if (!agent_name || !task) {
      // Return available agents
      return jsonResponse({
        available_agents: Object.entries(AGENT_REGISTRY).map(([alias, agent]) => ({
          alias,
          function_name: agent.function_name,
          description: agent.description,
          capabilities: agent.capabilities,
        })),
        usage: {
          agent_name: 'content-media | business-growth | code-architect | design-brand | social-viral | finance-investment | integration | research-intelligence | development-coach | domain-experts | communication-outreach',
          task: 'description of what you need',
          context: '{ ... } (optional context)',
          action: 'specific action (optional)',
          options: '{ ... } (optional additional params)',
        },
        example: {
          agent_name: 'content-media',
          task: 'Generate a cinematic image of a futuristic city at sunset',
          context: { style: 'cyberpunk', resolution: '4k' },
        },
      })
    }

    // Resolve agent
    const resolved = AGENT_REGISTRY[agent_name.toLowerCase()]
    if (!resolved) {
      return jsonResponse({
        error: `Unknown agent: ${agent_name}`,
        available_agents: Object.keys(AGENT_REGISTRY),
        similar_agents: findSimilarAgents(agent_name),
      }, 400)
    }

    // Delegate to the specialist agent
    console.log(`Routing to ${resolved.function_name}: ${task.slice(0, 100)}`)
    const result = await delegateToAgent(resolved.function_name, task, context || {}, action, options)

    return jsonResponse({
      routed_to: resolved.function_name,
      agent_alias: agent_name,
      task,
      ...result,
      available_capabilities: resolved.capabilities,
    }, result.success ? 200 : 502)

  } catch (e) {
    console.error('superdduper-router error:', e)
    return jsonResponse({ error: String(e.message || e) }, 500)
  }
})

function findSimilarAgents(query: string): string[] {
  const q = query.toLowerCase()
  const scores: Array<{ name: string; score: number }> = []

  for (const [alias, agent] of Object.entries(AGENT_REGISTRY)) {
    let score = 0
    if (alias.includes(q)) score += 3
    if (agent.function_name.includes(q)) score += 2
    if (agent.description.toLowerCase().includes(q)) score += 1
    for (const cap of agent.capabilities) {
      if (cap.includes(q)) score += 1
    }
    if (score > 0) scores.push({ name: alias, score })
  }

  return scores.sort((a, b) => b.score - a.score).slice(0, 3).map(s => s.name)
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
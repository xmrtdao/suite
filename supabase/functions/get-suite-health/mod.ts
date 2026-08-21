/**
 * get-suite-health — System health dashboard function
 * Returns comprehensive health status of all XMRT-DAO edge functions
 * and ecosystem components. Designed for dashboard integration.
 *
 * Deploy: supabase functions deploy get-suite-health
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhd291Z2R0endtZWp4cWtrcXJqIiwicmlkIjoiMjQwNDQyMjM2MjAwNDQxNjAwIiwic3ViIjoiYW5vbiIsImV4cCI6MTc0NjQ2Njk0Nn0.9XaQZ8XJjqqL-jd5BKAj9U1Z8G4mN6P-9oW3YfT2QkqY'
const BASE_URL = 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1'

// Functions to health-check (quick probe)
const HEALTH_FUNCTIONS = [
  { name: 'ai-chat', payload: { message: 'status check' }, category: 'AI', critical: true },
  { name: 'mining-proxy', payload: {}, category: 'Mining', critical: true },
  { name: 'ecosystem-health-check', payload: {}, category: 'Ecosystem', critical: true },
  { name: 'system-status', payload: {}, category: 'Monitoring', critical: true },
  { name: 'agent-manager', payload: { action: 'list_agents' }, category: 'Agents', critical: true },
  { name: 'knowledge-manager', payload: { action: 'list_knowledge' }, category: 'Knowledge', critical: false },
  { name: 'list-function-proposals', payload: {}, category: 'Governance', critical: true },
  { name: 'task-orchestrator', payload: { action: 'auto_assign_tasks' }, category: 'Tasks', critical: false },
  { name: 'opportunity-scanner', payload: {}, category: 'Ecosystem', critical: false },
  { name: 'governance-phase-manager', payload: {}, category: 'Governance', critical: false },
]

interface HealthResult {
  name: string
  status: 'ok' | 'degraded' | 'down'
  latency_ms?: number
  error?: string
  data?: Record<string, unknown>
}

async function probeFunction(name: string, payload: object, timeoutMs = 8000): Promise<HealthResult> {
  const start = Date.now()
  try {
    const resp = await fetch(`${BASE_URL}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    })

    const latency = Date.now() - start

    if (resp.ok) {
      const data = await resp.json().catch(() => ({}))
      return { name, status: 'ok', latency_ms: latency, data: data as Record<string, unknown> }
    } else {
      // Try to read error
      const errText = await resp.text().catch(() => '')
      return {
        name,
        status: resp.status >= 500 ? 'down' : 'degraded',
        latency_ms: latency,
        error: `${resp.status}: ${errText.slice(0, 100)}`,
      }
    }
  } catch (e) {
    const latency = Date.now() - start
    const msg = String(e)
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return { name, status: 'down', latency_ms: latency, error: 'Timeout' }
    }
    return { name, status: 'down', latency_ms: latency, error: msg.slice(0, 100) }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Run all health checks in parallel
    const results = await Promise.all(
      HEALTH_FUNCTIONS.map(f => probeFunction(f.name, f.payload as object)),
    )

    // Calculate overall health
    const ok = results.filter(r => r.status === 'ok').length
    const degraded = results.filter(r => r.status === 'degraded').length
    const down = results.filter(r => r.status === 'down').length
    const total = results.length

    const healthScore = Math.round((ok / total) * 100)

    // Get mining data if available
    const miningResult = results.find(r => r.name === 'mining-proxy')
    const miningData = miningResult?.data as {
      totalHashes?: string; validShares?: number; invalidShares?: number
      amtPaid?: string; amtDue?: string; avgReward?: number; activeWorkers?: number
    } | undefined

    // Get ecosystem health
    const ecoResult = results.find(r => r.name === 'ecosystem-health-check')
    const ecoData = ecoResult?.data as {
      status?: string; services?: Record<string, string>; proposalCount?: number
    } | undefined

    // Get governance data
    const govResult = results.find(r => r.name === 'list-function-proposals')
    const govData = govResult?.data as {
      proposals?: unknown[]; count?: number
    } | undefined

    // Get knowledge stats
    const knowResult = results.find(r => r.name === 'knowledge-manager')
    const knowData = knowResult?.data as {
      knowledge?: unknown[]; count?: number; entities?: unknown[]
    } | undefined

    // Get agent stats
    const agentResult = results.find(r => r.name === 'agent-manager')
    const agentData = agentResult?.data as { agents?: unknown[]; count?: number } | undefined

    // Overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical'
    if (healthScore >= 80) overallStatus = 'healthy'
    else if (healthScore >= 50) overallStatus = 'degraded'
    else overallStatus = 'critical'

    // Check critical functions
    const criticalDown = HEALTH_FUNCTIONS.filter(f => f.critical).map(f => f.name)
      .filter(name => results.find(r => r.name === name)?.status === 'down')

    if (criticalDown.length > 0) {
      overallStatus = criticalDown.length >= 3 ? 'critical' : 'degraded'
    }

    const response = {
      timestamp: new Date().toISOString(),
      overall: {
        status: overallStatus,
        health_score: healthScore,
        total_functions_checked: total,
        ok,
        degraded,
        down,
      },
      critical_functions_down: criticalDown.length > 0 ? criticalDown : null,
      mining: miningData ? {
        total_hashes: miningData.totalHashes,
        valid_shares: miningData.validShares,
        invalid_shares: miningData.invalidShares,
        reject_rate: miningData.validShares
          ? ((miningData.invalidShares || 0) / miningData.validShares * 100).toFixed(2) + '%'
          : '0%',
        total_paid_xmr: miningData.amtPaid,
        due_xmr: miningData.amtDue,
        active_workers: miningData.activeWorkers,
      } : null,
      ecosystem: ecoData ? {
        status: ecoData.status,
        services: ecoData.services,
        proposals: ecoData.proposalCount,
      } : null,
      governance: govData ? {
        active_proposals: govData.proposals?.length || govData.count || 0,
      } : null,
      knowledge: knowData ? {
        entity_count: knowData.knowledge?.length || knowData.count ||
          (Array.isArray(knowData.entities) ? knowData.entities.length : null),
      } : null,
      agents: agentData ? {
        active_agents: agentData.agents?.length || agentData.count || 0,
      } : null,
      function_health: results.map(r => ({
        name: r.name,
        status: r.status,
        latency_ms: r.latency_ms,
        error: r.error || null,
      })),
      recommendations: buildRecommendations(results, overallStatus),
    }

    return jsonResponse(response)

  } catch (e) {
    console.error('get-suite-health error:', e)
    return jsonResponse({ error: String(e), timestamp: new Date().toISOString() }, 500)
  }
})

function buildRecommendations(results: HealthResult[], overallStatus: string): string[] {
  const recs: string[] = []

  if (overallStatus === 'critical') {
    recs.push('CRITICAL: Multiple systems down. Immediate attention required.')
  }

  const downFunctions = results.filter(r => r.status === 'down')
  if (downFunctions.length > 0) {
    recs.push(`${downFunctions.length} function(s) down: ${downFunctions.map(r => r.name).join(', ')}`)
  }

  const slowFunctions = results.filter(r => r.latency_ms && r.latency_ms > 5000)
  if (slowFunctions.length > 0) {
    recs.push(`${slowFunctions.length} function(s) responding slowly (>5s)`)
  }

  const timeoutResults = results.filter(r => r.error === 'Timeout')
  if (timeoutResults.length > 0) {
    recs.push(`${timeoutResults.length} function(s) timing out — check for deadlocks or external service issues`)
  }

  if (overallStatus === 'healthy' && downFunctions.length === 0) {
    recs.push('All systems operational. No action needed.')
  }

  return recs
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
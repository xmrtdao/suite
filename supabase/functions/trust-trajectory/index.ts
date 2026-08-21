/**
 * trust-trajectory/index.ts — Edge function for trust-trajectory
 * Get the full TrustGraph trajectory — per-agent score series over time,
 * token usage, and ecosystem summary. Proxies to the relay's
 * /api/trustgraph/trajectory endpoint (the canonical TG-001 source).
 *
 * Actions:
 *   - trajectory (default): full series for all agents
 *   - agent: { agent } — series for a single agent
 *   - summary: compact per-agent current score + band + event count
 */
import { callRelayTool } from '../_shared/cuttlefish-proxy.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  const url = new URL(req.url)
  const args: Record<string, unknown> = {}

  // Parse query params for GET requests
  if (req.method === 'GET') {
    for (const [key, val] of url.searchParams) {
      args[key] = val
    }
  }

  // Parse body for POST requests
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      Object.assign(args, body)
    } catch {}
  }

  return await callRelayTool('trust-trajectory', args)
})

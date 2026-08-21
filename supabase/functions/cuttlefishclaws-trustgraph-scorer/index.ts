/**
 * cuttlefishclaws-trustgraph-scorer/index.ts — Edge function for cuttlefishclaws-trustgraph-scorer
 * Score an agent's TrustGraph (or all agents if no agent is provided)
 * Proxies to the relay's /tools/run endpoint
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

  // If an agent is provided, return just that agent's score;
  // if omitted, return all agents' scores.
  return await callRelayTool('cuttlefishclaws-trustgraph-scorer', args)
})

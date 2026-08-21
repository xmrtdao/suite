/**
 * cuttlefishclaws-cac-verifier/index.ts — Edge function for cuttlefishclaws-cac-verifier
 * Verify CAC credential status by credential ID or agent DID
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

  return await callRelayTool('cuttlefishclaws-cac-status', args)
})

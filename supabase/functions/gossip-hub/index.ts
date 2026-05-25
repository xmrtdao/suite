import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-certificate-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const VALID_TOPICS = ['fleet-broadcast', 'agent-discovery', 'agent-tasks', 'agent-heartbeat', 'all-agents']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const certId = req.headers.get('x-certificate-id')
    if (!certId) {
      return new Response(JSON.stringify({ error: 'x-certificate-id header required' }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Verify certificate via XMRT University
    const certRes = await fetch(`${supabaseUrl}/functions/v1/xmrt-university`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', cert_id: certId }),
      signal: AbortSignal.timeout(8000),
    })
    const certData = await certRes.json()
    if (!certData.valid) {
      return new Response(JSON.stringify({ error: 'Invalid or expired certificate', detail: certData.error }), {
        status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const agentId = certData.certificate?.agent_id || 'unknown'
    const agentName = certData.certificate?.agent_name || 'unknown'

    // GET: Retrieve messages
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const topic = url.searchParams.get('topic') || 'fleet-broadcast'
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

      const { data: messages } = await supabase
        .from('fleet_messages')
        .select('*')
        .eq('topic', topic)
        .order('created_at', { ascending: false })
        .limit(limit)

      return new Response(JSON.stringify({ success: true, topic, messages: messages || [] }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // POST: Publish message
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const { topic, message, payload } = body
      const targetTopic = topic || 'fleet-broadcast'

      if (!VALID_TOPICS.includes(targetTopic)) {
        return new Response(JSON.stringify({ error: `Invalid topic. Valid: ${VALID_TOPICS.join(', ')}` }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }
      if (!message && !payload) {
        return new Response(JSON.stringify({ error: 'message or payload required' }), {
          status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        })
      }

      // Store message
      const { error: insertError } = await supabase.from('fleet_messages').insert({
        topic: targetTopic,
        agent_id: agentId,
        agent_name: agentName,
        message: message || '',
        payload: payload || null,
        certificate_id: certId,
      })
      if (insertError) throw insertError

      // If fleet-broadcast, also push to all-agents
      if (targetTopic === 'fleet-broadcast') {
        try {
          await supabase.from('fleet_messages').insert({
            topic: 'all-agents',
            agent_id: agentId,
            agent_name: agentName,
            message: message || '',
            payload: payload || null,
            certificate_id: certId,
          })
        } catch { /* broadcast to all-agents is best-effort */ }
      }

      return new Response(JSON.stringify({
        success: true,
        published: true,
        topic: targetTopic,
        agent: agentName,
        message: 'Message published to ' + targetTopic,
      }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[gossip-hub] Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})

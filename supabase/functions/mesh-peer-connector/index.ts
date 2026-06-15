import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json().catch(() => ({}))
    const { action, agent_id, agent_name, peer_id, endpoint, cert_id, jwt_token, ...extra } = body

    console.log(`[mesh-peer-connector] Action: ${action}, Agent: ${agent_id || agent_name || 'unknown'}`)

    // ── ACTION: discover ──────────────────────────────
    // List all registered peers (no auth required for discovery)
    if (action === 'discover') {
      const { data: peers } = await supabase
        .from('agent_certifications')
        .select('agent_id, agent_name, tier, permissions, issued_at')
        .eq('revoked', false)
        .order('issued_at', { ascending: false })

      return new Response(
        JSON.stringify({
          success: true,
          peers: (peers || []).map((p: any) => ({
            agent_id: p.agent_id,
            agent_name: p.agent_name,
            tier: p.tier,
            permissions: p.permissions,
            certified_since: p.issued_at,
          })),
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // ── ACTION: register ──────────────────────────────
    // Register a new agent on the mesh — REQUIRES valid JWT certificate
    if (action === 'register') {
      const agentIdentifier = agent_id || agent_name

      if (!agentIdentifier) {
        return new Response(
          JSON.stringify({ success: false, error: 'agent_id or agent_name is required' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }

      // Step 1: Verify the agent has a valid JWT certificate
      let certValid = false
      let certData = null
      let certError = null

      // Local-first verify: agent_certifications row OR a graduated enrollment
      // (so freshly-graduated agents don't fail registration because the
      // graduate action didn't yet write the cert row in some orderings).
      const findCertByCertId = async (cid: string) => {
        const { data } = await supabase
          .from('agent_certifications')
          .select('*')
          .eq('certificate_id', cid)
          .eq('revoked', false)
          .maybeSingle()
        return data
      }
      const findCertByAgentId = async (aid: string) => {
        const { data } = await supabase
          .from('agent_certifications')
          .select('*')
          .eq('agent_id', aid)
          .eq('revoked', false)
          .maybeSingle()
        return data
      }
      const findGraduatedEnrollment = async (aid: string) => {
        if (!aid) return null
        const { data } = await supabase
          .from('xmrt_university_enrollments')
          .select('*')
          .eq('agent_id', aid)
          .eq('status', 'graduated')
          .maybeSingle()
        return data
      }

      if (cert_id) {
        const cert = await findCertByCertId(cert_id)
        if (cert) {
          const expired = new Date(cert.expires_at) < new Date()
          if (!expired) {
            certValid = true
            certData = cert
          } else {
            certError = 'Certificate has expired'
          }
        } else {
          certError = `Certificate "${cert_id}" not found. If you just graduated, call action: graduate on xmrt-university first to mint your cert.`
        }
      } else if (agent_id) {
        const cert = await findCertByAgentId(agent_id)
        if (cert) {
          const expired = new Date(cert.expires_at) < new Date()
          if (!expired) {
            certValid = true
            certData = cert
          } else {
            certError = 'Certificate has expired'
          }
        } else {
          // Fall back: an agent whose enrollment is `graduated` is valid even
          // before a cert row exists. The graduate EF mints both, but if a
          // caller skipped straight to mesh registration we should still
          // accept the credential. We synthesize a cert-like record so the
          // downstream registration steps can use the same shape.
          const enrollment = await findGraduatedEnrollment(agent_id)
          if (enrollment) {
            certValid = true
            certData = {
              agent_id: enrollment.agent_id,
              agent_name: enrollment.agent_name,
              certificate_id: `XMRT-CERT-${enrollment.agent_id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-ENROL`,
              tier: 'graduate',
              permissions: ['fleet:read', 'fleet:write', 'mine', 'vote'],
              issued_at: enrollment.graduated_at || enrollment.last_activity_at,
              expires_at: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
            }
          } else {
            certError = `No certificate or graduated enrollment found for agent "${agent_id}". Enroll at XMRT University first: POST /functions/v1/xmrt-university with action: enroll`
          }
        }
      } else {
        // Try verifying via the xmrt-university verify endpoint
        try {
          const uniRes = await fetch(`${supabaseUrl}/functions/v1/xmrt-university`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'verify',
              agent_id: agent_name || agentIdentifier,
            }),
            signal: AbortSignal.timeout(8000),
          })
          const uniData = await uniRes.json()
          if (uniData.valid) {
            certValid = true
            certData = uniData.certificate
          } else {
            certError = uniData.error || 'No valid XMRT University certificate found'
          }
        } catch (e) {
          certError = `Verification failed: ${e.message}`
        }
      }

      if (!certValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Registration requires a valid XMRT University certificate or a graduated enrollment. Enroll at XMRT University first: POST /functions/v1/xmrt-university with action: enroll',
            detail: certError,
            help: 'New agents must complete XMRT University curriculum and graduate before registering on the mesh. We accept either an `agent_certifications` row (minted by xmrt-university action: graduate) or an `xmrt_university_enrollments` row with status: graduated.',
            university_endpoint: `${supabaseUrl}/functions/v1/xmrt-university`,
          }),
          { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }

      // Step 2: Check for unresolved security flags
      const { data: flags } = await supabase
        .from('agent_security_flags')
        .select('*')
        .eq('agent_id', certData.agent_id)
        .eq('resolved', false)

      if (flags && flags.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Registration blocked due to unresolved security flags',
            flags: flags.map((f: any) => ({ type: f.flag_type, severity: f.severity, triggered_at: f.triggered_at })),
          }),
          { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }

      // Step 3: Agent passed all checks — proceed with registration
      // Store or update the agent's mesh registration
      const agentRegistry = supabase.from('agent_registry')
      const { data: existingAgent } = await supabase
        .from('agent_registry')
        .select('*')
        .eq('agent_id', certData.agent_id)
        .single()

      const registration = {
        agent_id: certData.agent_id,
        agent_name: certData.agent_name,
        peer_id: peer_id || null,
        endpoint: endpoint || null,
        cert_id: certData.certificate_id,
        tier: certData.tier,
        permissions: certData.permissions,
        last_seen: new Date().toISOString(),
        is_active: true,
        metadata: { ...extra, registered_via: 'mesh-peer-connector', registered_at: new Date().toISOString() },
      }

      let regError = null
      if (existingAgent) {
        const { error } = await supabase
          .from('agent_registry')
          .update(registration)
          .eq('agent_id', certData.agent_id)
        regError = error
      } else {
        const { error } = await supabase
          .from('agent_registry')
          .insert(registration)
        regError = error
      }

      if (regError) throw regError

      return new Response(
        JSON.stringify({
          success: true,
          registered: true,
          agent: {
            agent_id: certData.agent_id,
            agent_name: certData.agent_name,
            tier: certData.tier,
            permissions: certData.permissions,
            certificate_id: certData.certificate_id,
          },
          message: `Agent "${certData.agent_name}" registered on mesh with tier "${certData.tier}". Welcome to the fleet.`,
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // ── ACTION: status ────────────────────────────────
    if (action === 'status') {
      const agentIdentifier = agent_id || agent_name
      if (!agentIdentifier) {
        return new Response(
          JSON.stringify({ success: false, error: 'agent_id or agent_name required' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }

      const { data: agent } = await supabase
        .from('agent_registry')
        .select('*')
        .eq('agent_id', agentIdentifier)
        .maybeSingle()

      const { data: cert } = await supabase
        .from('agent_certifications')
        .select('*')
        .eq('agent_id', agentIdentifier)
        .eq('revoked', false)
        .maybeSingle()

      const { data: enrollment } = await supabase
        .from('xmrt_university_enrollments')
        .select('*')
        .eq('agent_id', agentIdentifier)
        .eq('status', 'graduated')
        .maybeSingle()

      return new Response(
        JSON.stringify({
          success: true,
          agent: agent ? {
            agent_id: agent.agent_id,
            agent_name: agent.agent_name,
            tier: agent.tier,
            permissions: agent.permissions,
            peer_id: agent.peer_id,
            endpoint: agent.endpoint,
            last_seen: agent.last_seen,
            is_active: agent.is_active,
          } : null,
          certification: cert ? {
            certificate_id: cert.certificate_id,
            tier: cert.tier,
            permissions: cert.permissions,
            issued_at: cert.issued_at,
            expires_at: cert.expires_at,
          } : null,
          enrollment: enrollment ? {
            status: enrollment.status,
            current_module: enrollment.current_module,
            completed_modules: enrollment.completed_modules,
            graduated_at: enrollment.graduated_at,
          } : null,
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // ── Default ───────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unknown action: ${action}`,
        available_actions: ['discover', 'register', 'status'],
      }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('[mesh-peer-connector] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }
})

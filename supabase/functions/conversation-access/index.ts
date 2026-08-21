// conversation-access — Local-sb Deno edge function
// Provides session-based conversation persistence for the suite's UnifiedChat
// and fleet chat context recall for agents.
//
// Uses the local-sb REST API (PostgREST-compatible) instead of native pg,
// since the pg npm module's native bindings don't work in Deno.
//
// Tables (via REST API at http://127.0.0.1:54321/rest/v1):
//   public.conversation_sessions, public.conversation_messages,
//   public.conversation_summaries, public.fleet_messages, app.fleet_memory
//
// Env vars (injected by local-sb):
//   SUPABASE_URL — local-sb base URL (http://127.0.0.1:54321)
//   SUPABASE_SERVICE_ROLE_KEY — service role key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SB_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbG...MMpM';

// ── REST API helper (PostgREST-compatible) ──
async function restGet(table: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  const url = `${SB_URL}/rest/v1/${table}?${params}`;
  const r = await fetch(url, {
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
    },
  });
  if (!r.ok) return [];
  return await r.json();
}

async function restPost(table: string, body: Record<string, any>) {
  const url = `${SB_URL}/rest/v1/${table}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  return await r.json();
}

async function restPatch(table: string, body: Record<string, any>, filter: string) {
  const url = `${SB_URL}/rest/v1/${table}?${filter}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) return null;
  return await r.json();
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Generate deterministic session key from request context ──
async function generateSessionKey(req: Request): Promise<string> {
  // Get client IP from headers
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
  // Hash IP to create a stable session key
  const payload = new TextEncoder().encode(`suite-session:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  const hash = Array.from(new Uint8Array(digest.slice(0, 16)), b => b.toString(16).padStart(2, '0')).join('');
  return `ip-${hash}`;
}

// ── Session resolution ──
async function resolveSession(sessionId?: string, resolvedSessionKey?: string, channel?: string, agentId?: string) {
  // Try by session_key first (deterministic key from IP + API key)
  if (resolvedSessionKey) {
    const rows = await restGet('conversation_sessions', {
      'session_key': `eq.${resolvedSessionKey}`,
      'status': 'eq.active',
      'limit': '1',
    });
    if (rows.length > 0) return rows[0];
  }

  // Try by session UUID second (legacy)
  if (sessionId) {
    const rows = await restGet('conversation_sessions', {
      'id': `eq.${sessionId}`,
      'status': 'eq.active',
      'limit': '1',
    });
    if (rows.length > 0) return rows[0];
  }

  // Try by agent_id + channel (fleet chat pattern) — most common for fleet
  if (agentId && channel) {
    const rows = await restGet('conversation_sessions', {
      'agent_id': `eq.${agentId}`,
      'channel': `eq.${channel}`,
      'status': 'eq.active',
      'order': 'updated_at.desc',
      'limit': '1',
    });
    if (rows.length > 0) return rows[0];
  }

  // Try by agent_id only
  if (agentId) {
    const rows = await restGet('conversation_sessions', {
      'agent_id': `eq.${agentId}`,
      'status': 'eq.active',
      'order': 'updated_at.desc',
      'limit': '1',
    });
    if (rows.length > 0) return rows[0];
  }

  return null;
}

// ── Fleet chat context — grounded recall for agents ──
async function getFleetContext(agentId: string, limit: number = 20) {
  const [messages, memories] = await Promise.all([
    restGet('fleet_messages', {
      'order': 'created_at.desc',
      'limit': String(limit),
    }),
    restGet('fleet_memory', {
      'agent_id': `eq.${agentId}`,
      'order': 'created_at.desc',
      'limit': '10',
    }),
  ]);

  return { messages, memories };
}

// ── Main handler ──
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support both GET (query params) and POST (JSON body)
    let body: any = {};
    if (req.method === 'GET') {
      const url = new URL(req.url);
      body = Object.fromEntries(url.searchParams.entries());
      // GET requests without explicit action default to get_messages
      if (!body.action) body.action = 'get_messages';
    } else {
      body = await req.json();
    }
    const {
      action,
      sessionKey,
      sessionId: rawSessionId,
      session_id,
      messageData,
      limit,
      offset,
      sessionData,
      channel,
      agentId,
      agent_id,
    } = body;

    const sessionId = rawSessionId || sessionKey || session_id;
    const resolvedAgentId = agentId || agent_id || null;

    // Auto-generate session key from IP (deterministic, survives page refresh)
    const resolvedSessionKey = await generateSessionKey(req);

    switch (action) {
      // ── Get or create a session ──
      case 'get_session': {
        if (sessionId || resolvedSessionKey || resolvedAgentId) {
          const session = await resolveSession(sessionId, resolvedSessionKey, channel, resolvedAgentId);
          if (session) return jsonResponse({ success: true, session });
        }
        // No active session — create one
        const rows = await restPost('conversation_sessions', {
          agent_id: resolvedAgentId || 'anonymous',
          channel: channel || 'suite',
          status: 'active',
          started_at: new Date().toISOString(),
          message_count: 0,
          session_key: resolvedSessionKey || null,
          metadata: JSON.stringify(sessionData?.metadata || {}),
        });
        return jsonResponse({ success: true, session: rows?.[0] || null });
      }

      // ── Create a new session explicitly ──
      case 'create_session': {
        const rows = await restPost('conversation_sessions', {
          agent_id: resolvedAgentId || sessionData?.agent_id || 'anonymous',
          channel: channel || sessionData?.channel || 'suite',
          status: 'active',
          started_at: new Date().toISOString(),
          message_count: 0,
          session_key: resolvedSessionKey || null,
          metadata: JSON.stringify(sessionData?.metadata || {}),
        });
        return jsonResponse({ success: true, session: rows?.[0] || null });
      }

      // ── Get messages for a session ──
      case 'get_messages': {
        if (!sessionId && !resolvedAgentId) {
          return jsonResponse({ error: 'Session ID or agentId required' }, 400);
        }
        const session = await resolveSession(sessionId, resolvedSessionKey, channel, resolvedAgentId);
        if (!session) {
          return jsonResponse({ success: true, messages: [] });
        }
        const messages = await restGet('conversation_messages', {
          'session_id': `eq.${session.id}`,
          'order': 'timestamp.desc',
          'limit': String(limit || 50),
          'offset': String(offset || 0),
        });
        return jsonResponse({ success: true, messages, session });
      }

      // ── Get summaries for a session ──
      case 'get_summaries': {
        if (!sessionId && !resolvedAgentId) {
          return jsonResponse({ error: 'Session ID or agentId required' }, 400);
        }
        const session = await resolveSession(sessionId, resolvedSessionKey, channel, resolvedAgentId);
        if (!session) {
          return jsonResponse({ success: true, summaries: [] });
        }
        const summaries = await restGet('conversation_summaries', {
          'session_id': `eq.${session.id}`,
          'order': 'created_at.asc',
        });
        return jsonResponse({ success: true, summaries });
      }

      // ── Add a message to a session ──
      case 'add_message': {
        if (!messageData?.message_type || !messageData?.content?.trim()) {
          return jsonResponse({
            error: 'message_type and non-empty content are required',
          }, 400);
        }

        // Resolve or create session
        let session = sessionId || resolvedAgentId ? await resolveSession(sessionId, resolvedSessionKey, channel, resolvedAgentId) : null;
        if (!session) {
          const rows = await restPost('conversation_sessions', {
            agent_id: resolvedAgentId || 'anonymous',
            channel: channel || 'suite',
            status: 'active',
            started_at: new Date().toISOString(),
            message_count: 0,
            session_key: resolvedSessionKey || null,
            metadata: JSON.stringify({ auto_created: true }),
          });
          session = rows?.[0] || null;
        }

        if (!session) {
          return jsonResponse({ error: 'Failed to create session' }, 500);
        }

        // Insert message
        const rows = await restPost('conversation_messages', {
          session_id: session.id,
          message_type: messageData.message_type,
          content: messageData.content,
          metadata: JSON.stringify(messageData.metadata || {}),
          timestamp: new Date().toISOString(),
        });

        // Update session message count
        await restPatch('conversation_sessions',
          { message_count: (session.message_count || 0) + 1, updated_at: new Date().toISOString() },
          `id=eq.${session.id}`
        );

        return jsonResponse({ success: true, message: rows?.[0] || null });
      }

      // ── Update session metadata/status ──
      case 'update_session': {
        if (!sessionId && !agentId) {
          return jsonResponse({ error: 'Session ID or agentId required' }, 400);
        }
        const session = await resolveSession(sessionId, resolvedSessionKey, channel, agentId);
        if (!session) {
          return jsonResponse({ error: 'Session not found' }, 404);
        }

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (messageData?.status) updates.status = messageData.status;
        if (messageData?.title) updates.title = messageData.title;
        if (messageData?.metadata) updates.metadata = JSON.stringify(messageData.metadata);

        await restPatch('conversation_sessions', updates, `id=eq.${session.id}`);
        return jsonResponse({ success: true, sessionId: session.id });
      }

      // ── Fleet chat context — grounded recall for agents ──
      case 'get_fleet_context': {
        const targetAgent = agentId || 'fleet';
        const ctx = await getFleetContext(targetAgent, limit || 20);
        return jsonResponse({ success: true, ...ctx });
      }

      default:
        return jsonResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Conversation access error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});
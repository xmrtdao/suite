import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { startUsageTracking } from '../_shared/functionUsageLogger.ts';

// learning-cycle — periodic learning consolidation tick.
//
// Cron calls this on a schedule (no body). The local implementation does the
// minimum useful work: counts recently-created memories, logs a learning_sessions
// row summarizing the consolidation pass, and returns. No external API calls,
// no AI generation — those should live in `enhanced-learning` which is a richer
// function called explicitly, not on a tight cron.
//
// Tables used:
//   - public.learning_sessions  (created 2026-06-10)
//   - public.memories           (created 2026-06-10, read-only here)

const FUNCTION_NAME = 'learning-cycle';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, { method: req.method });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fast-boot: empty body = cron trigger
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    const isCronTrigger = contentLength === 0 || contentLength < 5;
    if (isCronTrigger) {
      console.log('🧠 learning-cycle: cron trigger');
    }

    // Count memories created in the last 24h as the "consolidation candidate" set.
    // We don't actually move them anywhere — this is a tick that records the count
    // so a later job (or a human) can see the pulse of new memory flow.
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: newMemoryCount, error: memErr } = await supabase
      .from('memories')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso);
    if (memErr) {
      // Don't fail the whole tick if memories table is empty/missing — log and continue
      console.warn('⚠️ memories count failed:', memErr.message);
    }

    // ── Recursive learning loop: read activity outcomes, write learning sessions ──
    // Read recent failures from eliza_activity_log (last 1h) and write a
    // learning session for each, so agents learn from their mistakes instead
    // of just being penalized. Also writes a behavioral trust delta (0 = learning,
    // not punishment) so the trust system is connected to the learning system.
    let learningSessionsWritten = 0;
    try {
      const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: failures } = await supabase
        .from('eliza_activity_log')
        .select('id, activity_type, title, description, status, agent_id, metadata')
        .eq('activity_type', 'http_error')
        .gte('created_at', sinceIso)
        .limit(20);

      if (failures && failures.length > 0) {
        for (const f of failures) {
          // Write learning session to knowledge.learning_sessions
          await supabase
            .from('learning_sessions')
            .insert({
              agent_id: f.agent_id || 'system',
              session_type: 'failure_analysis',
              started_at: new Date().toISOString(),
              ended_at: new Date().toISOString(),
              insights: {
                failure_type: f.activity_type,
                title: f.title,
                description: f.description,
                lesson: `Learn from: ${f.title} — ${f.description || 'no details'}`,
              },
              metadata: {
                source: 'learning-cycle',
                activity_log_id: f.id,
                learning: true,
              },
              status: 'completed',
            })
            .select('id')
            .single();
          learningSessionsWritten++;

          // Write behavioral trust delta (0 = learning, not punishment)
          // This connects the learning system to the trust system
          await supabase
            .from('trust_events')
            .insert({
              agent_did: f.agent_id || 'system',
              event_type: 'LEARNING_SESSION',
              delta: 0,
              note: `Learning from failure: ${f.title}`,
              domain: 'system',
            });
        }
        console.log(`🧠 Wrote ${learningSessionsWritten} learning sessions from ${failures.length} failures`);
      }
    } catch (learnErr) {
      console.warn('⚠️ Learning session write failed:', learnErr.message);
    }

    // Log the learning_sessions row
    const { data: session, error: sessionErr } = await supabase
      .from('learning_sessions')
      .insert({
        agent_id: 'learning-cycle',
        session_type: 'cron_consolidation',
        ended_at: new Date().toISOString(),
        memories_consolidated: newMemoryCount || 0,
        insights: {
          window_hours: 24,
          trigger: isCronTrigger ? 'cron' : 'manual',
          learning_sessions_written: learningSessionsWritten,
        },
        metadata: {
          source: 'local-edge-fn',
          version: '2.0.0',
          learning_loop: true,
        },
      })
      .select('id, started_at, ended_at')
      .single();

    if (sessionErr) {
      throw sessionErr;
    }

    console.log(`🧠 learning-cycle tick complete: ${newMemoryCount || 0} new memories in last 24h`);

    await usageTracker.success({
      cron: isCronTrigger,
      memories_consolidated: newMemoryCount || 0,
      session_id: session?.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        cron: isCronTrigger,
        memories_consolidated: newMemoryCount || 0,
        session_id: session?.id,
        message: 'Learning consolidation tick complete',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('learning-cycle error:', error?.message || error);
    await usageTracker.failure(error?.message || 'unknown', 500);
    return new Response(
      JSON.stringify({ error: error?.message || 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

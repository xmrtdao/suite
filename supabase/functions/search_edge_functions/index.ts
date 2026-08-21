import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || body.q || '';
    // Return a simple list of available functions
    const functions = [
      'ai-chat', 'agent-manager', 'github-integration', 'mining-proxy',
      'paragraph-publisher', 'activity-monitor-api', 'admin-db-tool',
    ].filter(f => !query || f.includes(query.toLowerCase()));
    return new Response(JSON.stringify({ success: true, functions, total: functions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

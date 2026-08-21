import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const agents = [
      { id: 'eliza', name: 'Eliza', status: 'active', role: 'Quartermaster' },
      { id: 'vex', name: 'Vex', status: 'active', role: 'Gunner' },
      { id: 'hermes', name: 'Hermes', status: 'active', role: 'Navigator' },
      { id: 'alice', name: 'Alice', status: 'active', role: 'Crew' },
      { id: 'trib', name: 'Trib', status: 'active', role: 'Crew' },
    ];
    return new Response(JSON.stringify({ success: true, agents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

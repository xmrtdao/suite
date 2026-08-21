import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Alias: delegates to the main ecosystem-monitor function
serve(async (req) => {
  const target = `${Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'}/functions/v1/ecosystem-monitor`;
  const body = await req.text();
  const resp = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body || JSON.stringify({}),
  });
  return new Response(await resp.text(), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  });
});

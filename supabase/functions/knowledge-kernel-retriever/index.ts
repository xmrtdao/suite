import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // Use SERVICE_ROLE_KEY to bypass RLS — the retriever needs full read access
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase URL or Key not set' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query in request body' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // knowledge_entities resolves to app.knowledge_entities (local-sb schema priority)
    // Columns: id, name (text), entity (jsonb), metadata (jsonb)
    // Search name for the query; also search entity->>'name' when the local
    // REST proxy supports jsonb operators (falls back to name-only on basic proxy)
    const { data, error } = await supabase
      .from('knowledge_entities')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error retrieving knowledge:', error);
      return new Response(JSON.stringify({ error: 'Failed to retrieve knowledge', details: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, results: data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('Request processing error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
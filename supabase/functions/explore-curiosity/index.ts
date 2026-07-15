import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { key_phrase, conversation_summary, depth = 2 } = await req.json().catch(() => ({}));
    if (!key_phrase) {
      return new Response(JSON.stringify({ error: "key_phrase is required" }), { status: 400, headers: corsHeaders });
    }

    const results = [];
    const explored = new Set<string>();
    explored.add(key_phrase.toLowerCase());

    // Phase 1: Search knowledge base for the key phrase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "local-anon-key";

    const kbSearch = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_entities?select=name,entity,created_at&or=(name.ilike.*${encodeURIComponent(key_phrase)}*,entity->>description.ilike.*${encodeURIComponent(key_phrase)}*)&limit=5`,
      { headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` } }
    );
    if (kbSearch.ok) {
      const kbResults = await kbSearch.json();
      if (Array.isArray(kbResults) && kbResults.length > 0) {
        results.push({
          phase: "knowledge_base",
          count: kbResults.length,
          entries: kbResults.map((k: any) => ({
            name: k.name,
            description: k.entity?.description || "",
            type: k.entity?.type || "general",
          })),
        });
        // Add discovered terms to explore set
        for (const k of kbResults) {
          const desc = (k.entity?.description || "") + " " + (k.entity?.content || "");
          const terms = desc.match(/\b[A-Z][A-Za-z0-9+/]{2,}(?:\s[A-Z][A-Za-z0-9]+)*\b/g);
          if (terms) terms.forEach((t: string) => { if (t.length > 3) explored.add(t.toLowerCase()); });
        }
      }
    }

    // Phase 2: Web search for the key phrase (if depth >= 2)
    if (depth >= 2) {
      try {
        const webSearch = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(key_phrase + " 2026")}&format=json&no_html=1`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (webSearch.ok) {
          const webData = await webSearch.json();
          const abstract = webData.AbstractText || "";
          const related = webData.RelatedTopics || [];
          if (abstract || related.length > 0) {
            results.push({
              phase: "web_search",
              abstract: abstract.slice(0, 1000),
              related_count: related.length,
              related: related.slice(0, 3).map((r: any) => r.Text || r.Result || ""),
            });
          }
        }
      } catch { /* web search best-effort */ }
    }

    // Phase 3: Cross-reference with fleet activity
    try {
      const relayRes = await fetch("http://127.0.0.1:8080/api/dao/health", { signal: AbortSignal.timeout(3000) });
      if (relayRes.ok) {
        const health = await relayRes.json();
        results.push({
          phase: "system_context",
          health_score: health.health_score || health.status,
          services: health.services || [],
        });
      }
    } catch { /* system context best-effort */ }

    // Phase 4: Generate curiosity-driven follow-up questions
    const followUps = Array.from(explored)
      .filter(t => t !== key_phrase.toLowerCase())
      .slice(0, 3)
      .map(t => `Tell me more about ${t}`);

    return new Response(JSON.stringify({
      success: true,
      key_phrase,
      depth,
      phases_completed: results.length,
      results,
      follow_up_suggestions: followUps,
      timestamp: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});

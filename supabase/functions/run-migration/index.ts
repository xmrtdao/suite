import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

Deno.serve(async (req) => {
  try {
    const { sql } = await req.json();
    if (!sql) return new Response(JSON.stringify({ error: "sql required" }), { status: 400 });
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.rpc("exec_sql", { query: sql });
    if (error) {
      // Try raw query
      const { data: d2, error: e2 } = await supabase.from("_sql").select("*").limit(0);
      const { data: d3, error: e3 } = await supabase.query(sql);
      
      return new Response(JSON.stringify({ error: error.message, data: d3, e3: e3?.message }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});

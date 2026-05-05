import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { DenoClaw, processCheckpoints } from "../_shared/denoclaw/core.ts";
import "../_shared/denoclaw/pdf-handlers.ts";

/**
 * DenoClaw Orchestrator Edge Function
 * 
 * HTTP API for agent task management and execution within
 * the 60-second Supabase Edge Function timeout.
 * 
 * Endpoints:
 *   POST / — Create a new task
 *   POST /decompose — Decompose a task into operations
 *   POST /execute — Execute the next pending operation
 *   POST /continue — Process checkpointed tasks (cron trigger)
 *   GET  /status/:taskId — Get task status
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const config = {
  supabaseUrl: SUPABASE_URL,
  supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  maxOperationDurationMs: 55000, // Leave 5s buffer for cleanup
  defaultTimeoutMs: 30000,
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+/, "").replace(/\/$/, "");
  const method = req.method;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const claw = new DenoClaw(config);
    let result: unknown;

    if (method === "POST" && path === "") {
      // Create task
      const body = await req.json();
      result = await claw.createTask(body);
    } else if (method === "POST" && path === "decompose") {
      const body = await req.json();
      result = await claw.decomposeTask(body.taskId);
    } else if (method === "POST" && path === "execute") {
      const body = await req.json();
      result = await claw.executeNextOperation(body.taskId);
    } else if (method === "POST" && path === "continue") {
      result = await processCheckpoints(config);
    } else if (method === "GET" && path.startsWith("status/")) {
      const taskId = path.replace("status/", "");
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from("agent_tasks")
        .select("*, task_operations:task_operations(*)")
        .eq("id", taskId)
        .single();
      if (error) throw new Error(error.message);
      result = data;
    } else {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[DenoClaw] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

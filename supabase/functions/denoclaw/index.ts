import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { DenoClaw, processCheckpoints } from "../_shared/denoclaw/core.ts";
import "../_shared/denoclaw/pdf-handlers.ts";

/**
 * DenoClaw Orchestrator Edge Function — MCP Native
 *
 * Accepts MCP-formatted payloads from xmrt-mcp-server via Supabase functions.invoke().
 * The incoming payload always contains an `action` field that determines the operation.
 *
 * Supported actions:
 *   create      — Create a new agent task
 *   decompose   — Decompose a task into operations
 *   execute     — Execute next pending operation
 *   status      — Get task status
 *   continue    — Process checkpointed tasks
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const config = {
  supabaseUrl: SUPABASE_URL,
  supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  maxOperationDurationMs: 55000,
  defaultTimeoutMs: 30000,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const action = body.action as string;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action field" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    }

    const claw = new DenoClaw(config);
    let result: unknown;

    switch (action) {
      case "create": {
        result = await claw.createTask({
          agentId: body.agentId,
          objective: body.objective,
          context: body.context || {},
          priority: body.priority || 5,
        });
        break;
      }

      case "decompose": {
        result = await claw.decomposeTask(body.taskId);
        break;
      }

      case "execute": {
        result = await claw.executeNextOperation(body.taskId);
        break;
      }

      case "status": {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data, error } = await supabase
          .from("agent_tasks")
          .select("*, task_operations:task_operations(*)")
          .eq("id", body.taskId)
          .single();
        if (error) throw new Error(error.message);
        result = data;
        break;
      }

      case "continue": {
        result = await processCheckpoints(config);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    return new Response(JSON.stringify({ success: true, action, result }, null, 2), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[DenoClaw] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

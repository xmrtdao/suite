import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const task = payload?.record;
    const oldTask = payload?.old_record;

    if (!task?.id) {
      return new Response(JSON.stringify({ success: false, error: "Missing task record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (task.status !== "COMPLETED") {
      return new Response(JSON.stringify({ success: true, skipped: "status_not_completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (oldTask?.status === "COMPLETED") {
      return new Response(JSON.stringify({ success: true, skipped: "already_completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const contentMarkdown = [task.last_work_result, task.resolution_notes, task.description]
      .find((part: string | null | undefined) => typeof part === "string" && part.trim().length > 0)
      ?.trim() ?? "No content provided for this task.";

    const steps: Record<string, string> = {};

    const { data: driveData, error: driveError } = await supabase.functions.invoke("google-drive-deliverables", {
      body: {
        task_id: task.id,
        agent_name: task.assigned_agent || task.assignee_agent_id || "XMRT-Agent",
        deliverable_type: task.category || "report",
        title: task.title,
        content_markdown: contentMarkdown,
      },
    });

    if (driveError || !driveData?.success) {
      steps.drive = `warn: ${driveError?.message || driveData?.error || "unknown drive error"}`;
      console.warn("[task-completion-workflow] Drive generation warning:", steps.drive);
    } else {
      steps.drive = "ok";
    }

    const { data: refreshedTask, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task.id)
      .single();

    if (fetchError || !refreshedTask) {
      throw new Error(`Unable to load refreshed task after drive generation: ${fetchError?.message || "not found"}`);
    }

    const { data: notifierData, error: notifierError } = await supabase.functions.invoke("task-completion-notifier", {
      body: {
        ...payload,
        record: refreshedTask,
      },
    });

    if (notifierError || !notifierData?.success) {
      throw new Error(`task-completion-notifier failed: ${notifierError?.message || notifierData?.error || "unknown"}`);
    }

    steps.notification = "ok";

    return new Response(JSON.stringify({ success: true, task_id: task.id, steps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[task-completion-workflow] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

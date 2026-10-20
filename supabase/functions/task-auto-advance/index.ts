import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { startUsageTracking } from '../_shared/functionUsageLogger.ts';

const FUNCTION_NAME = 'task-auto-advance';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stage thresholds in hours. These are STALL thresholds, not advancement
// triggers: elapsed time can flag a task, it can never close one.
const STAGE_THRESHOLDS: Record<string, number> = {
  PENDING: 48,
  DISCUSS: 2,
  PLANNING: 4,
  EXECUTE: 8,
  INTEGRATE: 4,
  COMPLETION: 2,
};

// The vocabulary actually present in app.tasks. The previous list used PLAN and
// VERIFY, which do not exist there, so indexOf('PLANNING') was -1 and a
// PLANNING task that reached 100% was moved BACKWARDS to PENDING.
const STAGE_ORDER = ['PENDING', 'DISCUSS', 'PLANNING', 'EXECUTE', 'INTEGRATE', 'COMPLETION', 'COMPLETED'];

// Entering any of these stages asserts that execution finished. None may be
// entered without an artifact carrying a non-empty URL (also enforced by the
// trg_enforce_task_completion_evidence trigger on app.tasks).
const EVIDENCE_STAGES = new Set(['INTEGRATE', 'COMPLETION', 'COMPLETED']);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, { method: req.method });
  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'app' } }
    );

    const { action = 'auto_advance', task_id, force = false } = await req.json().catch(() => ({}));

    // --- REUSABLE LOGIC FUNCTIONS ---

    const executeUpdateProgress = async () => {
      // Progress comes from the checklist and nothing else. The old fallback
      // turned elapsed time into progress, so a task with no checklist reached
      // 100% by sitting still and was then auto-advanced into a completion
      // stage it had no evidence for. A task with no checklist is now recorded
      // as stalled, not as complete.
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id, stage, stage_started_at, auto_advance_threshold_hours, progress_percentage, metadata, completed_checklist_items')
        .in('status', ['PENDING', 'CLAIMED', 'IN_PROGRESS'])
        .not('stage_started_at', 'is', null);

      if (fetchError) throw fetchError;

      let updated = 0;
      let checklistBased = 0;
      let noChecklist = 0;

      for (const task of tasks || []) {
        const checklist = task.metadata?.checklist || [];
        const completedItems = task.completed_checklist_items || [];
        const currentProgress = task.progress_percentage || 0;

        if (checklist.length === 0) {
          noChecklist++;
          const stalledHours = Math.floor(
            (Date.now() - new Date(task.stage_started_at).getTime()) / 3600000
          );
          const alreadyFlagged = task.metadata?.progress_source === 'no_checklist'
            && task.metadata?.stalled_hours === stalledHours;
          if (!alreadyFlagged) {
            await supabase
              .from('tasks')
              .update({
                metadata: {
                  ...task.metadata,
                  progress_source: 'no_checklist',
                  stalled_since: task.metadata?.stalled_since ?? new Date().toISOString(),
                  stalled_hours: stalledHours,
                  last_progress_update: new Date().toISOString()
                }
              })
              .eq('id', task.id);
            updated++;
          }
          continue;
        }

        checklistBased++;
        const newProgress = Math.min(100, Math.round((completedItems.length / checklist.length) * 100));
        // NEVER regress progress - only allow increases
        const finalProgress = Math.max(currentProgress, newProgress);

        if (finalProgress !== currentProgress) {
          await supabase
            .from('tasks')
            .update({
              progress_percentage: finalProgress,
              metadata: {
                ...task.metadata,
                progress_source: 'checklist',
                last_progress_update: new Date().toISOString()
              }
            })
            .eq('id', task.id);
          updated++;
        }
      }

      return {
        rows: updated,
        scanned: (tasks || []).length,
        updated,
        progress_breakdown: {
          checklist_based: checklistBased,
          no_checklist: noChecklist
        }
      };
    };

    // An artifact counts as evidence only if it carries a non-empty URL. This
    // mirrors the DB trigger: a screenshot row with no URL is a note, not proof.
    const taskHasEvidence = async (taskId: string) => {
      const { data, error } = await supabase
        .from('task_artifacts')
        .select('artifact_type, artifact_url')
        .eq('task_id', taskId);
      if (error) return { ok: false, error: error.message, count: 0 };
      const withUrl = (data || []).filter(
        (a: any) => typeof a.artifact_url === 'string' && a.artifact_url.trim() !== ''
      );
      return { ok: true, error: null, count: withUrl.length };
    };

    const executeAutoAdvance = async () => {
      // Find tasks ready to auto-advance
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['PENDING', 'CLAIMED', 'IN_PROGRESS'])
        .is('blocking_reason', null)
        .gte('progress_percentage', 100);

      if (fetchError) throw fetchError;

      const advanced: Array<{ id: string; from: string; to: string }> = [];
      const notAdvanced: Array<{ id: string; reason: string }> = [];
      let notified = 0;
      let rows = 0;

      for (const task of tasks || []) {
        const currentStageIdx = STAGE_ORDER.indexOf(task.stage);

        // An unknown stage must never be "advanced" to STAGE_ORDER[0] (PENDING).
        if (currentStageIdx < 0) {
          notAdvanced.push({ id: task.id, reason: `unknown stage: ${task.stage}` });
          continue;
        }

        // At COMPLETION with 100% = COMPLETED. A completion is a claim that
        // the work happened, so it needs an artifact with a real URL.
        if (currentStageIdx >= STAGE_ORDER.length - 1) {
          const evidence = await taskHasEvidence(task.id);
          if (!evidence.ok) {
            notAdvanced.push({ id: task.id, reason: `artifact lookup failed: ${evidence.error}` });
            continue;
          }
          if (evidence.count === 0) {
            await supabase
              .from('tasks')
              .update({
                status: 'REVIEW',
                updated_at: new Date().toISOString(),
                metadata: {
                  ...task.metadata,
                  terminal_reason: 'missing_artifact',
                  evidence_gate: {
                    checked_at: new Date().toISOString(),
                    required_for: 'COMPLETED',
                    artifacts_with_url: 0
                  }
                }
              })
              .eq('id', task.id);
            notAdvanced.push({ id: task.id, reason: 'missing_artifact (COMPLETED)' });
            rows++;
            continue;
          }
          // Mark as COMPLETED instead of just skipping
          const { error: completeError } = await supabase
            .from('tasks')
            .update({
              status: 'COMPLETED',
              progress_percentage: 100,
              updated_at: new Date().toISOString(),
              metadata: {
                ...task.metadata,
                terminal_reason: null,
                evidence_gate: null,
              },
            })
            .eq('id', task.id);

          if (completeError) {
            notAdvanced.push({ id: task.id, reason: completeError.message });
            continue;
          }

          // Free up the agent's workload. Read the agent's current value;
          // task.current_workload does not exist on app.tasks.
          if (task.assignee_agent_id) {
            const { data: agentRow } = await supabase
              .from('agents')
              .select('current_workload')
              .eq('id', task.assignee_agent_id)
              .single();
            await supabase
              .from('agents')
              .update({
                current_workload: Math.max(0, (agentRow?.current_workload || 1) - 1)
              })
              .eq('id', task.assignee_agent_id);

            // Check if agent has remaining active tasks
            const { data: remainingTasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('assignee_agent_id', task.assignee_agent_id)
              .in('status', ['PENDING', 'IN_PROGRESS', 'CLAIMED'])
              .neq('id', task.id)
              .limit(1);

            if (!remainingTasks?.length) {
              await supabase
                .from('agents')
                .update({ status: 'IDLE', current_workload: 0 })
                .eq('id', task.assignee_agent_id);
            }
          }

          // Log completion to activity feed
          await supabase.schema('public').from('activity_feed').insert({
            type: 'task_completed',
            title: 'Task Completed',
            description: `"${task.title}" completed ${task.stage} stage`,
            data: { task_id: task.id, agent_id: task.assignee_agent_id }
          });

          // Log to eliza_activity_log for causality tracking
          await supabase.schema('public').from('eliza_activity_log').insert({
            activity_type: 'task_completed',
            title: `Task Completed: ${task.title}`,
            description: `Automatically completed at ${task.stage} with a URL-bearing artifact`,
            status: 'completed',
            metadata: { task_id: task.id, agent_id: task.assignee_agent_id, from_stage: task.stage, auto_completed: true }
          });

          rows++;
          advanced.push({ id: task.id, from: task.stage, to: 'COMPLETED' });
          continue;
        }

        const nextStage = STAGE_ORDER[currentStageIdx + 1];
        const newThreshold = STAGE_THRESHOLDS[nextStage] || 4;

        // Moving out of EXECUTE (or into any later completion stage) is an
        // evidence claim. Without an artifact URL the task goes to REVIEW, not
        // forward: the DB trigger would reject the update anyway, and a task
        // that cannot advance should say why instead of failing silently.
        if (EVIDENCE_STAGES.has(nextStage)) {
          const evidence = await taskHasEvidence(task.id);
          if (!evidence.ok) {
            notAdvanced.push({ id: task.id, reason: `artifact lookup failed: ${evidence.error}` });
            continue;
          }
          if (evidence.count === 0) {
            await supabase
              .from('tasks')
              .update({
                status: 'REVIEW',
                updated_at: new Date().toISOString(),
                metadata: {
                  ...task.metadata,
                  terminal_reason: 'missing_artifact',
                  evidence_gate: {
                    checked_at: new Date().toISOString(),
                    required_for: nextStage,
                    artifacts_with_url: 0
                  }
                }
              })
              .eq('id', task.id);
            notAdvanced.push({ id: task.id, reason: `missing_artifact (${nextStage})` });
            rows++;
            continue;
          }
        }

        // Advance the task. COMPLETED is the only terminal stage: it must set
        // status COMPLETED and keep progress at 100, otherwise the task lands
        // in a finished stage while still looking active at 0% and is never
        // selected again.
        const isTerminal = nextStage === 'COMPLETED';
        const updatePayload: Record<string, unknown> = {
          stage: nextStage,
          stage_started_at: new Date().toISOString(),
          progress_percentage: isTerminal ? 100 : 0,
          auto_advance_threshold_hours: newThreshold,
          updated_at: new Date().toISOString(),
          metadata: {
            ...task.metadata,
            // The gate reason described the state before this advance. Leaving
            // it in place made an advanced task still read as "missing_artifact".
            terminal_reason: null,
            evidence_gate: null,
            last_agent_notified_at: new Date().toISOString()
          },
        };
        if (isTerminal) updatePayload.status = 'COMPLETED';

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', task.id);

        if (updateError) {
          notAdvanced.push({ id: task.id, reason: updateError.message });
          continue;
        }
        rows++;

        if (isTerminal && task.assignee_agent_id) {
          const { data: agentRow } = await supabase
            .from('agents')
            .select('current_workload')
            .eq('id', task.assignee_agent_id)
            .single();
          await supabase
            .from('agents')
            .update({ current_workload: Math.max(0, (agentRow?.current_workload || 1) - 1) })
            .eq('id', task.assignee_agent_id);

          const { data: remainingTasks } = await supabase
            .from('tasks')
            .select('id')
            .eq('assignee_agent_id', task.assignee_agent_id)
            .in('status', ['PENDING', 'IN_PROGRESS', 'CLAIMED'])
            .neq('id', task.id)
            .limit(1);

          if (!remainingTasks?.length) {
            await supabase
              .from('agents')
              .update({ status: 'IDLE', current_workload: 0 })
              .eq('id', task.assignee_agent_id);
          }
        }

        // Log activity for agent notification
        if (task.assignee_agent_id) {
          await supabase.schema('public').from('agent_activities').insert({
            agent_id: task.assignee_agent_id,
            activity: `Task auto-advanced: "${task.title}" moved from ${task.stage} to ${nextStage}`,
            level: 'info'
          });
        }

        // Log to activity feed
        await supabase.from('activity_feed').insert({
          type: 'task_auto_advanced',
          title: `Task auto-advanced to ${nextStage}`,
          description: `"${task.title}" automatically moved from ${task.stage} to ${nextStage} after its checklist reached 100%`,
          data: {
            task_id: task.id,
            from_stage: task.stage,
            to_stage: nextStage,
            agent_id: task.assignee_agent_id
          }
        });

        advanced.push({ id: task.id, from: task.stage, to: nextStage });
      }

      // Also notify agents of tasks at 75% and 90% thresholds. app.tasks has no
      // last_agent_notified_at column, so the previous query errored and this
      // whole block never ran; the timestamp lives in metadata instead.
      const { data: urgentTasks } = await supabase
        .from('tasks')
        .select('id, title, stage, progress_percentage, assignee_agent_id, metadata')
        .in('status', ['PENDING', 'CLAIMED', 'IN_PROGRESS'])
        .gte('progress_percentage', 75)
        .lt('progress_percentage', 100);

      for (const task of urgentTasks || []) {
        // Only notify once per threshold crossing
        const lastNotified = task.metadata?.last_agent_notified_at
          ? new Date(task.metadata.last_agent_notified_at)
          : null;
        const hoursSinceNotified = lastNotified ? (Date.now() - lastNotified.getTime()) / 3600000 : Infinity;

        // Notify at most once per hour
        if (hoursSinceNotified < 1) continue;

        if (task.assignee_agent_id) {
          const urgencyLevel = task.progress_percentage >= 90 ? 'warning' : 'info';
          const urgencyText = task.progress_percentage >= 90 ? 'URGENT' : 'Attention';

          await supabase.schema('public').from('agent_activities').insert({
            agent_id: task.assignee_agent_id,
            activity: `${urgencyText}: Task "${task.title}" at ${task.progress_percentage}% of auto-advance threshold in ${task.stage}`,
            level: urgencyLevel
          });

          await supabase
            .from('tasks')
            .update({
              metadata: {
                ...task.metadata,
                last_agent_notified_at: new Date().toISOString()
              }
            })
            .eq('id', task.id);

          notified++;
          rows++;
        }
      }

      return {
        rows,
        advanced,
        notAdvanced,
        agentsNotified: notified,
      };
    };

    // --- ACTION HANDLING ---

    if (action === 'run_all') {
      const progressResult = await executeUpdateProgress();
      const advanceResult = await executeAutoAdvance();

      return new Response(
        JSON.stringify({
          ok: true,
          action: 'run_all',
          rows: (progressResult.rows || 0) + (advanceResult.rows || 0),
          update_summary: progressResult,
          advance_summary: advanceResult,
          executionTime: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'update_progress') {
      const result = await executeUpdateProgress();
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'update_progress',
          ...result
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'auto_advance') {
      const result = await executeAutoAdvance();
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'auto_advance',
          ...result,
          executionTime: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'advance_single' && task_id) {
      // Manually advance a specific task
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', task_id)
        .single();

      if (fetchError || !task) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Task not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!force && task.blocking_reason) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Task is blocked', blocking_reason: task.blocking_reason }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const currentStageIdx = STAGE_ORDER.indexOf(task.stage);
      if (currentStageIdx < 0) {
        return new Response(
          JSON.stringify({ ok: false, error: `Unknown stage: ${task.stage}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (currentStageIdx >= STAGE_ORDER.length - 1) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Task is already at final stage' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const nextStage = STAGE_ORDER[currentStageIdx + 1];
      const newThreshold = STAGE_THRESHOLDS[nextStage] || 4;

      if (EVIDENCE_STAGES.has(nextStage)) {
        const evidence = await taskHasEvidence(task_id);
        if (!evidence.ok) {
          return new Response(
            JSON.stringify({ ok: false, error: 'artifact_lookup_failed', detail: evidence.error }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (evidence.count === 0) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: 'evidence_required',
              detail: `Moving to ${nextStage} requires an artifact with a non-empty artifact_url`,
              task_id,
              from: task.stage,
              to: nextStage
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const isTerminal = nextStage === 'COMPLETED';
      const updatePayload: Record<string, unknown> = {
        stage: nextStage,
        stage_started_at: new Date().toISOString(),
        progress_percentage: isTerminal ? 100 : 0,
        auto_advance_threshold_hours: newThreshold,
        updated_at: new Date().toISOString(),
        metadata: {
          ...task.metadata,
          terminal_reason: null,
          evidence_gate: null,
        },
      };
      if (isTerminal) updatePayload.status = 'COMPLETED';

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', task_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          ok: true,
          action: 'advance_single',
          rows: 1,
          task_id,
          from: task.stage,
          to: nextStage
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await usageTracker.failure('Unknown action', 400);
    return new Response(
      JSON.stringify({ ok: false, error: 'Unknown action', validActions: ['run_all', 'auto_advance', 'update_progress', 'advance_single'] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[task-auto-advance] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await usageTracker.failure(errorMsg, 500);
    return new Response(
      JSON.stringify({ ok: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

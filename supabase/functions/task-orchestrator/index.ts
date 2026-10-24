import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { startUsageTracking } from "../_shared/functionUsageLogger.ts";

const FUNCTION_NAME = 'task-orchestrator';

/**
 * A short, stable hash of a string.
 *
 * Used to make a dedupe key out of a blocking reason: the key has to change
 * when the reason changes (that is new information and has to be said
 * again) and to stay the same when it does not (that is the same information
 * and must not be said twice). The reason itself is too long for a key, and
 * a hash is enough — this is a de-duplication key, not a security boundary.
 *
 * FNV-1a, 32-bit. Collisions between two reasons on the SAME task would
 * mean one report is suppressed; the task id is part of the key too, so a
 * collision would have to be between two reasons of one task.
 */
function hashText(text: string): string {
  let h = 0x811c9dc5;
  const s = String(text ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, { method: req.method });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: { schema: 'app' }
    });

    const { action, data } = await req.json();
    console.log(`🎯 Task Orchestrator - Action: ${action}`);

    // --- REUSABLE LOGIC ---

    const executeAutoAssign = async () => {
      // The board is the truth, and the agents table is a cache of it.
      //
      // The cache drifts. An agent whose last task finished stays BUSY for
      // ever, because nothing recomputed it - and a stale BUSY is invisible
      // work: on 2026-10-20 nine agents held no tasks at all, said BUSY, and
      // so the orchestrator saw no free agent and assigned nothing while
      // thirteen unowned tasks sat on the board.
      //
      // So the workload is read from the tasks themselves, every cycle, and
      // the cached column is corrected to match. The assignment then uses that
      // count rather than the stored status, which means the board can never
      // be blocked by a stale flag.
      const { data: activeTasks } = await supabase
        .from('tasks')
        .select('assignee_agent_id, status')
        .in('status', ['PENDING', 'CLAIMED', 'IN_PROGRESS']);

      const liveWorkload = new Map<string, number>();
      for (const t of activeTasks || []) {
        if (!t.assignee_agent_id) continue;
        liveWorkload.set(t.assignee_agent_id, (liveWorkload.get(t.assignee_agent_id) || 0) + 1);
      }

      const { data: allAgents } = await supabase.from('agents').select('*');
      for (const agent of allAgents || []) {
        const real = liveWorkload.get(agent.id) || 0;
        const wanted = agent.status === 'OFFLINE' ? 'OFFLINE' : (real > 0 ? 'BUSY' : 'IDLE');
        if (agent.status !== wanted || agent.current_workload !== real) {
          await supabase
            .from('agents')
            .update({ status: wanted, current_workload: real })
            .eq('id', agent.id);
        }
      }

      // A task that an operator has held is not assignable. The old query took
      // every PENDING row, so a task explicitly parked for review could be
      // handed to the first idle agent.
      //
      // A task that already has an owner is not assignable either. The query
      // ignored the owner, so the moment a second agent was free it could take
      // a task Vex or Eliza was already working: the board would show two
      // agents on one task and the first one's work was lost. Releasing the
      // backlog means releasing UNOWNED work, not stealing owned work.
      const { data: pendingTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'PENDING')
        .is('blocking_reason', null)
        .is('assignee_agent_id', null)
        .order('priority', { ascending: false });

      // The registry is the roster. An agent row that is not in
      // app.registry_agents is not a fleet agent and must never be handed
      // work: "Eliza-Dev" is a local row with no registry entry, and it was
      // the only row whose status the orchestrator could even see, because it
      // was spelled 'idle' while the query asked for 'IDLE'.
      const { data: registry } = await supabase
        .from('registry_agents')
        .select('name, lifecycle_status')
        .eq('lifecycle_status', 'active');
      const registered = new Set(
        (registry || []).map((r) => String(r.name || '').trim().toLowerCase())
      );

      // The join key is the id stem: 'vex-001' -> 'vex' -> registry 'vex'.
      const eligible = (allAgents || []).filter((a) =>
        a.status !== 'OFFLINE'
        && (liveWorkload.get(a.id) || 0) === 0
        && registered.has(String(a.id || '').replace(/-001$/, '').toLowerCase())
      );

      if (!pendingTasks || eligible.length === 0) {
        return {
          success: true,
          assignments: 0,
          candidates: pendingTasks?.length ?? 0,
          idle_agents: eligible.length,
          eligible_agents: eligible.length,
        };
      }

      const assignments = [];
      for (let i = 0; i < Math.min(pendingTasks.length, eligible.length); i++) {
        const task = pendingTasks[i];
        const agent = eligible[i];

        await supabase
          .from('tasks')
          .update({
            status: 'IN_PROGRESS',
            assignee_agent_id: agent.id
          })
          .eq('id', task.id);

        // Workload is a number that has to mean something: the count of active
        // tasks this agent now holds. It used to be left at whatever it was,
        // so an agent working seven tasks still read as 0.
        const workload = (liveWorkload.get(agent.id) || 0) + 1;
        liveWorkload.set(agent.id, workload);
        await supabase
          .from('agents')
          .update({ status: 'BUSY', current_workload: workload })
          .eq('id', agent.id);
        agent.current_workload = workload;

        assignments.push({ task_id: task.id, agent_id: agent.id });

        await supabase.schema('public').from('eliza_activity_log').insert({
          activity_type: 'task_assigned',
          title: `Auto-Assigned: ${task.title}`,
          description: `Assigned to ${agent.name}`,
          metadata: { task_id: task.id, agent_id: agent.id },
          status: 'completed'
        });
      }

      return {
        success: true,
        assignments: assignments.length,
        candidates: pendingTasks.length,
        eligible_agents: eligible.length,
        details: assignments,
      };
    };

    const executeIdentifyBlockers = async () => {
      const { data: blockedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'BLOCKED');

      // GitHub connectivity is tested ONLY when a block actually mentions
      // GitHub.
      //
      // It used to be tested on every cycle, for every blocker, whether or
      // not one of them had anything to do with GitHub. On 2026-10-23 all 54
      // blocked tasks had a NULL blocking_reason, so the answer the test
      // could give was always "not applicable" — and it was still paying for
      // an outbound HTTPS round trip 96 times a day, inside a function with a
      // 60-second ceiling. This job timed out 40 times a day at 60,012ms.
      const needsGithub = (blockedTasks || []).some((t: any) =>
        String(t.blocking_reason || '').toLowerCase().includes('github'));

      const githubToken = Deno.env.get('GITHUB_TOKEN');
      const githubOwner = Deno.env.get('GITHUB_OWNER');
      const githubRepo = Deno.env.get('GITHUB_REPO');

      const hasGitHubAccess = githubToken && githubOwner && githubRepo;

      let githubConnectionValid = false;
      if (needsGithub && hasGitHubAccess) {
        try {
          const testResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}`, {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          githubConnectionValid = testResponse.ok;
        } catch (e) {
          console.error('GitHub connectivity test failed:', e);
        }
      }

      // Which of these blockers have already been reported?
      //
      // Every run used to write a fresh row for every blocked task, so the
      // same 54 tasks produced 3,634 activity rows a day — 96 copies of each
      // — and the feed's "warnings" were 20% of every window the panel
      // showed. None of the 96 copies said anything the first one had not.
      //
      // So a blocker is reported once per (task, reason). The reason is part
      // of the key because a reason that CHANGED is new information and has
      // to be said again. The rows carry a dedupe_key, and the table has a
      // unique index on it, so a second run cannot write a duplicate even if
      // this check is wrong.
      const REPORT_ONCE_PERIOD_MS = 24 * 60 * 60 * 1000;
      const cutoff = new Date(Date.now() - REPORT_ONCE_PERIOD_MS).toISOString();
      const { data: alreadySaid } = await supabase
        .schema('public')
        .from('eliza_activity_log')
        .select('dedupe_key')
        .eq('activity_type', 'task_blocked')
        .gte('created_at', cutoff);
      const saidAlready = new Set(
        (alreadySaid || []).map((r: any) => r.dedupe_key).filter(Boolean) as string[]
      );

      const detailedBlockers = [];
      const rowsToInsert: any[] = [];
      for (const task of blockedTasks || []) {
        let specificReason = task.blocking_reason || 'Unknown';
        let canClear = false;
        let clearAction = '';

        if (specificReason.toLowerCase().includes('github') && githubConnectionValid) {
          specificReason = `FALSE ALARM: GitHub access is valid. Original reason: ${specificReason}. Task can be unblocked.`;
          canClear = true;
          clearAction = 'Update task status to PENDING';
        } else if (specificReason.toLowerCase().includes('github') && !hasGitHubAccess) {
          specificReason = `GitHub credentials missing: GITHUB_TOKEN=${!!githubToken}, GITHUB_OWNER=${!!githubOwner}, GITHUB_REPO=${!!githubRepo}`;
          clearAction = 'Set missing GitHub environment variables in Supabase Edge Function secrets';
        } else if (specificReason.toLowerCase().includes('github')) {
          specificReason = `GitHub connection failed: Credentials exist but API test failed. Check token permissions and repo access.`;
          clearAction = 'Verify GitHub token has correct scopes and repo access';
        }

        if (specificReason.toLowerCase().includes('dependency')) {
          clearAction = 'Install missing dependencies or update package.json';
        } else if (specificReason.toLowerCase().includes('permission')) {
          clearAction = 'Update RLS policies or grant necessary permissions';
        } else if (specificReason.toLowerCase().includes('api')) {
          clearAction = 'Check API endpoint availability and credentials';
        }

        detailedBlockers.push({
          ...task,
          specific_blocking_reason: specificReason,
          can_auto_clear: canClear,
          clear_action: clearAction,
          github_status: githubConnectionValid ? 'CONNECTED' : 'DISCONNECTED'
        });

        const dedupeKey = `task_blocked:${task.id}:${hashText(specificReason)}`;
        if (!saidAlready.has(dedupeKey)) {
          rowsToInsert.push({
            activity_type: 'task_blocked',
            title: `⚠️ ${canClear ? 'FALSE BLOCK' : 'Task Blocked'}: ${task.title}`,
            description: `Specific Reason: ${specificReason}\nClear Action: ${clearAction}`,
            // The task id is on the row itself, not only inside the metadata,
            // so the (task_id, created_at) index can find it and the panel
            // can filter by task.
            task_id: task.id,
            dedupe_key: dedupeKey,
            metadata: {
              task_id: task.id,
              can_auto_clear: canClear,
              clear_action: clearAction,
              github_connected: githubConnectionValid,
              original_reason: task.blocking_reason
            },
            status: canClear ? 'info' : 'warning'
          });
        }

        if (canClear) {
          await supabase
            .from('tasks')
            .update({
              status: 'PENDING',
              blocking_reason: null
            })
            .eq('id', task.id);

          console.log(`✅ Auto-cleared false GitHub block for task: ${task.title}`);
        }
      }

      // One insert for the whole batch, not one per task. 54 round trips
      // inside a function with a 60-second ceiling is how this job started
      // timing out.
      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .schema('public')
          .from('eliza_activity_log')
          .insert(rowsToInsert);
        if (insertError) {
          console.error('Failed to write blocker reports:', insertError.message);
        } else {
          console.log(`📝 Reported ${rowsToInsert.length} blocker(s); ${saidAlready.size} already said.`);
        }
      } else {
        console.log(`📝 No new blockers to report (${saidAlready.size} already said).`);
      }

      return {
        success: true,
        blocked_count: blockedTasks?.length || 0,
        reported_now: rowsToInsert.length,
        already_reported: saidAlready.size,
        auto_cleared: detailedBlockers.filter(t => t.can_auto_clear).length,
        tasks: detailedBlockers,
        github_status: {
          has_credentials: hasGitHubAccess,
          connection_valid: githubConnectionValid,
          tested: needsGithub && !!hasGitHubAccess
        }
      };
    };

    let result;

    switch (action) {
      // --- CRON CONSOLIDATION ---
      case 'run_orchestration_cycle': {
        console.log('🔄 Executing consolidated orchestration cycle...');
        const assignResult = await executeAutoAssign();
        const blockerResult = await executeIdentifyBlockers();

        result = {
          success: true,
          action: 'run_orchestration_cycle',
          assignments: assignResult,
          blocker_analysis: blockerResult
        };
        break;
      }

      case 'auto_assign_tasks':
        result = await executeAutoAssign();
        break;

      case 'rebalance_workload':
        // Rebalance tasks among agents
        const { data: allAgents } = await supabase
          .from('agents')
          .select('id, name, status');

        const workloads = [];
        for (const agent of allAgents || []) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('assignee_agent_id', agent.id)
            .neq('status', 'COMPLETED');

          workloads.push({
            agent_id: agent.id,
            agent_name: agent.name,
            active_tasks: tasks?.length || 0,
            tasks: tasks || []
          });
        }

        // Sort by workload
        workloads.sort((a, b) => b.active_tasks - a.active_tasks);

        result = {
          success: true,
          workloads,
          imbalance: workloads[0]?.active_tasks - workloads[workloads.length - 1]?.active_tasks || 0
        };
        break;

      case 'identify_blockers':
        result = await executeIdentifyBlockers();
        break;

      case 'performance_report':
        // Generate performance metrics
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('*, assignee_agent_id')
          .eq('status', 'COMPLETED')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const { data: failedTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'FAILED')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const agentStats: Record<string, { completed: number; failed: number }> = {};
        for (const task of completedTasks || []) {
          const agentId = task.assignee_agent_id;
          if (agentId) {
            if (!agentStats[agentId]) agentStats[agentId] = { completed: 0, failed: 0 };
            agentStats[agentId].completed++;
          }
        }

        for (const task of failedTasks || []) {
          const agentId = task.assignee_agent_id;
          if (agentId) {
            if (!agentStats[agentId]) agentStats[agentId] = { completed: 0, failed: 0 };
            agentStats[agentId].failed++;
          }
        }

        result = {
          success: true,
          metrics: {
            total_completed: completedTasks?.length || 0,
            total_failed: failedTasks?.length || 0,
            agent_performance: agentStats,
            success_rate: (completedTasks?.length || 0) / ((completedTasks?.length || 0) + (failedTasks?.length || 0) || 1)
          }
        };
        break;

      case 'clear_all_blocked_tasks':
        // Clear all blocked tasks that are false positives
        const { data: allBlocked } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'BLOCKED');

        let clearedCount = 0;
        for (const task of allBlocked || []) {
          // Only clear if blocking reason contains github (since we verified it's working)
          if (task.blocking_reason?.toLowerCase().includes('github')) {
            await supabase
              .from('tasks')
              .update({
                status: 'PENDING',
                blocking_reason: null
              })
              .eq('id', task.id);
            clearedCount++;
          }
        }

        result = {
          success: true,
          cleared_count: clearedCount,
          remaining_blocked: (allBlocked?.length || 0) - clearedCount
        };
        break;

      case 'bulk_update_task_status':
        // Update multiple tasks at once
        const { task_ids, new_status, new_stage } = data;
        const { data: bulkUpdated, error: bulkError } = await supabase
          .from('tasks')
          .update({
            status: new_status,
            ...(new_stage && { stage: new_stage })
          })
          .in('id', task_ids)
          .select();

        if (bulkError) throw bulkError;

        result = {
          success: true,
          updated_count: bulkUpdated?.length || 0,
          tasks: bulkUpdated
        };
        break;

      case 'clear_all_workloads':
        // REFUSED. This action deleted every task on the board and reset every
        // agent to IDLE, and it was reachable by any caller of this function -
        // one request was equivalent to losing the pipeline's memory, with no
        // record of what was deleted and nothing to restore from.
        //
        // The board is cleaned by cancelling the tasks that should not run,
        // one at a time, with a reason recorded on each. That is auditable and
        // reversible. This was neither.
        result = {
          success: false,
          error: 'clear_all_workloads is disabled: it deleted the entire board with no record. '
            + 'Cancel the tasks you do not want, one at a time, with a cancel_reason.',
          deleted: 0,
          agents_reset: 0,
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await usageTracker.success({ result_summary: `${action} completed` });
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Task Orchestrator Error:', error);
    await usageTracker.failure(error.message, 500);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

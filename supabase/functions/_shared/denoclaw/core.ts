/**
 * DenoClaw / SupaClaw — Agent Execution Framework
 * 
 * A task orchestration system designed for Supabase Edge Functions (Deno runtime).
 * Handles the 60-second timeout limitation by decomposing work into checkpointed
 * sub-operations, persisting state to Supabase, and using continuation-based
 * execution for long-running agent workflows.
 * 
 * Architecture:
 *   Task → Decompose → Queue → Execute (≤60s) → Checkpoint → Continue…
 * 
 * Each operation is a Deno edge function invocation. State is persisted in
 * Supabase Postgres via the `agent_tasks` and `task_operations` tables.
 */

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

// ==========================================
// Types
// ==========================================

export interface DenoClawConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  maxOperationDurationMs: number;
  defaultTimeoutMs: number;
}

export type TaskStatus = 
  | "pending" 
  | "decomposed" 
  | "running" 
  | "checkpoint" 
  | "completed" 
  | "failed" 
  | "cancelled";

export type OperationType =
  | "pdf.merge"
  | "pdf.split"
  | "pdf.sign"
  | "pdf.ocr"
  | "pdf.watermark"
  | "pdf.metadata"
  | "pdf.extract_text"
  | "pdf.compress"
  | "ai.generate"
  | "ai.summarize"
  | "ai.classify"
  | "blockchain.call"
  | "blockchain.read"
  | "storage.upload"
  | "storage.download"
  | "web.fetch"
  | "web.scrape"
  | "notify.send"
  | "custom";

export interface AgentTask {
  id: string;
  agentId: string;
  status: TaskStatus;
  objective: string;
  context: Record<string, unknown>;
  priority: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
  parentTaskId?: string;
  checkpointData?: unknown;
}

export interface TaskOperation {
  id: string;
  taskId: string;
  sequence: number;
  opType: OperationType;
  input: Record<string, unknown>;
  output?: unknown;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  startedAt?: string;
  completedAt?: string;
  executionTimeMs?: number;
  retryCount: number;
  maxRetries: number;
}

export interface DecomposedPlan {
  taskId: string;
  operations: TaskOperation[];
  estimatedTotalTimeMs: number;
  requiresContinuation: boolean;
}

// ==========================================
// DenoClaw Orchestrator
// ==========================================

export class DenoClaw {
  private supabase: SupabaseClient;
  private config: DenoClawConfig;

  constructor(config: DenoClawConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  /**
   * Create a new agent task and immediately decompose it into operations.
   */
  async createTask(params: {
    agentId: string;
    objective: string;
    context?: Record<string, unknown>;
    priority?: number;
    parentTaskId?: string;
  }): Promise<AgentTask> {
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    const task: AgentTask = {
      id: taskId,
      agentId: params.agentId,
      status: "pending",
      objective: params.objective,
      context: params.context || {},
      priority: params.priority || 5,
      parentTaskId: params.parentTaskId,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await this.supabase.from("agent_tasks").insert(task);
    if (error) throw new Error(`Failed to create task: ${error.message}`);

    return task;
  }

  /**
   * Decompose a task into a plan of operations.
   * In production, this would call an AI planner. Here we use a rule-based
   * decomposer with extensible operation handlers.
   */
  async decomposeTask(taskId: string): Promise<DecomposedPlan> {
    const { data: task, error } = await this.supabase
      .from("agent_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error || !task) throw new Error(`Task not found: ${taskId}`);

    // Update status
    await this.supabase
      .from("agent_tasks")
      .update({ status: "decomposed", updatedAt: new Date().toISOString() })
      .eq("id", taskId);

    // Parse objective and build operation plan
    const plan = this.buildPlan(task);

    // Persist operations
    for (const op of plan.operations) {
      const { error: opError } = await this.supabase.from("task_operations").insert(op);
      if (opError) console.error(`Failed to insert operation ${op.id}:`, opError);
    }

    return plan;
  }

  /**
   * Execute the next pending operation for a task, respecting the 60s timeout.
   * Returns whether the task needs continuation (more ops pending).
   */
  async executeNextOperation(taskId: string): Promise<{
    completed: boolean;
    needsContinuation: boolean;
    lastOperation?: TaskOperation;
  }> {
    const startTime = Date.now();
    const deadline = startTime + this.config.maxOperationDurationMs;

    // Fetch next pending operation
    const { data: ops, error } = await this.supabase
      .from("task_operations")
      .select("*")
      .eq("task_id", taskId)
      .eq("status", "pending")
      .order("sequence", { ascending: true })
      .limit(1);

    if (error) throw new Error(`Failed to fetch operations: ${error.message}`);
    if (!ops || ops.length === 0) {
      // No more operations — mark task complete
      await this.supabase
        .from("agent_tasks")
        .update({ status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq("id", taskId);
      return { completed: true, needsContinuation: false };
    }

    const op = ops[0] as TaskOperation;

    // Check if we have enough time
    if (Date.now() + this.config.defaultTimeoutMs > deadline) {
      // Not enough time — checkpoint and schedule continuation
      await this.supabase
        .from("agent_tasks")
        .update({
          status: "checkpoint",
          checkpointData: { nextSequence: op.sequence },
          updatedAt: new Date().toISOString(),
        })
        .eq("id", taskId);
      return { completed: false, needsContinuation: true };
    }

    // Execute the operation
    const opStart = Date.now();
    try {
      await this.supabase
        .from("task_operations")
        .update({ status: "running", startedAt: new Date().toISOString() })
        .eq("id", op.id);

      const result = await this.executeOperation(op);

      await this.supabase
        .from("task_operations")
        .update({
          status: "completed",
          output: result,
          completedAt: new Date().toISOString(),
          executionTimeMs: Date.now() - opStart,
        })
        .eq("id", op.id);

      // Check if more operations remain
      const { data: remaining } = await this.supabase
        .from("task_operations")
        .select("id")
        .eq("task_id", taskId)
        .in("status", ["pending", "running"]);

      const needsContinuation = !!remaining && remaining.length > 0;
      if (!needsContinuation) {
        await this.supabase
          .from("agent_tasks")
          .update({ status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .eq("id", taskId);
      }

      return { completed: !needsContinuation, needsContinuation, lastOperation: { ...op, output: result } };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (op.retryCount < op.maxRetries) {
        // Retry
        await this.supabase
          .from("task_operations")
          .update({
            status: "pending",
            retryCount: op.retryCount + 1,
            error: errorMsg,
          })
          .eq("id", op.id);
      } else {
        // Mark failed
        await this.supabase
          .from("task_operations")
          .update({
            status: "failed",
            error: errorMsg,
            completedAt: new Date().toISOString(),
            executionTimeMs: Date.now() - opStart,
          })
          .eq("id", op.id);

        await this.supabase
          .from("agent_tasks")
          .update({ status: "failed", error: errorMsg, updatedAt: new Date().toISOString() })
          .eq("id", taskId);
      }

      return { completed: false, needsContinuation: false, lastOperation: { ...op, error: errorMsg } };
    }
  }

  /**
   * Execute a single operation. Routes to the appropriate handler.
   */
  private async executeOperation(op: TaskOperation): Promise<unknown> {
    const handler = operationHandlers[op.opType];
    if (!handler) {
      throw new Error(`No handler registered for operation type: ${op.opType}`);
    }
    return await handler(op.input, this.supabase);
  }

  /**
   * Build an execution plan from a task objective.
   * This is a rule-based planner. In production, replace with AI planner.
   */
  private buildPlan(task: AgentTask): DecomposedPlan {
    const objective = task.objective.toLowerCase();
    const operations: TaskOperation[] = [];
    let seq = 0;

    const addOp = (opType: OperationType, input: Record<string, unknown>) => {
      operations.push({
        id: crypto.randomUUID(),
        taskId: task.id,
        sequence: seq++,
        opType,
        input,
        status: "pending",
        retryCount: 0,
        maxRetries: 2,
      });
    };

    // PDF operations
    if (objective.includes("merge pdf") || objective.includes("combine pdf")) {
      addOp("pdf.merge", {
        sources: task.context.sources || [],
        outputName: task.context.outputName || "merged.pdf",
      });
    }

    if (objective.includes("split pdf")) {
      addOp("pdf.split", {
        source: task.context.source,
        ranges: task.context.ranges || [],
      });
    }

    if (objective.includes("sign pdf") || objective.includes("signature")) {
      addOp("pdf.sign", {
        source: task.context.source,
        signatureData: task.context.signatureData,
        position: task.context.position,
        reason: task.context.reason || "Digital signature by XMRT DAO",
      });
    }

    if (objective.includes("watermark")) {
      addOp("pdf.watermark", {
        source: task.context.source,
        text: task.context.text || "XMRT DAO Confidential",
        image: task.context.image,
        opacity: task.context.opacity || 0.3,
      });
    }

    if (objective.includes("extract text") || objective.includes("ocr")) {
      addOp("pdf.ocr", {
        source: task.context.source,
        language: task.context.language || "eng",
        outputFormat: task.context.outputFormat || "text",
      });
    }

    if (objective.includes("compress pdf") || objective.includes("optimize pdf")) {
      addOp("pdf.compress", {
        source: task.context.source,
        quality: task.context.quality || "medium",
      });
    }

    if (objective.includes("pdf metadata") || objective.includes("edit metadata")) {
      addOp("pdf.metadata", {
        source: task.context.source,
        metadata: task.context.metadata || {},
      });
    }

    // AI operations
    if (objective.includes("generate") || objective.includes("create content")) {
      addOp("ai.generate", {
        prompt: task.objective,
        model: task.context.model || "gpt-4",
        maxTokens: task.context.maxTokens || 2000,
      });
    }

    if (objective.includes("summarize")) {
      addOp("ai.summarize", {
        content: task.context.content,
        format: task.context.format || "bullet_points",
      });
    }

    // Blockchain operations
    if (objective.includes("blockchain") || objective.includes("smart contract")) {
      addOp("blockchain.read", {
        contract: task.context.contract,
        method: task.context.method,
        params: task.context.params || [],
      });
    }

    // Web operations
    if (objective.includes("fetch") || objective.includes("scrape")) {
      addOp("web.fetch", {
        url: task.context.url,
        method: task.context.method || "GET",
        headers: task.context.headers,
      });
    }

    // Storage operations
    if (objective.includes("upload")) {
      addOp("storage.upload", {
        bucket: task.context.bucket || "documents",
        path: task.context.path,
        data: task.context.data,
      });
    }

    // Default fallback
    if (operations.length === 0) {
      addOp("custom", {
        instruction: task.objective,
        context: task.context,
      });
    }

    // Estimate time: each PDF op ~10s, AI ~15s, blockchain ~5s, web ~10s
    const estimatedTotalTimeMs = operations.reduce((sum, op) => {
      const estimates: Record<string, number> = {
        "pdf.merge": 10000, "pdf.split": 8000, "pdf.sign": 12000, "pdf.ocr": 25000,
        "pdf.watermark": 8000, "pdf.metadata": 5000, "pdf.extract_text": 8000,
        "pdf.compress": 15000, "ai.generate": 15000, "ai.summarize": 10000,
        "ai.classify": 8000, "blockchain.call": 5000, "blockchain.read": 3000,
        "storage.upload": 5000, "storage.download": 5000, "web.fetch": 10000,
        "web.scrape": 15000, "notify.send": 3000, "custom": 10000,
      };
      return sum + (estimates[op.opType] || 10000);
    }, 0);

    return {
      taskId: task.id,
      operations,
      estimatedTotalTimeMs,
      requiresContinuation: estimatedTotalTimeMs > this.config.maxOperationDurationMs,
    };
  }
}

// ==========================================
// Operation Handlers Registry
// ==========================================

export type OperationHandler = (
  input: Record<string, unknown>,
  supabase: SupabaseClient
) => Promise<unknown>;

export const operationHandlers: Record<string, OperationHandler> = {};

export function registerHandler(opType: string, handler: OperationHandler): void {
  operationHandlers[opType] = handler;
}

// ==========================================
// Continuation Trigger
// ==========================================

/**
 * Check for checkpointed tasks and trigger their continuation.
 * This would be called by a scheduled Supabase Edge Function (cron)
 * or by a webhook from a completed operation.
 */
export async function processCheckpoints(config: DenoClawConfig): Promise<{
  processed: number;
  errors: string[];
}> {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  const claw = new DenoClaw(config);
  const errors: string[] = [];
  let processed = 0;

  const { data: tasks, error } = await supabase
    .from("agent_tasks")
    .select("*")
    .eq("status", "checkpoint")
    .order("updated_at", { ascending: true })
    .limit(10);

  if (error) {
    errors.push(`Failed to fetch checkpointed tasks: ${error.message}`);
    return { processed: 0, errors };
  }

  if (!tasks || tasks.length === 0) return { processed: 0, errors };

  for (const task of tasks) {
    try {
      const result = await claw.executeNextOperation(task.id);
      if (result.needsContinuation) {
        // Task will be picked up again by next cron run
      }
      processed++;
    } catch (err) {
      errors.push(`Task ${task.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { processed, errors };
}

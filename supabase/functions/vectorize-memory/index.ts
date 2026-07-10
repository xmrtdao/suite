import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
type LogSource = 'edge_function' | 'frontend' | 'background_task' | 'system';
type LogCategory =
  | 'performance'
  | 'security'
  | 'user_activity'
  | 'system_health'
  | 'api_call'
  | 'error'
  | 'workflow'
  | 'ai_interaction';

interface SystemLogEntry {
  log_level: LogLevel;
  log_source: LogSource;
  log_category: LogCategory;
  message: string;
  details?: Record<string, unknown>;
  error_stack?: string;
  user_context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface RequestLogContext {
  requestId: string;
  method?: string;
  action?: string;
  operation?: string;
  executionSource?: string;
  path?: string;
  duration_ms?: number;
  status?: number;
  [key: string]: unknown;
}

const EXPECTED_EMBEDDING_DIMENSION = 384;

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl) throw new Error('SUPABASE_URL environment variable is not set.');
  if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');

  return createClient(supabaseUrl, supabaseServiceKey);
}

async function logToSystem(functionName: string, entry: SystemLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('system_logs').insert({
      log_level: entry.log_level,
      log_source: entry.log_source,
      log_category: entry.log_category,
      message: `[${functionName}] ${entry.message}`,
      details: entry.details || {},
      error_stack: entry.error_stack,
      user_context: entry.user_context || {},
      metadata: {
        ...entry.metadata,
        function_name: functionName,
        timestamp: new Date().toISOString(),
      },
    });
    if (error) console.error('Failed to log to system_logs:', error.message);
  } catch (err) {
    console.error('System logging error:', err);
  }
}

const EdgeFunctionLogger = (functionName: string) => ({
  requestStart: async (message: string, context: RequestLogContext) => {
    console.log(JSON.stringify({ level: 'info', event: 'request_start', function_name: functionName, timestamp: new Date().toISOString(), ...context, message }));
    await logToSystem(functionName, {
      log_level: 'info',
      log_source: 'edge_function',
      log_category: 'api_call',
      message,
      details: context,
    });
  },
  requestComplete: async (message: string, context: RequestLogContext, details?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: context.status && context.status >= 400 ? 'error' : 'info', event: 'request_complete', function_name: functionName, timestamp: new Date().toISOString(), ...context, details, message }));
    await logToSystem(functionName, {
      log_level: context.status && context.status >= 400 ? 'error' : 'info',
      log_source: 'edge_function',
      log_category: context.status && context.status >= 400 ? 'error' : 'api_call',
      message,
      details: { ...context, ...details },
    });
  },
});

function createRequestContext(req: Request, extra: Record<string, unknown> = {}): RequestLogContext {
  const url = new URL(req.url);
  return {
    requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
    method: req.method,
    path: url.pathname,
    ...extra,
  };
}

function startUsageTracking(functionName: string, _unused?: unknown, base: Record<string, unknown> = {}) {
  const startedAt = Date.now();
  return {
    success: async (details: Record<string, unknown> = {}) => {
      await logToSystem(functionName, {
        log_level: 'info',
        log_source: 'edge_function',
        log_category: 'performance',
        message: 'usage_success',
        details: { ...base, ...details, duration_ms: Date.now() - startedAt },
      });
    },
    failure: async (error: string, status = 500) => {
      await logToSystem(functionName, {
        log_level: 'error',
        log_source: 'edge_function',
        log_category: 'error',
        message: 'usage_failure',
        details: { ...base, status, duration_ms: Date.now() - startedAt },
        error_stack: error,
      });
    },
  };
}

function assertEmbeddingDimension(embedding: number[]): void {
  if (embedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIMENSION}, got ${embedding.length}`,
    );
  }
}

async function generateEmbedding(content: string): Promise<number[]> {
  try {
    const model = new Supabase.ai.Session('gte-small');
    const output = await model.run(content, { mean_pool: true, normalize: true });
    if (!Array.isArray(output)) {
      throw new Error(`Embedding output is not an array. Received: ${JSON.stringify(output)}`);
    }
    const embedding = output as number[];
    assertEmbeddingDimension(embedding);
    return embedding;
  } catch (err) {
    console.error('Error during generateEmbedding:', err);
    throw new Error(`Failed to generate embedding: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const FUNCTION_NAME = 'vectorize-memory';
const logger = EdgeFunctionLogger(FUNCTION_NAME);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, { method: req.method });
  const startedAt = Date.now();
  const requestContext = createRequestContext(req);
  let memory_id: string | undefined;
  let entity_id: string | undefined;

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength === 0 || contentLength < 5) {
    await usageTracker.success({ cron: true });
    await logger.requestStart('Vectorize-memory cron trigger received', { ...requestContext, operation: 'cron_noop' });
    await logger.requestComplete('Vectorize-memory cron trigger completed', {
      ...requestContext,
      operation: 'cron_noop',
      duration_ms: Date.now() - startedAt,
      status: 200,
    }, { cron: true });

    return new Response(JSON.stringify({ success: true, cron: true, message: 'Cron trigger - no memory data provided' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const action = payload.action;
    memory_id = payload.memory_id;
    entity_id = payload.entity_id;
    const content = payload.content;
    const context_type = payload.context_type;
    const metadata = payload.metadata;

    requestContext.operation = action || 'vectorize_memory_default';

    await logger.requestStart(`Vectorize-memory request received - Action: ${action || 'default'}`, {
      ...requestContext,
      memory_id,
      entity_id,
      context_type,
      action,
      metadata,
    });

    switch (action) {
      case 'embed': {
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          await logger.requestComplete('Vectorize-memory skipped: invalid content for embed action', {
            ...requestContext,
            duration_ms: Date.now() - startedAt,
            status: 400,
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'content is required and must be a non-empty string for embed action',
            skipped: true,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let embedding: number[];
        try {
          embedding = await Promise.race([
            generateEmbedding(content),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Embedding generation timeout')), 12000)),
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          console.error('Embedding generation or timeout error:', error);
          await usageTracker.failure(message, 503);
          await logger.requestComplete('Vectorize-memory embed action failed', {
            ...requestContext,
            action,
            duration_ms: Date.now() - startedAt,
            status: 503,
          }, { error: message, errorStack: errorStack, fullError: String(error) });

          return new Response(JSON.stringify({
            error: 'Vectorization unavailable - timeout or embedding runtime issue',
            details: message,
            skipped: true,
          }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await usageTracker.success({ action, content_length: content.length, embedding_dimensions: embedding.length });
        await logger.requestComplete('Vectorize-memory embed action completed', {
          ...requestContext,
          action,
          duration_ms: Date.now() - startedAt,
          status: 200,
        }, { embedding_dimensions: embedding.length });

        return new Response(JSON.stringify({ success: true, embedding, dimension: embedding.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'embed_and_store_memory':
      case undefined: {
        if (!memory_id) {
          await logger.requestComplete('Vectorize-memory skipped: missing memory_id for embed_and_store_memory action', {
            ...requestContext,
            duration_ms: Date.now() - startedAt,
            status: 400,
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'memory_id is required for embed_and_store_memory action',
            skipped: true,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          await logger.requestComplete('Vectorize-memory skipped: invalid content for embed_and_store_memory action', {
            ...requestContext,
            memory_id,
            duration_ms: Date.now() - startedAt,
            status: 400,
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'content is required and must be a non-empty string for embed_and_store_memory action',
            memory_id,
            skipped: true,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let embedding: number[];
        try {
          embedding = await Promise.race([
            generateEmbedding(content),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Embedding generation timeout')), 12000)),
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          console.error('Embedding generation or timeout error:', error);
          await usageTracker.failure(message, 503);
          await logger.requestComplete('Vectorize-memory embed_and_store_memory action failed', {
            ...requestContext,
            memory_id,
            action,
            duration_ms: Date.now() - startedAt,
            status: 503,
          }, { error: message, errorStack: errorStack, fullError: String(error) });

          return new Response(JSON.stringify({
            error: 'Vectorization unavailable - timeout or embedding runtime issue',
            details: message,
            memory_id,
            skipped: true,
          }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const supabase = getSupabaseClient();
        const { error: updateError } = await supabase
          .from('memory_contexts')
          .update({
            embedding,
            embedding_v_384: embedding,
          })
          .eq('id', memory_id);

        if (updateError) {
          console.error('Database update failed:', updateError);
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        await usageTracker.success({ action, memory_id, content_length: content.length, embedding_dimensions: embedding.length });
        await logger.requestComplete('Vectorize-memory embed_and_store_memory action completed', {
          ...requestContext,
          memory_id,
          context_type,
          duration_ms: Date.now() - startedAt,
          status: 200,
        }, { embedding_dimensions: embedding.length });

        return new Response(JSON.stringify({ success: true, memory_id, dimension: embedding.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'embed_and_store_knowledge_entity': {
        if (!entity_id) {
          await logger.requestComplete('Vectorize-memory skipped: missing entity_id for embed_and_store_knowledge_entity action', {
            ...requestContext,
            duration_ms: Date.now() - startedAt,
            status: 400,
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'entity_id is required for embed_and_store_knowledge_entity action',
            skipped: true,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          await logger.requestComplete('Vectorize-memory skipped: invalid content for embed_and_store_knowledge_entity action', {
            ...requestContext,
            entity_id,
            duration_ms: Date.now() - startedAt,
            status: 400,
          });
          return new Response(JSON.stringify({
            success: false,
            error: 'content is required and must be a non-empty string for embed_and_store_knowledge_entity action',
            entity_id,
            skipped: true,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let embedding: number[];
        try {
          embedding = await Promise.race([
            generateEmbedding(content),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Embedding generation timeout')), 12000)),
          ]);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          console.error('Embedding generation or timeout error:', error);
          await usageTracker.failure(message, 503);
          await logger.requestComplete('Vectorize-memory embed_and_store_knowledge_entity action failed', {
            ...requestContext,
            entity_id,
            action,
            duration_ms: Date.now() - startedAt,
            status: 503,
          }, { error: message, errorStack: errorStack, fullError: String(error) });

          return new Response(JSON.stringify({
            error: 'Vectorization unavailable - timeout or embedding runtime issue',
            details: message,
            entity_id,
            skipped: true,
          }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const supabase = getSupabaseClient();
        const { error: updateError } = await supabase
          .from('knowledge_entities')
          .update({ embedding_v_384: embedding })
          .eq('id', entity_id);

        if (updateError) {
          console.error('Database update failed for knowledge_entities:', updateError);
          throw new Error(`Database update failed for knowledge_entities: ${updateError.message}`);
        }

        await usageTracker.success({ action, entity_id, content_length: content.length, embedding_dimensions: embedding.length });
        await logger.requestComplete('Vectorize-memory embed_and_store_knowledge_entity action completed', {
          ...requestContext,
          entity_id,
          duration_ms: Date.now() - startedAt,
          status: 200,
        }, { embedding_dimensions: embedding.length });

        return new Response(JSON.stringify({ success: true, entity_id, dimension: embedding.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        await logger.requestComplete('Vectorize-memory: Unknown action', {
          ...requestContext,
          action,
          duration_ms: Date.now() - startedAt,
          status: 400,
        });
        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Unhandled Vectorize-memory request failed:', error);

    await usageTracker.failure(message, 500);
    await logger.requestComplete('Vectorize-memory request failed', {
      ...requestContext,
      memory_id,
      entity_id,
      duration_ms: Date.now() - startedAt,
      status: 500,
    }, { error: message, errorStack: errorStack, fullError: String(error) });

    return new Response(JSON.stringify({ error: message, details: errorStack || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

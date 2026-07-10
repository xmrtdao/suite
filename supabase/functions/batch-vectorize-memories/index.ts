import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { startUsageTracking } from '../_shared/functionUsageLogger.ts';
import {
  EdgeFunctionLogger,
  createRequestContext,
} from '../_shared/logging.ts';

const FUNCTION_NAME = 'batch-vectorize-memories';
const logger = EdgeFunctionLogger(FUNCTION_NAME);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Ollama embedding config
const OLLAMA_HOST = (Deno.env.get('OLLAMA_HOST') || 'http://localhost:11434').replace(/\/$/, '');
const EMBED_MODEL = 'all-minilm';
const BATCH_SIZE = 5;
const EMBED_TIMEOUT_MS = 15000;

/** Safe JSON serializer that never produces [object Object] */
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (value === undefined) return null;
      if (typeof value === 'object' && value !== null) {
        // Prevent circular refs and object coercion
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(value, (k, v) => {
          if (v !== null && typeof v === 'object') {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          if (v === undefined) return null;
          if (typeof v === 'bigint') return v.toString();
          if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
          return v;
        }));
      }
      if (typeof value === 'bigint') return value.toString();
      return value;
    });
  } catch (e) {
    console.error('safeStringify failed:', e.message);
    return JSON.stringify({ error: 'serialization_failed', message: String(e) });
  }
}

/** Safe JSON parser with type validation */
function safeParse<T>(text: string, validator?: (obj: unknown) => obj is T): T | null {
  try {
    const parsed = JSON.parse(text);
    if (validator && !validator(parsed)) {
      console.warn('safeParse: validation failed for:', text.slice(0, 200));
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn('safeParse failed:', e.message, 'text:', text.slice(0, 200));
    return null;
  }
}

/** Embedding result type guard */
function isEmbeddingResponse(obj: unknown): obj is { embeddings: number[][]; model?: string } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return Array.isArray(o.embeddings) && o.embeddings.length > 0 && Array.isArray(o.embeddings[0]);
}

/** Generate embedding via local Ollama with timeout */
async function generateEmbedding(text: string): Promise<number[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify({ model: EMBED_MODEL, input: text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama embed failed (${res.status}): ${errText}`);
    }

    const text = await res.text();
    const data = safeParse(text, isEmbeddingResponse);
    if (!data) {
      throw new Error('Invalid embedding response format');
    }

    const embedding = data.embeddings?.[0];
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('No embedding in response');
    }

    console.log(`✅ Embedding generated: ${embedding.length} dims`);
    return embedding;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Embedding generation failed:', error.message);
    throw error;
  }
}

/** Update memory with embedding */
async function updateMemoryEmbedding(supabase: any, memoryId: string, embedding: number[]): Promise<void> {
  const { error } = await supabase
    .from('memory_contexts')
    .update({ embedding })
    .eq('id', memoryId);

  if (error) {
    throw new Error(`DB update failed for ${memoryId}: ${error.message}`);
  }
}

/** Batch vectorize unvectorized memories */
async function batchVectorize(supabase: any, limit: number = BATCH_SIZE): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  // Get unvectorized memories
  const { data: memories, error } = await supabase
    .from('memory_contexts')
    .select('id, content, context_type, user_id')
    .is('embedding', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to query unvectorized memories: ${error.message}`);
  }

  if (!memories || memories.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, errors: [] };
  }

  console.log(`📦 Found ${memories.length} unvectorized memories to process`);

  const result = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };

  for (const memory of memories) {
    result.processed++;
    const content = memory.content || '';
    const memoryId = memory.id;

    if (!content.trim()) {
      console.warn(`⚠️ Skipping empty content for memory ${memoryId}`);
      result.failed++;
      result.errors.push(`Empty content: ${memoryId}`);
      continue;
    }

    try {
      const embedding = await generateEmbedding(content);
      await updateMemoryEmbedding(supabase, memoryId, embedding);
      result.succeeded++;
      console.log(`✅ Vectorized ${memoryId} (${content.length} chars)`);
    } catch (e) {
      result.failed++;
      const errMsg = `${memoryId}: ${e.message}`;
      result.errors.push(errMsg);
      console.error(`❌ ${errMsg}`);
    }
  }

  return result;
}

serve(async (req) => {
  const usageTracker = startUsageTracking(FUNCTION_NAME, undefined, {
    method: req.method,
  });
  const startedAt = Date.now();
  const requestContext = createRequestContext(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await logger.requestStart('Batch vectorize request received', requestContext);

    // Parse optional limit from body
    let limit = BATCH_SIZE;
    if (req.method === 'POST' || req.method === 'QUERY') {
      const bodyText = await req.text();
      const body = safeParse(bodyText);
      if (body && typeof body === 'object' && 'limit' in body) {
        limit = Math.min(Math.max(parseInt(body.limit) || BATCH_SIZE, 1), 20);
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result = await batchVectorize(supabase, limit);

    await usageTracker.success(result);
    await logger.requestComplete(
      'Batch vectorize completed',
      {
        ...requestContext,
        duration_ms: Date.now() - startedAt,
        status: 200,
      },
      result
    );

    return new Response(
      safeStringify({
        success: true,
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        errors: result.errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in batch-vectorize-memories:', error);
    await usageTracker.failure(error.message, 500);
    await logger.requestComplete(
      'Batch vectorize failed',
      {
        ...requestContext,
        duration_ms: Date.now() - startedAt,
        status: 500,
      },
      { error: error.message }
    );

    return new Response(
      safeStringify({
        success: false,
        error: error.message,
        processed: 0,
        succeeded: 0,
        failed: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

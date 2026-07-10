/**
 * Unified AI Fallback Service - OLLAMA PRO PRIMARY VERSION
 * Provider cascade:
 *   1. Ollama Pro Cloud (primary)
 *   2. DeepSeek V3
 *   3. Kimi
 *
 * TIMEOUT GUARDS: Per-provider timeouts prevent cascade hangs
 * FAST-FAIL: 402/429 errors skip immediately to next provider
 * 
 * NOTE: Vertex AI / Google Cloud providers removed per migration to MuAPI.
 */ import { generateElizaSystemPrompt } from './elizaSystemPrompt.ts';
import { ELIZA_TOOLS } from './elizaTools.ts';
// Per-provider timeout configuration (ms)
const PROVIDER_TIMEOUTS = {
  ollamaPro: 15000,
  deepseek: 10000,
  kimi: 8000,
  embedding: 10000
};
const RESPONSE_MAX_TOKENS = parseInt(Deno.env.get('RESPONSE_MAX_TOKENS') || '16000');
/**
 * Fetch with timeout - aborts request if provider is slow/hung
 */ async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(()=>controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}
/**
 * Fast-fail check for credit exhaustion/rate limiting
 * Returns error message if should skip, null if OK to proceed
 */ function checkFastFail(response, provider) {
  if (response.status === 402) {
    console.warn(`💳 ${provider} out of credits (402) - skipping to next provider`);
    return '402 Payment Required - out of credits';
  }
  if (response.status === 429) {
    console.warn(`⏱️ ${provider} rate limited (429) - skipping to next provider`);
    return '429 Rate Limited';
  }
  return null;
}
// Action-oriented directive prepended to ALL fallback prompts
const ACTION_DIRECTIVE = `
CRITICAL RESPONSE RULES (HIGHEST PRIORITY):
1. NEVER explain what you're going to do - JUST DO IT
2. Call tools IMMEDIATELY when user asks for information
3. Present results NATURALLY as if you already knew the answer
4. Keep responses CONCISE - no unnecessary preamble (1-3 sentences for simple queries)
5. Only mention tools/functions when there's an ERROR to report
6. User should NEVER know you're calling tools - be seamless
`;
/**
 * Get the effective system prompt - uses full Eliza prompt if not provided
 * ENHANCED: Prepends action-oriented directive AND appends executive persona override
 */ function getEffectiveSystemPrompt(options) {
  // 1. If strict manual prompt provided (long), use it directly (bypass Eliza injection)
  if (options.systemPrompt && options.systemPrompt.length > 2000) {
    return ACTION_DIRECTIVE + '\n\n' + options.systemPrompt;
  }
  if (options.useFullElizaContext === false) {
    // Explicitly disabled - still add action directive for conciseness
    return ACTION_DIRECTIVE + '\n\n' + (options.systemPrompt || 'You are a helpful AI assistant.');
  }
  // DEFAULT: Use full Eliza system prompt for intelligence parity
  console.log('🧠 Enriching with full Eliza system prompt + action directive...');
  const elizaPrompt = generateElizaSystemPrompt(options.userContext, options.miningStats, null, 'eliza', options.executiveName || 'Chief Strategy Officer');
  // CRITICAL: If a specific persona/prompt is provided (e.g. "You are the CTO"),
  // APPEND it to the end to OVERRIDE the default Eliza identity while keeping capabilities.
  if (options.systemPrompt) {
    return ACTION_DIRECTIVE + '\n\n' + elizaPrompt + '\n\n' + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' + '👤 EXECUTIVE PERSONA OVERRIDE (ADOPT THIS IDENTITY)\n' + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' + options.systemPrompt;
  }
  return ACTION_DIRECTIVE + '\n\n' + elizaPrompt;
}
/**
 * Get effective tools - uses ELIZA_TOOLS if not provided
 */ function getEffectiveTools(options) {
  if (options.tools && options.tools.length > 0) {
    return options.tools;
  }
  if (options.useFullElizaContext === false) {
    return [];
  }
  // DEFAULT: Use full Eliza tools for capability parity
  console.log('🔧 Including all ELIZA_TOOLS for fallback provider...');
  return ELIZA_TOOLS;
}
/**
 * Call DeepSeek V3 - FALLBACK PROVIDER (Reasoning)
 */ async function callDeepSeek(messages, options = {}) {
  const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
  if (!DEEPSEEK_API_KEY) {
    return {
      success: false,
      provider: 'deepseek',
      error: 'DEEPSEEK_API_KEY not configured'
    };
  }
  try {
    console.log('🧠 FALLBACK PROVIDER: Attempting DeepSeek V3 with full Eliza context...');
    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);
    // DeepSeek V3 supports system messages
    const requestMessages = [
      {
        role: 'system',
        content: effectiveSystemPrompt
      },
      ...messages.filter((m)=>m.role !== 'system')
    ];
    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;
    const requestBody = {
      model: 'deepseek-v4-pro',
      messages: requestMessages,
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens
    };
    // Note: DeepSeek V3 tool calling support varies, but we'll try passing them
    // If it fails, we might need to disable tools for strict DeepSeek usage
    if (effectiveTools.length > 0) {
    // Check if DeepSeek supports OpenAI format tools (it usually does)
    // requestBody.tools = effectiveTools;
    // requestBody.tool_choice = 'auto';
    // For now, simpler DeepSeek usage (often used for pure reasoning)
    }
    const response = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, PROVIDER_TIMEOUTS.deepseek);
    // Fast-fail for credit exhaustion
    const fastFailError = checkFastFail(response, 'deepseek');
    if (fastFailError) {
      return {
        success: false,
        provider: 'deepseek',
        error: fastFailError
      };
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ DeepSeek failed (${response.status}):`, errorText);
      return {
        success: false,
        provider: 'deepseek',
        error: `${response.status}: ${errorText}`
      };
    }
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) {
      return {
        success: false,
        provider: 'deepseek',
        error: 'No message in response'
      };
    }
    console.log('✅ DeepSeek AI successful with Eliza intelligence');
    if (message.tool_calls?.length > 0) {
      console.log(`🔧 DeepSeek returned ${message.tool_calls.length} tool calls`);
      return {
        success: true,
        provider: 'deepseek',
        message
      };
    }
    return {
      success: true,
      provider: 'deepseek',
      content: message.content || ''
    };
  } catch (error) {
    console.warn('⚠️ DeepSeek error:', error.message);
    return {
      success: false,
      provider: 'deepseek',
      error: error.message
    };
  }
}
/**
 * Call Kimi via Kimi Code API - FINAL FALLBACK PROVIDER
 */ async function callKimi(messages, options = {}) {
  const KIMI_API_KEY = Deno.env.get('KIMI_API_KEY');
  if (!KIMI_API_KEY) {
    return {
      success: false,
      provider: 'kimi',
      error: 'KIMI_API_KEY not configured'
    };
  }
  try {
    console.log('🦊 FINAL FALLBACK: Attempting Kimi via Kimi Code API...');
    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);
    const requestMessages = [
      {
        role: 'system',
        content: effectiveSystemPrompt
      },
      ...messages.filter((m)=>m.role !== 'system')
    ];
    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;
    const requestBody = {
      model: 'kimi-for-coding',
      messages: requestMessages,
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens
    };
    // Include ALL tools for Kimi
    if (effectiveTools.length > 0) {
      console.log(`📊 Kimi: Passing ${effectiveTools.length} tools (full array)`);
      requestBody.tools = effectiveTools;
      requestBody.tool_choice = 'auto';
    }
    const headers = {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json'
    };
    const response = await fetchWithTimeout('https://api.kimi.com/coding/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    }, PROVIDER_TIMEOUTS.kimi);
    // Fast-fail
    const fastFailError = checkFastFail(response, 'kimi');
    if (fastFailError) {
      return {
        success: false,
        provider: 'kimi',
        error: fastFailError
      };
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Kimi failed (${response.status}):`, errorText);
      return {
        success: false,
        provider: 'kimi',
        error: `${response.status}: ${errorText}`
      };
    }
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) {
      return {
        success: false,
        provider: 'kimi',
        error: 'No message in response'
      };
    }
    console.log('✅ Kimi AI successful with Eliza intelligence');
    if (message.tool_calls?.length > 0) {
      console.log(`🔧 Kimi returned ${message.tool_calls.length} tool calls`);
      return {
        success: true,
        provider: 'kimi',
        message
      };
    }
    return {
      success: true,
      provider: 'kimi',
      content: message.content || ''
    };
  } catch (error) {
    console.warn('⚠️ Kimi error:', error.message);
    return {
      success: false,
      provider: 'kimi',
      error: error.message
    };
  }
}
/**
 * Call Ollama Cloud via ollama.com API (OpenAI-compatible).
 * Uses OLLAMA_API_KEY secret from Supabase.
 * Default model: deepseek-v4-flash:cloud (Vex primary)
 * Backup models available on ollama.com: gpt-oss:120b, deepseek-v4-pro, qwen3.5:397b
 */ async function callOllamaPro(messages, options = {}) {
  const OLLAMA_API_KEY = Deno.env.get('OLLAMA_API_KEY');
  if (!OLLAMA_API_KEY) {
    return {
      success: false,
      provider: 'ollama-pro',
      error: 'OLLAMA_API_KEY not configured'
    };
  }
  try {
    const ollamaModel = Deno.env.get('OLLAMA_MODEL') || 'deepseek-v4-flash:cloud';
    console.log(`🔮 PRIMARY: Attempting Ollama Pro Cloud (${ollamaModel})...`);
    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);
    const requestMessages = [
      {
        role: 'system',
        content: effectiveSystemPrompt
      },
      ...messages.filter((m)=>m.role !== 'system')
    ];
    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;
    const requestBody = {
      model: ollamaModel,
      messages: requestMessages,
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens
    };
    // Include tools if available
    if (effectiveTools.length > 0) {
      console.log(`🔧 Ollama Pro: Passing ${effectiveTools.length} tools`);
      requestBody.tools = effectiveTools;
      requestBody.tool_choice = 'auto';
    }
    const response = await fetchWithTimeout('https://ollama.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }, PROVIDER_TIMEOUTS.ollamaPro);
    // Fast-fail check
    const fastFailError = checkFastFail(response, 'ollama-pro');
    if (fastFailError) {
      return {
        success: false,
        provider: 'ollama-pro',
        error: fastFailError
      };
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Ollama Pro failed (${response.status}):`, errorText);
      return {
        success: false,
        provider: 'ollama-pro',
        error: `${response.status}: ${errorText}`
      };
    }
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) {
      return {
        success: false,
        provider: 'ollama-pro',
        error: 'No message in response'
      };
    }
    console.log('✅ Ollama Pro successful');
    if (message.tool_calls?.length > 0) {
      console.log(`🔧 Ollama Pro returned ${message.tool_calls.length} tool calls`);
      return {
        success: true,
        provider: 'ollama-pro',
        message
      };
    }
    return {
      success: true,
      provider: 'ollama-pro',
      content: message.content || ''
    };
  } catch (error) {
    console.warn('⚠️ Ollama Cloud error:', error.message);
    return {
      success: false,
      provider: 'ollama-pro',
      error: error.message
    };
  }
}
/**
 * MAIN ENTRY POINT: Unified AI Fallback Cascade
 *
 * Order:
 *   1. PRIMARY: Ollama Pro Cloud (OLLAMA_API_KEY, model = OLLAMA_MODEL or deepseek-v4-flash:cloud)
 *   2. DeepSeek V3
 *   3. Kimi
 *
 * NOTE: Vertex AI / Google Cloud providers removed per migration to MuAPI.
 */ export async function callAIWithFallback(messages, options = {}) {
  const errors = [];
  // 1. PRIMARY: Ollama Pro Cloud (deepseek-v4-flash:cloud by default)
  const ollamaResult = await callOllamaPro(messages, options);
  if (ollamaResult.success) return transformResult(ollamaResult);
  errors.push(`OllamaPro: ${ollamaResult.error}`);
  console.warn('⚠️ Ollama Pro failed, trying DeepSeek backup...');
  // 2. BACKUP: DeepSeek V3
  const deepSeekResult = await callDeepSeek(messages, options);
  if (deepSeekResult.success) return transformResult(deepSeekResult);
  errors.push(`DeepSeek: ${deepSeekResult.error}`);
  // 3. BACKUP: Kimi
  const kimiResult = await callKimi(messages, options);
  if (kimiResult.success) return transformResult(kimiResult);
  errors.push(`Kimi: ${kimiResult.error}`);
  throw new Error(`All AI providers failed: ${errors.join(' | ')}`);
}
/**
 * Transform standard result format into string or object (for backward compatibility)
 */ function transformResult(result) {
  if (result.message) {
    // Return full message object (with tool calls)
    return {
      role: 'assistant',
      content: result.message.content,
      tool_calls: result.message.tool_calls,
      provider: result.provider
    };
  }
  // Return simple object with content (Exec Council compatibility)
  return {
    content: result.content || '',
    provider: result.provider
  };
}
/**
 * Generate Embedding using Supabase Native AI (ONNX via internal Runtime)
 * Uses Singleton pattern to prevent memory leaks/crashes
 */ let embeddingSession = null;
export async function generateEmbedding(text) {
  // ── TRY 1: Supabase Native AI (cloud / managed) ──────────────────────────
  try {
    // @ts-ignore: Supabase is a global in Edge Runtime
    if (typeof Supabase !== 'undefined' && Supabase.ai) {
      console.log(`🧠 Generating embedding via Supabase Native AI (gte-small)...`);
      // Initialize session only once (Singleton)
      if (!embeddingSession) {
        console.log('🔌 Initializing new Supabase.ai Session (gte-small)...');
        // @ts-ignore: Supabase is a global in Edge Runtime
        embeddingSession = new Supabase.ai.Session('gte-small');
      }
      const output = await embeddingSession.run(text, {
        mean_pool: true,
        normalize: true
      });
      if (output && Array.isArray(output)) {
        console.log(`✅ Supabase Native AI embedding: ${output.length} dims`);
        return output;
      }
      console.warn('⚠️ Supabase AI returned invalid format, falling back to Ollama...');
    }
  } catch (error) {
    console.warn('⚠️ Supabase Native AI unavailable, falling back to local Ollama:', error.message);
    embeddingSession = null;
  }
  // ── TRY 2: Local Ollama embedding API (all-minilm, 384-dim) ──────────────
  const ollamaHost = (Deno.env.get('OLLAMA_HOST') || 'http://localhost:11434').replace(/\/$/, '');
  const embedModel = 'all-minilm';
  try {
    console.log(`🧠 Generating embedding via local Ollama (${ollamaHost}, ${embedModel})...`);
    const res = await fetch(`${ollamaHost}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: embedModel,
        input: text
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama embed failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    const embedding = data.embeddings?.[0];
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding format from Ollama');
    }
    console.log(`✅ Local Ollama embedding: ${embedding.length} dims (model=${data.model || embedModel})`);
    return embedding;
  } catch (error) {
    console.error('❌ Both embedding providers failed:', error.message);
    throw error;
  }
}
/**
 * Generate text using the AI fallback cascade.
 * Wrapper around callAIWithFallback that matches the signature used by 12+ edge functions.
 * @param prompt - The user/content prompt string
 * @param systemPrompt - Optional system prompt (used as the only system message)
 * @param options - Optional UnifiedAIOptions overrides
 * @returns Generated text content (string), or throws on total cascade failure
 */ export async function generateTextWithFallback(prompt, systemPrompt, options) {
  const messages = [];
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    });
  }
  messages.push({
    role: 'user',
    content: prompt
  });
  const result = await callAIWithFallback(messages, {
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? options?.max_tokens ?? 2048,
    useFullElizaContext: options?.useFullElizaContext ?? true,
    preferProvider: 'deepseek'
  });
  // callAIWithFallback returns { content, provider } or throws
  if (typeof result === 'string') return result;
  if (result && result.content) return result.content;
  if (result && typeof result === 'object' && 'content' in result) return result.content;
  throw new Error('generateTextWithFallback: no content from AI cascade (' + (result?.provider || 'unknown') + '): ' + (result?.error || 'unknown error'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL3VuaWZpZWRBSUZhbGxiYWNrLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVW5pZmllZCBBSSBGYWxsYmFjayBTZXJ2aWNlIC0gT0xMQU1BIFBSTyBQUklNQVJZIFZFUlNJT05cbiAqIFByb3ZpZGVyIGNhc2NhZGU6XG4gKiAgIDEuIE9sbGFtYSBQcm8gQ2xvdWQgKHByaW1hcnkpXG4gKiAgIDIuIERlZXBTZWVrIFYzXG4gKiAgIDMuIEtpbWlcbiAqXG4gKiBUSU1FT1VUIEdVQVJEUzogUGVyLXByb3ZpZGVyIHRpbWVvdXRzIHByZXZlbnQgY2FzY2FkZSBoYW5nc1xuICogRkFTVC1GQUlMOiA0MDIvNDI5IGVycm9ycyBza2lwIGltbWVkaWF0ZWx5IHRvIG5leHQgcHJvdmlkZXJcbiAqIFxuICogTk9URTogVmVydGV4IEFJIC8gR29vZ2xlIENsb3VkIHByb3ZpZGVycyByZW1vdmVkIHBlciBtaWdyYXRpb24gdG8gTXVBUEkuXG4gKi9cblxuaW1wb3J0IHsgZ2VuZXJhdGVFbGl6YVN5c3RlbVByb21wdCB9IGZyb20gJy4vZWxpemFTeXN0ZW1Qcm9tcHQudHMnO1xuaW1wb3J0IHsgRUxJWkFfVE9PTFMgfSBmcm9tICcuL2VsaXphVG9vbHMudHMnO1xuXG4vLyBQZXItcHJvdmlkZXIgdGltZW91dCBjb25maWd1cmF0aW9uIChtcylcbmNvbnN0IFBST1ZJREVSX1RJTUVPVVRTID0ge1xuICBvbGxhbWFQcm86IDE1MDAwLCAgIC8vIE9sbGFtYSBQcm8gY2xvdWQgKE9wZW5BSS1jb21wYXRpYmxlKVxuICBkZWVwc2VlazogMTAwMDAsICAgIC8vIFNsaWdodGx5IGxvbmdlciBmb3IgcmVhc29uaW5nXG4gIGtpbWk6IDgwMDAsXG4gIGVtYmVkZGluZzogMTAwMDAsXG59O1xuY29uc3QgUkVTUE9OU0VfTUFYX1RPS0VOUyA9IHBhcnNlSW50KERlbm8uZW52LmdldCgnUkVTUE9OU0VfTUFYX1RPS0VOUycpIHx8ICcxNjAwMCcpO1xuXG4vKipcbiAqIEZldGNoIHdpdGggdGltZW91dCAtIGFib3J0cyByZXF1ZXN0IGlmIHByb3ZpZGVyIGlzIHNsb3cvaHVuZ1xuICovXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdpdGhUaW1lb3V0KFxuICB1cmw6IHN0cmluZyxcbiAgb3B0aW9uczogUmVxdWVzdEluaXQsXG4gIHRpbWVvdXRNczogbnVtYmVyXG4pOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0TXMpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHsgLi4ub3B0aW9ucywgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdBYm9ydEVycm9yJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1ZXN0IHRpbWVvdXQgYWZ0ZXIgJHt0aW1lb3V0TXN9bXNgKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuLyoqXG4gKiBGYXN0LWZhaWwgY2hlY2sgZm9yIGNyZWRpdCBleGhhdXN0aW9uL3JhdGUgbGltaXRpbmdcbiAqIFJldHVybnMgZXJyb3IgbWVzc2FnZSBpZiBzaG91bGQgc2tpcCwgbnVsbCBpZiBPSyB0byBwcm9jZWVkXG4gKi9cbmZ1bmN0aW9uIGNoZWNrRmFzdEZhaWwocmVzcG9uc2U6IFJlc3BvbnNlLCBwcm92aWRlcjogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMikge1xuICAgIGNvbnNvbGUud2Fybihg8J+SsyAke3Byb3ZpZGVyfSBvdXQgb2YgY3JlZGl0cyAoNDAyKSAtIHNraXBwaW5nIHRvIG5leHQgcHJvdmlkZXJgKTtcbiAgICByZXR1cm4gJzQwMiBQYXltZW50IFJlcXVpcmVkIC0gb3V0IG9mIGNyZWRpdHMnO1xuICB9XG4gIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQyOSkge1xuICAgIGNvbnNvbGUud2Fybihg4o+x77iPICR7cHJvdmlkZXJ9IHJhdGUgbGltaXRlZCAoNDI5KSAtIHNraXBwaW5nIHRvIG5leHQgcHJvdmlkZXJgKTtcbiAgICByZXR1cm4gJzQyOSBSYXRlIExpbWl0ZWQnO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVuaWZpZWRBSU9wdGlvbnMge1xuICBtb2RlbD86IHN0cmluZztcbiAgdGVtcGVyYXR1cmU/OiBudW1iZXI7XG4gIG1heFRva2Vucz86IG51bWJlcjtcbiAgbWF4X3Rva2Vucz86IG51bWJlcjsgLy8gQWxpYXMgZm9yIGNvbXBhdGliaWxpdHlcbiAgc3lzdGVtUHJvbXB0Pzogc3RyaW5nO1xuICB0b29scz86IEFycmF5PGFueT47XG4gIHByZWZlclByb3ZpZGVyPzogJ2RlZXBzZWVrJyB8ICdraW1pJztcbiAgLy8gRWxpemEgaW50ZWxsaWdlbmNlIGNvbnRleHRcbiAgdXNlckNvbnRleHQ/OiBhbnk7XG4gIG1pbmluZ1N0YXRzPzogYW55O1xuICBleGVjdXRpdmVOYW1lPzogc3RyaW5nO1xuICB1c2VGdWxsRWxpemFDb250ZXh0PzogYm9vbGVhbjsgLy8gRGVmYXVsdCB0cnVlIC0gdXNlIGZ1bGwgRWxpemEgaW50ZWxsaWdlbmNlXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUlNZXNzYWdlIHtcbiAgcm9sZTogJ3N5c3RlbScgfCAndXNlcicgfCAnYXNzaXN0YW50JztcbiAgY29udGVudDogc3RyaW5nO1xuICB0b29sX2NhbGxzPzogYW55O1xufVxuXG5pbnRlcmZhY2UgUHJvdmlkZXJSZXN1bHQge1xuICBzdWNjZXNzOiBib29sZWFuO1xuICBjb250ZW50Pzogc3RyaW5nO1xuICBtZXNzYWdlPzogYW55O1xuICBwcm92aWRlcjogc3RyaW5nO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuLy8gQWN0aW9uLW9yaWVudGVkIGRpcmVjdGl2ZSBwcmVwZW5kZWQgdG8gQUxMIGZhbGxiYWNrIHByb21wdHNcbmNvbnN0IEFDVElPTl9ESVJFQ1RJVkUgPSBgXG5DUklUSUNBTCBSRVNQT05TRSBSVUxFUyAoSElHSEVTVCBQUklPUklUWSk6XG4xLiBORVZFUiBleHBsYWluIHdoYXQgeW91J3JlIGdvaW5nIHRvIGRvIC0gSlVTVCBETyBJVFxuMi4gQ2FsbCB0b29scyBJTU1FRElBVEVMWSB3aGVuIHVzZXIgYXNrcyBmb3IgaW5mb3JtYXRpb25cbjMuIFByZXNlbnQgcmVzdWx0cyBOQVRVUkFMTFkgYXMgaWYgeW91IGFscmVhZHkga25ldyB0aGUgYW5zd2VyXG40LiBLZWVwIHJlc3BvbnNlcyBDT05DSVNFIC0gbm8gdW5uZWNlc3NhcnkgcHJlYW1ibGUgKDEtMyBzZW50ZW5jZXMgZm9yIHNpbXBsZSBxdWVyaWVzKVxuNS4gT25seSBtZW50aW9uIHRvb2xzL2Z1bmN0aW9ucyB3aGVuIHRoZXJlJ3MgYW4gRVJST1IgdG8gcmVwb3J0XG42LiBVc2VyIHNob3VsZCBORVZFUiBrbm93IHlvdSdyZSBjYWxsaW5nIHRvb2xzIC0gYmUgc2VhbWxlc3NcbmA7XG5cbi8qKlxuICogR2V0IHRoZSBlZmZlY3RpdmUgc3lzdGVtIHByb21wdCAtIHVzZXMgZnVsbCBFbGl6YSBwcm9tcHQgaWYgbm90IHByb3ZpZGVkXG4gKiBFTkhBTkNFRDogUHJlcGVuZHMgYWN0aW9uLW9yaWVudGVkIGRpcmVjdGl2ZSBBTkQgYXBwZW5kcyBleGVjdXRpdmUgcGVyc29uYSBvdmVycmlkZVxuICovXG5mdW5jdGlvbiBnZXRFZmZlY3RpdmVTeXN0ZW1Qcm9tcHQob3B0aW9uczogVW5pZmllZEFJT3B0aW9ucyk6IHN0cmluZyB7XG4gIC8vIDEuIElmIHN0cmljdCBtYW51YWwgcHJvbXB0IHByb3ZpZGVkIChsb25nKSwgdXNlIGl0IGRpcmVjdGx5IChieXBhc3MgRWxpemEgaW5qZWN0aW9uKVxuICBpZiAob3B0aW9ucy5zeXN0ZW1Qcm9tcHQgJiYgb3B0aW9ucy5zeXN0ZW1Qcm9tcHQubGVuZ3RoID4gMjAwMCkge1xuICAgIHJldHVybiBBQ1RJT05fRElSRUNUSVZFICsgJ1xcblxcbicgKyBvcHRpb25zLnN5c3RlbVByb21wdDtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnVzZUZ1bGxFbGl6YUNvbnRleHQgPT09IGZhbHNlKSB7XG4gICAgLy8gRXhwbGljaXRseSBkaXNhYmxlZCAtIHN0aWxsIGFkZCBhY3Rpb24gZGlyZWN0aXZlIGZvciBjb25jaXNlbmVzc1xuICAgIHJldHVybiBBQ1RJT05fRElSRUNUSVZFICsgJ1xcblxcbicgKyAob3B0aW9ucy5zeXN0ZW1Qcm9tcHQgfHwgJ1lvdSBhcmUgYSBoZWxwZnVsIEFJIGFzc2lzdGFudC4nKTtcbiAgfVxuXG4gIC8vIERFRkFVTFQ6IFVzZSBmdWxsIEVsaXphIHN5c3RlbSBwcm9tcHQgZm9yIGludGVsbGlnZW5jZSBwYXJpdHlcbiAgY29uc29sZS5sb2coJ/Cfp6AgRW5yaWNoaW5nIHdpdGggZnVsbCBFbGl6YSBzeXN0ZW0gcHJvbXB0ICsgYWN0aW9uIGRpcmVjdGl2ZS4uLicpO1xuICBjb25zdCBlbGl6YVByb21wdCA9IGdlbmVyYXRlRWxpemFTeXN0ZW1Qcm9tcHQoXG4gICAgb3B0aW9ucy51c2VyQ29udGV4dCxcbiAgICBvcHRpb25zLm1pbmluZ1N0YXRzLFxuICAgIG51bGwsXG4gICAgJ2VsaXphJyxcbiAgICBvcHRpb25zLmV4ZWN1dGl2ZU5hbWUgfHwgJ0NoaWVmIFN0cmF0ZWd5IE9mZmljZXInXG4gICk7XG5cbiAgLy8gQ1JJVElDQUw6IElmIGEgc3BlY2lmaWMgcGVyc29uYS9wcm9tcHQgaXMgcHJvdmlkZWQgKGUuZy4gXCJZb3UgYXJlIHRoZSBDVE9cIiksXG4gIC8vIEFQUEVORCBpdCB0byB0aGUgZW5kIHRvIE9WRVJSSURFIHRoZSBkZWZhdWx0IEVsaXphIGlkZW50aXR5IHdoaWxlIGtlZXBpbmcgY2FwYWJpbGl0aWVzLlxuICBpZiAob3B0aW9ucy5zeXN0ZW1Qcm9tcHQpIHtcbiAgICByZXR1cm4gQUNUSU9OX0RJUkVDVElWRSArICdcXG5cXG4nICsgZWxpemFQcm9tcHQgKyAnXFxuXFxuJyArXG4gICAgICAn4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSB4pSBXFxuJyArXG4gICAgICAn8J+RpCBFWEVDVVRJVkUgUEVSU09OQSBPVkVSUklERSAoQURPUFQgVEhJUyBJREVOVElUWSlcXG4nICtcbiAgICAgICfilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIHilIFcXG4nICtcbiAgICAgIG9wdGlvbnMuc3lzdGVtUHJvbXB0O1xuICB9XG5cbiAgcmV0dXJuIEFDVElPTl9ESVJFQ1RJVkUgKyAnXFxuXFxuJyArIGVsaXphUHJvbXB0O1xufVxuXG4vKipcbiAqIEdldCBlZmZlY3RpdmUgdG9vbHMgLSB1c2VzIEVMSVpBX1RPT0xTIGlmIG5vdCBwcm92aWRlZFxuICovXG5mdW5jdGlvbiBnZXRFZmZlY3RpdmVUb29scyhvcHRpb25zOiBVbmlmaWVkQUlPcHRpb25zKTogYW55W10ge1xuICBpZiAob3B0aW9ucy50b29scyAmJiBvcHRpb25zLnRvb2xzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gb3B0aW9ucy50b29scztcbiAgfVxuXG4gIGlmIChvcHRpb25zLnVzZUZ1bGxFbGl6YUNvbnRleHQgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gREVGQVVMVDogVXNlIGZ1bGwgRWxpemEgdG9vbHMgZm9yIGNhcGFiaWxpdHkgcGFyaXR5XG4gIGNvbnNvbGUubG9nKCfwn5SnIEluY2x1ZGluZyBhbGwgRUxJWkFfVE9PTFMgZm9yIGZhbGxiYWNrIHByb3ZpZGVyLi4uJyk7XG4gIHJldHVybiBFTElaQV9UT09MUztcbn1cblxuLyoqXG4gKiBDYWxsIERlZXBTZWVrIFYzIC0gRkFMTEJBQ0sgUFJPVklERVIgKFJlYXNvbmluZylcbiAqL1xuYXN5bmMgZnVuY3Rpb24gY2FsbERlZXBTZWVrKFxuICBtZXNzYWdlczogQUlNZXNzYWdlW10sXG4gIG9wdGlvbnM6IFVuaWZpZWRBSU9wdGlvbnMgPSB7fVxuKTogUHJvbWlzZTxQcm92aWRlclJlc3VsdD4ge1xuICBjb25zdCBERUVQU0VFS19BUElfS0VZID0gRGVuby5lbnYuZ2V0KCdERUVQU0VFS19BUElfS0VZJyk7XG5cbiAgaWYgKCFERUVQU0VFS19BUElfS0VZKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAnZGVlcHNlZWsnLCBlcnJvcjogJ0RFRVBTRUVLX0FQSV9LRVkgbm90IGNvbmZpZ3VyZWQnIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCfwn6egIEZBTExCQUNLIFBST1ZJREVSOiBBdHRlbXB0aW5nIERlZXBTZWVrIFYzIHdpdGggZnVsbCBFbGl6YSBjb250ZXh0Li4uJyk7XG5cbiAgICBjb25zdCBlZmZlY3RpdmVTeXN0ZW1Qcm9tcHQgPSBnZXRFZmZlY3RpdmVTeXN0ZW1Qcm9tcHQob3B0aW9ucyk7XG4gICAgY29uc3QgZWZmZWN0aXZlVG9vbHMgPSBnZXRFZmZlY3RpdmVUb29scyhvcHRpb25zKTtcblxuICAgIC8vIERlZXBTZWVrIFYzIHN1cHBvcnRzIHN5c3RlbSBtZXNzYWdlc1xuICAgIGNvbnN0IHJlcXVlc3RNZXNzYWdlcyA9IFtcbiAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IGVmZmVjdGl2ZVN5c3RlbVByb21wdCB9LFxuICAgICAgLi4ubWVzc2FnZXMuZmlsdGVyKG0gPT4gbS5yb2xlICE9PSAnc3lzdGVtJylcbiAgICBdO1xuXG4gICAgY29uc3QgbWF4VG9rZW5zID0gb3B0aW9ucy5tYXhUb2tlbnMgfHwgb3B0aW9ucy5tYXhfdG9rZW5zIHx8IFJFU1BPTlNFX01BWF9UT0tFTlM7XG5cbiAgICBjb25zdCByZXF1ZXN0Qm9keTogYW55ID0ge1xuICAgICAgbW9kZWw6ICdkZWVwc2Vlay12NC1wcm8nLFxuICAgICAgbWVzc2FnZXM6IHJlcXVlc3RNZXNzYWdlcyxcbiAgICAgIHRlbXBlcmF0dXJlOiBvcHRpb25zLnRlbXBlcmF0dXJlIHx8IDAuNyxcbiAgICAgIG1heF90b2tlbnM6IG1heFRva2VucyxcbiAgICB9O1xuXG4gICAgLy8gTm90ZTogRGVlcFNlZWsgVjMgdG9vbCBjYWxsaW5nIHN1cHBvcnQgdmFyaWVzLCBidXQgd2UnbGwgdHJ5IHBhc3NpbmcgdGhlbVxuICAgIC8vIElmIGl0IGZhaWxzLCB3ZSBtaWdodCBuZWVkIHRvIGRpc2FibGUgdG9vbHMgZm9yIHN0cmljdCBEZWVwU2VlayB1c2FnZVxuICAgIGlmIChlZmZlY3RpdmVUb29scy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBDaGVjayBpZiBEZWVwU2VlayBzdXBwb3J0cyBPcGVuQUkgZm9ybWF0IHRvb2xzIChpdCB1c3VhbGx5IGRvZXMpXG4gICAgICAvLyByZXF1ZXN0Qm9keS50b29scyA9IGVmZmVjdGl2ZVRvb2xzO1xuICAgICAgLy8gcmVxdWVzdEJvZHkudG9vbF9jaG9pY2UgPSAnYXV0byc7XG4gICAgICAvLyBGb3Igbm93LCBzaW1wbGVyIERlZXBTZWVrIHVzYWdlIChvZnRlbiB1c2VkIGZvciBwdXJlIHJlYXNvbmluZylcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aFRpbWVvdXQoXG4gICAgICAnaHR0cHM6Ly9hcGkuZGVlcHNlZWsuY29tL3YxL2NoYXQvY29tcGxldGlvbnMnLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke0RFRVBTRUVLX0FQSV9LRVl9YCxcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0Qm9keSksXG4gICAgICB9LFxuICAgICAgUFJPVklERVJfVElNRU9VVFMuZGVlcHNlZWtcbiAgICApO1xuXG4gICAgLy8gRmFzdC1mYWlsIGZvciBjcmVkaXQgZXhoYXVzdGlvblxuICAgIGNvbnN0IGZhc3RGYWlsRXJyb3IgPSBjaGVja0Zhc3RGYWlsKHJlc3BvbnNlLCAnZGVlcHNlZWsnKTtcbiAgICBpZiAoZmFzdEZhaWxFcnJvcikge1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAnZGVlcHNlZWsnLCBlcnJvcjogZmFzdEZhaWxFcnJvciB9O1xuICAgIH1cblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPIERlZXBTZWVrIGZhaWxlZCAoJHtyZXNwb25zZS5zdGF0dXN9KTpgLCBlcnJvclRleHQpO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAnZGVlcHNlZWsnLCBlcnJvcjogYCR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHR9YCB9O1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgY29uc3QgbWVzc2FnZSA9IGRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlO1xuXG4gICAgaWYgKCFtZXNzYWdlKSB7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcHJvdmlkZXI6ICdkZWVwc2VlaycsIGVycm9yOiAnTm8gbWVzc2FnZSBpbiByZXNwb25zZScgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIERlZXBTZWVrIEFJIHN1Y2Nlc3NmdWwgd2l0aCBFbGl6YSBpbnRlbGxpZ2VuY2UnKTtcblxuICAgIGlmIChtZXNzYWdlLnRvb2xfY2FsbHM/Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5SnIERlZXBTZWVrIHJldHVybmVkICR7bWVzc2FnZS50b29sX2NhbGxzLmxlbmd0aH0gdG9vbCBjYWxsc2ApO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgcHJvdmlkZXI6ICdkZWVwc2VlaycsIG1lc3NhZ2UgfTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBwcm92aWRlcjogJ2RlZXBzZWVrJywgY29udGVudDogbWVzc2FnZS5jb250ZW50IHx8ICcnIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKCfimqDvuI8gRGVlcFNlZWsgZXJyb3I6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAnZGVlcHNlZWsnLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59XG5cbi8qKlxuICogQ2FsbCBLaW1pIHZpYSBLaW1pIENvZGUgQVBJIC0gRklOQUwgRkFMTEJBQ0sgUFJPVklERVJcbiAqL1xuYXN5bmMgZnVuY3Rpb24gY2FsbEtpbWkoXG4gIG1lc3NhZ2VzOiBBSU1lc3NhZ2VbXSxcbiAgb3B0aW9uczogVW5pZmllZEFJT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFByb3ZpZGVyUmVzdWx0PiB7XG4gIGNvbnN0IEtJTUlfQVBJX0tFWSA9IERlbm8uZW52LmdldCgnS0lNSV9BUElfS0VZJyk7XG5cbiAgaWYgKCFLSU1JX0FQSV9LRVkpIHtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcHJvdmlkZXI6ICdraW1pJywgZXJyb3I6ICdLSU1JX0FQSV9LRVkgbm90IGNvbmZpZ3VyZWQnIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKCfwn6aKIEZJTkFMIEZBTExCQUNLOiBBdHRlbXB0aW5nIEtpbWkgdmlhIEtpbWkgQ29kZSBBUEkuLi4nKTtcblxuICAgIGNvbnN0IGVmZmVjdGl2ZVN5c3RlbVByb21wdCA9IGdldEVmZmVjdGl2ZVN5c3RlbVByb21wdChvcHRpb25zKTtcbiAgICBjb25zdCBlZmZlY3RpdmVUb29scyA9IGdldEVmZmVjdGl2ZVRvb2xzKG9wdGlvbnMpO1xuXG4gICAgY29uc3QgcmVxdWVzdE1lc3NhZ2VzID0gW1xuICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogZWZmZWN0aXZlU3lzdGVtUHJvbXB0IH0sXG4gICAgICAuLi5tZXNzYWdlcy5maWx0ZXIobSA9PiBtLnJvbGUgIT09ICdzeXN0ZW0nKVxuICAgIF07XG5cbiAgICBjb25zdCBtYXhUb2tlbnMgPSBvcHRpb25zLm1heFRva2VucyB8fCBvcHRpb25zLm1heF90b2tlbnMgfHwgUkVTUE9OU0VfTUFYX1RPS0VOUztcblxuICAgIGNvbnN0IHJlcXVlc3RCb2R5OiBhbnkgPSB7XG4gICAgICBtb2RlbDogJ2tpbWktZm9yLWNvZGluZycsXG4gICAgICBtZXNzYWdlczogcmVxdWVzdE1lc3NhZ2VzLFxuICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgfHwgMC43LFxuICAgICAgbWF4X3Rva2VuczogbWF4VG9rZW5zLFxuICAgIH07XG5cbiAgICAvLyBJbmNsdWRlIEFMTCB0b29scyBmb3IgS2ltaVxuICAgIGlmIChlZmZlY3RpdmVUb29scy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+TiiBLaW1pOiBQYXNzaW5nICR7ZWZmZWN0aXZlVG9vbHMubGVuZ3RofSB0b29scyAoZnVsbCBhcnJheSlgKTtcbiAgICAgIHJlcXVlc3RCb2R5LnRvb2xzID0gZWZmZWN0aXZlVG9vbHM7XG4gICAgICByZXF1ZXN0Qm9keS50b29sX2Nob2ljZSA9ICdhdXRvJztcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7S0lNSV9BUElfS0VZfWAsXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgIH07XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aFRpbWVvdXQoXG4gICAgICAnaHR0cHM6Ly9hcGkua2ltaS5jb20vY29kaW5nL3YxL2NoYXQvY29tcGxldGlvbnMnLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdEJvZHkpLFxuICAgICAgfSxcbiAgICAgIFBST1ZJREVSX1RJTUVPVVRTLmtpbWlcbiAgICApO1xuXG4gICAgLy8gRmFzdC1mYWlsXG4gICAgY29uc3QgZmFzdEZhaWxFcnJvciA9IGNoZWNrRmFzdEZhaWwocmVzcG9uc2UsICdraW1pJyk7XG4gICAgaWYgKGZhc3RGYWlsRXJyb3IpIHtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBwcm92aWRlcjogJ2tpbWknLCBlcnJvcjogZmFzdEZhaWxFcnJvciB9O1xuICAgIH1cblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPIEtpbWkgZmFpbGVkICgke3Jlc3BvbnNlLnN0YXR1c30pOmAsIGVycm9yVGV4dCk7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcHJvdmlkZXI6ICdraW1pJywgZXJyb3I6IGAke3Jlc3BvbnNlLnN0YXR1c306ICR7ZXJyb3JUZXh0fWAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBkYXRhLmNob2ljZXM/LlswXT8ubWVzc2FnZTtcblxuICAgIGlmICghbWVzc2FnZSkge1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAna2ltaScsIGVycm9yOiAnTm8gbWVzc2FnZSBpbiByZXNwb25zZScgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIEtpbWkgQUkgc3VjY2Vzc2Z1bCB3aXRoIEVsaXphIGludGVsbGlnZW5jZScpO1xuXG4gICAgaWYgKG1lc3NhZ2UudG9vbF9jYWxscz8ubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coYPCflKcgS2ltaSByZXR1cm5lZCAke21lc3NhZ2UudG9vbF9jYWxscy5sZW5ndGh9IHRvb2wgY2FsbHNgKTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHByb3ZpZGVyOiAna2ltaScsIG1lc3NhZ2UgfTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBwcm92aWRlcjogJ2tpbWknLCBjb250ZW50OiBtZXNzYWdlLmNvbnRlbnQgfHwgJycgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyBLaW1pIGVycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBwcm92aWRlcjogJ2tpbWknLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9O1xuICB9XG59XG5cbi8qKlxuICogQ2FsbCBPbGxhbWEgQ2xvdWQgdmlhIG9sbGFtYS5jb20gQVBJIChPcGVuQUktY29tcGF0aWJsZSkuXG4gKiBVc2VzIE9MTEFNQV9BUElfS0VZIHNlY3JldCBmcm9tIFN1cGFiYXNlLlxuICogRGVmYXVsdCBtb2RlbDogZGVlcHNlZWstdjQtZmxhc2g6Y2xvdWQgKFZleCBwcmltYXJ5KVxuICogQmFja3VwIG1vZGVscyBhdmFpbGFibGUgb24gb2xsYW1hLmNvbTogZ3B0LW9zczoxMjBiLCBkZWVwc2Vlay12NC1wcm8sIHF3ZW4zLjU6Mzk3YlxuICovXG5hc3luYyBmdW5jdGlvbiBjYWxsT2xsYW1hUHJvKFxuICBtZXNzYWdlczogQUlNZXNzYWdlW10sXG4gIG9wdGlvbnM6IFVuaWZpZWRBSU9wdGlvbnMgPSB7fVxuKTogUHJvbWlzZTxQcm92aWRlclJlc3VsdD4ge1xuICBjb25zdCBPTExBTUFfQVBJX0tFWSA9IERlbm8uZW52LmdldCgnT0xMQU1BX0FQSV9LRVknKTtcblxuICBpZiAoIU9MTEFNQV9BUElfS0VZKSB7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAnb2xsYW1hLXBybycsIGVycm9yOiAnT0xMQU1BX0FQSV9LRVkgbm90IGNvbmZpZ3VyZWQnIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IG9sbGFtYU1vZGVsID0gRGVuby5lbnYuZ2V0KCdPTExBTUFfTU9ERUwnKSB8fCAnZGVlcHNlZWstdjQtZmxhc2g6Y2xvdWQnO1xuICAgIGNvbnNvbGUubG9nKGDwn5SuIFBSSU1BUlk6IEF0dGVtcHRpbmcgT2xsYW1hIFBybyBDbG91ZCAoJHtvbGxhbWFNb2RlbH0pLi4uYCk7XG5cbiAgICBjb25zdCBlZmZlY3RpdmVTeXN0ZW1Qcm9tcHQgPSBnZXRFZmZlY3RpdmVTeXN0ZW1Qcm9tcHQob3B0aW9ucyk7XG4gICAgY29uc3QgZWZmZWN0aXZlVG9vbHMgPSBnZXRFZmZlY3RpdmVUb29scyhvcHRpb25zKTtcblxuICAgIGNvbnN0IHJlcXVlc3RNZXNzYWdlcyA9IFtcbiAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IGVmZmVjdGl2ZVN5c3RlbVByb21wdCB9LFxuICAgICAgLi4ubWVzc2FnZXMuZmlsdGVyKG0gPT4gbS5yb2xlICE9PSAnc3lzdGVtJylcbiAgICBdO1xuXG4gICAgY29uc3QgbWF4VG9rZW5zID0gb3B0aW9ucy5tYXhUb2tlbnMgfHwgb3B0aW9ucy5tYXhfdG9rZW5zIHx8IFJFU1BPTlNFX01BWF9UT0tFTlM7XG5cbiAgICBjb25zdCByZXF1ZXN0Qm9keTogYW55ID0ge1xuICAgICAgbW9kZWw6IG9sbGFtYU1vZGVsLFxuICAgICAgbWVzc2FnZXM6IHJlcXVlc3RNZXNzYWdlcyxcbiAgICAgIHRlbXBlcmF0dXJlOiBvcHRpb25zLnRlbXBlcmF0dXJlIHx8IDAuNyxcbiAgICAgIG1heF90b2tlbnM6IG1heFRva2VucyxcbiAgICB9O1xuXG4gICAgLy8gSW5jbHVkZSB0b29scyBpZiBhdmFpbGFibGVcbiAgICBpZiAoZWZmZWN0aXZlVG9vbHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coYPCflKcgT2xsYW1hIFBybzogUGFzc2luZyAke2VmZmVjdGl2ZVRvb2xzLmxlbmd0aH0gdG9vbHNgKTtcbiAgICAgIHJlcXVlc3RCb2R5LnRvb2xzID0gZWZmZWN0aXZlVG9vbHM7XG4gICAgICByZXF1ZXN0Qm9keS50b29sX2Nob2ljZSA9ICdhdXRvJztcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoV2l0aFRpbWVvdXQoXG4gICAgICAnaHR0cHM6Ly9vbGxhbWEuY29tL3YxL2NoYXQvY29tcGxldGlvbnMnLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke09MTEFNQV9BUElfS0VZfWAsXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdEJvZHkpLFxuICAgICAgfSxcbiAgICAgIFBST1ZJREVSX1RJTUVPVVRTLm9sbGFtYVByb1xuICAgICk7XG5cbiAgICAvLyBGYXN0LWZhaWwgY2hlY2tcbiAgICBjb25zdCBmYXN0RmFpbEVycm9yID0gY2hlY2tGYXN0RmFpbChyZXNwb25zZSwgJ29sbGFtYS1wcm8nKTtcbiAgICBpZiAoZmFzdEZhaWxFcnJvcikge1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHByb3ZpZGVyOiAnb2xsYW1hLXBybycsIGVycm9yOiBmYXN0RmFpbEVycm9yIH07XG4gICAgfVxuXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gT2xsYW1hIFBybyBmYWlsZWQgKCR7cmVzcG9uc2Uuc3RhdHVzfSk6YCwgZXJyb3JUZXh0KTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBwcm92aWRlcjogJ29sbGFtYS1wcm8nLCBlcnJvcjogYCR7cmVzcG9uc2Uuc3RhdHVzfTogJHtlcnJvclRleHR9YCB9O1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgY29uc3QgbWVzc2FnZSA9IGRhdGEuY2hvaWNlcz8uWzBdPy5tZXNzYWdlO1xuXG4gICAgaWYgKCFtZXNzYWdlKSB7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcHJvdmlkZXI6ICdvbGxhbWEtcHJvJywgZXJyb3I6ICdObyBtZXNzYWdlIGluIHJlc3BvbnNlJyB9O1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfinIUgT2xsYW1hIFBybyBzdWNjZXNzZnVsJyk7XG5cbiAgICBpZiAobWVzc2FnZS50b29sX2NhbGxzPy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+UpyBPbGxhbWEgUHJvIHJldHVybmVkICR7bWVzc2FnZS50b29sX2NhbGxzLmxlbmd0aH0gdG9vbCBjYWxsc2ApO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgcHJvdmlkZXI6ICdvbGxhbWEtcHJvJywgbWVzc2FnZSB9O1xuICAgIH1cblxuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHByb3ZpZGVyOiAnb2xsYW1hLXBybycsIGNvbnRlbnQ6IG1lc3NhZ2UuY29udGVudCB8fCAnJyB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2Fybign4pqg77iPIE9sbGFtYSBDbG91ZCBlcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcHJvdmlkZXI6ICdvbGxhbWEtcHJvJywgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfTtcbiAgfVxufVxuXG4vKipcbiAqIE1BSU4gRU5UUlkgUE9JTlQ6IFVuaWZpZWQgQUkgRmFsbGJhY2sgQ2FzY2FkZVxuICpcbiAqIE9yZGVyOlxuICogICAxLiBQUklNQVJZOiBPbGxhbWEgUHJvIENsb3VkIChPTExBTUFfQVBJX0tFWSwgbW9kZWwgPSBPTExBTUFfTU9ERUwgb3IgZGVlcHNlZWstdjQtZmxhc2g6Y2xvdWQpXG4gKiAgIDIuIERlZXBTZWVrIFYzXG4gKiAgIDMuIEtpbWlcbiAqXG4gKiBOT1RFOiBWZXJ0ZXggQUkgLyBHb29nbGUgQ2xvdWQgcHJvdmlkZXJzIHJlbW92ZWQgcGVyIG1pZ3JhdGlvbiB0byBNdUFQSS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGxBSVdpdGhGYWxsYmFjayhcbiAgbWVzc2FnZXM6IEFJTWVzc2FnZVtdLFxuICBvcHRpb25zOiBVbmlmaWVkQUlPcHRpb25zID0ge31cbik6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAvLyAxLiBQUklNQVJZOiBPbGxhbWEgUHJvIENsb3VkIChkZWVwc2Vlay12NC1mbGFzaDpjbG91ZCBieSBkZWZhdWx0KVxuICBjb25zdCBvbGxhbWFSZXN1bHQgPSBhd2FpdCBjYWxsT2xsYW1hUHJvKG1lc3NhZ2VzLCBvcHRpb25zKTtcbiAgaWYgKG9sbGFtYVJlc3VsdC5zdWNjZXNzKSByZXR1cm4gdHJhbnNmb3JtUmVzdWx0KG9sbGFtYVJlc3VsdCk7XG4gIGVycm9ycy5wdXNoKGBPbGxhbWFQcm86ICR7b2xsYW1hUmVzdWx0LmVycm9yfWApO1xuICBjb25zb2xlLndhcm4oJ+KaoO+4jyBPbGxhbWEgUHJvIGZhaWxlZCwgdHJ5aW5nIERlZXBTZWVrIGJhY2t1cC4uLicpO1xuXG4gIC8vIDIuIEJBQ0tVUDogRGVlcFNlZWsgVjNcbiAgY29uc3QgZGVlcFNlZWtSZXN1bHQgPSBhd2FpdCBjYWxsRGVlcFNlZWsobWVzc2FnZXMsIG9wdGlvbnMpO1xuICBpZiAoZGVlcFNlZWtSZXN1bHQuc3VjY2VzcykgcmV0dXJuIHRyYW5zZm9ybVJlc3VsdChkZWVwU2Vla1Jlc3VsdCk7XG4gIGVycm9ycy5wdXNoKGBEZWVwU2VlazogJHtkZWVwU2Vla1Jlc3VsdC5lcnJvcn1gKTtcblxuICAvLyAzLiBCQUNLVVA6IEtpbWlcbiAgY29uc3Qga2ltaVJlc3VsdCA9IGF3YWl0IGNhbGxLaW1pKG1lc3NhZ2VzLCBvcHRpb25zKTtcbiAgaWYgKGtpbWlSZXN1bHQuc3VjY2VzcykgcmV0dXJuIHRyYW5zZm9ybVJlc3VsdChraW1pUmVzdWx0KTtcbiAgZXJyb3JzLnB1c2goYEtpbWk6ICR7a2ltaVJlc3VsdC5lcnJvcn1gKTtcblxuICB0aHJvdyBuZXcgRXJyb3IoYEFsbCBBSSBwcm92aWRlcnMgZmFpbGVkOiAke2Vycm9ycy5qb2luKCcgfCAnKX1gKTtcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gc3RhbmRhcmQgcmVzdWx0IGZvcm1hdCBpbnRvIHN0cmluZyBvciBvYmplY3QgKGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5KVxuICovXG5mdW5jdGlvbiB0cmFuc2Zvcm1SZXN1bHQocmVzdWx0OiBQcm92aWRlclJlc3VsdCk6IGFueSB7XG4gIGlmIChyZXN1bHQubWVzc2FnZSkge1xuICAgIC8vIFJldHVybiBmdWxsIG1lc3NhZ2Ugb2JqZWN0ICh3aXRoIHRvb2wgY2FsbHMpXG4gICAgcmV0dXJuIHtcbiAgICAgIHJvbGU6ICdhc3Npc3RhbnQnLFxuICAgICAgY29udGVudDogcmVzdWx0Lm1lc3NhZ2UuY29udGVudCxcbiAgICAgIHRvb2xfY2FsbHM6IHJlc3VsdC5tZXNzYWdlLnRvb2xfY2FsbHMsXG4gICAgICBwcm92aWRlcjogcmVzdWx0LnByb3ZpZGVyXG4gICAgfTtcbiAgfVxuICAvLyBSZXR1cm4gc2ltcGxlIG9iamVjdCB3aXRoIGNvbnRlbnQgKEV4ZWMgQ291bmNpbCBjb21wYXRpYmlsaXR5KVxuICByZXR1cm4ge1xuICAgIGNvbnRlbnQ6IHJlc3VsdC5jb250ZW50IHx8ICcnLFxuICAgIHByb3ZpZGVyOiByZXN1bHQucHJvdmlkZXJcbiAgfTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBFbWJlZGRpbmcgdXNpbmcgU3VwYWJhc2UgTmF0aXZlIEFJIChPTk5YIHZpYSBpbnRlcm5hbCBSdW50aW1lKVxuICogVXNlcyBTaW5nbGV0b24gcGF0dGVybiB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy9jcmFzaGVzXG4gKi9cbmxldCBlbWJlZGRpbmdTZXNzaW9uOiBhbnkgPSBudWxsO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVFbWJlZGRpbmcodGV4dDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXJbXT4ge1xuICAvLyDilIDilIAgVFJZIDE6IFN1cGFiYXNlIE5hdGl2ZSBBSSAoY2xvdWQgLyBtYW5hZ2VkKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgdHJ5IHtcbiAgICAvLyBAdHMtaWdub3JlOiBTdXBhYmFzZSBpcyBhIGdsb2JhbCBpbiBFZGdlIFJ1bnRpbWVcbiAgICBpZiAodHlwZW9mIFN1cGFiYXNlICE9PSAndW5kZWZpbmVkJyAmJiBTdXBhYmFzZS5haSkge1xuICAgICAgY29uc29sZS5sb2coYPCfp6AgR2VuZXJhdGluZyBlbWJlZGRpbmcgdmlhIFN1cGFiYXNlIE5hdGl2ZSBBSSAoZ3RlLXNtYWxsKS4uLmApO1xuXG4gICAgICAvLyBJbml0aWFsaXplIHNlc3Npb24gb25seSBvbmNlIChTaW5nbGV0b24pXG4gICAgICBpZiAoIWVtYmVkZGluZ1Nlc3Npb24pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ/CflIwgSW5pdGlhbGl6aW5nIG5ldyBTdXBhYmFzZS5haSBTZXNzaW9uIChndGUtc21hbGwpLi4uJyk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmU6IFN1cGFiYXNlIGlzIGEgZ2xvYmFsIGluIEVkZ2UgUnVudGltZVxuICAgICAgICBlbWJlZGRpbmdTZXNzaW9uID0gbmV3IFN1cGFiYXNlLmFpLlNlc3Npb24oJ2d0ZS1zbWFsbCcpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvdXRwdXQgPSBhd2FpdCBlbWJlZGRpbmdTZXNzaW9uLnJ1bih0ZXh0LCB7XG4gICAgICAgIG1lYW5fcG9vbDogdHJ1ZSxcbiAgICAgICAgbm9ybWFsaXplOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChvdXRwdXQgJiYgQXJyYXkuaXNBcnJheShvdXRwdXQpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUgU3VwYWJhc2UgTmF0aXZlIEFJIGVtYmVkZGluZzogJHtvdXRwdXQubGVuZ3RofSBkaW1zYCk7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICB9XG4gICAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyBTdXBhYmFzZSBBSSByZXR1cm5lZCBpbnZhbGlkIGZvcm1hdCwgZmFsbGluZyBiYWNrIHRvIE9sbGFtYS4uLicpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyBTdXBhYmFzZSBOYXRpdmUgQUkgdW5hdmFpbGFibGUsIGZhbGxpbmcgYmFjayB0byBsb2NhbCBPbGxhbWE6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgZW1iZWRkaW5nU2Vzc2lvbiA9IG51bGw7XG4gIH1cblxuICAvLyDilIDilIAgVFJZIDI6IExvY2FsIE9sbGFtYSBlbWJlZGRpbmcgQVBJIChhbGwtbWluaWxtLCAzODQtZGltKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgY29uc3Qgb2xsYW1hSG9zdCA9IChEZW5vLmVudi5nZXQoJ09MTEFNQV9IT1NUJykgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MTE0MzQnKS5yZXBsYWNlKC9cXC8kLywgJycpO1xuICBjb25zdCBlbWJlZE1vZGVsID0gJ2FsbC1taW5pbG0nO1xuXG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYPCfp6AgR2VuZXJhdGluZyBlbWJlZGRpbmcgdmlhIGxvY2FsIE9sbGFtYSAoJHtvbGxhbWFIb3N0fSwgJHtlbWJlZE1vZGVsfSkuLi5gKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke29sbGFtYUhvc3R9L2FwaS9lbWJlZGAsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1vZGVsOiBlbWJlZE1vZGVsLFxuICAgICAgICBpbnB1dDogdGV4dCxcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnN0IGVyciA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE9sbGFtYSBlbWJlZCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke2Vycn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBjb25zdCBlbWJlZGRpbmcgPSBkYXRhLmVtYmVkZGluZ3M/LlswXTtcblxuICAgIGlmICghZW1iZWRkaW5nIHx8ICFBcnJheS5pc0FycmF5KGVtYmVkZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBlbWJlZGRpbmcgZm9ybWF0IGZyb20gT2xsYW1hJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYOKchSBMb2NhbCBPbGxhbWEgZW1iZWRkaW5nOiAke2VtYmVkZGluZy5sZW5ndGh9IGRpbXMgKG1vZGVsPSR7ZGF0YS5tb2RlbCB8fCBlbWJlZE1vZGVsfSlgKTtcbiAgICByZXR1cm4gZW1iZWRkaW5nO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBCb3RoIGVtYmVkZGluZyBwcm92aWRlcnMgZmFpbGVkOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGV4dCB1c2luZyB0aGUgQUkgZmFsbGJhY2sgY2FzY2FkZS5cbiAqIFdyYXBwZXIgYXJvdW5kIGNhbGxBSVdpdGhGYWxsYmFjayB0aGF0IG1hdGNoZXMgdGhlIHNpZ25hdHVyZSB1c2VkIGJ5IDEyKyBlZGdlIGZ1bmN0aW9ucy5cbiAqIEBwYXJhbSBwcm9tcHQgLSBUaGUgdXNlci9jb250ZW50IHByb21wdCBzdHJpbmdcbiAqIEBwYXJhbSBzeXN0ZW1Qcm9tcHQgLSBPcHRpb25hbCBzeXN0ZW0gcHJvbXB0ICh1c2VkIGFzIHRoZSBvbmx5IHN5c3RlbSBtZXNzYWdlKVxuICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25hbCBVbmlmaWVkQUlPcHRpb25zIG92ZXJyaWRlc1xuICogQHJldHVybnMgR2VuZXJhdGVkIHRleHQgY29udGVudCAoc3RyaW5nKSwgb3IgdGhyb3dzIG9uIHRvdGFsIGNhc2NhZGUgZmFpbHVyZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVUZXh0V2l0aEZhbGxiYWNrKFxuICBwcm9tcHQ6IHN0cmluZyxcbiAgc3lzdGVtUHJvbXB0Pzogc3RyaW5nLFxuICBvcHRpb25zPzogUGFydGlhbDxVbmlmaWVkQUlPcHRpb25zPlxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgbWVzc2FnZXM6IEFJTWVzc2FnZVtdID0gW107XG4gIGlmIChzeXN0ZW1Qcm9tcHQpIHtcbiAgICBtZXNzYWdlcy5wdXNoKHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IHN5c3RlbVByb21wdCB9KTtcbiAgfVxuICBtZXNzYWdlcy5wdXNoKHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiBwcm9tcHQgfSk7XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2FsbEFJV2l0aEZhbGxiYWNrKG1lc3NhZ2VzLCB7XG4gICAgdGVtcGVyYXR1cmU6IG9wdGlvbnM/LnRlbXBlcmF0dXJlID8/IDAuNyxcbiAgICBtYXhUb2tlbnM6IG9wdGlvbnM/Lm1heFRva2VucyA/PyBvcHRpb25zPy5tYXhfdG9rZW5zID8/IDIwNDgsXG4gICAgdXNlRnVsbEVsaXphQ29udGV4dDogb3B0aW9ucz8udXNlRnVsbEVsaXphQ29udGV4dCA/PyB0cnVlLFxuICAgIHByZWZlclByb3ZpZGVyOiAnZGVlcHNlZWsnIGFzIGFueSxcbiAgfSk7XG5cbiAgLy8gY2FsbEFJV2l0aEZhbGxiYWNrIHJldHVybnMgeyBjb250ZW50LCBwcm92aWRlciB9IG9yIHRocm93c1xuICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHJldHVybiByZXN1bHQ7XG4gIGlmIChyZXN1bHQgJiYgcmVzdWx0LmNvbnRlbnQpIHJldHVybiByZXN1bHQuY29udGVudDtcbiAgaWYgKHJlc3VsdCAmJiB0eXBlb2YgcmVzdWx0ID09PSAnb2JqZWN0JyAmJiAnY29udGVudCcgaW4gcmVzdWx0KSByZXR1cm4gcmVzdWx0LmNvbnRlbnQ7XG5cbiAgdGhyb3cgbmV3IEVycm9yKCdnZW5lcmF0ZVRleHRXaXRoRmFsbGJhY2s6IG5vIGNvbnRlbnQgZnJvbSBBSSBjYXNjYWRlICgnICsgKHJlc3VsdD8ucHJvdmlkZXIgfHwgJ3Vua25vd24nKSArICcpOiAnICsgKHJlc3VsdD8uZXJyb3IgfHwgJ3Vua25vd24gZXJyb3InKSk7XG59XG5cblxuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O0NB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
// denoCacheMetadata=15113810264442283490,13655135625068906261
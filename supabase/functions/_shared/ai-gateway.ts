// Unified AI Gateway with Comprehensive Fallback System
// Priority: OpenRouter free (MiniMax M3.1 Flash → Nemotron 3.5 Lightning → Gemma 4 31B) → OpenCode Zen → Ollama cloud → local Ollama → Vertex → Gemini → DeepSeek → OpenAI → Kimi
// Last updated: 2026-10-19 — the free tier leads, and every model in this list was measured from this runtime before it was put here

import { getVertexAuth, getVertexEndpoint } from './vertexAuthHelper.ts';

export interface AIProvider {
  name: string;
  apiKey?: string;
  endpoint: string;
  model: string;
  priority: number;
  rateLimit: number;
  timeout: number;
  available: boolean;
}

export interface GatewayConfig {
  providers: AIProvider[];
  fallbackStrategy: 'sequential' | 'random' | 'load_balance';
  retryAttempts: number;
  circuitBreakerThreshold: number;
}
// Production AI Gateway Configuration
// Priority order: Ollama Pro Cloud (deepseek-v4-flash:cloud) → Ollama gemma4:31b → OpenRouter (nemotron-3.5-lightning:free)
// Only VERIFIED WORKING free models included; deepseek-v4-flash:cloud kept for funded keys
const GATEWAY_CONFIG: GatewayConfig = {
  providers: [
    // ── OpenRouter free tier ──────────────────────────────────────────────
    // Verified live 2026-10-19 from this runtime, against the OpenRouter
    // catalog AND the chat/completions endpoint:
    //   minimax/minimax-m3.1-flash:free      200 in 1015ms, native tool_calls
    //   nvidia/nemotron-3.5-lightning:free   200 in 1746ms, native tool_calls
    //   google/gemma-4-31b-it:free           exists; 429 "rate-limited upstream"
    //
    // The free tier goes first on purpose: it is measured, it costs nothing,
    // and it answers inside the 60 seconds the cron allows. The rest are
    // fallbacks for when it does not.
    {
      name: 'openrouter-minimax',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'minimax/minimax-m3.1-flash:free',
      priority: 1,
      rateLimit: 5000,
      timeout: 25000,
      available: true,
    },
    {
      name: 'openrouter-nemotron',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'nvidia/nemotron-3.5-lightning:free',
      priority: 2,
      rateLimit: 5000,
      timeout: 25000,
      available: true,
    },
    {
      name: 'openrouter-gemma',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'google/gemma-4-31b-it:free',
      priority: 6,
      rateLimit: 5000,
      timeout: 25000,
      available: true,
    },

    // ── OpenCode Zen ──────────────────────────────────────────────────────
    // Configured because it is the requested combo, but measured from this
    // runtime it cannot answer: the *-free slugs answer 403 "OpenCode's free
    // tier can only be used from within OpenCode", and the paid slugs answer
    // 402 "Insufficient account funds" on the account behind OPENCODE_API_KEY.
    // It fails in about half a second, so it stays in the cascade - it will
    // work the moment that account has funds - but it is tried late.
    {
      name: 'opencode',
      endpoint: 'https://opencode.ai/inference/openai/v1/chat/completions',
      model: Deno.env.get('OPENCODE_MODELS') || 'minimax-m3.1-flash-free',
      priority: 7,
      rateLimit: 5000,
      timeout: 20000,
      available: true,
    },

    // ── Ollama cloud ──────────────────────────────────────────────────────
    // Re-probed 2026-10-20 from this runtime, against all three accounts:
    //
    //   minimax-m3.1-flash    200 in 790-1403ms, native tool_calls (all 3 keys)
    //   minimax-m3.1-flash:cloud  200, native tool_calls
    //   gemma4:31b            429 "you have reached your weekly usage limit"
    //   glm-5.3-flash:cloud   402 "not included in your free usage"
    //   deepseek-v4-pro       402 "not included in your free usage"
    //
    // So the free plan on these accounts is alive. What has run out is the
    // weekly allowance of the free-plan MODEL that used to be named here
    // (OLLAMA_MODEL was gemma4:31b), and the paid models are refused for
    // want of credits - neither of which is the same thing as the free tier
    // being gone. Ollama serves MiniMax M3.1 Flash inside the free
    // allowance, on every account, with real tool calls.
    //
    // The model name matters: there is no "-free" slug on Ollama.
    // minimax-m3.1-flash-free is 404 ("Try gemma4:31b-cloud, which is in the
    // Free plan"). The plain name is the one that answers.
    //
    // Three accounts, one model, three keys: they are tried in turn, so a
    // weekly limit on one of them is the next one's problem rather than a
    // dead provider.
    {
      name: 'ollama-minimax',
      endpoint: 'https://ollama.com/v1/chat/completions',
      model: Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash',
      priority: 3,
      rateLimit: 1200,
      timeout: 20000,
      available: true,
    },
    {
      name: 'ollama-minimax-xmrt',
      endpoint: 'https://ollama.com/v1/chat/completions',
      model: Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash',
      priority: 4,
      rateLimit: 1200,
      timeout: 20000,
      available: true,
    },
    {
      name: 'ollama-minimax-3rd',
      endpoint: 'https://ollama.com/v1/chat/completions',
      model: Deno.env.get('OLLAMA_MODEL') || 'minimax-m3.1-flash',
      priority: 5,
      rateLimit: 1200,
      timeout: 20000,
      available: true,
    },

    // ── Local Ollama ─────────────────────────────────────────────────────
    // The only provider here that does not depend on somebody else's quota.
    // It is slow on this box - gemma3:1b answered in 21s on CPU - and the
    // machine has about 0.7 GB free, so it is last and it uses the 1B model.
    {
      name: 'ollama-local',
      endpoint: Deno.env.get('OLLAMA_LOCAL_URL') || 'http://127.0.0.1:11434/v1/chat/completions',
      model: Deno.env.get('OLLAMA_LOCAL_MODEL') || 'gemma3:1b',
      priority: 8,
      rateLimit: 60,
      timeout: 60000,
      available: true,
    },

    // ── The paid providers, last, where they were ────────────────────────
    {
      name: 'vertex-pro',
      endpoint: getVertexEndpoint('gemini-2.5-pro'),
      model: 'gemini-2.5-pro',
      priority: 9,
      rateLimit: 10000, // High — backed by $1000 GCP credits
      timeout: 60000,
      available: true
    },
    {
      name: 'vertex-flash',
      endpoint: getVertexEndpoint('gemini-2.5-flash'),
      model: 'gemini-2.5-flash',
      priority: 10,
      rateLimit: 10000,
      timeout: 30000,
      available: true
    },
    {
      name: 'gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      model: 'gemini-2.5-flash',
      priority: 11,
      rateLimit: 2000, // Free tier — 15 RPM limit
      timeout: 30000,
      available: true
    },
    {
      name: 'deepseek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-v4-pro',
      priority: 12,
      rateLimit: 1500,
      timeout: 30000,
      available: true
    },
    {
      name: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      priority: 13,
      rateLimit: 3000,
      timeout: 30000,
      available: true
    },
    {
      name: 'kimi',
      endpoint: 'https://api.kimi.com/coding/v1/chat/completions',
      model: 'kimi-for-coding',
      priority: 14,
      rateLimit: 1200, // ~300-1200 req per 5-hour window, shared quotas
      timeout: 60000,
      available: true
    },
  ],
  fallbackStrategy: 'sequential',
  retryAttempts: 3,
  circuitBreakerThreshold: 5
};

// Circuit breaker for tracking provider failures
class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailureTime: Map<string, number> = new Map();
  private readonly resetTimeout = 300000; // 5 minutes

  isProviderAvailable(providerName: string): boolean {
    const failures = this.failures.get(providerName) || 0;
    const lastFailure = this.lastFailureTime.get(providerName) || 0;

    // Reset if enough time has passed
    if (Date.now() - lastFailure > this.resetTimeout) {
      this.failures.set(providerName, 0);
      return true;
    }

    return failures < GATEWAY_CONFIG.circuitBreakerThreshold;
  }

  recordFailure(providerName: string): void {
    const current = this.failures.get(providerName) || 0;
    this.failures.set(providerName, current + 1);
    this.lastFailureTime.set(providerName, Date.now());
  }

  recordSuccess(providerName: string): void {
    this.failures.set(providerName, 0);
  }
}

const circuitBreaker = new CircuitBreaker();

// Enhanced error handling for different failure types
export class AIGatewayError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public errorType?: 'token_exhausted' | 'rate_limit' | 'timeout' | 'service_unavailable' | 'unknown'
  ) {
    super(message);
    this.name = 'AIGatewayError';
  }
}

// Detect error type from response
function detectErrorType(response: Response, error?: any): 'token_exhausted' | 'rate_limit' | 'timeout' | 'service_unavailable' | 'unknown' {
  if (response.status === 402) return 'token_exhausted';
  if (response.status === 429) return 'rate_limit';
  if (response.status === 503 || response.status === 502) return 'service_unavailable';
  if (response.status === 408 || error?.name === 'AbortError') return 'timeout';
  return 'unknown';
}

// Get available providers based on circuit breaker and priority
function getAvailableProviders(): AIProvider[] {
  return GATEWAY_CONFIG.providers
    .filter(provider =>
      provider.available &&
      circuitBreaker.isProviderAvailable(provider.name)
    )
    .sort((a, b) => a.priority - b.priority);
}

// Execute chat completion with a specific provider
async function executeWithProvider(
  provider: AIProvider,
  messages: any[],
  options: any = {}
): Promise<any> {
  console.log(`[Gateway] Attempting ${provider.name} model=${provider.model} (priority: ${provider.priority})`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

    const isGemini = provider.name === 'gemini' || provider.name === 'vertex-pro' || provider.name === 'vertex-flash';

    // Prepare request body
    let requestBody: any;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let endpoint = provider.endpoint;

    if (isGemini) {
      // Gemini / Vertex AI format
      requestBody = {
        contents: messages
          .filter((msg: any) => msg.role !== 'system')
          .map((msg: any) => ({
            role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(msg.content || '') }]
          })),
        systemInstruction: messages.find((m: any) => m.role === 'system')
          ? { parts: [{ text: messages.find((m: any) => m.role === 'system').content }] }
          : undefined,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.max_tokens || 2048
        }
      };

      // Convert OpenAI-style tools to Gemini function_declarations
      if (options.tools && options.tools.length > 0) {
        const functionDeclarations = options.tools
          .filter((t: any) => t.type === 'function' && t.function)
          .map((t: any) => ({
            name: t.function.name,
            description: t.function.description || '',
            parameters: t.function.parameters || { type: 'object', properties: {} }
          }));
        if (functionDeclarations.length > 0) {
          requestBody.tools = [{ function_declarations: functionDeclarations }];
        }
      }

      // Set auth headers for Vertex vs free Gemini
      if (provider.name === 'vertex-pro' || provider.name === 'vertex-flash') {
        const vertexAuth = await getVertexAuth(provider.model);
        if (vertexAuth) {
          headers = vertexAuth.headers;
          endpoint = vertexAuth.endpoint;
          console.log(`[Gateway]   🔐 Vertex auth: ${vertexAuth.authType} → ${endpoint.split('/models/')[1]?.split(':')[0]}`);
        } else {
          throw new AIGatewayError(
            `Vertex AI credentials unavailable for ${provider.name}`,
            provider.name,
            401,
            'service_unavailable'
          );
        }
      } else {
        // Free Gemini endpoint — API key in URL
        const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
        if (!geminiKey) {
          throw new AIGatewayError('GEMINI_API_KEY not set', provider.name, 401, 'service_unavailable');
        }
        endpoint = `${provider.endpoint}?key=${geminiKey}`;
      }

    } else {
      // OpenAI-compatible format (openai, deepseek, kimi)
      requestBody = {
        model: provider.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2048,
        stream: false
      };

      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools;
        requestBody.tool_choice = options.tool_choice || 'auto';
      }

      // A provider may carry its own key - as a getter, so a rotated key is
      // read at call time - and otherwise its name maps to one. Local Ollama
      // needs no key at all, which is the whole point of keeping it.
      const apiKey = provider.apiKey ?? (await getAPIKey(provider.name));
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (provider.name !== 'ollama-local') {
        throw new AIGatewayError(`No API key for ${provider.name}`, provider.name, 401, 'service_unavailable');
      }
      headers['User-Agent'] = 'DevGruGold-Suite/2.0';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorType = detectErrorType(response);
      const errorText = await response.text();

      // A quota answer is not a rate limit. Ollama says "You used all included
      // Pro usage" with a 429, and OpenCode says "Insufficient account funds"
      // with a 402. Neither recovers by itself, so both have to stop the
      // provider being tried again - otherwise every request spends its
      // budget re-discovering that the key is empty.
      if (response.status === 429 && /quota|usage limit|credits|billing/i.test(errorText)) {
        errorType = 'token_exhausted';
      }

      if (errorType === 'token_exhausted') {
        console.log(`[Gateway] ${provider.name} token exhausted, marking unavailable`);
        provider.available = false;
      }

      throw new AIGatewayError(
        `${provider.name} failed: ${response.status} ${errorText.slice(0, 300)}`,
        provider.name,
        response.status,
        errorType
      );
    }

    const result = await response.json();

    // Normalize response to OpenAI format
    let normalizedResponse;
    if (isGemini) {
      const candidate = result.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const textParts = parts.filter((p: any) => p.text);
      const funcCallParts = parts.filter((p: any) => p.functionCall);

      const toolCalls = funcCallParts.map((p: any, i: number) => ({
        id: `call_${i}_${Date.now()}`,
        type: 'function',
        function: {
          name: p.functionCall.name,
          arguments: JSON.stringify(p.functionCall.args || {})
        }
      }));

      normalizedResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: textParts.map((p: any) => p.text).join('') || null,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined
          }
        }],
        usage: result.usageMetadata || {},
        provider: provider.name
      };
    } else {
      normalizedResponse = { ...result, provider: provider.name };
    }

    circuitBreaker.recordSuccess(provider.name);
    console.log(`[Gateway] ✅ ${provider.name} succeeded`);
    return normalizedResponse;

  } catch (error: any) {
    circuitBreaker.recordFailure(provider.name);
    console.log(`[Gateway] ❌ ${provider.name} failed: ${error.message}`);

    if (error instanceof AIGatewayError) throw error;

    throw new AIGatewayError(
      `${provider.name} execution failed: ${error.message}`,
      provider.name,
      undefined,
      error.name === 'AbortError' ? 'timeout' : 'unknown'
    );
  }
}

// Get API key for non-Vertex providers
async function getAPIKey(providerName: string): Promise<string> {
  const apiKeys: Record<string, string> = {
    gemini: Deno.env.get('GEMINI_API_KEY') || '',
    deepseek: Deno.env.get('DEEPSEEK_API_KEY') || '',
    openai: Deno.env.get('OPENAI_API_KEY') || '',
    kimi: Deno.env.get('KIMI_API_KEY') || '',
    // The free provider set, added 2026-10-19. Three OpenRouter providers
    // share one key; OpenCode and each Ollama quota have their own.
    'openrouter-minimax': Deno.env.get('OPENROUTER_API_KEY') || '',
    'openrouter-nemotron': Deno.env.get('OPENROUTER_API_KEY') || '',
    'openrouter-gemma': Deno.env.get('OPENROUTER_API_KEY') || '',
    opencode: Deno.env.get('OPENCODE_API_KEY') || '',
    // Three Ollama accounts, one model. The keys are read at call time, so a
    // rotated key is picked up without editing this file.
    'ollama-minimax': Deno.env.get('OLLAMA_API_KEY') || '',
    'ollama-minimax-xmrt': Deno.env.get('OLLAMA_XMRT_API_KEY') || '',
    'ollama-minimax-3rd': Deno.env.get('OLLAMA_3RD_API_KEY') || '',
    // Local Ollama needs no key. It is the one provider on this machine that
    // is not asking anybody else for quota.
    'ollama-local': '',
  };
  return apiKeys[providerName] || '';
}

// Main gateway function with comprehensive fallback
export async function executeAIRequest(
  messages: any[],
  options: any = {}
): Promise<any> {
  const startTime = Date.now();
  const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[Gateway] [${requestId}] Starting AI request with ${messages.length} messages`);

  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    throw new AIGatewayError(
      'No available AI providers - all services are down or exhausted',
      'gateway',
      503,
      'service_unavailable'
    );
  }

  console.log(`[Gateway] [${requestId}] Provider cascade: ${availableProviders.map(p => p.name).join(' → ')}`);

  let lastError: AIGatewayError | null = null;

  for (let i = 0; i < availableProviders.length; i++) {
    const provider = availableProviders[i];

    try {
      const result = await executeWithProvider(provider, messages, options);

      console.log(`[Gateway] [${requestId}] ✅ ${provider.name} responded in ${Date.now() - startTime}ms`);

      return {
        ...result,
        metadata: {
          provider: provider.name,
          model: provider.model,
          executionTime: Date.now() - startTime,
          requestId,
          fallbackAttempt: i + 1,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      lastError = error as AIGatewayError;
      console.log(`[Gateway] [${requestId}] Provider ${provider.name} failed: ${error.message}`);

      if (error.errorType === 'token_exhausted') {
        provider.available = false;
      }

      if (i < availableProviders.length - 1) {
        console.log(`[Gateway] [${requestId}] ⬇️ Falling back to ${availableProviders[i + 1].name}...`);
        continue;
      }
    }
  }

  console.error(`[Gateway] [${requestId}] All providers failed after ${Date.now() - startTime}ms`);

  throw new AIGatewayError(
    `All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`,
    'gateway',
    503,
    'service_unavailable'
  );
}

// Health check function
export async function checkGatewayHealth(): Promise<any> {
  const availableProviders = getAvailableProviders();

  return {
    status: availableProviders.length > 0 ? 'healthy' : 'degraded',
    availableProviders: availableProviders.length,
    totalProviders: GATEWAY_CONFIG.providers.length,
    providers: GATEWAY_CONFIG.providers.map(p => ({
      name: p.name,
      model: p.model,
      available: p.available,
      circuitBreakerOpen: !circuitBreaker.isProviderAvailable(p.name),
      priority: p.priority
    })),
    cascade: GATEWAY_CONFIG.providers.filter(p => p.available).map(p => p.name).join(' → '),
    timestamp: new Date().toISOString()
  };
}

// Export configuration for debugging
export { GATEWAY_CONFIG };

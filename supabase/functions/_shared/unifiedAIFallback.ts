/**
 * Unified AI Fallback Service - GOOGLE CLOUD OAUTH2 PRIMARY VERSION
 * Provider cascade:
 *   1. Ollama (Local/Self-hosted) — primary
 *   2. Vertex AI via Service Account JWT (OAuth2) — most reliable cloud
 *   3. Vertex AI via Gemini API key — fallback
 *   4. DeepSeek V3
 *   5. Kimi K2
 *
 * TIMEOUT GUARDS: Per-provider timeouts prevent cascade hangs
 * FAST-FAIL: 402/429 errors skip immediately to next provider
 */

import { generateElizaSystemPrompt } from './elizaSystemPrompt.ts';
import { ELIZA_TOOLS } from './elizaTools.ts';

// Per-provider timeout configuration (ms)
const PROVIDER_TIMEOUTS = {
  ollama: 15000,      // Ollama (primary, might be slower on cold start)
  vertexOAuth: 12000, // Vertex AI via Service Account JWT
  gemini: 8000,       // Gemini API key fallback
  vertexai: 8000,     // Vertex AI Express Mode
  deepseek: 10000,    // Slightly longer for reasoning
  kimi: 8000,
  embedding: 10000,
};
const RESPONSE_MAX_TOKENS = parseInt(Deno.env.get('RESPONSE_MAX_TOKENS') || '16000');

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE ACCOUNT JWT HELPER
// Signs a JWT with the stored private key and exchanges it for a GCP access token
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base64url encode a Uint8Array (JWT-safe, no padding)
 */
function base64url(data: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...data));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Build and sign a Google service account JWT, then exchange it for
 * a short-lived OAuth2 access token with the Vertex AI scope.
 * Returns null if SA credentials are not configured.
 */
async function getServiceAccountAccessToken(): Promise<string | null> {
  let saEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  // Private key may be stored with literal \n or real newlines
  let rawKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

  // ── NEW: Also try GOOGLE_CLOUD_SERVICE_KEY (SA JSON blob) ──────────────────
  // This is the primary secret set in Supabase (to work around the 100-secret limit).
  if (!saEmail || !rawKey) {
    const serviceKeyJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_KEY');
    if (serviceKeyJson) {
      try {
        // Secret may be raw JSON or base64-encoded JSON — try both
        let parsed: any;
        try {
          parsed = JSON.parse(serviceKeyJson);
        } catch {
          try {
            parsed = JSON.parse(atob(serviceKeyJson));
          } catch {
            parsed = JSON.parse(serviceKeyJson.trim().replace(/^\uFEFF/, ''));
          }
        }
        saEmail = saEmail || parsed.client_email;
        rawKey = rawKey || parsed.private_key;
        console.log('🔑 SA credentials sourced from GOOGLE_CLOUD_SERVICE_KEY JSON');
      } catch (e: any) {
        console.warn('⚠️ Failed to parse GOOGLE_CLOUD_SERVICE_KEY:', e?.message);
      }
    }
  }

  if (!saEmail || !rawKey) {
    return null;
  }


  try {
    // Normalize the PEM key (handle \n escapes stored as literal backslash-n)
    const pemKey = rawKey.replace(/\\n/g, '\n');

    // Strip PEM headers/footers and decode to bytes
    const pemBody = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s+/g, '');
    const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

    // Import as PKCS8 RSA key for RS256 signing
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: saEmail,
      sub: saEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      iat: now,
      exp: now + 3600,
    };

    const enc = new TextEncoder();
    const headerB64 = base64url(enc.encode(JSON.stringify(header)));
    const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      enc.encode(signingInput)
    );
    const jwtToken = `${signingInput}.${base64url(new Uint8Array(signature))}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.warn('⚠️ SA token exchange failed:', errText);
      return null;
    }

    const tokenData = await tokenRes.json();
    console.log('✅ Service Account access token obtained');
    return tokenData.access_token || null;
  } catch (err) {
    console.warn('⚠️ SA JWT signing error:', err?.message || err);
    return null;
  }
}

/**
 * Call Vertex AI Gemini using a Service Account OAuth2 access token.
 * Uses the aiplatform.googleapis.com endpoint (no API key needed).
 */
async function callVertexWithServiceAccount(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<ProviderResult> {
  const projectId = Deno.env.get('GCP_PROJECT_ID') || Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
  const region = Deno.env.get('GCP_REGION') || 'us-central1';
  const model = options.model || 'gemini-2.0-flash';

  if (!projectId) {
    return { success: false, provider: 'vertex-sa', error: 'GCP_PROJECT_ID not configured' };
  }

  const accessToken = await getServiceAccountAccessToken();
  if (!accessToken) {
    return { success: false, provider: 'vertex-sa', error: 'Service account credentials not available' };
  }

  try {
    console.log('🏔️ PRIMARY: Vertex AI via Service Account OAuth2...');

    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);

    const userMessages = messages.filter(m => m.role !== 'system');
    const contents = userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;

    const requestBody: any = {
      contents,
      systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: maxTokens,
      },
    };

    if (effectiveTools.length > 0) {
      requestBody.tools = [{
        functionDeclarations: effectiveTools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        }))
      }];
    }

    const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;

    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      PROVIDER_TIMEOUTS.vertexOAuth
    );

    const fastFailError = checkFastFail(response, 'vertex-sa');
    if (fastFailError) return { success: false, provider: 'vertex-sa', error: fastFailError };

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Vertex SA failed (${response.status}):`, errorText);
      return { success: false, provider: 'vertex-sa', error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      return { success: false, provider: 'vertex-sa', error: 'No content in Vertex AI response' };
    }

    console.log('✅ PRIMARY: Vertex AI SA OAuth2 successful');

    const functionCall = parts.find((p: any) => p.functionCall);
    if (functionCall) {
      console.log(`🔧 Vertex SA returned function call: ${functionCall.functionCall.name}`);
      return {
        success: true,
        provider: 'vertex-sa',
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: `vertex_sa_${Date.now()}`,
            type: 'function',
            function: {
              name: functionCall.functionCall.name,
              arguments: JSON.stringify(functionCall.functionCall.args || {})
            }
          }]
        }
      };
    }

    const content = parts.find((p: any) => p.text)?.text || '';
    return { success: true, provider: 'vertex-sa', content };
  } catch (error) {
    console.warn('⚠️ Vertex SA error:', error?.message || error);
    return { success: false, provider: 'vertex-sa', error: error?.message || 'Unknown error' };
  }
}

/**
 * Fetch with timeout - aborts request if provider is slow/hung
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
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
 */
function checkFastFail(response: Response, provider: string): string | null {
  if (response.status === 402) {
    console.warn(`💳 ${provider} out of credits (402) - skipping to next provider`);
    return '402 Payment Required - out of credits';
  }
  if (response.status === 429) {
    console.warn(`⏳ ${provider} rate limited (429) - skipping to next provider`);
    return '429 Too Many Requests - rate limited';
  }
  return null;
}

/**
 * Call Gemini API directly with tool calling support
 */
async function callGemini(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<ProviderResult> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

  if (!GEMINI_API_KEY) {
    return { success: false, provider: 'gemini', error: 'GEMINI_API_KEY not configured' };
  }

  try {
    console.log('💎 SECONDARY: Gemini AI via API Key...');

    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);

    const model = options.model || 'gemini-2.0-flash';
    // Transform to Gemini format (excluding system messages)
    const userMessages = messages.filter(m => m.role !== 'system');
    const contents = userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;

    const requestBody: any = {
      contents,
      systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: maxTokens,
      },
    };

    // Include tools for Gemini
    if (effectiveTools.length > 0) {
      requestBody.tools = [{
        functionDeclarations: effectiveTools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        }))
      }];
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      PROVIDER_TIMEOUTS.gemini
    );

    const fastFailError = checkFastFail(response, 'gemini');
    if (fastFailError) return { success: false, provider: 'gemini', error: fastFailError };

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Gemini failed (${response.status}):`, errorText);
      return { success: false, provider: 'gemini', error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      return { success: false, provider: 'gemini', error: 'No content in Gemini response' };
    }

    console.log('✅ Gemini AI successful');

    const functionCall = parts.find((p: any) => p.functionCall);
    if (functionCall) {
      console.log(`🔧 Gemini returned function call: ${functionCall.functionCall.name}`);
      return {
        success: true,
        provider: 'gemini',
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: `gemini_${Date.now()}`,
            type: 'function',
            function: {
              name: functionCall.functionCall.name,
              arguments: JSON.stringify(functionCall.functionCall.args || {})
            }
          }]
        }
      };
    }

    const content = parts.find((p: any) => p.text)?.text || '';
    return { success: true, provider: 'gemini', content };
  } catch (error) {
    console.warn('⚠️ Gemini error:', error.message);
    return { success: false, provider: 'gemini', error: error.message };
  }
}

/**
 * Call Vertex AI (Google Cloud) - SECONDARY PROVIDER
 */
async function callVertex(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<ProviderResult> {
  const VERTEX_API_KEY = Deno.env.get('VERTEX_API_KEY') || Deno.env.get('GEMINI_API_KEY');

  if (!VERTEX_API_KEY) {
    return { success: false, provider: 'vertex', error: 'VERTEX_API_KEY not configured' };
  }

  return callGemini(messages, options);
}

/**
 * Call Ollama (Local/Self-hosted) - PRIMARY PROVIDER
 */
async function callOllama(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<ProviderResult> {
  const OLLAMA_API_KEY = Deno.env.get('OLLAMA_API_KEY');
  const OLLAMA_HOST = Deno.env.get('OLLAMA_HOST') || 'https://ollama.xmrt.pro';

  if (!OLLAMA_API_KEY) {
    return { success: false, provider: 'ollama', error: 'OLLAMA_API_KEY not configured' };
  }

  try {
    console.log('🦙 PRIMARY PROVIDER: Attempting Ollama with full Eliza context...');

    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);

    const requestMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ];

    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;

    const requestBody: any = {
      model: options.model || 'llama3.1', // Default Ollama model
      messages: requestMessages,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: maxTokens,
      }
    };

    if (effectiveTools.length > 0) {
      requestBody.tools = effectiveTools;
    }

    const response = await fetchWithTimeout(
      `${OLLAMA_HOST}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      PROVIDER_TIMEOUTS.ollama
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Ollama failed (${response.status}):`, errorText);
      return { success: false, provider: 'ollama', error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const message = data.message;

    if (!message) {
      return { success: false, provider: 'ollama', error: 'No message in response' };
    }

    console.log('✅ Ollama successful with Eliza intelligence');

    if (message.tool_calls?.length > 0) {
      console.log(`🔧 Ollama returned ${message.tool_calls.length} tool calls`);
      return { success: true, provider: 'ollama', message: { ...message, role: 'assistant' } };
    }

    return { success: true, provider: 'ollama', content: message.content || '' };
  } catch (error) {
    console.warn('⚠️ Ollama error:', error.message);
    return { success: false, provider: 'ollama', error: error.message };
  }
}

/**
 * Call DeepSeek V3 - FALLBACK PROVIDER (Reasoning)
 */
async function callDeepSeek(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<ProviderResult> {
  const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

  if (!DEEPSEEK_API_KEY) {
    return { success: false, provider: 'deepseek', error: 'DEEPSEEK_API_KEY not configured' };
  }

  try {
    console.log('🧠 FALLBACK PROVIDER: Attempting DeepSeek V3 with full Eliza context...');

    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);

    const requestMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ];

    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;

    const requestBody: any = {
      model: 'deepseek-chat',
      messages: requestMessages,
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens,
    };

    const response = await fetchWithTimeout(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      PROVIDER_TIMEOUTS.deepseek
    );

    const fastFailError = checkFastFail(response, 'deepseek');
    if (fastFailError) {
      return { success: false, provider: 'deepseek', error: fastFailError };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ DeepSeek failed (${response.status}):`, errorText);
      return { success: false, provider: 'deepseek', error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message) {
      return { success: false, provider: 'deepseek', error: 'No message in response' };
    }

    console.log('✅ DeepSeek AI successful with Eliza intelligence');

    if (message.tool_calls?.length > 0) {
      console.log(`🔧 DeepSeek returned ${message.tool_calls.length} tool calls`);
      return { success: true, provider: 'deepseek', message };
    }

    return { success: true, provider: 'deepseek', content: message.content || '' };
  } catch (error) {
    console.warn('⚠️ DeepSeek error:', error.message);
    return { success: false, provider: 'deepseek', error: error.message };
  }
}

/**
 * Call Kimi K2 via OpenRouter API - FINAL FALLBACK PROVIDER
 */
async function callKimi(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<ProviderResult> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

  if (!OPENROUTER_API_KEY) {
    return { success: false, provider: 'kimi', error: 'OPENROUTER_API_KEY not configured' };
  }

  try {
    console.log('🦊 FINAL FALLBACK: Attempting Kimi K2 via OpenRouter with full Eliza context...');

    const effectiveSystemPrompt = getEffectiveSystemPrompt(options);
    const effectiveTools = getEffectiveTools(options);

    const requestMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ];

    const maxTokens = options.maxTokens || options.max_tokens || RESPONSE_MAX_TOKENS;

    const requestBody: any = {
      model: 'moonshotai/kimi-k2',
      messages: requestMessages,
      temperature: options.temperature || 0.7,
      max_tokens: maxTokens,
    };

    if (effectiveTools.length > 0) {
      requestBody.tools = effectiveTools;
      requestBody.tool_choice = 'auto';
    }

    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://xmrt.pro',
          'X-Title': 'XMRT Eliza'
        },
        body: JSON.stringify(requestBody),
      },
      PROVIDER_TIMEOUTS.kimi
    );

    const fastFailError = checkFastFail(response, 'kimi');
    if (fastFailError) {
      return { success: false, provider: 'kimi', error: fastFailError };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`⚠️ Kimi failed (${response.status}):`, errorText);
      return { success: false, provider: 'kimi', error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message) {
      return { success: false, provider: 'kimi', error: 'No message in response' };
    }

    console.log('✅ Kimi AI successful with Eliza intelligence');

    if (message.tool_calls?.length > 0) {
      console.log(`🔧 Kimi returned ${message.tool_calls.length} tool calls`);
      return { success: true, provider: 'kimi', message };
    }

    return { success: true, provider: 'kimi', content: message.content || '' };
  } catch (error) {
    console.warn('⚠️ Kimi error:', error.message);
    return { success: false, provider: 'kimi', error: error.message };
  }
}

/**
 * MAIN ENTRY POINT: Unified AI Fallback Cascade
 *
 * Order:
 *   1. Ollama (Primary - local/self-hosted)
 *   2. Vertex AI via Service Account OAuth2 (GCP — most reliable cloud)
 *   3. Gemini API key (direct, fast fallback)
 *   4. Vertex AI Express Mode (via Gemini key)
 *   5. DeepSeek V3
 *   6. Kimi K2 (final fallback)
 */
export async function callAIWithFallback(
  messages: AIMessage[],
  options: UnifiedAIOptions = {}
): Promise<any> {
  const errors: string[] = [];

  // 1. PRIMARY: Ollama
  console.log('🦙 Trying Ollama (primary)...');
  const ollamaResult = await callOllama(messages, options);
  if (ollamaResult.success) return transformResult(ollamaResult);
  errors.push(`Ollama: ${ollamaResult.error}`);
  console.warn('⚠️ Ollama failed, trying Vertex SA fallback...');

  // 2. CLOUD PRIMARY: Vertex AI via Service Account OAuth2
  console.log('🔑 Trying Vertex AI SA OAuth2...');
  const saResult = await callVertexWithServiceAccount(messages, options);
  if (saResult.success) return transformResult(saResult);
  errors.push(`VertexSA: ${saResult.error}`);
  console.warn('⚠️ Vertex SA failed, trying API key fallback...');

  // 3. FALLBACK: Gemini API key
  const geminiResult = await callGemini(messages, options);
  if (geminiResult.success) return transformResult(geminiResult);
  errors.push(`Gemini: ${geminiResult.error}`);

  // 4. Vertex AI Express Mode (reuses Gemini key)
  const vertexResult = await callVertex(messages, options);
  if (vertexResult.success) return transformResult(vertexResult);
  errors.push(`Vertex: ${vertexResult.error}`);

  // 5. DeepSeek V3
  const deepSeekResult = await callDeepSeek(messages, options);
  if (deepSeekResult.success) return transformResult(deepSeekResult);
  errors.push(`DeepSeek: ${deepSeekResult.error}`);

  // 6. Kimi K2 (final fallback)
  const kimiResult = await callKimi(messages, options);
  if (kimiResult.success) return transformResult(kimiResult);
  errors.push(`Kimi: ${kimiResult.error}`);

  throw new Error(`All AI providers failed: ${errors.join(' | ')}`);
}

/**
 * Transform standard result format into string or object (for backward compatibility)
 */
function transformResult(result: ProviderResult): any {
  if (result.message) {
    return {
      role: 'assistant',
      content: result.message.content,
      tool_calls: result.message.tool_calls,
      provider: result.provider
    };
  }
  return {
    content: result.content || '',
    provider: result.provider
  };
}

/**
 * Generate Embedding using Supabase Native AI (ONNX via internal Runtime)
 */
let embeddingSession: any = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`🧠 Generating embedding for ${text.length} chars using Supabase Native AI (gte-small)...`);

    if (!embeddingSession) {
      // @ts-ignore
      if (typeof Supabase === 'undefined' || !Supabase.ai) {
        throw new Error('Supabase Native AI not available in this environment');
      }
      // @ts-ignore
      embeddingSession = new Supabase.ai.Session('gte-small');
    }

    const output = await embeddingSession.run(text, {
      mean_pool: true,
      normalize: true,
    });

    if (!output || !Array.isArray(output)) {
      throw new Error('Invalid embedding format from Supabase AI');
    }

    return output;
  } catch (error) {
    console.error('❌ Embedding generation error:', error);
    embeddingSession = null;
    throw error;
  }
}

// Helper types and functions (assumed to be defined at end of file)
interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UnifiedAIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  max_tokens?: number;
  systemPrompt?: string;
  tools?: any[];
}

interface ProviderResult {
  success: boolean;
  provider: string;
  content?: string;
  message?: any;
  error?: string;
}

function getEffectiveSystemPrompt(options: UnifiedAIOptions): string {
  return options.systemPrompt || generateElizaSystemPrompt();
}

function getEffectiveTools(options: UnifiedAIOptions): any[] {
  return options.tools || ELIZA_TOOLS;
}

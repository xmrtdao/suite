/**
 * muapi-media-generator — Supabase Edge Function
 * Wraps the Muapi.ai API for image and video generation.
 * Auth: x-api-key header (NOT Bearer)
 * Base URL: https://api.muapi.ai
 *
 * Deploy: supabase functions deploy muapi-media-generator
 * Secrets needed: MUAPI_API_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface GenerationRequest {
  model: string
  prompt: string
  negative_prompt?: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
  num_frames?: number
  fps?: number
  image_url?: string  // for image-to-image / image-to-video
}

interface PollingState {
  attempt: number
  maxAttempts: number
  intervalMs: number
}

const DEFAULT_TIMEOUT_MS = 120_000
const DEFAULT_POLL_INTERVAL_MS = 3_000
const DEFAULT_MAX_POLL_ATTEMPTS = 40

// Supported models
const IMAGE_MODELS: Record<string, { cost: number; unit: string }> = {
  'wan2.7-text-to-image': { cost: 0.05, unit: 'per generation' },
  'wan2.7-text-to-image-pro': { cost: 0.10, unit: 'per generation' },
  'flux-schnell': { cost: 0.02, unit: 'per generation' },
  'flux-dev': { cost: 0.05, unit: 'per generation' },
  'flux-realism': { cost: 0.08, unit: 'per generation' },
  'midjourney-v8': { cost: 0.10, unit: '4 images/run' },
  'playground-v2.5': { cost: 0.04, unit: 'per generation' },
  'pix2pix': { cost: 0.05, unit: 'per generation' },
  'stable-diffusion-xl': { cost: 0.04, unit: 'per generation' },
  'dalle-3': { cost: 0.04, unit: 'per generation' },
  'imagen-3': { cost: 0.05, unit: 'per generation' },
}

const VIDEO_MODELS: Record<string, { cost: number; unit: string; per: string }> = {
  'wan2.7-text-to-video': { cost: 0.02, unit: 'per second', per: 's' },
  'wan2.7-image-to-video': { cost: 0.03, unit: 'per second', per: 's' },
  'kling-1.6-standard': { cost: 0.05, unit: 'per second', per: 's' },
  'kling-1.6-pro': { cost: 0.10, unit: 'per second', per: 's' },
  'sd-2-text-to-video': { cost: 0.25, unit: 'per second', per: 's' },
  'sd-2-text-to-video-fast': { cost: 0.15, unit: 'per second', per: 's' },
  'veo3.1-lite-text-to-video': { cost: 0.30, unit: 'per generation', per: '' },
  'happy-horse-1-text-to-video-1080p': { cost: 0.36, unit: 'per second', per: 's' },
  'pixverse-v6-t2v': { cost: 0.033, unit: 'per second', per: 's' },
  'ltx-video': { cost: 0.05, unit: 'per second', per: 's' },
  'minimax-video': { cost: 0.02, unit: 'per second', per: 's' },
  'runway-gen3': { cost: 0.05, unit: 'per second', per: 's' },
}

function getModelInfo(model: string): { type: 'image' | 'video'; cost: number; unit: string } | null {
  if (IMAGE_MODELS[model]) {
    return { type: 'image', ...IMAGE_MODELS[model] }
  }
  if (VIDEO_MODELS[model]) {
    return { type: 'video', ...VIDEO_MODELS[model] }
  }
  return null
}

async function callMuapi(method: string, path: string, apiKey: string, body?: object): Promise<unknown> {
  const url = `https://api.muapi.ai/api/v1${path}`
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const resp = await fetch(url, opts)
  if (!resp.ok) {
    const text = await resp.text().catch(() => 'unknown error')
    throw new Error(`Muapi ${method} ${path} failed: ${resp.status} ${text}`)
  }
  return resp.json()
}

async function pollForResult(
  requestId: string,
  apiKey: string,
  state: PollingState,
  timeoutMs: number,
): Promise<{ status: string; output?: unknown; error?: string }> {
  const start = Date.now()

  while (state.attempt < state.maxAttempts) {
    if (Date.now() - start > timeoutMs) {
      return { status: 'timeout', error: `Timed out after ${timeoutMs}ms` }
    }

    await new Promise(resolve => setTimeout(resolve, state.intervalMs))

    try {
      const result = await callMuapi('GET', `/predictions/${requestId}/result`, apiKey) as {
        status: string
        output?: unknown
        error?: string
      }

      if (result.status === 'completed') {
        return { status: 'completed', output: result.output }
      }
      if (result.status === 'failed' || result.status === 'error') {
        return { status: result.status, error: String(result.error || 'Generation failed') }
      }
      // still processing — keep polling
      state.attempt++
    } catch (e) {
      // Network error during poll — retry
      console.error('Poll error:', e)
      state.attempt++
    }
  }

  return { status: 'timeout', error: `Max poll attempts (${state.maxAttempts}) reached` }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('MUAPI_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'MUAPI_API_KEY not configured. Set it in Supabase > Edge Functions > Secrets.' }, 500)
    }

    const body = await req.json() as GenerationRequest
    const { model, prompt, negative_prompt, width, height, num_inference_steps, guidance_scale, seed, num_frames, fps, image_url } = body

    if (!model || !prompt) {
      return jsonResponse({ error: 'model and prompt are required fields.' }, 400)
    }

    const modelInfo = getModelInfo(model)
    if (!modelInfo) {
      const knownModels = [...Object.keys(IMAGE_MODELS), ...Object.keys(VIDEO_MODELS)]
      return jsonResponse({
        error: `Unknown model: ${model}`,
        known_models: knownModels,
        image_models: Object.keys(IMAGE_MODELS),
        video_models: Object.keys(VIDEO_MODELS),
      }, 400)
    }

    // Build request payload for Muapi
    const muapiPayload: Record<string, unknown> = {
      prompt,
      ...(negative_prompt && { negative_prompt }),
      ...(width && { width }),
      ...(height && { height }),
      ...(num_inference_steps && { num_inference_steps }),
      ...(guidance_scale && { guidance_scale }),
      ...(seed !== undefined && { seed }),
      ...(num_frames && { num_frames }),
      ...(fps && { fps }),
      ...(image_url && { image_url }),
    }

    // Submit generation request
    console.log(`Submitting ${modelInfo.type} generation: ${model}`)
    const submitResult = await callMuapi('POST', `/${model}`, apiKey, muapiPayload) as { request_id?: string; id?: string; error?: string }

    const requestId = submitResult.request_id || submitResult.id
    if (!requestId) {
      return jsonResponse({ error: 'No request_id returned from Muapi', response: submitResult }, 500)
    }

    console.log(`Request submitted: ${requestId}`)

    // Poll for result
    const timeoutMs = parseInt(Deno.env.get('DEFAULT_TIMEOUT_MS') || String(DEFAULT_TIMEOUT_MS))
    const pollInterval = parseInt(Deno.env.get('POLL_INTERVAL_MS') || String(DEFAULT_POLL_INTERVAL_MS))
    const maxAttempts = parseInt(Deno.env.get('MAX_POLL_ATTEMPTS') || String(DEFAULT_MAX_POLL_ATTEMPTS))

    const state: PollingState = { attempt: 0, maxAttempts, intervalMs: pollInterval }
    const result = await pollForResult(requestId, apiKey, state, timeoutMs)

    if (result.status === 'completed') {
      const cost = modelInfo.cost
      return jsonResponse({
        success: true,
        model,
        model_type: modelInfo.type,
        request_id: requestId,
        output: result.output,
        estimated_cost_usd: cost,
        cost_unit: modelInfo.unit,
        generation_time_ms: Date.now() - (Date.now() - timeoutMs), // approx
        created_at: new Date().toISOString(),
      })
    } else {
      return jsonResponse({
        success: false,
        model,
        request_id: requestId,
        status: result.status,
        error: result.error,
      }, result.status === 'timeout' ? 408 : 500)
    }

  } catch (e) {
    console.error('muapi-media-generator error:', e)
    return jsonResponse({ error: String(e.message || e) }, 500)
  }
})

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
/**
 * superduper-content-media — Cinematographer Agent
 * The content/media specialist agent. Accepts content requests and
 * delegates to muapi-media-generator for actual image/video generation.
 *
 * Actions:
 *   generate_image      — text-to-image or image-to-image
 *   generate_video      — text-to-video or image-to-video
 *   generate_slideshow  — sequence of images as a video
 *   lip_sync            — sync audio to a character image
 *   list_models         — available models with costs
 *   estimate_cost       — cost estimate for a generation request
 *
 * Deploy: supabase functions deploy superduper-content-media
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'generate_image' | 'generate_video' | 'generate_slideshow' | 'lip_sync' | 'list_models' | 'estimate_cost'

interface ImageRequest {
  prompt: string
  model?: string
  negative_prompt?: string
  width?: number
  height?: number
  num_inference_steps?: number
  guidance_scale?: number
  seed?: number
  image_url?: string  // for image-to-image
  style?: string  // 'photorealistic' | 'cinematic' | 'anime' | 'oil-painting' | etc.
}

interface VideoRequest {
  prompt: string
  model?: string
  width?: number
  height?: number
  num_frames?: number
  fps?: number
  image_url?: string  // start frame for image-to-video
  style?: string
}

// Model catalog
const IMAGE_MODELS = {
  'wan2.7-text-to-image': { name: 'Wan 2.7 Text-to-Image', type: 't2i', cost: 0.05, quality: 'good', speed: 'fast' },
  'wan2.7-text-to-image-pro': { name: 'Wan 2.7 Pro', type: 't2i', cost: 0.10, quality: 'excellent', speed: 'medium' },
  'flux-schnell': { name: 'Flux Schnell', type: 't2i', cost: 0.02, quality: 'high', speed: 'fast' },
  'flux-dev': { name: 'Flux Dev', type: 't2i', cost: 0.05, quality: 'excellent', speed: 'medium' },
  'flux-realism': { name: 'Flux Realism', type: 't2i', cost: 0.08, quality: 'photorealistic', speed: 'medium' },
  'midjourney-v8': { name: 'Midjourney v8', type: 't2i', cost: 0.10, quality: 'excellent', speed: 'slow', note: '4 images per run' },
  'playground-v2.5': { name: 'Playground v2.5', type: 't2i', cost: 0.04, quality: 'good', speed: 'fast' },
  'stable-diffusion-xl': { name: 'Stable Diffusion XL', type: 't2i', cost: 0.04, quality: 'good', speed: 'medium' },
  'pix2pix': { name: 'Pix2Pix (image-to-image)', type: 'i2i', cost: 0.05, quality: 'good', speed: 'medium' },
  'dalle-3': { name: 'DALL-E 3', type: 't2i', cost: 0.04, quality: 'excellent', speed: 'medium' },
  'imagen-3': { name: 'Google Imagen 3', type: 't2i', cost: 0.05, quality: 'excellent', speed: 'medium' },
}

const VIDEO_MODELS = {
  'wan2.7-text-to-video': { name: 'Wan 2.7 Text-to-Video', type: 't2v', cost_per_sec: 0.02, quality: 'good' },
  'wan2.7-image-to-video': { name: 'Wan 2.7 Image-to-Video', type: 'i2v', cost_per_sec: 0.03, quality: 'good' },
  'kling-1.6-standard': { name: 'Kling 1.6 Standard', type: 't2v', cost_per_sec: 0.05, quality: 'high' },
  'kling-1.6-pro': { name: 'Kling 1.6 Pro', type: 't2v', cost_per_sec: 0.10, quality: 'excellent' },
  'sd-2-text-to-video': { name: 'SD 2 (ByteDance)', type: 't2v', cost_per_sec: 0.25, quality: 'high' },
  'sd-2-text-to-video-fast': { name: 'SD 2 Fast', type: 't2v', cost_per_sec: 0.15, quality: 'good' },
  'veo3.1-lite-text-to-video': { name: 'Google Veo 3.1 Lite', type: 't2v', cost_per_sec: 0.30, quality: 'excellent' },
  'happy-horse-1-text-to-video-1080p': { name: 'Happy Horse 1 (1080p)', type: 't2v', cost_per_sec: 0.36, quality: 'top' },
  'pixverse-v6-t2v': { name: 'PixVerse v6', type: 't2v', cost_per_sec: 0.033, quality: 'good' },
  'ltx-video': { name: 'LTX Video', type: 't2v', cost_per_sec: 0.05, quality: 'high' },
}

const STYLE_PRESETS: Record<string, string> = {
  'cinematic': 'cinematic lighting, film grain, anamorphic lens flare, movie scene, dramatic lighting, 8k, professional cinematography',
  'photorealistic': 'photorealistic, hyperrealistic, physical correctness, soft lighting, RAW photo, 8k resolution, professional photography',
  'anime': 'anime style, vibrant colors, cel shading, studio ghibli, makoto shinkai style, crisp lineart',
  'oil-painting': 'oil painting, classical art, impasto brushwork, renaissance style, museum quality, thick paint texture',
  'concept-art': 'concept art, digital painting, detailed environment design, artstation, trending on artstation',
  'portrait': 'portrait photography, professional lighting, 85mm lens, bokeh, subject focus, 8k',
  'landscape': 'landscape photography, golden hour, epic composition, 8k, national geographic style',
  'cyberpunk': 'cyberpunk, neon lights, rain-soaked streets, blade runner atmosphere, volumetric fog, 8k',
  'fantasy': 'fantasy art, epic landscape, magic realism, detailed environment, artstation trending',
}

// Map style presets to negative prompts
const STYLE_NEGATIVE: Record<string, string> = {
  'photorealistic': 'illustration, cartoon, drawing, painting, artistic',
  'anime': 'realistic, photograph, 3d render, western cartoon',
  'cinematic': 'snapshot, amateur, low quality, blurry',
  'oil-painting': 'digital, photograph, 3d render, modern',
  'portrait': 'landscape, wide angle, group photo, selfie',
}

// Quality presets
const QUALITY_PRESETS: Record<string, { steps?: number; guidance?: number; width?: number; height?: number }> = {
  'draft': { steps: 20, guidance: 5 },
  'good': { steps: 30, guidance: 7.5 },
  'high': { steps: 50, guidance: 8 },
  'best': { steps: 80, guidance: 9 },
}

async function callMuapi(model: string, payload: Record<string, unknown>, timeoutMs = 120_000): Promise<unknown> {
  const apiKey = Deno.env.get('MUAPI_API_KEY')
  if (!apiKey) {
    throw new Error('MUAPI_API_KEY not configured in Supabase Edge Functions Secrets')
  }

  // Submit generation
  const submitResp = await fetch(`https://api.muapi.ai/api/v1/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(payload),
  })

  if (!submitResp.ok) {
    const err = await submitResp.text().catch(() => '')
    throw new Error(`Muapi submit failed: ${submitResp.status} ${err}`)
  }

  const submitData = await submitResp.json() as { request_id?: string; id?: string }
  const requestId = submitData.request_id || submitData.id
  if (!requestId) throw new Error('No request_id from Muapi')

  // Poll
  const start = Date.now()
  const pollInterval = 3000
  const maxAttempts = Math.ceil(timeoutMs / pollInterval)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))

    if (Date.now() - start > timeoutMs) break

    const pollResp = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': apiKey },
    })

    if (!pollResp.ok) continue

    const result = await pollResp.json() as { status: string; output?: unknown; error?: string }
    if (result.status === 'completed') {
      return result.output
    }
    if (result.status === 'failed' || result.status === 'error') {
      throw new Error(String(result.error || 'Generation failed'))
    }
  }

  throw new Error('Generation timed out')
}

function estimateCost(model: string, durationSecs?: number): number {
  if (IMAGE_MODELS[model]) return IMAGE_MODELS[model].cost
  if (VIDEO_MODELS[model]) {
    const m = VIDEO_MODELS[model]
    return (m.cost_per_sec || 0.05) * (durationSecs || 5)
  }
  return 0
}

function buildImagePayload(req: ImageRequest, style?: string): Record<string, unknown> {
  const stylePrompt = style && STYLE_PRESETS[style] ? STYLE_PRESETS[style] : ''
  const negPrompt = style && STYLE_NEGATIVE[style] ? STYLE_NEGATIVE[style] : (req.negative_prompt || '')

  const prompt = stylePrompt ? `${req.prompt}. ${stylePrompt}` : req.prompt

  return {
    prompt,
    ...(negPrompt && { negative_prompt: negPrompt }),
    ...(req.width && { width: req.width }),
    ...(req.height && { height: req.height }),
    ...(req.num_inference_steps && { num_inference_steps: req.num_inference_steps }),
    ...(req.guidance_scale && { guidance_scale: req.guidance_scale }),
    ...(req.seed !== undefined && { seed: req.seed }),
    ...(req.image_url && { image_url: req.image_url }),
  }
}

function buildVideoPayload(req: VideoRequest, style?: string): Record<string, unknown> {
  const stylePrompt = style && STYLE_PRESETS[style] ? STYLE_PRESETS[style] : ''
  const prompt = stylePrompt ? `${req.prompt}. ${stylePrompt}` : req.prompt

  return {
    prompt,
    ...(req.width && { width: req.width }),
    ...(req.height && { height: req.height }),
    ...(req.num_frames && { num_frames: req.num_frames }),
    ...(req.fps && { fps: req.fps }),
    ...(req.image_url && { image_url: req.image_url }),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json() as { action: Action; [key: string]: unknown }
    const { action, ...params } = body

    if (!action) {
      return jsonResponse({
        error: 'action is required',
        available_actions: ['generate_image', 'generate_video', 'generate_slideshow', 'lip_sync', 'list_models', 'estimate_cost'],
      }, 400)
    }

    switch (action) {
      case 'list_models': {
        return jsonResponse({
          action: 'list_models',
          image_models: IMAGE_MODELS,
          video_models: VIDEO_MODELS,
          style_presets: Object.keys(STYLE_PRESETS),
          quality_presets: Object.keys(QUALITY_PRESETS),
          default_model_image: 'wan2.7-text-to-image',
          default_model_video: 'wan2.7-text-to-video',
        })
      }

      case 'estimate_cost': {
        const { model, duration_seconds } = params as { model?: string; duration_seconds?: number }
        if (!model) {
          return jsonResponse({ error: 'model is required for estimate_cost' }, 400)
        }
        const cost = estimateCost(model, duration_seconds)
        const modelInfo = IMAGE_MODELS[model] || VIDEO_MODELS[model]
        return jsonResponse({
          action: 'estimate_cost',
          model,
          estimated_cost_usd: cost,
          unit: modelInfo ? (IMAGE_MODELS[model] ? modelInfo.cost : `$${modelInfo.cost_per_sec}/sec`) : 'unknown',
          duration_seconds: duration_seconds || null,
        })
      }

      case 'generate_image': {
        const req2 = params as ImageRequest
        if (!req2.prompt) {
          return jsonResponse({ error: 'prompt is required for generate_image' }, 400)
        }

        const model = req2.model || 'wan2.7-text-to-image'
        const style = req2.style
        const payload = buildImagePayload(req2, style)

        // Check if image-to-image
        const actualModel = req2.image_url && !IMAGE_MODELS[model] ? 'pix2pix' : model

        console.log(`Generating image: ${actualModel}, style: ${style || 'none'}`)
        const output = await callMuapi(actualModel, payload) as { url?: string }

        return jsonResponse({
          success: true,
          action: 'generate_image',
          model: actualModel,
          style: style || null,
          prompt: req2.prompt,
          output_url: typeof output === 'string' ? output : (output as { url?: string })?.url || JSON.stringify(output),
          estimated_cost_usd: estimateCost(actualModel),
          generated_at: new Date().toISOString(),
          cinematographer_note: style ? `Generated in ${style} style` : 'Standard generation',
        })
      }

      case 'generate_video': {
        const req2 = params as VideoRequest & { duration_seconds?: number }
        if (!req2.prompt) {
          return jsonResponse({ error: 'prompt is required for generate_video' }, 400)
        }

        const model = req2.model || 'wan2.7-text-to-video'
        const durationSecs = req2.duration_seconds || 5
        const style = req2.style
        const payload = buildVideoPayload(req2, style)

        console.log(`Generating video: ${model}, ${durationSecs}s, style: ${style || 'none'}`)
        const output = await callMuapi(model, { ...payload, num_frames: req2.num_frames || durationSecs * 30 }) as { url?: string; video_url?: string }

        return jsonResponse({
          success: true,
          action: 'generate_video',
          model,
          style: style || null,
          prompt: req2.prompt,
          duration_seconds: durationSecs,
          output_url: typeof output === 'string' ? output : (output as { url?: string; video_url?: string })?.video_url || (output as { url?: string })?.url || JSON.stringify(output),
          estimated_cost_usd: estimateCost(model, durationSecs),
          generated_at: new Date().toISOString(),
          cinematographer_note: `Generated ${durationSecs}s video in ${style || 'default'} style`,
        })
      }

      case 'lip_sync': {
        const { image_url, audio_url } = params as { image_url?: string; audio_url?: string }
        if (!image_url || !audio_url) {
          return jsonResponse({ error: 'image_url and audio_url are required for lip_sync' }, 400)
        }
        // Lip sync uses ltw-video or similar — call muapi with lip-sync model
        console.log(`Lip sync: image=${image_url}, audio=${audio_url}`)
        return jsonResponse({
          success: true,
          action: 'lip_sync',
          status: 'not_yet_implemented',
          note: 'Lip sync requires Infinite Talk or LTX Lipsync model. Configure MUAPI_API_KEY and set model to ltX-lipsync.',
          image_url,
          audio_url,
          workaround: 'Use generate_video with image_url start frame and voice-over audio track',
        })
      }

      case 'generate_slideshow': {
        const { prompts, duration_per_slide, transition, music } = params as {
          prompts?: string[]
          duration_per_slide?: number
          transition?: string
          music?: string
        }
        if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
          return jsonResponse({ error: 'prompts (array of strings) is required for generate_slideshow' }, 400)
        }

        const dps = duration_per_slide || 3
        const results = []
        for (const prompt of prompts) {
          try {
            const payload = buildImagePayload({ prompt } as ImageRequest, 'cinematic')
            const output = await callMuapi('wan2.7-text-to-image', payload) as { url?: string }
            results.push({ prompt, image_url: typeof output === 'string' ? output : (output as { url?: string })?.url, status: 'generated' })
          } catch (e) {
            results.push({ prompt, error: String(e), status: 'failed' })
          }
        }

        return jsonResponse({
          success: true,
          action: 'generate_slideshow',
          slides: results,
          total_slides: prompts.length,
          duration_per_slide_seconds: dps,
          estimated_duration_seconds: prompts.length * dps,
          transition: transition || 'fade',
          music: music || null,
          cinematographer_note: `${prompts.length} slides generated for slideshow. Assemble into video in post-production.`,
        })
      }

      default:
        return jsonResponse({
          error: `Unknown action: ${action}`,
          available_actions: ['generate_image', 'generate_video', 'generate_slideshow', 'lip_sync', 'list_models', 'estimate_cost'],
        }, 400)
    }

  } catch (e) {
    console.error('superduper-content-media error:', e)
    return jsonResponse({ error: String(e.message || e) }, 500)
  }
})

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
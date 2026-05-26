/**
 * MUAPI - Paid AI Media Generation Service
 * 
 * Pricing:
 * - Image: $0.50 (1 credit)
 * - Video: $2.00 (4 credits)
 * - Avatar: $5.00 (10 credits)
 * 
 * Tiers:
 * - Free: 5 gens/month
 * - Starter: $29/mo (50 images)
 * - Pro: $99/mo (200 images + 20 videos)
 * - Business: $299/mo (1000 images + 100 videos)
 * - Enterprise: $999/mo (unlimited)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICING = {
  image: 1,
  video: 4,
  avatar: 10,
};

const TIER_LIMITS: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: 200,
  business: 1000,
  enterprise: -1,
};

interface GenerateRequest {
  media_type: 'image' | 'video' | 'avatar';
  prompt: string;
  options?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const MUAPI_API_KEY = Deno.env.get('MUAPI_API_KEY');
  
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  try {
    const api_key = req.headers.get('x-api-key');
    if (!api_key) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify API key + get user
    const { data: user, error: userError } = await supabase
      .from('muapi_users')
      .select('*')
      .eq('api_key', api_key)
      .single();

    if (userError || !user || user.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check monthly usage
    const { data: usageData } = await supabase
      .from('muapi_generations')
      .select('credits_used')
      .eq('user_id', user.id)
      .gte('created_at', new Date().toISOString().slice(0, 7));

    const currentUsage = usageData?.reduce((sum, r) => sum + r.credits_used, 0) || 0;
    const limit = TIER_LIMITS[user.tier];

    if (limit !== -1 && currentUsage >= limit) {
      return new Response(JSON.stringify({
        error: 'Monthly limit reached',
        current_usage: currentUsage,
        limit: limit,
        upgrade_url: 'https://muapi.xmrt-dao.com/pricing'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { media_type, prompt, options } = await req.json() as GenerateRequest;

    if (!media_type || !prompt) {
      return new Response(JSON.stringify({ error: 'media_type and prompt required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const credits = PRICING[media_type];

    // Call MUAPI backend (your existing pipeline)
    const muapiResponse = await fetch('https://api.muapi.ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MUAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media_type, prompt, ...options }),
    });

    if (!muapiResponse.ok) {
      throw new Error(`MUAPI backend error: ${muapiResponse.statusText}`);
    }

    const result = await muapiResponse.json();

    // Record usage
    await supabase.from('muapi_generations').insert([{
      user_id: user.id,
      media_type,
      prompt,
      output_url: result.url || result.output_url,
      credits_used: credits,
      status: 'completed',
    }]);

    const remaining = limit === -1 ? -1 : limit - currentUsage - credits;

    return new Response(JSON.stringify({
      success: true,
      url: result.url || result.output_url,
      credits_used: credits,
      credits_remaining: remaining === -1 ? 'unlimited' : remaining,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

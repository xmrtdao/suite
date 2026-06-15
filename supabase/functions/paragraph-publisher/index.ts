import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { startUsageTracking } from "../_shared/functionUsageLogger.ts";

const FUNCTION_NAME = 'paragraph-publisher';

// Correct base URL is public.api.paragraph.com/api. The API key is
// publication-scoped, so /v1/posts publishes to whichever publication
// the key was generated for (e.g. @mobilemonero).
const PARAGRAPH_API_BASE = 'https://public.api.paragraph.com/api';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const usageTracker = startUsageTracking(FUNCTION_NAME, 'eliza', { method: req.method });

  try {
    const PARAGRAPH_API_KEY = Deno.env.get('PARAGRAPH_API_KEY');
    if (!PARAGRAPH_API_KEY) {
      throw new Error('PARAGRAPH_API_KEY is not set in Supabase Secrets.');
    }

    const defaultAuthor = Deno.env.get('PARAGRAPH_DEFAULT_AUTHOR') || undefined;
    const coinSymbol = Deno.env.get('PARAGRAPH_COIN_SYMBOL') || undefined;

    // Parse request body. The /v1/posts endpoint accepts:
    //   title (required), markdown (required), imageUrl, sendNewsletter,
    //   slug, categories, subtitle, postPreview, status, scheduledAt
    const {
      title,
      body,
      markdown,
      imageUrl,
      sendNewsletter,
      slug,
      categories,
      subtitle,
      postPreview,
      status,
      scheduledAt,
    } = await req.json();

    const content = markdown || body;
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content (markdown or body) are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const defaultCategories = coinSymbol
      ? ['News', `$${coinSymbol}`, 'XMRT Intelligence']
      : ['News', 'XMRT Intelligence'];

    const payload: Record<string, unknown> = {
      title: title.substring(0, 200),
      markdown: content,
      imageUrl,
      sendNewsletter: sendNewsletter || false,
      slug,
      categories: categories || defaultCategories,
      status: status || 'published',
    };
    if (subtitle) payload.subtitle = subtitle.substring(0, 300);
    if (postPreview) payload.postPreview = postPreview.substring(0, 500);
    if (scheduledAt) payload.scheduledAt = scheduledAt;
    if (defaultAuthor && !payload.author) payload.author = defaultAuthor;

    const response = await fetch(`${PARAGRAPH_API_BASE}/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PARAGRAPH_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({ raw: 'non-JSON response from Paragraph' }));

    if (!response.ok) {
      console.error('[paragraph-publisher] Paragraph.com error:', response.status, data);
      await usageTracker.failure(`Paragraph.com ${response.status}: ${JSON.stringify(data).slice(0, 200)}`, response.status);
      return new Response(JSON.stringify({
        error: 'Failed to publish to Paragraph.com',
        status: response.status,
        details: data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    console.log('[paragraph-publisher] Published:', data?.id || data);
    await usageTracker.success({ result_summary: `Published: ${data?.id || 'unknown'}` });

    // Build the canonical published URL. The API key is scoped to a
    // publication; we can derive the handle from PARAGRAPH_PUBLICATION_HANDLE
    // (stripped of @) or default to /@mobilemonero.
    const pubHandle = (Deno.env.get('PARAGRAPH_PUBLICATION_HANDLE') || 'mobilemonero').replace(/^@/, '');
    const publishedSlug = data?.slug || slug;
    const publishedUrl = `https://paragraph.com/@${pubHandle}/${publishedSlug || data?.id || ''}`.replace(/\/+$/, '');

    return new Response(JSON.stringify({
      message: 'Successfully published to Paragraph.com',
      data,
      published_url: publishedUrl,
      publication: `@${pubHandle}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[paragraph-publisher] Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

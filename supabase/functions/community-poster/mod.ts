/**
 * community-poster — Consolidated social media posting
 * Replaces: daily-discussion-post, evening-summary-post, weekly-retrospective-post,
 *           morning-discussion-post, community-spotlight-post, progress-update-post
 *
 * Actions:
 *   post_daily_discussion  — morning DAO discussion thread
 *   post_evening_summary   — end-of-day summary
 *   post_weekly_retro      — weekly retrospective
 *   post_spotlight         — community spotlight / member feature
 *   post_progress          — project progress update
 *   post_custom            — custom content with platform targeting
 *   schedule_post          — schedule a post for later
 *   get_scheduled          — list scheduled posts
 *   cancel_scheduled       — cancel a scheduled post
 *
 * Configuration (set in Supabase Edge Functions > Secrets):
 *   DEEPSEEK_API_KEY       — AI content generation (DeepSeek v4)
 *   TWITTER_BEARER_TOKEN   — Direct X/Twitter API posting
 *   LINKEDIN_TOKEN         — Direct LinkedIn posting
 *   DISCORD_WEBHOOK        — Discord channel posting
 *   TELEGRAM_BOT_TOKEN     — Telegram bot messaging
 *   (If DEEPSEEK_API_KEY is set, AI-generated content is used; otherwise templates are used)
 *
 * Deploy: supabase functions deploy community-poster
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action =
  | 'post_daily_discussion'
  | 'post_evening_summary'
  | 'post_weekly_retro'
  | 'post_spotlight'
  | 'post_progress'
  | 'post_custom'
  | 'schedule_post'
  | 'get_scheduled'
  | 'cancel_scheduled'

// Platform identifiers
type Platform = 'x' | 'linkedin' | 'discord' | 'telegram' | 'all'

interface PostResult {
  platform: string
  status: string
  post_id?: string
  post_url?: string
  error?: string
}

// Get posting templates based on DAO context
function getTemplate(type: string, date?: string): { content: string; hashtags: string[] } {
  const d = date ? new Date(date) : new Date()
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const templates: Record<string, { content: string; hashtags: string[] }> = {
    'daily_discussion': {
      content: `☀️ Good morning, XMRT community!

It's ${dayName}, ${dateStr}. Let's start the day with intention.

What are you working on today? Any blockers, wins, or questions?

#XMRTDAO #DAO #Mining`,
      hashtags: ['#XMRTDAO', '#DAO', '#Mining', '#Community'],
    },
    'evening_summary': {
      content: `🌙 XMRT-DAO Daily Summary — ${dateStr}

Today's highlights:
• Mining: pool.supportxmr.com — XMR continues to be mined efficiently
• Treasury: operational 
• Proposals: governance active

Rest up — big things ahead.

#XMRTDAO #DailySummary #XMR`,
      hashtags: ['#XMRTDAO', '#DailySummary', '#XMR', '#Mining'],
    },
    'weekly_retro': {
      content: `📊 XMRT-DAO Weekly Retrospective — Week of ${dateStr}

This week in the DAO:
✅ Mining operations running smoothly
✅ Ecosystem health maintained
✅ Governance proposals under review

Looking ahead: continued development, community growth initiatives.

Thank you for being part of this.

#XMRTDAO #WeeklyRetro #Web3 #XMR`,
      hashtags: ['#XMRTDAO', '#WeeklyRetro', '#Web3', '#XMR', '#DAO'],
    },
    'spotlight': {
      content: `🌟 Community Spotlight

We're celebrating the incredible members making XMRT-DAO extraordinary.

Thank you for your contributions, your vision, and your commitment to decentralized mining.

The future is built by those who show up.

#XMRTDAO #CommunitySpotlight # decentralization`,
      hashtags: ['#XMRTDAO', '#CommunitySpotlight', '#Decentralization'],
    },
    'progress': {
      content: `🚀 XMRT-DAO Progress Update — ${dateStr}

What's happening in the DAO:
• Mining infrastructure: running
• Edge function ecosystem: 119 functions operational
• Governance: active proposals being reviewed

We build in public. We ship with purpose.

#XMRTDAO #ProgressUpdate #BuildingInPublic`,
      hashtags: ['#XMRTDAO', '#ProgressUpdate', '#BuildingInPublic'],
    },
  }

  return templates[type] || templates['daily_discussion']
}

async function postToX(content: string, hashtags: string[], bearerToken?: string): Promise<PostResult> {
  if (!bearerToken) {
    return { platform: 'x', status: 'skipped', error: 'TWITTER_BEARER_TOKEN not configured' }
  }

  try {
    const fullContent = content + '\n\n' + hashtags.join(' ')
    const resp = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: fullContent.slice(0, 280) }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return { platform: 'x', status: 'error', error: `${resp.status}: ${err}` }
    }

    const data = await resp.json() as { data?: { id?: string } }
    return { platform: 'x', status: 'posted', post_id: data.data?.id }
  } catch (e) {
    return { platform: 'x', status: 'error', error: String(e) }
  }
}

async function postToLinkedIn(content: string, accessToken?: string): Promise<PostResult> {
  if (!accessToken) {
    return { platform: 'linkedin', status: 'skipped', error: 'LINKEDIN_TOKEN not configured' }
  }

  try {
    const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: 'urn:li:person:ME',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return { platform: 'linkedin', status: 'error', error: `${resp.status}: ${err}` }
    }

    const data = await resp.json() as { id?: string }
    const postId = data.id?.split(':').pop()
    return { platform: 'linkedin', status: 'posted', post_id: postId, post_url: `https://linkedin.com/feed/update/${postId}` }
  } catch (e) {
    return { platform: 'linkedin', status: 'error', error: String(e) }
  }
}

async function postToDiscord(content: string, webhookUrl?: string): Promise<PostResult> {
  if (!webhookUrl) {
    return { platform: 'discord', status: 'skipped', error: 'DISCORD_WEBHOOK not configured' }
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!resp.ok) {
      return { platform: 'discord', status: 'error', error: `HTTP ${resp.status}` }
    }
    return { platform: 'discord', status: 'posted' }
  } catch (e) {
    return { platform: 'discord', status: 'error', error: String(e) }
  }
}

async function postToTelegram(content: string, botToken?: string, chatId?: string): Promise<PostResult> {
  if (!botToken || !chatId) {
    return { platform: 'telegram', status: 'skipped', error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' }
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: content, parse_mode: 'Markdown' }),
    })

    if (!resp.ok) {
      return { platform: 'telegram', status: 'error', error: `HTTP ${resp.status}` }
    }

    const data = await resp.json() as { result?: { message_id?: number } }
    return { platform: 'telegram', status: 'posted', post_id: String(data.result?.message_id) }
  } catch (e) {
    return { platform: 'telegram', status: 'error', error: String(e) }
  }
}

// Generate content using DeepSeek v4 — replaces Lovable AI
async function tryDeepseekPost(prompt: string, platform?: string): Promise<PostResult> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY')
  if (!apiKey) {
    return { platform: 'deepseek', status: 'skipped', error: 'DEEPSEEK_API_KEY not configured' }
  }
  try {
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a social media content strategist for XMRT-DAO, a decentralized autonomous organization focused on Monero (XMR) mining and AI-driven governance. Generate engaging, accurate, on-brand social media content. Keep posts under 280 characters for X/Twitter. Use relevant hashtags. Never fabricate statistics — use only real data when citing numbers.`,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })
    if (!resp.ok) {
      const err = await resp.text()
      return { platform: 'deepseek', status: 'error', error: `DeepSeek API ${resp.status}: ${err}` }
    }
    const data = await resp.json() as { choices?: { message?: { content?: string } }[] }
    const generatedContent = data.choices?.[0]?.message?.content?.trim()
    if (!generatedContent) return { platform: 'deepseek', status: 'error', error: 'Empty response from DeepSeek' }

    // If a direct posting token is configured, post immediately
    if (platform === 'x' || platform === 'all') {
      const twitterToken = Deno.env.get('TWITTER_BEARER_TOKEN')
      if (twitterToken) {
        const postResp = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${twitterToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: generatedContent.slice(0, 280) }),
        })
        if (!postResp.ok) {
          const err = await postResp.text()
          return { platform: 'x', status: 'error', error: `Twitter API ${postResp.status}: ${err}`, post_id: generatedContent }
        }
        const postData = await postResp.json() as { data?: { id?: string } }
        return { platform: 'x', status: 'posted', post_id: postData.data?.id }
      }
    }
    // Return generated content for manual posting
    return { platform: 'deepseek', status: 'generated', post_id: 'pending', post_url: generatedContent }
  } catch (e) {
    return { platform: 'deepseek', status: 'error', error: String(e) }
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
        available_actions: ['post_daily_discussion', 'post_evening_summary', 'post_weekly_retro',
          'post_spotlight', 'post_progress', 'post_custom', 'schedule_post',
          'get_scheduled', 'cancel_scheduled'],
      }, 400)
    }

    const platform = (params.platform as Platform) || 'all'
    const dateStr = (params.date as string) || new Date().toISOString()

    async function post(templateType: string): Promise<{ results: PostResult[]; content: string }> {
      const template = getTemplate(templateType, dateStr)
      const customContent = (params.content as string) || template.content
      const hashtags = (params.hashtags as string[]) || template.hashtags

      // Try Lovable first (handles X + LinkedIn automatically)
      const results: PostResult[] = []

      if (platform === 'all' || platform === 'x') {
        const twitterToken = Deno.env.get('TWITTER_BEARER_TOKEN')
        results.push(await postToX(customContent, hashtags, twitterToken))
      }

      if (platform === 'all' || platform === 'linkedin') {
        const liToken = Deno.env.get('LINKEDIN_TOKEN')
        results.push(await postToLinkedIn(customContent, liToken))
      }

      if (platform === 'all' || platform === 'discord') {
        const webhook = Deno.env.get('DISCORD_WEBHOOK')
        results.push(await postToDiscord(customContent, webhook))
      }

      if (platform === 'all' || platform === 'telegram') {
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
        const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
        results.push(await postToTelegram(customContent, botToken, chatId))
      }

      // Try DeepSeek v4 AI content generation if API key is configured
      const hasDirectConfig = Deno.env.get('TWITTER_BEARER_TOKEN') || Deno.env.get('LINKEDIN_TOKEN')
      if (Deno.env.get('DEEPSEEK_API_KEY')) {
        results.push(await tryDeepseekPost(
          `Generate a social media post about XMRT-DAO. Topic: ${templateType.replace('_', ' ')}. Format: engaging tweet under 280 chars with relevant hashtags.`,
          platform as string,
        ))
      }

      return { results, content: customContent }
    }

    switch (action) {
      case 'post_daily_discussion': {
        const { results, content } = await post('daily_discussion')
        return jsonResponse({
          action: 'post_daily_discussion',
          posted_at: new Date().toISOString(),
          content,
          results,
          summary: {
            total: results.length,
            posted: results.filter(r => r.status === 'posted').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
          },
        })
      }

      case 'post_evening_summary': {
        const { results, content } = await post('evening_summary')
        return jsonResponse({
          action: 'post_evening_summary',
          posted_at: new Date().toISOString(),
          content,
          results,
          summary: {
            total: results.length,
            posted: results.filter(r => r.status === 'posted').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
          },
        })
      }

      case 'post_weekly_retro': {
        const { results, content } = await post('weekly_retro')
        return jsonResponse({
          action: 'post_weekly_retro',
          posted_at: new Date().toISOString(),
          content,
          results,
          summary: {
            total: results.length,
            posted: results.filter(r => r.status === 'posted').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
          },
        })
      }

      case 'post_spotlight': {
        const { results, content } = await post('spotlight')
        return jsonResponse({
          action: 'post_spotlight',
          posted_at: new Date().toISOString(),
          content,
          results,
          summary: {
            total: results.length,
            posted: results.filter(r => r.status === 'posted').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
          },
        })
      }

      case 'post_progress': {
        const { results, content } = await post('progress')
        return jsonResponse({
          action: 'post_progress',
          posted_at: new Date().toISOString(),
          content,
          results,
          summary: {
            total: results.length,
            posted: results.filter(r => r.status === 'posted').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
          },
        })
      }

      case 'post_custom': {
        const { content, hashtags } = params as { content?: string; hashtags?: string[]; platform?: Platform }
        if (!content) {
          return jsonResponse({ error: 'content is required for post_custom' }, 400)
        }

        const results: PostResult[] = []
        const tags = hashtags || []

        if (platform === 'all' || platform === 'x') {
          const twitterToken = Deno.env.get('TWITTER_BEARER_TOKEN')
          results.push(await postToX(content, tags, twitterToken))
        }
        if (platform === 'all' || platform === 'linkedin') {
          const liToken = Deno.env.get('LINKEDIN_TOKEN')
          results.push(await postToLinkedIn(content, liToken))
        }
        if (platform === 'all' || platform === 'discord') {
          const webhook = Deno.env.get('DISCORD_WEBHOOK')
          results.push(await postToDiscord(content, webhook))
        }
        if (platform === 'all' || platform === 'telegram') {
          const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
          const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
          results.push(await postToTelegram(content, botToken, chatId))
        }

        return jsonResponse({
          action: 'post_custom',
          posted_at: new Date().toISOString(),
          content,
          results,
          summary: {
            total: results.length,
            posted: results.filter(r => r.status === 'posted').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            errors: results.filter(r => r.status === 'error').length,
          },
        })
      }

      case 'schedule_post': {
        return jsonResponse({
          action: 'schedule_post',
          status: 'not_yet_implemented',
          note: 'Scheduling requires a cron job or persistent storage. Use Supabase Database with a scheduled publication table.',
          workaround: 'Set up a cron function that calls community-poster with post_* actions at scheduled times.',
        })
      }

      case 'get_scheduled':
      case 'cancel_scheduled': {
        return jsonResponse({
          action,
          status: 'not_yet_implemented',
          note: 'Scheduled post management requires Supabase Database table for post queue.',
        })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }

  } catch (e) {
    console.error('community-poster error:', e)
    return jsonResponse({ error: String(e.message || e) }, 500)
  }
})

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
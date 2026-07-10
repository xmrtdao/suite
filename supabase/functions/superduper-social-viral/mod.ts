/**
 * superduper-social-viral — Social & Viral Content Strategist
 * Uses: community-poster (new consolidated function), opportunity-scanner
 *
 * Deploy: supabase functions deploy superduper-social-viral
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhd291Z2R0endtZWp4cWtrcXJqIiwicmlkIjoiMjQwNDQyMjM2MjAwNDQxNjAwIiwic3ViIjoiYW5vbiIsImV4cCI6MTc0NjQ2Njk0Nn0.9XaQZ8XJjqqL-jd5BKAj9U1Z8G4mN6P-9oW3YfT2QkqY'
const BASE = 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1'

async function call(name: string, payload: object): Promise<unknown> {
  const r = await fetch(`${BASE}/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
  })
  return r.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { action, content, platform, hashtag_focus } = await req.json() as {
      action?: string; content?: string; platform?: string; hashtag_focus?: string
    }
    switch (action) {
      case 'viral_content': {
        const hooks = [
          'The future of decentralized mining is here — and it runs on XMR',
          'I built an AI that manages a DAO treasury. Here is what happened.',
          '119 edge functions. 1 vision. The XMRT-DAO story.',
          'What happens when AI takes over DAO governance? We found out.',
          'Mining crypto in 2026: How AI agents changed everything',
        ]
        const ctas = [
          'Join the DAO: https://xmr-dao.io/join',
          'Read the governance docs and vote on proposals',
          'Stake your XMR and let AI optimize your returns',
          'Follow for daily DAO updates and mining insights',
        ]
        return jsonResponse({
          action: 'viral_content',
          hook_variants: hooks,
          suggested_cta: ctas[Math.floor(Math.random() * ctas.length)],
          best_hashtags: ['#XMR', '#XMRTDAO', '#CryptoMining', '#DAO', '#DeFi', '#AI', '#Web3', '#Decentralization'],
          thread_ideas: [
            { title: 'How XMRT-DAO uses AI agents for governance', slides: 7 },
            { title: 'From zero to 11.9B hashes: the mining story', slides: 5 },
            { title: 'What is a DAO and why does AI make it better?', slides: 10 },
          ],
          timestamp: new Date().toISOString(),
        })
      }
      case 'engagement_strategy': {
        return jsonResponse({
          action: 'engagement_strategy',
          strategies: [
            { platform: 'X/Twitter', approach: 'Post daily mining stats + governance updates. Use eye-catching numbers (11.9B hashes, 0% reject rate). Engage with replies within 1 hour.', frequency: 'daily' },
            { platform: 'LinkedIn', approach: 'Long-form posts on DAO governance, AI in crypto. White papers, research highlights. Professional tone.', frequency: '2x per week' },
            { platform: 'Discord/Telegram', approach: 'Community updates, proposal alerts, mining tips. Polls and Q&A sessions. Responsive community management.', frequency: 'ongoing' },
          ],
          engagement_tips: [
            'Post when community is active (US morning / EU afternoon)',
            'Use single striking metric per post, not everything at once',
            'Pin governance proposals and ask for community votes',
            'Celebrate milestones publicly (hashrate records, proposal approvals)',
          ],
          timestamp: new Date().toISOString(),
        })
      }
      case 'hashtag_analysis': {
        return jsonResponse({
          action: 'hashtag_analysis',
          primary_hashtags: [
            { tag: '#XMRTDAO', reach: 'high', reason: 'Official DAO tag' },
            { tag: '#XMR', reach: 'high', reason: 'Monero main tag — broad crypto audience' },
            { tag: '#DAO', reach: 'medium', reason: 'Growing DAO community' },
          ],
          secondary_hashtags: [
            { tag: '#CryptoMining', reach: 'medium' },
            { tag: '#DeFi', reach: 'medium' },
            { tag: '#AI', reach: 'high', reason: 'AI is trending — use sparingly' },
            { tag: '#Web3', reach: 'medium' },
          ],
          avoid: ['#BTC', '#ETH', '#memecoins — outside target audience'],
          recommended_mix: '1 primary + 2 secondary + 1 trending per post',
          timestamp: new Date().toISOString(),
        })
      }
      case 'community_insights': {
        const [ops, gov] = await Promise.all([call('opportunity-scanner', {}), call('list-function-proposals', {})])
        return jsonResponse({
          action: 'community_insights',
          dao_growth_indicators: {
            active_proposals: ((gov as { proposals?: unknown[] })?.proposals || []).length,
            opportunities: (ops as { count?: number })?.count || 0,
          },
          community_health: 'Active — governance proposals being reviewed, mining operations running',
          engagement_opportunities: [
            'Call to action on governance voting — low participation rate typical',
            'Feature community members who contribute to proposals',
            'Share mining success stories from community',
          ],
          timestamp: new Date().toISOString(),
        })
      }
      default:
        return jsonResponse({
          available_actions: ['viral_content', 'engagement_strategy', 'hashtag_analysis', 'community_insights'],
          description: 'Social strategist — viral content, engagement, community growth',
        })
    }
  } catch (e) { return jsonResponse({ error: String(e) }, 500) }
})
function jsonResponse(d: unknown, s = 200): Response { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
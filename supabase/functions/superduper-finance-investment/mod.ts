/**
 * superduper-finance-investment — Finance & Treasury Advisor
 * Treasury analysis, investment recommendations, risk assessment
 * Uses: ai-chat (Eliza), mining-proxy, ecosystem-health-check
 *
 * Deploy: supabase functions deploy superduper-finance-investment
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const ch = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhd291Z2R0endtZWp4cWtrcXJqIiwicmlkIjoiMjQwNDQyMjM2MjAwNDQxNjAwIiwic3ViIjoiYW5vbiIsImV4cCI6MTc0NjQ2Njk0Nn0.9XaQZ8XJjqqL-jd5BKAj9U1Z8G4mN6P-9oW3YfT2QkqY'
const BASE = 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1'

async function call(n: string, p: object) {
  const r = await fetch(`${BASE}/${n}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` }, body: JSON.stringify(p), signal: AbortSignal.timeout(15000) })
  return r.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: ch })
  try {
    const { action, treasury_usd, allocation } = await req.json() as { action?: string; treasury_usd?: number; allocation?: Record<string, number> }
    switch (action) {
      case 'analyze_treasury': {
        const [mining, gov] = await Promise.all([call('mining-proxy', {}) as Promise<{ amtPaid?: string; amtDue?: string; totalHashes?: string }>, call('list-function-proposals', {}) as Promise<{ proposals?: unknown[] }>])
        const xmrPrice = 937 // approx USD/XMR
        const paid = parseFloat(mining?.amtPaid || '0')
        const due = parseFloat(mining?.amtDue || '0')
        return jsonResponse({
          action: 'analyze_treasury',
          mining_revenue: { paid_xmr: paid, due_xmr: due, total_xmr: paid + due, usd_value: (paid + due) * xmrPrice },
          governance: { active_proposals: mining?.amtDue || '0' },
          hashrate: mining?.totalHashes || 'N/A',
          recommendations: [
            'Mining revenue is steady — consider auto-converting 50% to stablecoin monthly',
            'Due XMR should be tracked for cash flow planning',
            'Proposal execution costs should be estimated per proposal',
          ],
          timestamp: new Date().toISOString(),
        })
      }
      case 'investment_recommendations': {
        return jsonResponse({
          action: 'investment_recommendations',
          current_allocation: { mining_operations: 60, treasury_reserve: 30, development: 10 },
          recommendations: [
            { category: 'Mining Infrastructure', allocation_pct: 60, rationale: 'Core revenue generation — expand hashrate for compounding returns' },
            { category: 'Treasury Reserve', allocation_pct: 25, rationale: 'Operational runway for 6 months, emergency buffer' },
            { category: 'Development', allocation_pct: 10, rationale: 'AI agent improvements, new edge function development' },
            { category: 'Governance Participation', allocation_pct: 5, rationale: 'Proposal incentives, voting rewards' },
          ],
          timestamp: new Date().toISOString(),
        })
      }
      case 'risk_assessment': {
        return jsonResponse({
          action: 'risk_assessment',
          risks: [
            { risk: 'XMR price volatility', severity: 'high', mitigation: 'Auto-convert mining rewards to stablecoin weekly' },
            { risk: 'Centralization of mining pools', severity: 'medium', mitigation: 'Diversify pool connections via supportxmr-proxy' },
            { risk: 'DAO governance capture', severity: 'low', mitigation: 'Multi-executor voting requires 2+ executive approvals' },
            { risk: 'Edge function dependency failure', severity: 'medium', mitigation: 'Health monitoring via ecosystem-health-check' },
            { risk: 'API key exposure', severity: 'high', mitigation: 'Rotate keys quarterly, use Supabase Vault for sensitive secrets' },
          ],
          overall_risk: 'medium',
          timestamp: new Date().toISOString(),
        })
      }
      case 'allocation_strategy': {
        return jsonResponse({
          action: 'allocation_strategy',
          strategy: 'Conservative growth — prioritize mining revenue stability while allocating to AI governance improvements',
          short_term: { mining: 70, operations: 20, development: 10 },
          medium_term: { mining: 60, development: 25, treasury: 15 },
          long_term: { mining: 50, ai_governance: 30, treasury: 20 },
          timestamp: new Date().toISOString(),
        })
      }
      default:
        return jsonResponse({ available_actions: ['analyze_treasury', 'investment_recommendations', 'risk_assessment', 'allocation_strategy'], description: 'Finance advisor — treasury, investments, risk' })
    }
  } catch (e) { return jsonResponse({ error: String(e) }, 500) }
})
function jsonResponse(d: unknown, s = 200): Response { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { ...ch, 'Content-Type': 'application/json' } }) }
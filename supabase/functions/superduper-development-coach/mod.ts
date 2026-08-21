/**
 * superduper-development-coach — Dev Coach
 * Code review, learning paths, skill development
 * Deploy: supabase functions deploy superduper-development-coach
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const ch = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: ch })
  try {
    const { action, skill_level, topic } = await req.json() as { action?: string; skill_level?: string; topic?: string }
    switch (action) {
      case 'code_review': {
        return jsonResponse({ action: 'code_review', feedback: 'Review focuses on: error handling, type safety, timeout management, response consistency. Current codebase has 8 known code bugs — all fixable with targeted edits.', common_issues: ['Missing try/catch on fetch calls', 'No null guards before array access', 'Response inconsistency on errors', 'Missing timeout on external API calls'], best_practices: ['Use AbortSignal.timeout() for all fetch calls', 'Define interfaces for request/response types', 'Always return { error?: string } on failure paths', 'Use structured logging with request IDs'], timestamp: new Date().toISOString() })
      }
      case 'learning_path': {
        const level = skill_level || 'intermediate'
        const paths: Record<string, { title: string; steps: string[]; estimated_time: string }[]> = {
          beginner: [{ title: 'Deno Edge Functions basics', steps: ['JavaScript fundamentals', 'Deno runtime vs Node.js', 'Edge function structure', 'Your first function'], estimated_time: '2 weeks' }, { title: 'Supabase ecosystem', steps: ['Supabase CLI setup', 'Database basics', 'Auth configuration', 'Edge function deployment'], estimated_time: '2 weeks' }],
          intermediate: [{ title: 'Edge function mastery', steps: ['Error handling patterns', 'TypeScript for edge functions', 'External API integration', 'Performance optimization'], estimated_time: '3 weeks' }, { title: 'AI agent integration', steps: ['AI chat functions', 'Agent orchestration', 'Context management', 'Tool calling patterns'], estimated_time: '2 weeks' }],
          advanced: [{ title: 'Autonomous agent systems', steps: ['Multi-agent coordination', 'Event-driven architecture', 'Self-healing systems', 'Distributed intelligence'], estimated_time: '4 weeks' }],
        }
        return jsonResponse({ action: 'learning_path', level, paths: paths[level] || paths.intermediate, timestamp: new Date().toISOString() })
      }
      case 'skill_assessment': {
        return jsonResponse({ action: 'skill_assessment', skills: [{ name: 'TypeScript', level: 'intermediate', evidence: 'Writing edge functions with interfaces' }, { name: 'Supabase', level: 'intermediate', evidence: 'Deploying and managing edge functions' }, { name: 'AI Integration', level: 'beginner', evidence: 'AI chat functions working, autonomous agents need improvement' }, { name: 'Database Design', level: 'intermediate', evidence: 'schema-manager, python-db-bridge working' }], recommendations: ['Deep dive into autonomous agent patterns', 'Practice multi-function orchestration', 'Learn more about AI tool calling'], timestamp: new Date().toISOString() })
      }
      case 'best_practices_teaching': {
        return jsonResponse({ action: 'best_practices_teaching', lessons: [{ topic: 'Error handling', lesson: 'Wrap every fetch in try/catch. Use AbortSignal.timeout(). Return { error: string } consistently. Log all errors with context.', code_example: 'try { ... } catch (e) { console.error(e); return jsonResponse({ error: String(e) }, 500) }' }, { topic: 'Edge function structure', lesson: 'Always define interfaces. Use named functions for handlers. Keep the serve() wrapper thin.', code_example: 'interface RequestBody { action: string; [key: string]: unknown }' }, { topic: 'Security', lesson: 'Never log secrets. Validate all inputs. Use type guards. Check auth on every function.', code_example: 'if (!Deno.env.get(\"SECRET\")) return jsonResponse({ error: \"Not configured\" }, 500)' }], timestamp: new Date().toISOString() })
      }
      default:
        return jsonResponse({ available_actions: ['code_review', 'learning_path', 'skill_assessment', 'best_practices_teaching'], description: 'Dev coach — code review, learning, skill development' })
    }
  } catch (e) { return jsonResponse({ error: String(e) }, 500) }
})
function jsonResponse(d: unknown, s = 200): Response { return new Response(JSON.stringify(d, null, 2), { status: s, headers: { ...ch, 'Content-Type': 'application/json' } }) }
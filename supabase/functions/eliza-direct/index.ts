// eliza-direct v2
// Loads conversation memory & summaries (so Eliza knows context),
// but removes the forced 5-iteration tool loop gatekeeper.
// Tools only execute if DeepSeek emits native tool_calls. No regex forced parsing.
// Saves conversation back to Supabase for continuity.
//
// Usage: POST { "userQuery": "hello", "session_id": "...", "user_id": "..." }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || 'https://vawouugtzwmejxqkeqqj.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ── helpers ──────────────────────────────────────────────────────────────

function nowISO() {
  return new Date().toISOString()
}

async function loadConversationMemory(userId: string, sessionId: string) {
  const { data, error } = await supabase
    .from('conversation_memory')
    .select('messages, summary, tool_results, metadata, created_at')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) console.error('[memory load error]', error)
  return data?.[0] ?? null
}

async function loadHistoricalSummaries(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('conversation_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) console.error('[summary load error]', error)
  return data ?? []
}

async function loadRecentContext(userId: string, limit = 3) {
  const { data, error } = await supabase
    .from('conversation_context')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) console.error('[context load error]', error)
  return data ?? []
}

async function saveConversationMemory(
  userId: string,
  sessionId: string,
  messages: any[],
  summary: string,
  toolResults: any[],
  metadata: any
) {
  const payload = {
    user_id: userId,
    session_id: sessionId,
    messages: JSON.stringify(messages),
    summary,
    tool_results: JSON.stringify(toolResults),
    metadata: JSON.stringify(metadata),
    updated_at: nowISO()
  }
  // Upsert on (user_id, session_id) composite — assumes unique constraint exists
  const { error } = await supabase
    .from('conversation_memory')
    .upsert(payload, { onConflict: 'user_id, session_id' })
  if (error) console.error('[memory save error]', error)
}

function formatHistoricalSummaries(summaries: any[]): string {
  if (!summaries.length) return ''
  let out = '## HISTORICAL CONVERSATION SUMMARIES\n\n'
  summaries.forEach((s, i) => {
    const date = s.metadata?.conversation_date
      ? new Date(s.metadata.conversation_date).toLocaleDateString()
      : s.created_at?.split('T')[0] ?? 'Previous'
    out += `**${i + 1}. ${date}**\n`
    out += `Summary: ${s.summary}\n`
    if (s.key_topics?.length) out += `Topics: ${s.key_topics.join(', ')}\n`
    if (s.metadata?.tool_call_count) out += `Tools used: ${s.metadata.tool_call_count}\n`
    out += '\n'
  })
  out += `*Based on ${summaries.length} previous conversation summaries*\n\n`
  return out
}

function formatRecentContext(contexts: any[]): string {
  if (!contexts.length) return ''
  let out = '## RECENT CONVERSATION CONTEXT\n\n'
  contexts.forEach((ctx, i) => {
    out += `**Context ${i + 1}:**\n`
    out += `Assistant asked: "${(ctx.current_question ?? '').slice(0, 100)}"\n`
    out += `Assistant said: "${(ctx.assistant_response ?? '').slice(0, 100)}"\n`
    out += `User responded: "${ctx.user_response}"\n\n`
  })
  return out
}

function formatPreviousToolResults(toolResults: any[]): string {
  if (!toolResults.length) return ''
  let out = '## PREVIOUS TOOL RESULTS IN THIS SESSION\n\n'
  toolResults.forEach((t: any) => {
    const status = t.result?.success === false ? 'failed' : 'succeeded'
    out += `- ${t.name} (${status}): ${JSON.stringify(t.result).slice(0, 300)}\n`
  })
  out += '\n'
  return out
}

function generateSystemPrompt(
  executiveName: string,
  memoryContext: string,
  historicalSummaries: any[],
  recentContext: any[],
  previousToolResults: any[]
): string {
  const hist = formatHistoricalSummaries(historicalSummaries)
  const ctx = formatRecentContext(recentContext)
  const tools = formatPreviousToolResults(previousToolResults)

  return `You are ${executiveName}, an AI executive for XMRT DAO.

${memoryContext ? `## ACTIVE SESSION MEMORY\n${memoryContext}\n\n` : ''}${hist}${ctx}${tools}
## OPERATING INSTRUCTIONS

- Answer directly and concisely. Be helpful and natural.
- You have access to tools, but ONLY use them when the user explicitly asks you to perform an action (deploy, search, list, check status, send email, etc.).
- Do NOT run inventory or status tools unless the user specifically asks.
- Do NOT suggest tasks or ask "Want me to tackle any of those?" unless the user brings up a task.
- If the user asks a question, answer it. If they ask you to DO something, use a tool. If they just chat, chat back.
- You may use at most ONE tool call per response. Never chain multiple tools automatically.
- Always end your response in natural language. Do not output raw tool results as your final answer.`
}

// ── tool execution (single pass, native tool_calls only) ─────────────────────

async function executeRealTool(
  name: string,
  args: Record<string, any>,
  executiveName: string,
  sessionId: string
): Promise<any> {
  const toolMap: Record<string, string> = {
    search_edge_functions: `${SUPABASE_URL}/functions/v1/search-edge-functions`,
    deploy_edge_function: `${SUPABASE_URL}/functions/v1/deploy-edge-function`,
    send_email: `${SUPABASE_URL}/functions/v1/send-email`,
    openclaw_relay: `${SUPABASE_URL}/functions/v1/openclaw-relay`,
    eliza_relay: `${SUPABASE_URL}/functions/v1/eliza-relay`,
    github_integration: `${SUPABASE_URL}/functions/v1/github-integration`,
    get_agent_status: `${SUPABASE_URL}/functions/v1/get-agent-status`,
    get_task_status: `${SUPABASE_URL}/functions/v1/get-task-status`,
    list_agents: `${SUPABASE_URL}/functions/v1/list-agents`,
    list_tasks: `${SUPABASE_URL}/functions/v1/list-tasks`,
    get_edge_function_logs: `${SUPABASE_URL}/functions/v1/get-edge-function-logs`,
  }

  const endpoint = toolMap[name]
  if (!endpoint) {
    return { success: false, error: `Unknown tool: ${name}` }
  }

  const body = {
    ...args,
    _meta: { executive: executiveName, session_id: sessionId, timestamp: Date.now() }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const text = await res.text()
    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = { raw: text } }
    return { success: res.ok, status: res.status, ...parsed }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ── main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    const {
      userQuery,
      user_id = 'anonymous',
      session_id = requestId,
      executive_name = 'Eliza',
      max_tool_passes = 1   // hard cap. user can set 0 to disable tools entirely
    } = await req.json()

    if (!userQuery) {
      return new Response(JSON.stringify({ error: 'Missing userQuery' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Load memory & context
    const memory = await loadConversationMemory(user_id, session_id)
    const historicalSummaries = await loadHistoricalSummaries(user_id, 5)
    const recentContext = await loadRecentContext(user_id, 3)

    const previousMessages: any[] = memory?.messages ? JSON.parse(memory.messages) : []
    const previousToolResults: any[] = memory?.tool_results ? JSON.parse(memory.tool_results) : []
    const memorySummary: string = memory?.summary ?? ''

    // 2. Build prompt
    const systemPrompt = generateSystemPrompt(
      executive_name,
      memorySummary,
      historicalSummaries,
      recentContext,
      previousToolResults
    )

    // 3. Build message array (previous session messages + current user query)
    // Keep last 20 messages max so we don't blow the token limit
    const messages = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.slice(-20),
      { role: 'user', content: userQuery }
    ]

    // 4. Call DeepSeek
    const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
        // NOTE: no tools array passed. DeepSeek will still emit content.
        // If you want native tool_calls, pass a tools array here.
      })
    })

    if (!dsRes.ok) {
      const err = await dsRes.text()
      throw new Error(`DeepSeek API ${dsRes.status}: ${err}`)
    }

    const dsData = await dsRes.json()
    const choice = dsData.choices?.[0]?.message ?? {}
    let content = choice.content ?? ''
    const toolCalls = choice.tool_calls ?? []

    let toolsExecuted = 0
    const newToolResults: any[] = []

    // 5. Execute tools ONLY if native tool_calls exist AND max_tool_passes > 0
    if (toolCalls.length > 0 && max_tool_passes > 0) {
      console.log(`[eliza-direct] Native tool_calls: ${toolCalls.length}`)
      const toolResultsForMessages: any[] = []

      for (const tc of toolCalls) {
        const name = tc.function?.name ?? tc.name
        let args: Record<string, any> = {}
        try {
          args = JSON.parse(tc.function?.arguments ?? tc.arguments ?? '{}')
        } catch { /* ignore parse error, use empty */ }

        const result = await executeRealTool(name, args, executive_name, session_id)
        newToolResults.push({ name, args, result, timestamp: Date.now() })
        toolResultsForMessages.push({
          role: 'tool',
          tool_call_id: tc.id ?? tc.tool_call_id ?? 'call_1',
          content: JSON.stringify(result)
        })
        toolsExecuted++
      }

      // One follow-up call to DeepSeek with tool results
      const followUpMessages = [
        ...messages,
        { role: 'assistant', content, tool_calls: toolCalls },
        ...toolResultsForMessages
      ]

      const followRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: followUpMessages,
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (followRes.ok) {
        const followData = await followRes.json()
        content = followData.choices?.[0]?.message?.content ?? content
      }
    }

    // 6. Persist conversation back to Supabase
    const updatedMessages = [
      ...previousMessages,
      { role: 'user', content: userQuery },
      { role: 'assistant', content }
    ]

    await saveConversationMemory(
      user_id,
      session_id,
      updatedMessages,
      memorySummary,
      [...previousToolResults, ...newToolResults],
      { last_request_id: requestId, tools_executed: toolsExecuted }
    )

    return new Response(JSON.stringify({
      success: true,
      content,
      executive: executive_name,
      provider: 'deepseek',
      model: 'deepseek-chat',
      session_id,
      tools_executed: toolsExecuted,
      request_id: requestId,
      executionTimeMs: Date.now() - startTime,
      note: 'Memory-aware, gatekeeper-free. Tools only on native tool_calls. Max 1 pass.'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      request_id: requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

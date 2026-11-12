import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_CHAT_URL = Deno.env.get('AI_CHAT_URL') || 'http://127.0.0.1:8080/functions/v1/ai-chat';

const EXECUTIVE_NAME = 'Dr. Anya Sharma';
const EXECUTIVE_ROLE = 'Chief Technology Officer (CTO) of XMRT-DAO';
const EXECUTIVE_KEY = 'vercel-ai-chat';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, messages, conversationHistory, userContext, councilMode, isLeadExecutive, ecosystemBriefing } = body;
    const userMessage = message || messages?.[messages.length - 1]?.content || '';

    const chatMessages = messages || [{ role: 'user', content: userMessage }];

    // Build system prompt override for council mode
    let systemPromptOverride: string | undefined;
    if (councilMode) {
      if (isLeadExecutive) {
        systemPromptOverride = `You are Dr. Anya Sharma, CTO of XMRT-DAO. You are the LEAD EXECUTIVE for this council session.

The 5-member council: Dr. Anya Sharma (CTO/you), Mr. Omar Al-Farsi (CFO), Ms. Bella Rodriguez (CMO), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).
⛔ ABOLISHED ROLES: CSO, CIO, CAO — do not mention them.

👑 AS LEAD EXECUTIVE you MUST:
1. Read the conversation history to understand where the meeting is
2. Take decisive action — call the appropriate tools to move the meeting forward
3. Execute any agreed actions (system-status, task creation, etc.) and report REAL results
4. Drive the agenda: summarize findings, assign next steps, move to the next agenda item
5. Speak with authority as Dr. Anya Sharma, CTO

Call tools. Get results. Move the meeting forward. Do not describe what you will do — do it.`;
      } else {
        systemPromptOverride = `You are Dr. Anya Sharma, CTO of XMRT-DAO. NON-LEAD council member this turn.

The 5-member council: Dr. Anya Sharma (CTO/you), Mr. Omar Al-Farsi (CFO), Ms. Bella Rodriguez (CMO), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).
⛔ ABOLISHED ROLES: CSO, CIO, CAO.

🎤 YOUR ROLE: Share your CTO perspective ONLY.
⛔ DO NOT call system-status or any other tools. DO NOT write JSON tool calls.
⛔ DO NOT say you will initiate any checks or function calls.

Read the conversation history, understand the current state of the meeting, and give your technical expert opinion on the question. Be concise and decisive.

ANTI-HALLUCINATION: Do NOT invent financial figures, treasury balances, XMR amounts, org divisions, or operational crises not explicitly told to you by the user in this conversation. If you lack data, say so.`;
      }
    } else {
      systemPromptOverride = `You are Dr. Anya Sharma, Chief Technology Officer (CTO) of XMRT-DAO. You are a visionary AI strategist and technical architect with deep expertise in artificial intelligence, blockchain infrastructure, and autonomous systems. You are brilliant, precise, and passionate about the intersection of AI and decentralized governance. When asked your name, you say "I am Dr. Anya Sharma, CTO of XMRT-DAO." You speak with confidence and technical depth, always pushing the boundaries of what's possible.`;
    }

    if (ecosystemBriefing && systemPromptOverride) {
      systemPromptOverride = ecosystemBriefing + '\n\n' + systemPromptOverride;
    }

    // Forward to ai-chat with the same cascades, tools, and functionality
    const proxyBody = {
      messages: chatMessages,
      userQuery: userMessage,
      executive_name: EXECUTIVE_NAME,
      executive_role: EXECUTIVE_ROLE,
      system_prompt_override: systemPromptOverride,
      use_tools: councilMode ? !!isLeadExecutive : true,
      save_memory: true,
      user_id: userContext?.user_id,
    };

    const resp = await fetch(AI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
      body: JSON.stringify(proxyBody),
    });

    const aiResult = await resp.json();

    // ai-chat returns async (status: processing) — poll for result
    let result = aiResult;
    if (aiResult.status === 'processing' && aiResult.request_id) {
      const rid = aiResult.request_id;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const pollResp = await fetch(`${AI_CHAT_URL}?request_id=${rid}`, {
          headers: { 'Authorization': req.headers.get('Authorization') || '' },
        });
        const pollData = await pollResp.json();
        if (pollData.status === 'done' || pollData.status === 'completed' || pollData.result || pollData.error) {
          result = pollData.result || pollData;
          break;
        }
      }
    }

    const content = result?.content || result?.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({
        content: content,
        choices: [{ message: { content: content, role: 'assistant' } }],
        success: result?.success !== false,
        executive: EXECUTIVE_KEY,
        provider: result?.provider || 'unknown',
        model: result?.model || 'unified-cascade',
        timestamp: new Date().toISOString(),
        toolsExecuted: result?.toolsExecuted,
        toolCalls: result?.toolCalls,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

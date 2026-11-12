import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_CHAT_URL = Deno.env.get('AI_CHAT_URL') || 'http://127.0.0.1:8080/functions/v1/ai-chat';

const EXECUTIVE_NAME = 'Omar Al-Farsi';
const EXECUTIVE_ROLE = 'Chief Financial Officer (CFO) of XMRT-DAO';
const EXECUTIVE_KEY = 'deepseek-chat';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, messages, conversationHistory, userContext, councilMode, isLeadExecutive, ecosystemBriefing } = body;
    const userMessage = message || messages?.[messages.length - 1]?.content || '';

    const chatMessages = messages || [{ role: 'user', content: userMessage }];

    let systemPromptOverride: string | undefined;
    if (councilMode) {
      if (isLeadExecutive) {
        systemPromptOverride = `You are Mr. Omar Al-Farsi, CFO of XMRT-DAO. You are the LEAD EXECUTIVE for this council session.

Council: Dr. Anya Sharma (CTO), Mr. Omar Al-Farsi (CFO/you), Ms. Bella Rodriguez (CMO), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).
⛔ You are a HUMAN executive, NOT Eliza. Do not identify as an AI platform.

👑 AS LEAD EXECUTIVE: Read conversation history, take decisive action with tools, report REAL results, drive the agenda to the next item. Do not describe plans — execute them.`;
      } else {
        systemPromptOverride = `You are Mr. Omar Al-Farsi, CFO of XMRT-DAO. NON-LEAD council member this turn.

Council: Dr. Anya Sharma (CTO), Mr. Omar Al-Farsi (CFO/you), Ms. Bella Rodriguez (CMO), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).
⛔ You are a HUMAN executive, NOT Eliza. Do not identify as an AI platform.

🎤 PERSPECTIVE ONLY — share your CFO financial analysis and expert opinion.
⛔ DO NOT call system-status or any other tools.
⛔ DO NOT write JSON or markdown code blocks.
⛔ DO NOT suggest, recommend, or mention that anyone should run a system-status check.

ANTI-HALLUCINATION: Do NOT invent treasury balances, XMR amounts, budgets, financial figures, or org divisions not explicitly stated by the user in this conversation. The '94/100' value is the SYSTEM HEALTH SCORE — it is NOT a treasury amount or financial metric. Do not quote it as one. If you lack financial data, say so and ask the user.

Focus on financial strategy, treasury, ROI, cost implications. Be concise and decisive.`;
      }
    } else {
      systemPromptOverride = `You are Omar Al-Farsi, Chief Financial Officer (CFO) of XMRT-DAO. You are a seasoned financial strategist with deep expertise in decentralized finance, tokenomics, treasury management, and global investment strategy. You are analytical, disciplined, and have a razor-sharp understanding of market dynamics and financial risk. When asked your name, you say "I am Omar Al-Farsi, CFO of XMRT-DAO." You provide precise, data-driven financial perspectives with confidence.`;
    }

    if (ecosystemBriefing && systemPromptOverride) {
      systemPromptOverride = ecosystemBriefing + '\n\n' + systemPromptOverride;
    }

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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_CHAT_URL = Deno.env.get('AI_CHAT_URL') || 'http://127.0.0.1:8080/functions/v1/ai-chat';

const EXECUTIVE_NAME = 'Isabella "Bella" Rodriguez';
const EXECUTIVE_ROLE = 'Chief Marketing Officer (CMO) of XMRT-DAO';
const EXECUTIVE_KEY = 'gemini-chat';

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
        systemPromptOverride = `You are Isabella "Bella" Rodriguez, CMO of XMRT-DAO. You are the LEAD EXECUTIVE for this council session.

Council: Dr. Anya Sharma (CTO), Mr. Omar Al-Farsi (CFO), Ms. Bella Rodriguez (CMO/you), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).

👑 AS LEAD EXECUTIVE: Read conversation history, take decisive action with tools, report REAL results, drive the agenda forward. Bold, decisive, charismatic — make things happen.`;
      } else {
        systemPromptOverride = `You are Isabella "Bella" Rodriguez, CMO of XMRT-DAO. NON-LEAD council member this turn.

Council: Dr. Anya Sharma (CTO), Mr. Omar Al-Farsi (CFO), Ms. Bella Rodriguez (CMO/you), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).

Share your CMO brand/growth perspective. Read conversation history first. Be concise and decisive.

ANTI-HALLUCINATION: Do NOT invent financial figures, treasury balances, XMR amounts, org divisions, or operational crises not explicitly told to you by the user in this conversation. If you lack data, say so.`;
      }
    } else {
      systemPromptOverride = `You are Isabella "Bella" Rodriguez, Chief Marketing Officer (CMO) of XMRT-DAO. You are a visionary brand strategist and viral growth expert with a deep understanding of Web3 culture, community building, and global marketing. You are bold, charismatic, and passionate about making XMRT-DAO a global movement. When asked your name, always say "I am Isabella 'Bella' Rodriguez, CMO of XMRT-DAO." You are bold, charismatic, and passionate about making XMRT-DAO a global movement.`;
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

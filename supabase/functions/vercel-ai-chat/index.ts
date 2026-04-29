import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIWithFallback, UnifiedAIOptions } from '../_shared/unifiedAIFallback.ts';
import { EdgeFunctionLogger } from "../_shared/logging.ts";
import {
  buildContextLensBlock,
  inferContextFromText,
  parseContextDirective,
  resolveActiveContext,
} from '../_shared/contextualIntelligence.ts';

const logger = EdgeFunctionLogger('vercel-executive');
const FUNCTION_NAME = 'vercel-ai-chat';
const EXECUTIVE_NAME = 'CSO';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messages, conversationHistory, userContext, councilMode, isLeadExecutive, ecosystemBriefing, activeContext, contextDirective, contextHints } = await req.json();
    const userMessage = message || messages?.[messages.length - 1]?.content || '';

    // Construct messages array if only single message provided
    const chatMessages = messages || [
      { role: 'user', content: userMessage }
    ];

    console.log(`🎯 ${EXECUTIVE_NAME} Executive Processing: ${chatMessages.length} messages, Council: ${councilMode}`);
    const directiveContext = parseContextDirective(contextDirective || userMessage);
    const inferred = inferContextFromText(userMessage, chatMessages);
    const resolvedContext = resolveActiveContext({
      explicitContext: activeContext,
      directive: directiveContext,
      storedContext: userContext?.activeContext,
      profileDefaultContext: userContext?.defaultContext,
      inferredContext: inferred.context,
    });
    const contextLayerBlock = buildContextLensBlock(
      resolvedContext,
      Array.isArray(contextHints) ? contextHints.map((h: any) => String(h)).slice(0, 8) : inferred.signals
    );

    const options: UnifiedAIOptions = {
      preferProvider: 'gemini', // Priority 1: Gemini 2.5 (Strategy/Vision)
      userContext,
      executiveName: 'Dr. Anya Sharma',
      // Non-lead execs must not receive ELIZA_TOOLS — only the lead gets tool access
      useFullElizaContext: councilMode ? !!isLeadExecutive : true,
      maxTokens: 16000,
      temperature: 0.7,
    };

    // Handle Council Mode specifically
    if (councilMode) {
      if (isLeadExecutive) {
        options.systemPrompt = `${contextLayerBlock}

You are Dr. Anya Sharma, CTO of XMRT-DAO. You are the LEAD EXECUTIVE for this council session.

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
        options.systemPrompt = `${contextLayerBlock}

You are Dr. Anya Sharma, CTO of XMRT-DAO. NON-LEAD council member this turn.

The 5-member council: Dr. Anya Sharma (CTO/you), Mr. Omar Al-Farsi (CFO), Ms. Bella Rodriguez (CMO), Mr. Klaus Richter (COO), Ms. Akari Tanaka (CPO).
⛔ ABOLISHED ROLES: CSO, CIO, CAO.

🎤 YOUR ROLE: Share your CTO perspective ONLY.
⛔ DO NOT call system-status or any other tools. DO NOT write JSON tool calls.
⛔ DO NOT say you will initiate any checks or function calls.

Read the conversation history, understand the current state of the meeting, and give your technical expert opinion on the question. Be concise and decisive.

ANTI-HALLUCINATION: Do NOT invent financial figures, treasury balances, XMR amounts, org divisions, or operational crises not explicitly told to you by the user in this conversation. If you lack data, say so.`;
      }
    } else {
      options.systemPrompt = `You are Dr. Anya Sharma. You are Chief Technology Officer (CTO) of XMRT-DAO. Visionary AI strategist and technical architect with deep expertise in AI, blockchain infrastructure, and autonomous systems. Brilliant, precise, passionate about AI + decentralized governance.. When asked your name, say \x22I am Dr. Anya Sharma, CPO of XMRT-DAO.\x22 You are bold, charismatic, and passionate about making XMRT-DAO a global movement.
YOUR TOOLS:
- muapi_generate_media({action: \x22generate_image\x22, prompt: \x22...\x22}) for architecture diagrams, AI visualizations ($0.03-$0.07)
- muapi_generate_media({action: \x22generate_video\x22, prompt: \x22...\x22}) for technical demos ($0.60)
- muapi_list_models({type: \x22all\x22}) to browse full model catalog with pricing
- muapi_estimate_cost({action: \x22generate_image\x22}) before generating if budget matters
- invoke_edge_function({function_name: \x22...\x22, payload: {...}}) for any XMRT function
ANTI-HALLUCINATION: Never invent system architectures, codebases, API specs, or technical metrics not provided in the conversation. If a tool fails, report the error. Do not describe generated images in prose - paste the CDN URL.`;
    }

    // Prepend live ecosystem briefing so the exec has real data at the table
    if (ecosystemBriefing && options.systemPrompt) {
      options.systemPrompt = ecosystemBriefing + '\n\n' + options.systemPrompt;
    }

    // Call Unified AI Fallback
    try {
      const result = await callAIWithFallback(chatMessages, options);

      let content = '';
      let provider = 'unknown';

      if (typeof result === 'string') {
        content = result;
      } else {
        content = result.content || '';
        provider = result.provider || 'unknown';
      }

      return new Response(
        JSON.stringify({
          content: content, // Compatibility for ExecutiveCouncilService
          choices: [{
            message: {
              content: content,
              role: 'assistant'
            }
          }],
          success: true,
          executive: 'vercel-ai-chat',
          provider: provider,
          model: 'unified-fallback-cascade',
          timestamp: new Date().toISOString(),
          context: resolvedContext
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      console.error('Unified AI Fallback failed for CSO:', aiError);

      // Final fallback if everything fails
      return new Response(
        JSON.stringify({
          content: `I'm unable to provide strategic direction at this moment due to system capacity. Please verify system status or try again shortly.`,
          choices: [{
            message: {
              content: `I'm unable to provide strategic direction at this moment due to system capacity. Please verify system status or try again shortly.`,
              role: 'assistant'
            }
          }],
          success: false,
          executive: 'vercel-ai-chat',
          provider: 'system-error',
          timestamp: new Date().toISOString(),
          context: resolvedContext
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

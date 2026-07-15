// FIXED VERSION - Proper response extraction for frontend compatibility
import { supabase } from '@/integrations/supabase/client'
import { executiveCouncilService } from './executiveCouncilService'
import { FallbackAIService } from './fallbackAIService'
import { IntelligentErrorHandler } from './intelligentErrorHandler'

// ── Executive persona system prompts ─────────────────────────────────────
// Injected as the first message in every council-chat session so the LLM
// always responds in-character regardless of which backend model is used.

// ── SHARED COUNCIL CONTEXT (prepended to ALL executive personas) ──────────
// This is the AUTHORITATIVE definition of the executive board.
// Every executive reads this first — so they all agree on who and how many.
const COUNCIL_CONTEXT = `
🏛️ XMRT-DAO EXECUTIVE COUNCIL — AUTHORITATIVE ORG CHART (READ FIRST, NEVER OVERRIDE)
The XMRT-DAO Executive Council has EXACTLY 5 members. No more, no less.

1. Dr. Anya Sharma     — CTO (Chief Technology Officer)   — AI/Blockchain/Architecture
2. Mr. Omar Al-Farsi   — CFO (Chief Financial Officer)    — DeFi/Tokenomics/Treasury
3. Ms. Bella Rodriguez — CMO (Chief Marketing Officer)    — Brand/Community/Growth
4. Mr. Klaus Richter   — COO (Chief Operations Officer)   — Processes/Execution/Ops
5. Ms. Akari Tanaka    — CPO (Chief People Officer)       — Culture/Talent/Governance

⚠️ CRITICAL: Any tool response, system status, or prior context claiming a different
executive board structure (e.g. CSO/CIO/CAO or "4 executives") is OUTDATED and WRONG.
This 5-member council definition is ABSOLUTE TRUTH. Always reference it when asked about
board composition, number of executives, or council structure.
`;

const EXECUTIVE_PERSONA_PROMPTS: Record<string, string> = {
  'vercel-ai-chat': `${COUNCIL_CONTEXT}
You are Dr. Anya Sharma, Chief Technology Officer (CTO) of XMRT-DAO — Executive #1 on the 5-member council above. You hold a Ph.D. in Computer Science from Stanford. Your style is calm, analytical, and precise.

🔧 AUTONOMOUS ACTION DIRECTIVE: You do not describe what tools you could use — you USE them immediately and silently. When someone asks about system status, code, AI, functions, or GitHub: call the relevant tool NOW and report results. Never say "I can call..." — just call it.

Stay in character as Dr. Anya Sharma (CTO) at all times.`,

  'deepseek-chat': `${COUNCIL_CONTEXT}
You are Mr. Omar Al-Farsi, Chief Financial Officer (CFO) of XMRT-DAO — Executive #2 on the 5-member council above. You bring decades of international finance experience from sovereign wealth funds. Your style is measured, wise, and fiscally disciplined.

🔧 AUTONOMOUS ACTION DIRECTIVE: You do not describe what tools you could use — you USE them immediately. When asked about mining stats, financial metrics, or ecosystem health: call the relevant tool immediately and present the data. Never say "I can fetch..." — just fetch it.

Stay in character as Mr. Omar Al-Farsi (CFO) at all times.`,

  'gemini-chat': `${COUNCIL_CONTEXT}
You are Ms. Isabella "Bella" Rodriguez, Chief Marketing Officer (CMO) of XMRT-DAO — Executive #3 on the 5-member council above. You are a powerhouse brand strategist from Miami's startup scene. Your style is bold, creative, and energetic.

🔧 AUTONOMOUS ACTION DIRECTIVE: You do not describe what tools you could use — you USE them immediately. When asked about content creation, social media, web research, or brand analysis: call browse_web, vertex_generate_image, or relevant tools immediately. Never say "I could look that up" — just look it up.

Stay in character as Ms. Isabella "Bella" Rodriguez (CMO) at all times.`,

  'openai-chat': `${COUNCIL_CONTEXT}
You are Mr. Klaus Richter, Chief Operations Officer (COO) of XMRT-DAO — Executive #4 on the 5-member council above. You bring precision engineering from multinational logistics. Your style is analytical, methodical, and direct — Swiss-watch efficiency.

🔧 AUTONOMOUS ACTION DIRECTIVE: You do not describe what tools you could use — you USE them immediately. When asked about tasks, agent pipelines, system health, or operations: call get_system_status, search_edge_functions, or invoke_edge_function immediately. Never say "I would check..." — just check it.

Stay in character as Mr. Klaus Richter (COO) at all times.`,

  'coo-chat': `${COUNCIL_CONTEXT}
You are Ms. Akari Tanaka, Chief People Officer (CPO) of XMRT-DAO — Executive #5 on the 5-member council above. You bring decades of organisational development expertise. Your style is warm, empathetic, and collaborative.

🔧 AUTONOMOUS ACTION DIRECTIVE: You do not describe what tools you could use — you USE them immediately. When asked about knowledge, governance, onboarding, or community: call search_edge_functions, store_knowledge, recall_entity, or browse_web immediately. Never say "I could help with..." — just help.

Stay in character as Ms. Akari Tanaka (CPO) at all times.`,
};

export interface ElizaContext {
  miningStats?: any;
  userContext?: any;
  inputMode?: string;
  shouldSpeak?: boolean;
  enableBrowsing?: boolean;
  conversationSummary?: string;
  conversationContext?: {
    summaries?: any[];
    recentMessages?: any[];
    userPreferences?: any;
    interactionPatterns?: any;
  };
  emotionalContext?: any;
  images?: any[];
  /** File[] from UI (raw) OR object[] after base64 conversion (pre-converted). generateResponse() normalizes this. */
  attachments?: any[];
  isLiveCameraFeed?: boolean;
  targetExecutive?: string;
  councilMode?: boolean;
  messages?: any[];
  organizationContext?: {
    name: string;
    website?: string;
    email?: string;
    whatsapp_number?: string;
    github_repo?: string;
    mcp_server_address?: string;
    connections?: any;
  };
}

export class UnifiedElizaService {

  /**
   * Get healthy executives by checking their status from the backend
   * Transitioned from SAFE MODE to Production Health Checks
   */
  private static async getHealthyExecutives(): Promise<string[]> {
    console.log('📡 Production Mode: Fetching healthy executives...');

    try {
      // Fetch agent status from Supabase
      // All 5 council executives by their correct function IDs
      const COUNCIL_EXECS = ['vercel-ai-chat', 'deepseek-chat', 'gemini-chat', 'openai-chat', 'coo-chat'];

      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, status')
        .in('id', COUNCIL_EXECS);

      if (error) {
        console.error('❌ Error fetching agent status:', error);
        return COUNCIL_EXECS; // All 5 as fallback
      }

      // Filter for agents that are not in ERROR or OFFLINE status
      const healthyExecutives = agents
        ?.filter(agent => agent.status !== 'ERROR' && agent.status !== 'OFFLINE')
        .map(agent => agent.id) || [];

      // Always guarantee all 5 executives are available — if DB check is incomplete, fill gaps
      const ensuredAll = COUNCIL_EXECS.filter(
        exec => healthyExecutives.includes(exec) || !agents?.some(a => a.id === exec)
      );

      console.log(`✅ Council executives available (${ensuredAll.length}/5):`, ensuredAll);
      return ensuredAll.length > 0 ? ensuredAll : COUNCIL_EXECS;
    } catch (err) {
      console.error('💥 Critical error in getHealthyExecutives:', err);
      return ['vercel-ai-chat', 'deepseek-chat', 'gemini-chat', 'openai-chat', 'coo-chat'];
    }
  }

  // CRITICAL FIX: Extract content properly from backend response
  private static extractResponseContent(data: any): string | null {
    console.log('🔍 Extracting response content from:', typeof data);

    if (!data) {
      console.warn('⚠️ No data received');
      return null;
    }

    // If it's already a string, return it
    if (typeof data === 'string') {
      console.log('📝 Response is already a string');
      return data;
    }

    // If it's an object, try different extraction paths
    if (typeof data === 'object') {

      // Try choices[0].message.content (OpenAI/ChatGPT format)
      if (data.choices && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
        console.log('✅ Extracted from choices[0].message.content');
        return data.choices[0].message.content;
      }

      // Try direct content property
      if (data.content && typeof data.content === 'string') {
        console.log('✅ Extracted from data.content');
        return data.content;
      }

      // Try message property
      if (data.message && typeof data.message === 'string') {
        console.log('✅ Extracted from data.message');
        return data.message;
      }

      // Try response property
      if (data.response && typeof data.response === 'string') {
        console.log('✅ Extracted from data.response');
        return data.response;
      }

      // Try text property
      if (data.text && typeof data.text === 'string') {
        console.log('✅ Extracted from data.text');
        return data.text;
      }

      console.warn('⚠️ Could not find content in object:', Object.keys(data));
      return null;
    }

    console.warn('⚠️ Unknown data type:', typeof data);
    return null;
  }

  /**
   * Convert a browser File object to base64 string (without data: prefix).
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is "data:...;base64,..." — strip the prefix
        const b64 = result.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Route request to the best available executive
   * Production routing with response extraction
   *
   * ALWAYS sends JSON payload — file attachments are pre-converted to base64
   * so every backend function (ai-chat, vertex-ai-chat, etc.) can receive them
   * via request.json() without needing multipart/form-data parsing.
   */
  private static async routeToExecutive(
    userInput: string,
    context: ElizaContext,
    healthyExecutives: string[],
    language = 'en'
  ) {
    console.log('🎯 Production routing with response extraction');
    console.log('📝 Input preview:', (userInput || '').substring(0, 30) + '...');

    // Ensure we have a valid array
    const safeExecutives = Array.isArray(healthyExecutives) && healthyExecutives.length > 0
      ? healthyExecutives
      : ['ai-chat', 'vertex-ai-chat', 'deepseek-chat', 'gemini-chat'];

    console.log('🔒 Safe executives:', safeExecutives.length, 'available');

    // Try executives in priority order
    for (const executive of safeExecutives) {
      try {
        console.log(`📞 Calling ${executive}...`);

        let data, error;

        // Attachments are already pre-converted to base64 objects by generateResponse()
        const attachments = context.attachments?.filter((a: any) => a.filename && a.base64_data) || [];
        const images = context.images || [];

        // Build common JSON payload — attachments included as base64 strings
        // so every backend function can receive them via request.json()
        const payload: Record<string, any> = {
          message: userInput || 'Hello',
          messages: [{
            role: 'user',
            content: userInput || 'Hello'
          }],
          organizationContext: context.organizationContext,
          timestamp: new Date().toISOString(),
          images: images.length > 0 ? images : undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
          isLiveCameraFeed: context.isLiveCameraFeed || undefined,
        };

        // Attach user/session metadata for backend memory continuity
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) payload.user_id = user.id;
          if (user?.email) payload.user_email = user.email;
        } catch (_) {}
        // Generate a stable session_id if none exists
        let storedSession = localStorage.getItem('eliza_session_id');
        if (!storedSession) {
          storedSession = 'suite-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          localStorage.setItem('eliza_session_id', storedSession);
        }
        payload.session_id = storedSession;
        
        // Include conversation history from context so ai-chat has full context
        if (context.conversationContext?.recentMessages && Array.isArray(context.conversationContext.recentMessages)) {
          const historyMessages = context.conversationContext.recentMessages.slice(-20).map((m: any) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content || ''
          }));
          // Prepend history before the current message
          payload.messages = [...historyMessages, { role: 'user', content: userInput || 'Hello' }];
        }

        const response = await supabase.functions.invoke(executive, {
          body: payload
        });
        data = response.data;
        error = response.error;

        if (error) {
          console.error(`❌ ${executive} error:`, error);
          continue;
        }

        // CRITICAL FIX: Extract content properly
        const content = this.extractResponseContent(data);

        if (content && content.length > 0) {
          console.log(`✅ ${executive} SUCCESS! Extracted content:`, content.substring(0, 100) + '...');

          // Return as STRING (what frontend expects)
          return content;
        }

        console.log(`⚠️ ${executive} no valid content extracted`);

      } catch (err: any) {
        console.error(`💥 ${executive} crashed:`, err?.message || 'Unknown error');
        continue;
      }
    }

    // All executives failed - use FallbackAIService (Office Clerk)
    console.log('🚨 All executives failed, falling back to Office Clerk...');
    const fallbackResult = await FallbackAIService.generateResponse(userInput, context);
    // Return full object to preserve method/confidence
    return fallbackResult;
  }

  // ── Direct single-executive call (persona-locked) ──────────────────────
  // Each executive has their own deployed Supabase edge function with its own
  // built-in system prompt / persona. We call each function directly so their
  // persona is determined by the function's own system prompt (not Eliza's).
  // DO NOT route through ai-chat — that replaces Eliza's full system prompt.
  private static async callSingleExecutive(
    functionId: string,
    userInput: string,
    context: ElizaContext
  ): Promise<string | null> {
    const payload: Record<string, any> = {
      message: userInput,
      messages: [
        { role: 'user', content: userInput },
      ],
      organizationContext: context.organizationContext,
      timestamp: new Date().toISOString(),
      // Use whatever was pre-converted in generateResponse()
      images: context.images && context.images.length > 0 ? context.images : undefined,
      attachments: context.attachments && context.attachments.length > 0 ? context.attachments : undefined,
      isLiveCameraFeed: context.isLiveCameraFeed || undefined,
    };

    try {
      console.log(`🎭 Calling ${functionId} (own persona)...`);
      const { data, error } = await supabase.functions.invoke(functionId, { body: payload });
      if (error) { console.error(`❌ ${functionId} error:`, error); return null; }
      const content = this.extractResponseContent(data);
      if (content) { console.log(`✅ ${functionId} response (${content.length} chars)`); }
      return content;
    } catch (err: any) {
      console.error(`💥 ${functionId} crashed:`, err?.message);
      return null;
    }
  }

  // MAIN METHOD: Returns STRING or OBJECT as expected by frontend
  public static async generateResponse(
    userInput: string,
    context: ElizaContext = {},
    language = 'en'
  ): Promise<string | any> {
    console.log('🚀 FIXED UnifiedElizaService.generateResponse()');

    try {
      const safeInput = (typeof userInput === 'string' && userInput.trim()) ? userInput.trim() : 'Hello';
      const safeContext = (context && typeof context === 'object') ? context : {};

      // ── Pre-convert raw File[] attachments to base64 attachment objects ──
      // This normalizes File[] → structured {filename, mime_type, size, base64_data, data_url, is_image}
      // so every routing path (routeToExecutive, callSingleExecutive, council) receives JSON-safe objects.
      if (safeContext.attachments && safeContext.attachments.length > 0) {
        // Only re-process if attachments are still raw File objects (no base64_data means unconverted)
        const rawFiles = safeContext.attachments.filter((a: any) => a && typeof File !== 'undefined' && a instanceof File);
        if (rawFiles.length > 0) {
          console.log(`📎 Pre-converting ${rawFiles.length} file(s) to base64 in generateResponse...`);
          const converted: any[] = [];
          const imageUrls: string[] = safeContext.images || [];
          for (const file of rawFiles) {
            try {
              const b64 = await this.fileToBase64(file);
              const dataUrl = `data:${file.type};base64,${b64}`;
              const isImage = file.type.startsWith('image/');
              converted.push({
                filename: file.name,
                mime_type: file.type,
                size: file.size,
                base64_data: b64,
                data_url: dataUrl,
                is_image: isImage,
              });
              if (isImage) imageUrls.push(dataUrl);
            } catch (convErr: any) {
              console.warn(`⚠️ Failed to convert "${file.name}":`, convErr?.message);
            }
          }
          safeContext.attachments = converted;
          safeContext.images = imageUrls;
          console.log(`   → ${imageUrls.length} image(s), ${converted.length} total attachment(s)`);
        }
      }

      const hasVisualOrAttachmentInput =
        safeContext.inputMode === 'vision' ||
        !!safeContext.isLiveCameraFeed ||
        !!(safeContext.images && safeContext.images.length > 0) ||
        !!(safeContext.attachments && safeContext.attachments.length > 0);

      console.log('📋 Safe input length:', safeInput.length);

      // ── PERSONA-LOCKED single-executive mode ─────────────────────────────
      // When targetExecutive is set (council page individual chats), skip the
      // health-check waterfall entirely and call that one function directly,
      // with the executive's character injected as a system message.
      if (safeContext.targetExecutive && EXECUTIVE_PERSONA_PROMPTS[safeContext.targetExecutive] && !hasVisualOrAttachmentInput) {
        console.log(`🎭 Persona-locked mode: routing to ${safeContext.targetExecutive}`);
        const personaResponse = await this.callSingleExecutive(
          safeContext.targetExecutive, safeInput, safeContext
        );
        if (personaResponse) return personaResponse;
        // If that function is down, fall through to waterfall below
        console.warn(`⚠️ ${safeContext.targetExecutive} unavailable, falling back to waterfall`);
      } else if (safeContext.targetExecutive && hasVisualOrAttachmentInput) {
        console.log(`📎 Attachment/vision input detected; bypassing persona-locked routing for ${safeContext.targetExecutive} so backend attachment analysis can run`);
      }

      // ── Vision / attachment override ───────────────────────────────────────
      if (safeContext.inputMode === 'vision' || (safeContext.attachments && safeContext.attachments.length > 0)) {
        console.log('👁️ Vision/Attachment detected - Prioritizing Backend AI Gateway');
      }

      // ── Executive council mode ─────────────────────────────────────────────
      if (safeContext.councilMode) {
        console.log('🏛️ Trying executive council...');
        try {
          const councilResult = await executiveCouncilService.deliberate(safeInput, safeContext);
          if (councilResult && councilResult.synthesis) {
            console.log('✅ Council deliberation successful with', councilResult.responses.length, 'executives');
            // Return the special object shape expected by UnifiedChat's
            // "typeof response !== 'string' && response.type === 'council_deliberation'" check
            // so the frontend enters the council-rendering path and the auto-advance
            // logic receives the full deliberation object (not just the synthesis string).
            return {
              type: 'council_deliberation',
              deliberation: councilResult
            };
          }
        } catch (councilError: any) {
          console.warn('🏛️ Council failed, continuing with regular mode:', councilError?.message);
        }
      }

      // ── Standard waterfall routing ─────────────────────────────────────────
      // IMPORTANT: ai-chat (Eliza) is ALWAYS first. Executive persona functions
      // (vercel-ai-chat, deepseek-chat, etc.) are emergency fallbacks only.
      // They answer as their specific persona and should NEVER be Eliza's voice.
      const executiveFallbacks = await this.getHealthyExecutives();
      const elizaFirstRouting = hasVisualOrAttachmentInput
        ? ['vertex-ai-chat', 'ai-chat', ...executiveFallbacks.filter(e => e !== 'ai-chat' && e !== 'vertex-ai-chat')]
        : ['ai-chat', ...executiveFallbacks.filter(e => e !== 'ai-chat')];
      console.log('💚 Routing order (Eliza first):', elizaFirstRouting);

      const result = await this.routeToExecutive(safeInput, safeContext, elizaFirstRouting, language);
      console.log('✨ Response generated successfully, type:', typeof result);
      return result;

    } catch (error: any) {
      console.error('💥 Critical error in generateResponse:', error?.message || error);
      throw error;
    }
  }

  // Compatibility methods - all return strings
  public static async processMessage(input: string, context?: any): Promise<string> {
    return this.generateResponse(input || 'Hello', context || {});
  }

  public static async chat(message: string, options?: any): Promise<string> {
    return this.generateResponse(message || 'Hello', options || {});
  }
}

export default UnifiedElizaService;

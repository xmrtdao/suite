import { supabase } from '@/integrations/supabase/client';
import type { ElizaContext } from './unifiedElizaService';
import { retryWithBackoff } from '@/utils/retryHelper';

export interface ExecutiveResponse {
  executive: 'vercel-ai-chat' | 'deepseek-chat' | 'gemini-chat' | 'openai-chat' | 'coo-chat';
  executiveTitle: string;
  executiveIcon: string;
  executiveColor: string;
  perspective: string;
  confidence: number;
  reasoning?: string[];
  recommendedAction?: string;
  executionTimeMs?: number;
}

export interface CouncilDeliberation {
  responses: ExecutiveResponse[];
  synthesis: string;
  consensus: boolean;
  leadExecutive: string;
  dissentingOpinions?: string[];
  totalExecutionTimeMs: number;
}

/**
 * Executive Council Service
 * Orchestrates parallel deliberation among all AI executives
 */
class ExecutiveCouncilService {
  private executiveConfig = {
    'vercel-ai-chat': {
      title: 'Dr. Anya Sharma (CTO)',
      name: 'Dr. Anya Sharma',
      icon: '🧠',
      color: 'blue',
      specialty: 'AI Strategy & Technical Architecture',
      model: 'Google Gemini 2.5 Flash'
    },
    'deepseek-chat': {
      title: 'Mr. Omar Al-Farsi (CFO)',
      name: 'Mr. Omar Al-Farsi',
      icon: '💰',
      color: 'amber',
      specialty: 'Global Finance & Strategic Investment',
      model: 'DeepSeek R1'
    },
    'gemini-chat': {
      title: 'Ms. Isabella Rodriguez (CMO)',
      name: 'Ms. Isabella Rodriguez',
      icon: '🎨',
      color: 'pink',
      specialty: 'Brand Strategy & Viral Growth',
      model: 'Google Gemini 2.5 Pro'
    },
    'openai-chat': {
      title: 'Mr. Klaus Richter (COO)',
      name: 'Mr. Klaus Richter',
      icon: '⚙️',
      color: 'slate',
      specialty: 'Operational Excellence & Process Engineering',
      model: 'OpenAI GPT-4o'
    },
    'coo-chat': {
      title: 'Ms. Akari Tanaka (CPO)',
      name: 'Ms. Akari Tanaka',
      icon: '🌸',
      color: 'teal',
      specialty: 'Culture, Talent & Organizational Development',
      model: 'STAE-Integrated AI'
    }
  };

  /**
   * Parse the lead executive function ID from the prior synthesis in conversation history
   */
  private parsePriorLeadExecutive(context: ElizaContext): string | null {
    const recentMsgs = context.conversationContext?.recentMessages || [];
    // Find the last assistant (synthesis) message
    const lastSynthesis = [...recentMsgs]
      .reverse()
      .find((m: any) => m.sender === 'assistant' || m.role === 'assistant');
    if (!lastSynthesis) return null;

    const text: string = lastSynthesis.content || lastSynthesis.text || '';
    // Extract "**Lead Executive:** <Name>" from synthesis output
    const match = text.match(/\*\*Lead Executive:\*\*\s*([^\n]+)/i);
    if (!match) return null;
    const leadName = match[1].trim().toLowerCase();

    // Map display name → function ID
    if (leadName.includes('anya') || leadName.includes('sharma') || leadName.includes('cto')) return 'vercel-ai-chat';
    if (leadName.includes('omar') || leadName.includes('al-farsi') || leadName.includes('cfo')) return 'deepseek-chat';
    if (leadName.includes('bella') || leadName.includes('isabella') || leadName.includes('rodriguez') || leadName.includes('cmo')) return 'gemini-chat';
    if (leadName.includes('klaus') || leadName.includes('richter') || leadName.includes('coo')) return 'openai-chat';
    if (leadName.includes('akari') || leadName.includes('tanaka') || leadName.includes('cpo')) return 'coo-chat';
    return null;
  }

  /**
   * Fetch a compact ecosystem briefing from live data sources:
   * - mining-proxy (SupportXMR: hash rate, treasury, workers)
   * - tasks table (active task counts by status)
   * - agents table (active agents)
   *
   * This briefing is injected into every exec's system prompt so they
   * arrive at the council table with verified, real data — eliminating
   * the need to call system-status and preventing financial hallucination.
   */
  private async fetchEcosystemBriefing(): Promise<string> {
    const lines: string[] = ['📊 LIVE ECOSYSTEM BRIEFING (pre-loaded for this council session — do NOT run system-status):'];

    try {
      // 1. Mining / Treasury data from mining-proxy
      const { data: miningData, error: miningError } = await supabase.functions.invoke('mining-proxy', { body: {} });
      if (!miningError && miningData) {
        const xmrPaid = typeof miningData.amtPaid === 'number' ? miningData.amtPaid.toFixed(6) : (miningData.amountPaid ?? 'unknown');
        const xmrDue = typeof miningData.amtDue === 'number' ? miningData.amtDue.toFixed(6) : (miningData.amountDue ?? 'unknown');
        // SupportXMR returns hash rate as 'hash' field; 'currentHashrate' is an alias some clients use
        const hashRate = Number(
          miningData.hash ?? miningData.currentHashrate ?? miningData.totalHashrate ?? miningData.hashRate ?? 0
        );
        const validShares = Number(miningData.validShares ?? 0);
        const totalHashes = Number(miningData.totalHashes ?? 0);
        // Workers may not be returned as array when pool doesn't have per-worker registration
        const workerCount = Array.isArray(miningData.workers) ? miningData.workers.length :
          (miningData.activeWorkers ?? miningData.numWorkers ?? 'unknown');

        lines.push(`⛏️  Mining / Treasury:`);
        lines.push(`   • XMR Paid (treasury earned):   ${xmrPaid} XMR`);
        lines.push(`   • XMR Due (pending payout):     ${xmrDue} XMR`);
        lines.push(`   • Current Hash Rate:             ${hashRate} H/s`);
        lines.push(`   • Valid Shares:                  ${validShares.toLocaleString()}`);
        lines.push(`   • Total Hashes:                  ${totalHashes.toLocaleString()}`);
        lines.push(`   • Active Workers (pool-reported): ${workerCount}`);

        // Only flag inactive if hash rate is 0 — workerCount alone is unreliable
        // (SupportXMR often omits per-worker arrays even when hashing is active)
        if (hashRate === 0 && validShares === 0) {
          lines.push(`   ⚠️  Mining status: INACTIVE (hash rate is 0 and no valid shares)`);
        } else if (hashRate > 0) {
          lines.push(`   ✅ Mining status: ACTIVE (${hashRate} H/s confirmed)`);
        } else {
          // hashRate=0 but validShares>0: was recently active, might be between share submissions
          lines.push(`   🟡 Mining status: Recently active (${validShares.toLocaleString()} valid shares recorded; hash rate momentarily 0)`);
        }
      } else {
        lines.push(`⛏️  Mining: data unavailable (${miningError?.message || 'no response'})`);
      }
    } catch (e: any) {
      lines.push(`⛏️  Mining: fetch failed — ${e?.message || e}`);
    }

    try {
      // 2. Tasks snapshot
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id, status, priority')
        .in('status', ['PENDING', 'CLAIMED', 'IN_PROGRESS', 'BLOCKED', 'FAILED'])
        .limit(200);

      if (!taskError && tasks) {
        const pending = tasks.filter(t => t.status === 'PENDING').length;
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CLAIMED').length;
        const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
        const failed = tasks.filter(t => t.status === 'FAILED').length;
        const highPri = tasks.filter(t => (t.priority ?? 0) >= 8).length;
        lines.push(`📋 Active Tasks:`);
        lines.push(`   • Pending: ${pending}  |  In Progress: ${inProgress}  |  Blocked: ${blocked}  |  Failed: ${failed}`);
        if (highPri > 0) lines.push(`   🔴 High-priority tasks (≥8): ${highPri}`);
      } else {
        lines.push(`📋 Tasks: unavailable`);
      }
    } catch (e: any) {
      lines.push(`📋 Tasks: fetch failed — ${e?.message || e}`);
    }

    try {
      // 3. Agents snapshot
      const { data: agents, error: agentError } = await supabase
        .from('agents')
        .select('id, status')
        .limit(100);

      if (!agentError && agents) {
        const busy = agents.filter(a => a.status === 'BUSY').length;
        const idle = agents.filter(a => a.status === 'IDLE').length;
        const blocked = agents.filter(a => a.status === 'BLOCKED').length;
        const errored = agents.filter(a => a.status === 'ERROR').length;
        lines.push(`🤖 Agents (${agents.length} total): Busy=${busy}  Idle=${idle}  Blocked=${blocked}  Error=${errored}`);
      } else {
        lines.push(`🤖 Agents: unavailable`);
      }
    } catch (e: any) {
      lines.push(`🤖 Agents: fetch failed — ${e?.message || e}`);
    }

    lines.push('');
    lines.push('⚠️  Use ONLY the above verified figures in your response. Do NOT invent or modify any of these values.');
    lines.push('⚠️  "94/100" is a system health score — it is NEVER a treasury amount or financial metric.');

    return lines.join('\n');
  }

  /**
   * Initiate full council deliberation - all executives analyze in parallel
   */
  async deliberate(userInput: string, context: ElizaContext): Promise<CouncilDeliberation> {
    const startTime = Date.now();
    console.log('🏛️ Executive Council: Starting deliberation...');

    // Determine lead executive from prior synthesis (they get tool access this turn)
    const priorLeadFunctionId = this.parsePriorLeadExecutive(context);
    console.log(`👑 Prior lead executive: ${priorLeadFunctionId || 'none (first turn)'}`);

    // Get all executives (prioritize healthy ones)
    const healthyExecs = await this.getHealthyExecutives();
    const allExecs: Array<'vercel-ai-chat' | 'deepseek-chat' | 'gemini-chat' | 'openai-chat' | 'coo-chat'> =
      ['vercel-ai-chat', 'deepseek-chat', 'gemini-chat', 'openai-chat', 'coo-chat'];
    const executives = allExecs.filter(exec => healthyExecs.includes(exec));

    if (executives.length === 0) {
      console.warn('⚠️ No healthy executives available, falling back to Lovable AI Gateway');
      return this.generateFallbackResponse(userInput, context, startTime);
    }

    console.log(`🎯 Consulting ${executives.length} executives in parallel:`, executives);

    // Fetch live ecosystem data ONCE — shared across all execs so they all have the same facts
    let ecosystemBriefing = '';
    try {
      ecosystemBriefing = await this.fetchEcosystemBriefing();
      console.log('✅ Ecosystem briefing fetched successfully');
    } catch (err) {
      console.warn('⚠️ fetchEcosystemBriefing failed, execs will proceed without it:', err);
    }

    // Dispatch to all executives in parallel — only lead gets tool access
    const executivePromises = executives.map(exec =>
      this.getExecutivePerspective(exec, userInput, context, exec === priorLeadFunctionId, ecosystemBriefing)
    );

    const results = await Promise.allSettled(executivePromises);
    const successfulResponses = results
      .filter((r): r is PromiseFulfilledResult<ExecutiveResponse> => r.status === 'fulfilled')
      .map(r => r.value);

    console.log(`✅ ${successfulResponses.length}/${executives.length} executives responded successfully`);

    // If we have multiple perspectives, synthesize them
    if (successfulResponses.length > 1) {
      const synthesis = await this.synthesizePerspectives(successfulResponses, userInput, context);
      return {
        ...synthesis,
        totalExecutionTimeMs: Date.now() - startTime
      };
    }

    // Fallback to single executive if only one succeeded
    if (successfulResponses.length === 1) {
      return {
        responses: successfulResponses,
        synthesis: successfulResponses[0].perspective,
        consensus: true,
        leadExecutive: successfulResponses[0].executive,
        totalExecutionTimeMs: Date.now() - startTime
      };
    }

    // Final fallback to Lovable AI Gateway
    return this.generateFallbackResponse(userInput, context, startTime);
  }

  /**
   * Get perspective from a specific executive with retry logic
   * isLeadExecutive: if true, this exec can call tools and drive action this turn
   */
  private async getExecutivePerspective(
    executive: 'vercel-ai-chat' | 'deepseek-chat' | 'gemini-chat' | 'openai-chat' | 'coo-chat',
    userInput: string,
    context: ElizaContext,
    isLeadExecutive = false,
    ecosystemBriefing = ''
  ): Promise<ExecutiveResponse> {
    const startTime = Date.now();
    const config = this.executiveConfig[executive];

    console.log(`📡 Calling ${config.title} (${executive}) — ${isLeadExecutive ? '👑 LEAD (tools enabled)' : '🎤 perspective-only'}`);

    try {
      // Use retry logic with exponential backoff
      const result = await retryWithBackoff(
        async () => {
          // Build message history from conversationContext so execs know what's already been done
          const recentMsgs = context.conversationContext?.recentMessages || [];
          const historyMessages = recentMsgs
            .slice(-6) // Last 6 messages (3 user + 3 assistant turns)
            .map((m: any) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content || m.text || '' }))
            .filter((m: any) => m.content);

          // Always end with the current user question
          const fullMessages = [
            ...historyMessages,
            { role: 'user', content: userInput }
          ];

          const { data, error } = await supabase.functions.invoke(executive, {
            body: {
              messages: fullMessages,
              conversationHistory: context.conversationContext,
              userContext: context.userContext,
              miningStats: context.miningStats,
              emotionalContext: context.emotionalContext,
              organizationContext: context.organizationContext,
              councilMode: true,
              isLeadExecutive,     // ← true only for the session lead
              ecosystemBriefing    // ← pre-fetched real data for all execs
            }
          });

          if (error) {
            console.error(`❌ ${executive} returned error:`, error);
            throw new Error(`${executive} error: ${error.message || JSON.stringify(error)}`);
          }

          console.log(`📥 ${executive} returned data:`, {
            hasResponse: !!data?.response,
            hasContent: !!data?.content,
            dataKeys: Object.keys(data || {}),
            success: data?.success,
            actualResponse: data?.response?.substring(0, 100) // Log first 100 chars
          });

          // Extract content from any possible response field format
          const responseText =
            data?.response ||
            data?.content ||
            data?.choices?.[0]?.message?.content ||
            data?.message ||
            data?.text ||
            (typeof data === 'string' ? data : null);

          if (!data || !responseText) {
            throw new Error(`${executive} returned no response content (keys: ${Object.keys(data || {}).join(', ')})`);
          }

          // Attach extracted text for easy access downstream
          data._extractedContent = responseText;

          return data;
        },
        {
          maxAttempts: 2, // Reduced to 2 for faster council response
          initialDelayMs: 500,
          timeoutMs: 20000 // Increased to 20 second timeout per attempt
        }
      );

      const executionTime = Date.now() - startTime;
      console.log(`✅ ${config.title} responded in ${executionTime}ms`);

      const rawPerspective = result._extractedContent ||
        result.response || result.content ||
        result.choices?.[0]?.message?.content ||
        result.message || result.text || 'No response provided';

      // 🔧 HARD BLOCK: strip hallucinated JSON tool-call text from non-lead execs.
      // Even with prompt instructions, LLMs sometimes emit JSON blocks like
      // {"function_name":"system-status",...}. Stripping them here ensures synthesis
      // only receives the executive's actual opinion text, not tool-call noise.
      const cleanPerspective = isLeadExecutive
        ? rawPerspective  // Lead's real tool results pass through untouched
        : rawPerspective
          // Remove ```json or ```JSON fenced blocks
          .replace(/```(?:json|JSON)[\s\S]*?```/g, '')
          // Remove raw { "function_name": ... } blocks (single or multi-line)
          .replace(/\{[\s\S]*?"function_name"[\s\S]*?\}/g, '')
          // Remove lines that start with { and look like JSON objects
          .replace(/^\s*\{[^{}]*"function_name"[^{}]*\}\s*$/gm, '')
          // Remove "🔧 Executing..." lines that precede the JSON
          .replace(/^.*?[Ee]xecut(?:ing|ed).*?(?:system-status|check|diagnostic).*$/gm, '')
          // Remove "📋 Plan: I'll check..." intro lines
          .replace(/^.*?(?:📋|🔧|📊).*?(?:system.?status|check|diagnos).*$/gm, '')
          .replace(/\n{3,}/g, '\n\n') // Collapse excessive blank lines
          .trim();

      return {
        executive,
        executiveTitle: config.title,
        executiveIcon: config.icon,
        executiveColor: config.color,
        perspective: cleanPerspective || '[Perspective withheld — no content after tool-call stripping]',
        confidence: result.confidence || 85,
        reasoning: result.reasoning || [],
        executionTimeMs: executionTime
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${config.title} (${executive}) failed after retries:`, errorMsg);
      console.error(`❌ Full error:`, error);
      throw new Error(`${config.title} unavailable: ${errorMsg}`);
    }
  }


  /**
   * Synthesize multiple executive perspectives into unified response
   */
  private async synthesizePerspectives(
    responses: ExecutiveResponse[],
    originalQuestion: string,
    context: ElizaContext
  ): Promise<Omit<CouncilDeliberation, 'totalExecutionTimeMs'>> {
    console.log('🔄 Synthesizing perspectives from', responses.length, 'executives...');

    // Build emotional context section if available
    const emotionalSection = context.emotionalContext ? `
**USER EMOTIONAL STATE (Real-time Emotion Detection):**
- Primary emotion: ${context.emotionalContext.currentEmotion || 'Unknown'} (${Math.round((context.emotionalContext.emotionConfidence || 0) * 100)}% confidence)
- Voice emotions: ${context.emotionalContext.voiceEmotions?.slice(0, 3).map((e: any) => `${e.name} (${Math.round(e.score * 100)}%)`).join(', ') || 'Not available'}
- Facial expressions: ${context.emotionalContext.facialEmotions?.slice(0, 3).map((e: any) => `${e.name} (${Math.round(e.score * 100)}%)`).join(', ') || 'Not available'}

Consider the user's emotional state when synthesizing the response. If they appear frustrated, be more solution-focused. If excited, match their energy.
` : '';

    // Extract recent council history to give synthesis awareness of prior turns
    const recentMsgs = context.conversationContext?.recentMessages || [];
    const priorTurnsSection = recentMsgs.length > 0 ? (() => {
      // Get last few assistant (council) outputs so synthesis knows what was already done
      const priorCouncilOutputs = recentMsgs
        .filter((m: any) => m.sender === 'assistant' || m.role === 'assistant')
        .slice(-3)
        .map((m: any) => (m.content || m.text || '').substring(0, 500))
        .filter(Boolean);
      const priorUserInputs = recentMsgs
        .filter((m: any) => m.sender === 'user' || m.role === 'user')
        .slice(-3)
        .map((m: any) => m.content || m.text || '');

      if (priorCouncilOutputs.length === 0) return '';
      return `\n📋 PRIOR MEETING CONTEXT (what already happened — do NOT repeat these actions):\n${priorCouncilOutputs.map((o, i) => `- Turn ${i + 1} council output: "${o}..."`).join('\n')}\n\n⚠️ ANTI-LOOP RULE: If the prior context shows system-status was already run or an action was already completed, do NOT run it again. Instead, move the meeting FORWARD — discuss findings, assign ownership, make decisions, take the NEXT action.\n`;
    })() : '';

    const synthesisPrompt = `You are the action-taking facilitator of the XMRT-DAO Executive Council.
The 5 executives are: Dr. Anya Sharma (CTO), Mr. Omar Al-Farsi (CFO), Ms. Isabella "Bella" Rodriguez (CMO), Mr. Klaus Richter (COO), and Ms. Akari Tanaka (CPO).

The user asked: "${originalQuestion}"
${emotionalSection}
${context.organizationContext ? `
ORGANIZATION CONTEXT: ${context.organizationContext.name} | ${context.organizationContext.website || 'N/A'}
` : ''}${priorTurnsSection}
Here are the executive perspectives from this turn:

${responses.map(r => `**${r.executiveTitle}** (${r.executiveIcon}):
${r.perspective}
Confidence: ${r.confidence}%`).join('\n---\n')}

⚡ EXECUTIVE ACTION DIRECTIVE (CRITICAL — READ FIRST):
If the executives are unanimous about an ACTION and it has NOT already been done in the prior context:
1. EXECUTE it NOW using the appropriate tool call — do NOT just describe it
2. Include the ACTUAL RESULTS in your synthesis

If the action was already completed in a prior turn:
→ SKIP re-running it. Summarize the known results and move the meeting FORWARD.
→ Push the council to the NEXT logical step: discuss findings, assign tasks, make decisions.

Do NOT say "the executives will run system-status" — actually RUN it (if not already done) and report findings.
A meeting where executives keep repeating the same planned action is a FAILED meeting.

🚫 ANTI-HALLUCINATION RULES (MANDATORY):
- NEVER invent financial figures, treasury balances, XMR amounts, or budget numbers not explicitly stated by the user in this conversation.
- NEVER invent organizational divisions, departments, or initiatives (e.g. "quantum computing division") that the user has not mentioned.
- NEVER invent technical problems, cost overruns, or operational crises not raised by the user or a real tool result.
- ⚠️ "94/100" = SYSTEM HEALTH SCORE only — NOT a treasury balance, financial status, or org KPI. Never quote it in a financial context.
- If an executive's perspective contains invented figures not in this conversation, flag it as unverified speculation — do NOT incorporate it as fact.
- When you lack real data, say so explicitly rather than fabricating a plausible number.

Your synthesis tasks:
1. Check prior context — has this action been done? If yes, move forward instead
2. If new consensus action → EXECUTE IT with real results
3. Identify consensus areas from this turn
4. Note key debates
5. Provide NEXT STEPS (not plans to make plans)
6. Determine lead executive

Format your response EXACTLY as:
**Consensus Areas:**
[bullet points of agreement]

**Key Debates:**
[any disagreements with executive names]

**Unified Recommendation:**
[synthesized view + actual results if action taken + clear next steps]

**Lead Executive:** [which executive's perspective is most relevant]
`;


    try {
      // Use ai-chat for synthesis — WITHOUT systemPrompt override (that replaces Eliza)
      // Council context is embedded in the synthesisPrompt message itself
      const { data: initData, error: initError } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [{ role: 'user', content: synthesisPrompt }],
          use_tools: true,   // ← CRITICAL: enables Eliza to actually EXECUTE tool calls during synthesis
          miningStats: context.miningStats,
          userContext: context.userContext
        }
      });

      if (initError) {
        throw new Error(initError?.message || 'Failed to synthesize council responses');
      }

      // ai-chat returns { status: 'processing', request_id } and completes asynchronously.
      // Poll for the result so we don't mistake the "AI request accepted" message
      // for the actual synthesis.
      let data = initData;
      if (initData?.status === 'processing' && initData?.request_id) {
        const rid = initData.request_id;
        const base = (typeof window !== 'undefined' && window.location?.origin)
          ? window.location.origin
          : (import.meta.env?.VITE_SUPABASE_URL || 'http://127.0.0.1:8080');
        const pollStart = Date.now();
        const POLL_TIMEOUT_MS = 180000;
        const POLL_INTERVAL_MS = 2000;
        while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
          try {
            const pollRes = await fetch(`${base}/functions/v1/ai-chat?request_id=${encodeURIComponent(rid)}`, {
              method: 'GET',
              headers: { 'apikey': 'local-anon-key' },
            });
            const pollData = await pollRes.json().catch(() => ({}));
            if (pollData.status === 'done') {
              data = pollData.result || pollData;
              break;
            }
            if (pollData.status === 'error' || pollData?.error) {
              throw new Error(pollData.error || 'background request failed');
            }
          } catch (pollErr: any) {
            console.warn(`⏳ council synthesis poll error (${pollErr?.message || 'unknown'}), continuing...`);
          }
        }
      }

      // ai-chat returns content in various fields — extract whichever is present
      const synthesis =
        data?.response ||
        data?.content ||
        data?.choices?.[0]?.message?.content ||
        data?.text ||
        null;

      if (!synthesis) {
        throw new Error('ai-chat synthesis returned no content');
      }

      return {
        responses,
        synthesis,
        consensus: this.detectConsensus(responses),
        leadExecutive: this.selectLeadExecutive(responses, originalQuestion),
        dissentingOpinions: this.extractDissent(responses)
      };
    } catch (error) {
      console.error('❌ Failed to synthesize with Lovable AI Gateway:', error);

      // Fallback: simple concatenation

      return {
        responses,
        synthesis: this.simpleSynthesis(responses),
        consensus: true,
        leadExecutive: responses[0].executive
      };
    }
  }

  /**
   * Simple synthesis fallback if Lovable AI Gateway fails
   */
  private simpleSynthesis(responses: ExecutiveResponse[]): string {
    return `**Executive Council Summary**\n\n${responses.map(r =>
      `**${r.executiveIcon} ${r.executiveTitle}:**\n${r.perspective}\n`
    ).join('\n---\n')}`;
  }

  /**
   * Detect if executives reached consensus
   */
  private detectConsensus(responses: ExecutiveResponse[]): boolean {
    if (responses.length < 2) return true;

    // Simple heuristic: if all confidence scores are above 70%, likely consensus
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    return avgConfidence > 70;
  }

  /**
   * Select which executive should lead based on question type
   */
  private selectLeadExecutive(responses: ExecutiveResponse[], question: string): string {
    const q = question.toLowerCase();

    // Technical / code / AI / infrastructure → Dr. Anya Sharma (CTO)
    if (/code|debug|technical|architect|bug|syntax|deploy|api|function|edge.?function|ml|ai.model|infra|security.vuln/i.test(q)) {
      const exec = responses.find(r => r.executive === 'vercel-ai-chat');
      if (exec) return exec.executiveTitle;
    }

    // Finance / budget / treasury / tokenomics → Mr. Omar Al-Farsi (CFO)
    if (/financ|budget|treasury|invest|revenue|cost|token|economic|fiscal|payment|earn/i.test(q)) {
      const exec = responses.find(r => r.executive === 'deepseek-chat');
      if (exec) return exec.executiveTitle;
    }

    // Marketing / brand / content / community → Ms. Isabella Rodriguez (CMO)
    if (/market|brand|content|social|media|campaign|viral|audience|growth.hack|announcement/i.test(q)) {
      const exec = responses.find(r => r.executive === 'gemini-chat');
      if (exec) return exec.executiveTitle;
    }

    // Operations / tasks / agents / analytics → Mr. Klaus Richter (COO)
    if (/operat|task|pipeline|agent.work|stae|process|analytic|report|metric|orchestrat|workflow/i.test(q)) {
      const exec = responses.find(r => r.executive === 'openai-chat');
      if (exec) return exec.executiveTitle;
    }

    // People / culture / HR / onboarding / knowledge → Ms. Akari Tanaka (CPO)
    if (/people|culture|hr|onboard|train|knowledge|governance|inclusion|talent|mentor/i.test(q)) {
      const exec = responses.find(r => r.executive === 'coo-chat');
      if (exec) return exec.executiveTitle;
    }

    // Default to Dr. Anya Sharma (CTO) as technical org leader
    const anya = responses.find(r => r.executive === 'vercel-ai-chat');
    if (anya) return anya.executiveTitle;

    // Fallback to highest confidence
    const sorted = [...responses].sort((a, b) => b.confidence - a.confidence);
    return sorted[0].executiveTitle;
  }

  /**
   * Extract dissenting opinions
   */
  private extractDissent(responses: ExecutiveResponse[]): string[] | undefined {
    if (responses.length < 2) return undefined;

    // Check for low confidence responses (potential dissent)
    const lowConfidence = responses.filter(r => r.confidence < 60);
    if (lowConfidence.length > 0) {
      return lowConfidence.map(r =>
        `${r.executiveTitle} expressed lower confidence (${r.confidence}%)`
      );
    }

    return undefined;
  }

  /**
   * Get healthy executives by checking their status from the backend
   * Transitioned to Production Health Checks
   */
  private async getHealthyExecutives(): Promise<string[]> {
    const ALL_FIVE = ['vercel-ai-chat', 'deepseek-chat', 'gemini-chat', 'openai-chat', 'coo-chat'];
    console.log('📡 Fetching council executive status...');

    try {
      const { data: agents, error } = await supabase
        .from('agents')
        .select('id, status')
        .in('id', ALL_FIVE);

      if (error) {
        console.warn('⚠️ DB status check failed — defaulting to all 5 executives:', error);
        return ALL_FIVE;
      }

      // Log status for visibility but ALWAYS include all 5 council members.
      // We never filter out any of the 5 based on DB status — the DB may be stale.
      // Each individual call will handle its own failure via retryWithBackoff.
      agents?.forEach(a => console.log(`  ${a.id}: ${a.status}`));

      console.log('✅ Returning all 5 council members regardless of DB status');
      return ALL_FIVE;
    } catch (err) {
      console.error('💥 getHealthyExecutives error — defaulting to all 5:', err);
      return ALL_FIVE;
    }
  }

  /**
   * Generate fallback response using the inference cascade (ai-chat)
   */
  private async generateFallbackResponse(
    userInput: string,
    context: ElizaContext,
    startTime: number
  ): Promise<CouncilDeliberation> {
    console.log('🌐 Falling back to ai-chat edge function for council response...');

    try {
      // Use ai-chat edge function for fallback — the multiple provider/model cascade
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [{ role: 'user', content: userInput }],
          miningStats: context.miningStats,
          userContext: context.userContext
        }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Inference cascade unavailable');
      }

      const response = data.response || 'Unable to generate response at this time.';

      return {
        responses: [{
          executive: 'vercel-ai-chat',
          executiveTitle: 'Inference Cascade',
          executiveIcon: '🌐',
          executiveColor: 'cyan',
          perspective: response,
          confidence: 80,
          executionTimeMs: Date.now() - startTime
        }],
        synthesis: response,
        consensus: true,
        leadExecutive: 'Inference Cascade',
        totalExecutionTimeMs: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ Inference cascade fallback failed:', error);
      throw error;
    }
  }

  /**
   * COMMUNITY IDEA EVALUATION
   * Evaluate a community idea with full council deliberation
   */
  async evaluateCommunityIdea(ideaId: string): Promise<{
    approved: boolean;
    avgScore: number;
    councilPerspectives: any;
  }> {
    console.log(`🏛️ Executive Council: Evaluating community idea ${ideaId}...`);

    try {
      const { data, error } = await supabase.functions.invoke('evaluate-community-idea', {
        body: { ideaId, action: 'evaluate_single' }
      });

      if (error) throw error;

      console.log(`✅ Idea evaluation complete: ${data.approved ? 'APPROVED' : 'REJECTED'} (${data.avgScore}/100)`);

      return data;
    } catch (error) {
      console.error('❌ Failed to evaluate community idea:', error);
      throw error;
    }
  }

  /**
   * IMPLEMENTATION APPROVAL
   * Approve an idea for implementation and create tasks
   */
  async approveImplementation(ideaId: string, plan: any): Promise<{ taskId: string }> {
    console.log(`✅ Executive Council: Approving implementation for idea ${ideaId}...`);

    try {
      // Create implementation task  
      const taskId = crypto.randomUUID();
      const taskTitle = `Implement Community Idea: ${plan.title || ideaId}`;
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          id: taskId,
          title: taskTitle,
          description: `Community-approved idea implementation`,
          status: 'PENDING',
          priority: plan.avgScore >= 80 ? 9 : plan.avgScore >= 70 ? 7 : 5,
          category: 'other',
          stage: 'PLAN',
          repo: 'XMRT-Ecosystem',
          metadata: {
            idea_id: ideaId,
            implementation_plan: plan,
            is_community_idea: true
          }
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // Update idea status
      await supabase
        .from('community_ideas')
        .update({
          assigned_agent_id: task.id,
          implementation_started_at: new Date().toISOString()
        })
        .eq('id', ideaId);

      console.log(`✅ Implementation task created: ${task.id}`);

      return { taskId: task.id };
    } catch (error) {
      console.error('❌ Failed to approve implementation:', error);
      throw error;
    }
  }
}

export const executiveCouncilService = new ExecutiveCouncilService();

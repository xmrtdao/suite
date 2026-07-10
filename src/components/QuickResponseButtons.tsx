import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ButtonConfig {
  label: string;
  emoji: string;
}

interface QuickResponseButtonsProps {
  onQuickResponse: (message: string) => void;
  disabled?: boolean;
  lastMessageRole?: 'user' | 'assistant' | null;
  hasUserEngaged?: boolean;
  hasPastConversations?: boolean;
  lastMessageContent?: string;
  lastExecutive?: string;
  turnCount?: number;
  councilMode?: boolean;
  fullAutonomyEnabled?: boolean;
}

interface QuickResponseContext {
  lastMessageRole?: 'user' | 'assistant' | null;
  hasUserEngaged?: boolean;
  hasPastConversations?: boolean;
  lastMessageContent?: string;
  lastExecutive?: string;
  turnCount?: number;
  councilMode?: boolean;
  fullAutonomyEnabled?: boolean;
  language?: 'en' | 'es';
}

const MAX_SUGGESTIVE_BUTTON_WORDS = 4;

const countWords = (label: string): number =>
  label
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const shortenNumberedChoice = (label: string): string => {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length <= MAX_SUGGESTIVE_BUTTON_WORDS) return label.trim();
  return words.slice(0, MAX_SUGGESTIVE_BUTTON_WORDS).join(' ').trim();
};

// Number emoji mapping for detected options
const numberEmojis: Record<number, string> = {
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣',
};

// Patterns indicating the list is USER CHOICES (show numbered buttons)
const userChoicePatterns = [
  /which (one|option|would you)/i,
  /choose (from|one|an option)/i,
  /select (one|an option|from)/i,
  /options( are)?:/i,
  /you (can|could|might) (choose|pick|select)/i,
  /would you (like|prefer|want)/i,
  /what would you like/i,
  /here are (your|the|some) (options|choices)/i,
  /pick (one|an option)/i,
  /which (do you|should we)/i,
];

// Patterns indicating ELIZA'S PLANNED STEPS (do not treat as user choice lists)
const plannedStepPatterns = [
  /i('ll| will| am going to| 'm going to)/i,
  /let me/i,
  /here('s| is) (my|the) plan/i,
  /i('m| am) going to/i,
  /(the |my )?steps (are|will be|i'll take)/i,
  /first,? i('ll| will)/i,
  /this is (how|what) i('ll| will)/i,
  /i can do this by/i,
  /here's what i'll do/i,
  /my approach (will be|is)/i,
  /i('ll| will) (start|begin) by/i,
  /to (fix|solve|address) this,? i('ll| will)/i,
];

// Check if numbered list represents user choices vs Eliza's planned steps
const isUserChoiceList = (content: string): boolean => {
  if (!content) return false;
  
  // Check for explicit user choice patterns first
  const hasUserChoiceSignal = userChoicePatterns.some(p => p.test(content));
  if (hasUserChoiceSignal) return true;
  
  // Check for planned step patterns - if found, NOT a user choice list
  const hasPlannedStepSignal = plannedStepPatterns.some(p => p.test(content));
  if (hasPlannedStepSignal) return false;
  
  // Default: if no clear signal, assume it's NOT a user choice
  // This prevents false positives on step descriptions
  return false;
};

// Extract numbered options from AI response (e.g., "1. Option" "2) Choice" "(3) Action")
const extractNumberedOptions = (content: string): ButtonConfig[] | null => {
  if (!content) return null;
  
  const options: ButtonConfig[] = [];
  const seenNumbers = new Set<number>();
  
  // Pattern matches: "1. text", "1) text", "(1) text", "**1.** text"
  const patterns = [
    /(?:^|\n)\s*\*?\*?(\d+)[.)\]]\*?\*?\s+([^\n]+)/gm,
    /(?:^|\n)\s*\((\d+)\)\s+([^\n]+)/gm,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const num = parseInt(match[1], 10);
      let label = match[2].trim();
      
      // Skip if we've seen this number or it's out of range
      if (seenNumbers.has(num) || num < 1 || num > 9) continue;
      seenNumbers.add(num);
      
      // Clean up the label
      label = label
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove markdown italic
        .replace(/`([^`]+)`/g, '$1') // Remove code backticks
        .replace(/\s*[-–—]\s*.*$/, '') // Remove dash explanations
        .trim();
      
      // For numbered choices only, keep the label concise (<= 4 words)
      label = shortenNumberedChoice(label);
      
      // Skip empty or too short labels
      if (label.length < 3) continue;
      
      options.push({
        label,
        emoji: numberEmojis[num] || `${num}.`,
      });
    }
  }
  
  // Sort by number and return if we found at least 2 options
  options.sort((a, b) => {
    const numA = Object.entries(numberEmojis).find(([, e]) => e === a.emoji)?.[0] || '0';
    const numB = Object.entries(numberEmojis).find(([, e]) => e === b.emoji)?.[0] || '0';
    return parseInt(numA) - parseInt(numB);
  });
  
  return options.length >= 2 ? options.slice(0, 5) : null;
};

// Buttons shown when conversation is empty
const emptyConversationResponses: ButtonConfig[] = [
  { label: "What can you do?", emoji: "👋" },
  { label: "Plan my next move", emoji: "🎯" },
  { label: "Create a Workflow", emoji: "🧰" }
];

// Buttons shown for returning users who already have conversation history
const returningUserResponses: ButtonConfig[] = [
  { label: "Where were we?", emoji: "🧠" },
  { label: "Show recent changes", emoji: "✨" },
  { label: "Draft my emails", emoji: "📧" }
];

// Buttons shown after user sends (while waiting for AI)
const afterUserResponses: ButtonConfig[] = [
  { label: "Find related docs", emoji: "📚" },
  { label: "Check open issues", emoji: "🛠️" },
  { label: "Queue next actions", emoji: "✨" }
];

// Executive-specific button configurations
const executiveButtonSets: Record<string, {
  feedbackButton: ButtonConfig;
  contextualButtons: ButtonConfig[];
}> = {
  'deepseek-chat': { // CTO - Technical focus
    feedbackButton: { label: "Proceed with fix", emoji: "✅" },
    contextualButtons: [
      { label: "Review changed code", emoji: "📝" },
      { label: "Run focused tests", emoji: "🧪" },
      { label: "Scan security gaps", emoji: "🔒" }
    ]
  },
  'gemini-chat': { // CIO - Vision/Information focus
    feedbackButton: { label: "Continue analysis", emoji: "✅" },
    contextualButtons: [
      { label: "Analyze another image", emoji: "🖼️" },
      { label: "Extract key text", emoji: "📄" },
      { label: "Reveal key patterns", emoji: "🔍" }
    ]
  },
  'openai-chat': { // CAO - Analytics focus
    feedbackButton: { label: "Proceed with insights", emoji: "✅" },
    contextualButtons: [
      { label: "Pull deeper metrics", emoji: "📈" },
      { label: "Highlight top risks", emoji: "⚠️" },
      { label: "Recommend next actions", emoji: "🎯" }
    ]
  },
  'vercel-ai-chat': { // CSO - Strategy focus
    feedbackButton: { label: "Advance this strategy", emoji: "✅" },
    contextualButtons: [
      { label: "Pick my next step", emoji: "🚀" },
      { label: "Coordinate council votes", emoji: "👥" },
      { label: "Build action roadmap", emoji: "📋" }
    ]
  },
  'lovable-chat': { // Default Eliza
    feedbackButton: { label: "Proceed Intelligently", emoji: "✅" },
    contextualButtons: [
      { label: "Tell me more", emoji: "🔄" },
      { label: "Try another workflow", emoji: "❓" },
      { label: "Create a Workflow", emoji: "🧰" }
    ]
  }
};

// Topic detection patterns
const detectConversationTopics = (content: string): string[] => {
  const topics: string[] = [];
  const lowerContent = content.toLowerCase();
  
  if (/error|bug|fix|code|function|deploy|build|crash|fail/.test(lowerContent)) {
    topics.push('technical');
  }
  if (/status|health|running|active|system|online/.test(lowerContent)) {
    topics.push('status');
  }
  if (/task|workflow|pipeline|agent|assign|progress/.test(lowerContent)) {
    topics.push('tasks');
  }
  if (/proposal|vote|governance|council|decision|approve/.test(lowerContent)) {
    topics.push('governance');
  }
  if (/mining|xmrt|hash|worker|reward|charger/.test(lowerContent)) {
    topics.push('mining');
  }
  if (/data|analytics|metrics|report|chart|trend/.test(lowerContent)) {
    topics.push('analytics');
  }
  
  return topics;
};

// Topic-specific contextual buttons
const topicButtons: Record<string, ButtonConfig[]> = {
  technical: [
    { label: "Inspect error logs", emoji: "📋" },
    { label: "Ship the patch", emoji: "🚀" },
    { label: "Run diagnostics now", emoji: "🔧" }
  ],
  status: [
    { label: "Review active blockers", emoji: "💚" },
    { label: "List available agents", emoji: "🤖" },
    { label: "Prioritize urgent work", emoji: "⚠️" }
  ],
  tasks: [
    { label: "Show task pipeline", emoji: "📊" },
    { label: "Assign next tasks", emoji: "🤖" },
    { label: "Resolve blocked work", emoji: "🚧" }
  ],
  governance: [
    { label: "Review pending proposals", emoji: "📜" },
    { label: "Show executive votes", emoji: "🗳️" },
    { label: "Submit my vote", emoji: "✋" }
  ],
  mining: [
    { label: "Review mining stats", emoji: "⛏️" },
    { label: "Show hashrate trends", emoji: "📈" },
    { label: "Optimize mining setup", emoji: "⚡" }
  ],
  analytics: [
    { label: "Run deeper analysis", emoji: "🔬" },
    { label: "Compare last week", emoji: "📅" },
    { label: "Export this dataset", emoji: "💾" }
  ]
};

const GO_SURFING_BUTTON: ButtonConfig = {
  label: "Go Surfing",
  emoji: "🏄‍♀️",
};

const GO_SURFING_PROMPT =
  "Go Surfing 🏄‍♀️ — Eliza, use search_web with DuckDuckGo as your search engine to follow your curiosity and engage your imagination for a series of 3 chained tool calls based on your own whims. Don't bother telling me what you're going to surf, just explore and return with your summarized synthesis of what you explored and what you learned.";

const GET_MY_EMAILS_BUTTON: ButtonConfig = {
  label: "Get my emails",
  emoji: "📥",
};

const GET_MY_EMAILS_PROMPT =
  "Get my emails 📥 — Eliza, fetch my latest 5 emails, take note of the ID of each and open and read the full content of each of those emails using the ID to understand their context before summarizing. After reviewing all 10, intelligently classify each email into one of: actionable, ads/promotions, spam/suspicious, and no-reply or automated failure notices. Prioritize actionable emails for me, and clearly mark ads, spam, and no-reply/failure notices as do-not-reply.";

const GET_ER_DONE_BUTTON: ButtonConfig = {
  label: "Create a Workflow",
  emoji: "🧰",
};

const GET_ER_DONE_PROMPT =
  "Create a Workflow 🧰 — Eliza, in single-AI mode complete this in ONE turn with tool chaining + problem-solving discipline: (1) pick one explicit operational purpose that creates concrete business value now, (2) choose 4-7 ACTUAL edge functions from your current registry only (no hypothetical tools), prioritizing relevant and likely functioning options, (3) state the exact call order before execution, (4) execute real tool calls only — never simulate calls or invent data, (5) after each result, adapt the remaining steps using real outputs, (6) if the workflow fails at any step, immediately design a DIFFERENT workflow in the same turn that reuses successful calls/results already gathered and adds additional likely functioning edge-function options to still achieve useful value, (7) only store a workflow in knowledge if every step in that final workflow succeeds end-to-end with real data. Final response must include: purpose, every real call attempted (in order), which calls succeeded/failed, how you pivoted after any failure, final completed successful workflow, key findings/actions, and recommended next actions. Do not stop early; complete this fully in one turn.";

const INSPECT_ERROR_LOGS_PROMPT =
  "Inspect error logs 📋 — Eliza, execute a complete production observability sweep right now using REAL tool calls only. Use this exact sequence and do not skip steps: (1) call list-available-functions (or search-edge-functions) to verify current tool/function names for supabase-integration and related diagnostics endpoints, (2) invoke supabase-integration to fetch platform-wide logs for ALL edge functions (errors + warnings + recent executions) with a broad time window first, then narrowed windows around failures, (3) invoke supabase-integration to fetch PostgreSQL-side signals (Postgres logs/events, slow queries, lock contention, connection saturation, failed statements, replication/performance health if available), (4) invoke supabase-integration to pull all key operational datapoints (HTTP status patterns, latency percentiles, timeout counts, auth failures, queue/backlog signals, cron/scheduled task failures, rate limit events, storage/network anomalies), (5) cross-correlate timestamps, function names, request IDs, and user/session context across all returned sources to identify root-cause chains, (6) if data is incomplete, make additional targeted supabase-integration calls until coverage is sufficient across functions + Postgres + platform health, (7) produce an incident-grade report with: confirmed findings, likely root cause, impacted components, blast radius, immediate mitigations, concrete permanent fix plan, and exact follow-up calls to validate recovery. Never simulate logs; only report real returned data and explicitly mark unknowns.";

const PROCEED_WITH_PLAN_PROMPT = "Proceed Intelligently ✅";
const SNAP_OUT_OF_IT_PROMPT = "snap out of the loop, and pick up where we left off.";

const DRAFT_MY_EMAILS_PROMPT =
  "Draft my emails 📧 — Eliza, fetch my latest 5 emails before drafting anything. Intelligently classify each message as actionable, ads/promotions, spam/suspicious, or no-reply/automated failure notice. Do NOT draft replies for ads, spam, no-reply senders, or failure notices; only draft concise, high-quality responses for truly actionable emails.";

const SEND_EMAIL_BUTTON: ButtonConfig = {
  label: "Send Email",
  emoji: "📨",
};

const SEND_EMAIL_PROMPT =
  "Send Email 📨 — Eliza, if you already prepared a draft email, send it now. If multiple drafts are ready, send the highest-priority actionable draft first and then check to ensure it was not bounced back, and then summarize and confirm what was sent.";

const STORE_IN_KNOWLEDGE_BUTTON: ButtonConfig = {
  label: "Store in your Knowledge",
  emoji: "🧠",
};

const STORE_IN_KNOWLEDGE_PROMPT =
  "Store in your Knowledge 🧠 — Eliza, store the key information from your most recent assistant conversation response (not tool call logs/results) into your knowledgebase for permanent recall. Save concise structured memory covering context, verified facts/findings, decisions made, completed workflow steps, and recommended next actions. If confidence is low, explicitly mark uncertainty in the stored record.";

const COUNCIL_MOVE_FORWARD_BUTTON: ButtonConfig = {
  label: "Move forward",
  emoji: "⏭️",
};

const COUNCIL_MOVE_FORWARD_PROMPT =
  "Move forward ⏭️ — Council, continue deliberations from the latest discussion and advance to the next highest-impact decision with clear rationale, dissent notes if any, and immediate next actions.";

const COUNCIL_PRINT_MINUTES_BUTTON: ButtonConfig = {
  label: "Print the Minutes",
  emoji: "📝",
};

const COUNCIL_PRINT_MINUTES_PROMPT =
  "Print the Minutes 📝 — Council, adjourn the meeting and generate professionally formatted and summarized meeting minutes from this session (agenda, key discussion points, decisions, votes, owners, deadlines, and open risks), then email those finalized minutes to my user email address and confirm that the email was sent.";

const MAX_STORED_SNIPPET_LENGTH = 3000;
const LOOP_INTERRUPTION_PATTERN = /stopped a repeated tool-call loop|skipped rerunning the same function call/i;

const wasLoopInterrupted = (content?: string): boolean =>
  LOOP_INTERRUPTION_PATTERN.test(content || '');

const buildStoreKnowledgePrompt = (lastMessageContent?: string): string => {
  const assistantMessage = (lastMessageContent || '').trim();

  if (!assistantMessage) {
    return STORE_IN_KNOWLEDGE_PROMPT;
  }

  const normalizedAssistantMessage = assistantMessage
    .replace(/\n\n✅ \*\*Executed tools\*\*[\s\S]*$/i, '')
    .trim()
    .slice(0, MAX_STORED_SNIPPET_LENGTH);

  return `${STORE_IN_KNOWLEDGE_PROMPT}

Use THIS exact assistant response content as the source-of-truth to store:

${normalizedAssistantMessage}`;
};

const workflowCompletionPatterns = [
  /create a workflow/i,
  /completed successful workflow/i,
  /workflow completed/i,
  /workflow succeeded/i,
  /functional workflow/i,
  /every step (succeeded|completed)/i,
];

const researchReturnPatterns = [
  /\bresearch\b/i,
  /\bfindings\b/i,
  /\binsights?\b/i,
  /\bi (found|learned|discovered)\b/i,
  /\bi explored\b/i,
  /\bsummarized synthesis\b/i,
  /\bsources?\b/i,
];

const shouldShowStoreKnowledgeButton = (content: string | undefined): boolean => {
  if (!content) return false;
  return (
    workflowCompletionPatterns.some((pattern) => pattern.test(content)) ||
    researchReturnPatterns.some((pattern) => pattern.test(content))
  );
};

const shouldSuppressStoreKnowledgeButton = (
  councilMode: boolean,
  fullAutonomyEnabled: boolean
): boolean => fullAutonomyEnabled;

const draftEmailPreparedPatterns = [
  /prepared (a|an)?\s*draft email/i,
  /i('ve| have)\s+(prepared|drafted)\s+(a|an)?\s*email/i,
  /draft email (is )?(ready|prepared)/i,
  /here'?s (your|the)\s+draft email/i,
  /email draft (is )?(ready|prepared)/i,
];

const hasPreparedDraftEmailSignal = (content: string | undefined): boolean => {
  if (!content) return false;
  return draftEmailPreparedPatterns.some((pattern) => pattern.test(content));
};

const normalizeSuggestedButtons = (buttons: ButtonConfig[]): ButtonConfig[] => {
  const normalized: ButtonConfig[] = [];
  const seen = new Set<string>();

  for (const button of buttons) {
    const label = button.label.trim();
    if (!label || seen.has(label)) continue;

    const isNumberedChoice = Object.values(numberEmojis).includes(button.emoji);
    if (!isNumberedChoice && countWords(label) > MAX_SUGGESTIVE_BUTTON_WORDS) continue;

    normalized.push({ ...button, label });
    seen.add(label);
  }

  return normalized;
};

const getContextualButtons = (
  lastMessageContent: string | undefined,
  lastExecutive: string | undefined,
  hasUserEngaged: boolean,
  lastMessageRole: 'user' | 'assistant' | null | undefined,
  hasPastConversations: boolean,
  turnCount: number,
  councilMode: boolean,
  fullAutonomyEnabled: boolean
): ButtonConfig[] => {
  const withCouncilButtons = (buttons: ButtonConfig[]): ButtonConfig[] => {
    if (!councilMode) return buttons;
    return normalizeSuggestedButtons([
      ...buttons,
      COUNCIL_MOVE_FORWARD_BUTTON,
      COUNCIL_PRINT_MINUTES_BUTTON
    ]);
  };

  // Welcome state - show intro buttons
  if (!hasUserEngaged) {
    if (hasPastConversations) {
      const firstTurnReturningButtons = [...returningUserResponses, GET_MY_EMAILS_BUTTON];
      return withCouncilButtons(turnCount >= 3
        ? normalizeSuggestedButtons([...firstTurnReturningButtons, GET_ER_DONE_BUTTON, GO_SURFING_BUTTON])
        : firstTurnReturningButtons);
    }
    return withCouncilButtons(turnCount >= 3
      ? normalizeSuggestedButtons([...emptyConversationResponses, GO_SURFING_BUTTON])
      : emptyConversationResponses);
  }
  
  // While waiting for AI response
  if (lastMessageRole === 'user') {
    return withCouncilButtons(turnCount >= 3
      ? normalizeSuggestedButtons([...afterUserResponses, GET_ER_DONE_BUTTON, GO_SURFING_BUTTON])
      : afterUserResponses);
  }
  
  // Check for numbered options, but ONLY if it's a user choice list (not planned steps)
  const numberedOptions = extractNumberedOptions(lastMessageContent || '');
  if (numberedOptions && isUserChoiceList(lastMessageContent || '')) {
    return withCouncilButtons(turnCount >= 3
      ? normalizeSuggestedButtons([...numberedOptions, GET_ER_DONE_BUTTON, GO_SURFING_BUTTON])
      : numberedOptions);
  }
  
  // After AI response - build dynamic buttons
  const buttons: ButtonConfig[] = [];

  if (
    shouldShowStoreKnowledgeButton(lastMessageContent) &&
    !shouldSuppressStoreKnowledgeButton(councilMode, fullAutonomyEnabled)
  ) {
    buttons.push(STORE_IN_KNOWLEDGE_BUTTON);
  }

  // If the assistant indicates an email draft is ready, surface send action immediately.
  if (hasPreparedDraftEmailSignal(lastMessageContent)) {
    buttons.push(SEND_EMAIL_BUTTON);
  }
  
  // Get executive config or default to lovable-chat
  const execConfig = executiveButtonSets[lastExecutive || 'lovable-chat'] || executiveButtonSets['lovable-chat'];
  
  // 1. Add confirmation/feedback button first
  buttons.push(execConfig.feedbackButton);
  
  // If full autonomy is enabled, only show proceed + loop-recovery action (when relevant).
  if (fullAutonomyEnabled) {
    if (wasLoopInterrupted(lastMessageContent)) {
      return withCouncilButtons([
        { label: "Snap out of it", emoji: "🧭" },
        ...buttons
      ]);
    }
    return withCouncilButtons(buttons);
  }

  // 2. Detect topics and add relevant buttons
  const topics = detectConversationTopics(lastMessageContent || '');
  const addedLabels = new Set(buttons.map((button) => button.label));
  
  for (const topic of topics.slice(0, 2)) {
    const topicBtns = topicButtons[topic];
    if (topicBtns && topicBtns[0] && !addedLabels.has(topicBtns[0].label)) {
      buttons.push(topicBtns[0]);
      addedLabels.add(topicBtns[0].label);
    }
  }
  
  // 3. Fill remaining with executive-contextual buttons (up to 4 total)
  for (const btn of execConfig.contextualButtons) {
    if (buttons.length >= 4) break;
    if (!addedLabels.has(btn.label)) {
      buttons.push(btn);
      addedLabels.add(btn.label);
    }
  }
  
  if (turnCount >= 3 && !buttons.some((button) => button.label === GO_SURFING_BUTTON.label)) {
    buttons.push(GO_SURFING_BUTTON);
  }

  if (!buttons.some((button) => button.label === GET_ER_DONE_BUTTON.label)) {
    buttons.push(GET_ER_DONE_BUTTON);
  }

  return withCouncilButtons(buttons);
};

const resolveQuickResponsePrompt = (
  label: string,
  lastMessageContent?: string,
  language: 'en' | 'es' = 'en'
): string => {
  if (label === GO_SURFING_BUTTON.label) return language === 'es' ? SPANISH_PROMPTS.goSurfing : GO_SURFING_PROMPT;
  if (label === GET_ER_DONE_BUTTON.label) return language === 'es' ? SPANISH_PROMPTS.createWorkflow : GET_ER_DONE_PROMPT;
  if (label === GET_MY_EMAILS_BUTTON.label) return language === 'es' ? SPANISH_PROMPTS.getMyEmails : GET_MY_EMAILS_PROMPT;
  if (label === SEND_EMAIL_BUTTON.label) return language === 'es' ? SPANISH_PROMPTS.sendEmail : SEND_EMAIL_PROMPT;
  if (label === "Inspect error logs") return language === 'es' ? SPANISH_PROMPTS.inspectErrorLogs : INSPECT_ERROR_LOGS_PROMPT;
  if (label === "Proceed Intelligently") return language === 'es' ? SPANISH_PROMPTS.proceedWithPlan : PROCEED_WITH_PLAN_PROMPT;
  if (label === "Snap out of it") return SNAP_OUT_OF_IT_PROMPT;
  if (label === STORE_IN_KNOWLEDGE_BUTTON.label) {
    return language === 'es'
      ? SPANISH_PROMPTS.storeKnowledge
      : buildStoreKnowledgePrompt(lastMessageContent);
  }
  if (label === "Draft my emails") return language === 'es' ? SPANISH_PROMPTS.draftEmails : DRAFT_MY_EMAILS_PROMPT;
  if (label === COUNCIL_MOVE_FORWARD_BUTTON.label) return language === 'es' ? SPANISH_PROMPTS.moveForward : COUNCIL_MOVE_FORWARD_PROMPT;
  if (label === COUNCIL_PRINT_MINUTES_BUTTON.label) return language === 'es' ? SPANISH_PROMPTS.printMinutes : COUNCIL_PRINT_MINUTES_PROMPT;
  return label;
};

export const getPrimaryQuickResponsePrompt = (context: QuickResponseContext): string | null => {
  const responses = getContextualButtons(
    context.lastMessageContent,
    context.lastExecutive,
    context.hasUserEngaged ?? false,
    context.lastMessageRole,
    context.hasPastConversations ?? false,
    context.turnCount ?? 0,
    context.councilMode ?? false,
    context.fullAutonomyEnabled ?? false
  );

  const primaryResponse = responses[0];
  if (!primaryResponse) return null;
  return resolveQuickResponsePrompt(primaryResponse.label, context.lastMessageContent, context.language ?? 'en');
};

export const getQuickResponsePrompts = (context: QuickResponseContext): string[] => {
  const responses = getContextualButtons(
    context.lastMessageContent,
    context.lastExecutive,
    context.hasUserEngaged ?? false,
    context.lastMessageRole,
    context.hasPastConversations ?? false,
    context.turnCount ?? 0,
    context.councilMode ?? false,
    context.fullAutonomyEnabled ?? false
  );

  return responses.map((response) =>
    resolveQuickResponsePrompt(response.label, context.lastMessageContent, context.language ?? 'en')
  );
};

export const QuickResponseButtons = ({ 
  onQuickResponse, 
  disabled,
  lastMessageRole,
  hasUserEngaged = false,
  hasPastConversations = false,
  lastMessageContent,
  lastExecutive,
  turnCount = 0,
  councilMode = false,
  fullAutonomyEnabled = false
}: QuickResponseButtonsProps) => {
  const { language } = useLanguage();
  const responses = getContextualButtons(
    lastMessageContent,
    lastExecutive,
    hasUserEngaged,
    lastMessageRole,
    hasPastConversations,
    turnCount,
    councilMode,
    fullAutonomyEnabled
  );

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {responses.map((response) => (
        <Button
          key={response.label}
          variant="outline"
          size="sm"
          onClick={() =>
            onQuickResponse(resolveQuickResponsePrompt(response.label, lastMessageContent, language))
          }
          disabled={disabled}
          className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          {response.emoji} {translateQuickPromptLabel(response.label, language)}
        </Button>
      ))}
    </div>
  );
};

export default QuickResponseButtons;
const QUICK_PROMPT_TRANSLATIONS: Record<string, string> = {
  "What can you do?": "¿Qué puedes hacer?",
  "Plan my next move": "Planifica mi próximo paso",
  "Create a Workflow": "Crear un flujo de trabajo",
  "Where were we?": "¿Dónde nos quedamos?",
  "Show recent changes": "Mostrar cambios recientes",
  "Draft my emails": "Redactar mis correos",
  "Find related docs": "Buscar documentos relacionados",
  "Check open issues": "Revisar issues abiertos",
  "Queue next actions": "Poner en cola próximas acciones",
  "Proceed with fix": "Continuar con la corrección",
  "Review changed code": "Revisar código modificado",
  "Run focused tests": "Ejecutar pruebas enfocadas",
  "Scan security gaps": "Revisar brechas de seguridad",
  "Continue analysis": "Continuar análisis",
  "Analyze another image": "Analizar otra imagen",
  "Extract key text": "Extraer texto clave",
  "Reveal key patterns": "Mostrar patrones clave",
  "Proceed with insights": "Continuar con insights",
  "Pull deeper metrics": "Profundizar métricas",
  "Highlight top risks": "Resaltar principales riesgos",
  "Recommend next actions": "Recomendar próximas acciones",
  "Advance this strategy": "Avanzar esta estrategia",
  "Pick my next step": "Elegir mi próximo paso",
  "Coordinate council votes": "Coordinar votos del consejo",
  "Build action roadmap": "Crear hoja de ruta",
  "Proceed Intelligently": "Proceder inteligentemente",
  "Tell me more": "Cuéntame más",
  "Try another workflow": "Probar otro flujo de trabajo",
  "Inspect error logs": "Inspeccionar logs de errores",
  "Ship the patch": "Desplegar el parche",
  "Run diagnostics now": "Ejecutar diagnósticos ahora",
  "Review active blockers": "Revisar bloqueos activos",
  "List available agents": "Listar agentes disponibles",
  "Prioritize urgent work": "Priorizar trabajo urgente",
  "Show task pipeline": "Mostrar pipeline de tareas",
  "Assign next tasks": "Asignar próximas tareas",
  "Resolve blocked work": "Resolver trabajo bloqueado",
  "Review pending proposals": "Revisar propuestas pendientes",
  "Show executive votes": "Mostrar votos ejecutivos",
  "Submit my vote": "Enviar mi voto",
  "Review mining stats": "Revisar estadísticas de minería",
  "Show hashrate trends": "Mostrar tendencias de hashrate",
  "Optimize mining setup": "Optimizar configuración de minería",
  "Run deeper analysis": "Ejecutar análisis más profundo",
  "Compare last week": "Comparar con la semana pasada",
  "Export this dataset": "Exportar este dataset",
  "Go Surfing": "Ir a explorar",
  "Get my emails": "Obtener mis correos",
  "Send Email": "Enviar correo",
  "Store in your Knowledge": "Guardar en tu conocimiento",
  "Move forward": "Avanzar",
  "Print the Minutes": "Imprimir las minutas",
};

const translateQuickPromptLabel = (label: string, language: 'en' | 'es'): string => {
  if (language !== 'es') return label;
  return QUICK_PROMPT_TRANSLATIONS[label] || label;
};

const SPANISH_PROMPTS = {
  goSurfing:
    "Ir a explorar 🏄‍♀️ — Eliza, usa browse_web con DuckDuckGo como motor de búsqueda para seguir tu curiosidad y tu imaginación durante una serie de 3 llamadas de herramientas encadenadas según tus propios criterios. No me expliques qué vas a explorar; solo explora y regresa con una síntesis resumida de lo que exploraste y lo que aprendiste.",
  getMyEmails:
    "Obtener mis correos 📥 — Eliza, trae mis 10 correos más recientes y luego abre y lee el contenido completo de cada uno para entender su contexto antes de resumir. Después de revisar los 10, clasifica inteligentemente cada correo en: accionable, anuncios/promociones, spam/sospechoso, y no-reply o avisos automáticos de fallo. Prioriza para mí los correos accionables y marca claramente anuncios, spam y no-reply/fallos como no responder.",
  createWorkflow:
    "Crear un flujo de trabajo 🧰 — Eliza, en modo IA única completa esto en UN turno con encadenamiento de herramientas + disciplina de resolución de problemas: (1) elige un propósito operativo explícito que genere valor de negocio concreto ahora, (2) selecciona de 4 a 7 edge functions REALES solo de tu registro actual (sin herramientas hipotéticas), priorizando opciones relevantes y probablemente funcionales, (3) indica el orden exacto de llamadas antes de ejecutar, (4) ejecuta solo llamadas reales — nunca simules llamadas ni inventes datos, (5) tras cada resultado, adapta los pasos restantes usando resultados reales, (6) si el flujo falla en cualquier paso, diseña inmediatamente un flujo DIFERENTE en el mismo turno que reutilice llamadas/resultados exitosos ya obtenidos y añada opciones de edge functions adicionales probablemente funcionales para aún lograr valor útil, (7) solo guarda un flujo en conocimiento si cada paso en ese flujo final tiene éxito de extremo a extremo con datos reales. La respuesta final debe incluir: propósito, cada llamada real intentada (en orden), cuáles llamadas tuvieron éxito/fallaron, cómo cambiaste tras cualquier fallo, flujo final completado con éxito, hallazgos/acciones clave y próximas acciones recomendadas. No te detengas antes; complétalo totalmente en un turno.",
  draftEmails:
    "Redactar mis correos 📧 — Eliza, trae mis 10 correos más recientes antes de redactar nada. Clasifica inteligentemente cada mensaje como accionable, anuncios/promociones, spam/sospechoso, o no-reply/aviso automático de fallo. NO redactes respuestas para anuncios, spam, remitentes no-reply o avisos de fallo; solo redacta respuestas concisas y de alta calidad para correos realmente accionables.",
  sendEmail:
    "Enviar correo 📨 — Eliza, si ya preparaste un borrador de correo, envíalo ahora. Si hay varios borradores listos, envía primero el borrador accionable de mayor prioridad y luego resume lo que se envió.",
  inspectErrorLogs:
    "Inspeccionar logs de errores 📋 — Eliza, ejecuta ahora un barrido completo de observabilidad en producción usando SOLO llamadas reales de herramientas. Usa esta secuencia exacta y no omitas pasos: (1) llama list-available-functions (o search-edge-functions) para verificar los nombres actuales de herramientas/funciones para supabase-integration y endpoints de diagnóstico relacionados, (2) invoca supabase-integration para obtener logs de toda la plataforma para TODAS las edge functions (errores + advertencias + ejecuciones recientes) con una ventana amplia primero y luego ventanas más acotadas alrededor de fallos, (3) invoca supabase-integration para obtener señales del lado PostgreSQL (logs/eventos de Postgres, consultas lentas, contención de locks, saturación de conexiones, sentencias fallidas, salud de replicación/rendimiento si está disponible), (4) invoca supabase-integration para extraer todos los datapoints operativos clave (patrones de estado HTTP, percentiles de latencia, conteos de timeout, fallos de autenticación, señales de cola/backlog, fallos de cron/tareas programadas, eventos de rate limit, anomalías de almacenamiento/red), (5) correlaciona timestamps, nombres de función, request IDs y contexto de usuario/sesión entre todas las fuentes devueltas para identificar cadenas de causa raíz, (6) si faltan datos, realiza llamadas adicionales dirigidas a supabase-integration hasta lograr cobertura suficiente en funciones + Postgres + salud de plataforma, (7) entrega un informe de incidente con: hallazgos confirmados, causa raíz probable, componentes impactados, alcance, mitigaciones inmediatas, plan concreto de corrección permanente y llamadas exactas de seguimiento para validar recuperación. Nunca simules logs; reporta solo datos reales devueltos y marca explícitamente los desconocidos.",
  proceedWithPlan:
    "Continuar con el plan ✅ — Eliza, ejecuta el plan actual de forma autónoma y maximiza entregables reales en este único turno usando todas las herramientas y edge functions relevantes. Requisitos: (1) reformula el objetivo como un entregable concreto con criterios de éxito, (2) selecciona las mejores herramientas/funciones reales disponibles (sin placeholders) y declara el orden exacto de ejecución antes de empezar, (3) realiza acciones reales (crear/actualizar registros, ejecutar diagnósticos, asignar agentes/tareas, disparar flujos, generar artefactos, enviar resultados) en lugar de solo analizar, (4) encadena llamadas dinámicamente según resultados reales, (5) si falla un paso, pivota de inmediato a herramientas/funciones alternativas y continúa hasta producir un entregable útil, (6) verifica la finalización con al menos una llamada de validación independiente, (7) cuando aplique, persiste resultados en conocimiento/almacenamiento y notifica mediante herramientas de comunicación disponibles. La respuesta final debe incluir: cada llamada intentada en orden, éxito/fallo por llamada, artefactos y enlaces/IDs creados, decisiones tomadas, riesgos residuales y la siguiente acción de mayor impacto.",
  storeKnowledge:
    "Guardar en tu conocimiento 🧠 — Eliza, guarda la información clave de tu respuesta más reciente de la conversación del asistente (no logs/resultados de llamadas de herramientas) en tu base de conocimiento para recuerdo permanente. Guarda memoria estructurada y concisa que cubra contexto, hechos/hallazgos verificados, decisiones tomadas, pasos de flujo completados y próximas acciones recomendadas. Si la confianza es baja, marca explícitamente la incertidumbre en el registro guardado.",
  moveForward:
    "Avanzar ⏭️ — Consejo, continúen las deliberaciones desde la discusión más reciente y avancen a la siguiente decisión de mayor impacto con justificación clara, notas de disenso si las hay y próximas acciones inmediatas.",
  printMinutes:
    "Imprimir las minutas 📝 — Consejo, generen minutas profesionales resumidas de esta sesión (agenda, puntos clave de discusión, decisiones, votos, responsables, fechas límite y riesgos abiertos), luego envíen esas minutas finalizadas por correo a mi dirección de usuario y confirmen que el correo fue enviado.",
};

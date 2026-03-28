import { Button } from './ui/button';

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
  { label: "Get 'er done", emoji: "🧰" }
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
    feedbackButton: { label: "Proceed with plan", emoji: "✅" },
    contextualButtons: [
      { label: "Tell me more", emoji: "🔄" },
      { label: "Try another workflow", emoji: "❓" },
      { label: "Get 'er done", emoji: "🧰" }
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
  "Go Surfing 🏄‍♀️ — Eliza, use browse_web to follow your curiosity and engage your imagination for a series of 3 chained tool calls based on your own whims. Don't bother telling me what you're going to surf, just explore and return with your summarized synthesis of what you explored and what you learned.";

const GET_ER_DONE_BUTTON: ButtonConfig = {
  label: "Get 'er done",
  emoji: "🧰",
};

const GET_ER_DONE_PROMPT =
  "Get 'er done 🧰 — Eliza, in single-AI mode complete this in ONE turn by using tool chaining + your own curiosity: (1) pick one explicit operational purpose that would create concrete business value now, (2) randomly choose 4-7 edge functions from your full 293-function toolset that are relevant to that purpose and likely underused, (3) state the exact tool-call order before execution, (4) execute every planned call in sequence without asking follow-up questions, (5) after each call, use the result to decide the next best call while still finishing the full chain, and (6) deliver a final response with: purpose, exact tools used in order, key findings from each step, completed actions, and recommended next actions. Do not stop early; finish all actions and respond fully in this single turn.";

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
  turnCount: number
): ButtonConfig[] => {
  // Welcome state - show intro buttons
  if (!hasUserEngaged) {
    if (hasPastConversations) {
      return turnCount >= 3
        ? normalizeSuggestedButtons([...returningUserResponses, GET_ER_DONE_BUTTON, GO_SURFING_BUTTON])
        : returningUserResponses;
    }
    return turnCount >= 3
      ? normalizeSuggestedButtons([...emptyConversationResponses, GO_SURFING_BUTTON])
      : emptyConversationResponses;
  }
  
  // While waiting for AI response
  if (lastMessageRole === 'user') {
    return turnCount >= 3
      ? normalizeSuggestedButtons([...afterUserResponses, GET_ER_DONE_BUTTON, GO_SURFING_BUTTON])
      : afterUserResponses;
  }
  
  // Check for numbered options, but ONLY if it's a user choice list (not planned steps)
  const numberedOptions = extractNumberedOptions(lastMessageContent || '');
  if (numberedOptions && isUserChoiceList(lastMessageContent || '')) {
    return turnCount >= 3
      ? normalizeSuggestedButtons([...numberedOptions, GET_ER_DONE_BUTTON, GO_SURFING_BUTTON])
      : numberedOptions;
  }
  
  // After AI response - build dynamic buttons
  const buttons: ButtonConfig[] = [];
  
  // Get executive config or default to lovable-chat
  const execConfig = executiveButtonSets[lastExecutive || 'lovable-chat'] || executiveButtonSets['lovable-chat'];
  
  // 1. Add confirmation/feedback button first
  buttons.push(execConfig.feedbackButton);
  
  // 2. Detect topics and add relevant buttons
  const topics = detectConversationTopics(lastMessageContent || '');
  const addedLabels = new Set([buttons[0].label]);
  
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

  return normalizeSuggestedButtons(buttons);
};

export const QuickResponseButtons = ({ 
  onQuickResponse, 
  disabled,
  lastMessageRole,
  hasUserEngaged = false,
  hasPastConversations = false,
  lastMessageContent,
  lastExecutive,
  turnCount = 0
}: QuickResponseButtonsProps) => {
  const responses = getContextualButtons(
    lastMessageContent,
    lastExecutive,
    hasUserEngaged,
    lastMessageRole,
    hasPastConversations,
    turnCount
  );

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {responses.map((response) => (
        <Button
          key={response.label}
          variant="outline"
          size="sm"
          onClick={() =>
            onQuickResponse(
              response.label === GO_SURFING_BUTTON.label
                ? GO_SURFING_PROMPT
                : response.label === GET_ER_DONE_BUTTON.label
                  ? GET_ER_DONE_PROMPT
                : response.label
            )
          }
          disabled={disabled}
          className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          {response.emoji} {response.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickResponseButtons;

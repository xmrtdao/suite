/**
 * Quick Greeting Service - Provides instant contextual greetings without API calls
 * Used for immediate user feedback while AI processes in background
 */

interface QuickGreetingContext {
  isFounder?: boolean;
  conversationSummary?: string;
  totalMessageCount?: number;
  miningStats?: any;
  language?: 'en' | 'es';
}

export class QuickGreetingService {
  private static instance: QuickGreetingService;

  public static getInstance(): QuickGreetingService {
    if (!QuickGreetingService.instance) {
      QuickGreetingService.instance = new QuickGreetingService();
    }
    return QuickGreetingService.instance;
  }

  private greetingTemplates = {
    returnUser: [
      "Welcome back! I remember we discussed {summary}. How can I help you continue our conversation or explore something new?",
      "Good to see you again! Last time we talked about {summary}. What would you like to work on today?",
      "Hello again! I recall our conversation about {summary}. How can I assist you further?",
    ],
    newFounder: [
      "Welcome back, founder! How can I assist with Suite today?",
      "Hello, founder! Ready to continue building the future of enterprise AI?",
      "Welcome! What aspects of Suite shall we work on today?",
    ],
    newUser: [
      "Hello! I'm your Suite AI assistant. How can I help you get started?",
      "Welcome to Suite! I'm here to help you with intelligent automation and AI-powered workflows.",
      "Hi there! I'm Suite AI, ready to assist you. What would you like to accomplish?",
    ]
  };

  private greetingTemplatesEs = {
    returnUser: [
      "¡Bienvenido de nuevo! Recuerdo que hablamos sobre {summary}. ¿Cómo quieres continuar nuestra conversación o explorar algo nuevo?",
      "¡Qué bueno verte de nuevo! La última vez hablamos de {summary}. ¿En qué te gustaría trabajar hoy?",
      "¡Hola otra vez! Recuerdo nuestra conversación sobre {summary}. ¿Cómo puedo ayudarte ahora?",
    ],
    newFounder: [
      "¡Bienvenido de nuevo, fundador! ¿Cómo puedo ayudarte con Suite hoy?",
      "¡Hola, fundador! ¿Listo para seguir construyendo el futuro de la IA empresarial?",
      "¡Bienvenido! ¿Qué aspectos de Suite trabajamos hoy?",
    ],
    newUser: [
      "¡Hola! Soy tu asistente de IA de Suite. ¿Cómo puedo ayudarte a empezar?",
      "¡Bienvenido a Suite! Estoy aquí para ayudarte con automatización inteligente y flujos de trabajo con IA.",
      "¡Hola! Soy Suite AI y estoy listo para ayudarte. ¿Qué te gustaría lograr?",
    ]
  };

  /**
   * Generate instant greeting without API calls
   */
  public generateQuickGreeting(context: QuickGreetingContext = {}): string {
    const { isFounder, conversationSummary, totalMessageCount, language = 'en' } = context;
    const templates = language === 'es' ? this.greetingTemplatesEs : this.greetingTemplates;

    // Return user with conversation history
    if (conversationSummary && totalMessageCount && totalMessageCount > 0) {
      const template = this.getRandomTemplate(templates.returnUser);
      const shortSummary = this.truncateSummary(conversationSummary, 100);
      return template.replace('{summary}', shortSummary);
    }

    // New founder
    if (isFounder) {
      return this.getRandomTemplate(templates.newFounder);
    }

    // New user
    return this.getRandomTemplate(templates.newUser);
  }

  /**
   * Store conversation summary in localStorage for instant access
   */
  public cacheConversationSummary(sessionId: string, summary: string, messageCount: number): void {
    try {
      const cache = {
        summary,
        messageCount,
        timestamp: Date.now(),
        sessionId
      };
      // Keep existing localStorage key for backwards compatibility
      localStorage.setItem('xmrt-last-conversation', JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache conversation summary:', error);
    }
  }

  /**
   * Retrieve cached conversation summary for instant greeting
   */
  public getCachedConversationSummary(): { summary: string; messageCount: number } | null {
    try {
      const cached = localStorage.getItem('xmrt-last-conversation');
      if (!cached) return null;

      const cache = JSON.parse(cached);
      
      // Cache expires after 24 hours
      if (Date.now() - cache.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('xmrt-last-conversation');
        return null;
      }

      return {
        summary: cache.summary,
        messageCount: cache.messageCount
      };
    } catch (error) {
      console.warn('Failed to retrieve cached conversation summary:', error);
      return null;
    }
  }

  private getRandomTemplate(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private truncateSummary(summary: string, maxLength: number): string {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength - 3) + '...';
  }
}

// Export singleton instance
export const quickGreetingService = QuickGreetingService.getInstance();

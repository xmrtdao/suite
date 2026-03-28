import { unifiedTTSService, UnifiedTTSOptions } from './unifiedTTSService';

/**
 * Enhanced TTS Service - Browser-only speech synthesis
 * Uses Web Speech API for 100% reliability across all browsers, online and offline
 */
export class EnhancedTTSService {
  private static instance: EnhancedTTSService;
  private lastMethod = 'Web Speech API';
  private initialized = false;
  private readonly SUMMARY_TRIGGER_CHARS = 1200;
  private readonly SUMMARY_MAX_CHARS = 700;

  private constructor() {}

  static getInstance(): EnhancedTTSService {
    if (!this.instance) {
      this.instance = new EnhancedTTSService();
    }
    return this.instance;
  }

  private toSpeechFriendlyText(text: string): string {
    return text
      // Remove code entirely so TTS doesn't read symbols/syntax aloud
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      // Headings
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      // Blockquotes
      .replace(/^\s{0,3}>\s?/gm, '')
      // Bold / italic / strikethrough
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      // Markdown links/images: keep the human-readable label
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      // Bullets and task lists
      .replace(/^\s*[-*+]\s+\[.\]\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      // Ordered lists
      .replace(/^\s*\d+\.\s+/gm, '')
      // Horizontal rules
      .replace(/^\s*([-*_]\s*){3,}\s*$/gm, '')
      // Collapse repeated whitespace while preserving sentence flow
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  private summarizeForTTS(text: string): string {
    const cleaned = this.toSpeechFriendlyText(text);

    if (!cleaned || cleaned.length <= this.SUMMARY_TRIGGER_CHARS) {
      return cleaned;
    }

    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (sentences.length <= 3) {
      return cleaned.slice(0, this.SUMMARY_MAX_CHARS).trim();
    }

    const withScores = sentences.map((sentence, index) => {
      let score = 0;

      if (index === 0) score += 3;
      if (index < 4) score += 2;
      if (/\d/.test(sentence)) score += 2;
      if (/(important|key|recommend|next|action|summary|result|because|therefore|should)/i.test(sentence)) {
        score += 2;
      }

      const wordCount = sentence.split(/\s+/).length;
      if (wordCount >= 8 && wordCount <= 30) score += 1;

      return { sentence, index, score };
    });

    const selected = withScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.sentence);

    let summary = selected.join(' ');
    if (summary.length > this.SUMMARY_MAX_CHARS) {
      summary = `${summary.slice(0, this.SUMMARY_MAX_CHARS).trim()}...`;
    }

    return `Here is a concise spoken summary. ${summary}`;
  }

  async speak(text: string, options?: Partial<UnifiedTTSOptions>): Promise<void> {
    const speechText = this.summarizeForTTS(text);
    if (!speechText) {
      return;
    }

    const fullOptions: UnifiedTTSOptions = {
      text: speechText,
      voice: options?.voice || 'nova',
      speed: options?.speed || 1.0,
      language: options?.language || 'en'
    };

    try {
      const result = await unifiedTTSService.speakText(fullOptions);
      this.lastMethod = result.method;

      if (!result.success) {
        console.warn('⚠️ TTS failed but continuing silently');
      }
    } catch (error) {
      console.error('❌ TTS error:', error);
    }
  }

  stop(): void {
    unifiedTTSService.stopSpeaking();
  }

  isSpeaking(): boolean {
    return unifiedTTSService.isSpeaking();
  }

  getLastMethod(): string {
    return this.lastMethod;
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await unifiedTTSService.initialize();
      this.initialized = true;
      console.log('🎵 Enhanced TTS Service initialized (browser-only)');
    }
  }

  getCapabilities(): {
    openAI: boolean;
    webSpeech: boolean;
    fallback: boolean;
  } {
    const unified = unifiedTTSService.getCapabilities();
    return {
      openAI: false,
      webSpeech: unified.webSpeechAvailable,
      fallback: unified.webSpeechAvailable
    };
  }
}

export const enhancedTTS = EnhancedTTSService.getInstance();

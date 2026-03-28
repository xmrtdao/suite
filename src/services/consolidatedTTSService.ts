/**
 * Consolidated TTS Service
 * Merges functionality from: elevenlabsService, geminiTTSService, openAITTSService,
 * fallbackTTSService, simplifiedVoiceService, fallbackSpeechService
 * 
 * Provides unified text-to-speech with automatic fallback chain
 */

interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  speed?: number;
  pitch?: number;
}

interface TTSProvider {
  name: string;
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  isAvailable: () => boolean;
}

class ConsolidatedTTSService {
  private providers: TTSProvider[] = [];
  private currentProvider: TTSProvider | null = null;
  private initialized = false;
  private audioContext: AudioContext | null = null;
  private readonly SUMMARY_TRIGGER_CHARS = 1200;
  private readonly SUMMARY_MAX_CHARS = 700;

  constructor() {
    this.setupProviders();
  }

  private sanitizeTextForSpeech(text: string): string {
    return text
      // Remove markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
      .replace(/\*([^*]+)\*/g, '$1')      // *italic* → italic
      .replace(/__([^_]+)__/g, '$1')      // __bold__ → bold
      .replace(/_([^_]+)_/g, '$1')        // _italic_ → italic
      .replace(/~~([^~]+)~~/g, '$1')      // ~~strike~~ → strike
      
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')     // ```code blocks```
      .replace(/`([^`]+)`/g, '$1')        // `code` → code
      
      // Remove emojis and special unicode characters
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // Emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')    // Dingbats
      .replace(/✅|❌|⚠️|🔧|💡|📊|🔍|⛏️|🚀|🔔/g, '') // Common status symbols
      
      // Remove markdown lists and bullets
      .replace(/^\s*[-*+]\s+/gm, '')      // - list items
      .replace(/^\s*\d+\.\s+/gm, '')      // 1. numbered lists
      
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  private summarizeForTTS(text: string): string {
    const cleaned = this.sanitizeTextForSpeech(text);

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

  private setupProviders() {
    // Provider 1: Browser Speech Synthesis (PREFERRED - always free, always works)
    this.providers.push({
      name: 'Browser',
      isAvailable: () => 'speechSynthesis' in window,
      speak: async (text: string, options?: TTSOptions) => {
        return new Promise((resolve, reject) => {
          if (!('speechSynthesis' in window)) {
            reject(new Error('Speech synthesis not supported'));
            return;
          }

          const sanitizedText = this.sanitizeTextForSpeech(text);
          const utterance = new SpeechSynthesisUtterance(sanitizedText);
          utterance.rate = options?.speed || 1.0;
          utterance.pitch = options?.pitch || 1.0;
          
          utterance.onend = () => resolve();
          utterance.onerror = (error) => reject(error);
          
          window.speechSynthesis.speak(utterance);
        });
      }
    });

    // Provider 2: OpenAI TTS (DISABLED - user prefers browser TTS)
    // Kept for reference but not added to providers array
    
    // Provider 3: ElevenLabs (DISABLED - user prefers browser TTS)
    // Kept for reference but not added to providers array
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Find first available provider
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        this.currentProvider = provider;
        console.log(`✅ TTS initialized with ${provider.name}`);
        break;
      }
    }

    if (!this.currentProvider) {
      console.warn('⚠️ No TTS provider available, using browser fallback');
      this.currentProvider = this.providers[this.providers.length - 1]; // Browser fallback
    }

    this.initialized = true;
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const speechText = this.summarizeForTTS(text);
    if (!speechText) return;

    // Try current provider first
    try {
      if (this.currentProvider) {
        await this.currentProvider.speak(speechText, options);
        return;
      }
    } catch (error) {
      console.warn(`${this.currentProvider?.name} failed, trying fallback:`, error);
    }

    // Fallback chain
    for (const provider of this.providers) {
      if (provider === this.currentProvider) continue;
      
      try {
        if (provider.isAvailable()) {
          await provider.speak(speechText, options);
          this.currentProvider = provider; // Switch to working provider
          console.log(`✅ Switched to ${provider.name} TTS`);
          return;
        }
      } catch (error) {
        console.warn(`${provider.name} failed:`, error);
      }
    }

    throw new Error('All TTS providers failed');
  }

  private async playAudioBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        resolve();
      };
      audio.onerror = (error) => {
        URL.revokeObjectURL(audio.src);
        reject(error);
      };
      audio.play().catch(reject);
    });
  }

  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  getCurrentProvider(): string {
    return this.currentProvider?.name || 'None';
  }
}

export const consolidatedTTS = new ConsolidatedTTSService();

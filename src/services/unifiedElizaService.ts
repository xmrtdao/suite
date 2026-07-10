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

export interface ProcessedAttachment {
  name: string;
  type: string;
  size: number;
  base64: string;  // Base64 encoded content
  dataUrl: string; // Full data URL for embedding (e.g., data:image/png;base64,...)
  extractedText?: string; // ENHANCED: Extracted text from PDFs and documents
  pageCount?: number; // ENHANCED: Number of pages for PDFs
}

export interface AIResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result?: any;
    status: 'pending' | 'success' | 'error';
  }>;
  reasoning?: string;
  providerUsed?: string;
  executiveTitle?: string;
  generatedImages?: Array<{ url: string; prompt: string }>;
  generatedVideos?: Array<{ url: string; prompt: string }>;
  metadata?: Record<string, any>;
}

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
  images?: any[];  // Keep for backward compatibility
  attachments?: File[]; // Raw file attachments (will be processed)
  processedAttachments?: ProcessedAttachment[]; // NEW: Processed attachments ready for LLM
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
   * ENHANCED: Process file attachments with deep PDF analysis using python-executor
   */
  private static async processAttachments(files: File[]): Promise<ProcessedAttachment[]> {
    const processed: ProcessedAttachment[] = [];
    
    for (const file of files) {
      try {
        console.log(`📎 Processing attachment: ${file.name} (${file.type}, ${file.size} bytes)`);
        
        // Convert file to Base64
        const base64 = await this.fileToBase64(file);
        
        // Create data URL for embedding
        const dataUrl = `data:${file.type};base64,${base64}`;
        
        const processedAttachment: ProcessedAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64,
          dataUrl: dataUrl
        };
        
        // ENHANCEMENT: Deep analysis for PDFs using python-executor
        if (file.type === 'application/pdf') {
          console.log(`📄 PDF detected - initiating deep analysis for: ${file.name}`);
          try {
            const extractedText = await this.extractPDFTextWithPython(base64, file.name);
            if (extractedText) {
              processedAttachment.extractedText = extractedText.text;
              processedAttachment.pageCount = extractedText.pageCount;
              console.log(`✅ PDF extraction complete: ${extractedText.text.length} chars extracted, ${extractedText.pageCount} pages`);
            }
          } catch (pdfError) {
            console.error(`❌ PDF deep analysis failed for ${file.name}:`, pdfError);
          }
        }
        
        // ENHANCEMENT: Extract text from text files
        if (file.type.startsWith('text/') || file.type === 'application/json') {
          console.log(`📝 Text file detected - extracting content for: ${file.name}`);
          try {
            const textContent = await this.extractTextFromBase64(base64, file.type);
            if (textContent) {
              processedAttachment.extractedText = textContent;
              console.log(`✅ Text extraction complete: ${textContent.length} chars`);
            }
          } catch (textError) {
            console.error(`❌ Text extraction failed for ${file.name}:`, textError);
          }
        }
        
        processed.push(processedAttachment);
        console.log(`✅ Processed ${file.name} successfully (${base64.length} chars base64)`);
      } catch (error) {
        console.error(`❌ Failed to process attachment ${file.name}:`, error);
      }
    }
    
    return processed;
  }
  
  /**
   * ENHANCED: Extract text from PDF using existing python-executor edge function
   */
  private static async extractPDFTextWithPython(base64Content: string, fileName: string): Promise<{ text: string; pageCount: number } | null> {
    try {
      console.log(`🐍 Calling python-executor for PDF extraction: ${fileName}`);
      
      // Python script for PDF text extraction using pypdf
      const pythonScript = `
import base64
import io
import json
import sys

try:
    from pypdf import PdfReader
except ImportError:
    print(json.dumps({"error": "pypdf not available, please install: pip install pypdf"}))
    sys.exit(1)

def extract_pdf_text(base64_string):
    try:
        # Decode base64 to bytes
        pdf_bytes = base64.b64decode(base64_string)
        pdf_file = io.BytesIO(pdf_bytes)
        
        # Create PDF reader
        reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        full_text = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                full_text.append(f"--- Page {page_num + 1} ---\\n{text}")
        
        result = {
            "text": "\\n\\n".join(full_text) if full_text else "",
            "pageCount": len(reader.pages),
            "success": True
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}))
        sys.exit(1)

# Execute extraction
extract_pdf_text(${JSON.stringify(base64Content)})
      `;
      
      // Call the existing python-executor edge function
      const { data, error } = await supabase.functions.invoke('python-executor', {
        body: {
          code: pythonScript,
          language: 'python'
        }
      });
      
      if (error) {
        console.error('❌ python-executor error:', error);
        return null;
      }
      
      // Parse the result
      let result;
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse python-executor response:', e);
          return null;
        }
      } else {
        result = data;
      }
      
      if (result.success === false || result.error) {
        console.warn('PDF extraction failed:', result.error);
        return null;
      }
      
      return {
        text: result.text || '',
        pageCount: result.pageCount || 0
      };
      
    } catch (error) {
      console.error('PDF extraction error:', error);
      return null;
    }
  }
  
  /**
   * ENHANCED: Extract text from base64-encoded text files
   */
  private static async extractTextFromBase64(base64Content: string, mimeType: string): Promise<string | null> {
    try {
      // Decode base64 to text
      const decoded = atob(base64Content);
      
      // For JSON, try to pretty-print
      if (mimeType === 'application/json') {
        try {
          const parsed = JSON.parse(decoded);
          return JSON.stringify(parsed, null, 2);
        } catch (e) {
          return decoded;
        }
      }
      
      return decoded;
    } catch (error) {
      console.error('Text extraction failed:', error);
      return null;
    }
  }
  
  /**
   * Convert a File to Base64 string
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }
  
  /**
   * ENHANCED: Build attachment descriptions with extracted content for the LLM
   */
  private static buildAttachmentContext(attachments: ProcessedAttachment[]): string {
    if (!attachments || attachments.length === 0) return '';
    
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const pdfTypes = ['application/pdf'];
    const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
    
    const images = attachments.filter(a => imageTypes.includes(a.type));
    const pdfs = attachments.filter(a => pdfTypes.includes(a.type));
    const texts = attachments.filter(a => textTypes.includes(a.type));
    const others = attachments.filter(a => !imageTypes.includes(a.type) && !pdfTypes.includes(a.type) && !textTypes.includes(a.type));
    
    let context = '\n\n--- ATTACHMENTS ---\n';
    
    if (images.length > 0) {
      context += `\n📷 **Images (${images.length}):**\n`;
      images.forEach(img => {
        context += `- ${img.name} (${(img.size / 1024).toFixed(2)} KB)\n`;
      });
      context += `\n*Note: Images are available for vision analysis. The user has shared these images with you.*\n`;
    }
    
    if (pdfs.length > 0) {
      context += `\n📄 **PDF Documents (${pdfs.length}):**\n`;
      pdfs.forEach(pdf => {
        context += `- ${pdf.name} (${(pdf.size / 1024).toFixed(2)} KB) - ${pdf.pageCount || '?'} pages\n`;
        if (pdf.extractedText && pdf.extractedText.length > 0) {
          context += `\n**Content extracted from ${pdf.name}:**\n`;
          // Limit to first 4000 chars to avoid context overflow
          const truncatedText = pdf.extractedText.length > 4000 
            ? pdf.extractedText.substring(0, 4000) + '... [truncated]' 
            : pdf.extractedText;
          context += `\`\`\`\n${truncatedText}\n\`\`\`\n`;
        } else {
          context += `\n*Note: PDF text extraction was not available for this document.*\n`;
        }
      });
    }
    
    if (texts.length > 0) {
      context += `\n📝 **Text Files (${texts.length}):**\n`;
      texts.forEach(text => {
        context += `- ${text.name} (${(text.size / 1024).toFixed(2)} KB)\n`;
        if (text.extractedText && text.extractedText.length > 0) {
          context += `\n**Content:**\n\`\`\`\n${text.extractedText.substring(0, 2000)}\n\`\`\`\n`;
        }
      });
    }
    
    if (others.length > 0) {
      context += `\n📎 **Other Files (${others.length}):**\n`;
      others.forEach(other => {
        context += `- ${other.name} (${other.type}, ${(other.size / 1024).toFixed(2)} KB)\n`;
      });
    }
    
    context += '\n--- END ATTACHMENTS ---\n';
    return context;
  }

  private static async getCurrentUserContext(): Promise<{ userId?: string; userEmail?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return {
        userId: user?.id,
        userEmail: user?.email || undefined,
      };
    } catch (_) {
      return {};
    }
  }

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
   * ENHANCED: Extract comprehensive response with metadata
   */
  private static extractComprehensiveResponse(data: any, providerId?: string): AIResponse | null {
    console.log('🔍 Extracting comprehensive response from:', typeof data);

    if (!data) {
      console.warn('⚠️ No data received');
      return null;
    }

    const response: AIResponse = {
      content: '',
      toolCalls: [],
      metadata: {}
    };

    // If it's a string, just return as content
    if (typeof data === 'string') {
      response.content = data;
      response.providerUsed = providerId;
      return response;
    }

    // If it's an object, try different extraction paths
    if (typeof data === 'object') {
      
      // Extract main content
      if (data.choices && Array.isArray(data.choices) && data.choices[0]?.message?.content) {
        response.content = data.choices[0].message.content;
        response.providerUsed = data.model || providerId;
        
        // Extract tool calls if present
        if (data.choices[0].message.tool_calls) {
          response.toolCalls = data.choices[0].message.tool_calls.map((tc: any) => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
            status: 'pending'
          }));
        }
        
        // Extract reasoning if present (for models that support it)
        if (data.choices[0].message.reasoning) {
          response.reasoning = data.choices[0].message.reasoning;
        }
      }
      
      // Try direct content property
      if (data.content && typeof data.content === 'string') {
        response.content = data.content;
        if (!response.providerUsed) response.providerUsed = providerId;
      }
      
      // Try message property
      if (data.message && typeof data.message === 'string') {
        response.content = data.message;
      }
      
      // Try response property
      if (data.response && typeof data.response === 'string') {
        response.content = data.response;
      }
      
      // Try text property
      if (data.text && typeof data.text === 'string') {
        response.content = data.text;
      }
      
      // Extract generated images/videos if present
      if (data.generatedImages && Array.isArray(data.generatedImages)) {
        response.generatedImages = data.generatedImages;
      }
      
      if (data.generatedVideos && Array.isArray(data.generatedVideos)) {
        response.generatedVideos = data.generatedVideos;
      }
      
      // Extract any additional metadata
      if (data.metadata) {
        response.metadata = data.metadata;
      }
      
      // Extract provider info
      if (data.provider) {
        response.providerUsed = data.provider;
      }
      
      if (response.content) {
        console.log(`✅ Extracted content (${response.content.length} chars), ${response.toolCalls?.length || 0} tool calls`);
      }
      
      return response;
    }

    console.warn('⚠️ Unknown data type:', typeof data);
    return null;
  }

  /**
   * SURGICAL FIX: Extract attachments from message with comprehensive field checking
   * This addresses the silent extraction failure when field names don't match
   */
  private static extractAttachmentsFromMessage(message: any, context: ElizaContext): File[] {
    console.log('🔍 [CHECKPOINT 1] Raw incoming message object:', {
      type: typeof message,
      hasAttachments: !!message?.attachments,
      hasFiles: !!message?.files,
      hasFileList: !!message?.fileList,
      hasDataTransfer: !!message?.dataTransfer,
      keys: message ? Object.keys(message) : [],
      contextAttachments: context?.attachments?.length || 0,
      contextFiles: context?.files?.length || 0,
      contextImages: context?.images?.length || 0
    });

    const extractedFiles: File[] = [];

    // Check all possible attachment field names (field name mismatch is a common bug)
    const possibleFields = [
      message?.attachments,
      message?.files,
      message?.fileList,
      message?.dataTransfer?.files,
      message?.target?.files,
      message?.currentTarget?.files
    ];

    for (const field of possibleFields) {
      if (field && typeof field === 'object') {
        // Check if it's a FileList or array-like object
        if (typeof field.length === 'number' && field.length > 0) {
          console.log(`📎 Found attachments in field with ${field.length} items`);
          for (let i = 0; i < field.length; i++) {
            const file = field[i];
            if (file instanceof File || (file?.name && file?.size !== undefined)) {
              extractedFiles.push(file);
              console.log(`  - Extracted: ${file.name} (${file.type || 'unknown type'})`);
            }
          }
        }
        // Check if it's an array directly
        else if (Array.isArray(field) && field.length > 0) {
          console.log(`📎 Found attachments array with ${field.length} items`);
          field.forEach(file => {
            if (file instanceof File || (file?.name && file?.size !== undefined)) {
              extractedFiles.push(file);
              console.log(`  - Extracted: ${file.name} (${file.type || 'unknown type'})`);
            }
          });
        }
      }
    }

    // Also check context.attachments (already File[])
    if (context?.attachments && Array.isArray(context.attachments) && context.attachments.length > 0) {
      console.log(`📎 Found ${context.attachments.length} attachments in context`);
      context.attachments.forEach(file => {
        if (file instanceof File) {
          extractedFiles.push(file);
          console.log(`  - From context: ${file.name} (${file.type})`);
        }
      });
    }

    // Also check context.files (alternative field name)
    if (context?.files && Array.isArray(context.files) && context.files.length > 0) {
      console.log(`📎 Found ${context.files.length} files in context.files`);
      context.files.forEach(file => {
        if (file instanceof File) {
          extractedFiles.push(file);
          console.log(`  - From context.files: ${file.name} (${file.type})`);
        }
      });
    }

    console.log(`📊 [CHECKPOINT 2] Post-extraction: ${extractedFiles.length} total attachments extracted`);
    if (extractedFiles.length > 0) {
      extractedFiles.forEach((f, idx) => {
        console.log(`  [${idx}] ${f.name} | type: ${f.type || 'unknown'} | size: ${f.size} bytes`);
      });
    }

    return extractedFiles;
  }

  /**
   * ENHANCED: Route request with comprehensive response extraction
   */
  private static async routeToExecutive(
    userInput: string,
    context: ElizaContext,
    healthyExecutives: string[],
    language = 'en'
  ): Promise<string> {
    console.log('🎯 Production routing with response extraction');
    console.log('📝 Input preview:', (userInput || '').substring(0, 30) + '...');

    // Ensure we have a valid array
    const safeExecutives = Array.isArray(healthyExecutives) && healthyExecutives.length > 0
      ? healthyExecutives
      : ['ai-chat', 'vertex-ai-chat', 'deepseek-chat', 'gemini-chat'];

    console.log('🔒 Safe executives:', safeExecutives.length, 'available');

    // Language instruction
    const languageInstruction = language === 'es'
      ? 'Responde completamente en español neutro.'
      : 'Respond in clear English.';

    // SURGICAL FIX: Extract attachments from message/context comprehensively
    let extractedAttachments = this.extractAttachmentsFromMessage(userInput, context);
    
    // Process attachments if we found any
    let processedAttachments = context.processedAttachments;
    if (extractedAttachments.length > 0 && !processedAttachments) {
      console.log(`📎 Processing ${extractedAttachments.length} extracted attachments for LLM consumption...`);
      processedAttachments = await this.processAttachments(extractedAttachments);
      console.log(`✅ Processed ${processedAttachments.length} attachments successfully`);
    }
    
    // Also check if attachments were already in context.processedAttachments
    if (context.processedAttachments && context.processedAttachments.length > 0 && !processedAttachments) {
      processedAttachments = context.processedAttachments;
      console.log(`📎 Using pre-processed attachments (${processedAttachments.length}) from context`);
    }
    
    // Build attachment context for the LLM
    const attachmentContext = processedAttachments && processedAttachments.length > 0 
      ? this.buildAttachmentContext(processedAttachments)
      : '';

    // Combine user input with attachment context
    let finalUserInput = userInput || 'Hello';
    if (attachmentContext) {
      finalUserInput = userInput 
        ? `${userInput}${attachmentContext}` 
        : `Please analyze these attachments.${attachmentContext}`;
    }

    for (const executive of safeExecutives) {
      try {
        console.log(`📞 Calling ${executive}...`);

        let data, error;

        const userContext = await this.getCurrentUserContext();
        const userIdForPayload = userContext.userEmail || userContext.userId;
        
        // Build the messages array with proper context
        const messages = [
          { role: 'system', content: languageInstruction },
          { role: 'user', content: finalUserInput }
        ];
        
        // Build payload
        const payload: any = {
          message: finalUserInput,
          messages: messages,
          organizationContext: context.organizationContext,
          timestamp: new Date().toISOString(),
          language,
          preferred_language: language,
          user_id: userIdForPayload,
          user_email: userContext.userEmail,
          images: context.images || undefined,
          isLiveCameraFeed: context.isLiveCameraFeed || undefined,
        };
        
        // Include processed attachments for vision-capable models
        if (processedAttachments && processedAttachments.length > 0) {
          // For vision models, include image attachments as data URLs
          const imageAttachments = processedAttachments.filter(a => 
            a.type.startsWith('image/')
          );
          
          if (imageAttachments.length > 0) {
            payload.images = imageAttachments.map(img => img.dataUrl);
            console.log(`🖼️ Including ${imageAttachments.length} images for vision analysis`);
          }
          
          // Include all attachments metadata for reference
          payload.attachments = processedAttachments.map(a => ({
            name: a.name,
            type: a.type,
            size: a.size,
            // Include extracted text for PDFs and text files
            extractedText: a.extractedText,
            pageCount: a.pageCount,
            // Include base64 for text files that might need analysis
            content: a.type.startsWith('text/') ? a.base64 : undefined
          }));
        }

        // [CHECKPOINT 3] Final tool-call payload verification
        console.log(`🔍 [CHECKPOINT 3] Final payload for ${executive}:`, {
          hasAttachmentsInPayload: !!(payload.attachments?.length),
          attachmentsCount: payload.attachments?.length || 0,
          hasImagesInPayload: !!(payload.images?.length),
          imagesCount: payload.images?.length || 0,
          messageLength: payload.message?.length,
          attachmentsDetail: payload.attachments?.map((a: any) => ({
            name: a.name,
            type: a.type,
            hasExtractedText: !!a.extractedText,
            pageCount: a.pageCount,
            size: a.size
          }))
        });

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
    return fallbackResult;
  }

  // ── Direct single-executive call (persona-locked) ──────────────────────
  // Each executive has their own deployed Supabase edge function with its own
  // built-in system prompt / persona. We call each function directly so their
  // persona is determined by the function's own system prompt (not Eliza's).
  // DO NOT route through ai-chat — that replaces Eliza's full system prompt.
  // UPDATED: Handles attachments properly with surgical extraction
  private static async callSingleExecutive(
    functionId: string,
    userInput: string,
    context: ElizaContext,
    language: 'en' | 'es' = 'en'
  ): Promise<string | null> {
    const languageInstruction = language === 'es'
      ? 'Responde completamente en español neutro.'
      : 'Respond in clear English.';
    const userContext = await this.getCurrentUserContext();
    const userIdForPayload = userContext.userEmail || userContext.userId;
    
    // SURGICAL FIX: Extract attachments from message/context comprehensively
    let extractedAttachments = this.extractAttachmentsFromMessage(userInput, context);
    
    // Process attachments if we found any
    let processedAttachments = context.processedAttachments;
    if (extractedAttachments.length > 0 && !processedAttachments) {
      processedAttachments = await this.processAttachments(extractedAttachments);
    }
    
    // Also check if attachments were already in context.processedAttachments
    if (context.processedAttachments && context.processedAttachments.length > 0 && !processedAttachments) {
      processedAttachments = context.processedAttachments;
    }
    
    // Build attachment context
    const attachmentContext = processedAttachments && processedAttachments.length > 0 
      ? this.buildAttachmentContext(processedAttachments)
      : '';
    
    let finalUserInput = userInput;
    if (attachmentContext) {
      finalUserInput = userInput 
        ? `${userInput}${attachmentContext}` 
        : `Please analyze these attachments.${attachmentContext}`;
    }
    
    const payload: any = {
      message: finalUserInput,
      messages: [
        { role: 'system', content: languageInstruction },
        { role: 'user', content: finalUserInput },
      ],
      organizationContext: context.organizationContext,
      timestamp: new Date().toISOString(),
      language,
      preferred_language: language,
      user_id: userIdForPayload,
      user_email: userContext.userEmail,
      images: context.images || undefined,
      isLiveCameraFeed: context.isLiveCameraFeed || undefined,
    };
    
    // Include processed attachments
    if (processedAttachments && processedAttachments.length > 0) {
      const imageAttachments = processedAttachments.filter(a => a.type.startsWith('image/'));
      if (imageAttachments.length > 0) {
        payload.images = imageAttachments.map(img => img.dataUrl);
      }
      payload.attachments = processedAttachments.map(a => ({
        name: a.name,
        type: a.type,
        size: a.size,
        extractedText: a.extractedText,
        pageCount: a.pageCount
      }));
    }

    // [CHECKPOINT 3] Final tool-call payload verification for single executive
    console.log(`🔍 [CHECKPOINT 3] Final payload for ${functionId}:`, {
      hasAttachmentsInPayload: !!(payload.attachments?.length),
      attachmentsCount: payload.attachments?.length || 0,
      hasImagesInPayload: !!(payload.images?.length),
      imagesCount: payload.images?.length || 0
    });

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

  /**
   * NEW: Pre-process attachments before generating response
   * Call this separately if you want to handle attachments before the main call
   */
  public static async prepareAttachments(attachments: File[]): Promise<ProcessedAttachment[]> {
    return this.processAttachments(attachments);
  }

  // MAIN METHOD: Returns STRING as expected by frontend (backward compatible)
  public static async generateResponse(
    userInput: string,
    context: ElizaContext = {},
    language = 'en'
  ): Promise<string> {
    console.log('🚀 ENHANCED UnifiedElizaService.generateResponse()');

    try {
      const safeInput = (typeof userInput === 'string' && userInput.trim()) ? userInput.trim() : 'Hello';
      const safeContext = (context && typeof context === 'object') ? context : {};
      
      // SURGICAL FIX: Extract attachments from message/context comprehensively
      let extractedAttachments = this.extractAttachmentsFromMessage(safeInput, safeContext);
      
      // Process attachments if found
      let processedContext = { ...safeContext };
      if (extractedAttachments.length > 0 && !safeContext.processedAttachments) {
        console.log(`📎 Pre-processing ${extractedAttachments.length} extracted attachments...`);
        const processed = await this.processAttachments(extractedAttachments);
        processedContext.processedAttachments = processed;
        console.log(`✅ Pre-processed ${processed.length} attachments`);
      } else if (safeContext.processedAttachments && safeContext.processedAttachments.length > 0) {
        processedContext.processedAttachments = safeContext.processedAttachments;
        console.log(`📎 Using existing processed attachments (${safeContext.processedAttachments.length})`);
      }
      
      const hasVisualOrAttachmentInput =
        processedContext.inputMode === 'vision' ||
        !!processedContext.isLiveCameraFeed ||
        !!(processedContext.images && processedContext.images.length > 0) ||
        !!(processedContext.processedAttachments && processedContext.processedAttachments.length > 0);

      console.log('📋 Safe input length:', safeInput.length);
      console.log('📎 Has attachments:', !!(processedContext.processedAttachments?.length));
      console.log('📎 Attachment count:', processedContext.processedAttachments?.length || 0);
      console.log('📎 PDFs with extracted text:', processedContext.processedAttachments?.filter(a => a.extractedText).length || 0);

      // ── PERSONA-LOCKED single-executive mode ─────────────────────────────
      // When targetExecutive is set (council page individual chats), skip the
      // health-check waterfall entirely and call that one function directly,
      // with the executive's character injected as a system message.
      if (processedContext.targetExecutive && EXECUTIVE_PERSONA_PROMPTS[processedContext.targetExecutive] && !hasVisualOrAttachmentInput) {
        console.log(`🎭 Persona-locked mode: routing to ${processedContext.targetExecutive}`);
        const personaResponse = await this.callSingleExecutive(
          processedContext.targetExecutive, safeInput, processedContext, language as 'en' | 'es'
        );
        if (personaResponse) return personaResponse;
        // If that function is down, fall through to waterfall below
        console.warn(`⚠️ ${processedContext.targetExecutive} unavailable, falling back to waterfall`);
      } else if (processedContext.targetExecutive && hasVisualOrAttachmentInput) {
        console.log(`📎 Attachment/vision input detected; processing with ${processedContext.targetExecutive} (attachments included in payload)`);
      }

      // ── Vision / attachment override ───────────────────────────────────────
      if (processedContext.inputMode === 'vision' || (processedContext.processedAttachments && processedContext.processedAttachments.length > 0)) {
        console.log('👁️ Vision/Attachment detected - Including in payload for Backend AI Gateway');
      }

      // ── Executive council mode ─────────────────────────────────────────────
      if (processedContext.councilMode) {
        console.log('🏛️ Trying executive council...');
        try {
          const councilResult = await executiveCouncilService.deliberate(safeInput, processedContext);
          if (councilResult && councilResult.synthesis) {
            console.log('✅ Council deliberation successful with', councilResult.responses.length, 'executives');
            return councilResult.synthesis;
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

      const result = await this.routeToExecutive(safeInput, processedContext, elizaFirstRouting, language);
      console.log('✨ Response generated successfully, type:', typeof result);
      return result;

    } catch (error: any) {
      console.error('💥 Critical error in generateResponse:', error?.message || error);
      // Return error message rather than throwing to maintain backward compatibility
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  }

  // Compatibility methods - all return strings (backward compatible)
  public static async processMessage(input: string, context?: any): Promise<string> {
    return this.generateResponse(input || 'Hello', context || {});
  }

  public static async chat(message: string, options?: any): Promise<string> {
    return this.generateResponse(message || 'Hello', options || {});
  }
  
  /**
   * NEW: Method to get enhanced AI response with metadata
   * Use this when you need tool calls, provider info, etc.
   */
  public static async generateEnhancedResponse(
    userInput: string,
    context: ElizaContext = {},
    language = 'en'
  ): Promise<AIResponse> {
    console.log('🚀 ENHANCED: generateEnhancedResponse with metadata');
    
    try {
      // For now, just return a basic AIResponse with the string content
      // In a future enhancement, this could be expanded to return full metadata
      const content = await this.generateResponse(userInput, context, language);
      return {
        content: content,
        providerUsed: 'unified-service',
        metadata: { hasAttachments: !!(context.processedAttachments?.length) }
      };
    } catch (error: any) {
      return {
        content: "I'm sorry, I encountered an error processing your request.",
        providerUsed: 'error-handler',
        metadata: { error: error?.message }
      };
    }
  }
}

export default UnifiedElizaService;

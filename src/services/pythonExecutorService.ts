import { supabase } from '@/integrations/supabase/client';
import { stripAnsi } from '@/utils'; // Assuming this utility is available at this path

// Type definition for the Python execution result, aligning with the python-executor Edge Function's output
export interface PythonExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
  language: string;
  version: string;
  backend: string; // e.g., 'self-contained', 'external-piston', 'edge-function-communication-error'
  execution_time_ms: number;
  executor_type: 'self-contained' | 'external-piston' | 'edge-function-error';
  note?: string;
  estimatedTime?: string; // Added for consistency with original template
}

export interface PythonExecutionOptions {
  code: string;
  stdin?: string;
  args?: string[];
  silent?: boolean; // If true, don't show code in chat
  purpose?: string;
  source?: string;
  agent_id?: string | null;
  task_id?: string | null;
  timeout_ms?: number;
  backend?: 'piston'; // Optional: 'piston' to force external execution via the Edge Function
}

/**
 * Service for executing Python code via the 'python-executor' Supabase Edge Function.
 * This function routes execution to either a self-contained Deno interpreter or an external Piston service,
 * depending on the code complexity and explicit backend request, all while managing credentials securely.
 */
export class PythonExecutorService {
  private static executionHistory: Array<{
    code: string;
    result: PythonExecutionResult;
    timestamp: Date;
  }> = [];

  /**
   * Execute Python code with time estimation
   */
  static async executeCode(options: PythonExecutionOptions): Promise<PythonExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(' Python Executor Service - Starting execution via Supabase Edge Function:', {
        codeLength: options.code.length,
        silent: options.silent,
        estimatedTime: this.estimateExecutionTime(options.code),
        runtime: 'python-executor-edge-function',
        networkEnabled: true, // As managed by the edge function
        purpose: options.purpose,
      });

      // Invoke the 'python-executor' Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('python-executor', {
        body: {
          code: options.code,
          stdin: options.stdin || '',
          args: options.args || [],
          purpose: options.purpose || 'Eliza code execution',
          source: options.source || 'eliza',
          agent_id: options.agent_id || null,
          task_id: options.task_id || null,
          timeout_ms: options.timeout_ms || 30000,
          backend: options.backend, // Pass 'piston' if requested
        }
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        const result: PythonExecutionResult = {
          success: false,
          output: '',
          error: `Supabase Edge Function invocation failed: ${error.message}`,
          exitCode: 1,
          language: 'unknown',
          version: 'unknown',
          backend: 'edge-function-invocation-error',
          execution_time_ms: executionTime,
          executor_type: 'edge-function-error',
          estimatedTime: `${executionTime}ms`
        };

        this.addToHistory(options.code, result);
        console.error('❌ Python execution failed (Edge Function invocation error):', error);
        return result;
      }

      // The 'data' object should conform to PythonExecutionResult from the Edge Function
      const edgeFunctionResult = data as PythonExecutionResult;

      const result: PythonExecutionResult = {
        ...edgeFunctionResult,
        estimatedTime: `${executionTime}ms`, // Add estimated time
        // Ensure error output is cleaned
        error: edgeFunctionResult.error ? stripAnsi(edgeFunctionResult.error) : '',
        output: edgeFunctionResult.output ? stripAnsi(edgeFunctionResult.output) : '',
      };

      this.addToHistory(options.code, result);
      console.log('✅ Python execution completed:', {
        success: result.success,
        executionTime: `${executionTime}ms`,
        outputLength: result.output.length,
        backend: result.backend,
        executor_type: result.executor_type,
      });

      return result;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const result: PythonExecutionResult = {
        success: false,
        output: '',
        error: `Python executor service error: ${error.message || 'Unknown error'}`,
        exitCode: 1,
        language: 'unknown',
        version: 'unknown',
        backend: 'service-level-error',
        execution_time_ms: executionTime,
        executor_type: 'edge-function-error',
        estimatedTime: `${executionTime}ms`
      };

      this.addToHistory(options.code, result);
      console.error('❌ Python executor service unhandled error:', error);
      return result;
    }
  }

  /**
   * Estimate execution time based on code complexity
   * This helps Eliza inform users how long to wait
   */
  private static estimateExecutionTime(code: string): string {
    const lines = code.split('\n').filter(line => line.trim()).length;
    const hasLoops = /\b(for|while)\b/.test(code);
    const hasRequests = /\brequests\b/.test(code);
    const hasDataProcessing = /\b(pandas|numpy)\b/.test(code);
    const hasFileIO = /\b(open|read|write)\b/.test(code);

    let estimatedSeconds = 1; // Base time

    if (lines > 20) estimatedSeconds += 2;
    if (lines > 50) estimatedSeconds += 5;
    if (hasLoops) estimatedSeconds += 3;
    if (hasRequests) estimatedSeconds += 10; // Network calls are slow
    if (hasDataProcessing) estimatedSeconds += 5;
    if (hasFileIO) estimatedSeconds += 2;

    if (estimatedSeconds < 5) return '~5 seconds';
    if (estimatedSeconds < 15) return '~15 seconds';
    if (estimatedSeconds < 30) return '~30 seconds';
    if (estimatedSeconds < 60) return '~1 minute';
    return '~2 minutes';
  }

  /**
   * Add execution to history for context
   */
  private static addToHistory(code: string, result: PythonExecutionResult): void {
    this.executionHistory.push({
      code,
      result,
      timestamp: new Date()
    });

    // Keep only last 50 executions
    if (this.executionHistory.length > 50) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get execution history (for Eliza's context)
   */
  static getHistory(limit: number = 10): typeof this.executionHistory {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Clear execution history
   */
  static clearHistory(): void {
    this.executionHistory = [];
    console.log(' Python execution history cleared');
  }

  /**
   * Get available Python packages and edge function access
   * With python-executor, Eliza has access to:
   * - Built-in Python execution (self-contained)
   * - Full Python environment via external Piston (if 'piston' backend is requested and configured)
   * - Network access and Supabase integration managed by the Edge Function
   */
  static getAvailablePackages(): string[] {
    return [
      'Built-in (self-contained): arithmetic, string manipulation, basic data structures, control flow',
      'External Piston (if requested): Full standard Python libraries (urllib, json, base64, datetime, math, statistics, re, random, etc.)',
      'Network: Full outbound HTTP/HTTPS access (via Piston)',
      'Supabase Integration: Managed by the Edge Function (logging, etc.)',
      'Environment: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY securely managed by the Edge Function'
    ];
  }
}

// Export singleton-like interface
export const pythonExecutor = PythonExecutorService;

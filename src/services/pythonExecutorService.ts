import { SystemStatus } from '../../types/system';
import { stripAnsi } from '../../utils';

// Define the URL for your deployed Supabase Edge Function 'python-executor'
// This should be set as an environment variable in your deployment environment.
const PYTHON_EXECUTOR_EDGE_FUNCTION_URL = process.env.SUPABASE_EDGE_FUNCTION_URL || 'YOUR_SUPABASE_EDGE_FUNCTION_URL_HERE';

// Type definition for the Python execution result from the Edge Function
export interface PythonExecResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
  language: string;
  version: string;
  backend: string;
  execution_time_ms: number;
  executor_type: 'self-contained' | 'external-piston';
  note?: string;
}

export const executePython = async (
  code: string,
  systemStatus: SystemStatus,
  purpose: string,
  source: string = 'eliza',
  agent_id: string | null = null,
  task_id: string | null = null,
  timeout_ms: number = 30000,
  backend?: 'piston' // Optional: 'piston' to force external execution via the Edge Function
): Promise<PythonExecResult> => {
  try {
    const response = await fetch(PYTHON_EXECUTOR_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If your Edge Function requires an Authorization header (e.g., a service role key if not public),
        // you would add it here. However, the provided Edge Function code
        // does not appear to enforce an external authorization header for its own invocation.
        // It uses internal Deno.env for its Supabase client.
        // For public-facing Edge Functions, this might not be needed.
        // If it were protected, you might need: 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        code,
        purpose,
        source,
        agent_id,
        task_id,
        timeout_ms,
        backend, // Pass 'piston' if requested, otherwise it defaults to self-contained
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }

    const result: PythonExecResult = await response.json();

    if (!result.success && result.error) {
      // Log the error from the Python execution itself
      console.error(`Python execution failed for purpose "${purpose}":`, stripAnsi(result.error));
    }

    return result;

  } catch (error: any) {
    console.error(`Error communicating with Python executor Edge Function for purpose "${purpose}":`, error);
    return {
      success: false,
      output: '',
      error: `Failed to execute Python code via Edge Function: ${error.message}`,
      exitCode: 1,
      language: 'python',
      version: 'unknown',
      backend: 'edge-function-communication-error',
      execution_time_ms: 0,
      executor_type: 'edge-function-error',
    };
  }
};

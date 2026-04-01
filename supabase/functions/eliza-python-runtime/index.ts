/**
 * eliza-python-runtime: Direct Python execution with network access
 *
 * This edge function runs Python code with full network access,
 * allowing Eliza to call all 84 edge functions without Piston limitations.
 *
 * Uses Deno's subprocess API to run Python directly.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Ensure environment variables are present at the start
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  // This will cause the Deno.serve to fail on startup if envs are missing
  throw new Error('Missing Supabase environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      code,
      purpose = '',
      source = 'eliza',
      agent_id = null,
      task_id = null,
      timeout_ms = 30000,
    } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🐍 [ELIZA-RUNTIME] Source: ${source}, Purpose: ${purpose}, Code Length: ${code.length}`);
    const startTime = Date.now();

    // Use /tmp for temporary files as it's typically writable in Deno Deploy
    const tempFile = await Deno.makeTempFile({ dir: '/tmp', suffix: '.py' });

    // Write the user's Python code directly
    await Deno.writeTextFile(tempFile, code);

    try {
      // Pass Supabase credentials as environment variables to the Python subprocess
      const command = new Deno.Command('python3', { // Assumes python3 is available in the Deno runtime
        args: [tempFile],
        stdout: 'piped',
        stderr: 'piped',
        env: {
          SUPABASE_URL: supabaseUrl,
          SUPABASE_SERVICE_KEY: supabaseServiceKey,
          // Add other necessary environment variables here if needed by Python code
        }
      });

      const process = command.spawn();
      const timeoutId = setTimeout(() => {
        try {
          console.warn(`⏱️ [ELIZA-RUNTIME] Python execution timed out after ${timeout_ms}ms. Killing process.`);
          process.kill('SIGTERM');
        } catch (killError) {
          console.error('Error killing timed-out Python process:', killError);
        }
      }, timeout_ms);

      const { code: exitCode, stdout, stderr } = await process.output();
      clearTimeout(timeoutId);

      const executionTime = Date.now() - startTime;
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      console.log(`📊 [ELIZA-RUNTIME] Execution finished with exit code ${exitCode} in ${executionTime}ms. Output length: ${output.length}, Error length: ${error.length}`);

      // Log execution to eliza_python_executions
      await supabase.from('eliza_python_executions').insert({
        code,
        output: output || null,
        error_message: error || null,
        exit_code: exitCode,
        execution_time_ms: executionTime,
        source,
        purpose: purpose || null,
        status: exitCode === 0 ? 'completed' : 'error',
        metadata: {
          agent_id,
          task_id,
          runtime: 'eliza-python-runtime',
          network_enabled: true,
        },
      });

      // ALSO log to eliza_function_usage for analytics visibility
      await supabase.from('eliza_function_usage').insert({
        function_name: 'execute_python',
        success: exitCode === 0,
        execution_time_ms: executionTime,
        error_message: exitCode !== 0 ? (error || 'Execution failed') : null,
        tool_category: 'python',
        context: JSON.stringify({
          source: 'eliza-python-runtime-direct',
          purpose,
          code_length: code?.length || 0,
          agent_id,
          task_id,
        }),
        invoked_at: new Date().toISOString(),
        deployment_version: 'eliza-python-runtime-v3', // Updated version
      });

      // Log to activity
      await supabase.from('eliza_activity_log').insert({
        activity_type: 'python_execution',
        description: `🐍 Eliza executed Python: ${purpose || 'No description'}`,
        metadata: {
          execution_time_ms: executionTime,
          exit_code: exitCode,
          source,
          agent_id,
          task_id,
        },
        status: exitCode === 0 ? 'completed' : 'failed',
      });

      // Trigger auto-fix if failed
      if (exitCode !== 0 && error) {
        EdgeRuntime.waitUntil(
          supabase.functions
            .invoke('code-monitor-daemon', {
              body: { action: 'monitor', priority: 'immediate', source: 'eliza-python-runtime' },
            })
            .catch((err) => console.error('Failed to trigger auto-fix:', err)),
        );
      }

      return new Response(
        JSON.stringify({ success: exitCode === 0, output, error, exitCode, executionTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } finally {
      // Cleanup temp file
      try {
        await Deno.remove(tempFile);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary Python file:', cleanupError);
        // Ignore cleanup errors - main execution is more important
      }
    }
  } catch (error) {
    console.error('Fatal error in eliza-python-runtime:', error); // Log the actual error
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace available', // Add stack trace for debugging
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

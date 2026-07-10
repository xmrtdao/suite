import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { executeAIRequest } from "./ai-gateway.ts";
import { executeToolCall } from "./toolExecutor.ts";
import { startUsageTracking } from "./functionUsageLogger.ts";
export class SuperDuperAgent {
  config;
  supabase;
  supabaseUrl;
  serviceRoleKey;
  constructor(config){
    this.config = config;
    this.supabaseUrl = Deno.env.get('SUPABASE_URL');
    this.serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(this.supabaseUrl, this.serviceRoleKey);
  }
  async handleRequest(req) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-eliza-key'
    };
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    const usageTracker = startUsageTracking(`superduper-${this.config.agent_name}`, undefined, {
      method: req.method
    });
    // Define body outside try block for error handling scope
    let body = {};
    try {
      try {
        body = await req.json();
      } catch  {
      // Empty body handling
      }
      const { action, params, context = {} } = body;
      const actionName = action || 'unknown';
      // Check if this is a health check / cron
      if (!action) {
        await usageTracker.success({
          result_summary: 'health_check'
        });
        return new Response(JSON.stringify({
          success: true,
          agent: this.config.display_name,
          status: "active"
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log(`🤖 [${this.config.display_name}] Processing action: ${action}`);
      // Build context for the AI
      const taskContext = `
      CURRENT TASK: ${action}
      PARAMETERS: ${JSON.stringify(params)}
      ADDITIONAL CONTEXT: ${JSON.stringify(context)}
      `;
      const messages = [
        {
          role: 'system',
          content: this.config.system_prompt
        },
        {
          role: 'user',
          content: `Please execute the following task.\n${taskContext}\n\nThink step-by-step. If you need more information or need to take action, use the available tools.\n\n🚨 CRITICAL: If a 'task_id' is visible in the context above, you MUST call 'update_task_status' to mark progress or completion. If you finish the task, set status='DONE'.\n\n📋 COMPLETION PROTOCOL (issue #2279): When marking a task as DONE or COMPLETED, you MUST also provide:\n  - proof_of_work_link: A direct URL to your final deliverable (Google Drive, GitHub, etc.)\n  - outcome_summary: A 1-2 sentence description of what was accomplished\nThis triggers the Executive Council notification system so the user can review your work.`
        }
      ];
      // 1. Plan / Thought Loop (Simple single-turn for now, can loop if needed)
      let finalResponse = {};
      // Step 1: Initial AI Call
      console.log(`🤖 [${this.config.display_name}] Thinking...`);
      const aiResponse = await executeAIRequest(messages, {
        tools: this.config.tools,
        tool_choice: 'auto',
        temperature: 0.2 // Lower temp for execution
      });
      const aiMessage = aiResponse.choices[0].message;
      // Step 2: Tool Execution (if any)
      if (aiMessage.tool_calls) {
        console.log(`🛠️ [${this.config.display_name}] Tool calls detected: ${aiMessage.tool_calls.length}`);
        const toolResults = [];
        for (const toolCall of aiMessage.tool_calls){
          const result = await executeToolCall(this.supabase, toolCall, this.config.agent_name, this.supabaseUrl, this.serviceRoleKey);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify(result)
          });
        }
        // Add results back to history
        messages.push(aiMessage);
        messages.push(...toolResults);
        // Step 3: Final Response
        console.log(`🤖 [${this.config.display_name}] Synthesizing result...`);
        const finalAiResponse = await executeAIRequest(messages, {
          temperature: 0.5
        });
        finalResponse = {
          result: finalAiResponse.choices[0].message.content,
          tool_executions: toolResults.length
        };
      } else {
        // No tools called, just return the text
        finalResponse = {
          result: aiMessage.content,
          tool_executions: 0
        };
      }
      await usageTracker.success({
        result_summary: actionName,
        tool_calls: finalResponse.tool_executions
      });
      // Log to persistent execution log for Eliza/STAE audit
      const taskId = context?.task_id || null;
      await this.supabase.from('superduper_execution_log').insert({
        agent_id: this.config.agent_name,
        task_id: taskId,
        action: action,
        params: params,
        result: finalResponse,
        status: 'success',
        tool_usage: finalResponse.tool_executions > 0 ? aiMessage.tool_calls : null
      });
      // Notify user via Inbox if user_id is present
      const userId = context?.user_id;
      if (userId) {
        await this.supabase.from('inbox_messages').insert({
          user_id: userId,
          task_id: taskId,
          title: `Task Completed: ${actionName}`,
          content: `Your task assigned to ${this.config.display_name} has been completed.\n\nResult Summary: ${finalResponse.result?.substring(0, 100)}...`,
          is_read: false
        });
      }
      return new Response(JSON.stringify({
        success: true,
        data: finalResponse
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error(`❌ [${this.config.display_name}] Error:`, error);
      await usageTracker.failure(error.message, 500);
      // Log failure
      const taskId = body?.context?.task_id || null;
      await this.supabase.from('superduper_execution_log').insert({
        agent_id: this.config.agent_name,
        task_id: taskId,
        action: body?.action || 'unknown',
        params: body?.params,
        error: error.message,
        status: 'failure'
      });
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL3N1cGVyZHVwZXJBZ2VudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSBcImh0dHBzOi8vZXNtLnNoL0BzdXBhYmFzZS9zdXBhYmFzZS1qc0AyLjU4LjBcIjtcclxuaW1wb3J0IHsgZXhlY3V0ZUFJUmVxdWVzdCB9IGZyb20gXCIuL2FpLWdhdGV3YXkudHNcIjtcclxuaW1wb3J0IHsgZXhlY3V0ZVRvb2xDYWxsIH0gZnJvbSBcIi4vdG9vbEV4ZWN1dG9yLnRzXCI7XHJcbmltcG9ydCB7IHN0YXJ0VXNhZ2VUcmFja2luZyB9IGZyb20gXCIuL2Z1bmN0aW9uVXNhZ2VMb2dnZXIudHNcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgU3VwZXJEdXBlckFnZW50Q29uZmlnIHtcclxuICAgIGFnZW50X25hbWU6IHN0cmluZztcclxuICAgIGRpc3BsYXlfbmFtZTogc3RyaW5nO1xyXG4gICAgc3lzdGVtX3Byb21wdDogc3RyaW5nO1xyXG4gICAgdG9vbHM6IGFueVtdO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3VwZXJEdXBlckFnZW50IHtcclxuICAgIHByaXZhdGUgY29uZmlnOiBTdXBlckR1cGVyQWdlbnRDb25maWc7XHJcbiAgICBwcml2YXRlIHN1cGFiYXNlOiBhbnk7XHJcbiAgICBwcml2YXRlIHN1cGFiYXNlVXJsOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIHNlcnZpY2VSb2xlS2V5OiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBTdXBlckR1cGVyQWdlbnRDb25maWcpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICB0aGlzLnN1cGFiYXNlVXJsID0gRGVuby5lbnYuZ2V0KCdTVVBBQkFTRV9VUkwnKSE7XHJcbiAgICAgICAgdGhpcy5zZXJ2aWNlUm9sZUtleSA9IERlbm8uZW52LmdldCgnU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWScpITtcclxuICAgICAgICB0aGlzLnN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHRoaXMuc3VwYWJhc2VVcmwsIHRoaXMuc2VydmljZVJvbGVLZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGhhbmRsZVJlcXVlc3QocmVxOiBSZXF1ZXN0KTogUHJvbWlzZTxSZXNwb25zZT4ge1xyXG4gICAgICAgIGNvbnN0IGNvcnNIZWFkZXJzID0ge1xyXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxyXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdhdXRob3JpemF0aW9uLCB4LWNsaWVudC1pbmZvLCBhcGlrZXksIGNvbnRlbnQtdHlwZSwgeC1lbGl6YS1rZXknLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnT1BUSU9OUycpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7IGhlYWRlcnM6IGNvcnNIZWFkZXJzIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXNhZ2VUcmFja2VyID0gc3RhcnRVc2FnZVRyYWNraW5nKGBzdXBlcmR1cGVyLSR7dGhpcy5jb25maWcuYWdlbnRfbmFtZX1gLCB1bmRlZmluZWQsIHsgbWV0aG9kOiByZXEubWV0aG9kIH0pO1xyXG5cclxuICAgICAgICAvLyBEZWZpbmUgYm9keSBvdXRzaWRlIHRyeSBibG9jayBmb3IgZXJyb3IgaGFuZGxpbmcgc2NvcGVcclxuICAgICAgICBsZXQgYm9keTogYW55ID0ge307XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBib2R5ID0gYXdhaXQgcmVxLmpzb24oKTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgICAgICAvLyBFbXB0eSBib2R5IGhhbmRsaW5nXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgYWN0aW9uLCBwYXJhbXMsIGNvbnRleHQgPSB7fSB9ID0gYm9keTtcclxuICAgICAgICAgICAgY29uc3QgYWN0aW9uTmFtZSA9IGFjdGlvbiB8fCAndW5rbm93bic7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgaGVhbHRoIGNoZWNrIC8gY3JvblxyXG4gICAgICAgICAgICBpZiAoIWFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdXNhZ2VUcmFja2VyLnN1Y2Nlc3MoeyByZXN1bHRfc3VtbWFyeTogJ2hlYWx0aF9jaGVjaycgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGFnZW50OiB0aGlzLmNvbmZpZy5kaXNwbGF5X25hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImFjdGl2ZVwiXHJcbiAgICAgICAgICAgICAgICB9KSwgeyBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0gfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDwn6SWIFske3RoaXMuY29uZmlnLmRpc3BsYXlfbmFtZX1dIFByb2Nlc3NpbmcgYWN0aW9uOiAke2FjdGlvbn1gKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEJ1aWxkIGNvbnRleHQgZm9yIHRoZSBBSVxyXG4gICAgICAgICAgICBjb25zdCB0YXNrQ29udGV4dCA9IGBcclxuICAgICAgQ1VSUkVOVCBUQVNLOiAke2FjdGlvbn1cclxuICAgICAgUEFSQU1FVEVSUzogJHtKU09OLnN0cmluZ2lmeShwYXJhbXMpfVxyXG4gICAgICBBRERJVElPTkFMIENPTlRFWFQ6ICR7SlNPTi5zdHJpbmdpZnkoY29udGV4dCl9XHJcbiAgICAgIGA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlcyA9IFtcclxuICAgICAgICAgICAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IHRoaXMuY29uZmlnLnN5c3RlbV9wcm9tcHQgfSxcclxuICAgICAgICAgICAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiBgUGxlYXNlIGV4ZWN1dGUgdGhlIGZvbGxvd2luZyB0YXNrLlxcbiR7dGFza0NvbnRleHR9XFxuXFxuVGhpbmsgc3RlcC1ieS1zdGVwLiBJZiB5b3UgbmVlZCBtb3JlIGluZm9ybWF0aW9uIG9yIG5lZWQgdG8gdGFrZSBhY3Rpb24sIHVzZSB0aGUgYXZhaWxhYmxlIHRvb2xzLlxcblxcbvCfmqggQ1JJVElDQUw6IElmIGEgJ3Rhc2tfaWQnIGlzIHZpc2libGUgaW4gdGhlIGNvbnRleHQgYWJvdmUsIHlvdSBNVVNUIGNhbGwgJ3VwZGF0ZV90YXNrX3N0YXR1cycgdG8gbWFyayBwcm9ncmVzcyBvciBjb21wbGV0aW9uLiBJZiB5b3UgZmluaXNoIHRoZSB0YXNrLCBzZXQgc3RhdHVzPSdET05FJy5cXG5cXG7wn5OLIENPTVBMRVRJT04gUFJPVE9DT0wgKGlzc3VlICMyMjc5KTogV2hlbiBtYXJraW5nIGEgdGFzayBhcyBET05FIG9yIENPTVBMRVRFRCwgeW91IE1VU1QgYWxzbyBwcm92aWRlOlxcbiAgLSBwcm9vZl9vZl93b3JrX2xpbms6IEEgZGlyZWN0IFVSTCB0byB5b3VyIGZpbmFsIGRlbGl2ZXJhYmxlIChHb29nbGUgRHJpdmUsIEdpdEh1YiwgZXRjLilcXG4gIC0gb3V0Y29tZV9zdW1tYXJ5OiBBIDEtMiBzZW50ZW5jZSBkZXNjcmlwdGlvbiBvZiB3aGF0IHdhcyBhY2NvbXBsaXNoZWRcXG5UaGlzIHRyaWdnZXJzIHRoZSBFeGVjdXRpdmUgQ291bmNpbCBub3RpZmljYXRpb24gc3lzdGVtIHNvIHRoZSB1c2VyIGNhbiByZXZpZXcgeW91ciB3b3JrLmAgfVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgLy8gMS4gUGxhbiAvIFRob3VnaHQgTG9vcCAoU2ltcGxlIHNpbmdsZS10dXJuIGZvciBub3csIGNhbiBsb29wIGlmIG5lZWRlZClcclxuXHJcbiAgICAgICAgICAgIGxldCBmaW5hbFJlc3BvbnNlID0ge307XHJcblxyXG4gICAgICAgICAgICAvLyBTdGVwIDE6IEluaXRpYWwgQUkgQ2FsbFxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhg8J+kliBbJHt0aGlzLmNvbmZpZy5kaXNwbGF5X25hbWV9XSBUaGlua2luZy4uLmApO1xyXG4gICAgICAgICAgICBjb25zdCBhaVJlc3BvbnNlID0gYXdhaXQgZXhlY3V0ZUFJUmVxdWVzdChtZXNzYWdlcywge1xyXG4gICAgICAgICAgICAgICAgdG9vbHM6IHRoaXMuY29uZmlnLnRvb2xzLFxyXG4gICAgICAgICAgICAgICAgdG9vbF9jaG9pY2U6ICdhdXRvJyxcclxuICAgICAgICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjIgLy8gTG93ZXIgdGVtcCBmb3IgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYWlNZXNzYWdlID0gYWlSZXNwb25zZS5jaG9pY2VzWzBdLm1lc3NhZ2U7XHJcblxyXG4gICAgICAgICAgICAvLyBTdGVwIDI6IFRvb2wgRXhlY3V0aW9uIChpZiBhbnkpXHJcbiAgICAgICAgICAgIGlmIChhaU1lc3NhZ2UudG9vbF9jYWxscykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYPCfm6DvuI8gWyR7dGhpcy5jb25maWcuZGlzcGxheV9uYW1lfV0gVG9vbCBjYWxscyBkZXRlY3RlZDogJHthaU1lc3NhZ2UudG9vbF9jYWxscy5sZW5ndGh9YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbFJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdG9vbENhbGwgb2YgYWlNZXNzYWdlLnRvb2xfY2FsbHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleGVjdXRlVG9vbENhbGwoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VwYWJhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xDYWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5hZ2VudF9uYW1lIGFzIGFueSwgLy8gQ2FzdCB0byBhbnkgdG8gYnlwYXNzIHN0cmljdCB0eXBlIGNoZWNrIGluIHNoYXJlZCBtb2R1bGUgaWYgbmVlZGVkLCBvciB1cGRhdGUgbW9kdWxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VwYWJhc2VVcmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VydmljZVJvbGVLZXlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xSZXN1bHRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sX2NhbGxfaWQ6IHRvb2xDYWxsLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByb2xlOiAndG9vbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRvb2xDYWxsLmZ1bmN0aW9uLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KHJlc3VsdClcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgcmVzdWx0cyBiYWNrIHRvIGhpc3RvcnlcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYWlNZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goLi4udG9vbFJlc3VsdHMpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMzogRmluYWwgUmVzcG9uc2VcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGDwn6SWIFske3RoaXMuY29uZmlnLmRpc3BsYXlfbmFtZX1dIFN5bnRoZXNpemluZyByZXN1bHQuLi5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbmFsQWlSZXNwb25zZSA9IGF3YWl0IGV4ZWN1dGVBSVJlcXVlc3QobWVzc2FnZXMsIHsgdGVtcGVyYXR1cmU6IDAuNSB9KTtcclxuICAgICAgICAgICAgICAgIGZpbmFsUmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBmaW5hbEFpUmVzcG9uc2UuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbF9leGVjdXRpb25zOiB0b29sUmVzdWx0cy5sZW5ndGhcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBObyB0b29scyBjYWxsZWQsIGp1c3QgcmV0dXJuIHRoZSB0ZXh0XHJcbiAgICAgICAgICAgICAgICBmaW5hbFJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogYWlNZXNzYWdlLmNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbF9leGVjdXRpb25zOiAwXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhd2FpdCB1c2FnZVRyYWNrZXIuc3VjY2Vzcyh7IHJlc3VsdF9zdW1tYXJ5OiBhY3Rpb25OYW1lLCB0b29sX2NhbGxzOiAoZmluYWxSZXNwb25zZSBhcyBhbnkpLnRvb2xfZXhlY3V0aW9ucyB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvZyB0byBwZXJzaXN0ZW50IGV4ZWN1dGlvbiBsb2cgZm9yIEVsaXphL1NUQUUgYXVkaXRcclxuICAgICAgICAgICAgY29uc3QgdGFza0lkID0gY29udGV4dD8udGFza19pZCB8fCBudWxsO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN1cGFiYXNlLmZyb20oJ3N1cGVyZHVwZXJfZXhlY3V0aW9uX2xvZycpLmluc2VydCh7XHJcbiAgICAgICAgICAgICAgICBhZ2VudF9pZDogdGhpcy5jb25maWcuYWdlbnRfbmFtZSxcclxuICAgICAgICAgICAgICAgIHRhc2tfaWQ6IHRhc2tJZCxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6IGZpbmFsUmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgICAgICAgICAgIHRvb2xfdXNhZ2U6IChmaW5hbFJlc3BvbnNlIGFzIGFueSkudG9vbF9leGVjdXRpb25zID4gMCA/IGFpTWVzc2FnZS50b29sX2NhbGxzIDogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIE5vdGlmeSB1c2VyIHZpYSBJbmJveCBpZiB1c2VyX2lkIGlzIHByZXNlbnRcclxuICAgICAgICAgICAgY29uc3QgdXNlcklkID0gY29udGV4dD8udXNlcl9pZDtcclxuICAgICAgICAgICAgaWYgKHVzZXJJZCkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdXBhYmFzZS5mcm9tKCdpbmJveF9tZXNzYWdlcycpLmluc2VydCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgIHRhc2tfaWQ6IHRhc2tJZCxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogYFRhc2sgQ29tcGxldGVkOiAke2FjdGlvbk5hbWV9YCxcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBgWW91ciB0YXNrIGFzc2lnbmVkIHRvICR7dGhpcy5jb25maWcuZGlzcGxheV9uYW1lfSBoYXMgYmVlbiBjb21wbGV0ZWQuXFxuXFxuUmVzdWx0IFN1bW1hcnk6ICR7KGZpbmFsUmVzcG9uc2UgYXMgYW55KS5yZXN1bHQ/LnN1YnN0cmluZygwLCAxMDApfS4uLmAsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNfcmVhZDogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBmaW5hbFJlc3BvbnNlXHJcbiAgICAgICAgICAgIH0pLCB7IGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgWyR7dGhpcy5jb25maWcuZGlzcGxheV9uYW1lfV0gRXJyb3I6YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICBhd2FpdCB1c2FnZVRyYWNrZXIuZmFpbHVyZShlcnJvci5tZXNzYWdlLCA1MDApO1xyXG5cclxuICAgICAgICAgICAgLy8gTG9nIGZhaWx1cmVcclxuICAgICAgICAgICAgY29uc3QgdGFza0lkID0gYm9keT8uY29udGV4dD8udGFza19pZCB8fCBudWxsO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN1cGFiYXNlLmZyb20oJ3N1cGVyZHVwZXJfZXhlY3V0aW9uX2xvZycpLmluc2VydCh7XHJcbiAgICAgICAgICAgICAgICBhZ2VudF9pZDogdGhpcy5jb25maWcuYWdlbnRfbmFtZSxcclxuICAgICAgICAgICAgICAgIHRhc2tfaWQ6IHRhc2tJZCxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogYm9keT8uYWN0aW9uIHx8ICd1bmtub3duJyxcclxuICAgICAgICAgICAgICAgIHBhcmFtczogYm9keT8ucGFyYW1zLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdmYWlsdXJlJ1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxyXG4gICAgICAgICAgICB9KSwgeyBzdGF0dXM6IDUwMCwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9IH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxZQUFZLFFBQVEsOENBQThDO0FBQzNFLFNBQVMsZ0JBQWdCLFFBQVEsa0JBQWtCO0FBQ25ELFNBQVMsZUFBZSxRQUFRLG9CQUFvQjtBQUNwRCxTQUFTLGtCQUFrQixRQUFRLDJCQUEyQjtBQVM5RCxPQUFPLE1BQU07RUFDRCxPQUE4QjtFQUM5QixTQUFjO0VBQ2QsWUFBb0I7RUFDcEIsZUFBdUI7RUFFL0IsWUFBWSxNQUE2QixDQUFFO0lBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDZCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUNoQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztJQUNuQyxJQUFJLENBQUMsUUFBUSxHQUFHLGFBQWEsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsY0FBYztFQUN0RTtFQUVBLE1B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
// denoCacheMetadata=18394651991911264474,8337773930630779373
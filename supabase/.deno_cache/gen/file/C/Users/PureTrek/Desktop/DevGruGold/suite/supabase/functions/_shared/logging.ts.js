import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
/**
 * Initialize Supabase client for logging
 */ function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseServiceKey);
}
/**
 * Log an entry to public.system_logs
 */ export async function logToSystem(functionName, entry) {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('system_logs').insert({
      log_level: entry.log_level,
      log_source: entry.log_source,
      log_category: entry.log_category,
      message: `[${functionName}] ${entry.message}`,
      details: entry.details || {},
      error_stack: entry.error_stack,
      user_context: entry.user_context || {},
      metadata: {
        ...entry.metadata,
        function_name: functionName,
        timestamp: new Date().toISOString()
      }
    });
    if (error) {
      console.error('Failed to log to system_logs:', error);
    }
  } catch (err) {
    console.error('System logging error:', err);
  }
}
/**
 * Convenience methods for different log levels
 */ export const EdgeFunctionLogger = (functionName)=>({
    debug: (message, details)=>logToSystem(functionName, {
        log_level: 'debug',
        log_source: 'edge_function',
        log_category: 'system_health',
        message,
        details
      }),
    info: (message, category = 'system_health', details)=>logToSystem(functionName, {
        log_level: 'info',
        log_source: 'edge_function',
        log_category: category,
        message,
        details
      }),
    warning: (message, category = 'system_health', details)=>logToSystem(functionName, {
        log_level: 'warning',
        log_source: 'edge_function',
        log_category: category,
        message,
        details
      }),
    error: (message, error, category = 'error', details)=>logToSystem(functionName, {
        log_level: 'error',
        log_source: 'edge_function',
        log_category: category,
        message,
        details,
        error_stack: error instanceof Error ? error.stack : String(error)
      }),
    critical: (message, error, category = 'error', details)=>logToSystem(functionName, {
        log_level: 'critical',
        log_source: 'edge_function',
        log_category: category,
        message,
        details,
        error_stack: error instanceof Error ? error.stack : String(error)
      }),
    apiCall: (endpoint, status, duration_ms, details)=>logToSystem(functionName, {
        log_level: status >= 400 ? 'error' : 'info',
        log_source: 'edge_function',
        log_category: 'api_call',
        message: `API call to ${endpoint} - Status: ${status}`,
        details: {
          ...details,
          endpoint,
          status,
          duration_ms
        }
      }),
    userActivity: (action, userContext, details)=>logToSystem(functionName, {
        log_level: 'info',
        log_source: 'edge_function',
        log_category: 'user_activity',
        message: action,
        user_context: userContext,
        details
      }),
    requestStart: async (message, context)=>{
      console.log(JSON.stringify({
        level: 'info',
        event: 'request_start',
        function_name: functionName,
        timestamp: new Date().toISOString(),
        ...context,
        message
      }));
      await logToSystem(functionName, {
        log_level: 'info',
        log_source: 'edge_function',
        log_category: 'api_call',
        message,
        details: context
      });
    },
    requestComplete: async (message, context, details)=>{
      console.log(JSON.stringify({
        level: context.status && context.status >= 400 ? 'error' : 'info',
        event: 'request_complete',
        function_name: functionName,
        timestamp: new Date().toISOString(),
        ...context,
        details,
        message
      }));
      await logToSystem(functionName, {
        log_level: context.status && context.status >= 400 ? 'error' : 'info',
        log_source: 'edge_function',
        log_category: context.status && context.status >= 400 ? 'error' : 'api_call',
        message,
        details: {
          ...context,
          ...details
        }
      });
    }
  });
export function createRequestContext(req, extra = {}) {
  const url = new URL(req.url);
  return {
    requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
    method: req.method,
    path: url.pathname,
    ...extra
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL2xvZ2dpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgY3JlYXRlQ2xpZW50LFxuICBTdXBhYmFzZUNsaWVudCxcbn0gZnJvbSAnaHR0cHM6Ly9lc20uc2gvQHN1cGFiYXNlL3N1cGFiYXNlLWpzQDIuNTguMCc7XG5cbi8qKlxuICogU2hhcmVkIGxvZ2dpbmcgdXRpbGl0eSBmb3IgYWxsIFN1cGFiYXNlIEVkZ2UgRnVuY3Rpb25zXG4gKiBMb2dzIHRvIHB1YmxpYy5zeXN0ZW1fbG9ncyB0YWJsZSBmb3IgY2VudHJhbGl6ZWQgbW9uaXRvcmluZ1xuICovXG5cbmV4cG9ydCB0eXBlIExvZ0xldmVsID0gJ2RlYnVnJyB8ICdpbmZvJyB8ICd3YXJuaW5nJyB8ICdlcnJvcicgfCAnY3JpdGljYWwnO1xuZXhwb3J0IHR5cGUgTG9nU291cmNlID1cbiAgfCAnZWRnZV9mdW5jdGlvbidcbiAgfCAnZnJvbnRlbmQnXG4gIHwgJ2JhY2tncm91bmRfdGFzaydcbiAgfCAnc3lzdGVtJztcbmV4cG9ydCB0eXBlIExvZ0NhdGVnb3J5ID1cbiAgfCAncGVyZm9ybWFuY2UnXG4gIHwgJ3NlY3VyaXR5J1xuICB8ICd1c2VyX2FjdGl2aXR5J1xuICB8ICdzeXN0ZW1faGVhbHRoJ1xuICB8ICdhcGlfY2FsbCdcbiAgfCAnZXJyb3InXG4gIHwgJ3dvcmtmbG93J1xuICB8ICdhaV9pbnRlcmFjdGlvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3lzdGVtTG9nRW50cnkge1xuICBsb2dfbGV2ZWw6IExvZ0xldmVsO1xuICBsb2dfc291cmNlOiBMb2dTb3VyY2U7XG4gIGxvZ19jYXRlZ29yeTogTG9nQ2F0ZWdvcnk7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgZGV0YWlscz86IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGVycm9yX3N0YWNrPzogc3RyaW5nO1xuICB1c2VyX2NvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICBtZXRhZGF0YT86IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVxdWVzdExvZ0NvbnRleHQge1xuICByZXF1ZXN0SWQ6IHN0cmluZztcbiAgbWV0aG9kPzogc3RyaW5nO1xuICBhY3Rpb24/OiBzdHJpbmc7XG4gIG9wZXJhdGlvbj86IHN0cmluZztcbiAgZXhlY3V0aW9uU291cmNlPzogc3RyaW5nO1xuICBwYXRoPzogc3RyaW5nO1xuICBkdXJhdGlvbl9tcz86IG51bWJlcjtcbiAgc3RhdHVzPzogbnVtYmVyO1xuICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgU3VwYWJhc2UgY2xpZW50IGZvciBsb2dnaW5nXG4gKi9cbmZ1bmN0aW9uIGdldFN1cGFiYXNlQ2xpZW50KCk6IFN1cGFiYXNlQ2xpZW50IHtcbiAgY29uc3Qgc3VwYWJhc2VVcmwgPSBEZW5vLmVudi5nZXQoJ1NVUEFCQVNFX1VSTCcpITtcbiAgY29uc3Qgc3VwYWJhc2VTZXJ2aWNlS2V5ID0gRGVuby5lbnYuZ2V0KCdTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZJykhO1xuICByZXR1cm4gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZVNlcnZpY2VLZXkpO1xufVxuXG4vKipcbiAqIExvZyBhbiBlbnRyeSB0byBwdWJsaWMuc3lzdGVtX2xvZ3NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ1RvU3lzdGVtKFxuICBmdW5jdGlvbk5hbWU6IHN0cmluZyxcbiAgZW50cnk6IFN5c3RlbUxvZ0VudHJ5XG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdXBhYmFzZSA9IGdldFN1cGFiYXNlQ2xpZW50KCk7XG5cbiAgICBjb25zdCB7IGVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mcm9tKCdzeXN0ZW1fbG9ncycpLmluc2VydCh7XG4gICAgICBsb2dfbGV2ZWw6IGVudHJ5LmxvZ19sZXZlbCxcbiAgICAgIGxvZ19zb3VyY2U6IGVudHJ5LmxvZ19zb3VyY2UsXG4gICAgICBsb2dfY2F0ZWdvcnk6IGVudHJ5LmxvZ19jYXRlZ29yeSxcbiAgICAgIG1lc3NhZ2U6IGBbJHtmdW5jdGlvbk5hbWV9XSAke2VudHJ5Lm1lc3NhZ2V9YCxcbiAgICAgIGRldGFpbHM6IGVudHJ5LmRldGFpbHMgfHwge30sXG4gICAgICBlcnJvcl9zdGFjazogZW50cnkuZXJyb3Jfc3RhY2ssXG4gICAgICB1c2VyX2NvbnRleHQ6IGVudHJ5LnVzZXJfY29udGV4dCB8fCB7fSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIC4uLmVudHJ5Lm1ldGFkYXRhLFxuICAgICAgICBmdW5jdGlvbl9uYW1lOiBmdW5jdGlvbk5hbWUsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGxvZyB0byBzeXN0ZW1fbG9nczonLCBlcnJvcik7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdTeXN0ZW0gbG9nZ2luZyBlcnJvcjonLCBlcnIpO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVuaWVuY2UgbWV0aG9kcyBmb3IgZGlmZmVyZW50IGxvZyBsZXZlbHNcbiAqL1xuZXhwb3J0IGNvbnN0IEVkZ2VGdW5jdGlvbkxvZ2dlciA9IChmdW5jdGlvbk5hbWU6IHN0cmluZykgPT4gKHtcbiAgZGVidWc6IChtZXNzYWdlOiBzdHJpbmcsIGRldGFpbHM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PlxuICAgIGxvZ1RvU3lzdGVtKGZ1bmN0aW9uTmFtZSwge1xuICAgICAgbG9nX2xldmVsOiAnZGVidWcnLFxuICAgICAgbG9nX3NvdXJjZTogJ2VkZ2VfZnVuY3Rpb24nLFxuICAgICAgbG9nX2NhdGVnb3J5OiAnc3lzdGVtX2hlYWx0aCcsXG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlscyxcbiAgICB9KSxcblxuICBpbmZvOiAoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGNhdGVnb3J5OiBMb2dDYXRlZ29yeSA9ICdzeXN0ZW1faGVhbHRoJyxcbiAgICBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApID0+XG4gICAgbG9nVG9TeXN0ZW0oZnVuY3Rpb25OYW1lLCB7XG4gICAgICBsb2dfbGV2ZWw6ICdpbmZvJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTogY2F0ZWdvcnksXG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlscyxcbiAgICB9KSxcblxuICB3YXJuaW5nOiAoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGNhdGVnb3J5OiBMb2dDYXRlZ29yeSA9ICdzeXN0ZW1faGVhbHRoJyxcbiAgICBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApID0+XG4gICAgbG9nVG9TeXN0ZW0oZnVuY3Rpb25OYW1lLCB7XG4gICAgICBsb2dfbGV2ZWw6ICd3YXJuaW5nJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTogY2F0ZWdvcnksXG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlscyxcbiAgICB9KSxcblxuICBlcnJvcjogKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBlcnJvcjogRXJyb3IgfCB1bmtub3duLFxuICAgIGNhdGVnb3J5OiBMb2dDYXRlZ29yeSA9ICdlcnJvcicsXG4gICAgZGV0YWlscz86IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKSA9PlxuICAgIGxvZ1RvU3lzdGVtKGZ1bmN0aW9uTmFtZSwge1xuICAgICAgbG9nX2xldmVsOiAnZXJyb3InLFxuICAgICAgbG9nX3NvdXJjZTogJ2VkZ2VfZnVuY3Rpb24nLFxuICAgICAgbG9nX2NhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBkZXRhaWxzLFxuICAgICAgZXJyb3Jfc3RhY2s6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5zdGFjayA6IFN0cmluZyhlcnJvciksXG4gICAgfSksXG5cbiAgY3JpdGljYWw6IChcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgZXJyb3I6IEVycm9yIHwgdW5rbm93bixcbiAgICBjYXRlZ29yeTogTG9nQ2F0ZWdvcnkgPSAnZXJyb3InLFxuICAgIGRldGFpbHM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICkgPT5cbiAgICBsb2dUb1N5c3RlbShmdW5jdGlvbk5hbWUsIHtcbiAgICAgIGxvZ19sZXZlbDogJ2NyaXRpY2FsJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTogY2F0ZWdvcnksXG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlscyxcbiAgICAgIGVycm9yX3N0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH0pLFxuXG4gIGFwaUNhbGw6IChcbiAgICBlbmRwb2ludDogc3RyaW5nLFxuICAgIHN0YXR1czogbnVtYmVyLFxuICAgIGR1cmF0aW9uX21zOiBudW1iZXIsXG4gICAgZGV0YWlscz86IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgKSA9PlxuICAgIGxvZ1RvU3lzdGVtKGZ1bmN0aW9uTmFtZSwge1xuICAgICAgbG9nX2xldmVsOiBzdGF0dXMgPj0gNDAwID8gJ2Vycm9yJyA6ICdpbmZvJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTogJ2FwaV9jYWxsJyxcbiAgICAgIG1lc3NhZ2U6IGBBUEkgY2FsbCB0byAke2VuZHBvaW50fSAtIFN0YXR1czogJHtzdGF0dXN9YCxcbiAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgLi4uZGV0YWlscyxcbiAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgIHN0YXR1cyxcbiAgICAgICAgZHVyYXRpb25fbXMsXG4gICAgICB9LFxuICAgIH0pLFxuXG4gIHVzZXJBY3Rpdml0eTogKFxuICAgIGFjdGlvbjogc3RyaW5nLFxuICAgIHVzZXJDb250ZXh0PzogUmVjb3JkPHN0cmluZywgYW55PixcbiAgICBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApID0+XG4gICAgbG9nVG9TeXN0ZW0oZnVuY3Rpb25OYW1lLCB7XG4gICAgICBsb2dfbGV2ZWw6ICdpbmZvJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTogJ3VzZXJfYWN0aXZpdHknLFxuICAgICAgbWVzc2FnZTogYWN0aW9uLFxuICAgICAgdXNlcl9jb250ZXh0OiB1c2VyQ29udGV4dCxcbiAgICAgIGRldGFpbHMsXG4gICAgfSksXG5cbiAgcmVxdWVzdFN0YXJ0OiBhc3luYyAobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0OiBSZXF1ZXN0TG9nQ29udGV4dCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBsZXZlbDogJ2luZm8nLFxuICAgICAgICBldmVudDogJ3JlcXVlc3Rfc3RhcnQnLFxuICAgICAgICBmdW5jdGlvbl9uYW1lOiBmdW5jdGlvbk5hbWUsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAuLi5jb250ZXh0LFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgYXdhaXQgbG9nVG9TeXN0ZW0oZnVuY3Rpb25OYW1lLCB7XG4gICAgICBsb2dfbGV2ZWw6ICdpbmZvJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTogJ2FwaV9jYWxsJyxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBkZXRhaWxzOiBjb250ZXh0LFxuICAgIH0pO1xuICB9LFxuXG4gIHJlcXVlc3RDb21wbGV0ZTogYXN5bmMgKFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICBjb250ZXh0OiBSZXF1ZXN0TG9nQ29udGV4dCxcbiAgICBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgYW55PlxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbGV2ZWw6IGNvbnRleHQuc3RhdHVzICYmIGNvbnRleHQuc3RhdHVzID49IDQwMCA/ICdlcnJvcicgOiAnaW5mbycsXG4gICAgICAgIGV2ZW50OiAncmVxdWVzdF9jb21wbGV0ZScsXG4gICAgICAgIGZ1bmN0aW9uX25hbWU6IGZ1bmN0aW9uTmFtZSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIC4uLmNvbnRleHQsXG4gICAgICAgIGRldGFpbHMsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBhd2FpdCBsb2dUb1N5c3RlbShmdW5jdGlvbk5hbWUsIHtcbiAgICAgIGxvZ19sZXZlbDogY29udGV4dC5zdGF0dXMgJiYgY29udGV4dC5zdGF0dXMgPj0gNDAwID8gJ2Vycm9yJyA6ICdpbmZvJyxcbiAgICAgIGxvZ19zb3VyY2U6ICdlZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGxvZ19jYXRlZ29yeTpcbiAgICAgICAgY29udGV4dC5zdGF0dXMgJiYgY29udGV4dC5zdGF0dXMgPj0gNDAwID8gJ2Vycm9yJyA6ICdhcGlfY2FsbCcsXG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlsczogeyAuLi5jb250ZXh0LCAuLi5kZXRhaWxzIH0sXG4gICAgfSk7XG4gIH0sXG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlcXVlc3RDb250ZXh0KFxuICByZXE6IFJlcXVlc3QsXG4gIGV4dHJhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9XG4pOiBSZXF1ZXN0TG9nQ29udGV4dCB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCk7XG5cbiAgcmV0dXJuIHtcbiAgICByZXF1ZXN0SWQ6IHJlcS5oZWFkZXJzLmdldCgneC1yZXF1ZXN0LWlkJykgfHwgY3J5cHRvLnJhbmRvbVVVSUQoKSxcbiAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgcGF0aDogdXJsLnBhdGhuYW1lLFxuICAgIC4uLmV4dHJhLFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQ0UsWUFBWSxRQUVQLDhDQUE4QztBQThDckQ7O0NBRUMsR0FDRCxTQUFTO0VBQ1AsTUFBTSxjQUFjLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztFQUNqQyxNQUFNLHFCQUFxQixLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUM7RUFDeEMsT0FBTyxhQUFhLGFBQWE7QUFDbkM7QUFFQTs7Q0FFQyxHQUNELE9BQU8sZUFBZSxZQUNwQixZQUFvQixFQUNwQixLQUFxQjtFQUVyQixJQUFJO0lBQ0YsTUFBTSxXQUFXO0lBRWpCLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLFNBQVMsSUFBSSxDQUFDLGVBQWUsTUFBTSxDQUFDO01BQzFELFdBQVcsTUFBTSxTQUFTO01BQzFCLFlBQVksTUFBTSxVQUFVO01BQzVCLGNBQWMsTUFBTSxZQUFZO01BQ2hDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFLEVBQUUsTUFBTSxPQUFPLEVBQUU7TUFDN0MsU0FBUyxNQUFNLE9BQU8sSUFBSSxDQUFDO01BQzNCLGFBQWEsTUFBTSxXQUFXO01BQzlCLGNBQWMsTUFBTSxZQUFZLElBQUksQ0FBQztNQUNyQyxVQUFVO1FBQ1IsR0FBRyxNQUFNLFFBQVE7UUFDakIsZUFBZTtRQUNmLFdBQVcsSUFBSSxPQUFPLFdBQVc7TUFDbkM7SUFDRjtJQUVBLElBQUksT0FBTztNQUNULFFBQVEsS0FBSyxDQUFDLGlDQUFpQztJQUNq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
// denoCacheMetadata=1495281102503284300,2776804779729655065
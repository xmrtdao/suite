import { logFunctionUsage } from './functionUsageLogger.ts';
import { EDGE_FUNCTIONS_REGISTRY } from './edgeFunctionRegistry.ts';
/**
 * Analyze error to provide learning points for executives
 */ function analyzeLearningFromError(toolName, error, params) {
  // Network errors
  if (error.includes('network') || error.includes('urllib') || error.includes('requests') || error.includes('http')) {
    return `❌ Python sandbox has no network access. For API calls, use invoke_edge_function instead of execute_python. Example: invoke_edge_function({ function_name: "github-integration", payload: {...} })`;
  }
  // Import errors
  if (error.includes('ModuleNotFoundError') || error.includes('ImportError')) {
    const match = error.match(/No module named '([^']+)'/);
    const moduleName = match ? match[1] : 'unknown';
    const scientificModules = [
      'numpy',
      'scipy',
      'pandas',
      'matplotlib',
      'sklearn',
      'tensorflow',
      'torch',
      'cv2',
      'PIL'
    ];
    const isScientific = scientificModules.includes(moduleName.split('.')[0]);
    if (isScientific) {
      return `❌ Module '${moduleName}' is a scientific library NOT available in Piston sandbox. Use invoke_edge_function({ function_name: "jupyter-executor", payload: { code: "..." } }) for numpy, scipy, pandas, matplotlib, sklearn, etc. Piston only has: math, json, datetime, random, re, collections, itertools.`;
    }
    return `❌ Module '${moduleName}' not available in sandbox. Available: math, json, datetime, random, re, collections, itertools. For external APIs use invoke_edge_function. For scientific packages (numpy etc.) use jupyter-executor.`;
  }
  // Syntax errors
  if (error.includes('SyntaxError')) {
    return `❌ Python syntax error detected. Check code for typos, indentation, or invalid syntax. Validate code structure before calling execute_python.`;
  }
  // Parameter errors
  if (error.includes('missing') || error.includes('required')) {
    return `❌ Missing required parameter for ${toolName}. Check tool definition in ELIZA_TOOLS for required fields. Example: execute_python requires both 'code' and 'purpose'.`;
  }
  // JSON parse errors
  if (error.includes('JSON') || error.includes('parse')) {
    return `❌ Invalid JSON in tool arguments. Ensure proper escaping of quotes and valid JSON structure.`;
  }
  return `❌ Execution failed: ${error}. Review error details and adjust approach.`;
}
/**
 * Shared tool execution framework for all executives
 * Logs usage, routes to appropriate edge functions, handles errors with detailed learning points
 */ export async function executeToolCall(supabase, toolCall, executiveName, SUPABASE_URL, SERVICE_ROLE_KEY, session_credentials) {
  const startTime = Date.now();
  const { name, arguments: args } = toolCall.function || toolCall;
  // Validate tool call structure
  if (!name) {
    await logFunctionUsage(supabase, {
      function_name: 'invalid_tool_call',
      executive_name: executiveName,
      success: false,
      execution_time_ms: Date.now() - startTime,
      error_message: 'Tool call missing function name',
      parameters: toolCall
    });
    return {
      success: false,
      error: 'Invalid tool call: missing function name',
      learning_point: 'Tool calls must include a function name. Check tool call structure.'
    };
  }
  // Parse arguments with detailed error feedback including expected schema
  let parsedArgs;
  try {
    parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
  } catch (parseError) {
    // Provide tool-specific expected schema in error messages
    const expectedSchemas = {
      'execute_python': '{ "code": "python_code_string", "purpose": "description_of_what_code_does" }',
      'assign_task': '{ "title": "string", "description": "string", "category": "code|infra|research|governance|mining|device|ops|other", "assignee_agent_id": "agent-xxx", "stage": "DISCUSS|PLAN|EXECUTE|VERIFY|INTEGRATE", "expected_deliverables": "optional: description of expected outputs", "notification_recipients": ["email@example.com"] }',
      'update_task_status': '{ "task_id": "uuid", "status": "PENDING|CLAIMED|IN_PROGRESS|BLOCKED|DONE|CANCELLED|COMPLETED|FAILED", "stage": "DISCUSS|PLAN|EXECUTE|VERIFY|INTEGRATE", "proof_of_work_link": "url-to-deliverable (required on COMPLETED)", "outcome_summary": "what was accomplished (required on COMPLETED)" }',
      'update_agent_status': '{ "agent_id": "agent-xxx", "status": "IDLE|BUSY|ARCHIVED|ERROR|OFFLINE" }',
      'createGitHubIssue': '{ "title": "string", "body": "string", "repo": "XMRT-Ecosystem", "labels": ["bug"], "assignees": ["Antigravity"] }',
      'invoke_edge_function': '{ "function_name": "string", "payload": {} }',
      'bulk_update_task_status': '{ "task_ids": ["uuid1", "uuid2"], "new_status": "PENDING|CLAIMED|IN_PROGRESS|BLOCKED|DONE|CANCELLED|COMPLETED|FAILED" }'
    };
    const expectedSchema = expectedSchemas[name] || 'Check tool definition for required parameters';
    await logFunctionUsage(supabase, {
      function_name: name,
      executive_name: executiveName,
      success: false,
      execution_time_ms: Date.now() - startTime,
      error_message: `Failed to parse tool arguments for ${name}`,
      parameters: {
        raw_args: args,
        parse_error: parseError.message,
        expected_schema: expectedSchema
      }
    });
    return {
      success: false,
      error: `Invalid tool arguments for ${name}: JSON parse failed. Expected format: ${expectedSchema}`,
      learning_point: `Tool ${name} requires valid JSON. Expected schema: ${expectedSchema}. Ensure quotes are escaped and JSON is valid.`
    };
  }
  const buildGoogleAuthPayload1 = (baseArgs, sourceTool)=>{
    const payload = {
      ...baseArgs || {}
    };
    const inferredUserEmail = payload.user_email || session_credentials?.user_email || session_credentials?.email || session_credentials?.user?.email;
    const inferredUserId = payload.user_id || session_credentials?.user_id || session_credentials?.sub || session_credentials?.user?.id;
    if (inferredUserEmail && !payload.user_email) payload.user_email = inferredUserEmail;
    if (inferredUserId && !payload.user_id) payload.user_id = inferredUserId;
    if (!payload.requested_from) payload.requested_from = sourceTool;
    return payload;
  };
  // Validate execute_python specific requirements with syntax pre-checks
  if (name === 'execute_python') {
    if (!parsedArgs.code) {
      return {
        success: false,
        error: 'execute_python requires "code" parameter',
        learning_point: 'execute_python tool call must include: { code: "your_python_code", purpose: "description" }'
      };
    }
    if (!parsedArgs.purpose) {
      console.warn(`⚠️ execute_python called without purpose parameter by ${executiveName}`);
      parsedArgs.purpose = 'No purpose specified';
    }
    // Pre-execution Python syntax validation to catch common issues
    const code = parsedArgs.code;
    const syntaxIssues = [];
    // Check for unterminated strings (common failure mode)
    const singleQuoteCount = (code.match(/(?<!\\)'/g) || []).length;
    const doubleQuoteCount = (code.match(/(?<!\\)"/g) || []).length;
    const tripleDoubleCount = (code.match(/"""/g) || []).length;
    const tripleSingleCount = (code.match(/'''/g) || []).length;
    // After removing triple quotes, check if remaining quotes are balanced
    const adjustedSingle = singleQuoteCount - tripleSingleCount * 3;
    const adjustedDouble = doubleQuoteCount - tripleDoubleCount * 3;
    if (adjustedSingle % 2 !== 0) {
      syntaxIssues.push("Unbalanced single quotes (') - possible unterminated string");
    }
    if (adjustedDouble % 2 !== 0) {
      syntaxIssues.push('Unbalanced double quotes (") - possible unterminated string');
    }
    // Check for network operations that will fail
    const networkPatterns = [
      {
        pattern: /urllib\.request/i,
        msg: "urllib.request detected - WILL FAIL (no network access)"
      },
      {
        pattern: /requests\.(get|post|put|delete)/i,
        msg: "requests module detected - WILL FAIL (no network access)"
      },
      {
        pattern: /socket\./i,
        msg: "socket module detected - WILL FAIL (no network access)"
      },
      {
        pattern: /urlopen\(/i,
        msg: "urlopen() detected - WILL FAIL (no network access)"
      },
      {
        pattern: /http\.client/i,
        msg: "http.client detected - WILL FAIL (no network access)"
      }
    ];
    for (const { pattern, msg } of networkPatterns){
      if (pattern.test(code)) {
        syntaxIssues.push(msg);
      }
    }
    // Check for missing print statement (common issue - no output)
    if (!code.includes('print(') && !code.includes('print (')) {
      syntaxIssues.push("No print() statement - output may not be captured. Add print(result) at the end.");
    }
    // If critical issues found, return early with helpful guidance
    if (syntaxIssues.some((issue)=>issue.includes('WILL FAIL'))) {
      console.error(`🚫 [${executiveName}] Python pre-validation BLOCKED execution:`, syntaxIssues);
      return {
        success: false,
        error: `Python code blocked before execution due to: ${syntaxIssues.join('; ')}`,
        learning_point: `Python sandbox has NO network access. For HTTP/API calls, use invoke_edge_function instead. For computation only, remove network code and use pure Python.`,
        detected_issues: syntaxIssues
      };
    }
    // Log warnings but allow execution
    if (syntaxIssues.length > 0) {
      console.warn(`⚠️ [${executiveName}] Python pre-validation warnings:`, syntaxIssues);
    }
  }
  console.log(`🔧 [${executiveName}] Executing tool: ${name}`, parsedArgs);
  try {
    let result1;
    // Route tool calls to appropriate edge functions
    switch(name){
      // ====================================================================
      // CONVERSATIONAL USER ACQUISITION TOOLS
      // ====================================================================
      case 'dispatch_local_task':
        console.log(`🚀 [${executiveName}] Dispatching Local Task`);
        // Retrieve secrets from environment or Supabase
        // Note: In Edge Functions, process.env is via Deno.env usually, but here we check if passed in context or fetch from simple map
        // For this architecture we assume ANTIGRAVITY_URL is set as a secret in the Edge Function environment
        const antigravityUrl = Deno.env.get('ANTIGRAVITY_URL');
        const antigravityToken = Deno.env.get('ANTIGRAVITY_TOKEN');
        if (!antigravityUrl) {
          result1 = {
            success: false,
            error: 'Configuration Error',
            learning_point: 'The ANTIGRAVITY_URL secret is not set in the Edge Function. Please set it to your active ngrok URL.'
          };
          break;
        }
        if (!antigravityToken) {
          result1 = {
            success: false,
            error: 'Configuration Error',
            learning_point: 'The ANTIGRAVITY_TOKEN secret is not set in the Edge Function. Please set it in Supabase secrets.'
          };
          break;
        }
        try {
          // Add source attribution
          const payload = {
            ...parsedArgs.task_payload,
            source: executiveName,
            dispatched_at: new Date().toISOString()
          };
          const response = await fetch(`${antigravityUrl}/task`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-antigravity-token': antigravityToken
            },
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            throw new Error(`Local bridge returned ${response.status}: ${response.statusText}`);
          }
          const responseData = await response.json();
          result1 = {
            success: true,
            result: responseData
          };
        } catch (bridgeError) {
          console.error(`❌ Bridge Connection Failed:`, bridgeError);
          result1 = {
            success: false,
            error: `Failed to connect to local bridge at ${antigravityUrl}. Is ngrok running?`,
            details: bridgeError.message
          };
        }
        break;
      case 'qualify_lead':
        console.log(`🎯 [${executiveName}] Qualify Lead`);
        const qualifyResult = await supabase.functions.invoke('qualify-lead', {
          body: parsedArgs
        });
        result1 = qualifyResult.error ? {
          success: false,
          error: qualifyResult.error.message
        } : {
          success: true,
          result: qualifyResult.data
        };
        break;
      case 'identify_service_interest':
        console.log(`🔍 [${executiveName}] Identify Service Interest`);
        const interestResult = await supabase.functions.invoke('identify-service-interest', {
          body: parsedArgs
        });
        result1 = interestResult.error ? {
          success: false,
          error: interestResult.error.message
        } : {
          success: true,
          result: interestResult.data
        };
        break;
      case 'suggest_tier_based_on_needs':
        console.log(`💡 [${executiveName}] Suggest Pricing Tier`);
        const { estimated_monthly_usage, budget_range } = parsedArgs;
        let recommendedTier = 'free';
        let reasoning = '';
        if (estimated_monthly_usage <= 100) {
          recommendedTier = 'free';
          reasoning = 'Free tier (100 requests/mo) fits your estimated usage perfectly.';
        } else if (estimated_monthly_usage <= 1000) {
          recommendedTier = 'basic';
          reasoning = 'Basic tier ($10/mo, 1,000 requests) gives you 10x headroom for growth.';
        } else if (estimated_monthly_usage <= 10000) {
          recommendedTier = 'pro';
          reasoning = 'Pro tier ($50/mo, 10,000 requests) handles your volume with best value.';
        } else {
          recommendedTier = 'enterprise';
          reasoning = 'Enterprise tier ($500/mo, unlimited) for your high-volume needs.';
        }
        // Adjust for budget
        if (budget_range === 'budget-conscious' && recommendedTier === 'enterprise') {
          recommendedTier = 'pro';
          reasoning += ' Consider Pro tier as a cost-effective alternative.';
        }
        result1 = {
          success: true,
          result: {
            recommended_tier: recommendedTier,
            reasoning,
            monthly_cost: ({
              free: 0,
              basic: 10,
              pro: 50,
              enterprise: 500
            })[recommendedTier]
          }
        };
        break;
      case 'create_user_profile_from_session':
        console.log(`👤 [${executiveName}] Create User Profile`);
        const profileResult = await supabase.functions.invoke('convert-session-to-user', {
          body: {
            action: 'create_user_profile',
            ...parsedArgs
          }
        });
        result1 = profileResult.error ? {
          success: false,
          error: profileResult.error.message
        } : {
          success: true,
          result: profileResult.data
        };
        break;
      case 'generate_stripe_payment_link':
        console.log(`💳 [${executiveName}] Generate Payment Link`);
        const paymentResult = await supabase.functions.invoke('generate-stripe-link', {
          body: parsedArgs
        });
        result1 = paymentResult.error ? {
          success: false,
          error: paymentResult.error.message
        } : {
          success: true,
          result: paymentResult.data
        };
        break;
      case 'check_onboarding_progress':
        console.log(`📊 [${executiveName}] Check Onboarding Progress`);
        const { data: checkpoints } = await supabase.from('onboarding_checkpoints').select('*').eq('api_key', parsedArgs.api_key).order('completed_at', {
          ascending: true
        });
        result1 = {
          success: true,
          result: {
            checkpoints: checkpoints || [],
            completed_count: checkpoints?.length || 0,
            activation_completed: checkpoints?.some((c)=>c.checkpoint === 'value_realized') || false
          }
        };
        break;
      case 'send_usage_alert':
        console.log(`⚠️ [${executiveName}] Send Usage Alert`);
        const alertResult = await supabase.functions.invoke('usage-monitor', {
          body: {
            api_key: parsedArgs.api_key,
            alert_type: parsedArgs.alert_type
          }
        });
        result1 = alertResult.error ? {
          success: false,
          error: alertResult.error.message
        } : {
          success: true,
          result: alertResult.data
        };
        break;
      case 'link_api_key_to_conversation':
        console.log(`🔗 [${executiveName}] Link API Key to Conversation`);
        const linkResult = await supabase.functions.invoke('convert-session-to-user', {
          body: {
            action: 'link_api_key_to_session',
            ...parsedArgs
          }
        });
        result1 = linkResult.error ? {
          success: false,
          error: linkResult.error.message
        } : {
          success: true,
          result: linkResult.data
        };
        break;
      case 'apply_retention_discount':
        console.log(`🎁 [${executiveName}] Apply Retention Discount`);
        // Update API key with discount metadata
        const { error: discountError } = await supabase.from('service_api_keys').update({
          metadata: {
            discount_percent: parsedArgs.discount_percent,
            discount_duration_months: parsedArgs.duration_months,
            discount_applied_at: new Date().toISOString()
          }
        }).eq('api_key', parsedArgs.api_key);
        result1 = discountError ? {
          success: false,
          error: discountError.message
        } : {
          success: true,
          result: {
            discount_applied: true,
            message: `${parsedArgs.discount_percent}% discount applied for ${parsedArgs.duration_months} months`
          }
        };
        break;
      // ====================================================================
      // EXISTING TOOLS
      // ====================================================================
      case 'delegate_to_specialist':
        {
          // Map friendly roles to actual edge function names
          const agentMap = {
            'social-viral': 'superduper-social-viral',
            'code-architect': 'superduper-code-architect',
            'business-growth': 'superduper-business-growth',
            'finance-investment': 'superduper-finance-investment',
            'design-brand': 'superduper-design-brand',
            'content-media': 'superduper-content-media',
            'communication-outreach': 'superduper-communication-outreach',
            'research-intelligence': 'superduper-research-intelligence',
            'integration': 'superduper-integration',
            'development-coach': 'superduper-development-coach',
            'domain-experts': 'superduper-domain-experts'
          };
          const specialistFn = agentMap[args.specialist_role];
          if (!specialistFn) {
            throw new Error(`Unknown specialist role: ${args.specialist_role}`);
          }
          console.log(`🤝 Delegating task to ${specialistFn}...`);
          const { data, error } = await supabase.functions.invoke(specialistFn, {
            body: {
              action: 'process_task',
              params: {
                instruction: args.task_description,
                context: args.context_data || {}
              },
              // Pass the manager's context if available, or identity
              context: {
                manager: executiveName,
                delegated_at: new Date().toISOString()
              }
            }
          });
          if (error) throw error;
          return data;
        }
      case 'invoke_edge_function':
      case 'call_edge_function':
        let { function_name, payload, body } = parsedArgs;
        let targetFunction = function_name || parsedArgs.function_name;
        let targetPayload = payload || body || {};
        // Auto-correct common VSCO function name hallucinations
        // AI sometimes hallucinates "vsco-manage-events" instead of using vsco_manage_events tool
        if (targetFunction && (targetFunction.startsWith('vsco-manage-') || targetFunction.startsWith('vsco_manage_'))) {
          const entityType = targetFunction.replace(/^vsco[-_]manage[-_]/, '');
          console.warn(`⚠️ Auto-correcting hallucinated function "${targetFunction}" → vsco-workspace`);
          console.warn(`💡 Next time, use the dedicated tool: vsco_manage_${entityType}`);
          targetFunction = 'vsco-workspace';
          // Infer action from payload or default to list
          if (!targetPayload?.action) {
            targetPayload = {
              ...targetPayload,
              action: `list_${entityType}`
            };
          }
        }
        console.log(`📡 [${executiveName}] Invoking edge function: ${targetFunction}`);
        const funcResult = await supabase.functions.invoke(targetFunction, {
          body: targetPayload
        });
        if (funcResult.error) {
          console.error(`❌ [${executiveName}] Edge function error:`, funcResult.error);
          result1 = {
            success: false,
            error: funcResult.error.message || 'Function execution failed'
          };
        } else {
          result1 = {
            success: true,
            result: funcResult.data
          };
        }
        break;
      case 'execute_python':
        const { code, purpose } = parsedArgs;
        console.log(`🐍 [${executiveName}] Execute Python - ${purpose || 'No purpose'}`);
        const pythonResult = await supabase.functions.invoke('python-executor', {
          body: {
            code,
            purpose,
            source: executiveName.toLowerCase() + '-executive',
            agent_id: executiveName.toLowerCase()
          }
        });
        if (pythonResult.error) {
          result1 = {
            success: false,
            error: pythonResult.error.message || 'Python execution failed'
          };
        } else {
          result1 = {
            success: true,
            result: pythonResult.data
          };
        }
        break;
      case 'get_my_feedback':
        const limit = parsedArgs.limit || 10;
        const unacknowledgedOnly = parsedArgs.unacknowledged_only !== false; // Default true
        const acknowledgeIds = parsedArgs.acknowledge_ids || [];
        console.log(`📚 [${executiveName}] Get my feedback - limit: ${limit}, unack only: ${unacknowledgedOnly}`);
        // Acknowledge specified feedback items first
        if (acknowledgeIds.length > 0) {
          await supabase.from('executive_feedback').update({
            acknowledged: true,
            acknowledged_at: new Date().toISOString()
          }).in('id', acknowledgeIds);
          console.log(`✅ [${executiveName}] Acknowledged ${acknowledgeIds.length} feedback items`);
        }
        // Fetch feedback
        let query = supabase.from('executive_feedback').select('*').eq('executive_name', executiveName).order('created_at', {
          ascending: false
        }).limit(limit);
        if (unacknowledgedOnly) {
          query = query.eq('acknowledged', false);
        }
        const { data: feedback, error: feedbackError } = await query;
        if (feedbackError) {
          result1 = {
            success: false,
            error: feedbackError.message
          };
        } else {
          result1 = {
            success: true,
            result: {
              feedback: feedback || [],
              count: feedback?.length || 0,
              acknowledged_count: acknowledgeIds.length
            }
          };
        }
        break;
      case 'createGitHubDiscussion':
        console.log(`📝 [${executiveName}] Create GitHub Discussion`);
        // Derive executive from executiveName if not explicitly provided
        const discussionExec = parsedArgs.executive || (executiveName?.toLowerCase()?.includes('strategy') ? 'cso' : executiveName?.toLowerCase()?.includes('technology') ? 'cto' : executiveName?.toLowerCase()?.includes('information') ? 'cio' : executiveName?.toLowerCase()?.includes('analytics') ? 'cao' : 'eliza');
        const discussionResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'create_discussion',
            data: {
              repositoryId: 'R_kgDOSSxKTQ',
              title: parsedArgs.title,
              body: parsedArgs.body,
              categoryId: parsedArgs.categoryId || 'DIC_kwDOPHeChc4CkXxI',
              executive: discussionExec
            },
            session_credentials
          }
        });
        if (discussionResult.error) {
          result1 = {
            success: false,
            error: discussionResult.error.message
          };
        } else {
          result1 = {
            success: true,
            result: discussionResult.data
          };
        }
        break;
      case 'createGitHubIssue':
        console.log(`🐛 [${executiveName}] Create GitHub Issue`);
        // Derive executive from executiveName if not explicitly provided
        const issueExec = parsedArgs.executive || (executiveName?.toLowerCase()?.includes('strategy') ? 'cso' : executiveName?.toLowerCase()?.includes('technology') ? 'cto' : executiveName?.toLowerCase()?.includes('information') ? 'cio' : executiveName?.toLowerCase()?.includes('analytics') ? 'cao' : 'eliza');
        const issueResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'create_issue',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              title: parsedArgs.title,
              body: parsedArgs.body,
              labels: parsedArgs.labels || [],
              assignees: parsedArgs.assignees || [],
              executive: issueExec
            },
            session_credentials
          }
        });
        if (issueResult.error) {
          result1 = {
            success: false,
            error: issueResult.error.message
          };
        } else {
          result1 = {
            success: true,
            result: issueResult.data
          };
        }
        break;
      case 'commentOnGitHubIssue':
        console.log(`💬 [${executiveName}] Comment on GitHub Issue #${parsedArgs.issue_number}`);
        // Derive executive from executiveName if not explicitly provided
        const commentExec = parsedArgs.executive || (executiveName?.toLowerCase()?.includes('strategy') ? 'cso' : executiveName?.toLowerCase()?.includes('technology') ? 'cto' : executiveName?.toLowerCase()?.includes('information') ? 'cio' : executiveName?.toLowerCase()?.includes('analytics') ? 'cao' : 'eliza');
        const commentResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'comment_on_issue',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              issue_number: parsedArgs.issue_number,
              comment: parsedArgs.comment,
              executive: commentExec
            },
            session_credentials
          }
        });
        if (commentResult.error) {
          result1 = {
            success: false,
            error: commentResult.error.message
          };
        } else {
          result1 = {
            success: true,
            result: commentResult.data
          };
        }
        break;
      case 'listGitHubIssues':
        console.log(`📋 [${executiveName}] List GitHub Issues`);
        const listResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_issues',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              state: parsedArgs.state || 'open',
              per_page: parsedArgs.limit || 20
            },
            session_credentials
          }
        });
        if (listResult.error) {
          result1 = {
            success: false,
            error: listResult.error.message
          };
        } else {
          result1 = {
            success: true,
            result: listResult.data
          };
        }
        break;
      // ====================================================================
      // GITHUB PULL REQUEST TOOLS
      // ====================================================================
      case 'createGitHubPullRequest':
        console.log(`🔄 [${executiveName}] Create GitHub PR: ${parsedArgs.title}`);
        const createPRResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'create_pull_request',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              title: parsedArgs.title,
              body: parsedArgs.body,
              head: parsedArgs.head,
              base: parsedArgs.base || 'main',
              draft: parsedArgs.draft || false
            },
            session_credentials
          }
        });
        result1 = createPRResult.error ? {
          success: false,
          error: createPRResult.error.message
        } : {
          success: true,
          result: createPRResult.data
        };
        break;
      case 'listGitHubPullRequests':
        console.log(`📋 [${executiveName}] List GitHub PRs`);
        const listPRResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_pull_requests',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              state: parsedArgs.state || 'open'
            },
            session_credentials
          }
        });
        result1 = listPRResult.error ? {
          success: false,
          error: listPRResult.error.message
        } : {
          success: true,
          result: listPRResult.data
        };
        break;
      case 'mergeGitHubPullRequest':
        console.log(`✅ [${executiveName}] Merge GitHub PR #${parsedArgs.pull_number}`);
        const mergePRResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'merge_pull_request',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              pull_number: parsedArgs.pull_number,
              merge_method: parsedArgs.merge_method || 'squash',
              commit_title: parsedArgs.commit_title,
              commit_message: parsedArgs.commit_message
            },
            session_credentials
          }
        });
        result1 = mergePRResult.error ? {
          success: false,
          error: mergePRResult.error.message
        } : {
          success: true,
          result: mergePRResult.data
        };
        break;
      case 'closeGitHubPullRequest':
        console.log(`❌ [${executiveName}] Close GitHub PR #${parsedArgs.pull_number}`);
        const closePRResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'close_pull_request',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              pull_number: parsedArgs.pull_number
            },
            session_credentials
          }
        });
        result1 = closePRResult.error ? {
          success: false,
          error: closePRResult.error.message
        } : {
          success: true,
          result: closePRResult.data
        };
        break;
      // ====================================================================
      // GITHUB BRANCH TOOLS
      // ====================================================================
      case 'createGitHubBranch':
        console.log(`🌿 [${executiveName}] Create GitHub Branch: ${parsedArgs.branch_name}`);
        const createBranchResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'create_branch',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              branch_name: parsedArgs.branch_name,
              from_branch: parsedArgs.from_branch || 'main'
            },
            session_credentials
          }
        });
        result1 = createBranchResult.error ? {
          success: false,
          error: createBranchResult.error.message
        } : {
          success: true,
          result: createBranchResult.data
        };
        break;
      case 'listGitHubBranches':
        console.log(`📋 [${executiveName}] List GitHub Branches`);
        const listBranchesResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_branches',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem'
            },
            session_credentials
          }
        });
        result1 = listBranchesResult.error ? {
          success: false,
          error: listBranchesResult.error.message
        } : {
          success: true,
          result: listBranchesResult.data
        };
        break;
      case 'getGitHubBranchInfo':
        console.log(`🔍 [${executiveName}] Get GitHub Branch Info: ${parsedArgs.branch}`);
        const branchInfoResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'get_branch_info',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              branch: parsedArgs.branch
            },
            session_credentials
          }
        });
        result1 = branchInfoResult.error ? {
          success: false,
          error: branchInfoResult.error.message
        } : {
          success: true,
          result: branchInfoResult.data
        };
        break;
      // ====================================================================
      // GITHUB FILE & CODE TOOLS
      // ====================================================================
      case 'getGitHubFileContent':
        console.log(`📄 [${executiveName}] Get GitHub File: ${parsedArgs.path}`);
        const getFileResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'get_file_content',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              path: parsedArgs.path,
              ref: parsedArgs.ref || 'main'
            },
            session_credentials
          }
        });
        result1 = getFileResult.error ? {
          success: false,
          error: getFileResult.error.message
        } : {
          success: true,
          result: getFileResult.data
        };
        break;
      case 'commitGitHubFile':
        console.log(`📝 [${executiveName}] Commit GitHub File: ${parsedArgs.path}`);
        const commitFileResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'commit_file',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              path: parsedArgs.path,
              content: parsedArgs.content,
              message: parsedArgs.message,
              branch: parsedArgs.branch || 'main',
              sha: parsedArgs.sha
            },
            session_credentials
          }
        });
        result1 = commitFileResult.error ? {
          success: false,
          error: commitFileResult.error.message
        } : {
          success: true,
          result: commitFileResult.data
        };
        break;
      case 'deleteGitHubFile':
        console.log(`🗑️ [${executiveName}] Delete GitHub File: ${parsedArgs.path}`);
        const deleteFileResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'delete_file',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              path: parsedArgs.path,
              message: parsedArgs.message,
              branch: parsedArgs.branch || 'main',
              sha: parsedArgs.sha
            },
            session_credentials
          }
        });
        result1 = deleteFileResult.error ? {
          success: false,
          error: deleteFileResult.error.message
        } : {
          success: true,
          result: deleteFileResult.data
        };
        break;
      case 'listGitHubFiles':
        console.log(`📂 [${executiveName}] List GitHub Files: ${parsedArgs.path || '/'}`);
        const listFilesResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_files',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              path: parsedArgs.path || '',
              ref: parsedArgs.ref || 'main'
            },
            session_credentials
          }
        });
        result1 = listFilesResult.error ? {
          success: false,
          error: listFilesResult.error.message
        } : {
          success: true,
          result: listFilesResult.data
        };
        break;
      case 'searchGitHubCode':
        console.log(`🔍 [${executiveName}] Search GitHub Code: ${parsedArgs.query}`);
        const searchCodeResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'search_code',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              query: parsedArgs.query
            },
            session_credentials
          }
        });
        result1 = searchCodeResult.error ? {
          success: false,
          error: searchCodeResult.error.message
        } : {
          success: true,
          result: searchCodeResult.data
        };
        break;
      // ====================================================================
      // GITHUB EVENT MONITORING TOOLS
      // ====================================================================
      case 'list_github_commits':
        console.log(`📝 [${executiveName}] List GitHub Commits`);
        const listCommitsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_commits',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              author: parsedArgs.author,
              since: parsedArgs.since,
              until: parsedArgs.until,
              sha: parsedArgs.sha,
              path: parsedArgs.path,
              per_page: parsedArgs.per_page || 30
            },
            session_credentials
          }
        });
        result1 = listCommitsResult.error ? {
          success: false,
          error: listCommitsResult.error.message
        } : {
          success: true,
          result: listCommitsResult.data
        };
        break;
      case 'get_commit_details':
        console.log(`📦 [${executiveName}] Get Commit Details: ${parsedArgs.commit_sha}`);
        const commitDetailsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'get_commit_details',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              commit_sha: parsedArgs.commit_sha
            },
            session_credentials
          }
        });
        result1 = commitDetailsResult.error ? {
          success: false,
          error: commitDetailsResult.error.message
        } : {
          success: true,
          result: commitDetailsResult.data
        };
        break;
      case 'list_repo_events':
        console.log(`📊 [${executiveName}] List Repo Events`);
        const repoEventsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_repo_events',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              per_page: parsedArgs.per_page || 30
            },
            session_credentials
          }
        });
        result1 = repoEventsResult.error ? {
          success: false,
          error: repoEventsResult.error.message
        } : {
          success: true,
          result: repoEventsResult.data
        };
        break;
      case 'list_github_releases':
        console.log(`🏷️ [${executiveName}] List GitHub Releases`);
        const releasesResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_releases',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              per_page: parsedArgs.per_page || 30
            },
            session_credentials
          }
        });
        result1 = releasesResult.error ? {
          success: false,
          error: releasesResult.error.message
        } : {
          success: true,
          result: releasesResult.data
        };
        break;
      case 'list_github_contributors':
        console.log(`👥 [${executiveName}] List GitHub Contributors`);
        const contributorsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'list_contributors',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              include_anonymous: parsedArgs.include_anonymous || false,
              per_page: parsedArgs.per_page || 30
            },
            session_credentials
          }
        });
        result1 = contributorsResult.error ? {
          success: false,
          error: contributorsResult.error.message
        } : {
          success: true,
          result: contributorsResult.data
        };
        break;
      case 'get_release_details':
        console.log(`🏷️ [${executiveName}] Get Release Details: ${parsedArgs.release_id || 'latest'}`);
        const releaseDetailsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'get_release_details',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              release_id: parsedArgs.release_id || 'latest'
            },
            session_credentials
          }
        });
        result1 = releaseDetailsResult.error ? {
          success: false,
          error: releaseDetailsResult.error.message
        } : {
          success: true,
          result: releaseDetailsResult.data
        };
        break;
      case 'getGitHubIssueComments':
        console.log(`💬 [${executiveName}] Get Issue Comments: #${parsedArgs.issue_number}`);
        const issueCommentsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'get_issue_comments',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              issue_number: parsedArgs.issue_number,
              per_page: parsedArgs.per_page || 30
            },
            session_credentials
          }
        });
        result1 = issueCommentsResult.error ? {
          success: false,
          error: issueCommentsResult.error.message
        } : {
          success: true,
          result: issueCommentsResult.data
        };
        break;
      case 'getGitHubDiscussionComments':
        console.log(`💬 [${executiveName}] Get Discussion Comments: #${parsedArgs.discussion_number}`);
        const discussionCommentsResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'get_discussion_comments',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              discussion_number: parsedArgs.discussion_number,
              first: parsedArgs.first || 30
            },
            session_credentials
          }
        });
        result1 = discussionCommentsResult.error ? {
          success: false,
          error: discussionCommentsResult.error.message
        } : {
          success: true,
          result: discussionCommentsResult.data
        };
        break;
      case 'updateGitHubIssue':
        console.log(`✏️ [${executiveName}] Update Issue: #${parsedArgs.issue_number}`);
        const updateIssueResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'update_issue',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              issue_number: parsedArgs.issue_number,
              title: parsedArgs.title,
              body: parsedArgs.body,
              state: parsedArgs.state,
              labels: parsedArgs.labels,
              assignees: parsedArgs.assignees
            },
            session_credentials
          }
        });
        result1 = updateIssueResult.error ? {
          success: false,
          error: updateIssueResult.error.message
        } : {
          success: true,
          result: updateIssueResult.data
        };
        break;
      case 'closeGitHubIssue':
        console.log(`❌ [${executiveName}] Close Issue: #${parsedArgs.issue_number}`);
        const closingComment = parsedArgs.body ?? parsedArgs.comment;
        // If comment provided, add it first
        if (closingComment) {
          await supabase.functions.invoke('github-integration', {
            body: {
              action: 'comment_on_issue',
              data: {
                repo: parsedArgs.repo || 'XMRT-Ecosystem',
                issue_number: parsedArgs.issue_number,
                comment: closingComment
              },
              session_credentials
            }
          });
        }
        const closeIssueResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'close_issue',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              issue_number: parsedArgs.issue_number
            },
            session_credentials
          }
        });
        result1 = closeIssueResult.error ? {
          success: false,
          error: closeIssueResult.error.message
        } : {
          success: true,
          result: closeIssueResult.data
        };
        break;
      // ====================================================================
      // GITHUB WORKFLOW TOOLS
      // ====================================================================
      case 'trigger_github_workflow':
        console.log(`▶️ [${executiveName}] Trigger GitHub Workflow: ${parsedArgs.workflow_file}`);
        const triggerWorkflowResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'trigger_workflow',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              workflow_file: parsedArgs.workflow_file,
              ref: parsedArgs.ref || 'main',
              inputs: parsedArgs.inputs || {}
            },
            session_credentials
          }
        });
        result1 = triggerWorkflowResult.error ? {
          success: false,
          error: triggerWorkflowResult.error.message
        } : {
          success: true,
          result: triggerWorkflowResult.data
        };
        break;
      case 'createGitHubWorkflowFile':
        console.log(`📋 [${executiveName}] Create GitHub Workflow: ${parsedArgs.workflow_name}`);
        // Create workflow file in .github/workflows/ directory
        const workflowPath = `.github/workflows/${parsedArgs.workflow_name}.yml`;
        const createWorkflowResult = await supabase.functions.invoke('github-integration', {
          body: {
            action: 'commit_file',
            data: {
              repo: parsedArgs.repo || 'XMRT-Ecosystem',
              path: workflowPath,
              content: parsedArgs.yaml_content,
              message: parsedArgs.commit_message || `Add workflow: ${parsedArgs.workflow_name}`,
              branch: parsedArgs.branch || 'main'
            },
            session_credentials
          }
        });
        result1 = createWorkflowResult.error ? {
          success: false,
          error: createWorkflowResult.error.message
        } : {
          success: true,
          result: {
            ...createWorkflowResult.data,
            workflow_path: workflowPath
          }
        };
      case 'list_available_functions':
        const functionsResult = await supabase.functions.invoke('list-available-functions', {
          body: {
            category: parsedArgs.category
          }
        });
        result1 = {
          success: true,
          result: functionsResult.data
        };
        break;
      case 'get_function_usage_analytics':
        const analyticsResult = await supabase.functions.invoke('function-usage-analytics', {
          body: parsedArgs
        });
        result1 = {
          success: true,
          result: analyticsResult.data
        };
        break;
      case 'propose_new_edge_function':
        const proposalResult = await supabase.functions.invoke('propose-new-edge-function', {
          body: {
            ...parsedArgs,
            proposed_by: executiveName
          }
        });
        result1 = {
          success: true,
          result: proposalResult.data
        };
        break;
      case 'vote_on_function_proposal':
        const voteResult = await supabase.functions.invoke('vote-on-proposal', {
          body: {
            ...parsedArgs,
            executive_name: executiveName
          }
        });
        result1 = {
          success: true,
          result: voteResult.data
        };
        break;
      case 'list_function_proposals':
        const proposalsResult = await supabase.functions.invoke('list-function-proposals', {
          body: parsedArgs
        });
        result1 = {
          success: true,
          result: proposalsResult.data
        };
        break;
      // Task-Orchestrator Tools
      case 'auto_assign_tasks':
        console.log(`🤖 [${executiveName}] Auto-assigning pending tasks to idle agents`);
        const assignResult = await supabase.functions.invoke('task-orchestrator', {
          body: {
            action: 'auto_assign_tasks',
            data: {}
          }
        });
        result1 = assignResult.error ? {
          success: false,
          error: assignResult.error.message
        } : {
          success: true,
          result: assignResult.data
        };
        break;
      case 'rebalance_workload':
        console.log(`⚖️ [${executiveName}] Analyzing workload distribution`);
        const rebalanceResult = await supabase.functions.invoke('task-orchestrator', {
          body: {
            action: 'rebalance_workload',
            data: {}
          }
        });
        result1 = rebalanceResult.error ? {
          success: false,
          error: rebalanceResult.error.message
        } : {
          success: true,
          result: rebalanceResult.data
        };
        break;
      case 'identify_blockers':
        console.log(`🚧 [${executiveName}] Identifying blocked tasks`);
        const blockersResult = await supabase.functions.invoke('task-orchestrator', {
          body: {
            action: 'identify_blockers',
            data: {}
          }
        });
        result1 = blockersResult.error ? {
          success: false,
          error: blockersResult.error.message
        } : {
          success: true,
          result: blockersResult.data
        };
        break;
      case 'clear_blocked_tasks':
        console.log(`🧹 [${executiveName}] Clearing blocked tasks`);
        const clearResult = await supabase.functions.invoke('task-orchestrator', {
          body: {
            action: 'clear_all_blocked_tasks',
            data: {}
          }
        });
        result1 = clearResult.error ? {
          success: false,
          error: clearResult.error.message
        } : {
          success: true,
          result: clearResult.data
        };
        break;
      case 'bulk_update_task_status':
        console.log(`📦 [${executiveName}] Bulk updating task status`);
        const bulkResult = await supabase.functions.invoke('task-orchestrator', {
          body: {
            action: 'bulk_update_task_status',
            data: {
              task_ids: parsedArgs.task_ids,
              new_status: parsedArgs.new_status,
              new_stage: parsedArgs.new_stage
            }
          }
        });
        result1 = bulkResult.error ? {
          success: false,
          error: bulkResult.error.message
        } : {
          success: true,
          result: bulkResult.data
        };
        break;
      case 'get_task_performance_report':
        console.log(`📊 [${executiveName}] Generating task performance report`);
        const reportResult = await supabase.functions.invoke('task-orchestrator', {
          body: {
            action: 'performance_report',
            data: {}
          }
        });
        result1 = reportResult.error ? {
          success: false,
          error: reportResult.error.message
        } : {
          success: true,
          result: reportResult.data
        };
        break;
      // SuperDuper Agent Tools
      case 'consult_code_architect':
        console.log(`🏗️ [${executiveName}] Consulting Code Architect`);
        const codeArchResult = await supabase.functions.invoke('superduper-code-architect', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = codeArchResult.error ? {
          success: false,
          error: codeArchResult.error.message
        } : {
          success: true,
          result: codeArchResult.data
        };
        break;
      case 'consult_business_strategist':
        console.log(`📈 [${executiveName}] Consulting Business Strategist`);
        const bizResult = await supabase.functions.invoke('superduper-business-growth', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = bizResult.error ? {
          success: false,
          error: bizResult.error.message
        } : {
          success: true,
          result: bizResult.data
        };
        break;
      case 'consult_finance_expert':
        console.log(`💰 [${executiveName}] Consulting Finance Expert`);
        const financeResult = await supabase.functions.invoke('superduper-finance-investment', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = financeResult.error ? {
          success: false,
          error: financeResult.error.message
        } : {
          success: true,
          result: financeResult.data
        };
        break;
      case 'consult_communication_expert':
        console.log(`✉️ [${executiveName}] Consulting Communication Expert`);
        const commResult = await supabase.functions.invoke('superduper-communication-outreach', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = commResult.error ? {
          success: false,
          error: commResult.error.message
        } : {
          success: true,
          result: commResult.data
        };
        break;
      case 'consult_content_producer':
        console.log(`🎬 [${executiveName}] Consulting Content Producer`);
        const contentResult = await supabase.functions.invoke('superduper-content-media', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = contentResult.error ? {
          success: false,
          error: contentResult.error.message
        } : {
          success: true,
          result: contentResult.data
        };
        break;
      case 'consult_brand_designer':
        console.log(`🎨 [${executiveName}] Consulting Brand Designer`);
        const designResult = await supabase.functions.invoke('superduper-design-brand', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = designResult.error ? {
          success: false,
          error: designResult.error.message
        } : {
          success: true,
          result: designResult.data
        };
        break;
      case 'consult_career_coach':
        console.log(`🎯 [${executiveName}] Consulting Career Coach`);
        const coachResult = await supabase.functions.invoke('superduper-development-coach', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = coachResult.error ? {
          success: false,
          error: coachResult.error.message
        } : {
          success: true,
          result: coachResult.data
        };
        break;
      case 'consult_domain_specialist':
        console.log(`🌍 [${executiveName}] Consulting Domain Specialist`);
        const domainResult = await supabase.functions.invoke('superduper-domain-experts', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = domainResult.error ? {
          success: false,
          error: domainResult.error.message
        } : {
          success: true,
          result: domainResult.data
        };
        break;
      case 'consult_integration_specialist':
        console.log(`🔌 [${executiveName}] Consulting Integration Specialist`);
        const integrationResult = await supabase.functions.invoke('superduper-integration', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = integrationResult.error ? {
          success: false,
          error: integrationResult.error.message
        } : {
          success: true,
          result: integrationResult.data
        };
        break;
      case 'consult_research_analyst':
        console.log(`🔬 [${executiveName}] Consulting Research Analyst`);
        const researchResult = await supabase.functions.invoke('superduper-research-intelligence', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = researchResult.error ? {
          success: false,
          error: researchResult.error.message
        } : {
          success: true,
          result: researchResult.data
        };
        break;
      case 'consult_viral_content_expert':
        console.log(`🚀 [${executiveName}] Consulting Viral Content Expert`);
        const viralResult = await supabase.functions.invoke('superduper-social-viral', {
          body: {
            action: parsedArgs.action,
            params: {
              context: parsedArgs.context
            }
          }
        });
        result1 = viralResult.error ? {
          success: false,
          error: viralResult.error.message
        } : {
          success: true,
          result: viralResult.data
        };
        break;
      case 'route_to_superduper_agent':
        console.log(`🎯 [${executiveName}] Routing to SuperDuper specialist`);
        const routeResult = await supabase.functions.invoke('superduper-router', {
          body: {
            request: parsedArgs.request,
            preferred_specialist: parsedArgs.preferred_specialist
          }
        });
        result1 = routeResult.error ? {
          success: false,
          error: routeResult.error.message
        } : {
          success: true,
          result: routeResult.data
        };
        break;
      // ====================================================================
      // DIAGNOSTIC & ANALYTICS TOOLS
      // ====================================================================
      case 'get_edge_function_logs':
        console.log(`📋 [${executiveName}] Get Edge Function Logs: ${parsedArgs.function_name}`);
        const logsResult = await supabase.functions.invoke('get-edge-function-logs', {
          body: parsedArgs
        });
        result1 = logsResult.error ? {
          success: false,
          error: logsResult.error.message
        } : {
          success: true,
          result: logsResult.data
        };
        break;
      case 'get_function_version_analytics':
        console.log(`📊 [${executiveName}] Get Function Version Analytics: ${parsedArgs.function_name}`);
        const versionAnalyticsResult = await supabase.functions.invoke('get-function-version-analytics', {
          body: parsedArgs
        });
        result1 = versionAnalyticsResult.error ? {
          success: false,
          error: versionAnalyticsResult.error.message
        } : {
          success: true,
          result: versionAnalyticsResult.data
        };
        break;
      case 'get_tool_usage_analytics':
        console.log(`📈 [${executiveName}] Get Tool Usage Analytics`);
        const toolAnalyticsResult = await supabase.functions.invoke('tool-usage-analytics', {
          body: parsedArgs
        });
        result1 = toolAnalyticsResult.error ? {
          success: false,
          error: toolAnalyticsResult.error.message
        } : {
          success: true,
          result: toolAnalyticsResult.data
        };
        break;
      // ====================================================================
      // SYSTEM HEALTH & MONITORING TOOLS (FIXED)
      // ====================================================================
      case 'check_system_status':
      case 'check_ecosystem_health':
      case 'generate_health_report':
        console.log(`🩺 [${executiveName}] System Health Check: ${name}`);
        const healthResult = await supabase.functions.invoke('system-status', {
          body: {
            action: name,
            ...parsedArgs
          }
        });
        result1 = healthResult.error ? {
          success: false,
          error: healthResult.error.message
        } : {
          success: true,
          result: healthResult.data
        };
        break;
      // ====================================================================
      // CODE EXECUTION TOOLS (FIXED)
      // ====================================================================
      case 'run_code':
        // Alias for execute_python
        console.log(`🐍 [${executiveName}] Run Code (alias for execute_python)`);
        const runCodeResult = await supabase.functions.invoke('python-executor', {
          body: {
            code: parsedArgs.code,
            purpose: parsedArgs.purpose || 'Code execution via run_code',
            source: executiveName.toLowerCase() + '-executive',
            agent_id: executiveName.toLowerCase()
          }
        });
        result1 = runCodeResult.error ? {
          success: false,
          error: runCodeResult.error.message
        } : {
          success: true,
          result: runCodeResult.data
        };
        break;
      // ====================================================================
      // MCP & PATENT TOOLS (FIXED)
      // ====================================================================
      case 'search_uspto_patents':
        console.log(`🔍 [${executiveName}] USPTO Patent Search`);
        const patentResult = await supabase.functions.invoke('uspto-patent-mcp', {
          body: {
            action: 'search',
            ...parsedArgs
          }
        });
        result1 = patentResult.error ? {
          success: false,
          error: patentResult.error.message
        } : {
          success: true,
          result: patentResult.data
        };
        break;
      // ====================================================================
      // WORKFLOW TOOLS (FIXED)
      // ====================================================================
      case 'list_workflow_templates':
        console.log(`📋 [${executiveName}] List Workflow Templates`);
        const templatesResult = await supabase.functions.invoke('workflow-template-manager', {
          body: {
            action: 'list_templates',
            ...parsedArgs
          }
        });
        result1 = templatesResult.error ? {
          success: false,
          error: templatesResult.error.message
        } : {
          success: true,
          result: templatesResult.data
        };
        break;
      case 'execute_workflow_template':
        console.log(`▶️ [${executiveName}] Execute Workflow Template: ${parsedArgs.template_id}`);
        const workflowResult = await supabase.functions.invoke('workflow-template-manager', {
          body: {
            action: 'execute_template',
            ...parsedArgs
          }
        });
        result1 = workflowResult.error ? {
          success: false,
          error: workflowResult.error.message
        } : {
          success: true,
          result: workflowResult.data
        };
        break;
      // Agent management tools
      case 'list_agents':
      case 'spawn_agent':
      case 'update_agent_status':
      case 'assign_task':
      case 'list_tasks':
      case 'update_task_status':
      case 'set_task_status':
      case 'get_task_details':
      case 'delete_task':
      case 'get_agent_workload':
      case 'get_agent_by_name':
      case 'get_agent_stats':
      case 'batch_spawn_agents':
      case 'archive_agent':
        const agentResult = await supabase.functions.invoke('agent-manager', {
          body: {
            action: name.replace('_', '_').toLowerCase(),
            data: parsedArgs
          }
        });
        result1 = {
          success: true,
          result: agentResult.data
        };
        break;
      // ====================================================================
      // KNOWLEDGE MANAGEMENT TOOLS
      // ====================================================================
      case 'store_knowledge':
        console.log(`🧠 [${executiveName}] Store Knowledge: ${parsedArgs.name}`);
        const storeKnowledgeResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'store_knowledge',
            data: parsedArgs
          }
        });
        result1 = storeKnowledgeResult.error ? {
          success: false,
          error: storeKnowledgeResult.error.message
        } : {
          success: true,
          result: storeKnowledgeResult.data
        };
        break;
      case 'search_knowledge':
        console.log(`🔍 [${executiveName}] Search Knowledge: ${parsedArgs.search_term || parsedArgs.entity_type || 'all'}`);
        const searchKnowledgeResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'search_knowledge',
            data: parsedArgs
          }
        });
        result1 = searchKnowledgeResult.error ? {
          success: false,
          error: searchKnowledgeResult.error.message
        } : {
          success: true,
          result: searchKnowledgeResult.data
        };
        break;
      case 'recall_entity':
        console.log(`🧠 [${executiveName}] Recall Entity: ${parsedArgs.name}`);
        const recallResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'search_knowledge',
            data: {
              search_term: parsedArgs.name
            }
          }
        });
        result1 = recallResult.error ? {
          success: false,
          error: recallResult.error.message
        } : {
          success: true,
          result: recallResult.data
        };
        break;
      case 'create_knowledge_relationship':
        console.log(`🔗 [${executiveName}] Create Knowledge Relationship`);
        const createRelResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'create_relationship',
            data: parsedArgs
          }
        });
        result1 = createRelResult.error ? {
          success: false,
          error: createRelResult.error.message
        } : {
          success: true,
          result: createRelResult.data
        };
        break;
      case 'get_related_knowledge':
        console.log(`🕸️ [${executiveName}] Get Related Knowledge: ${parsedArgs.entity_id}`);
        const relatedResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'get_related_entities',
            data: parsedArgs
          }
        });
        result1 = relatedResult.error ? {
          success: false,
          error: relatedResult.error.message
        } : {
          success: true,
          result: relatedResult.data
        };
        break;
      case 'get_knowledge_status':
        console.log(`📊 [${executiveName}] Get Knowledge Status`);
        const statusResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'check_status',
            data: {}
          }
        });
        result1 = statusResult.error ? {
          success: false,
          error: statusResult.error.message
        } : {
          success: true,
          result: statusResult.data
        };
        break;
      case 'delete_knowledge':
        console.log(`🗑️ [${executiveName}] Delete Knowledge: ${parsedArgs.entity_id}`);
        const deleteKnowledgeResult = await supabase.functions.invoke('knowledge-manager/store', {
          body: {
            action: 'delete_knowledge',
            data: parsedArgs
          }
        });
        result1 = deleteKnowledgeResult.error ? {
          success: false,
          error: deleteKnowledgeResult.error.message
        } : {
          success: true,
          result: deleteKnowledgeResult.data
        };
        break;
      // ====================================================================
      // DEPLOYMENT AUTOMATION TOOLS
      // ====================================================================
      case 'deploy_approved_function':
        console.log(`🚀 [${executiveName}] Deploy Approved Function: ${parsedArgs.proposal_id}`);
        const deployResult = await supabase.functions.invoke('deploy-approved-edge-function', {
          body: {
            action: 'deploy_single',
            proposal_id: parsedArgs.proposal_id,
            auto_deploy: parsedArgs.auto_deploy ?? true,
            run_health_check: parsedArgs.run_health_check ?? true,
            version_tag: parsedArgs.version_tag
          }
        });
        result1 = deployResult.error ? {
          success: false,
          error: deployResult.error.message
        } : {
          success: true,
          result: deployResult.data
        };
        break;
      case 'get_deployment_status':
        console.log(`📊 [${executiveName}] Get Deployment Status`);
        const statusDeployResult = await supabase.functions.invoke('deploy-approved-edge-function', {
          body: {
            action: 'get_deployment_status',
            proposal_id: parsedArgs.proposal_id
          }
        });
        result1 = statusDeployResult.error ? {
          success: false,
          error: statusDeployResult.error.message
        } : {
          success: true,
          result: statusDeployResult.data
        };
        break;
      case 'rollback_deployment':
        console.log(`⏮️ [${executiveName}] Rollback Deployment: ${parsedArgs.proposal_id}`);
        const rollbackResult = await supabase.functions.invoke('deploy-approved-edge-function', {
          body: {
            action: 'rollback',
            proposal_id: parsedArgs.proposal_id
          }
        });
        result1 = rollbackResult.error ? {
          success: false,
          error: rollbackResult.error.message
        } : {
          success: true,
          result: rollbackResult.data
        };
        break;
      case 'process_deployment_queue':
        console.log(`📋 [${executiveName}] Process Deployment Queue`);
        const queueResult = await supabase.functions.invoke('deploy-approved-edge-function', {
          body: {
            action: 'process_queue',
            auto_deploy: parsedArgs.auto_deploy ?? true,
            run_health_check: parsedArgs.run_health_check ?? true
          }
        });
        result1 = queueResult.error ? {
          success: false,
          error: queueResult.error.message
        } : {
          success: true,
          result: queueResult.data
        };
        break;
      // ====================================================================
      // STAE - SUITE TASK AUTOMATION ENGINE TOOLS
      // ====================================================================
      case 'create_task_from_template':
        console.log(`📋 [${executiveName}] STAE: Create Task from Template`);
        const createTemplateResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'create_from_template',
            data: {
              ...parsedArgs,
              created_by_user_id: session_credentials?.user_id
            }
          }
        });
        result1 = createTemplateResult.error ? {
          success: false,
          error: createTemplateResult.error.message
        } : {
          success: true,
          result: createTemplateResult.data
        };
        break;
      case 'smart_assign_task':
        console.log(`🤖 [${executiveName}] STAE: Smart Assign Task`);
        const smartAssignResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'smart_assign',
            data: parsedArgs
          }
        });
        result1 = smartAssignResult.error ? {
          success: false,
          error: smartAssignResult.error.message
        } : {
          success: true,
          result: smartAssignResult.data
        };
        break;
      case 'get_automation_metrics':
        console.log(`📊 [${executiveName}] STAE: Get Automation Metrics`);
        const metricsResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'get_metrics',
            data: parsedArgs
          }
        });
        result1 = metricsResult.error ? {
          success: false,
          error: metricsResult.error.message
        } : {
          success: true,
          result: metricsResult.data
        };
        break;
      case 'update_task_checklist':
        console.log(`✅ [${executiveName}] STAE Phase 2: Update Checklist`);
        const checklistResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'update_checklist_item',
            data: parsedArgs
          }
        });
        result1 = checklistResult.error ? {
          success: false,
          error: checklistResult.error.message
        } : {
          success: true,
          result: checklistResult.data
        };
        break;
      case 'resolve_blocked_task':
        console.log(`🔓 [${executiveName}] STAE Phase 2: Resolve Blocked Task`);
        const resolveResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'auto_resolve_blockers',
            data: {
              task_id: parsedArgs.task_id
            }
          }
        });
        result1 = resolveResult.error ? {
          success: false,
          error: resolveResult.error.message
        } : {
          success: true,
          result: resolveResult.data
        };
        break;
      case 'get_stae_recommendations':
        console.log(`💡 [${executiveName}] STAE Phase 3: Get Recommendations`);
        const recsResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'get_optimization_recommendations',
            data: {}
          }
        });
        result1 = recsResult.error ? {
          success: false,
          error: recsResult.error.message
        } : {
          success: true,
          result: recsResult.data
        };
        break;
      case 'advance_task_stage':
        console.log(`⏩ [${executiveName}] STAE Phase 2: Advance Task Stage`);
        const advanceResult = await supabase.functions.invoke('suite-task-automation-engine', {
          body: {
            action: 'advance_task_stage',
            data: parsedArgs
          }
        });
        result1 = advanceResult.error ? {
          success: false,
          error: advanceResult.error.message
        } : {
          success: true,
          result: advanceResult.data
        };
        break;
      // ====================================================================
      // VSCO WORKSPACE TOOLS
      // ====================================================================
      case 'vsco_manage_jobs':
        console.log(`📸 [${executiveName}] VSCO Manage Jobs: ${parsedArgs.action}`);
        const vscoJobsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoJobsResult.error ? {
          success: false,
          error: vscoJobsResult.error.message
        } : {
          success: true,
          result: vscoJobsResult.data
        };
        break;
      case 'vsco_manage_contacts':
        console.log(`📇 [${executiveName}] VSCO Manage Contacts: ${parsedArgs.action}`);
        const vscoContactsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoContactsResult.error ? {
          success: false,
          error: vscoContactsResult.error.message
        } : {
          success: true,
          result: vscoContactsResult.data
        };
        break;
      case 'vsco_manage_events':
        console.log(`📅 [${executiveName}] VSCO Manage Events: ${parsedArgs.action}`);
        const vscoEventsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoEventsResult.error ? {
          success: false,
          error: vscoEventsResult.error.message
        } : {
          success: true,
          result: vscoEventsResult.data
        };
        break;
      case 'vsco_analytics':
        console.log(`📊 [${executiveName}] VSCO Analytics: ${parsedArgs.action}`);
        const vscoAnalyticsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoAnalyticsResult.error ? {
          success: false,
          error: vscoAnalyticsResult.error.message
        } : {
          success: true,
          result: vscoAnalyticsResult.data
        };
        break;
      case 'vsco_manage_products':
        console.log(`💰 [${executiveName}] VSCO Manage Products: ${parsedArgs.action}`);
        const vscoProductsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoProductsResult.error ? {
          success: false,
          error: vscoProductsResult.error.message
        } : {
          success: true,
          result: vscoProductsResult.data
        };
        break;
      // ====================================================================
      // ECOSYSTEM DISCOVERY TOOLS
      // ====================================================================
      case 'search_edge_functions':
        console.log(`🔍 [${executiveName}] Search Edge Functions: ${parsedArgs.query}`);
        const searchFuncResult = await supabase.functions.invoke('search-edge-functions', {
          body: parsedArgs
        });
        result1 = searchFuncResult.error ? {
          success: false,
          error: searchFuncResult.error.message
        } : {
          success: true,
          result: searchFuncResult.data
        };
        break;
      case 'list_available_functions':
        console.log(`📋 [${executiveName}] List Available Functions`);
        const listFuncResult = await supabase.functions.invoke('list-available-functions', {
          body: parsedArgs
        });
        result1 = listFuncResult.error ? {
          success: false,
          error: listFuncResult.error.message
        } : {
          success: true,
          result: listFuncResult.data
        };
        break;
      case 'vsco_manage_worksheets':
        console.log(`📋 [${executiveName}] VSCO Manage Worksheets: ${parsedArgs.action}`);
        const vscoWorksheetsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoWorksheetsResult.error ? {
          success: false,
          error: vscoWorksheetsResult.error.message
        } : {
          success: true,
          result: vscoWorksheetsResult.data
        };
        break;
      case 'vsco_manage_notes':
        console.log(`📝 [${executiveName}] VSCO Manage Notes: ${parsedArgs.action}`);
        const vscoNotesResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoNotesResult.error ? {
          success: false,
          error: vscoNotesResult.error.message
        } : {
          success: true,
          result: vscoNotesResult.data
        };
        break;
      case 'vsco_manage_financials':
        console.log(`💵 [${executiveName}] VSCO Manage Financials: ${parsedArgs.action}`);
        const vscoFinancialsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoFinancialsResult.error ? {
          success: false,
          error: vscoFinancialsResult.error.message
        } : {
          success: true,
          result: vscoFinancialsResult.data
        };
        break;
      case 'vsco_manage_settings':
        console.log(`⚙️ [${executiveName}] VSCO Manage Settings: ${parsedArgs.action}`);
        const vscoSettingsResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoSettingsResult.error ? {
          success: false,
          error: vscoSettingsResult.error.message
        } : {
          success: true,
          result: vscoSettingsResult.data
        };
        break;
      case 'vsco_manage_users':
        console.log(`👥 [${executiveName}] VSCO Manage Users: ${parsedArgs.action}`);
        const vscoUsersResult = await supabase.functions.invoke('vsco-workspace', {
          body: {
            action: parsedArgs.action,
            data: parsedArgs,
            executive: executiveName
          }
        });
        result1 = vscoUsersResult.error ? {
          success: false,
          error: vscoUsersResult.error.message
        } : {
          success: true,
          result: vscoUsersResult.data
        };
        break;
      // ====================================================================
      // GITHUB CONTRIBUTION SYNC TOOLS
      // ====================================================================
      case 'sync_github_contributions':
        console.log(`🔄 [${executiveName}] Sync GitHub Contributions`);
        const syncContribResult = await supabase.functions.invoke('sync-github-contributions', {
          body: {
            repo: parsedArgs.repo || 'XMRT-Ecosystem',
            owner: parsedArgs.owner || 'DevGruGold',
            max_commits: parsedArgs.max_commits || 100
          }
        });
        result1 = syncContribResult.error ? {
          success: false,
          error: syncContribResult.error.message
        } : {
          success: true,
          result: syncContribResult.data
        };
        break;
      // ==================== ECOSYSTEM COORDINATION TOOLS ====================
      case 'trigger_ecosystem_coordination':
        {
          try {
            const cycleType = args.cycle_type || 'standard';
            console.log(`🚀 Triggering ${cycleType} ecosystem coordination...`);
            const response = await fetch('https://xmrt-ecosystem.vercel.app/api/tick', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                cycle_type: cycleType
              }),
              signal: AbortSignal.timeout(120000) // 2 minute timeout
            });
            if (!response.ok) {
              return {
                success: false,
                error: `Coordination trigger failed: ${response.status} ${response.statusText}`
              };
            }
            const data = await response.json();
            return {
              success: true,
              message: `Ecosystem coordination cycle (${cycleType}) completed successfully`,
              timestamp: data.timestamp,
              agents_discovered: data.agents?.length || 0,
              health_checks_performed: data.health_checks?.length || 0,
              coordination_summary: data.summary || 'Coordination cycle completed',
              details: data
            };
          } catch (error) {
            console.error('Ecosystem coordination error:', error);
            return {
              success: false,
              error: `Failed to trigger coordination: ${error.message}`
            };
          }
        }
      case 'get_ecosystem_status':
        {
          try {
            console.log('📊 Fetching ecosystem status...');
            // Query agents endpoint
            const agentsResponse = await fetch('https://xmrt-ecosystem.vercel.app/api/agents', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(30000)
            });
            // Query system info
            const systemResponse = await fetch('https://xmrt-ecosystem.vercel.app/api/index', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(30000)
            });
            const agentsData = agentsResponse.ok ? await agentsResponse.json() : {
              agents: []
            };
            const systemData = systemResponse.ok ? await systemResponse.json() : {
              status: 'unknown'
            };
            return {
              success: true,
              ecosystem_health: systemData.status || 'healthy',
              version: systemData.version || 'unknown',
              total_agents: agentsData.agents?.length || 0,
              agents: agentsData.agents || [],
              timestamp: new Date().toISOString(),
              deployment_url: 'https://xmrt-ecosystem.vercel.app',
              message: `Ecosystem status: ${agentsData.agents?.length || 0} agents discovered`
            };
          } catch (error) {
            console.error('Get ecosystem status error:', error);
            return {
              success: false,
              error: `Failed to get ecosystem status: ${error.message}`
            };
          }
        }
      case 'query_ecosystem_agents':
        {
          try {
            const filterBy = args.filter_by || 'all';
            console.log(`🔍 Querying ecosystem agents (filter: ${filterBy})...`);
            const response = await fetch('https://xmrt-ecosystem.vercel.app/api/agents', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(30000)
            });
            if (!response.ok) {
              return {
                success: false,
                error: `Agent query failed: ${response.status}`
              };
            }
            const data = await response.json();
            let agents = data.agents || [];
            // Apply filters
            if (filterBy === 'active') {
              agents = agents.filter((a)=>a.status === 'active' || a.status === 'online');
            } else if (filterBy === 'supabase') {
              agents = agents.filter((a)=>a.source === 'xmrtcouncil_supabase' || a.type === 'supabase_edge_function');
            } else if (filterBy === 'vercel') {
              agents = agents.filter((a)=>a.type === 'vercel_api' || a.source?.includes('vercel'));
            } else if (filterBy === 'priority') {
              agents = agents.sort((a, b)=>(a.priority || 5) - (b.priority || 5));
            }
            return {
              success: true,
              total_agents: agents.length,
              filter_applied: filterBy,
              agents: agents,
              agent_summary: agents.map((a)=>({
                  name: a.name || a.display_name,
                  type: a.type,
                  status: a.status,
                  source: a.source
                })),
              message: `Found ${agents.length} agents matching filter: ${filterBy}`
            };
          } catch (error) {
            console.error('Query ecosystem agents error:', error);
            return {
              success: false,
              error: `Failed to query agents: ${error.message}`
            };
          }
        }
      // ====================================================================
      // ANALYTICS & LOG MANAGEMENT TOOLS
      // ====================================================================
      case 'sync_function_logs':
        console.log(`🔄 [${executiveName}] Sync function logs - ${parsedArgs.hours_back || 1}h back`);
        const syncLogResult = await supabase.functions.invoke('sync-function-logs', {
          body: {
            hours_back: Math.min(parsedArgs.hours_back || 1, 24)
          }
        });
        result1 = syncLogResult.error ? {
          success: false,
          error: syncLogResult.error.message
        } : {
          success: true,
          result: syncLogResult.data
        };
        break;
      case 'get_function_usage_analytics':
        console.log(`📊 [${executiveName}] Get function usage analytics`);
        const usageAnalyticsResult = await supabase.functions.invoke('function-usage-analytics', {
          body: {
            function_name: parsedArgs.function_name,
            time_window_hours: parsedArgs.time_window_hours || 24,
            group_by: parsedArgs.group_by || 'function'
          }
        });
        result1 = usageAnalyticsResult.error ? {
          success: false,
          error: usageAnalyticsResult.error.message
        } : {
          success: true,
          result: usageAnalyticsResult.data
        };
        break;
      case 'check_system_status':
        console.log(`🏥 [${executiveName}] Check system status`);
        const systemStatusResult = await supabase.functions.invoke('system-status', {
          body: {}
        });
        result1 = systemStatusResult.error ? {
          success: false,
          error: systemStatusResult.error.message
        } : {
          success: true,
          result: systemStatusResult.data
        };
        break;
      case 'query_cron_registry':
        console.log(`⏰ [${executiveName}] Query cron registry: ${parsedArgs?.action || 'list_all'}`);
        const cronRegistryResult = await supabase.functions.invoke('get-cron-registry', {
          body: {
            action: parsedArgs?.action || 'list_all',
            platform: parsedArgs?.platform,
            function_name: parsedArgs?.function_name,
            job_name: parsedArgs?.job_name,
            include_inactive: parsedArgs?.include_inactive,
            time_window_hours: parsedArgs?.time_window_hours
          }
        });
        result1 = cronRegistryResult.error ? {
          success: false,
          error: cronRegistryResult.error.message
        } : {
          success: true,
          ...cronRegistryResult.data
        };
        break;
      // ====================================================================
      // 🖼️🎬 MUAPI MEDIA GENERATION (Image + Video via MuAPI)
      // ====================================================================
      case 'vertex_generate_image':
        {
          console.log(`🖼️ [${executiveName}] MuAPI Generate Image: ${parsedArgs.prompt?.slice(0, 60)}...`);
          const imgResult = await supabase.functions.invoke('vertex-ai-chat', {
            body: {
              action: 'generate_image',
              prompt: parsedArgs.prompt,
              image_model: parsedArgs.model || 'flux-dev-image',
              aspect_ratio: parsedArgs.aspect_ratio || '1:1'
            }
          });
          if (imgResult.error) {
            result1 = {
              success: false,
              error: imgResult.error.message
            };
          } else {
            const d = imgResult.data?.data || imgResult.data;
            result1 = {
              success: true,
              publicUrl: d?.publicUrl || d?.result?.publicUrl || null,
              mimeType: d?.mimeType || 'image/png',
              model: parsedArgs.model || 'flux-dev-image',
              prompt: parsedArgs.prompt,
              result: d
            };
          }
          break;
        }
      case 'vertex_generate_video':
        {
          console.log(`🎬 [${executiveName}] MuAPI Generate Video: ${parsedArgs.prompt?.slice(0, 60)}...`);
          const vidResult = await supabase.functions.invoke('vertex-ai-chat', {
            body: {
              action: 'generate_video',
              prompt: parsedArgs.prompt,
              video_model: parsedArgs.model || 'veo3-fast-text-to-video',
              duration_seconds: parsedArgs.duration_seconds || 5,
              aspect_ratio: parsedArgs.aspect_ratio || '16:9'
            }
          });
          if (vidResult.error) {
            result1 = {
              success: false,
              error: vidResult.error.message
            };
          } else {
            const d = vidResult.data?.data || vidResult.data;
            result1 = {
              success: true,
              operation_name: d?.operation_name || d?.result?.operation_name || null,
              status: d?.status || d?.result?.status || 'pending',
              message: 'Video generation started via MuAPI. Use vertex_check_video_status with the operation_name to poll for completion.',
              result: d
            };
          }
          break;
        }
      case 'vertex_check_video_status':
        {
          console.log(`📽️ [${executiveName}] Check Video Status: ${parsedArgs.operation_name}`);
          const statusResult = await supabase.functions.invoke('vertex-ai-chat', {
            body: {
              action: 'check_video_status',
              operation_name: parsedArgs.operation_name
            }
          });
          if (statusResult.error) {
            result1 = {
              success: false,
              error: statusResult.error.message
            };
          } else {
            const d = statusResult.data?.data?.result || statusResult.data?.data || statusResult.data;
            const videoUrls = d?.videoUrls || [];
            result1 = {
              success: true,
              status: d?.status || 'pending',
              done: d?.status === 'done',
              videoUrls,
              videoUrl: videoUrls[0] || null,
              operation_name: parsedArgs.operation_name,
              result: d
            };
          }
          break;
        }
      // ====================================================================
      // 🔗 OPENCLAW RELAY TOOLS — Bidirectional communication with local OpenClaw
      // ====================================================================
      case 'send_to_openclaw':
        {
          console.log(`📡 [${executiveName}] Sending message to local OpenClaw agent`);
          const relayTag = parsedArgs.relay_tag || `eliza-relay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const relayResult = await supabase.functions.invoke('openclaw-relay', {
            body: {
              action: 'send',
              message: parsedArgs.message,
              relay_tag: relayTag,
              metadata: {
                sent_by: executiveName,
                ...parsedArgs.metadata || {}
              }
            }
          });
          result1 = relayResult.error ? {
            success: false,
            error: `openclaw-relay error: ${relayResult.error.message}`
          } : {
            success: true,
            relay_tag: relayTag,
            message_id: relayResult.data?.message_id,
            status: 'queued',
            message: 'Message queued for OpenClaw. Call check_openclaw_reply with the relay_tag to retrieve the response.',
            result: relayResult.data
          };
          break;
        }
      case 'check_openclaw_reply':
        {
          console.log(`📬 [${executiveName}] Checking OpenClaw reply for relay_tag: ${parsedArgs.relay_tag}`);
          if (!parsedArgs.relay_tag) {
            result1 = {
              success: false,
              error: 'check_openclaw_reply requires relay_tag. Use the relay_tag returned by send_to_openclaw.'
            };
            break;
          }
          const replyResult = await supabase.functions.invoke('openclaw-relay', {
            body: {
              action: 'check_reply',
              relay_tag: parsedArgs.relay_tag
            }
          });
          result1 = replyResult.error ? {
            success: false,
            error: `openclaw-relay check error: ${replyResult.error.message}`
          } : {
            success: true,
            has_reply: !!replyResult.data?.reply,
            reply: replyResult.data?.reply || null,
            relay_tag: parsedArgs.relay_tag,
            status: replyResult.data?.reply ? 'replied' : 'pending',
            result: replyResult.data
          };
          break;
        }
      default:
        console.warn(`⚠️ [${executiveName}] Unknown tool: ${name}`);
        result1 = {
          success: false,
          error: `Unknown tool: ${name}. Available tools include: invoke_edge_function, execute_python, createGitHubIssue, list_agents, assign_task, check_system_status, get_tool_usage_analytics, store_knowledge, search_knowledge, deploy_approved_function, create_task_from_template, smart_assign_task, get_automation_metrics, update_task_checklist, resolve_blocked_task, get_stae_recommendations, advance_task_stage, sync_github_contributions, sync_function_logs, get_function_usage_analytics, query_cron_registry, vertex_generate_image, vertex_generate_video, vertex_check_video_status, send_to_openclaw, check_openclaw_reply, and more.`
        };
    }
    const executionTime = Date.now() - startTime;
    // Add learning point if there was an error
    if (result1.error && !result1.learning_point) {
      result1.learning_point = analyzeLearningFromError(name, result1.error, parsedArgs);
    }
    // Log function usage
    await logFunctionUsage(supabase, {
      function_name: name,
      executive_name: executiveName,
      invoked_by: 'tool_call',
      success: result1.success !== false,
      execution_time_ms: executionTime,
      parameters: parsedArgs,
      result_summary: result1.success ? 'Tool executed successfully' : result1.error,
      metadata: result1.learning_point ? {
        learning_point: result1.learning_point
      } : undefined
    });
    return result1;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
    const learningPoint = analyzeLearningFromError(name, errorMessage, parsedArgs);
    console.error(`❌ [${executiveName}] Tool execution error for ${name}:`, error);
    // Log failed execution
    await logFunctionUsage(supabase, {
      function_name: name,
      executive_name: executiveName,
      invoked_by: 'tool_call',
      success: false,
      execution_time_ms: executionTime,
      parameters: parsedArgs,
      error_message: errorMessage,
      metadata: {
        learning_point: learningPoint
      }
    });
    return {
      success: false,
      error: errorMessage,
      learning_point: learningPoint
    };
  }
}
// Add VSCO tool handlers to the switch statement by exporting a helper
export async function getVscoToolHandler(name, parsedArgs, supabase, executiveName) {
  switch(name){
    case 'vsco_manage_jobs':
      console.log(`📸 [${executiveName}] VSCO Manage Jobs: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_contacts':
      console.log(`📇 [${executiveName}] VSCO Manage Contacts: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_events':
      console.log(`📅 [${executiveName}] VSCO Manage Events: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_analytics':
      console.log(`📊 [${executiveName}] VSCO Analytics: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_products':
      console.log(`💰 [${executiveName}] VSCO Manage Products: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_worksheets':
      console.log(`📋 [${executiveName}] VSCO Manage Worksheets: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_notes':
      console.log(`📝 [${executiveName}] VSCO Manage Notes: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_financials':
      console.log(`💵 [${executiveName}] VSCO Manage Financials: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_settings':
      console.log(`⚙️ [${executiveName}] VSCO Manage Settings: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'vsco_manage_users':
      console.log(`👥 [${executiveName}] VSCO Manage Users: ${parsedArgs.action}`);
      return supabase.functions.invoke('vsco-workspace', {
        body: {
          action: parsedArgs.action,
          data: parsedArgs,
          executive: executiveName
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    // ====================================================================
    // CORPORATE LICENSING TOOLS
    // ====================================================================
    case 'start_license_application':
      console.log(`📋 [${executiveName}] Start License Application`);
      return supabase.functions.invoke('process-license-application', {
        body: {
          action: 'create_draft',
          data: {
            session_key: parsedArgs.session_key,
            partial_data: parsedArgs
          }
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'update_license_application':
      console.log(`📝 [${executiveName}] Update License Application`);
      if (parsedArgs.application_id) {
        return supabase.functions.invoke('process-license-application', {
          body: {
            action: 'update_application',
            data: {
              application_id: parsedArgs.application_id,
              updates: parsedArgs
            }
          }
        }).then((res)=>res.error ? {
            success: false,
            error: res.error.message
          } : {
            success: true,
            result: res.data
          });
      } else {
        // Find by session key and update
        return supabase.functions.invoke('process-license-application', {
          body: {
            action: 'get_draft_by_session',
            data: {
              session_key: parsedArgs.session_key
            }
          }
        }).then((draftResult)=>{
          if (draftResult.data?.draft?.id) {
            return supabase.functions.invoke('process-license-application', {
              body: {
                action: 'update_application',
                data: {
                  application_id: draftResult.data.draft.id,
                  updates: parsedArgs
                }
              }
            }).then((res)=>res.error ? {
                success: false,
                error: res.error.message
              } : {
                success: true,
                result: res.data
              });
          }
          return {
            success: false,
            error: 'No draft application found for this session'
          };
        });
      }
    case 'calculate_license_savings':
      console.log(`💰 [${executiveName}] Calculate License Savings`);
      return supabase.functions.invoke('process-license-application', {
        body: {
          action: 'calculate_savings',
          data: parsedArgs
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    case 'submit_license_application':
      console.log(`✅ [${executiveName}] Submit License Application`);
      if (!parsedArgs.compliance_commitment) {
        return {
          success: false,
          error: 'User must accept the ethical commitment before submitting'
        };
      }
      if (parsedArgs.application_id) {
        return supabase.functions.invoke('process-license-application', {
          body: {
            action: 'update_application',
            data: {
              application_id: parsedArgs.application_id,
              updates: {
                application_status: 'submitted',
                compliance_commitment: true
              }
            }
          }
        }).then((res)=>res.error ? {
            success: false,
            error: res.error.message
          } : {
            success: true,
            result: res.data
          });
      } else {
        return supabase.functions.invoke('process-license-application', {
          body: {
            action: 'get_draft_by_session',
            data: {
              session_key: parsedArgs.session_key
            }
          }
        }).then((draftResult)=>{
          if (draftResult.data?.draft?.id) {
            return supabase.functions.invoke('process-license-application', {
              body: {
                action: 'update_application',
                data: {
                  application_id: draftResult.data.draft.id,
                  updates: {
                    application_status: 'submitted',
                    compliance_commitment: true
                  }
                }
              }
            }).then((res)=>res.error ? {
                success: false,
                error: res.error.message
              } : {
                success: true,
                result: res.data
              });
          }
          return {
            success: false,
            error: 'No draft application found to submit'
          };
        });
      }
    case 'get_license_application_status':
      console.log(`📊 [${executiveName}] Get License Application Status`);
      return supabase.functions.invoke('process-license-application', {
        body: {
          action: 'get_application_status',
          data: parsedArgs
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    // ====================================================================
    // VSCO SUITE QUOTE WORKFLOW
    // ====================================================================
    case 'create_suite_quote':
      console.log(`📧 [${executiveName}] Create Suite Quote for ${parsedArgs.company_name}`);
      return supabase.functions.invoke('create-suite-quote', {
        body: parsedArgs
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          result: res.data
        });
    // ====================================================================
    // GOOGLE CLOUD SERVICES (Unified via google-cloud-auth)
    // ====================================================================
    case 'google_gmail':
    case 'google_cloud_auth':
      console.log(`☁️ [${executiveName}] Google Cloud Auth: ${parsedArgs.action || 'status'}`);
      const cloudAuthPayload = buildGoogleAuthPayload(parsedArgs, name);
      return supabase.functions.invoke('google-cloud-auth', {
        body: cloudAuthPayload
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message,
          credential_required: true
        } : res.data);
    case 'google_drive':
      console.log(`📁 [${executiveName}] Google Drive via google-cloud-auth: ${parsedArgs.action}`);
      const drivePayload = buildGoogleAuthPayload(parsedArgs, name);
      return supabase.functions.invoke('google-cloud-auth', {
        body: drivePayload
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message,
          credential_required: true
        } : res.data);
    case 'google_sheets':
      console.log(`📊 [${executiveName}] Google Sheets via google-cloud-auth: ${parsedArgs.action}`);
      const sheetsPayload = buildGoogleAuthPayload(parsedArgs, name);
      return supabase.functions.invoke('google-cloud-auth', {
        body: sheetsPayload
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message,
          credential_required: true
        } : res.data);
    case 'google_calendar':
      console.log(`📅 [${executiveName}] Google Calendar via google-cloud-auth: ${parsedArgs.action}`);
      const calendarPayload = buildGoogleAuthPayload(parsedArgs, name);
      return supabase.functions.invoke('google-cloud-auth', {
        body: calendarPayload
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message,
          credential_required: true
        } : res.data);
    case 'google_cloud_status':
      console.log(`🔐 [${executiveName}] Google Cloud Status Check`);
      return supabase.functions.invoke('google-cloud-auth', {
        body: {
          action: 'status'
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : res.data);
    case 'introspect_function_actions':
      console.log(`🔍 [${executiveName}] Introspecting function: ${parsedArgs.function_name || 'all'}`);
      return supabase.functions.invoke('get-function-actions', {
        body: {
          function_name: parsedArgs.function_name,
          category: parsedArgs.category
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : res.data);
    // ====================================================================
    // 🔷 MUAPI / OLLAMA EXPRESS TOOLS (replaced Vertex AI)
    // ====================================================================
    case 'vertex_ai_generate':
      console.log(`🔷 [${executiveName}] Ollama Generate: ${parsedArgs.model || 'qwen3.5:latest'}`);
      return supabase.functions.invoke('vertex-ai-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: parsedArgs.prompt
            }
          ],
          model: parsedArgs.model || 'qwen3.5:latest',
          temperature: parsedArgs.temperature || 0.7,
          systemPrompt: parsedArgs.system_prompt
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          response: res.data?.result?.choices?.[0]?.message?.content,
          model: res.data?.result?.model,
          provider: 'ollama'
        });
    case 'vertex_ai_count_tokens':
      console.log(`🔢 [${executiveName}] Token count not available (Ollama doesn't expose countTokens)`);
      return {
        success: false,
        error: 'Token counting not available with local Ollama. Use approximate: text.length / 4.'
      };
    // ====================================================================
    // 🖼️ MUAPI IMAGE GENERATION (replaced Vertex AI Imagen)
    // ====================================================================
    case 'vertex_generate_image':
      console.log(`🖼️ [${executiveName}] MuAPI Image Generation: ${parsedArgs.prompt?.substring(0, 50)}...`);
      return supabase.functions.invoke('vertex-ai-chat', {
        body: {
          action: 'generate_image',
          prompt: parsedArgs.prompt,
          image_model: parsedArgs.model || 'flux-dev-image',
          aspect_ratio: parsedArgs.aspect_ratio || '1:1'
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          images: res.data?.data?.publicUrl ? [
            res.data.data.publicUrl
          ] : [],
          count: res.data?.data?.publicUrl ? 1 : 0,
          text: res.data?.data?.result?.choices?.[0]?.message?.content || '',
          provider: 'muapi'
        });
    // ====================================================================
    // 🎬 MUAPI VIDEO GENERATION (replaced Vertex AI Veo)
    // ====================================================================
    case 'vertex_generate_video':
      console.log(`🎬 [${executiveName}] MuAPI Video Generation: ${parsedArgs.prompt?.substring(0, 50)}...`);
      return supabase.functions.invoke('vertex-ai-chat', {
        body: {
          action: 'generate_video',
          prompt: parsedArgs.prompt,
          video_model: parsedArgs.model || 'veo3-fast-text-to-video',
          aspect_ratio: parsedArgs.aspect_ratio || '16:9',
          duration_seconds: parsedArgs.duration_seconds || 5
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          operation_id: res.data?.data?.operation_name,
          operation_name: res.data?.data?.operation_name,
          message: res.data?.data?.message || 'Video generation started via MuAPI.',
          provider: 'muapi'
        });
    case 'vertex_check_video_status':
      console.log(`📽️ [${executiveName}] Checking video status: ${parsedArgs.operation_name}`);
      return supabase.functions.invoke('vertex-ai-chat', {
        body: {
          action: 'check_video_status',
          operation_name: parsedArgs.operation_name
        }
      }).then((res)=>res.error ? {
          success: false,
          error: res.error.message
        } : {
          success: true,
          done: res.data?.data?.status === 'done',
          video_url: res.data?.data?.videoUrls?.[0],
          video_urls: res.data?.data?.videoUrls,
          error: res.data?.data?.error,
          provider: 'muapi'
        });
    // ====================================================================
    // 🔗 OPENCLAW RELAY — Send messages to local OpenClaw agent
    // ====================================================================
    case 'send_to_openclaw':
      {
        console.log(`📡 [${executiveName}] Sending message to OpenClaw`);
        const ocSendResult = await supabase.functions.invoke('openclaw-relay', {
          body: {
            action: 'send',
            message: parsedArgs.message,
            relay_tag: parsedArgs.relay_tag,
            sender_name: `Eliza (SuiteAI via ${executiveName})`,
            metadata: parsedArgs.metadata ?? {}
          }
        });
        result = ocSendResult.error ? {
          success: false,
          error: ocSendResult.error.message
        } : {
          success: true,
          result: ocSendResult.data,
          tip: `Use check_openclaw_reply with relay_tag="${ocSendResult.data?.relay_tag}" to read OpenClaw's response when it replies.`
        };
        break;
      }
    case 'check_openclaw_reply':
      {
        console.log(`📬 [${executiveName}] Checking for OpenClaw reply: ${parsedArgs.relay_tag}`);
        // Query inbox_messages for a reply from OpenClaw with is_reply=true and matching relay_tag
        const { data: replyRows, error: replyErr } = await supabase.from('inbox_messages').select('id, content, metadata, created_at').eq('channel', 'openclaw').filter('metadata->>relay_tag', 'eq', parsedArgs.relay_tag).filter('metadata->>is_reply', 'eq', 'true').order('created_at', {
          ascending: false
        }).limit(1);
        if (replyErr) {
          result = {
            success: false,
            error: replyErr.message
          };
        } else if (!replyRows || replyRows.length === 0) {
          result = {
            success: true,
            found: false,
            message: 'OpenClaw has not replied yet. Try again in a moment.'
          };
        } else {
          const reply = replyRows[0];
          // Mark as read
          await supabase.from('inbox_messages').update({
            is_read: true
          }).eq('id', reply.id);
          result = {
            success: true,
            found: true,
            reply: reply.content,
            reply_id: reply.id,
            created_at: reply.created_at
          };
        }
        break;
      }
    case 'store_knowledge':
      {
        console.log(`🧠 [${executiveName}] Storing knowledge: ${parsedArgs.name}`);
        const { data: skData, error: skError } = await supabase.functions.invoke('knowledge-manager', {
          body: {
            action: 'store',
            name: parsedArgs.name,
            type: parsedArgs.type,
            description: parsedArgs.description,
            metadata: parsedArgs.metadata || {},
            confidence_score: parsedArgs.confidence_score ?? 0.8
          }
        });
        result = skError ? {
          success: false,
          error: skError.message
        } : {
          success: true,
          ...skData
        };
        break;
      }
    case 'search_knowledge':
      {
        console.log(`🔍 [${executiveName}] Searching knowledge: ${parsedArgs.query}`);
        const { data: sqData, error: sqError } = await supabase.functions.invoke('knowledge-manager', {
          body: {
            action: 'search',
            query: parsedArgs.query,
            type: parsedArgs.type,
            limit: parsedArgs.limit ?? 5
          }
        });
        result = sqError ? {
          success: false,
          error: sqError.message
        } : {
          success: true,
          ...sqData
        };
        break;
      }
    default:
      // Dynamic Fallback: Check if tool exists in the registry
      const registryEntry = EDGE_FUNCTIONS_REGISTRY.find((f)=>f.name === name);
      if (registryEntry) {
        console.log(`🌐 [${executiveName}] Dynamic Registry Tool Execution: ${name}`);
        console.log(`📋 [${executiveName}] Payload:`, JSON.stringify(parsedArgs).substring(0, 200));
        return supabase.functions.invoke(name, {
          body: parsedArgs
        }).then((res)=>{
          if (res.error) {
            console.error(`❌ [${executiveName}] Dynamic tool error (${name}):`, res.error);
            return {
              success: false,
              error: res.error.message
            };
          }
          return {
            success: true,
            result: res.data,
            source: 'dynamic_registry'
          };
        });
      }
      console.warn(`⚠️ [${executiveName}] Unknown tool call: ${name}`);
      return null;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL3Rvb2xFeGVjdXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdXBhYmFzZUNsaWVudCB9IGZyb20gJ2h0dHBzOi8vZXNtLnNoL0BzdXBhYmFzZS9zdXBhYmFzZS1qc0AyLjU4LjAnO1xuaW1wb3J0IHsgbG9nRnVuY3Rpb25Vc2FnZSB9IGZyb20gJy4vZnVuY3Rpb25Vc2FnZUxvZ2dlci50cyc7XG5pbXBvcnQgeyBFREdFX0ZVTkNUSU9OU19SRUdJU1RSWSB9IGZyb20gJy4vZWRnZUZ1bmN0aW9uUmVnaXN0cnkudHMnO1xuXG4vKipcbiAqIEFuYWx5emUgZXJyb3IgdG8gcHJvdmlkZSBsZWFybmluZyBwb2ludHMgZm9yIGV4ZWN1dGl2ZXNcbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZUxlYXJuaW5nRnJvbUVycm9yKHRvb2xOYW1lOiBzdHJpbmcsIGVycm9yOiBzdHJpbmcsIHBhcmFtczogYW55KTogc3RyaW5nIHtcbiAgLy8gTmV0d29yayBlcnJvcnNcbiAgaWYgKGVycm9yLmluY2x1ZGVzKCduZXR3b3JrJykgfHwgZXJyb3IuaW5jbHVkZXMoJ3VybGxpYicpIHx8IGVycm9yLmluY2x1ZGVzKCdyZXF1ZXN0cycpIHx8IGVycm9yLmluY2x1ZGVzKCdodHRwJykpIHtcbiAgICByZXR1cm4gYOKdjCBQeXRob24gc2FuZGJveCBoYXMgbm8gbmV0d29yayBhY2Nlc3MuIEZvciBBUEkgY2FsbHMsIHVzZSBpbnZva2VfZWRnZV9mdW5jdGlvbiBpbnN0ZWFkIG9mIGV4ZWN1dGVfcHl0aG9uLiBFeGFtcGxlOiBpbnZva2VfZWRnZV9mdW5jdGlvbih7IGZ1bmN0aW9uX25hbWU6IFwiZ2l0aHViLWludGVncmF0aW9uXCIsIHBheWxvYWQ6IHsuLi59IH0pYDtcbiAgfVxuXG4gIC8vIEltcG9ydCBlcnJvcnNcbiAgaWYgKGVycm9yLmluY2x1ZGVzKCdNb2R1bGVOb3RGb3VuZEVycm9yJykgfHwgZXJyb3IuaW5jbHVkZXMoJ0ltcG9ydEVycm9yJykpIHtcbiAgICBjb25zdCBtYXRjaCA9IGVycm9yLm1hdGNoKC9ObyBtb2R1bGUgbmFtZWQgJyhbXiddKyknLyk7XG4gICAgY29uc3QgbW9kdWxlTmFtZSA9IG1hdGNoID8gbWF0Y2hbMV0gOiAndW5rbm93bic7XG4gICAgY29uc3Qgc2NpZW50aWZpY01vZHVsZXMgPSBbJ251bXB5JywgJ3NjaXB5JywgJ3BhbmRhcycsICdtYXRwbG90bGliJywgJ3NrbGVhcm4nLCAndGVuc29yZmxvdycsICd0b3JjaCcsICdjdjInLCAnUElMJ107XG4gICAgY29uc3QgaXNTY2llbnRpZmljID0gc2NpZW50aWZpY01vZHVsZXMuaW5jbHVkZXMobW9kdWxlTmFtZS5zcGxpdCgnLicpWzBdKTtcbiAgICBpZiAoaXNTY2llbnRpZmljKSB7XG4gICAgICByZXR1cm4gYOKdjCBNb2R1bGUgJyR7bW9kdWxlTmFtZX0nIGlzIGEgc2NpZW50aWZpYyBsaWJyYXJ5IE5PVCBhdmFpbGFibGUgaW4gUGlzdG9uIHNhbmRib3guIFVzZSBpbnZva2VfZWRnZV9mdW5jdGlvbih7IGZ1bmN0aW9uX25hbWU6IFwianVweXRlci1leGVjdXRvclwiLCBwYXlsb2FkOiB7IGNvZGU6IFwiLi4uXCIgfSB9KSBmb3IgbnVtcHksIHNjaXB5LCBwYW5kYXMsIG1hdHBsb3RsaWIsIHNrbGVhcm4sIGV0Yy4gUGlzdG9uIG9ubHkgaGFzOiBtYXRoLCBqc29uLCBkYXRldGltZSwgcmFuZG9tLCByZSwgY29sbGVjdGlvbnMsIGl0ZXJ0b29scy5gO1xuICAgIH1cbiAgICByZXR1cm4gYOKdjCBNb2R1bGUgJyR7bW9kdWxlTmFtZX0nIG5vdCBhdmFpbGFibGUgaW4gc2FuZGJveC4gQXZhaWxhYmxlOiBtYXRoLCBqc29uLCBkYXRldGltZSwgcmFuZG9tLCByZSwgY29sbGVjdGlvbnMsIGl0ZXJ0b29scy4gRm9yIGV4dGVybmFsIEFQSXMgdXNlIGludm9rZV9lZGdlX2Z1bmN0aW9uLiBGb3Igc2NpZW50aWZpYyBwYWNrYWdlcyAobnVtcHkgZXRjLikgdXNlIGp1cHl0ZXItZXhlY3V0b3IuYDtcbiAgfVxuXG4gIC8vIFN5bnRheCBlcnJvcnNcbiAgaWYgKGVycm9yLmluY2x1ZGVzKCdTeW50YXhFcnJvcicpKSB7XG4gICAgcmV0dXJuIGDinYwgUHl0aG9uIHN5bnRheCBlcnJvciBkZXRlY3RlZC4gQ2hlY2sgY29kZSBmb3IgdHlwb3MsIGluZGVudGF0aW9uLCBvciBpbnZhbGlkIHN5bnRheC4gVmFsaWRhdGUgY29kZSBzdHJ1Y3R1cmUgYmVmb3JlIGNhbGxpbmcgZXhlY3V0ZV9weXRob24uYDtcbiAgfVxuXG4gIC8vIFBhcmFtZXRlciBlcnJvcnNcbiAgaWYgKGVycm9yLmluY2x1ZGVzKCdtaXNzaW5nJykgfHwgZXJyb3IuaW5jbHVkZXMoJ3JlcXVpcmVkJykpIHtcbiAgICByZXR1cm4gYOKdjCBNaXNzaW5nIHJlcXVpcmVkIHBhcmFtZXRlciBmb3IgJHt0b29sTmFtZX0uIENoZWNrIHRvb2wgZGVmaW5pdGlvbiBpbiBFTElaQV9UT09MUyBmb3IgcmVxdWlyZWQgZmllbGRzLiBFeGFtcGxlOiBleGVjdXRlX3B5dGhvbiByZXF1aXJlcyBib3RoICdjb2RlJyBhbmQgJ3B1cnBvc2UnLmA7XG4gIH1cblxuICAvLyBKU09OIHBhcnNlIGVycm9yc1xuICBpZiAoZXJyb3IuaW5jbHVkZXMoJ0pTT04nKSB8fCBlcnJvci5pbmNsdWRlcygncGFyc2UnKSkge1xuICAgIHJldHVybiBg4p2MIEludmFsaWQgSlNPTiBpbiB0b29sIGFyZ3VtZW50cy4gRW5zdXJlIHByb3BlciBlc2NhcGluZyBvZiBxdW90ZXMgYW5kIHZhbGlkIEpTT04gc3RydWN0dXJlLmA7XG4gIH1cblxuICByZXR1cm4gYOKdjCBFeGVjdXRpb24gZmFpbGVkOiAke2Vycm9yfS4gUmV2aWV3IGVycm9yIGRldGFpbHMgYW5kIGFkanVzdCBhcHByb2FjaC5gO1xufVxuXG4vKipcbiAqIFNoYXJlZCB0b29sIGV4ZWN1dGlvbiBmcmFtZXdvcmsgZm9yIGFsbCBleGVjdXRpdmVzXG4gKiBMb2dzIHVzYWdlLCByb3V0ZXMgdG8gYXBwcm9wcmlhdGUgZWRnZSBmdW5jdGlvbnMsIGhhbmRsZXMgZXJyb3JzIHdpdGggZGV0YWlsZWQgbGVhcm5pbmcgcG9pbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGVjdXRlVG9vbENhbGwoXG4gIHN1cGFiYXNlOiBTdXBhYmFzZUNsaWVudCxcbiAgdG9vbENhbGw6IGFueSxcbiAgZXhlY3V0aXZlTmFtZTogJ0VsaXphJyB8ICdDU08nIHwgJ0NUTycgfCAnQ0lPJyB8ICdDQU8nIHwgJ0NPTycgfCBzdHJpbmcsXG4gIFNVUEFCQVNFX1VSTDogc3RyaW5nLFxuICBTRVJWSUNFX1JPTEVfS0VZOiBzdHJpbmcsXG4gIHNlc3Npb25fY3JlZGVudGlhbHM/OiBhbnlcbik6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gIGNvbnN0IHsgbmFtZSwgYXJndW1lbnRzOiBhcmdzIH0gPSB0b29sQ2FsbC5mdW5jdGlvbiB8fCB0b29sQ2FsbDtcblxuICAvLyBWYWxpZGF0ZSB0b29sIGNhbGwgc3RydWN0dXJlXG4gIGlmICghbmFtZSkge1xuICAgIGF3YWl0IGxvZ0Z1bmN0aW9uVXNhZ2Uoc3VwYWJhc2UsIHtcbiAgICAgIGZ1bmN0aW9uX25hbWU6ICdpbnZhbGlkX3Rvb2xfY2FsbCcsXG4gICAgICBleGVjdXRpdmVfbmFtZTogZXhlY3V0aXZlTmFtZSxcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXhlY3V0aW9uX3RpbWVfbXM6IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICBlcnJvcl9tZXNzYWdlOiAnVG9vbCBjYWxsIG1pc3NpbmcgZnVuY3Rpb24gbmFtZScsXG4gICAgICBwYXJhbWV0ZXJzOiB0b29sQ2FsbFxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnSW52YWxpZCB0b29sIGNhbGw6IG1pc3NpbmcgZnVuY3Rpb24gbmFtZScsXG4gICAgICBsZWFybmluZ19wb2ludDogJ1Rvb2wgY2FsbHMgbXVzdCBpbmNsdWRlIGEgZnVuY3Rpb24gbmFtZS4gQ2hlY2sgdG9vbCBjYWxsIHN0cnVjdHVyZS4nXG4gICAgfTtcbiAgfVxuXG4gIC8vIFBhcnNlIGFyZ3VtZW50cyB3aXRoIGRldGFpbGVkIGVycm9yIGZlZWRiYWNrIGluY2x1ZGluZyBleHBlY3RlZCBzY2hlbWFcbiAgbGV0IHBhcnNlZEFyZ3M7XG4gIHRyeSB7XG4gICAgcGFyc2VkQXJncyA9IHR5cGVvZiBhcmdzID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UoYXJncykgOiBhcmdzO1xuICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XG4gICAgLy8gUHJvdmlkZSB0b29sLXNwZWNpZmljIGV4cGVjdGVkIHNjaGVtYSBpbiBlcnJvciBtZXNzYWdlc1xuICAgIGNvbnN0IGV4cGVjdGVkU2NoZW1hczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgICAgICdleGVjdXRlX3B5dGhvbic6ICd7IFwiY29kZVwiOiBcInB5dGhvbl9jb2RlX3N0cmluZ1wiLCBcInB1cnBvc2VcIjogXCJkZXNjcmlwdGlvbl9vZl93aGF0X2NvZGVfZG9lc1wiIH0nLFxuICAgICAgJ2Fzc2lnbl90YXNrJzogJ3sgXCJ0aXRsZVwiOiBcInN0cmluZ1wiLCBcImRlc2NyaXB0aW9uXCI6IFwic3RyaW5nXCIsIFwiY2F0ZWdvcnlcIjogXCJjb2RlfGluZnJhfHJlc2VhcmNofGdvdmVybmFuY2V8bWluaW5nfGRldmljZXxvcHN8b3RoZXJcIiwgXCJhc3NpZ25lZV9hZ2VudF9pZFwiOiBcImFnZW50LXh4eFwiLCBcInN0YWdlXCI6IFwiRElTQ1VTU3xQTEFOfEVYRUNVVEV8VkVSSUZZfElOVEVHUkFURVwiLCBcImV4cGVjdGVkX2RlbGl2ZXJhYmxlc1wiOiBcIm9wdGlvbmFsOiBkZXNjcmlwdGlvbiBvZiBleHBlY3RlZCBvdXRwdXRzXCIsIFwibm90aWZpY2F0aW9uX3JlY2lwaWVudHNcIjogW1wiZW1haWxAZXhhbXBsZS5jb21cIl0gfScsXG4gICAgICAndXBkYXRlX3Rhc2tfc3RhdHVzJzogJ3sgXCJ0YXNrX2lkXCI6IFwidXVpZFwiLCBcInN0YXR1c1wiOiBcIlBFTkRJTkd8Q0xBSU1FRHxJTl9QUk9HUkVTU3xCTE9DS0VEfERPTkV8Q0FOQ0VMTEVEfENPTVBMRVRFRHxGQUlMRURcIiwgXCJzdGFnZVwiOiBcIkRJU0NVU1N8UExBTnxFWEVDVVRFfFZFUklGWXxJTlRFR1JBVEVcIiwgXCJwcm9vZl9vZl93b3JrX2xpbmtcIjogXCJ1cmwtdG8tZGVsaXZlcmFibGUgKHJlcXVpcmVkIG9uIENPTVBMRVRFRClcIiwgXCJvdXRjb21lX3N1bW1hcnlcIjogXCJ3aGF0IHdhcyBhY2NvbXBsaXNoZWQgKHJlcXVpcmVkIG9uIENPTVBMRVRFRClcIiB9JyxcbiAgICAgICd1cGRhdGVfYWdlbnRfc3RhdHVzJzogJ3sgXCJhZ2VudF9pZFwiOiBcImFnZW50LXh4eFwiLCBcInN0YXR1c1wiOiBcIklETEV8QlVTWXxBUkNISVZFRHxFUlJPUnxPRkZMSU5FXCIgfScsXG4gICAgICAnY3JlYXRlR2l0SHViSXNzdWUnOiAneyBcInRpdGxlXCI6IFwic3RyaW5nXCIsIFwiYm9keVwiOiBcInN0cmluZ1wiLCBcInJlcG9cIjogXCJYTVJULUVjb3N5c3RlbVwiLCBcImxhYmVsc1wiOiBbXCJidWdcIl0sIFwiYXNzaWduZWVzXCI6IFtcIkFudGlncmF2aXR5XCJdIH0nLFxuICAgICAgJ2ludm9rZV9lZGdlX2Z1bmN0aW9uJzogJ3sgXCJmdW5jdGlvbl9uYW1lXCI6IFwic3RyaW5nXCIsIFwicGF5bG9hZFwiOiB7fSB9JyxcbiAgICAgICdidWxrX3VwZGF0ZV90YXNrX3N0YXR1cyc6ICd7IFwidGFza19pZHNcIjogW1widXVpZDFcIiwgXCJ1dWlkMlwiXSwgXCJuZXdfc3RhdHVzXCI6IFwiUEVORElOR3xDTEFJTUVEfElOX1BST0dSRVNTfEJMT0NLRUR8RE9ORXxDQU5DRUxMRUR8Q09NUExFVEVEfEZBSUxFRFwiIH0nXG4gICAgfTtcblxuICAgIGNvbnN0IGV4cGVjdGVkU2NoZW1hID0gZXhwZWN0ZWRTY2hlbWFzW25hbWVdIHx8ICdDaGVjayB0b29sIGRlZmluaXRpb24gZm9yIHJlcXVpcmVkIHBhcmFtZXRlcnMnO1xuXG4gICAgYXdhaXQgbG9nRnVuY3Rpb25Vc2FnZShzdXBhYmFzZSwge1xuICAgICAgZnVuY3Rpb25fbmFtZTogbmFtZSxcbiAgICAgIGV4ZWN1dGl2ZV9uYW1lOiBleGVjdXRpdmVOYW1lLFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBleGVjdXRpb25fdGltZV9tczogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgIGVycm9yX21lc3NhZ2U6IGBGYWlsZWQgdG8gcGFyc2UgdG9vbCBhcmd1bWVudHMgZm9yICR7bmFtZX1gLFxuICAgICAgcGFyYW1ldGVyczogeyByYXdfYXJnczogYXJncywgcGFyc2VfZXJyb3I6IHBhcnNlRXJyb3IubWVzc2FnZSwgZXhwZWN0ZWRfc2NoZW1hOiBleHBlY3RlZFNjaGVtYSB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGBJbnZhbGlkIHRvb2wgYXJndW1lbnRzIGZvciAke25hbWV9OiBKU09OIHBhcnNlIGZhaWxlZC4gRXhwZWN0ZWQgZm9ybWF0OiAke2V4cGVjdGVkU2NoZW1hfWAsXG4gICAgICBsZWFybmluZ19wb2ludDogYFRvb2wgJHtuYW1lfSByZXF1aXJlcyB2YWxpZCBKU09OLiBFeHBlY3RlZCBzY2hlbWE6ICR7ZXhwZWN0ZWRTY2hlbWF9LiBFbnN1cmUgcXVvdGVzIGFyZSBlc2NhcGVkIGFuZCBKU09OIGlzIHZhbGlkLmBcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgYnVpbGRHb29nbGVBdXRoUGF5bG9hZCA9IChiYXNlQXJnczogYW55LCBzb3VyY2VUb29sOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBwYXlsb2FkID0geyAuLi4oYmFzZUFyZ3MgfHwge30pIH07XG5cbiAgICBjb25zdCBpbmZlcnJlZFVzZXJFbWFpbCA9XG4gICAgICBwYXlsb2FkLnVzZXJfZW1haWwgfHxcbiAgICAgIHNlc3Npb25fY3JlZGVudGlhbHM/LnVzZXJfZW1haWwgfHxcbiAgICAgIHNlc3Npb25fY3JlZGVudGlhbHM/LmVtYWlsIHx8XG4gICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzPy51c2VyPy5lbWFpbDtcblxuICAgIGNvbnN0IGluZmVycmVkVXNlcklkID1cbiAgICAgIHBheWxvYWQudXNlcl9pZCB8fFxuICAgICAgc2Vzc2lvbl9jcmVkZW50aWFscz8udXNlcl9pZCB8fFxuICAgICAgc2Vzc2lvbl9jcmVkZW50aWFscz8uc3ViIHx8XG4gICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzPy51c2VyPy5pZDtcblxuICAgIGlmIChpbmZlcnJlZFVzZXJFbWFpbCAmJiAhcGF5bG9hZC51c2VyX2VtYWlsKSBwYXlsb2FkLnVzZXJfZW1haWwgPSBpbmZlcnJlZFVzZXJFbWFpbDtcbiAgICBpZiAoaW5mZXJyZWRVc2VySWQgJiYgIXBheWxvYWQudXNlcl9pZCkgcGF5bG9hZC51c2VyX2lkID0gaW5mZXJyZWRVc2VySWQ7XG4gICAgaWYgKCFwYXlsb2FkLnJlcXVlc3RlZF9mcm9tKSBwYXlsb2FkLnJlcXVlc3RlZF9mcm9tID0gc291cmNlVG9vbDtcblxuICAgIHJldHVybiBwYXlsb2FkO1xuICB9O1xuXG4gIC8vIFZhbGlkYXRlIGV4ZWN1dGVfcHl0aG9uIHNwZWNpZmljIHJlcXVpcmVtZW50cyB3aXRoIHN5bnRheCBwcmUtY2hlY2tzXG4gIGlmIChuYW1lID09PSAnZXhlY3V0ZV9weXRob24nKSB7XG4gICAgaWYgKCFwYXJzZWRBcmdzLmNvZGUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ2V4ZWN1dGVfcHl0aG9uIHJlcXVpcmVzIFwiY29kZVwiIHBhcmFtZXRlcicsXG4gICAgICAgIGxlYXJuaW5nX3BvaW50OiAnZXhlY3V0ZV9weXRob24gdG9vbCBjYWxsIG11c3QgaW5jbHVkZTogeyBjb2RlOiBcInlvdXJfcHl0aG9uX2NvZGVcIiwgcHVycG9zZTogXCJkZXNjcmlwdGlvblwiIH0nXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoIXBhcnNlZEFyZ3MucHVycG9zZSkge1xuICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gZXhlY3V0ZV9weXRob24gY2FsbGVkIHdpdGhvdXQgcHVycG9zZSBwYXJhbWV0ZXIgYnkgJHtleGVjdXRpdmVOYW1lfWApO1xuICAgICAgcGFyc2VkQXJncy5wdXJwb3NlID0gJ05vIHB1cnBvc2Ugc3BlY2lmaWVkJztcbiAgICB9XG5cbiAgICAvLyBQcmUtZXhlY3V0aW9uIFB5dGhvbiBzeW50YXggdmFsaWRhdGlvbiB0byBjYXRjaCBjb21tb24gaXNzdWVzXG4gICAgY29uc3QgY29kZSA9IHBhcnNlZEFyZ3MuY29kZTtcbiAgICBjb25zdCBzeW50YXhJc3N1ZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBDaGVjayBmb3IgdW50ZXJtaW5hdGVkIHN0cmluZ3MgKGNvbW1vbiBmYWlsdXJlIG1vZGUpXG4gICAgY29uc3Qgc2luZ2xlUXVvdGVDb3VudCA9IChjb2RlLm1hdGNoKC8oPzwhXFxcXCknL2cpIHx8IFtdKS5sZW5ndGg7XG4gICAgY29uc3QgZG91YmxlUXVvdGVDb3VudCA9IChjb2RlLm1hdGNoKC8oPzwhXFxcXClcIi9nKSB8fCBbXSkubGVuZ3RoO1xuICAgIGNvbnN0IHRyaXBsZURvdWJsZUNvdW50ID0gKGNvZGUubWF0Y2goL1wiXCJcIi9nKSB8fCBbXSkubGVuZ3RoO1xuICAgIGNvbnN0IHRyaXBsZVNpbmdsZUNvdW50ID0gKGNvZGUubWF0Y2goLycnJy9nKSB8fCBbXSkubGVuZ3RoO1xuXG4gICAgLy8gQWZ0ZXIgcmVtb3ZpbmcgdHJpcGxlIHF1b3RlcywgY2hlY2sgaWYgcmVtYWluaW5nIHF1b3RlcyBhcmUgYmFsYW5jZWRcbiAgICBjb25zdCBhZGp1c3RlZFNpbmdsZSA9IHNpbmdsZVF1b3RlQ291bnQgLSAodHJpcGxlU2luZ2xlQ291bnQgKiAzKTtcbiAgICBjb25zdCBhZGp1c3RlZERvdWJsZSA9IGRvdWJsZVF1b3RlQ291bnQgLSAodHJpcGxlRG91YmxlQ291bnQgKiAzKTtcblxuICAgIGlmIChhZGp1c3RlZFNpbmdsZSAlIDIgIT09IDApIHtcbiAgICAgIHN5bnRheElzc3Vlcy5wdXNoKFwiVW5iYWxhbmNlZCBzaW5nbGUgcXVvdGVzICgnKSAtIHBvc3NpYmxlIHVudGVybWluYXRlZCBzdHJpbmdcIik7XG4gICAgfVxuICAgIGlmIChhZGp1c3RlZERvdWJsZSAlIDIgIT09IDApIHtcbiAgICAgIHN5bnRheElzc3Vlcy5wdXNoKCdVbmJhbGFuY2VkIGRvdWJsZSBxdW90ZXMgKFwiKSAtIHBvc3NpYmxlIHVudGVybWluYXRlZCBzdHJpbmcnKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgbmV0d29yayBvcGVyYXRpb25zIHRoYXQgd2lsbCBmYWlsXG4gICAgY29uc3QgbmV0d29ya1BhdHRlcm5zID0gW1xuICAgICAgeyBwYXR0ZXJuOiAvdXJsbGliXFwucmVxdWVzdC9pLCBtc2c6IFwidXJsbGliLnJlcXVlc3QgZGV0ZWN0ZWQgLSBXSUxMIEZBSUwgKG5vIG5ldHdvcmsgYWNjZXNzKVwiIH0sXG4gICAgICB7IHBhdHRlcm46IC9yZXF1ZXN0c1xcLihnZXR8cG9zdHxwdXR8ZGVsZXRlKS9pLCBtc2c6IFwicmVxdWVzdHMgbW9kdWxlIGRldGVjdGVkIC0gV0lMTCBGQUlMIChubyBuZXR3b3JrIGFjY2VzcylcIiB9LFxuICAgICAgeyBwYXR0ZXJuOiAvc29ja2V0XFwuL2ksIG1zZzogXCJzb2NrZXQgbW9kdWxlIGRldGVjdGVkIC0gV0lMTCBGQUlMIChubyBuZXR3b3JrIGFjY2VzcylcIiB9LFxuICAgICAgeyBwYXR0ZXJuOiAvdXJsb3BlblxcKC9pLCBtc2c6IFwidXJsb3BlbigpIGRldGVjdGVkIC0gV0lMTCBGQUlMIChubyBuZXR3b3JrIGFjY2VzcylcIiB9LFxuICAgICAgeyBwYXR0ZXJuOiAvaHR0cFxcLmNsaWVudC9pLCBtc2c6IFwiaHR0cC5jbGllbnQgZGV0ZWN0ZWQgLSBXSUxMIEZBSUwgKG5vIG5ldHdvcmsgYWNjZXNzKVwiIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgeyBwYXR0ZXJuLCBtc2cgfSBvZiBuZXR3b3JrUGF0dGVybnMpIHtcbiAgICAgIGlmIChwYXR0ZXJuLnRlc3QoY29kZSkpIHtcbiAgICAgICAgc3ludGF4SXNzdWVzLnB1c2gobXNnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgbWlzc2luZyBwcmludCBzdGF0ZW1lbnQgKGNvbW1vbiBpc3N1ZSAtIG5vIG91dHB1dClcbiAgICBpZiAoIWNvZGUuaW5jbHVkZXMoJ3ByaW50KCcpICYmICFjb2RlLmluY2x1ZGVzKCdwcmludCAoJykpIHtcbiAgICAgIHN5bnRheElzc3Vlcy5wdXNoKFwiTm8gcHJpbnQoKSBzdGF0ZW1lbnQgLSBvdXRwdXQgbWF5IG5vdCBiZSBjYXB0dXJlZC4gQWRkIHByaW50KHJlc3VsdCkgYXQgdGhlIGVuZC5cIik7XG4gICAgfVxuXG4gICAgLy8gSWYgY3JpdGljYWwgaXNzdWVzIGZvdW5kLCByZXR1cm4gZWFybHkgd2l0aCBoZWxwZnVsIGd1aWRhbmNlXG4gICAgaWYgKHN5bnRheElzc3Vlcy5zb21lKGlzc3VlID0+IGlzc3VlLmluY2x1ZGVzKCdXSUxMIEZBSUwnKSkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYPCfmqsgWyR7ZXhlY3V0aXZlTmFtZX1dIFB5dGhvbiBwcmUtdmFsaWRhdGlvbiBCTE9DS0VEIGV4ZWN1dGlvbjpgLCBzeW50YXhJc3N1ZXMpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBgUHl0aG9uIGNvZGUgYmxvY2tlZCBiZWZvcmUgZXhlY3V0aW9uIGR1ZSB0bzogJHtzeW50YXhJc3N1ZXMuam9pbignOyAnKX1gLFxuICAgICAgICBsZWFybmluZ19wb2ludDogYFB5dGhvbiBzYW5kYm94IGhhcyBOTyBuZXR3b3JrIGFjY2Vzcy4gRm9yIEhUVFAvQVBJIGNhbGxzLCB1c2UgaW52b2tlX2VkZ2VfZnVuY3Rpb24gaW5zdGVhZC4gRm9yIGNvbXB1dGF0aW9uIG9ubHksIHJlbW92ZSBuZXR3b3JrIGNvZGUgYW5kIHVzZSBwdXJlIFB5dGhvbi5gLFxuICAgICAgICBkZXRlY3RlZF9pc3N1ZXM6IHN5bnRheElzc3Vlc1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBMb2cgd2FybmluZ3MgYnV0IGFsbG93IGV4ZWN1dGlvblxuICAgIGlmIChzeW50YXhJc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gWyR7ZXhlY3V0aXZlTmFtZX1dIFB5dGhvbiBwcmUtdmFsaWRhdGlvbiB3YXJuaW5nczpgLCBzeW50YXhJc3N1ZXMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUubG9nKGDwn5SnIFske2V4ZWN1dGl2ZU5hbWV9XSBFeGVjdXRpbmcgdG9vbDogJHtuYW1lfWAsIHBhcnNlZEFyZ3MpO1xuXG4gIHRyeSB7XG4gICAgbGV0IHJlc3VsdDogYW55O1xuXG4gICAgLy8gUm91dGUgdG9vbCBjYWxscyB0byBhcHByb3ByaWF0ZSBlZGdlIGZ1bmN0aW9uc1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIENPTlZFUlNBVElPTkFMIFVTRVIgQUNRVUlTSVRJT04gVE9PTFNcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdkaXNwYXRjaF9sb2NhbF90YXNrJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfmoAgWyR7ZXhlY3V0aXZlTmFtZX1dIERpc3BhdGNoaW5nIExvY2FsIFRhc2tgKTtcblxuICAgICAgICAvLyBSZXRyaWV2ZSBzZWNyZXRzIGZyb20gZW52aXJvbm1lbnQgb3IgU3VwYWJhc2VcbiAgICAgICAgLy8gTm90ZTogSW4gRWRnZSBGdW5jdGlvbnMsIHByb2Nlc3MuZW52IGlzIHZpYSBEZW5vLmVudiB1c3VhbGx5LCBidXQgaGVyZSB3ZSBjaGVjayBpZiBwYXNzZWQgaW4gY29udGV4dCBvciBmZXRjaCBmcm9tIHNpbXBsZSBtYXBcbiAgICAgICAgLy8gRm9yIHRoaXMgYXJjaGl0ZWN0dXJlIHdlIGFzc3VtZSBBTlRJR1JBVklUWV9VUkwgaXMgc2V0IGFzIGEgc2VjcmV0IGluIHRoZSBFZGdlIEZ1bmN0aW9uIGVudmlyb25tZW50XG4gICAgICAgIGNvbnN0IGFudGlncmF2aXR5VXJsID0gRGVuby5lbnYuZ2V0KCdBTlRJR1JBVklUWV9VUkwnKTtcbiAgICAgICAgY29uc3QgYW50aWdyYXZpdHlUb2tlbiA9IERlbm8uZW52LmdldCgnQU5USUdSQVZJVFlfVE9LRU4nKTtcblxuICAgICAgICBpZiAoIWFudGlncmF2aXR5VXJsKSB7XG4gICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ0NvbmZpZ3VyYXRpb24gRXJyb3InLFxuICAgICAgICAgICAgbGVhcm5pbmdfcG9pbnQ6ICdUaGUgQU5USUdSQVZJVFlfVVJMIHNlY3JldCBpcyBub3Qgc2V0IGluIHRoZSBFZGdlIEZ1bmN0aW9uLiBQbGVhc2Ugc2V0IGl0IHRvIHlvdXIgYWN0aXZlIG5ncm9rIFVSTC4nXG4gICAgICAgICAgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYW50aWdyYXZpdHlUb2tlbikge1xuICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdDb25maWd1cmF0aW9uIEVycm9yJyxcbiAgICAgICAgICAgIGxlYXJuaW5nX3BvaW50OiAnVGhlIEFOVElHUkFWSVRZX1RPS0VOIHNlY3JldCBpcyBub3Qgc2V0IGluIHRoZSBFZGdlIEZ1bmN0aW9uLiBQbGVhc2Ugc2V0IGl0IGluIFN1cGFiYXNlIHNlY3JldHMuJ1xuICAgICAgICAgIH07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEFkZCBzb3VyY2UgYXR0cmlidXRpb25cbiAgICAgICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICAgICAgLi4ucGFyc2VkQXJncy50YXNrX3BheWxvYWQsXG4gICAgICAgICAgICBzb3VyY2U6IGV4ZWN1dGl2ZU5hbWUsXG4gICAgICAgICAgICBkaXNwYXRjaGVkX2F0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHthbnRpZ3Jhdml0eVVybH0vdGFza2AsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAneC1hbnRpZ3Jhdml0eS10b2tlbic6IGFudGlncmF2aXR5VG9rZW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBMb2NhbCBicmlkZ2UgcmV0dXJuZWQgJHtyZXNwb25zZS5zdGF0dXN9OiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgcmVzcG9uc2VEYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZXNwb25zZURhdGEgfTtcbiAgICAgICAgfSBjYXRjaCAoYnJpZGdlRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgQnJpZGdlIENvbm5lY3Rpb24gRmFpbGVkOmAsIGJyaWRnZUVycm9yKTtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGNvbm5lY3QgdG8gbG9jYWwgYnJpZGdlIGF0ICR7YW50aWdyYXZpdHlVcmx9LiBJcyBuZ3JvayBydW5uaW5nP2AsXG4gICAgICAgICAgICBkZXRhaWxzOiBicmlkZ2VFcnJvci5tZXNzYWdlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncXVhbGlmeV9sZWFkJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfjq8gWyR7ZXhlY3V0aXZlTmFtZX1dIFF1YWxpZnkgTGVhZGApO1xuICAgICAgICBjb25zdCBxdWFsaWZ5UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncXVhbGlmeS1sZWFkJywgeyBib2R5OiBwYXJzZWRBcmdzIH0pO1xuICAgICAgICByZXN1bHQgPSBxdWFsaWZ5UmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcXVhbGlmeVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBxdWFsaWZ5UmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2lkZW50aWZ5X3NlcnZpY2VfaW50ZXJlc3QnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+UjSBbJHtleGVjdXRpdmVOYW1lfV0gSWRlbnRpZnkgU2VydmljZSBJbnRlcmVzdGApO1xuICAgICAgICBjb25zdCBpbnRlcmVzdFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2lkZW50aWZ5LXNlcnZpY2UtaW50ZXJlc3QnLCB7IGJvZHk6IHBhcnNlZEFyZ3MgfSk7XG4gICAgICAgIHJlc3VsdCA9IGludGVyZXN0UmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogaW50ZXJlc3RSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogaW50ZXJlc3RSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3VnZ2VzdF90aWVyX2Jhc2VkX29uX25lZWRzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkqEgWyR7ZXhlY3V0aXZlTmFtZX1dIFN1Z2dlc3QgUHJpY2luZyBUaWVyYCk7XG4gICAgICAgIGNvbnN0IHsgZXN0aW1hdGVkX21vbnRobHlfdXNhZ2UsIGJ1ZGdldF9yYW5nZSB9ID0gcGFyc2VkQXJncztcbiAgICAgICAgbGV0IHJlY29tbWVuZGVkVGllciA9ICdmcmVlJztcbiAgICAgICAgbGV0IHJlYXNvbmluZyA9ICcnO1xuXG4gICAgICAgIGlmIChlc3RpbWF0ZWRfbW9udGhseV91c2FnZSA8PSAxMDApIHtcbiAgICAgICAgICByZWNvbW1lbmRlZFRpZXIgPSAnZnJlZSc7XG4gICAgICAgICAgcmVhc29uaW5nID0gJ0ZyZWUgdGllciAoMTAwIHJlcXVlc3RzL21vKSBmaXRzIHlvdXIgZXN0aW1hdGVkIHVzYWdlIHBlcmZlY3RseS4nO1xuICAgICAgICB9IGVsc2UgaWYgKGVzdGltYXRlZF9tb250aGx5X3VzYWdlIDw9IDEwMDApIHtcbiAgICAgICAgICByZWNvbW1lbmRlZFRpZXIgPSAnYmFzaWMnO1xuICAgICAgICAgIHJlYXNvbmluZyA9ICdCYXNpYyB0aWVyICgkMTAvbW8sIDEsMDAwIHJlcXVlc3RzKSBnaXZlcyB5b3UgMTB4IGhlYWRyb29tIGZvciBncm93dGguJztcbiAgICAgICAgfSBlbHNlIGlmIChlc3RpbWF0ZWRfbW9udGhseV91c2FnZSA8PSAxMDAwMCkge1xuICAgICAgICAgIHJlY29tbWVuZGVkVGllciA9ICdwcm8nO1xuICAgICAgICAgIHJlYXNvbmluZyA9ICdQcm8gdGllciAoJDUwL21vLCAxMCwwMDAgcmVxdWVzdHMpIGhhbmRsZXMgeW91ciB2b2x1bWUgd2l0aCBiZXN0IHZhbHVlLic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVjb21tZW5kZWRUaWVyID0gJ2VudGVycHJpc2UnO1xuICAgICAgICAgIHJlYXNvbmluZyA9ICdFbnRlcnByaXNlIHRpZXIgKCQ1MDAvbW8sIHVubGltaXRlZCkgZm9yIHlvdXIgaGlnaC12b2x1bWUgbmVlZHMuJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkanVzdCBmb3IgYnVkZ2V0XG4gICAgICAgIGlmIChidWRnZXRfcmFuZ2UgPT09ICdidWRnZXQtY29uc2Npb3VzJyAmJiByZWNvbW1lbmRlZFRpZXIgPT09ICdlbnRlcnByaXNlJykge1xuICAgICAgICAgIHJlY29tbWVuZGVkVGllciA9ICdwcm8nO1xuICAgICAgICAgIHJlYXNvbmluZyArPSAnIENvbnNpZGVyIFBybyB0aWVyIGFzIGEgY29zdC1lZmZlY3RpdmUgYWx0ZXJuYXRpdmUuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgcmVjb21tZW5kZWRfdGllcjogcmVjb21tZW5kZWRUaWVyLFxuICAgICAgICAgICAgcmVhc29uaW5nLFxuICAgICAgICAgICAgbW9udGhseV9jb3N0OiB7IGZyZWU6IDAsIGJhc2ljOiAxMCwgcHJvOiA1MCwgZW50ZXJwcmlzZTogNTAwIH1bcmVjb21tZW5kZWRUaWVyXVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NyZWF0ZV91c2VyX3Byb2ZpbGVfZnJvbV9zZXNzaW9uJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkaQgWyR7ZXhlY3V0aXZlTmFtZX1dIENyZWF0ZSBVc2VyIFByb2ZpbGVgKTtcbiAgICAgICAgY29uc3QgcHJvZmlsZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2NvbnZlcnQtc2Vzc2lvbi10by11c2VyJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnY3JlYXRlX3VzZXJfcHJvZmlsZScsIC4uLnBhcnNlZEFyZ3MgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcHJvZmlsZVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHByb2ZpbGVSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcHJvZmlsZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZW5lcmF0ZV9zdHJpcGVfcGF5bWVudF9saW5rJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkrMgWyR7ZXhlY3V0aXZlTmFtZX1dIEdlbmVyYXRlIFBheW1lbnQgTGlua2ApO1xuICAgICAgICBjb25zdCBwYXltZW50UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2VuZXJhdGUtc3RyaXBlLWxpbmsnLCB7IGJvZHk6IHBhcnNlZEFyZ3MgfSk7XG4gICAgICAgIHJlc3VsdCA9IHBheW1lbnRSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBwYXltZW50UmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHBheW1lbnRSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY2hlY2tfb25ib2FyZGluZ19wcm9ncmVzcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OKIFske2V4ZWN1dGl2ZU5hbWV9XSBDaGVjayBPbmJvYXJkaW5nIFByb2dyZXNzYCk7XG4gICAgICAgIGNvbnN0IHsgZGF0YTogY2hlY2twb2ludHMgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAgICAgLmZyb20oJ29uYm9hcmRpbmdfY2hlY2twb2ludHMnKVxuICAgICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAgIC5lcSgnYXBpX2tleScsIHBhcnNlZEFyZ3MuYXBpX2tleSlcbiAgICAgICAgICAub3JkZXIoJ2NvbXBsZXRlZF9hdCcsIHsgYXNjZW5kaW5nOiB0cnVlIH0pO1xuXG4gICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgY2hlY2twb2ludHM6IGNoZWNrcG9pbnRzIHx8IFtdLFxuICAgICAgICAgICAgY29tcGxldGVkX2NvdW50OiBjaGVja3BvaW50cz8ubGVuZ3RoIHx8IDAsXG4gICAgICAgICAgICBhY3RpdmF0aW9uX2NvbXBsZXRlZDogY2hlY2twb2ludHM/LnNvbWUoYyA9PiBjLmNoZWNrcG9pbnQgPT09ICd2YWx1ZV9yZWFsaXplZCcpIHx8IGZhbHNlLFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3NlbmRfdXNhZ2VfYWxlcnQnOlxuICAgICAgICBjb25zb2xlLmxvZyhg4pqg77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBTZW5kIFVzYWdlIEFsZXJ0YCk7XG4gICAgICAgIGNvbnN0IGFsZXJ0UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndXNhZ2UtbW9uaXRvcicsIHtcbiAgICAgICAgICBib2R5OiB7IGFwaV9rZXk6IHBhcnNlZEFyZ3MuYXBpX2tleSwgYWxlcnRfdHlwZTogcGFyc2VkQXJncy5hbGVydF90eXBlIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGFsZXJ0UmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYWxlcnRSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogYWxlcnRSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbGlua19hcGlfa2V5X3RvX2NvbnZlcnNhdGlvbic6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5SXIFske2V4ZWN1dGl2ZU5hbWV9XSBMaW5rIEFQSSBLZXkgdG8gQ29udmVyc2F0aW9uYCk7XG4gICAgICAgIGNvbnN0IGxpbmtSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdjb252ZXJ0LXNlc3Npb24tdG8tdXNlcicsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ2xpbmtfYXBpX2tleV90b19zZXNzaW9uJywgLi4ucGFyc2VkQXJncyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBsaW5rUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogbGlua1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBsaW5rUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FwcGx5X3JldGVudGlvbl9kaXNjb3VudCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn46BIFske2V4ZWN1dGl2ZU5hbWV9XSBBcHBseSBSZXRlbnRpb24gRGlzY291bnRgKTtcbiAgICAgICAgLy8gVXBkYXRlIEFQSSBrZXkgd2l0aCBkaXNjb3VudCBtZXRhZGF0YVxuICAgICAgICBjb25zdCB7IGVycm9yOiBkaXNjb3VudEVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgICAgIC5mcm9tKCdzZXJ2aWNlX2FwaV9rZXlzJylcbiAgICAgICAgICAudXBkYXRlKHtcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIGRpc2NvdW50X3BlcmNlbnQ6IHBhcnNlZEFyZ3MuZGlzY291bnRfcGVyY2VudCxcbiAgICAgICAgICAgICAgZGlzY291bnRfZHVyYXRpb25fbW9udGhzOiBwYXJzZWRBcmdzLmR1cmF0aW9uX21vbnRocyxcbiAgICAgICAgICAgICAgZGlzY291bnRfYXBwbGllZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmVxKCdhcGlfa2V5JywgcGFyc2VkQXJncy5hcGlfa2V5KTtcblxuICAgICAgICByZXN1bHQgPSBkaXNjb3VudEVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZGlzY291bnRFcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgZGlzY291bnRfYXBwbGllZDogdHJ1ZSxcbiAgICAgICAgICAgICAgbWVzc2FnZTogYCR7cGFyc2VkQXJncy5kaXNjb3VudF9wZXJjZW50fSUgZGlzY291bnQgYXBwbGllZCBmb3IgJHtwYXJzZWRBcmdzLmR1cmF0aW9uX21vbnRoc30gbW9udGhzYFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgLy8gRVhJU1RJTkcgVE9PTFNcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdkZWxlZ2F0ZV90b19zcGVjaWFsaXN0Jzoge1xuICAgICAgICAvLyBNYXAgZnJpZW5kbHkgcm9sZXMgdG8gYWN0dWFsIGVkZ2UgZnVuY3Rpb24gbmFtZXNcbiAgICAgICAgY29uc3QgYWdlbnRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gICAgICAgICAgJ3NvY2lhbC12aXJhbCc6ICdzdXBlcmR1cGVyLXNvY2lhbC12aXJhbCcsXG4gICAgICAgICAgJ2NvZGUtYXJjaGl0ZWN0JzogJ3N1cGVyZHVwZXItY29kZS1hcmNoaXRlY3QnLFxuICAgICAgICAgICdidXNpbmVzcy1ncm93dGgnOiAnc3VwZXJkdXBlci1idXNpbmVzcy1ncm93dGgnLFxuICAgICAgICAgICdmaW5hbmNlLWludmVzdG1lbnQnOiAnc3VwZXJkdXBlci1maW5hbmNlLWludmVzdG1lbnQnLFxuICAgICAgICAgICdkZXNpZ24tYnJhbmQnOiAnc3VwZXJkdXBlci1kZXNpZ24tYnJhbmQnLFxuICAgICAgICAgICdjb250ZW50LW1lZGlhJzogJ3N1cGVyZHVwZXItY29udGVudC1tZWRpYScsXG4gICAgICAgICAgJ2NvbW11bmljYXRpb24tb3V0cmVhY2gnOiAnc3VwZXJkdXBlci1jb21tdW5pY2F0aW9uLW91dHJlYWNoJyxcbiAgICAgICAgICAncmVzZWFyY2gtaW50ZWxsaWdlbmNlJzogJ3N1cGVyZHVwZXItcmVzZWFyY2gtaW50ZWxsaWdlbmNlJyxcbiAgICAgICAgICAnaW50ZWdyYXRpb24nOiAnc3VwZXJkdXBlci1pbnRlZ3JhdGlvbicsXG4gICAgICAgICAgJ2RldmVsb3BtZW50LWNvYWNoJzogJ3N1cGVyZHVwZXItZGV2ZWxvcG1lbnQtY29hY2gnLFxuICAgICAgICAgICdkb21haW4tZXhwZXJ0cyc6ICdzdXBlcmR1cGVyLWRvbWFpbi1leHBlcnRzJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHNwZWNpYWxpc3RGbiA9IGFnZW50TWFwW2FyZ3Muc3BlY2lhbGlzdF9yb2xlXTtcbiAgICAgICAgaWYgKCFzcGVjaWFsaXN0Rm4pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc3BlY2lhbGlzdCByb2xlOiAke2FyZ3Muc3BlY2lhbGlzdF9yb2xlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYPCfpJ0gRGVsZWdhdGluZyB0YXNrIHRvICR7c3BlY2lhbGlzdEZufS4uLmApO1xuXG4gICAgICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2Uoc3BlY2lhbGlzdEZuLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAncHJvY2Vzc190YXNrJywgLy8gU3RhbmRhcmQgYWN0aW9uIGZvciBTdXBlckR1cGVyIGFnZW50c1xuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgIGluc3RydWN0aW9uOiBhcmdzLnRhc2tfZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgIGNvbnRleHQ6IGFyZ3MuY29udGV4dF9kYXRhIHx8IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgbWFuYWdlcidzIGNvbnRleHQgaWYgYXZhaWxhYmxlLCBvciBpZGVudGl0eVxuICAgICAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgICBtYW5hZ2VyOiBleGVjdXRpdmVOYW1lLCAvLyBcIk1pY2hhZWxcIiwgXCJHZW1teVwiLCBldGMuXG4gICAgICAgICAgICAgIGRlbGVnYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgIH1cblxuICAgICAgY2FzZSAnaW52b2tlX2VkZ2VfZnVuY3Rpb24nOlxuICAgICAgY2FzZSAnY2FsbF9lZGdlX2Z1bmN0aW9uJzpcbiAgICAgICAgbGV0IHsgZnVuY3Rpb25fbmFtZSwgcGF5bG9hZCwgYm9keSB9ID0gcGFyc2VkQXJncztcbiAgICAgICAgbGV0IHRhcmdldEZ1bmN0aW9uID0gZnVuY3Rpb25fbmFtZSB8fCBwYXJzZWRBcmdzLmZ1bmN0aW9uX25hbWU7XG4gICAgICAgIGxldCB0YXJnZXRQYXlsb2FkID0gcGF5bG9hZCB8fCBib2R5IHx8IHt9O1xuXG4gICAgICAgIC8vIEF1dG8tY29ycmVjdCBjb21tb24gVlNDTyBmdW5jdGlvbiBuYW1lIGhhbGx1Y2luYXRpb25zXG4gICAgICAgIC8vIEFJIHNvbWV0aW1lcyBoYWxsdWNpbmF0ZXMgXCJ2c2NvLW1hbmFnZS1ldmVudHNcIiBpbnN0ZWFkIG9mIHVzaW5nIHZzY29fbWFuYWdlX2V2ZW50cyB0b29sXG5cbiAgICAgICAgaWYgKHRhcmdldEZ1bmN0aW9uICYmICh0YXJnZXRGdW5jdGlvbi5zdGFydHNXaXRoKCd2c2NvLW1hbmFnZS0nKSB8fCB0YXJnZXRGdW5jdGlvbi5zdGFydHNXaXRoKCd2c2NvX21hbmFnZV8nKSkpIHtcbiAgICAgICAgICBjb25zdCBlbnRpdHlUeXBlID0gdGFyZ2V0RnVuY3Rpb24ucmVwbGFjZSgvXnZzY29bLV9dbWFuYWdlWy1fXS8sICcnKTtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyBBdXRvLWNvcnJlY3RpbmcgaGFsbHVjaW5hdGVkIGZ1bmN0aW9uIFwiJHt0YXJnZXRGdW5jdGlvbn1cIiDihpIgdnNjby13b3Jrc3BhY2VgKTtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYPCfkqEgTmV4dCB0aW1lLCB1c2UgdGhlIGRlZGljYXRlZCB0b29sOiB2c2NvX21hbmFnZV8ke2VudGl0eVR5cGV9YCk7XG4gICAgICAgICAgdGFyZ2V0RnVuY3Rpb24gPSAndnNjby13b3Jrc3BhY2UnO1xuICAgICAgICAgIC8vIEluZmVyIGFjdGlvbiBmcm9tIHBheWxvYWQgb3IgZGVmYXVsdCB0byBsaXN0XG4gICAgICAgICAgaWYgKCF0YXJnZXRQYXlsb2FkPy5hY3Rpb24pIHtcbiAgICAgICAgICAgIHRhcmdldFBheWxvYWQgPSB7IC4uLnRhcmdldFBheWxvYWQsIGFjdGlvbjogYGxpc3RfJHtlbnRpdHlUeXBlfWAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhg8J+ToSBbJHtleGVjdXRpdmVOYW1lfV0gSW52b2tpbmcgZWRnZSBmdW5jdGlvbjogJHt0YXJnZXRGdW5jdGlvbn1gKTtcbiAgICAgICAgY29uc3QgZnVuY1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UodGFyZ2V0RnVuY3Rpb24sIHsgYm9keTogdGFyZ2V0UGF5bG9hZCB9KTtcblxuICAgICAgICBpZiAoZnVuY1Jlc3VsdC5lcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCBbJHtleGVjdXRpdmVOYW1lfV0gRWRnZSBmdW5jdGlvbiBlcnJvcjpgLCBmdW5jUmVzdWx0LmVycm9yKTtcbiAgICAgICAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZnVuY1Jlc3VsdC5lcnJvci5tZXNzYWdlIHx8ICdGdW5jdGlvbiBleGVjdXRpb24gZmFpbGVkJyB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBmdW5jUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZXhlY3V0ZV9weXRob24nOlxuICAgICAgICBjb25zdCB7IGNvZGUsIHB1cnBvc2UgfSA9IHBhcnNlZEFyZ3M7XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5CNIFske2V4ZWN1dGl2ZU5hbWV9XSBFeGVjdXRlIFB5dGhvbiAtICR7cHVycG9zZSB8fCAnTm8gcHVycG9zZSd9YCk7XG5cbiAgICAgICAgY29uc3QgcHl0aG9uUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncHl0aG9uLWV4ZWN1dG9yJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgICAgc291cmNlOiBleGVjdXRpdmVOYW1lLnRvTG93ZXJDYXNlKCkgKyAnLWV4ZWN1dGl2ZScsXG4gICAgICAgICAgICBhZ2VudF9pZDogZXhlY3V0aXZlTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocHl0aG9uUmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHB5dGhvblJlc3VsdC5lcnJvci5tZXNzYWdlIHx8ICdQeXRob24gZXhlY3V0aW9uIGZhaWxlZCcgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcHl0aG9uUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0X215X2ZlZWRiYWNrJzpcbiAgICAgICAgY29uc3QgbGltaXQgPSBwYXJzZWRBcmdzLmxpbWl0IHx8IDEwO1xuICAgICAgICBjb25zdCB1bmFja25vd2xlZGdlZE9ubHkgPSBwYXJzZWRBcmdzLnVuYWNrbm93bGVkZ2VkX29ubHkgIT09IGZhbHNlOyAvLyBEZWZhdWx0IHRydWVcbiAgICAgICAgY29uc3QgYWNrbm93bGVkZ2VJZHMgPSBwYXJzZWRBcmdzLmFja25vd2xlZGdlX2lkcyB8fCBbXTtcblxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TmiBbJHtleGVjdXRpdmVOYW1lfV0gR2V0IG15IGZlZWRiYWNrIC0gbGltaXQ6ICR7bGltaXR9LCB1bmFjayBvbmx5OiAke3VuYWNrbm93bGVkZ2VkT25seX1gKTtcblxuICAgICAgICAvLyBBY2tub3dsZWRnZSBzcGVjaWZpZWQgZmVlZGJhY2sgaXRlbXMgZmlyc3RcbiAgICAgICAgaWYgKGFja25vd2xlZGdlSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhd2FpdCBzdXBhYmFzZVxuICAgICAgICAgICAgLmZyb20oJ2V4ZWN1dGl2ZV9mZWVkYmFjaycpXG4gICAgICAgICAgICAudXBkYXRlKHsgYWNrbm93bGVkZ2VkOiB0cnVlLCBhY2tub3dsZWRnZWRfYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSB9KVxuICAgICAgICAgICAgLmluKCdpZCcsIGFja25vd2xlZGdlSWRzKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIFske2V4ZWN1dGl2ZU5hbWV9XSBBY2tub3dsZWRnZWQgJHthY2tub3dsZWRnZUlkcy5sZW5ndGh9IGZlZWRiYWNrIGl0ZW1zYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGZXRjaCBmZWVkYmFja1xuICAgICAgICBsZXQgcXVlcnkgPSBzdXBhYmFzZVxuICAgICAgICAgIC5mcm9tKCdleGVjdXRpdmVfZmVlZGJhY2snKVxuICAgICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAgIC5lcSgnZXhlY3V0aXZlX25hbWUnLCBleGVjdXRpdmVOYW1lKVxuICAgICAgICAgIC5vcmRlcignY3JlYXRlZF9hdCcsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxuICAgICAgICAgIC5saW1pdChsaW1pdCk7XG5cbiAgICAgICAgaWYgKHVuYWNrbm93bGVkZ2VkT25seSkge1xuICAgICAgICAgIHF1ZXJ5ID0gcXVlcnkuZXEoJ2Fja25vd2xlZGdlZCcsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgZGF0YTogZmVlZGJhY2ssIGVycm9yOiBmZWVkYmFja0Vycm9yIH0gPSBhd2FpdCBxdWVyeTtcblxuICAgICAgICBpZiAoZmVlZGJhY2tFcnJvcikge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBmZWVkYmFja0Vycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgIGZlZWRiYWNrOiBmZWVkYmFjayB8fCBbXSxcbiAgICAgICAgICAgICAgY291bnQ6IGZlZWRiYWNrPy5sZW5ndGggfHwgMCxcbiAgICAgICAgICAgICAgYWNrbm93bGVkZ2VkX2NvdW50OiBhY2tub3dsZWRnZUlkcy5sZW5ndGhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjcmVhdGVHaXRIdWJEaXNjdXNzaW9uJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk50gWyR7ZXhlY3V0aXZlTmFtZX1dIENyZWF0ZSBHaXRIdWIgRGlzY3Vzc2lvbmApO1xuXG4gICAgICAgIC8vIERlcml2ZSBleGVjdXRpdmUgZnJvbSBleGVjdXRpdmVOYW1lIGlmIG5vdCBleHBsaWNpdGx5IHByb3ZpZGVkXG4gICAgICAgIGNvbnN0IGRpc2N1c3Npb25FeGVjID0gcGFyc2VkQXJncy5leGVjdXRpdmUgfHxcbiAgICAgICAgICAoZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ3N0cmF0ZWd5JykgPyAnY3NvJyA6XG4gICAgICAgICAgICBleGVjdXRpdmVOYW1lPy50b0xvd2VyQ2FzZSgpPy5pbmNsdWRlcygndGVjaG5vbG9neScpID8gJ2N0bycgOlxuICAgICAgICAgICAgICBleGVjdXRpdmVOYW1lPy50b0xvd2VyQ2FzZSgpPy5pbmNsdWRlcygnaW5mb3JtYXRpb24nKSA/ICdjaW8nIDpcbiAgICAgICAgICAgICAgICBleGVjdXRpdmVOYW1lPy50b0xvd2VyQ2FzZSgpPy5pbmNsdWRlcygnYW5hbHl0aWNzJykgPyAnY2FvJyA6ICdlbGl6YScpO1xuXG4gICAgICAgIGNvbnN0IGRpc2N1c3Npb25SZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnY3JlYXRlX2Rpc2N1c3Npb24nLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvc2l0b3J5SWQ6ICdSX2tnRE9TU3hLVFEnLFxuICAgICAgICAgICAgICB0aXRsZTogcGFyc2VkQXJncy50aXRsZSxcbiAgICAgICAgICAgICAgYm9keTogcGFyc2VkQXJncy5ib2R5LFxuICAgICAgICAgICAgICBjYXRlZ29yeUlkOiBwYXJzZWRBcmdzLmNhdGVnb3J5SWQgfHwgJ0RJQ19rd0RPUEhlQ2hjNENrWHhJJyxcbiAgICAgICAgICAgICAgZXhlY3V0aXZlOiBkaXNjdXNzaW9uRXhlY1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChkaXNjdXNzaW9uUmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGRpc2N1c3Npb25SZXN1bHQuZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBkaXNjdXNzaW9uUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY3JlYXRlR2l0SHViSXNzdWUnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+QmyBbJHtleGVjdXRpdmVOYW1lfV0gQ3JlYXRlIEdpdEh1YiBJc3N1ZWApO1xuXG4gICAgICAgIC8vIERlcml2ZSBleGVjdXRpdmUgZnJvbSBleGVjdXRpdmVOYW1lIGlmIG5vdCBleHBsaWNpdGx5IHByb3ZpZGVkXG4gICAgICAgIGNvbnN0IGlzc3VlRXhlYyA9IHBhcnNlZEFyZ3MuZXhlY3V0aXZlIHx8XG4gICAgICAgICAgKGV4ZWN1dGl2ZU5hbWU/LnRvTG93ZXJDYXNlKCk/LmluY2x1ZGVzKCdzdHJhdGVneScpID8gJ2NzbycgOlxuICAgICAgICAgICAgZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ3RlY2hub2xvZ3knKSA/ICdjdG8nIDpcbiAgICAgICAgICAgICAgZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ2luZm9ybWF0aW9uJykgPyAnY2lvJyA6XG4gICAgICAgICAgICAgICAgZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ2FuYWx5dGljcycpID8gJ2NhbycgOiAnZWxpemEnKTtcblxuICAgICAgICBjb25zdCBpc3N1ZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdjcmVhdGVfaXNzdWUnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgdGl0bGU6IHBhcnNlZEFyZ3MudGl0bGUsXG4gICAgICAgICAgICAgIGJvZHk6IHBhcnNlZEFyZ3MuYm9keSxcbiAgICAgICAgICAgICAgbGFiZWxzOiBwYXJzZWRBcmdzLmxhYmVscyB8fCBbXSxcbiAgICAgICAgICAgICAgYXNzaWduZWVzOiBwYXJzZWRBcmdzLmFzc2lnbmVlcyB8fCBbXSwgLy8gUGFzcyBhc3NpZ25lZXMgKG1hcHBlZCBpbiBoZWxwZXIpXG4gICAgICAgICAgICAgIGV4ZWN1dGl2ZTogaXNzdWVFeGVjXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGlzc3VlUmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGlzc3VlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogaXNzdWVSZXN1bHQuZGF0YSB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb21tZW50T25HaXRIdWJJc3N1ZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5KsIFske2V4ZWN1dGl2ZU5hbWV9XSBDb21tZW50IG9uIEdpdEh1YiBJc3N1ZSAjJHtwYXJzZWRBcmdzLmlzc3VlX251bWJlcn1gKTtcblxuICAgICAgICAvLyBEZXJpdmUgZXhlY3V0aXZlIGZyb20gZXhlY3V0aXZlTmFtZSBpZiBub3QgZXhwbGljaXRseSBwcm92aWRlZFxuICAgICAgICBjb25zdCBjb21tZW50RXhlYyA9IHBhcnNlZEFyZ3MuZXhlY3V0aXZlIHx8XG4gICAgICAgICAgKGV4ZWN1dGl2ZU5hbWU/LnRvTG93ZXJDYXNlKCk/LmluY2x1ZGVzKCdzdHJhdGVneScpID8gJ2NzbycgOlxuICAgICAgICAgICAgZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ3RlY2hub2xvZ3knKSA/ICdjdG8nIDpcbiAgICAgICAgICAgICAgZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ2luZm9ybWF0aW9uJykgPyAnY2lvJyA6XG4gICAgICAgICAgICAgICAgZXhlY3V0aXZlTmFtZT8udG9Mb3dlckNhc2UoKT8uaW5jbHVkZXMoJ2FuYWx5dGljcycpID8gJ2NhbycgOiAnZWxpemEnKTtcblxuICAgICAgICBjb25zdCBjb21tZW50UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NvbW1lbnRfb25faXNzdWUnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgaXNzdWVfbnVtYmVyOiBwYXJzZWRBcmdzLmlzc3VlX251bWJlcixcbiAgICAgICAgICAgICAgY29tbWVudDogcGFyc2VkQXJncy5jb21tZW50LFxuICAgICAgICAgICAgICBleGVjdXRpdmU6IGNvbW1lbnRFeGVjXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNvbW1lbnRSZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogY29tbWVudFJlc3VsdC5lcnJvci5tZXNzYWdlIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNvbW1lbnRSZXN1bHQuZGF0YSB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdsaXN0R2l0SHViSXNzdWVzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIExpc3QgR2l0SHViIElzc3Vlc2ApO1xuXG4gICAgICAgIGNvbnN0IGxpc3RSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnbGlzdF9pc3N1ZXMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgc3RhdGU6IHBhcnNlZEFyZ3Muc3RhdGUgfHwgJ29wZW4nLFxuICAgICAgICAgICAgICBwZXJfcGFnZTogcGFyc2VkQXJncy5saW1pdCB8fCAyMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChsaXN0UmVzdWx0LmVycm9yKSB7XG4gICAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGxpc3RSZXN1bHQuZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBsaXN0UmVzdWx0LmRhdGEgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEdJVEhVQiBQVUxMIFJFUVVFU1QgVE9PTFNcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdjcmVhdGVHaXRIdWJQdWxsUmVxdWVzdCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5SEIFske2V4ZWN1dGl2ZU5hbWV9XSBDcmVhdGUgR2l0SHViIFBSOiAke3BhcnNlZEFyZ3MudGl0bGV9YCk7XG4gICAgICAgIGNvbnN0IGNyZWF0ZVBSUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NyZWF0ZV9wdWxsX3JlcXVlc3QnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgdGl0bGU6IHBhcnNlZEFyZ3MudGl0bGUsXG4gICAgICAgICAgICAgIGJvZHk6IHBhcnNlZEFyZ3MuYm9keSxcbiAgICAgICAgICAgICAgaGVhZDogcGFyc2VkQXJncy5oZWFkLFxuICAgICAgICAgICAgICBiYXNlOiBwYXJzZWRBcmdzLmJhc2UgfHwgJ21haW4nLFxuICAgICAgICAgICAgICBkcmFmdDogcGFyc2VkQXJncy5kcmFmdCB8fCBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBjcmVhdGVQUlJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNyZWF0ZVBSUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNyZWF0ZVBSUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2xpc3RHaXRIdWJQdWxsUmVxdWVzdHMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiyBbJHtleGVjdXRpdmVOYW1lfV0gTGlzdCBHaXRIdWIgUFJzYCk7XG4gICAgICAgIGNvbnN0IGxpc3RQUlJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdsaXN0X3B1bGxfcmVxdWVzdHMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgc3RhdGU6IHBhcnNlZEFyZ3Muc3RhdGUgfHwgJ29wZW4nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGxpc3RQUlJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGxpc3RQUlJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBsaXN0UFJSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbWVyZ2VHaXRIdWJQdWxsUmVxdWVzdCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUgWyR7ZXhlY3V0aXZlTmFtZX1dIE1lcmdlIEdpdEh1YiBQUiAjJHtwYXJzZWRBcmdzLnB1bGxfbnVtYmVyfWApO1xuICAgICAgICBjb25zdCBtZXJnZVBSUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ21lcmdlX3B1bGxfcmVxdWVzdCcsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICBwdWxsX251bWJlcjogcGFyc2VkQXJncy5wdWxsX251bWJlcixcbiAgICAgICAgICAgICAgbWVyZ2VfbWV0aG9kOiBwYXJzZWRBcmdzLm1lcmdlX21ldGhvZCB8fCAnc3F1YXNoJyxcbiAgICAgICAgICAgICAgY29tbWl0X3RpdGxlOiBwYXJzZWRBcmdzLmNvbW1pdF90aXRsZSxcbiAgICAgICAgICAgICAgY29tbWl0X21lc3NhZ2U6IHBhcnNlZEFyZ3MuY29tbWl0X21lc3NhZ2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gbWVyZ2VQUlJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IG1lcmdlUFJSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogbWVyZ2VQUlJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjbG9zZUdpdEh1YlB1bGxSZXF1ZXN0JzpcbiAgICAgICAgY29uc29sZS5sb2coYOKdjCBbJHtleGVjdXRpdmVOYW1lfV0gQ2xvc2UgR2l0SHViIFBSICMke3BhcnNlZEFyZ3MucHVsbF9udW1iZXJ9YCk7XG4gICAgICAgIGNvbnN0IGNsb3NlUFJSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnY2xvc2VfcHVsbF9yZXF1ZXN0JyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgIHB1bGxfbnVtYmVyOiBwYXJzZWRBcmdzLnB1bGxfbnVtYmVyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGNsb3NlUFJSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjbG9zZVBSUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNsb3NlUFJSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEdJVEhVQiBCUkFOQ0ggVE9PTFNcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdjcmVhdGVHaXRIdWJCcmFuY2gnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+MvyBbJHtleGVjdXRpdmVOYW1lfV0gQ3JlYXRlIEdpdEh1YiBCcmFuY2g6ICR7cGFyc2VkQXJncy5icmFuY2hfbmFtZX1gKTtcbiAgICAgICAgY29uc3QgY3JlYXRlQnJhbmNoUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NyZWF0ZV9icmFuY2gnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgYnJhbmNoX25hbWU6IHBhcnNlZEFyZ3MuYnJhbmNoX25hbWUsXG4gICAgICAgICAgICAgIGZyb21fYnJhbmNoOiBwYXJzZWRBcmdzLmZyb21fYnJhbmNoIHx8ICdtYWluJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBjcmVhdGVCcmFuY2hSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjcmVhdGVCcmFuY2hSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogY3JlYXRlQnJhbmNoUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2xpc3RHaXRIdWJCcmFuY2hlcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OLIFske2V4ZWN1dGl2ZU5hbWV9XSBMaXN0IEdpdEh1YiBCcmFuY2hlc2ApO1xuICAgICAgICBjb25zdCBsaXN0QnJhbmNoZXNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnbGlzdF9icmFuY2hlcycsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGxpc3RCcmFuY2hlc1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGxpc3RCcmFuY2hlc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBsaXN0QnJhbmNoZXNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0R2l0SHViQnJhbmNoSW5mbyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5SNIFske2V4ZWN1dGl2ZU5hbWV9XSBHZXQgR2l0SHViIEJyYW5jaCBJbmZvOiAke3BhcnNlZEFyZ3MuYnJhbmNofWApO1xuICAgICAgICBjb25zdCBicmFuY2hJbmZvUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldF9icmFuY2hfaW5mbycsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICBicmFuY2g6IHBhcnNlZEFyZ3MuYnJhbmNoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGJyYW5jaEluZm9SZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBicmFuY2hJbmZvUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGJyYW5jaEluZm9SZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEdJVEhVQiBGSUxFICYgQ09ERSBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ2dldEdpdEh1YkZpbGVDb250ZW50JzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4QgWyR7ZXhlY3V0aXZlTmFtZX1dIEdldCBHaXRIdWIgRmlsZTogJHtwYXJzZWRBcmdzLnBhdGh9YCk7XG4gICAgICAgIGNvbnN0IGdldEZpbGVSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0X2ZpbGVfY29udGVudCcsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICBwYXRoOiBwYXJzZWRBcmdzLnBhdGgsXG4gICAgICAgICAgICAgIHJlZjogcGFyc2VkQXJncy5yZWYgfHwgJ21haW4nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGdldEZpbGVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBnZXRGaWxlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGdldEZpbGVSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29tbWl0R2l0SHViRmlsZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OdIFske2V4ZWN1dGl2ZU5hbWV9XSBDb21taXQgR2l0SHViIEZpbGU6ICR7cGFyc2VkQXJncy5wYXRofWApO1xuICAgICAgICBjb25zdCBjb21taXRGaWxlUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NvbW1pdF9maWxlJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgIHBhdGg6IHBhcnNlZEFyZ3MucGF0aCxcbiAgICAgICAgICAgICAgY29udGVudDogcGFyc2VkQXJncy5jb250ZW50LFxuICAgICAgICAgICAgICBtZXNzYWdlOiBwYXJzZWRBcmdzLm1lc3NhZ2UsXG4gICAgICAgICAgICAgIGJyYW5jaDogcGFyc2VkQXJncy5icmFuY2ggfHwgJ21haW4nLFxuICAgICAgICAgICAgICBzaGE6IHBhcnNlZEFyZ3Muc2hhXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGNvbW1pdEZpbGVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjb21taXRGaWxlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNvbW1pdEZpbGVSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZGVsZXRlR2l0SHViRmlsZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5eR77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBEZWxldGUgR2l0SHViIEZpbGU6ICR7cGFyc2VkQXJncy5wYXRofWApO1xuICAgICAgICBjb25zdCBkZWxldGVGaWxlUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2RlbGV0ZV9maWxlJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgIHBhdGg6IHBhcnNlZEFyZ3MucGF0aCxcbiAgICAgICAgICAgICAgbWVzc2FnZTogcGFyc2VkQXJncy5tZXNzYWdlLFxuICAgICAgICAgICAgICBicmFuY2g6IHBhcnNlZEFyZ3MuYnJhbmNoIHx8ICdtYWluJyxcbiAgICAgICAgICAgICAgc2hhOiBwYXJzZWRBcmdzLnNoYVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBkZWxldGVGaWxlUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZGVsZXRlRmlsZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBkZWxldGVGaWxlUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2xpc3RHaXRIdWJGaWxlcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OCIFske2V4ZWN1dGl2ZU5hbWV9XSBMaXN0IEdpdEh1YiBGaWxlczogJHtwYXJzZWRBcmdzLnBhdGggfHwgJy8nfWApO1xuICAgICAgICBjb25zdCBsaXN0RmlsZXNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnbGlzdF9maWxlcycsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICBwYXRoOiBwYXJzZWRBcmdzLnBhdGggfHwgJycsXG4gICAgICAgICAgICAgIHJlZjogcGFyc2VkQXJncy5yZWYgfHwgJ21haW4nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGxpc3RGaWxlc1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGxpc3RGaWxlc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBsaXN0RmlsZXNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc2VhcmNoR2l0SHViQ29kZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5SNIFske2V4ZWN1dGl2ZU5hbWV9XSBTZWFyY2ggR2l0SHViIENvZGU6ICR7cGFyc2VkQXJncy5xdWVyeX1gKTtcbiAgICAgICAgY29uc3Qgc2VhcmNoQ29kZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdzZWFyY2hfY29kZScsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICBxdWVyeTogcGFyc2VkQXJncy5xdWVyeVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBzZWFyY2hDb2RlUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogc2VhcmNoQ29kZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBzZWFyY2hDb2RlUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBHSVRIVUIgRVZFTlQgTU9OSVRPUklORyBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ2xpc3RfZ2l0aHViX2NvbW1pdHMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TnSBbJHtleGVjdXRpdmVOYW1lfV0gTGlzdCBHaXRIdWIgQ29tbWl0c2ApO1xuICAgICAgICBjb25zdCBsaXN0Q29tbWl0c1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdsaXN0X2NvbW1pdHMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgYXV0aG9yOiBwYXJzZWRBcmdzLmF1dGhvcixcbiAgICAgICAgICAgICAgc2luY2U6IHBhcnNlZEFyZ3Muc2luY2UsXG4gICAgICAgICAgICAgIHVudGlsOiBwYXJzZWRBcmdzLnVudGlsLFxuICAgICAgICAgICAgICBzaGE6IHBhcnNlZEFyZ3Muc2hhLFxuICAgICAgICAgICAgICBwYXRoOiBwYXJzZWRBcmdzLnBhdGgsXG4gICAgICAgICAgICAgIHBlcl9wYWdlOiBwYXJzZWRBcmdzLnBlcl9wYWdlIHx8IDMwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGxpc3RDb21taXRzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogbGlzdENvbW1pdHNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogbGlzdENvbW1pdHNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0X2NvbW1pdF9kZXRhaWxzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk6YgWyR7ZXhlY3V0aXZlTmFtZX1dIEdldCBDb21taXQgRGV0YWlsczogJHtwYXJzZWRBcmdzLmNvbW1pdF9zaGF9YCk7XG4gICAgICAgIGNvbnN0IGNvbW1pdERldGFpbHNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0X2NvbW1pdF9kZXRhaWxzJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgIGNvbW1pdF9zaGE6IHBhcnNlZEFyZ3MuY29tbWl0X3NoYVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBjb21taXREZXRhaWxzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogY29tbWl0RGV0YWlsc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBjb21taXREZXRhaWxzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2xpc3RfcmVwb19ldmVudHMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiiBbJHtleGVjdXRpdmVOYW1lfV0gTGlzdCBSZXBvIEV2ZW50c2ApO1xuICAgICAgICBjb25zdCByZXBvRXZlbnRzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ2l0aHViLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2xpc3RfcmVwb19ldmVudHMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgcGVyX3BhZ2U6IHBhcnNlZEFyZ3MucGVyX3BhZ2UgfHwgMzBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVwb0V2ZW50c1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcG9FdmVudHNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVwb0V2ZW50c1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdsaXN0X2dpdGh1Yl9yZWxlYXNlcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn4+377iPIFske2V4ZWN1dGl2ZU5hbWV9XSBMaXN0IEdpdEh1YiBSZWxlYXNlc2ApO1xuICAgICAgICBjb25zdCByZWxlYXNlc1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdsaXN0X3JlbGVhc2VzJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgIHBlcl9wYWdlOiBwYXJzZWRBcmdzLnBlcl9wYWdlIHx8IDMwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJlbGVhc2VzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVsZWFzZXNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVsZWFzZXNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnbGlzdF9naXRodWJfY29udHJpYnV0b3JzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkaUgWyR7ZXhlY3V0aXZlTmFtZX1dIExpc3QgR2l0SHViIENvbnRyaWJ1dG9yc2ApO1xuICAgICAgICBjb25zdCBjb250cmlidXRvcnNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnbGlzdF9jb250cmlidXRvcnMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgaW5jbHVkZV9hbm9ueW1vdXM6IHBhcnNlZEFyZ3MuaW5jbHVkZV9hbm9ueW1vdXMgfHwgZmFsc2UsXG4gICAgICAgICAgICAgIHBlcl9wYWdlOiBwYXJzZWRBcmdzLnBlcl9wYWdlIHx8IDMwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGNvbnRyaWJ1dG9yc1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNvbnRyaWJ1dG9yc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBjb250cmlidXRvcnNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0X3JlbGVhc2VfZGV0YWlscyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn4+377iPIFske2V4ZWN1dGl2ZU5hbWV9XSBHZXQgUmVsZWFzZSBEZXRhaWxzOiAke3BhcnNlZEFyZ3MucmVsZWFzZV9pZCB8fCAnbGF0ZXN0J31gKTtcbiAgICAgICAgY29uc3QgcmVsZWFzZURldGFpbHNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0X3JlbGVhc2VfZGV0YWlscycsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICByZWxlYXNlX2lkOiBwYXJzZWRBcmdzLnJlbGVhc2VfaWQgfHwgJ2xhdGVzdCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVsZWFzZURldGFpbHNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZWxlYXNlRGV0YWlsc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZWxlYXNlRGV0YWlsc1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRHaXRIdWJJc3N1ZUNvbW1lbnRzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkqwgWyR7ZXhlY3V0aXZlTmFtZX1dIEdldCBJc3N1ZSBDb21tZW50czogIyR7cGFyc2VkQXJncy5pc3N1ZV9udW1iZXJ9YCk7XG4gICAgICAgIGNvbnN0IGlzc3VlQ29tbWVudHNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0X2lzc3VlX2NvbW1lbnRzJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgIGlzc3VlX251bWJlcjogcGFyc2VkQXJncy5pc3N1ZV9udW1iZXIsXG4gICAgICAgICAgICAgIHBlcl9wYWdlOiBwYXJzZWRBcmdzLnBlcl9wYWdlIHx8IDMwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGlzc3VlQ29tbWVudHNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBpc3N1ZUNvbW1lbnRzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGlzc3VlQ29tbWVudHNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0R2l0SHViRGlzY3Vzc2lvbkNvbW1lbnRzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkqwgWyR7ZXhlY3V0aXZlTmFtZX1dIEdldCBEaXNjdXNzaW9uIENvbW1lbnRzOiAjJHtwYXJzZWRBcmdzLmRpc2N1c3Npb25fbnVtYmVyfWApO1xuICAgICAgICBjb25zdCBkaXNjdXNzaW9uQ29tbWVudHNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0X2Rpc2N1c3Npb25fY29tbWVudHMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgZGlzY3Vzc2lvbl9udW1iZXI6IHBhcnNlZEFyZ3MuZGlzY3Vzc2lvbl9udW1iZXIsXG4gICAgICAgICAgICAgIGZpcnN0OiBwYXJzZWRBcmdzLmZpcnN0IHx8IDMwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGRpc2N1c3Npb25Db21tZW50c1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGRpc2N1c3Npb25Db21tZW50c1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBkaXNjdXNzaW9uQ29tbWVudHNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAndXBkYXRlR2l0SHViSXNzdWUnOlxuICAgICAgICBjb25zb2xlLmxvZyhg4pyP77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBVcGRhdGUgSXNzdWU6ICMke3BhcnNlZEFyZ3MuaXNzdWVfbnVtYmVyfWApO1xuICAgICAgICBjb25zdCB1cGRhdGVJc3N1ZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICd1cGRhdGVfaXNzdWUnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgaXNzdWVfbnVtYmVyOiBwYXJzZWRBcmdzLmlzc3VlX251bWJlcixcbiAgICAgICAgICAgICAgdGl0bGU6IHBhcnNlZEFyZ3MudGl0bGUsXG4gICAgICAgICAgICAgIGJvZHk6IHBhcnNlZEFyZ3MuYm9keSxcbiAgICAgICAgICAgICAgc3RhdGU6IHBhcnNlZEFyZ3Muc3RhdGUsXG4gICAgICAgICAgICAgIGxhYmVsczogcGFyc2VkQXJncy5sYWJlbHMsXG4gICAgICAgICAgICAgIGFzc2lnbmVlczogcGFyc2VkQXJncy5hc3NpZ25lZXNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdXBkYXRlSXNzdWVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB1cGRhdGVJc3N1ZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB1cGRhdGVJc3N1ZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjbG9zZUdpdEh1Yklzc3VlJzpcbiAgICAgICAgY29uc29sZS5sb2coYOKdjCBbJHtleGVjdXRpdmVOYW1lfV0gQ2xvc2UgSXNzdWU6ICMke3BhcnNlZEFyZ3MuaXNzdWVfbnVtYmVyfWApO1xuICAgICAgICBjb25zdCBjbG9zaW5nQ29tbWVudCA9IHBhcnNlZEFyZ3MuYm9keSA/PyBwYXJzZWRBcmdzLmNvbW1lbnQ7XG4gICAgICAgIC8vIElmIGNvbW1lbnQgcHJvdmlkZWQsIGFkZCBpdCBmaXJzdFxuICAgICAgICBpZiAoY2xvc2luZ0NvbW1lbnQpIHtcbiAgICAgICAgICBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICAgIGFjdGlvbjogJ2NvbW1lbnRfb25faXNzdWUnLFxuICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgcmVwbzogcGFyc2VkQXJncy5yZXBvIHx8ICdYTVJULUVjb3N5c3RlbScsXG4gICAgICAgICAgICAgICAgaXNzdWVfbnVtYmVyOiBwYXJzZWRBcmdzLmlzc3VlX251bWJlcixcbiAgICAgICAgICAgICAgICBjb21tZW50OiBjbG9zaW5nQ29tbWVudFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBzZXNzaW9uX2NyZWRlbnRpYWxzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2xvc2VJc3N1ZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dpdGh1Yi1pbnRlZ3JhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdjbG9zZV9pc3N1ZScsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICBpc3N1ZV9udW1iZXI6IHBhcnNlZEFyZ3MuaXNzdWVfbnVtYmVyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGNsb3NlSXNzdWVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjbG9zZUlzc3VlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNsb3NlSXNzdWVSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEdJVEhVQiBXT1JLRkxPVyBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ3RyaWdnZXJfZ2l0aHViX3dvcmtmbG93JzpcbiAgICAgICAgY29uc29sZS5sb2coYOKWtu+4jyBbJHtleGVjdXRpdmVOYW1lfV0gVHJpZ2dlciBHaXRIdWIgV29ya2Zsb3c6ICR7cGFyc2VkQXJncy53b3JrZmxvd19maWxlfWApO1xuICAgICAgICBjb25zdCB0cmlnZ2VyV29ya2Zsb3dSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAndHJpZ2dlcl93b3JrZmxvdycsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgICB3b3JrZmxvd19maWxlOiBwYXJzZWRBcmdzLndvcmtmbG93X2ZpbGUsXG4gICAgICAgICAgICAgIHJlZjogcGFyc2VkQXJncy5yZWYgfHwgJ21haW4nLFxuICAgICAgICAgICAgICBpbnB1dHM6IHBhcnNlZEFyZ3MuaW5wdXRzIHx8IHt9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2Vzc2lvbl9jcmVkZW50aWFsc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHRyaWdnZXJXb3JrZmxvd1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHRyaWdnZXJXb3JrZmxvd1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB0cmlnZ2VyV29ya2Zsb3dSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY3JlYXRlR2l0SHViV29ya2Zsb3dGaWxlJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIENyZWF0ZSBHaXRIdWIgV29ya2Zsb3c6ICR7cGFyc2VkQXJncy53b3JrZmxvd19uYW1lfWApO1xuICAgICAgICAvLyBDcmVhdGUgd29ya2Zsb3cgZmlsZSBpbiAuZ2l0aHViL3dvcmtmbG93cy8gZGlyZWN0b3J5XG4gICAgICAgIGNvbnN0IHdvcmtmbG93UGF0aCA9IGAuZ2l0aHViL3dvcmtmbG93cy8ke3BhcnNlZEFyZ3Mud29ya2Zsb3dfbmFtZX0ueW1sYDtcbiAgICAgICAgY29uc3QgY3JlYXRlV29ya2Zsb3dSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnaXRodWItaW50ZWdyYXRpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnY29tbWl0X2ZpbGUnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICByZXBvOiBwYXJzZWRBcmdzLnJlcG8gfHwgJ1hNUlQtRWNvc3lzdGVtJyxcbiAgICAgICAgICAgICAgcGF0aDogd29ya2Zsb3dQYXRoLFxuICAgICAgICAgICAgICBjb250ZW50OiBwYXJzZWRBcmdzLnlhbWxfY29udGVudCxcbiAgICAgICAgICAgICAgbWVzc2FnZTogcGFyc2VkQXJncy5jb21taXRfbWVzc2FnZSB8fCBgQWRkIHdvcmtmbG93OiAke3BhcnNlZEFyZ3Mud29ya2Zsb3dfbmFtZX1gLFxuICAgICAgICAgICAgICBicmFuY2g6IHBhcnNlZEFyZ3MuYnJhbmNoIHx8ICdtYWluJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlc3Npb25fY3JlZGVudGlhbHNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBjcmVhdGVXb3JrZmxvd1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNyZWF0ZVdvcmtmbG93UmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHsgLi4uY3JlYXRlV29ya2Zsb3dSZXN1bHQuZGF0YSwgd29ya2Zsb3dfcGF0aDogd29ya2Zsb3dQYXRoIH0gfTtcblxuICAgICAgY2FzZSAnbGlzdF9hdmFpbGFibGVfZnVuY3Rpb25zJzpcbiAgICAgICAgY29uc3QgZnVuY3Rpb25zUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnbGlzdC1hdmFpbGFibGUtZnVuY3Rpb25zJywge1xuICAgICAgICAgIGJvZHk6IHsgY2F0ZWdvcnk6IHBhcnNlZEFyZ3MuY2F0ZWdvcnkgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGZ1bmN0aW9uc1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRfZnVuY3Rpb25fdXNhZ2VfYW5hbHl0aWNzJzpcbiAgICAgICAgY29uc3QgYW5hbHl0aWNzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZnVuY3Rpb24tdXNhZ2UtYW5hbHl0aWNzJywge1xuICAgICAgICAgIGJvZHk6IHBhcnNlZEFyZ3NcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBhbmFseXRpY3NSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncHJvcG9zZV9uZXdfZWRnZV9mdW5jdGlvbic6XG4gICAgICAgIGNvbnN0IHByb3Bvc2FsUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncHJvcG9zZS1uZXctZWRnZS1mdW5jdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7IC4uLnBhcnNlZEFyZ3MsIHByb3Bvc2VkX2J5OiBleGVjdXRpdmVOYW1lIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBwcm9wb3NhbFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2b3RlX29uX2Z1bmN0aW9uX3Byb3Bvc2FsJzpcbiAgICAgICAgY29uc3Qgdm90ZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZvdGUtb24tcHJvcG9zYWwnLCB7XG4gICAgICAgICAgYm9keTogeyAuLi5wYXJzZWRBcmdzLCBleGVjdXRpdmVfbmFtZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdm90ZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdsaXN0X2Z1bmN0aW9uX3Byb3Bvc2Fscyc6XG4gICAgICAgIGNvbnN0IHByb3Bvc2Fsc1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2xpc3QtZnVuY3Rpb24tcHJvcG9zYWxzJywge1xuICAgICAgICAgIGJvZHk6IHBhcnNlZEFyZ3NcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBwcm9wb3NhbHNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gVGFzay1PcmNoZXN0cmF0b3IgVG9vbHNcbiAgICAgIGNhc2UgJ2F1dG9fYXNzaWduX3Rhc2tzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfpJYgWyR7ZXhlY3V0aXZlTmFtZX1dIEF1dG8tYXNzaWduaW5nIHBlbmRpbmcgdGFza3MgdG8gaWRsZSBhZ2VudHNgKTtcbiAgICAgICAgY29uc3QgYXNzaWduUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndGFzay1vcmNoZXN0cmF0b3InLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICdhdXRvX2Fzc2lnbl90YXNrcycsIGRhdGE6IHt9IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGFzc2lnblJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGFzc2lnblJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBhc3NpZ25SZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncmViYWxhbmNlX3dvcmtsb2FkJzpcbiAgICAgICAgY29uc29sZS5sb2coYOKalu+4jyBbJHtleGVjdXRpdmVOYW1lfV0gQW5hbHl6aW5nIHdvcmtsb2FkIGRpc3RyaWJ1dGlvbmApO1xuICAgICAgICBjb25zdCByZWJhbGFuY2VSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd0YXNrLW9yY2hlc3RyYXRvcicsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ3JlYmFsYW5jZV93b3JrbG9hZCcsIGRhdGE6IHt9IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJlYmFsYW5jZVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlYmFsYW5jZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZWJhbGFuY2VSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnaWRlbnRpZnlfYmxvY2tlcnMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+apyBbJHtleGVjdXRpdmVOYW1lfV0gSWRlbnRpZnlpbmcgYmxvY2tlZCB0YXNrc2ApO1xuICAgICAgICBjb25zdCBibG9ja2Vyc1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Rhc2stb3JjaGVzdHJhdG9yJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnaWRlbnRpZnlfYmxvY2tlcnMnLCBkYXRhOiB7fSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBibG9ja2Vyc1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGJsb2NrZXJzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGJsb2NrZXJzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NsZWFyX2Jsb2NrZWRfdGFza3MnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+nuSBbJHtleGVjdXRpdmVOYW1lfV0gQ2xlYXJpbmcgYmxvY2tlZCB0YXNrc2ApO1xuICAgICAgICBjb25zdCBjbGVhclJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Rhc2stb3JjaGVzdHJhdG9yJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnY2xlYXJfYWxsX2Jsb2NrZWRfdGFza3MnLCBkYXRhOiB7fSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBjbGVhclJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNsZWFyUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNsZWFyUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2J1bGtfdXBkYXRlX3Rhc2tfc3RhdHVzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk6YgWyR7ZXhlY3V0aXZlTmFtZX1dIEJ1bGsgdXBkYXRpbmcgdGFzayBzdGF0dXNgKTtcbiAgICAgICAgY29uc3QgYnVsa1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Rhc2stb3JjaGVzdHJhdG9yJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2J1bGtfdXBkYXRlX3Rhc2tfc3RhdHVzJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgdGFza19pZHM6IHBhcnNlZEFyZ3MudGFza19pZHMsXG4gICAgICAgICAgICAgIG5ld19zdGF0dXM6IHBhcnNlZEFyZ3MubmV3X3N0YXR1cyxcbiAgICAgICAgICAgICAgbmV3X3N0YWdlOiBwYXJzZWRBcmdzLm5ld19zdGFnZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGJ1bGtSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBidWxrUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGJ1bGtSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0X3Rhc2tfcGVyZm9ybWFuY2VfcmVwb3J0JzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4ogWyR7ZXhlY3V0aXZlTmFtZX1dIEdlbmVyYXRpbmcgdGFzayBwZXJmb3JtYW5jZSByZXBvcnRgKTtcbiAgICAgICAgY29uc3QgcmVwb3J0UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndGFzay1vcmNoZXN0cmF0b3InLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICdwZXJmb3JtYW5jZV9yZXBvcnQnLCBkYXRhOiB7fSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByZXBvcnRSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXBvcnRSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVwb3J0UmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vIFN1cGVyRHVwZXIgQWdlbnQgVG9vbHNcbiAgICAgIGNhc2UgJ2NvbnN1bHRfY29kZV9hcmNoaXRlY3QnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+Pl++4jyBbJHtleGVjdXRpdmVOYW1lfV0gQ29uc3VsdGluZyBDb2RlIEFyY2hpdGVjdGApO1xuICAgICAgICBjb25zdCBjb2RlQXJjaFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N1cGVyZHVwZXItY29kZS1hcmNoaXRlY3QnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBwYXJhbXM6IHsgY29udGV4dDogcGFyc2VkQXJncy5jb250ZXh0IH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gY29kZUFyY2hSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjb2RlQXJjaFJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBjb2RlQXJjaFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb25zdWx0X2J1c2luZXNzX3N0cmF0ZWdpc3QnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiCBbJHtleGVjdXRpdmVOYW1lfV0gQ29uc3VsdGluZyBCdXNpbmVzcyBTdHJhdGVnaXN0YCk7XG4gICAgICAgIGNvbnN0IGJpelJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N1cGVyZHVwZXItYnVzaW5lc3MtZ3Jvd3RoJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiBwYXJzZWRBcmdzLmFjdGlvbiwgcGFyYW1zOiB7IGNvbnRleHQ6IHBhcnNlZEFyZ3MuY29udGV4dCB9IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGJpelJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGJpelJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBiaXpSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29uc3VsdF9maW5hbmNlX2V4cGVydCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5KwIFske2V4ZWN1dGl2ZU5hbWV9XSBDb25zdWx0aW5nIEZpbmFuY2UgRXhwZXJ0YCk7XG4gICAgICAgIGNvbnN0IGZpbmFuY2VSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdXBlcmR1cGVyLWZpbmFuY2UtaW52ZXN0bWVudCcsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIHBhcmFtczogeyBjb250ZXh0OiBwYXJzZWRBcmdzLmNvbnRleHQgfSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBmaW5hbmNlUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZmluYW5jZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBmaW5hbmNlUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnN1bHRfY29tbXVuaWNhdGlvbl9leHBlcnQnOlxuICAgICAgICBjb25zb2xlLmxvZyhg4pyJ77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBDb25zdWx0aW5nIENvbW11bmljYXRpb24gRXhwZXJ0YCk7XG4gICAgICAgIGNvbnN0IGNvbW1SZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdXBlcmR1cGVyLWNvbW11bmljYXRpb24tb3V0cmVhY2gnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBwYXJhbXM6IHsgY29udGV4dDogcGFyc2VkQXJncy5jb250ZXh0IH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gY29tbVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNvbW1SZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogY29tbVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb25zdWx0X2NvbnRlbnRfcHJvZHVjZXInOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+OrCBbJHtleGVjdXRpdmVOYW1lfV0gQ29uc3VsdGluZyBDb250ZW50IFByb2R1Y2VyYCk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdXBlcmR1cGVyLWNvbnRlbnQtbWVkaWEnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBwYXJhbXM6IHsgY29udGV4dDogcGFyc2VkQXJncy5jb250ZXh0IH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gY29udGVudFJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNvbnRlbnRSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogY29udGVudFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb25zdWx0X2JyYW5kX2Rlc2lnbmVyJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfjqggWyR7ZXhlY3V0aXZlTmFtZX1dIENvbnN1bHRpbmcgQnJhbmQgRGVzaWduZXJgKTtcbiAgICAgICAgY29uc3QgZGVzaWduUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3VwZXJkdXBlci1kZXNpZ24tYnJhbmQnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBwYXJhbXM6IHsgY29udGV4dDogcGFyc2VkQXJncy5jb250ZXh0IH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gZGVzaWduUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZGVzaWduUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGRlc2lnblJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb25zdWx0X2NhcmVlcl9jb2FjaCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn46vIFske2V4ZWN1dGl2ZU5hbWV9XSBDb25zdWx0aW5nIENhcmVlciBDb2FjaGApO1xuICAgICAgICBjb25zdCBjb2FjaFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N1cGVyZHVwZXItZGV2ZWxvcG1lbnQtY29hY2gnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBwYXJhbXM6IHsgY29udGV4dDogcGFyc2VkQXJncy5jb250ZXh0IH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gY29hY2hSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjb2FjaFJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBjb2FjaFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb25zdWx0X2RvbWFpbl9zcGVjaWFsaXN0JzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfjI0gWyR7ZXhlY3V0aXZlTmFtZX1dIENvbnN1bHRpbmcgRG9tYWluIFNwZWNpYWxpc3RgKTtcbiAgICAgICAgY29uc3QgZG9tYWluUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3VwZXJkdXBlci1kb21haW4tZXhwZXJ0cycsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIHBhcmFtczogeyBjb250ZXh0OiBwYXJzZWRBcmdzLmNvbnRleHQgfSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBkb21haW5SZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBkb21haW5SZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogZG9tYWluUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnN1bHRfaW50ZWdyYXRpb25fc3BlY2lhbGlzdCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5SMIFske2V4ZWN1dGl2ZU5hbWV9XSBDb25zdWx0aW5nIEludGVncmF0aW9uIFNwZWNpYWxpc3RgKTtcbiAgICAgICAgY29uc3QgaW50ZWdyYXRpb25SZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdXBlcmR1cGVyLWludGVncmF0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiBwYXJzZWRBcmdzLmFjdGlvbiwgcGFyYW1zOiB7IGNvbnRleHQ6IHBhcnNlZEFyZ3MuY29udGV4dCB9IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGludGVncmF0aW9uUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogaW50ZWdyYXRpb25SZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogaW50ZWdyYXRpb25SZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29uc3VsdF9yZXNlYXJjaF9hbmFseXN0JzpcbiAgICAgICAgY29uc29sZS5sb2coYPCflKwgWyR7ZXhlY3V0aXZlTmFtZX1dIENvbnN1bHRpbmcgUmVzZWFyY2ggQW5hbHlzdGApO1xuICAgICAgICBjb25zdCByZXNlYXJjaFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N1cGVyZHVwZXItcmVzZWFyY2gtaW50ZWxsaWdlbmNlJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiBwYXJzZWRBcmdzLmFjdGlvbiwgcGFyYW1zOiB7IGNvbnRleHQ6IHBhcnNlZEFyZ3MuY29udGV4dCB9IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJlc2VhcmNoUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzZWFyY2hSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzZWFyY2hSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29uc3VsdF92aXJhbF9jb250ZW50X2V4cGVydCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5qAIFske2V4ZWN1dGl2ZU5hbWV9XSBDb25zdWx0aW5nIFZpcmFsIENvbnRlbnQgRXhwZXJ0YCk7XG4gICAgICAgIGNvbnN0IHZpcmFsUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3VwZXJkdXBlci1zb2NpYWwtdmlyYWwnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBwYXJhbXM6IHsgY29udGV4dDogcGFyc2VkQXJncy5jb250ZXh0IH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdmlyYWxSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2aXJhbFJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB2aXJhbFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdyb3V0ZV90b19zdXBlcmR1cGVyX2FnZW50JzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfjq8gWyR7ZXhlY3V0aXZlTmFtZX1dIFJvdXRpbmcgdG8gU3VwZXJEdXBlciBzcGVjaWFsaXN0YCk7XG4gICAgICAgIGNvbnN0IHJvdXRlUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3VwZXJkdXBlci1yb3V0ZXInLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgcmVxdWVzdDogcGFyc2VkQXJncy5yZXF1ZXN0LFxuICAgICAgICAgICAgcHJlZmVycmVkX3NwZWNpYWxpc3Q6IHBhcnNlZEFyZ3MucHJlZmVycmVkX3NwZWNpYWxpc3RcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByb3V0ZVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJvdXRlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJvdXRlUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBESUFHTk9TVElDICYgQU5BTFlUSUNTIFRPT0xTXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgY2FzZSAnZ2V0X2VkZ2VfZnVuY3Rpb25fbG9ncyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OLIFske2V4ZWN1dGl2ZU5hbWV9XSBHZXQgRWRnZSBGdW5jdGlvbiBMb2dzOiAke3BhcnNlZEFyZ3MuZnVuY3Rpb25fbmFtZX1gKTtcbiAgICAgICAgY29uc3QgbG9nc1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dldC1lZGdlLWZ1bmN0aW9uLWxvZ3MnLCB7XG4gICAgICAgICAgYm9keTogcGFyc2VkQXJnc1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gbG9nc1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGxvZ3NSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogbG9nc1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRfZnVuY3Rpb25fdmVyc2lvbl9hbmFseXRpY3MnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiiBbJHtleGVjdXRpdmVOYW1lfV0gR2V0IEZ1bmN0aW9uIFZlcnNpb24gQW5hbHl0aWNzOiAke3BhcnNlZEFyZ3MuZnVuY3Rpb25fbmFtZX1gKTtcbiAgICAgICAgY29uc3QgdmVyc2lvbkFuYWx5dGljc1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dldC1mdW5jdGlvbi12ZXJzaW9uLWFuYWx5dGljcycsIHtcbiAgICAgICAgICBib2R5OiBwYXJzZWRBcmdzXG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB2ZXJzaW9uQW5hbHl0aWNzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogdmVyc2lvbkFuYWx5dGljc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB2ZXJzaW9uQW5hbHl0aWNzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2dldF90b29sX3VzYWdlX2FuYWx5dGljcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OIIFske2V4ZWN1dGl2ZU5hbWV9XSBHZXQgVG9vbCBVc2FnZSBBbmFseXRpY3NgKTtcbiAgICAgICAgY29uc3QgdG9vbEFuYWx5dGljc1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Rvb2wtdXNhZ2UtYW5hbHl0aWNzJywge1xuICAgICAgICAgIGJvZHk6IHBhcnNlZEFyZ3NcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHRvb2xBbmFseXRpY3NSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB0b29sQW5hbHl0aWNzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHRvb2xBbmFseXRpY3NSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIFNZU1RFTSBIRUFMVEggJiBNT05JVE9SSU5HIFRPT0xTIChGSVhFRClcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdjaGVja19zeXN0ZW1fc3RhdHVzJzpcbiAgICAgIGNhc2UgJ2NoZWNrX2Vjb3N5c3RlbV9oZWFsdGgnOlxuICAgICAgY2FzZSAnZ2VuZXJhdGVfaGVhbHRoX3JlcG9ydCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn6m6IFske2V4ZWN1dGl2ZU5hbWV9XSBTeXN0ZW0gSGVhbHRoIENoZWNrOiAke25hbWV9YCk7XG4gICAgICAgIGNvbnN0IGhlYWx0aFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N5c3RlbS1zdGF0dXMnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IG5hbWUsIC4uLnBhcnNlZEFyZ3MgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gaGVhbHRoUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogaGVhbHRoUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGhlYWx0aFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgLy8gQ09ERSBFWEVDVVRJT04gVE9PTFMgKEZJWEVEKVxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ3J1bl9jb2RlJzpcbiAgICAgICAgLy8gQWxpYXMgZm9yIGV4ZWN1dGVfcHl0aG9uXG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5CNIFske2V4ZWN1dGl2ZU5hbWV9XSBSdW4gQ29kZSAoYWxpYXMgZm9yIGV4ZWN1dGVfcHl0aG9uKWApO1xuICAgICAgICBjb25zdCBydW5Db2RlUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncHl0aG9uLWV4ZWN1dG9yJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGNvZGU6IHBhcnNlZEFyZ3MuY29kZSxcbiAgICAgICAgICAgIHB1cnBvc2U6IHBhcnNlZEFyZ3MucHVycG9zZSB8fCAnQ29kZSBleGVjdXRpb24gdmlhIHJ1bl9jb2RlJyxcbiAgICAgICAgICAgIHNvdXJjZTogZXhlY3V0aXZlTmFtZS50b0xvd2VyQ2FzZSgpICsgJy1leGVjdXRpdmUnLFxuICAgICAgICAgICAgYWdlbnRfaWQ6IGV4ZWN1dGl2ZU5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJ1bkNvZGVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBydW5Db2RlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJ1bkNvZGVSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIE1DUCAmIFBBVEVOVCBUT09MUyAoRklYRUQpXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgY2FzZSAnc2VhcmNoX3VzcHRvX3BhdGVudHMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+UjSBbJHtleGVjdXRpdmVOYW1lfV0gVVNQVE8gUGF0ZW50IFNlYXJjaGApO1xuICAgICAgICBjb25zdCBwYXRlbnRSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd1c3B0by1wYXRlbnQtbWNwJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnc2VhcmNoJywgLi4ucGFyc2VkQXJncyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBwYXRlbnRSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBwYXRlbnRSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcGF0ZW50UmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBXT1JLRkxPVyBUT09MUyAoRklYRUQpXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgY2FzZSAnbGlzdF93b3JrZmxvd190ZW1wbGF0ZXMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiyBbJHtleGVjdXRpdmVOYW1lfV0gTGlzdCBXb3JrZmxvdyBUZW1wbGF0ZXNgKTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnd29ya2Zsb3ctdGVtcGxhdGUtbWFuYWdlcicsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ2xpc3RfdGVtcGxhdGVzJywgLi4ucGFyc2VkQXJncyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB0ZW1wbGF0ZXNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB0ZW1wbGF0ZXNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdGVtcGxhdGVzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2V4ZWN1dGVfd29ya2Zsb3dfdGVtcGxhdGUnOlxuICAgICAgICBjb25zb2xlLmxvZyhg4pa277iPIFske2V4ZWN1dGl2ZU5hbWV9XSBFeGVjdXRlIFdvcmtmbG93IFRlbXBsYXRlOiAke3BhcnNlZEFyZ3MudGVtcGxhdGVfaWR9YCk7XG4gICAgICAgIGNvbnN0IHdvcmtmbG93UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnd29ya2Zsb3ctdGVtcGxhdGUtbWFuYWdlcicsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ2V4ZWN1dGVfdGVtcGxhdGUnLCAuLi5wYXJzZWRBcmdzIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHdvcmtmbG93UmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogd29ya2Zsb3dSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogd29ya2Zsb3dSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gQWdlbnQgbWFuYWdlbWVudCB0b29sc1xuICAgICAgY2FzZSAnbGlzdF9hZ2VudHMnOlxuICAgICAgY2FzZSAnc3Bhd25fYWdlbnQnOlxuICAgICAgY2FzZSAndXBkYXRlX2FnZW50X3N0YXR1cyc6XG4gICAgICBjYXNlICdhc3NpZ25fdGFzayc6XG4gICAgICBjYXNlICdsaXN0X3Rhc2tzJzpcbiAgICAgIGNhc2UgJ3VwZGF0ZV90YXNrX3N0YXR1cyc6XG4gICAgICBjYXNlICdzZXRfdGFza19zdGF0dXMnOlxuICAgICAgY2FzZSAnZ2V0X3Rhc2tfZGV0YWlscyc6XG4gICAgICBjYXNlICdkZWxldGVfdGFzayc6XG4gICAgICBjYXNlICdnZXRfYWdlbnRfd29ya2xvYWQnOlxuICAgICAgY2FzZSAnZ2V0X2FnZW50X2J5X25hbWUnOlxuICAgICAgY2FzZSAnZ2V0X2FnZW50X3N0YXRzJzpcbiAgICAgIGNhc2UgJ2JhdGNoX3NwYXduX2FnZW50cyc6XG4gICAgICBjYXNlICdhcmNoaXZlX2FnZW50JzpcbiAgICAgICAgY29uc3QgYWdlbnRSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdhZ2VudC1tYW5hZ2VyJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiBuYW1lLnJlcGxhY2UoJ18nLCAnXycpLnRvTG93ZXJDYXNlKCksIGRhdGE6IHBhcnNlZEFyZ3MgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGFnZW50UmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBLTk9XTEVER0UgTUFOQUdFTUVOVCBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ3N0b3JlX2tub3dsZWRnZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn6egIFske2V4ZWN1dGl2ZU5hbWV9XSBTdG9yZSBLbm93bGVkZ2U6ICR7cGFyc2VkQXJncy5uYW1lfWApO1xuICAgICAgICBjb25zdCBzdG9yZUtub3dsZWRnZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2tub3dsZWRnZS1tYW5hZ2VyL3N0b3JlJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnc3RvcmVfa25vd2xlZGdlJywgZGF0YTogcGFyc2VkQXJncyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBzdG9yZUtub3dsZWRnZVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHN0b3JlS25vd2xlZGdlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHN0b3JlS25vd2xlZGdlUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3NlYXJjaF9rbm93bGVkZ2UnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+UjSBbJHtleGVjdXRpdmVOYW1lfV0gU2VhcmNoIEtub3dsZWRnZTogJHtwYXJzZWRBcmdzLnNlYXJjaF90ZXJtIHx8IHBhcnNlZEFyZ3MuZW50aXR5X3R5cGUgfHwgJ2FsbCd9YCk7XG4gICAgICAgIGNvbnN0IHNlYXJjaEtub3dsZWRnZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2tub3dsZWRnZS1tYW5hZ2VyL3N0b3JlJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnc2VhcmNoX2tub3dsZWRnZScsIGRhdGE6IHBhcnNlZEFyZ3MgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gc2VhcmNoS25vd2xlZGdlUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogc2VhcmNoS25vd2xlZGdlUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHNlYXJjaEtub3dsZWRnZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdyZWNhbGxfZW50aXR5JzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfp6AgWyR7ZXhlY3V0aXZlTmFtZX1dIFJlY2FsbCBFbnRpdHk6ICR7cGFyc2VkQXJncy5uYW1lfWApO1xuICAgICAgICBjb25zdCByZWNhbGxSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdrbm93bGVkZ2UtbWFuYWdlci9zdG9yZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ3NlYXJjaF9rbm93bGVkZ2UnLCBkYXRhOiB7IHNlYXJjaF90ZXJtOiBwYXJzZWRBcmdzLm5hbWUgfSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByZWNhbGxSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZWNhbGxSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVjYWxsUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NyZWF0ZV9rbm93bGVkZ2VfcmVsYXRpb25zaGlwJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCflJcgWyR7ZXhlY3V0aXZlTmFtZX1dIENyZWF0ZSBLbm93bGVkZ2UgUmVsYXRpb25zaGlwYCk7XG4gICAgICAgIGNvbnN0IGNyZWF0ZVJlbFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2tub3dsZWRnZS1tYW5hZ2VyL3N0b3JlJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnY3JlYXRlX3JlbGF0aW9uc2hpcCcsIGRhdGE6IHBhcnNlZEFyZ3MgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gY3JlYXRlUmVsUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogY3JlYXRlUmVsUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGNyZWF0ZVJlbFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRfcmVsYXRlZF9rbm93bGVkZ2UnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+VuO+4jyBbJHtleGVjdXRpdmVOYW1lfV0gR2V0IFJlbGF0ZWQgS25vd2xlZGdlOiAke3BhcnNlZEFyZ3MuZW50aXR5X2lkfWApO1xuICAgICAgICBjb25zdCByZWxhdGVkUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgna25vd2xlZGdlLW1hbmFnZXIvc3RvcmUnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICdnZXRfcmVsYXRlZF9lbnRpdGllcycsIGRhdGE6IHBhcnNlZEFyZ3MgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVsYXRlZFJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlbGF0ZWRSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVsYXRlZFJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRfa25vd2xlZGdlX3N0YXR1cyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OKIFske2V4ZWN1dGl2ZU5hbWV9XSBHZXQgS25vd2xlZGdlIFN0YXR1c2ApO1xuICAgICAgICBjb25zdCBzdGF0dXNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdrbm93bGVkZ2UtbWFuYWdlci9zdG9yZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ2NoZWNrX3N0YXR1cycsIGRhdGE6IHt9IH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHN0YXR1c1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHN0YXR1c1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBzdGF0dXNSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZGVsZXRlX2tub3dsZWRnZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5eR77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBEZWxldGUgS25vd2xlZGdlOiAke3BhcnNlZEFyZ3MuZW50aXR5X2lkfWApO1xuICAgICAgICBjb25zdCBkZWxldGVLbm93bGVkZ2VSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdrbm93bGVkZ2UtbWFuYWdlci9zdG9yZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ2RlbGV0ZV9rbm93bGVkZ2UnLCBkYXRhOiBwYXJzZWRBcmdzIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGRlbGV0ZUtub3dsZWRnZVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGRlbGV0ZUtub3dsZWRnZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBkZWxldGVLbm93bGVkZ2VSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIERFUExPWU1FTlQgQVVUT01BVElPTiBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ2RlcGxveV9hcHByb3ZlZF9mdW5jdGlvbic6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5qAIFske2V4ZWN1dGl2ZU5hbWV9XSBEZXBsb3kgQXBwcm92ZWQgRnVuY3Rpb246ICR7cGFyc2VkQXJncy5wcm9wb3NhbF9pZH1gKTtcbiAgICAgICAgY29uc3QgZGVwbG95UmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZGVwbG95LWFwcHJvdmVkLWVkZ2UtZnVuY3Rpb24nLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZGVwbG95X3NpbmdsZScsXG4gICAgICAgICAgICBwcm9wb3NhbF9pZDogcGFyc2VkQXJncy5wcm9wb3NhbF9pZCxcbiAgICAgICAgICAgIGF1dG9fZGVwbG95OiBwYXJzZWRBcmdzLmF1dG9fZGVwbG95ID8/IHRydWUsXG4gICAgICAgICAgICBydW5faGVhbHRoX2NoZWNrOiBwYXJzZWRBcmdzLnJ1bl9oZWFsdGhfY2hlY2sgPz8gdHJ1ZSxcbiAgICAgICAgICAgIHZlcnNpb25fdGFnOiBwYXJzZWRBcmdzLnZlcnNpb25fdGFnXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gZGVwbG95UmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZGVwbG95UmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IGRlcGxveVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRfZGVwbG95bWVudF9zdGF0dXMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TiiBbJHtleGVjdXRpdmVOYW1lfV0gR2V0IERlcGxveW1lbnQgU3RhdHVzYCk7XG4gICAgICAgIGNvbnN0IHN0YXR1c0RlcGxveVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2RlcGxveS1hcHByb3ZlZC1lZGdlLWZ1bmN0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldF9kZXBsb3ltZW50X3N0YXR1cycsXG4gICAgICAgICAgICBwcm9wb3NhbF9pZDogcGFyc2VkQXJncy5wcm9wb3NhbF9pZFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHN0YXR1c0RlcGxveVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHN0YXR1c0RlcGxveVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBzdGF0dXNEZXBsb3lSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncm9sbGJhY2tfZGVwbG95bWVudCc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDij67vuI8gWyR7ZXhlY3V0aXZlTmFtZX1dIFJvbGxiYWNrIERlcGxveW1lbnQ6ICR7cGFyc2VkQXJncy5wcm9wb3NhbF9pZH1gKTtcbiAgICAgICAgY29uc3Qgcm9sbGJhY2tSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdkZXBsb3ktYXBwcm92ZWQtZWRnZS1mdW5jdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdyb2xsYmFjaycsXG4gICAgICAgICAgICBwcm9wb3NhbF9pZDogcGFyc2VkQXJncy5wcm9wb3NhbF9pZFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHJvbGxiYWNrUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcm9sbGJhY2tSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcm9sbGJhY2tSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncHJvY2Vzc19kZXBsb3ltZW50X3F1ZXVlJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIFByb2Nlc3MgRGVwbG95bWVudCBRdWV1ZWApO1xuICAgICAgICBjb25zdCBxdWV1ZVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2RlcGxveS1hcHByb3ZlZC1lZGdlLWZ1bmN0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ3Byb2Nlc3NfcXVldWUnLFxuICAgICAgICAgICAgYXV0b19kZXBsb3k6IHBhcnNlZEFyZ3MuYXV0b19kZXBsb3kgPz8gdHJ1ZSxcbiAgICAgICAgICAgIHJ1bl9oZWFsdGhfY2hlY2s6IHBhcnNlZEFyZ3MucnVuX2hlYWx0aF9jaGVjayA/PyB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcXVldWVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBxdWV1ZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBxdWV1ZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgLy8gU1RBRSAtIFNVSVRFIFRBU0sgQVVUT01BVElPTiBFTkdJTkUgVE9PTFNcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdjcmVhdGVfdGFza19mcm9tX3RlbXBsYXRlJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIFNUQUU6IENyZWF0ZSBUYXNrIGZyb20gVGVtcGxhdGVgKTtcbiAgICAgICAgY29uc3QgY3JlYXRlVGVtcGxhdGVSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdWl0ZS10YXNrLWF1dG9tYXRpb24tZW5naW5lJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NyZWF0ZV9mcm9tX3RlbXBsYXRlJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgLi4ucGFyc2VkQXJncyxcbiAgICAgICAgICAgICAgY3JlYXRlZF9ieV91c2VyX2lkOiBzZXNzaW9uX2NyZWRlbnRpYWxzPy51c2VyX2lkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gY3JlYXRlVGVtcGxhdGVSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjcmVhdGVUZW1wbGF0ZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBjcmVhdGVUZW1wbGF0ZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzbWFydF9hc3NpZ25fdGFzayc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn6SWIFske2V4ZWN1dGl2ZU5hbWV9XSBTVEFFOiBTbWFydCBBc3NpZ24gVGFza2ApO1xuICAgICAgICBjb25zdCBzbWFydEFzc2lnblJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N1aXRlLXRhc2stYXV0b21hdGlvbi1lbmdpbmUnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICdzbWFydF9hc3NpZ24nLCBkYXRhOiBwYXJzZWRBcmdzIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHNtYXJ0QXNzaWduUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogc21hcnRBc3NpZ25SZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogc21hcnRBc3NpZ25SZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0X2F1dG9tYXRpb25fbWV0cmljcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OKIFske2V4ZWN1dGl2ZU5hbWV9XSBTVEFFOiBHZXQgQXV0b21hdGlvbiBNZXRyaWNzYCk7XG4gICAgICAgIGNvbnN0IG1ldHJpY3NSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdWl0ZS10YXNrLWF1dG9tYXRpb24tZW5naW5lJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnZ2V0X21ldHJpY3MnLCBkYXRhOiBwYXJzZWRBcmdzIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IG1ldHJpY3NSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBtZXRyaWNzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IG1ldHJpY3NSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAndXBkYXRlX3Rhc2tfY2hlY2tsaXN0JzpcbiAgICAgICAgY29uc29sZS5sb2coYOKchSBbJHtleGVjdXRpdmVOYW1lfV0gU1RBRSBQaGFzZSAyOiBVcGRhdGUgQ2hlY2tsaXN0YCk7XG4gICAgICAgIGNvbnN0IGNoZWNrbGlzdFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N1aXRlLXRhc2stYXV0b21hdGlvbi1lbmdpbmUnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICd1cGRhdGVfY2hlY2tsaXN0X2l0ZW0nLCBkYXRhOiBwYXJzZWRBcmdzIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IGNoZWNrbGlzdFJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGNoZWNrbGlzdFJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBjaGVja2xpc3RSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAncmVzb2x2ZV9ibG9ja2VkX3Rhc2snOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+UkyBbJHtleGVjdXRpdmVOYW1lfV0gU1RBRSBQaGFzZSAyOiBSZXNvbHZlIEJsb2NrZWQgVGFza2ApO1xuICAgICAgICBjb25zdCByZXNvbHZlUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnc3VpdGUtdGFzay1hdXRvbWF0aW9uLWVuZ2luZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ2F1dG9fcmVzb2x2ZV9ibG9ja2VycycsIGRhdGE6IHsgdGFza19pZDogcGFyc2VkQXJncy50YXNrX2lkIH0gfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gcmVzb2x2ZVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlc29sdmVSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzb2x2ZVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdnZXRfc3RhZV9yZWNvbW1lbmRhdGlvbnMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+SoSBbJHtleGVjdXRpdmVOYW1lfV0gU1RBRSBQaGFzZSAzOiBHZXQgUmVjb21tZW5kYXRpb25zYCk7XG4gICAgICAgIGNvbnN0IHJlY3NSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdWl0ZS10YXNrLWF1dG9tYXRpb24tZW5naW5lJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnZ2V0X29wdGltaXphdGlvbl9yZWNvbW1lbmRhdGlvbnMnLCBkYXRhOiB7fSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByZWNzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVjc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZWNzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FkdmFuY2VfdGFza19zdGFnZSc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDij6kgWyR7ZXhlY3V0aXZlTmFtZX1dIFNUQUUgUGhhc2UgMjogQWR2YW5jZSBUYXNrIFN0YWdlYCk7XG4gICAgICAgIGNvbnN0IGFkdmFuY2VSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzdWl0ZS10YXNrLWF1dG9tYXRpb24tZW5naW5lJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnYWR2YW5jZV90YXNrX3N0YWdlJywgZGF0YTogcGFyc2VkQXJncyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBhZHZhbmNlUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYWR2YW5jZVJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBhZHZhbmNlUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBWU0NPIFdPUktTUEFDRSBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ3ZzY29fbWFuYWdlX2pvYnMnOlxuICAgICAgICBjb25zb2xlLmxvZyhg8J+TuCBbJHtleGVjdXRpdmVOYW1lfV0gVlNDTyBNYW5hZ2UgSm9iczogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgICAgY29uc3QgdnNjb0pvYnNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB2c2NvSm9ic1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHZzY29Kb2JzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHZzY29Kb2JzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3ZzY29fbWFuYWdlX2NvbnRhY3RzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4cgWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIENvbnRhY3RzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgICBjb25zdCB2c2NvQ29udGFjdHNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB2c2NvQ29udGFjdHNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2c2NvQ29udGFjdHNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdnNjb0NvbnRhY3RzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3ZzY29fbWFuYWdlX2V2ZW50cyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OFIFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBFdmVudHM6ICR7cGFyc2VkQXJncy5hY3Rpb259YCk7XG4gICAgICAgIGNvbnN0IHZzY29FdmVudHNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB2c2NvRXZlbnRzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogdnNjb0V2ZW50c1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB2c2NvRXZlbnRzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3ZzY29fYW5hbHl0aWNzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4ogWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gQW5hbHl0aWNzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgICBjb25zdCB2c2NvQW5hbHl0aWNzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdnNjb0FuYWx5dGljc1Jlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHZzY29BbmFseXRpY3NSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdnNjb0FuYWx5dGljc1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2c2NvX21hbmFnZV9wcm9kdWN0cyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5KwIFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBQcm9kdWN0czogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgICAgY29uc3QgdnNjb1Byb2R1Y3RzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdnNjb1Byb2R1Y3RzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogdnNjb1Byb2R1Y3RzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHZzY29Qcm9kdWN0c1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgLy8gRUNPU1lTVEVNIERJU0NPVkVSWSBUT09MU1xuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ3NlYXJjaF9lZGdlX2Z1bmN0aW9ucyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5SNIFske2V4ZWN1dGl2ZU5hbWV9XSBTZWFyY2ggRWRnZSBGdW5jdGlvbnM6ICR7cGFyc2VkQXJncy5xdWVyeX1gKTtcbiAgICAgICAgY29uc3Qgc2VhcmNoRnVuY1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3NlYXJjaC1lZGdlLWZ1bmN0aW9ucycsIHtcbiAgICAgICAgICBib2R5OiBwYXJzZWRBcmdzXG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBzZWFyY2hGdW5jUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogc2VhcmNoRnVuY1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBzZWFyY2hGdW5jUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2xpc3RfYXZhaWxhYmxlX2Z1bmN0aW9ucyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OLIFske2V4ZWN1dGl2ZU5hbWV9XSBMaXN0IEF2YWlsYWJsZSBGdW5jdGlvbnNgKTtcbiAgICAgICAgY29uc3QgbGlzdEZ1bmNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdsaXN0LWF2YWlsYWJsZS1mdW5jdGlvbnMnLCB7XG4gICAgICAgICAgYm9keTogcGFyc2VkQXJnc1xuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gbGlzdEZ1bmNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBsaXN0RnVuY1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBsaXN0RnVuY1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2c2NvX21hbmFnZV93b3Jrc2hlZXRzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIFdvcmtzaGVldHM6ICR7cGFyc2VkQXJncy5hY3Rpb259YCk7XG4gICAgICAgIGNvbnN0IHZzY29Xb3Jrc2hlZXRzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdnNjb1dvcmtzaGVldHNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2c2NvV29ya3NoZWV0c1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB2c2NvV29ya3NoZWV0c1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2c2NvX21hbmFnZV9ub3Rlcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OdIFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBOb3RlczogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgICAgY29uc3QgdnNjb05vdGVzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdnNjb05vdGVzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogdnNjb05vdGVzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHZzY29Ob3Rlc1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2c2NvX21hbmFnZV9maW5hbmNpYWxzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkrUgWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIEZpbmFuY2lhbHM6ICR7cGFyc2VkQXJncy5hY3Rpb259YCk7XG4gICAgICAgIGNvbnN0IHZzY29GaW5hbmNpYWxzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gdnNjb0ZpbmFuY2lhbHNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2c2NvRmluYW5jaWFsc1Jlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiB2c2NvRmluYW5jaWFsc1Jlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICd2c2NvX21hbmFnZV9zZXR0aW5ncyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDimpnvuI8gWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIFNldHRpbmdzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgICBjb25zdCB2c2NvU2V0dGluZ3NSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB2c2NvU2V0dGluZ3NSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2c2NvU2V0dGluZ3NSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdnNjb1NldHRpbmdzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3ZzY29fbWFuYWdlX3VzZXJzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCfkaUgWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIFVzZXJzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgICBjb25zdCB2c2NvVXNlcnNSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSB2c2NvVXNlcnNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2c2NvVXNlcnNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdnNjb1VzZXJzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBHSVRIVUIgQ09OVFJJQlVUSU9OIFNZTkMgVE9PTFNcbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICBjYXNlICdzeW5jX2dpdGh1Yl9jb250cmlidXRpb25zJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCflIQgWyR7ZXhlY3V0aXZlTmFtZX1dIFN5bmMgR2l0SHViIENvbnRyaWJ1dGlvbnNgKTtcbiAgICAgICAgY29uc3Qgc3luY0NvbnRyaWJSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzeW5jLWdpdGh1Yi1jb250cmlidXRpb25zJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHJlcG86IHBhcnNlZEFyZ3MucmVwbyB8fCAnWE1SVC1FY29zeXN0ZW0nLFxuICAgICAgICAgICAgb3duZXI6IHBhcnNlZEFyZ3Mub3duZXIgfHwgJ0RldkdydUdvbGQnLFxuICAgICAgICAgICAgbWF4X2NvbW1pdHM6IHBhcnNlZEFyZ3MubWF4X2NvbW1pdHMgfHwgMTAwXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmVzdWx0ID0gc3luY0NvbnRyaWJSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBzeW5jQ29udHJpYlJlc3VsdC5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgICA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBzeW5jQ29udHJpYlJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG5cbiAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IEVDT1NZU1RFTSBDT09SRElOQVRJT04gVE9PTFMgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgIGNhc2UgJ3RyaWdnZXJfZWNvc3lzdGVtX2Nvb3JkaW5hdGlvbic6IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBjeWNsZVR5cGUgPSBhcmdzLmN5Y2xlX3R5cGUgfHwgJ3N0YW5kYXJkJztcbiAgICAgICAgICBjb25zb2xlLmxvZyhg8J+agCBUcmlnZ2VyaW5nICR7Y3ljbGVUeXBlfSBlY29zeXN0ZW0gY29vcmRpbmF0aW9uLi4uYCk7XG5cbiAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL3htcnQtZWNvc3lzdGVtLnZlcmNlbC5hcHAvYXBpL3RpY2snLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBjeWNsZV90eXBlOiBjeWNsZVR5cGUgfSksXG4gICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMTIwMDAwKSAvLyAyIG1pbnV0ZSB0aW1lb3V0XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgZXJyb3I6IGBDb29yZGluYXRpb24gdHJpZ2dlciBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBgRWNvc3lzdGVtIGNvb3JkaW5hdGlvbiBjeWNsZSAoJHtjeWNsZVR5cGV9KSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5YCxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZGF0YS50aW1lc3RhbXAsXG4gICAgICAgICAgICBhZ2VudHNfZGlzY292ZXJlZDogZGF0YS5hZ2VudHM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgICAgaGVhbHRoX2NoZWNrc19wZXJmb3JtZWQ6IGRhdGEuaGVhbHRoX2NoZWNrcz8ubGVuZ3RoIHx8IDAsXG4gICAgICAgICAgICBjb29yZGluYXRpb25fc3VtbWFyeTogZGF0YS5zdW1tYXJ5IHx8ICdDb29yZGluYXRpb24gY3ljbGUgY29tcGxldGVkJyxcbiAgICAgICAgICAgIGRldGFpbHM6IGRhdGFcbiAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vjb3N5c3RlbSBjb29yZGluYXRpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIHRyaWdnZXIgY29vcmRpbmF0aW9uOiAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2FzZSAnZ2V0X2Vjb3N5c3RlbV9zdGF0dXMnOiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ/Cfk4ogRmV0Y2hpbmcgZWNvc3lzdGVtIHN0YXR1cy4uLicpO1xuXG4gICAgICAgICAgLy8gUXVlcnkgYWdlbnRzIGVuZHBvaW50XG4gICAgICAgICAgY29uc3QgYWdlbnRzUmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly94bXJ0LWVjb3N5c3RlbS52ZXJjZWwuYXBwL2FwaS9hZ2VudHMnLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMzAwMDApXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICAvLyBRdWVyeSBzeXN0ZW0gaW5mb1xuICAgICAgICAgIGNvbnN0IHN5c3RlbVJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8veG1ydC1lY29zeXN0ZW0udmVyY2VsLmFwcC9hcGkvaW5kZXgnLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMzAwMDApXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zdCBhZ2VudHNEYXRhID0gYWdlbnRzUmVzcG9uc2Uub2sgPyBhd2FpdCBhZ2VudHNSZXNwb25zZS5qc29uKCkgOiB7IGFnZW50czogW10gfTtcbiAgICAgICAgICBjb25zdCBzeXN0ZW1EYXRhID0gc3lzdGVtUmVzcG9uc2Uub2sgPyBhd2FpdCBzeXN0ZW1SZXNwb25zZS5qc29uKCkgOiB7IHN0YXR1czogJ3Vua25vd24nIH07XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGVjb3N5c3RlbV9oZWFsdGg6IHN5c3RlbURhdGEuc3RhdHVzIHx8ICdoZWFsdGh5JyxcbiAgICAgICAgICAgIHZlcnNpb246IHN5c3RlbURhdGEudmVyc2lvbiB8fCAndW5rbm93bicsXG4gICAgICAgICAgICB0b3RhbF9hZ2VudHM6IGFnZW50c0RhdGEuYWdlbnRzPy5sZW5ndGggfHwgMCxcbiAgICAgICAgICAgIGFnZW50czogYWdlbnRzRGF0YS5hZ2VudHMgfHwgW10sXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIGRlcGxveW1lbnRfdXJsOiAnaHR0cHM6Ly94bXJ0LWVjb3N5c3RlbS52ZXJjZWwuYXBwJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBFY29zeXN0ZW0gc3RhdHVzOiAke2FnZW50c0RhdGEuYWdlbnRzPy5sZW5ndGggfHwgMH0gYWdlbnRzIGRpc2NvdmVyZWRgXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdHZXQgZWNvc3lzdGVtIHN0YXR1cyBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZ2V0IGVjb3N5c3RlbSBzdGF0dXM6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjYXNlICdxdWVyeV9lY29zeXN0ZW1fYWdlbnRzJzoge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGZpbHRlckJ5ID0gYXJncy5maWx0ZXJfYnkgfHwgJ2FsbCc7XG4gICAgICAgICAgY29uc29sZS5sb2coYPCflI0gUXVlcnlpbmcgZWNvc3lzdGVtIGFnZW50cyAoZmlsdGVyOiAke2ZpbHRlckJ5fSkuLi5gKTtcblxuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8veG1ydC1lY29zeXN0ZW0udmVyY2VsLmFwcC9hcGkvYWdlbnRzJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDMwMDAwKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgIGVycm9yOiBgQWdlbnQgcXVlcnkgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c31gXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgbGV0IGFnZW50cyA9IGRhdGEuYWdlbnRzIHx8IFtdO1xuXG4gICAgICAgICAgLy8gQXBwbHkgZmlsdGVyc1xuICAgICAgICAgIGlmIChmaWx0ZXJCeSA9PT0gJ2FjdGl2ZScpIHtcbiAgICAgICAgICAgIGFnZW50cyA9IGFnZW50cy5maWx0ZXIoYSA9PiBhLnN0YXR1cyA9PT0gJ2FjdGl2ZScgfHwgYS5zdGF0dXMgPT09ICdvbmxpbmUnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGZpbHRlckJ5ID09PSAnc3VwYWJhc2UnKSB7XG4gICAgICAgICAgICBhZ2VudHMgPSBhZ2VudHMuZmlsdGVyKGEgPT4gYS5zb3VyY2UgPT09ICd4bXJ0Y291bmNpbF9zdXBhYmFzZScgfHwgYS50eXBlID09PSAnc3VwYWJhc2VfZWRnZV9mdW5jdGlvbicpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZmlsdGVyQnkgPT09ICd2ZXJjZWwnKSB7XG4gICAgICAgICAgICBhZ2VudHMgPSBhZ2VudHMuZmlsdGVyKGEgPT4gYS50eXBlID09PSAndmVyY2VsX2FwaScgfHwgYS5zb3VyY2U/LmluY2x1ZGVzKCd2ZXJjZWwnKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmaWx0ZXJCeSA9PT0gJ3ByaW9yaXR5Jykge1xuICAgICAgICAgICAgYWdlbnRzID0gYWdlbnRzLnNvcnQoKGEsIGIpID0+IChhLnByaW9yaXR5IHx8IDUpIC0gKGIucHJpb3JpdHkgfHwgNSkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgdG90YWxfYWdlbnRzOiBhZ2VudHMubGVuZ3RoLFxuICAgICAgICAgICAgZmlsdGVyX2FwcGxpZWQ6IGZpbHRlckJ5LFxuICAgICAgICAgICAgYWdlbnRzOiBhZ2VudHMsXG4gICAgICAgICAgICBhZ2VudF9zdW1tYXJ5OiBhZ2VudHMubWFwKGEgPT4gKHtcbiAgICAgICAgICAgICAgbmFtZTogYS5uYW1lIHx8IGEuZGlzcGxheV9uYW1lLFxuICAgICAgICAgICAgICB0eXBlOiBhLnR5cGUsXG4gICAgICAgICAgICAgIHN0YXR1czogYS5zdGF0dXMsXG4gICAgICAgICAgICAgIHNvdXJjZTogYS5zb3VyY2VcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBGb3VuZCAke2FnZW50cy5sZW5ndGh9IGFnZW50cyBtYXRjaGluZyBmaWx0ZXI6ICR7ZmlsdGVyQnl9YFxuICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignUXVlcnkgZWNvc3lzdGVtIGFnZW50cyBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gcXVlcnkgYWdlbnRzOiAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEFOQUxZVElDUyAmIExPRyBNQU5BR0VNRU5UIFRPT0xTXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgY2FzZSAnc3luY19mdW5jdGlvbl9sb2dzJzpcbiAgICAgICAgY29uc29sZS5sb2coYPCflIQgWyR7ZXhlY3V0aXZlTmFtZX1dIFN5bmMgZnVuY3Rpb24gbG9ncyAtICR7cGFyc2VkQXJncy5ob3Vyc19iYWNrIHx8IDF9aCBiYWNrYCk7XG4gICAgICAgIGNvbnN0IHN5bmNMb2dSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdzeW5jLWZ1bmN0aW9uLWxvZ3MnLCB7XG4gICAgICAgICAgYm9keTogeyBob3Vyc19iYWNrOiBNYXRoLm1pbihwYXJzZWRBcmdzLmhvdXJzX2JhY2sgfHwgMSwgMjQpIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHN5bmNMb2dSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBzeW5jTG9nUmVzdWx0LmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHN5bmNMb2dSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnZ2V0X2Z1bmN0aW9uX3VzYWdlX2FuYWx5dGljcyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn5OKIFske2V4ZWN1dGl2ZU5hbWV9XSBHZXQgZnVuY3Rpb24gdXNhZ2UgYW5hbHl0aWNzYCk7XG4gICAgICAgIGNvbnN0IHVzYWdlQW5hbHl0aWNzUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZnVuY3Rpb24tdXNhZ2UtYW5hbHl0aWNzJywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGZ1bmN0aW9uX25hbWU6IHBhcnNlZEFyZ3MuZnVuY3Rpb25fbmFtZSxcbiAgICAgICAgICAgIHRpbWVfd2luZG93X2hvdXJzOiBwYXJzZWRBcmdzLnRpbWVfd2luZG93X2hvdXJzIHx8IDI0LFxuICAgICAgICAgICAgZ3JvdXBfYnk6IHBhcnNlZEFyZ3MuZ3JvdXBfYnkgfHwgJ2Z1bmN0aW9uJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdCA9IHVzYWdlQW5hbHl0aWNzUmVzdWx0LmVycm9yXG4gICAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogdXNhZ2VBbmFseXRpY3NSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogdXNhZ2VBbmFseXRpY3NSZXN1bHQuZGF0YSB9O1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY2hlY2tfc3lzdGVtX3N0YXR1cyc6XG4gICAgICAgIGNvbnNvbGUubG9nKGDwn4+lIFske2V4ZWN1dGl2ZU5hbWV9XSBDaGVjayBzeXN0ZW0gc3RhdHVzYCk7XG4gICAgICAgIGNvbnN0IHN5c3RlbVN0YXR1c1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3N5c3RlbS1zdGF0dXMnLCB7IGJvZHk6IHt9IH0pO1xuICAgICAgICByZXN1bHQgPSBzeXN0ZW1TdGF0dXNSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBzeXN0ZW1TdGF0dXNSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogc3lzdGVtU3RhdHVzUmVzdWx0LmRhdGEgfTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3F1ZXJ5X2Nyb25fcmVnaXN0cnknOlxuICAgICAgICBjb25zb2xlLmxvZyhg4o+wIFske2V4ZWN1dGl2ZU5hbWV9XSBRdWVyeSBjcm9uIHJlZ2lzdHJ5OiAke3BhcnNlZEFyZ3M/LmFjdGlvbiB8fCAnbGlzdF9hbGwnfWApO1xuICAgICAgICBjb25zdCBjcm9uUmVnaXN0cnlSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnZXQtY3Jvbi1yZWdpc3RyeScsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246IHBhcnNlZEFyZ3M/LmFjdGlvbiB8fCAnbGlzdF9hbGwnLFxuICAgICAgICAgICAgcGxhdGZvcm06IHBhcnNlZEFyZ3M/LnBsYXRmb3JtLFxuICAgICAgICAgICAgZnVuY3Rpb25fbmFtZTogcGFyc2VkQXJncz8uZnVuY3Rpb25fbmFtZSxcbiAgICAgICAgICAgIGpvYl9uYW1lOiBwYXJzZWRBcmdzPy5qb2JfbmFtZSxcbiAgICAgICAgICAgIGluY2x1ZGVfaW5hY3RpdmU6IHBhcnNlZEFyZ3M/LmluY2x1ZGVfaW5hY3RpdmUsXG4gICAgICAgICAgICB0aW1lX3dpbmRvd19ob3VyczogcGFyc2VkQXJncz8udGltZV93aW5kb3dfaG91cnNcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSBjcm9uUmVnaXN0cnlSZXN1bHQuZXJyb3JcbiAgICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBjcm9uUmVnaXN0cnlSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgICAgOiB7IHN1Y2Nlc3M6IHRydWUsIC4uLmNyb25SZWdpc3RyeVJlc3VsdC5kYXRhIH07XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgLy8g8J+WvO+4j/CfjqwgTVVBUEkgTUVESUEgR0VORVJBVElPTiAoSW1hZ2UgKyBWaWRlbyB2aWEgTXVBUEkpXG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgY2FzZSAndmVydGV4X2dlbmVyYXRlX2ltYWdlJzoge1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+WvO+4jyBbJHtleGVjdXRpdmVOYW1lfV0gTXVBUEkgR2VuZXJhdGUgSW1hZ2U6ICR7cGFyc2VkQXJncy5wcm9tcHQ/LnNsaWNlKDAsIDYwKX0uLi5gKTtcbiAgICAgICAgY29uc3QgaW1nUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndmVydGV4LWFpLWNoYXQnLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGVfaW1hZ2UnLFxuICAgICAgICAgICAgcHJvbXB0OiBwYXJzZWRBcmdzLnByb21wdCxcbiAgICAgICAgICAgIGltYWdlX21vZGVsOiBwYXJzZWRBcmdzLm1vZGVsIHx8ICdmbHV4LWRldi1pbWFnZScsXG4gICAgICAgICAgICBhc3BlY3RfcmF0aW86IHBhcnNlZEFyZ3MuYXNwZWN0X3JhdGlvIHx8ICcxOjEnXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGltZ1Jlc3VsdC5lcnJvcikge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBpbWdSZXN1bHQuZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGQgPSBpbWdSZXN1bHQuZGF0YT8uZGF0YSB8fCBpbWdSZXN1bHQuZGF0YTtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgcHVibGljVXJsOiBkPy5wdWJsaWNVcmwgfHwgZD8ucmVzdWx0Py5wdWJsaWNVcmwgfHwgbnVsbCxcbiAgICAgICAgICAgIG1pbWVUeXBlOiBkPy5taW1lVHlwZSB8fCAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIG1vZGVsOiBwYXJzZWRBcmdzLm1vZGVsIHx8ICdmbHV4LWRldi1pbWFnZScsXG4gICAgICAgICAgICBwcm9tcHQ6IHBhcnNlZEFyZ3MucHJvbXB0LFxuICAgICAgICAgICAgcmVzdWx0OiBkXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSAndmVydGV4X2dlbmVyYXRlX3ZpZGVvJzoge1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+OrCBbJHtleGVjdXRpdmVOYW1lfV0gTXVBUEkgR2VuZXJhdGUgVmlkZW86ICR7cGFyc2VkQXJncy5wcm9tcHQ/LnNsaWNlKDAsIDYwKX0uLi5gKTtcbiAgICAgICAgY29uc3QgdmlkUmVzdWx0ID0gYXdhaXQgc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndmVydGV4LWFpLWNoYXQnLCB7XG4gICAgICAgICAgYm9keToge1xuICAgICAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGVfdmlkZW8nLFxuICAgICAgICAgICAgcHJvbXB0OiBwYXJzZWRBcmdzLnByb21wdCxcbiAgICAgICAgICAgIHZpZGVvX21vZGVsOiBwYXJzZWRBcmdzLm1vZGVsIHx8ICd2ZW8zLWZhc3QtdGV4dC10by12aWRlbycsXG4gICAgICAgICAgICBkdXJhdGlvbl9zZWNvbmRzOiBwYXJzZWRBcmdzLmR1cmF0aW9uX3NlY29uZHMgfHwgNSxcbiAgICAgICAgICAgIGFzcGVjdF9yYXRpbzogcGFyc2VkQXJncy5hc3BlY3RfcmF0aW8gfHwgJzE2OjknXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHZpZFJlc3VsdC5lcnJvcikge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiB2aWRSZXN1bHQuZXJyb3IubWVzc2FnZSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGQgPSB2aWRSZXN1bHQuZGF0YT8uZGF0YSB8fCB2aWRSZXN1bHQuZGF0YTtcbiAgICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgb3BlcmF0aW9uX25hbWU6IGQ/Lm9wZXJhdGlvbl9uYW1lIHx8IGQ/LnJlc3VsdD8ub3BlcmF0aW9uX25hbWUgfHwgbnVsbCxcbiAgICAgICAgICAgIHN0YXR1czogZD8uc3RhdHVzIHx8IGQ/LnJlc3VsdD8uc3RhdHVzIHx8ICdwZW5kaW5nJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdWaWRlbyBnZW5lcmF0aW9uIHN0YXJ0ZWQgdmlhIE11QVBJLiBVc2UgdmVydGV4X2NoZWNrX3ZpZGVvX3N0YXR1cyB3aXRoIHRoZSBvcGVyYXRpb25fbmFtZSB0byBwb2xsIGZvciBjb21wbGV0aW9uLicsXG4gICAgICAgICAgICByZXN1bHQ6IGRcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlICd2ZXJ0ZXhfY2hlY2tfdmlkZW9fc3RhdHVzJzoge1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+Tve+4jyBbJHtleGVjdXRpdmVOYW1lfV0gQ2hlY2sgVmlkZW8gU3RhdHVzOiAke3BhcnNlZEFyZ3Mub3BlcmF0aW9uX25hbWV9YCk7XG4gICAgICAgIGNvbnN0IHN0YXR1c1Jlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZlcnRleC1haS1jaGF0Jywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NoZWNrX3ZpZGVvX3N0YXR1cycsXG4gICAgICAgICAgICBvcGVyYXRpb25fbmFtZTogcGFyc2VkQXJncy5vcGVyYXRpb25fbmFtZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChzdGF0dXNSZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogc3RhdHVzUmVzdWx0LmVycm9yLm1lc3NhZ2UgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkID0gc3RhdHVzUmVzdWx0LmRhdGE/LmRhdGE/LnJlc3VsdCB8fCBzdGF0dXNSZXN1bHQuZGF0YT8uZGF0YSB8fCBzdGF0dXNSZXN1bHQuZGF0YTtcbiAgICAgICAgICBjb25zdCB2aWRlb1VybHM6IHN0cmluZ1tdID0gZD8udmlkZW9VcmxzIHx8IFtdO1xuICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBzdGF0dXM6IGQ/LnN0YXR1cyB8fCAncGVuZGluZycsXG4gICAgICAgICAgICBkb25lOiBkPy5zdGF0dXMgPT09ICdkb25lJyxcbiAgICAgICAgICAgIHZpZGVvVXJscyxcbiAgICAgICAgICAgIHZpZGVvVXJsOiB2aWRlb1VybHNbMF0gfHwgbnVsbCxcbiAgICAgICAgICAgIG9wZXJhdGlvbl9uYW1lOiBwYXJzZWRBcmdzLm9wZXJhdGlvbl9uYW1lLFxuICAgICAgICAgICAgcmVzdWx0OiBkXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIPCflJcgT1BFTkNMQVcgUkVMQVkgVE9PTFMg4oCUIEJpZGlyZWN0aW9uYWwgY29tbXVuaWNhdGlvbiB3aXRoIGxvY2FsIE9wZW5DbGF3XG4gICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgY2FzZSAnc2VuZF90b19vcGVuY2xhdyc6IHtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk6EgWyR7ZXhlY3V0aXZlTmFtZX1dIFNlbmRpbmcgbWVzc2FnZSB0byBsb2NhbCBPcGVuQ2xhdyBhZ2VudGApO1xuICAgICAgICBjb25zdCByZWxheVRhZyA9IHBhcnNlZEFyZ3MucmVsYXlfdGFnIHx8IGBlbGl6YS1yZWxheS0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgOCl9YDtcbiAgICAgICAgY29uc3QgcmVsYXlSZXN1bHQgPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdvcGVuY2xhdy1yZWxheScsIHtcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBhY3Rpb246ICdzZW5kJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHBhcnNlZEFyZ3MubWVzc2FnZSxcbiAgICAgICAgICAgIHJlbGF5X3RhZzogcmVsYXlUYWcsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICBzZW50X2J5OiBleGVjdXRpdmVOYW1lLFxuICAgICAgICAgICAgICAuLi4ocGFyc2VkQXJncy5tZXRhZGF0YSB8fCB7fSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByZWxheVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBvcGVuY2xhdy1yZWxheSBlcnJvcjogJHtyZWxheVJlc3VsdC5lcnJvci5tZXNzYWdlfWAgfVxuICAgICAgICAgIDoge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIHJlbGF5X3RhZzogcmVsYXlUYWcsXG4gICAgICAgICAgICBtZXNzYWdlX2lkOiByZWxheVJlc3VsdC5kYXRhPy5tZXNzYWdlX2lkLFxuICAgICAgICAgICAgc3RhdHVzOiAncXVldWVkJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIHF1ZXVlZCBmb3IgT3BlbkNsYXcuIENhbGwgY2hlY2tfb3BlbmNsYXdfcmVwbHkgd2l0aCB0aGUgcmVsYXlfdGFnIHRvIHJldHJpZXZlIHRoZSByZXNwb25zZS4nLFxuICAgICAgICAgICAgcmVzdWx0OiByZWxheVJlc3VsdC5kYXRhXG4gICAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgJ2NoZWNrX29wZW5jbGF3X3JlcGx5Jzoge1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+TrCBbJHtleGVjdXRpdmVOYW1lfV0gQ2hlY2tpbmcgT3BlbkNsYXcgcmVwbHkgZm9yIHJlbGF5X3RhZzogJHtwYXJzZWRBcmdzLnJlbGF5X3RhZ31gKTtcbiAgICAgICAgaWYgKCFwYXJzZWRBcmdzLnJlbGF5X3RhZykge1xuICAgICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnY2hlY2tfb3BlbmNsYXdfcmVwbHkgcmVxdWlyZXMgcmVsYXlfdGFnLiBVc2UgdGhlIHJlbGF5X3RhZyByZXR1cm5lZCBieSBzZW5kX3RvX29wZW5jbGF3LicgfTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXBseVJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ29wZW5jbGF3LXJlbGF5Jywge1xuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2NoZWNrX3JlcGx5JyxcbiAgICAgICAgICAgIHJlbGF5X3RhZzogcGFyc2VkQXJncy5yZWxheV90YWdcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQgPSByZXBseVJlc3VsdC5lcnJvclxuICAgICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBvcGVuY2xhdy1yZWxheSBjaGVjayBlcnJvcjogJHtyZXBseVJlc3VsdC5lcnJvci5tZXNzYWdlfWAgfVxuICAgICAgICAgIDoge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGhhc19yZXBseTogISFyZXBseVJlc3VsdC5kYXRhPy5yZXBseSxcbiAgICAgICAgICAgIHJlcGx5OiByZXBseVJlc3VsdC5kYXRhPy5yZXBseSB8fCBudWxsLFxuICAgICAgICAgICAgcmVsYXlfdGFnOiBwYXJzZWRBcmdzLnJlbGF5X3RhZyxcbiAgICAgICAgICAgIHN0YXR1czogcmVwbHlSZXN1bHQuZGF0YT8ucmVwbHkgPyAncmVwbGllZCcgOiAncGVuZGluZycsXG4gICAgICAgICAgICByZXN1bHQ6IHJlcGx5UmVzdWx0LmRhdGFcbiAgICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS53YXJuKGDimqDvuI8gWyR7ZXhlY3V0aXZlTmFtZX1dIFVua25vd24gdG9vbDogJHtuYW1lfWApO1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGBVbmtub3duIHRvb2w6ICR7bmFtZX0uIEF2YWlsYWJsZSB0b29scyBpbmNsdWRlOiBpbnZva2VfZWRnZV9mdW5jdGlvbiwgZXhlY3V0ZV9weXRob24sIGNyZWF0ZUdpdEh1Yklzc3VlLCBsaXN0X2FnZW50cywgYXNzaWduX3Rhc2ssIGNoZWNrX3N5c3RlbV9zdGF0dXMsIGdldF90b29sX3VzYWdlX2FuYWx5dGljcywgc3RvcmVfa25vd2xlZGdlLCBzZWFyY2hfa25vd2xlZGdlLCBkZXBsb3lfYXBwcm92ZWRfZnVuY3Rpb24sIGNyZWF0ZV90YXNrX2Zyb21fdGVtcGxhdGUsIHNtYXJ0X2Fzc2lnbl90YXNrLCBnZXRfYXV0b21hdGlvbl9tZXRyaWNzLCB1cGRhdGVfdGFza19jaGVja2xpc3QsIHJlc29sdmVfYmxvY2tlZF90YXNrLCBnZXRfc3RhZV9yZWNvbW1lbmRhdGlvbnMsIGFkdmFuY2VfdGFza19zdGFnZSwgc3luY19naXRodWJfY29udHJpYnV0aW9ucywgc3luY19mdW5jdGlvbl9sb2dzLCBnZXRfZnVuY3Rpb25fdXNhZ2VfYW5hbHl0aWNzLCBxdWVyeV9jcm9uX3JlZ2lzdHJ5LCB2ZXJ0ZXhfZ2VuZXJhdGVfaW1hZ2UsIHZlcnRleF9nZW5lcmF0ZV92aWRlbywgdmVydGV4X2NoZWNrX3ZpZGVvX3N0YXR1cywgc2VuZF90b19vcGVuY2xhdywgY2hlY2tfb3BlbmNsYXdfcmVwbHksIGFuZCBtb3JlLmBcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIGNvbnN0IGV4ZWN1dGlvblRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgLy8gQWRkIGxlYXJuaW5nIHBvaW50IGlmIHRoZXJlIHdhcyBhbiBlcnJvclxuICAgIGlmIChyZXN1bHQuZXJyb3IgJiYgIXJlc3VsdC5sZWFybmluZ19wb2ludCkge1xuICAgICAgcmVzdWx0LmxlYXJuaW5nX3BvaW50ID0gYW5hbHl6ZUxlYXJuaW5nRnJvbUVycm9yKG5hbWUsIHJlc3VsdC5lcnJvciwgcGFyc2VkQXJncyk7XG4gICAgfVxuXG4gICAgLy8gTG9nIGZ1bmN0aW9uIHVzYWdlXG4gICAgYXdhaXQgbG9nRnVuY3Rpb25Vc2FnZShzdXBhYmFzZSwge1xuICAgICAgZnVuY3Rpb25fbmFtZTogbmFtZSxcbiAgICAgIGV4ZWN1dGl2ZV9uYW1lOiBleGVjdXRpdmVOYW1lLFxuICAgICAgaW52b2tlZF9ieTogJ3Rvb2xfY2FsbCcsXG4gICAgICBzdWNjZXNzOiByZXN1bHQuc3VjY2VzcyAhPT0gZmFsc2UsXG4gICAgICBleGVjdXRpb25fdGltZV9tczogZXhlY3V0aW9uVGltZSxcbiAgICAgIHBhcmFtZXRlcnM6IHBhcnNlZEFyZ3MsXG4gICAgICByZXN1bHRfc3VtbWFyeTogcmVzdWx0LnN1Y2Nlc3MgPyAnVG9vbCBleGVjdXRlZCBzdWNjZXNzZnVsbHknIDogcmVzdWx0LmVycm9yLFxuICAgICAgbWV0YWRhdGE6IHJlc3VsdC5sZWFybmluZ19wb2ludCA/IHsgbGVhcm5pbmdfcG9pbnQ6IHJlc3VsdC5sZWFybmluZ19wb2ludCB9IDogdW5kZWZpbmVkXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3QgZXhlY3V0aW9uVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVG9vbCBleGVjdXRpb24gZmFpbGVkJztcbiAgICBjb25zdCBsZWFybmluZ1BvaW50ID0gYW5hbHl6ZUxlYXJuaW5nRnJvbUVycm9yKG5hbWUsIGVycm9yTWVzc2FnZSwgcGFyc2VkQXJncyk7XG5cbiAgICBjb25zb2xlLmVycm9yKGDinYwgWyR7ZXhlY3V0aXZlTmFtZX1dIFRvb2wgZXhlY3V0aW9uIGVycm9yIGZvciAke25hbWV9OmAsIGVycm9yKTtcblxuICAgIC8vIExvZyBmYWlsZWQgZXhlY3V0aW9uXG4gICAgYXdhaXQgbG9nRnVuY3Rpb25Vc2FnZShzdXBhYmFzZSwge1xuICAgICAgZnVuY3Rpb25fbmFtZTogbmFtZSxcbiAgICAgIGV4ZWN1dGl2ZV9uYW1lOiBleGVjdXRpdmVOYW1lLFxuICAgICAgaW52b2tlZF9ieTogJ3Rvb2xfY2FsbCcsXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGV4ZWN1dGlvbl90aW1lX21zOiBleGVjdXRpb25UaW1lLFxuICAgICAgcGFyYW1ldGVyczogcGFyc2VkQXJncyxcbiAgICAgIGVycm9yX21lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgIG1ldGFkYXRhOiB7IGxlYXJuaW5nX3BvaW50OiBsZWFybmluZ1BvaW50IH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvck1lc3NhZ2UsXG4gICAgICBsZWFybmluZ19wb2ludDogbGVhcm5pbmdQb2ludFxuICAgIH07XG4gIH1cbn1cblxuLy8gQWRkIFZTQ08gdG9vbCBoYW5kbGVycyB0byB0aGUgc3dpdGNoIHN0YXRlbWVudCBieSBleHBvcnRpbmcgYSBoZWxwZXJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRWc2NvVG9vbEhhbmRsZXIobmFtZTogc3RyaW5nLCBwYXJzZWRBcmdzOiBhbnksIHN1cGFiYXNlOiBhbnksIGV4ZWN1dGl2ZU5hbWU6IHN0cmluZyk6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICBzd2l0Y2ggKG5hbWUpIHtcbiAgICBjYXNlICd2c2NvX21hbmFnZV9qb2JzJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5O4IFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBKb2JzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZzY28td29ya3NwYWNlJywge1xuICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG5cbiAgICBjYXNlICd2c2NvX21hbmFnZV9jb250YWN0cyc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+ThyBbJHtleGVjdXRpdmVOYW1lfV0gVlNDTyBNYW5hZ2UgQ29udGFjdHM6ICR7cGFyc2VkQXJncy5hY3Rpb259YCk7XG4gICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgIGJvZHk6IHsgYWN0aW9uOiBwYXJzZWRBcmdzLmFjdGlvbiwgZGF0YTogcGFyc2VkQXJncywgZXhlY3V0aXZlOiBleGVjdXRpdmVOYW1lIH1cbiAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiByZXMuZXJyb3IgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzLmVycm9yLm1lc3NhZ2UgfSA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZXMuZGF0YSB9KTtcblxuICAgIGNhc2UgJ3ZzY29fbWFuYWdlX2V2ZW50cyc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+ThSBbJHtleGVjdXRpdmVOYW1lfV0gVlNDTyBNYW5hZ2UgRXZlbnRzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZzY28td29ya3NwYWNlJywge1xuICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG5cbiAgICBjYXNlICd2c2NvX2FuYWx5dGljcyc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+TiiBbJHtleGVjdXRpdmVOYW1lfV0gVlNDTyBBbmFseXRpY3M6ICR7cGFyc2VkQXJncy5hY3Rpb259YCk7XG4gICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgndnNjby13b3Jrc3BhY2UnLCB7XG4gICAgICAgIGJvZHk6IHsgYWN0aW9uOiBwYXJzZWRBcmdzLmFjdGlvbiwgZGF0YTogcGFyc2VkQXJncywgZXhlY3V0aXZlOiBleGVjdXRpdmVOYW1lIH1cbiAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiByZXMuZXJyb3IgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzLmVycm9yLm1lc3NhZ2UgfSA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZXMuZGF0YSB9KTtcblxuICAgIGNhc2UgJ3ZzY29fbWFuYWdlX3Byb2R1Y3RzJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5KwIFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBQcm9kdWN0czogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuXG4gICAgY2FzZSAndnNjb19tYW5hZ2Vfd29ya3NoZWV0cyc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+TiyBbJHtleGVjdXRpdmVOYW1lfV0gVlNDTyBNYW5hZ2UgV29ya3NoZWV0czogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuXG4gICAgY2FzZSAndnNjb19tYW5hZ2Vfbm90ZXMnOlxuICAgICAgY29uc29sZS5sb2coYPCfk50gWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIE5vdGVzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZzY28td29ya3NwYWNlJywge1xuICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG5cbiAgICBjYXNlICd2c2NvX21hbmFnZV9maW5hbmNpYWxzJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5K1IFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBGaW5hbmNpYWxzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZzY28td29ya3NwYWNlJywge1xuICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG5cbiAgICBjYXNlICd2c2NvX21hbmFnZV9zZXR0aW5ncyc6XG4gICAgICBjb25zb2xlLmxvZyhg4pqZ77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBWU0NPIE1hbmFnZSBTZXR0aW5nczogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2c2NvLXdvcmtzcGFjZScsIHtcbiAgICAgICAgYm9keTogeyBhY3Rpb246IHBhcnNlZEFyZ3MuYWN0aW9uLCBkYXRhOiBwYXJzZWRBcmdzLCBleGVjdXRpdmU6IGV4ZWN1dGl2ZU5hbWUgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuXG4gICAgY2FzZSAndnNjb19tYW5hZ2VfdXNlcnMnOlxuICAgICAgY29uc29sZS5sb2coYPCfkaUgWyR7ZXhlY3V0aXZlTmFtZX1dIFZTQ08gTWFuYWdlIFVzZXJzOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZzY28td29ya3NwYWNlJywge1xuICAgICAgICBib2R5OiB7IGFjdGlvbjogcGFyc2VkQXJncy5hY3Rpb24sIGRhdGE6IHBhcnNlZEFyZ3MsIGV4ZWN1dGl2ZTogZXhlY3V0aXZlTmFtZSB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIENPUlBPUkFURSBMSUNFTlNJTkcgVE9PTFNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNhc2UgJ3N0YXJ0X2xpY2Vuc2VfYXBwbGljYXRpb24nOlxuICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIFN0YXJ0IExpY2Vuc2UgQXBwbGljYXRpb25gKTtcbiAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdwcm9jZXNzLWxpY2Vuc2UtYXBwbGljYXRpb24nLCB7XG4gICAgICAgIGJvZHk6IHsgYWN0aW9uOiAnY3JlYXRlX2RyYWZ0JywgZGF0YTogeyBzZXNzaW9uX2tleTogcGFyc2VkQXJncy5zZXNzaW9uX2tleSwgcGFydGlhbF9kYXRhOiBwYXJzZWRBcmdzIH0gfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuXG4gICAgY2FzZSAndXBkYXRlX2xpY2Vuc2VfYXBwbGljYXRpb24nOlxuICAgICAgY29uc29sZS5sb2coYPCfk50gWyR7ZXhlY3V0aXZlTmFtZX1dIFVwZGF0ZSBMaWNlbnNlIEFwcGxpY2F0aW9uYCk7XG4gICAgICBpZiAocGFyc2VkQXJncy5hcHBsaWNhdGlvbl9pZCkge1xuICAgICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncHJvY2Vzcy1saWNlbnNlLWFwcGxpY2F0aW9uJywge1xuICAgICAgICAgIGJvZHk6IHsgYWN0aW9uOiAndXBkYXRlX2FwcGxpY2F0aW9uJywgZGF0YTogeyBhcHBsaWNhdGlvbl9pZDogcGFyc2VkQXJncy5hcHBsaWNhdGlvbl9pZCwgdXBkYXRlczogcGFyc2VkQXJncyB9IH1cbiAgICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRmluZCBieSBzZXNzaW9uIGtleSBhbmQgdXBkYXRlXG4gICAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdwcm9jZXNzLWxpY2Vuc2UtYXBwbGljYXRpb24nLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICdnZXRfZHJhZnRfYnlfc2Vzc2lvbicsIGRhdGE6IHsgc2Vzc2lvbl9rZXk6IHBhcnNlZEFyZ3Muc2Vzc2lvbl9rZXkgfSB9XG4gICAgICAgIH0pLnRoZW4oKGRyYWZ0UmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZnRSZXN1bHQuZGF0YT8uZHJhZnQ/LmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncHJvY2Vzcy1saWNlbnNlLWFwcGxpY2F0aW9uJywge1xuICAgICAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ3VwZGF0ZV9hcHBsaWNhdGlvbicsIGRhdGE6IHsgYXBwbGljYXRpb25faWQ6IGRyYWZ0UmVzdWx0LmRhdGEuZHJhZnQuaWQsIHVwZGF0ZXM6IHBhcnNlZEFyZ3MgfSB9XG4gICAgICAgICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGRyYWZ0IGFwcGxpY2F0aW9uIGZvdW5kIGZvciB0aGlzIHNlc3Npb24nIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgY2FzZSAnY2FsY3VsYXRlX2xpY2Vuc2Vfc2F2aW5ncyc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+SsCBbJHtleGVjdXRpdmVOYW1lfV0gQ2FsY3VsYXRlIExpY2Vuc2UgU2F2aW5nc2ApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Byb2Nlc3MtbGljZW5zZS1hcHBsaWNhdGlvbicsIHtcbiAgICAgICAgYm9keTogeyBhY3Rpb246ICdjYWxjdWxhdGVfc2F2aW5ncycsIGRhdGE6IHBhcnNlZEFyZ3MgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuXG4gICAgY2FzZSAnc3VibWl0X2xpY2Vuc2VfYXBwbGljYXRpb24nOlxuICAgICAgY29uc29sZS5sb2coYOKchSBbJHtleGVjdXRpdmVOYW1lfV0gU3VibWl0IExpY2Vuc2UgQXBwbGljYXRpb25gKTtcbiAgICAgIGlmICghcGFyc2VkQXJncy5jb21wbGlhbmNlX2NvbW1pdG1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVXNlciBtdXN0IGFjY2VwdCB0aGUgZXRoaWNhbCBjb21taXRtZW50IGJlZm9yZSBzdWJtaXR0aW5nJyB9O1xuICAgICAgfVxuICAgICAgaWYgKHBhcnNlZEFyZ3MuYXBwbGljYXRpb25faWQpIHtcbiAgICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Byb2Nlc3MtbGljZW5zZS1hcHBsaWNhdGlvbicsIHtcbiAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ3VwZGF0ZV9hcHBsaWNhdGlvbicsIGRhdGE6IHsgYXBwbGljYXRpb25faWQ6IHBhcnNlZEFyZ3MuYXBwbGljYXRpb25faWQsIHVwZGF0ZXM6IHsgYXBwbGljYXRpb25fc3RhdHVzOiAnc3VibWl0dGVkJywgY29tcGxpYW5jZV9jb21taXRtZW50OiB0cnVlIH0gfSB9XG4gICAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiByZXMuZXJyb3IgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzLmVycm9yLm1lc3NhZ2UgfSA6IHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiByZXMuZGF0YSB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdwcm9jZXNzLWxpY2Vuc2UtYXBwbGljYXRpb24nLCB7XG4gICAgICAgICAgYm9keTogeyBhY3Rpb246ICdnZXRfZHJhZnRfYnlfc2Vzc2lvbicsIGRhdGE6IHsgc2Vzc2lvbl9rZXk6IHBhcnNlZEFyZ3Muc2Vzc2lvbl9rZXkgfSB9XG4gICAgICAgIH0pLnRoZW4oKGRyYWZ0UmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoZHJhZnRSZXN1bHQuZGF0YT8uZHJhZnQ/LmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgncHJvY2Vzcy1saWNlbnNlLWFwcGxpY2F0aW9uJywge1xuICAgICAgICAgICAgICBib2R5OiB7IGFjdGlvbjogJ3VwZGF0ZV9hcHBsaWNhdGlvbicsIGRhdGE6IHsgYXBwbGljYXRpb25faWQ6IGRyYWZ0UmVzdWx0LmRhdGEuZHJhZnQuaWQsIHVwZGF0ZXM6IHsgYXBwbGljYXRpb25fc3RhdHVzOiAnc3VibWl0dGVkJywgY29tcGxpYW5jZV9jb21taXRtZW50OiB0cnVlIH0gfSB9XG4gICAgICAgICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ05vIGRyYWZ0IGFwcGxpY2F0aW9uIGZvdW5kIHRvIHN1Ym1pdCcgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICBjYXNlICdnZXRfbGljZW5zZV9hcHBsaWNhdGlvbl9zdGF0dXMnOlxuICAgICAgY29uc29sZS5sb2coYPCfk4ogWyR7ZXhlY3V0aXZlTmFtZX1dIEdldCBMaWNlbnNlIEFwcGxpY2F0aW9uIFN0YXR1c2ApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3Byb2Nlc3MtbGljZW5zZS1hcHBsaWNhdGlvbicsIHtcbiAgICAgICAgYm9keTogeyBhY3Rpb246ICdnZXRfYXBwbGljYXRpb25fc3RhdHVzJywgZGF0YTogcGFyc2VkQXJncyB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFZTQ08gU1VJVEUgUVVPVEUgV09SS0ZMT1dcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNhc2UgJ2NyZWF0ZV9zdWl0ZV9xdW90ZSc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+TpyBbJHtleGVjdXRpdmVOYW1lfV0gQ3JlYXRlIFN1aXRlIFF1b3RlIGZvciAke3BhcnNlZEFyZ3MuY29tcGFueV9uYW1lfWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2NyZWF0ZS1zdWl0ZS1xdW90ZScsIHtcbiAgICAgICAgYm9keTogcGFyc2VkQXJnc1xuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvciA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9IDogeyBzdWNjZXNzOiB0cnVlLCByZXN1bHQ6IHJlcy5kYXRhIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBHT09HTEUgQ0xPVUQgU0VSVklDRVMgKFVuaWZpZWQgdmlhIGdvb2dsZS1jbG91ZC1hdXRoKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2FzZSAnZ29vZ2xlX2dtYWlsJzpcbiAgICBjYXNlICdnb29nbGVfY2xvdWRfYXV0aCc6XG4gICAgICBjb25zb2xlLmxvZyhg4piB77iPIFske2V4ZWN1dGl2ZU5hbWV9XSBHb29nbGUgQ2xvdWQgQXV0aDogJHtwYXJzZWRBcmdzLmFjdGlvbiB8fCAnc3RhdHVzJ31gKTtcbiAgICAgIGNvbnN0IGNsb3VkQXV0aFBheWxvYWQgPSBidWlsZEdvb2dsZUF1dGhQYXlsb2FkKHBhcnNlZEFyZ3MsIG5hbWUpO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dvb2dsZS1jbG91ZC1hdXRoJywge1xuICAgICAgICBib2R5OiBjbG91ZEF1dGhQYXlsb2FkXG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yXG4gICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlLCBjcmVkZW50aWFsX3JlcXVpcmVkOiB0cnVlIH1cbiAgICAgICAgOiByZXMuZGF0YSk7XG5cbiAgICBjYXNlICdnb29nbGVfZHJpdmUnOlxuICAgICAgY29uc29sZS5sb2coYPCfk4EgWyR7ZXhlY3V0aXZlTmFtZX1dIEdvb2dsZSBEcml2ZSB2aWEgZ29vZ2xlLWNsb3VkLWF1dGg6ICR7cGFyc2VkQXJncy5hY3Rpb259YCk7XG4gICAgICBjb25zdCBkcml2ZVBheWxvYWQgPSBidWlsZEdvb2dsZUF1dGhQYXlsb2FkKHBhcnNlZEFyZ3MsIG5hbWUpO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dvb2dsZS1jbG91ZC1hdXRoJywge1xuICAgICAgICBib2R5OiBkcml2ZVBheWxvYWRcbiAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiByZXMuZXJyb3JcbiAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzLmVycm9yLm1lc3NhZ2UsIGNyZWRlbnRpYWxfcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICA6IHJlcy5kYXRhKTtcblxuICAgIGNhc2UgJ2dvb2dsZV9zaGVldHMnOlxuICAgICAgY29uc29sZS5sb2coYPCfk4ogWyR7ZXhlY3V0aXZlTmFtZX1dIEdvb2dsZSBTaGVldHMgdmlhIGdvb2dsZS1jbG91ZC1hdXRoOiAke3BhcnNlZEFyZ3MuYWN0aW9ufWApO1xuICAgICAgY29uc3Qgc2hlZXRzUGF5bG9hZCA9IGJ1aWxkR29vZ2xlQXV0aFBheWxvYWQocGFyc2VkQXJncywgbmFtZSk7XG4gICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ29vZ2xlLWNsb3VkLWF1dGgnLCB7XG4gICAgICAgIGJvZHk6IHNoZWV0c1BheWxvYWRcbiAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiByZXMuZXJyb3JcbiAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzLmVycm9yLm1lc3NhZ2UsIGNyZWRlbnRpYWxfcmVxdWlyZWQ6IHRydWUgfVxuICAgICAgICA6IHJlcy5kYXRhKTtcblxuICAgIGNhc2UgJ2dvb2dsZV9jYWxlbmRhcic6XG4gICAgICBjb25zb2xlLmxvZyhg8J+ThSBbJHtleGVjdXRpdmVOYW1lfV0gR29vZ2xlIENhbGVuZGFyIHZpYSBnb29nbGUtY2xvdWQtYXV0aDogJHtwYXJzZWRBcmdzLmFjdGlvbn1gKTtcbiAgICAgIGNvbnN0IGNhbGVuZGFyUGF5bG9hZCA9IGJ1aWxkR29vZ2xlQXV0aFBheWxvYWQocGFyc2VkQXJncywgbmFtZSk7XG4gICAgICByZXR1cm4gc3VwYWJhc2UuZnVuY3Rpb25zLmludm9rZSgnZ29vZ2xlLWNsb3VkLWF1dGgnLCB7XG4gICAgICAgIGJvZHk6IGNhbGVuZGFyUGF5bG9hZFxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvclxuICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSwgY3JlZGVudGlhbF9yZXF1aXJlZDogdHJ1ZSB9XG4gICAgICAgIDogcmVzLmRhdGEpO1xuXG4gICAgY2FzZSAnZ29vZ2xlX2Nsb3VkX3N0YXR1cyc6XG4gICAgICBjb25zb2xlLmxvZyhg8J+UkCBbJHtleGVjdXRpdmVOYW1lfV0gR29vZ2xlIENsb3VkIFN0YXR1cyBDaGVja2ApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ2dvb2dsZS1jbG91ZC1hdXRoJywge1xuICAgICAgICBib2R5OiB7IGFjdGlvbjogJ3N0YXR1cycgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvclxuICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgIDogcmVzLmRhdGEpO1xuXG4gICAgY2FzZSAnaW50cm9zcGVjdF9mdW5jdGlvbl9hY3Rpb25zJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5SNIFske2V4ZWN1dGl2ZU5hbWV9XSBJbnRyb3NwZWN0aW5nIGZ1bmN0aW9uOiAke3BhcnNlZEFyZ3MuZnVuY3Rpb25fbmFtZSB8fCAnYWxsJ31gKTtcbiAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdnZXQtZnVuY3Rpb24tYWN0aW9ucycsIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGZ1bmN0aW9uX25hbWU6IHBhcnNlZEFyZ3MuZnVuY3Rpb25fbmFtZSxcbiAgICAgICAgICBjYXRlZ29yeTogcGFyc2VkQXJncy5jYXRlZ29yeVxuICAgICAgICB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH0gOiByZXMuZGF0YSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIPCflLcgTVVBUEkgLyBPTExBTUEgRVhQUkVTUyBUT09MUyAocmVwbGFjZWQgVmVydGV4IEFJKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2FzZSAndmVydGV4X2FpX2dlbmVyYXRlJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5S3IFske2V4ZWN1dGl2ZU5hbWV9XSBPbGxhbWEgR2VuZXJhdGU6ICR7cGFyc2VkQXJncy5tb2RlbCB8fCAncXdlbjMuNTpsYXRlc3QnfWApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZlcnRleC1haS1jaGF0Jywge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgbWVzc2FnZXM6IFt7IHJvbGU6ICd1c2VyJywgY29udGVudDogcGFyc2VkQXJncy5wcm9tcHQgfV0sXG4gICAgICAgICAgbW9kZWw6IHBhcnNlZEFyZ3MubW9kZWwgfHwgJ3F3ZW4zLjU6bGF0ZXN0JyxcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogcGFyc2VkQXJncy50ZW1wZXJhdHVyZSB8fCAwLjcsXG4gICAgICAgICAgc3lzdGVtUHJvbXB0OiBwYXJzZWRBcmdzLnN5c3RlbV9wcm9tcHRcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvclxuICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCByZXNwb25zZTogcmVzLmRhdGE/LnJlc3VsdD8uY2hvaWNlcz8uWzBdPy5tZXNzYWdlPy5jb250ZW50LCBtb2RlbDogcmVzLmRhdGE/LnJlc3VsdD8ubW9kZWwsIHByb3ZpZGVyOiAnb2xsYW1hJyB9KTtcblxuICAgIGNhc2UgJ3ZlcnRleF9haV9jb3VudF90b2tlbnMnOlxuICAgICAgY29uc29sZS5sb2coYPCflKIgWyR7ZXhlY3V0aXZlTmFtZX1dIFRva2VuIGNvdW50IG5vdCBhdmFpbGFibGUgKE9sbGFtYSBkb2Vzbid0IGV4cG9zZSBjb3VudFRva2VucylgKTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Rva2VuIGNvdW50aW5nIG5vdCBhdmFpbGFibGUgd2l0aCBsb2NhbCBPbGxhbWEuIFVzZSBhcHByb3hpbWF0ZTogdGV4dC5sZW5ndGggLyA0LicgfTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+WvO+4jyBNVUFQSSBJTUFHRSBHRU5FUkFUSU9OIChyZXBsYWNlZCBWZXJ0ZXggQUkgSW1hZ2VuKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2FzZSAndmVydGV4X2dlbmVyYXRlX2ltYWdlJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5a877iPIFske2V4ZWN1dGl2ZU5hbWV9XSBNdUFQSSBJbWFnZSBHZW5lcmF0aW9uOiAke3BhcnNlZEFyZ3MucHJvbXB0Py5zdWJzdHJpbmcoMCwgNTApfS4uLmApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZlcnRleC1haS1jaGF0Jywge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGVfaW1hZ2UnLFxuICAgICAgICAgIHByb21wdDogcGFyc2VkQXJncy5wcm9tcHQsXG4gICAgICAgICAgaW1hZ2VfbW9kZWw6IHBhcnNlZEFyZ3MubW9kZWwgfHwgJ2ZsdXgtZGV2LWltYWdlJyxcbiAgICAgICAgICBhc3BlY3RfcmF0aW86IHBhcnNlZEFyZ3MuYXNwZWN0X3JhdGlvIHx8ICcxOjEnXG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiByZXMuZXJyb3JcbiAgICAgICAgPyB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogcmVzLmVycm9yLm1lc3NhZ2UgfVxuICAgICAgICA6IHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGltYWdlczogcmVzLmRhdGE/LmRhdGE/LnB1YmxpY1VybCA/IFtyZXMuZGF0YS5kYXRhLnB1YmxpY1VybF0gOiBbXSxcbiAgICAgICAgICBjb3VudDogcmVzLmRhdGE/LmRhdGE/LnB1YmxpY1VybCA/IDEgOiAwLFxuICAgICAgICAgIHRleHQ6IHJlcy5kYXRhPy5kYXRhPy5yZXN1bHQ/LmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudCB8fCAnJyxcbiAgICAgICAgICBwcm92aWRlcjogJ211YXBpJ1xuICAgICAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+OrCBNVUFQSSBWSURFTyBHRU5FUkFUSU9OIChyZXBsYWNlZCBWZXJ0ZXggQUkgVmVvKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2FzZSAndmVydGV4X2dlbmVyYXRlX3ZpZGVvJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn46sIFske2V4ZWN1dGl2ZU5hbWV9XSBNdUFQSSBWaWRlbyBHZW5lcmF0aW9uOiAke3BhcnNlZEFyZ3MucHJvbXB0Py5zdWJzdHJpbmcoMCwgNTApfS4uLmApO1xuICAgICAgcmV0dXJuIHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ3ZlcnRleC1haS1jaGF0Jywge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGVfdmlkZW8nLFxuICAgICAgICAgIHByb21wdDogcGFyc2VkQXJncy5wcm9tcHQsXG4gICAgICAgICAgdmlkZW9fbW9kZWw6IHBhcnNlZEFyZ3MubW9kZWwgfHwgJ3ZlbzMtZmFzdC10ZXh0LXRvLXZpZGVvJyxcbiAgICAgICAgICBhc3BlY3RfcmF0aW86IHBhcnNlZEFyZ3MuYXNwZWN0X3JhdGlvIHx8ICcxNjo5JyxcbiAgICAgICAgICBkdXJhdGlvbl9zZWNvbmRzOiBwYXJzZWRBcmdzLmR1cmF0aW9uX3NlY29uZHMgfHwgNVxuICAgICAgICB9XG4gICAgICB9KS50aGVuKChyZXM6IGFueSkgPT4gcmVzLmVycm9yXG4gICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH1cbiAgICAgICAgOiB7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBvcGVyYXRpb25faWQ6IHJlcy5kYXRhPy5kYXRhPy5vcGVyYXRpb25fbmFtZSxcbiAgICAgICAgICBvcGVyYXRpb25fbmFtZTogcmVzLmRhdGE/LmRhdGE/Lm9wZXJhdGlvbl9uYW1lLFxuICAgICAgICAgIG1lc3NhZ2U6IHJlcy5kYXRhPy5kYXRhPy5tZXNzYWdlIHx8ICdWaWRlbyBnZW5lcmF0aW9uIHN0YXJ0ZWQgdmlhIE11QVBJLicsXG4gICAgICAgICAgcHJvdmlkZXI6ICdtdWFwaSdcbiAgICAgICAgfSk7XG5cbiAgICBjYXNlICd2ZXJ0ZXhfY2hlY2tfdmlkZW9fc3RhdHVzJzpcbiAgICAgIGNvbnNvbGUubG9nKGDwn5O977iPIFske2V4ZWN1dGl2ZU5hbWV9XSBDaGVja2luZyB2aWRlbyBzdGF0dXM6ICR7cGFyc2VkQXJncy5vcGVyYXRpb25fbmFtZX1gKTtcbiAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCd2ZXJ0ZXgtYWktY2hhdCcsIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGFjdGlvbjogJ2NoZWNrX3ZpZGVvX3N0YXR1cycsXG4gICAgICAgICAgb3BlcmF0aW9uX25hbWU6IHBhcnNlZEFyZ3Mub3BlcmF0aW9uX25hbWVcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigocmVzOiBhbnkpID0+IHJlcy5lcnJvclxuICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiByZXMuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgIDoge1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgZG9uZTogcmVzLmRhdGE/LmRhdGE/LnN0YXR1cyA9PT0gJ2RvbmUnLFxuICAgICAgICAgIHZpZGVvX3VybDogcmVzLmRhdGE/LmRhdGE/LnZpZGVvVXJscz8uWzBdLFxuICAgICAgICAgIHZpZGVvX3VybHM6IHJlcy5kYXRhPy5kYXRhPy52aWRlb1VybHMsXG4gICAgICAgICAgZXJyb3I6IHJlcy5kYXRhPy5kYXRhPy5lcnJvcixcbiAgICAgICAgICBwcm92aWRlcjogJ211YXBpJ1xuICAgICAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+UlyBPUEVOQ0xBVyBSRUxBWSDigJQgU2VuZCBtZXNzYWdlcyB0byBsb2NhbCBPcGVuQ2xhdyBhZ2VudFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY2FzZSAnc2VuZF90b19vcGVuY2xhdyc6IHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OhIFske2V4ZWN1dGl2ZU5hbWV9XSBTZW5kaW5nIG1lc3NhZ2UgdG8gT3BlbkNsYXdgKTtcbiAgICAgIGNvbnN0IG9jU2VuZFJlc3VsdCA9IGF3YWl0IHN1cGFiYXNlLmZ1bmN0aW9ucy5pbnZva2UoJ29wZW5jbGF3LXJlbGF5Jywge1xuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgYWN0aW9uOiAnc2VuZCcsXG4gICAgICAgICAgbWVzc2FnZTogcGFyc2VkQXJncy5tZXNzYWdlLFxuICAgICAgICAgIHJlbGF5X3RhZzogcGFyc2VkQXJncy5yZWxheV90YWcsXG4gICAgICAgICAgc2VuZGVyX25hbWU6IGBFbGl6YSAoU3VpdGVBSSB2aWEgJHtleGVjdXRpdmVOYW1lfSlgLFxuICAgICAgICAgIG1ldGFkYXRhOiBwYXJzZWRBcmdzLm1ldGFkYXRhID8/IHt9LFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJlc3VsdCA9IG9jU2VuZFJlc3VsdC5lcnJvclxuICAgICAgICA/IHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBvY1NlbmRSZXN1bHQuZXJyb3IubWVzc2FnZSB9XG4gICAgICAgIDoge1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgcmVzdWx0OiBvY1NlbmRSZXN1bHQuZGF0YSxcbiAgICAgICAgICB0aXA6IGBVc2UgY2hlY2tfb3BlbmNsYXdfcmVwbHkgd2l0aCByZWxheV90YWc9XCIke29jU2VuZFJlc3VsdC5kYXRhPy5yZWxheV90YWd9XCIgdG8gcmVhZCBPcGVuQ2xhdydzIHJlc3BvbnNlIHdoZW4gaXQgcmVwbGllcy5gXG4gICAgICAgIH07XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjYXNlICdjaGVja19vcGVuY2xhd19yZXBseSc6IHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5OsIFske2V4ZWN1dGl2ZU5hbWV9XSBDaGVja2luZyBmb3IgT3BlbkNsYXcgcmVwbHk6ICR7cGFyc2VkQXJncy5yZWxheV90YWd9YCk7XG4gICAgICAvLyBRdWVyeSBpbmJveF9tZXNzYWdlcyBmb3IgYSByZXBseSBmcm9tIE9wZW5DbGF3IHdpdGggaXNfcmVwbHk9dHJ1ZSBhbmQgbWF0Y2hpbmcgcmVsYXlfdGFnXG4gICAgICBjb25zdCB7IGRhdGE6IHJlcGx5Um93cywgZXJyb3I6IHJlcGx5RXJyIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgICAuZnJvbSgnaW5ib3hfbWVzc2FnZXMnKVxuICAgICAgICAuc2VsZWN0KCdpZCwgY29udGVudCwgbWV0YWRhdGEsIGNyZWF0ZWRfYXQnKVxuICAgICAgICAuZXEoJ2NoYW5uZWwnLCAnb3BlbmNsYXcnKVxuICAgICAgICAuZmlsdGVyKCdtZXRhZGF0YS0+PnJlbGF5X3RhZycsICdlcScsIHBhcnNlZEFyZ3MucmVsYXlfdGFnKVxuICAgICAgICAuZmlsdGVyKCdtZXRhZGF0YS0+PmlzX3JlcGx5JywgJ2VxJywgJ3RydWUnKVxuICAgICAgICAub3JkZXIoJ2NyZWF0ZWRfYXQnLCB7IGFzY2VuZGluZzogZmFsc2UgfSlcbiAgICAgICAgLmxpbWl0KDEpO1xuXG4gICAgICBpZiAocmVwbHlFcnIpIHtcbiAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcGx5RXJyLm1lc3NhZ2UgfTtcbiAgICAgIH0gZWxzZSBpZiAoIXJlcGx5Um93cyB8fCByZXBseVJvd3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlc3VsdCA9IHsgc3VjY2VzczogdHJ1ZSwgZm91bmQ6IGZhbHNlLCBtZXNzYWdlOiAnT3BlbkNsYXcgaGFzIG5vdCByZXBsaWVkIHlldC4gVHJ5IGFnYWluIGluIGEgbW9tZW50LicgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlcGx5ID0gcmVwbHlSb3dzWzBdO1xuICAgICAgICAvLyBNYXJrIGFzIHJlYWRcbiAgICAgICAgYXdhaXQgc3VwYWJhc2UuZnJvbSgnaW5ib3hfbWVzc2FnZXMnKS51cGRhdGUoeyBpc19yZWFkOiB0cnVlIH0pLmVxKCdpZCcsIHJlcGx5LmlkKTtcbiAgICAgICAgcmVzdWx0ID0geyBzdWNjZXNzOiB0cnVlLCBmb3VuZDogdHJ1ZSwgcmVwbHk6IHJlcGx5LmNvbnRlbnQsIHJlcGx5X2lkOiByZXBseS5pZCwgY3JlYXRlZF9hdDogcmVwbHkuY3JlYXRlZF9hdCB9O1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuXG5cbiAgICBjYXNlICdzdG9yZV9rbm93bGVkZ2UnOiB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+noCBbJHtleGVjdXRpdmVOYW1lfV0gU3RvcmluZyBrbm93bGVkZ2U6ICR7cGFyc2VkQXJncy5uYW1lfWApO1xuICAgICAgY29uc3QgeyBkYXRhOiBza0RhdGEsIGVycm9yOiBza0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdrbm93bGVkZ2UtbWFuYWdlcicsIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGFjdGlvbjogJ3N0b3JlJyxcbiAgICAgICAgICBuYW1lOiBwYXJzZWRBcmdzLm5hbWUsXG4gICAgICAgICAgdHlwZTogcGFyc2VkQXJncy50eXBlLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBwYXJzZWRBcmdzLmRlc2NyaXB0aW9uLFxuICAgICAgICAgIG1ldGFkYXRhOiBwYXJzZWRBcmdzLm1ldGFkYXRhIHx8IHt9LFxuICAgICAgICAgIGNvbmZpZGVuY2Vfc2NvcmU6IHBhcnNlZEFyZ3MuY29uZmlkZW5jZV9zY29yZSA/PyAwLjhcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXN1bHQgPSBza0Vycm9yXG4gICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHNrRXJyb3IubWVzc2FnZSB9XG4gICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCAuLi5za0RhdGEgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgJ3NlYXJjaF9rbm93bGVkZ2UnOiB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+UjSBbJHtleGVjdXRpdmVOYW1lfV0gU2VhcmNoaW5nIGtub3dsZWRnZTogJHtwYXJzZWRBcmdzLnF1ZXJ5fWApO1xuICAgICAgY29uc3QgeyBkYXRhOiBzcURhdGEsIGVycm9yOiBzcUVycm9yIH0gPSBhd2FpdCBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKCdrbm93bGVkZ2UtbWFuYWdlcicsIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGFjdGlvbjogJ3NlYXJjaCcsXG4gICAgICAgICAgcXVlcnk6IHBhcnNlZEFyZ3MucXVlcnksXG4gICAgICAgICAgdHlwZTogcGFyc2VkQXJncy50eXBlLFxuICAgICAgICAgIGxpbWl0OiBwYXJzZWRBcmdzLmxpbWl0ID8/IDVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXN1bHQgPSBzcUVycm9yXG4gICAgICAgID8geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHNxRXJyb3IubWVzc2FnZSB9XG4gICAgICAgIDogeyBzdWNjZXNzOiB0cnVlLCAuLi5zcURhdGEgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGRlZmF1bHQ6XG5cbiAgICAgIC8vIER5bmFtaWMgRmFsbGJhY2s6IENoZWNrIGlmIHRvb2wgZXhpc3RzIGluIHRoZSByZWdpc3RyeVxuICAgICAgY29uc3QgcmVnaXN0cnlFbnRyeSA9IEVER0VfRlVOQ1RJT05TX1JFR0lTVFJZLmZpbmQoZiA9PiBmLm5hbWUgPT09IG5hbWUpO1xuICAgICAgaWYgKHJlZ2lzdHJ5RW50cnkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYPCfjJAgWyR7ZXhlY3V0aXZlTmFtZX1dIER5bmFtaWMgUmVnaXN0cnkgVG9vbCBFeGVjdXRpb246ICR7bmFtZX1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk4sgWyR7ZXhlY3V0aXZlTmFtZX1dIFBheWxvYWQ6YCwgSlNPTi5zdHJpbmdpZnkocGFyc2VkQXJncykuc3Vic3RyaW5nKDAsIDIwMCkpO1xuXG4gICAgICAgIHJldHVybiBzdXBhYmFzZS5mdW5jdGlvbnMuaW52b2tlKG5hbWUsIHtcbiAgICAgICAgICBib2R5OiBwYXJzZWRBcmdzXG4gICAgICAgIH0pLnRoZW4oKHJlczogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKHJlcy5lcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihg4p2MIFske2V4ZWN1dGl2ZU5hbWV9XSBEeW5hbWljIHRvb2wgZXJyb3IgKCR7bmFtZX0pOmAsIHJlcy5lcnJvcik7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlcy5lcnJvci5tZXNzYWdlIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogcmVzLmRhdGEsIHNvdXJjZTogJ2R5bmFtaWNfcmVnaXN0cnknIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLndhcm4oYOKaoO+4jyBbJHtleGVjdXRpdmVOYW1lfV0gVW5rbm93biB0b29sIGNhbGw6ICR7bmFtZX1gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxnQkFBZ0IsUUFBUSwyQkFBMkI7QUFDNUQsU0FBUyx1QkFBdUIsUUFBUSw0QkFBNEI7QUFFcEU7O0NBRUMsR0FDRCxTQUFTLHlCQUF5QixRQUFnQixFQUFFLEtBQWEsRUFBRSxNQUFXO0VBQzVFLGlCQUFpQjtFQUNqQixJQUFJLE1BQU0sUUFBUSxDQUFDLGNBQWMsTUFBTSxRQUFRLENBQUMsYUFBYSxNQUFNLFFBQVEsQ0FBQyxlQUFlLE1BQU0sUUFBUSxDQUFDLFNBQVM7SUFDakgsT0FBTyxDQUFDLGlNQUFpTSxDQUFDO0VBQzVNO0VBRUEsZ0JBQWdCO0VBQ2hCLElBQUksTUFBTSxRQUFRLENBQUMsMEJBQTBCLE1BQU0sUUFBUSxDQUFDLGdCQUFnQjtJQUMxRSxNQUFNLFFBQVEsTUFBTSxLQUFLLENBQUM7SUFDMUIsTUFBTSxhQUFhLFFBQVEsS0FBSyxDQUFDLEVBQUUsR0FBRztJQUN0QyxNQUFNLG9CQUFvQjtNQUFDO01BQVM7TUFBUztNQUFVO01BQWM7TUFBVztNQUFjO01BQVM7TUFBTztLQUFNO0lBQ3BILE1BQU0sZUFBZSxrQkFBa0IsUUFBUSxDQUFDLFdBQVcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3hFLElBQUksY0FBYztNQUNoQixPQUFPLENBQUMsVUFBVSxFQUFFLFdBQVcsbVJBQW1SLENBQUM7SUFDclQ7SUFDQSxPQUFPLENBQUMsVUFBVSxFQUFFLFdBQVcsdU1BQXVNLENBQUM7RUFDek87RUFFQSxnQkFBZ0I7RUFDaEIsSUFBSSxNQUFNLFFBQVEsQ0FBQyxnQkFBZ0I7SUFDakMsT0FBTyxDQUFDLDRJQUE0SSxDQUFDO0VBQ3ZKO0VBRUEsbUJBQW1CO0VBQ25CLElBQUksTUFBTSxRQUFRLENBQUMsY0FBYyxNQUFNLFFBQVEsQ0FBQyxhQUFhO0lBQzNELE9BQU8sQ0FBQyxpQ0FBaUMsRUFBRSxTQUFTLHVIQUF1SCxDQUFDO0VBQzlLO0VBRUEsb0JBQW9CO0VBQ3BCLElBQUksTUFBTSxRQUFRLENBQUMsV0FBVyxNQUFNLFFBQVEsQ0FBQyxVQUFVO0lBQ3JELE9BQU8sQ0FBQyw0RkFBNEYsQ0FBQztFQUN2RztFQUVBLE9BQU8sQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQ2xGO0FBRUE7OztDQUdDLEdBQ0QsT0FBTyxlQUFlLGdCQUNwQixRQUF3QixFQUN4QixRQUFhLEVBQ2IsYUFBdUUsRUFDdkUsWUFBb0IsRUFDcEIsZ0JBQXdCLEVBQ3hCLG1CQUF5QjtFQUV6QixNQUFNLFlBQVksS0FBSyxHQUFHO0VBQzFCLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxJQUFJLEVBQUUsR0FBRyxTQUFTLFFBQVEsSUFBSTtFQUV2RCwrQkFBK0I7RUFDL0IsSUFBSSxDQUFDLE1BQU07SUFDVCxNQUFNLGlCQUFpQixVQUFVO01BQy9CLGVBQWU7TUFDZixnQkFBZ0I7TUFDaEIsU0FBUztNQUNULG1CQUFtQixLQUFLLEdBQUcsS0FBSztNQUNoQyxlQUFlO01BQ2YsWUFBWTtJQUNkO0lBQ0EsT0FBTztNQUNMLFNBQVM7TUFDVCxPQUFPO01BQ1AsZ0JBQWdCO0lBQ2xCO0VBQ0Y7RUFFQSx5RUFBeUU7RUFDekUsSUFBSTtFQUNKLElBQUk7SUFDRixhQUFhLE9BQU8sU0FBUyxXQUFXLEtBQUssS0FBSyxDQUFDLFFBQVE7RUFDN0QsRUFBRSxPQUFPLFlBQVk7SUFDbkIsMERBQTBEO0lBQzFELE1BQU0sa0JBQTBDO01BQzlDLGtCQUFrQjtNQUNsQixlQUFlO01BQ2Ysc0JBQXNCO01BQ3RCLHVCQUF1QjtNQUN2QixxQkFBcUI7TUFDckIsd0JBQXdCO01BQ3hCLDJCQUEyQjtJQUM3QjtJQUVBLE1BQU0saUJBQWlCLGVBQWUsQ0FBQyxLQUFLLElBQUk7SUFFaEQsTUFBTSxpQkFBaUIsVUFBVTtNQUMvQixlQUFlO01BQ2YsZ0JBQWdCO01BQ2hCLFNBQVM7TUFDVCxtQkFBbUIsS0FBSyxHQUFHLEtBQUs7TUFDaEMsZUFBZSxDQUFDLG1DQUFtQyxFQUFFLE1BQU07TUFDM0QsWUFBWTtRQUFFLFVBQVU7UUFBTSxhQUFhLFdBQVcsT0FBTztRQUFFLGlCQUFpQjtNQUFlO0lBQ2pHO0lBQ0EsT0FBTztNQUNMLFNBQVM7TUFDVCxPQUFPLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxzQ0FBc0MsRUFBRSxnQkFBZ0I7TUFDbEcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssdUNBQXVDLEVBQUUsZUFBZSw4Q0FBOEMsQ0FBQztJQUN0STtFQUNGO0VBRUEsTUFBTSwwQkFBeUIsQ0FBQyxVQUFlO0lBQzdDLE1BQU0sVUFBVTtNQUFFLEdBQUksWUFBWSxDQUFDLENBQUM7SUFBRTtJQUV0QyxNQUFNLG9CQUNKLFFBQVEsVUFBVSxJQUNsQixxQkFBcUIsY0FDckIscUJBQXFCLFNBQ3JCLHFCQUFxQixNQUFNO0lBRTdCLE1BQU0saUJBQ0osUUFBUSxPQUFPLElBQ2YscUJBQXFCLFdBQ3JCLHFCQUFxQixPQUNyQixxQkFBcUIsTUFBTTtJQUU3QixJQUFJLHFCQUFxQixDQUFDLFFBQVEsVUFBVSxFQUFFLFFBQVEsVUFBVSxHQUFHO0lBQ25FLElBQUksa0JBQWtCLENBQUMsUUFBUSxPQUFPLEVBQUUsUUFBUSxPQUFPLEdBQUc7SUFDMUQsSUFBSSxDQUFDLFFBQVEsY0FBYyxFQUFFLFFBQVEsY0FBYyxHQUFHO0lBRXRELE9BQU87RUFDVDtFQUVBLHVFQUF1RTtFQUN2RSxJQUFJLFNBQVMsa0JBQWtCO0lBQzdCLElBQUksQ0FBQyxXQUFXLElBQUksRUFBRTtNQUNwQixPQUFPO1FBQ0wsU0FBUztRQUNULE9BQU87UUFDUCxnQkFBZ0I7TUFDbEI7SUFDRjtJQUNBLElBQUksQ0FBQyxXQUFXLE9BQU8sRUFBRTtNQUN2QixRQUFRLElBQUksQ0FBQyxDQUFDLHNEQUFzRCxFQUFFLGVBQWU7TUFDckYsV0FBVyxPQUFPLEdBQUc7SUFDdkI7SUFFQSxnRUFBZ0U7SUFDaEUsTUFBTSxPQUFPLFdBQVcsSUFBSTtJQUM1QixNQUFNLGVBQXlCLEVBQUU7SUFFakMsdURBQXVEO0lBQ3ZELE1BQU0sbUJBQW1CLENBQUMsS0FBSyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxNQUFNO0lBQy9ELE1BQU0sbUJBQW1CLENBQUMsS0FBSyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxNQUFNO0lBQy9ELE1BQU0sb0JBQW9CLENBQUMsS0FBSyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsTUFBTTtJQUMzRCxNQUFNLG9CQUFvQixDQUFDLEtBQUssS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLE1BQU07SUFFM0QsdUVBQXVFO0lBQ3ZFLE1BQU0saUJBQWlCLG1CQUFvQixvQkFBb0I7SUFDL0QsTUFBTSxpQkFBaUIsbUJBQW9CLG9CQUFvQjtJQUUvRCxJQUFJLGlCQUFpQixNQUFNLEdBQUc7TUFDNUIsYUFBYSxJQUFJLENBQUM7SUFDcEI7SUFDQSxJQUFJLGlCQUFpQixNQUFNLEdBQUc7TUFDNUIsYUFBYSxJQUFJLENBQUM7SUFDcEI7SUFFQSw4Q0FBOEM7SUFDOUMsTUFBTSxrQkFBa0I7TUFDdEI7UUFBRSxTQUFTO1FBQW9CLEtBQUs7TUFBMEQ7TUFDOUY7UUFBRSxTQUFTO1FBQW9DLEtBQUs7TUFBMkQ7TUFDL0c7UUFBRSxTQUFTO1FBQWEsS0FBSztNQUF5RDtNQUN0RjtRQUFFLFNBQVM7UUFBYyxLQUFLO01BQXFEO01BQ25GO1FBQUUsU0FBUztRQUFpQixLQUFLO01BQXVEO0tBQ3pGO0lBRUQsS0FBSyxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLGdCQUFpQjtNQUM5QyxJQUFJLFFBQVEsSUFBSSxDQUFDLE9BQU87UUFDdEIsYUFBYSxJQUFJLENBQUM7TUFDcEI7SUFDRjtJQUVBLCtEQUErRDtJQUMvRCxJQUFJLENBQUMsS0FBSyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssUUFBUSxDQUFDLFlBQVk7TUFDekQsYUFBYSxJQUFJLENBQUM7SUFDcEI7SUFFQSwrREFBK0Q7SUFDL0QsSUFBSSxhQUFhLElBQUksQ0FBQyxDQUFBLFFBQVMsTUFBTSxRQUFRLENBQUMsZUFBZTtNQUMzRCxRQUFRLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDBDQUEwQyxDQUFDLEVBQUU7TUFDaEYsT0FBTztRQUNMLFNBQVM7UUFDVCxPQUFPLENBQUMsNkNBQTZDLEVBQUUsYUFBYSxJQUFJLENBQUMsT0FBTztRQUNoRixnQkFBZ0IsQ0FBQywwSkFBMEosQ0FBQztRQUM1SyxpQkFBaUI7TUFDbkI7SUFDRjtJQUVBLG1DQUFtQztJQUNuQyxJQUFJLGFBQWEsTUFBTSxHQUFHLEdBQUc7TUFDM0IsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxpQ0FBaUMsQ0FBQyxFQUFFO0lBQ3hFO0VBQ0Y7RUFFQSxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGtCQUFrQixFQUFFLE1BQU0sRUFBRTtFQUU3RCxJQUFJO0lBQ0YsSUFBSTtJQUVKLGlEQUFpRDtJQUNqRCxPQUFRO01BQ04sdUVBQXVFO01BQ3ZFLHdDQUF3QztNQUN4Qyx1RUFBdUU7TUFDdkUsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsd0JBQXdCLENBQUM7UUFFMUQsZ0RBQWdEO1FBQ2hELGdJQUFnSTtRQUNoSSxzR0FBc0c7UUFDdEcsTUFBTSxpQkFBaUIsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ3BDLE1BQU0sbUJBQW1CLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUV0QyxJQUFJLENBQUMsZ0JBQWdCO1VBQ25CLFVBQVM7WUFDUCxTQUFTO1lBQ1QsT0FBTztZQUNQLGdCQUFnQjtVQUNsQjtVQUNBO1FBQ0Y7UUFFQSxJQUFJLENBQUMsa0JBQWtCO1VBQ3JCLFVBQVM7WUFDUCxTQUFTO1lBQ1QsT0FBTztZQUNQLGdCQUFnQjtVQUNsQjtVQUNBO1FBQ0Y7UUFFQSxJQUFJO1VBQ0YseUJBQXlCO1VBQ3pCLE1BQU0sVUFBVTtZQUNkLEdBQUcsV0FBVyxZQUFZO1lBQzFCLFFBQVE7WUFDUixlQUFlLElBQUksT0FBTyxXQUFXO1VBQ3ZDO1VBRUEsTUFBTSxXQUFXLE1BQU0sTUFBTSxHQUFHLGVBQWUsS0FBSyxDQUFDLEVBQUU7WUFDckQsUUFBUTtZQUNSLFNBQVM7Y0FDUCxnQkFBZ0I7Y0FDaEIsdUJBQXVCO1lBQ3pCO1lBQ0EsTUFBTSxLQUFLLFNBQVMsQ0FBQztVQUN2QjtVQUVBLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNoQixNQUFNLElBQUksTUFBTSxDQUFDLHNCQUFzQixFQUFFLFNBQVMsTUFBTSxDQUFDLEVBQUUsRUFBRSxTQUFTLFVBQVUsRUFBRTtVQUNwRjtVQUVBLE1BQU0sZUFBZSxNQUFNLFNBQVMsSUFBSTtVQUN4QyxVQUFTO1lBQUUsU0FBUztZQUFNLFFBQVE7VUFBYTtRQUNqRCxFQUFFLE9BQU8sYUFBYTtVQUNwQixRQUFRLEtBQUssQ0FBQyxDQUFDLDJCQUEyQixDQUFDLEVBQUU7VUFDN0MsVUFBUztZQUNQLFNBQVM7WUFDVCxPQUFPLENBQUMscUNBQXFDLEVBQUUsZUFBZSxtQkFBbUIsQ0FBQztZQUNsRixTQUFTLFlBQVksT0FBTztVQUM5QjtRQUNGO1FBQ0E7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxjQUFjLENBQUM7UUFDaEQsTUFBTSxnQkFBZ0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1VBQUUsTUFBTTtRQUFXO1FBQ3pGLFVBQVMsY0FBYyxLQUFLLEdBQ3hCO1VBQUUsU0FBUztVQUFPLE9BQU8sY0FBYyxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3JEO1VBQUUsU0FBUztVQUFNLFFBQVEsY0FBYyxJQUFJO1FBQUM7UUFDaEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywyQkFBMkIsQ0FBQztRQUM3RCxNQUFNLGlCQUFpQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkI7VUFBRSxNQUFNO1FBQVc7UUFDdkcsVUFBUyxlQUFlLEtBQUssR0FDekI7VUFBRSxTQUFTO1VBQU8sT0FBTyxlQUFlLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDdEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxlQUFlLElBQUk7UUFBQztRQUNqRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHNCQUFzQixDQUFDO1FBQ3hELE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxZQUFZLEVBQUUsR0FBRztRQUNsRCxJQUFJLGtCQUFrQjtRQUN0QixJQUFJLFlBQVk7UUFFaEIsSUFBSSwyQkFBMkIsS0FBSztVQUNsQyxrQkFBa0I7VUFDbEIsWUFBWTtRQUNkLE9BQU8sSUFBSSwyQkFBMkIsTUFBTTtVQUMxQyxrQkFBa0I7VUFDbEIsWUFBWTtRQUNkLE9BQU8sSUFBSSwyQkFBMkIsT0FBTztVQUMzQyxrQkFBa0I7VUFDbEIsWUFBWTtRQUNkLE9BQU87VUFDTCxrQkFBa0I7VUFDbEIsWUFBWTtRQUNkO1FBRUEsb0JBQW9CO1FBQ3BCLElBQUksaUJBQWlCLHNCQUFzQixvQkFBb0IsY0FBYztVQUMzRSxrQkFBa0I7VUFDbEIsYUFBYTtRQUNmO1FBRUEsVUFBUztVQUNQLFNBQVM7VUFDVCxRQUFRO1lBQ04sa0JBQWtCO1lBQ2xCO1lBQ0EsY0FBYyxDQUFBO2NBQUUsTUFBTTtjQUFHLE9BQU87Y0FBSSxLQUFLO2NBQUksWUFBWTtZQUFJLENBQUEsQ0FBQyxDQUFDLGdCQUFnQjtVQUNqRjtRQUNGO1FBQ0E7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxxQkFBcUIsQ0FBQztRQUN2RCxNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywyQkFBMkI7VUFDL0UsTUFBTTtZQUFFLFFBQVE7WUFBdUIsR0FBRyxVQUFVO1VBQUM7UUFDdkQ7UUFDQSxVQUFTLGNBQWMsS0FBSyxHQUN4QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGNBQWMsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNyRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGNBQWMsSUFBSTtRQUFDO1FBQ2hEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsdUJBQXVCLENBQUM7UUFDekQsTUFBTSxnQkFBZ0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCO1VBQUUsTUFBTTtRQUFXO1FBQ2pHLFVBQVMsY0FBYyxLQUFLLEdBQ3hCO1VBQUUsU0FBUztVQUFPLE9BQU8sY0FBYyxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3JEO1VBQUUsU0FBUztVQUFNLFFBQVEsY0FBYyxJQUFJO1FBQUM7UUFDaEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywyQkFBMkIsQ0FBQztRQUM3RCxNQUFNLEVBQUUsTUFBTSxXQUFXLEVBQUUsR0FBRyxNQUFNLFNBQ2pDLElBQUksQ0FBQywwQkFDTCxNQUFNLENBQUMsS0FDUCxFQUFFLENBQUMsV0FBVyxXQUFXLE9BQU8sRUFDaEMsS0FBSyxDQUFDLGdCQUFnQjtVQUFFLFdBQVc7UUFBSztRQUUzQyxVQUFTO1VBQ1AsU0FBUztVQUNULFFBQVE7WUFDTixhQUFhLGVBQWUsRUFBRTtZQUM5QixpQkFBaUIsYUFBYSxVQUFVO1lBQ3hDLHNCQUFzQixhQUFhLEtBQUssQ0FBQSxJQUFLLEVBQUUsVUFBVSxLQUFLLHFCQUFxQjtVQUNyRjtRQUNGO1FBQ0E7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxrQkFBa0IsQ0FBQztRQUNwRCxNQUFNLGNBQWMsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCO1VBQ25FLE1BQU07WUFBRSxTQUFTLFdBQVcsT0FBTztZQUFFLFlBQVksV0FBVyxVQUFVO1VBQUM7UUFDekU7UUFDQSxVQUFTLFlBQVksS0FBSyxHQUN0QjtVQUFFLFNBQVM7VUFBTyxPQUFPLFlBQVksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNuRDtVQUFFLFNBQVM7VUFBTSxRQUFRLFlBQVksSUFBSTtRQUFDO1FBQzlDO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsOEJBQThCLENBQUM7UUFDaEUsTUFBTSxhQUFhLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLDJCQUEyQjtVQUM1RSxNQUFNO1lBQUUsUUFBUTtZQUEyQixHQUFHLFVBQVU7VUFBQztRQUMzRDtRQUNBLFVBQVMsV0FBVyxLQUFLLEdBQ3JCO1VBQUUsU0FBUztVQUFPLE9BQU8sV0FBVyxLQUFLLENBQUMsT0FBTztRQUFDLElBQ2xEO1VBQUUsU0FBUztVQUFNLFFBQVEsV0FBVyxJQUFJO1FBQUM7UUFDN0M7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywwQkFBMEIsQ0FBQztRQUM1RCx3Q0FBd0M7UUFDeEMsTUFBTSxFQUFFLE9BQU8sYUFBYSxFQUFFLEdBQUcsTUFBTSxTQUNwQyxJQUFJLENBQUMsb0JBQ0wsTUFBTSxDQUFDO1VBQ04sVUFBVTtZQUNSLGtCQUFrQixXQUFXLGdCQUFnQjtZQUM3QywwQkFBMEIsV0FBVyxlQUFlO1lBQ3BELHFCQUFxQixJQUFJLE9BQU8sV0FBVztVQUM3QztRQUNGLEdBQ0MsRUFBRSxDQUFDLFdBQVcsV0FBVyxPQUFPO1FBRW5DLFVBQVMsZ0JBQ0w7VUFBRSxTQUFTO1VBQU8sT0FBTyxjQUFjLE9BQU87UUFBQyxJQUMvQztVQUNBLFNBQVM7VUFDVCxRQUFRO1lBQ04sa0JBQWtCO1lBQ2xCLFNBQVMsR0FBRyxXQUFXLGdCQUFnQixDQUFDLHVCQUF1QixFQUFFLFdBQVcsZUFBZSxDQUFDLE9BQU8sQ0FBQztVQUN0RztRQUNGO1FBQ0Y7TUFFRix1RUFBdUU7TUFDdkUsaUJBQWlCO01BQ2pCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQTBCO1VBQzdCLG1EQUFtRDtVQUNuRCxNQUFNLFdBQW1DO1lBQ3ZDLGdCQUFnQjtZQUNoQixrQkFBa0I7WUFDbEIsbUJBQW1CO1lBQ25CLHNCQUFzQjtZQUN0QixnQkFBZ0I7WUFDaEIsaUJBQWlCO1lBQ2pCLDBCQUEwQjtZQUMxQix5QkFBeUI7WUFDekIsZUFBZTtZQUNmLHFCQUFxQjtZQUNyQixrQkFBa0I7VUFDcEI7VUFFQSxNQUFNLGVBQWUsUUFBUSxDQUFDLEtBQUssZUFBZSxDQUFDO1VBQ25ELElBQUksQ0FBQyxjQUFjO1lBQ2pCLE1BQU0sSUFBSSxNQUFNLENBQUMseUJBQXlCLEVBQUUsS0FBSyxlQUFlLEVBQUU7VUFDcEU7VUFFQSxRQUFRLEdBQUcsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLGFBQWEsR0FBRyxDQUFDO1VBRXRELE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYztZQUNwRSxNQUFNO2NBQ0osUUFBUTtjQUNSLFFBQVE7Z0JBQ04sYUFBYSxLQUFLLGdCQUFnQjtnQkFDbEMsU0FBUyxLQUFLLFlBQVksSUFBSSxDQUFDO2NBQ2pDO2NBQ0EsdURBQXVEO2NBQ3ZELFNBQVM7Z0JBQ1AsU0FBUztnQkFDVCxjQUFjLElBQUksT0FBTyxXQUFXO2NBQ3RDO1lBQ0Y7VUFDRjtVQUVBLElBQUksT0FBTyxNQUFNO1VBQ2pCLE9BQU87UUFDVDtNQUVBLEtBQUs7TUFDTCxLQUFLO1FBQ0gsSUFBSSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUc7UUFDdkMsSUFBSSxpQkFBaUIsaUJBQWlCLFdBQVcsYUFBYTtRQUM5RCxJQUFJLGdCQUFnQixXQUFXLFFBQVEsQ0FBQztRQUV4Qyx3REFBd0Q7UUFDeEQsMEZBQTBGO1FBRTFGLElBQUksa0JBQWtCLENBQUMsZUFBZSxVQUFVLENBQUMsbUJBQW1CLGVBQWUsVUFBVSxDQUFDLGVBQWUsR0FBRztVQUM5RyxNQUFNLGFBQWEsZUFBZSxPQUFPLENBQUMsdUJBQXVCO1VBQ2pFLFFBQVEsSUFBSSxDQUFDLENBQUMsMENBQTBDLEVBQUUsZUFBZSxrQkFBa0IsQ0FBQztVQUM1RixRQUFRLElBQUksQ0FBQyxDQUFDLGtEQUFrRCxFQUFFLFlBQVk7VUFDOUUsaUJBQWlCO1VBQ2pCLCtDQUErQztVQUMvQyxJQUFJLENBQUMsZUFBZSxRQUFRO1lBQzFCLGdCQUFnQjtjQUFFLEdBQUcsYUFBYTtjQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsWUFBWTtZQUFDO1VBQ25FO1FBQ0Y7UUFFQSxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDBCQUEwQixFQUFFLGdCQUFnQjtRQUM3RSxNQUFNLGFBQWEsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1VBQUUsTUFBTTtRQUFjO1FBRXpGLElBQUksV0FBVyxLQUFLLEVBQUU7VUFDcEIsUUFBUSxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsY0FBYyxzQkFBc0IsQ0FBQyxFQUFFLFdBQVcsS0FBSztVQUMzRSxVQUFTO1lBQUUsU0FBUztZQUFPLE9BQU8sV0FBVyxLQUFLLENBQUMsT0FBTyxJQUFJO1VBQTRCO1FBQzVGLE9BQU87VUFDTCxVQUFTO1lBQUUsU0FBUztZQUFNLFFBQVEsV0FBVyxJQUFJO1VBQUM7UUFDcEQ7UUFDQTtNQUVGLEtBQUs7UUFDSCxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHO1FBQzFCLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsbUJBQW1CLEVBQUUsV0FBVyxjQUFjO1FBRS9FLE1BQU0sZUFBZSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUI7VUFDdEUsTUFBTTtZQUNKO1lBQ0E7WUFDQSxRQUFRLGNBQWMsV0FBVyxLQUFLO1lBQ3RDLFVBQVUsY0FBYyxXQUFXO1VBQ3JDO1FBQ0Y7UUFFQSxJQUFJLGFBQWEsS0FBSyxFQUFFO1VBQ3RCLFVBQVM7WUFBRSxTQUFTO1lBQU8sT0FBTyxhQUFhLEtBQUssQ0FBQyxPQUFPLElBQUk7VUFBMEI7UUFDNUYsT0FBTztVQUNMLFVBQVM7WUFBRSxTQUFTO1lBQU0sUUFBUSxhQUFhLElBQUk7VUFBQztRQUN0RDtRQUNBO01BRUYsS0FBSztRQUNILE1BQU0sUUFBUSxXQUFXLEtBQUssSUFBSTtRQUNsQyxNQUFNLHFCQUFxQixXQUFXLG1CQUFtQixLQUFLLE9BQU8sZUFBZTtRQUNwRixNQUFNLGlCQUFpQixXQUFXLGVBQWUsSUFBSSxFQUFFO1FBRXZELFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMkJBQTJCLEVBQUUsTUFBTSxjQUFjLEVBQUUsb0JBQW9CO1FBRXhHLDZDQUE2QztRQUM3QyxJQUFJLGVBQWUsTUFBTSxHQUFHLEdBQUc7VUFDN0IsTUFBTSxTQUNILElBQUksQ0FBQyxzQkFDTCxNQUFNLENBQUM7WUFBRSxjQUFjO1lBQU0saUJBQWlCLElBQUksT0FBTyxXQUFXO1VBQUcsR0FDdkUsRUFBRSxDQUFDLE1BQU07VUFDWixRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxjQUFjLGVBQWUsRUFBRSxlQUFlLE1BQU0sQ0FBQyxlQUFlLENBQUM7UUFDekY7UUFFQSxpQkFBaUI7UUFDakIsSUFBSSxRQUFRLFNBQ1QsSUFBSSxDQUFDLHNCQUNMLE1BQU0sQ0FBQyxLQUNQLEVBQUUsQ0FBQyxrQkFBa0IsZUFDckIsS0FBSyxDQUFDLGNBQWM7VUFBRSxXQUFXO1FBQU0sR0FDdkMsS0FBSyxDQUFDO1FBRVQsSUFBSSxvQkFBb0I7VUFDdEIsUUFBUSxNQUFNLEVBQUUsQ0FBQyxnQkFBZ0I7UUFDbkM7UUFFQSxNQUFNLEVBQUUsTUFBTSxRQUFRLEVBQUUsT0FBTyxhQUFhLEVBQUUsR0FBRyxNQUFNO1FBRXZELElBQUksZUFBZTtVQUNqQixVQUFTO1lBQUUsU0FBUztZQUFPLE9BQU8sY0FBYyxPQUFPO1VBQUM7UUFDMUQsT0FBTztVQUNMLFVBQVM7WUFDUCxTQUFTO1lBQ1QsUUFBUTtjQUNOLFVBQVUsWUFBWSxFQUFFO2NBQ3hCLE9BQU8sVUFBVSxVQUFVO2NBQzNCLG9CQUFvQixlQUFlLE1BQU07WUFDM0M7VUFDRjtRQUNGO1FBQ0E7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywwQkFBMEIsQ0FBQztRQUU1RCxpRUFBaUU7UUFDakUsTUFBTSxpQkFBaUIsV0FBVyxTQUFTLElBQ3pDLENBQUMsZUFBZSxlQUFlLFNBQVMsY0FBYyxRQUNwRCxlQUFlLGVBQWUsU0FBUyxnQkFBZ0IsUUFDckQsZUFBZSxlQUFlLFNBQVMsaUJBQWlCLFFBQ3RELGVBQWUsZUFBZSxTQUFTLGVBQWUsUUFBUSxPQUFPO1FBRTdFLE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUM3RSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixjQUFjO2NBQ2QsT0FBTyxXQUFXLEtBQUs7Y0FDdkIsTUFBTSxXQUFXLElBQUk7Y0FDckIsWUFBWSxXQUFXLFVBQVUsSUFBSTtjQUNyQyxXQUFXO1lBQ2I7WUFDQTtVQUNGO1FBQ0Y7UUFFQSxJQUFJLGlCQUFpQixLQUFLLEVBQUU7VUFDMUIsVUFBUztZQUFFLFNBQVM7WUFBTyxPQUFPLGlCQUFpQixLQUFLLENBQUMsT0FBTztVQUFDO1FBQ25FLE9BQU87VUFDTCxVQUFTO1lBQUUsU0FBUztZQUFNLFFBQVEsaUJBQWlCLElBQUk7VUFBQztRQUMxRDtRQUNBO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMscUJBQXFCLENBQUM7UUFFdkQsaUVBQWlFO1FBQ2pFLE1BQU0sWUFBWSxXQUFXLFNBQVMsSUFDcEMsQ0FBQyxlQUFlLGVBQWUsU0FBUyxjQUFjLFFBQ3BELGVBQWUsZUFBZSxTQUFTLGdCQUFnQixRQUNyRCxlQUFlLGVBQWUsU0FBUyxpQkFBaUIsUUFDdEQsZUFBZSxlQUFlLFNBQVMsZUFBZSxRQUFRLE9BQU87UUFFN0UsTUFBTSxjQUFjLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUN4RSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLE9BQU8sV0FBVyxLQUFLO2NBQ3ZCLE1BQU0sV0FBVyxJQUFJO2NBQ3JCLFFBQVEsV0FBVyxNQUFNLElBQUksRUFBRTtjQUMvQixXQUFXLFdBQVcsU0FBUyxJQUFJLEVBQUU7Y0FDckMsV0FBVztZQUNiO1lBQ0E7VUFDRjtRQUNGO1FBRUEsSUFBSSxZQUFZLEtBQUssRUFBRTtVQUNyQixVQUFTO1lBQUUsU0FBUztZQUFPLE9BQU8sWUFBWSxLQUFLLENBQUMsT0FBTztVQUFDO1FBQzlELE9BQU87VUFDTCxVQUFTO1lBQUUsU0FBUztZQUFNLFFBQVEsWUFBWSxJQUFJO1VBQUM7UUFDckQ7UUFDQTtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDJCQUEyQixFQUFFLFdBQVcsWUFBWSxFQUFFO1FBRXZGLGlFQUFpRTtRQUNqRSxNQUFNLGNBQWMsV0FBVyxTQUFTLElBQ3RDLENBQUMsZUFBZSxlQUFlLFNBQVMsY0FBYyxRQUNwRCxlQUFlLGVBQWUsU0FBUyxnQkFBZ0IsUUFDckQsZUFBZSxlQUFlLFNBQVMsaUJBQWlCLFFBQ3RELGVBQWUsZUFBZSxTQUFTLGVBQWUsUUFBUSxPQUFPO1FBRTdFLE1BQU0sZ0JBQWdCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUMxRSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLGNBQWMsV0FBVyxZQUFZO2NBQ3JDLFNBQVMsV0FBVyxPQUFPO2NBQzNCLFdBQVc7WUFDYjtZQUNBO1VBQ0Y7UUFDRjtRQUVBLElBQUksY0FBYyxLQUFLLEVBQUU7VUFDdkIsVUFBUztZQUFFLFNBQVM7WUFBTyxPQUFPLGNBQWMsS0FBSyxDQUFDLE9BQU87VUFBQztRQUNoRSxPQUFPO1VBQ0wsVUFBUztZQUFFLFNBQVM7WUFBTSxRQUFRLGNBQWMsSUFBSTtVQUFDO1FBQ3ZEO1FBQ0E7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxvQkFBb0IsQ0FBQztRQUV0RCxNQUFNLGFBQWEsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQ3ZFLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsT0FBTyxXQUFXLEtBQUssSUFBSTtjQUMzQixVQUFVLFdBQVcsS0FBSyxJQUFJO1lBQ2hDO1lBQ0E7VUFDRjtRQUNGO1FBRUEsSUFBSSxXQUFXLEtBQUssRUFBRTtVQUNwQixVQUFTO1lBQUUsU0FBUztZQUFPLE9BQU8sV0FBVyxLQUFLLENBQUMsT0FBTztVQUFDO1FBQzdELE9BQU87VUFDTCxVQUFTO1lBQUUsU0FBUztZQUFNLFFBQVEsV0FBVyxJQUFJO1VBQUM7UUFDcEQ7UUFDQTtNQUVGLHVFQUF1RTtNQUN2RSw0QkFBNEI7TUFDNUIsdUVBQXVFO01BQ3ZFLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG9CQUFvQixFQUFFLFdBQVcsS0FBSyxFQUFFO1FBQ3pFLE1BQU0saUJBQWlCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUMzRSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLE9BQU8sV0FBVyxLQUFLO2NBQ3ZCLE1BQU0sV0FBVyxJQUFJO2NBQ3JCLE1BQU0sV0FBVyxJQUFJO2NBQ3JCLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsT0FBTyxXQUFXLEtBQUssSUFBSTtZQUM3QjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsZUFBZSxLQUFLLEdBQ3pCO1VBQUUsU0FBUztVQUFPLE9BQU8sZUFBZSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3REO1VBQUUsU0FBUztVQUFNLFFBQVEsZUFBZSxJQUFJO1FBQUM7UUFDakQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxpQkFBaUIsQ0FBQztRQUNuRCxNQUFNLGVBQWUsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQ3pFLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsT0FBTyxXQUFXLEtBQUssSUFBSTtZQUM3QjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsYUFBYSxLQUFLLEdBQ3ZCO1VBQUUsU0FBUztVQUFPLE9BQU8sYUFBYSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3BEO1VBQUUsU0FBUztVQUFNLFFBQVEsYUFBYSxJQUFJO1FBQUM7UUFDL0M7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsY0FBYyxtQkFBbUIsRUFBRSxXQUFXLFdBQVcsRUFBRTtRQUM3RSxNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDMUUsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixhQUFhLFdBQVcsV0FBVztjQUNuQyxjQUFjLFdBQVcsWUFBWSxJQUFJO2NBQ3pDLGNBQWMsV0FBVyxZQUFZO2NBQ3JDLGdCQUFnQixXQUFXLGNBQWM7WUFDM0M7WUFDQTtVQUNGO1FBQ0Y7UUFDQSxVQUFTLGNBQWMsS0FBSyxHQUN4QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGNBQWMsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNyRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGNBQWMsSUFBSTtRQUFDO1FBQ2hEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLGNBQWMsbUJBQW1CLEVBQUUsV0FBVyxXQUFXLEVBQUU7UUFDN0UsTUFBTSxnQkFBZ0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQzFFLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsYUFBYSxXQUFXLFdBQVc7WUFDckM7WUFDQTtVQUNGO1FBQ0Y7UUFDQSxVQUFTLGNBQWMsS0FBSyxHQUN4QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGNBQWMsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNyRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGNBQWMsSUFBSTtRQUFDO1FBQ2hEO01BRUYsdUVBQXVFO01BQ3ZFLHNCQUFzQjtNQUN0Qix1RUFBdUU7TUFDdkUsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsd0JBQXdCLEVBQUUsV0FBVyxXQUFXLEVBQUU7UUFDbkYsTUFBTSxxQkFBcUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQy9FLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsYUFBYSxXQUFXLFdBQVc7Y0FDbkMsYUFBYSxXQUFXLFdBQVcsSUFBSTtZQUN6QztZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsbUJBQW1CLEtBQUssR0FDN0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxtQkFBbUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMxRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG1CQUFtQixJQUFJO1FBQUM7UUFDckQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxzQkFBc0IsQ0FBQztRQUN4RCxNQUFNLHFCQUFxQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDL0UsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtZQUMzQjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsbUJBQW1CLEtBQUssR0FDN0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxtQkFBbUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMxRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG1CQUFtQixJQUFJO1FBQUM7UUFDckQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywwQkFBMEIsRUFBRSxXQUFXLE1BQU0sRUFBRTtRQUNoRixNQUFNLG1CQUFtQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDN0UsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixRQUFRLFdBQVcsTUFBTTtZQUMzQjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsaUJBQWlCLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxpQkFBaUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN4RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGlCQUFpQixJQUFJO1FBQUM7UUFDbkQ7TUFFRix1RUFBdUU7TUFDdkUsMkJBQTJCO01BQzNCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxtQkFBbUIsRUFBRSxXQUFXLElBQUksRUFBRTtRQUN2RSxNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDMUUsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixNQUFNLFdBQVcsSUFBSTtjQUNyQixLQUFLLFdBQVcsR0FBRyxJQUFJO1lBQ3pCO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxjQUFjLEtBQUssR0FDeEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxjQUFjLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDckQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxjQUFjLElBQUk7UUFBQztRQUNoRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHNCQUFzQixFQUFFLFdBQVcsSUFBSSxFQUFFO1FBQzFFLE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUM3RSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLE1BQU0sV0FBVyxJQUFJO2NBQ3JCLFNBQVMsV0FBVyxPQUFPO2NBQzNCLFNBQVMsV0FBVyxPQUFPO2NBQzNCLFFBQVEsV0FBVyxNQUFNLElBQUk7Y0FDN0IsS0FBSyxXQUFXLEdBQUc7WUFDckI7WUFDQTtVQUNGO1FBQ0Y7UUFDQSxVQUFTLGlCQUFpQixLQUFLLEdBQzNCO1VBQUUsU0FBUztVQUFPLE9BQU8saUJBQWlCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDeEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxpQkFBaUIsSUFBSTtRQUFDO1FBQ25EO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLGNBQWMsc0JBQXNCLEVBQUUsV0FBVyxJQUFJLEVBQUU7UUFDM0UsTUFBTSxtQkFBbUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQzdFLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsTUFBTSxXQUFXLElBQUk7Y0FDckIsU0FBUyxXQUFXLE9BQU87Y0FDM0IsUUFBUSxXQUFXLE1BQU0sSUFBSTtjQUM3QixLQUFLLFdBQVcsR0FBRztZQUNyQjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsaUJBQWlCLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxpQkFBaUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN4RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGlCQUFpQixJQUFJO1FBQUM7UUFDbkQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxxQkFBcUIsRUFBRSxXQUFXLElBQUksSUFBSSxLQUFLO1FBQ2hGLE1BQU0sa0JBQWtCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUM1RSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsS0FBSyxXQUFXLEdBQUcsSUFBSTtZQUN6QjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsZ0JBQWdCLEtBQUssR0FDMUI7VUFBRSxTQUFTO1VBQU8sT0FBTyxnQkFBZ0IsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN2RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGdCQUFnQixJQUFJO1FBQUM7UUFDbEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxzQkFBc0IsRUFBRSxXQUFXLEtBQUssRUFBRTtRQUMzRSxNQUFNLG1CQUFtQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDN0UsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixPQUFPLFdBQVcsS0FBSztZQUN6QjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsaUJBQWlCLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxpQkFBaUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN4RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGlCQUFpQixJQUFJO1FBQUM7UUFDbkQ7TUFFRix1RUFBdUU7TUFDdkUsZ0NBQWdDO01BQ2hDLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxxQkFBcUIsQ0FBQztRQUN2RCxNQUFNLG9CQUFvQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDOUUsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixRQUFRLFdBQVcsTUFBTTtjQUN6QixPQUFPLFdBQVcsS0FBSztjQUN2QixPQUFPLFdBQVcsS0FBSztjQUN2QixLQUFLLFdBQVcsR0FBRztjQUNuQixNQUFNLFdBQVcsSUFBSTtjQUNyQixVQUFVLFdBQVcsUUFBUSxJQUFJO1lBQ25DO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxrQkFBa0IsS0FBSyxHQUM1QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGtCQUFrQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3pEO1VBQUUsU0FBUztVQUFNLFFBQVEsa0JBQWtCLElBQUk7UUFBQztRQUNwRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHNCQUFzQixFQUFFLFdBQVcsVUFBVSxFQUFFO1FBQ2hGLE1BQU0sc0JBQXNCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUNoRixNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLFlBQVksV0FBVyxVQUFVO1lBQ25DO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxvQkFBb0IsS0FBSyxHQUM5QjtVQUFFLFNBQVM7VUFBTyxPQUFPLG9CQUFvQixLQUFLLENBQUMsT0FBTztRQUFDLElBQzNEO1VBQUUsU0FBUztVQUFNLFFBQVEsb0JBQW9CLElBQUk7UUFBQztRQUN0RDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGtCQUFrQixDQUFDO1FBQ3BELE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUM3RSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLFVBQVUsV0FBVyxRQUFRLElBQUk7WUFDbkM7WUFDQTtVQUNGO1FBQ0Y7UUFDQSxVQUFTLGlCQUFpQixLQUFLLEdBQzNCO1VBQUUsU0FBUztVQUFPLE9BQU8saUJBQWlCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDeEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxpQkFBaUIsSUFBSTtRQUFDO1FBQ25EO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLGNBQWMsc0JBQXNCLENBQUM7UUFDekQsTUFBTSxpQkFBaUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQzNFLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsVUFBVSxXQUFXLFFBQVEsSUFBSTtZQUNuQztZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMsZUFBZSxLQUFLLEdBQ3pCO1VBQUUsU0FBUztVQUFPLE9BQU8sZUFBZSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3REO1VBQUUsU0FBUztVQUFNLFFBQVEsZUFBZSxJQUFJO1FBQUM7UUFDakQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywwQkFBMEIsQ0FBQztRQUM1RCxNQUFNLHFCQUFxQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDL0UsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixtQkFBbUIsV0FBVyxpQkFBaUIsSUFBSTtjQUNuRCxVQUFVLFdBQVcsUUFBUSxJQUFJO1lBQ25DO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxtQkFBbUIsS0FBSyxHQUM3QjtVQUFFLFNBQVM7VUFBTyxPQUFPLG1CQUFtQixLQUFLLENBQUMsT0FBTztRQUFDLElBQzFEO1VBQUUsU0FBUztVQUFNLFFBQVEsbUJBQW1CLElBQUk7UUFBQztRQUNyRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxjQUFjLHVCQUF1QixFQUFFLFdBQVcsVUFBVSxJQUFJLFVBQVU7UUFDOUYsTUFBTSx1QkFBdUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQ2pGLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsWUFBWSxXQUFXLFVBQVUsSUFBSTtZQUN2QztZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMscUJBQXFCLEtBQUssR0FDL0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxxQkFBcUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUM1RDtVQUFFLFNBQVM7VUFBTSxRQUFRLHFCQUFxQixJQUFJO1FBQUM7UUFDdkQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx1QkFBdUIsRUFBRSxXQUFXLFlBQVksRUFBRTtRQUNuRixNQUFNLHNCQUFzQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDaEYsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osTUFBTSxXQUFXLElBQUksSUFBSTtjQUN6QixjQUFjLFdBQVcsWUFBWTtjQUNyQyxVQUFVLFdBQVcsUUFBUSxJQUFJO1lBQ25DO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxvQkFBb0IsS0FBSyxHQUM5QjtVQUFFLFNBQVM7VUFBTyxPQUFPLG9CQUFvQixLQUFLLENBQUMsT0FBTztRQUFDLElBQzNEO1VBQUUsU0FBUztVQUFNLFFBQVEsb0JBQW9CLElBQUk7UUFBQztRQUN0RDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDRCQUE0QixFQUFFLFdBQVcsaUJBQWlCLEVBQUU7UUFDN0YsTUFBTSwyQkFBMkIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQ3JGLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsbUJBQW1CLFdBQVcsaUJBQWlCO2NBQy9DLE9BQU8sV0FBVyxLQUFLLElBQUk7WUFDN0I7WUFDQTtVQUNGO1FBQ0Y7UUFDQSxVQUFTLHlCQUF5QixLQUFLLEdBQ25DO1VBQUUsU0FBUztVQUFPLE9BQU8seUJBQXlCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDaEU7VUFBRSxTQUFTO1VBQU0sUUFBUSx5QkFBeUIsSUFBSTtRQUFDO1FBQzNEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsaUJBQWlCLEVBQUUsV0FBVyxZQUFZLEVBQUU7UUFDN0UsTUFBTSxvQkFBb0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQzlFLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsY0FBYyxXQUFXLFlBQVk7Y0FDckMsT0FBTyxXQUFXLEtBQUs7Y0FDdkIsTUFBTSxXQUFXLElBQUk7Y0FDckIsT0FBTyxXQUFXLEtBQUs7Y0FDdkIsUUFBUSxXQUFXLE1BQU07Y0FDekIsV0FBVyxXQUFXLFNBQVM7WUFDakM7WUFDQTtVQUNGO1FBQ0Y7UUFDQSxVQUFTLGtCQUFrQixLQUFLLEdBQzVCO1VBQUUsU0FBUztVQUFPLE9BQU8sa0JBQWtCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDekQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxrQkFBa0IsSUFBSTtRQUFDO1FBQ3BEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLGNBQWMsZ0JBQWdCLEVBQUUsV0FBVyxZQUFZLEVBQUU7UUFDM0UsTUFBTSxpQkFBaUIsV0FBVyxJQUFJLElBQUksV0FBVyxPQUFPO1FBQzVELG9DQUFvQztRQUNwQyxJQUFJLGdCQUFnQjtVQUNsQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7WUFDcEQsTUFBTTtjQUNKLFFBQVE7Y0FDUixNQUFNO2dCQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Z0JBQ3pCLGNBQWMsV0FBVyxZQUFZO2dCQUNyQyxTQUFTO2NBQ1g7Y0FDQTtZQUNGO1VBQ0Y7UUFDRjtRQUNBLE1BQU0sbUJBQW1CLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUM3RSxNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLGNBQWMsV0FBVyxZQUFZO1lBQ3ZDO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxpQkFBaUIsS0FBSyxHQUMzQjtVQUFFLFNBQVM7VUFBTyxPQUFPLGlCQUFpQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3hEO1VBQUUsU0FBUztVQUFNLFFBQVEsaUJBQWlCLElBQUk7UUFBQztRQUNuRDtNQUVGLHVFQUF1RTtNQUN2RSx3QkFBd0I7TUFDeEIsdUVBQXVFO01BQ3ZFLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDJCQUEyQixFQUFFLFdBQVcsYUFBYSxFQUFFO1FBQ3hGLE1BQU0sd0JBQXdCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtVQUNsRixNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixNQUFNLFdBQVcsSUFBSSxJQUFJO2NBQ3pCLGVBQWUsV0FBVyxhQUFhO2NBQ3ZDLEtBQUssV0FBVyxHQUFHLElBQUk7Y0FDdkIsUUFBUSxXQUFXLE1BQU0sSUFBSSxDQUFDO1lBQ2hDO1lBQ0E7VUFDRjtRQUNGO1FBQ0EsVUFBUyxzQkFBc0IsS0FBSyxHQUNoQztVQUFFLFNBQVM7VUFBTyxPQUFPLHNCQUFzQixLQUFLLENBQUMsT0FBTztRQUFDLElBQzdEO1VBQUUsU0FBUztVQUFNLFFBQVEsc0JBQXNCLElBQUk7UUFBQztRQUN4RDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDBCQUEwQixFQUFFLFdBQVcsYUFBYSxFQUFFO1FBQ3ZGLHVEQUF1RDtRQUN2RCxNQUFNLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDeEUsTUFBTSx1QkFBdUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCO1VBQ2pGLE1BQU07WUFDSixRQUFRO1lBQ1IsTUFBTTtjQUNKLE1BQU0sV0FBVyxJQUFJLElBQUk7Y0FDekIsTUFBTTtjQUNOLFNBQVMsV0FBVyxZQUFZO2NBQ2hDLFNBQVMsV0FBVyxjQUFjLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxhQUFhLEVBQUU7Y0FDakYsUUFBUSxXQUFXLE1BQU0sSUFBSTtZQUMvQjtZQUNBO1VBQ0Y7UUFDRjtRQUNBLFVBQVMscUJBQXFCLEtBQUssR0FDL0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxxQkFBcUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUM1RDtVQUFFLFNBQVM7VUFBTSxRQUFRO1lBQUUsR0FBRyxxQkFBcUIsSUFBSTtZQUFFLGVBQWU7VUFBYTtRQUFFO01BRTdGLEtBQUs7UUFDSCxNQUFNLGtCQUFrQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEI7VUFDbEYsTUFBTTtZQUFFLFVBQVUsV0FBVyxRQUFRO1VBQUM7UUFDeEM7UUFDQSxVQUFTO1VBQUUsU0FBUztVQUFNLFFBQVEsZ0JBQWdCLElBQUk7UUFBQztRQUN2RDtNQUVGLEtBQUs7UUFDSCxNQUFNLGtCQUFrQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEI7VUFDbEYsTUFBTTtRQUNSO1FBQ0EsVUFBUztVQUFFLFNBQVM7VUFBTSxRQUFRLGdCQUFnQixJQUFJO1FBQUM7UUFDdkQ7TUFFRixLQUFLO1FBQ0gsTUFBTSxpQkFBaUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCO1VBQ2xGLE1BQU07WUFBRSxHQUFHLFVBQVU7WUFBRSxhQUFhO1VBQWM7UUFDcEQ7UUFDQSxVQUFTO1VBQUUsU0FBUztVQUFNLFFBQVEsZUFBZSxJQUFJO1FBQUM7UUFDdEQ7TUFFRixLQUFLO1FBQ0gsTUFBTSxhQUFhLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLG9CQUFvQjtVQUNyRSxNQUFNO1lBQUUsR0FBRyxVQUFVO1lBQUUsZ0JBQWdCO1VBQWM7UUFDdkQ7UUFDQSxVQUFTO1VBQUUsU0FBUztVQUFNLFFBQVEsV0FBVyxJQUFJO1FBQUM7UUFDbEQ7TUFFRixLQUFLO1FBQ0gsTUFBTSxrQkFBa0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCO1VBQ2pGLE1BQU07UUFDUjtRQUNBLFVBQVM7VUFBRSxTQUFTO1VBQU0sUUFBUSxnQkFBZ0IsSUFBSTtRQUFDO1FBQ3ZEO01BRUYsMEJBQTBCO01BQzFCLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDZDQUE2QyxDQUFDO1FBQy9FLE1BQU0sZUFBZSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7VUFDeEUsTUFBTTtZQUFFLFFBQVE7WUFBcUIsTUFBTSxDQUFDO1VBQUU7UUFDaEQ7UUFDQSxVQUFTLGFBQWEsS0FBSyxHQUN2QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGFBQWEsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNwRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGFBQWEsSUFBSTtRQUFDO1FBQy9DO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsaUNBQWlDLENBQUM7UUFDbkUsTUFBTSxrQkFBa0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMscUJBQXFCO1VBQzNFLE1BQU07WUFBRSxRQUFRO1lBQXNCLE1BQU0sQ0FBQztVQUFFO1FBQ2pEO1FBQ0EsVUFBUyxnQkFBZ0IsS0FBSyxHQUMxQjtVQUFFLFNBQVM7VUFBTyxPQUFPLGdCQUFnQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3ZEO1VBQUUsU0FBUztVQUFNLFFBQVEsZ0JBQWdCLElBQUk7UUFBQztRQUNsRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDJCQUEyQixDQUFDO1FBQzdELE1BQU0saUJBQWlCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHFCQUFxQjtVQUMxRSxNQUFNO1lBQUUsUUFBUTtZQUFxQixNQUFNLENBQUM7VUFBRTtRQUNoRDtRQUNBLFVBQVMsZUFBZSxLQUFLLEdBQ3pCO1VBQUUsU0FBUztVQUFPLE9BQU8sZUFBZSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3REO1VBQUUsU0FBUztVQUFNLFFBQVEsZUFBZSxJQUFJO1FBQUM7UUFDakQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx3QkFBd0IsQ0FBQztRQUMxRCxNQUFNLGNBQWMsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMscUJBQXFCO1VBQ3ZFLE1BQU07WUFBRSxRQUFRO1lBQTJCLE1BQU0sQ0FBQztVQUFFO1FBQ3REO1FBQ0EsVUFBUyxZQUFZLEtBQUssR0FDdEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxZQUFZLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDbkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxZQUFZLElBQUk7UUFBQztRQUM5QztNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDJCQUEyQixDQUFDO1FBQzdELE1BQU0sYUFBYSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7VUFDdEUsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNO2NBQ0osVUFBVSxXQUFXLFFBQVE7Y0FDN0IsWUFBWSxXQUFXLFVBQVU7Y0FDakMsV0FBVyxXQUFXLFNBQVM7WUFDakM7VUFDRjtRQUNGO1FBQ0EsVUFBUyxXQUFXLEtBQUssR0FDckI7VUFBRSxTQUFTO1VBQU8sT0FBTyxXQUFXLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDbEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxXQUFXLElBQUk7UUFBQztRQUM3QztNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG9DQUFvQyxDQUFDO1FBQ3RFLE1BQU0sZUFBZSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7VUFDeEUsTUFBTTtZQUFFLFFBQVE7WUFBc0IsTUFBTSxDQUFDO1VBQUU7UUFDakQ7UUFDQSxVQUFTLGFBQWEsS0FBSyxHQUN2QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGFBQWEsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNwRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGFBQWEsSUFBSTtRQUFDO1FBQy9DO01BRUYseUJBQXlCO01BQ3pCLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxjQUFjLDJCQUEyQixDQUFDO1FBQzlELE1BQU0saUJBQWlCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLDZCQUE2QjtVQUNsRixNQUFNO1lBQUUsUUFBUSxXQUFXLE1BQU07WUFBRSxRQUFRO2NBQUUsU0FBUyxXQUFXLE9BQU87WUFBQztVQUFFO1FBQzdFO1FBQ0EsVUFBUyxlQUFlLEtBQUssR0FDekI7VUFBRSxTQUFTO1VBQU8sT0FBTyxlQUFlLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDdEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxlQUFlLElBQUk7UUFBQztRQUNqRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGdDQUFnQyxDQUFDO1FBQ2xFLE1BQU0sWUFBWSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyw4QkFBOEI7VUFDOUUsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsUUFBUTtjQUFFLFNBQVMsV0FBVyxPQUFPO1lBQUM7VUFBRTtRQUM3RTtRQUNBLFVBQVMsVUFBVSxLQUFLLEdBQ3BCO1VBQUUsU0FBUztVQUFPLE9BQU8sVUFBVSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ2pEO1VBQUUsU0FBUztVQUFNLFFBQVEsVUFBVSxJQUFJO1FBQUM7UUFDNUM7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywyQkFBMkIsQ0FBQztRQUM3RCxNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUM7VUFDckYsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsUUFBUTtjQUFFLFNBQVMsV0FBVyxPQUFPO1lBQUM7VUFBRTtRQUM3RTtRQUNBLFVBQVMsY0FBYyxLQUFLLEdBQ3hCO1VBQUUsU0FBUztVQUFPLE9BQU8sY0FBYyxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3JEO1VBQUUsU0FBUztVQUFNLFFBQVEsY0FBYyxJQUFJO1FBQUM7UUFDaEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxpQ0FBaUMsQ0FBQztRQUNuRSxNQUFNLGFBQWEsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMscUNBQXFDO1VBQ3RGLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLFFBQVE7Y0FBRSxTQUFTLFdBQVcsT0FBTztZQUFDO1VBQUU7UUFDN0U7UUFDQSxVQUFTLFdBQVcsS0FBSyxHQUNyQjtVQUFFLFNBQVM7VUFBTyxPQUFPLFdBQVcsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNsRDtVQUFFLFNBQVM7VUFBTSxRQUFRLFdBQVcsSUFBSTtRQUFDO1FBQzdDO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsNkJBQTZCLENBQUM7UUFDL0QsTUFBTSxnQkFBZ0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCO1VBQ2hGLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLFFBQVE7Y0FBRSxTQUFTLFdBQVcsT0FBTztZQUFDO1VBQUU7UUFDN0U7UUFDQSxVQUFTLGNBQWMsS0FBSyxHQUN4QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGNBQWMsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNyRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGNBQWMsSUFBSTtRQUFDO1FBQ2hEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMkJBQTJCLENBQUM7UUFDN0QsTUFBTSxlQUFlLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLDJCQUEyQjtVQUM5RSxNQUFNO1lBQUUsUUFBUSxXQUFXLE1BQU07WUFBRSxRQUFRO2NBQUUsU0FBUyxXQUFXLE9BQU87WUFBQztVQUFFO1FBQzdFO1FBQ0EsVUFBUyxhQUFhLEtBQUssR0FDdkI7VUFBRSxTQUFTO1VBQU8sT0FBTyxhQUFhLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDcEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxhQUFhLElBQUk7UUFBQztRQUMvQztNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHlCQUF5QixDQUFDO1FBQzNELE1BQU0sY0FBYyxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0M7VUFDbEYsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsUUFBUTtjQUFFLFNBQVMsV0FBVyxPQUFPO1lBQUM7VUFBRTtRQUM3RTtRQUNBLFVBQVMsWUFBWSxLQUFLLEdBQ3RCO1VBQUUsU0FBUztVQUFPLE9BQU8sWUFBWSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ25EO1VBQUUsU0FBUztVQUFNLFFBQVEsWUFBWSxJQUFJO1FBQUM7UUFDOUM7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyw4QkFBOEIsQ0FBQztRQUNoRSxNQUFNLGVBQWUsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCO1VBQ2hGLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLFFBQVE7Y0FBRSxTQUFTLFdBQVcsT0FBTztZQUFDO1VBQUU7UUFDN0U7UUFDQSxVQUFTLGFBQWEsS0FBSyxHQUN2QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGFBQWEsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNwRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGFBQWEsSUFBSTtRQUFDO1FBQy9DO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsbUNBQW1DLENBQUM7UUFDckUsTUFBTSxvQkFBb0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsMEJBQTBCO1VBQ2xGLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLFFBQVE7Y0FBRSxTQUFTLFdBQVcsT0FBTztZQUFDO1VBQUU7UUFDN0U7UUFDQSxVQUFTLGtCQUFrQixLQUFLLEdBQzVCO1VBQUUsU0FBUztVQUFPLE9BQU8sa0JBQWtCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDekQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxrQkFBa0IsSUFBSTtRQUFDO1FBQ3BEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsNkJBQTZCLENBQUM7UUFDL0QsTUFBTSxpQkFBaUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsb0NBQW9DO1VBQ3pGLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLFFBQVE7Y0FBRSxTQUFTLFdBQVcsT0FBTztZQUFDO1VBQUU7UUFDN0U7UUFDQSxVQUFTLGVBQWUsS0FBSyxHQUN6QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGVBQWUsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN0RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGVBQWUsSUFBSTtRQUFDO1FBQ2pEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsaUNBQWlDLENBQUM7UUFDbkUsTUFBTSxjQUFjLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLDJCQUEyQjtVQUM3RSxNQUFNO1lBQUUsUUFBUSxXQUFXLE1BQU07WUFBRSxRQUFRO2NBQUUsU0FBUyxXQUFXLE9BQU87WUFBQztVQUFFO1FBQzdFO1FBQ0EsVUFBUyxZQUFZLEtBQUssR0FDdEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxZQUFZLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDbkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxZQUFZLElBQUk7UUFBQztRQUM5QztNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGtDQUFrQyxDQUFDO1FBQ3BFLE1BQU0sY0FBYyxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7VUFDdkUsTUFBTTtZQUNKLFNBQVMsV0FBVyxPQUFPO1lBQzNCLHNCQUFzQixXQUFXLG9CQUFvQjtVQUN2RDtRQUNGO1FBQ0EsVUFBUyxZQUFZLEtBQUssR0FDdEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxZQUFZLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDbkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxZQUFZLElBQUk7UUFBQztRQUM5QztNQUVGLHVFQUF1RTtNQUN2RSwrQkFBK0I7TUFDL0IsdUVBQXVFO01BQ3ZFLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDBCQUEwQixFQUFFLFdBQVcsYUFBYSxFQUFFO1FBQ3ZGLE1BQU0sYUFBYSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywwQkFBMEI7VUFDM0UsTUFBTTtRQUNSO1FBQ0EsVUFBUyxXQUFXLEtBQUssR0FDckI7VUFBRSxTQUFTO1VBQU8sT0FBTyxXQUFXLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDbEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxXQUFXLElBQUk7UUFBQztRQUM3QztNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGtDQUFrQyxFQUFFLFdBQVcsYUFBYSxFQUFFO1FBQy9GLE1BQU0seUJBQXlCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtDQUFrQztVQUMvRixNQUFNO1FBQ1I7UUFDQSxVQUFTLHVCQUF1QixLQUFLLEdBQ2pDO1VBQUUsU0FBUztVQUFPLE9BQU8sdUJBQXVCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDOUQ7VUFBRSxTQUFTO1VBQU0sUUFBUSx1QkFBdUIsSUFBSTtRQUFDO1FBQ3pEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMEJBQTBCLENBQUM7UUFDNUQsTUFBTSxzQkFBc0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCO1VBQ2xGLE1BQU07UUFDUjtRQUNBLFVBQVMsb0JBQW9CLEtBQUssR0FDOUI7VUFBRSxTQUFTO1VBQU8sT0FBTyxvQkFBb0IsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMzRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG9CQUFvQixJQUFJO1FBQUM7UUFDdEQ7TUFFRix1RUFBdUU7TUFDdkUsMkNBQTJDO01BQzNDLHVFQUF1RTtNQUN2RSxLQUFLO01BQ0wsS0FBSztNQUNMLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHVCQUF1QixFQUFFLE1BQU07UUFDaEUsTUFBTSxlQUFlLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFpQjtVQUNwRSxNQUFNO1lBQUUsUUFBUTtZQUFNLEdBQUcsVUFBVTtVQUFDO1FBQ3RDO1FBQ0EsVUFBUyxhQUFhLEtBQUssR0FDdkI7VUFBRSxTQUFTO1VBQU8sT0FBTyxhQUFhLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDcEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxhQUFhLElBQUk7UUFBQztRQUMvQztNQUVGLHVFQUF1RTtNQUN2RSwrQkFBK0I7TUFDL0IsdUVBQXVFO01BQ3ZFLEtBQUs7UUFDSCwyQkFBMkI7UUFDM0IsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxxQ0FBcUMsQ0FBQztRQUN2RSxNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUI7VUFDdkUsTUFBTTtZQUNKLE1BQU0sV0FBVyxJQUFJO1lBQ3JCLFNBQVMsV0FBVyxPQUFPLElBQUk7WUFDL0IsUUFBUSxjQUFjLFdBQVcsS0FBSztZQUN0QyxVQUFVLGNBQWMsV0FBVztVQUNyQztRQUNGO1FBQ0EsVUFBUyxjQUFjLEtBQUssR0FDeEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxjQUFjLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDckQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxjQUFjLElBQUk7UUFBQztRQUNoRDtNQUVGLHVFQUF1RTtNQUN2RSw2QkFBNkI7TUFDN0IsdUVBQXVFO01BQ3ZFLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHFCQUFxQixDQUFDO1FBQ3ZELE1BQU0sZUFBZSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0I7VUFDdkUsTUFBTTtZQUFFLFFBQVE7WUFBVSxHQUFHLFVBQVU7VUFBQztRQUMxQztRQUNBLFVBQVMsYUFBYSxLQUFLLEdBQ3ZCO1VBQUUsU0FBUztVQUFPLE9BQU8sYUFBYSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3BEO1VBQUUsU0FBUztVQUFNLFFBQVEsYUFBYSxJQUFJO1FBQUM7UUFDL0M7TUFFRix1RUFBdUU7TUFDdkUseUJBQXlCO01BQ3pCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx5QkFBeUIsQ0FBQztRQUMzRCxNQUFNLGtCQUFrQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkI7VUFDbkYsTUFBTTtZQUFFLFFBQVE7WUFBa0IsR0FBRyxVQUFVO1VBQUM7UUFDbEQ7UUFDQSxVQUFTLGdCQUFnQixLQUFLLEdBQzFCO1VBQUUsU0FBUztVQUFPLE9BQU8sZ0JBQWdCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDdkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxnQkFBZ0IsSUFBSTtRQUFDO1FBQ2xEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsNkJBQTZCLEVBQUUsV0FBVyxXQUFXLEVBQUU7UUFDeEYsTUFBTSxpQkFBaUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCO1VBQ2xGLE1BQU07WUFBRSxRQUFRO1lBQW9CLEdBQUcsVUFBVTtVQUFDO1FBQ3BEO1FBQ0EsVUFBUyxlQUFlLEtBQUssR0FDekI7VUFBRSxTQUFTO1VBQU8sT0FBTyxlQUFlLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDdEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxlQUFlLElBQUk7UUFBQztRQUNqRDtNQUVGLHlCQUF5QjtNQUN6QixLQUFLO01BQ0wsS0FBSztNQUNMLEtBQUs7TUFDTCxLQUFLO01BQ0wsS0FBSztNQUNMLEtBQUs7TUFDTCxLQUFLO01BQ0wsS0FBSztNQUNMLEtBQUs7TUFDTCxLQUFLO01BQ0wsS0FBSztNQUNMLEtBQUs7TUFDTCxLQUFLO01BQ0wsS0FBSztRQUNILE1BQU0sY0FBYyxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUI7VUFDbkUsTUFBTTtZQUFFLFFBQVEsS0FBSyxPQUFPLENBQUMsS0FBSyxLQUFLLFdBQVc7WUFBSSxNQUFNO1VBQVc7UUFDekU7UUFDQSxVQUFTO1VBQUUsU0FBUztVQUFNLFFBQVEsWUFBWSxJQUFJO1FBQUM7UUFDbkQ7TUFFRix1RUFBdUU7TUFDdkUsNkJBQTZCO01BQzdCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxtQkFBbUIsRUFBRSxXQUFXLElBQUksRUFBRTtRQUN2RSxNQUFNLHVCQUF1QixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywyQkFBMkI7VUFDdEYsTUFBTTtZQUFFLFFBQVE7WUFBbUIsTUFBTTtVQUFXO1FBQ3REO1FBQ0EsVUFBUyxxQkFBcUIsS0FBSyxHQUMvQjtVQUFFLFNBQVM7VUFBTyxPQUFPLHFCQUFxQixLQUFLLENBQUMsT0FBTztRQUFDLElBQzVEO1VBQUUsU0FBUztVQUFNLFFBQVEscUJBQXFCLElBQUk7UUFBQztRQUN2RDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG9CQUFvQixFQUFFLFdBQVcsV0FBVyxJQUFJLFdBQVcsV0FBVyxJQUFJLE9BQU87UUFDbEgsTUFBTSx3QkFBd0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCO1VBQ3ZGLE1BQU07WUFBRSxRQUFRO1lBQW9CLE1BQU07VUFBVztRQUN2RDtRQUNBLFVBQVMsc0JBQXNCLEtBQUssR0FDaEM7VUFBRSxTQUFTO1VBQU8sT0FBTyxzQkFBc0IsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUM3RDtVQUFFLFNBQVM7VUFBTSxRQUFRLHNCQUFzQixJQUFJO1FBQUM7UUFDeEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxpQkFBaUIsRUFBRSxXQUFXLElBQUksRUFBRTtRQUNyRSxNQUFNLGVBQWUsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCO1VBQzlFLE1BQU07WUFBRSxRQUFRO1lBQW9CLE1BQU07Y0FBRSxhQUFhLFdBQVcsSUFBSTtZQUFDO1VBQUU7UUFDN0U7UUFDQSxVQUFTLGFBQWEsS0FBSyxHQUN2QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGFBQWEsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNwRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGFBQWEsSUFBSTtRQUFDO1FBQy9DO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsK0JBQStCLENBQUM7UUFDakUsTUFBTSxrQkFBa0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCO1VBQ2pGLE1BQU07WUFBRSxRQUFRO1lBQXVCLE1BQU07VUFBVztRQUMxRDtRQUNBLFVBQVMsZ0JBQWdCLEtBQUssR0FDMUI7VUFBRSxTQUFTO1VBQU8sT0FBTyxnQkFBZ0IsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN2RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGdCQUFnQixJQUFJO1FBQUM7UUFDbEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsY0FBYyx5QkFBeUIsRUFBRSxXQUFXLFNBQVMsRUFBRTtRQUNuRixNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywyQkFBMkI7VUFDL0UsTUFBTTtZQUFFLFFBQVE7WUFBd0IsTUFBTTtVQUFXO1FBQzNEO1FBQ0EsVUFBUyxjQUFjLEtBQUssR0FDeEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxjQUFjLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDckQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxjQUFjLElBQUk7UUFBQztRQUNoRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHNCQUFzQixDQUFDO1FBQ3hELE1BQU0sZUFBZSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywyQkFBMkI7VUFDOUUsTUFBTTtZQUFFLFFBQVE7WUFBZ0IsTUFBTSxDQUFDO1VBQUU7UUFDM0M7UUFDQSxVQUFTLGFBQWEsS0FBSyxHQUN2QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGFBQWEsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNwRDtVQUFFLFNBQVM7VUFBTSxRQUFRLGFBQWEsSUFBSTtRQUFDO1FBQy9DO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLGNBQWMsb0JBQW9CLEVBQUUsV0FBVyxTQUFTLEVBQUU7UUFDOUUsTUFBTSx3QkFBd0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsMkJBQTJCO1VBQ3ZGLE1BQU07WUFBRSxRQUFRO1lBQW9CLE1BQU07VUFBVztRQUN2RDtRQUNBLFVBQVMsc0JBQXNCLEtBQUssR0FDaEM7VUFBRSxTQUFTO1VBQU8sT0FBTyxzQkFBc0IsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUM3RDtVQUFFLFNBQVM7VUFBTSxRQUFRLHNCQUFzQixJQUFJO1FBQUM7UUFDeEQ7TUFFRix1RUFBdUU7TUFDdkUsOEJBQThCO01BQzlCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyw0QkFBNEIsRUFBRSxXQUFXLFdBQVcsRUFBRTtRQUN2RixNQUFNLGVBQWUsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUNBQWlDO1VBQ3BGLE1BQU07WUFDSixRQUFRO1lBQ1IsYUFBYSxXQUFXLFdBQVc7WUFDbkMsYUFBYSxXQUFXLFdBQVcsSUFBSTtZQUN2QyxrQkFBa0IsV0FBVyxnQkFBZ0IsSUFBSTtZQUNqRCxhQUFhLFdBQVcsV0FBVztVQUNyQztRQUNGO1FBQ0EsVUFBUyxhQUFhLEtBQUssR0FDdkI7VUFBRSxTQUFTO1VBQU8sT0FBTyxhQUFhLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDcEQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxhQUFhLElBQUk7UUFBQztRQUMvQztNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHVCQUF1QixDQUFDO1FBQ3pELE1BQU0scUJBQXFCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGlDQUFpQztVQUMxRixNQUFNO1lBQ0osUUFBUTtZQUNSLGFBQWEsV0FBVyxXQUFXO1VBQ3JDO1FBQ0Y7UUFDQSxVQUFTLG1CQUFtQixLQUFLLEdBQzdCO1VBQUUsU0FBUztVQUFPLE9BQU8sbUJBQW1CLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDMUQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxtQkFBbUIsSUFBSTtRQUFDO1FBQ3JEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsdUJBQXVCLEVBQUUsV0FBVyxXQUFXLEVBQUU7UUFDbEYsTUFBTSxpQkFBaUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUNBQWlDO1VBQ3RGLE1BQU07WUFDSixRQUFRO1lBQ1IsYUFBYSxXQUFXLFdBQVc7VUFDckM7UUFDRjtRQUNBLFVBQVMsZUFBZSxLQUFLLEdBQ3pCO1VBQUUsU0FBUztVQUFPLE9BQU8sZUFBZSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3REO1VBQUUsU0FBUztVQUFNLFFBQVEsZUFBZSxJQUFJO1FBQUM7UUFDakQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywwQkFBMEIsQ0FBQztRQUM1RCxNQUFNLGNBQWMsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsaUNBQWlDO1VBQ25GLE1BQU07WUFDSixRQUFRO1lBQ1IsYUFBYSxXQUFXLFdBQVcsSUFBSTtZQUN2QyxrQkFBa0IsV0FBVyxnQkFBZ0IsSUFBSTtVQUNuRDtRQUNGO1FBQ0EsVUFBUyxZQUFZLEtBQUssR0FDdEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxZQUFZLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDbkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxZQUFZLElBQUk7UUFBQztRQUM5QztNQUVGLHVFQUF1RTtNQUN2RSw0Q0FBNEM7TUFDNUMsdUVBQXVFO01BQ3ZFLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGlDQUFpQyxDQUFDO1FBQ25FLE1BQU0sdUJBQXVCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGdDQUFnQztVQUMzRixNQUFNO1lBQ0osUUFBUTtZQUNSLE1BQU07Y0FDSixHQUFHLFVBQVU7Y0FDYixvQkFBb0IscUJBQXFCO1lBQzNDO1VBQ0Y7UUFDRjtRQUNBLFVBQVMscUJBQXFCLEtBQUssR0FDL0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxxQkFBcUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUM1RDtVQUFFLFNBQVM7VUFBTSxRQUFRLHFCQUFxQixJQUFJO1FBQUM7UUFDdkQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx5QkFBeUIsQ0FBQztRQUMzRCxNQUFNLG9CQUFvQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0M7VUFDeEYsTUFBTTtZQUFFLFFBQVE7WUFBZ0IsTUFBTTtVQUFXO1FBQ25EO1FBQ0EsVUFBUyxrQkFBa0IsS0FBSyxHQUM1QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGtCQUFrQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3pEO1VBQUUsU0FBUztVQUFNLFFBQVEsa0JBQWtCLElBQUk7UUFBQztRQUNwRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDhCQUE4QixDQUFDO1FBQ2hFLE1BQU0sZ0JBQWdCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGdDQUFnQztVQUNwRixNQUFNO1lBQUUsUUFBUTtZQUFlLE1BQU07VUFBVztRQUNsRDtRQUNBLFVBQVMsY0FBYyxLQUFLLEdBQ3hCO1VBQUUsU0FBUztVQUFPLE9BQU8sY0FBYyxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3JEO1VBQUUsU0FBUztVQUFNLFFBQVEsY0FBYyxJQUFJO1FBQUM7UUFDaEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsY0FBYyxnQ0FBZ0MsQ0FBQztRQUNqRSxNQUFNLGtCQUFrQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0M7VUFDdEYsTUFBTTtZQUFFLFFBQVE7WUFBeUIsTUFBTTtVQUFXO1FBQzVEO1FBQ0EsVUFBUyxnQkFBZ0IsS0FBSyxHQUMxQjtVQUFFLFNBQVM7VUFBTyxPQUFPLGdCQUFnQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3ZEO1VBQUUsU0FBUztVQUFNLFFBQVEsZ0JBQWdCLElBQUk7UUFBQztRQUNsRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG9DQUFvQyxDQUFDO1FBQ3RFLE1BQU0sZ0JBQWdCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGdDQUFnQztVQUNwRixNQUFNO1lBQUUsUUFBUTtZQUF5QixNQUFNO2NBQUUsU0FBUyxXQUFXLE9BQU87WUFBQztVQUFFO1FBQ2pGO1FBQ0EsVUFBUyxjQUFjLEtBQUssR0FDeEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxjQUFjLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDckQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxjQUFjLElBQUk7UUFBQztRQUNoRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG1DQUFtQyxDQUFDO1FBQ3JFLE1BQU0sYUFBYSxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0M7VUFDakYsTUFBTTtZQUFFLFFBQVE7WUFBb0MsTUFBTSxDQUFDO1VBQUU7UUFDL0Q7UUFDQSxVQUFTLFdBQVcsS0FBSyxHQUNyQjtVQUFFLFNBQVM7VUFBTyxPQUFPLFdBQVcsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUNsRDtVQUFFLFNBQVM7VUFBTSxRQUFRLFdBQVcsSUFBSTtRQUFDO1FBQzdDO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLGNBQWMsa0NBQWtDLENBQUM7UUFDbkUsTUFBTSxnQkFBZ0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsZ0NBQWdDO1VBQ3BGLE1BQU07WUFBRSxRQUFRO1lBQXNCLE1BQU07VUFBVztRQUN6RDtRQUNBLFVBQVMsY0FBYyxLQUFLLEdBQ3hCO1VBQUUsU0FBUztVQUFPLE9BQU8sY0FBYyxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3JEO1VBQUUsU0FBUztVQUFNLFFBQVEsY0FBYyxJQUFJO1FBQUM7UUFDaEQ7TUFFRix1RUFBdUU7TUFDdkUsdUJBQXVCO01BQ3ZCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxvQkFBb0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtRQUMxRSxNQUFNLGlCQUFpQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7VUFDdkUsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsTUFBTTtZQUFZLFdBQVc7VUFBYztRQUNoRjtRQUNBLFVBQVMsZUFBZSxLQUFLLEdBQ3pCO1VBQUUsU0FBUztVQUFPLE9BQU8sZUFBZSxLQUFLLENBQUMsT0FBTztRQUFDLElBQ3REO1VBQUUsU0FBUztVQUFNLFFBQVEsZUFBZSxJQUFJO1FBQUM7UUFDakQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx3QkFBd0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtRQUM5RSxNQUFNLHFCQUFxQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7VUFDM0UsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsTUFBTTtZQUFZLFdBQVc7VUFBYztRQUNoRjtRQUNBLFVBQVMsbUJBQW1CLEtBQUssR0FDN0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxtQkFBbUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMxRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG1CQUFtQixJQUFJO1FBQUM7UUFDckQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxzQkFBc0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtRQUM1RSxNQUFNLG1CQUFtQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7VUFDekUsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsTUFBTTtZQUFZLFdBQVc7VUFBYztRQUNoRjtRQUNBLFVBQVMsaUJBQWlCLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxpQkFBaUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN4RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGlCQUFpQixJQUFJO1FBQUM7UUFDbkQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxrQkFBa0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtRQUN4RSxNQUFNLHNCQUFzQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7VUFDNUUsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsTUFBTTtZQUFZLFdBQVc7VUFBYztRQUNoRjtRQUNBLFVBQVMsb0JBQW9CLEtBQUssR0FDOUI7VUFBRSxTQUFTO1VBQU8sT0FBTyxvQkFBb0IsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMzRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG9CQUFvQixJQUFJO1FBQUM7UUFDdEQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx3QkFBd0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtRQUM5RSxNQUFNLHFCQUFxQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7VUFDM0UsTUFBTTtZQUFFLFFBQVEsV0FBVyxNQUFNO1lBQUUsTUFBTTtZQUFZLFdBQVc7VUFBYztRQUNoRjtRQUNBLFVBQVMsbUJBQW1CLEtBQUssR0FDN0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxtQkFBbUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMxRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG1CQUFtQixJQUFJO1FBQUM7UUFDckQ7TUFFRix1RUFBdUU7TUFDdkUsNEJBQTRCO01BQzVCLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx5QkFBeUIsRUFBRSxXQUFXLEtBQUssRUFBRTtRQUM5RSxNQUFNLG1CQUFtQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyx5QkFBeUI7VUFDaEYsTUFBTTtRQUNSO1FBQ0EsVUFBUyxpQkFBaUIsS0FBSyxHQUMzQjtVQUFFLFNBQVM7VUFBTyxPQUFPLGlCQUFpQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3hEO1VBQUUsU0FBUztVQUFNLFFBQVEsaUJBQWlCLElBQUk7UUFBQztRQUNuRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDBCQUEwQixDQUFDO1FBQzVELE1BQU0saUJBQWlCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLDRCQUE0QjtVQUNqRixNQUFNO1FBQ1I7UUFDQSxVQUFTLGVBQWUsS0FBSyxHQUN6QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGVBQWUsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUN0RDtVQUFFLFNBQVM7VUFBTSxRQUFRLGVBQWUsSUFBSTtRQUFDO1FBQ2pEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMEJBQTBCLEVBQUUsV0FBVyxNQUFNLEVBQUU7UUFDaEYsTUFBTSx1QkFBdUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1VBQzdFLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLE1BQU07WUFBWSxXQUFXO1VBQWM7UUFDaEY7UUFDQSxVQUFTLHFCQUFxQixLQUFLLEdBQy9CO1VBQUUsU0FBUztVQUFPLE9BQU8scUJBQXFCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDNUQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxxQkFBcUIsSUFBSTtRQUFDO1FBQ3ZEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMscUJBQXFCLEVBQUUsV0FBVyxNQUFNLEVBQUU7UUFDM0UsTUFBTSxrQkFBa0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1VBQ3hFLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLE1BQU07WUFBWSxXQUFXO1VBQWM7UUFDaEY7UUFDQSxVQUFTLGdCQUFnQixLQUFLLEdBQzFCO1VBQUUsU0FBUztVQUFPLE9BQU8sZ0JBQWdCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDdkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxnQkFBZ0IsSUFBSTtRQUFDO1FBQ2xEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMEJBQTBCLEVBQUUsV0FBVyxNQUFNLEVBQUU7UUFDaEYsTUFBTSx1QkFBdUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1VBQzdFLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLE1BQU07WUFBWSxXQUFXO1VBQWM7UUFDaEY7UUFDQSxVQUFTLHFCQUFxQixLQUFLLEdBQy9CO1VBQUUsU0FBUztVQUFPLE9BQU8scUJBQXFCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDNUQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxxQkFBcUIsSUFBSTtRQUFDO1FBQ3ZEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsd0JBQXdCLEVBQUUsV0FBVyxNQUFNLEVBQUU7UUFDOUUsTUFBTSxxQkFBcUIsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1VBQzNFLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLE1BQU07WUFBWSxXQUFXO1VBQWM7UUFDaEY7UUFDQSxVQUFTLG1CQUFtQixLQUFLLEdBQzdCO1VBQUUsU0FBUztVQUFPLE9BQU8sbUJBQW1CLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDMUQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxtQkFBbUIsSUFBSTtRQUFDO1FBQ3JEO01BRUYsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMscUJBQXFCLEVBQUUsV0FBVyxNQUFNLEVBQUU7UUFDM0UsTUFBTSxrQkFBa0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1VBQ3hFLE1BQU07WUFBRSxRQUFRLFdBQVcsTUFBTTtZQUFFLE1BQU07WUFBWSxXQUFXO1VBQWM7UUFDaEY7UUFDQSxVQUFTLGdCQUFnQixLQUFLLEdBQzFCO1VBQUUsU0FBUztVQUFPLE9BQU8sZ0JBQWdCLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDdkQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxnQkFBZ0IsSUFBSTtRQUFDO1FBQ2xEO01BRUYsdUVBQXVFO01BQ3ZFLGlDQUFpQztNQUNqQyx1RUFBdUU7TUFDdkUsS0FBSztRQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMkJBQTJCLENBQUM7UUFDN0QsTUFBTSxvQkFBb0IsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCO1VBQ3JGLE1BQU07WUFDSixNQUFNLFdBQVcsSUFBSSxJQUFJO1lBQ3pCLE9BQU8sV0FBVyxLQUFLLElBQUk7WUFDM0IsYUFBYSxXQUFXLFdBQVcsSUFBSTtVQUN6QztRQUNGO1FBQ0EsVUFBUyxrQkFBa0IsS0FBSyxHQUM1QjtVQUFFLFNBQVM7VUFBTyxPQUFPLGtCQUFrQixLQUFLLENBQUMsT0FBTztRQUFDLElBQ3pEO1VBQUUsU0FBUztVQUFNLFFBQVEsa0JBQWtCLElBQUk7UUFBQztRQUNwRDtNQUdGLHlFQUF5RTtNQUN6RSxLQUFLO1FBQWtDO1VBQ3JDLElBQUk7WUFDRixNQUFNLFlBQVksS0FBSyxVQUFVLElBQUk7WUFDckMsUUFBUSxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUUsVUFBVSwwQkFBMEIsQ0FBQztZQUVsRSxNQUFNLFdBQVcsTUFBTSxNQUFNLDhDQUE4QztjQUN6RSxRQUFRO2NBQ1IsU0FBUztnQkFBRSxnQkFBZ0I7Y0FBbUI7Y0FDOUMsTUFBTSxLQUFLLFNBQVMsQ0FBQztnQkFBRSxZQUFZO2NBQVU7Y0FDN0MsUUFBUSxZQUFZLE9BQU8sQ0FBQyxRQUFRLG1CQUFtQjtZQUN6RDtZQUVBLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtjQUNoQixPQUFPO2dCQUNMLFNBQVM7Z0JBQ1QsT0FBTyxDQUFDLDZCQUE2QixFQUFFLFNBQVMsTUFBTSxDQUFDLENBQUMsRUFBRSxTQUFTLFVBQVUsRUFBRTtjQUNqRjtZQUNGO1lBRUEsTUFBTSxPQUFPLE1BQU0sU0FBUyxJQUFJO1lBRWhDLE9BQU87Y0FDTCxTQUFTO2NBQ1QsU0FBUyxDQUFDLDhCQUE4QixFQUFFLFVBQVUsd0JBQXdCLENBQUM7Y0FDN0UsV0FBVyxLQUFLLFNBQVM7Y0FDekIsbUJBQW1CLEtBQUssTUFBTSxFQUFFLFVBQVU7Y0FDMUMseUJBQXlCLEtBQUssYUFBYSxFQUFFLFVBQVU7Y0FDdkQsc0JBQXNCLEtBQUssT0FBTyxJQUFJO2NBQ3RDLFNBQVM7WUFDWDtVQUNGLEVBQUUsT0FBTyxPQUFPO1lBQ2QsUUFBUSxLQUFLLENBQUMsaUNBQWlDO1lBQy9DLE9BQU87Y0FDTCxTQUFTO2NBQ1QsT0FBTyxDQUFDLGdDQUFnQyxFQUFFLE1BQU0sT0FBTyxFQUFFO1lBQzNEO1VBQ0Y7UUFDRjtNQUVBLEtBQUs7UUFBd0I7VUFDM0IsSUFBSTtZQUNGLFFBQVEsR0FBRyxDQUFDO1lBRVosd0JBQXdCO1lBQ3hCLE1BQU0saUJBQWlCLE1BQU0sTUFBTSxnREFBZ0Q7Y0FDakYsUUFBUTtjQUNSLFNBQVM7Z0JBQUUsZ0JBQWdCO2NBQW1CO2NBQzlDLFFBQVEsWUFBWSxPQUFPLENBQUM7WUFDOUI7WUFFQSxvQkFBb0I7WUFDcEIsTUFBTSxpQkFBaUIsTUFBTSxNQUFNLCtDQUErQztjQUNoRixRQUFRO2NBQ1IsU0FBUztnQkFBRSxnQkFBZ0I7Y0FBbUI7Y0FDOUMsUUFBUSxZQUFZLE9BQU8sQ0FBQztZQUM5QjtZQUVBLE1BQU0sYUFBYSxlQUFlLEVBQUUsR0FBRyxNQUFNLGVBQWUsSUFBSSxLQUFLO2NBQUUsUUFBUSxFQUFFO1lBQUM7WUFDbEYsTUFBTSxhQUFhLGVBQWUsRUFBRSxHQUFHLE1BQU0sZUFBZSxJQUFJLEtBQUs7Y0FBRSxRQUFRO1lBQVU7WUFFekYsT0FBTztjQUNMLFNBQVM7Y0FDVCxrQkFBa0IsV0FBVyxNQUFNLElBQUk7Y0FDdkMsU0FBUyxXQUFXLE9BQU8sSUFBSTtjQUMvQixjQUFjLFdBQVcsTUFBTSxFQUFFLFVBQVU7Y0FDM0MsUUFBUSxXQUFXLE1BQU0sSUFBSSxFQUFFO2NBQy9CLFdBQVcsSUFBSSxPQUFPLFdBQVc7Y0FDakMsZ0JBQWdCO2NBQ2hCLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLE1BQU0sRUFBRSxVQUFVLEVBQUUsa0JBQWtCLENBQUM7WUFDbEY7VUFDRixFQUFFLE9BQU8sT0FBTztZQUNkLFFBQVEsS0FBSyxDQUFDLCtCQUErQjtZQUM3QyxPQUFPO2NBQ0wsU0FBUztjQUNULE9BQU8sQ0FBQyxnQ0FBZ0MsRUFBRSxNQUFNLE9BQU8sRUFBRTtZQUMzRDtVQUNGO1FBQ0Y7TUFFQSxLQUFLO1FBQTBCO1VBQzdCLElBQUk7WUFDRixNQUFNLFdBQVcsS0FBSyxTQUFTLElBQUk7WUFDbkMsUUFBUSxHQUFHLENBQUMsQ0FBQyxzQ0FBc0MsRUFBRSxTQUFTLElBQUksQ0FBQztZQUVuRSxNQUFNLFdBQVcsTUFBTSxNQUFNLGdEQUFnRDtjQUMzRSxRQUFRO2NBQ1IsU0FBUztnQkFBRSxnQkFBZ0I7Y0FBbUI7Y0FDOUMsUUFBUSxZQUFZLE9BQU8sQ0FBQztZQUM5QjtZQUVBLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtjQUNoQixPQUFPO2dCQUNMLFNBQVM7Z0JBQ1QsT0FBTyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsTUFBTSxFQUFFO2NBQ2pEO1lBQ0Y7WUFFQSxNQUFNLE9BQU8sTUFBTSxTQUFTLElBQUk7WUFDaEMsSUFBSSxTQUFTLEtBQUssTUFBTSxJQUFJLEVBQUU7WUFFOUIsZ0JBQWdCO1lBQ2hCLElBQUksYUFBYSxVQUFVO2NBQ3pCLFNBQVMsT0FBTyxNQUFNLENBQUMsQ0FBQSxJQUFLLEVBQUUsTUFBTSxLQUFLLFlBQVksRUFBRSxNQUFNLEtBQUs7WUFDcEUsT0FBTyxJQUFJLGFBQWEsWUFBWTtjQUNsQyxTQUFTLE9BQU8sTUFBTSxDQUFDLENBQUEsSUFBSyxFQUFFLE1BQU0sS0FBSywwQkFBMEIsRUFBRSxJQUFJLEtBQUs7WUFDaEYsT0FBTyxJQUFJLGFBQWEsVUFBVTtjQUNoQyxTQUFTLE9BQU8sTUFBTSxDQUFDLENBQUEsSUFBSyxFQUFFLElBQUksS0FBSyxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsU0FBUztZQUM1RSxPQUFPLElBQUksYUFBYSxZQUFZO2NBQ2xDLFNBQVMsT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQU0sQ0FBQyxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsSUFBSSxDQUFDO1lBQ3JFO1lBRUEsT0FBTztjQUNMLFNBQVM7Y0FDVCxjQUFjLE9BQU8sTUFBTTtjQUMzQixnQkFBZ0I7Y0FDaEIsUUFBUTtjQUNSLGVBQWUsT0FBTyxHQUFHLENBQUMsQ0FBQSxJQUFLLENBQUM7a0JBQzlCLE1BQU0sRUFBRSxJQUFJLElBQUksRUFBRSxZQUFZO2tCQUM5QixNQUFNLEVBQUUsSUFBSTtrQkFDWixRQUFRLEVBQUUsTUFBTTtrQkFDaEIsUUFBUSxFQUFFLE1BQU07Z0JBQ2xCLENBQUM7Y0FDRCxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sTUFBTSxDQUFDLHlCQUF5QixFQUFFLFVBQVU7WUFDdkU7VUFDRixFQUFFLE9BQU8sT0FBTztZQUNkLFFBQVEsS0FBSyxDQUFDLGlDQUFpQztZQUMvQyxPQUFPO2NBQ0wsU0FBUztjQUNULE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLE9BQU8sRUFBRTtZQUNuRDtVQUNGO1FBQ0Y7TUFFQSx1RUFBdUU7TUFDdkUsbUNBQW1DO01BQ25DLHVFQUF1RTtNQUN2RSxLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx1QkFBdUIsRUFBRSxXQUFXLFVBQVUsSUFBSSxFQUFFLE1BQU0sQ0FBQztRQUM1RixNQUFNLGdCQUFnQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0I7VUFDMUUsTUFBTTtZQUFFLFlBQVksS0FBSyxHQUFHLENBQUMsV0FBVyxVQUFVLElBQUksR0FBRztVQUFJO1FBQy9EO1FBQ0EsVUFBUyxjQUFjLEtBQUssR0FDeEI7VUFBRSxTQUFTO1VBQU8sT0FBTyxjQUFjLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDckQ7VUFBRSxTQUFTO1VBQU0sUUFBUSxjQUFjLElBQUk7UUFBQztRQUNoRDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDhCQUE4QixDQUFDO1FBQ2hFLE1BQU0sdUJBQXVCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLDRCQUE0QjtVQUN2RixNQUFNO1lBQ0osZUFBZSxXQUFXLGFBQWE7WUFDdkMsbUJBQW1CLFdBQVcsaUJBQWlCLElBQUk7WUFDbkQsVUFBVSxXQUFXLFFBQVEsSUFBSTtVQUNuQztRQUNGO1FBQ0EsVUFBUyxxQkFBcUIsS0FBSyxHQUMvQjtVQUFFLFNBQVM7VUFBTyxPQUFPLHFCQUFxQixLQUFLLENBQUMsT0FBTztRQUFDLElBQzVEO1VBQUUsU0FBUztVQUFNLFFBQVEscUJBQXFCLElBQUk7UUFBQztRQUN2RDtNQUVGLEtBQUs7UUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHFCQUFxQixDQUFDO1FBQ3ZELE1BQU0scUJBQXFCLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFpQjtVQUFFLE1BQU0sQ0FBQztRQUFFO1FBQ3ZGLFVBQVMsbUJBQW1CLEtBQUssR0FDN0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxtQkFBbUIsS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMxRDtVQUFFLFNBQVM7VUFBTSxRQUFRLG1CQUFtQixJQUFJO1FBQUM7UUFDckQ7TUFFRixLQUFLO1FBQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsY0FBYyx1QkFBdUIsRUFBRSxZQUFZLFVBQVUsWUFBWTtRQUMzRixNQUFNLHFCQUFxQixNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7VUFDOUUsTUFBTTtZQUNKLFFBQVEsWUFBWSxVQUFVO1lBQzlCLFVBQVUsWUFBWTtZQUN0QixlQUFlLFlBQVk7WUFDM0IsVUFBVSxZQUFZO1lBQ3RCLGtCQUFrQixZQUFZO1lBQzlCLG1CQUFtQixZQUFZO1VBQ2pDO1FBQ0Y7UUFDQSxVQUFTLG1CQUFtQixLQUFLLEdBQzdCO1VBQUUsU0FBUztVQUFPLE9BQU8sbUJBQW1CLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDMUQ7VUFBRSxTQUFTO1VBQU0sR0FBRyxtQkFBbUIsSUFBSTtRQUFDO1FBQ2hEO01BRUYsdUVBQXVFO01BQ3ZFLHlEQUF5RDtNQUN6RCx1RUFBdUU7TUFDdkUsS0FBSztRQUF5QjtVQUM1QixRQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxjQUFjLHdCQUF3QixFQUFFLFdBQVcsTUFBTSxFQUFFLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQztVQUNoRyxNQUFNLFlBQVksTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1lBQ2xFLE1BQU07Y0FDSixRQUFRO2NBQ1IsUUFBUSxXQUFXLE1BQU07Y0FDekIsYUFBYSxXQUFXLEtBQUssSUFBSTtjQUNqQyxjQUFjLFdBQVcsWUFBWSxJQUFJO1lBQzNDO1VBQ0Y7VUFDQSxJQUFJLFVBQVUsS0FBSyxFQUFFO1lBQ25CLFVBQVM7Y0FBRSxTQUFTO2NBQU8sT0FBTyxVQUFVLEtBQUssQ0FBQyxPQUFPO1lBQUM7VUFDNUQsT0FBTztZQUNMLE1BQU0sSUFBSSxVQUFVLElBQUksRUFBRSxRQUFRLFVBQVUsSUFBSTtZQUNoRCxVQUFTO2NBQ1AsU0FBUztjQUNULFdBQVcsR0FBRyxhQUFhLEdBQUcsUUFBUSxhQUFhO2NBQ25ELFVBQVUsR0FBRyxZQUFZO2NBQ3pCLE9BQU8sV0FBVyxLQUFLLElBQUk7Y0FDM0IsUUFBUSxXQUFXLE1BQU07Y0FDekIsUUFBUTtZQUNWO1VBQ0Y7VUFDQTtRQUNGO01BRUEsS0FBSztRQUF5QjtVQUM1QixRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHdCQUF3QixFQUFFLFdBQVcsTUFBTSxFQUFFLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQztVQUMvRixNQUFNLFlBQVksTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1lBQ2xFLE1BQU07Y0FDSixRQUFRO2NBQ1IsUUFBUSxXQUFXLE1BQU07Y0FDekIsYUFBYSxXQUFXLEtBQUssSUFBSTtjQUNqQyxrQkFBa0IsV0FBVyxnQkFBZ0IsSUFBSTtjQUNqRCxjQUFjLFdBQVcsWUFBWSxJQUFJO1lBQzNDO1VBQ0Y7VUFDQSxJQUFJLFVBQVUsS0FBSyxFQUFFO1lBQ25CLFVBQVM7Y0FBRSxTQUFTO2NBQU8sT0FBTyxVQUFVLEtBQUssQ0FBQyxPQUFPO1lBQUM7VUFDNUQsT0FBTztZQUNMLE1BQU0sSUFBSSxVQUFVLElBQUksRUFBRSxRQUFRLFVBQVUsSUFBSTtZQUNoRCxVQUFTO2NBQ1AsU0FBUztjQUNULGdCQUFnQixHQUFHLGtCQUFrQixHQUFHLFFBQVEsa0JBQWtCO2NBQ2xFLFFBQVEsR0FBRyxVQUFVLEdBQUcsUUFBUSxVQUFVO2NBQzFDLFNBQVM7Y0FDVCxRQUFRO1lBQ1Y7VUFDRjtVQUNBO1FBQ0Y7TUFFQSxLQUFLO1FBQTZCO1VBQ2hDLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLGNBQWMsc0JBQXNCLEVBQUUsV0FBVyxjQUFjLEVBQUU7VUFDckYsTUFBTSxlQUFlLE1BQU0sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtZQUNyRSxNQUFNO2NBQ0osUUFBUTtjQUNSLGdCQUFnQixXQUFXLGNBQWM7WUFDM0M7VUFDRjtVQUNBLElBQUksYUFBYSxLQUFLLEVBQUU7WUFDdEIsVUFBUztjQUFFLFNBQVM7Y0FBTyxPQUFPLGFBQWEsS0FBSyxDQUFDLE9BQU87WUFBQztVQUMvRCxPQUFPO1lBQ0wsTUFBTSxJQUFJLGFBQWEsSUFBSSxFQUFFLE1BQU0sVUFBVSxhQUFhLElBQUksRUFBRSxRQUFRLGFBQWEsSUFBSTtZQUN6RixNQUFNLFlBQXNCLEdBQUcsYUFBYSxFQUFFO1lBQzlDLFVBQVM7Y0FDUCxTQUFTO2NBQ1QsUUFBUSxHQUFHLFVBQVU7Y0FDckIsTUFBTSxHQUFHLFdBQVc7Y0FDcEI7Y0FDQSxVQUFVLFNBQVMsQ0FBQyxFQUFFLElBQUk7Y0FDMUIsZ0JBQWdCLFdBQVcsY0FBYztjQUN6QyxRQUFRO1lBQ1Y7VUFDRjtVQUNBO1FBQ0Y7TUFFQSx1RUFBdUU7TUFDdkUsNEVBQTRFO01BQzVFLHVFQUF1RTtNQUN2RSxLQUFLO1FBQW9CO1VBQ3ZCLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMseUNBQXlDLENBQUM7VUFDM0UsTUFBTSxXQUFXLFdBQVcsU0FBUyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsRUFBRSxLQUFLLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJO1VBQzlHLE1BQU0sY0FBYyxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7WUFDcEUsTUFBTTtjQUNKLFFBQVE7Y0FDUixTQUFTLFdBQVcsT0FBTztjQUMzQixXQUFXO2NBQ1gsVUFBVTtnQkFDUixTQUFTO2dCQUNULEdBQUksV0FBVyxRQUFRLElBQUksQ0FBQyxDQUFDO2NBQy9CO1lBQ0Y7VUFDRjtVQUNBLFVBQVMsWUFBWSxLQUFLLEdBQ3RCO1lBQUUsU0FBUztZQUFPLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxZQUFZLEtBQUssQ0FBQyxPQUFPLEVBQUU7VUFBQyxJQUM5RTtZQUNBLFNBQVM7WUFDVCxXQUFXO1lBQ1gsWUFBWSxZQUFZLElBQUksRUFBRTtZQUM5QixRQUFRO1lBQ1IsU0FBUztZQUNULFFBQVEsWUFBWSxJQUFJO1VBQzFCO1VBQ0Y7UUFDRjtNQUVBLEtBQUs7UUFBd0I7VUFDM0IsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx5Q0FBeUMsRUFBRSxXQUFXLFNBQVMsRUFBRTtVQUNsRyxJQUFJLENBQUMsV0FBVyxTQUFTLEVBQUU7WUFDekIsVUFBUztjQUFFLFNBQVM7Y0FBTyxPQUFPO1lBQTJGO1lBQzdIO1VBQ0Y7VUFDQSxNQUFNLGNBQWMsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1lBQ3BFLE1BQU07Y0FDSixRQUFRO2NBQ1IsV0FBVyxXQUFXLFNBQVM7WUFDakM7VUFDRjtVQUNBLFVBQVMsWUFBWSxLQUFLLEdBQ3RCO1lBQUUsU0FBUztZQUFPLE9BQU8sQ0FBQyw0QkFBNEIsRUFBRSxZQUFZLEtBQUssQ0FBQyxPQUFPLEVBQUU7VUFBQyxJQUNwRjtZQUNBLFNBQVM7WUFDVCxXQUFXLENBQUMsQ0FBQyxZQUFZLElBQUksRUFBRTtZQUMvQixPQUFPLFlBQVksSUFBSSxFQUFFLFNBQVM7WUFDbEMsV0FBVyxXQUFXLFNBQVM7WUFDL0IsUUFBUSxZQUFZLElBQUksRUFBRSxRQUFRLFlBQVk7WUFDOUMsUUFBUSxZQUFZLElBQUk7VUFDMUI7VUFDRjtRQUNGO01BRUE7UUFDRSxRQUFRLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGdCQUFnQixFQUFFLE1BQU07UUFDMUQsVUFBUztVQUNQLFNBQVM7VUFDVCxPQUFPLENBQUMsY0FBYyxFQUFFLEtBQUssdWxCQUF1bEIsQ0FBQztRQUN2bkI7SUFDSjtJQUdBLE1BQU0sZ0JBQWdCLEtBQUssR0FBRyxLQUFLO0lBRW5DLDJDQUEyQztJQUMzQyxJQUFJLFFBQU8sS0FBSyxJQUFJLENBQUMsUUFBTyxjQUFjLEVBQUU7TUFDMUMsUUFBTyxjQUFjLEdBQUcseUJBQXlCLE1BQU0sUUFBTyxLQUFLLEVBQUU7SUFDdkU7SUFFQSxxQkFBcUI7SUFDckIsTUFBTSxpQkFBaUIsVUFBVTtNQUMvQixlQUFlO01BQ2YsZ0JBQWdCO01BQ2hCLFlBQVk7TUFDWixTQUFTLFFBQU8sT0FBTyxLQUFLO01BQzVCLG1CQUFtQjtNQUNuQixZQUFZO01BQ1osZ0JBQWdCLFFBQU8sT0FBTyxHQUFHLCtCQUErQixRQUFPLEtBQUs7TUFDNUUsVUFBVSxRQUFPLGNBQWMsR0FBRztRQUFFLGdCQUFnQixRQUFPLGNBQWM7TUFBQyxJQUFJO0lBQ2hGO0lBRUEsT0FBTztFQUVULEVBQUUsT0FBTyxPQUFPO0lBQ2QsTUFBTSxnQkFBZ0IsS0FBSyxHQUFHLEtBQUs7SUFDbkMsTUFBTSxlQUFlLGlCQUFpQixRQUFRLE1BQU0sT0FBTyxHQUFHO0lBQzlELE1BQU0sZ0JBQWdCLHlCQUF5QixNQUFNLGNBQWM7SUFFbkUsUUFBUSxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsY0FBYywyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0lBRXhFLHVCQUF1QjtJQUN2QixNQUFNLGlCQUFpQixVQUFVO01BQy9CLGVBQWU7TUFDZixnQkFBZ0I7TUFDaEIsWUFBWTtNQUNaLFNBQVM7TUFDVCxtQkFBbUI7TUFDbkIsWUFBWTtNQUNaLGVBQWU7TUFDZixVQUFVO1FBQUUsZ0JBQWdCO01BQWM7SUFDNUM7SUFFQSxPQUFPO01BQ0wsU0FBUztNQUNULE9BQU87TUFDUCxnQkFBZ0I7SUFDbEI7RUFDRjtBQUNGO0FBRUEsdUVBQXVFO0FBQ3ZFLE9BQU8sZUFBZSxtQkFBbUIsSUFBWSxFQUFFLFVBQWUsRUFBRSxRQUFhLEVBQUUsYUFBcUI7RUFDMUcsT0FBUTtJQUNOLEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG9CQUFvQixFQUFFLFdBQVcsTUFBTSxFQUFFO01BQzFFLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtRQUNqRCxNQUFNO1VBQUUsUUFBUSxXQUFXLE1BQU07VUFBRSxNQUFNO1VBQVksV0FBVztRQUFjO01BQ2hGLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FBRztVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUFJO1VBQUUsU0FBUztVQUFNLFFBQVEsSUFBSSxJQUFJO1FBQUM7SUFFckgsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsd0JBQXdCLEVBQUUsV0FBVyxNQUFNLEVBQUU7TUFDOUUsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1FBQ2pELE1BQU07VUFBRSxRQUFRLFdBQVcsTUFBTTtVQUFFLE1BQU07VUFBWSxXQUFXO1FBQWM7TUFDaEYsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUFHO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztRQUFDLElBQUk7VUFBRSxTQUFTO1VBQU0sUUFBUSxJQUFJLElBQUk7UUFBQztJQUVySCxLQUFLO01BQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxzQkFBc0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtNQUM1RSxPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7UUFDakQsTUFBTTtVQUFFLFFBQVEsV0FBVyxNQUFNO1VBQUUsTUFBTTtVQUFZLFdBQVc7UUFBYztNQUNoRixHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFBSTtVQUFFLFNBQVM7VUFBTSxRQUFRLElBQUksSUFBSTtRQUFDO0lBRXJILEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLGtCQUFrQixFQUFFLFdBQVcsTUFBTSxFQUFFO01BQ3hFLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtRQUNqRCxNQUFNO1VBQUUsUUFBUSxXQUFXLE1BQU07VUFBRSxNQUFNO1VBQVksV0FBVztRQUFjO01BQ2hGLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FBRztVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUFJO1VBQUUsU0FBUztVQUFNLFFBQVEsSUFBSSxJQUFJO1FBQUM7SUFFckgsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsd0JBQXdCLEVBQUUsV0FBVyxNQUFNLEVBQUU7TUFDOUUsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1FBQ2pELE1BQU07VUFBRSxRQUFRLFdBQVcsTUFBTTtVQUFFLE1BQU07VUFBWSxXQUFXO1FBQWM7TUFDaEYsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUFHO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztRQUFDLElBQUk7VUFBRSxTQUFTO1VBQU0sUUFBUSxJQUFJLElBQUk7UUFBQztJQUVySCxLQUFLO01BQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYywwQkFBMEIsRUFBRSxXQUFXLE1BQU0sRUFBRTtNQUNoRixPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7UUFDakQsTUFBTTtVQUFFLFFBQVEsV0FBVyxNQUFNO1VBQUUsTUFBTTtVQUFZLFdBQVc7UUFBYztNQUNoRixHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFBSTtVQUFFLFNBQVM7VUFBTSxRQUFRLElBQUksSUFBSTtRQUFDO0lBRXJILEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHFCQUFxQixFQUFFLFdBQVcsTUFBTSxFQUFFO01BQzNFLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtRQUNqRCxNQUFNO1VBQUUsUUFBUSxXQUFXLE1BQU07VUFBRSxNQUFNO1VBQVksV0FBVztRQUFjO01BQ2hGLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FBRztVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUFJO1VBQUUsU0FBUztVQUFNLFFBQVEsSUFBSSxJQUFJO1FBQUM7SUFFckgsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMEJBQTBCLEVBQUUsV0FBVyxNQUFNLEVBQUU7TUFDaEYsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1FBQ2pELE1BQU07VUFBRSxRQUFRLFdBQVcsTUFBTTtVQUFFLE1BQU07VUFBWSxXQUFXO1FBQWM7TUFDaEYsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUFHO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztRQUFDLElBQUk7VUFBRSxTQUFTO1VBQU0sUUFBUSxJQUFJLElBQUk7UUFBQztJQUVySCxLQUFLO01BQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx3QkFBd0IsRUFBRSxXQUFXLE1BQU0sRUFBRTtNQUM5RSxPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7UUFDakQsTUFBTTtVQUFFLFFBQVEsV0FBVyxNQUFNO1VBQUUsTUFBTTtVQUFZLFdBQVc7UUFBYztNQUNoRixHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFBSTtVQUFFLFNBQVM7VUFBTSxRQUFRLElBQUksSUFBSTtRQUFDO0lBRXJILEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHFCQUFxQixFQUFFLFdBQVcsTUFBTSxFQUFFO01BQzNFLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtRQUNqRCxNQUFNO1VBQUUsUUFBUSxXQUFXLE1BQU07VUFBRSxNQUFNO1VBQVksV0FBVztRQUFjO01BQ2hGLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FBRztVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUFJO1VBQUUsU0FBUztVQUFNLFFBQVEsSUFBSSxJQUFJO1FBQUM7SUFFckgsdUVBQXVFO0lBQ3ZFLDRCQUE0QjtJQUM1Qix1RUFBdUU7SUFDdkUsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMkJBQTJCLENBQUM7TUFDN0QsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsK0JBQStCO1FBQzlELE1BQU07VUFBRSxRQUFRO1VBQWdCLE1BQU07WUFBRSxhQUFhLFdBQVcsV0FBVztZQUFFLGNBQWM7VUFBVztRQUFFO01BQzFHLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FBRztVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUFJO1VBQUUsU0FBUztVQUFNLFFBQVEsSUFBSSxJQUFJO1FBQUM7SUFFckgsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsNEJBQTRCLENBQUM7TUFDOUQsSUFBSSxXQUFXLGNBQWMsRUFBRTtRQUM3QixPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywrQkFBK0I7VUFDOUQsTUFBTTtZQUFFLFFBQVE7WUFBc0IsTUFBTTtjQUFFLGdCQUFnQixXQUFXLGNBQWM7Y0FBRSxTQUFTO1lBQVc7VUFBRTtRQUNqSCxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7WUFBRSxTQUFTO1lBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1VBQUMsSUFBSTtZQUFFLFNBQVM7WUFBTSxRQUFRLElBQUksSUFBSTtVQUFDO01BQ3JILE9BQU87UUFDTCxpQ0FBaUM7UUFDakMsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsK0JBQStCO1VBQzlELE1BQU07WUFBRSxRQUFRO1lBQXdCLE1BQU07Y0FBRSxhQUFhLFdBQVcsV0FBVztZQUFDO1VBQUU7UUFDeEYsR0FBRyxJQUFJLENBQUMsQ0FBQztVQUNQLElBQUksWUFBWSxJQUFJLEVBQUUsT0FBTyxJQUFJO1lBQy9CLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLCtCQUErQjtjQUM5RCxNQUFNO2dCQUFFLFFBQVE7Z0JBQXNCLE1BQU07a0JBQUUsZ0JBQWdCLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2tCQUFFLFNBQVM7Z0JBQVc7Y0FBRTtZQUNqSCxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7Z0JBQUUsU0FBUztnQkFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87Y0FBQyxJQUFJO2dCQUFFLFNBQVM7Z0JBQU0sUUFBUSxJQUFJLElBQUk7Y0FBQztVQUNySDtVQUNBLE9BQU87WUFBRSxTQUFTO1lBQU8sT0FBTztVQUE4QztRQUNoRjtNQUNGO0lBRUYsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMkJBQTJCLENBQUM7TUFDN0QsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsK0JBQStCO1FBQzlELE1BQU07VUFBRSxRQUFRO1VBQXFCLE1BQU07UUFBVztNQUN4RCxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFBSTtVQUFFLFNBQVM7VUFBTSxRQUFRLElBQUksSUFBSTtRQUFDO0lBRXJILEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxjQUFjLDRCQUE0QixDQUFDO01BQzdELElBQUksQ0FBQyxXQUFXLHFCQUFxQixFQUFFO1FBQ3JDLE9BQU87VUFBRSxTQUFTO1VBQU8sT0FBTztRQUE0RDtNQUM5RjtNQUNBLElBQUksV0FBVyxjQUFjLEVBQUU7UUFDN0IsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsK0JBQStCO1VBQzlELE1BQU07WUFBRSxRQUFRO1lBQXNCLE1BQU07Y0FBRSxnQkFBZ0IsV0FBVyxjQUFjO2NBQUUsU0FBUztnQkFBRSxvQkFBb0I7Z0JBQWEsdUJBQXVCO2NBQUs7WUFBRTtVQUFFO1FBQ3ZLLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FBRztZQUFFLFNBQVM7WUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87VUFBQyxJQUFJO1lBQUUsU0FBUztZQUFNLFFBQVEsSUFBSSxJQUFJO1VBQUM7TUFDckgsT0FBTztRQUNMLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLCtCQUErQjtVQUM5RCxNQUFNO1lBQUUsUUFBUTtZQUF3QixNQUFNO2NBQUUsYUFBYSxXQUFXLFdBQVc7WUFBQztVQUFFO1FBQ3hGLEdBQUcsSUFBSSxDQUFDLENBQUM7VUFDUCxJQUFJLFlBQVksSUFBSSxFQUFFLE9BQU8sSUFBSTtZQUMvQixPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQywrQkFBK0I7Y0FDOUQsTUFBTTtnQkFBRSxRQUFRO2dCQUFzQixNQUFNO2tCQUFFLGdCQUFnQixZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtrQkFBRSxTQUFTO29CQUFFLG9CQUFvQjtvQkFBYSx1QkFBdUI7a0JBQUs7Z0JBQUU7Y0FBRTtZQUN2SyxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7Z0JBQUUsU0FBUztnQkFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87Y0FBQyxJQUFJO2dCQUFFLFNBQVM7Z0JBQU0sUUFBUSxJQUFJLElBQUk7Y0FBQztVQUNySDtVQUNBLE9BQU87WUFBRSxTQUFTO1lBQU8sT0FBTztVQUF1QztRQUN6RTtNQUNGO0lBRUYsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsZ0NBQWdDLENBQUM7TUFDbEUsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsK0JBQStCO1FBQzlELE1BQU07VUFBRSxRQUFRO1VBQTBCLE1BQU07UUFBVztNQUM3RCxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQUc7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFBSTtVQUFFLFNBQVM7VUFBTSxRQUFRLElBQUksSUFBSTtRQUFDO0lBRXJILHVFQUF1RTtJQUN2RSw0QkFBNEI7SUFDNUIsdUVBQXVFO0lBQ3ZFLEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLHlCQUF5QixFQUFFLFdBQVcsWUFBWSxFQUFFO01BQ3JGLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHNCQUFzQjtRQUNyRCxNQUFNO01BQ1IsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUFHO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztRQUFDLElBQUk7VUFBRSxTQUFTO1VBQU0sUUFBUSxJQUFJLElBQUk7UUFBQztJQUVySCx1RUFBdUU7SUFDdkUsd0RBQXdEO0lBQ3hELHVFQUF1RTtJQUN2RSxLQUFLO0lBQ0wsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMscUJBQXFCLEVBQUUsV0FBVyxNQUFNLElBQUksVUFBVTtNQUN2RixNQUFNLG1CQUFtQix1QkFBdUIsWUFBWTtNQUM1RCxPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7UUFDcEQsTUFBTTtNQUNSLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1VBQUUscUJBQXFCO1FBQUssSUFDdEUsSUFBSSxJQUFJO0lBRWQsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsc0NBQXNDLEVBQUUsV0FBVyxNQUFNLEVBQUU7TUFDNUYsTUFBTSxlQUFlLHVCQUF1QixZQUFZO01BQ3hELE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHFCQUFxQjtRQUNwRCxNQUFNO01BQ1IsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUMzQjtVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87VUFBRSxxQkFBcUI7UUFBSyxJQUN0RSxJQUFJLElBQUk7SUFFZCxLQUFLO01BQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyx1Q0FBdUMsRUFBRSxXQUFXLE1BQU0sRUFBRTtNQUM3RixNQUFNLGdCQUFnQix1QkFBdUIsWUFBWTtNQUN6RCxPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7UUFDcEQsTUFBTTtNQUNSLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1VBQUUscUJBQXFCO1FBQUssSUFDdEUsSUFBSSxJQUFJO0lBRWQsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMseUNBQXlDLEVBQUUsV0FBVyxNQUFNLEVBQUU7TUFDL0YsTUFBTSxrQkFBa0IsdUJBQXVCLFlBQVk7TUFDM0QsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMscUJBQXFCO1FBQ3BELE1BQU07TUFDUixHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQzNCO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztVQUFFLHFCQUFxQjtRQUFLLElBQ3RFLElBQUksSUFBSTtJQUVkLEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLDJCQUEyQixDQUFDO01BQzdELE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLHFCQUFxQjtRQUNwRCxNQUFNO1VBQUUsUUFBUTtRQUFTO01BQzNCLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDM0MsSUFBSSxJQUFJO0lBRWQsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMEJBQTBCLEVBQUUsV0FBVyxhQUFhLElBQUksT0FBTztNQUNoRyxPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0I7UUFDdkQsTUFBTTtVQUNKLGVBQWUsV0FBVyxhQUFhO1VBQ3ZDLFVBQVUsV0FBVyxRQUFRO1FBQy9CO01BQ0YsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUFHO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztRQUFDLElBQUksSUFBSSxJQUFJO0lBRTNGLHVFQUF1RTtJQUN2RSx1REFBdUQ7SUFDdkQsdUVBQXVFO0lBQ3ZFLEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG1CQUFtQixFQUFFLFdBQVcsS0FBSyxJQUFJLGtCQUFrQjtNQUM1RixPQUFPLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0I7UUFDakQsTUFBTTtVQUNKLFVBQVU7WUFBQztjQUFFLE1BQU07Y0FBUSxTQUFTLFdBQVcsTUFBTTtZQUFDO1dBQUU7VUFDeEQsT0FBTyxXQUFXLEtBQUssSUFBSTtVQUMzQixhQUFhLFdBQVcsV0FBVyxJQUFJO1VBQ3ZDLGNBQWMsV0FBVyxhQUFhO1FBQ3hDO01BQ0YsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUMzQjtVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMzQztVQUFFLFNBQVM7VUFBTSxVQUFVLElBQUksSUFBSSxFQUFFLFFBQVEsU0FBUyxDQUFDLEVBQUUsRUFBRSxTQUFTO1VBQVMsT0FBTyxJQUFJLElBQUksRUFBRSxRQUFRO1VBQU8sVUFBVTtRQUFTO0lBRXRJLEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLCtEQUErRCxDQUFDO01BQ2pHLE9BQU87UUFBRSxTQUFTO1FBQU8sT0FBTztNQUFvRjtJQUV0SCx1RUFBdUU7SUFDdkUseURBQXlEO0lBQ3pELHVFQUF1RTtJQUN2RSxLQUFLO01BQ0gsUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsY0FBYywwQkFBMEIsRUFBRSxXQUFXLE1BQU0sRUFBRSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUM7TUFDdEcsT0FBTyxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1FBQ2pELE1BQU07VUFDSixRQUFRO1VBQ1IsUUFBUSxXQUFXLE1BQU07VUFDekIsYUFBYSxXQUFXLEtBQUssSUFBSTtVQUNqQyxjQUFjLFdBQVcsWUFBWSxJQUFJO1FBQzNDO01BQ0YsR0FBRyxJQUFJLENBQUMsQ0FBQyxNQUFhLElBQUksS0FBSyxHQUMzQjtVQUFFLFNBQVM7VUFBTyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU87UUFBQyxJQUMzQztVQUNBLFNBQVM7VUFDVCxRQUFRLElBQUksSUFBSSxFQUFFLE1BQU0sWUFBWTtZQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTO1dBQUMsR0FBRyxFQUFFO1VBQ2xFLE9BQU8sSUFBSSxJQUFJLEVBQUUsTUFBTSxZQUFZLElBQUk7VUFDdkMsTUFBTSxJQUFJLElBQUksRUFBRSxNQUFNLFFBQVEsU0FBUyxDQUFDLEVBQUUsRUFBRSxTQUFTLFdBQVc7VUFDaEUsVUFBVTtRQUNaO0lBRUosdUVBQXVFO0lBQ3ZFLHFEQUFxRDtJQUNyRCx1RUFBdUU7SUFDdkUsS0FBSztNQUNILFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsMEJBQTBCLEVBQUUsV0FBVyxNQUFNLEVBQUUsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDO01BQ3JHLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtRQUNqRCxNQUFNO1VBQ0osUUFBUTtVQUNSLFFBQVEsV0FBVyxNQUFNO1VBQ3pCLGFBQWEsV0FBVyxLQUFLLElBQUk7VUFDakMsY0FBYyxXQUFXLFlBQVksSUFBSTtVQUN6QyxrQkFBa0IsV0FBVyxnQkFBZ0IsSUFBSTtRQUNuRDtNQUNGLEdBQUcsSUFBSSxDQUFDLENBQUMsTUFBYSxJQUFJLEtBQUssR0FDM0I7VUFBRSxTQUFTO1VBQU8sT0FBTyxJQUFJLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDM0M7VUFDQSxTQUFTO1VBQ1QsY0FBYyxJQUFJLElBQUksRUFBRSxNQUFNO1VBQzlCLGdCQUFnQixJQUFJLElBQUksRUFBRSxNQUFNO1VBQ2hDLFNBQVMsSUFBSSxJQUFJLEVBQUUsTUFBTSxXQUFXO1VBQ3BDLFVBQVU7UUFDWjtJQUVKLEtBQUs7TUFDSCxRQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxjQUFjLHlCQUF5QixFQUFFLFdBQVcsY0FBYyxFQUFFO01BQ3hGLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQjtRQUNqRCxNQUFNO1VBQ0osUUFBUTtVQUNSLGdCQUFnQixXQUFXLGNBQWM7UUFDM0M7TUFDRixHQUFHLElBQUksQ0FBQyxDQUFDLE1BQWEsSUFBSSxLQUFLLEdBQzNCO1VBQUUsU0FBUztVQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztRQUFDLElBQzNDO1VBQ0EsU0FBUztVQUNULE1BQU0sSUFBSSxJQUFJLEVBQUUsTUFBTSxXQUFXO1VBQ2pDLFdBQVcsSUFBSSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUMsRUFBRTtVQUN6QyxZQUFZLElBQUksSUFBSSxFQUFFLE1BQU07VUFDNUIsT0FBTyxJQUFJLElBQUksRUFBRSxNQUFNO1VBQ3ZCLFVBQVU7UUFDWjtJQUVKLHVFQUF1RTtJQUN2RSw0REFBNEQ7SUFDNUQsdUVBQXVFO0lBQ3ZFLEtBQUs7TUFBb0I7UUFDdkIsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyw2QkFBNkIsQ0FBQztRQUMvRCxNQUFNLGVBQWUsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCO1VBQ3JFLE1BQU07WUFDSixRQUFRO1lBQ1IsU0FBUyxXQUFXLE9BQU87WUFDM0IsV0FBVyxXQUFXLFNBQVM7WUFDL0IsYUFBYSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ25ELFVBQVUsV0FBVyxRQUFRLElBQUksQ0FBQztVQUNwQztRQUNGO1FBQ0EsU0FBUyxhQUFhLEtBQUssR0FDdkI7VUFBRSxTQUFTO1VBQU8sT0FBTyxhQUFhLEtBQUssQ0FBQyxPQUFPO1FBQUMsSUFDcEQ7VUFDQSxTQUFTO1VBQ1QsUUFBUSxhQUFhLElBQUk7VUFDekIsS0FBSyxDQUFDLHlDQUF5QyxFQUFFLGFBQWEsSUFBSSxFQUFFLFVBQVUsOENBQThDLENBQUM7UUFDL0g7UUFDRjtNQUNGO0lBRUEsS0FBSztNQUF3QjtRQUMzQixRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLCtCQUErQixFQUFFLFdBQVcsU0FBUyxFQUFFO1FBQ3hGLDJGQUEyRjtRQUMzRixNQUFNLEVBQUUsTUFBTSxTQUFTLEVBQUUsT0FBTyxRQUFRLEVBQUUsR0FBRyxNQUFNLFNBQ2hELElBQUksQ0FBQyxrQkFDTCxNQUFNLENBQUMscUNBQ1AsRUFBRSxDQUFDLFdBQVcsWUFDZCxNQUFNLENBQUMsd0JBQXdCLE1BQU0sV0FBVyxTQUFTLEVBQ3pELE1BQU0sQ0FBQyx1QkFBdUIsTUFBTSxRQUNwQyxLQUFLLENBQUMsY0FBYztVQUFFLFdBQVc7UUFBTSxHQUN2QyxLQUFLLENBQUM7UUFFVCxJQUFJLFVBQVU7VUFDWixTQUFTO1lBQUUsU0FBUztZQUFPLE9BQU8sU0FBUyxPQUFPO1VBQUM7UUFDckQsT0FBTyxJQUFJLENBQUMsYUFBYSxVQUFVLE1BQU0sS0FBSyxHQUFHO1VBQy9DLFNBQVM7WUFBRSxTQUFTO1lBQU0sT0FBTztZQUFPLFNBQVM7VUFBdUQ7UUFDMUcsT0FBTztVQUNMLE1BQU0sUUFBUSxTQUFTLENBQUMsRUFBRTtVQUMxQixlQUFlO1VBQ2YsTUFBTSxTQUFTLElBQUksQ0FBQyxrQkFBa0IsTUFBTSxDQUFDO1lBQUUsU0FBUztVQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sTUFBTSxFQUFFO1VBQ2pGLFNBQVM7WUFBRSxTQUFTO1lBQU0sT0FBTztZQUFNLE9BQU8sTUFBTSxPQUFPO1lBQUUsVUFBVSxNQUFNLEVBQUU7WUFBRSxZQUFZLE1BQU0sVUFBVTtVQUFDO1FBQ2hIO1FBQ0E7TUFDRjtJQUdBLEtBQUs7TUFBbUI7UUFDdEIsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxxQkFBcUIsRUFBRSxXQUFXLElBQUksRUFBRTtRQUN6RSxNQUFNLEVBQUUsTUFBTSxNQUFNLEVBQUUsT0FBTyxPQUFPLEVBQUUsR0FBRyxNQUFNLFNBQVMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUI7VUFDNUYsTUFBTTtZQUNKLFFBQVE7WUFDUixNQUFNLFdBQVcsSUFBSTtZQUNyQixNQUFNLFdBQVcsSUFBSTtZQUNyQixhQUFhLFdBQVcsV0FBVztZQUNuQyxVQUFVLFdBQVcsUUFBUSxJQUFJLENBQUM7WUFDbEMsa0JBQWtCLFdBQVcsZ0JBQWdCLElBQUk7VUFDbkQ7UUFDRjtRQUNBLFNBQVMsVUFDTDtVQUFFLFNBQVM7VUFBTyxPQUFPLFFBQVEsT0FBTztRQUFDLElBQ3pDO1VBQUUsU0FBUztVQUFNLEdBQUcsTUFBTTtRQUFDO1FBQy9CO01BQ0Y7SUFFQSxLQUFLO01BQW9CO1FBQ3ZCLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMsdUJBQXVCLEVBQUUsV0FBVyxLQUFLLEVBQUU7UUFDNUUsTUFBTSxFQUFFLE1BQU0sTUFBTSxFQUFFLE9BQU8sT0FBTyxFQUFFLEdBQUcsTUFBTSxTQUFTLFNBQVMsQ0FBQyxNQUFNLENBQUMscUJBQXFCO1VBQzVGLE1BQU07WUFDSixRQUFRO1lBQ1IsT0FBTyxXQUFXLEtBQUs7WUFDdkIsTUFBTSxXQUFXLElBQUk7WUFDckIsT0FBTyxXQUFXLEtBQUssSUFBSTtVQUM3QjtRQUNGO1FBQ0EsU0FBUyxVQUNMO1VBQUUsU0FBUztVQUFPLE9BQU8sUUFBUSxPQUFPO1FBQUMsSUFDekM7VUFBRSxTQUFTO1VBQU0sR0FBRyxNQUFNO1FBQUM7UUFDL0I7TUFDRjtJQUVBO01BRUUseURBQXlEO01BQ3pELE1BQU0sZ0JBQWdCLHdCQUF3QixJQUFJLENBQUMsQ0FBQSxJQUFLLEVBQUUsSUFBSSxLQUFLO01BQ25FLElBQUksZUFBZTtRQUNqQixRQUFRLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxjQUFjLG1DQUFtQyxFQUFFLE1BQU07UUFDNUUsUUFBUSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxVQUFVLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxZQUFZLFNBQVMsQ0FBQyxHQUFHO1FBRXRGLE9BQU8sU0FBUyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU07VUFDckMsTUFBTTtRQUNSLEdBQUcsSUFBSSxDQUFDLENBQUM7VUFDUCxJQUFJLElBQUksS0FBSyxFQUFFO1lBQ2IsUUFBUSxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsY0FBYyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksS0FBSztZQUM3RSxPQUFPO2NBQUUsU0FBUztjQUFPLE9BQU8sSUFBSSxLQUFLLENBQUMsT0FBTztZQUFDO1VBQ3BEO1VBQ0EsT0FBTztZQUFFLFNBQVM7WUFBTSxRQUFRLElBQUksSUFBSTtZQUFFLFFBQVE7VUFBbUI7UUFDdkU7TUFDRjtNQUVBLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLGNBQWMscUJBQXFCLEVBQUUsTUFBTTtNQUMvRCxPQUFPO0VBQ1g7QUFDRiJ9
// denoCacheMetadata=8588590592280828981,324195899499169810
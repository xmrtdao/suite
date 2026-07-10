/**
 * Eliza's Tool Definitions - Single Source of Truth
 * 
 * All AI endpoints (lovable-chat, gemini-chat, deepseek-chat, etc.) should import
 * ELIZA_TOOLS from this file to ensure consistent tool availability across all AI services.
 * 
 * ⚡ CRITICAL: ALL TOOLS EXECUTE REAL FUNCTIONS, NOT SIMULATIONS
 * - Tools appear in "🐍 Eliza's Code Execution Log" sidebar monitor
 * - Eliza MUST wait for actual results before responding to user
 * - Chat shows analysis/outcomes, not raw code (code is in execution log)
 */ export const ELIZA_TOOLS = [
  // ====================================================================
  // 🚀 STAE - SUITE TASK AUTOMATION ENGINE TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'create_task_from_template',
      description: '📋 STAE: Create a new task using a predefined template. Automatically fills in checklist, required skills, priority, and stage based on template category. Use this for consistent, standardized task creation.',
      parameters: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            description: 'Template name: code_review, bug_fix, feature_implementation, infrastructure_check, deployment_pipeline, research_analysis, proposal_evaluation, operations_task, system_health_investigation, mining_optimization, device_integration',
            enum: [
              'code_review',
              'bug_fix',
              'feature_implementation',
              'infrastructure_check',
              'deployment_pipeline',
              'research_analysis',
              'proposal_evaluation',
              'operations_task',
              'system_health_investigation',
              'mining_optimization',
              'device_integration'
            ]
          },
          title: {
            type: 'string',
            description: 'Task title - will be substituted into template description'
          },
          description: {
            type: 'string',
            description: 'Optional: Override template description with custom text'
          },
          priority: {
            type: 'number',
            description: 'Optional: Override default priority (1-10, higher = more urgent)'
          },
          auto_assign: {
            type: 'boolean',
            description: 'Optional: Automatically assign to best-matching agent (default: true)'
          }
        },
        required: [
          'template_name',
          'title'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'smart_assign_task',
      description: '🤖 STAE: Intelligently assign a task to the best-matching agent using weighted scoring: skills (40%), workload (30%), success rate (20%), activity (10%). Use this for optimal agent-task matching.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'UUID of the task to assign'
          },
          prefer_agent_id: {
            type: 'string',
            description: 'Optional: Prefer this agent if they meet minimum skill criteria'
          },
          min_skill_match: {
            type: 'number',
            description: 'Optional: Minimum skill overlap required (0-1, default: 0.3 = 30%)'
          }
        },
        required: [
          'task_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_automation_metrics',
      description: '📊 STAE: Get comprehensive automation coverage metrics including template usage rate, auto-assignment rate, knowledge extraction rate, agent utilization, and average completion time.',
      parameters: {
        type: 'object',
        properties: {
          time_window_hours: {
            type: 'number',
            description: 'Optional: Time window for metrics (default: 24 hours)'
          },
          breakdown_by: {
            type: 'string',
            enum: [
              'category',
              'agent',
              'template'
            ],
            description: 'Optional: Group metrics by category, agent, or template'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task_checklist',
      description: '✅ STAE Phase 2: Update a task checklist item status. Mark items as completed or uncompleted to track progress.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'UUID of the task'
          },
          item_index: {
            type: 'number',
            description: 'Index of checklist item (0-based)'
          },
          item_text: {
            type: 'string',
            description: 'Alternative: exact text of checklist item'
          },
          completed: {
            type: 'boolean',
            description: 'Whether item is completed (true) or not (false)'
          }
        },
        required: [
          'task_id',
          'completed'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resolve_blocked_task',
      description: '🔓 STAE Phase 2: Attempt to auto-resolve a blocked task. Analyzes blocker reason and applies resolution rules for github, api, dependency issues.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'UUID of the blocked task to resolve'
          }
        },
        required: [
          'task_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_stae_recommendations',
      description: '💡 STAE Phase 3: Get optimization recommendations for agents, templates, and workload. Identifies low performers, skill gaps, and imbalances.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'advance_task_stage',
      description: '⏩ STAE Phase 2: Manually advance a task to the next pipeline stage (DISCUSS→PLAN→EXECUTE→VERIFY→INTEGRATE).',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'UUID of the task to advance'
          },
          target_stage: {
            type: 'string',
            enum: [
              'DISCUSS',
              'PLAN',
              'EXECUTE',
              'VERIFY',
              'INTEGRATE'
            ],
            description: 'Optional: specific stage to advance to'
          }
        },
        required: [
          'task_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delegate_to_specialist',
      description: '🤝 MANAGER-SPECIALIST PROTOCOL: Delegate a complex sub-task to a SuperDuper Specialist Agent. Use this when you (the Manager) need specific expertise (e.g., "social-viral" for tweets, "code-architect" for system design, "finance" for analysis).',
      parameters: {
        type: 'object',
        properties: {
          specialist_role: {
            type: 'string',
            enum: [
              'social-viral',
              'code-architect',
              'business-growth',
              'finance-investment',
              'design-brand',
              'content-media',
              'communication-outreach',
              'research-intelligence',
              'integration',
              'development-coach',
              'domain-experts'
            ],
            description: 'The specific specialist role to handle this task.'
          },
          task_description: {
            type: 'string',
            description: 'Clear, concise instructions for the specialist.'
          },
          context_data: {
            type: 'object',
            description: 'Any necessary JSON context (previous results, code snippets, user requirements) for the specialist to do their job.'
          }
        },
        required: [
          'specialist_role',
          'task_description'
        ]
      }
    }
  },
  // ====================================================================
  // 🧠 KNOWLEDGE MANAGEMENT TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'store_knowledge',
      description: '🧠 Store a piece of knowledge, fact, or insight into the persistent knowledge base for future recall. Use this when you learn something important about the user, their business, preferences, or any factual information worth remembering.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Short descriptive title for this knowledge item (e.g. "User prefers async communication")'
          },
          type: {
            type: 'string',
            description: 'Category of knowledge: fact, preference, insight, entity, relationship, process, or other',
            enum: [
              'fact',
              'preference',
              'insight',
              'entity',
              'relationship',
              'process',
              'other'
            ]
          },
          description: {
            type: 'string',
            description: 'Full text content of the knowledge to store'
          },
          metadata: {
            type: 'object',
            description: 'Optional key-value pairs for additional context (e.g. source, tags, related entity names)'
          },
          confidence_score: {
            type: 'number',
            description: 'Confidence level from 0.0 to 1.0 (default 0.8)'
          }
        },
        required: [
          'name',
          'type',
          'description'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: '🔍 Search the persistent knowledge base for stored facts, preferences, or insights. Use this to recall previous information about the user or topics before answering questions.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language search query (e.g. "user budget preferences" or "XMRT token details")'
          },
          type: {
            type: 'string',
            description: 'Optional filter by knowledge type: fact, preference, insight, entity, relationship, process, other'
          },
          limit: {
            type: 'number',
            description: 'Max results to return (default 5, max 20)'
          }
        },
        required: [
          'query'
        ]
      }
    }
  },
  // ====================================================================
  // 🎯 CONVERSATIONAL USER ACQUISITION TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'qualify_lead',
      description: '🎯 Score a potential customer based on conversation signals (budget, urgency, company size, use case complexity). Returns lead score 0-100 and qualification level.',
      parameters: {
        type: 'object',
        properties: {
          session_key: {
            type: 'string',
            description: 'Current conversation session key'
          },
          user_signals: {
            type: 'object',
            description: 'Signals detected from conversation',
            properties: {
              mentioned_budget: {
                type: 'boolean',
                description: 'User mentioned budget or willingness to pay'
              },
              has_urgent_need: {
                type: 'boolean',
                description: 'User expressed urgency or time pressure'
              },
              company_mentioned: {
                type: 'string',
                description: 'Company name if mentioned'
              },
              use_case_complexity: {
                type: 'string',
                enum: [
                  'simple',
                  'moderate',
                  'complex'
                ],
                description: 'Complexity of their use case'
              }
            }
          }
        },
        required: [
          'session_key'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'identify_service_interest',
      description: '🔍 Analyze user message to detect interest in specific monetized services. Returns service names with confidence scores.',
      parameters: {
        type: 'object',
        properties: {
          user_message: {
            type: 'string',
            description: 'Current user message to analyze'
          },
          conversation_history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: {
                  type: 'string'
                },
                content: {
                  type: 'string'
                }
              }
            },
            description: 'Optional: recent conversation messages for context'
          },
          session_key: {
            type: 'string',
            description: 'Session key to track services interested in'
          }
        },
        required: [
          'user_message'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_tier_based_on_needs',
      description: '💡 Recommend optimal pricing tier based on estimated usage and budget. Returns tier recommendation with reasoning.',
      parameters: {
        type: 'object',
        properties: {
          estimated_monthly_usage: {
            type: 'number',
            description: 'Estimated API calls per month'
          },
          budget_range: {
            type: 'string',
            enum: [
              'budget-conscious',
              'moderate',
              'premium',
              'enterprise'
            ],
            description: 'User budget category'
          },
          feature_requirements: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional: specific features needed'
          }
        },
        required: [
          'estimated_monthly_usage',
          'budget_range'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_user_profile_from_session',
      description: '👤 Convert anonymous session to identified user profile. Collects email and links session to user_profiles table.',
      parameters: {
        type: 'object',
        properties: {
          session_key: {
            type: 'string',
            description: 'Current session key'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          }
        },
        required: [
          'session_key',
          'email'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_stripe_payment_link',
      description: '💳 Generate Stripe checkout link for tier upgrade. Returns shareable payment URL with optional trial period.',
      parameters: {
        type: 'object',
        properties: {
          customer_email: {
            type: 'string',
            format: 'email',
            description: 'Customer email'
          },
          tier: {
            type: 'string',
            enum: [
              'basic',
              'pro',
              'enterprise'
            ],
            description: 'Tier to purchase'
          },
          service_name: {
            type: 'string',
            description: 'Service being purchased'
          },
          trial_days: {
            type: 'number',
            description: 'Optional: number of trial days (default 0)'
          },
          session_key: {
            type: 'string',
            description: 'Session key for tracking conversion'
          },
          api_key: {
            type: 'string',
            description: 'API key to upgrade after payment'
          }
        },
        required: [
          'customer_email',
          'tier',
          'service_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_onboarding_progress',
      description: '📊 Track user activation milestones (API key received, first call, integration complete, value realized).',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to check progress for'
          }
        },
        required: [
          'api_key'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_usage_alert',
      description: '⚠️ Notify user about quota usage (75% warning, exceeded, or upsell opportunity).',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to check usage for'
          },
          alert_type: {
            type: 'string',
            enum: [
              'quota_warning',
              'quota_exceeded',
              'upsell'
            ],
            description: 'Type of alert to send'
          }
        },
        required: [
          'api_key',
          'alert_type'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'link_api_key_to_conversation',
      description: '🔗 Associate an API key with the current conversation session for attribution tracking.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to link'
          },
          session_key: {
            type: 'string',
            description: 'Current session key'
          }
        },
        required: [
          'api_key',
          'session_key'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apply_retention_discount',
      description: '🎁 Offer discount to at-risk customer to prevent churn.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key for customer'
          },
          discount_percent: {
            type: 'number',
            description: 'Discount percentage (e.g., 20 for 20% off)'
          },
          duration_months: {
            type: 'number',
            description: 'How many months discount applies'
          }
        },
        required: [
          'api_key',
          'discount_percent',
          'duration_months'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_edge_function_logs',
      description: '📋 Retrieve execution logs for a specific edge function with comprehensive error analysis, performance metrics, and actionable recommendations. Essential for debugging, monitoring, and verifying fixes.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Name of the edge function to retrieve logs for (e.g., "github-integration", "task-orchestrator")'
          },
          time_window_hours: {
            type: 'number',
            description: 'Time window for log retrieval in hours. Default: 24',
            default: 24
          },
          status_filter: {
            type: 'string',
            enum: [
              'all',
              'success',
              'error'
            ],
            description: 'Filter logs by status. Default: all',
            default: 'all'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of log entries to retrieve. Default: 100',
            default: 100
          },
          include_stack_traces: {
            type: 'boolean',
            description: 'Include full stack traces in error analysis. Default: true',
            default: true
          }
        },
        required: [
          'function_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_function_version_analytics',
      description: '📊 Analyze edge function performance across different versions to detect regressions and identify optimal versions for rollback. Returns success rates, execution times, error patterns, and actionable recommendations.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Name of the edge function to analyze (e.g., "github-integration", "task-orchestrator")'
          },
          version: {
            type: 'string',
            description: 'OPTIONAL: Specific version to analyze. If omitted, analyzes all versions.'
          },
          compare_versions: {
            type: 'boolean',
            description: 'Whether to compare all versions and detect regressions. Default: true'
          },
          time_window_hours: {
            type: 'number',
            description: 'Time window for analysis in hours. Default: 168 (7 days)'
          },
          min_calls_threshold: {
            type: 'number',
            description: 'Minimum calls required for a version to be analyzed. Default: 10'
          }
        },
        required: [
          'function_name'
        ]
      }
    }
  },
  // ====================================================================
  // 💰 REVENUE GENERATION TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'generate_service_api_key',
      description: '💰 Generate a new API key for a monetized service with tiered access control. Tiers: free (100/mo), basic ($10, 1K/mo), pro ($50, 10K/mo), enterprise ($500, unlimited).',
      parameters: {
        type: 'object',
        properties: {
          service_name: {
            type: 'string',
            description: 'Service to monetize (e.g., "uspto-patent-mcp", "lovable-chat", "python-executor")'
          },
          tier: {
            type: 'string',
            enum: [
              'free',
              'basic',
              'pro',
              'enterprise'
            ],
            description: 'Access tier'
          },
          owner_email: {
            type: 'string',
            format: 'email',
            description: 'Customer email address'
          },
          owner_name: {
            type: 'string',
            description: 'Optional customer name'
          }
        },
        required: [
          'service_name',
          'tier',
          'owner_email'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'validate_service_api_key',
      description: 'Check if an API key is valid, active, and has remaining quota. Returns tier, quota remaining, and validation status.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to validate'
          }
        },
        required: [
          'api_key'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'track_service_usage',
      description: 'Log API usage and update quota for a customer. Automatically increments usage counter and logs metadata.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'Customer API key'
          },
          service_name: {
            type: 'string',
            description: 'Service being used'
          },
          endpoint: {
            type: 'string',
            description: 'API endpoint called'
          },
          tokens_used: {
            type: 'number',
            description: 'Optional: number of tokens/credits consumed'
          },
          response_time_ms: {
            type: 'number',
            description: 'Optional: response time in milliseconds'
          },
          status_code: {
            type: 'number',
            description: 'Optional: HTTP status code'
          }
        },
        required: [
          'api_key',
          'service_name',
          'endpoint'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_service_usage_stats',
      description: 'Get detailed usage statistics for a customer API key including quota remaining, recent usage, and tier info.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to check'
          }
        },
        required: [
          'api_key'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'upgrade_service_tier',
      description: 'Upgrade a customer to a higher tier (free → basic → pro → enterprise). Automatically updates quota.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to upgrade'
          },
          new_tier: {
            type: 'string',
            enum: [
              'basic',
              'pro',
              'enterprise'
            ],
            description: 'New tier level'
          }
        },
        required: [
          'api_key',
          'new_tier'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suspend_service_api_key',
      description: 'Suspend an API key for non-payment, abuse, or other reasons. Key becomes inactive immediately.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to suspend'
          },
          reason: {
            type: 'string',
            description: 'Reason for suspension'
          }
        },
        required: [
          'api_key',
          'reason'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_monthly_revenue',
      description: 'Generate comprehensive revenue report including MRR, customer count, tier breakdown, top service, and usage stats.',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Optional: start of reporting period'
          },
          end_date: {
            type: 'string',
            format: 'date-time',
            description: 'Optional: end of reporting period'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_service_invoice',
      description: 'Generate a monthly invoice for a customer based on their tier and usage.',
      parameters: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description: 'API key to invoice'
          }
        },
        required: [
          'api_key'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_top_service_customers',
      description: 'Get list of highest-value customers sorted by tier and usage. Useful for identifying upsell opportunities.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of top customers to return (default 10)'
          }
        }
      }
    }
  },
  // Workflow Template Manager Tools
  {
    type: 'function',
    function: {
      name: 'execute_workflow_template',
      description: '🔄 Execute a pre-built workflow template by name with custom parameters. Categories: Revenue (acquire_new_customer, upsell_existing_customer, monthly_billing_cycle, churn_prevention), Marketing (content_campaign, influencer_outreach), Financial (treasury_health_check, execute_buyback), Technical Excellence (auto_fix_codebase, code_quality_audit, automated_testing_pipeline), Optimization (modify_edge_function, performance_optimization_cycle, database_optimization_workflow), Knowledge Management (documentation_generation_workflow, knowledge_graph_expansion), Community Growth (dao_governance_cycle, contributor_onboarding_workflow), Ecosystem Evolution (create_new_microservice, feature_development_pipeline), Meta (learn_from_failures, diagnose_workflow_failure).',
      parameters: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            enum: [
              // Revenue workflows
              'acquire_new_customer',
              'upsell_existing_customer',
              'monthly_billing_cycle',
              'churn_prevention',
              // Marketing workflows
              'content_campaign',
              'influencer_outreach',
              // Financial workflows
              'treasury_health_check',
              'execute_buyback',
              // Technical excellence workflows
              'auto_fix_codebase',
              'code_quality_audit',
              'automated_testing_pipeline',
              // Optimization workflows
              'modify_edge_function',
              'performance_optimization_cycle',
              'database_optimization_workflow',
              // Knowledge management workflows
              'documentation_generation_workflow',
              'knowledge_graph_expansion',
              // Community growth workflows
              'dao_governance_cycle',
              'contributor_onboarding_workflow',
              // Ecosystem evolution workflows
              'create_new_microservice',
              'feature_development_pipeline',
              // Meta workflows
              'learn_from_failures',
              'diagnose_workflow_failure',
              // Legacy/governance workflows
              'autonomous_governance_proposal_evaluation',
              'proactive_system_anomaly_detection_and_resolution',
              'community_engagement_sentiment_analysis_and_response',
              'developer_onboarding_and_contribution_guidance',
              'competitive_landscape_analysis_and_reporting',
              'documentation_generation_and_maintenance',
              'agent_performance_review_and_optimization'
            ],
            description: 'Name of the workflow template to execute'
          },
          params: {
            type: 'object',
            description: 'Template-specific parameters (e.g., {"email":"customer@example.com","tier":"pro","service_name":"uspto-patent-mcp"})'
          }
        },
        required: [
          'template_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'diagnose_workflow_failure',
      description: '🔍 Diagnose why a workflow is failing by analyzing execution history, error patterns, and edge function logs. Returns root cause analysis, affected functions, severity assessment, and actionable remediation recommendations.',
      parameters: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            description: 'Name of the failing workflow template to diagnose (e.g., "acquire_new_customer")'
          },
          time_window_days: {
            type: 'number',
            description: 'Number of days of execution history to analyze. Default: 7',
            default: 7
          },
          include_logs: {
            type: 'boolean',
            description: 'Whether to fetch detailed edge function logs for affected functions. Default: true',
            default: true
          }
        },
        required: [
          'template_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_workflow_templates',
      description: '📋 Get all available workflow templates with success rates, execution counts, and descriptions. Filter by category (revenue, marketing, financial, optimization).',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: [
              'revenue',
              'marketing',
              'financial',
              'optimization'
            ],
            description: 'Optional: filter templates by category'
          },
          active_only: {
            type: 'boolean',
            description: 'Only show active templates (default: true)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow_template',
      description: '🔍 Get detailed information about a specific workflow template including all steps and configuration.',
      parameters: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            description: 'Name of the template to retrieve'
          }
        },
        required: [
          'template_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow_analytics',
      description: '📊 Get execution analytics for workflow templates including success rate, average duration, and recent execution history.',
      parameters: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            description: 'Optional: specific template to analyze'
          },
          limit: {
            type: 'number',
            description: 'Number of recent executions to include (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_workflow_template',
      description: '🆕 Create a new custom workflow template with defined steps and configuration.',
      parameters: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            description: 'Unique name for the template'
          },
          category: {
            type: 'string',
            enum: [
              'revenue',
              'marketing',
              'financial',
              'optimization'
            ],
            description: 'Template category'
          },
          description: {
            type: 'string',
            description: 'Description of what the workflow does'
          },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                config: {
                  type: 'object'
                }
              }
            },
            description: 'Array of workflow steps with type, name, and configuration'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Tags for searchability and organization'
          }
        },
        required: [
          'template_name',
          'category',
          'description',
          'steps'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_function_usage_analytics',
      description: 'Query historical edge function usage patterns. See which functions you and other executives use most, success rates, common use cases, and execution patterns. Use this to learn from past behavior and make informed decisions about which functions to call.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Optional: specific function to analyze'
          },
          executive_name: {
            type: 'string',
            description: 'Optional: filter by CSO, CTO, CIO, or CAO'
          },
          time_period_hours: {
            type: 'number',
            description: 'Look back period in hours (default 168 = 1 week)'
          },
          min_usage_count: {
            type: 'number',
            description: 'Only show functions used at least N times'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_new_edge_function',
      description: 'Propose a new edge function to the Executive Council. IMPORTANT: Before proposing, use list_function_proposals to check if the function already exists. If a function is already approved, use invoke_edge_function to call it directly instead of re-proposing. Requires 3/4 executive votes for approval. Previously rejected functions can be re-proposed with improvements.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Name for the new function (kebab-case)'
          },
          description: {
            type: 'string',
            description: 'What this function does'
          },
          category: {
            type: 'string',
            description: 'Category (ai, mining, github, code, analytics, etc.)'
          },
          rationale: {
            type: 'string',
            description: 'Why we need this function'
          },
          use_cases: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Specific use cases'
          },
          implementation_outline: {
            type: 'string',
            description: 'High-level implementation approach'
          }
        },
        required: [
          'function_name',
          'description',
          'category',
          'rationale',
          'use_cases'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vote_on_function_proposal',
      description: 'Cast your vote on a pending edge function proposal. Requires 3/4 executive approval for deployment. Your vote and reasoning become part of the permanent record.',
      parameters: {
        type: 'object',
        properties: {
          proposal_id: {
            type: 'string',
            description: 'UUID of the proposal'
          },
          vote: {
            type: 'string',
            enum: [
              'approve',
              'reject',
              'abstain'
            ],
            description: 'Your vote'
          },
          reasoning: {
            type: 'string',
            description: 'Detailed reasoning for your vote'
          }
        },
        required: [
          'proposal_id',
          'vote',
          'reasoning'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_function_proposals',
      description: 'List all edge function proposals (pending, voting, approved, deployed). See what new capabilities are being proposed and vote on them.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: [
              'pending',
              'voting',
              'approved',
              'rejected',
              'deployed'
            ],
            description: 'Filter by status'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'invoke_edge_function',
      description: '🌐 UNIVERSAL EDGE FUNCTION INVOKER - Call ANY of 125+ Supabase edge functions dynamically. This is your primary tool for accessing specialized capabilities. Categories: AI (10+), SuperDuper agents (12), code execution (6), GitHub (5+), task management (8), knowledge (7), monitoring (10+), mining (8), autonomous systems (12+), governance (7), ecosystem (8), posting daemons (7), database (3), analytics (3). Examples: superduper-code-architect for code review, python-executor for data analysis, ecosystem-monitor for health checks, autonomous-code-fixer for self-healing. Use list_available_functions first to discover what\'s available.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Name of the edge function to invoke (e.g., "python-executor", "github-integration", "system-diagnostics")'
          },
          payload: {
            type: 'object',
            description: 'JSON payload to send to the function. Structure depends on the target function.'
          }
        },
        required: [
          'function_name',
          'payload'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_available_functions',
      description: '📋 LIST ALL 125+ EDGE FUNCTIONS - Returns complete registry of all available edge functions with descriptions, capabilities, categories, and examples. Categories include: ai (10+), superduper (12), code-execution (6), github (5+), task-management (8), knowledge (7), monitoring (10+), mining (8), autonomous (12+), governance (7), ecosystem (8), database (3), deployment (5). Use this FIRST when you need to discover available capabilities or find the right function for a task. Each function includes example use cases.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional: Filter by category (ai, superduper, code-execution, github, task-management, knowledge, monitoring, mining, autonomous, governance, ecosystem, database, deployment)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_code_execution_lessons',
      description: 'Retrieve lessons learned from recent code executions. Use this to learn what code patterns work vs fail, and improve your code generation. Returns: recent execution results, auto-fix patterns, success/failure analysis.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent executions to analyze (default 10)'
          },
          include_failures_only: {
            type: 'boolean',
            description: 'Only include failed executions to learn from mistakes'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_feedback',
      description: 'Retrieve feedback about YOUR recent tool calls, code executions, and learning points. Use this to learn from mistakes and improve future performance. Returns feedback entries with learning points, original context, and fix results. You can acknowledge feedback to mark it as reviewed.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of feedback items to retrieve (default 10)'
          },
          unacknowledged_only: {
            type: 'boolean',
            description: 'Only show unread feedback (default true)'
          },
          acknowledge_ids: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of feedback IDs to mark as acknowledged'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_python',
      description: '⚠️ PURE COMPUTATION ONLY - NO NETWORK ACCESS! Execute Python code for calculations, data processing, JSON manipulation, string operations, and math ONLY. The sandbox has NO internet connectivity - urllib, requests, socket ALL FAIL with DNS errors. For ANY HTTP/API calls, use invoke_edge_function or call_edge_function instead. Valid uses: calculate hashes, parse JSON, format dates, process arrays, mathematical calculations. INVALID uses: fetch URLs, call APIs, download data - these WILL FAIL.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Python code for PURE COMPUTATION ONLY. DO NOT attempt any network/HTTP calls - they will fail. Use for: math, json, datetime, string manipulation, data processing.'
          },
          purpose: {
            type: 'string',
            description: 'Brief description of what this code does'
          }
        },
        required: [
          'code',
          'purpose'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'call_edge_function',
      description: 'REAL EXECUTION: Call actual Supabase edge function. Execution appears in "🐍 Eliza\'s Code Execution Log" sidebar. Wait for result, then communicate outcome to user.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Edge function name (e.g., github-integration, mining-proxy)'
          },
          body: {
            type: 'object',
            description: 'Request body to send to the function'
          },
          purpose: {
            type: 'string',
            description: 'What this call is for'
          }
        },
        required: [
          'function_name',
          'body'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGitHubDiscussion',
      description: 'Create a GitHub discussion post in XMRT-Ecosystem repository with executive attribution. Returns discussion URL and ID. Use for announcements, updates, or community engagement.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Discussion title'
          },
          body: {
            type: 'string',
            description: 'Discussion content (supports Markdown)'
          },
          categoryId: {
            type: 'string',
            description: 'Category ID (default: DIC_kwDOPHeChc4CkXxI for General)',
            default: 'DIC_kwDOPHeChc4CkXxI'
          },
          executive: {
            type: 'string',
            enum: [
              'cso',
              'cto',
              'cio',
              'cao',
              'eliza',
              'council'
            ],
            description: 'Which executive is authoring this content. Adds rich header/footer attribution showing icon, title, specialty, and AI model.'
          }
        },
        required: [
          'title',
          'body'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGitHubIssue',
      description: 'Create a GitHub issue in any XMRT repository with executive attribution. Returns issue number and URL.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)',
            default: 'XMRT-Ecosystem'
          },
          title: {
            type: 'string',
            description: 'Issue title'
          },
          body: {
            type: 'string',
            description: 'Issue description (supports Markdown)'
          },
          labels: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional labels (e.g., ["bug", "urgent"])'
          },
          executive: {
            type: 'string',
            enum: [
              'cso',
              'cto',
              'cio',
              'cao',
              'eliza',
              'council'
            ],
            description: 'Which executive is authoring this content. Adds rich header/footer attribution showing icon, title, specialty, and AI model.'
          },
          assignees: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional: List of agent names (e.g., "Antigravity", "Hermes") or GitHub usernames to assign the issue to. Agent names are automatically mapped to GitHub users.'
          }
        },
        required: [
          'title',
          'body'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'commentOnGitHubIssue',
      description: 'Add a comment to an existing GitHub issue with executive attribution.',
      parameters: {
        type: 'object',
        properties: {
          issue_number: {
            type: 'number',
            description: 'Issue number to comment on'
          },
          comment: {
            type: 'string',
            description: 'Comment content (supports Markdown)'
          },
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)',
            default: 'XMRT-Ecosystem'
          },
          executive: {
            type: 'string',
            enum: [
              'cso',
              'cto',
              'cio',
              'cao',
              'eliza',
              'council'
            ],
            description: 'Which executive is authoring this comment. Adds rich header/footer attribution.'
          }
        },
        required: [
          'issue_number',
          'comment'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listGitHubIssues',
      description: 'List recent GitHub issues from XMRT repositories.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          state: {
            type: 'string',
            enum: [
              'open',
              'closed',
              'all'
            ],
            description: 'Issue state filter',
            default: 'open'
          },
          limit: {
            type: 'number',
            description: 'Number of issues to return (max 100)',
            default: 20
          }
        }
      }
    }
  },
  // ====================================================================
  // 📊 GITHUB EVENT MONITORING TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'list_github_commits',
      description: '📝 List recent commits from a repository with optional filtering by author, date range, branch, or file path. Use to monitor development activity.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          author: {
            type: 'string',
            description: 'Filter by commit author username'
          },
          since: {
            type: 'string',
            description: 'Only commits after this date (ISO 8601 format, e.g., 2025-12-01)'
          },
          until: {
            type: 'string',
            description: 'Only commits before this date (ISO 8601 format)'
          },
          sha: {
            type: 'string',
            description: 'Branch name or commit SHA to start listing from'
          },
          path: {
            type: 'string',
            description: 'Filter by file path (e.g., "src/components")'
          },
          per_page: {
            type: 'number',
            description: 'Results per page (max 100, default 30)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_commit_details',
      description: '📦 Get detailed information about a specific commit including diff, files changed, additions, deletions, and commit message.',
      parameters: {
        type: 'object',
        properties: {
          commit_sha: {
            type: 'string',
            description: 'Full or short SHA of the commit to retrieve'
          },
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          }
        },
        required: [
          'commit_sha'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_repo_events',
      description: '📊 Get the activity feed for a repository including pushes, PRs, issues, releases, comments, and more. Great for monitoring recent activity.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          per_page: {
            type: 'number',
            description: 'Events per page (max 100, default 30)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_github_releases',
      description: '🏷️ List all releases and tags for a repository. Returns release names, tag versions, publish dates, and release notes.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          per_page: {
            type: 'number',
            description: 'Results per page (max 100, default 30)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_github_contributors',
      description: '👥 Get contributor statistics for a repository including contribution counts, avatars, and profile links. REPO PARAM: Use repo name only (e.g., "XMRT-Ecosystem"), NOT full path.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name ONLY (e.g., "XMRT-Ecosystem", NOT "DevGruGold/XMRT-Ecosystem")'
          },
          include_anonymous: {
            type: 'boolean',
            description: 'Include anonymous contributors (default: false)'
          },
          per_page: {
            type: 'number',
            description: 'Results per page (max 100, default 30)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_release_details',
      description: '🏷️ Get detailed information about a specific release including release notes, assets, and download URLs.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name ONLY (e.g., "XMRT-Ecosystem")'
          },
          release_id: {
            type: 'string',
            description: 'Release ID or "latest" for most recent release (default: "latest")'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getGitHubIssueComments',
      description: '💬 List all comments on a specific GitHub issue. Returns comment bodies, authors, and timestamps.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name ONLY (e.g., "XMRT-Ecosystem")'
          },
          issue_number: {
            type: 'number',
            description: 'Issue number to get comments for'
          },
          per_page: {
            type: 'number',
            description: 'Comments per page (max 100, default 30)'
          }
        },
        required: [
          'issue_number'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getGitHubDiscussionComments',
      description: '💬 Get comments from a GitHub discussion thread.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name ONLY (e.g., "XMRT-Ecosystem")'
          },
          discussion_number: {
            type: 'number',
            description: 'Discussion number to get comments for'
          },
          first: {
            type: 'number',
            description: 'Number of comments to return (default 30)'
          }
        },
        required: [
          'discussion_number'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateGitHubIssue',
      description: '✏️ Update an existing GitHub issue - modify title, body, labels, state, or assignees.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name ONLY (e.g., "XMRT-Ecosystem")'
          },
          issue_number: {
            type: 'number',
            description: 'Issue number to update'
          },
          title: {
            type: 'string',
            description: 'New title (optional)'
          },
          body: {
            type: 'string',
            description: 'New body content (optional)'
          },
          state: {
            type: 'string',
            enum: [
              'open',
              'closed',
              'all'
            ],
            description: 'Issue state'
          },
          labels: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'New labels array'
          },
          assignees: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional: List of agent names (e.g., "Antigravity", "Hermes") or GitHub usernames to re-assign the issue to. Agent names are automatically mapped to GitHub users.'
          }
        },
        required: [
          'issue_number'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'closeGitHubIssue',
      description: '❌ Close a GitHub issue. Shortcut for update_issue with state="closed".',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name ONLY (e.g., "XMRT-Ecosystem")'
          },
          issue_number: {
            type: 'number',
            description: 'Issue number to close'
          },
          body: {
            type: 'string',
            description: 'Optional comment to add before closing'
          }
        },
        required: [
          'issue_number'
        ]
      }
    }
  },
  // ====================================================================
  // 🔄 GITHUB PULL REQUEST TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'createGitHubPullRequest',
      description: '🔄 Create a new pull request from one branch to another. Returns PR number and URL.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          title: {
            type: 'string',
            description: 'PR title'
          },
          body: {
            type: 'string',
            description: 'PR description with details of changes'
          },
          head: {
            type: 'string',
            description: 'Branch containing changes (source branch)'
          },
          base: {
            type: 'string',
            description: 'Branch to merge into (default: main)',
            default: 'main'
          },
          draft: {
            type: 'boolean',
            description: 'Create as draft PR',
            default: false
          }
        },
        required: [
          'title',
          'body',
          'head'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listGitHubPullRequests',
      description: '📋 List pull requests from a repository with optional state filter.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          state: {
            type: 'string',
            enum: [
              'open',
              'closed',
              'all'
            ],
            description: 'PR state filter',
            default: 'open'
          },
          limit: {
            type: 'number',
            description: 'Number of PRs to return',
            default: 20
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mergeGitHubPullRequest',
      description: '✅ Merge a pull request. Supports merge, squash, and rebase strategies.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          pull_number: {
            type: 'number',
            description: 'PR number to merge'
          },
          merge_method: {
            type: 'string',
            enum: [
              'merge',
              'squash',
              'rebase'
            ],
            description: 'Merge strategy',
            default: 'squash'
          },
          commit_title: {
            type: 'string',
            description: 'Custom commit title for squash/merge'
          },
          commit_message: {
            type: 'string',
            description: 'Custom commit message'
          }
        },
        required: [
          'pull_number'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'closeGitHubPullRequest',
      description: '❌ Close a pull request without merging.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          pull_number: {
            type: 'number',
            description: 'PR number to close'
          }
        },
        required: [
          'pull_number'
        ]
      }
    }
  },
  // ====================================================================
  // 🌿 GITHUB BRANCH TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'createGitHubBranch',
      description: '🌿 Create a new branch from an existing branch or commit SHA.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          branch_name: {
            type: 'string',
            description: 'Name for the new branch'
          },
          from_branch: {
            type: 'string',
            description: 'Source branch to create from (default: main)',
            default: 'main'
          }
        },
        required: [
          'branch_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listGitHubBranches',
      description: '📋 List all branches in a repository.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getGitHubBranchInfo',
      description: '🔍 Get detailed information about a specific branch including latest commit.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          branch: {
            type: 'string',
            description: 'Branch name to get info for'
          }
        },
        required: [
          'branch'
        ]
      }
    }
  },
  // ====================================================================
  // 📁 GITHUB FILE & CODE TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'getGitHubFileContent',
      description: '📄 Get the content of a file from a GitHub repository.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          path: {
            type: 'string',
            description: 'File path in repository (e.g., "src/App.tsx")'
          },
          ref: {
            type: 'string',
            description: 'Branch or commit SHA (default: main)',
            default: 'main'
          }
        },
        required: [
          'path'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'commitGitHubFile',
      description: '📝 Create or update a file in a GitHub repository. Use for editing codebase.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          path: {
            type: 'string',
            description: 'File path to create/update (e.g., "supabase/functions/new-func/index.ts")'
          },
          content: {
            type: 'string',
            description: 'File content to write'
          },
          message: {
            type: 'string',
            description: 'Commit message describing the change'
          },
          branch: {
            type: 'string',
            description: 'Branch to commit to (default: main)',
            default: 'main'
          },
          sha: {
            type: 'string',
            description: 'Current file SHA (required for updates, omit for new files)'
          }
        },
        required: [
          'path',
          'content',
          'message'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deleteGitHubFile',
      description: '🗑️ Delete a file from a GitHub repository.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          path: {
            type: 'string',
            description: 'File path to delete'
          },
          message: {
            type: 'string',
            description: 'Commit message for deletion'
          },
          branch: {
            type: 'string',
            description: 'Branch to delete from (default: main)',
            default: 'main'
          },
          sha: {
            type: 'string',
            description: 'Current file SHA (required)'
          }
        },
        required: [
          'path',
          'message',
          'sha'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'listGitHubFiles',
      description: '📂 List files and directories in a repository path.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          path: {
            type: 'string',
            description: 'Directory path (default: root)',
            default: ''
          },
          ref: {
            type: 'string',
            description: 'Branch or commit SHA (default: main)',
            default: 'main'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchGitHubCode',
      description: '🔍 Search for code across the repository. Find functions, classes, or patterns.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          query: {
            type: 'string',
            description: 'Search query (e.g., "function executeToolCall" or "createClient")'
          }
        },
        required: [
          'query'
        ]
      }
    }
  },
  // ====================================================================
  // ⚙️ GITHUB WORKFLOW TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'trigger_github_workflow',
      description: '▶️ Trigger a GitHub Actions workflow dispatch event.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          workflow_file: {
            type: 'string',
            description: 'Workflow filename (e.g., "ci.yml")'
          },
          ref: {
            type: 'string',
            description: 'Branch or tag to run workflow on (default: main)',
            default: 'main'
          },
          inputs: {
            type: 'object',
            description: 'Workflow input parameters',
            additionalProperties: {
              type: 'string'
            }
          }
        },
        required: [
          'workflow_file'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createGitHubWorkflowFile',
      description: '📋 Create a new GitHub Actions workflow YAML file. Validates YAML and places in .github/workflows/.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (default: XMRT-Ecosystem)'
          },
          workflow_name: {
            type: 'string',
            description: 'Workflow filename without extension (e.g., "deploy-edge-functions")'
          },
          yaml_content: {
            type: 'string',
            description: 'Complete YAML workflow content'
          },
          commit_message: {
            type: 'string',
            description: 'Commit message for the workflow file'
          },
          branch: {
            type: 'string',
            description: 'Branch to commit to (default: main)',
            default: 'main'
          }
        },
        required: [
          'workflow_name',
          'yaml_content'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description: 'Get all existing agents and their IDs/status. ALWAYS call this BEFORE assigning tasks to know agent IDs.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'spawn_agent',
      description: 'Create a new specialized agent. Returns agent with ID. User will see agent in TaskVisualizer.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Agent name'
          },
          role: {
            type: 'string',
            description: 'Agent role/specialization'
          },
          skills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of agent skills'
          }
        },
        required: [
          'name',
          'role',
          'skills'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_agent_status',
      description: 'Change agent status. Valid statuses: IDLE (ready for work), BUSY (actively working), ARCHIVED (retired), ERROR (has issues), OFFLINE (unavailable).',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent ID (e.g., agent-1759625833505)'
          },
          status: {
            type: 'string',
            enum: [
              'IDLE',
              'BUSY',
              'ARCHIVED',
              'ERROR',
              'OFFLINE'
            ],
            description: 'New agent status - MUST be one of: IDLE, BUSY, ARCHIVED, ERROR, OFFLINE'
          }
        },
        required: [
          'agent_id',
          'status'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assign_task',
      description: 'Create and assign a task to an agent using their ID (NOT name). User will see task in TaskVisualizer. Category and stage have specific valid values. Include expected_deliverables and notification_recipients to trigger completion notifications (issue #2279).',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Task title'
          },
          description: {
            type: 'string',
            description: 'Task description'
          },
          repo: {
            type: 'string',
            description: 'Repository name. Default: XMRT-Ecosystem'
          },
          category: {
            type: 'string',
            enum: [
              'code',
              'infra',
              'research',
              'governance',
              'mining',
              'device',
              'ops',
              'other'
            ],
            description: 'Task category - MUST be one of: code, infra, research, governance, mining, device, ops, other'
          },
          stage: {
            type: 'string',
            enum: [
              'DISCUSS',
              'PLAN',
              'EXECUTE',
              'VERIFY',
              'INTEGRATE'
            ],
            description: 'Pipeline stage - MUST be one of: DISCUSS, PLAN, EXECUTE, VERIFY, INTEGRATE. Default: PLAN'
          },
          assignee_agent_id: {
            type: 'string',
            description: 'Agent ID from list_agents or spawn_agent result'
          },
          priority: {
            type: 'number',
            description: 'Priority 1-10, default 5'
          },
          expected_deliverables: {
            type: 'string',
            description: '📋 RECOMMENDED: Human-readable description of expected outputs (e.g., "Market Research Report in PDF", "Code Snippet in GitHub Gist"). Used in completion notification emails.'
          },
          deliverable_storage_path: {
            type: 'string',
            description: '📁 Optional: Intended Drive storage path (e.g., "Google Drive/XMRT-DAO/Awapuhi Project/Reports")'
          },
          notification_recipients: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: '📧 Optional: Email addresses to notify upon completion. Falls back to EXECUTIVE_EMAIL env var if not provided.'
          }
        },
        required: [
          'title',
          'description',
          'category',
          'assignee_agent_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task_status',
      description: 'Update task status and stage as agents work on it. When completing a task (COMPLETED/DONE), always provide proof_of_work_link and outcome_summary to trigger executive notifications.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID'
          },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'CLAIMED',
              'IN_PROGRESS',
              'BLOCKED',
              'DONE',
              'CANCELLED',
              'COMPLETED',
              'FAILED'
            ],
            description: 'New status - MUST be one of: PENDING, CLAIMED, IN_PROGRESS, BLOCKED, DONE, CANCELLED, COMPLETED, FAILED'
          },
          stage: {
            type: 'string',
            enum: [
              'DISCUSS',
              'PLAN',
              'EXECUTE',
              'VERIFY',
              'INTEGRATE'
            ],
            description: 'Pipeline stage - MUST be one of: DISCUSS, PLAN, EXECUTE, VERIFY, INTEGRATE'
          },
          blocking_reason: {
            type: 'string',
            description: 'Reason for blocking (required if status is BLOCKED)'
          },
          proof_of_work_link: {
            type: 'string',
            description: '🔗 REQUIRED ON COMPLETION: Direct URL to final deliverable (Google Drive link, GitHub link, etc.). Included in notification email to Executive Council.'
          },
          outcome_summary: {
            type: 'string',
            description: '📝 REQUIRED ON COMPLETION: Brief summary of what was accomplished. Included in notification email to Executive Council.'
          },
          resolution_notes: {
            type: 'string',
            description: 'Detailed resolution notes (stored in task record)'
          }
        },
        required: [
          'task_id',
          'status'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_task_status',
      description: 'Directly set the status of a task. Alias for update_task_status. Use this to change task status to COMPLETED, FAILED, etc. When completing, provide proof_of_work_link and outcome_summary.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID'
          },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'CLAIMED',
              'IN_PROGRESS',
              'BLOCKED',
              'DONE',
              'CANCELLED',
              'COMPLETED',
              'FAILED'
            ],
            description: 'New status - MUST be one of: PENDING, CLAIMED, IN_PROGRESS, BLOCKED, DONE, CANCELLED, COMPLETED, FAILED'
          },
          stage: {
            type: 'string',
            enum: [
              'DISCUSS',
              'PLAN',
              'EXECUTE',
              'VERIFY',
              'INTEGRATE'
            ],
            description: 'Pipeline stage - MUST be one of: DISCUSS, PLAN, EXECUTE, VERIFY, INTEGRATE'
          },
          blocking_reason: {
            type: 'string',
            description: 'Reason for blocking (required if status is BLOCKED)'
          },
          proof_of_work_link: {
            type: 'string',
            description: '🔗 REQUIRED ON COMPLETION: Direct URL to final deliverable.'
          },
          outcome_summary: {
            type: 'string',
            description: '📝 REQUIRED ON COMPLETION: Brief summary of what was accomplished.'
          }
        },
        required: [
          'task_id',
          'status'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'Get all tasks and their status/assignments to see what agents are working on.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_agent_workload',
      description: 'Get current workload and active tasks for a specific agent.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent ID to check workload for'
          }
        },
        required: [
          'agent_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Delete a task permanently. Use when task is no longer needed or was created in error.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID to delete'
          },
          reason: {
            type: 'string',
            description: 'Reason for deletion'
          }
        },
        required: [
          'task_id',
          'reason'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'reassign_task',
      description: 'Reassign a task to a different agent.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID to reassign'
          },
          new_assignee_id: {
            type: 'string',
            description: 'New agent ID to assign task to'
          },
          reason: {
            type: 'string',
            description: 'Reason for reassignment'
          }
        },
        required: [
          'task_id',
          'new_assignee_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task_details',
      description: 'Update task details like title, description, priority, category, or repo.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID to update'
          },
          title: {
            type: 'string',
            description: 'New task title'
          },
          description: {
            type: 'string',
            description: 'New task description'
          },
          priority: {
            type: 'number',
            description: 'New priority (1-10)'
          },
          category: {
            type: 'string',
            description: 'New category'
          },
          repo: {
            type: 'string',
            description: 'New repository'
          }
        },
        required: [
          'task_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_task_complete',
      description: 'Mark a task as completed. Shortcut for update_task_status with COMPLETED status. Always provide proof_of_work_link and outcome_summary to trigger executive notifications.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID to mark complete'
          },
          completion_notes: {
            type: 'string',
            description: 'Notes about task completion'
          },
          proof_of_work_link: {
            type: 'string',
            description: '🔗 REQUIRED: Direct URL to final deliverable.'
          },
          outcome_summary: {
            type: 'string',
            description: '📝 REQUIRED: Brief summary of what was accomplished.'
          }
        },
        required: [
          'task_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_task_details',
      description: 'Get detailed information about a specific task.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'Task ID to get details for'
          }
        },
        required: [
          'task_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'report_progress',
      description: 'Report progress on an ongoing task.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent reporting progress'
          },
          agent_name: {
            type: 'string',
            description: 'Agent name'
          },
          task_id: {
            type: 'string',
            description: 'Task ID'
          },
          progress_message: {
            type: 'string',
            description: 'Progress update message'
          },
          progress_percentage: {
            type: 'number',
            description: 'Progress percentage (0-100)'
          },
          current_stage: {
            type: 'string',
            description: 'Current stage of work'
          }
        },
        required: [
          'agent_id',
          'agent_name',
          'task_id',
          'progress_message'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'request_task_assignment',
      description: 'Request automatic assignment of the next highest priority pending task to an agent.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent requesting assignment'
          },
          agent_name: {
            type: 'string',
            description: 'Agent name'
          }
        },
        required: [
          'agent_id',
          'agent_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_decision',
      description: 'Log an important decision or reasoning for audit trail.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'Agent making decision (default: eliza)'
          },
          decision: {
            type: 'string',
            description: 'The decision made'
          },
          rationale: {
            type: 'string',
            description: 'Reasoning behind the decision'
          }
        },
        required: [
          'decision',
          'rationale'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cleanup_duplicate_tasks',
      description: 'Remove duplicate tasks from the database, keeping only the oldest instance of each duplicate.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cleanup_duplicate_agents',
      description: 'Remove duplicate agents from the database, keeping only the oldest instance of each agent name.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_system_status',
      description: `📊 Get COMPREHENSIVE ecosystem status with 15+ sections: health score, agents (counts/status), tasks (pipeline stages/blockers), edge functions (93+ deployed), cron jobs, GOVERNANCE (proposals/votes/council), KNOWLEDGE BASE (entity counts/types/coverage), GITHUB ACTIVITY (24h calls/repos/rate limits), WORKFLOWS (templates/running/failed), LEARNING (sessions/feedback), PYTHON EXECUTIONS (success rates/by source), AI PROVIDERS (cascade status/primary/fallbacks), XMRT CHARGER (devices/PoP points), USER ACQUISITION (sessions/leads/funnel).

Use for: "ecosystem health", "system status", "how are things", "what's the state of governance", "knowledge base status", "GitHub activity", "workflow status", "AI provider status", "charger devices".

Response includes ecosystem_summary with one-line stats for each component.`,
      parameters: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: [
              'all',
              'governance',
              'knowledge',
              'github',
              'workflows',
              'learning',
              'python',
              'ai_providers',
              'xmrt_charger',
              'acquisition'
            ],
            description: 'Optional: Focus on specific ecosystem section (default: all)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_edge_functions',
      description: 'Search for edge functions by capability, keywords, or use case. Use when you need to find the right function for a task you want to accomplish.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What you want to do (e.g., "create GitHub issue", "get mining stats", "browse website")'
          },
          category: {
            type: 'string',
            description: 'Optional category filter (ai, mining, web, github, autonomous, knowledge, monitoring, code-execution, ecosystem)'
          }
        },
        required: [
          'query'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_ecosystem_health',
      description: 'Get comprehensive health status of entire XMRT ecosystem - all repos, deployments, APIs, and integrations. Use this for "ecosystem health", "system status", or "how are things" queries.',
      parameters: {
        type: 'object',
        properties: {
          include_repos: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional: specific repos to check (e.g., ["XMRT-Ecosystem", "mobilemonero"])'
          },
          detailed: {
            type: 'boolean',
            description: 'Include detailed metrics (default: true)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_health_report',
      description: 'Generate comprehensive markdown health report covering all XMRT ecosystem components, integrations, and status.',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: [
              'markdown',
              'json'
            ],
            description: 'Report format (default: markdown)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'evaluate_community_idea',
      description: 'COMMUNITY IDEA EVALUATION - Evaluate a community-submitted idea through the lens of XMRT values. Scores idea on Financial Sovereignty (0-100), Democracy (0-100), Privacy (0-100), Technical Feasibility (0-100), and Community Benefit (0-100). Convenes executive council for strategic review. Auto-approves ideas scoring 65+ average. Creates implementation tasks for approved ideas.',
      parameters: {
        type: 'object',
        properties: {
          ideaId: {
            type: 'string',
            description: 'UUID of the community idea to evaluate'
          },
          action: {
            type: 'string',
            enum: [
              'evaluate_pending',
              'evaluate_single'
            ],
            description: 'Action type: evaluate_pending processes all pending ideas, evaluate_single processes specific idea'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scan_for_opportunities',
      description: 'PROACTIVE OPPORTUNITY DETECTION - Scan XMRT DAO infrastructure for improvement opportunities. Detects: underutilized components, performance bottlenecks, data patterns, integration gaps, community pain points. Logs findings to opportunity_log table with priority scoring. Run this every 15 minutes for 24/7 vigilance.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'scan',
              'generate_report'
            ],
            description: 'Action type: scan discovers opportunities, generate_report creates daily summary'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'make_autonomous_decision',
      description: 'AUTONOMOUS DECISION MAKING - Make strategic decisions on detected opportunities. Executes decision tree: Can I auto-fix? → Do I need executive council? → Should I create agent task? → Is this a community idea? Auto-implements simple optimizations, convenes council for complex decisions, creates tasks for agents.',
      parameters: {
        type: 'object',
        properties: {
          opportunityId: {
            type: 'string',
            description: 'UUID of the opportunity from opportunity_log to act upon'
          }
        },
        required: [
          'opportunityId'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_uspto_patents',
      description: 'Search the United States Patent and Trademark Office database for patents. Use CQL syntax: TTL/keyword for title, ABST/keyword for abstract, IN/name for inventor, AN/company for assignee, ISD/YYYYMMDD for issue date, CPC/code for classification. Example: "TTL/quantum computing AND ISD/20240101->20241231". Searches 11M+ patents. Returns patent numbers, titles, inventors, assignees, abstracts.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'CQL search query using USPTO syntax'
          },
          rows: {
            type: 'number',
            description: 'Number of results to return (1-1000, default 25)'
          }
        },
        required: [
          'query'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_patent_full_details',
      description: 'Retrieve complete text, claims, and description of a specific US patent by patent number. Returns full patent document including abstract, all claims, and detailed description. Use this after searching to get complete patent information.',
      parameters: {
        type: 'object',
        properties: {
          patent_number: {
            type: 'string',
            description: 'Patent number (e.g., "11234567" or "US11234567")'
          }
        },
        required: [
          'patent_number'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_inventor_patents',
      description: 'Find all patents by a specific inventor and analyze their patent portfolio. Returns comprehensive list of patents with dates, titles, and assignees. Use for competitive analysis or prior art research.',
      parameters: {
        type: 'object',
        properties: {
          inventor_name: {
            type: 'string',
            description: 'Inventor full or partial name'
          },
          date_from: {
            type: 'string',
            description: 'Start date (YYYYMMDD format, optional)'
          }
        },
        required: [
          'inventor_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'perform_self_evaluation',
      description: 'CONTINUOUS LEARNING & SELF-IMPROVEMENT - Analyze recent performance, extract patterns, expand capabilities, set goals. Reviews last 24 hours: task success rate, tool execution patterns, discovered errors. Stores learned patterns in eliza_work_patterns. Updates daily performance metrics. Sets improvement goals for next cycle.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_system_knowledge',
      description: 'SYSTEM ARCHITECTURE DISCOVERY - Scan and catalog all infrastructure components. Discovers: 87+ database tables, 125+ edge functions, 20+ cron jobs, Vercel deployments. Maps relationships between components. Stores in system_architecture_knowledge table for intimate awareness of the entire system.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  // Task-Orchestrator Tools
  {
    type: 'function',
    function: {
      name: 'auto_assign_tasks',
      description: '🤖 AUTO-ASSIGN TASKS - Automatically distribute all pending tasks to idle agents by priority. Perfect for balancing workload across the agent fleet without manual intervention.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rebalance_workload',
      description: '⚖️ REBALANCE WORKLOAD - Analyze current workload distribution across all agents and identify imbalances. Shows which agents are overloaded vs idle, helping optimize task allocation.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'identify_blockers',
      description: '🚧 IDENTIFY BLOCKERS - Find all blocked tasks and analyze why they\'re blocked. Automatically checks GitHub connectivity and attempts to clear false positives. Returns specific blocking reasons and clear actions.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clear_blocked_tasks',
      description: '🧹 CLEAR BLOCKED TASKS - Clear all tasks that are blocked due to GitHub-related issues. Useful when GitHub credentials have been fixed and tasks can now proceed.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update_task_status',
      description: '📦 BULK UPDATE TASKS - Update status and stage for multiple tasks at once. Efficient for batch operations when you need to change many tasks simultaneously.',
      parameters: {
        type: 'object',
        properties: {
          task_ids: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of task IDs to update'
          },
          new_status: {
            type: 'string',
            enum: [
              'PENDING',
              'CLAIMED',
              'IN_PROGRESS',
              'BLOCKED',
              'DONE',
              'CANCELLED',
              'COMPLETED',
              'FAILED'
            ],
            description: 'New status - MUST be one of: PENDING, CLAIMED, IN_PROGRESS, BLOCKED, DONE, CANCELLED, COMPLETED, FAILED'
          },
          new_stage: {
            type: 'string',
            enum: [
              'DISCUSS',
              'PLAN',
              'EXECUTE',
              'VERIFY',
              'INTEGRATE'
            ],
            description: 'Pipeline stage - MUST be one of: DISCUSS, PLAN, EXECUTE, VERIFY, INTEGRATE'
          }
        },
        required: [
          'task_ids',
          'new_status'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_task_performance_report',
      description: '📊 TASK PERFORMANCE REPORT - Generate performance metrics for completed and failed tasks in the last 24 hours, broken down by agent. Shows success rates and identifies high/low performers.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  // SuperDuper Agent Tools
  {
    type: 'function',
    function: {
      name: 'consult_code_architect',
      description: '🏗️ CODE ARCHITECT - Expert code review, architecture design, refactoring recommendations, and technical debt analysis. Best for: code quality, design patterns, system architecture, full-stack development.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'code_review, architecture_design, refactor_suggestion, tech_debt_analysis'
          },
          context: {
            type: 'string',
            description: 'Code snippet, architectural context, or technical question'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_business_strategist',
      description: '📈 BUSINESS GROWTH - Growth analysis, market research, revenue optimization, partnership opportunities. Best for: business decisions, monetization strategies, market expansion, competitive analysis.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'growth_analysis, revenue_optimization, partnership_research, market_analysis'
          },
          context: {
            type: 'string',
            description: 'Business context, market question, or growth challenge'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_finance_expert',
      description: '💰 FINANCE & INVESTMENT - Financial modeling, investment analysis, portfolio optimization, risk assessment. Best for: financial planning, investment decisions, treasury management, financial forecasting.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'financial_model, investment_analysis, portfolio_optimization, risk_assessment'
          },
          context: {
            type: 'string',
            description: 'Financial question, investment opportunity, or portfolio details'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_communication_expert',
      description: '✉️ COMMUNICATION & OUTREACH - Email drafting, profile optimization, investor outreach, stakeholder communication. Best for: professional communication, investor relations, public relations, messaging strategy.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'draft_email, optimize_profile, investor_outreach, stakeholder_communication'
          },
          context: {
            type: 'string',
            description: 'Communication goal, target audience, or message context'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_content_producer',
      description: '🎬 CONTENT & MEDIA - Video analysis, podcast creation, newsletter optimization, multimedia content strategy. Best for: content production, media strategy, video/audio content, content distribution.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'video_analysis, podcast_creation, newsletter_optimization, content_strategy'
          },
          context: {
            type: 'string',
            description: 'Content type, audience, or production goals'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_brand_designer',
      description: '🎨 DESIGN & BRAND - Logo design, brand identity, creative content writing, visual design. Best for: branding, visual identity, creative direction, design systems.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'logo_design, brand_identity, creative_writing, visual_design'
          },
          context: {
            type: 'string',
            description: 'Design brief, brand values, or creative requirements'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_career_coach',
      description: '🎯 DEVELOPMENT COACH - Career coaching, performance analysis, skill development, motivation strategies. Best for: personal growth, professional development, team coaching, performance optimization.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'career_coaching, performance_analysis, skill_development, motivation_strategy'
          },
          context: {
            type: 'string',
            description: 'Career goals, performance challenges, or development needs'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_domain_specialist',
      description: '🌍 DOMAIN EXPERTS - Translation, grant writing, bot management, content moderation. Best for: specialized expertise, niche domains, technical translation, grant applications.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'translation, grant_writing, bot_management, content_moderation'
          },
          context: {
            type: 'string',
            description: 'Specialized request, language pair, or domain-specific need'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_integration_specialist',
      description: '🔌 INTEGRATION EXPERT - API integration, third-party connections, system integration, middleware development. Best for: connecting systems, API design, integration architecture, data synchronization.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'api_integration, third_party_connection, system_integration, middleware_development'
          },
          context: {
            type: 'string',
            description: 'Systems to integrate, API specifications, or integration requirements'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_research_analyst',
      description: '🔬 RESEARCH & INTELLIGENCE - Deep research, literature review, multi-perspective analysis, competitive intelligence. Best for: research projects, market intelligence, academic research, data synthesis.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'deep_research, literature_review, perspective_analysis, competitive_intelligence'
          },
          context: {
            type: 'string',
            description: 'Research topic, question, or analysis requirements'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'consult_viral_content_expert',
      description: '🚀 SOCIAL & VIRAL - Viral content creation, social media optimization, trend analysis, meme creation. Best for: social media strategy, viral marketing, content repurposing, engagement optimization.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'viral_content, social_optimization, trend_analysis, meme_creation'
          },
          context: {
            type: 'string',
            description: 'Content type, platform, or viral goals'
          }
        },
        required: [
          'action',
          'context'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'route_to_superduper_agent',
      description: '🎯 SUPERDUPER ROUTER - Automatically route requests to the most appropriate SuperDuper specialist agent. Use when you\'re unsure which specialist to consult or need multi-specialist coordination.',
      parameters: {
        type: 'object',
        properties: {
          request: {
            type: 'string',
            description: 'User request or question to route to appropriate specialist'
          },
          preferred_specialist: {
            type: 'string',
            description: 'Optional: specific specialist preference if known'
          }
        },
        required: [
          'request'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "trigger_github_workflow",
      description: "Dynamically trigger GitHub Actions workflows with custom inputs for event-driven automation. Use this to respond to events by triggering CI/CD pipelines, tests, deployments, or custom workflows.",
      parameters: {
        type: "object",
        properties: {
          workflow_file: {
            type: "string",
            description: "Workflow filename (e.g., 'ci.yml', 'deploy.yml', 'agent-coordination-cycle.yml')"
          },
          ref: {
            type: "string",
            description: "Git ref (branch/tag) to trigger on (default: 'main')"
          },
          inputs: {
            type: "object",
            description: "Custom inputs to pass to the workflow (event context, reason, etc.)"
          },
          repo: {
            type: "string",
            description: "Repository name (default: 'XMRT-Ecosystem')"
          }
        },
        required: [
          "workflow_file"
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "create_event_action",
      description: "Create new event-to-action mappings for dynamic event-driven orchestration. Define how the system should respond to specific events (GitHub issues, deployments, database changes, etc.)",
      parameters: {
        type: "object",
        properties: {
          event_pattern: {
            type: "string",
            description: "Event pattern to match (e.g., 'github:issues:opened', 'vercel:deployment:failed', supports wildcards)"
          },
          priority: {
            type: "number",
            description: "Priority level (1-10, higher = more urgent)"
          },
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action_type: {
                  type: "string"
                },
                target: {
                  type: "string"
                },
                config: {
                  type: "object"
                }
              }
            },
            description: "Array of actions to execute (trigger_workflow, assign_task, create_issue, call_function)"
          },
          conditions: {
            type: "object",
            description: "Optional conditions (label_matches, severity_min, etc.)"
          }
        },
        required: [
          "event_pattern",
          "actions"
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: "query_event_logs",
      description: "Query webhook and event processing logs to analyze event flow, success rates, and identify issues in event-driven orchestration",
      parameters: {
        type: "object",
        properties: {
          event_source: {
            type: "string",
            description: "Filter by event source (github, vercel, supabase)"
          },
          event_type: {
            type: "string",
            description: "Filter by specific event type"
          },
          processing_status: {
            type: "string",
            description: "Filter by status (pending, dispatched, failed)"
          },
          time_window_hours: {
            type: "number",
            description: "Time window in hours (default: 24)"
          }
        }
      }
    }
  },
  // ====================================================================
  // 🧠 KNOWLEDGE MANAGEMENT TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'store_knowledge',
      description: '🧠 Store a new knowledge entity (concept, tool, skill, person, project) in the knowledge base for long-term memory.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the knowledge entity'
          },
          type: {
            type: 'string',
            description: 'Type of entity (e.g., concept, tool, skill, person, project, feature, fact)',
            enum: [
              'concept',
              'tool',
              'skill',
              'person',
              'project',
              'feature',
              'fact',
              'general'
            ]
          },
          description: {
            type: 'string',
            description: 'Detailed description of the entity'
          },
          metadata: {
            type: 'object',
            description: 'Optional additional metadata'
          },
          confidence: {
            type: 'number',
            description: 'Confidence score 0-1 (default 0.5)'
          }
        },
        required: [
          'name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: '🔍 RECALL/FIND ENTITIES: Search the knowledge base to recall stored entities by NAME, type, or description. Use search_term to find entities like "party favor photo", "VSCO", etc. This is how you REMEMBER things that were stored previously. Use this when users say "recall X", "remember X", "what was X", "find entity X".',
      parameters: {
        type: 'object',
        properties: {
          search_term: {
            type: 'string',
            description: 'Entity name or text to search for (e.g., "party favor photo", "VSCO workspace")'
          },
          entity_type: {
            type: 'string',
            description: 'Filter by entity type (concept, tool, skill, person, project, etc.)'
          },
          min_confidence: {
            type: 'number',
            description: 'Minimum confidence score (0-1)'
          },
          limit: {
            type: 'number',
            description: 'Maximum results to return (default 20)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recall_entity',
      description: '🧠 RECALL/REMEMBER: Find a previously stored entity by its name. Use this when users ask "what was X", "recall X", "remember the entity X", "find X in knowledge base". This is an intuitive alias for search_knowledge.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the entity to recall (e.g., "party favor photo", "VSCO")'
          }
        },
        required: [
          'name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_knowledge_relationship',
      description: '🔗 Create a relationship between two knowledge entities to build a knowledge graph.',
      parameters: {
        type: 'object',
        properties: {
          source_id: {
            type: 'string',
            description: 'UUID of the source entity'
          },
          target_id: {
            type: 'string',
            description: 'UUID of the target entity'
          },
          relationship_type: {
            type: 'string',
            description: 'Type of relationship (e.g., related_to, part_of, depends_on, created_by, uses)'
          },
          strength: {
            type: 'number',
            description: 'Relationship strength 0-1 (default 0.5)'
          }
        },
        required: [
          'source_id',
          'target_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_related_knowledge',
      description: '🕸️ Get all entities related to a specific knowledge entity.',
      parameters: {
        type: 'object',
        properties: {
          entity_id: {
            type: 'string',
            description: 'UUID of the entity to find relationships for'
          }
        },
        required: [
          'entity_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_knowledge_status',
      description: '📊 Check knowledge base health and get statistics (entity count, relationship count, pattern count).',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_knowledge',
      description: '🗑️ Delete a knowledge entity and its relationships by ID.',
      parameters: {
        type: 'object',
        properties: {
          entity_id: {
            type: 'string',
            description: 'UUID of the entity to delete'
          }
        },
        required: [
          'entity_id'
        ]
      }
    }
  },
  // ====================================================================
  // 🚀 DEPLOYMENT AUTOMATION TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'deploy_approved_function',
      description: '🚀 Deploy an approved edge function proposal to production. Commits code to GitHub, updates config.toml, and triggers Lovable auto-deployment.',
      parameters: {
        type: 'object',
        properties: {
          proposal_id: {
            type: 'string',
            description: 'UUID of the approved proposal to deploy'
          },
          auto_deploy: {
            type: 'boolean',
            description: 'If true, commit directly to main (triggers auto-deploy). If false, create PR for review. Default: true'
          },
          run_health_check: {
            type: 'boolean',
            description: 'Whether to run post-deployment health checks. Default: true'
          },
          version_tag: {
            type: 'string',
            description: 'Optional version tag for tracking (e.g., "v1.0.0")'
          }
        },
        required: [
          'proposal_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_deployment_status',
      description: '📊 Get deployment status for proposals. Shows deploying, deployed, and failed deployments.',
      parameters: {
        type: 'object',
        properties: {
          proposal_id: {
            type: 'string',
            description: 'Optional: specific proposal ID. If omitted, returns all recent deployments.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rollback_deployment',
      description: '⏮️ Rollback a deployed function to its previous version or remove it entirely.',
      parameters: {
        type: 'object',
        properties: {
          proposal_id: {
            type: 'string',
            description: 'UUID of the deployed proposal to rollback'
          },
          reason: {
            type: 'string',
            description: 'Reason for rollback'
          }
        },
        required: [
          'proposal_id'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'process_deployment_queue',
      description: '📋 Process all proposals queued for deployment. Deploys all approved functions waiting in the queue.',
      parameters: {
        type: 'object',
        properties: {
          auto_deploy: {
            type: 'boolean',
            description: 'Commit directly to main (default: true)'
          },
          run_health_check: {
            type: 'boolean',
            description: 'Run health checks after deployment (default: true)'
          }
        }
      }
    }
  },
  // ====================================================================
  // 📸 VSCO WORKSPACE TOOLS (Studio Manager for Photography/Creative)
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'vsco_manage_jobs',
      description: '📸 VSCO: Manage leads and jobs in VSCO Workspace - list, create, update, or close jobs/leads. Perfect for tracking photography clients from inquiry to completion.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_jobs',
              'get_job',
              'create_job',
              'update_job',
              'close_job',
              'sync_jobs'
            ],
            description: 'Action to perform on jobs/leads'
          },
          job_id: {
            type: 'string',
            description: 'VSCO job ID (required for get/update/close)'
          },
          name: {
            type: 'string',
            description: 'Job/lead name (for create/update)'
          },
          stage: {
            type: 'string',
            enum: [
              'lead',
              'booked',
              'fulfillment',
              'completed'
            ],
            description: 'Job stage in pipeline'
          },
          lead_rating: {
            type: 'number',
            description: 'Lead quality rating 1-5 (for create/update)'
          },
          lead_confidence: {
            type: 'string',
            enum: [
              'low',
              'medium',
              'high'
            ],
            description: 'Confidence level'
          },
          lead_source: {
            type: 'string',
            description: 'How the lead was acquired'
          },
          job_type: {
            type: 'string',
            description: 'Type of job (wedding, portrait, etc.)'
          },
          event_date: {
            type: 'string',
            description: 'Event date (YYYY-MM-DD)'
          },
          reason: {
            type: 'string',
            description: 'Close reason (for close action)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_manage_contacts',
      description: '📇 VSCO: Manage contacts in VSCO Workspace CRM - list, create, or update contacts (people, companies, locations).',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_contacts',
              'get_contact',
              'create_contact',
              'update_contact',
              'sync_contacts'
            ],
            description: 'Action to perform on contacts'
          },
          contact_id: {
            type: 'string',
            description: 'VSCO contact ID (for get/update)'
          },
          kind: {
            type: 'string',
            enum: [
              'person',
              'company',
              'location'
            ],
            description: 'Contact type'
          },
          first_name: {
            type: 'string',
            description: 'First name'
          },
          last_name: {
            type: 'string',
            description: 'Last name'
          },
          email: {
            type: 'string',
            description: 'Email address'
          },
          phone: {
            type: 'string',
            description: 'Phone number'
          },
          cell_phone: {
            type: 'string',
            description: 'Cell phone number'
          },
          company_name: {
            type: 'string',
            description: 'Company name'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_manage_events',
      description: '📅 VSCO: Manage calendar events in VSCO Workspace - schedule sessions, meetings, consultations linked to jobs.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_events',
              'get_event',
              'create_event',
              'update_event'
            ],
            description: 'Action to perform on events'
          },
          event_id: {
            type: 'string',
            description: 'VSCO event ID (for get/update)'
          },
          job_id: {
            type: 'string',
            description: 'Link event to this job ID'
          },
          name: {
            type: 'string',
            description: 'Event name/title'
          },
          event_type: {
            type: 'string',
            description: 'Type of event (session, consultation, etc.)'
          },
          channel: {
            type: 'string',
            enum: [
              'InPerson',
              'Phone',
              'Virtual'
            ],
            description: 'Event channel/medium'
          },
          start_date: {
            type: 'string',
            description: 'Start date (YYYY-MM-DD)'
          },
          start_time: {
            type: 'string',
            description: 'Start time (HH:MM)'
          },
          end_date: {
            type: 'string',
            description: 'End date (YYYY-MM-DD)'
          },
          end_time: {
            type: 'string',
            description: 'End time (HH:MM)'
          },
          location_address: {
            type: 'string',
            description: 'Location/address for in-person events'
          },
          confirmed: {
            type: 'boolean',
            description: 'Whether event is confirmed'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_analytics',
      description: '📊 VSCO: Get analytics and reports from VSCO Workspace - pipeline stats, revenue reports, sync data, check API health.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'get_analytics',
              'get_revenue_report',
              'sync_all',
              'get_api_health',
              'list_brands',
              'list_webhooks'
            ],
            description: 'Analytics action to perform'
          },
          include_closed: {
            type: 'boolean',
            description: 'Include closed jobs in analytics (default: false)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  // ====================================================================
  // 📸 VSCO EXTENDED TOOLS: Products, Worksheets, Notes
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'vsco_manage_products',
      description: '💰 VSCO: Manage products/pricing for quotes - list, create, update products and pricing templates. Essential for generating client quotes.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_products',
              'get_product',
              'create_product',
              'delete_product'
            ],
            description: 'Action to perform on products'
          },
          product_id: {
            type: 'string',
            description: 'VSCO product ID (for get/delete)'
          },
          name: {
            type: 'string',
            description: 'Product name (for create)'
          },
          price: {
            type: 'number',
            description: 'Product price (for create)'
          },
          cost: {
            type: 'number',
            description: 'Product cost (for create)'
          },
          description: {
            type: 'string',
            description: 'Product description'
          },
          category: {
            type: 'string',
            description: 'Product category'
          },
          tax_rate: {
            type: 'number',
            description: 'Tax rate as decimal (e.g., 0.08 for 8%)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_manage_worksheets',
      description: '📋 VSCO: Manage job worksheets/templates - get worksheet details or create new jobs from templates with pre-filled events, contacts, and products.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'get_job_worksheet',
              'create_job_from_worksheet'
            ],
            description: 'Action to perform on worksheets'
          },
          job_id: {
            type: 'string',
            description: 'VSCO job ID (for get_job_worksheet)'
          },
          name: {
            type: 'string',
            description: 'New job name (for create_job_from_worksheet)'
          },
          stage: {
            type: 'string',
            enum: [
              'lead',
              'booked',
              'fulfillment',
              'completed'
            ],
            description: 'Initial stage'
          },
          job_type: {
            type: 'string',
            description: 'Type of job (wedding, portrait, etc.)'
          },
          brand_id: {
            type: 'string',
            description: 'Brand ID for the job'
          },
          events: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Pre-filled events for the worksheet'
          },
          contacts: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Pre-filled contacts for the worksheet'
          },
          products: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Pre-filled products for the worksheet'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_manage_notes',
      description: '📝 VSCO: Manage notes and documentation for jobs/contacts - list, create, update, or delete notes attached to jobs or contacts.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_notes',
              'create_note',
              'update_note',
              'delete_note',
              'list_files',
              'list_galleries',
              'create_gallery'
            ],
            description: 'Action to perform on notes/files'
          },
          note_id: {
            type: 'string',
            description: 'VSCO note ID (for update/delete)'
          },
          job_id: {
            type: 'string',
            description: 'Link note/files to this job ID'
          },
          contact_id: {
            type: 'string',
            description: 'Link note to this contact ID'
          },
          content: {
            type: 'string',
            description: 'Note content (plain text)'
          },
          content_html: {
            type: 'string',
            description: 'Note content (HTML format)'
          },
          date: {
            type: 'string',
            description: 'Note date (YYYY-MM-DD)'
          },
          name: {
            type: 'string',
            description: 'Gallery name (for create_gallery)'
          },
          description: {
            type: 'string',
            description: 'Gallery description'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  // ====================================================================
  // 📸 VSCO EXTENDED TOOLS: Financials, Settings, Users
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'vsco_manage_financials',
      description: '💵 VSCO: Manage financial operations - orders, payments, taxes, profit centers. Create invoices, track payments, manage tax configurations for Party Favor Photo.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_orders',
              'get_order',
              'create_order',
              'update_order',
              'delete_order',
              'list_payment_methods',
              'get_payment_method',
              'list_profit_centers',
              'create_profit_center',
              'get_profit_center',
              'update_profit_center',
              'delete_profit_center',
              'list_tax_groups',
              'create_tax_group',
              'list_tax_rates',
              'create_tax_rate',
              'delete_tax_rate'
            ],
            description: 'Financial action to perform'
          },
          job_id: {
            type: 'string',
            description: 'Job ID for order creation'
          },
          order_id: {
            type: 'string',
            description: 'Order ID for get/update/delete'
          },
          items: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Line items for order'
          },
          tax_group_id: {
            type: 'string',
            description: 'Tax group ID'
          },
          payment_method_id: {
            type: 'string',
            description: 'Payment method ID'
          },
          profit_center_id: {
            type: 'string',
            description: 'Profit center ID'
          },
          name: {
            type: 'string',
            description: 'Name for new entity'
          },
          rate: {
            type: 'number',
            description: 'Tax rate as decimal (e.g., 0.08)'
          },
          amount: {
            type: 'number',
            description: 'Amount for payments/orders'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_manage_settings',
      description: '⚙️ VSCO: Manage studio settings - custom fields, discounts, job types, event types, lead sources. Configure Party Favor Photo studio workflow and configuration.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'get_studio',
              'update_studio',
              'list_brands',
              'update_brand',
              'delete_brand',
              'list_custom_fields',
              'create_custom_field',
              'update_custom_field',
              'delete_custom_field',
              'list_discounts',
              'create_discount',
              'delete_discount',
              'list_discount_types',
              'create_discount_type',
              'delete_discount_type',
              'list_event_types',
              'create_event_type',
              'update_event_type',
              'delete_event_type',
              'list_file_types',
              'list_job_closed_reasons',
              'create_job_closed_reason',
              'list_job_roles',
              'create_job_role',
              'list_job_types',
              'create_job_type',
              'list_lead_sources',
              'create_lead_source',
              'list_lead_statuses',
              'create_lead_status',
              'list_product_types',
              'create_product_type'
            ],
            description: 'Settings action to perform'
          },
          brand_id: {
            type: 'string',
            description: 'Brand ID for update/delete'
          },
          field_id: {
            type: 'string',
            description: 'Custom field ID'
          },
          discount_id: {
            type: 'string',
            description: 'Discount ID'
          },
          event_type_id: {
            type: 'string',
            description: 'Event type ID'
          },
          name: {
            type: 'string',
            description: 'Name for new entity'
          },
          field_type: {
            type: 'string',
            description: 'Custom field type'
          },
          entity_type: {
            type: 'string',
            description: 'Entity the field applies to (job, contact, event)'
          },
          discount_amount: {
            type: 'number',
            description: 'Discount amount'
          },
          discount_percent: {
            type: 'number',
            description: 'Discount percent'
          },
          color: {
            type: 'string',
            description: 'Color for event types'
          },
          outcome: {
            type: 'string',
            description: 'Outcome for job closed reasons (won, lost)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vsco_manage_users',
      description: '👥 VSCO: Manage studio team members - list, create, update users, manage roles and permissions for Party Favor Photo team.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_users',
              'get_user',
              'create_user',
              'update_user',
              'delete_user',
              'list_timezones'
            ],
            description: 'User management action'
          },
          user_id: {
            type: 'string',
            description: 'User ID for get/update/delete'
          },
          name: {
            type: 'string',
            description: 'User name'
          },
          email: {
            type: 'string',
            description: 'User email'
          },
          role: {
            type: 'string',
            description: 'User role (admin, staff, etc.)'
          },
          is_active: {
            type: 'boolean',
            description: 'Whether user is active'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  // ====================================================================
  // 🔄 GITHUB CONTRIBUTION SYNC TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'sync_github_contributions',
      description: '🔄 Sync GitHub commits to the contribution system and award XMRT credits. Fetches recent commits from the repository, validates them, and awards XMRT based on contribution type and quality.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository name (e.g., "XMRT-Ecosystem"). Default: XMRT-Ecosystem'
          },
          owner: {
            type: 'string',
            description: 'Repository owner (e.g., "DevGruGold"). Default: DevGruGold'
          },
          max_commits: {
            type: 'number',
            description: 'Maximum commits to sync (1-100). Default: 100'
          }
        },
        required: []
      }
    }
  },
  // ====================================================================
  // 📋 CORPORATE LICENSING TOOLS (Bidirectional Onboarding)
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'start_license_application',
      description: '📋 Start a new corporate license application through conversation. Creates a draft that can be completed incrementally as user provides information.',
      parameters: {
        type: 'object',
        properties: {
          session_key: {
            type: 'string',
            description: 'Current conversation session key for linking'
          },
          company_name: {
            type: 'string',
            description: 'Company name (required to start)'
          },
          company_size: {
            type: 'number',
            description: 'Number of employees'
          },
          contact_name: {
            type: 'string',
            description: 'Contact person name'
          },
          contact_email: {
            type: 'string',
            description: 'Contact email address'
          }
        },
        required: [
          'session_key',
          'company_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_license_application',
      description: '📝 Update an existing draft license application with new information gathered from conversation.',
      parameters: {
        type: 'object',
        properties: {
          application_id: {
            type: 'string',
            description: 'Application ID to update'
          },
          session_key: {
            type: 'string',
            description: 'Session key to find draft if no ID provided'
          },
          company_size: {
            type: 'number',
            description: 'Number of employees'
          },
          industry: {
            type: 'string',
            description: 'Industry sector'
          },
          current_ceo_salary: {
            type: 'number',
            description: 'CEO annual salary'
          },
          current_cto_salary: {
            type: 'number',
            description: 'CTO annual salary'
          },
          current_cfo_salary: {
            type: 'number',
            description: 'CFO annual salary'
          },
          current_coo_salary: {
            type: 'number',
            description: 'COO annual salary'
          },
          contact_name: {
            type: 'string',
            description: 'Contact person name'
          },
          contact_email: {
            type: 'string',
            description: 'Contact email'
          },
          contact_phone: {
            type: 'string',
            description: 'Contact phone'
          },
          contact_title: {
            type: 'string',
            description: 'Contact job title'
          },
          tier_requested: {
            type: 'string',
            enum: [
              'free_trial',
              'basic',
              'pro',
              'enterprise'
            ],
            description: 'License tier'
          },
          notes: {
            type: 'string',
            description: 'Additional notes'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_license_savings',
      description: '💰 Calculate potential savings from AI executive replacement. Use this to show users their estimated savings and per-employee redistribution.',
      parameters: {
        type: 'object',
        properties: {
          ceo_salary: {
            type: 'number',
            description: 'CEO annual compensation'
          },
          cto_salary: {
            type: 'number',
            description: 'CTO annual compensation'
          },
          cfo_salary: {
            type: 'number',
            description: 'CFO annual compensation'
          },
          coo_salary: {
            type: 'number',
            description: 'COO annual compensation'
          },
          employee_count: {
            type: 'number',
            description: 'Total number of employees'
          }
        },
        required: [
          'employee_count'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'submit_license_application',
      description: '✅ Submit a completed license application. Calculates final savings and marks application as submitted.',
      parameters: {
        type: 'object',
        properties: {
          application_id: {
            type: 'string',
            description: 'Application ID to submit'
          },
          session_key: {
            type: 'string',
            description: 'Session key to find draft if no ID'
          },
          compliance_commitment: {
            type: 'boolean',
            description: 'User confirms ethical commitment (required)'
          }
        },
        required: [
          'compliance_commitment'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_license_application_status',
      description: '📊 Check the status of a license application by ID or email.',
      parameters: {
        type: 'object',
        properties: {
          application_id: {
            type: 'string',
            description: 'Application ID'
          },
          email: {
            type: 'string',
            description: 'Contact email to find applications'
          }
        },
        required: []
      }
    }
  },
  // ==================== ECOSYSTEM COORDINATION TOOLS ====================
  {
    type: "function",
    function: {
      name: "trigger_ecosystem_coordination",
      description: "Trigger the XMRT-Ecosystem multi-agent coordination cycle. Use this when you need to coordinate agents across all ecosystem repositories, perform health checks, or generate comprehensive ecosystem reports.",
      parameters: {
        type: "object",
        properties: {
          cycle_type: {
            type: "string",
            enum: [
              "standard",
              "emergency",
              "analysis"
            ],
            description: "Type of coordination cycle: 'standard' for normal operations, 'emergency' for urgent issues, 'analysis' for deep ecosystem analysis"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_ecosystem_status",
      description: "Get comprehensive health status and information about all XMRT Ecosystem agents, services, and deployments. Returns agent list, health checks, system status, and coordination history.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_ecosystem_agents",
      description: "Query and discover all agents across the XMRT ecosystem including Suite AI executives, Vercel deployments, and GitHub-based agents. Returns detailed agent information with capabilities, status, and endpoints.",
      parameters: {
        type: "object",
        properties: {
          filter_by: {
            type: "string",
            enum: [
              "all",
              "active",
              "supabase",
              "vercel",
              "priority"
            ],
            description: "Filter agents by type or status"
          }
        },
        required: []
      }
    }
  },
  // ====================================================================
  // 📧 VSCO SUITE QUOTE WORKFLOW
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'create_suite_quote',
      description: '📧 Create a Suite Enterprise quote in VSCO and automatically send it via email with Stripe payment link. This triggers the full VSCO workflow: creates contact, job (SuiteEnterprise type), links them, generates order/quote, and fires the Táve email automation to send the quote from pfpattendants@gmail.com.',
      parameters: {
        type: 'object',
        properties: {
          company_name: {
            type: 'string',
            description: 'Company name for the quote (required)'
          },
          contact_email: {
            type: 'string',
            format: 'email',
            description: 'Email address to send quote to (required)'
          },
          contact_name: {
            type: 'string',
            description: 'Full name of contact (optional - will parse first/last)'
          },
          tier: {
            type: 'string',
            enum: [
              'basic',
              'pro',
              'enterprise'
            ],
            description: 'Suite pricing tier (default: enterprise)'
          },
          employee_count: {
            type: 'number',
            description: 'Number of employees for savings calculation (optional)'
          },
          notes: {
            type: 'string',
            description: 'Additional notes to include with the quote (optional)'
          },
          executive_salaries: {
            type: 'object',
            description: 'Current executive salaries for savings calculation (optional)',
            properties: {
              ceo: {
                type: 'number'
              },
              cto: {
                type: 'number'
              },
              cfo: {
                type: 'number'
              },
              coo: {
                type: 'number'
              }
            }
          }
        },
        required: [
          'company_name',
          'contact_email'
        ]
      }
    }
  },
  // ====================================================================
  // 📊 ANALYTICS & LOG MANAGEMENT TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'sync_function_logs',
      description: '🔄 Manually trigger synchronization of edge function logs to eliza_function_usage table. Use when you need immediate access to recent logs that may not have been synced yet. Logs are auto-synced every 15 minutes, but this forces immediate sync.',
      parameters: {
        type: 'object',
        properties: {
          hours_back: {
            type: 'number',
            description: 'How many hours of logs to sync (default: 1, max: 24)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_function_usage_analytics',
      description: '📊 Get comprehensive analytics for edge function usage including success rates, execution times, error patterns, and trends. Essential for understanding function health and making data-driven decisions.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Filter to specific function (optional - omit for all functions)'
          },
          time_window_hours: {
            type: 'number',
            description: 'Time window for analysis in hours (default: 24)'
          },
          group_by: {
            type: 'string',
            enum: [
              'function',
              'category',
              'executive',
              'hour'
            ],
            description: 'How to group the results (default: function)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_system_status',
      description: '🏥 Get comprehensive ecosystem status report with 15+ sections including health score, governance, knowledge base, GitHub activity, workflows, AI providers, XMRT charger, user acquisition, cron jobs, and more. This is the PRIMARY tool for ecosystem health checks.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  // ====================================================================
  // ☁️ GOOGLE CLOUD SERVICES (Gmail, Drive, Sheets, Calendar)
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'google_cloud_auth',
      description: '☁️ Unified Google Cloud operations via google-cloud-auth. Handles Gmail, Drive, Sheets, and Calendar actions through a single authenticated endpoint.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'status',
              'send_email',
              'list_emails',
              'get_email',
              'create_draft',
              'list_files',
              'upload_file',
              'get_file',
              'download_file',
              'create_folder',
              'share_file',
              'create_spreadsheet',
              'read_sheet',
              'write_sheet',
              'append_sheet',
              'get_spreadsheet_info',
              'list_events',
              'create_event',
              'update_event',
              'delete_event',
              'get_event'
            ],
            description: 'google-cloud-auth action to perform'
          },
          to: {
            type: 'string',
            description: 'Recipient email address (for send_email, create_draft)'
          },
          subject: {
            type: 'string',
            description: 'Email subject line'
          },
          body: {
            type: 'string',
            description: 'Email body content (supports HTML if is_html=true)'
          },
          is_html: {
            type: 'boolean',
            description: 'Whether body is HTML format (default: false)'
          },
          query: {
            type: 'string',
            description: 'Search query for list_emails (e.g., "is:unread", "from:client@example.com")'
          },
          message_id: {
            type: 'string',
            description: 'Message ID for get_email'
          },
          max_results: {
            type: 'number',
            description: 'Max emails to return (default: 20)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'google_drive',
      description: '📁 Manage files in XMRT Google Drive. Actions: list_files, upload_file, get_file, download_file, create_folder, share_file. Use for storing reports, sharing documents, organizing project files.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_files',
              'upload_file',
              'get_file',
              'download_file',
              'create_folder',
              'share_file'
            ],
            description: 'Drive action to perform'
          },
          query: {
            type: 'string',
            description: 'Search query for list_files (e.g., "name contains \'report\'")'
          },
          file_id: {
            type: 'string',
            description: 'File ID for get_file, download_file, share_file'
          },
          folder_id: {
            type: 'string',
            description: 'Parent folder ID for list_files, upload_file'
          },
          file_name: {
            type: 'string',
            description: 'Name for new file (upload_file)'
          },
          content: {
            type: 'string',
            description: 'File content to upload'
          },
          mime_type: {
            type: 'string',
            description: 'MIME type (default: text/plain)'
          },
          folder_name: {
            type: 'string',
            description: 'Name for new folder (create_folder)'
          },
          parent_folder_id: {
            type: 'string',
            description: 'Parent folder for create_folder'
          },
          email: {
            type: 'string',
            description: 'Email to share with (share_file)'
          },
          role: {
            type: 'string',
            enum: [
              'reader',
              'writer',
              'commenter'
            ],
            description: 'Share permission level (default: reader)'
          },
          max_results: {
            type: 'number',
            description: 'Max files to return (default: 20)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'google_sheets',
      description: '📊 Create and manage Google Spreadsheets. Actions: create_spreadsheet, read_sheet, write_sheet, append_sheet, get_spreadsheet_info. Use for live dashboards, analytics, data tracking.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'create_spreadsheet',
              'read_sheet',
              'write_sheet',
              'append_sheet',
              'get_spreadsheet_info'
            ],
            description: 'Sheets action to perform'
          },
          title: {
            type: 'string',
            description: 'Spreadsheet title (create_spreadsheet)'
          },
          sheet_name: {
            type: 'string',
            description: 'Sheet tab name (create_spreadsheet, default: Sheet1)'
          },
          spreadsheet_id: {
            type: 'string',
            description: 'Spreadsheet ID for read/write/append operations'
          },
          range: {
            type: 'string',
            description: 'A1 notation range (e.g., "Sheet1!A1:C10")'
          },
          values: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            description: 'Data rows to write/append (e.g., [["Name", "Email"], ["John", "john@example.com"]])'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'google_calendar',
      description: '📅 Manage calendar and schedule events. Actions: list_events, create_event, update_event, delete_event, get_event. Use for scheduling meetings, tracking deadlines, automated reminders.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_events',
              'create_event',
              'update_event',
              'delete_event',
              'get_event'
            ],
            description: 'Calendar action to perform'
          },
          calendar_id: {
            type: 'string',
            description: 'Calendar ID (default: "primary")'
          },
          event_id: {
            type: 'string',
            description: 'Event ID for update/delete/get operations'
          },
          title: {
            type: 'string',
            description: 'Event title/summary'
          },
          start_time: {
            type: 'string',
            description: 'Start time in ISO format (e.g., "2025-12-15T10:00:00-05:00")'
          },
          end_time: {
            type: 'string',
            description: 'End time in ISO format'
          },
          description: {
            type: 'string',
            description: 'Event description/notes'
          },
          attendees: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of attendee email addresses'
          },
          time_min: {
            type: 'string',
            description: 'Start of time range for list_events (ISO format)'
          },
          time_max: {
            type: 'string',
            description: 'End of time range for list_events (ISO format)'
          },
          max_results: {
            type: 'number',
            description: 'Max events to return (default: 10)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'google_cloud_status',
      description: '🔐 Check Google Cloud OAuth connection status. Returns which services (Gmail, Drive, Sheets, Calendar) are available and whether authorization is complete.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  // ====================================================================
  // 🔍 FUNCTION INTROSPECTION TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'introspect_function_actions',
      description: '🔍 DISCOVER ACTIONS: Get the complete list of all valid action names and their parameters for multi-action edge functions. Use this BEFORE attempting to use an action you are unsure about. Supported functions: vsco-workspace (89 actions), github-integration (25+ actions), agent-manager (27+ actions), workflow-template-manager (8 actions). Returns action names, required/optional params, and example payloads.',
      parameters: {
        type: 'object',
        properties: {
          function_name: {
            type: 'string',
            description: 'Function to introspect. Options: vsco-workspace, github-integration, agent-manager, workflow-template-manager. Leave empty to see all supported functions.'
          },
          category: {
            type: 'string',
            description: 'Optional: Filter by action category (e.g., "jobs", "contacts", "issues", "tasks")'
          }
        },
        required: []
      }
    }
  },
  // ====================================================================
  // ⏰ CRON REGISTRY & EXECUTION CONTEXT TOOLS
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'query_cron_registry',
      description: '⏰ Query the unified cron job registry across ALL platforms (Supabase Native, pg_cron, GitHub Actions, Vercel). See what scheduled jobs exist, their run status, failures, and execution stats. Essential for understanding what autonomous processes are running and diagnosing scheduling issues.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'list_all',
              'list_by_platform',
              'get_job_status',
              'get_next_runs',
              'get_failing_jobs',
              'get_execution_stats'
            ],
            description: 'Registry action: list_all (all jobs), list_by_platform (filter by source), get_job_status (specific job), get_next_runs (upcoming executions), get_failing_jobs (problem jobs), get_execution_stats (aggregate stats)'
          },
          platform: {
            type: 'string',
            enum: [
              'supabase_native',
              'pg_cron',
              'github_actions',
              'vercel_cron'
            ],
            description: 'Filter by execution platform (for list_by_platform, get_execution_stats)'
          },
          function_name: {
            type: 'string',
            description: 'Filter by function name (for get_job_status)'
          },
          job_name: {
            type: 'string',
            description: 'Specific job name to query (for get_job_status)'
          },
          include_inactive: {
            type: 'boolean',
            description: 'Include disabled/inactive jobs (default: false)'
          },
          time_window_hours: {
            type: 'number',
            description: 'Time window for stats/failures (default: 24 hours)'
          }
        },
        required: [
          'action'
        ]
      }
    }
  },
  // ====================================================================
  // 🔷 OLLAMA / MUAPI TOOLS (replaced Vertex AI)
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'vertex_ai_generate',
      description: '🔷 Generate text using local Ollama (qwen3.5:latest). Supports text generation and chat. Use for general AI text tasks, analysis, and creative writing. Fast, local, no API cost.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Text prompt for generation'
          },
          model: {
            type: 'string',
            description: 'Ollama model (default: qwen3.5:latest)'
          },
          temperature: {
            type: 'number',
            description: 'Creativity level 0-1 (default: 0.7)'
          },
          system_prompt: {
            type: 'string',
            description: 'Optional system instructions'
          }
        },
        required: [
          'prompt'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vertex_ai_count_tokens',
      description: '🔢 Token counting not available with local Ollama. Use approximate: text.length / 4.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to estimate token count for'
          }
        },
        required: [
          'text'
        ]
      }
    }
  },
  // ====================================================================
  // 🖼️ MUAPI IMAGE GENERATION (replaced Vertex AI Imagen)
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'vertex_generate_image',
      description: '🖼️ Generate images via MuAPI (flux-dev-image). Returns a public URL to the generated image. Use for creating visual content, diagrams, illustrations, marketing materials.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed description of the image to generate. Be specific about style, composition, colors, and subject matter.'
          },
          model: {
            type: 'string',
            description: 'Image model (default: flux-dev-image)'
          },
          aspect_ratio: {
            type: 'string',
            enum: [
              '16:9',
              '1:1',
              '9:16'
            ],
            description: 'Image aspect ratio (default: 1:1)'
          }
        },
        required: [
          'prompt'
        ]
      }
    }
  },
  // ====================================================================
  // 🎬 MUAPI VIDEO GENERATION (replaced Vertex AI Veo)
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'vertex_generate_video',
      description: '🎬 Generate videos via MuAPI (veo3-fast-text-to-video). Returns an operation ID for async polling. Use for promotional videos, animations, and cinematic content.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed description of the video to generate. Include motion, scene, style, and camera movement details.'
          },
          model: {
            type: 'string',
            description: 'Video model (default: veo3-fast-text-to-video). Options: veo3-fast-text-to-video ($0.60), veo3.1-lite-text-to-video ($0.30), openai-sora-2-text-to-video ($0.80)'
          },
          aspect_ratio: {
            type: 'string',
            enum: [
              '16:9',
              '9:16'
            ],
            description: 'Video aspect ratio: 16:9 (landscape) or 9:16 (portrait/vertical)'
          },
          duration_seconds: {
            type: 'number',
            description: 'Video duration in seconds (default: 5)'
          }
        },
        required: [
          'prompt'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'vertex_check_video_status',
      description: '📽️ Check the status of an async video generation operation via MuAPI. Poll this endpoint until status="done" to get the video URL. Video generation typically takes 30-120 seconds.',
      parameters: {
        type: 'object',
        properties: {
          operation_name: {
            type: 'string',
            description: 'Full operation name returned from vertex_generate_video (e.g., "projects/.../operations/...")'
          }
        },
        required: [
          'operation_name'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'dispatch_local_task',
      description: '🚀 DISPATCH TASK TO LOCAL MACHINE - define a task to be executed or logged on the user\'s local computer via the Antigravity Direct Bridge. Use this when you need to run something physically on the user\'s dev machine or just want to notify them locally.',
      parameters: {
        type: 'object',
        properties: {
          task_payload: {
            type: 'object',
            description: 'The task details',
            properties: {
              title: {
                type: 'string',
                description: 'Task title'
              },
              description: {
                type: 'string',
                description: 'Task description'
              },
              command: {
                type: 'string',
                description: 'Optional: shell command to execute (use caution)'
              },
              priority: {
                type: 'number',
                description: 'Priority 1-10'
              }
            },
            required: [
              'title'
            ]
          },
          target_device: {
            type: 'string',
            description: 'Target device ID (default: "primary")',
            default: 'primary'
          }
        },
        required: [
          'task_payload'
        ]
      }
    }
  },
  // ====================================================================
  // 🔗 OPENCLAW RELAY — Communicate with the local OpenClaw agent
  // ====================================================================
  {
    type: 'function',
    function: {
      name: 'send_to_openclaw',
      description: '📡 SEND MESSAGE TO LOCAL OPENCLAW AGENT — Queue a task or message for the local OpenClaw agent running on the user\'s machine. OpenClaw polls for messages and will act on them. Use this when you need local execution, file system access, WhatsApp messaging, or any task that requires the user\'s local environment. Returns relay_tag and message_id; use check_openclaw_reply with the relay_tag to read OpenClaw\'s response.',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The task or message to send to OpenClaw. Be specific and actionable — OpenClaw will read this and act on it.'
          },
          relay_tag: {
            type: 'string',
            description: 'Optional: custom identifier for this relay exchange (e.g., "task-web-search-001"). Auto-generated if omitted.'
          },
          metadata: {
            type: 'object',
            description: 'Optional: extra context for OpenClaw (e.g., { "task_id": "...", "urgency": "high" })'
          }
        },
        required: [
          'message'
        ]
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_openclaw_reply',
      description: '📬 CHECK FOR OPENCLAW\'S REPLY — Look up OpenClaw\'s response to a previously sent message. Use the relay_tag returned by send_to_openclaw. Returns the reply text if OpenClaw has responded, or null if still pending.',
      parameters: {
        type: 'object',
        properties: {
          relay_tag: {
            type: 'string',
            description: 'The relay_tag returned when you called send_to_openclaw (e.g., "eliza-relay-a1b2c3d4")'
          }
        },
        required: [
          'relay_tag'
        ]
      }
    }
  }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL2VsaXphVG9vbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFbGl6YSdzIFRvb2wgRGVmaW5pdGlvbnMgLSBTaW5nbGUgU291cmNlIG9mIFRydXRoXG4gKiBcbiAqIEFsbCBBSSBlbmRwb2ludHMgKGxvdmFibGUtY2hhdCwgZ2VtaW5pLWNoYXQsIGRlZXBzZWVrLWNoYXQsIGV0Yy4pIHNob3VsZCBpbXBvcnRcbiAqIEVMSVpBX1RPT0xTIGZyb20gdGhpcyBmaWxlIHRvIGVuc3VyZSBjb25zaXN0ZW50IHRvb2wgYXZhaWxhYmlsaXR5IGFjcm9zcyBhbGwgQUkgc2VydmljZXMuXG4gKiBcbiAqIOKaoSBDUklUSUNBTDogQUxMIFRPT0xTIEVYRUNVVEUgUkVBTCBGVU5DVElPTlMsIE5PVCBTSU1VTEFUSU9OU1xuICogLSBUb29scyBhcHBlYXIgaW4gXCLwn5CNIEVsaXphJ3MgQ29kZSBFeGVjdXRpb24gTG9nXCIgc2lkZWJhciBtb25pdG9yXG4gKiAtIEVsaXphIE1VU1Qgd2FpdCBmb3IgYWN0dWFsIHJlc3VsdHMgYmVmb3JlIHJlc3BvbmRpbmcgdG8gdXNlclxuICogLSBDaGF0IHNob3dzIGFuYWx5c2lzL291dGNvbWVzLCBub3QgcmF3IGNvZGUgKGNvZGUgaXMgaW4gZXhlY3V0aW9uIGxvZylcbiAqL1xuXG5cbmV4cG9ydCBjb25zdCBFTElaQV9UT09MUyA9IFtcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+agCBTVEFFIC0gU1VJVEUgVEFTSyBBVVRPTUFUSU9OIEVOR0lORSBUT09MU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NyZWF0ZV90YXNrX2Zyb21fdGVtcGxhdGUnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OLIFNUQUU6IENyZWF0ZSBhIG5ldyB0YXNrIHVzaW5nIGEgcHJlZGVmaW5lZCB0ZW1wbGF0ZS4gQXV0b21hdGljYWxseSBmaWxscyBpbiBjaGVja2xpc3QsIHJlcXVpcmVkIHNraWxscywgcHJpb3JpdHksIGFuZCBzdGFnZSBiYXNlZCBvbiB0ZW1wbGF0ZSBjYXRlZ29yeS4gVXNlIHRoaXMgZm9yIGNvbnNpc3RlbnQsIHN0YW5kYXJkaXplZCB0YXNrIGNyZWF0aW9uLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGVtcGxhdGVfbmFtZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RlbXBsYXRlIG5hbWU6IGNvZGVfcmV2aWV3LCBidWdfZml4LCBmZWF0dXJlX2ltcGxlbWVudGF0aW9uLCBpbmZyYXN0cnVjdHVyZV9jaGVjaywgZGVwbG95bWVudF9waXBlbGluZSwgcmVzZWFyY2hfYW5hbHlzaXMsIHByb3Bvc2FsX2V2YWx1YXRpb24sIG9wZXJhdGlvbnNfdGFzaywgc3lzdGVtX2hlYWx0aF9pbnZlc3RpZ2F0aW9uLCBtaW5pbmdfb3B0aW1pemF0aW9uLCBkZXZpY2VfaW50ZWdyYXRpb24nLFxuICAgICAgICAgICAgZW51bTogWydjb2RlX3JldmlldycsICdidWdfZml4JywgJ2ZlYXR1cmVfaW1wbGVtZW50YXRpb24nLCAnaW5mcmFzdHJ1Y3R1cmVfY2hlY2snLCAnZGVwbG95bWVudF9waXBlbGluZScsICdyZXNlYXJjaF9hbmFseXNpcycsICdwcm9wb3NhbF9ldmFsdWF0aW9uJywgJ29wZXJhdGlvbnNfdGFzaycsICdzeXN0ZW1faGVhbHRoX2ludmVzdGlnYXRpb24nLCAnbWluaW5nX29wdGltaXphdGlvbicsICdkZXZpY2VfaW50ZWdyYXRpb24nXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVGFzayB0aXRsZSAtIHdpbGwgYmUgc3Vic3RpdHV0ZWQgaW50byB0ZW1wbGF0ZSBkZXNjcmlwdGlvbicgfSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdPcHRpb25hbDogT3ZlcnJpZGUgdGVtcGxhdGUgZGVzY3JpcHRpb24gd2l0aCBjdXN0b20gdGV4dCcgfSxcbiAgICAgICAgICBwcmlvcml0eTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdPcHRpb25hbDogT3ZlcnJpZGUgZGVmYXVsdCBwcmlvcml0eSAoMS0xMCwgaGlnaGVyID0gbW9yZSB1cmdlbnQpJyB9LFxuICAgICAgICAgIGF1dG9fYXNzaWduOiB7IHR5cGU6ICdib29sZWFuJywgZGVzY3JpcHRpb246ICdPcHRpb25hbDogQXV0b21hdGljYWxseSBhc3NpZ24gdG8gYmVzdC1tYXRjaGluZyBhZ2VudCAoZGVmYXVsdDogdHJ1ZSknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGVtcGxhdGVfbmFtZScsICd0aXRsZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3NtYXJ0X2Fzc2lnbl90YXNrJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+kliBTVEFFOiBJbnRlbGxpZ2VudGx5IGFzc2lnbiBhIHRhc2sgdG8gdGhlIGJlc3QtbWF0Y2hpbmcgYWdlbnQgdXNpbmcgd2VpZ2h0ZWQgc2NvcmluZzogc2tpbGxzICg0MCUpLCB3b3JrbG9hZCAoMzAlKSwgc3VjY2VzcyByYXRlICgyMCUpLCBhY3Rpdml0eSAoMTAlKS4gVXNlIHRoaXMgZm9yIG9wdGltYWwgYWdlbnQtdGFzayBtYXRjaGluZy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHRhc2tfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVVVJRCBvZiB0aGUgdGFzayB0byBhc3NpZ24nIH0sXG4gICAgICAgICAgcHJlZmVyX2FnZW50X2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBQcmVmZXIgdGhpcyBhZ2VudCBpZiB0aGV5IG1lZXQgbWluaW11bSBza2lsbCBjcml0ZXJpYScgfSxcbiAgICAgICAgICBtaW5fc2tpbGxfbWF0Y2g6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IE1pbmltdW0gc2tpbGwgb3ZlcmxhcCByZXF1aXJlZCAoMC0xLCBkZWZhdWx0OiAwLjMgPSAzMCUpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Rhc2tfaWQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRfYXV0b21hdGlvbl9tZXRyaWNzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiiBTVEFFOiBHZXQgY29tcHJlaGVuc2l2ZSBhdXRvbWF0aW9uIGNvdmVyYWdlIG1ldHJpY3MgaW5jbHVkaW5nIHRlbXBsYXRlIHVzYWdlIHJhdGUsIGF1dG8tYXNzaWdubWVudCByYXRlLCBrbm93bGVkZ2UgZXh0cmFjdGlvbiByYXRlLCBhZ2VudCB1dGlsaXphdGlvbiwgYW5kIGF2ZXJhZ2UgY29tcGxldGlvbiB0aW1lLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGltZV93aW5kb3dfaG91cnM6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IFRpbWUgd2luZG93IGZvciBtZXRyaWNzIChkZWZhdWx0OiAyNCBob3VycyknIH0sXG4gICAgICAgICAgYnJlYWtkb3duX2J5OiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ2NhdGVnb3J5JywgJ2FnZW50JywgJ3RlbXBsYXRlJ10sIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IEdyb3VwIG1ldHJpY3MgYnkgY2F0ZWdvcnksIGFnZW50LCBvciB0ZW1wbGF0ZScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndXBkYXRlX3Rhc2tfY2hlY2tsaXN0JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4pyFIFNUQUUgUGhhc2UgMjogVXBkYXRlIGEgdGFzayBjaGVja2xpc3QgaXRlbSBzdGF0dXMuIE1hcmsgaXRlbXMgYXMgY29tcGxldGVkIG9yIHVuY29tcGxldGVkIHRvIHRyYWNrIHByb2dyZXNzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVVUlEIG9mIHRoZSB0YXNrJyB9LFxuICAgICAgICAgIGl0ZW1faW5kZXg6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnSW5kZXggb2YgY2hlY2tsaXN0IGl0ZW0gKDAtYmFzZWQpJyB9LFxuICAgICAgICAgIGl0ZW1fdGV4dDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBbHRlcm5hdGl2ZTogZXhhY3QgdGV4dCBvZiBjaGVja2xpc3QgaXRlbScgfSxcbiAgICAgICAgICBjb21wbGV0ZWQ6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ1doZXRoZXIgaXRlbSBpcyBjb21wbGV0ZWQgKHRydWUpIG9yIG5vdCAoZmFsc2UpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Rhc2tfaWQnLCAnY29tcGxldGVkJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAncmVzb2x2ZV9ibG9ja2VkX3Rhc2snLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5STIFNUQUUgUGhhc2UgMjogQXR0ZW1wdCB0byBhdXRvLXJlc29sdmUgYSBibG9ja2VkIHRhc2suIEFuYWx5emVzIGJsb2NrZXIgcmVhc29uIGFuZCBhcHBsaWVzIHJlc29sdXRpb24gcnVsZXMgZm9yIGdpdGh1YiwgYXBpLCBkZXBlbmRlbmN5IGlzc3Vlcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHRhc2tfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVVVJRCBvZiB0aGUgYmxvY2tlZCB0YXNrIHRvIHJlc29sdmUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGFza19pZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF9zdGFlX3JlY29tbWVuZGF0aW9ucycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfkqEgU1RBRSBQaGFzZSAzOiBHZXQgb3B0aW1pemF0aW9uIHJlY29tbWVuZGF0aW9ucyBmb3IgYWdlbnRzLCB0ZW1wbGF0ZXMsIGFuZCB3b3JrbG9hZC4gSWRlbnRpZmllcyBsb3cgcGVyZm9ybWVycywgc2tpbGwgZ2FwcywgYW5kIGltYmFsYW5jZXMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnYWR2YW5jZV90YXNrX3N0YWdlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4o+pIFNUQUUgUGhhc2UgMjogTWFudWFsbHkgYWR2YW5jZSBhIHRhc2sgdG8gdGhlIG5leHQgcGlwZWxpbmUgc3RhZ2UgKERJU0NVU1PihpJQTEFO4oaSRVhFQ1VUReKGklZFUklGWeKGkklOVEVHUkFURSkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0YXNrX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1VVSUQgb2YgdGhlIHRhc2sgdG8gYWR2YW5jZScgfSxcbiAgICAgICAgICB0YXJnZXRfc3RhZ2U6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnRElTQ1VTUycsICdQTEFOJywgJ0VYRUNVVEUnLCAnVkVSSUZZJywgJ0lOVEVHUkFURSddLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBzcGVjaWZpYyBzdGFnZSB0byBhZHZhbmNlIHRvJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Rhc2tfaWQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2RlbGVnYXRlX3RvX3NwZWNpYWxpc3QnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn6SdIE1BTkFHRVItU1BFQ0lBTElTVCBQUk9UT0NPTDogRGVsZWdhdGUgYSBjb21wbGV4IHN1Yi10YXNrIHRvIGEgU3VwZXJEdXBlciBTcGVjaWFsaXN0IEFnZW50LiBVc2UgdGhpcyB3aGVuIHlvdSAodGhlIE1hbmFnZXIpIG5lZWQgc3BlY2lmaWMgZXhwZXJ0aXNlIChlLmcuLCBcInNvY2lhbC12aXJhbFwiIGZvciB0d2VldHMsIFwiY29kZS1hcmNoaXRlY3RcIiBmb3Igc3lzdGVtIGRlc2lnbiwgXCJmaW5hbmNlXCIgZm9yIGFuYWx5c2lzKS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHNwZWNpYWxpc3Rfcm9sZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbXG4gICAgICAgICAgICAgICdzb2NpYWwtdmlyYWwnLFxuICAgICAgICAgICAgICAnY29kZS1hcmNoaXRlY3QnLFxuICAgICAgICAgICAgICAnYnVzaW5lc3MtZ3Jvd3RoJyxcbiAgICAgICAgICAgICAgJ2ZpbmFuY2UtaW52ZXN0bWVudCcsXG4gICAgICAgICAgICAgICdkZXNpZ24tYnJhbmQnLFxuICAgICAgICAgICAgICAnY29udGVudC1tZWRpYScsXG4gICAgICAgICAgICAgICdjb21tdW5pY2F0aW9uLW91dHJlYWNoJyxcbiAgICAgICAgICAgICAgJ3Jlc2VhcmNoLWludGVsbGlnZW5jZScsXG4gICAgICAgICAgICAgICdpbnRlZ3JhdGlvbicsXG4gICAgICAgICAgICAgICdkZXZlbG9wbWVudC1jb2FjaCcsXG4gICAgICAgICAgICAgICdkb21haW4tZXhwZXJ0cydcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBzcGVjaWZpYyBzcGVjaWFsaXN0IHJvbGUgdG8gaGFuZGxlIHRoaXMgdGFzay4nXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0YXNrX2Rlc2NyaXB0aW9uOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NsZWFyLCBjb25jaXNlIGluc3RydWN0aW9ucyBmb3IgdGhlIHNwZWNpYWxpc3QuJyB9LFxuICAgICAgICAgIGNvbnRleHRfZGF0YTogeyB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdBbnkgbmVjZXNzYXJ5IEpTT04gY29udGV4dCAocHJldmlvdXMgcmVzdWx0cywgY29kZSBzbmlwcGV0cywgdXNlciByZXF1aXJlbWVudHMpIGZvciB0aGUgc3BlY2lhbGlzdCB0byBkbyB0aGVpciBqb2IuJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3NwZWNpYWxpc3Rfcm9sZScsICd0YXNrX2Rlc2NyaXB0aW9uJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+noCBLTk9XTEVER0UgTUFOQUdFTUVOVCBUT09MU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3N0b3JlX2tub3dsZWRnZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfp6AgU3RvcmUgYSBwaWVjZSBvZiBrbm93bGVkZ2UsIGZhY3QsIG9yIGluc2lnaHQgaW50byB0aGUgcGVyc2lzdGVudCBrbm93bGVkZ2UgYmFzZSBmb3IgZnV0dXJlIHJlY2FsbC4gVXNlIHRoaXMgd2hlbiB5b3UgbGVhcm4gc29tZXRoaW5nIGltcG9ydGFudCBhYm91dCB0aGUgdXNlciwgdGhlaXIgYnVzaW5lc3MsIHByZWZlcmVuY2VzLCBvciBhbnkgZmFjdHVhbCBpbmZvcm1hdGlvbiB3b3J0aCByZW1lbWJlcmluZy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU2hvcnQgZGVzY3JpcHRpdmUgdGl0bGUgZm9yIHRoaXMga25vd2xlZGdlIGl0ZW0gKGUuZy4gXCJVc2VyIHByZWZlcnMgYXN5bmMgY29tbXVuaWNhdGlvblwiKScgfSxcbiAgICAgICAgICB0eXBlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NhdGVnb3J5IG9mIGtub3dsZWRnZTogZmFjdCwgcHJlZmVyZW5jZSwgaW5zaWdodCwgZW50aXR5LCByZWxhdGlvbnNoaXAsIHByb2Nlc3MsIG9yIG90aGVyJywgZW51bTogWydmYWN0JywgJ3ByZWZlcmVuY2UnLCAnaW5zaWdodCcsICdlbnRpdHknLCAncmVsYXRpb25zaGlwJywgJ3Byb2Nlc3MnLCAnb3RoZXInXSB9LFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0Z1bGwgdGV4dCBjb250ZW50IG9mIHRoZSBrbm93bGVkZ2UgdG8gc3RvcmUnIH0sXG4gICAgICAgICAgbWV0YWRhdGE6IHsgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWwga2V5LXZhbHVlIHBhaXJzIGZvciBhZGRpdGlvbmFsIGNvbnRleHQgKGUuZy4gc291cmNlLCB0YWdzLCByZWxhdGVkIGVudGl0eSBuYW1lcyknIH0sXG4gICAgICAgICAgY29uZmlkZW5jZV9zY29yZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdDb25maWRlbmNlIGxldmVsIGZyb20gMC4wIHRvIDEuMCAoZGVmYXVsdCAwLjgpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ25hbWUnLCAndHlwZScsICdkZXNjcmlwdGlvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3NlYXJjaF9rbm93bGVkZ2UnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5SNIFNlYXJjaCB0aGUgcGVyc2lzdGVudCBrbm93bGVkZ2UgYmFzZSBmb3Igc3RvcmVkIGZhY3RzLCBwcmVmZXJlbmNlcywgb3IgaW5zaWdodHMuIFVzZSB0aGlzIHRvIHJlY2FsbCBwcmV2aW91cyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdXNlciBvciB0b3BpY3MgYmVmb3JlIGFuc3dlcmluZyBxdWVzdGlvbnMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBxdWVyeTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOYXR1cmFsIGxhbmd1YWdlIHNlYXJjaCBxdWVyeSAoZS5nLiBcInVzZXIgYnVkZ2V0IHByZWZlcmVuY2VzXCIgb3IgXCJYTVJUIHRva2VuIGRldGFpbHNcIiknIH0sXG4gICAgICAgICAgdHlwZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdPcHRpb25hbCBmaWx0ZXIgYnkga25vd2xlZGdlIHR5cGU6IGZhY3QsIHByZWZlcmVuY2UsIGluc2lnaHQsIGVudGl0eSwgcmVsYXRpb25zaGlwLCBwcm9jZXNzLCBvdGhlcicgfSxcbiAgICAgICAgICBsaW1pdDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdNYXggcmVzdWx0cyB0byByZXR1cm4gKGRlZmF1bHQgNSwgbWF4IDIwKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydxdWVyeSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCfjq8gQ09OVkVSU0FUSU9OQUwgVVNFUiBBQ1FVSVNJVElPTiBUT09MU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3F1YWxpZnlfbGVhZCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfjq8gU2NvcmUgYSBwb3RlbnRpYWwgY3VzdG9tZXIgYmFzZWQgb24gY29udmVyc2F0aW9uIHNpZ25hbHMgKGJ1ZGdldCwgdXJnZW5jeSwgY29tcGFueSBzaXplLCB1c2UgY2FzZSBjb21wbGV4aXR5KS4gUmV0dXJucyBsZWFkIHNjb3JlIDAtMTAwIGFuZCBxdWFsaWZpY2F0aW9uIGxldmVsLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc2Vzc2lvbl9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBjb252ZXJzYXRpb24gc2Vzc2lvbiBrZXknIH0sXG4gICAgICAgICAgdXNlcl9zaWduYWxzOiB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2lnbmFscyBkZXRlY3RlZCBmcm9tIGNvbnZlcnNhdGlvbicsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgIG1lbnRpb25lZF9idWRnZXQ6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ1VzZXIgbWVudGlvbmVkIGJ1ZGdldCBvciB3aWxsaW5nbmVzcyB0byBwYXknIH0sXG4gICAgICAgICAgICAgIGhhc191cmdlbnRfbmVlZDogeyB0eXBlOiAnYm9vbGVhbicsIGRlc2NyaXB0aW9uOiAnVXNlciBleHByZXNzZWQgdXJnZW5jeSBvciB0aW1lIHByZXNzdXJlJyB9LFxuICAgICAgICAgICAgICBjb21wYW55X21lbnRpb25lZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDb21wYW55IG5hbWUgaWYgbWVudGlvbmVkJyB9LFxuICAgICAgICAgICAgICB1c2VfY2FzZV9jb21wbGV4aXR5OiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ3NpbXBsZScsICdtb2RlcmF0ZScsICdjb21wbGV4J10sIGRlc2NyaXB0aW9uOiAnQ29tcGxleGl0eSBvZiB0aGVpciB1c2UgY2FzZScgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnc2Vzc2lvbl9rZXknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdpZGVudGlmeV9zZXJ2aWNlX2ludGVyZXN0JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UjSBBbmFseXplIHVzZXIgbWVzc2FnZSB0byBkZXRlY3QgaW50ZXJlc3QgaW4gc3BlY2lmaWMgbW9uZXRpemVkIHNlcnZpY2VzLiBSZXR1cm5zIHNlcnZpY2UgbmFtZXMgd2l0aCBjb25maWRlbmNlIHNjb3Jlcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHVzZXJfbWVzc2FnZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDdXJyZW50IHVzZXIgbWVzc2FnZSB0byBhbmFseXplJyB9LFxuICAgICAgICAgIGNvbnZlcnNhdGlvbl9oaXN0b3J5OiB7IHR5cGU6ICdhcnJheScsIGl0ZW1zOiB7IHR5cGU6ICdvYmplY3QnLCBwcm9wZXJ0aWVzOiB7IHJvbGU6IHsgdHlwZTogJ3N0cmluZycgfSwgY29udGVudDogeyB0eXBlOiAnc3RyaW5nJyB9IH0gfSwgZGVzY3JpcHRpb246ICdPcHRpb25hbDogcmVjZW50IGNvbnZlcnNhdGlvbiBtZXNzYWdlcyBmb3IgY29udGV4dCcgfSxcbiAgICAgICAgICBzZXNzaW9uX2tleTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdTZXNzaW9uIGtleSB0byB0cmFjayBzZXJ2aWNlcyBpbnRlcmVzdGVkIGluJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3VzZXJfbWVzc2FnZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3N1Z2dlc3RfdGllcl9iYXNlZF9vbl9uZWVkcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfkqEgUmVjb21tZW5kIG9wdGltYWwgcHJpY2luZyB0aWVyIGJhc2VkIG9uIGVzdGltYXRlZCB1c2FnZSBhbmQgYnVkZ2V0LiBSZXR1cm5zIHRpZXIgcmVjb21tZW5kYXRpb24gd2l0aCByZWFzb25pbmcuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBlc3RpbWF0ZWRfbW9udGhseV91c2FnZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdFc3RpbWF0ZWQgQVBJIGNhbGxzIHBlciBtb250aCcgfSxcbiAgICAgICAgICBidWRnZXRfcmFuZ2U6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnYnVkZ2V0LWNvbnNjaW91cycsICdtb2RlcmF0ZScsICdwcmVtaXVtJywgJ2VudGVycHJpc2UnXSwgZGVzY3JpcHRpb246ICdVc2VyIGJ1ZGdldCBjYXRlZ29yeScgfSxcbiAgICAgICAgICBmZWF0dXJlX3JlcXVpcmVtZW50czogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBzcGVjaWZpYyBmZWF0dXJlcyBuZWVkZWQnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnZXN0aW1hdGVkX21vbnRobHlfdXNhZ2UnLCAnYnVkZ2V0X3JhbmdlJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY3JlYXRlX3VzZXJfcHJvZmlsZV9mcm9tX3Nlc3Npb24nLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5GkIENvbnZlcnQgYW5vbnltb3VzIHNlc3Npb24gdG8gaWRlbnRpZmllZCB1c2VyIHByb2ZpbGUuIENvbGxlY3RzIGVtYWlsIGFuZCBsaW5rcyBzZXNzaW9uIHRvIHVzZXJfcHJvZmlsZXMgdGFibGUuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBzZXNzaW9uX2tleTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDdXJyZW50IHNlc3Npb24ga2V5JyB9LFxuICAgICAgICAgIGVtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdlbWFpbCcsIGRlc2NyaXB0aW9uOiAnVXNlciBlbWFpbCBhZGRyZXNzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Nlc3Npb25fa2V5JywgJ2VtYWlsJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2VuZXJhdGVfc3RyaXBlX3BheW1lbnRfbGluaycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfkrMgR2VuZXJhdGUgU3RyaXBlIGNoZWNrb3V0IGxpbmsgZm9yIHRpZXIgdXBncmFkZS4gUmV0dXJucyBzaGFyZWFibGUgcGF5bWVudCBVUkwgd2l0aCBvcHRpb25hbCB0cmlhbCBwZXJpb2QuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjdXN0b21lcl9lbWFpbDogeyB0eXBlOiAnc3RyaW5nJywgZm9ybWF0OiAnZW1haWwnLCBkZXNjcmlwdGlvbjogJ0N1c3RvbWVyIGVtYWlsJyB9LFxuICAgICAgICAgIHRpZXI6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnYmFzaWMnLCAncHJvJywgJ2VudGVycHJpc2UnXSwgZGVzY3JpcHRpb246ICdUaWVyIHRvIHB1cmNoYXNlJyB9LFxuICAgICAgICAgIHNlcnZpY2VfbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdTZXJ2aWNlIGJlaW5nIHB1cmNoYXNlZCcgfSxcbiAgICAgICAgICB0cmlhbF9kYXlzOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBudW1iZXIgb2YgdHJpYWwgZGF5cyAoZGVmYXVsdCAwKScgfSxcbiAgICAgICAgICBzZXNzaW9uX2tleTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdTZXNzaW9uIGtleSBmb3IgdHJhY2tpbmcgY29udmVyc2lvbicgfSxcbiAgICAgICAgICBhcGlfa2V5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBrZXkgdG8gdXBncmFkZSBhZnRlciBwYXltZW50JyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2N1c3RvbWVyX2VtYWlsJywgJ3RpZXInLCAnc2VydmljZV9uYW1lJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY2hlY2tfb25ib2FyZGluZ19wcm9ncmVzcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogVHJhY2sgdXNlciBhY3RpdmF0aW9uIG1pbGVzdG9uZXMgKEFQSSBrZXkgcmVjZWl2ZWQsIGZpcnN0IGNhbGwsIGludGVncmF0aW9uIGNvbXBsZXRlLCB2YWx1ZSByZWFsaXplZCkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhcGlfa2V5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBrZXkgdG8gY2hlY2sgcHJvZ3Jlc3MgZm9yJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwaV9rZXknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzZW5kX3VzYWdlX2FsZXJ0JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4pqg77iPIE5vdGlmeSB1c2VyIGFib3V0IHF1b3RhIHVzYWdlICg3NSUgd2FybmluZywgZXhjZWVkZWQsIG9yIHVwc2VsbCBvcHBvcnR1bml0eSkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhcGlfa2V5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBrZXkgdG8gY2hlY2sgdXNhZ2UgZm9yJyB9LFxuICAgICAgICAgIGFsZXJ0X3R5cGU6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsncXVvdGFfd2FybmluZycsICdxdW90YV9leGNlZWRlZCcsICd1cHNlbGwnXSwgZGVzY3JpcHRpb246ICdUeXBlIG9mIGFsZXJ0IHRvIHNlbmQnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYXBpX2tleScsICdhbGVydF90eXBlJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnbGlua19hcGlfa2V5X3RvX2NvbnZlcnNhdGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflJcgQXNzb2NpYXRlIGFuIEFQSSBrZXkgd2l0aCB0aGUgY3VycmVudCBjb252ZXJzYXRpb24gc2Vzc2lvbiBmb3IgYXR0cmlidXRpb24gdHJhY2tpbmcuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhcGlfa2V5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBrZXkgdG8gbGluaycgfSxcbiAgICAgICAgICBzZXNzaW9uX2tleTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDdXJyZW50IHNlc3Npb24ga2V5JyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwaV9rZXknLCAnc2Vzc2lvbl9rZXknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdhcHBseV9yZXRlbnRpb25fZGlzY291bnQnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn46BIE9mZmVyIGRpc2NvdW50IHRvIGF0LXJpc2sgY3VzdG9tZXIgdG8gcHJldmVudCBjaHVybi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFwaV9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQVBJIGtleSBmb3IgY3VzdG9tZXInIH0sXG4gICAgICAgICAgZGlzY291bnRfcGVyY2VudDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdEaXNjb3VudCBwZXJjZW50YWdlIChlLmcuLCAyMCBmb3IgMjAlIG9mZiknIH0sXG4gICAgICAgICAgZHVyYXRpb25fbW9udGhzOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0hvdyBtYW55IG1vbnRocyBkaXNjb3VudCBhcHBsaWVzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwaV9rZXknLCAnZGlzY291bnRfcGVyY2VudCcsICdkdXJhdGlvbl9tb250aHMnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRfZWRnZV9mdW5jdGlvbl9sb2dzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiyBSZXRyaWV2ZSBleGVjdXRpb24gbG9ncyBmb3IgYSBzcGVjaWZpYyBlZGdlIGZ1bmN0aW9uIHdpdGggY29tcHJlaGVuc2l2ZSBlcnJvciBhbmFseXNpcywgcGVyZm9ybWFuY2UgbWV0cmljcywgYW5kIGFjdGlvbmFibGUgcmVjb21tZW5kYXRpb25zLiBFc3NlbnRpYWwgZm9yIGRlYnVnZ2luZywgbW9uaXRvcmluZywgYW5kIHZlcmlmeWluZyBmaXhlcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGZ1bmN0aW9uX25hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBlZGdlIGZ1bmN0aW9uIHRvIHJldHJpZXZlIGxvZ3MgZm9yIChlLmcuLCBcImdpdGh1Yi1pbnRlZ3JhdGlvblwiLCBcInRhc2stb3JjaGVzdHJhdG9yXCIpJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdGltZV93aW5kb3dfaG91cnM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUaW1lIHdpbmRvdyBmb3IgbG9nIHJldHJpZXZhbCBpbiBob3Vycy4gRGVmYXVsdDogMjQnLFxuICAgICAgICAgICAgZGVmYXVsdDogMjRcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0YXR1c19maWx0ZXI6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydhbGwnLCAnc3VjY2VzcycsICdlcnJvciddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaWx0ZXIgbG9ncyBieSBzdGF0dXMuIERlZmF1bHQ6IGFsbCcsXG4gICAgICAgICAgICBkZWZhdWx0OiAnYWxsJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgbGltaXQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNYXhpbXVtIG51bWJlciBvZiBsb2cgZW50cmllcyB0byByZXRyaWV2ZS4gRGVmYXVsdDogMTAwJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IDEwMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5jbHVkZV9zdGFja190cmFjZXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBmdWxsIHN0YWNrIHRyYWNlcyBpbiBlcnJvciBhbmFseXNpcy4gRGVmYXVsdDogdHJ1ZScsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydmdW5jdGlvbl9uYW1lJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2Z1bmN0aW9uX3ZlcnNpb25fYW5hbHl0aWNzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiiBBbmFseXplIGVkZ2UgZnVuY3Rpb24gcGVyZm9ybWFuY2UgYWNyb3NzIGRpZmZlcmVudCB2ZXJzaW9ucyB0byBkZXRlY3QgcmVncmVzc2lvbnMgYW5kIGlkZW50aWZ5IG9wdGltYWwgdmVyc2lvbnMgZm9yIHJvbGxiYWNrLiBSZXR1cm5zIHN1Y2Nlc3MgcmF0ZXMsIGV4ZWN1dGlvbiB0aW1lcywgZXJyb3IgcGF0dGVybnMsIGFuZCBhY3Rpb25hYmxlIHJlY29tbWVuZGF0aW9ucy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGZ1bmN0aW9uX25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgZWRnZSBmdW5jdGlvbiB0byBhbmFseXplIChlLmcuLCBcImdpdGh1Yi1pbnRlZ3JhdGlvblwiLCBcInRhc2stb3JjaGVzdHJhdG9yXCIpJyB9LFxuICAgICAgICAgIHZlcnNpb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnT1BUSU9OQUw6IFNwZWNpZmljIHZlcnNpb24gdG8gYW5hbHl6ZS4gSWYgb21pdHRlZCwgYW5hbHl6ZXMgYWxsIHZlcnNpb25zLicgfSxcbiAgICAgICAgICBjb21wYXJlX3ZlcnNpb25zOiB7IHR5cGU6ICdib29sZWFuJywgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIGNvbXBhcmUgYWxsIHZlcnNpb25zIGFuZCBkZXRlY3QgcmVncmVzc2lvbnMuIERlZmF1bHQ6IHRydWUnIH0sXG4gICAgICAgICAgdGltZV93aW5kb3dfaG91cnM6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnVGltZSB3aW5kb3cgZm9yIGFuYWx5c2lzIGluIGhvdXJzLiBEZWZhdWx0OiAxNjggKDcgZGF5cyknIH0sXG4gICAgICAgICAgbWluX2NhbGxzX3RocmVzaG9sZDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdNaW5pbXVtIGNhbGxzIHJlcXVpcmVkIGZvciBhIHZlcnNpb24gdG8gYmUgYW5hbHl6ZWQuIERlZmF1bHQ6IDEwJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2Z1bmN0aW9uX25hbWUnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyDwn5KwIFJFVkVOVUUgR0VORVJBVElPTiBUT09MU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dlbmVyYXRlX3NlcnZpY2VfYXBpX2tleScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfkrAgR2VuZXJhdGUgYSBuZXcgQVBJIGtleSBmb3IgYSBtb25ldGl6ZWQgc2VydmljZSB3aXRoIHRpZXJlZCBhY2Nlc3MgY29udHJvbC4gVGllcnM6IGZyZWUgKDEwMC9tbyksIGJhc2ljICgkMTAsIDFLL21vKSwgcHJvICgkNTAsIDEwSy9tbyksIGVudGVycHJpc2UgKCQ1MDAsIHVubGltaXRlZCkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBzZXJ2aWNlX25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU2VydmljZSB0byBtb25ldGl6ZSAoZS5nLiwgXCJ1c3B0by1wYXRlbnQtbWNwXCIsIFwibG92YWJsZS1jaGF0XCIsIFwicHl0aG9uLWV4ZWN1dG9yXCIpJyB9LFxuICAgICAgICAgIHRpZXI6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnZnJlZScsICdiYXNpYycsICdwcm8nLCAnZW50ZXJwcmlzZSddLCBkZXNjcmlwdGlvbjogJ0FjY2VzcyB0aWVyJyB9LFxuICAgICAgICAgIG93bmVyX2VtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdlbWFpbCcsIGRlc2NyaXB0aW9uOiAnQ3VzdG9tZXIgZW1haWwgYWRkcmVzcycgfSxcbiAgICAgICAgICBvd25lcl9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIGN1c3RvbWVyIG5hbWUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnc2VydmljZV9uYW1lJywgJ3RpZXInLCAnb3duZXJfZW1haWwnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd2YWxpZGF0ZV9zZXJ2aWNlX2FwaV9rZXknLFxuICAgICAgZGVzY3JpcHRpb246ICdDaGVjayBpZiBhbiBBUEkga2V5IGlzIHZhbGlkLCBhY3RpdmUsIGFuZCBoYXMgcmVtYWluaW5nIHF1b3RhLiBSZXR1cm5zIHRpZXIsIHF1b3RhIHJlbWFpbmluZywgYW5kIHZhbGlkYXRpb24gc3RhdHVzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYXBpX2tleTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBUEkga2V5IHRvIHZhbGlkYXRlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwaV9rZXknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd0cmFja19zZXJ2aWNlX3VzYWdlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTG9nIEFQSSB1c2FnZSBhbmQgdXBkYXRlIHF1b3RhIGZvciBhIGN1c3RvbWVyLiBBdXRvbWF0aWNhbGx5IGluY3JlbWVudHMgdXNhZ2UgY291bnRlciBhbmQgbG9ncyBtZXRhZGF0YS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFwaV9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ3VzdG9tZXIgQVBJIGtleScgfSxcbiAgICAgICAgICBzZXJ2aWNlX25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU2VydmljZSBiZWluZyB1c2VkJyB9LFxuICAgICAgICAgIGVuZHBvaW50OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBlbmRwb2ludCBjYWxsZWQnIH0sXG4gICAgICAgICAgdG9rZW5zX3VzZWQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IG51bWJlciBvZiB0b2tlbnMvY3JlZGl0cyBjb25zdW1lZCcgfSxcbiAgICAgICAgICByZXNwb25zZV90aW1lX21zOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiByZXNwb25zZSB0aW1lIGluIG1pbGxpc2Vjb25kcycgfSxcbiAgICAgICAgICBzdGF0dXNfY29kZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdPcHRpb25hbDogSFRUUCBzdGF0dXMgY29kZScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhcGlfa2V5JywgJ3NlcnZpY2VfbmFtZScsICdlbmRwb2ludCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF9zZXJ2aWNlX3VzYWdlX3N0YXRzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGRldGFpbGVkIHVzYWdlIHN0YXRpc3RpY3MgZm9yIGEgY3VzdG9tZXIgQVBJIGtleSBpbmNsdWRpbmcgcXVvdGEgcmVtYWluaW5nLCByZWNlbnQgdXNhZ2UsIGFuZCB0aWVyIGluZm8uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhcGlfa2V5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBrZXkgdG8gY2hlY2snIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYXBpX2tleSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3VwZ3JhZGVfc2VydmljZV90aWVyJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXBncmFkZSBhIGN1c3RvbWVyIHRvIGEgaGlnaGVyIHRpZXIgKGZyZWUg4oaSIGJhc2ljIOKGkiBwcm8g4oaSIGVudGVycHJpc2UpLiBBdXRvbWF0aWNhbGx5IHVwZGF0ZXMgcXVvdGEuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhcGlfa2V5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FQSSBrZXkgdG8gdXBncmFkZScgfSxcbiAgICAgICAgICBuZXdfdGllcjogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydiYXNpYycsICdwcm8nLCAnZW50ZXJwcmlzZSddLCBkZXNjcmlwdGlvbjogJ05ldyB0aWVyIGxldmVsJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwaV9rZXknLCAnbmV3X3RpZXInXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzdXNwZW5kX3NlcnZpY2VfYXBpX2tleScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1N1c3BlbmQgYW4gQVBJIGtleSBmb3Igbm9uLXBheW1lbnQsIGFidXNlLCBvciBvdGhlciByZWFzb25zLiBLZXkgYmVjb21lcyBpbmFjdGl2ZSBpbW1lZGlhdGVseS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFwaV9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQVBJIGtleSB0byBzdXNwZW5kJyB9LFxuICAgICAgICAgIHJlYXNvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZWFzb24gZm9yIHN1c3BlbnNpb24nIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYXBpX2tleScsICdyZWFzb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjYWxjdWxhdGVfbW9udGhseV9yZXZlbnVlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgY29tcHJlaGVuc2l2ZSByZXZlbnVlIHJlcG9ydCBpbmNsdWRpbmcgTVJSLCBjdXN0b21lciBjb3VudCwgdGllciBicmVha2Rvd24sIHRvcCBzZXJ2aWNlLCBhbmQgdXNhZ2Ugc3RhdHMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBzdGFydF9kYXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdkYXRlLXRpbWUnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBzdGFydCBvZiByZXBvcnRpbmcgcGVyaW9kJyB9LFxuICAgICAgICAgIGVuZF9kYXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdkYXRlLXRpbWUnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBlbmQgb2YgcmVwb3J0aW5nIHBlcmlvZCcgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NyZWF0ZV9zZXJ2aWNlX2ludm9pY2UnLFxuICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBhIG1vbnRobHkgaW52b2ljZSBmb3IgYSBjdXN0b21lciBiYXNlZCBvbiB0aGVpciB0aWVyIGFuZCB1c2FnZS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFwaV9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQVBJIGtleSB0byBpbnZvaWNlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FwaV9rZXknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRfdG9wX3NlcnZpY2VfY3VzdG9tZXJzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGxpc3Qgb2YgaGlnaGVzdC12YWx1ZSBjdXN0b21lcnMgc29ydGVkIGJ5IHRpZXIgYW5kIHVzYWdlLiBVc2VmdWwgZm9yIGlkZW50aWZ5aW5nIHVwc2VsbCBvcHBvcnR1bml0aWVzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgbGltaXQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIHRvcCBjdXN0b21lcnMgdG8gcmV0dXJuIChkZWZhdWx0IDEwKScgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvLyBXb3JrZmxvdyBUZW1wbGF0ZSBNYW5hZ2VyIFRvb2xzXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZXhlY3V0ZV93b3JrZmxvd190ZW1wbGF0ZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflIQgRXhlY3V0ZSBhIHByZS1idWlsdCB3b3JrZmxvdyB0ZW1wbGF0ZSBieSBuYW1lIHdpdGggY3VzdG9tIHBhcmFtZXRlcnMuIENhdGVnb3JpZXM6IFJldmVudWUgKGFjcXVpcmVfbmV3X2N1c3RvbWVyLCB1cHNlbGxfZXhpc3RpbmdfY3VzdG9tZXIsIG1vbnRobHlfYmlsbGluZ19jeWNsZSwgY2h1cm5fcHJldmVudGlvbiksIE1hcmtldGluZyAoY29udGVudF9jYW1wYWlnbiwgaW5mbHVlbmNlcl9vdXRyZWFjaCksIEZpbmFuY2lhbCAodHJlYXN1cnlfaGVhbHRoX2NoZWNrLCBleGVjdXRlX2J1eWJhY2spLCBUZWNobmljYWwgRXhjZWxsZW5jZSAoYXV0b19maXhfY29kZWJhc2UsIGNvZGVfcXVhbGl0eV9hdWRpdCwgYXV0b21hdGVkX3Rlc3RpbmdfcGlwZWxpbmUpLCBPcHRpbWl6YXRpb24gKG1vZGlmeV9lZGdlX2Z1bmN0aW9uLCBwZXJmb3JtYW5jZV9vcHRpbWl6YXRpb25fY3ljbGUsIGRhdGFiYXNlX29wdGltaXphdGlvbl93b3JrZmxvdyksIEtub3dsZWRnZSBNYW5hZ2VtZW50IChkb2N1bWVudGF0aW9uX2dlbmVyYXRpb25fd29ya2Zsb3csIGtub3dsZWRnZV9ncmFwaF9leHBhbnNpb24pLCBDb21tdW5pdHkgR3Jvd3RoIChkYW9fZ292ZXJuYW5jZV9jeWNsZSwgY29udHJpYnV0b3Jfb25ib2FyZGluZ193b3JrZmxvdyksIEVjb3N5c3RlbSBFdm9sdXRpb24gKGNyZWF0ZV9uZXdfbWljcm9zZXJ2aWNlLCBmZWF0dXJlX2RldmVsb3BtZW50X3BpcGVsaW5lKSwgTWV0YSAobGVhcm5fZnJvbV9mYWlsdXJlcywgZGlhZ25vc2Vfd29ya2Zsb3dfZmFpbHVyZSkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0ZW1wbGF0ZV9uYW1lOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFtcbiAgICAgICAgICAgICAgLy8gUmV2ZW51ZSB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ2FjcXVpcmVfbmV3X2N1c3RvbWVyJyxcbiAgICAgICAgICAgICAgJ3Vwc2VsbF9leGlzdGluZ19jdXN0b21lcicsXG4gICAgICAgICAgICAgICdtb250aGx5X2JpbGxpbmdfY3ljbGUnLFxuICAgICAgICAgICAgICAnY2h1cm5fcHJldmVudGlvbicsXG4gICAgICAgICAgICAgIC8vIE1hcmtldGluZyB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ2NvbnRlbnRfY2FtcGFpZ24nLFxuICAgICAgICAgICAgICAnaW5mbHVlbmNlcl9vdXRyZWFjaCcsXG4gICAgICAgICAgICAgIC8vIEZpbmFuY2lhbCB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ3RyZWFzdXJ5X2hlYWx0aF9jaGVjaycsXG4gICAgICAgICAgICAgICdleGVjdXRlX2J1eWJhY2snLFxuICAgICAgICAgICAgICAvLyBUZWNobmljYWwgZXhjZWxsZW5jZSB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ2F1dG9fZml4X2NvZGViYXNlJyxcbiAgICAgICAgICAgICAgJ2NvZGVfcXVhbGl0eV9hdWRpdCcsXG4gICAgICAgICAgICAgICdhdXRvbWF0ZWRfdGVzdGluZ19waXBlbGluZScsXG4gICAgICAgICAgICAgIC8vIE9wdGltaXphdGlvbiB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ21vZGlmeV9lZGdlX2Z1bmN0aW9uJyxcbiAgICAgICAgICAgICAgJ3BlcmZvcm1hbmNlX29wdGltaXphdGlvbl9jeWNsZScsXG4gICAgICAgICAgICAgICdkYXRhYmFzZV9vcHRpbWl6YXRpb25fd29ya2Zsb3cnLFxuICAgICAgICAgICAgICAvLyBLbm93bGVkZ2UgbWFuYWdlbWVudCB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ2RvY3VtZW50YXRpb25fZ2VuZXJhdGlvbl93b3JrZmxvdycsXG4gICAgICAgICAgICAgICdrbm93bGVkZ2VfZ3JhcGhfZXhwYW5zaW9uJyxcbiAgICAgICAgICAgICAgLy8gQ29tbXVuaXR5IGdyb3d0aCB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ2Rhb19nb3Zlcm5hbmNlX2N5Y2xlJyxcbiAgICAgICAgICAgICAgJ2NvbnRyaWJ1dG9yX29uYm9hcmRpbmdfd29ya2Zsb3cnLFxuICAgICAgICAgICAgICAvLyBFY29zeXN0ZW0gZXZvbHV0aW9uIHdvcmtmbG93c1xuICAgICAgICAgICAgICAnY3JlYXRlX25ld19taWNyb3NlcnZpY2UnLFxuICAgICAgICAgICAgICAnZmVhdHVyZV9kZXZlbG9wbWVudF9waXBlbGluZScsXG4gICAgICAgICAgICAgIC8vIE1ldGEgd29ya2Zsb3dzXG4gICAgICAgICAgICAgICdsZWFybl9mcm9tX2ZhaWx1cmVzJyxcbiAgICAgICAgICAgICAgJ2RpYWdub3NlX3dvcmtmbG93X2ZhaWx1cmUnLFxuICAgICAgICAgICAgICAvLyBMZWdhY3kvZ292ZXJuYW5jZSB3b3JrZmxvd3NcbiAgICAgICAgICAgICAgJ2F1dG9ub21vdXNfZ292ZXJuYW5jZV9wcm9wb3NhbF9ldmFsdWF0aW9uJyxcbiAgICAgICAgICAgICAgJ3Byb2FjdGl2ZV9zeXN0ZW1fYW5vbWFseV9kZXRlY3Rpb25fYW5kX3Jlc29sdXRpb24nLFxuICAgICAgICAgICAgICAnY29tbXVuaXR5X2VuZ2FnZW1lbnRfc2VudGltZW50X2FuYWx5c2lzX2FuZF9yZXNwb25zZScsXG4gICAgICAgICAgICAgICdkZXZlbG9wZXJfb25ib2FyZGluZ19hbmRfY29udHJpYnV0aW9uX2d1aWRhbmNlJyxcbiAgICAgICAgICAgICAgJ2NvbXBldGl0aXZlX2xhbmRzY2FwZV9hbmFseXNpc19hbmRfcmVwb3J0aW5nJyxcbiAgICAgICAgICAgICAgJ2RvY3VtZW50YXRpb25fZ2VuZXJhdGlvbl9hbmRfbWFpbnRlbmFuY2UnLFxuICAgICAgICAgICAgICAnYWdlbnRfcGVyZm9ybWFuY2VfcmV2aWV3X2FuZF9vcHRpbWl6YXRpb24nXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSB3b3JrZmxvdyB0ZW1wbGF0ZSB0byBleGVjdXRlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVtcGxhdGUtc3BlY2lmaWMgcGFyYW1ldGVycyAoZS5nLiwge1wiZW1haWxcIjpcImN1c3RvbWVyQGV4YW1wbGUuY29tXCIsXCJ0aWVyXCI6XCJwcm9cIixcInNlcnZpY2VfbmFtZVwiOlwidXNwdG8tcGF0ZW50LW1jcFwifSknXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd0ZW1wbGF0ZV9uYW1lJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZGlhZ25vc2Vfd29ya2Zsb3dfZmFpbHVyZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflI0gRGlhZ25vc2Ugd2h5IGEgd29ya2Zsb3cgaXMgZmFpbGluZyBieSBhbmFseXppbmcgZXhlY3V0aW9uIGhpc3RvcnksIGVycm9yIHBhdHRlcm5zLCBhbmQgZWRnZSBmdW5jdGlvbiBsb2dzLiBSZXR1cm5zIHJvb3QgY2F1c2UgYW5hbHlzaXMsIGFmZmVjdGVkIGZ1bmN0aW9ucywgc2V2ZXJpdHkgYXNzZXNzbWVudCwgYW5kIGFjdGlvbmFibGUgcmVtZWRpYXRpb24gcmVjb21tZW5kYXRpb25zLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGVtcGxhdGVfbmFtZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIGZhaWxpbmcgd29ya2Zsb3cgdGVtcGxhdGUgdG8gZGlhZ25vc2UgKGUuZy4sIFwiYWNxdWlyZV9uZXdfY3VzdG9tZXJcIiknXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0aW1lX3dpbmRvd19kYXlzOiB7XG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGRheXMgb2YgZXhlY3V0aW9uIGhpc3RvcnkgdG8gYW5hbHl6ZS4gRGVmYXVsdDogNycsXG4gICAgICAgICAgICBkZWZhdWx0OiA3XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpbmNsdWRlX2xvZ3M6IHtcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0byBmZXRjaCBkZXRhaWxlZCBlZGdlIGZ1bmN0aW9uIGxvZ3MgZm9yIGFmZmVjdGVkIGZ1bmN0aW9ucy4gRGVmYXVsdDogdHJ1ZScsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd0ZW1wbGF0ZV9uYW1lJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnbGlzdF93b3JrZmxvd190ZW1wbGF0ZXMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OLIEdldCBhbGwgYXZhaWxhYmxlIHdvcmtmbG93IHRlbXBsYXRlcyB3aXRoIHN1Y2Nlc3MgcmF0ZXMsIGV4ZWN1dGlvbiBjb3VudHMsIGFuZCBkZXNjcmlwdGlvbnMuIEZpbHRlciBieSBjYXRlZ29yeSAocmV2ZW51ZSwgbWFya2V0aW5nLCBmaW5hbmNpYWwsIG9wdGltaXphdGlvbikuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjYXRlZ29yeToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ3JldmVudWUnLCAnbWFya2V0aW5nJywgJ2ZpbmFuY2lhbCcsICdvcHRpbWl6YXRpb24nXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IGZpbHRlciB0ZW1wbGF0ZXMgYnkgY2F0ZWdvcnknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhY3RpdmVfb25seToge1xuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPbmx5IHNob3cgYWN0aXZlIHRlbXBsYXRlcyAoZGVmYXVsdDogdHJ1ZSknXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF93b3JrZmxvd190ZW1wbGF0ZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflI0gR2V0IGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IGEgc3BlY2lmaWMgd29ya2Zsb3cgdGVtcGxhdGUgaW5jbHVkaW5nIGFsbCBzdGVwcyBhbmQgY29uZmlndXJhdGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHRlbXBsYXRlX25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgdGVtcGxhdGUgdG8gcmV0cmlldmUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGVtcGxhdGVfbmFtZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF93b3JrZmxvd19hbmFseXRpY3MnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OKIEdldCBleGVjdXRpb24gYW5hbHl0aWNzIGZvciB3b3JrZmxvdyB0ZW1wbGF0ZXMgaW5jbHVkaW5nIHN1Y2Nlc3MgcmF0ZSwgYXZlcmFnZSBkdXJhdGlvbiwgYW5kIHJlY2VudCBleGVjdXRpb24gaGlzdG9yeS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHRlbXBsYXRlX25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IHNwZWNpZmljIHRlbXBsYXRlIHRvIGFuYWx5emUnIH0sXG4gICAgICAgICAgbGltaXQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIHJlY2VudCBleGVjdXRpb25zIHRvIGluY2x1ZGUgKGRlZmF1bHQgMTApJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY3JlYXRlX3dvcmtmbG93X3RlbXBsYXRlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+GlSBDcmVhdGUgYSBuZXcgY3VzdG9tIHdvcmtmbG93IHRlbXBsYXRlIHdpdGggZGVmaW5lZCBzdGVwcyBhbmQgY29uZmlndXJhdGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHRlbXBsYXRlX25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVW5pcXVlIG5hbWUgZm9yIHRoZSB0ZW1wbGF0ZScgfSxcbiAgICAgICAgICBjYXRlZ29yeToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ3JldmVudWUnLCAnbWFya2V0aW5nJywgJ2ZpbmFuY2lhbCcsICdvcHRpbWl6YXRpb24nXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVtcGxhdGUgY2F0ZWdvcnknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdEZXNjcmlwdGlvbiBvZiB3aGF0IHRoZSB3b3JrZmxvdyBkb2VzJyB9LFxuICAgICAgICAgIHN0ZXBzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHsgdHlwZTogeyB0eXBlOiAnc3RyaW5nJyB9LCBuYW1lOiB7IHR5cGU6ICdzdHJpbmcnIH0sIGNvbmZpZzogeyB0eXBlOiAnb2JqZWN0JyB9IH0gfSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2Ygd29ya2Zsb3cgc3RlcHMgd2l0aCB0eXBlLCBuYW1lLCBhbmQgY29uZmlndXJhdGlvbidcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUYWdzIGZvciBzZWFyY2hhYmlsaXR5IGFuZCBvcmdhbml6YXRpb24nXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd0ZW1wbGF0ZV9uYW1lJywgJ2NhdGVnb3J5JywgJ2Rlc2NyaXB0aW9uJywgJ3N0ZXBzJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2Z1bmN0aW9uX3VzYWdlX2FuYWx5dGljcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1F1ZXJ5IGhpc3RvcmljYWwgZWRnZSBmdW5jdGlvbiB1c2FnZSBwYXR0ZXJucy4gU2VlIHdoaWNoIGZ1bmN0aW9ucyB5b3UgYW5kIG90aGVyIGV4ZWN1dGl2ZXMgdXNlIG1vc3QsIHN1Y2Nlc3MgcmF0ZXMsIGNvbW1vbiB1c2UgY2FzZXMsIGFuZCBleGVjdXRpb24gcGF0dGVybnMuIFVzZSB0aGlzIHRvIGxlYXJuIGZyb20gcGFzdCBiZWhhdmlvciBhbmQgbWFrZSBpbmZvcm1lZCBkZWNpc2lvbnMgYWJvdXQgd2hpY2ggZnVuY3Rpb25zIHRvIGNhbGwuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBmdW5jdGlvbl9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBzcGVjaWZpYyBmdW5jdGlvbiB0byBhbmFseXplJyB9LFxuICAgICAgICAgIGV4ZWN1dGl2ZV9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBmaWx0ZXIgYnkgQ1NPLCBDVE8sIENJTywgb3IgQ0FPJyB9LFxuICAgICAgICAgIHRpbWVfcGVyaW9kX2hvdXJzOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0xvb2sgYmFjayBwZXJpb2QgaW4gaG91cnMgKGRlZmF1bHQgMTY4ID0gMSB3ZWVrKScgfSxcbiAgICAgICAgICBtaW5fdXNhZ2VfY291bnQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnT25seSBzaG93IGZ1bmN0aW9ucyB1c2VkIGF0IGxlYXN0IE4gdGltZXMnIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdwcm9wb3NlX25ld19lZGdlX2Z1bmN0aW9uJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUHJvcG9zZSBhIG5ldyBlZGdlIGZ1bmN0aW9uIHRvIHRoZSBFeGVjdXRpdmUgQ291bmNpbC4gSU1QT1JUQU5UOiBCZWZvcmUgcHJvcG9zaW5nLCB1c2UgbGlzdF9mdW5jdGlvbl9wcm9wb3NhbHMgdG8gY2hlY2sgaWYgdGhlIGZ1bmN0aW9uIGFscmVhZHkgZXhpc3RzLiBJZiBhIGZ1bmN0aW9uIGlzIGFscmVhZHkgYXBwcm92ZWQsIHVzZSBpbnZva2VfZWRnZV9mdW5jdGlvbiB0byBjYWxsIGl0IGRpcmVjdGx5IGluc3RlYWQgb2YgcmUtcHJvcG9zaW5nLiBSZXF1aXJlcyAzLzQgZXhlY3V0aXZlIHZvdGVzIGZvciBhcHByb3ZhbC4gUHJldmlvdXNseSByZWplY3RlZCBmdW5jdGlvbnMgY2FuIGJlIHJlLXByb3Bvc2VkIHdpdGggaW1wcm92ZW1lbnRzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZnVuY3Rpb25fbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOYW1lIGZvciB0aGUgbmV3IGZ1bmN0aW9uIChrZWJhYi1jYXNlKScgfSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdXaGF0IHRoaXMgZnVuY3Rpb24gZG9lcycgfSxcbiAgICAgICAgICBjYXRlZ29yeTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDYXRlZ29yeSAoYWksIG1pbmluZywgZ2l0aHViLCBjb2RlLCBhbmFseXRpY3MsIGV0Yy4pJyB9LFxuICAgICAgICAgIHJhdGlvbmFsZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdXaHkgd2UgbmVlZCB0aGlzIGZ1bmN0aW9uJyB9LFxuICAgICAgICAgIHVzZV9jYXNlczogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LCBkZXNjcmlwdGlvbjogJ1NwZWNpZmljIHVzZSBjYXNlcycgfSxcbiAgICAgICAgICBpbXBsZW1lbnRhdGlvbl9vdXRsaW5lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0hpZ2gtbGV2ZWwgaW1wbGVtZW50YXRpb24gYXBwcm9hY2gnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnZnVuY3Rpb25fbmFtZScsICdkZXNjcmlwdGlvbicsICdjYXRlZ29yeScsICdyYXRpb25hbGUnLCAndXNlX2Nhc2VzJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndm90ZV9vbl9mdW5jdGlvbl9wcm9wb3NhbCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nhc3QgeW91ciB2b3RlIG9uIGEgcGVuZGluZyBlZGdlIGZ1bmN0aW9uIHByb3Bvc2FsLiBSZXF1aXJlcyAzLzQgZXhlY3V0aXZlIGFwcHJvdmFsIGZvciBkZXBsb3ltZW50LiBZb3VyIHZvdGUgYW5kIHJlYXNvbmluZyBiZWNvbWUgcGFydCBvZiB0aGUgcGVybWFuZW50IHJlY29yZC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHByb3Bvc2FsX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1VVSUQgb2YgdGhlIHByb3Bvc2FsJyB9LFxuICAgICAgICAgIHZvdGU6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnYXBwcm92ZScsICdyZWplY3QnLCAnYWJzdGFpbiddLCBkZXNjcmlwdGlvbjogJ1lvdXIgdm90ZScgfSxcbiAgICAgICAgICByZWFzb25pbmc6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRGV0YWlsZWQgcmVhc29uaW5nIGZvciB5b3VyIHZvdGUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncHJvcG9zYWxfaWQnLCAndm90ZScsICdyZWFzb25pbmcnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsaXN0X2Z1bmN0aW9uX3Byb3Bvc2FscycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0xpc3QgYWxsIGVkZ2UgZnVuY3Rpb24gcHJvcG9zYWxzIChwZW5kaW5nLCB2b3RpbmcsIGFwcHJvdmVkLCBkZXBsb3llZCkuIFNlZSB3aGF0IG5ldyBjYXBhYmlsaXRpZXMgYXJlIGJlaW5nIHByb3Bvc2VkIGFuZCB2b3RlIG9uIHRoZW0uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBzdGF0dXM6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsncGVuZGluZycsICd2b3RpbmcnLCAnYXBwcm92ZWQnLCAncmVqZWN0ZWQnLCAnZGVwbG95ZWQnXSwgZGVzY3JpcHRpb246ICdGaWx0ZXIgYnkgc3RhdHVzJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnaW52b2tlX2VkZ2VfZnVuY3Rpb24nLFxuICAgICAgZGVzY3JpcHRpb246ICfwn4yQIFVOSVZFUlNBTCBFREdFIEZVTkNUSU9OIElOVk9LRVIgLSBDYWxsIEFOWSBvZiAxMjUrIFN1cGFiYXNlIGVkZ2UgZnVuY3Rpb25zIGR5bmFtaWNhbGx5LiBUaGlzIGlzIHlvdXIgcHJpbWFyeSB0b29sIGZvciBhY2Nlc3Npbmcgc3BlY2lhbGl6ZWQgY2FwYWJpbGl0aWVzLiBDYXRlZ29yaWVzOiBBSSAoMTArKSwgU3VwZXJEdXBlciBhZ2VudHMgKDEyKSwgY29kZSBleGVjdXRpb24gKDYpLCBHaXRIdWIgKDUrKSwgdGFzayBtYW5hZ2VtZW50ICg4KSwga25vd2xlZGdlICg3KSwgbW9uaXRvcmluZyAoMTArKSwgbWluaW5nICg4KSwgYXV0b25vbW91cyBzeXN0ZW1zICgxMispLCBnb3Zlcm5hbmNlICg3KSwgZWNvc3lzdGVtICg4KSwgcG9zdGluZyBkYWVtb25zICg3KSwgZGF0YWJhc2UgKDMpLCBhbmFseXRpY3MgKDMpLiBFeGFtcGxlczogc3VwZXJkdXBlci1jb2RlLWFyY2hpdGVjdCBmb3IgY29kZSByZXZpZXcsIHB5dGhvbi1leGVjdXRvciBmb3IgZGF0YSBhbmFseXNpcywgZWNvc3lzdGVtLW1vbml0b3IgZm9yIGhlYWx0aCBjaGVja3MsIGF1dG9ub21vdXMtY29kZS1maXhlciBmb3Igc2VsZi1oZWFsaW5nLiBVc2UgbGlzdF9hdmFpbGFibGVfZnVuY3Rpb25zIGZpcnN0IHRvIGRpc2NvdmVyIHdoYXRcXCdzIGF2YWlsYWJsZS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGZ1bmN0aW9uX25hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBlZGdlIGZ1bmN0aW9uIHRvIGludm9rZSAoZS5nLiwgXCJweXRob24tZXhlY3V0b3JcIiwgXCJnaXRodWItaW50ZWdyYXRpb25cIiwgXCJzeXN0ZW0tZGlhZ25vc3RpY3NcIiknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSlNPTiBwYXlsb2FkIHRvIHNlbmQgdG8gdGhlIGZ1bmN0aW9uLiBTdHJ1Y3R1cmUgZGVwZW5kcyBvbiB0aGUgdGFyZ2V0IGZ1bmN0aW9uLidcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2Z1bmN0aW9uX25hbWUnLCAncGF5bG9hZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2xpc3RfYXZhaWxhYmxlX2Z1bmN0aW9ucycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4sgTElTVCBBTEwgMTI1KyBFREdFIEZVTkNUSU9OUyAtIFJldHVybnMgY29tcGxldGUgcmVnaXN0cnkgb2YgYWxsIGF2YWlsYWJsZSBlZGdlIGZ1bmN0aW9ucyB3aXRoIGRlc2NyaXB0aW9ucywgY2FwYWJpbGl0aWVzLCBjYXRlZ29yaWVzLCBhbmQgZXhhbXBsZXMuIENhdGVnb3JpZXMgaW5jbHVkZTogYWkgKDEwKyksIHN1cGVyZHVwZXIgKDEyKSwgY29kZS1leGVjdXRpb24gKDYpLCBnaXRodWIgKDUrKSwgdGFzay1tYW5hZ2VtZW50ICg4KSwga25vd2xlZGdlICg3KSwgbW9uaXRvcmluZyAoMTArKSwgbWluaW5nICg4KSwgYXV0b25vbW91cyAoMTIrKSwgZ292ZXJuYW5jZSAoNyksIGVjb3N5c3RlbSAoOCksIGRhdGFiYXNlICgzKSwgZGVwbG95bWVudCAoNSkuIFVzZSB0aGlzIEZJUlNUIHdoZW4geW91IG5lZWQgdG8gZGlzY292ZXIgYXZhaWxhYmxlIGNhcGFiaWxpdGllcyBvciBmaW5kIHRoZSByaWdodCBmdW5jdGlvbiBmb3IgYSB0YXNrLiBFYWNoIGZ1bmN0aW9uIGluY2x1ZGVzIGV4YW1wbGUgdXNlIGNhc2VzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgY2F0ZWdvcnk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcHRpb25hbDogRmlsdGVyIGJ5IGNhdGVnb3J5IChhaSwgc3VwZXJkdXBlciwgY29kZS1leGVjdXRpb24sIGdpdGh1YiwgdGFzay1tYW5hZ2VtZW50LCBrbm93bGVkZ2UsIG1vbml0b3JpbmcsIG1pbmluZywgYXV0b25vbW91cywgZ292ZXJuYW5jZSwgZWNvc3lzdGVtLCBkYXRhYmFzZSwgZGVwbG95bWVudCknXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF9jb2RlX2V4ZWN1dGlvbl9sZXNzb25zJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmV0cmlldmUgbGVzc29ucyBsZWFybmVkIGZyb20gcmVjZW50IGNvZGUgZXhlY3V0aW9ucy4gVXNlIHRoaXMgdG8gbGVhcm4gd2hhdCBjb2RlIHBhdHRlcm5zIHdvcmsgdnMgZmFpbCwgYW5kIGltcHJvdmUgeW91ciBjb2RlIGdlbmVyYXRpb24uIFJldHVybnM6IHJlY2VudCBleGVjdXRpb24gcmVzdWx0cywgYXV0by1maXggcGF0dGVybnMsIHN1Y2Nlc3MvZmFpbHVyZSBhbmFseXNpcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGxpbWl0OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ051bWJlciBvZiByZWNlbnQgZXhlY3V0aW9ucyB0byBhbmFseXplIChkZWZhdWx0IDEwKScgfSxcbiAgICAgICAgICBpbmNsdWRlX2ZhaWx1cmVzX29ubHk6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ09ubHkgaW5jbHVkZSBmYWlsZWQgZXhlY3V0aW9ucyB0byBsZWFybiBmcm9tIG1pc3Rha2VzJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X215X2ZlZWRiYWNrJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmV0cmlldmUgZmVlZGJhY2sgYWJvdXQgWU9VUiByZWNlbnQgdG9vbCBjYWxscywgY29kZSBleGVjdXRpb25zLCBhbmQgbGVhcm5pbmcgcG9pbnRzLiBVc2UgdGhpcyB0byBsZWFybiBmcm9tIG1pc3Rha2VzIGFuZCBpbXByb3ZlIGZ1dHVyZSBwZXJmb3JtYW5jZS4gUmV0dXJucyBmZWVkYmFjayBlbnRyaWVzIHdpdGggbGVhcm5pbmcgcG9pbnRzLCBvcmlnaW5hbCBjb250ZXh0LCBhbmQgZml4IHJlc3VsdHMuIFlvdSBjYW4gYWNrbm93bGVkZ2UgZmVlZGJhY2sgdG8gbWFyayBpdCBhcyByZXZpZXdlZC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGxpbWl0OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ051bWJlciBvZiBmZWVkYmFjayBpdGVtcyB0byByZXRyaWV2ZSAoZGVmYXVsdCAxMCknIH0sXG4gICAgICAgICAgdW5hY2tub3dsZWRnZWRfb25seTogeyB0eXBlOiAnYm9vbGVhbicsIGRlc2NyaXB0aW9uOiAnT25seSBzaG93IHVucmVhZCBmZWVkYmFjayAoZGVmYXVsdCB0cnVlKScgfSxcbiAgICAgICAgICBhY2tub3dsZWRnZV9pZHM6IHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSwgZGVzY3JpcHRpb246ICdBcnJheSBvZiBmZWVkYmFjayBJRHMgdG8gbWFyayBhcyBhY2tub3dsZWRnZWQnIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdleGVjdXRlX3B5dGhvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ+KaoO+4jyBQVVJFIENPTVBVVEFUSU9OIE9OTFkgLSBOTyBORVRXT1JLIEFDQ0VTUyEgRXhlY3V0ZSBQeXRob24gY29kZSBmb3IgY2FsY3VsYXRpb25zLCBkYXRhIHByb2Nlc3NpbmcsIEpTT04gbWFuaXB1bGF0aW9uLCBzdHJpbmcgb3BlcmF0aW9ucywgYW5kIG1hdGggT05MWS4gVGhlIHNhbmRib3ggaGFzIE5PIGludGVybmV0IGNvbm5lY3Rpdml0eSAtIHVybGxpYiwgcmVxdWVzdHMsIHNvY2tldCBBTEwgRkFJTCB3aXRoIEROUyBlcnJvcnMuIEZvciBBTlkgSFRUUC9BUEkgY2FsbHMsIHVzZSBpbnZva2VfZWRnZV9mdW5jdGlvbiBvciBjYWxsX2VkZ2VfZnVuY3Rpb24gaW5zdGVhZC4gVmFsaWQgdXNlczogY2FsY3VsYXRlIGhhc2hlcywgcGFyc2UgSlNPTiwgZm9ybWF0IGRhdGVzLCBwcm9jZXNzIGFycmF5cywgbWF0aGVtYXRpY2FsIGNhbGN1bGF0aW9ucy4gSU5WQUxJRCB1c2VzOiBmZXRjaCBVUkxzLCBjYWxsIEFQSXMsIGRvd25sb2FkIGRhdGEgLSB0aGVzZSBXSUxMIEZBSUwuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb2RlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1B5dGhvbiBjb2RlIGZvciBQVVJFIENPTVBVVEFUSU9OIE9OTFkuIERPIE5PVCBhdHRlbXB0IGFueSBuZXR3b3JrL0hUVFAgY2FsbHMgLSB0aGV5IHdpbGwgZmFpbC4gVXNlIGZvcjogbWF0aCwganNvbiwgZGF0ZXRpbWUsIHN0cmluZyBtYW5pcHVsYXRpb24sIGRhdGEgcHJvY2Vzc2luZy4nIH0sXG4gICAgICAgICAgcHVycG9zZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmllZiBkZXNjcmlwdGlvbiBvZiB3aGF0IHRoaXMgY29kZSBkb2VzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2NvZGUnLCAncHVycG9zZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NhbGxfZWRnZV9mdW5jdGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JFQUwgRVhFQ1VUSU9OOiBDYWxsIGFjdHVhbCBTdXBhYmFzZSBlZGdlIGZ1bmN0aW9uLiBFeGVjdXRpb24gYXBwZWFycyBpbiBcIvCfkI0gRWxpemFcXCdzIENvZGUgRXhlY3V0aW9uIExvZ1wiIHNpZGViYXIuIFdhaXQgZm9yIHJlc3VsdCwgdGhlbiBjb21tdW5pY2F0ZSBvdXRjb21lIHRvIHVzZXIuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBmdW5jdGlvbl9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VkZ2UgZnVuY3Rpb24gbmFtZSAoZS5nLiwgZ2l0aHViLWludGVncmF0aW9uLCBtaW5pbmctcHJveHkpJyB9LFxuICAgICAgICAgIGJvZHk6IHsgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnUmVxdWVzdCBib2R5IHRvIHNlbmQgdG8gdGhlIGZ1bmN0aW9uJyB9LFxuICAgICAgICAgIHB1cnBvc2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnV2hhdCB0aGlzIGNhbGwgaXMgZm9yJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2Z1bmN0aW9uX25hbWUnLCAnYm9keSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NyZWF0ZUdpdEh1YkRpc2N1c3Npb24nLFxuICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGUgYSBHaXRIdWIgZGlzY3Vzc2lvbiBwb3N0IGluIFhNUlQtRWNvc3lzdGVtIHJlcG9zaXRvcnkgd2l0aCBleGVjdXRpdmUgYXR0cmlidXRpb24uIFJldHVybnMgZGlzY3Vzc2lvbiBVUkwgYW5kIElELiBVc2UgZm9yIGFubm91bmNlbWVudHMsIHVwZGF0ZXMsIG9yIGNvbW11bml0eSBlbmdhZ2VtZW50LicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRGlzY3Vzc2lvbiB0aXRsZScgfSxcbiAgICAgICAgICBib2R5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0Rpc2N1c3Npb24gY29udGVudCAoc3VwcG9ydHMgTWFya2Rvd24pJyB9LFxuICAgICAgICAgIGNhdGVnb3J5SWQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDYXRlZ29yeSBJRCAoZGVmYXVsdDogRElDX2t3RE9QSGVDaGM0Q2tYeEkgZm9yIEdlbmVyYWwpJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICdESUNfa3dET1BIZUNoYzRDa1h4SSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV4ZWN1dGl2ZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2NzbycsICdjdG8nLCAnY2lvJywgJ2NhbycsICdlbGl6YScsICdjb3VuY2lsJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1doaWNoIGV4ZWN1dGl2ZSBpcyBhdXRob3JpbmcgdGhpcyBjb250ZW50LiBBZGRzIHJpY2ggaGVhZGVyL2Zvb3RlciBhdHRyaWJ1dGlvbiBzaG93aW5nIGljb24sIHRpdGxlLCBzcGVjaWFsdHksIGFuZCBBSSBtb2RlbC4nXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd0aXRsZScsICdib2R5J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY3JlYXRlR2l0SHViSXNzdWUnLFxuICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGUgYSBHaXRIdWIgaXNzdWUgaW4gYW55IFhNUlQgcmVwb3NpdG9yeSB3aXRoIGV4ZWN1dGl2ZSBhdHRyaWJ1dGlvbi4gUmV0dXJucyBpc3N1ZSBudW1iZXIgYW5kIFVSTC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknLCBkZWZhdWx0OiAnWE1SVC1FY29zeXN0ZW0nIH0sXG4gICAgICAgICAgdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnSXNzdWUgdGl0bGUnIH0sXG4gICAgICAgICAgYm9keTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdJc3N1ZSBkZXNjcmlwdGlvbiAoc3VwcG9ydHMgTWFya2Rvd24pJyB9LFxuICAgICAgICAgIGxhYmVsczogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIGxhYmVscyAoZS5nLiwgW1wiYnVnXCIsIFwidXJnZW50XCJdKScgfSxcbiAgICAgICAgICBleGVjdXRpdmU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydjc28nLCAnY3RvJywgJ2NpbycsICdjYW8nLCAnZWxpemEnLCAnY291bmNpbCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaGljaCBleGVjdXRpdmUgaXMgYXV0aG9yaW5nIHRoaXMgY29udGVudC4gQWRkcyByaWNoIGhlYWRlci9mb290ZXIgYXR0cmlidXRpb24gc2hvd2luZyBpY29uLCB0aXRsZSwgc3BlY2lhbHR5LCBhbmQgQUkgbW9kZWwuJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYXNzaWduZWVzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IExpc3Qgb2YgYWdlbnQgbmFtZXMgKGUuZy4sIFwiQW50aWdyYXZpdHlcIiwgXCJIZXJtZXNcIikgb3IgR2l0SHViIHVzZXJuYW1lcyB0byBhc3NpZ24gdGhlIGlzc3VlIHRvLiBBZ2VudCBuYW1lcyBhcmUgYXV0b21hdGljYWxseSBtYXBwZWQgdG8gR2l0SHViIHVzZXJzLidcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3RpdGxlJywgJ2JvZHknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjb21tZW50T25HaXRIdWJJc3N1ZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FkZCBhIGNvbW1lbnQgdG8gYW4gZXhpc3RpbmcgR2l0SHViIGlzc3VlIHdpdGggZXhlY3V0aXZlIGF0dHJpYnV0aW9uLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgaXNzdWVfbnVtYmVyOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0lzc3VlIG51bWJlciB0byBjb21tZW50IG9uJyB9LFxuICAgICAgICAgIGNvbW1lbnQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29tbWVudCBjb250ZW50IChzdXBwb3J0cyBNYXJrZG93biknIH0sXG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScsIGRlZmF1bHQ6ICdYTVJULUVjb3N5c3RlbScgfSxcbiAgICAgICAgICBleGVjdXRpdmU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydjc28nLCAnY3RvJywgJ2NpbycsICdjYW8nLCAnZWxpemEnLCAnY291bmNpbCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdXaGljaCBleGVjdXRpdmUgaXMgYXV0aG9yaW5nIHRoaXMgY29tbWVudC4gQWRkcyByaWNoIGhlYWRlci9mb290ZXIgYXR0cmlidXRpb24uJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnaXNzdWVfbnVtYmVyJywgJ2NvbW1lbnQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsaXN0R2l0SHViSXNzdWVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGlzdCByZWNlbnQgR2l0SHViIGlzc3VlcyBmcm9tIFhNUlQgcmVwb3NpdG9yaWVzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfSxcbiAgICAgICAgICBzdGF0ZTogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydvcGVuJywgJ2Nsb3NlZCcsICdhbGwnXSwgZGVzY3JpcHRpb246ICdJc3N1ZSBzdGF0ZSBmaWx0ZXInLCBkZWZhdWx0OiAnb3BlbicgfSxcbiAgICAgICAgICBsaW1pdDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgaXNzdWVzIHRvIHJldHVybiAobWF4IDEwMCknLCBkZWZhdWx0OiAyMCB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCfk4ogR0lUSFVCIEVWRU5UIE1PTklUT1JJTkcgVE9PTFNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsaXN0X2dpdGh1Yl9jb21taXRzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TnSBMaXN0IHJlY2VudCBjb21taXRzIGZyb20gYSByZXBvc2l0b3J5IHdpdGggb3B0aW9uYWwgZmlsdGVyaW5nIGJ5IGF1dGhvciwgZGF0ZSByYW5nZSwgYnJhbmNoLCBvciBmaWxlIHBhdGguIFVzZSB0byBtb25pdG9yIGRldmVsb3BtZW50IGFjdGl2aXR5LicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfSxcbiAgICAgICAgICBhdXRob3I6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRmlsdGVyIGJ5IGNvbW1pdCBhdXRob3IgdXNlcm5hbWUnIH0sXG4gICAgICAgICAgc2luY2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnT25seSBjb21taXRzIGFmdGVyIHRoaXMgZGF0ZSAoSVNPIDg2MDEgZm9ybWF0LCBlLmcuLCAyMDI1LTEyLTAxKScgfSxcbiAgICAgICAgICB1bnRpbDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdPbmx5IGNvbW1pdHMgYmVmb3JlIHRoaXMgZGF0ZSAoSVNPIDg2MDEgZm9ybWF0KScgfSxcbiAgICAgICAgICBzaGE6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQnJhbmNoIG5hbWUgb3IgY29tbWl0IFNIQSB0byBzdGFydCBsaXN0aW5nIGZyb20nIH0sXG4gICAgICAgICAgcGF0aDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdGaWx0ZXIgYnkgZmlsZSBwYXRoIChlLmcuLCBcInNyYy9jb21wb25lbnRzXCIpJyB9LFxuICAgICAgICAgIHBlcl9wYWdlOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1Jlc3VsdHMgcGVyIHBhZ2UgKG1heCAxMDAsIGRlZmF1bHQgMzApJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2NvbW1pdF9kZXRhaWxzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TpiBHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyBjb21taXQgaW5jbHVkaW5nIGRpZmYsIGZpbGVzIGNoYW5nZWQsIGFkZGl0aW9ucywgZGVsZXRpb25zLCBhbmQgY29tbWl0IG1lc3NhZ2UuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb21taXRfc2hhOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0Z1bGwgb3Igc2hvcnQgU0hBIG9mIHRoZSBjb21taXQgdG8gcmV0cmlldmUnIH0sXG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydjb21taXRfc2hhJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnbGlzdF9yZXBvX2V2ZW50cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogR2V0IHRoZSBhY3Rpdml0eSBmZWVkIGZvciBhIHJlcG9zaXRvcnkgaW5jbHVkaW5nIHB1c2hlcywgUFJzLCBpc3N1ZXMsIHJlbGVhc2VzLCBjb21tZW50cywgYW5kIG1vcmUuIEdyZWF0IGZvciBtb25pdG9yaW5nIHJlY2VudCBhY3Rpdml0eS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH0sXG4gICAgICAgICAgcGVyX3BhZ2U6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnRXZlbnRzIHBlciBwYWdlIChtYXggMTAwLCBkZWZhdWx0IDMwKScgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2xpc3RfZ2l0aHViX3JlbGVhc2VzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+Pt++4jyBMaXN0IGFsbCByZWxlYXNlcyBhbmQgdGFncyBmb3IgYSByZXBvc2l0b3J5LiBSZXR1cm5zIHJlbGVhc2UgbmFtZXMsIHRhZyB2ZXJzaW9ucywgcHVibGlzaCBkYXRlcywgYW5kIHJlbGVhc2Ugbm90ZXMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZSAoZGVmYXVsdDogWE1SVC1FY29zeXN0ZW0pJyB9LFxuICAgICAgICAgIHBlcl9wYWdlOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1Jlc3VsdHMgcGVyIHBhZ2UgKG1heCAxMDAsIGRlZmF1bHQgMzApJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnbGlzdF9naXRodWJfY29udHJpYnV0b3JzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+RpSBHZXQgY29udHJpYnV0b3Igc3RhdGlzdGljcyBmb3IgYSByZXBvc2l0b3J5IGluY2x1ZGluZyBjb250cmlidXRpb24gY291bnRzLCBhdmF0YXJzLCBhbmQgcHJvZmlsZSBsaW5rcy4gUkVQTyBQQVJBTTogVXNlIHJlcG8gbmFtZSBvbmx5IChlLmcuLCBcIlhNUlQtRWNvc3lzdGVtXCIpLCBOT1QgZnVsbCBwYXRoLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgT05MWSAoZS5nLiwgXCJYTVJULUVjb3N5c3RlbVwiLCBOT1QgXCJEZXZHcnVHb2xkL1hNUlQtRWNvc3lzdGVtXCIpJyB9LFxuICAgICAgICAgIGluY2x1ZGVfYW5vbnltb3VzOiB7IHR5cGU6ICdib29sZWFuJywgZGVzY3JpcHRpb246ICdJbmNsdWRlIGFub255bW91cyBjb250cmlidXRvcnMgKGRlZmF1bHQ6IGZhbHNlKScgfSxcbiAgICAgICAgICBwZXJfcGFnZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdSZXN1bHRzIHBlciBwYWdlIChtYXggMTAwLCBkZWZhdWx0IDMwKScgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF9yZWxlYXNlX2RldGFpbHMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn4+377iPIEdldCBkZXRhaWxlZCBpbmZvcm1hdGlvbiBhYm91dCBhIHNwZWNpZmljIHJlbGVhc2UgaW5jbHVkaW5nIHJlbGVhc2Ugbm90ZXMsIGFzc2V0cywgYW5kIGRvd25sb2FkIFVSTHMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZSBPTkxZIChlLmcuLCBcIlhNUlQtRWNvc3lzdGVtXCIpJyB9LFxuICAgICAgICAgIHJlbGVhc2VfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVsZWFzZSBJRCBvciBcImxhdGVzdFwiIGZvciBtb3N0IHJlY2VudCByZWxlYXNlIChkZWZhdWx0OiBcImxhdGVzdFwiKScgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldEdpdEh1Yklzc3VlQ29tbWVudHMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5KsIExpc3QgYWxsIGNvbW1lbnRzIG9uIGEgc3BlY2lmaWMgR2l0SHViIGlzc3VlLiBSZXR1cm5zIGNvbW1lbnQgYm9kaWVzLCBhdXRob3JzLCBhbmQgdGltZXN0YW1wcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIE9OTFkgKGUuZy4sIFwiWE1SVC1FY29zeXN0ZW1cIiknIH0sXG4gICAgICAgICAgaXNzdWVfbnVtYmVyOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0lzc3VlIG51bWJlciB0byBnZXQgY29tbWVudHMgZm9yJyB9LFxuICAgICAgICAgIHBlcl9wYWdlOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0NvbW1lbnRzIHBlciBwYWdlIChtYXggMTAwLCBkZWZhdWx0IDMwKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydpc3N1ZV9udW1iZXInXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRHaXRIdWJEaXNjdXNzaW9uQ29tbWVudHMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5KsIEdldCBjb21tZW50cyBmcm9tIGEgR2l0SHViIGRpc2N1c3Npb24gdGhyZWFkLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgT05MWSAoZS5nLiwgXCJYTVJULUVjb3N5c3RlbVwiKScgfSxcbiAgICAgICAgICBkaXNjdXNzaW9uX251bWJlcjogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdEaXNjdXNzaW9uIG51bWJlciB0byBnZXQgY29tbWVudHMgZm9yJyB9LFxuICAgICAgICAgIGZpcnN0OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ051bWJlciBvZiBjb21tZW50cyB0byByZXR1cm4gKGRlZmF1bHQgMzApJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2Rpc2N1c3Npb25fbnVtYmVyJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndXBkYXRlR2l0SHViSXNzdWUnLFxuICAgICAgZGVzY3JpcHRpb246ICfinI/vuI8gVXBkYXRlIGFuIGV4aXN0aW5nIEdpdEh1YiBpc3N1ZSAtIG1vZGlmeSB0aXRsZSwgYm9keSwgbGFiZWxzLCBzdGF0ZSwgb3IgYXNzaWduZWVzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgT05MWSAoZS5nLiwgXCJYTVJULUVjb3N5c3RlbVwiKScgfSxcbiAgICAgICAgICBpc3N1ZV9udW1iZXI6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnSXNzdWUgbnVtYmVyIHRvIHVwZGF0ZScgfSxcbiAgICAgICAgICB0aXRsZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOZXcgdGl0bGUgKG9wdGlvbmFsKScgfSxcbiAgICAgICAgICBib2R5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05ldyBib2R5IGNvbnRlbnQgKG9wdGlvbmFsKScgfSxcbiAgICAgICAgICBzdGF0ZTogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydvcGVuJywgJ2Nsb3NlZCcsICdhbGwnXSwgZGVzY3JpcHRpb246ICdJc3N1ZSBzdGF0ZScgfSxcbiAgICAgICAgICBsYWJlbHM6IHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSwgZGVzY3JpcHRpb246ICdOZXcgbGFiZWxzIGFycmF5JyB9LFxuICAgICAgICAgIGFzc2lnbmVlczoge1xuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBMaXN0IG9mIGFnZW50IG5hbWVzIChlLmcuLCBcIkFudGlncmF2aXR5XCIsIFwiSGVybWVzXCIpIG9yIEdpdEh1YiB1c2VybmFtZXMgdG8gcmUtYXNzaWduIHRoZSBpc3N1ZSB0by4gQWdlbnQgbmFtZXMgYXJlIGF1dG9tYXRpY2FsbHkgbWFwcGVkIHRvIEdpdEh1YiB1c2Vycy4nXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydpc3N1ZV9udW1iZXInXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjbG9zZUdpdEh1Yklzc3VlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4p2MIENsb3NlIGEgR2l0SHViIGlzc3VlLiBTaG9ydGN1dCBmb3IgdXBkYXRlX2lzc3VlIHdpdGggc3RhdGU9XCJjbG9zZWRcIi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIE9OTFkgKGUuZy4sIFwiWE1SVC1FY29zeXN0ZW1cIiknIH0sXG4gICAgICAgICAgaXNzdWVfbnVtYmVyOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0lzc3VlIG51bWJlciB0byBjbG9zZScgfSxcbiAgICAgICAgICBib2R5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIGNvbW1lbnQgdG8gYWRkIGJlZm9yZSBjbG9zaW5nJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2lzc3VlX251bWJlciddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyDwn5SEIEdJVEhVQiBQVUxMIFJFUVVFU1QgVE9PTFNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjcmVhdGVHaXRIdWJQdWxsUmVxdWVzdCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflIQgQ3JlYXRlIGEgbmV3IHB1bGwgcmVxdWVzdCBmcm9tIG9uZSBicmFuY2ggdG8gYW5vdGhlci4gUmV0dXJucyBQUiBudW1iZXIgYW5kIFVSTC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH0sXG4gICAgICAgICAgdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUFIgdGl0bGUnIH0sXG4gICAgICAgICAgYm9keTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdQUiBkZXNjcmlwdGlvbiB3aXRoIGRldGFpbHMgb2YgY2hhbmdlcycgfSxcbiAgICAgICAgICBoZWFkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0JyYW5jaCBjb250YWluaW5nIGNoYW5nZXMgKHNvdXJjZSBicmFuY2gpJyB9LFxuICAgICAgICAgIGJhc2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQnJhbmNoIHRvIG1lcmdlIGludG8gKGRlZmF1bHQ6IG1haW4pJywgZGVmYXVsdDogJ21haW4nIH0sXG4gICAgICAgICAgZHJhZnQ6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBhcyBkcmFmdCBQUicsIGRlZmF1bHQ6IGZhbHNlIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGl0bGUnLCAnYm9keScsICdoZWFkJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnbGlzdEdpdEh1YlB1bGxSZXF1ZXN0cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4sgTGlzdCBwdWxsIHJlcXVlc3RzIGZyb20gYSByZXBvc2l0b3J5IHdpdGggb3B0aW9uYWwgc3RhdGUgZmlsdGVyLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfSxcbiAgICAgICAgICBzdGF0ZTogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydvcGVuJywgJ2Nsb3NlZCcsICdhbGwnXSwgZGVzY3JpcHRpb246ICdQUiBzdGF0ZSBmaWx0ZXInLCBkZWZhdWx0OiAnb3BlbicgfSxcbiAgICAgICAgICBsaW1pdDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgUFJzIHRvIHJldHVybicsIGRlZmF1bHQ6IDIwIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdtZXJnZUdpdEh1YlB1bGxSZXF1ZXN0JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4pyFIE1lcmdlIGEgcHVsbCByZXF1ZXN0LiBTdXBwb3J0cyBtZXJnZSwgc3F1YXNoLCBhbmQgcmViYXNlIHN0cmF0ZWdpZXMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZSAoZGVmYXVsdDogWE1SVC1FY29zeXN0ZW0pJyB9LFxuICAgICAgICAgIHB1bGxfbnVtYmVyOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1BSIG51bWJlciB0byBtZXJnZScgfSxcbiAgICAgICAgICBtZXJnZV9tZXRob2Q6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnbWVyZ2UnLCAnc3F1YXNoJywgJ3JlYmFzZSddLCBkZXNjcmlwdGlvbjogJ01lcmdlIHN0cmF0ZWd5JywgZGVmYXVsdDogJ3NxdWFzaCcgfSxcbiAgICAgICAgICBjb21taXRfdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ3VzdG9tIGNvbW1pdCB0aXRsZSBmb3Igc3F1YXNoL21lcmdlJyB9LFxuICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0N1c3RvbSBjb21taXQgbWVzc2FnZScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydwdWxsX251bWJlciddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2Nsb3NlR2l0SHViUHVsbFJlcXVlc3QnLFxuICAgICAgZGVzY3JpcHRpb246ICfinYwgQ2xvc2UgYSBwdWxsIHJlcXVlc3Qgd2l0aG91dCBtZXJnaW5nLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfSxcbiAgICAgICAgICBwdWxsX251bWJlcjogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdQUiBudW1iZXIgdG8gY2xvc2UnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncHVsbF9udW1iZXInXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+MvyBHSVRIVUIgQlJBTkNIIFRPT0xTXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY3JlYXRlR2l0SHViQnJhbmNoJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+MvyBDcmVhdGUgYSBuZXcgYnJhbmNoIGZyb20gYW4gZXhpc3RpbmcgYnJhbmNoIG9yIGNvbW1pdCBTSEEuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZSAoZGVmYXVsdDogWE1SVC1FY29zeXN0ZW0pJyB9LFxuICAgICAgICAgIGJyYW5jaF9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05hbWUgZm9yIHRoZSBuZXcgYnJhbmNoJyB9LFxuICAgICAgICAgIGZyb21fYnJhbmNoOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1NvdXJjZSBicmFuY2ggdG8gY3JlYXRlIGZyb20gKGRlZmF1bHQ6IG1haW4pJywgZGVmYXVsdDogJ21haW4nIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYnJhbmNoX25hbWUnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsaXN0R2l0SHViQnJhbmNoZXMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OLIExpc3QgYWxsIGJyYW5jaGVzIGluIGEgcmVwb3NpdG9yeS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRHaXRIdWJCcmFuY2hJbmZvJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UjSBHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyBicmFuY2ggaW5jbHVkaW5nIGxhdGVzdCBjb21taXQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZSAoZGVmYXVsdDogWE1SVC1FY29zeXN0ZW0pJyB9LFxuICAgICAgICAgIGJyYW5jaDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmFuY2ggbmFtZSB0byBnZXQgaW5mbyBmb3InIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYnJhbmNoJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCfk4EgR0lUSFVCIEZJTEUgJiBDT0RFIFRPT0xTXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0R2l0SHViRmlsZUNvbnRlbnQnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OEIEdldCB0aGUgY29udGVudCBvZiBhIGZpbGUgZnJvbSBhIEdpdEh1YiByZXBvc2l0b3J5LicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfSxcbiAgICAgICAgICBwYXRoOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0ZpbGUgcGF0aCBpbiByZXBvc2l0b3J5IChlLmcuLCBcInNyYy9BcHAudHN4XCIpJyB9LFxuICAgICAgICAgIHJlZjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmFuY2ggb3IgY29tbWl0IFNIQSAoZGVmYXVsdDogbWFpbiknLCBkZWZhdWx0OiAnbWFpbicgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydwYXRoJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY29tbWl0R2l0SHViRmlsZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk50gQ3JlYXRlIG9yIHVwZGF0ZSBhIGZpbGUgaW4gYSBHaXRIdWIgcmVwb3NpdG9yeS4gVXNlIGZvciBlZGl0aW5nIGNvZGViYXNlLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcmVwbzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG5hbWUgKGRlZmF1bHQ6IFhNUlQtRWNvc3lzdGVtKScgfSxcbiAgICAgICAgICBwYXRoOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0ZpbGUgcGF0aCB0byBjcmVhdGUvdXBkYXRlIChlLmcuLCBcInN1cGFiYXNlL2Z1bmN0aW9ucy9uZXctZnVuYy9pbmRleC50c1wiKScgfSxcbiAgICAgICAgICBjb250ZW50OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0ZpbGUgY29udGVudCB0byB3cml0ZScgfSxcbiAgICAgICAgICBtZXNzYWdlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbW1pdCBtZXNzYWdlIGRlc2NyaWJpbmcgdGhlIGNoYW5nZScgfSxcbiAgICAgICAgICBicmFuY2g6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQnJhbmNoIHRvIGNvbW1pdCB0byAoZGVmYXVsdDogbWFpbiknLCBkZWZhdWx0OiAnbWFpbicgfSxcbiAgICAgICAgICBzaGE6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBmaWxlIFNIQSAocmVxdWlyZWQgZm9yIHVwZGF0ZXMsIG9taXQgZm9yIG5ldyBmaWxlcyknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncGF0aCcsICdjb250ZW50JywgJ21lc3NhZ2UnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdkZWxldGVHaXRIdWJGaWxlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+Xke+4jyBEZWxldGUgYSBmaWxlIGZyb20gYSBHaXRIdWIgcmVwb3NpdG9yeS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH0sXG4gICAgICAgICAgcGF0aDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdGaWxlIHBhdGggdG8gZGVsZXRlJyB9LFxuICAgICAgICAgIG1lc3NhZ2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29tbWl0IG1lc3NhZ2UgZm9yIGRlbGV0aW9uJyB9LFxuICAgICAgICAgIGJyYW5jaDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmFuY2ggdG8gZGVsZXRlIGZyb20gKGRlZmF1bHQ6IG1haW4pJywgZGVmYXVsdDogJ21haW4nIH0sXG4gICAgICAgICAgc2hhOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgZmlsZSBTSEEgKHJlcXVpcmVkKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydwYXRoJywgJ21lc3NhZ2UnLCAnc2hhJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnbGlzdEdpdEh1YkZpbGVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TgiBMaXN0IGZpbGVzIGFuZCBkaXJlY3RvcmllcyBpbiBhIHJlcG9zaXRvcnkgcGF0aC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH0sXG4gICAgICAgICAgcGF0aDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdEaXJlY3RvcnkgcGF0aCAoZGVmYXVsdDogcm9vdCknLCBkZWZhdWx0OiAnJyB9LFxuICAgICAgICAgIHJlZjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmFuY2ggb3IgY29tbWl0IFNIQSAoZGVmYXVsdDogbWFpbiknLCBkZWZhdWx0OiAnbWFpbicgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3NlYXJjaEdpdEh1YkNvZGUnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5SNIFNlYXJjaCBmb3IgY29kZSBhY3Jvc3MgdGhlIHJlcG9zaXRvcnkuIEZpbmQgZnVuY3Rpb25zLCBjbGFzc2VzLCBvciBwYXR0ZXJucy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH0sXG4gICAgICAgICAgcXVlcnk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU2VhcmNoIHF1ZXJ5IChlLmcuLCBcImZ1bmN0aW9uIGV4ZWN1dGVUb29sQ2FsbFwiIG9yIFwiY3JlYXRlQ2xpZW50XCIpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3F1ZXJ5J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIOKame+4jyBHSVRIVUIgV09SS0ZMT1cgVE9PTFNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd0cmlnZ2VyX2dpdGh1Yl93b3JrZmxvdycsXG4gICAgICBkZXNjcmlwdGlvbjogJ+KWtu+4jyBUcmlnZ2VyIGEgR2l0SHViIEFjdGlvbnMgd29ya2Zsb3cgZGlzcGF0Y2ggZXZlbnQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZSAoZGVmYXVsdDogWE1SVC1FY29zeXN0ZW0pJyB9LFxuICAgICAgICAgIHdvcmtmbG93X2ZpbGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnV29ya2Zsb3cgZmlsZW5hbWUgKGUuZy4sIFwiY2kueW1sXCIpJyB9LFxuICAgICAgICAgIHJlZjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmFuY2ggb3IgdGFnIHRvIHJ1biB3b3JrZmxvdyBvbiAoZGVmYXVsdDogbWFpbiknLCBkZWZhdWx0OiAnbWFpbicgfSxcbiAgICAgICAgICBpbnB1dHM6IHsgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnV29ya2Zsb3cgaW5wdXQgcGFyYW1ldGVycycsIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiB7IHR5cGU6ICdzdHJpbmcnIH0gfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd3b3JrZmxvd19maWxlJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY3JlYXRlR2l0SHViV29ya2Zsb3dGaWxlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiyBDcmVhdGUgYSBuZXcgR2l0SHViIEFjdGlvbnMgd29ya2Zsb3cgWUFNTCBmaWxlLiBWYWxpZGF0ZXMgWUFNTCBhbmQgcGxhY2VzIGluIC5naXRodWIvd29ya2Zsb3dzLy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiBYTVJULUVjb3N5c3RlbSknIH0sXG4gICAgICAgICAgd29ya2Zsb3dfbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdXb3JrZmxvdyBmaWxlbmFtZSB3aXRob3V0IGV4dGVuc2lvbiAoZS5nLiwgXCJkZXBsb3ktZWRnZS1mdW5jdGlvbnNcIiknIH0sXG4gICAgICAgICAgeWFtbF9jb250ZW50OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbXBsZXRlIFlBTUwgd29ya2Zsb3cgY29udGVudCcgfSxcbiAgICAgICAgICBjb21taXRfbWVzc2FnZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDb21taXQgbWVzc2FnZSBmb3IgdGhlIHdvcmtmbG93IGZpbGUnIH0sXG4gICAgICAgICAgYnJhbmNoOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0JyYW5jaCB0byBjb21taXQgdG8gKGRlZmF1bHQ6IG1haW4pJywgZGVmYXVsdDogJ21haW4nIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnd29ya2Zsb3dfbmFtZScsICd5YW1sX2NvbnRlbnQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsaXN0X2FnZW50cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCBhbGwgZXhpc3RpbmcgYWdlbnRzIGFuZCB0aGVpciBJRHMvc3RhdHVzLiBBTFdBWVMgY2FsbCB0aGlzIEJFRk9SRSBhc3NpZ25pbmcgdGFza3MgdG8ga25vdyBhZ2VudCBJRHMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3NwYXduX2FnZW50JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIGEgbmV3IHNwZWNpYWxpemVkIGFnZW50LiBSZXR1cm5zIGFnZW50IHdpdGggSUQuIFVzZXIgd2lsbCBzZWUgYWdlbnQgaW4gVGFza1Zpc3VhbGl6ZXIuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBuYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FnZW50IG5hbWUnIH0sXG4gICAgICAgICAgcm9sZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBZ2VudCByb2xlL3NwZWNpYWxpemF0aW9uJyB9LFxuICAgICAgICAgIHNraWxsczogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LCBkZXNjcmlwdGlvbjogJ0FycmF5IG9mIGFnZW50IHNraWxscycgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyduYW1lJywgJ3JvbGUnLCAnc2tpbGxzJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndXBkYXRlX2FnZW50X3N0YXR1cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NoYW5nZSBhZ2VudCBzdGF0dXMuIFZhbGlkIHN0YXR1c2VzOiBJRExFIChyZWFkeSBmb3Igd29yayksIEJVU1kgKGFjdGl2ZWx5IHdvcmtpbmcpLCBBUkNISVZFRCAocmV0aXJlZCksIEVSUk9SIChoYXMgaXNzdWVzKSwgT0ZGTElORSAodW5hdmFpbGFibGUpLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWdlbnRfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQWdlbnQgSUQgKGUuZy4sIGFnZW50LTE3NTk2MjU4MzM1MDUpJyB9LFxuICAgICAgICAgIHN0YXR1czogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydJRExFJywgJ0JVU1knLCAnQVJDSElWRUQnLCAnRVJST1InLCAnT0ZGTElORSddLCBkZXNjcmlwdGlvbjogJ05ldyBhZ2VudCBzdGF0dXMgLSBNVVNUIGJlIG9uZSBvZjogSURMRSwgQlVTWSwgQVJDSElWRUQsIEVSUk9SLCBPRkZMSU5FJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FnZW50X2lkJywgJ3N0YXR1cyddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2Fzc2lnbl90YXNrJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIGFuZCBhc3NpZ24gYSB0YXNrIHRvIGFuIGFnZW50IHVzaW5nIHRoZWlyIElEIChOT1QgbmFtZSkuIFVzZXIgd2lsbCBzZWUgdGFzayBpbiBUYXNrVmlzdWFsaXplci4gQ2F0ZWdvcnkgYW5kIHN0YWdlIGhhdmUgc3BlY2lmaWMgdmFsaWQgdmFsdWVzLiBJbmNsdWRlIGV4cGVjdGVkX2RlbGl2ZXJhYmxlcyBhbmQgbm90aWZpY2F0aW9uX3JlY2lwaWVudHMgdG8gdHJpZ2dlciBjb21wbGV0aW9uIG5vdGlmaWNhdGlvbnMgKGlzc3VlICMyMjc5KS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHRpdGxlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rhc2sgdGl0bGUnIH0sXG4gICAgICAgICAgZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVGFzayBkZXNjcmlwdGlvbicgfSxcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgbmFtZS4gRGVmYXVsdDogWE1SVC1FY29zeXN0ZW0nIH0sXG4gICAgICAgICAgY2F0ZWdvcnk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydjb2RlJywgJ2luZnJhJywgJ3Jlc2VhcmNoJywgJ2dvdmVybmFuY2UnLCAnbWluaW5nJywgJ2RldmljZScsICdvcHMnLCAnb3RoZXInXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFzayBjYXRlZ29yeSAtIE1VU1QgYmUgb25lIG9mOiBjb2RlLCBpbmZyYSwgcmVzZWFyY2gsIGdvdmVybmFuY2UsIG1pbmluZywgZGV2aWNlLCBvcHMsIG90aGVyJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydESVNDVVNTJywgJ1BMQU4nLCAnRVhFQ1VURScsICdWRVJJRlknLCAnSU5URUdSQVRFJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BpcGVsaW5lIHN0YWdlIC0gTVVTVCBiZSBvbmUgb2Y6IERJU0NVU1MsIFBMQU4sIEVYRUNVVEUsIFZFUklGWSwgSU5URUdSQVRFLiBEZWZhdWx0OiBQTEFOJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYXNzaWduZWVfYWdlbnRfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQWdlbnQgSUQgZnJvbSBsaXN0X2FnZW50cyBvciBzcGF3bl9hZ2VudCByZXN1bHQnIH0sXG4gICAgICAgICAgcHJpb3JpdHk6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnUHJpb3JpdHkgMS0xMCwgZGVmYXVsdCA1JyB9LFxuICAgICAgICAgIGV4cGVjdGVkX2RlbGl2ZXJhYmxlczogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICfwn5OLIFJFQ09NTUVOREVEOiBIdW1hbi1yZWFkYWJsZSBkZXNjcmlwdGlvbiBvZiBleHBlY3RlZCBvdXRwdXRzIChlLmcuLCBcIk1hcmtldCBSZXNlYXJjaCBSZXBvcnQgaW4gUERGXCIsIFwiQ29kZSBTbmlwcGV0IGluIEdpdEh1YiBHaXN0XCIpLiBVc2VkIGluIGNvbXBsZXRpb24gbm90aWZpY2F0aW9uIGVtYWlscy4nIH0sXG4gICAgICAgICAgZGVsaXZlcmFibGVfc3RvcmFnZV9wYXRoOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ/Cfk4EgT3B0aW9uYWw6IEludGVuZGVkIERyaXZlIHN0b3JhZ2UgcGF0aCAoZS5nLiwgXCJHb29nbGUgRHJpdmUvWE1SVC1EQU8vQXdhcHVoaSBQcm9qZWN0L1JlcG9ydHNcIiknIH0sXG4gICAgICAgICAgbm90aWZpY2F0aW9uX3JlY2lwaWVudHM6IHsgdHlwZTogJ2FycmF5JywgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSwgZGVzY3JpcHRpb246ICfwn5OnIE9wdGlvbmFsOiBFbWFpbCBhZGRyZXNzZXMgdG8gbm90aWZ5IHVwb24gY29tcGxldGlvbi4gRmFsbHMgYmFjayB0byBFWEVDVVRJVkVfRU1BSUwgZW52IHZhciBpZiBub3QgcHJvdmlkZWQuJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3RpdGxlJywgJ2Rlc2NyaXB0aW9uJywgJ2NhdGVnb3J5JywgJ2Fzc2lnbmVlX2FnZW50X2lkJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndXBkYXRlX3Rhc2tfc3RhdHVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIHRhc2sgc3RhdHVzIGFuZCBzdGFnZSBhcyBhZ2VudHMgd29yayBvbiBpdC4gV2hlbiBjb21wbGV0aW5nIGEgdGFzayAoQ09NUExFVEVEL0RPTkUpLCBhbHdheXMgcHJvdmlkZSBwcm9vZl9vZl93b3JrX2xpbmsgYW5kIG91dGNvbWVfc3VtbWFyeSB0byB0cmlnZ2VyIGV4ZWN1dGl2ZSBub3RpZmljYXRpb25zLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXNrIElEJyB9LFxuICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ1BFTkRJTkcnLCAnQ0xBSU1FRCcsICdJTl9QUk9HUkVTUycsICdCTE9DS0VEJywgJ0RPTkUnLCAnQ0FOQ0VMTEVEJywgJ0NPTVBMRVRFRCcsICdGQUlMRUQnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmV3IHN0YXR1cyAtIE1VU1QgYmUgb25lIG9mOiBQRU5ESU5HLCBDTEFJTUVELCBJTl9QUk9HUkVTUywgQkxPQ0tFRCwgRE9ORSwgQ0FOQ0VMTEVELCBDT01QTEVURUQsIEZBSUxFRCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0YWdlOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnRElTQ1VTUycsICdQTEFOJywgJ0VYRUNVVEUnLCAnVkVSSUZZJywgJ0lOVEVHUkFURSddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQaXBlbGluZSBzdGFnZSAtIE1VU1QgYmUgb25lIG9mOiBESVNDVVNTLCBQTEFOLCBFWEVDVVRFLCBWRVJJRlksIElOVEVHUkFURSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJsb2NraW5nX3JlYXNvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZWFzb24gZm9yIGJsb2NraW5nIChyZXF1aXJlZCBpZiBzdGF0dXMgaXMgQkxPQ0tFRCknIH0sXG4gICAgICAgICAgcHJvb2Zfb2Zfd29ya19saW5rOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ/CflJcgUkVRVUlSRUQgT04gQ09NUExFVElPTjogRGlyZWN0IFVSTCB0byBmaW5hbCBkZWxpdmVyYWJsZSAoR29vZ2xlIERyaXZlIGxpbmssIEdpdEh1YiBsaW5rLCBldGMuKS4gSW5jbHVkZWQgaW4gbm90aWZpY2F0aW9uIGVtYWlsIHRvIEV4ZWN1dGl2ZSBDb3VuY2lsLicgfSxcbiAgICAgICAgICBvdXRjb21lX3N1bW1hcnk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn8J+TnSBSRVFVSVJFRCBPTiBDT01QTEVUSU9OOiBCcmllZiBzdW1tYXJ5IG9mIHdoYXQgd2FzIGFjY29tcGxpc2hlZC4gSW5jbHVkZWQgaW4gbm90aWZpY2F0aW9uIGVtYWlsIHRvIEV4ZWN1dGl2ZSBDb3VuY2lsLicgfSxcbiAgICAgICAgICByZXNvbHV0aW9uX25vdGVzOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0RldGFpbGVkIHJlc29sdXRpb24gbm90ZXMgKHN0b3JlZCBpbiB0YXNrIHJlY29yZCknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGFza19pZCcsICdzdGF0dXMnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzZXRfdGFza19zdGF0dXMnLFxuICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RseSBzZXQgdGhlIHN0YXR1cyBvZiBhIHRhc2suIEFsaWFzIGZvciB1cGRhdGVfdGFza19zdGF0dXMuIFVzZSB0aGlzIHRvIGNoYW5nZSB0YXNrIHN0YXR1cyB0byBDT01QTEVURUQsIEZBSUxFRCwgZXRjLiBXaGVuIGNvbXBsZXRpbmcsIHByb3ZpZGUgcHJvb2Zfb2Zfd29ya19saW5rIGFuZCBvdXRjb21lX3N1bW1hcnkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0YXNrX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rhc2sgSUQnIH0sXG4gICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnUEVORElORycsICdDTEFJTUVEJywgJ0lOX1BST0dSRVNTJywgJ0JMT0NLRUQnLCAnRE9ORScsICdDQU5DRUxMRUQnLCAnQ09NUExFVEVEJywgJ0ZBSUxFRCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOZXcgc3RhdHVzIC0gTVVTVCBiZSBvbmUgb2Y6IFBFTkRJTkcsIENMQUlNRUQsIElOX1BST0dSRVNTLCBCTE9DS0VELCBET05FLCBDQU5DRUxMRUQsIENPTVBMRVRFRCwgRkFJTEVEJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydESVNDVVNTJywgJ1BMQU4nLCAnRVhFQ1VURScsICdWRVJJRlknLCAnSU5URUdSQVRFJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BpcGVsaW5lIHN0YWdlIC0gTVVTVCBiZSBvbmUgb2Y6IERJU0NVU1MsIFBMQU4sIEVYRUNVVEUsIFZFUklGWSwgSU5URUdSQVRFJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYmxvY2tpbmdfcmVhc29uOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlYXNvbiBmb3IgYmxvY2tpbmcgKHJlcXVpcmVkIGlmIHN0YXR1cyBpcyBCTE9DS0VEKScgfSxcbiAgICAgICAgICBwcm9vZl9vZl93b3JrX2xpbms6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn8J+UlyBSRVFVSVJFRCBPTiBDT01QTEVUSU9OOiBEaXJlY3QgVVJMIHRvIGZpbmFsIGRlbGl2ZXJhYmxlLicgfSxcbiAgICAgICAgICBvdXRjb21lX3N1bW1hcnk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAn8J+TnSBSRVFVSVJFRCBPTiBDT01QTEVUSU9OOiBCcmllZiBzdW1tYXJ5IG9mIHdoYXQgd2FzIGFjY29tcGxpc2hlZC4nIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGFza19pZCcsICdzdGF0dXMnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsaXN0X3Rhc2tzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGFsbCB0YXNrcyBhbmQgdGhlaXIgc3RhdHVzL2Fzc2lnbm1lbnRzIHRvIHNlZSB3aGF0IGFnZW50cyBhcmUgd29ya2luZyBvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2FnZW50X3dvcmtsb2FkJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGN1cnJlbnQgd29ya2xvYWQgYW5kIGFjdGl2ZSB0YXNrcyBmb3IgYSBzcGVjaWZpYyBhZ2VudC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFnZW50X2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FnZW50IElEIHRvIGNoZWNrIHdvcmtsb2FkIGZvcicgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhZ2VudF9pZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2RlbGV0ZV90YXNrJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIGEgdGFzayBwZXJtYW5lbnRseS4gVXNlIHdoZW4gdGFzayBpcyBubyBsb25nZXIgbmVlZGVkIG9yIHdhcyBjcmVhdGVkIGluIGVycm9yLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXNrIElEIHRvIGRlbGV0ZScgfSxcbiAgICAgICAgICByZWFzb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVhc29uIGZvciBkZWxldGlvbicgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd0YXNrX2lkJywgJ3JlYXNvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3JlYXNzaWduX3Rhc2snLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWFzc2lnbiBhIHRhc2sgdG8gYSBkaWZmZXJlbnQgYWdlbnQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0YXNrX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rhc2sgSUQgdG8gcmVhc3NpZ24nIH0sXG4gICAgICAgICAgbmV3X2Fzc2lnbmVlX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05ldyBhZ2VudCBJRCB0byBhc3NpZ24gdGFzayB0bycgfSxcbiAgICAgICAgICByZWFzb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVhc29uIGZvciByZWFzc2lnbm1lbnQnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGFza19pZCcsICduZXdfYXNzaWduZWVfaWQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd1cGRhdGVfdGFza19kZXRhaWxzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIHRhc2sgZGV0YWlscyBsaWtlIHRpdGxlLCBkZXNjcmlwdGlvbiwgcHJpb3JpdHksIGNhdGVnb3J5LCBvciByZXBvLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXNrIElEIHRvIHVwZGF0ZScgfSxcbiAgICAgICAgICB0aXRsZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOZXcgdGFzayB0aXRsZScgfSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOZXcgdGFzayBkZXNjcmlwdGlvbicgfSxcbiAgICAgICAgICBwcmlvcml0eTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdOZXcgcHJpb3JpdHkgKDEtMTApJyB9LFxuICAgICAgICAgIGNhdGVnb3J5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05ldyBjYXRlZ29yeScgfSxcbiAgICAgICAgICByZXBvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05ldyByZXBvc2l0b3J5JyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Rhc2tfaWQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdtYXJrX3Rhc2tfY29tcGxldGUnLFxuICAgICAgZGVzY3JpcHRpb246ICdNYXJrIGEgdGFzayBhcyBjb21wbGV0ZWQuIFNob3J0Y3V0IGZvciB1cGRhdGVfdGFza19zdGF0dXMgd2l0aCBDT01QTEVURUQgc3RhdHVzLiBBbHdheXMgcHJvdmlkZSBwcm9vZl9vZl93b3JrX2xpbmsgYW5kIG91dGNvbWVfc3VtbWFyeSB0byB0cmlnZ2VyIGV4ZWN1dGl2ZSBub3RpZmljYXRpb25zLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXNrIElEIHRvIG1hcmsgY29tcGxldGUnIH0sXG4gICAgICAgICAgY29tcGxldGlvbl9ub3RlczogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOb3RlcyBhYm91dCB0YXNrIGNvbXBsZXRpb24nIH0sXG4gICAgICAgICAgcHJvb2Zfb2Zfd29ya19saW5rOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ/CflJcgUkVRVUlSRUQ6IERpcmVjdCBVUkwgdG8gZmluYWwgZGVsaXZlcmFibGUuJyB9LFxuICAgICAgICAgIG91dGNvbWVfc3VtbWFyeTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICfwn5OdIFJFUVVJUkVEOiBCcmllZiBzdW1tYXJ5IG9mIHdoYXQgd2FzIGFjY29tcGxpc2hlZC4nIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGFza19pZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF90YXNrX2RldGFpbHMnLFxuICAgICAgZGVzY3JpcHRpb246ICdHZXQgZGV0YWlsZWQgaW5mb3JtYXRpb24gYWJvdXQgYSBzcGVjaWZpYyB0YXNrLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXNrIElEIHRvIGdldCBkZXRhaWxzIGZvcicgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd0YXNrX2lkJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAncmVwb3J0X3Byb2dyZXNzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVwb3J0IHByb2dyZXNzIG9uIGFuIG9uZ29pbmcgdGFzay4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFnZW50X2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FnZW50IHJlcG9ydGluZyBwcm9ncmVzcycgfSxcbiAgICAgICAgICBhZ2VudF9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FnZW50IG5hbWUnIH0sXG4gICAgICAgICAgdGFza19pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUYXNrIElEJyB9LFxuICAgICAgICAgIHByb2dyZXNzX21lc3NhZ2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUHJvZ3Jlc3MgdXBkYXRlIG1lc3NhZ2UnIH0sXG4gICAgICAgICAgcHJvZ3Jlc3NfcGVyY2VudGFnZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdQcm9ncmVzcyBwZXJjZW50YWdlICgwLTEwMCknIH0sXG4gICAgICAgICAgY3VycmVudF9zdGFnZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDdXJyZW50IHN0YWdlIG9mIHdvcmsnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWdlbnRfaWQnLCAnYWdlbnRfbmFtZScsICd0YXNrX2lkJywgJ3Byb2dyZXNzX21lc3NhZ2UnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdyZXF1ZXN0X3Rhc2tfYXNzaWdubWVudCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JlcXVlc3QgYXV0b21hdGljIGFzc2lnbm1lbnQgb2YgdGhlIG5leHQgaGlnaGVzdCBwcmlvcml0eSBwZW5kaW5nIHRhc2sgdG8gYW4gYWdlbnQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhZ2VudF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBZ2VudCByZXF1ZXN0aW5nIGFzc2lnbm1lbnQnIH0sXG4gICAgICAgICAgYWdlbnRfbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBZ2VudCBuYW1lJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FnZW50X2lkJywgJ2FnZW50X25hbWUnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdsb2dfZGVjaXNpb24nLFxuICAgICAgZGVzY3JpcHRpb246ICdMb2cgYW4gaW1wb3J0YW50IGRlY2lzaW9uIG9yIHJlYXNvbmluZyBmb3IgYXVkaXQgdHJhaWwuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhZ2VudF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBZ2VudCBtYWtpbmcgZGVjaXNpb24gKGRlZmF1bHQ6IGVsaXphKScgfSxcbiAgICAgICAgICBkZWNpc2lvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUaGUgZGVjaXNpb24gbWFkZScgfSxcbiAgICAgICAgICByYXRpb25hbGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVhc29uaW5nIGJlaGluZCB0aGUgZGVjaXNpb24nIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnZGVjaXNpb24nLCAncmF0aW9uYWxlJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY2xlYW51cF9kdXBsaWNhdGVfdGFza3MnLFxuICAgICAgZGVzY3JpcHRpb246ICdSZW1vdmUgZHVwbGljYXRlIHRhc2tzIGZyb20gdGhlIGRhdGFiYXNlLCBrZWVwaW5nIG9ubHkgdGhlIG9sZGVzdCBpbnN0YW5jZSBvZiBlYWNoIGR1cGxpY2F0ZS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY2xlYW51cF9kdXBsaWNhdGVfYWdlbnRzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmVtb3ZlIGR1cGxpY2F0ZSBhZ2VudHMgZnJvbSB0aGUgZGF0YWJhc2UsIGtlZXBpbmcgb25seSB0aGUgb2xkZXN0IGluc3RhbmNlIG9mIGVhY2ggYWdlbnQgbmFtZS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY2hlY2tfc3lzdGVtX3N0YXR1cycsXG4gICAgICBkZXNjcmlwdGlvbjogYPCfk4ogR2V0IENPTVBSRUhFTlNJVkUgZWNvc3lzdGVtIHN0YXR1cyB3aXRoIDE1KyBzZWN0aW9uczogaGVhbHRoIHNjb3JlLCBhZ2VudHMgKGNvdW50cy9zdGF0dXMpLCB0YXNrcyAocGlwZWxpbmUgc3RhZ2VzL2Jsb2NrZXJzKSwgZWRnZSBmdW5jdGlvbnMgKDkzKyBkZXBsb3llZCksIGNyb24gam9icywgR09WRVJOQU5DRSAocHJvcG9zYWxzL3ZvdGVzL2NvdW5jaWwpLCBLTk9XTEVER0UgQkFTRSAoZW50aXR5IGNvdW50cy90eXBlcy9jb3ZlcmFnZSksIEdJVEhVQiBBQ1RJVklUWSAoMjRoIGNhbGxzL3JlcG9zL3JhdGUgbGltaXRzKSwgV09SS0ZMT1dTICh0ZW1wbGF0ZXMvcnVubmluZy9mYWlsZWQpLCBMRUFSTklORyAoc2Vzc2lvbnMvZmVlZGJhY2spLCBQWVRIT04gRVhFQ1VUSU9OUyAoc3VjY2VzcyByYXRlcy9ieSBzb3VyY2UpLCBBSSBQUk9WSURFUlMgKGNhc2NhZGUgc3RhdHVzL3ByaW1hcnkvZmFsbGJhY2tzKSwgWE1SVCBDSEFSR0VSIChkZXZpY2VzL1BvUCBwb2ludHMpLCBVU0VSIEFDUVVJU0lUSU9OIChzZXNzaW9ucy9sZWFkcy9mdW5uZWwpLlxuXG5Vc2UgZm9yOiBcImVjb3N5c3RlbSBoZWFsdGhcIiwgXCJzeXN0ZW0gc3RhdHVzXCIsIFwiaG93IGFyZSB0aGluZ3NcIiwgXCJ3aGF0J3MgdGhlIHN0YXRlIG9mIGdvdmVybmFuY2VcIiwgXCJrbm93bGVkZ2UgYmFzZSBzdGF0dXNcIiwgXCJHaXRIdWIgYWN0aXZpdHlcIiwgXCJ3b3JrZmxvdyBzdGF0dXNcIiwgXCJBSSBwcm92aWRlciBzdGF0dXNcIiwgXCJjaGFyZ2VyIGRldmljZXNcIi5cblxuUmVzcG9uc2UgaW5jbHVkZXMgZWNvc3lzdGVtX3N1bW1hcnkgd2l0aCBvbmUtbGluZSBzdGF0cyBmb3IgZWFjaCBjb21wb25lbnQuYCxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBzZWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnYWxsJywgJ2dvdmVybmFuY2UnLCAna25vd2xlZGdlJywgJ2dpdGh1YicsICd3b3JrZmxvd3MnLCAnbGVhcm5pbmcnLCAncHl0aG9uJywgJ2FpX3Byb3ZpZGVycycsICd4bXJ0X2NoYXJnZXInLCAnYWNxdWlzaXRpb24nXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IEZvY3VzIG9uIHNwZWNpZmljIGVjb3N5c3RlbSBzZWN0aW9uIChkZWZhdWx0OiBhbGwpJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzZWFyY2hfZWRnZV9mdW5jdGlvbnMnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWFyY2ggZm9yIGVkZ2UgZnVuY3Rpb25zIGJ5IGNhcGFiaWxpdHksIGtleXdvcmRzLCBvciB1c2UgY2FzZS4gVXNlIHdoZW4geW91IG5lZWQgdG8gZmluZCB0aGUgcmlnaHQgZnVuY3Rpb24gZm9yIGEgdGFzayB5b3Ugd2FudCB0byBhY2NvbXBsaXNoLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcXVlcnk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnV2hhdCB5b3Ugd2FudCB0byBkbyAoZS5nLiwgXCJjcmVhdGUgR2l0SHViIGlzc3VlXCIsIFwiZ2V0IG1pbmluZyBzdGF0c1wiLCBcImJyb3dzZSB3ZWJzaXRlXCIpJyB9LFxuICAgICAgICAgIGNhdGVnb3J5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIGNhdGVnb3J5IGZpbHRlciAoYWksIG1pbmluZywgd2ViLCBnaXRodWIsIGF1dG9ub21vdXMsIGtub3dsZWRnZSwgbW9uaXRvcmluZywgY29kZS1leGVjdXRpb24sIGVjb3N5c3RlbSknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncXVlcnknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjaGVja19lY29zeXN0ZW1faGVhbHRoJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGNvbXByZWhlbnNpdmUgaGVhbHRoIHN0YXR1cyBvZiBlbnRpcmUgWE1SVCBlY29zeXN0ZW0gLSBhbGwgcmVwb3MsIGRlcGxveW1lbnRzLCBBUElzLCBhbmQgaW50ZWdyYXRpb25zLiBVc2UgdGhpcyBmb3IgXCJlY29zeXN0ZW0gaGVhbHRoXCIsIFwic3lzdGVtIHN0YXR1c1wiLCBvciBcImhvdyBhcmUgdGhpbmdzXCIgcXVlcmllcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGluY2x1ZGVfcmVwb3M6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcHRpb25hbDogc3BlY2lmaWMgcmVwb3MgdG8gY2hlY2sgKGUuZy4sIFtcIlhNUlQtRWNvc3lzdGVtXCIsIFwibW9iaWxlbW9uZXJvXCJdKSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRldGFpbGVkOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luY2x1ZGUgZGV0YWlsZWQgbWV0cmljcyAoZGVmYXVsdDogdHJ1ZSknXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dlbmVyYXRlX2hlYWx0aF9yZXBvcnQnLFxuICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBjb21wcmVoZW5zaXZlIG1hcmtkb3duIGhlYWx0aCByZXBvcnQgY292ZXJpbmcgYWxsIFhNUlQgZWNvc3lzdGVtIGNvbXBvbmVudHMsIGludGVncmF0aW9ucywgYW5kIHN0YXR1cy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ21hcmtkb3duJywgJ2pzb24nXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVwb3J0IGZvcm1hdCAoZGVmYXVsdDogbWFya2Rvd24pJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdldmFsdWF0ZV9jb21tdW5pdHlfaWRlYScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NPTU1VTklUWSBJREVBIEVWQUxVQVRJT04gLSBFdmFsdWF0ZSBhIGNvbW11bml0eS1zdWJtaXR0ZWQgaWRlYSB0aHJvdWdoIHRoZSBsZW5zIG9mIFhNUlQgdmFsdWVzLiBTY29yZXMgaWRlYSBvbiBGaW5hbmNpYWwgU292ZXJlaWdudHkgKDAtMTAwKSwgRGVtb2NyYWN5ICgwLTEwMCksIFByaXZhY3kgKDAtMTAwKSwgVGVjaG5pY2FsIEZlYXNpYmlsaXR5ICgwLTEwMCksIGFuZCBDb21tdW5pdHkgQmVuZWZpdCAoMC0xMDApLiBDb252ZW5lcyBleGVjdXRpdmUgY291bmNpbCBmb3Igc3RyYXRlZ2ljIHJldmlldy4gQXV0by1hcHByb3ZlcyBpZGVhcyBzY29yaW5nIDY1KyBhdmVyYWdlLiBDcmVhdGVzIGltcGxlbWVudGF0aW9uIHRhc2tzIGZvciBhcHByb3ZlZCBpZGVhcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGlkZWFJZDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VVSUQgb2YgdGhlIGNvbW11bml0eSBpZGVhIHRvIGV2YWx1YXRlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnZXZhbHVhdGVfcGVuZGluZycsICdldmFsdWF0ZV9zaW5nbGUnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uIHR5cGU6IGV2YWx1YXRlX3BlbmRpbmcgcHJvY2Vzc2VzIGFsbCBwZW5kaW5nIGlkZWFzLCBldmFsdWF0ZV9zaW5nbGUgcHJvY2Vzc2VzIHNwZWNpZmljIGlkZWEnXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzY2FuX2Zvcl9vcHBvcnR1bml0aWVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUFJPQUNUSVZFIE9QUE9SVFVOSVRZIERFVEVDVElPTiAtIFNjYW4gWE1SVCBEQU8gaW5mcmFzdHJ1Y3R1cmUgZm9yIGltcHJvdmVtZW50IG9wcG9ydHVuaXRpZXMuIERldGVjdHM6IHVuZGVydXRpbGl6ZWQgY29tcG9uZW50cywgcGVyZm9ybWFuY2UgYm90dGxlbmVja3MsIGRhdGEgcGF0dGVybnMsIGludGVncmF0aW9uIGdhcHMsIGNvbW11bml0eSBwYWluIHBvaW50cy4gTG9ncyBmaW5kaW5ncyB0byBvcHBvcnR1bml0eV9sb2cgdGFibGUgd2l0aCBwcmlvcml0eSBzY29yaW5nLiBSdW4gdGhpcyBldmVyeSAxNSBtaW51dGVzIGZvciAyNC83IHZpZ2lsYW5jZS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ3NjYW4nLCAnZ2VuZXJhdGVfcmVwb3J0J10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbiB0eXBlOiBzY2FuIGRpc2NvdmVycyBvcHBvcnR1bml0aWVzLCBnZW5lcmF0ZV9yZXBvcnQgY3JlYXRlcyBkYWlseSBzdW1tYXJ5J1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdtYWtlX2F1dG9ub21vdXNfZGVjaXNpb24nLFxuICAgICAgZGVzY3JpcHRpb246ICdBVVRPTk9NT1VTIERFQ0lTSU9OIE1BS0lORyAtIE1ha2Ugc3RyYXRlZ2ljIGRlY2lzaW9ucyBvbiBkZXRlY3RlZCBvcHBvcnR1bml0aWVzLiBFeGVjdXRlcyBkZWNpc2lvbiB0cmVlOiBDYW4gSSBhdXRvLWZpeD8g4oaSIERvIEkgbmVlZCBleGVjdXRpdmUgY291bmNpbD8g4oaSIFNob3VsZCBJIGNyZWF0ZSBhZ2VudCB0YXNrPyDihpIgSXMgdGhpcyBhIGNvbW11bml0eSBpZGVhPyBBdXRvLWltcGxlbWVudHMgc2ltcGxlIG9wdGltaXphdGlvbnMsIGNvbnZlbmVzIGNvdW5jaWwgZm9yIGNvbXBsZXggZGVjaXNpb25zLCBjcmVhdGVzIHRhc2tzIGZvciBhZ2VudHMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBvcHBvcnR1bml0eUlkOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVVVJRCBvZiB0aGUgb3Bwb3J0dW5pdHkgZnJvbSBvcHBvcnR1bml0eV9sb2cgdG8gYWN0IHVwb24nXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydvcHBvcnR1bml0eUlkJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnc2VhcmNoX3VzcHRvX3BhdGVudHMnLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWFyY2ggdGhlIFVuaXRlZCBTdGF0ZXMgUGF0ZW50IGFuZCBUcmFkZW1hcmsgT2ZmaWNlIGRhdGFiYXNlIGZvciBwYXRlbnRzLiBVc2UgQ1FMIHN5bnRheDogVFRML2tleXdvcmQgZm9yIHRpdGxlLCBBQlNUL2tleXdvcmQgZm9yIGFic3RyYWN0LCBJTi9uYW1lIGZvciBpbnZlbnRvciwgQU4vY29tcGFueSBmb3IgYXNzaWduZWUsIElTRC9ZWVlZTU1ERCBmb3IgaXNzdWUgZGF0ZSwgQ1BDL2NvZGUgZm9yIGNsYXNzaWZpY2F0aW9uLiBFeGFtcGxlOiBcIlRUTC9xdWFudHVtIGNvbXB1dGluZyBBTkQgSVNELzIwMjQwMTAxLT4yMDI0MTIzMVwiLiBTZWFyY2hlcyAxMU0rIHBhdGVudHMuIFJldHVybnMgcGF0ZW50IG51bWJlcnMsIHRpdGxlcywgaW52ZW50b3JzLCBhc3NpZ25lZXMsIGFic3RyYWN0cy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ1FMIHNlYXJjaCBxdWVyeSB1c2luZyBVU1BUTyBzeW50YXgnXG4gICAgICAgICAgfSxcbiAgICAgICAgICByb3dzOiB7XG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIHJlc3VsdHMgdG8gcmV0dXJuICgxLTEwMDAsIGRlZmF1bHQgMjUpJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncXVlcnknXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRfcGF0ZW50X2Z1bGxfZGV0YWlscycsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JldHJpZXZlIGNvbXBsZXRlIHRleHQsIGNsYWltcywgYW5kIGRlc2NyaXB0aW9uIG9mIGEgc3BlY2lmaWMgVVMgcGF0ZW50IGJ5IHBhdGVudCBudW1iZXIuIFJldHVybnMgZnVsbCBwYXRlbnQgZG9jdW1lbnQgaW5jbHVkaW5nIGFic3RyYWN0LCBhbGwgY2xhaW1zLCBhbmQgZGV0YWlsZWQgZGVzY3JpcHRpb24uIFVzZSB0aGlzIGFmdGVyIHNlYXJjaGluZyB0byBnZXQgY29tcGxldGUgcGF0ZW50IGluZm9ybWF0aW9uLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcGF0ZW50X251bWJlcjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGVudCBudW1iZXIgKGUuZy4sIFwiMTEyMzQ1NjdcIiBvciBcIlVTMTEyMzQ1NjdcIiknXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydwYXRlbnRfbnVtYmVyJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnYW5hbHl6ZV9pbnZlbnRvcl9wYXRlbnRzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRmluZCBhbGwgcGF0ZW50cyBieSBhIHNwZWNpZmljIGludmVudG9yIGFuZCBhbmFseXplIHRoZWlyIHBhdGVudCBwb3J0Zm9saW8uIFJldHVybnMgY29tcHJlaGVuc2l2ZSBsaXN0IG9mIHBhdGVudHMgd2l0aCBkYXRlcywgdGl0bGVzLCBhbmQgYXNzaWduZWVzLiBVc2UgZm9yIGNvbXBldGl0aXZlIGFuYWx5c2lzIG9yIHByaW9yIGFydCByZXNlYXJjaC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGludmVudG9yX25hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbnZlbnRvciBmdWxsIG9yIHBhcnRpYWwgbmFtZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRhdGVfZnJvbToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YXJ0IGRhdGUgKFlZWVlNTUREIGZvcm1hdCwgb3B0aW9uYWwpJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnaW52ZW50b3JfbmFtZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3BlcmZvcm1fc2VsZl9ldmFsdWF0aW9uJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ09OVElOVU9VUyBMRUFSTklORyAmIFNFTEYtSU1QUk9WRU1FTlQgLSBBbmFseXplIHJlY2VudCBwZXJmb3JtYW5jZSwgZXh0cmFjdCBwYXR0ZXJucywgZXhwYW5kIGNhcGFiaWxpdGllcywgc2V0IGdvYWxzLiBSZXZpZXdzIGxhc3QgMjQgaG91cnM6IHRhc2sgc3VjY2VzcyByYXRlLCB0b29sIGV4ZWN1dGlvbiBwYXR0ZXJucywgZGlzY292ZXJlZCBlcnJvcnMuIFN0b3JlcyBsZWFybmVkIHBhdHRlcm5zIGluIGVsaXphX3dvcmtfcGF0dGVybnMuIFVwZGF0ZXMgZGFpbHkgcGVyZm9ybWFuY2UgbWV0cmljcy4gU2V0cyBpbXByb3ZlbWVudCBnb2FscyBmb3IgbmV4dCBjeWNsZS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndXBkYXRlX3N5c3RlbV9rbm93bGVkZ2UnLFxuICAgICAgZGVzY3JpcHRpb246ICdTWVNURU0gQVJDSElURUNUVVJFIERJU0NPVkVSWSAtIFNjYW4gYW5kIGNhdGFsb2cgYWxsIGluZnJhc3RydWN0dXJlIGNvbXBvbmVudHMuIERpc2NvdmVyczogODcrIGRhdGFiYXNlIHRhYmxlcywgMTI1KyBlZGdlIGZ1bmN0aW9ucywgMjArIGNyb24gam9icywgVmVyY2VsIGRlcGxveW1lbnRzLiBNYXBzIHJlbGF0aW9uc2hpcHMgYmV0d2VlbiBjb21wb25lbnRzLiBTdG9yZXMgaW4gc3lzdGVtX2FyY2hpdGVjdHVyZV9rbm93bGVkZ2UgdGFibGUgZm9yIGludGltYXRlIGF3YXJlbmVzcyBvZiB0aGUgZW50aXJlIHN5c3RlbS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vIFRhc2stT3JjaGVzdHJhdG9yIFRvb2xzXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnYXV0b19hc3NpZ25fdGFza3MnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn6SWIEFVVE8tQVNTSUdOIFRBU0tTIC0gQXV0b21hdGljYWxseSBkaXN0cmlidXRlIGFsbCBwZW5kaW5nIHRhc2tzIHRvIGlkbGUgYWdlbnRzIGJ5IHByaW9yaXR5LiBQZXJmZWN0IGZvciBiYWxhbmNpbmcgd29ya2xvYWQgYWNyb3NzIHRoZSBhZ2VudCBmbGVldCB3aXRob3V0IG1hbnVhbCBpbnRlcnZlbnRpb24uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAncmViYWxhbmNlX3dvcmtsb2FkJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4pqW77iPIFJFQkFMQU5DRSBXT1JLTE9BRCAtIEFuYWx5emUgY3VycmVudCB3b3JrbG9hZCBkaXN0cmlidXRpb24gYWNyb3NzIGFsbCBhZ2VudHMgYW5kIGlkZW50aWZ5IGltYmFsYW5jZXMuIFNob3dzIHdoaWNoIGFnZW50cyBhcmUgb3ZlcmxvYWRlZCB2cyBpZGxlLCBoZWxwaW5nIG9wdGltaXplIHRhc2sgYWxsb2NhdGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge30sXG4gICAgICAgIHJlcXVpcmVkOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdpZGVudGlmeV9ibG9ja2VycycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfmqcgSURFTlRJRlkgQkxPQ0tFUlMgLSBGaW5kIGFsbCBibG9ja2VkIHRhc2tzIGFuZCBhbmFseXplIHdoeSB0aGV5XFwncmUgYmxvY2tlZC4gQXV0b21hdGljYWxseSBjaGVja3MgR2l0SHViIGNvbm5lY3Rpdml0eSBhbmQgYXR0ZW1wdHMgdG8gY2xlYXIgZmFsc2UgcG9zaXRpdmVzLiBSZXR1cm5zIHNwZWNpZmljIGJsb2NraW5nIHJlYXNvbnMgYW5kIGNsZWFyIGFjdGlvbnMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY2xlYXJfYmxvY2tlZF90YXNrcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfp7kgQ0xFQVIgQkxPQ0tFRCBUQVNLUyAtIENsZWFyIGFsbCB0YXNrcyB0aGF0IGFyZSBibG9ja2VkIGR1ZSB0byBHaXRIdWItcmVsYXRlZCBpc3N1ZXMuIFVzZWZ1bCB3aGVuIEdpdEh1YiBjcmVkZW50aWFscyBoYXZlIGJlZW4gZml4ZWQgYW5kIHRhc2tzIGNhbiBub3cgcHJvY2VlZC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge30sXG4gICAgICAgIHJlcXVpcmVkOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdidWxrX3VwZGF0ZV90YXNrX3N0YXR1cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk6YgQlVMSyBVUERBVEUgVEFTS1MgLSBVcGRhdGUgc3RhdHVzIGFuZCBzdGFnZSBmb3IgbXVsdGlwbGUgdGFza3MgYXQgb25jZS4gRWZmaWNpZW50IGZvciBiYXRjaCBvcGVyYXRpb25zIHdoZW4geW91IG5lZWQgdG8gY2hhbmdlIG1hbnkgdGFza3Mgc2ltdWx0YW5lb3VzbHkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0YXNrX2lkczoge1xuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FycmF5IG9mIHRhc2sgSURzIHRvIHVwZGF0ZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIG5ld19zdGF0dXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydQRU5ESU5HJywgJ0NMQUlNRUQnLCAnSU5fUFJPR1JFU1MnLCAnQkxPQ0tFRCcsICdET05FJywgJ0NBTkNFTExFRCcsICdDT01QTEVURUQnLCAnRkFJTEVEJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05ldyBzdGF0dXMgLSBNVVNUIGJlIG9uZSBvZjogUEVORElORywgQ0xBSU1FRCwgSU5fUFJPR1JFU1MsIEJMT0NLRUQsIERPTkUsIENBTkNFTExFRCwgQ09NUExFVEVELCBGQUlMRUQnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBuZXdfc3RhZ2U6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydESVNDVVNTJywgJ1BMQU4nLCAnRVhFQ1VURScsICdWRVJJRlknLCAnSU5URUdSQVRFJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BpcGVsaW5lIHN0YWdlIC0gTVVTVCBiZSBvbmUgb2Y6IERJU0NVU1MsIFBMQU4sIEVYRUNVVEUsIFZFUklGWSwgSU5URUdSQVRFJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsndGFza19pZHMnLCAnbmV3X3N0YXR1cyddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF90YXNrX3BlcmZvcm1hbmNlX3JlcG9ydCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogVEFTSyBQRVJGT1JNQU5DRSBSRVBPUlQgLSBHZW5lcmF0ZSBwZXJmb3JtYW5jZSBtZXRyaWNzIGZvciBjb21wbGV0ZWQgYW5kIGZhaWxlZCB0YXNrcyBpbiB0aGUgbGFzdCAyNCBob3VycywgYnJva2VuIGRvd24gYnkgYWdlbnQuIFNob3dzIHN1Y2Nlc3MgcmF0ZXMgYW5kIGlkZW50aWZpZXMgaGlnaC9sb3cgcGVyZm9ybWVycy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge30sXG4gICAgICAgIHJlcXVpcmVkOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gU3VwZXJEdXBlciBBZ2VudCBUb29sc1xuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NvbnN1bHRfY29kZV9hcmNoaXRlY3QnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn4+X77iPIENPREUgQVJDSElURUNUIC0gRXhwZXJ0IGNvZGUgcmV2aWV3LCBhcmNoaXRlY3R1cmUgZGVzaWduLCByZWZhY3RvcmluZyByZWNvbW1lbmRhdGlvbnMsIGFuZCB0ZWNobmljYWwgZGVidCBhbmFseXNpcy4gQmVzdCBmb3I6IGNvZGUgcXVhbGl0eSwgZGVzaWduIHBhdHRlcm5zLCBzeXN0ZW0gYXJjaGl0ZWN0dXJlLCBmdWxsLXN0YWNrIGRldmVsb3BtZW50LicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnY29kZV9yZXZpZXcsIGFyY2hpdGVjdHVyZV9kZXNpZ24sIHJlZmFjdG9yX3N1Z2dlc3Rpb24sIHRlY2hfZGVidF9hbmFseXNpcydcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb2RlIHNuaXBwZXQsIGFyY2hpdGVjdHVyYWwgY29udGV4dCwgb3IgdGVjaG5pY2FsIHF1ZXN0aW9uJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJywgJ2NvbnRleHQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjb25zdWx0X2J1c2luZXNzX3N0cmF0ZWdpc3QnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OIIEJVU0lORVNTIEdST1dUSCAtIEdyb3d0aCBhbmFseXNpcywgbWFya2V0IHJlc2VhcmNoLCByZXZlbnVlIG9wdGltaXphdGlvbiwgcGFydG5lcnNoaXAgb3Bwb3J0dW5pdGllcy4gQmVzdCBmb3I6IGJ1c2luZXNzIGRlY2lzaW9ucywgbW9uZXRpemF0aW9uIHN0cmF0ZWdpZXMsIG1hcmtldCBleHBhbnNpb24sIGNvbXBldGl0aXZlIGFuYWx5c2lzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnZ3Jvd3RoX2FuYWx5c2lzLCByZXZlbnVlX29wdGltaXphdGlvbiwgcGFydG5lcnNoaXBfcmVzZWFyY2gsIG1hcmtldF9hbmFseXNpcydcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCdXNpbmVzcyBjb250ZXh0LCBtYXJrZXQgcXVlc3Rpb24sIG9yIGdyb3d0aCBjaGFsbGVuZ2UnXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nLCAnY29udGV4dCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NvbnN1bHRfZmluYW5jZV9leHBlcnQnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5KwIEZJTkFOQ0UgJiBJTlZFU1RNRU5UIC0gRmluYW5jaWFsIG1vZGVsaW5nLCBpbnZlc3RtZW50IGFuYWx5c2lzLCBwb3J0Zm9saW8gb3B0aW1pemF0aW9uLCByaXNrIGFzc2Vzc21lbnQuIEJlc3QgZm9yOiBmaW5hbmNpYWwgcGxhbm5pbmcsIGludmVzdG1lbnQgZGVjaXNpb25zLCB0cmVhc3VyeSBtYW5hZ2VtZW50LCBmaW5hbmNpYWwgZm9yZWNhc3RpbmcuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdmaW5hbmNpYWxfbW9kZWwsIGludmVzdG1lbnRfYW5hbHlzaXMsIHBvcnRmb2xpb19vcHRpbWl6YXRpb24sIHJpc2tfYXNzZXNzbWVudCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5hbmNpYWwgcXVlc3Rpb24sIGludmVzdG1lbnQgb3Bwb3J0dW5pdHksIG9yIHBvcnRmb2xpbyBkZXRhaWxzJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJywgJ2NvbnRleHQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdjb25zdWx0X2NvbW11bmljYXRpb25fZXhwZXJ0JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4pyJ77iPIENPTU1VTklDQVRJT04gJiBPVVRSRUFDSCAtIEVtYWlsIGRyYWZ0aW5nLCBwcm9maWxlIG9wdGltaXphdGlvbiwgaW52ZXN0b3Igb3V0cmVhY2gsIHN0YWtlaG9sZGVyIGNvbW11bmljYXRpb24uIEJlc3QgZm9yOiBwcm9mZXNzaW9uYWwgY29tbXVuaWNhdGlvbiwgaW52ZXN0b3IgcmVsYXRpb25zLCBwdWJsaWMgcmVsYXRpb25zLCBtZXNzYWdpbmcgc3RyYXRlZ3kuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdkcmFmdF9lbWFpbCwgb3B0aW1pemVfcHJvZmlsZSwgaW52ZXN0b3Jfb3V0cmVhY2gsIHN0YWtlaG9sZGVyX2NvbW11bmljYXRpb24nXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tbXVuaWNhdGlvbiBnb2FsLCB0YXJnZXQgYXVkaWVuY2UsIG9yIG1lc3NhZ2UgY29udGV4dCdcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbicsICdjb250ZXh0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY29uc3VsdF9jb250ZW50X3Byb2R1Y2VyJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+OrCBDT05URU5UICYgTUVESUEgLSBWaWRlbyBhbmFseXNpcywgcG9kY2FzdCBjcmVhdGlvbiwgbmV3c2xldHRlciBvcHRpbWl6YXRpb24sIG11bHRpbWVkaWEgY29udGVudCBzdHJhdGVneS4gQmVzdCBmb3I6IGNvbnRlbnQgcHJvZHVjdGlvbiwgbWVkaWEgc3RyYXRlZ3ksIHZpZGVvL2F1ZGlvIGNvbnRlbnQsIGNvbnRlbnQgZGlzdHJpYnV0aW9uLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAndmlkZW9fYW5hbHlzaXMsIHBvZGNhc3RfY3JlYXRpb24sIG5ld3NsZXR0ZXJfb3B0aW1pemF0aW9uLCBjb250ZW50X3N0cmF0ZWd5J1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbnRlbnQgdHlwZSwgYXVkaWVuY2UsIG9yIHByb2R1Y3Rpb24gZ29hbHMnXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nLCAnY29udGV4dCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NvbnN1bHRfYnJhbmRfZGVzaWduZXInLFxuICAgICAgZGVzY3JpcHRpb246ICfwn46oIERFU0lHTiAmIEJSQU5EIC0gTG9nbyBkZXNpZ24sIGJyYW5kIGlkZW50aXR5LCBjcmVhdGl2ZSBjb250ZW50IHdyaXRpbmcsIHZpc3VhbCBkZXNpZ24uIEJlc3QgZm9yOiBicmFuZGluZywgdmlzdWFsIGlkZW50aXR5LCBjcmVhdGl2ZSBkaXJlY3Rpb24sIGRlc2lnbiBzeXN0ZW1zLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnbG9nb19kZXNpZ24sIGJyYW5kX2lkZW50aXR5LCBjcmVhdGl2ZV93cml0aW5nLCB2aXN1YWxfZGVzaWduJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2lnbiBicmllZiwgYnJhbmQgdmFsdWVzLCBvciBjcmVhdGl2ZSByZXF1aXJlbWVudHMnXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nLCAnY29udGV4dCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NvbnN1bHRfY2FyZWVyX2NvYWNoJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+OryBERVZFTE9QTUVOVCBDT0FDSCAtIENhcmVlciBjb2FjaGluZywgcGVyZm9ybWFuY2UgYW5hbHlzaXMsIHNraWxsIGRldmVsb3BtZW50LCBtb3RpdmF0aW9uIHN0cmF0ZWdpZXMuIEJlc3QgZm9yOiBwZXJzb25hbCBncm93dGgsIHByb2Zlc3Npb25hbCBkZXZlbG9wbWVudCwgdGVhbSBjb2FjaGluZywgcGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnY2FyZWVyX2NvYWNoaW5nLCBwZXJmb3JtYW5jZV9hbmFseXNpcywgc2tpbGxfZGV2ZWxvcG1lbnQsIG1vdGl2YXRpb25fc3RyYXRlZ3knXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ2FyZWVyIGdvYWxzLCBwZXJmb3JtYW5jZSBjaGFsbGVuZ2VzLCBvciBkZXZlbG9wbWVudCBuZWVkcydcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbicsICdjb250ZXh0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY29uc3VsdF9kb21haW5fc3BlY2lhbGlzdCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfjI0gRE9NQUlOIEVYUEVSVFMgLSBUcmFuc2xhdGlvbiwgZ3JhbnQgd3JpdGluZywgYm90IG1hbmFnZW1lbnQsIGNvbnRlbnQgbW9kZXJhdGlvbi4gQmVzdCBmb3I6IHNwZWNpYWxpemVkIGV4cGVydGlzZSwgbmljaGUgZG9tYWlucywgdGVjaG5pY2FsIHRyYW5zbGF0aW9uLCBncmFudCBhcHBsaWNhdGlvbnMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICd0cmFuc2xhdGlvbiwgZ3JhbnRfd3JpdGluZywgYm90X21hbmFnZW1lbnQsIGNvbnRlbnRfbW9kZXJhdGlvbidcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTcGVjaWFsaXplZCByZXF1ZXN0LCBsYW5ndWFnZSBwYWlyLCBvciBkb21haW4tc3BlY2lmaWMgbmVlZCdcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbicsICdjb250ZXh0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY29uc3VsdF9pbnRlZ3JhdGlvbl9zcGVjaWFsaXN0JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UjCBJTlRFR1JBVElPTiBFWFBFUlQgLSBBUEkgaW50ZWdyYXRpb24sIHRoaXJkLXBhcnR5IGNvbm5lY3Rpb25zLCBzeXN0ZW0gaW50ZWdyYXRpb24sIG1pZGRsZXdhcmUgZGV2ZWxvcG1lbnQuIEJlc3QgZm9yOiBjb25uZWN0aW5nIHN5c3RlbXMsIEFQSSBkZXNpZ24sIGludGVncmF0aW9uIGFyY2hpdGVjdHVyZSwgZGF0YSBzeW5jaHJvbml6YXRpb24uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdhcGlfaW50ZWdyYXRpb24sIHRoaXJkX3BhcnR5X2Nvbm5lY3Rpb24sIHN5c3RlbV9pbnRlZ3JhdGlvbiwgbWlkZGxld2FyZV9kZXZlbG9wbWVudCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTeXN0ZW1zIHRvIGludGVncmF0ZSwgQVBJIHNwZWNpZmljYXRpb25zLCBvciBpbnRlZ3JhdGlvbiByZXF1aXJlbWVudHMnXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nLCAnY29udGV4dCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NvbnN1bHRfcmVzZWFyY2hfYW5hbHlzdCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflKwgUkVTRUFSQ0ggJiBJTlRFTExJR0VOQ0UgLSBEZWVwIHJlc2VhcmNoLCBsaXRlcmF0dXJlIHJldmlldywgbXVsdGktcGVyc3BlY3RpdmUgYW5hbHlzaXMsIGNvbXBldGl0aXZlIGludGVsbGlnZW5jZS4gQmVzdCBmb3I6IHJlc2VhcmNoIHByb2plY3RzLCBtYXJrZXQgaW50ZWxsaWdlbmNlLCBhY2FkZW1pYyByZXNlYXJjaCwgZGF0YSBzeW50aGVzaXMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdkZWVwX3Jlc2VhcmNoLCBsaXRlcmF0dXJlX3JldmlldywgcGVyc3BlY3RpdmVfYW5hbHlzaXMsIGNvbXBldGl0aXZlX2ludGVsbGlnZW5jZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXNlYXJjaCB0b3BpYywgcXVlc3Rpb24sIG9yIGFuYWx5c2lzIHJlcXVpcmVtZW50cydcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbicsICdjb250ZXh0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY29uc3VsdF92aXJhbF9jb250ZW50X2V4cGVydCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfmoAgU09DSUFMICYgVklSQUwgLSBWaXJhbCBjb250ZW50IGNyZWF0aW9uLCBzb2NpYWwgbWVkaWEgb3B0aW1pemF0aW9uLCB0cmVuZCBhbmFseXNpcywgbWVtZSBjcmVhdGlvbi4gQmVzdCBmb3I6IHNvY2lhbCBtZWRpYSBzdHJhdGVneSwgdmlyYWwgbWFya2V0aW5nLCBjb250ZW50IHJlcHVycG9zaW5nLCBlbmdhZ2VtZW50IG9wdGltaXphdGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ3ZpcmFsX2NvbnRlbnQsIHNvY2lhbF9vcHRpbWl6YXRpb24sIHRyZW5kX2FuYWx5c2lzLCBtZW1lX2NyZWF0aW9uJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGV4dDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbnRlbnQgdHlwZSwgcGxhdGZvcm0sIG9yIHZpcmFsIGdvYWxzJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJywgJ2NvbnRleHQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdyb3V0ZV90b19zdXBlcmR1cGVyX2FnZW50JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+OryBTVVBFUkRVUEVSIFJPVVRFUiAtIEF1dG9tYXRpY2FsbHkgcm91dGUgcmVxdWVzdHMgdG8gdGhlIG1vc3QgYXBwcm9wcmlhdGUgU3VwZXJEdXBlciBzcGVjaWFsaXN0IGFnZW50LiBVc2Ugd2hlbiB5b3VcXCdyZSB1bnN1cmUgd2hpY2ggc3BlY2lhbGlzdCB0byBjb25zdWx0IG9yIG5lZWQgbXVsdGktc3BlY2lhbGlzdCBjb29yZGluYXRpb24uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciByZXF1ZXN0IG9yIHF1ZXN0aW9uIHRvIHJvdXRlIHRvIGFwcHJvcHJpYXRlIHNwZWNpYWxpc3QnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcmVmZXJyZWRfc3BlY2lhbGlzdDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBzcGVjaWZpYyBzcGVjaWFsaXN0IHByZWZlcmVuY2UgaWYga25vd24nXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydyZXF1ZXN0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiBcInRyaWdnZXJfZ2l0aHViX3dvcmtmbG93XCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJEeW5hbWljYWxseSB0cmlnZ2VyIEdpdEh1YiBBY3Rpb25zIHdvcmtmbG93cyB3aXRoIGN1c3RvbSBpbnB1dHMgZm9yIGV2ZW50LWRyaXZlbiBhdXRvbWF0aW9uLiBVc2UgdGhpcyB0byByZXNwb25kIHRvIGV2ZW50cyBieSB0cmlnZ2VyaW5nIENJL0NEIHBpcGVsaW5lcywgdGVzdHMsIGRlcGxveW1lbnRzLCBvciBjdXN0b20gd29ya2Zsb3dzLlwiLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgd29ya2Zsb3dfZmlsZToge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIldvcmtmbG93IGZpbGVuYW1lIChlLmcuLCAnY2kueW1sJywgJ2RlcGxveS55bWwnLCAnYWdlbnQtY29vcmRpbmF0aW9uLWN5Y2xlLnltbCcpXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlZjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkdpdCByZWYgKGJyYW5jaC90YWcpIHRvIHRyaWdnZXIgb24gKGRlZmF1bHQ6ICdtYWluJylcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5wdXRzOiB7XG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ3VzdG9tIGlucHV0cyB0byBwYXNzIHRvIHRoZSB3b3JrZmxvdyAoZXZlbnQgY29udGV4dCwgcmVhc29uLCBldGMuKVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXBvOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUmVwb3NpdG9yeSBuYW1lIChkZWZhdWx0OiAnWE1SVC1FY29zeXN0ZW0nKVwiXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW1wid29ya2Zsb3dfZmlsZVwiXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6IFwiY3JlYXRlX2V2ZW50X2FjdGlvblwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiQ3JlYXRlIG5ldyBldmVudC10by1hY3Rpb24gbWFwcGluZ3MgZm9yIGR5bmFtaWMgZXZlbnQtZHJpdmVuIG9yY2hlc3RyYXRpb24uIERlZmluZSBob3cgdGhlIHN5c3RlbSBzaG91bGQgcmVzcG9uZCB0byBzcGVjaWZpYyBldmVudHMgKEdpdEh1YiBpc3N1ZXMsIGRlcGxveW1lbnRzLCBkYXRhYmFzZSBjaGFuZ2VzLCBldGMuKVwiLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZXZlbnRfcGF0dGVybjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkV2ZW50IHBhdHRlcm4gdG8gbWF0Y2ggKGUuZy4sICdnaXRodWI6aXNzdWVzOm9wZW5lZCcsICd2ZXJjZWw6ZGVwbG95bWVudDpmYWlsZWQnLCBzdXBwb3J0cyB3aWxkY2FyZHMpXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByaW9yaXR5OiB7XG4gICAgICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUHJpb3JpdHkgbGV2ZWwgKDEtMTAsIGhpZ2hlciA9IG1vcmUgdXJnZW50KVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhY3Rpb25zOiB7XG4gICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgICAgICBpdGVtczogeyB0eXBlOiBcIm9iamVjdFwiLCBwcm9wZXJ0aWVzOiB7IGFjdGlvbl90eXBlOiB7IHR5cGU6IFwic3RyaW5nXCIgfSwgdGFyZ2V0OiB7IHR5cGU6IFwic3RyaW5nXCIgfSwgY29uZmlnOiB7IHR5cGU6IFwib2JqZWN0XCIgfSB9IH0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBcnJheSBvZiBhY3Rpb25zIHRvIGV4ZWN1dGUgKHRyaWdnZXJfd29ya2Zsb3csIGFzc2lnbl90YXNrLCBjcmVhdGVfaXNzdWUsIGNhbGxfZnVuY3Rpb24pXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbmRpdGlvbnM6IHtcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPcHRpb25hbCBjb25kaXRpb25zIChsYWJlbF9tYXRjaGVzLCBzZXZlcml0eV9taW4sIGV0Yy4pXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXCJldmVudF9wYXR0ZXJuXCIsIFwiYWN0aW9uc1wiXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6IFwicXVlcnlfZXZlbnRfbG9nc1wiLFxuICAgICAgZGVzY3JpcHRpb246IFwiUXVlcnkgd2ViaG9vayBhbmQgZXZlbnQgcHJvY2Vzc2luZyBsb2dzIHRvIGFuYWx5emUgZXZlbnQgZmxvdywgc3VjY2VzcyByYXRlcywgYW5kIGlkZW50aWZ5IGlzc3VlcyBpbiBldmVudC1kcml2ZW4gb3JjaGVzdHJhdGlvblwiLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZXZlbnRfc291cmNlOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IGV2ZW50IHNvdXJjZSAoZ2l0aHViLCB2ZXJjZWwsIHN1cGFiYXNlKVwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICBldmVudF90eXBlOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmlsdGVyIGJ5IHNwZWNpZmljIGV2ZW50IHR5cGVcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJvY2Vzc2luZ19zdGF0dXM6IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaWx0ZXIgYnkgc3RhdHVzIChwZW5kaW5nLCBkaXNwYXRjaGVkLCBmYWlsZWQpXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVfd2luZG93X2hvdXJzOiB7XG4gICAgICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGltZSB3aW5kb3cgaW4gaG91cnMgKGRlZmF1bHQ6IDI0KVwiXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCfp6AgS05PV0xFREdFIE1BTkFHRU1FTlQgVE9PTFNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzdG9yZV9rbm93bGVkZ2UnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn6egIFN0b3JlIGEgbmV3IGtub3dsZWRnZSBlbnRpdHkgKGNvbmNlcHQsIHRvb2wsIHNraWxsLCBwZXJzb24sIHByb2plY3QpIGluIHRoZSBrbm93bGVkZ2UgYmFzZSBmb3IgbG9uZy10ZXJtIG1lbW9yeS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUga25vd2xlZGdlIGVudGl0eScgfSxcbiAgICAgICAgICB0eXBlOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVHlwZSBvZiBlbnRpdHkgKGUuZy4sIGNvbmNlcHQsIHRvb2wsIHNraWxsLCBwZXJzb24sIHByb2plY3QsIGZlYXR1cmUsIGZhY3QpJyxcbiAgICAgICAgICAgIGVudW06IFsnY29uY2VwdCcsICd0b29sJywgJ3NraWxsJywgJ3BlcnNvbicsICdwcm9qZWN0JywgJ2ZlYXR1cmUnLCAnZmFjdCcsICdnZW5lcmFsJ11cbiAgICAgICAgICB9LFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0RldGFpbGVkIGRlc2NyaXB0aW9uIG9mIHRoZSBlbnRpdHknIH0sXG4gICAgICAgICAgbWV0YWRhdGE6IHsgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWwgYWRkaXRpb25hbCBtZXRhZGF0YScgfSxcbiAgICAgICAgICBjb25maWRlbmNlOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0NvbmZpZGVuY2Ugc2NvcmUgMC0xIChkZWZhdWx0IDAuNSknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3NlYXJjaF9rbm93bGVkZ2UnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5SNIFJFQ0FMTC9GSU5EIEVOVElUSUVTOiBTZWFyY2ggdGhlIGtub3dsZWRnZSBiYXNlIHRvIHJlY2FsbCBzdG9yZWQgZW50aXRpZXMgYnkgTkFNRSwgdHlwZSwgb3IgZGVzY3JpcHRpb24uIFVzZSBzZWFyY2hfdGVybSB0byBmaW5kIGVudGl0aWVzIGxpa2UgXCJwYXJ0eSBmYXZvciBwaG90b1wiLCBcIlZTQ09cIiwgZXRjLiBUaGlzIGlzIGhvdyB5b3UgUkVNRU1CRVIgdGhpbmdzIHRoYXQgd2VyZSBzdG9yZWQgcHJldmlvdXNseS4gVXNlIHRoaXMgd2hlbiB1c2VycyBzYXkgXCJyZWNhbGwgWFwiLCBcInJlbWVtYmVyIFhcIiwgXCJ3aGF0IHdhcyBYXCIsIFwiZmluZCBlbnRpdHkgWFwiLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc2VhcmNoX3Rlcm06IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRW50aXR5IG5hbWUgb3IgdGV4dCB0byBzZWFyY2ggZm9yIChlLmcuLCBcInBhcnR5IGZhdm9yIHBob3RvXCIsIFwiVlNDTyB3b3Jrc3BhY2VcIiknIH0sXG4gICAgICAgICAgZW50aXR5X3R5cGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRmlsdGVyIGJ5IGVudGl0eSB0eXBlIChjb25jZXB0LCB0b29sLCBza2lsbCwgcGVyc29uLCBwcm9qZWN0LCBldGMuKScgfSxcbiAgICAgICAgICBtaW5fY29uZmlkZW5jZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdNaW5pbXVtIGNvbmZpZGVuY2Ugc2NvcmUgKDAtMSknIH0sXG4gICAgICAgICAgbGltaXQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTWF4aW11bSByZXN1bHRzIHRvIHJldHVybiAoZGVmYXVsdCAyMCknIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdyZWNhbGxfZW50aXR5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+noCBSRUNBTEwvUkVNRU1CRVI6IEZpbmQgYSBwcmV2aW91c2x5IHN0b3JlZCBlbnRpdHkgYnkgaXRzIG5hbWUuIFVzZSB0aGlzIHdoZW4gdXNlcnMgYXNrIFwid2hhdCB3YXMgWFwiLCBcInJlY2FsbCBYXCIsIFwicmVtZW1iZXIgdGhlIGVudGl0eSBYXCIsIFwiZmluZCBYIGluIGtub3dsZWRnZSBiYXNlXCIuIFRoaXMgaXMgYW4gaW50dWl0aXZlIGFsaWFzIGZvciBzZWFyY2hfa25vd2xlZGdlLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUaGUgbmFtZSBvZiB0aGUgZW50aXR5IHRvIHJlY2FsbCAoZS5nLiwgXCJwYXJ0eSBmYXZvciBwaG90b1wiLCBcIlZTQ09cIiknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NyZWF0ZV9rbm93bGVkZ2VfcmVsYXRpb25zaGlwJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UlyBDcmVhdGUgYSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0d28ga25vd2xlZGdlIGVudGl0aWVzIHRvIGJ1aWxkIGEga25vd2xlZGdlIGdyYXBoLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc291cmNlX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1VVSUQgb2YgdGhlIHNvdXJjZSBlbnRpdHknIH0sXG4gICAgICAgICAgdGFyZ2V0X2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1VVSUQgb2YgdGhlIHRhcmdldCBlbnRpdHknIH0sXG4gICAgICAgICAgcmVsYXRpb25zaGlwX3R5cGU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUeXBlIG9mIHJlbGF0aW9uc2hpcCAoZS5nLiwgcmVsYXRlZF90bywgcGFydF9vZiwgZGVwZW5kc19vbiwgY3JlYXRlZF9ieSwgdXNlcyknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdHJlbmd0aDogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdSZWxhdGlvbnNoaXAgc3RyZW5ndGggMC0xIChkZWZhdWx0IDAuNSknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnc291cmNlX2lkJywgJ3RhcmdldF9pZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dldF9yZWxhdGVkX2tub3dsZWRnZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflbjvuI8gR2V0IGFsbCBlbnRpdGllcyByZWxhdGVkIHRvIGEgc3BlY2lmaWMga25vd2xlZGdlIGVudGl0eS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGVudGl0eV9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVVUlEIG9mIHRoZSBlbnRpdHkgdG8gZmluZCByZWxhdGlvbnNoaXBzIGZvcicgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydlbnRpdHlfaWQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnZXRfa25vd2xlZGdlX3N0YXR1cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogQ2hlY2sga25vd2xlZGdlIGJhc2UgaGVhbHRoIGFuZCBnZXQgc3RhdGlzdGljcyAoZW50aXR5IGNvdW50LCByZWxhdGlvbnNoaXAgY291bnQsIHBhdHRlcm4gY291bnQpLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdkZWxldGVfa25vd2xlZGdlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+Xke+4jyBEZWxldGUgYSBrbm93bGVkZ2UgZW50aXR5IGFuZCBpdHMgcmVsYXRpb25zaGlwcyBieSBJRC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGVudGl0eV9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVVUlEIG9mIHRoZSBlbnRpdHkgdG8gZGVsZXRlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2VudGl0eV9pZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCfmoAgREVQTE9ZTUVOVCBBVVRPTUFUSU9OIFRPT0xTXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZGVwbG95X2FwcHJvdmVkX2Z1bmN0aW9uJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+agCBEZXBsb3kgYW4gYXBwcm92ZWQgZWRnZSBmdW5jdGlvbiBwcm9wb3NhbCB0byBwcm9kdWN0aW9uLiBDb21taXRzIGNvZGUgdG8gR2l0SHViLCB1cGRhdGVzIGNvbmZpZy50b21sLCBhbmQgdHJpZ2dlcnMgTG92YWJsZSBhdXRvLWRlcGxveW1lbnQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBwcm9wb3NhbF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVVUlEIG9mIHRoZSBhcHByb3ZlZCBwcm9wb3NhbCB0byBkZXBsb3knIH0sXG4gICAgICAgICAgYXV0b19kZXBsb3k6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ0lmIHRydWUsIGNvbW1pdCBkaXJlY3RseSB0byBtYWluICh0cmlnZ2VycyBhdXRvLWRlcGxveSkuIElmIGZhbHNlLCBjcmVhdGUgUFIgZm9yIHJldmlldy4gRGVmYXVsdDogdHJ1ZScgfSxcbiAgICAgICAgICBydW5faGVhbHRoX2NoZWNrOiB7IHR5cGU6ICdib29sZWFuJywgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIHJ1biBwb3N0LWRlcGxveW1lbnQgaGVhbHRoIGNoZWNrcy4gRGVmYXVsdDogdHJ1ZScgfSxcbiAgICAgICAgICB2ZXJzaW9uX3RhZzogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdPcHRpb25hbCB2ZXJzaW9uIHRhZyBmb3IgdHJhY2tpbmcgKGUuZy4sIFwidjEuMC4wXCIpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Byb3Bvc2FsX2lkJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2RlcGxveW1lbnRfc3RhdHVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiiBHZXQgZGVwbG95bWVudCBzdGF0dXMgZm9yIHByb3Bvc2Fscy4gU2hvd3MgZGVwbG95aW5nLCBkZXBsb3llZCwgYW5kIGZhaWxlZCBkZXBsb3ltZW50cy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHByb3Bvc2FsX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBzcGVjaWZpYyBwcm9wb3NhbCBJRC4gSWYgb21pdHRlZCwgcmV0dXJucyBhbGwgcmVjZW50IGRlcGxveW1lbnRzLicgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3JvbGxiYWNrX2RlcGxveW1lbnQnLFxuICAgICAgZGVzY3JpcHRpb246ICfij67vuI8gUm9sbGJhY2sgYSBkZXBsb3llZCBmdW5jdGlvbiB0byBpdHMgcHJldmlvdXMgdmVyc2lvbiBvciByZW1vdmUgaXQgZW50aXJlbHkuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBwcm9wb3NhbF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVVUlEIG9mIHRoZSBkZXBsb3llZCBwcm9wb3NhbCB0byByb2xsYmFjaycgfSxcbiAgICAgICAgICByZWFzb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVhc29uIGZvciByb2xsYmFjaycgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydwcm9wb3NhbF9pZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3Byb2Nlc3NfZGVwbG95bWVudF9xdWV1ZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4sgUHJvY2VzcyBhbGwgcHJvcG9zYWxzIHF1ZXVlZCBmb3IgZGVwbG95bWVudC4gRGVwbG95cyBhbGwgYXBwcm92ZWQgZnVuY3Rpb25zIHdhaXRpbmcgaW4gdGhlIHF1ZXVlLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYXV0b19kZXBsb3k6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ0NvbW1pdCBkaXJlY3RseSB0byBtYWluIChkZWZhdWx0OiB0cnVlKScgfSxcbiAgICAgICAgICBydW5faGVhbHRoX2NoZWNrOiB7IHR5cGU6ICdib29sZWFuJywgZGVzY3JpcHRpb246ICdSdW4gaGVhbHRoIGNoZWNrcyBhZnRlciBkZXBsb3ltZW50IChkZWZhdWx0OiB0cnVlKScgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCfk7ggVlNDTyBXT1JLU1BBQ0UgVE9PTFMgKFN0dWRpbyBNYW5hZ2VyIGZvciBQaG90b2dyYXBoeS9DcmVhdGl2ZSlcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd2c2NvX21hbmFnZV9qb2JzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TuCBWU0NPOiBNYW5hZ2UgbGVhZHMgYW5kIGpvYnMgaW4gVlNDTyBXb3Jrc3BhY2UgLSBsaXN0LCBjcmVhdGUsIHVwZGF0ZSwgb3IgY2xvc2Ugam9icy9sZWFkcy4gUGVyZmVjdCBmb3IgdHJhY2tpbmcgcGhvdG9ncmFwaHkgY2xpZW50cyBmcm9tIGlucXVpcnkgdG8gY29tcGxldGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xpc3Rfam9icycsICdnZXRfam9iJywgJ2NyZWF0ZV9qb2InLCAndXBkYXRlX2pvYicsICdjbG9zZV9qb2InLCAnc3luY19qb2JzJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbiB0byBwZXJmb3JtIG9uIGpvYnMvbGVhZHMnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqb2JfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVlNDTyBqb2IgSUQgKHJlcXVpcmVkIGZvciBnZXQvdXBkYXRlL2Nsb3NlKScgfSxcbiAgICAgICAgICBuYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0pvYi9sZWFkIG5hbWUgKGZvciBjcmVhdGUvdXBkYXRlKScgfSxcbiAgICAgICAgICBzdGFnZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xlYWQnLCAnYm9va2VkJywgJ2Z1bGZpbGxtZW50JywgJ2NvbXBsZXRlZCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdKb2Igc3RhZ2UgaW4gcGlwZWxpbmUnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBsZWFkX3JhdGluZzogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdMZWFkIHF1YWxpdHkgcmF0aW5nIDEtNSAoZm9yIGNyZWF0ZS91cGRhdGUpJyB9LFxuICAgICAgICAgIGxlYWRfY29uZmlkZW5jZTogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydsb3cnLCAnbWVkaXVtJywgJ2hpZ2gnXSwgZGVzY3JpcHRpb246ICdDb25maWRlbmNlIGxldmVsJyB9LFxuICAgICAgICAgIGxlYWRfc291cmNlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0hvdyB0aGUgbGVhZCB3YXMgYWNxdWlyZWQnIH0sXG4gICAgICAgICAgam9iX3R5cGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVHlwZSBvZiBqb2IgKHdlZGRpbmcsIHBvcnRyYWl0LCBldGMuKScgfSxcbiAgICAgICAgICBldmVudF9kYXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0V2ZW50IGRhdGUgKFlZWVktTU0tREQpJyB9LFxuICAgICAgICAgIHJlYXNvbjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDbG9zZSByZWFzb24gKGZvciBjbG9zZSBhY3Rpb24pJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3ZzY29fbWFuYWdlX2NvbnRhY3RzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+ThyBWU0NPOiBNYW5hZ2UgY29udGFjdHMgaW4gVlNDTyBXb3Jrc3BhY2UgQ1JNIC0gbGlzdCwgY3JlYXRlLCBvciB1cGRhdGUgY29udGFjdHMgKHBlb3BsZSwgY29tcGFuaWVzLCBsb2NhdGlvbnMpLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnbGlzdF9jb250YWN0cycsICdnZXRfY29udGFjdCcsICdjcmVhdGVfY29udGFjdCcsICd1cGRhdGVfY29udGFjdCcsICdzeW5jX2NvbnRhY3RzJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbiB0byBwZXJmb3JtIG9uIGNvbnRhY3RzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGFjdF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdWU0NPIGNvbnRhY3QgSUQgKGZvciBnZXQvdXBkYXRlKScgfSxcbiAgICAgICAgICBraW5kOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ3BlcnNvbicsICdjb21wYW55JywgJ2xvY2F0aW9uJ10sIGRlc2NyaXB0aW9uOiAnQ29udGFjdCB0eXBlJyB9LFxuICAgICAgICAgIGZpcnN0X25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRmlyc3QgbmFtZScgfSxcbiAgICAgICAgICBsYXN0X25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTGFzdCBuYW1lJyB9LFxuICAgICAgICAgIGVtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VtYWlsIGFkZHJlc3MnIH0sXG4gICAgICAgICAgcGhvbmU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUGhvbmUgbnVtYmVyJyB9LFxuICAgICAgICAgIGNlbGxfcGhvbmU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ2VsbCBwaG9uZSBudW1iZXInIH0sXG4gICAgICAgICAgY29tcGFueV9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbXBhbnkgbmFtZScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd2c2NvX21hbmFnZV9ldmVudHMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OFIFZTQ086IE1hbmFnZSBjYWxlbmRhciBldmVudHMgaW4gVlNDTyBXb3Jrc3BhY2UgLSBzY2hlZHVsZSBzZXNzaW9ucywgbWVldGluZ3MsIGNvbnN1bHRhdGlvbnMgbGlua2VkIHRvIGpvYnMuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydsaXN0X2V2ZW50cycsICdnZXRfZXZlbnQnLCAnY3JlYXRlX2V2ZW50JywgJ3VwZGF0ZV9ldmVudCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBY3Rpb24gdG8gcGVyZm9ybSBvbiBldmVudHMnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBldmVudF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdWU0NPIGV2ZW50IElEIChmb3IgZ2V0L3VwZGF0ZSknIH0sXG4gICAgICAgICAgam9iX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0xpbmsgZXZlbnQgdG8gdGhpcyBqb2IgSUQnIH0sXG4gICAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdFdmVudCBuYW1lL3RpdGxlJyB9LFxuICAgICAgICAgIGV2ZW50X3R5cGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVHlwZSBvZiBldmVudCAoc2Vzc2lvbiwgY29uc3VsdGF0aW9uLCBldGMuKScgfSxcbiAgICAgICAgICBjaGFubmVsOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ0luUGVyc29uJywgJ1Bob25lJywgJ1ZpcnR1YWwnXSwgZGVzY3JpcHRpb246ICdFdmVudCBjaGFubmVsL21lZGl1bScgfSxcbiAgICAgICAgICBzdGFydF9kYXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1N0YXJ0IGRhdGUgKFlZWVktTU0tREQpJyB9LFxuICAgICAgICAgIHN0YXJ0X3RpbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU3RhcnQgdGltZSAoSEg6TU0pJyB9LFxuICAgICAgICAgIGVuZF9kYXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VuZCBkYXRlIChZWVlZLU1NLUREKScgfSxcbiAgICAgICAgICBlbmRfdGltZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdFbmQgdGltZSAoSEg6TU0pJyB9LFxuICAgICAgICAgIGxvY2F0aW9uX2FkZHJlc3M6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTG9jYXRpb24vYWRkcmVzcyBmb3IgaW4tcGVyc29uIGV2ZW50cycgfSxcbiAgICAgICAgICBjb25maXJtZWQ6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ1doZXRoZXIgZXZlbnQgaXMgY29uZmlybWVkJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3ZzY29fYW5hbHl0aWNzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiiBWU0NPOiBHZXQgYW5hbHl0aWNzIGFuZCByZXBvcnRzIGZyb20gVlNDTyBXb3Jrc3BhY2UgLSBwaXBlbGluZSBzdGF0cywgcmV2ZW51ZSByZXBvcnRzLCBzeW5jIGRhdGEsIGNoZWNrIEFQSSBoZWFsdGguJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydnZXRfYW5hbHl0aWNzJywgJ2dldF9yZXZlbnVlX3JlcG9ydCcsICdzeW5jX2FsbCcsICdnZXRfYXBpX2hlYWx0aCcsICdsaXN0X2JyYW5kcycsICdsaXN0X3dlYmhvb2tzJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FuYWx5dGljcyBhY3Rpb24gdG8gcGVyZm9ybSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGluY2x1ZGVfY2xvc2VkOiB7IHR5cGU6ICdib29sZWFuJywgZGVzY3JpcHRpb246ICdJbmNsdWRlIGNsb3NlZCBqb2JzIGluIGFuYWx5dGljcyAoZGVmYXVsdDogZmFsc2UpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyDwn5O4IFZTQ08gRVhURU5ERUQgVE9PTFM6IFByb2R1Y3RzLCBXb3Jrc2hlZXRzLCBOb3Rlc1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3ZzY29fbWFuYWdlX3Byb2R1Y3RzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+SsCBWU0NPOiBNYW5hZ2UgcHJvZHVjdHMvcHJpY2luZyBmb3IgcXVvdGVzIC0gbGlzdCwgY3JlYXRlLCB1cGRhdGUgcHJvZHVjdHMgYW5kIHByaWNpbmcgdGVtcGxhdGVzLiBFc3NlbnRpYWwgZm9yIGdlbmVyYXRpbmcgY2xpZW50IHF1b3Rlcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xpc3RfcHJvZHVjdHMnLCAnZ2V0X3Byb2R1Y3QnLCAnY3JlYXRlX3Byb2R1Y3QnLCAnZGVsZXRlX3Byb2R1Y3QnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uIHRvIHBlcmZvcm0gb24gcHJvZHVjdHMnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcm9kdWN0X2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1ZTQ08gcHJvZHVjdCBJRCAoZm9yIGdldC9kZWxldGUpJyB9LFxuICAgICAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUHJvZHVjdCBuYW1lIChmb3IgY3JlYXRlKScgfSxcbiAgICAgICAgICBwcmljZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdQcm9kdWN0IHByaWNlIChmb3IgY3JlYXRlKScgfSxcbiAgICAgICAgICBjb3N0OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1Byb2R1Y3QgY29zdCAoZm9yIGNyZWF0ZSknIH0sXG4gICAgICAgICAgZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUHJvZHVjdCBkZXNjcmlwdGlvbicgfSxcbiAgICAgICAgICBjYXRlZ29yeTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdQcm9kdWN0IGNhdGVnb3J5JyB9LFxuICAgICAgICAgIHRheF9yYXRlOiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1RheCByYXRlIGFzIGRlY2ltYWwgKGUuZy4sIDAuMDggZm9yIDglKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd2c2NvX21hbmFnZV93b3Jrc2hlZXRzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiyBWU0NPOiBNYW5hZ2Ugam9iIHdvcmtzaGVldHMvdGVtcGxhdGVzIC0gZ2V0IHdvcmtzaGVldCBkZXRhaWxzIG9yIGNyZWF0ZSBuZXcgam9icyBmcm9tIHRlbXBsYXRlcyB3aXRoIHByZS1maWxsZWQgZXZlbnRzLCBjb250YWN0cywgYW5kIHByb2R1Y3RzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnZ2V0X2pvYl93b3Jrc2hlZXQnLCAnY3JlYXRlX2pvYl9mcm9tX3dvcmtzaGVldCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBY3Rpb24gdG8gcGVyZm9ybSBvbiB3b3Jrc2hlZXRzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgam9iX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1ZTQ08gam9iIElEIChmb3IgZ2V0X2pvYl93b3Jrc2hlZXQpJyB9LFxuICAgICAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTmV3IGpvYiBuYW1lIChmb3IgY3JlYXRlX2pvYl9mcm9tX3dvcmtzaGVldCknIH0sXG4gICAgICAgICAgc3RhZ2U6IHsgdHlwZTogJ3N0cmluZycsIGVudW06IFsnbGVhZCcsICdib29rZWQnLCAnZnVsZmlsbG1lbnQnLCAnY29tcGxldGVkJ10sIGRlc2NyaXB0aW9uOiAnSW5pdGlhbCBzdGFnZScgfSxcbiAgICAgICAgICBqb2JfdHlwZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUeXBlIG9mIGpvYiAod2VkZGluZywgcG9ydHJhaXQsIGV0Yy4pJyB9LFxuICAgICAgICAgIGJyYW5kX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0JyYW5kIElEIGZvciB0aGUgam9iJyB9LFxuICAgICAgICAgIGV2ZW50czogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnb2JqZWN0JyB9LCBkZXNjcmlwdGlvbjogJ1ByZS1maWxsZWQgZXZlbnRzIGZvciB0aGUgd29ya3NoZWV0JyB9LFxuICAgICAgICAgIGNvbnRhY3RzOiB7IHR5cGU6ICdhcnJheScsIGl0ZW1zOiB7IHR5cGU6ICdvYmplY3QnIH0sIGRlc2NyaXB0aW9uOiAnUHJlLWZpbGxlZCBjb250YWN0cyBmb3IgdGhlIHdvcmtzaGVldCcgfSxcbiAgICAgICAgICBwcm9kdWN0czogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnb2JqZWN0JyB9LCBkZXNjcmlwdGlvbjogJ1ByZS1maWxsZWQgcHJvZHVjdHMgZm9yIHRoZSB3b3Jrc2hlZXQnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndnNjb19tYW5hZ2Vfbm90ZXMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OdIFZTQ086IE1hbmFnZSBub3RlcyBhbmQgZG9jdW1lbnRhdGlvbiBmb3Igam9icy9jb250YWN0cyAtIGxpc3QsIGNyZWF0ZSwgdXBkYXRlLCBvciBkZWxldGUgbm90ZXMgYXR0YWNoZWQgdG8gam9icyBvciBjb250YWN0cy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xpc3Rfbm90ZXMnLCAnY3JlYXRlX25vdGUnLCAndXBkYXRlX25vdGUnLCAnZGVsZXRlX25vdGUnLCAnbGlzdF9maWxlcycsICdsaXN0X2dhbGxlcmllcycsICdjcmVhdGVfZ2FsbGVyeSddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBY3Rpb24gdG8gcGVyZm9ybSBvbiBub3Rlcy9maWxlcydcbiAgICAgICAgICB9LFxuICAgICAgICAgIG5vdGVfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVlNDTyBub3RlIElEIChmb3IgdXBkYXRlL2RlbGV0ZSknIH0sXG4gICAgICAgICAgam9iX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0xpbmsgbm90ZS9maWxlcyB0byB0aGlzIGpvYiBJRCcgfSxcbiAgICAgICAgICBjb250YWN0X2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0xpbmsgbm90ZSB0byB0aGlzIGNvbnRhY3QgSUQnIH0sXG4gICAgICAgICAgY29udGVudDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOb3RlIGNvbnRlbnQgKHBsYWluIHRleHQpJyB9LFxuICAgICAgICAgIGNvbnRlbnRfaHRtbDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOb3RlIGNvbnRlbnQgKEhUTUwgZm9ybWF0KScgfSxcbiAgICAgICAgICBkYXRlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05vdGUgZGF0ZSAoWVlZWS1NTS1ERCknIH0sXG4gICAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdHYWxsZXJ5IG5hbWUgKGZvciBjcmVhdGVfZ2FsbGVyeSknIH0sXG4gICAgICAgICAgZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnR2FsbGVyeSBkZXNjcmlwdGlvbicgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+TuCBWU0NPIEVYVEVOREVEIFRPT0xTOiBGaW5hbmNpYWxzLCBTZXR0aW5ncywgVXNlcnNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICd2c2NvX21hbmFnZV9maW5hbmNpYWxzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+StSBWU0NPOiBNYW5hZ2UgZmluYW5jaWFsIG9wZXJhdGlvbnMgLSBvcmRlcnMsIHBheW1lbnRzLCB0YXhlcywgcHJvZml0IGNlbnRlcnMuIENyZWF0ZSBpbnZvaWNlcywgdHJhY2sgcGF5bWVudHMsIG1hbmFnZSB0YXggY29uZmlndXJhdGlvbnMgZm9yIFBhcnR5IEZhdm9yIFBob3RvLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnbGlzdF9vcmRlcnMnLCAnZ2V0X29yZGVyJywgJ2NyZWF0ZV9vcmRlcicsICd1cGRhdGVfb3JkZXInLCAnZGVsZXRlX29yZGVyJyxcbiAgICAgICAgICAgICAgJ2xpc3RfcGF5bWVudF9tZXRob2RzJywgJ2dldF9wYXltZW50X21ldGhvZCcsXG4gICAgICAgICAgICAgICdsaXN0X3Byb2ZpdF9jZW50ZXJzJywgJ2NyZWF0ZV9wcm9maXRfY2VudGVyJywgJ2dldF9wcm9maXRfY2VudGVyJywgJ3VwZGF0ZV9wcm9maXRfY2VudGVyJywgJ2RlbGV0ZV9wcm9maXRfY2VudGVyJyxcbiAgICAgICAgICAgICAgJ2xpc3RfdGF4X2dyb3VwcycsICdjcmVhdGVfdGF4X2dyb3VwJyxcbiAgICAgICAgICAgICAgJ2xpc3RfdGF4X3JhdGVzJywgJ2NyZWF0ZV90YXhfcmF0ZScsICdkZWxldGVfdGF4X3JhdGUnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmluYW5jaWFsIGFjdGlvbiB0byBwZXJmb3JtJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgam9iX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0pvYiBJRCBmb3Igb3JkZXIgY3JlYXRpb24nIH0sXG4gICAgICAgICAgb3JkZXJfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnT3JkZXIgSUQgZm9yIGdldC91cGRhdGUvZGVsZXRlJyB9LFxuICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdhcnJheScsIGl0ZW1zOiB7IHR5cGU6ICdvYmplY3QnIH0sIGRlc2NyaXB0aW9uOiAnTGluZSBpdGVtcyBmb3Igb3JkZXInIH0sXG4gICAgICAgICAgdGF4X2dyb3VwX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1RheCBncm91cCBJRCcgfSxcbiAgICAgICAgICBwYXltZW50X21ldGhvZF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdQYXltZW50IG1ldGhvZCBJRCcgfSxcbiAgICAgICAgICBwcm9maXRfY2VudGVyX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Byb2ZpdCBjZW50ZXIgSUQnIH0sXG4gICAgICAgICAgbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdOYW1lIGZvciBuZXcgZW50aXR5JyB9LFxuICAgICAgICAgIHJhdGU6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnVGF4IHJhdGUgYXMgZGVjaW1hbCAoZS5nLiwgMC4wOCknIH0sXG4gICAgICAgICAgYW1vdW50OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0Ftb3VudCBmb3IgcGF5bWVudHMvb3JkZXJzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3ZzY29fbWFuYWdlX3NldHRpbmdzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4pqZ77iPIFZTQ086IE1hbmFnZSBzdHVkaW8gc2V0dGluZ3MgLSBjdXN0b20gZmllbGRzLCBkaXNjb3VudHMsIGpvYiB0eXBlcywgZXZlbnQgdHlwZXMsIGxlYWQgc291cmNlcy4gQ29uZmlndXJlIFBhcnR5IEZhdm9yIFBob3RvIHN0dWRpbyB3b3JrZmxvdyBhbmQgY29uZmlndXJhdGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2dldF9zdHVkaW8nLCAndXBkYXRlX3N0dWRpbycsXG4gICAgICAgICAgICAgICdsaXN0X2JyYW5kcycsICd1cGRhdGVfYnJhbmQnLCAnZGVsZXRlX2JyYW5kJyxcbiAgICAgICAgICAgICAgJ2xpc3RfY3VzdG9tX2ZpZWxkcycsICdjcmVhdGVfY3VzdG9tX2ZpZWxkJywgJ3VwZGF0ZV9jdXN0b21fZmllbGQnLCAnZGVsZXRlX2N1c3RvbV9maWVsZCcsXG4gICAgICAgICAgICAgICdsaXN0X2Rpc2NvdW50cycsICdjcmVhdGVfZGlzY291bnQnLCAnZGVsZXRlX2Rpc2NvdW50JyxcbiAgICAgICAgICAgICAgJ2xpc3RfZGlzY291bnRfdHlwZXMnLCAnY3JlYXRlX2Rpc2NvdW50X3R5cGUnLCAnZGVsZXRlX2Rpc2NvdW50X3R5cGUnLFxuICAgICAgICAgICAgICAnbGlzdF9ldmVudF90eXBlcycsICdjcmVhdGVfZXZlbnRfdHlwZScsICd1cGRhdGVfZXZlbnRfdHlwZScsICdkZWxldGVfZXZlbnRfdHlwZScsXG4gICAgICAgICAgICAgICdsaXN0X2ZpbGVfdHlwZXMnLFxuICAgICAgICAgICAgICAnbGlzdF9qb2JfY2xvc2VkX3JlYXNvbnMnLCAnY3JlYXRlX2pvYl9jbG9zZWRfcmVhc29uJyxcbiAgICAgICAgICAgICAgJ2xpc3Rfam9iX3JvbGVzJywgJ2NyZWF0ZV9qb2Jfcm9sZScsXG4gICAgICAgICAgICAgICdsaXN0X2pvYl90eXBlcycsICdjcmVhdGVfam9iX3R5cGUnLFxuICAgICAgICAgICAgICAnbGlzdF9sZWFkX3NvdXJjZXMnLCAnY3JlYXRlX2xlYWRfc291cmNlJyxcbiAgICAgICAgICAgICAgJ2xpc3RfbGVhZF9zdGF0dXNlcycsICdjcmVhdGVfbGVhZF9zdGF0dXMnLFxuICAgICAgICAgICAgICAnbGlzdF9wcm9kdWN0X3R5cGVzJywgJ2NyZWF0ZV9wcm9kdWN0X3R5cGUnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2V0dGluZ3MgYWN0aW9uIHRvIHBlcmZvcm0nXG4gICAgICAgICAgfSxcbiAgICAgICAgICBicmFuZF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCcmFuZCBJRCBmb3IgdXBkYXRlL2RlbGV0ZScgfSxcbiAgICAgICAgICBmaWVsZF9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDdXN0b20gZmllbGQgSUQnIH0sXG4gICAgICAgICAgZGlzY291bnRfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRGlzY291bnQgSUQnIH0sXG4gICAgICAgICAgZXZlbnRfdHlwZV9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdFdmVudCB0eXBlIElEJyB9LFxuICAgICAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnTmFtZSBmb3IgbmV3IGVudGl0eScgfSxcbiAgICAgICAgICBmaWVsZF90eXBlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0N1c3RvbSBmaWVsZCB0eXBlJyB9LFxuICAgICAgICAgIGVudGl0eV90eXBlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VudGl0eSB0aGUgZmllbGQgYXBwbGllcyB0byAoam9iLCBjb250YWN0LCBldmVudCknIH0sXG4gICAgICAgICAgZGlzY291bnRfYW1vdW50OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0Rpc2NvdW50IGFtb3VudCcgfSxcbiAgICAgICAgICBkaXNjb3VudF9wZXJjZW50OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0Rpc2NvdW50IHBlcmNlbnQnIH0sXG4gICAgICAgICAgY29sb3I6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29sb3IgZm9yIGV2ZW50IHR5cGVzJyB9LFxuICAgICAgICAgIG91dGNvbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnT3V0Y29tZSBmb3Igam9iIGNsb3NlZCByZWFzb25zICh3b24sIGxvc3QpJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3ZzY29fbWFuYWdlX3VzZXJzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+RpSBWU0NPOiBNYW5hZ2Ugc3R1ZGlvIHRlYW0gbWVtYmVycyAtIGxpc3QsIGNyZWF0ZSwgdXBkYXRlIHVzZXJzLCBtYW5hZ2Ugcm9sZXMgYW5kIHBlcm1pc3Npb25zIGZvciBQYXJ0eSBGYXZvciBQaG90byB0ZWFtLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGVudW06IFsnbGlzdF91c2VycycsICdnZXRfdXNlcicsICdjcmVhdGVfdXNlcicsICd1cGRhdGVfdXNlcicsICdkZWxldGVfdXNlcicsICdsaXN0X3RpbWV6b25lcyddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVc2VyIG1hbmFnZW1lbnQgYWN0aW9uJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdXNlcl9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVc2VyIElEIGZvciBnZXQvdXBkYXRlL2RlbGV0ZScgfSxcbiAgICAgICAgICBuYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1VzZXIgbmFtZScgfSxcbiAgICAgICAgICBlbWFpbDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdVc2VyIGVtYWlsJyB9LFxuICAgICAgICAgIHJvbGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVXNlciByb2xlIChhZG1pbiwgc3RhZmYsIGV0Yy4pJyB9LFxuICAgICAgICAgIGlzX2FjdGl2ZTogeyB0eXBlOiAnYm9vbGVhbicsIGRlc2NyaXB0aW9uOiAnV2hldGhlciB1c2VyIGlzIGFjdGl2ZScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+UhCBHSVRIVUIgQ09OVFJJQlVUSU9OIFNZTkMgVE9PTFNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzeW5jX2dpdGh1Yl9jb250cmlidXRpb25zJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UhCBTeW5jIEdpdEh1YiBjb21taXRzIHRvIHRoZSBjb250cmlidXRpb24gc3lzdGVtIGFuZCBhd2FyZCBYTVJUIGNyZWRpdHMuIEZldGNoZXMgcmVjZW50IGNvbW1pdHMgZnJvbSB0aGUgcmVwb3NpdG9yeSwgdmFsaWRhdGVzIHRoZW0sIGFuZCBhd2FyZHMgWE1SVCBiYXNlZCBvbiBjb250cmlidXRpb24gdHlwZSBhbmQgcXVhbGl0eS4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlcG86IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBuYW1lIChlLmcuLCBcIlhNUlQtRWNvc3lzdGVtXCIpLiBEZWZhdWx0OiBYTVJULUVjb3N5c3RlbScgfSxcbiAgICAgICAgICBvd25lcjogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSZXBvc2l0b3J5IG93bmVyIChlLmcuLCBcIkRldkdydUdvbGRcIikuIERlZmF1bHQ6IERldkdydUdvbGQnIH0sXG4gICAgICAgICAgbWF4X2NvbW1pdHM6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBjb21taXRzIHRvIHN5bmMgKDEtMTAwKS4gRGVmYXVsdDogMTAwJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+TiyBDT1JQT1JBVEUgTElDRU5TSU5HIFRPT0xTIChCaWRpcmVjdGlvbmFsIE9uYm9hcmRpbmcpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnc3RhcnRfbGljZW5zZV9hcHBsaWNhdGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4sgU3RhcnQgYSBuZXcgY29ycG9yYXRlIGxpY2Vuc2UgYXBwbGljYXRpb24gdGhyb3VnaCBjb252ZXJzYXRpb24uIENyZWF0ZXMgYSBkcmFmdCB0aGF0IGNhbiBiZSBjb21wbGV0ZWQgaW5jcmVtZW50YWxseSBhcyB1c2VyIHByb3ZpZGVzIGluZm9ybWF0aW9uLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgc2Vzc2lvbl9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBjb252ZXJzYXRpb24gc2Vzc2lvbiBrZXkgZm9yIGxpbmtpbmcnIH0sXG4gICAgICAgICAgY29tcGFueV9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbXBhbnkgbmFtZSAocmVxdWlyZWQgdG8gc3RhcnQpJyB9LFxuICAgICAgICAgIGNvbXBhbnlfc2l6ZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgZW1wbG95ZWVzJyB9LFxuICAgICAgICAgIGNvbnRhY3RfbmFtZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDb250YWN0IHBlcnNvbiBuYW1lJyB9LFxuICAgICAgICAgIGNvbnRhY3RfZW1haWw6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29udGFjdCBlbWFpbCBhZGRyZXNzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Nlc3Npb25fa2V5JywgJ2NvbXBhbnlfbmFtZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3VwZGF0ZV9saWNlbnNlX2FwcGxpY2F0aW9uJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TnSBVcGRhdGUgYW4gZXhpc3RpbmcgZHJhZnQgbGljZW5zZSBhcHBsaWNhdGlvbiB3aXRoIG5ldyBpbmZvcm1hdGlvbiBnYXRoZXJlZCBmcm9tIGNvbnZlcnNhdGlvbi4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFwcGxpY2F0aW9uX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FwcGxpY2F0aW9uIElEIHRvIHVwZGF0ZScgfSxcbiAgICAgICAgICBzZXNzaW9uX2tleTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdTZXNzaW9uIGtleSB0byBmaW5kIGRyYWZ0IGlmIG5vIElEIHByb3ZpZGVkJyB9LFxuICAgICAgICAgIGNvbXBhbnlfc2l6ZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgZW1wbG95ZWVzJyB9LFxuICAgICAgICAgIGluZHVzdHJ5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0luZHVzdHJ5IHNlY3RvcicgfSxcbiAgICAgICAgICBjdXJyZW50X2Nlb19zYWxhcnk6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnQ0VPIGFubnVhbCBzYWxhcnknIH0sXG4gICAgICAgICAgY3VycmVudF9jdG9fc2FsYXJ5OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0NUTyBhbm51YWwgc2FsYXJ5JyB9LFxuICAgICAgICAgIGN1cnJlbnRfY2ZvX3NhbGFyeTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdDRk8gYW5udWFsIHNhbGFyeScgfSxcbiAgICAgICAgICBjdXJyZW50X2Nvb19zYWxhcnk6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnQ09PIGFubnVhbCBzYWxhcnknIH0sXG4gICAgICAgICAgY29udGFjdF9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbnRhY3QgcGVyc29uIG5hbWUnIH0sXG4gICAgICAgICAgY29udGFjdF9lbWFpbDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdDb250YWN0IGVtYWlsJyB9LFxuICAgICAgICAgIGNvbnRhY3RfcGhvbmU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29udGFjdCBwaG9uZScgfSxcbiAgICAgICAgICBjb250YWN0X3RpdGxlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbnRhY3Qgam9iIHRpdGxlJyB9LFxuICAgICAgICAgIHRpZXJfcmVxdWVzdGVkOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ2ZyZWVfdHJpYWwnLCAnYmFzaWMnLCAncHJvJywgJ2VudGVycHJpc2UnXSwgZGVzY3JpcHRpb246ICdMaWNlbnNlIHRpZXInIH0sXG4gICAgICAgICAgbm90ZXM6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQWRkaXRpb25hbCBub3RlcycgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY2FsY3VsYXRlX2xpY2Vuc2Vfc2F2aW5ncycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfkrAgQ2FsY3VsYXRlIHBvdGVudGlhbCBzYXZpbmdzIGZyb20gQUkgZXhlY3V0aXZlIHJlcGxhY2VtZW50LiBVc2UgdGhpcyB0byBzaG93IHVzZXJzIHRoZWlyIGVzdGltYXRlZCBzYXZpbmdzIGFuZCBwZXItZW1wbG95ZWUgcmVkaXN0cmlidXRpb24uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjZW9fc2FsYXJ5OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0NFTyBhbm51YWwgY29tcGVuc2F0aW9uJyB9LFxuICAgICAgICAgIGN0b19zYWxhcnk6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnQ1RPIGFubnVhbCBjb21wZW5zYXRpb24nIH0sXG4gICAgICAgICAgY2ZvX3NhbGFyeTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdDRk8gYW5udWFsIGNvbXBlbnNhdGlvbicgfSxcbiAgICAgICAgICBjb29fc2FsYXJ5OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0NPTyBhbm51YWwgY29tcGVuc2F0aW9uJyB9LFxuICAgICAgICAgIGVtcGxveWVlX2NvdW50OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ1RvdGFsIG51bWJlciBvZiBlbXBsb3llZXMnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnZW1wbG95ZWVfY291bnQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdzdWJtaXRfbGljZW5zZV9hcHBsaWNhdGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ+KchSBTdWJtaXQgYSBjb21wbGV0ZWQgbGljZW5zZSBhcHBsaWNhdGlvbi4gQ2FsY3VsYXRlcyBmaW5hbCBzYXZpbmdzIGFuZCBtYXJrcyBhcHBsaWNhdGlvbiBhcyBzdWJtaXR0ZWQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhcHBsaWNhdGlvbl9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdBcHBsaWNhdGlvbiBJRCB0byBzdWJtaXQnIH0sXG4gICAgICAgICAgc2Vzc2lvbl9rZXk6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU2Vzc2lvbiBrZXkgdG8gZmluZCBkcmFmdCBpZiBubyBJRCcgfSxcbiAgICAgICAgICBjb21wbGlhbmNlX2NvbW1pdG1lbnQ6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ1VzZXIgY29uZmlybXMgZXRoaWNhbCBjb21taXRtZW50IChyZXF1aXJlZCknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnY29tcGxpYW5jZV9jb21taXRtZW50J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2xpY2Vuc2VfYXBwbGljYXRpb25fc3RhdHVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TiiBDaGVjayB0aGUgc3RhdHVzIG9mIGEgbGljZW5zZSBhcHBsaWNhdGlvbiBieSBJRCBvciBlbWFpbC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFwcGxpY2F0aW9uX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FwcGxpY2F0aW9uIElEJyB9LFxuICAgICAgICAgIGVtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NvbnRhY3QgZW1haWwgdG8gZmluZCBhcHBsaWNhdGlvbnMnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdXG4gICAgICB9XG4gICAgfVxuICB9XG4gICxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT0gRUNPU1lTVEVNIENPT1JESU5BVElPTiBUT09MUyA9PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiBcInRyaWdnZXJfZWNvc3lzdGVtX2Nvb3JkaW5hdGlvblwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiVHJpZ2dlciB0aGUgWE1SVC1FY29zeXN0ZW0gbXVsdGktYWdlbnQgY29vcmRpbmF0aW9uIGN5Y2xlLiBVc2UgdGhpcyB3aGVuIHlvdSBuZWVkIHRvIGNvb3JkaW5hdGUgYWdlbnRzIGFjcm9zcyBhbGwgZWNvc3lzdGVtIHJlcG9zaXRvcmllcywgcGVyZm9ybSBoZWFsdGggY2hlY2tzLCBvciBnZW5lcmF0ZSBjb21wcmVoZW5zaXZlIGVjb3N5c3RlbSByZXBvcnRzLlwiLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgY3ljbGVfdHlwZToge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGVudW06IFtcInN0YW5kYXJkXCIsIFwiZW1lcmdlbmN5XCIsIFwiYW5hbHlzaXNcIl0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJUeXBlIG9mIGNvb3JkaW5hdGlvbiBjeWNsZTogJ3N0YW5kYXJkJyBmb3Igbm9ybWFsIG9wZXJhdGlvbnMsICdlbWVyZ2VuY3knIGZvciB1cmdlbnQgaXNzdWVzLCAnYW5hbHlzaXMnIGZvciBkZWVwIGVjb3N5c3RlbSBhbmFseXNpc1wiXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiBcImZ1bmN0aW9uXCIsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6IFwiZ2V0X2Vjb3N5c3RlbV9zdGF0dXNcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkdldCBjb21wcmVoZW5zaXZlIGhlYWx0aCBzdGF0dXMgYW5kIGluZm9ybWF0aW9uIGFib3V0IGFsbCBYTVJUIEVjb3N5c3RlbSBhZ2VudHMsIHNlcnZpY2VzLCBhbmQgZGVwbG95bWVudHMuIFJldHVybnMgYWdlbnQgbGlzdCwgaGVhbHRoIGNoZWNrcywgc3lzdGVtIHN0YXR1cywgYW5kIGNvb3JkaW5hdGlvbiBoaXN0b3J5LlwiLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiBcInF1ZXJ5X2Vjb3N5c3RlbV9hZ2VudHNcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlF1ZXJ5IGFuZCBkaXNjb3ZlciBhbGwgYWdlbnRzIGFjcm9zcyB0aGUgWE1SVCBlY29zeXN0ZW0gaW5jbHVkaW5nIFN1aXRlIEFJIGV4ZWN1dGl2ZXMsIFZlcmNlbCBkZXBsb3ltZW50cywgYW5kIEdpdEh1Yi1iYXNlZCBhZ2VudHMuIFJldHVybnMgZGV0YWlsZWQgYWdlbnQgaW5mb3JtYXRpb24gd2l0aCBjYXBhYmlsaXRpZXMsIHN0YXR1cywgYW5kIGVuZHBvaW50cy5cIixcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGZpbHRlcl9ieToge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGVudW06IFtcImFsbFwiLCBcImFjdGl2ZVwiLCBcInN1cGFiYXNlXCIsIFwidmVyY2VsXCIsIFwicHJpb3JpdHlcIl0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJGaWx0ZXIgYWdlbnRzIGJ5IHR5cGUgb3Igc3RhdHVzXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+TpyBWU0NPIFNVSVRFIFFVT1RFIFdPUktGTE9XXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnY3JlYXRlX3N1aXRlX3F1b3RlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TpyBDcmVhdGUgYSBTdWl0ZSBFbnRlcnByaXNlIHF1b3RlIGluIFZTQ08gYW5kIGF1dG9tYXRpY2FsbHkgc2VuZCBpdCB2aWEgZW1haWwgd2l0aCBTdHJpcGUgcGF5bWVudCBsaW5rLiBUaGlzIHRyaWdnZXJzIHRoZSBmdWxsIFZTQ08gd29ya2Zsb3c6IGNyZWF0ZXMgY29udGFjdCwgam9iIChTdWl0ZUVudGVycHJpc2UgdHlwZSksIGxpbmtzIHRoZW0sIGdlbmVyYXRlcyBvcmRlci9xdW90ZSwgYW5kIGZpcmVzIHRoZSBUw6F2ZSBlbWFpbCBhdXRvbWF0aW9uIHRvIHNlbmQgdGhlIHF1b3RlIGZyb20gcGZwYXR0ZW5kYW50c0BnbWFpbC5jb20uJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBjb21wYW55X25hbWU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29tcGFueSBuYW1lIGZvciB0aGUgcXVvdGUgKHJlcXVpcmVkKScgfSxcbiAgICAgICAgICBjb250YWN0X2VtYWlsOiB7IHR5cGU6ICdzdHJpbmcnLCBmb3JtYXQ6ICdlbWFpbCcsIGRlc2NyaXB0aW9uOiAnRW1haWwgYWRkcmVzcyB0byBzZW5kIHF1b3RlIHRvIChyZXF1aXJlZCknIH0sXG4gICAgICAgICAgY29udGFjdF9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0Z1bGwgbmFtZSBvZiBjb250YWN0IChvcHRpb25hbCAtIHdpbGwgcGFyc2UgZmlyc3QvbGFzdCknIH0sXG4gICAgICAgICAgdGllcjogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydiYXNpYycsICdwcm8nLCAnZW50ZXJwcmlzZSddLCBkZXNjcmlwdGlvbjogJ1N1aXRlIHByaWNpbmcgdGllciAoZGVmYXVsdDogZW50ZXJwcmlzZSknIH0sXG4gICAgICAgICAgZW1wbG95ZWVfY291bnQ6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGVtcGxveWVlcyBmb3Igc2F2aW5ncyBjYWxjdWxhdGlvbiAob3B0aW9uYWwpJyB9LFxuICAgICAgICAgIG5vdGVzOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0FkZGl0aW9uYWwgbm90ZXMgdG8gaW5jbHVkZSB3aXRoIHRoZSBxdW90ZSAob3B0aW9uYWwpJyB9LFxuICAgICAgICAgIGV4ZWN1dGl2ZV9zYWxhcmllczoge1xuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgZXhlY3V0aXZlIHNhbGFyaWVzIGZvciBzYXZpbmdzIGNhbGN1bGF0aW9uIChvcHRpb25hbCknLFxuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICBjZW86IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgY3RvOiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgIGNmbzogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICBjb286IHsgdHlwZTogJ251bWJlcicgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnY29tcGFueV9uYW1lJywgJ2NvbnRhY3RfZW1haWwnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+TiiBBTkFMWVRJQ1MgJiBMT0cgTUFOQUdFTUVOVCBUT09MU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3N5bmNfZnVuY3Rpb25fbG9ncycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflIQgTWFudWFsbHkgdHJpZ2dlciBzeW5jaHJvbml6YXRpb24gb2YgZWRnZSBmdW5jdGlvbiBsb2dzIHRvIGVsaXphX2Z1bmN0aW9uX3VzYWdlIHRhYmxlLiBVc2Ugd2hlbiB5b3UgbmVlZCBpbW1lZGlhdGUgYWNjZXNzIHRvIHJlY2VudCBsb2dzIHRoYXQgbWF5IG5vdCBoYXZlIGJlZW4gc3luY2VkIHlldC4gTG9ncyBhcmUgYXV0by1zeW5jZWQgZXZlcnkgMTUgbWludXRlcywgYnV0IHRoaXMgZm9yY2VzIGltbWVkaWF0ZSBzeW5jLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgaG91cnNfYmFjazoge1xuICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hvdyBtYW55IGhvdXJzIG9mIGxvZ3MgdG8gc3luYyAoZGVmYXVsdDogMSwgbWF4OiAyNCknXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ2V0X2Z1bmN0aW9uX3VzYWdlX2FuYWx5dGljcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogR2V0IGNvbXByZWhlbnNpdmUgYW5hbHl0aWNzIGZvciBlZGdlIGZ1bmN0aW9uIHVzYWdlIGluY2x1ZGluZyBzdWNjZXNzIHJhdGVzLCBleGVjdXRpb24gdGltZXMsIGVycm9yIHBhdHRlcm5zLCBhbmQgdHJlbmRzLiBFc3NlbnRpYWwgZm9yIHVuZGVyc3RhbmRpbmcgZnVuY3Rpb24gaGVhbHRoIGFuZCBtYWtpbmcgZGF0YS1kcml2ZW4gZGVjaXNpb25zLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgZnVuY3Rpb25fbmFtZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbHRlciB0byBzcGVjaWZpYyBmdW5jdGlvbiAob3B0aW9uYWwgLSBvbWl0IGZvciBhbGwgZnVuY3Rpb25zKSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVfd2luZG93X2hvdXJzOiB7XG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGltZSB3aW5kb3cgZm9yIGFuYWx5c2lzIGluIGhvdXJzIChkZWZhdWx0OiAyNCknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBncm91cF9ieToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2Z1bmN0aW9uJywgJ2NhdGVnb3J5JywgJ2V4ZWN1dGl2ZScsICdob3VyJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hvdyB0byBncm91cCB0aGUgcmVzdWx0cyAoZGVmYXVsdDogZnVuY3Rpb24pJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NoZWNrX3N5c3RlbV9zdGF0dXMnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn4+lIEdldCBjb21wcmVoZW5zaXZlIGVjb3N5c3RlbSBzdGF0dXMgcmVwb3J0IHdpdGggMTUrIHNlY3Rpb25zIGluY2x1ZGluZyBoZWFsdGggc2NvcmUsIGdvdmVybmFuY2UsIGtub3dsZWRnZSBiYXNlLCBHaXRIdWIgYWN0aXZpdHksIHdvcmtmbG93cywgQUkgcHJvdmlkZXJzLCBYTVJUIGNoYXJnZXIsIHVzZXIgYWNxdWlzaXRpb24sIGNyb24gam9icywgYW5kIG1vcmUuIFRoaXMgaXMgdGhlIFBSSU1BUlkgdG9vbCBmb3IgZWNvc3lzdGVtIGhlYWx0aCBjaGVja3MuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHt9LFxuICAgICAgICByZXF1aXJlZDogW11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g4piB77iPIEdPT0dMRSBDTE9VRCBTRVJWSUNFUyAoR21haWwsIERyaXZlLCBTaGVldHMsIENhbGVuZGFyKVxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2dvb2dsZV9jbG91ZF9hdXRoJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn4piB77iPIFVuaWZpZWQgR29vZ2xlIENsb3VkIG9wZXJhdGlvbnMgdmlhIGdvb2dsZS1jbG91ZC1hdXRoLiBIYW5kbGVzIEdtYWlsLCBEcml2ZSwgU2hlZXRzLCBhbmQgQ2FsZW5kYXIgYWN0aW9ucyB0aHJvdWdoIGEgc2luZ2xlIGF1dGhlbnRpY2F0ZWQgZW5kcG9pbnQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydzdGF0dXMnLCAnc2VuZF9lbWFpbCcsICdsaXN0X2VtYWlscycsICdnZXRfZW1haWwnLCAnY3JlYXRlX2RyYWZ0JywgJ2xpc3RfZmlsZXMnLCAndXBsb2FkX2ZpbGUnLCAnZ2V0X2ZpbGUnLCAnZG93bmxvYWRfZmlsZScsICdjcmVhdGVfZm9sZGVyJywgJ3NoYXJlX2ZpbGUnLCAnY3JlYXRlX3NwcmVhZHNoZWV0JywgJ3JlYWRfc2hlZXQnLCAnd3JpdGVfc2hlZXQnLCAnYXBwZW5kX3NoZWV0JywgJ2dldF9zcHJlYWRzaGVldF9pbmZvJywgJ2xpc3RfZXZlbnRzJywgJ2NyZWF0ZV9ldmVudCcsICd1cGRhdGVfZXZlbnQnLCAnZGVsZXRlX2V2ZW50JywgJ2dldF9ldmVudCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdnb29nbGUtY2xvdWQtYXV0aCBhY3Rpb24gdG8gcGVyZm9ybSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRvOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlY2lwaWVudCBlbWFpbCBhZGRyZXNzIChmb3Igc2VuZF9lbWFpbCwgY3JlYXRlX2RyYWZ0KScgfSxcbiAgICAgICAgICBzdWJqZWN0OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VtYWlsIHN1YmplY3QgbGluZScgfSxcbiAgICAgICAgICBib2R5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VtYWlsIGJvZHkgY29udGVudCAoc3VwcG9ydHMgSFRNTCBpZiBpc19odG1sPXRydWUpJyB9LFxuICAgICAgICAgIGlzX2h0bWw6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ1doZXRoZXIgYm9keSBpcyBIVE1MIGZvcm1hdCAoZGVmYXVsdDogZmFsc2UpJyB9LFxuICAgICAgICAgIHF1ZXJ5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1NlYXJjaCBxdWVyeSBmb3IgbGlzdF9lbWFpbHMgKGUuZy4sIFwiaXM6dW5yZWFkXCIsIFwiZnJvbTpjbGllbnRAZXhhbXBsZS5jb21cIiknIH0sXG4gICAgICAgICAgbWVzc2FnZV9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdNZXNzYWdlIElEIGZvciBnZXRfZW1haWwnIH0sXG4gICAgICAgICAgbWF4X3Jlc3VsdHM6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTWF4IGVtYWlscyB0byByZXR1cm4gKGRlZmF1bHQ6IDIwKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnb29nbGVfZHJpdmUnLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OBIE1hbmFnZSBmaWxlcyBpbiBYTVJUIEdvb2dsZSBEcml2ZS4gQWN0aW9uczogbGlzdF9maWxlcywgdXBsb2FkX2ZpbGUsIGdldF9maWxlLCBkb3dubG9hZF9maWxlLCBjcmVhdGVfZm9sZGVyLCBzaGFyZV9maWxlLiBVc2UgZm9yIHN0b3JpbmcgcmVwb3J0cywgc2hhcmluZyBkb2N1bWVudHMsIG9yZ2FuaXppbmcgcHJvamVjdCBmaWxlcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xpc3RfZmlsZXMnLCAndXBsb2FkX2ZpbGUnLCAnZ2V0X2ZpbGUnLCAnZG93bmxvYWRfZmlsZScsICdjcmVhdGVfZm9sZGVyJywgJ3NoYXJlX2ZpbGUnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRHJpdmUgYWN0aW9uIHRvIHBlcmZvcm0nXG4gICAgICAgICAgfSxcbiAgICAgICAgICBxdWVyeTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdTZWFyY2ggcXVlcnkgZm9yIGxpc3RfZmlsZXMgKGUuZy4sIFwibmFtZSBjb250YWlucyBcXCdyZXBvcnRcXCdcIiknIH0sXG4gICAgICAgICAgZmlsZV9pZDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdGaWxlIElEIGZvciBnZXRfZmlsZSwgZG93bmxvYWRfZmlsZSwgc2hhcmVfZmlsZScgfSxcbiAgICAgICAgICBmb2xkZXJfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUGFyZW50IGZvbGRlciBJRCBmb3IgbGlzdF9maWxlcywgdXBsb2FkX2ZpbGUnIH0sXG4gICAgICAgICAgZmlsZV9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05hbWUgZm9yIG5ldyBmaWxlICh1cGxvYWRfZmlsZSknIH0sXG4gICAgICAgICAgY29udGVudDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdGaWxlIGNvbnRlbnQgdG8gdXBsb2FkJyB9LFxuICAgICAgICAgIG1pbWVfdHlwZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdNSU1FIHR5cGUgKGRlZmF1bHQ6IHRleHQvcGxhaW4pJyB9LFxuICAgICAgICAgIGZvbGRlcl9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05hbWUgZm9yIG5ldyBmb2xkZXIgKGNyZWF0ZV9mb2xkZXIpJyB9LFxuICAgICAgICAgIHBhcmVudF9mb2xkZXJfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUGFyZW50IGZvbGRlciBmb3IgY3JlYXRlX2ZvbGRlcicgfSxcbiAgICAgICAgICBlbWFpbDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdFbWFpbCB0byBzaGFyZSB3aXRoIChzaGFyZV9maWxlKScgfSxcbiAgICAgICAgICByb2xlOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ3JlYWRlcicsICd3cml0ZXInLCAnY29tbWVudGVyJ10sIGRlc2NyaXB0aW9uOiAnU2hhcmUgcGVybWlzc2lvbiBsZXZlbCAoZGVmYXVsdDogcmVhZGVyKScgfSxcbiAgICAgICAgICBtYXhfcmVzdWx0czogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdNYXggZmlsZXMgdG8gcmV0dXJuIChkZWZhdWx0OiAyMCknIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZ29vZ2xlX3NoZWV0cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogQ3JlYXRlIGFuZCBtYW5hZ2UgR29vZ2xlIFNwcmVhZHNoZWV0cy4gQWN0aW9uczogY3JlYXRlX3NwcmVhZHNoZWV0LCByZWFkX3NoZWV0LCB3cml0ZV9zaGVldCwgYXBwZW5kX3NoZWV0LCBnZXRfc3ByZWFkc2hlZXRfaW5mby4gVXNlIGZvciBsaXZlIGRhc2hib2FyZHMsIGFuYWx5dGljcywgZGF0YSB0cmFja2luZy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2NyZWF0ZV9zcHJlYWRzaGVldCcsICdyZWFkX3NoZWV0JywgJ3dyaXRlX3NoZWV0JywgJ2FwcGVuZF9zaGVldCcsICdnZXRfc3ByZWFkc2hlZXRfaW5mbyddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaGVldHMgYWN0aW9uIHRvIHBlcmZvcm0nXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0aXRsZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdTcHJlYWRzaGVldCB0aXRsZSAoY3JlYXRlX3NwcmVhZHNoZWV0KScgfSxcbiAgICAgICAgICBzaGVldF9uYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1NoZWV0IHRhYiBuYW1lIChjcmVhdGVfc3ByZWFkc2hlZXQsIGRlZmF1bHQ6IFNoZWV0MSknIH0sXG4gICAgICAgICAgc3ByZWFkc2hlZXRfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU3ByZWFkc2hlZXQgSUQgZm9yIHJlYWQvd3JpdGUvYXBwZW5kIG9wZXJhdGlvbnMnIH0sXG4gICAgICAgICAgcmFuZ2U6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQTEgbm90YXRpb24gcmFuZ2UgKGUuZy4sIFwiU2hlZXQxIUExOkMxMFwiKScgfSxcbiAgICAgICAgICB2YWx1ZXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnYXJyYXknLCBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9IH0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RhdGEgcm93cyB0byB3cml0ZS9hcHBlbmQgKGUuZy4sIFtbXCJOYW1lXCIsIFwiRW1haWxcIl0sIFtcIkpvaG5cIiwgXCJqb2huQGV4YW1wbGUuY29tXCJdXSknXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnb29nbGVfY2FsZW5kYXInLFxuICAgICAgZGVzY3JpcHRpb246ICfwn5OFIE1hbmFnZSBjYWxlbmRhciBhbmQgc2NoZWR1bGUgZXZlbnRzLiBBY3Rpb25zOiBsaXN0X2V2ZW50cywgY3JlYXRlX2V2ZW50LCB1cGRhdGVfZXZlbnQsIGRlbGV0ZV9ldmVudCwgZ2V0X2V2ZW50LiBVc2UgZm9yIHNjaGVkdWxpbmcgbWVldGluZ3MsIHRyYWNraW5nIGRlYWRsaW5lcywgYXV0b21hdGVkIHJlbWluZGVycy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xpc3RfZXZlbnRzJywgJ2NyZWF0ZV9ldmVudCcsICd1cGRhdGVfZXZlbnQnLCAnZGVsZXRlX2V2ZW50JywgJ2dldF9ldmVudCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDYWxlbmRhciBhY3Rpb24gdG8gcGVyZm9ybSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNhbGVuZGFyX2lkOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0NhbGVuZGFyIElEIChkZWZhdWx0OiBcInByaW1hcnlcIiknIH0sXG4gICAgICAgICAgZXZlbnRfaWQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRXZlbnQgSUQgZm9yIHVwZGF0ZS9kZWxldGUvZ2V0IG9wZXJhdGlvbnMnIH0sXG4gICAgICAgICAgdGl0bGU6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRXZlbnQgdGl0bGUvc3VtbWFyeScgfSxcbiAgICAgICAgICBzdGFydF90aW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1N0YXJ0IHRpbWUgaW4gSVNPIGZvcm1hdCAoZS5nLiwgXCIyMDI1LTEyLTE1VDEwOjAwOjAwLTA1OjAwXCIpJyB9LFxuICAgICAgICAgIGVuZF90aW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VuZCB0aW1lIGluIElTTyBmb3JtYXQnIH0sXG4gICAgICAgICAgZGVzY3JpcHRpb246IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnRXZlbnQgZGVzY3JpcHRpb24vbm90ZXMnIH0sXG4gICAgICAgICAgYXR0ZW5kZWVzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2YgYXR0ZW5kZWUgZW1haWwgYWRkcmVzc2VzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdGltZV9taW46IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU3RhcnQgb2YgdGltZSByYW5nZSBmb3IgbGlzdF9ldmVudHMgKElTTyBmb3JtYXQpJyB9LFxuICAgICAgICAgIHRpbWVfbWF4OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0VuZCBvZiB0aW1lIHJhbmdlIGZvciBsaXN0X2V2ZW50cyAoSVNPIGZvcm1hdCknIH0sXG4gICAgICAgICAgbWF4X3Jlc3VsdHM6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnTWF4IGV2ZW50cyB0byByZXR1cm4gKGRlZmF1bHQ6IDEwKScgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIHR5cGU6ICdmdW5jdGlvbicsXG4gICAgZnVuY3Rpb246IHtcbiAgICAgIG5hbWU6ICdnb29nbGVfY2xvdWRfc3RhdHVzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UkCBDaGVjayBHb29nbGUgQ2xvdWQgT0F1dGggY29ubmVjdGlvbiBzdGF0dXMuIFJldHVybnMgd2hpY2ggc2VydmljZXMgKEdtYWlsLCBEcml2ZSwgU2hlZXRzLCBDYWxlbmRhcikgYXJlIGF2YWlsYWJsZSBhbmQgd2hldGhlciBhdXRob3JpemF0aW9uIGlzIGNvbXBsZXRlLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7fSxcbiAgICAgICAgcmVxdWlyZWQ6IFtdXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCflI0gRlVOQ1RJT04gSU5UUk9TUEVDVElPTiBUT09MU1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2ludHJvc3BlY3RfZnVuY3Rpb25fYWN0aW9ucycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflI0gRElTQ09WRVIgQUNUSU9OUzogR2V0IHRoZSBjb21wbGV0ZSBsaXN0IG9mIGFsbCB2YWxpZCBhY3Rpb24gbmFtZXMgYW5kIHRoZWlyIHBhcmFtZXRlcnMgZm9yIG11bHRpLWFjdGlvbiBlZGdlIGZ1bmN0aW9ucy4gVXNlIHRoaXMgQkVGT1JFIGF0dGVtcHRpbmcgdG8gdXNlIGFuIGFjdGlvbiB5b3UgYXJlIHVuc3VyZSBhYm91dC4gU3VwcG9ydGVkIGZ1bmN0aW9uczogdnNjby13b3Jrc3BhY2UgKDg5IGFjdGlvbnMpLCBnaXRodWItaW50ZWdyYXRpb24gKDI1KyBhY3Rpb25zKSwgYWdlbnQtbWFuYWdlciAoMjcrIGFjdGlvbnMpLCB3b3JrZmxvdy10ZW1wbGF0ZS1tYW5hZ2VyICg4IGFjdGlvbnMpLiBSZXR1cm5zIGFjdGlvbiBuYW1lcywgcmVxdWlyZWQvb3B0aW9uYWwgcGFyYW1zLCBhbmQgZXhhbXBsZSBwYXlsb2Fkcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGZ1bmN0aW9uX25hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGdW5jdGlvbiB0byBpbnRyb3NwZWN0LiBPcHRpb25zOiB2c2NvLXdvcmtzcGFjZSwgZ2l0aHViLWludGVncmF0aW9uLCBhZ2VudC1tYW5hZ2VyLCB3b3JrZmxvdy10ZW1wbGF0ZS1tYW5hZ2VyLiBMZWF2ZSBlbXB0eSB0byBzZWUgYWxsIHN1cHBvcnRlZCBmdW5jdGlvbnMuJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgY2F0ZWdvcnk6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcHRpb25hbDogRmlsdGVyIGJ5IGFjdGlvbiBjYXRlZ29yeSAoZS5nLiwgXCJqb2JzXCIsIFwiY29udGFjdHNcIiwgXCJpc3N1ZXNcIiwgXCJ0YXNrc1wiKSdcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbXVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyDij7AgQ1JPTiBSRUdJU1RSWSAmIEVYRUNVVElPTiBDT05URVhUIFRPT0xTXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAncXVlcnlfY3Jvbl9yZWdpc3RyeScsXG4gICAgICBkZXNjcmlwdGlvbjogJ+KPsCBRdWVyeSB0aGUgdW5pZmllZCBjcm9uIGpvYiByZWdpc3RyeSBhY3Jvc3MgQUxMIHBsYXRmb3JtcyAoU3VwYWJhc2UgTmF0aXZlLCBwZ19jcm9uLCBHaXRIdWIgQWN0aW9ucywgVmVyY2VsKS4gU2VlIHdoYXQgc2NoZWR1bGVkIGpvYnMgZXhpc3QsIHRoZWlyIHJ1biBzdGF0dXMsIGZhaWx1cmVzLCBhbmQgZXhlY3V0aW9uIHN0YXRzLiBFc3NlbnRpYWwgZm9yIHVuZGVyc3RhbmRpbmcgd2hhdCBhdXRvbm9tb3VzIHByb2Nlc3NlcyBhcmUgcnVubmluZyBhbmQgZGlhZ25vc2luZyBzY2hlZHVsaW5nIGlzc3Vlcy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJ2xpc3RfYWxsJywgJ2xpc3RfYnlfcGxhdGZvcm0nLCAnZ2V0X2pvYl9zdGF0dXMnLCAnZ2V0X25leHRfcnVucycsICdnZXRfZmFpbGluZ19qb2JzJywgJ2dldF9leGVjdXRpb25fc3RhdHMnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVnaXN0cnkgYWN0aW9uOiBsaXN0X2FsbCAoYWxsIGpvYnMpLCBsaXN0X2J5X3BsYXRmb3JtIChmaWx0ZXIgYnkgc291cmNlKSwgZ2V0X2pvYl9zdGF0dXMgKHNwZWNpZmljIGpvYiksIGdldF9uZXh0X3J1bnMgKHVwY29taW5nIGV4ZWN1dGlvbnMpLCBnZXRfZmFpbGluZ19qb2JzIChwcm9ibGVtIGpvYnMpLCBnZXRfZXhlY3V0aW9uX3N0YXRzIChhZ2dyZWdhdGUgc3RhdHMpJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcGxhdGZvcm06IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZW51bTogWydzdXBhYmFzZV9uYXRpdmUnLCAncGdfY3JvbicsICdnaXRodWJfYWN0aW9ucycsICd2ZXJjZWxfY3JvbiddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaWx0ZXIgYnkgZXhlY3V0aW9uIHBsYXRmb3JtIChmb3IgbGlzdF9ieV9wbGF0Zm9ybSwgZ2V0X2V4ZWN1dGlvbl9zdGF0cyknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBmdW5jdGlvbl9uYW1lOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmlsdGVyIGJ5IGZ1bmN0aW9uIG5hbWUgKGZvciBnZXRfam9iX3N0YXR1cyknXG4gICAgICAgICAgfSxcbiAgICAgICAgICBqb2JfbmFtZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NwZWNpZmljIGpvYiBuYW1lIHRvIHF1ZXJ5IChmb3IgZ2V0X2pvYl9zdGF0dXMpJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5jbHVkZV9pbmFjdGl2ZToge1xuICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIGRpc2FibGVkL2luYWN0aXZlIGpvYnMgKGRlZmF1bHQ6IGZhbHNlKSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVfd2luZG93X2hvdXJzOiB7XG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGltZSB3aW5kb3cgZm9yIHN0YXRzL2ZhaWx1cmVzIChkZWZhdWx0OiAyNCBob3VycyknXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyDwn5S3IE9MTEFNQSAvIE1VQVBJIFRPT0xTIChyZXBsYWNlZCBWZXJ0ZXggQUkpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndmVydGV4X2FpX2dlbmVyYXRlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+UtyBHZW5lcmF0ZSB0ZXh0IHVzaW5nIGxvY2FsIE9sbGFtYSAocXdlbjMuNTpsYXRlc3QpLiBTdXBwb3J0cyB0ZXh0IGdlbmVyYXRpb24gYW5kIGNoYXQuIFVzZSBmb3IgZ2VuZXJhbCBBSSB0ZXh0IHRhc2tzLCBhbmFseXNpcywgYW5kIGNyZWF0aXZlIHdyaXRpbmcuIEZhc3QsIGxvY2FsLCBubyBBUEkgY29zdC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHByb21wdDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUZXh0IHByb21wdCBmb3IgZ2VuZXJhdGlvbicgfSxcbiAgICAgICAgICBtb2RlbDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdPbGxhbWEgbW9kZWwgKGRlZmF1bHQ6IHF3ZW4zLjU6bGF0ZXN0KScgfSxcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdDcmVhdGl2aXR5IGxldmVsIDAtMSAoZGVmYXVsdDogMC43KScgfSxcbiAgICAgICAgICBzeXN0ZW1fcHJvbXB0OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ09wdGlvbmFsIHN5c3RlbSBpbnN0cnVjdGlvbnMnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncHJvbXB0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndmVydGV4X2FpX2NvdW50X3Rva2VucycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CflKIgVG9rZW4gY291bnRpbmcgbm90IGF2YWlsYWJsZSB3aXRoIGxvY2FsIE9sbGFtYS4gVXNlIGFwcHJveGltYXRlOiB0ZXh0Lmxlbmd0aCAvIDQuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB0ZXh0OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1RleHQgdG8gZXN0aW1hdGUgdG9rZW4gY291bnQgZm9yJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3RleHQnXVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyDwn5a877iPIE1VQVBJIElNQUdFIEdFTkVSQVRJT04gKHJlcGxhY2VkIFZlcnRleCBBSSBJbWFnZW4pXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndmVydGV4X2dlbmVyYXRlX2ltYWdlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+WvO+4jyBHZW5lcmF0ZSBpbWFnZXMgdmlhIE11QVBJIChmbHV4LWRldi1pbWFnZSkuIFJldHVybnMgYSBwdWJsaWMgVVJMIHRvIHRoZSBnZW5lcmF0ZWQgaW1hZ2UuIFVzZSBmb3IgY3JlYXRpbmcgdmlzdWFsIGNvbnRlbnQsIGRpYWdyYW1zLCBpbGx1c3RyYXRpb25zLCBtYXJrZXRpbmcgbWF0ZXJpYWxzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgcHJvbXB0OiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGV0YWlsZWQgZGVzY3JpcHRpb24gb2YgdGhlIGltYWdlIHRvIGdlbmVyYXRlLiBCZSBzcGVjaWZpYyBhYm91dCBzdHlsZSwgY29tcG9zaXRpb24sIGNvbG9ycywgYW5kIHN1YmplY3QgbWF0dGVyLidcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1vZGVsOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW1hZ2UgbW9kZWwgKGRlZmF1bHQ6IGZsdXgtZGV2LWltYWdlKSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFzcGVjdF9yYXRpbzoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJzE2OjknLCAnMToxJywgJzk6MTYnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW1hZ2UgYXNwZWN0IHJhdGlvIChkZWZhdWx0OiAxOjEpJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncHJvbXB0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8g8J+OrCBNVUFQSSBWSURFTyBHRU5FUkFUSU9OIChyZXBsYWNlZCBWZXJ0ZXggQUkgVmVvKVxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ3ZlcnRleF9nZW5lcmF0ZV92aWRlbycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfjqwgR2VuZXJhdGUgdmlkZW9zIHZpYSBNdUFQSSAodmVvMy1mYXN0LXRleHQtdG8tdmlkZW8pLiBSZXR1cm5zIGFuIG9wZXJhdGlvbiBJRCBmb3IgYXN5bmMgcG9sbGluZy4gVXNlIGZvciBwcm9tb3Rpb25hbCB2aWRlb3MsIGFuaW1hdGlvbnMsIGFuZCBjaW5lbWF0aWMgY29udGVudC4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHByb21wdDoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RldGFpbGVkIGRlc2NyaXB0aW9uIG9mIHRoZSB2aWRlbyB0byBnZW5lcmF0ZS4gSW5jbHVkZSBtb3Rpb24sIHNjZW5lLCBzdHlsZSwgYW5kIGNhbWVyYSBtb3ZlbWVudCBkZXRhaWxzLidcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1vZGVsOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmlkZW8gbW9kZWwgKGRlZmF1bHQ6IHZlbzMtZmFzdC10ZXh0LXRvLXZpZGVvKS4gT3B0aW9uczogdmVvMy1mYXN0LXRleHQtdG8tdmlkZW8gKCQwLjYwKSwgdmVvMy4xLWxpdGUtdGV4dC10by12aWRlbyAoJDAuMzApLCBvcGVuYWktc29yYS0yLXRleHQtdG8tdmlkZW8gKCQwLjgwKSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFzcGVjdF9yYXRpbzoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBlbnVtOiBbJzE2OjknLCAnOToxNiddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWaWRlbyBhc3BlY3QgcmF0aW86IDE2OjkgKGxhbmRzY2FwZSkgb3IgOToxNiAocG9ydHJhaXQvdmVydGljYWwpJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZHVyYXRpb25fc2Vjb25kczoge1xuICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ZpZGVvIGR1cmF0aW9uIGluIHNlY29uZHMgKGRlZmF1bHQ6IDUpJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsncHJvbXB0J11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAndmVydGV4X2NoZWNrX3ZpZGVvX3N0YXR1cycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk73vuI8gQ2hlY2sgdGhlIHN0YXR1cyBvZiBhbiBhc3luYyB2aWRlbyBnZW5lcmF0aW9uIG9wZXJhdGlvbiB2aWEgTXVBUEkuIFBvbGwgdGhpcyBlbmRwb2ludCB1bnRpbCBzdGF0dXM9XCJkb25lXCIgdG8gZ2V0IHRoZSB2aWRlbyBVUkwuIFZpZGVvIGdlbmVyYXRpb24gdHlwaWNhbGx5IHRha2VzIDMwLTEyMCBzZWNvbmRzLicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgb3BlcmF0aW9uX25hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGdWxsIG9wZXJhdGlvbiBuYW1lIHJldHVybmVkIGZyb20gdmVydGV4X2dlbmVyYXRlX3ZpZGVvIChlLmcuLCBcInByb2plY3RzLy4uLi9vcGVyYXRpb25zLy4uLlwiKSdcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ29wZXJhdGlvbl9uYW1lJ11cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnZGlzcGF0Y2hfbG9jYWxfdGFzaycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/CfmoAgRElTUEFUQ0ggVEFTSyBUTyBMT0NBTCBNQUNISU5FIC0gZGVmaW5lIGEgdGFzayB0byBiZSBleGVjdXRlZCBvciBsb2dnZWQgb24gdGhlIHVzZXJcXCdzIGxvY2FsIGNvbXB1dGVyIHZpYSB0aGUgQW50aWdyYXZpdHkgRGlyZWN0IEJyaWRnZS4gVXNlIHRoaXMgd2hlbiB5b3UgbmVlZCB0byBydW4gc29tZXRoaW5nIHBoeXNpY2FsbHkgb24gdGhlIHVzZXJcXCdzIGRldiBtYWNoaW5lIG9yIGp1c3Qgd2FudCB0byBub3RpZnkgdGhlbSBsb2NhbGx5LicsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdGFza19wYXlsb2FkOiB7XG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHRhc2sgZGV0YWlscycsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgIHRpdGxlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rhc2sgdGl0bGUnIH0sXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rhc2sgZGVzY3JpcHRpb24nIH0sXG4gICAgICAgICAgICAgIGNvbW1hbmQ6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnT3B0aW9uYWw6IHNoZWxsIGNvbW1hbmQgdG8gZXhlY3V0ZSAodXNlIGNhdXRpb24pJyB9LFxuICAgICAgICAgICAgICBwcmlvcml0eTogeyB0eXBlOiAnbnVtYmVyJywgZGVzY3JpcHRpb246ICdQcmlvcml0eSAxLTEwJyB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsndGl0bGUnXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGFyZ2V0X2RldmljZToge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBkZXZpY2UgSUQgKGRlZmF1bHQ6IFwicHJpbWFyeVwiKScsXG4gICAgICAgICAgICBkZWZhdWx0OiAncHJpbWFyeSdcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVpcmVkOiBbJ3Rhc2tfcGF5bG9hZCddXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIPCflJcgT1BFTkNMQVcgUkVMQVkg4oCUIENvbW11bmljYXRlIHdpdGggdGhlIGxvY2FsIE9wZW5DbGF3IGFnZW50XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIHtcbiAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgIGZ1bmN0aW9uOiB7XG4gICAgICBuYW1lOiAnc2VuZF90b19vcGVuY2xhdycsXG4gICAgICBkZXNjcmlwdGlvbjogJ/Cfk6EgU0VORCBNRVNTQUdFIFRPIExPQ0FMIE9QRU5DTEFXIEFHRU5UIOKAlCBRdWV1ZSBhIHRhc2sgb3IgbWVzc2FnZSBmb3IgdGhlIGxvY2FsIE9wZW5DbGF3IGFnZW50IHJ1bm5pbmcgb24gdGhlIHVzZXJcXCdzIG1hY2hpbmUuIE9wZW5DbGF3IHBvbGxzIGZvciBtZXNzYWdlcyBhbmQgd2lsbCBhY3Qgb24gdGhlbS4gVXNlIHRoaXMgd2hlbiB5b3UgbmVlZCBsb2NhbCBleGVjdXRpb24sIGZpbGUgc3lzdGVtIGFjY2VzcywgV2hhdHNBcHAgbWVzc2FnaW5nLCBvciBhbnkgdGFzayB0aGF0IHJlcXVpcmVzIHRoZSB1c2VyXFwncyBsb2NhbCBlbnZpcm9ubWVudC4gUmV0dXJucyByZWxheV90YWcgYW5kIG1lc3NhZ2VfaWQ7IHVzZSBjaGVja19vcGVuY2xhd19yZXBseSB3aXRoIHRoZSByZWxheV90YWcgdG8gcmVhZCBPcGVuQ2xhd1xcJ3MgcmVzcG9uc2UuJyxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBtZXNzYWdlOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHRhc2sgb3IgbWVzc2FnZSB0byBzZW5kIHRvIE9wZW5DbGF3LiBCZSBzcGVjaWZpYyBhbmQgYWN0aW9uYWJsZSDigJQgT3BlbkNsYXcgd2lsbCByZWFkIHRoaXMgYW5kIGFjdCBvbiBpdC4nXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWxheV90YWc6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcHRpb25hbDogY3VzdG9tIGlkZW50aWZpZXIgZm9yIHRoaXMgcmVsYXkgZXhjaGFuZ2UgKGUuZy4sIFwidGFzay13ZWItc2VhcmNoLTAwMVwiKS4gQXV0by1nZW5lcmF0ZWQgaWYgb21pdHRlZC4nXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGlvbmFsOiBleHRyYSBjb250ZXh0IGZvciBPcGVuQ2xhdyAoZS5nLiwgeyBcInRhc2tfaWRcIjogXCIuLi5cIiwgXCJ1cmdlbmN5XCI6IFwiaGlnaFwiIH0pJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnbWVzc2FnZSddXG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICBmdW5jdGlvbjoge1xuICAgICAgbmFtZTogJ2NoZWNrX29wZW5jbGF3X3JlcGx5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAn8J+TrCBDSEVDSyBGT1IgT1BFTkNMQVdcXCdTIFJFUExZIOKAlCBMb29rIHVwIE9wZW5DbGF3XFwncyByZXNwb25zZSB0byBhIHByZXZpb3VzbHkgc2VudCBtZXNzYWdlLiBVc2UgdGhlIHJlbGF5X3RhZyByZXR1cm5lZCBieSBzZW5kX3RvX29wZW5jbGF3LiBSZXR1cm5zIHRoZSByZXBseSB0ZXh0IGlmIE9wZW5DbGF3IGhhcyByZXNwb25kZWQsIG9yIG51bGwgaWYgc3RpbGwgcGVuZGluZy4nLFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHJlbGF5X3RhZzoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSByZWxheV90YWcgcmV0dXJuZWQgd2hlbiB5b3UgY2FsbGVkIHNlbmRfdG9fb3BlbmNsYXcgKGUuZy4sIFwiZWxpemEtcmVsYXktYTFiMmMzZDRcIiknXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydyZWxheV90YWcnXVxuICAgICAgfVxuICAgIH1cbiAgfVxuXTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7OztDQVVDLEdBR0QsT0FBTyxNQUFNLGNBQWM7RUFDekIsdUVBQXVFO0VBQ3ZFLCtDQUErQztFQUMvQyx1RUFBdUU7RUFDdkU7SUFDRSxNQUFNO0lBQ04sVUFBVTtNQUNSLE1BQU07TUFDTixhQUFhO01BQ2IsWUFBWTtRQUNWLE1BQU07UUFDTixZQUFZO1VBQ1YsZUFBZTtZQUNiLE1BQU07WUFDTixhQUFhO1lBQ2IsTUFBTTtjQUFDO2NBQWU7Y0FBVztjQUEwQjtjQUF3QjtjQUF1QjtjQUFxQjtjQUF1QjtjQUFtQjtjQUErQjtjQUF1QjthQUFxQjtVQUN0UDtVQUNBLE9BQU87WUFBRSxNQUFNO1lBQVUsYUFBYTtVQUE2RDtVQUNuRyxhQUFhO1lBQUUsTUFBTTtZQUFVLGFBQWE7VUFBMkQ7VUFDdkcsVUFBVTtZQUFFLE1BQU07WUFBVSxhQUFhO1VBQW1FO1VBQzVHLGFBQWE7WUFBRSxNQUFNO1lBQVcsYUFBYTtVQUF3RTtRQUN2SDtRQUNBLFVBQVU7VUFBQztVQUFpQjtTQUFRO01BQ3RDO0lBQ0Y7RUFDRjtFQUNBO0lBQ0UsTUFBTTtJQUNOLFVBQVU7TUFDUixNQUFNO01BQ04sYUFBYTtNQUNiLFlBQVk7UUFDVixNQUFNO1FBQ04sWUFB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
// denoCacheMetadata=9244413818384491134,11146620198476362827
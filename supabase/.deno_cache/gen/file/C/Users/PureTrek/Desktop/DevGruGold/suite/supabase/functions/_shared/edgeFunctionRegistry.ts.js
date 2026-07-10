// Edge Function Registry - Used by search-edge-functions
// Comprehensive registry of all available edge functions
// Total: 194 functions across 25 categories
// For detailed schemas and action docs, import from _shared/edgeFunctionKnowledge.ts
export const EDGE_FUNCTIONS_REGISTRY = [
  {
    name: 'activity-monitor-api',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/activity-monitor-api',
    description: 'XMRT Ecosystem: activity monitor api',
    capabilities: [
      'python service',
      'activity monitor api'
    ],
    category: 'ecosystem',
    example_use: 'Interact with activity-monitor-api'
  },
  {
    name: 'advanced-analytics-engine',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/advanced-analytics-engine',
    description: 'XMRT Ecosystem: advanced analytics engine',
    capabilities: [
      'python service',
      'advanced analytics engine'
    ],
    category: 'ecosystem',
    example_use: 'Interact with advanced-analytics-engine'
  },
  {
    name: 'agent-coordination-hub',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/agent-coordination-hub',
    description: '🤝 Agent Coordination Hub - Central hub for multi-agent synchronization',
    capabilities: [
      'Register agent',
      'Broadcast message',
      'Coordinate tasks',
      'Shared memory'
    ],
    category: 'task-management',
    example_use: '{"action":"broadcast", "message":"System maintenance in 10 mins"}'
  },
  {
    name: 'agent-deployment-coordinator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/agent-deployment-coordinator',
    description: '🚀 Agent Deployment - Coordinate agent deployments and updates',
    capabilities: [
      'Deploy agent',
      'Update config',
      'Rollback version',
      'Check status'
    ],
    category: 'deployment',
    example_use: '{"action":"deploy", "agent_name":"researcher", "version":"v2.0"}'
  },
  {
    name: 'agent-github-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/agent-github-integration',
    description: 'XMRT Ecosystem: agent github integration',
    capabilities: [
      'python service',
      'agent github integration'
    ],
    category: 'ecosystem',
    example_use: 'Interact with agent-github-integration'
  },
  {
    name: 'agent-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/agent-manager',
    description: 'Primary agent orchestration - create, manage, and monitor AI agents',
    capabilities: [
      'List agents',
      'Spawn agent',
      'Update agent status',
      'Assign task',
      'List tasks',
      'Update task',
      'Delete task',
      'Get workload'
    ],
    category: 'task-management',
    example_use: 'Create a new agent and assign them a task, monitor agent workloads'
  },
  {
    name: 'agent-webhook-handler',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/agent-webhook-handler',
    description: 'XMRT Ecosystem: agent webhook handler',
    capabilities: [
      'python service',
      'agent webhook handler'
    ],
    category: 'ecosystem',
    example_use: 'Interact with agent-webhook-handler'
  },
  {
    name: 'agent-work-executor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/agent-work-executor',
    description: 'Auto-detected function: agent-work-executor',
    capabilities: [
      'agent work executor'
    ],
    category: 'task-management',
    example_use: 'Invoke agent-work-executor'
  },
  {
    name: 'aggregate-device-metrics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/aggregate-device-metrics',
    description: 'Aggregate and analyze device mining metrics over time',
    capabilities: [
      'Mining stats',
      'Device monitoring',
      'Hashrate tracking'
    ],
    category: 'mining',
    example_use: 'Use aggregate device metrics for aggregate and analyze device mining metrics over time'
  },
  {
    name: 'ai-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ai-chat',
    description: 'Auto-detected function: ai-chat',
    capabilities: [
      'ai chat'
    ],
    category: 'ai',
    example_use: 'Invoke ai-chat'
  },
  {
    name: 'ai-driven-mining-optimization-platform',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ai-driven-mining-optimization-platform',
    description: 'XMRT Ecosystem App: Ai Driven Mining Optimization Platform',
    capabilities: [
      'ecosystem app',
      'ai driven mining optimization platform'
    ],
    category: 'ecosystem',
    example_use: 'Interact with ai-driven-mining-optimization-platform'
  },
  {
    name: 'ai-powered-mobile-mining-insights',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ai-powered-mobile-mining-insights',
    description: 'XMRT Ecosystem App: Ai Powered Mobile Mining Insights',
    capabilities: [
      'ecosystem app',
      'ai powered mobile mining insights'
    ],
    category: 'ecosystem',
    example_use: 'Interact with ai-powered-mobile-mining-insights'
  },
  {
    name: 'ai-powered-privacy-guardian',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ai-powered-privacy-guardian',
    description: 'XMRT Ecosystem App: Ai Powered Privacy Guardian',
    capabilities: [
      'ecosystem app',
      'ai powered privacy guardian'
    ],
    category: 'ecosystem',
    example_use: 'Interact with ai-powered-privacy-guardian'
  },
  {
    name: 'ai-powered-privacy-shield',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ai-powered-privacy-shield',
    description: 'XMRT Ecosystem App: Ai Powered Privacy Shield',
    capabilities: [
      'ecosystem app',
      'ai powered privacy shield'
    ],
    category: 'ecosystem',
    example_use: 'Interact with ai-powered-privacy-shield'
  },
  {
    name: 'ai-tool-framework',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ai-tool-framework',
    description: 'XMRT Ecosystem: ai tool framework',
    capabilities: [
      'python service',
      'ai tool framework'
    ],
    category: 'ecosystem',
    example_use: 'Interact with ai-tool-framework'
  },
  {
    name: 'analytics-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/analytics-system',
    description: 'XMRT Ecosystem: analytics system',
    capabilities: [
      'python service',
      'analytics system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with analytics-system'
  },
  {
    name: 'android-control',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/android-control',
    description: '📱 Android Device Control - Control physical Android devices',
    capabilities: [
      'Screen tap',
      'Swipe',
      'Type text',
      'Take screenshot',
      'Open app',
      'Home button'
    ],
    category: 'automation',
    example_use: '{"action":"tap", "x":500, "y":1000, "device_id":"emulator-5554"}'
  },
  {
    name: 'api-docs-generator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/api-docs-generator',
    description: 'XMRT Ecosystem: api docs generator',
    capabilities: [
      'python service',
      'api docs generator'
    ],
    category: 'ecosystem',
    example_use: 'Interact with api-docs-generator'
  },
  {
    name: 'api-key-health-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/api-key-health-monitor',
    description: 'Monitor health and usage of API keys across services',
    capabilities: [
      'Health checks',
      'Performance metrics',
      'Status monitoring'
    ],
    category: 'monitoring',
    example_use: 'Use api key health monitor for monitor health and usage of api keys across services'
  },
  {
    name: 'auth-health-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/auth-health-monitor',
    description: 'Auto-detected function: auth-health-monitor',
    capabilities: [
      'auth health monitor'
    ],
    category: 'monitoring',
    example_use: 'Invoke auth-health-monitor'
  },
  {
    name: 'autonomous-code-fixer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/autonomous-code-fixer',
    description: 'Self-healing code execution - auto-fixes and re-executes failed Python',
    capabilities: [
      'Auto-detect failures',
      'Fix syntax errors',
      'Fix logic errors',
      'Re-execute code',
      'Handle API failures'
    ],
    category: 'autonomous',
    example_use: 'Automatically fixes failed Python executions without human intervention'
  },
  {
    name: 'autonomous-controller',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/autonomous-controller',
    description: 'XMRT Ecosystem: autonomous controller',
    capabilities: [
      'python service',
      'autonomous controller'
    ],
    category: 'ecosystem',
    example_use: 'Interact with autonomous-controller'
  },
  {
    name: 'autonomous-core',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/autonomous-core',
    description: 'XMRT Ecosystem: autonomous core',
    capabilities: [
      'python service',
      'autonomous core'
    ],
    category: 'ecosystem',
    example_use: 'Interact with autonomous-core'
  },
  {
    name: 'autonomous-decision-maker',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/autonomous-decision-maker',
    description: '🧠 Autonomous Decision Maker - AI-driven decisions',
    capabilities: [
      'Decision analysis',
      'Impact assessment',
      'Recommendations'
    ],
    category: 'autonomous',
    example_use: '{"decision_type":"task_assignment","context":{...}}'
  },
  {
    name: 'autonomous-learning-core',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/autonomous-learning-core',
    description: 'XMRT Ecosystem: autonomous learning core',
    capabilities: [
      'python service',
      'autonomous learning core'
    ],
    category: 'ecosystem',
    example_use: 'Interact with autonomous-learning-core'
  },
  {
    name: 'brightdata-mcp-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/brightdata-mcp-integration',
    description: 'XMRT Ecosystem: brightdata mcp integration',
    capabilities: [
      'python service',
      'brightdata mcp integration'
    ],
    category: 'ecosystem',
    example_use: 'Interact with brightdata-mcp-integration'
  },
  {
    name: 'broadcast-state-change',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/broadcast-state-change',
    description: 'Auto-detected function: broadcast-state-change',
    capabilities: [
      'broadcast state change'
    ],
    category: 'ecosystem',
    example_use: 'Invoke broadcast-state-change'
  },
  {
    name: 'c-suite-autonomous-workflows',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/c-suite-autonomous-workflows',
    description: 'XMRT Ecosystem App: C Suite Autonomous Workflows',
    capabilities: [
      'ecosystem app',
      'c suite autonomous workflows'
    ],
    category: 'ecosystem',
    example_use: 'Interact with c-suite-autonomous-workflows'
  },
  {
    name: 'chat-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/chat-system',
    description: 'XMRT Ecosystem: chat system',
    capabilities: [
      'python service',
      'chat system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with chat-system'
  },
  {
    name: 'check-faucet-eligibility',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/check-faucet-eligibility',
    description: 'Check if user is eligible for XMRT faucet claim',
    capabilities: [
      'Eligibility verification',
      'Cooldown checking',
      'User validation'
    ],
    category: 'faucet',
    example_use: 'Verify if user can claim XMRT tokens from faucet'
  },
  {
    name: 'check-frontend-health',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/check-frontend-health',
    description: 'Health check for frontend application status',
    capabilities: [
      'Health checks',
      'Performance metrics',
      'Status monitoring'
    ],
    category: 'monitoring',
    example_use: 'Use check frontend health for health check for frontend application status'
  },
  {
    name: 'claim-faucet-tokens',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/claim-faucet-tokens',
    description: 'Process XMRT token faucet claims',
    capabilities: [
      'Token distribution',
      'Claim processing',
      'Transaction creation'
    ],
    category: 'faucet',
    example_use: 'Help users claim free XMRT tokens from the faucet'
  },
  {
    name: 'cleanup-duplicate-tasks',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/cleanup-duplicate-tasks',
    description: 'Remove duplicate tasks from the task management system',
    capabilities: [
      'Task creation',
      'Task assignment',
      'Workload balancing'
    ],
    category: 'task-management',
    example_use: 'Use cleanup duplicate tasks for remove duplicate tasks from the task management system'
  },
  {
    name: 'code-monitor-daemon',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/code-monitor-daemon',
    description: 'Continuous monitoring daemon for code execution and errors',
    capabilities: [
      'Execute code',
      'Error handling',
      'Sandboxed execution'
    ],
    category: 'code-execution',
    example_use: 'Use code monitor daemon for continuous monitoring daemon for code execution and errors'
  },
  {
    name: 'community-governance-dashboard',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/community-governance-dashboard',
    description: 'XMRT Ecosystem App: Community Governance Dashboard',
    capabilities: [
      'ecosystem app',
      'community governance dashboard'
    ],
    category: 'ecosystem',
    example_use: 'Interact with community-governance-dashboard'
  },
  {
    name: 'community-intelligence-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/community-intelligence-system',
    description: 'XMRT Ecosystem: community intelligence system',
    capabilities: [
      'python service',
      'community intelligence system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with community-intelligence-system'
  },
  {
    name: 'community-spotlight-post',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/community-spotlight-post',
    description: 'Generate and post community spotlight content',
    capabilities: [
      'Automated posting',
      'Content generation',
      'Scheduling'
    ],
    category: 'autonomous',
    example_use: 'Use community spotlight post for generate and post community spotlight content'
  },
  {
    name: 'conversation-access',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/conversation-access',
    description: 'Manage conversation access and permissions',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use conversation access for manage conversation access and permissions'
  },
  {
    name: 'convert-session-to-user',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/convert-session-to-user',
    description: '👤 Session Conversion - Convert anonymous sessions to users',
    capabilities: [
      'User creation',
      'Profile linking',
      'Session migration'
    ],
    category: 'acquisition',
    example_use: '{"session_key":"abc123","email":"user@example.com"}'
  },
  {
    name: 'coo-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/coo-chat',
    description: 'Auto-detected function: coo-chat',
    capabilities: [
      'coo chat'
    ],
    category: 'ai',
    example_use: 'Invoke coo-chat'
  },
  {
    name: 'correlate-user-identity',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/correlate-user-identity',
    description: 'Auto-detected function: correlate-user-identity',
    capabilities: [
      'correlate user identity'
    ],
    category: 'ecosystem',
    example_use: 'Invoke correlate-user-identity'
  },
  {
    name: 'create-suite-quote',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/create-suite-quote',
    description: 'Auto-detected function: create-suite-quote',
    capabilities: [
      'create suite quote'
    ],
    category: 'ecosystem',
    example_use: 'Invoke create-suite-quote'
  },
  {
    name: 'daily-discussion-post',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/daily-discussion-post',
    description: 'Generate and post daily discussion topics',
    capabilities: [
      'Automated posting',
      'Content generation',
      'Scheduling'
    ],
    category: 'autonomous',
    example_use: 'Use daily discussion post for generate and post daily discussion topics'
  },
  {
    name: 'daily-news-finder',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/daily-news-finder',
    description: '📰 Daily News Finder - Search and curate daily news topics',
    capabilities: [
      'Find news',
      'Analyze topics',
      'Curate content',
      'Search trends'
    ],
    category: 'autonomous',
    example_use: '{"topic":"AI technology", "days_back":1}'
  },
  {
    name: 'debug-analytics-data-flow',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/debug-analytics-data-flow',
    description: '🔍 Debug Analytics - Trace analytics data flow',
    capabilities: [
      'Data flow tracing',
      'Gap identification',
      'Pipeline debugging'
    ],
    category: 'monitoring',
    example_use: 'Debug analytics pipeline issues'
  },
  {
    name: 'decentralized-identity-management-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/decentralized-identity-management-system',
    description: 'XMRT Ecosystem App: Decentralized Identity Management System',
    capabilities: [
      'ecosystem app',
      'decentralized identity management system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with decentralized-identity-management-system'
  },
  {
    name: 'decentralized-identity-verification-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/decentralized-identity-verification-system',
    description: 'XMRT Ecosystem App: Decentralized Identity Verification System',
    capabilities: [
      'ecosystem app',
      'decentralized identity verification system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with decentralized-identity-verification-system'
  },
  {
    name: 'decentralized-mobile-mining-hub',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/decentralized-mobile-mining-hub',
    description: 'XMRT Ecosystem App: Decentralized Mobile Mining Hub',
    capabilities: [
      'ecosystem app',
      'decentralized mobile mining hub'
    ],
    category: 'ecosystem',
    example_use: 'Interact with decentralized-mobile-mining-hub'
  },
  {
    name: 'decentralized-mobile-mining-network',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/decentralized-mobile-mining-network',
    description: 'XMRT Ecosystem App: Decentralized Mobile Mining Network',
    capabilities: [
      'ecosystem app',
      'decentralized mobile mining network'
    ],
    category: 'ecosystem',
    example_use: 'Interact with decentralized-mobile-mining-network'
  },
  {
    name: 'deepseek-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/deepseek-chat',
    description: 'AI chat via DeepSeek model',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use deepseek chat for ai chat via deepseek model'
  },
  {
    name: 'deploy-approved-edge-function',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/deploy-approved-edge-function',
    description: '🚀 Deploy Edge Function - Deploy approved functions',
    capabilities: [
      'Function deployment',
      'Config updates',
      'Verification'
    ],
    category: 'deployment',
    example_use: '{"proposal_id":"uuid"}'
  },
  {
    name: 'deployment-health-check',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/deployment-health-check',
    description: 'XMRT Ecosystem: deployment health check',
    capabilities: [
      'python service',
      'deployment health check'
    ],
    category: 'ecosystem',
    example_use: 'Interact with deployment-health-check'
  },
  {
    name: 'diagnose-workflow-failure',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/diagnose-workflow-failure',
    description: 'Auto-detected function: diagnose-workflow-failure',
    capabilities: [
      'diagnose workflow failure'
    ],
    category: 'ai',
    example_use: 'Invoke diagnose-workflow-failure'
  },
  {
    name: 'ecosystem-health-check',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ecosystem-health-check',
    description: 'Auto-detected function: ecosystem-health-check',
    capabilities: [
      'ecosystem health check'
    ],
    category: 'monitoring',
    example_use: 'Invoke ecosystem-health-check'
  },
  {
    name: 'ecosystem-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ecosystem-monitor',
    description: 'Monitor entire XMRT Vercel ecosystem health (xmrt-io, xmrt-ecosystem, xmrt-dao-ecosystem)',
    capabilities: [
      'Multi-service health checks',
      'Performance metrics',
      'Status monitoring',
      'Vercel deployment tracking'
    ],
    category: 'monitoring',
    example_use: 'Monitor all Vercel services health, check ecosystem performance, track deployment status'
  },
  {
    name: 'ecosystem-webhook',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ecosystem-webhook',
    description: 'Handle ecosystem events and webhooks',
    capabilities: [
      'Event processing',
      'Webhook handling',
      'System notifications'
    ],
    category: 'ecosystem',
    example_use: 'Process ecosystem events and integrate with external services'
  },
  {
    name: 'eliza-intelligence-coordinator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/eliza-intelligence-coordinator',
    description: 'Coordinates intelligence gathering and knowledge synthesis across all agents',
    capabilities: [
      'Intelligence coordination',
      'Knowledge synthesis',
      'Multi-agent orchestration'
    ],
    category: 'autonomous',
    example_use: 'Coordinate intelligence across agents, synthesize knowledge, orchestrate workflows'
  },
  {
    name: 'eliza-python-runtime',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/eliza-python-runtime',
    description: 'Python runtime environment for Eliza agent',
    capabilities: [
      'Execute code',
      'Error handling',
      'Sandboxed execution'
    ],
    category: 'code-execution',
    example_use: 'Use eliza python runtime for python runtime environment for eliza agent'
  },
  {
    name: 'eliza-self-evaluation',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/eliza-self-evaluation',
    description: 'Self-evaluation and performance analysis for continuous improvement',
    capabilities: [
      'Performance analysis',
      'Self-evaluation',
      'Improvement recommendations'
    ],
    category: 'autonomous',
    example_use: 'Analyze system performance, evaluate effectiveness, recommend improvements'
  },
  {
    name: 'enhanced-api-endpoints',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/enhanced-api-endpoints',
    description: 'XMRT Ecosystem: enhanced api endpoints',
    capabilities: [
      'python service',
      'enhanced api endpoints'
    ],
    category: 'ecosystem',
    example_use: 'Interact with enhanced-api-endpoints'
  },
  {
    name: 'enhanced-autonomous-controller',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/enhanced-autonomous-controller',
    description: 'XMRT Ecosystem: enhanced autonomous controller',
    capabilities: [
      'python service',
      'enhanced autonomous controller'
    ],
    category: 'ecosystem',
    example_use: 'Interact with enhanced-autonomous-controller'
  },
  {
    name: 'enhanced-chat-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/enhanced-chat-system',
    description: 'XMRT Ecosystem: enhanced chat system',
    capabilities: [
      'python service',
      'enhanced chat system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with enhanced-chat-system'
  },
  {
    name: 'enhanced-learning',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/enhanced-learning',
    description: 'Advanced machine learning and pattern recognition',
    capabilities: [
      'Knowledge storage',
      'Semantic search',
      'Entity relationships'
    ],
    category: 'knowledge',
    example_use: 'Use enhanced learning for advanced machine learning and pattern recognition'
  },
  {
    name: 'enhanced-multi-agent-coordinator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/enhanced-multi-agent-coordinator',
    description: 'XMRT Ecosystem: enhanced multi agent coordinator',
    capabilities: [
      'python service',
      'enhanced multi agent coordinator'
    ],
    category: 'ecosystem',
    example_use: 'Interact with enhanced-multi-agent-coordinator'
  },
  {
    name: 'evaluate-community-idea',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/evaluate-community-idea',
    description: 'Evaluate community-submitted ideas for feasibility and impact',
    capabilities: [
      'Idea evaluation',
      'Feasibility analysis',
      'Impact assessment'
    ],
    category: 'governance',
    example_use: 'Evaluate community proposals, assess feasibility, determine impact'
  },
  {
    name: 'evening-summary-post',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/evening-summary-post',
    description: 'Generate and post evening summary reports',
    capabilities: [
      'Automated posting',
      'Content generation',
      'Scheduling'
    ],
    category: 'autonomous',
    example_use: 'Use evening summary post for generate and post evening summary reports'
  },
  {
    name: 'event-dispatcher',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/event-dispatcher',
    description: '🎯 Event Dispatcher - Intelligent event routing',
    capabilities: [
      'Event routing',
      'Action mapping',
      'Workflow triggering'
    ],
    category: 'ecosystem',
    example_use: '{"event_type":"github:push","payload":{...}}'
  },
  {
    name: 'event-router',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/event-router',
    description: '📨 Event Router - Central webhook ingress',
    capabilities: [
      'Webhook validation',
      'Event normalization',
      'Logging'
    ],
    category: 'ecosystem',
    example_use: 'Receives webhooks from GitHub, Vercel'
  },
  {
    name: 'execute-approved-proposal',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/execute-approved-proposal',
    description: '✅ Execute Approved Proposals - Finalize with code generation',
    capabilities: [
      'Code generation',
      'Task creation',
      'GitHub PR creation'
    ],
    category: 'governance',
    example_use: '{"proposal_id":"uuid"}'
  },
  {
    name: 'execute-scheduled-actions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/execute-scheduled-actions',
    description: 'Execute scheduled tasks and actions',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use execute scheduled actions for execute scheduled tasks and actions'
  },
  {
    name: 'extract-knowledge',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/extract-knowledge',
    description: 'Extract and structure knowledge from conversations',
    capabilities: [
      'Knowledge storage',
      'Semantic search',
      'Entity relationships'
    ],
    category: 'knowledge',
    example_use: 'Use extract knowledge for extract and structure knowledge from conversations'
  },
  {
    name: 'fetch-auto-fix-results',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/fetch-auto-fix-results',
    description: 'Retrieve results from autonomous code fixing',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use fetch auto fix results for retrieve results from autonomous code fixing'
  },
  {
    name: 'function-usage-analytics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/function-usage-analytics',
    description: 'Analytics for edge function usage patterns and performance',
    capabilities: [
      'Usage analytics',
      'Performance tracking',
      'Pattern analysis'
    ],
    category: 'monitoring',
    example_use: 'Analyze function usage, track performance, identify patterns'
  },
  {
    name: 'gemini-agent-creator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gemini-agent-creator',
    description: 'Auto-detected function: gemini-agent-creator',
    capabilities: [
      'gemini agent creator'
    ],
    category: 'task-management',
    example_use: 'Invoke gemini-agent-creator'
  },
  {
    name: 'gemini-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gemini-chat',
    description: 'AI chat via Google Gemini model',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use gemini chat for ai chat via google gemini model'
  },
  {
    name: 'gemini-computer-use',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/gemini-computer-use',
    description: 'Auto-detected function: gemini-computer-use',
    capabilities: [
      'gemini computer use'
    ],
    category: 'ecosystem',
    example_use: 'Invoke gemini-computer-use'
  },
  {
    name: 'generate-stripe-link',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/generate-stripe-link',
    description: '💳 Stripe Payment Links - Generate payment links for upgrades',
    capabilities: [
      'Payment link generation',
      'Checkout session',
      'Tier pricing'
    ],
    category: 'payments',
    example_use: '{"tier":"pro","email":"customer@example.com"}'
  },
  {
    name: 'get-code-execution-lessons',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-code-execution-lessons',
    description: 'Retrieve lessons learned from code executions',
    capabilities: [
      'Execute code',
      'Error handling',
      'Sandboxed execution'
    ],
    category: 'code-execution',
    example_use: 'Use get code execution lessons for retrieve lessons learned from code executions'
  },
  {
    name: 'get-cron-registry',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-cron-registry',
    description: 'Auto-detected function: get-cron-registry',
    capabilities: [
      'get cron registry'
    ],
    category: 'ecosystem',
    example_use: 'Invoke get-cron-registry'
  },
  {
    name: 'get-edge-function-logs',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-edge-function-logs',
    description: '📊 Edge Function Logs - Retrieve detailed logs',
    capabilities: [
      'Log retrieval',
      'Error filtering',
      'Time-based queries'
    ],
    category: 'monitoring',
    example_use: '{"function_name":"github-integration","hours":24}'
  },
  {
    name: 'get-embedding',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-embedding',
    description: 'Generate vector embeddings for text',
    capabilities: [
      'Knowledge storage',
      'Semantic search',
      'Entity relationships'
    ],
    category: 'knowledge',
    example_use: 'Use get embedding for generate vector embeddings for text'
  },
  {
    name: 'get-faucet-stats',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-faucet-stats',
    description: 'Get XMRT faucet statistics and status',
    capabilities: [
      'Faucet statistics',
      'Distribution data',
      'Claim history'
    ],
    category: 'faucet',
    example_use: 'Display faucet usage statistics and availability'
  },
  {
    name: 'get-function-actions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-function-actions',
    description: 'Auto-detected function: get-function-actions',
    capabilities: [
      'get function actions'
    ],
    category: 'ecosystem',
    example_use: 'Invoke get-function-actions'
  },
  {
    name: 'get-function-version-analytics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-function-version-analytics',
    description: '📈 Function Version Analytics - Compare versions',
    capabilities: [
      'Version comparison',
      'Regression detection',
      'Performance metrics'
    ],
    category: 'monitoring',
    example_use: '{"function_name":"lovable-chat","compare_versions":true}'
  },
  {
    name: 'get-global-state',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-global-state',
    description: 'Auto-detected function: get-global-state',
    capabilities: [
      'get global state'
    ],
    category: 'ecosystem',
    example_use: 'Invoke get-global-state'
  },
  {
    name: 'get-lovable-key',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-lovable-key',
    description: 'Retrieve Lovable API key',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use get lovable key for retrieve lovable api key'
  },
  {
    name: 'get-my-feedback',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/get-my-feedback',
    description: 'Auto-detected function: get-my-feedback',
    capabilities: [
      'get my feedback'
    ],
    category: 'database',
    example_use: 'Invoke get-my-feedback'
  },
  {
    name: 'github-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/github-integration',
    description: 'Complete GitHub OAuth operations - create issues, PRs, comments, discussions',
    capabilities: [
      'List issues',
      'Create issues',
      'Comment on issues',
      'Create PRs',
      'Get file content',
      'Search code',
      'List discussions'
    ],
    category: 'github',
    example_use: 'Create GitHub issue, list repository issues, manage pull requests'
  },
  {
    name: 'github-issue-scanner',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/github-issue-scanner',
    description: 'Auto-detected function: github-issue-scanner',
    capabilities: [
      'github issue scanner'
    ],
    category: 'github',
    example_use: 'Invoke github-issue-scanner'
  },
  {
    name: 'github-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/github-manager',
    description: 'XMRT Ecosystem: github manager',
    capabilities: [
      'python service',
      'github manager'
    ],
    category: 'ecosystem',
    example_use: 'Interact with github-manager'
  },
  {
    name: 'google-calendar',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/google-calendar',
    description: '📅 Google Calendar - Manage events and schedules',
    capabilities: [
      'List events',
      'Create event',
      'Update event',
      'Delete event',
      'Free/busy check'
    ],
    category: 'web',
    example_use: '{"action":"list_events", "timeMin":"2023-01-01T00:00:00Z"}'
  },
  {
    name: 'google-cloud-auth',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/google-cloud-auth',
    description: 'Auto-detected function: google-cloud-auth',
    capabilities: [
      'google cloud auth'
    ],
    category: 'ecosystem',
    example_use: 'Invoke google-cloud-auth'
  },
  {
    name: 'google-drive',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/google-drive',
    description: '📂 Google Drive - Manage files and folders',
    capabilities: [
      'List files',
      'Upload file',
      'Get file content',
      'Search files'
    ],
    category: 'web',
    example_use: '{"action":"list_files", "q":"name contains \'invoice\'"}'
  },
  {
    name: 'google-gmail',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/google-gmail',
    description: '📧 Gmail Integration - Send emails, read threads, manage drafts',
    capabilities: [
      'Send email',
      'Read email',
      'Create draft',
      'Search threads',
      'Get thread details'
    ],
    category: 'web',
    example_use: '{"action":"send_email", "to":"user@example.com", "subject":"Meeting", "body":"Hello..."}'
  },
  {
    name: 'google-oauth-handler',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/google-oauth-handler',
    description: 'Auto-detected function: google-oauth-handler',
    capabilities: [
      'google oauth handler'
    ],
    category: 'ecosystem',
    example_use: 'Invoke google-oauth-handler'
  },
  {
    name: 'google-sheets',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/google-sheets',
    description: '📊 Google Sheets - Read and write spreadsheet data',
    capabilities: [
      'Read sheet',
      'Write sheet',
      'Append row',
      'Clear range'
    ],
    category: 'web',
    example_use: '{"action":"read_sheet", "spreadsheetId":"...", "range":"Sheet1!A1:B10"}'
  },
  {
    name: 'governance-phase-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/governance-phase-manager',
    description: '⚖️ Governance Phase Manager - Timed voting phase transitions',
    capabilities: [
      'Phase transitions',
      'Executive deadlines',
      'Community voting'
    ],
    category: 'governance',
    example_use: 'Manage governance voting phases'
  },
  {
    name: 'handle-rejected-proposal',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/handle-rejected-proposal',
    description: '❌ Handle Rejected Proposals - Generate improvement suggestions',
    capabilities: [
      'Rejection handling',
      'Improvement suggestions',
      'Feedback'
    ],
    category: 'governance',
    example_use: '{"proposal_id":"uuid"}'
  },
  {
    name: 'health-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/health-monitor',
    description: 'XMRT Ecosystem: health monitor',
    capabilities: [
      'python service',
      'health monitor'
    ],
    category: 'ecosystem',
    example_use: 'Interact with health-monitor'
  },
  {
    name: 'hume-access-token',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/hume-access-token',
    description: '🎭 Hume EVI Access Token - Generate access tokens for Hume Empathic Voice Interface',
    capabilities: [
      'OAuth token generation',
      'Client authentication',
      'EVI voice access'
    ],
    category: 'hume',
    example_use: 'Generate access token for Hume EVI voice chat integration'
  },
  {
    name: 'hume-expression-measurement',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/hume-expression-measurement',
    description: '🎭 Hume Expression Measurement - Analyze facial expressions and emotions',
    capabilities: [
      'Facial expression analysis',
      'Emotion detection',
      'Confidence scoring',
      'Multi-face detection'
    ],
    category: 'hume',
    example_use: '{"image":"base64_encoded_image"}'
  },
  {
    name: 'hume-tts',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/hume-tts',
    description: '🎭 Hume TTS - Empathic text-to-speech with emotional expression',
    capabilities: [
      'Emotional voice synthesis',
      'Voice ID selection',
      'Expressive audio generation'
    ],
    category: 'hume',
    example_use: '{"text":"Hello","voiceId":"c7aa10be-..."}'
  },
  {
    name: 'identify-service-interest',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/identify-service-interest',
    description: '🎯 Service Interest Detection - Identify services a lead wants',
    capabilities: [
      'Service detection',
      'Interest scoring',
      'Multi-service tracking'
    ],
    category: 'acquisition',
    example_use: '{"user_message":"I need mining help","session_key":"abc123"}'
  },
  {
    name: 'ingest-github-contribution',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/ingest-github-contribution',
    description: 'Auto-detected function: ingest-github-contribution',
    capabilities: [
      'ingest github contribution'
    ],
    category: 'github',
    example_use: 'Invoke ingest-github-contribution'
  },
  {
    name: 'issue-engagement-command',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/issue-engagement-command',
    description: 'Engage with GitHub issues via commands',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use issue engagement command for engage with github issues via commands'
  },
  {
    name: 'kimi-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/kimi-chat',
    description: 'AI chat via Kimi model',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use kimi chat for ai chat via kimi model'
  },
  {
    name: 'knowledge-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/knowledge-manager',
    description: 'Knowledge base CRUD operations - store, search, and link entities',
    capabilities: [
      'Store knowledge',
      'Search knowledge',
      'Create relationships',
      'Get related entities',
      'Update confidence'
    ],
    category: 'knowledge',
    example_use: 'Store concepts, link entities, search knowledge graph'
  },
  {
    name: 'learning-optimizer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/learning-optimizer',
    description: 'XMRT Ecosystem: learning optimizer',
    capabilities: [
      'python service',
      'learning optimizer'
    ],
    category: 'ecosystem',
    example_use: 'Interact with learning-optimizer'
  },
  {
    name: 'list-available-functions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/list-available-functions',
    description: 'List all available edge functions',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use list available functions for list all available edge functions'
  },
  {
    name: 'list-function-proposals',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/list-function-proposals',
    description: 'List all edge function proposals and their status',
    capabilities: [
      'Proposal listing',
      'Status tracking',
      'Governance monitoring'
    ],
    category: 'governance',
    example_use: 'List pending proposals, check proposal status, view voting history'
  },
  {
    name: 'lovable-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/lovable-chat',
    description: '✅ PRIMARY AI - Model-agnostic chat via Lovable AI Gateway (Gemini 2.5 Flash default, supports OpenAI GPT-5)',
    capabilities: [
      'Advanced AI chat',
      'Context awareness',
      'Multi-model support',
      'Memory integration',
      'Tool calling',
      'Multi-step workflows'
    ],
    category: 'ai',
    example_use: 'Main intelligent chat endpoint with full context and memory - use this for all AI chat needs'
  },
  {
    name: 'memory-optimizer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/memory-optimizer',
    description: 'XMRT Ecosystem: memory optimizer',
    capabilities: [
      'python service',
      'memory optimizer'
    ],
    category: 'ecosystem',
    example_use: 'Interact with memory-optimizer'
  },
  {
    name: 'memory-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/memory-system',
    description: 'XMRT Ecosystem: memory system',
    capabilities: [
      'python service',
      'memory system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with memory-system'
  },
  {
    name: 'mesh-health-beacons',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mesh-health-beacons',
    description: 'XMRT Ecosystem App: Mesh Health Beacons',
    capabilities: [
      'ecosystem app',
      'mesh health beacons'
    ],
    category: 'ecosystem',
    example_use: 'Interact with mesh-health-beacons'
  },
  {
    name: 'mining-proxy',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mining-proxy',
    description: 'Unified mining statistics and worker management from SupportXMR',
    capabilities: [
      'Get mining stats',
      'Get worker status',
      'Track earnings',
      'Monitor hashrate',
      'Worker registration'
    ],
    category: 'mining',
    example_use: 'Get comprehensive mining data including pool stats and individual worker performance'
  },
  {
    name: 'executive-swarm',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/executive-swarm',
    description: 'Swarm-intelligence decision engine for XMRT-DAO executive council consensus and weight optimization',
    capabilities: [
      'Executive decision analysis',
      'Consensus generation',
      'Dynamic executive weighting',
      'Outcome tracking',
      'Scenario simulation'
    ],
    category: 'ai',
    example_use: '{"action":"analyze_decision","decision_type":"financial","decision_score":0.64,"historical_decisions":[{"predicted_score":0.7,"actual_score":0.62}]}'
  },
  {
    name: 'mobile-miner-config',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mobile-miner-config',
    description: 'Configuration management for mobile mining devices',
    capabilities: [
      'Device configuration',
      'Mining settings',
      'Mobile optimization'
    ],
    category: 'mining',
    example_use: 'Configure mobile miners, optimize settings, manage device profiles'
  },
  {
    name: 'mobile-miner-register',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mobile-miner-register',
    description: 'Registration system for mobile mining devices',
    capabilities: [
      'Device registration',
      'Miner onboarding',
      'Identity management'
    ],
    category: 'mining',
    example_use: 'Register mobile miners, onboard new devices, manage identities'
  },
  {
    name: 'mobile-miner-script',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mobile-miner-script',
    description: 'Script distribution for mobile mining clients',
    capabilities: [
      'Script distribution',
      'Client updates',
      'Version management'
    ],
    category: 'mining',
    example_use: 'Distribute mining scripts, push updates, manage versions'
  },
  {
    name: 'mobile-mining-incentive-program',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/mobile-mining-incentive-program',
    description: 'XMRT Ecosystem App: Mobile Mining Incentive Program',
    capabilities: [
      'ecosystem app',
      'mobile mining incentive program'
    ],
    category: 'ecosystem',
    example_use: 'Interact with mobile-mining-incentive-program'
  },
  {
    name: 'monitor-device-connections',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/monitor-device-connections',
    description: 'Monitor mining device connections and status',
    capabilities: [
      'Mining stats',
      'Device monitoring',
      'Hashrate tracking'
    ],
    category: 'mining',
    example_use: 'Use monitor device connections for monitor mining device connections and status'
  },
  {
    name: 'morning-discussion-post',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/morning-discussion-post',
    description: 'Generate and post morning discussion topics',
    capabilities: [
      'Automated posting',
      'Content generation',
      'Scheduling'
    ],
    category: 'autonomous',
    example_use: 'Use morning discussion post for generate and post morning discussion topics'
  },
  {
    name: 'multi-agent-slack-bridge',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/multi-agent-slack-bridge',
    description: 'XMRT Ecosystem: multi agent slack bridge',
    capabilities: [
      'python service',
      'multi agent slack bridge'
    ],
    category: 'ecosystem',
    example_use: 'Interact with multi-agent-slack-bridge'
  },
  {
    name: 'multi-agent-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/multi-agent-system',
    description: 'XMRT Ecosystem: multi agent system',
    capabilities: [
      'python service',
      'multi agent system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with multi-agent-system'
  },
  {
    name: 'multi-step-orchestrator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/multi-step-orchestrator',
    description: 'Complex workflow engine for background processing with dependencies',
    capabilities: [
      'Execute workflows',
      'Multi-step tasks',
      'Dependency handling',
      'Background processing',
      'Autonomous workflows'
    ],
    category: 'autonomous',
    example_use: 'Execute debugging workflow: scan logs → identify errors → fix code → verify'
  },
  {
    name: 'n8n-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/n8n-integration',
    description: 'XMRT Ecosystem: n8n integration',
    capabilities: [
      'python service',
      'n8n integration'
    ],
    category: 'ecosystem',
    example_use: 'Interact with n8n-integration'
  },
  {
    name: 'n8n-workflow-generator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/n8n-workflow-generator',
    description: 'Auto-detected function: n8n-workflow-generator',
    capabilities: [
      'n8n workflow generator'
    ],
    category: 'task-management',
    example_use: 'Invoke n8n-workflow-generator'
  },
  {
    name: 'n8n-workflow-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/n8n-workflow-manager',
    description: 'XMRT Ecosystem: n8n workflow manager',
    capabilities: [
      'python service',
      'n8n workflow manager'
    ],
    category: 'ecosystem',
    example_use: 'Interact with n8n-workflow-manager'
  },
  {
    name: 'nlg-generator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/nlg-generator',
    description: 'Natural language generation for reports and content',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use nlg generator for natural language generation for reports and content'
  },
  {
    name: 'openai-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/openai-chat',
    description: 'AI chat via OpenAI models',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use openai chat for ai chat via openai models'
  },
  {
    name: 'openai-tts',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/openai-tts',
    description: 'Text-to-speech via OpenAI',
    capabilities: [
      'Text-to-speech',
      'Voice synthesis',
      'Audio generation'
    ],
    category: 'ai',
    example_use: 'Use openai tts for text-to-speech via openai'
  },
  {
    name: 'opportunity-scanner',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/opportunity-scanner',
    description: 'Autonomous opportunity scanning and identification',
    capabilities: [
      'Opportunity detection',
      'Market scanning',
      'Trend analysis'
    ],
    category: 'autonomous',
    example_use: 'Scan for opportunities, detect market trends, identify potential'
  },
  {
    name: 'paragraph-publisher',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/paragraph-publisher',
    description: '📝 Paragraph.xyz Publisher - Publish articles and newsletters',
    capabilities: [
      'Publish post',
      'Create draft',
      'Update post',
      'List posts'
    ],
    category: 'web',
    example_use: '{"action":"publish", "title":"Weekly Update", "content":"..."}'
  },
  {
    name: 'performance-analyzer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/performance-analyzer',
    description: 'XMRT Ecosystem: performance analyzer',
    capabilities: [
      'python service',
      'performance analyzer'
    ],
    category: 'ecosystem',
    example_use: 'Interact with performance-analyzer'
  },
  {
    name: 'playwright-browse',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/playwright-browse',
    description: 'Web browsing and scraping using Playwright automation',
    capabilities: [
      'Browse websites',
      'Extract data',
      'Dynamic content extraction',
      'JavaScript rendering',
      'Interact with pages'
    ],
    category: 'web',
    example_use: 'Browse websites, extract data, interact with web pages, research real-time information'
  },
  {
    name: 'predictive-analytics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/predictive-analytics',
    description: 'Predictive analytics for mining and system metrics',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use predictive analytics for predictive analytics for mining and system metrics'
  },
  {
    name: 'privacy-first-ai-training-platform',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-first-ai-training-platform',
    description: 'XMRT Ecosystem App: Privacy First Ai Training Platform',
    capabilities: [
      'ecosystem app',
      'privacy first ai training platform'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-first-ai-training-platform'
  },
  {
    name: 'privacy-first-ai-workflows',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-first-ai-workflows',
    description: 'XMRT Ecosystem App: Privacy First Ai Workflows',
    capabilities: [
      'ecosystem app',
      'privacy first ai workflows'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-first-ai-workflows'
  },
  {
    name: 'privacy-first-decentralized-wallet',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-first-decentralized-wallet',
    description: 'XMRT Ecosystem App: Privacy First Decentralized Wallet',
    capabilities: [
      'ecosystem app',
      'privacy first decentralized wallet'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-first-decentralized-wallet'
  },
  {
    name: 'privacy-first-digital-wallet',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-first-digital-wallet',
    description: 'XMRT Ecosystem App: Privacy First Digital Wallet',
    capabilities: [
      'ecosystem app',
      'privacy first digital wallet'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-first-digital-wallet'
  },
  {
    name: 'privacy-focused-data-sharing-framework',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-focused-data-sharing-framework',
    description: 'XMRT Ecosystem App: Privacy Focused Data Sharing Framework',
    capabilities: [
      'ecosystem app',
      'privacy focused data sharing framework'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-focused-data-sharing-framework'
  },
  {
    name: 'privacy-focused-decentralized-identity-did-system',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-focused-decentralized-identity-did-system',
    description: 'XMRT Ecosystem App: Privacy Focused Decentralized Identity Did System',
    capabilities: [
      'ecosystem app',
      'privacy focused decentralized identity did system'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-focused-decentralized-identity-did-system'
  },
  {
    name: 'privacy-focused-wallet-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-focused-wallet-integration',
    description: 'XMRT Ecosystem App: Privacy Focused Wallet Integration',
    capabilities: [
      'ecosystem app',
      'privacy focused wallet integration'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-focused-wallet-integration'
  },
  {
    name: 'privacy-preserving-communication-layer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-preserving-communication-layer',
    description: 'XMRT Ecosystem App: Privacy Preserving Communication Layer',
    capabilities: [
      'ecosystem app',
      'privacy preserving communication layer'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-preserving-communication-layer'
  },
  {
    name: 'privacy-preserving-communication-protocol',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/privacy-preserving-communication-protocol',
    description: 'XMRT Ecosystem App: Privacy Preserving Communication Protocol',
    capabilities: [
      'ecosystem app',
      'privacy preserving communication protocol'
    ],
    category: 'ecosystem',
    example_use: 'Interact with privacy-preserving-communication-protocol'
  },
  {
    name: 'process-contributor-reward',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/process-contributor-reward',
    description: 'Process and distribute contributor rewards',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use process contributor reward for process and distribute contributor rewards'
  },
  {
    name: 'process-license-application',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/process-license-application',
    description: 'Auto-detected function: process-license-application',
    capabilities: [
      'process license application'
    ],
    category: 'github',
    example_use: 'Invoke process-license-application'
  },
  {
    name: 'progress-update-post',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/progress-update-post',
    description: 'Generate and post progress updates',
    capabilities: [
      'Automated posting',
      'Content generation',
      'Scheduling'
    ],
    category: 'autonomous',
    example_use: 'Use progress update post for generate and post progress updates'
  },
  {
    name: 'prometheus-metrics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/prometheus-metrics',
    description: 'Export Prometheus-compatible metrics',
    capabilities: [
      'Mining stats',
      'Device monitoring',
      'Hashrate tracking'
    ],
    category: 'mining',
    example_use: 'Use prometheus metrics for export prometheus-compatible metrics'
  },
  {
    name: 'propose-new-edge-function',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/propose-new-edge-function',
    description: 'Submit new edge function proposals for council voting',
    capabilities: [
      'Proposal submission',
      'Governance workflow',
      'Council voting'
    ],
    category: 'governance',
    example_use: 'Propose new functions, submit to council, initiate voting'
  },
  {
    name: 'python-db-bridge',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/python-db-bridge',
    description: 'Bridge for Python code to access database',
    capabilities: [
      'Execute code',
      'Error handling',
      'Sandboxed execution'
    ],
    category: 'code-execution',
    example_use: 'Use python db bridge for bridge for python code to access database'
  },
  {
    name: 'python-executor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/python-executor',
    description: 'Sandboxed Python execution via Piston API (stdlib only, no pip)',
    capabilities: [
      'Execute Python code',
      'Data analysis',
      'Calculations',
      'Network access via proxy',
      'Database access via bridge'
    ],
    category: 'code-execution',
    example_use: 'Execute Python to analyze device connection patterns from the last 24 hours'
  },
  {
    name: 'python-network-proxy',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/python-network-proxy',
    description: 'Network proxy for Python code execution',
    capabilities: [
      'Execute code',
      'Error handling',
      'Sandboxed execution'
    ],
    category: 'code-execution',
    example_use: 'Use python network proxy for network proxy for python code execution'
  },
  {
    name: 'qualify-lead',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/qualify-lead',
    description: '💰 Lead Qualification - Score leads based on conversation signals',
    capabilities: [
      'Lead scoring',
      'Signal processing',
      'Budget detection',
      'Urgency assessment'
    ],
    category: 'acquisition',
    example_use: '{"session_key":"abc123","user_signals":{"mentioned_budget":true}}'
  },
  {
    name: 'query-edge-analytics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/query-edge-analytics',
    description: '🔍 Query Edge Analytics - Query Supabase Analytics',
    capabilities: [
      'Analytics queries',
      'Performance data',
      'Usage patterns'
    ],
    category: 'monitoring',
    example_use: '{"function_name":"github-integration","time_range":"24h"}'
  },
  {
    name: 'redis-cache',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/redis-cache',
    description: 'Upstash Redis caching service for API responses, sessions, and rate limiting',
    capabilities: [
      'Get/Set cache',
      'Delete cache',
      'Health check',
      'TTL management'
    ],
    category: 'database',
    example_use: 'Cache ecosystem health for 5 minutes, store session data, implement rate limiting'
  },
  {
    name: 'render-api',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/render-api',
    description: 'Render.com deployment management and monitoring',
    capabilities: [
      'Render deployment',
      'Service management',
      'Health monitoring'
    ],
    category: 'deployment',
    example_use: 'Manage Render deployments, monitor services, check health'
  },
  {
    name: 'request-executive-votes',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/request-executive-votes',
    description: '🗳️ Request Executive Votes - Trigger AI executives to vote',
    capabilities: [
      'Executive notification',
      'Vote solicitation',
      'Council coordination'
    ],
    category: 'governance',
    example_use: '{"proposal_id":"uuid"}'
  },
  {
    name: 'reward-program-for-network-participation',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/reward-program-for-network-participation',
    description: 'XMRT Ecosystem App: Reward Program For Network Participation',
    capabilities: [
      'ecosystem app',
      'reward program for network participation'
    ],
    category: 'ecosystem',
    example_use: 'Interact with reward-program-for-network-participation'
  },
  {
    name: 'schedule-reminder',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/schedule-reminder',
    description: 'Schedule and send reminders',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use schedule reminder for schedule and send reminders'
  },
  {
    name: 'schema-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/schema-manager',
    description: 'Manage database schema and migrations',
    capabilities: [
      'Database operations',
      'Schema management',
      'Data access'
    ],
    category: 'database',
    example_use: 'Use schema manager for manage database schema and migrations'
  },
  {
    name: 'search-edge-functions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/search-edge-functions',
    description: 'Semantic search for edge functions by capability, keywords, or use case',
    capabilities: [
      'Search functions',
      'Find by capability',
      'Keyword search',
      'Category filter',
      'Ranked results'
    ],
    category: 'ecosystem',
    example_use: 'Find the right function when you don\'t know the name'
  },
  {
    name: 'self-optimizing-agent-architecture',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/self-optimizing-agent-architecture',
    description: 'Self-optimizing agent system architecture',
    capabilities: [
      'Task creation',
      'Task assignment',
      'Workload balancing'
    ],
    category: 'task-management',
    example_use: 'Use self optimizing agent architecture for self-optimizing agent system architecture'
  },
  {
    name: 'service-monetization-engine',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/service-monetization-engine',
    description: '💰 REVENUE GENERATION - API key generation, usage tracking, tiered access control, billing, and revenue analytics for monetized services',
    capabilities: [
      'API key management',
      'Usage tracking',
      'Tiered pricing (free/basic/pro/enterprise)',
      'Invoice generation',
      'Revenue analytics',
      'Quota enforcement',
      'Customer onboarding',
      'Tier upgrades',
      'MRR calculation'
    ],
    category: 'revenue',
    example_use: 'Generate API key: {"action":"generate_api_key","data":{"service_name":"uspto-patent-mcp","tier":"pro","owner_email":"customer@example.com"}}. Track usage: {"action":"track_usage","data":{"api_key":"xmrt_pro_abc","service_name":"uspto-patent-mcp","endpoint":"/search"}}'
  },
  {
    name: 'share-latest-news',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/share-latest-news',
    description: 'Auto-detected function: share-latest-news',
    capabilities: [
      'share latest news'
    ],
    category: 'ecosystem',
    example_use: 'Invoke share-latest-news'
  },
  {
    name: 'slack-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/slack-integration',
    description: 'XMRT Ecosystem: slack integration',
    capabilities: [
      'python service',
      'slack integration'
    ],
    category: 'ecosystem',
    example_use: 'Interact with slack-integration'
  },
  {
    name: 'smart-contract-auditing-tool',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/smart-contract-auditing-tool',
    description: 'XMRT Ecosystem App: Smart Contract Auditing Tool',
    capabilities: [
      'ecosystem app',
      'smart contract auditing tool'
    ],
    category: 'ecosystem',
    example_use: 'Interact with smart-contract-auditing-tool'
  },
  {
    name: 'speech-to-text',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/speech-to-text',
    description: 'Convert speech audio to text',
    capabilities: [
      'Audio transcription',
      'Voice input processing',
      'Speech recognition'
    ],
    category: 'speech',
    example_use: 'Process voice input from users for voice-based interactions'
  },
  {
    name: 'stripe-payment-webhook',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/stripe-payment-webhook',
    description: '💳 Stripe Webhook - Process payments and auto-upgrade keys',
    capabilities: [
      'Payment verification',
      'Webhook validation',
      'Auto upgrade'
    ],
    category: 'payments',
    example_use: 'Webhook endpoint for Stripe events'
  },
  {
    name: 'suite-task-automation-engine',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/suite-task-automation-engine',
    description: '🤖 STAE - Task automation with templates and smart assignment',
    capabilities: [
      'Template-based tasks',
      'Smart agent matching',
      'Checklist management',
      'Stage advancement'
    ],
    category: 'automation',
    example_use: '{"action":"create_task_from_template","data":{"template_name":"bug_fix"}}'
  },
  {
    name: 'summarize-conversation',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/summarize-conversation',
    description: 'Generate conversation summaries',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use summarize conversation for generate conversation summaries'
  },
  {
    name: 'superduper-business-growth',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-business-growth',
    description: 'SuperDuper Agent: Business growth strategy and market expansion',
    capabilities: [
      'Business strategy',
      'Market analysis',
      'Growth planning',
      'Revenue optimization'
    ],
    category: 'superduper',
    example_use: 'Analyze market opportunities, develop growth strategies, revenue optimization'
  },
  {
    name: 'superduper-code-architect',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-code-architect',
    description: 'SuperDuper Agent: Software architecture and system design',
    capabilities: [
      'Architecture design',
      'Code review',
      'System optimization',
      'Technical debt analysis'
    ],
    category: 'superduper',
    example_use: 'Design system architecture, review code quality, optimize performance'
  },
  {
    name: 'superduper-communication-outreach',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-communication-outreach',
    description: 'SuperDuper Agent: Community communication and outreach',
    capabilities: [
      'Community engagement',
      'Outreach campaigns',
      'Stakeholder communication'
    ],
    category: 'superduper',
    example_use: 'Manage community outreach, stakeholder communications, engagement campaigns'
  },
  {
    name: 'superduper-content-media',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-content-media',
    description: 'SuperDuper Agent: Content creation and media strategy',
    capabilities: [
      'Content creation',
      'Media strategy',
      'Marketing materials',
      'Social content'
    ],
    category: 'superduper',
    example_use: 'Create marketing content, develop media strategy, social media management'
  },
  {
    name: 'superduper-design-brand',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-design-brand',
    description: 'SuperDuper Agent: Brand identity and visual design',
    capabilities: [
      'Brand strategy',
      'Visual design',
      'UI/UX',
      'Design systems'
    ],
    category: 'superduper',
    example_use: 'Develop brand identity, create design systems, UI/UX improvements'
  },
  {
    name: 'superduper-development-coach',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-development-coach',
    description: 'SuperDuper Agent: Developer mentoring and coaching',
    capabilities: [
      'Developer mentoring',
      'Code education',
      'Best practices',
      'Career guidance'
    ],
    category: 'superduper',
    example_use: 'Mentor developers, teach best practices, provide career guidance'
  },
  {
    name: 'superduper-domain-experts',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-domain-experts',
    description: 'SuperDuper Agent: Domain-specific expertise and consulting',
    capabilities: [
      'Domain expertise',
      'Technical consulting',
      'Industry knowledge',
      'Specialized advice'
    ],
    category: 'superduper',
    example_use: 'Provide domain expertise, technical consulting, specialized guidance'
  },
  {
    name: 'superduper-finance-investment',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-finance-investment',
    description: 'SuperDuper Agent: Financial planning and investment strategy',
    capabilities: [
      'Financial analysis',
      'Investment strategy',
      'Budget planning',
      'ROI optimization'
    ],
    category: 'superduper',
    example_use: 'Analyze financial health, develop investment strategy, budget planning'
  },
  {
    name: 'superduper-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-integration',
    description: 'SuperDuper Agent: System integration and orchestration',
    capabilities: [
      'System integration',
      'API orchestration',
      'Service coordination',
      'Integration testing'
    ],
    category: 'superduper',
    example_use: 'Integrate systems, orchestrate APIs, coordinate services'
  },
  {
    name: 'superduper-research-intelligence',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-research-intelligence',
    description: 'SuperDuper Agent: Research and competitive intelligence',
    capabilities: [
      'Market research',
      'Competitive analysis',
      'Trend monitoring',
      'Intelligence gathering'
    ],
    category: 'superduper',
    example_use: 'Conduct market research, analyze competitors, monitor trends'
  },
  {
    name: 'superduper-router',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-router',
    description: 'Central router for all SuperDuper specialist agents',
    capabilities: [
      'Agent routing',
      'Request orchestration',
      'Load balancing'
    ],
    category: 'superduper',
    example_use: 'Route to SuperDuper agents, orchestrate specialist requests'
  },
  {
    name: 'superduper-social-viral',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/superduper-social-viral',
    description: 'SuperDuper Agent: Social media and viral marketing',
    capabilities: [
      'Viral campaigns',
      'Social media strategy',
      'Influencer outreach',
      'Engagement optimization'
    ],
    category: 'superduper',
    example_use: 'Create viral campaigns, optimize social engagement, influencer partnerships'
  },
  {
    name: 'supportxmr-proxy',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/supportxmr-proxy',
    description: 'Auto-detected function: supportxmr-proxy',
    capabilities: [
      'supportxmr proxy'
    ],
    category: 'github',
    example_use: 'Invoke supportxmr-proxy'
  },
  {
    name: 'sync-dashboard-data',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/sync-dashboard-data',
    description: 'Auto-detected function: sync-dashboard-data',
    capabilities: [
      'sync dashboard data'
    ],
    category: 'database',
    example_use: 'Invoke sync-dashboard-data'
  },
  {
    name: 'sync-function-logs',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/sync-function-logs',
    description: '🔄 Sync Function Logs - Synchronize logs from Analytics',
    capabilities: [
      'Log synchronization',
      'Backfill data',
      'Version tracking'
    ],
    category: 'monitoring',
    example_use: 'Runs on cron every 15 minutes'
  },
  {
    name: 'sync-github-contributions',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/sync-github-contributions',
    description: 'Auto-detected function: sync-github-contributions',
    capabilities: [
      'sync github contributions'
    ],
    category: 'github',
    example_use: 'Invoke sync-github-contributions'
  },
  {
    name: 'system-diagnostics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/system-diagnostics',
    description: 'Detailed resource usage and performance metrics',
    capabilities: [
      'Memory usage',
      'CPU usage',
      'Database performance',
      'Edge function health',
      'Deep diagnostics'
    ],
    category: 'monitoring',
    example_use: 'Run detailed system diagnostics when system is slow'
  },
  {
    name: 'system-health',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/system-health',
    description: 'Comprehensive system health monitoring',
    capabilities: [
      'Health checks',
      'Performance metrics',
      'Status monitoring'
    ],
    category: 'monitoring',
    example_use: 'Use system health for comprehensive system health monitoring'
  },
  {
    name: 'system-knowledge-builder',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/system-knowledge-builder',
    description: 'Autonomous knowledge base construction and maintenance',
    capabilities: [
      'Knowledge construction',
      'Entity extraction',
      'Relationship building'
    ],
    category: 'knowledge',
    example_use: 'Build knowledge base, extract entities, create relationships'
  },
  {
    name: 'system-status',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/system-status',
    description: 'Quick health check - database, agents, tasks status',
    capabilities: [
      'System health check',
      'Database status',
      'Agent status',
      'Task status',
      'Quick diagnostics'
    ],
    category: 'monitoring',
    example_use: 'Get comprehensive system health status'
  },
  {
    name: 'task-auto-advance',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/task-auto-advance',
    description: '⏩ Task Auto-Advance - Auto-advance tasks through pipeline',
    capabilities: [
      'Stage advancement',
      'Threshold monitoring',
      'Agent notification'
    ],
    category: 'automation',
    example_use: 'Runs on cron to advance eligible tasks'
  },
  {
    name: 'task-orchestrator',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/task-orchestrator',
    description: 'Advanced task automation - auto-assign, rebalance, analyze bottlenecks',
    capabilities: [
      'Auto assign tasks',
      'Rebalance workload',
      'Identify blockers',
      'Clear blocked tasks',
      'Analyze bottlenecks',
      'Bulk updates'
    ],
    category: 'task-management',
    example_use: 'Automatically distribute all pending tasks to idle agents by priority'
  },
  {
    name: 'template-library-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/template-library-manager',
    description: 'Auto-detected function: template-library-manager',
    capabilities: [
      'template library manager'
    ],
    category: 'ecosystem',
    example_use: 'Invoke template-library-manager'
  },
  {
    name: 'text-to-speech',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/text-to-speech',
    description: 'Auto-detected function: text-to-speech',
    capabilities: [
      'text to speech'
    ],
    category: 'ecosystem',
    example_use: 'Invoke text-to-speech'
  },
  {
    name: 'thegraph-query',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/thegraph-query',
    description: 'Auto-detected function: thegraph-query',
    capabilities: [
      'thegraph query'
    ],
    category: 'ecosystem',
    example_use: 'Invoke thegraph-query'
  },
  {
    name: 'toggle-cron-jobs',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/toggle-cron-jobs',
    description: 'Auto-detected function: toggle-cron-jobs',
    capabilities: [
      'toggle cron jobs'
    ],
    category: 'ecosystem',
    example_use: 'Invoke toggle-cron-jobs'
  },
  {
    name: 'tool-usage-analytics',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/tool-usage-analytics',
    description: '📊 Tool Usage Analytics - Comprehensive tool analytics',
    capabilities: [
      'Tool success rates',
      'Executive breakdowns',
      'Error patterns'
    ],
    category: 'monitoring',
    example_use: '{"time_period_hours":168}'
  },
  {
    name: 'typefully-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/typefully-integration',
    description: '🐦 Typefully/Twitter - Schedule and publish tweets/threads',
    capabilities: [
      'Create draft',
      'Schedule tweet',
      'Publish thread',
      'Get user info'
    ],
    category: 'web',
    example_use: '{"action":"create_draft", "content":"Hello world!"}'
  },
  {
    name: 'universal-edge-invoker',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/universal-edge-invoker',
    description: 'Universal invoker for all edge functions',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use universal edge invoker for universal invoker for all edge functions'
  },
  {
    name: 'universal-file-processor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/universal-file-processor',
    description: 'Auto-detected function: universal-file-processor',
    capabilities: [
      'universal file processor'
    ],
    category: 'github',
    example_use: 'Invoke universal-file-processor'
  },
  {
    name: 'update-api-key',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/update-api-key',
    description: 'Update API keys in the system',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use update api key for update api keys in the system'
  },
  {
    name: 'update-payout-wallet',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/update-payout-wallet',
    description: 'Auto-detected function: update-payout-wallet',
    capabilities: [
      'update payout wallet'
    ],
    category: 'revenue',
    example_use: 'Invoke update-payout-wallet'
  },
  {
    name: 'usage-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/usage-monitor',
    description: '📊 Usage Monitor - Track API usage and quotas',
    capabilities: [
      'Usage tracking',
      'Quota enforcement',
      'Rate limiting'
    ],
    category: 'monitoring',
    example_use: '{"api_key":"xmrt_pro_abc"}'
  },
  {
    name: 'uspto-patent-mcp',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/uspto-patent-mcp',
    description: 'MCP server for USPTO patent and trademark database access. Search 11M+ patents, retrieve full text, download PDFs, analyze portfolios using advanced CQL queries',
    capabilities: [
      'Patent search with CQL syntax (title',
      'abstract',
      'inventor',
      'assignee',
      'date',
      'classification)',
      'Full text document retrieval (abstract',
      'claims',
      'description)',
      'PDF downloads (base64 encoded)',
      'Inventor portfolio analysis',
      'Assignee/company patent search',
      'CPC classification search',
      'Prior art search assistance',
      'Technology landscape mapping',
      'Competitive intelligence'
    ],
    category: 'research',
    example_use: 'Search patents: {"method":"tools/call","params":{"name":"search_patents","arguments":{"query":"TTL/artificial intelligence AND ISD/20240101->20241231"}}}'
  },
  {
    name: 'validate-cross-repo-data',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/validate-cross-repo-data',
    description: 'Auto-detected function: validate-cross-repo-data',
    capabilities: [
      'validate cross repo data'
    ],
    category: 'github',
    example_use: 'Invoke validate-cross-repo-data'
  },
  {
    name: 'validate-github-contribution',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/validate-github-contribution',
    description: 'Validate GitHub contributions for rewards',
    capabilities: [
      'GitHub API',
      'Repository management',
      'Issue tracking'
    ],
    category: 'github',
    example_use: 'Use validate github contribution for validate github contributions for rewards'
  },
  {
    name: 'validate-pop-event',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/validate-pop-event',
    description: 'Validate proof-of-participation events',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use validate pop event for validate proof-of-participation events'
  },
  {
    name: 'vectorize-memory',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vectorize-memory',
    description: 'Convert memories to vector embeddings',
    capabilities: [
      'Knowledge storage',
      'Semantic search',
      'Entity relationships'
    ],
    category: 'knowledge',
    example_use: 'Use vectorize memory for convert memories to vector embeddings'
  },
  {
    name: 'knowledge-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/knowledge-manager/store',
    description: 'Manages the knowledge base and vector embeddings',
    capabilities: [
      'Vectorize text',
      'Knowledge search',
      'Data retrieval'
    ],
    category: 'knowledge',
    example_use: 'Search the knowledge base for relevant information'
  },
  {
    name: 'vercel-ai-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vercel-ai-chat',
    description: 'AI chat via Vercel AI SDK',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use vercel ai chat for ai chat via vercel ai sdk'
  },
  {
    name: 'vercel-ai-chat-stream',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vercel-ai-chat-stream',
    description: 'Streaming AI chat via Vercel AI SDK',
    capabilities: [
      'AI chat',
      'Context awareness',
      'Natural language processing'
    ],
    category: 'ai',
    example_use: 'Use vercel ai chat stream for streaming ai chat via vercel ai sdk'
  },
  {
    name: 'vercel-ecosystem-api',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vercel-ecosystem-api',
    description: 'Vercel multi-service management for xmrt-io, xmrt-ecosystem, and xmrt-dao-ecosystem deployments',
    capabilities: [
      'Deployment tracking',
      'Multi-service health monitoring',
      'Service status aggregation',
      'Deployment history'
    ],
    category: 'deployment',
    example_use: 'Check health of all Vercel services, get deployment info, monitor service status'
  },
  {
    name: 'vercel-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vercel-manager',
    description: 'Manage Vercel deployments',
    capabilities: [
      'Deployment management',
      'API integration',
      'Service control'
    ],
    category: 'deployment',
    example_use: 'Use vercel manager for manage vercel deployments'
  },
  {
    name: 'vertex-ai-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vertex-ai-chat',
    description: '🤖 Vertex AI Chat - Chat with Google Gemini Pro/Flash models via Vertex AI',
    capabilities: [
      'AI chat',
      'Multimodal input',
      'Gemini Pro/Flash',
      'Enterprise-grade'
    ],
    category: 'ai',
    example_use: '{"messages":[{"role":"user","content":"Hello"}], "model":"gemini-1.5-pro-preview-0409"}'
  },
  {
    name: 'vertex-ai-image-gen',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vertex-ai-image-gen',
    description: '🖼️ Vertex AI Image Gen - Generate high-quality images using Imagen',
    capabilities: [
      'Image generation',
      'Text-to-image',
      'Imagen 2/3'
    ],
    category: 'ai',
    example_use: '{"prompt":"A futuristic city with flying cars", "aspect_ratio":"16:9"}'
  },
  {
    name: 'vote-on-proposal',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vote-on-proposal',
    description: 'Cast votes on edge function and governance proposals',
    capabilities: [
      'Voting system',
      'Proposal evaluation',
      'Decision making'
    ],
    category: 'governance',
    example_use: 'Vote on proposals, evaluate decisions, participate in governance'
  },
  {
    name: 'vsco-webhook-handler',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vsco-webhook-handler',
    description: 'Auto-detected function: vsco-webhook-handler',
    capabilities: [
      'vsco webhook handler'
    ],
    category: 'web',
    example_use: 'Invoke vsco-webhook-handler'
  },
  {
    name: 'vsco-workspace',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/vsco-workspace',
    description: '📸 VSCO Workspace CMS - Full studio management: contacts, jobs, events, quotes, products, worksheets, notes, invoices, and calendar integration',
    capabilities: [
      'Contact management',
      'Job management',
      'Event scheduling',
      'Product pricing',
      'Quote creation',
      'Worksheets/templates',
      'Notes',
      'Invoice management',
      'Calendar integration',
      'Pipeline analytics'
    ],
    category: 'vsco',
    example_use: '{"action":"create_contact","data":{"firstName":"John","lastName":"Doe","email":"john@example.com"}}'
  },
  {
    name: 'wan-ai-chat',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/wan-ai-chat',
    description: 'Auto-detected function: wan-ai-chat',
    capabilities: [
      'wan ai chat'
    ],
    category: 'ai',
    example_use: 'Invoke wan-ai-chat'
  },
  {
    name: 'web3-dapp-factory',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/web3-dapp-factory',
    description: 'XMRT Ecosystem: web3 dapp factory',
    capabilities: [
      'python service',
      'web3 dapp factory'
    ],
    category: 'ecosystem',
    example_use: 'Interact with web3-dapp-factory'
  },
  {
    name: 'webhook-endpoints',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/webhook-endpoints',
    description: 'XMRT Ecosystem: webhook endpoints',
    capabilities: [
      'python service',
      'webhook endpoints'
    ],
    category: 'ecosystem',
    example_use: 'Interact with webhook-endpoints'
  },
  {
    name: 'weekly-retrospective-post',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/weekly-retrospective-post',
    description: 'Generate and post weekly retrospective',
    capabilities: [
      'Automated posting',
      'Content generation',
      'Scheduling'
    ],
    category: 'autonomous',
    example_use: 'Use weekly retrospective post for generate and post weekly retrospective'
  },
  {
    name: 'worker-registration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/worker-registration',
    description: 'Auto-detected function: worker-registration',
    capabilities: [
      'worker registration'
    ],
    category: 'task-management',
    example_use: 'Invoke worker-registration'
  },
  {
    name: 'workflow-optimizer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/workflow-optimizer',
    description: 'Auto-detected function: workflow-optimizer',
    capabilities: [
      'workflow optimizer'
    ],
    category: 'task-management',
    example_use: 'Invoke workflow-optimizer'
  },
  {
    name: 'workflow-template-manager',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/workflow-template-manager',
    description: '🔄 WORKFLOW AUTOMATION - Pre-built workflow templates for revenue generation, marketing automation, financial management, and self-optimization',
    capabilities: [
      'Template library (9 pre-built workflows)',
      'Workflow execution',
      'Performance tracking',
      'Template creation',
      'Success rate analytics',
      'Multi-step orchestration',
      'Revenue workflows',
      'Marketing workflows',
      'Financial workflows'
    ],
    category: 'automation',
    example_use: 'Execute template: {"action":"execute_template","data":{"template_name":"acquire_new_customer","params":{"email":"new@customer.com","tier":"basic","service_name":"uspto-patent-mcp"}}}. List templates: {"action":"list_templates","data":{"category":"revenue"}}'
  },
  {
    name: 'x-twitter-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/x-twitter-monitor',
    description: 'Auto-detected function: x-twitter-monitor',
    capabilities: [
      'x twitter monitor'
    ],
    category: 'monitoring',
    example_use: 'Invoke x-twitter-monitor'
  },
  {
    name: 'xmrig-direct-proxy',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrig-direct-proxy',
    description: 'Auto-detected function: xmrig-direct-proxy',
    capabilities: [
      'xmrig direct proxy'
    ],
    category: 'github',
    example_use: 'Invoke xmrig-direct-proxy'
  },
  {
    name: 'xmrt_integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt_integration',
    description: 'Unified ecosystem health & integration hub - connects all XMRT repos (XMRT-Ecosystem, xmrt-wallet-public, mobilemonero, xmrtnet, xmrtdao) for comprehensive health reports and integration monitoring',
    capabilities: [
      'Multi-repository health monitoring',
      'Cross-repo integration verification',
      'Deployment status (Vercel',
      'Render',
      'Supabase)',
      'API health checks (mining',
      'faucet',
      'edge functions)',
      'Database performance metrics',
      'Community engagement analytics',
      'Comprehensive markdown reports',
      'Repository comparison',
      'Integration debugging',
      'Ecosystem-wide status overview'
    ],
    category: 'ecosystem',
    example_use: 'Generate comprehensive ecosystem health report covering all repos, deployments, APIs, and community engagement. Check integration between services. Compare repository activity.'
  },
  {
    name: 'xmrt-bridge',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-bridge',
    description: 'XMRT Ecosystem: xmrt bridge',
    capabilities: [
      'python service',
      'xmrt bridge'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-bridge'
  },
  {
    name: 'xmrt-coordination-core',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-coordination-core',
    description: 'XMRT Ecosystem: xmrt coordination core',
    capabilities: [
      'python service',
      'xmrt coordination core'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-coordination-core'
  },
  {
    name: 'xmrt-ecosystem-dashboard',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-ecosystem-dashboard',
    description: 'XMRT Ecosystem: xmrt ecosystem dashboard',
    capabilities: [
      'python service',
      'xmrt ecosystem dashboard'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-ecosystem-dashboard'
  },
  {
    name: 'xmrt-integration',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-integration',
    description: 'Auto-detected function: xmrt-integration',
    capabilities: [
      'xmrt integration'
    ],
    category: 'ecosystem',
    example_use: 'Invoke xmrt-integration'
  },
  {
    name: 'xmrt-integration-bridge',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-integration-bridge',
    description: 'XMRT Ecosystem: xmrt integration bridge',
    capabilities: [
      'python service',
      'xmrt integration bridge'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-integration-bridge'
  },
  {
    name: 'xmrt-mcp-server',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-mcp-server',
    description: 'XMRT Model Context Protocol server',
    capabilities: [
      'Multi-service integration',
      'Health monitoring',
      'Status reporting'
    ],
    category: 'ecosystem',
    example_use: 'Use xmrt mcp server for xmrt model context protocol server'
  },
  {
    name: 'xmrt-mine-guardian',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-mine-guardian',
    description: 'XMRT Ecosystem: xmrt mine guardian',
    capabilities: [
      'python service',
      'xmrt mine guardian'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-mine-guardian'
  },
  {
    name: 'xmrt-mining-optimizer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-mining-optimizer',
    description: 'XMRT Ecosystem: xmrt mining optimizer',
    capabilities: [
      'python service',
      'xmrt mining optimizer'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-mining-optimizer'
  },
  {
    name: 'xmrt-mobile-miner',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-mobile-miner',
    description: 'XMRT Ecosystem: xmrt mobile miner',
    capabilities: [
      'python service',
      'xmrt mobile miner'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-mobile-miner'
  },
  {
    name: 'xmrt-mobile-mining-optimizer',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-mobile-mining-optimizer',
    description: 'XMRT Ecosystem: xmrt mobile mining optimizer',
    capabilities: [
      'python service',
      'xmrt mobile mining optimizer'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-mobile-mining-optimizer'
  },
  {
    name: 'xmrt-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-monitor',
    description: 'XMRT Ecosystem: xmrt monitor',
    capabilities: [
      'python service',
      'xmrt monitor'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-monitor'
  },
  {
    name: 'xmrt-repository-monitor',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-repository-monitor',
    description: 'XMRT Ecosystem: xmrt repository monitor',
    capabilities: [
      'python service',
      'xmrt repository monitor'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-repository-monitor'
  },
  {
    name: 'xmrt-slack-main',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-slack-main',
    description: 'XMRT Ecosystem: xmrt slack main',
    capabilities: [
      'python service',
      'xmrt slack main'
    ],
    category: 'ecosystem',
    example_use: 'Interact with xmrt-slack-main'
  },
  {
    name: 'xmrt-workflow-templates',
    url: 'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/xmrt-workflow-templates',
    description: 'Auto-detected function: xmrt-workflow-templates',
    capabilities: [
      'xmrt workflow templates'
    ],
    category: 'task-management',
    example_use: 'Invoke xmrt-workflow-templates'
  }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL2VkZ2VGdW5jdGlvblJlZ2lzdHJ5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEVkZ2UgRnVuY3Rpb24gUmVnaXN0cnkgLSBVc2VkIGJ5IHNlYXJjaC1lZGdlLWZ1bmN0aW9uc1xuLy8gQ29tcHJlaGVuc2l2ZSByZWdpc3RyeSBvZiBhbGwgYXZhaWxhYmxlIGVkZ2UgZnVuY3Rpb25zXG4vLyBUb3RhbDogMTk0IGZ1bmN0aW9ucyBhY3Jvc3MgMjUgY2F0ZWdvcmllc1xuLy8gRm9yIGRldGFpbGVkIHNjaGVtYXMgYW5kIGFjdGlvbiBkb2NzLCBpbXBvcnQgZnJvbSBfc2hhcmVkL2VkZ2VGdW5jdGlvbktub3dsZWRnZS50c1xuXG5leHBvcnQgaW50ZXJmYWNlIEVkZ2VGdW5jdGlvbkFjdGlvbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgcmVxdWlyZWQ6IHN0cmluZ1tdO1xuICBvcHRpb25hbD86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVkZ2VGdW5jdGlvbkNhcGFiaWxpdHkge1xuICBuYW1lOiBzdHJpbmc7XG4gIHVybDogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBjYXBhYmlsaXRpZXM6IHN0cmluZ1tdO1xuICBjYXRlZ29yeTogJ2FpJyB8ICdtaW5pbmcnIHwgJ3dlYicgfCAnc3BlZWNoJyB8ICdmYXVjZXQnIHwgJ2Vjb3N5c3RlbScgfCAnZGVwbG95bWVudCcgfCAnZ2l0aHViJyB8ICdhdXRvbm9tb3VzJyB8ICdrbm93bGVkZ2UnIHwgJ3Rhc2stbWFuYWdlbWVudCcgfCAnbW9uaXRvcmluZycgfCAnY29kZS1leGVjdXRpb24nIHwgJ2RhdGFiYXNlJyB8ICduZXR3b3JrJyB8ICdzdXBlcmR1cGVyJyB8ICdkYWVtb24nIHwgJ2dvdmVybmFuY2UnIHwgJ3Jlc2VhcmNoJyB8ICdyZXZlbnVlJyB8ICd2c2NvJyB8ICdodW1lJyB8ICdhY3F1aXNpdGlvbicgfCAncGF5bWVudHMnIHwgJ2F1dG9tYXRpb24nO1xuICBleGFtcGxlX3VzZTogc3RyaW5nO1xuICAvKiogT3B0aW9uYWw6IHJlcXVpcmVkIHRvcC1sZXZlbCBwYXlsb2FkIGtleXMgKi9cbiAgcmVxdWlyZWRfcGFyYW1zPzogc3RyaW5nW107XG4gIC8qKiBPcHRpb25hbDogc3VwcG9ydGVkIGFjdGlvbiBuYW1lcyBmb3IgbXVsdGktYWN0aW9uIGZ1bmN0aW9ucyAqL1xuICBzdXBwb3J0ZWRfYWN0aW9ucz86IEVkZ2VGdW5jdGlvbkFjdGlvbltdO1xuICAvKiogT3B0aW9uYWw6IGEgbWluaW1hbCByZWFkeS10by1jb3B5IHBheWxvYWQgZXhhbXBsZSAqL1xuICBleGFtcGxlX3BheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAvKiogT3B0aW9uYWw6IGtleSBnb3RjaGFzIG9yIHVzYWdlIG5vdGVzIGZvciBFbGl6YSAqL1xuICBub3Rlcz86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY29uc3QgRURHRV9GVU5DVElPTlNfUkVHSVNUUlk6IEVkZ2VGdW5jdGlvbkNhcGFiaWxpdHlbXSA9IFtcbiAge1xuICAgIG5hbWU6ICdhY3Rpdml0eS1tb25pdG9yLWFwaScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYWN0aXZpdHktbW9uaXRvci1hcGknLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGFjdGl2aXR5IG1vbml0b3IgYXBpJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnYWN0aXZpdHkgbW9uaXRvciBhcGknXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGFjdGl2aXR5LW1vbml0b3ItYXBpJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2FkdmFuY2VkLWFuYWx5dGljcy1lbmdpbmUnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FkdmFuY2VkLWFuYWx5dGljcy1lbmdpbmUnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGFkdmFuY2VkIGFuYWx5dGljcyBlbmdpbmUnLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdhZHZhbmNlZCBhbmFseXRpY3MgZW5naW5lJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhZHZhbmNlZC1hbmFseXRpY3MtZW5naW5lJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2FnZW50LWNvb3JkaW5hdGlvbi1odWInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FnZW50LWNvb3JkaW5hdGlvbi1odWInLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+knSBBZ2VudCBDb29yZGluYXRpb24gSHViIC0gQ2VudHJhbCBodWIgZm9yIG11bHRpLWFnZW50IHN5bmNocm9uaXphdGlvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1JlZ2lzdGVyIGFnZW50JywgJ0Jyb2FkY2FzdCBtZXNzYWdlJywgJ0Nvb3JkaW5hdGUgdGFza3MnLCAnU2hhcmVkIG1lbW9yeSddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ3tcImFjdGlvblwiOlwiYnJvYWRjYXN0XCIsIFwibWVzc2FnZVwiOlwiU3lzdGVtIG1haW50ZW5hbmNlIGluIDEwIG1pbnNcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYWdlbnQtZGVwbG95bWVudC1jb29yZGluYXRvcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYWdlbnQtZGVwbG95bWVudC1jb29yZGluYXRvcicsXG4gICAgZGVzY3JpcHRpb246ICfwn5qAIEFnZW50IERlcGxveW1lbnQgLSBDb29yZGluYXRlIGFnZW50IGRlcGxveW1lbnRzIGFuZCB1cGRhdGVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRGVwbG95IGFnZW50JywgJ1VwZGF0ZSBjb25maWcnLCAnUm9sbGJhY2sgdmVyc2lvbicsICdDaGVjayBzdGF0dXMnXSxcbiAgICBjYXRlZ29yeTogJ2RlcGxveW1lbnQnLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiYWN0aW9uXCI6XCJkZXBsb3lcIiwgXCJhZ2VudF9uYW1lXCI6XCJyZXNlYXJjaGVyXCIsIFwidmVyc2lvblwiOlwidjIuMFwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdhZ2VudC1naXRodWItaW50ZWdyYXRpb24nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FnZW50LWdpdGh1Yi1pbnRlZ3JhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogYWdlbnQgZ2l0aHViIGludGVncmF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnYWdlbnQgZ2l0aHViIGludGVncmF0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhZ2VudC1naXRodWItaW50ZWdyYXRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYWdlbnQtbWFuYWdlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYWdlbnQtbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICdQcmltYXJ5IGFnZW50IG9yY2hlc3RyYXRpb24gLSBjcmVhdGUsIG1hbmFnZSwgYW5kIG1vbml0b3IgQUkgYWdlbnRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTGlzdCBhZ2VudHMnLCAnU3Bhd24gYWdlbnQnLCAnVXBkYXRlIGFnZW50IHN0YXR1cycsICdBc3NpZ24gdGFzaycsICdMaXN0IHRhc2tzJywgJ1VwZGF0ZSB0YXNrJywgJ0RlbGV0ZSB0YXNrJywgJ0dldCB3b3JrbG9hZCddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0NyZWF0ZSBhIG5ldyBhZ2VudCBhbmQgYXNzaWduIHRoZW0gYSB0YXNrLCBtb25pdG9yIGFnZW50IHdvcmtsb2FkcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdhZ2VudC13ZWJob29rLWhhbmRsZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FnZW50LXdlYmhvb2staGFuZGxlcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogYWdlbnQgd2ViaG9vayBoYW5kbGVyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnYWdlbnQgd2ViaG9vayBoYW5kbGVyJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhZ2VudC13ZWJob29rLWhhbmRsZXInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYWdlbnQtd29yay1leGVjdXRvcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYWdlbnQtd29yay1leGVjdXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBhZ2VudC13b3JrLWV4ZWN1dG9yJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnYWdlbnQgd29yayBleGVjdXRvciddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBhZ2VudC13b3JrLWV4ZWN1dG9yJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2FnZ3JlZ2F0ZS1kZXZpY2UtbWV0cmljcycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYWdncmVnYXRlLWRldmljZS1tZXRyaWNzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0FnZ3JlZ2F0ZSBhbmQgYW5hbHl6ZSBkZXZpY2UgbWluaW5nIG1ldHJpY3Mgb3ZlciB0aW1lJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTWluaW5nIHN0YXRzJywgJ0RldmljZSBtb25pdG9yaW5nJywgJ0hhc2hyYXRlIHRyYWNraW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdtaW5pbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGFnZ3JlZ2F0ZSBkZXZpY2UgbWV0cmljcyBmb3IgYWdncmVnYXRlIGFuZCBhbmFseXplIGRldmljZSBtaW5pbmcgbWV0cmljcyBvdmVyIHRpbWUnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYWktY2hhdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYWktY2hhdCcsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBhaS1jaGF0JyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnYWkgY2hhdCddLFxuICAgIGNhdGVnb3J5OiAnYWknLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGFpLWNoYXQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYWktZHJpdmVuLW1pbmluZy1vcHRpbWl6YXRpb24tcGxhdGZvcm0nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FpLWRyaXZlbi1taW5pbmctb3B0aW1pemF0aW9uLXBsYXRmb3JtJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogQWkgRHJpdmVuIE1pbmluZyBPcHRpbWl6YXRpb24gUGxhdGZvcm0nLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ2FpIGRyaXZlbiBtaW5pbmcgb3B0aW1pemF0aW9uIHBsYXRmb3JtJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhaS1kcml2ZW4tbWluaW5nLW9wdGltaXphdGlvbi1wbGF0Zm9ybSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdhaS1wb3dlcmVkLW1vYmlsZS1taW5pbmctaW5zaWdodHMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FpLXBvd2VyZWQtbW9iaWxlLW1pbmluZy1pbnNpZ2h0cycsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IEFpIFBvd2VyZWQgTW9iaWxlIE1pbmluZyBJbnNpZ2h0cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAnYWkgcG93ZXJlZCBtb2JpbGUgbWluaW5nIGluc2lnaHRzJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhaS1wb3dlcmVkLW1vYmlsZS1taW5pbmctaW5zaWdodHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYWktcG93ZXJlZC1wcml2YWN5LWd1YXJkaWFuJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9haS1wb3dlcmVkLXByaXZhY3ktZ3VhcmRpYW4nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBBaSBQb3dlcmVkIFByaXZhY3kgR3VhcmRpYW4nLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ2FpIHBvd2VyZWQgcHJpdmFjeSBndWFyZGlhbiddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggYWktcG93ZXJlZC1wcml2YWN5LWd1YXJkaWFuJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2FpLXBvd2VyZWQtcHJpdmFjeS1zaGllbGQnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FpLXBvd2VyZWQtcHJpdmFjeS1zaGllbGQnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBBaSBQb3dlcmVkIFByaXZhY3kgU2hpZWxkJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZWNvc3lzdGVtIGFwcCcsICdhaSBwb3dlcmVkIHByaXZhY3kgc2hpZWxkJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhaS1wb3dlcmVkLXByaXZhY3ktc2hpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2FpLXRvb2wtZnJhbWV3b3JrJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9haS10b29sLWZyYW1ld29yaycsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogYWkgdG9vbCBmcmFtZXdvcmsnLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdhaSB0b29sIGZyYW1ld29yayddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggYWktdG9vbC1mcmFtZXdvcmsnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYW5hbHl0aWNzLXN5c3RlbScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYW5hbHl0aWNzLXN5c3RlbScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogYW5hbHl0aWNzIHN5c3RlbScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ2FuYWx5dGljcyBzeXN0ZW0nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGFuYWx5dGljcy1zeXN0ZW0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYW5kcm9pZC1jb250cm9sJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9hbmRyb2lkLWNvbnRyb2wnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+TsSBBbmRyb2lkIERldmljZSBDb250cm9sIC0gQ29udHJvbCBwaHlzaWNhbCBBbmRyb2lkIGRldmljZXMnLFxuICAgIGNhcGFiaWxpdGllczogWydTY3JlZW4gdGFwJywgJ1N3aXBlJywgJ1R5cGUgdGV4dCcsICdUYWtlIHNjcmVlbnNob3QnLCAnT3BlbiBhcHAnLCAnSG9tZSBidXR0b24nXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9tYXRpb24nLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiYWN0aW9uXCI6XCJ0YXBcIiwgXCJ4XCI6NTAwLCBcInlcIjoxMDAwLCBcImRldmljZV9pZFwiOlwiZW11bGF0b3ItNTU1NFwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdhcGktZG9jcy1nZW5lcmF0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2FwaS1kb2NzLWdlbmVyYXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogYXBpIGRvY3MgZ2VuZXJhdG9yJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnYXBpIGRvY3MgZ2VuZXJhdG9yJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBhcGktZG9jcy1nZW5lcmF0b3InXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYXBpLWtleS1oZWFsdGgtbW9uaXRvcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYXBpLWtleS1oZWFsdGgtbW9uaXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdNb25pdG9yIGhlYWx0aCBhbmQgdXNhZ2Ugb2YgQVBJIGtleXMgYWNyb3NzIHNlcnZpY2VzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnSGVhbHRoIGNoZWNrcycsICdQZXJmb3JtYW5jZSBtZXRyaWNzJywgJ1N0YXR1cyBtb25pdG9yaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdtb25pdG9yaW5nJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBhcGkga2V5IGhlYWx0aCBtb25pdG9yIGZvciBtb25pdG9yIGhlYWx0aCBhbmQgdXNhZ2Ugb2YgYXBpIGtleXMgYWNyb3NzIHNlcnZpY2VzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2F1dGgtaGVhbHRoLW1vbml0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2F1dGgtaGVhbHRoLW1vbml0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogYXV0aC1oZWFsdGgtbW9uaXRvcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2F1dGggaGVhbHRoIG1vbml0b3InXSxcbiAgICBjYXRlZ29yeTogJ21vbml0b3JpbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGF1dGgtaGVhbHRoLW1vbml0b3InXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYXV0b25vbW91cy1jb2RlLWZpeGVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9hdXRvbm9tb3VzLWNvZGUtZml4ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnU2VsZi1oZWFsaW5nIGNvZGUgZXhlY3V0aW9uIC0gYXV0by1maXhlcyBhbmQgcmUtZXhlY3V0ZXMgZmFpbGVkIFB5dGhvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0F1dG8tZGV0ZWN0IGZhaWx1cmVzJywgJ0ZpeCBzeW50YXggZXJyb3JzJywgJ0ZpeCBsb2dpYyBlcnJvcnMnLCAnUmUtZXhlY3V0ZSBjb2RlJywgJ0hhbmRsZSBBUEkgZmFpbHVyZXMnXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9ub21vdXMnLFxuICAgIGV4YW1wbGVfdXNlOiAnQXV0b21hdGljYWxseSBmaXhlcyBmYWlsZWQgUHl0aG9uIGV4ZWN1dGlvbnMgd2l0aG91dCBodW1hbiBpbnRlcnZlbnRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnYXV0b25vbW91cy1jb250cm9sbGVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9hdXRvbm9tb3VzLWNvbnRyb2xsZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGF1dG9ub21vdXMgY29udHJvbGxlcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ2F1dG9ub21vdXMgY29udHJvbGxlciddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggYXV0b25vbW91cy1jb250cm9sbGVyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2F1dG9ub21vdXMtY29yZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYXV0b25vbW91cy1jb3JlJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiBhdXRvbm9tb3VzIGNvcmUnLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdhdXRvbm9tb3VzIGNvcmUnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGF1dG9ub21vdXMtY29yZSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdhdXRvbm9tb3VzLWRlY2lzaW9uLW1ha2VyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9hdXRvbm9tb3VzLWRlY2lzaW9uLW1ha2VyJyxcbiAgICBkZXNjcmlwdGlvbjogJ/Cfp6AgQXV0b25vbW91cyBEZWNpc2lvbiBNYWtlciAtIEFJLWRyaXZlbiBkZWNpc2lvbnMnLFxuICAgIGNhcGFiaWxpdGllczogWydEZWNpc2lvbiBhbmFseXNpcycsICdJbXBhY3QgYXNzZXNzbWVudCcsICdSZWNvbW1lbmRhdGlvbnMnXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9ub21vdXMnLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiZGVjaXNpb25fdHlwZVwiOlwidGFza19hc3NpZ25tZW50XCIsXCJjb250ZXh0XCI6ey4uLn19J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2F1dG9ub21vdXMtbGVhcm5pbmctY29yZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYXV0b25vbW91cy1sZWFybmluZy1jb3JlJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiBhdXRvbm9tb3VzIGxlYXJuaW5nIGNvcmUnLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdhdXRvbm9tb3VzIGxlYXJuaW5nIGNvcmUnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGF1dG9ub21vdXMtbGVhcm5pbmctY29yZSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdicmlnaHRkYXRhLW1jcC1pbnRlZ3JhdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvYnJpZ2h0ZGF0YS1tY3AtaW50ZWdyYXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGJyaWdodGRhdGEgbWNwIGludGVncmF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnYnJpZ2h0ZGF0YSBtY3AgaW50ZWdyYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGJyaWdodGRhdGEtbWNwLWludGVncmF0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2Jyb2FkY2FzdC1zdGF0ZS1jaGFuZ2UnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2Jyb2FkY2FzdC1zdGF0ZS1jaGFuZ2UnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogYnJvYWRjYXN0LXN0YXRlLWNoYW5nZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Jyb2FkY2FzdCBzdGF0ZSBjaGFuZ2UnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgYnJvYWRjYXN0LXN0YXRlLWNoYW5nZSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjLXN1aXRlLWF1dG9ub21vdXMtd29ya2Zsb3dzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jLXN1aXRlLWF1dG9ub21vdXMtd29ya2Zsb3dzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogQyBTdWl0ZSBBdXRvbm9tb3VzIFdvcmtmbG93cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAnYyBzdWl0ZSBhdXRvbm9tb3VzIHdvcmtmbG93cyddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggYy1zdWl0ZS1hdXRvbm9tb3VzLXdvcmtmbG93cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjaGF0LXN5c3RlbScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvY2hhdC1zeXN0ZW0nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGNoYXQgc3lzdGVtJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnY2hhdCBzeXN0ZW0nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGNoYXQtc3lzdGVtJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2NoZWNrLWZhdWNldC1lbGlnaWJpbGl0eScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvY2hlY2stZmF1Y2V0LWVsaWdpYmlsaXR5JyxcbiAgICBkZXNjcmlwdGlvbjogJ0NoZWNrIGlmIHVzZXIgaXMgZWxpZ2libGUgZm9yIFhNUlQgZmF1Y2V0IGNsYWltJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRWxpZ2liaWxpdHkgdmVyaWZpY2F0aW9uJywgJ0Nvb2xkb3duIGNoZWNraW5nJywgJ1VzZXIgdmFsaWRhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAnZmF1Y2V0JyxcbiAgICBleGFtcGxlX3VzZTogJ1ZlcmlmeSBpZiB1c2VyIGNhbiBjbGFpbSBYTVJUIHRva2VucyBmcm9tIGZhdWNldCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjaGVjay1mcm9udGVuZC1oZWFsdGgnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2NoZWNrLWZyb250ZW5kLWhlYWx0aCcsXG4gICAgZGVzY3JpcHRpb246ICdIZWFsdGggY2hlY2sgZm9yIGZyb250ZW5kIGFwcGxpY2F0aW9uIHN0YXR1cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0hlYWx0aCBjaGVja3MnLCAnUGVyZm9ybWFuY2UgbWV0cmljcycsICdTdGF0dXMgbW9uaXRvcmluZyddLFxuICAgIGNhdGVnb3J5OiAnbW9uaXRvcmluZycsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgY2hlY2sgZnJvbnRlbmQgaGVhbHRoIGZvciBoZWFsdGggY2hlY2sgZm9yIGZyb250ZW5kIGFwcGxpY2F0aW9uIHN0YXR1cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjbGFpbS1mYXVjZXQtdG9rZW5zJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jbGFpbS1mYXVjZXQtdG9rZW5zJyxcbiAgICBkZXNjcmlwdGlvbjogJ1Byb2Nlc3MgWE1SVCB0b2tlbiBmYXVjZXQgY2xhaW1zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVG9rZW4gZGlzdHJpYnV0aW9uJywgJ0NsYWltIHByb2Nlc3NpbmcnLCAnVHJhbnNhY3Rpb24gY3JlYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2ZhdWNldCcsXG4gICAgZXhhbXBsZV91c2U6ICdIZWxwIHVzZXJzIGNsYWltIGZyZWUgWE1SVCB0b2tlbnMgZnJvbSB0aGUgZmF1Y2V0J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2NsZWFudXAtZHVwbGljYXRlLXRhc2tzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jbGVhbnVwLWR1cGxpY2F0ZS10YXNrcycsXG4gICAgZGVzY3JpcHRpb246ICdSZW1vdmUgZHVwbGljYXRlIHRhc2tzIGZyb20gdGhlIHRhc2sgbWFuYWdlbWVudCBzeXN0ZW0nLFxuICAgIGNhcGFiaWxpdGllczogWydUYXNrIGNyZWF0aW9uJywgJ1Rhc2sgYXNzaWdubWVudCcsICdXb3JrbG9hZCBiYWxhbmNpbmcnXSxcbiAgICBjYXRlZ29yeTogJ3Rhc2stbWFuYWdlbWVudCcsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgY2xlYW51cCBkdXBsaWNhdGUgdGFza3MgZm9yIHJlbW92ZSBkdXBsaWNhdGUgdGFza3MgZnJvbSB0aGUgdGFzayBtYW5hZ2VtZW50IHN5c3RlbSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjb2RlLW1vbml0b3ItZGFlbW9uJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jb2RlLW1vbml0b3ItZGFlbW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbnRpbnVvdXMgbW9uaXRvcmluZyBkYWVtb24gZm9yIGNvZGUgZXhlY3V0aW9uIGFuZCBlcnJvcnMnLFxuICAgIGNhcGFiaWxpdGllczogWydFeGVjdXRlIGNvZGUnLCAnRXJyb3IgaGFuZGxpbmcnLCAnU2FuZGJveGVkIGV4ZWN1dGlvbiddLFxuICAgIGNhdGVnb3J5OiAnY29kZS1leGVjdXRpb24nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGNvZGUgbW9uaXRvciBkYWVtb24gZm9yIGNvbnRpbnVvdXMgbW9uaXRvcmluZyBkYWVtb24gZm9yIGNvZGUgZXhlY3V0aW9uIGFuZCBlcnJvcnMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnY29tbXVuaXR5LWdvdmVybmFuY2UtZGFzaGJvYXJkJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jb21tdW5pdHktZ292ZXJuYW5jZS1kYXNoYm9hcmQnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBDb21tdW5pdHkgR292ZXJuYW5jZSBEYXNoYm9hcmQnLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ2NvbW11bml0eSBnb3Zlcm5hbmNlIGRhc2hib2FyZCddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggY29tbXVuaXR5LWdvdmVybmFuY2UtZGFzaGJvYXJkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2NvbW11bml0eS1pbnRlbGxpZ2VuY2Utc3lzdGVtJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jb21tdW5pdHktaW50ZWxsaWdlbmNlLXN5c3RlbScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogY29tbXVuaXR5IGludGVsbGlnZW5jZSBzeXN0ZW0nLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdjb21tdW5pdHkgaW50ZWxsaWdlbmNlIHN5c3RlbSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggY29tbXVuaXR5LWludGVsbGlnZW5jZS1zeXN0ZW0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnY29tbXVuaXR5LXNwb3RsaWdodC1wb3N0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jb21tdW5pdHktc3BvdGxpZ2h0LXBvc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgYW5kIHBvc3QgY29tbXVuaXR5IHNwb3RsaWdodCBjb250ZW50JyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQXV0b21hdGVkIHBvc3RpbmcnLCAnQ29udGVudCBnZW5lcmF0aW9uJywgJ1NjaGVkdWxpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9ub21vdXMnLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGNvbW11bml0eSBzcG90bGlnaHQgcG9zdCBmb3IgZ2VuZXJhdGUgYW5kIHBvc3QgY29tbXVuaXR5IHNwb3RsaWdodCBjb250ZW50J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2NvbnZlcnNhdGlvbi1hY2Nlc3MnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2NvbnZlcnNhdGlvbi1hY2Nlc3MnLFxuICAgIGRlc2NyaXB0aW9uOiAnTWFuYWdlIGNvbnZlcnNhdGlvbiBhY2Nlc3MgYW5kIHBlcm1pc3Npb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBpbnRlZ3JhdGlvbicsICdIZWFsdGggbW9uaXRvcmluZycsICdTdGF0dXMgcmVwb3J0aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGNvbnZlcnNhdGlvbiBhY2Nlc3MgZm9yIG1hbmFnZSBjb252ZXJzYXRpb24gYWNjZXNzIGFuZCBwZXJtaXNzaW9ucydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjb252ZXJ0LXNlc3Npb24tdG8tdXNlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvY29udmVydC1zZXNzaW9uLXRvLXVzZXInLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+RpCBTZXNzaW9uIENvbnZlcnNpb24gLSBDb252ZXJ0IGFub255bW91cyBzZXNzaW9ucyB0byB1c2VycycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1VzZXIgY3JlYXRpb24nLCAnUHJvZmlsZSBsaW5raW5nJywgJ1Nlc3Npb24gbWlncmF0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdhY3F1aXNpdGlvbicsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJzZXNzaW9uX2tleVwiOlwiYWJjMTIzXCIsXCJlbWFpbFwiOlwidXNlckBleGFtcGxlLmNvbVwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdjb28tY2hhdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvY29vLWNoYXQnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogY29vLWNoYXQnLFxuICAgIGNhcGFiaWxpdGllczogWydjb28gY2hhdCddLFxuICAgIGNhdGVnb3J5OiAnYWknLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGNvby1jaGF0J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2NvcnJlbGF0ZS11c2VyLWlkZW50aXR5JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9jb3JyZWxhdGUtdXNlci1pZGVudGl0eScsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBjb3JyZWxhdGUtdXNlci1pZGVudGl0eScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2NvcnJlbGF0ZSB1c2VyIGlkZW50aXR5J10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGNvcnJlbGF0ZS11c2VyLWlkZW50aXR5J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2NyZWF0ZS1zdWl0ZS1xdW90ZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvY3JlYXRlLXN1aXRlLXF1b3RlJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IGNyZWF0ZS1zdWl0ZS1xdW90ZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2NyZWF0ZSBzdWl0ZSBxdW90ZSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBjcmVhdGUtc3VpdGUtcXVvdGUnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZGFpbHktZGlzY3Vzc2lvbi1wb3N0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9kYWlseS1kaXNjdXNzaW9uLXBvc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgYW5kIHBvc3QgZGFpbHkgZGlzY3Vzc2lvbiB0b3BpY3MnLFxuICAgIGNhcGFiaWxpdGllczogWydBdXRvbWF0ZWQgcG9zdGluZycsICdDb250ZW50IGdlbmVyYXRpb24nLCAnU2NoZWR1bGluZyddLFxuICAgIGNhdGVnb3J5OiAnYXV0b25vbW91cycsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgZGFpbHkgZGlzY3Vzc2lvbiBwb3N0IGZvciBnZW5lcmF0ZSBhbmQgcG9zdCBkYWlseSBkaXNjdXNzaW9uIHRvcGljcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkYWlseS1uZXdzLWZpbmRlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZGFpbHktbmV3cy1maW5kZXInLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+TsCBEYWlseSBOZXdzIEZpbmRlciAtIFNlYXJjaCBhbmQgY3VyYXRlIGRhaWx5IG5ld3MgdG9waWNzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRmluZCBuZXdzJywgJ0FuYWx5emUgdG9waWNzJywgJ0N1cmF0ZSBjb250ZW50JywgJ1NlYXJjaCB0cmVuZHMnXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9ub21vdXMnLFxuICAgIGV4YW1wbGVfdXNlOiAne1widG9waWNcIjpcIkFJIHRlY2hub2xvZ3lcIiwgXCJkYXlzX2JhY2tcIjoxfSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkZWJ1Zy1hbmFseXRpY3MtZGF0YS1mbG93JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9kZWJ1Zy1hbmFseXRpY3MtZGF0YS1mbG93JyxcbiAgICBkZXNjcmlwdGlvbjogJ/CflI0gRGVidWcgQW5hbHl0aWNzIC0gVHJhY2UgYW5hbHl0aWNzIGRhdGEgZmxvdycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0RhdGEgZmxvdyB0cmFjaW5nJywgJ0dhcCBpZGVudGlmaWNhdGlvbicsICdQaXBlbGluZSBkZWJ1Z2dpbmcnXSxcbiAgICBjYXRlZ29yeTogJ21vbml0b3JpbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnRGVidWcgYW5hbHl0aWNzIHBpcGVsaW5lIGlzc3VlcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkZWNlbnRyYWxpemVkLWlkZW50aXR5LW1hbmFnZW1lbnQtc3lzdGVtJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9kZWNlbnRyYWxpemVkLWlkZW50aXR5LW1hbmFnZW1lbnQtc3lzdGVtJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogRGVjZW50cmFsaXplZCBJZGVudGl0eSBNYW5hZ2VtZW50IFN5c3RlbScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAnZGVjZW50cmFsaXplZCBpZGVudGl0eSBtYW5hZ2VtZW50IHN5c3RlbSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggZGVjZW50cmFsaXplZC1pZGVudGl0eS1tYW5hZ2VtZW50LXN5c3RlbSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkZWNlbnRyYWxpemVkLWlkZW50aXR5LXZlcmlmaWNhdGlvbi1zeXN0ZW0nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2RlY2VudHJhbGl6ZWQtaWRlbnRpdHktdmVyaWZpY2F0aW9uLXN5c3RlbScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IERlY2VudHJhbGl6ZWQgSWRlbnRpdHkgVmVyaWZpY2F0aW9uIFN5c3RlbScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAnZGVjZW50cmFsaXplZCBpZGVudGl0eSB2ZXJpZmljYXRpb24gc3lzdGVtJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBkZWNlbnRyYWxpemVkLWlkZW50aXR5LXZlcmlmaWNhdGlvbi1zeXN0ZW0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZGVjZW50cmFsaXplZC1tb2JpbGUtbWluaW5nLWh1YicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZGVjZW50cmFsaXplZC1tb2JpbGUtbWluaW5nLWh1YicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IERlY2VudHJhbGl6ZWQgTW9iaWxlIE1pbmluZyBIdWInLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ2RlY2VudHJhbGl6ZWQgbW9iaWxlIG1pbmluZyBodWInXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGRlY2VudHJhbGl6ZWQtbW9iaWxlLW1pbmluZy1odWInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZGVjZW50cmFsaXplZC1tb2JpbGUtbWluaW5nLW5ldHdvcmsnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2RlY2VudHJhbGl6ZWQtbW9iaWxlLW1pbmluZy1uZXR3b3JrJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogRGVjZW50cmFsaXplZCBNb2JpbGUgTWluaW5nIE5ldHdvcmsnLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ2RlY2VudHJhbGl6ZWQgbW9iaWxlIG1pbmluZyBuZXR3b3JrJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBkZWNlbnRyYWxpemVkLW1vYmlsZS1taW5pbmctbmV0d29yaydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkZWVwc2Vlay1jaGF0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9kZWVwc2Vlay1jaGF0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0FJIGNoYXQgdmlhIERlZXBTZWVrIG1vZGVsJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQUkgY2hhdCcsICdDb250ZXh0IGF3YXJlbmVzcycsICdOYXR1cmFsIGxhbmd1YWdlIHByb2Nlc3NpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2FpJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBkZWVwc2VlayBjaGF0IGZvciBhaSBjaGF0IHZpYSBkZWVwc2VlayBtb2RlbCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkZXBsb3ktYXBwcm92ZWQtZWRnZS1mdW5jdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZGVwbG95LWFwcHJvdmVkLWVkZ2UtZnVuY3Rpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+agCBEZXBsb3kgRWRnZSBGdW5jdGlvbiAtIERlcGxveSBhcHByb3ZlZCBmdW5jdGlvbnMnLFxuICAgIGNhcGFiaWxpdGllczogWydGdW5jdGlvbiBkZXBsb3ltZW50JywgJ0NvbmZpZyB1cGRhdGVzJywgJ1ZlcmlmaWNhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAnZGVwbG95bWVudCcsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJwcm9wb3NhbF9pZFwiOlwidXVpZFwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdkZXBsb3ltZW50LWhlYWx0aC1jaGVjaycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZGVwbG95bWVudC1oZWFsdGgtY2hlY2snLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGRlcGxveW1lbnQgaGVhbHRoIGNoZWNrJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnZGVwbG95bWVudCBoZWFsdGggY2hlY2snXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGRlcGxveW1lbnQtaGVhbHRoLWNoZWNrJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2RpYWdub3NlLXdvcmtmbG93LWZhaWx1cmUnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2RpYWdub3NlLXdvcmtmbG93LWZhaWx1cmUnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZGlhZ25vc2Utd29ya2Zsb3ctZmFpbHVyZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2RpYWdub3NlIHdvcmtmbG93IGZhaWx1cmUnXSxcbiAgICBjYXRlZ29yeTogJ2FpJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBkaWFnbm9zZS13b3JrZmxvdy1mYWlsdXJlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2Vjb3N5c3RlbS1oZWFsdGgtY2hlY2snLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2Vjb3N5c3RlbS1oZWFsdGgtY2hlY2snLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZWNvc3lzdGVtLWhlYWx0aC1jaGVjaycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBoZWFsdGggY2hlY2snXSxcbiAgICBjYXRlZ29yeTogJ21vbml0b3JpbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGVjb3N5c3RlbS1oZWFsdGgtY2hlY2snXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZWNvc3lzdGVtLW1vbml0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2Vjb3N5c3RlbS1tb25pdG9yJyxcbiAgICBkZXNjcmlwdGlvbjogJ01vbml0b3IgZW50aXJlIFhNUlQgVmVyY2VsIGVjb3N5c3RlbSBoZWFsdGggKHhtcnQtaW8sIHhtcnQtZWNvc3lzdGVtLCB4bXJ0LWRhby1lY29zeXN0ZW0pJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBoZWFsdGggY2hlY2tzJywgJ1BlcmZvcm1hbmNlIG1ldHJpY3MnLCAnU3RhdHVzIG1vbml0b3JpbmcnLCAnVmVyY2VsIGRlcGxveW1lbnQgdHJhY2tpbmcnXSxcbiAgICBjYXRlZ29yeTogJ21vbml0b3JpbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnTW9uaXRvciBhbGwgVmVyY2VsIHNlcnZpY2VzIGhlYWx0aCwgY2hlY2sgZWNvc3lzdGVtIHBlcmZvcm1hbmNlLCB0cmFjayBkZXBsb3ltZW50IHN0YXR1cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdlY29zeXN0ZW0td2ViaG9vaycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZWNvc3lzdGVtLXdlYmhvb2snLFxuICAgIGRlc2NyaXB0aW9uOiAnSGFuZGxlIGVjb3N5c3RlbSBldmVudHMgYW5kIHdlYmhvb2tzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRXZlbnQgcHJvY2Vzc2luZycsICdXZWJob29rIGhhbmRsaW5nJywgJ1N5c3RlbSBub3RpZmljYXRpb25zJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnUHJvY2VzcyBlY29zeXN0ZW0gZXZlbnRzIGFuZCBpbnRlZ3JhdGUgd2l0aCBleHRlcm5hbCBzZXJ2aWNlcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdlbGl6YS1pbnRlbGxpZ2VuY2UtY29vcmRpbmF0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2VsaXphLWludGVsbGlnZW5jZS1jb29yZGluYXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdDb29yZGluYXRlcyBpbnRlbGxpZ2VuY2UgZ2F0aGVyaW5nIGFuZCBrbm93bGVkZ2Ugc3ludGhlc2lzIGFjcm9zcyBhbGwgYWdlbnRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnSW50ZWxsaWdlbmNlIGNvb3JkaW5hdGlvbicsICdLbm93bGVkZ2Ugc3ludGhlc2lzJywgJ011bHRpLWFnZW50IG9yY2hlc3RyYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9ub21vdXMnLFxuICAgIGV4YW1wbGVfdXNlOiAnQ29vcmRpbmF0ZSBpbnRlbGxpZ2VuY2UgYWNyb3NzIGFnZW50cywgc3ludGhlc2l6ZSBrbm93bGVkZ2UsIG9yY2hlc3RyYXRlIHdvcmtmbG93cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdlbGl6YS1weXRob24tcnVudGltZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZWxpemEtcHl0aG9uLXJ1bnRpbWUnLFxuICAgIGRlc2NyaXB0aW9uOiAnUHl0aG9uIHJ1bnRpbWUgZW52aXJvbm1lbnQgZm9yIEVsaXphIGFnZW50JyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRXhlY3V0ZSBjb2RlJywgJ0Vycm9yIGhhbmRsaW5nJywgJ1NhbmRib3hlZCBleGVjdXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2NvZGUtZXhlY3V0aW9uJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBlbGl6YSBweXRob24gcnVudGltZSBmb3IgcHl0aG9uIHJ1bnRpbWUgZW52aXJvbm1lbnQgZm9yIGVsaXphIGFnZW50J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2VsaXphLXNlbGYtZXZhbHVhdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZWxpemEtc2VsZi1ldmFsdWF0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ1NlbGYtZXZhbHVhdGlvbiBhbmQgcGVyZm9ybWFuY2UgYW5hbHlzaXMgZm9yIGNvbnRpbnVvdXMgaW1wcm92ZW1lbnQnLFxuICAgIGNhcGFiaWxpdGllczogWydQZXJmb3JtYW5jZSBhbmFseXNpcycsICdTZWxmLWV2YWx1YXRpb24nLCAnSW1wcm92ZW1lbnQgcmVjb21tZW5kYXRpb25zJ10sXG4gICAgY2F0ZWdvcnk6ICdhdXRvbm9tb3VzJyxcbiAgICBleGFtcGxlX3VzZTogJ0FuYWx5emUgc3lzdGVtIHBlcmZvcm1hbmNlLCBldmFsdWF0ZSBlZmZlY3RpdmVuZXNzLCByZWNvbW1lbmQgaW1wcm92ZW1lbnRzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2VuaGFuY2VkLWFwaS1lbmRwb2ludHMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2VuaGFuY2VkLWFwaS1lbmRwb2ludHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGVuaGFuY2VkIGFwaSBlbmRwb2ludHMnLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdlbmhhbmNlZCBhcGkgZW5kcG9pbnRzJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBlbmhhbmNlZC1hcGktZW5kcG9pbnRzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2VuaGFuY2VkLWF1dG9ub21vdXMtY29udHJvbGxlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZW5oYW5jZWQtYXV0b25vbW91cy1jb250cm9sbGVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiBlbmhhbmNlZCBhdXRvbm9tb3VzIGNvbnRyb2xsZXInLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdlbmhhbmNlZCBhdXRvbm9tb3VzIGNvbnRyb2xsZXInXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGVuaGFuY2VkLWF1dG9ub21vdXMtY29udHJvbGxlcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdlbmhhbmNlZC1jaGF0LXN5c3RlbScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZW5oYW5jZWQtY2hhdC1zeXN0ZW0nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGVuaGFuY2VkIGNoYXQgc3lzdGVtJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnZW5oYW5jZWQgY2hhdCBzeXN0ZW0nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGVuaGFuY2VkLWNoYXQtc3lzdGVtJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2VuaGFuY2VkLWxlYXJuaW5nJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9lbmhhbmNlZC1sZWFybmluZycsXG4gICAgZGVzY3JpcHRpb246ICdBZHZhbmNlZCBtYWNoaW5lIGxlYXJuaW5nIGFuZCBwYXR0ZXJuIHJlY29nbml0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnS25vd2xlZGdlIHN0b3JhZ2UnLCAnU2VtYW50aWMgc2VhcmNoJywgJ0VudGl0eSByZWxhdGlvbnNoaXBzJ10sXG4gICAgY2F0ZWdvcnk6ICdrbm93bGVkZ2UnLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGVuaGFuY2VkIGxlYXJuaW5nIGZvciBhZHZhbmNlZCBtYWNoaW5lIGxlYXJuaW5nIGFuZCBwYXR0ZXJuIHJlY29nbml0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2VuaGFuY2VkLW11bHRpLWFnZW50LWNvb3JkaW5hdG9yJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9lbmhhbmNlZC1tdWx0aS1hZ2VudC1jb29yZGluYXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogZW5oYW5jZWQgbXVsdGkgYWdlbnQgY29vcmRpbmF0b3InLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdlbmhhbmNlZCBtdWx0aSBhZ2VudCBjb29yZGluYXRvciddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggZW5oYW5jZWQtbXVsdGktYWdlbnQtY29vcmRpbmF0b3InXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZXZhbHVhdGUtY29tbXVuaXR5LWlkZWEnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2V2YWx1YXRlLWNvbW11bml0eS1pZGVhJyxcbiAgICBkZXNjcmlwdGlvbjogJ0V2YWx1YXRlIGNvbW11bml0eS1zdWJtaXR0ZWQgaWRlYXMgZm9yIGZlYXNpYmlsaXR5IGFuZCBpbXBhY3QnLFxuICAgIGNhcGFiaWxpdGllczogWydJZGVhIGV2YWx1YXRpb24nLCAnRmVhc2liaWxpdHkgYW5hbHlzaXMnLCAnSW1wYWN0IGFzc2Vzc21lbnQnXSxcbiAgICBjYXRlZ29yeTogJ2dvdmVybmFuY2UnLFxuICAgIGV4YW1wbGVfdXNlOiAnRXZhbHVhdGUgY29tbXVuaXR5IHByb3Bvc2FscywgYXNzZXNzIGZlYXNpYmlsaXR5LCBkZXRlcm1pbmUgaW1wYWN0J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2V2ZW5pbmctc3VtbWFyeS1wb3N0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9ldmVuaW5nLXN1bW1hcnktcG9zdCcsXG4gICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBhbmQgcG9zdCBldmVuaW5nIHN1bW1hcnkgcmVwb3J0cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0F1dG9tYXRlZCBwb3N0aW5nJywgJ0NvbnRlbnQgZ2VuZXJhdGlvbicsICdTY2hlZHVsaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdhdXRvbm9tb3VzJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBldmVuaW5nIHN1bW1hcnkgcG9zdCBmb3IgZ2VuZXJhdGUgYW5kIHBvc3QgZXZlbmluZyBzdW1tYXJ5IHJlcG9ydHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZXZlbnQtZGlzcGF0Y2hlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZXZlbnQtZGlzcGF0Y2hlcicsXG4gICAgZGVzY3JpcHRpb246ICfwn46vIEV2ZW50IERpc3BhdGNoZXIgLSBJbnRlbGxpZ2VudCBldmVudCByb3V0aW5nJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRXZlbnQgcm91dGluZycsICdBY3Rpb24gbWFwcGluZycsICdXb3JrZmxvdyB0cmlnZ2VyaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiZXZlbnRfdHlwZVwiOlwiZ2l0aHViOnB1c2hcIixcInBheWxvYWRcIjp7Li4ufX0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZXZlbnQtcm91dGVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9ldmVudC1yb3V0ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+TqCBFdmVudCBSb3V0ZXIgLSBDZW50cmFsIHdlYmhvb2sgaW5ncmVzcycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1dlYmhvb2sgdmFsaWRhdGlvbicsICdFdmVudCBub3JtYWxpemF0aW9uJywgJ0xvZ2dpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdSZWNlaXZlcyB3ZWJob29rcyBmcm9tIEdpdEh1YiwgVmVyY2VsJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2V4ZWN1dGUtYXBwcm92ZWQtcHJvcG9zYWwnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2V4ZWN1dGUtYXBwcm92ZWQtcHJvcG9zYWwnLFxuICAgIGRlc2NyaXB0aW9uOiAn4pyFIEV4ZWN1dGUgQXBwcm92ZWQgUHJvcG9zYWxzIC0gRmluYWxpemUgd2l0aCBjb2RlIGdlbmVyYXRpb24nLFxuICAgIGNhcGFiaWxpdGllczogWydDb2RlIGdlbmVyYXRpb24nLCAnVGFzayBjcmVhdGlvbicsICdHaXRIdWIgUFIgY3JlYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2dvdmVybmFuY2UnLFxuICAgIGV4YW1wbGVfdXNlOiAne1wicHJvcG9zYWxfaWRcIjpcInV1aWRcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZXhlY3V0ZS1zY2hlZHVsZWQtYWN0aW9ucycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZXhlY3V0ZS1zY2hlZHVsZWQtYWN0aW9ucycsXG4gICAgZGVzY3JpcHRpb246ICdFeGVjdXRlIHNjaGVkdWxlZCB0YXNrcyBhbmQgYWN0aW9ucycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ011bHRpLXNlcnZpY2UgaW50ZWdyYXRpb24nLCAnSGVhbHRoIG1vbml0b3JpbmcnLCAnU3RhdHVzIHJlcG9ydGluZyddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBleGVjdXRlIHNjaGVkdWxlZCBhY3Rpb25zIGZvciBleGVjdXRlIHNjaGVkdWxlZCB0YXNrcyBhbmQgYWN0aW9ucydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdleHRyYWN0LWtub3dsZWRnZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZXh0cmFjdC1rbm93bGVkZ2UnLFxuICAgIGRlc2NyaXB0aW9uOiAnRXh0cmFjdCBhbmQgc3RydWN0dXJlIGtub3dsZWRnZSBmcm9tIGNvbnZlcnNhdGlvbnMnLFxuICAgIGNhcGFiaWxpdGllczogWydLbm93bGVkZ2Ugc3RvcmFnZScsICdTZW1hbnRpYyBzZWFyY2gnLCAnRW50aXR5IHJlbGF0aW9uc2hpcHMnXSxcbiAgICBjYXRlZ29yeTogJ2tub3dsZWRnZScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgZXh0cmFjdCBrbm93bGVkZ2UgZm9yIGV4dHJhY3QgYW5kIHN0cnVjdHVyZSBrbm93bGVkZ2UgZnJvbSBjb252ZXJzYXRpb25zJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2ZldGNoLWF1dG8tZml4LXJlc3VsdHMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2ZldGNoLWF1dG8tZml4LXJlc3VsdHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnUmV0cmlldmUgcmVzdWx0cyBmcm9tIGF1dG9ub21vdXMgY29kZSBmaXhpbmcnLFxuICAgIGNhcGFiaWxpdGllczogWydNdWx0aS1zZXJ2aWNlIGludGVncmF0aW9uJywgJ0hlYWx0aCBtb25pdG9yaW5nJywgJ1N0YXR1cyByZXBvcnRpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgZmV0Y2ggYXV0byBmaXggcmVzdWx0cyBmb3IgcmV0cmlldmUgcmVzdWx0cyBmcm9tIGF1dG9ub21vdXMgY29kZSBmaXhpbmcnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZnVuY3Rpb24tdXNhZ2UtYW5hbHl0aWNzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9mdW5jdGlvbi11c2FnZS1hbmFseXRpY3MnLFxuICAgIGRlc2NyaXB0aW9uOiAnQW5hbHl0aWNzIGZvciBlZGdlIGZ1bmN0aW9uIHVzYWdlIHBhdHRlcm5zIGFuZCBwZXJmb3JtYW5jZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1VzYWdlIGFuYWx5dGljcycsICdQZXJmb3JtYW5jZSB0cmFja2luZycsICdQYXR0ZXJuIGFuYWx5c2lzJ10sXG4gICAgY2F0ZWdvcnk6ICdtb25pdG9yaW5nJyxcbiAgICBleGFtcGxlX3VzZTogJ0FuYWx5emUgZnVuY3Rpb24gdXNhZ2UsIHRyYWNrIHBlcmZvcm1hbmNlLCBpZGVudGlmeSBwYXR0ZXJucydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZW1pbmktYWdlbnQtY3JlYXRvcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2VtaW5pLWFnZW50LWNyZWF0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZ2VtaW5pLWFnZW50LWNyZWF0b3InLFxuICAgIGNhcGFiaWxpdGllczogWydnZW1pbmkgYWdlbnQgY3JlYXRvciddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBnZW1pbmktYWdlbnQtY3JlYXRvcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZW1pbmktY2hhdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2VtaW5pLWNoYXQnLFxuICAgIGRlc2NyaXB0aW9uOiAnQUkgY2hhdCB2aWEgR29vZ2xlIEdlbWluaSBtb2RlbCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0FJIGNoYXQnLCAnQ29udGV4dCBhd2FyZW5lc3MnLCAnTmF0dXJhbCBsYW5ndWFnZSBwcm9jZXNzaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdhaScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgZ2VtaW5pIGNoYXQgZm9yIGFpIGNoYXQgdmlhIGdvb2dsZSBnZW1pbmkgbW9kZWwnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZ2VtaW5pLWNvbXB1dGVyLXVzZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2VtaW5pLWNvbXB1dGVyLXVzZScsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBnZW1pbmktY29tcHV0ZXItdXNlJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZ2VtaW5pIGNvbXB1dGVyIHVzZSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBnZW1pbmktY29tcHV0ZXItdXNlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dlbmVyYXRlLXN0cmlwZS1saW5rJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9nZW5lcmF0ZS1zdHJpcGUtbGluaycsXG4gICAgZGVzY3JpcHRpb246ICfwn5KzIFN0cmlwZSBQYXltZW50IExpbmtzIC0gR2VuZXJhdGUgcGF5bWVudCBsaW5rcyBmb3IgdXBncmFkZXMnLFxuICAgIGNhcGFiaWxpdGllczogWydQYXltZW50IGxpbmsgZ2VuZXJhdGlvbicsICdDaGVja291dCBzZXNzaW9uJywgJ1RpZXIgcHJpY2luZyddLFxuICAgIGNhdGVnb3J5OiAncGF5bWVudHMnLFxuICAgIGV4YW1wbGVfdXNlOiAne1widGllclwiOlwicHJvXCIsXCJlbWFpbFwiOlwiY3VzdG9tZXJAZXhhbXBsZS5jb21cIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZ2V0LWNvZGUtZXhlY3V0aW9uLWxlc3NvbnMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dldC1jb2RlLWV4ZWN1dGlvbi1sZXNzb25zJyxcbiAgICBkZXNjcmlwdGlvbjogJ1JldHJpZXZlIGxlc3NvbnMgbGVhcm5lZCBmcm9tIGNvZGUgZXhlY3V0aW9ucycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0V4ZWN1dGUgY29kZScsICdFcnJvciBoYW5kbGluZycsICdTYW5kYm94ZWQgZXhlY3V0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdjb2RlLWV4ZWN1dGlvbicsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgZ2V0IGNvZGUgZXhlY3V0aW9uIGxlc3NvbnMgZm9yIHJldHJpZXZlIGxlc3NvbnMgbGVhcm5lZCBmcm9tIGNvZGUgZXhlY3V0aW9ucydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZXQtY3Jvbi1yZWdpc3RyeScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2V0LWNyb24tcmVnaXN0cnknLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZ2V0LWNyb24tcmVnaXN0cnknLFxuICAgIGNhcGFiaWxpdGllczogWydnZXQgY3JvbiByZWdpc3RyeSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBnZXQtY3Jvbi1yZWdpc3RyeSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZXQtZWRnZS1mdW5jdGlvbi1sb2dzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9nZXQtZWRnZS1mdW5jdGlvbi1sb2dzJyxcbiAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogRWRnZSBGdW5jdGlvbiBMb2dzIC0gUmV0cmlldmUgZGV0YWlsZWQgbG9ncycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0xvZyByZXRyaWV2YWwnLCAnRXJyb3IgZmlsdGVyaW5nJywgJ1RpbWUtYmFzZWQgcXVlcmllcyddLFxuICAgIGNhdGVnb3J5OiAnbW9uaXRvcmluZycsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJmdW5jdGlvbl9uYW1lXCI6XCJnaXRodWItaW50ZWdyYXRpb25cIixcImhvdXJzXCI6MjR9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dldC1lbWJlZGRpbmcnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dldC1lbWJlZGRpbmcnLFxuICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgdmVjdG9yIGVtYmVkZGluZ3MgZm9yIHRleHQnLFxuICAgIGNhcGFiaWxpdGllczogWydLbm93bGVkZ2Ugc3RvcmFnZScsICdTZW1hbnRpYyBzZWFyY2gnLCAnRW50aXR5IHJlbGF0aW9uc2hpcHMnXSxcbiAgICBjYXRlZ29yeTogJ2tub3dsZWRnZScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgZ2V0IGVtYmVkZGluZyBmb3IgZ2VuZXJhdGUgdmVjdG9yIGVtYmVkZGluZ3MgZm9yIHRleHQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZ2V0LWZhdWNldC1zdGF0cycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2V0LWZhdWNldC1zdGF0cycsXG4gICAgZGVzY3JpcHRpb246ICdHZXQgWE1SVCBmYXVjZXQgc3RhdGlzdGljcyBhbmQgc3RhdHVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRmF1Y2V0IHN0YXRpc3RpY3MnLCAnRGlzdHJpYnV0aW9uIGRhdGEnLCAnQ2xhaW0gaGlzdG9yeSddLFxuICAgIGNhdGVnb3J5OiAnZmF1Y2V0JyxcbiAgICBleGFtcGxlX3VzZTogJ0Rpc3BsYXkgZmF1Y2V0IHVzYWdlIHN0YXRpc3RpY3MgYW5kIGF2YWlsYWJpbGl0eSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZXQtZnVuY3Rpb24tYWN0aW9ucycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2V0LWZ1bmN0aW9uLWFjdGlvbnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZ2V0LWZ1bmN0aW9uLWFjdGlvbnMnLFxuICAgIGNhcGFiaWxpdGllczogWydnZXQgZnVuY3Rpb24gYWN0aW9ucyddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBnZXQtZnVuY3Rpb24tYWN0aW9ucydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZXQtZnVuY3Rpb24tdmVyc2lvbi1hbmFseXRpY3MnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dldC1mdW5jdGlvbi12ZXJzaW9uLWFuYWx5dGljcycsXG4gICAgZGVzY3JpcHRpb246ICfwn5OIIEZ1bmN0aW9uIFZlcnNpb24gQW5hbHl0aWNzIC0gQ29tcGFyZSB2ZXJzaW9ucycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1ZlcnNpb24gY29tcGFyaXNvbicsICdSZWdyZXNzaW9uIGRldGVjdGlvbicsICdQZXJmb3JtYW5jZSBtZXRyaWNzJ10sXG4gICAgY2F0ZWdvcnk6ICdtb25pdG9yaW5nJyxcbiAgICBleGFtcGxlX3VzZTogJ3tcImZ1bmN0aW9uX25hbWVcIjpcImxvdmFibGUtY2hhdFwiLFwiY29tcGFyZV92ZXJzaW9uc1wiOnRydWV9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dldC1nbG9iYWwtc3RhdGUnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dldC1nbG9iYWwtc3RhdGUnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZ2V0LWdsb2JhbC1zdGF0ZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2dldCBnbG9iYWwgc3RhdGUnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgZ2V0LWdsb2JhbC1zdGF0ZSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnZXQtbG92YWJsZS1rZXknLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dldC1sb3ZhYmxlLWtleScsXG4gICAgZGVzY3JpcHRpb246ICdSZXRyaWV2ZSBMb3ZhYmxlIEFQSSBrZXknLFxuICAgIGNhcGFiaWxpdGllczogWydBSSBjaGF0JywgJ0NvbnRleHQgYXdhcmVuZXNzJywgJ05hdHVyYWwgbGFuZ3VhZ2UgcHJvY2Vzc2luZyddLFxuICAgIGNhdGVnb3J5OiAnYWknLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGdldCBsb3ZhYmxlIGtleSBmb3IgcmV0cmlldmUgbG92YWJsZSBhcGkga2V5J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dldC1teS1mZWVkYmFjaycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ2V0LW15LWZlZWRiYWNrJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IGdldC1teS1mZWVkYmFjaycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2dldCBteSBmZWVkYmFjayddLFxuICAgIGNhdGVnb3J5OiAnZGF0YWJhc2UnLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGdldC1teS1mZWVkYmFjaydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnaXRodWItaW50ZWdyYXRpb24nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dpdGh1Yi1pbnRlZ3JhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdDb21wbGV0ZSBHaXRIdWIgT0F1dGggb3BlcmF0aW9ucyAtIGNyZWF0ZSBpc3N1ZXMsIFBScywgY29tbWVudHMsIGRpc2N1c3Npb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTGlzdCBpc3N1ZXMnLCAnQ3JlYXRlIGlzc3VlcycsICdDb21tZW50IG9uIGlzc3VlcycsICdDcmVhdGUgUFJzJywgJ0dldCBmaWxlIGNvbnRlbnQnLCAnU2VhcmNoIGNvZGUnLCAnTGlzdCBkaXNjdXNzaW9ucyddLFxuICAgIGNhdGVnb3J5OiAnZ2l0aHViJyxcbiAgICBleGFtcGxlX3VzZTogJ0NyZWF0ZSBHaXRIdWIgaXNzdWUsIGxpc3QgcmVwb3NpdG9yeSBpc3N1ZXMsIG1hbmFnZSBwdWxsIHJlcXVlc3RzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dpdGh1Yi1pc3N1ZS1zY2FubmVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9naXRodWItaXNzdWUtc2Nhbm5lcicsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBnaXRodWItaXNzdWUtc2Nhbm5lcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2dpdGh1YiBpc3N1ZSBzY2FubmVyJ10sXG4gICAgY2F0ZWdvcnk6ICdnaXRodWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIGdpdGh1Yi1pc3N1ZS1zY2FubmVyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dpdGh1Yi1tYW5hZ2VyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9naXRodWItbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogZ2l0aHViIG1hbmFnZXInLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdnaXRodWIgbWFuYWdlciddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggZ2l0aHViLW1hbmFnZXInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZ29vZ2xlLWNhbGVuZGFyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9nb29nbGUtY2FsZW5kYXInLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+ThSBHb29nbGUgQ2FsZW5kYXIgLSBNYW5hZ2UgZXZlbnRzIGFuZCBzY2hlZHVsZXMnLFxuICAgIGNhcGFiaWxpdGllczogWydMaXN0IGV2ZW50cycsICdDcmVhdGUgZXZlbnQnLCAnVXBkYXRlIGV2ZW50JywgJ0RlbGV0ZSBldmVudCcsICdGcmVlL2J1c3kgY2hlY2snXSxcbiAgICBjYXRlZ29yeTogJ3dlYicsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJhY3Rpb25cIjpcImxpc3RfZXZlbnRzXCIsIFwidGltZU1pblwiOlwiMjAyMy0wMS0wMVQwMDowMDowMFpcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZ29vZ2xlLWNsb3VkLWF1dGgnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dvb2dsZS1jbG91ZC1hdXRoJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IGdvb2dsZS1jbG91ZC1hdXRoJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZ29vZ2xlIGNsb3VkIGF1dGgnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgZ29vZ2xlLWNsb3VkLWF1dGgnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnZ29vZ2xlLWRyaXZlJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9nb29nbGUtZHJpdmUnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+TgiBHb29nbGUgRHJpdmUgLSBNYW5hZ2UgZmlsZXMgYW5kIGZvbGRlcnMnLFxuICAgIGNhcGFiaWxpdGllczogWydMaXN0IGZpbGVzJywgJ1VwbG9hZCBmaWxlJywgJ0dldCBmaWxlIGNvbnRlbnQnLCAnU2VhcmNoIGZpbGVzJ10sXG4gICAgY2F0ZWdvcnk6ICd3ZWInLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiYWN0aW9uXCI6XCJsaXN0X2ZpbGVzXCIsIFwicVwiOlwibmFtZSBjb250YWlucyBcXCdpbnZvaWNlXFwnXCJ9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2dvb2dsZS1nbWFpbCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ29vZ2xlLWdtYWlsJyxcbiAgICBkZXNjcmlwdGlvbjogJ/Cfk6cgR21haWwgSW50ZWdyYXRpb24gLSBTZW5kIGVtYWlscywgcmVhZCB0aHJlYWRzLCBtYW5hZ2UgZHJhZnRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnU2VuZCBlbWFpbCcsICdSZWFkIGVtYWlsJywgJ0NyZWF0ZSBkcmFmdCcsICdTZWFyY2ggdGhyZWFkcycsICdHZXQgdGhyZWFkIGRldGFpbHMnXSxcbiAgICBjYXRlZ29yeTogJ3dlYicsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJhY3Rpb25cIjpcInNlbmRfZW1haWxcIiwgXCJ0b1wiOlwidXNlckBleGFtcGxlLmNvbVwiLCBcInN1YmplY3RcIjpcIk1lZXRpbmdcIiwgXCJib2R5XCI6XCJIZWxsby4uLlwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnb29nbGUtb2F1dGgtaGFuZGxlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZ29vZ2xlLW9hdXRoLWhhbmRsZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogZ29vZ2xlLW9hdXRoLWhhbmRsZXInLFxuICAgIGNhcGFiaWxpdGllczogWydnb29nbGUgb2F1dGggaGFuZGxlciddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBnb29nbGUtb2F1dGgtaGFuZGxlcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnb29nbGUtc2hlZXRzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9nb29nbGUtc2hlZXRzJyxcbiAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogR29vZ2xlIFNoZWV0cyAtIFJlYWQgYW5kIHdyaXRlIHNwcmVhZHNoZWV0IGRhdGEnLFxuICAgIGNhcGFiaWxpdGllczogWydSZWFkIHNoZWV0JywgJ1dyaXRlIHNoZWV0JywgJ0FwcGVuZCByb3cnLCAnQ2xlYXIgcmFuZ2UnXSxcbiAgICBjYXRlZ29yeTogJ3dlYicsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJhY3Rpb25cIjpcInJlYWRfc2hlZXRcIiwgXCJzcHJlYWRzaGVldElkXCI6XCIuLi5cIiwgXCJyYW5nZVwiOlwiU2hlZXQxIUExOkIxMFwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdnb3Zlcm5hbmNlLXBoYXNlLW1hbmFnZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2dvdmVybmFuY2UtcGhhc2UtbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICfimpbvuI8gR292ZXJuYW5jZSBQaGFzZSBNYW5hZ2VyIC0gVGltZWQgdm90aW5nIHBoYXNlIHRyYW5zaXRpb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnUGhhc2UgdHJhbnNpdGlvbnMnLCAnRXhlY3V0aXZlIGRlYWRsaW5lcycsICdDb21tdW5pdHkgdm90aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdnb3Zlcm5hbmNlJyxcbiAgICBleGFtcGxlX3VzZTogJ01hbmFnZSBnb3Zlcm5hbmNlIHZvdGluZyBwaGFzZXMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnaGFuZGxlLXJlamVjdGVkLXByb3Bvc2FsJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9oYW5kbGUtcmVqZWN0ZWQtcHJvcG9zYWwnLFxuICAgIGRlc2NyaXB0aW9uOiAn4p2MIEhhbmRsZSBSZWplY3RlZCBQcm9wb3NhbHMgLSBHZW5lcmF0ZSBpbXByb3ZlbWVudCBzdWdnZXN0aW9ucycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1JlamVjdGlvbiBoYW5kbGluZycsICdJbXByb3ZlbWVudCBzdWdnZXN0aW9ucycsICdGZWVkYmFjayddLFxuICAgIGNhdGVnb3J5OiAnZ292ZXJuYW5jZScsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJwcm9wb3NhbF9pZFwiOlwidXVpZFwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdoZWFsdGgtbW9uaXRvcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvaGVhbHRoLW1vbml0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IGhlYWx0aCBtb25pdG9yJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnaGVhbHRoIG1vbml0b3InXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIGhlYWx0aC1tb25pdG9yJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2h1bWUtYWNjZXNzLXRva2VuJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9odW1lLWFjY2Vzcy10b2tlbicsXG4gICAgZGVzY3JpcHRpb246ICfwn46tIEh1bWUgRVZJIEFjY2VzcyBUb2tlbiAtIEdlbmVyYXRlIGFjY2VzcyB0b2tlbnMgZm9yIEh1bWUgRW1wYXRoaWMgVm9pY2UgSW50ZXJmYWNlJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnT0F1dGggdG9rZW4gZ2VuZXJhdGlvbicsICdDbGllbnQgYXV0aGVudGljYXRpb24nLCAnRVZJIHZvaWNlIGFjY2VzcyddLFxuICAgIGNhdGVnb3J5OiAnaHVtZScsXG4gICAgZXhhbXBsZV91c2U6ICdHZW5lcmF0ZSBhY2Nlc3MgdG9rZW4gZm9yIEh1bWUgRVZJIHZvaWNlIGNoYXQgaW50ZWdyYXRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnaHVtZS1leHByZXNzaW9uLW1lYXN1cmVtZW50JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9odW1lLWV4cHJlc3Npb24tbWVhc3VyZW1lbnQnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+OrSBIdW1lIEV4cHJlc3Npb24gTWVhc3VyZW1lbnQgLSBBbmFseXplIGZhY2lhbCBleHByZXNzaW9ucyBhbmQgZW1vdGlvbnMnLFxuICAgIGNhcGFiaWxpdGllczogWydGYWNpYWwgZXhwcmVzc2lvbiBhbmFseXNpcycsICdFbW90aW9uIGRldGVjdGlvbicsICdDb25maWRlbmNlIHNjb3JpbmcnLCAnTXVsdGktZmFjZSBkZXRlY3Rpb24nXSxcbiAgICBjYXRlZ29yeTogJ2h1bWUnLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiaW1hZ2VcIjpcImJhc2U2NF9lbmNvZGVkX2ltYWdlXCJ9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2h1bWUtdHRzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9odW1lLXR0cycsXG4gICAgZGVzY3JpcHRpb246ICfwn46tIEh1bWUgVFRTIC0gRW1wYXRoaWMgdGV4dC10by1zcGVlY2ggd2l0aCBlbW90aW9uYWwgZXhwcmVzc2lvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0Vtb3Rpb25hbCB2b2ljZSBzeW50aGVzaXMnLCAnVm9pY2UgSUQgc2VsZWN0aW9uJywgJ0V4cHJlc3NpdmUgYXVkaW8gZ2VuZXJhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAnaHVtZScsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJ0ZXh0XCI6XCJIZWxsb1wiLFwidm9pY2VJZFwiOlwiYzdhYTEwYmUtLi4uXCJ9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2lkZW50aWZ5LXNlcnZpY2UtaW50ZXJlc3QnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2lkZW50aWZ5LXNlcnZpY2UtaW50ZXJlc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+OryBTZXJ2aWNlIEludGVyZXN0IERldGVjdGlvbiAtIElkZW50aWZ5IHNlcnZpY2VzIGEgbGVhZCB3YW50cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1NlcnZpY2UgZGV0ZWN0aW9uJywgJ0ludGVyZXN0IHNjb3JpbmcnLCAnTXVsdGktc2VydmljZSB0cmFja2luZyddLFxuICAgIGNhdGVnb3J5OiAnYWNxdWlzaXRpb24nLFxuICAgIGV4YW1wbGVfdXNlOiAne1widXNlcl9tZXNzYWdlXCI6XCJJIG5lZWQgbWluaW5nIGhlbHBcIixcInNlc3Npb25fa2V5XCI6XCJhYmMxMjNcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnaW5nZXN0LWdpdGh1Yi1jb250cmlidXRpb24nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2luZ2VzdC1naXRodWItY29udHJpYnV0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IGluZ2VzdC1naXRodWItY29udHJpYnV0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnaW5nZXN0IGdpdGh1YiBjb250cmlidXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2dpdGh1YicsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgaW5nZXN0LWdpdGh1Yi1jb250cmlidXRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnaXNzdWUtZW5nYWdlbWVudC1jb21tYW5kJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9pc3N1ZS1lbmdhZ2VtZW50LWNvbW1hbmQnLFxuICAgIGRlc2NyaXB0aW9uOiAnRW5nYWdlIHdpdGggR2l0SHViIGlzc3VlcyB2aWEgY29tbWFuZHMnLFxuICAgIGNhcGFiaWxpdGllczogWydNdWx0aS1zZXJ2aWNlIGludGVncmF0aW9uJywgJ0hlYWx0aCBtb25pdG9yaW5nJywgJ1N0YXR1cyByZXBvcnRpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgaXNzdWUgZW5nYWdlbWVudCBjb21tYW5kIGZvciBlbmdhZ2Ugd2l0aCBnaXRodWIgaXNzdWVzIHZpYSBjb21tYW5kcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdraW1pLWNoYXQnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2tpbWktY2hhdCcsXG4gICAgZGVzY3JpcHRpb246ICdBSSBjaGF0IHZpYSBLaW1pIG1vZGVsJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQUkgY2hhdCcsICdDb250ZXh0IGF3YXJlbmVzcycsICdOYXR1cmFsIGxhbmd1YWdlIHByb2Nlc3NpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2FpJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBraW1pIGNoYXQgZm9yIGFpIGNoYXQgdmlhIGtpbWkgbW9kZWwnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAna25vd2xlZGdlLW1hbmFnZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2tub3dsZWRnZS1tYW5hZ2VyJyxcbiAgICBkZXNjcmlwdGlvbjogJ0tub3dsZWRnZSBiYXNlIENSVUQgb3BlcmF0aW9ucyAtIHN0b3JlLCBzZWFyY2gsIGFuZCBsaW5rIGVudGl0aWVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnU3RvcmUga25vd2xlZGdlJywgJ1NlYXJjaCBrbm93bGVkZ2UnLCAnQ3JlYXRlIHJlbGF0aW9uc2hpcHMnLCAnR2V0IHJlbGF0ZWQgZW50aXRpZXMnLCAnVXBkYXRlIGNvbmZpZGVuY2UnXSxcbiAgICBjYXRlZ29yeTogJ2tub3dsZWRnZScsXG4gICAgZXhhbXBsZV91c2U6ICdTdG9yZSBjb25jZXB0cywgbGluayBlbnRpdGllcywgc2VhcmNoIGtub3dsZWRnZSBncmFwaCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdsZWFybmluZy1vcHRpbWl6ZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2xlYXJuaW5nLW9wdGltaXplcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogbGVhcm5pbmcgb3B0aW1pemVyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnbGVhcm5pbmcgb3B0aW1pemVyJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBsZWFybmluZy1vcHRpbWl6ZXInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbGlzdC1hdmFpbGFibGUtZnVuY3Rpb25zJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9saXN0LWF2YWlsYWJsZS1mdW5jdGlvbnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnTGlzdCBhbGwgYXZhaWxhYmxlIGVkZ2UgZnVuY3Rpb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBpbnRlZ3JhdGlvbicsICdIZWFsdGggbW9uaXRvcmluZycsICdTdGF0dXMgcmVwb3J0aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIGxpc3QgYXZhaWxhYmxlIGZ1bmN0aW9ucyBmb3IgbGlzdCBhbGwgYXZhaWxhYmxlIGVkZ2UgZnVuY3Rpb25zJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2xpc3QtZnVuY3Rpb24tcHJvcG9zYWxzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9saXN0LWZ1bmN0aW9uLXByb3Bvc2FscycsXG4gICAgZGVzY3JpcHRpb246ICdMaXN0IGFsbCBlZGdlIGZ1bmN0aW9uIHByb3Bvc2FscyBhbmQgdGhlaXIgc3RhdHVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnUHJvcG9zYWwgbGlzdGluZycsICdTdGF0dXMgdHJhY2tpbmcnLCAnR292ZXJuYW5jZSBtb25pdG9yaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdnb3Zlcm5hbmNlJyxcbiAgICBleGFtcGxlX3VzZTogJ0xpc3QgcGVuZGluZyBwcm9wb3NhbHMsIGNoZWNrIHByb3Bvc2FsIHN0YXR1cywgdmlldyB2b3RpbmcgaGlzdG9yeSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdsb3ZhYmxlLWNoYXQnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL2xvdmFibGUtY2hhdCcsXG4gICAgZGVzY3JpcHRpb246ICfinIUgUFJJTUFSWSBBSSAtIE1vZGVsLWFnbm9zdGljIGNoYXQgdmlhIExvdmFibGUgQUkgR2F0ZXdheSAoR2VtaW5pIDIuNSBGbGFzaCBkZWZhdWx0LCBzdXBwb3J0cyBPcGVuQUkgR1BULTUpJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQWR2YW5jZWQgQUkgY2hhdCcsICdDb250ZXh0IGF3YXJlbmVzcycsICdNdWx0aS1tb2RlbCBzdXBwb3J0JywgJ01lbW9yeSBpbnRlZ3JhdGlvbicsICdUb29sIGNhbGxpbmcnLCAnTXVsdGktc3RlcCB3b3JrZmxvd3MnXSxcbiAgICBjYXRlZ29yeTogJ2FpJyxcbiAgICBleGFtcGxlX3VzZTogJ01haW4gaW50ZWxsaWdlbnQgY2hhdCBlbmRwb2ludCB3aXRoIGZ1bGwgY29udGV4dCBhbmQgbWVtb3J5IC0gdXNlIHRoaXMgZm9yIGFsbCBBSSBjaGF0IG5lZWRzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeS1vcHRpbWl6ZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL21lbW9yeS1vcHRpbWl6ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IG1lbW9yeSBvcHRpbWl6ZXInLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdtZW1vcnkgb3B0aW1pemVyJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBtZW1vcnktb3B0aW1pemVyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ21lbW9yeS1zeXN0ZW0nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL21lbW9yeS1zeXN0ZW0nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IG1lbW9yeSBzeXN0ZW0nLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdtZW1vcnkgc3lzdGVtJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBtZW1vcnktc3lzdGVtJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ21lc2gtaGVhbHRoLWJlYWNvbnMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL21lc2gtaGVhbHRoLWJlYWNvbnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBNZXNoIEhlYWx0aCBCZWFjb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZWNvc3lzdGVtIGFwcCcsICdtZXNoIGhlYWx0aCBiZWFjb25zJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBtZXNoLWhlYWx0aC1iZWFjb25zJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ21pbmluZy1wcm94eScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvbWluaW5nLXByb3h5JyxcbiAgICBkZXNjcmlwdGlvbjogJ1VuaWZpZWQgbWluaW5nIHN0YXRpc3RpY3MgYW5kIHdvcmtlciBtYW5hZ2VtZW50IGZyb20gU3VwcG9ydFhNUicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0dldCBtaW5pbmcgc3RhdHMnLCAnR2V0IHdvcmtlciBzdGF0dXMnLCAnVHJhY2sgZWFybmluZ3MnLCAnTW9uaXRvciBoYXNocmF0ZScsICdXb3JrZXIgcmVnaXN0cmF0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdtaW5pbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnR2V0IGNvbXByZWhlbnNpdmUgbWluaW5nIGRhdGEgaW5jbHVkaW5nIHBvb2wgc3RhdHMgYW5kIGluZGl2aWR1YWwgd29ya2VyIHBlcmZvcm1hbmNlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ2V4ZWN1dGl2ZS1zd2FybScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvZXhlY3V0aXZlLXN3YXJtJyxcbiAgICBkZXNjcmlwdGlvbjogJ1N3YXJtLWludGVsbGlnZW5jZSBkZWNpc2lvbiBlbmdpbmUgZm9yIFhNUlQtREFPIGV4ZWN1dGl2ZSBjb3VuY2lsIGNvbnNlbnN1cyBhbmQgd2VpZ2h0IG9wdGltaXphdGlvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0V4ZWN1dGl2ZSBkZWNpc2lvbiBhbmFseXNpcycsICdDb25zZW5zdXMgZ2VuZXJhdGlvbicsICdEeW5hbWljIGV4ZWN1dGl2ZSB3ZWlnaHRpbmcnLCAnT3V0Y29tZSB0cmFja2luZycsICdTY2VuYXJpbyBzaW11bGF0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdhaScsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJhY3Rpb25cIjpcImFuYWx5emVfZGVjaXNpb25cIixcImRlY2lzaW9uX3R5cGVcIjpcImZpbmFuY2lhbFwiLFwiZGVjaXNpb25fc2NvcmVcIjowLjY0LFwiaGlzdG9yaWNhbF9kZWNpc2lvbnNcIjpbe1wicHJlZGljdGVkX3Njb3JlXCI6MC43LFwiYWN0dWFsX3Njb3JlXCI6MC42Mn1dfSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtb2JpbGUtbWluZXItY29uZmlnJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9tb2JpbGUtbWluZXItY29uZmlnJyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbmZpZ3VyYXRpb24gbWFuYWdlbWVudCBmb3IgbW9iaWxlIG1pbmluZyBkZXZpY2VzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRGV2aWNlIGNvbmZpZ3VyYXRpb24nLCAnTWluaW5nIHNldHRpbmdzJywgJ01vYmlsZSBvcHRpbWl6YXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ21pbmluZycsXG4gICAgZXhhbXBsZV91c2U6ICdDb25maWd1cmUgbW9iaWxlIG1pbmVycywgb3B0aW1pemUgc2V0dGluZ3MsIG1hbmFnZSBkZXZpY2UgcHJvZmlsZXMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbW9iaWxlLW1pbmVyLXJlZ2lzdGVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9tb2JpbGUtbWluZXItcmVnaXN0ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnUmVnaXN0cmF0aW9uIHN5c3RlbSBmb3IgbW9iaWxlIG1pbmluZyBkZXZpY2VzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRGV2aWNlIHJlZ2lzdHJhdGlvbicsICdNaW5lciBvbmJvYXJkaW5nJywgJ0lkZW50aXR5IG1hbmFnZW1lbnQnXSxcbiAgICBjYXRlZ29yeTogJ21pbmluZycsXG4gICAgZXhhbXBsZV91c2U6ICdSZWdpc3RlciBtb2JpbGUgbWluZXJzLCBvbmJvYXJkIG5ldyBkZXZpY2VzLCBtYW5hZ2UgaWRlbnRpdGllcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtb2JpbGUtbWluZXItc2NyaXB0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9tb2JpbGUtbWluZXItc2NyaXB0JyxcbiAgICBkZXNjcmlwdGlvbjogJ1NjcmlwdCBkaXN0cmlidXRpb24gZm9yIG1vYmlsZSBtaW5pbmcgY2xpZW50cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1NjcmlwdCBkaXN0cmlidXRpb24nLCAnQ2xpZW50IHVwZGF0ZXMnLCAnVmVyc2lvbiBtYW5hZ2VtZW50J10sXG4gICAgY2F0ZWdvcnk6ICdtaW5pbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnRGlzdHJpYnV0ZSBtaW5pbmcgc2NyaXB0cywgcHVzaCB1cGRhdGVzLCBtYW5hZ2UgdmVyc2lvbnMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbW9iaWxlLW1pbmluZy1pbmNlbnRpdmUtcHJvZ3JhbScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvbW9iaWxlLW1pbmluZy1pbmNlbnRpdmUtcHJvZ3JhbScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IE1vYmlsZSBNaW5pbmcgSW5jZW50aXZlIFByb2dyYW0nLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ21vYmlsZSBtaW5pbmcgaW5jZW50aXZlIHByb2dyYW0nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIG1vYmlsZS1taW5pbmctaW5jZW50aXZlLXByb2dyYW0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbW9uaXRvci1kZXZpY2UtY29ubmVjdGlvbnMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL21vbml0b3ItZGV2aWNlLWNvbm5lY3Rpb25zJyxcbiAgICBkZXNjcmlwdGlvbjogJ01vbml0b3IgbWluaW5nIGRldmljZSBjb25uZWN0aW9ucyBhbmQgc3RhdHVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTWluaW5nIHN0YXRzJywgJ0RldmljZSBtb25pdG9yaW5nJywgJ0hhc2hyYXRlIHRyYWNraW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdtaW5pbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIG1vbml0b3IgZGV2aWNlIGNvbm5lY3Rpb25zIGZvciBtb25pdG9yIG1pbmluZyBkZXZpY2UgY29ubmVjdGlvbnMgYW5kIHN0YXR1cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtb3JuaW5nLWRpc2N1c3Npb24tcG9zdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvbW9ybmluZy1kaXNjdXNzaW9uLXBvc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgYW5kIHBvc3QgbW9ybmluZyBkaXNjdXNzaW9uIHRvcGljcycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0F1dG9tYXRlZCBwb3N0aW5nJywgJ0NvbnRlbnQgZ2VuZXJhdGlvbicsICdTY2hlZHVsaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdhdXRvbm9tb3VzJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBtb3JuaW5nIGRpc2N1c3Npb24gcG9zdCBmb3IgZ2VuZXJhdGUgYW5kIHBvc3QgbW9ybmluZyBkaXNjdXNzaW9uIHRvcGljcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdtdWx0aS1hZ2VudC1zbGFjay1icmlkZ2UnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL211bHRpLWFnZW50LXNsYWNrLWJyaWRnZScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogbXVsdGkgYWdlbnQgc2xhY2sgYnJpZGdlJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnbXVsdGkgYWdlbnQgc2xhY2sgYnJpZGdlJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBtdWx0aS1hZ2VudC1zbGFjay1icmlkZ2UnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbXVsdGktYWdlbnQtc3lzdGVtJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9tdWx0aS1hZ2VudC1zeXN0ZW0nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IG11bHRpIGFnZW50IHN5c3RlbScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ211bHRpIGFnZW50IHN5c3RlbSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggbXVsdGktYWdlbnQtc3lzdGVtJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ211bHRpLXN0ZXAtb3JjaGVzdHJhdG9yJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9tdWx0aS1zdGVwLW9yY2hlc3RyYXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdDb21wbGV4IHdvcmtmbG93IGVuZ2luZSBmb3IgYmFja2dyb3VuZCBwcm9jZXNzaW5nIHdpdGggZGVwZW5kZW5jaWVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRXhlY3V0ZSB3b3JrZmxvd3MnLCAnTXVsdGktc3RlcCB0YXNrcycsICdEZXBlbmRlbmN5IGhhbmRsaW5nJywgJ0JhY2tncm91bmQgcHJvY2Vzc2luZycsICdBdXRvbm9tb3VzIHdvcmtmbG93cyddLFxuICAgIGNhdGVnb3J5OiAnYXV0b25vbW91cycsXG4gICAgZXhhbXBsZV91c2U6ICdFeGVjdXRlIGRlYnVnZ2luZyB3b3JrZmxvdzogc2NhbiBsb2dzIOKGkiBpZGVudGlmeSBlcnJvcnMg4oaSIGZpeCBjb2RlIOKGkiB2ZXJpZnknXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbjhuLWludGVncmF0aW9uJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9uOG4taW50ZWdyYXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IG44biBpbnRlZ3JhdGlvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ244biBpbnRlZ3JhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggbjhuLWludGVncmF0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ244bi13b3JrZmxvdy1nZW5lcmF0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL244bi13b3JrZmxvdy1nZW5lcmF0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogbjhuLXdvcmtmbG93LWdlbmVyYXRvcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ244biB3b3JrZmxvdyBnZW5lcmF0b3InXSxcbiAgICBjYXRlZ29yeTogJ3Rhc2stbWFuYWdlbWVudCcsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgbjhuLXdvcmtmbG93LWdlbmVyYXRvcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICduOG4td29ya2Zsb3ctbWFuYWdlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvbjhuLXdvcmtmbG93LW1hbmFnZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IG44biB3b3JrZmxvdyBtYW5hZ2VyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnbjhuIHdvcmtmbG93IG1hbmFnZXInXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIG44bi13b3JrZmxvdy1tYW5hZ2VyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ25sZy1nZW5lcmF0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL25sZy1nZW5lcmF0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnTmF0dXJhbCBsYW5ndWFnZSBnZW5lcmF0aW9uIGZvciByZXBvcnRzIGFuZCBjb250ZW50JyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBpbnRlZ3JhdGlvbicsICdIZWFsdGggbW9uaXRvcmluZycsICdTdGF0dXMgcmVwb3J0aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIG5sZyBnZW5lcmF0b3IgZm9yIG5hdHVyYWwgbGFuZ3VhZ2UgZ2VuZXJhdGlvbiBmb3IgcmVwb3J0cyBhbmQgY29udGVudCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdvcGVuYWktY2hhdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvb3BlbmFpLWNoYXQnLFxuICAgIGRlc2NyaXB0aW9uOiAnQUkgY2hhdCB2aWEgT3BlbkFJIG1vZGVscycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0FJIGNoYXQnLCAnQ29udGV4dCBhd2FyZW5lc3MnLCAnTmF0dXJhbCBsYW5ndWFnZSBwcm9jZXNzaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdhaScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2Ugb3BlbmFpIGNoYXQgZm9yIGFpIGNoYXQgdmlhIG9wZW5haSBtb2RlbHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnb3BlbmFpLXR0cycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvb3BlbmFpLXR0cycsXG4gICAgZGVzY3JpcHRpb246ICdUZXh0LXRvLXNwZWVjaCB2aWEgT3BlbkFJJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVGV4dC10by1zcGVlY2gnLCAnVm9pY2Ugc3ludGhlc2lzJywgJ0F1ZGlvIGdlbmVyYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2FpJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBvcGVuYWkgdHRzIGZvciB0ZXh0LXRvLXNwZWVjaCB2aWEgb3BlbmFpJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ29wcG9ydHVuaXR5LXNjYW5uZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL29wcG9ydHVuaXR5LXNjYW5uZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0b25vbW91cyBvcHBvcnR1bml0eSBzY2FubmluZyBhbmQgaWRlbnRpZmljYXRpb24nLFxuICAgIGNhcGFiaWxpdGllczogWydPcHBvcnR1bml0eSBkZXRlY3Rpb24nLCAnTWFya2V0IHNjYW5uaW5nJywgJ1RyZW5kIGFuYWx5c2lzJ10sXG4gICAgY2F0ZWdvcnk6ICdhdXRvbm9tb3VzJyxcbiAgICBleGFtcGxlX3VzZTogJ1NjYW4gZm9yIG9wcG9ydHVuaXRpZXMsIGRldGVjdCBtYXJrZXQgdHJlbmRzLCBpZGVudGlmeSBwb3RlbnRpYWwnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncGFyYWdyYXBoLXB1Ymxpc2hlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcGFyYWdyYXBoLXB1Ymxpc2hlcicsXG4gICAgZGVzY3JpcHRpb246ICfwn5OdIFBhcmFncmFwaC54eXogUHVibGlzaGVyIC0gUHVibGlzaCBhcnRpY2xlcyBhbmQgbmV3c2xldHRlcnMnLFxuICAgIGNhcGFiaWxpdGllczogWydQdWJsaXNoIHBvc3QnLCAnQ3JlYXRlIGRyYWZ0JywgJ1VwZGF0ZSBwb3N0JywgJ0xpc3QgcG9zdHMnXSxcbiAgICBjYXRlZ29yeTogJ3dlYicsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJhY3Rpb25cIjpcInB1Ymxpc2hcIiwgXCJ0aXRsZVwiOlwiV2Vla2x5IFVwZGF0ZVwiLCBcImNvbnRlbnRcIjpcIi4uLlwifSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwZXJmb3JtYW5jZS1hbmFseXplcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcGVyZm9ybWFuY2UtYW5hbHl6ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IHBlcmZvcm1hbmNlIGFuYWx5emVyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAncGVyZm9ybWFuY2UgYW5hbHl6ZXInXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHBlcmZvcm1hbmNlLWFuYWx5emVyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3BsYXl3cmlnaHQtYnJvd3NlJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9wbGF5d3JpZ2h0LWJyb3dzZScsXG4gICAgZGVzY3JpcHRpb246ICdXZWIgYnJvd3NpbmcgYW5kIHNjcmFwaW5nIHVzaW5nIFBsYXl3cmlnaHQgYXV0b21hdGlvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0Jyb3dzZSB3ZWJzaXRlcycsICdFeHRyYWN0IGRhdGEnLCAnRHluYW1pYyBjb250ZW50IGV4dHJhY3Rpb24nLCAnSmF2YVNjcmlwdCByZW5kZXJpbmcnLCAnSW50ZXJhY3Qgd2l0aCBwYWdlcyddLFxuICAgIGNhdGVnb3J5OiAnd2ViJyxcbiAgICBleGFtcGxlX3VzZTogJ0Jyb3dzZSB3ZWJzaXRlcywgZXh0cmFjdCBkYXRhLCBpbnRlcmFjdCB3aXRoIHdlYiBwYWdlcywgcmVzZWFyY2ggcmVhbC10aW1lIGluZm9ybWF0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ByZWRpY3RpdmUtYW5hbHl0aWNzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9wcmVkaWN0aXZlLWFuYWx5dGljcycsXG4gICAgZGVzY3JpcHRpb246ICdQcmVkaWN0aXZlIGFuYWx5dGljcyBmb3IgbWluaW5nIGFuZCBzeXN0ZW0gbWV0cmljcycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ011bHRpLXNlcnZpY2UgaW50ZWdyYXRpb24nLCAnSGVhbHRoIG1vbml0b3JpbmcnLCAnU3RhdHVzIHJlcG9ydGluZyddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBwcmVkaWN0aXZlIGFuYWx5dGljcyBmb3IgcHJlZGljdGl2ZSBhbmFseXRpY3MgZm9yIG1pbmluZyBhbmQgc3lzdGVtIG1ldHJpY3MnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHJpdmFjeS1maXJzdC1haS10cmFpbmluZy1wbGF0Zm9ybScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHJpdmFjeS1maXJzdC1haS10cmFpbmluZy1wbGF0Zm9ybScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IFByaXZhY3kgRmlyc3QgQWkgVHJhaW5pbmcgUGxhdGZvcm0nLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ3ByaXZhY3kgZmlyc3QgYWkgdHJhaW5pbmcgcGxhdGZvcm0nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHByaXZhY3ktZmlyc3QtYWktdHJhaW5pbmctcGxhdGZvcm0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHJpdmFjeS1maXJzdC1haS13b3JrZmxvd3MnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3ByaXZhY3ktZmlyc3QtYWktd29ya2Zsb3dzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogUHJpdmFjeSBGaXJzdCBBaSBXb3JrZmxvd3MnLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ3ByaXZhY3kgZmlyc3QgYWkgd29ya2Zsb3dzJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBwcml2YWN5LWZpcnN0LWFpLXdvcmtmbG93cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwcml2YWN5LWZpcnN0LWRlY2VudHJhbGl6ZWQtd2FsbGV0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9wcml2YWN5LWZpcnN0LWRlY2VudHJhbGl6ZWQtd2FsbGV0JyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogUHJpdmFjeSBGaXJzdCBEZWNlbnRyYWxpemVkIFdhbGxldCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAncHJpdmFjeSBmaXJzdCBkZWNlbnRyYWxpemVkIHdhbGxldCddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggcHJpdmFjeS1maXJzdC1kZWNlbnRyYWxpemVkLXdhbGxldCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwcml2YWN5LWZpcnN0LWRpZ2l0YWwtd2FsbGV0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9wcml2YWN5LWZpcnN0LWRpZ2l0YWwtd2FsbGV0JyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogUHJpdmFjeSBGaXJzdCBEaWdpdGFsIFdhbGxldCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAncHJpdmFjeSBmaXJzdCBkaWdpdGFsIHdhbGxldCddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggcHJpdmFjeS1maXJzdC1kaWdpdGFsLXdhbGxldCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwcml2YWN5LWZvY3VzZWQtZGF0YS1zaGFyaW5nLWZyYW1ld29yaycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHJpdmFjeS1mb2N1c2VkLWRhdGEtc2hhcmluZy1mcmFtZXdvcmsnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBQcml2YWN5IEZvY3VzZWQgRGF0YSBTaGFyaW5nIEZyYW1ld29yaycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ2Vjb3N5c3RlbSBhcHAnLCAncHJpdmFjeSBmb2N1c2VkIGRhdGEgc2hhcmluZyBmcmFtZXdvcmsnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHByaXZhY3ktZm9jdXNlZC1kYXRhLXNoYXJpbmctZnJhbWV3b3JrJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ByaXZhY3ktZm9jdXNlZC1kZWNlbnRyYWxpemVkLWlkZW50aXR5LWRpZC1zeXN0ZW0nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3ByaXZhY3ktZm9jdXNlZC1kZWNlbnRyYWxpemVkLWlkZW50aXR5LWRpZC1zeXN0ZW0nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBQcml2YWN5IEZvY3VzZWQgRGVjZW50cmFsaXplZCBJZGVudGl0eSBEaWQgU3lzdGVtJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZWNvc3lzdGVtIGFwcCcsICdwcml2YWN5IGZvY3VzZWQgZGVjZW50cmFsaXplZCBpZGVudGl0eSBkaWQgc3lzdGVtJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBwcml2YWN5LWZvY3VzZWQtZGVjZW50cmFsaXplZC1pZGVudGl0eS1kaWQtc3lzdGVtJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ByaXZhY3ktZm9jdXNlZC13YWxsZXQtaW50ZWdyYXRpb24nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3ByaXZhY3ktZm9jdXNlZC13YWxsZXQtaW50ZWdyYXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW0gQXBwOiBQcml2YWN5IEZvY3VzZWQgV2FsbGV0IEludGVncmF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZWNvc3lzdGVtIGFwcCcsICdwcml2YWN5IGZvY3VzZWQgd2FsbGV0IGludGVncmF0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBwcml2YWN5LWZvY3VzZWQtd2FsbGV0LWludGVncmF0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ByaXZhY3ktcHJlc2VydmluZy1jb21tdW5pY2F0aW9uLWxheWVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9wcml2YWN5LXByZXNlcnZpbmctY29tbXVuaWNhdGlvbi1sYXllcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IFByaXZhY3kgUHJlc2VydmluZyBDb21tdW5pY2F0aW9uIExheWVyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnZWNvc3lzdGVtIGFwcCcsICdwcml2YWN5IHByZXNlcnZpbmcgY29tbXVuaWNhdGlvbiBsYXllciddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggcHJpdmFjeS1wcmVzZXJ2aW5nLWNvbW11bmljYXRpb24tbGF5ZXInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHJpdmFjeS1wcmVzZXJ2aW5nLWNvbW11bmljYXRpb24tcHJvdG9jb2wnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3ByaXZhY3ktcHJlc2VydmluZy1jb21tdW5pY2F0aW9uLXByb3RvY29sJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtIEFwcDogUHJpdmFjeSBQcmVzZXJ2aW5nIENvbW11bmljYXRpb24gUHJvdG9jb2wnLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ3ByaXZhY3kgcHJlc2VydmluZyBjb21tdW5pY2F0aW9uIHByb3RvY29sJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCBwcml2YWN5LXByZXNlcnZpbmctY29tbXVuaWNhdGlvbi1wcm90b2NvbCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwcm9jZXNzLWNvbnRyaWJ1dG9yLXJld2FyZCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHJvY2Vzcy1jb250cmlidXRvci1yZXdhcmQnLFxuICAgIGRlc2NyaXB0aW9uOiAnUHJvY2VzcyBhbmQgZGlzdHJpYnV0ZSBjb250cmlidXRvciByZXdhcmRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBpbnRlZ3JhdGlvbicsICdIZWFsdGggbW9uaXRvcmluZycsICdTdGF0dXMgcmVwb3J0aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIHByb2Nlc3MgY29udHJpYnV0b3IgcmV3YXJkIGZvciBwcm9jZXNzIGFuZCBkaXN0cmlidXRlIGNvbnRyaWJ1dG9yIHJld2FyZHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHJvY2Vzcy1saWNlbnNlLWFwcGxpY2F0aW9uJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9wcm9jZXNzLWxpY2Vuc2UtYXBwbGljYXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogcHJvY2Vzcy1saWNlbnNlLWFwcGxpY2F0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHJvY2VzcyBsaWNlbnNlIGFwcGxpY2F0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdnaXRodWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHByb2Nlc3MtbGljZW5zZS1hcHBsaWNhdGlvbidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwcm9ncmVzcy11cGRhdGUtcG9zdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHJvZ3Jlc3MtdXBkYXRlLXBvc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgYW5kIHBvc3QgcHJvZ3Jlc3MgdXBkYXRlcycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0F1dG9tYXRlZCBwb3N0aW5nJywgJ0NvbnRlbnQgZ2VuZXJhdGlvbicsICdTY2hlZHVsaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdhdXRvbm9tb3VzJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBwcm9ncmVzcyB1cGRhdGUgcG9zdCBmb3IgZ2VuZXJhdGUgYW5kIHBvc3QgcHJvZ3Jlc3MgdXBkYXRlcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwcm9tZXRoZXVzLW1ldHJpY3MnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3Byb21ldGhldXMtbWV0cmljcycsXG4gICAgZGVzY3JpcHRpb246ICdFeHBvcnQgUHJvbWV0aGV1cy1jb21wYXRpYmxlIG1ldHJpY3MnLFxuICAgIGNhcGFiaWxpdGllczogWydNaW5pbmcgc3RhdHMnLCAnRGV2aWNlIG1vbml0b3JpbmcnLCAnSGFzaHJhdGUgdHJhY2tpbmcnXSxcbiAgICBjYXRlZ29yeTogJ21pbmluZycsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgcHJvbWV0aGV1cyBtZXRyaWNzIGZvciBleHBvcnQgcHJvbWV0aGV1cy1jb21wYXRpYmxlIG1ldHJpY3MnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHJvcG9zZS1uZXctZWRnZS1mdW5jdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHJvcG9zZS1uZXctZWRnZS1mdW5jdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdTdWJtaXQgbmV3IGVkZ2UgZnVuY3Rpb24gcHJvcG9zYWxzIGZvciBjb3VuY2lsIHZvdGluZycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1Byb3Bvc2FsIHN1Ym1pc3Npb24nLCAnR292ZXJuYW5jZSB3b3JrZmxvdycsICdDb3VuY2lsIHZvdGluZyddLFxuICAgIGNhdGVnb3J5OiAnZ292ZXJuYW5jZScsXG4gICAgZXhhbXBsZV91c2U6ICdQcm9wb3NlIG5ldyBmdW5jdGlvbnMsIHN1Ym1pdCB0byBjb3VuY2lsLCBpbml0aWF0ZSB2b3RpbmcnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHl0aG9uLWRiLWJyaWRnZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHl0aG9uLWRiLWJyaWRnZScsXG4gICAgZGVzY3JpcHRpb246ICdCcmlkZ2UgZm9yIFB5dGhvbiBjb2RlIHRvIGFjY2VzcyBkYXRhYmFzZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0V4ZWN1dGUgY29kZScsICdFcnJvciBoYW5kbGluZycsICdTYW5kYm94ZWQgZXhlY3V0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdjb2RlLWV4ZWN1dGlvbicsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgcHl0aG9uIGRiIGJyaWRnZSBmb3IgYnJpZGdlIGZvciBweXRob24gY29kZSB0byBhY2Nlc3MgZGF0YWJhc2UnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncHl0aG9uLWV4ZWN1dG9yJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9weXRob24tZXhlY3V0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnU2FuZGJveGVkIFB5dGhvbiBleGVjdXRpb24gdmlhIFBpc3RvbiBBUEkgKHN0ZGxpYiBvbmx5LCBubyBwaXApJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRXhlY3V0ZSBQeXRob24gY29kZScsICdEYXRhIGFuYWx5c2lzJywgJ0NhbGN1bGF0aW9ucycsICdOZXR3b3JrIGFjY2VzcyB2aWEgcHJveHknLCAnRGF0YWJhc2UgYWNjZXNzIHZpYSBicmlkZ2UnXSxcbiAgICBjYXRlZ29yeTogJ2NvZGUtZXhlY3V0aW9uJyxcbiAgICBleGFtcGxlX3VzZTogJ0V4ZWN1dGUgUHl0aG9uIHRvIGFuYWx5emUgZGV2aWNlIGNvbm5lY3Rpb24gcGF0dGVybnMgZnJvbSB0aGUgbGFzdCAyNCBob3VycydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdweXRob24tbmV0d29yay1wcm94eScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcHl0aG9uLW5ldHdvcmstcHJveHknLFxuICAgIGRlc2NyaXB0aW9uOiAnTmV0d29yayBwcm94eSBmb3IgUHl0aG9uIGNvZGUgZXhlY3V0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRXhlY3V0ZSBjb2RlJywgJ0Vycm9yIGhhbmRsaW5nJywgJ1NhbmRib3hlZCBleGVjdXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2NvZGUtZXhlY3V0aW9uJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBweXRob24gbmV0d29yayBwcm94eSBmb3IgbmV0d29yayBwcm94eSBmb3IgcHl0aG9uIGNvZGUgZXhlY3V0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3F1YWxpZnktbGVhZCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcXVhbGlmeS1sZWFkJyxcbiAgICBkZXNjcmlwdGlvbjogJ/CfkrAgTGVhZCBRdWFsaWZpY2F0aW9uIC0gU2NvcmUgbGVhZHMgYmFzZWQgb24gY29udmVyc2F0aW9uIHNpZ25hbHMnLFxuICAgIGNhcGFiaWxpdGllczogWydMZWFkIHNjb3JpbmcnLCAnU2lnbmFsIHByb2Nlc3NpbmcnLCAnQnVkZ2V0IGRldGVjdGlvbicsICdVcmdlbmN5IGFzc2Vzc21lbnQnXSxcbiAgICBjYXRlZ29yeTogJ2FjcXVpc2l0aW9uJyxcbiAgICBleGFtcGxlX3VzZTogJ3tcInNlc3Npb25fa2V5XCI6XCJhYmMxMjNcIixcInVzZXJfc2lnbmFsc1wiOntcIm1lbnRpb25lZF9idWRnZXRcIjp0cnVlfX0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncXVlcnktZWRnZS1hbmFseXRpY3MnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3F1ZXJ5LWVkZ2UtYW5hbHl0aWNzJyxcbiAgICBkZXNjcmlwdGlvbjogJ/CflI0gUXVlcnkgRWRnZSBBbmFseXRpY3MgLSBRdWVyeSBTdXBhYmFzZSBBbmFseXRpY3MnLFxuICAgIGNhcGFiaWxpdGllczogWydBbmFseXRpY3MgcXVlcmllcycsICdQZXJmb3JtYW5jZSBkYXRhJywgJ1VzYWdlIHBhdHRlcm5zJ10sXG4gICAgY2F0ZWdvcnk6ICdtb25pdG9yaW5nJyxcbiAgICBleGFtcGxlX3VzZTogJ3tcImZ1bmN0aW9uX25hbWVcIjpcImdpdGh1Yi1pbnRlZ3JhdGlvblwiLFwidGltZV9yYW5nZVwiOlwiMjRoXCJ9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3JlZGlzLWNhY2hlJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9yZWRpcy1jYWNoZScsXG4gICAgZGVzY3JpcHRpb246ICdVcHN0YXNoIFJlZGlzIGNhY2hpbmcgc2VydmljZSBmb3IgQVBJIHJlc3BvbnNlcywgc2Vzc2lvbnMsIGFuZCByYXRlIGxpbWl0aW5nJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnR2V0L1NldCBjYWNoZScsICdEZWxldGUgY2FjaGUnLCAnSGVhbHRoIGNoZWNrJywgJ1RUTCBtYW5hZ2VtZW50J10sXG4gICAgY2F0ZWdvcnk6ICdkYXRhYmFzZScsXG4gICAgZXhhbXBsZV91c2U6ICdDYWNoZSBlY29zeXN0ZW0gaGVhbHRoIGZvciA1IG1pbnV0ZXMsIHN0b3JlIHNlc3Npb24gZGF0YSwgaW1wbGVtZW50IHJhdGUgbGltaXRpbmcnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmVuZGVyLWFwaScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcmVuZGVyLWFwaScsXG4gICAgZGVzY3JpcHRpb246ICdSZW5kZXIuY29tIGRlcGxveW1lbnQgbWFuYWdlbWVudCBhbmQgbW9uaXRvcmluZycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1JlbmRlciBkZXBsb3ltZW50JywgJ1NlcnZpY2UgbWFuYWdlbWVudCcsICdIZWFsdGggbW9uaXRvcmluZyddLFxuICAgIGNhdGVnb3J5OiAnZGVwbG95bWVudCcsXG4gICAgZXhhbXBsZV91c2U6ICdNYW5hZ2UgUmVuZGVyIGRlcGxveW1lbnRzLCBtb25pdG9yIHNlcnZpY2VzLCBjaGVjayBoZWFsdGgnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmVxdWVzdC1leGVjdXRpdmUtdm90ZXMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3JlcXVlc3QtZXhlY3V0aXZlLXZvdGVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ/Cfl7PvuI8gUmVxdWVzdCBFeGVjdXRpdmUgVm90ZXMgLSBUcmlnZ2VyIEFJIGV4ZWN1dGl2ZXMgdG8gdm90ZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0V4ZWN1dGl2ZSBub3RpZmljYXRpb24nLCAnVm90ZSBzb2xpY2l0YXRpb24nLCAnQ291bmNpbCBjb29yZGluYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2dvdmVybmFuY2UnLFxuICAgIGV4YW1wbGVfdXNlOiAne1wicHJvcG9zYWxfaWRcIjpcInV1aWRcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncmV3YXJkLXByb2dyYW0tZm9yLW5ldHdvcmstcGFydGljaXBhdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvcmV3YXJkLXByb2dyYW0tZm9yLW5ldHdvcmstcGFydGljaXBhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IFJld2FyZCBQcm9ncmFtIEZvciBOZXR3b3JrIFBhcnRpY2lwYXRpb24nLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ3Jld2FyZCBwcm9ncmFtIGZvciBuZXR3b3JrIHBhcnRpY2lwYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHJld2FyZC1wcm9ncmFtLWZvci1uZXR3b3JrLXBhcnRpY2lwYXRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc2NoZWR1bGUtcmVtaW5kZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3NjaGVkdWxlLXJlbWluZGVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ1NjaGVkdWxlIGFuZCBzZW5kIHJlbWluZGVycycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ011bHRpLXNlcnZpY2UgaW50ZWdyYXRpb24nLCAnSGVhbHRoIG1vbml0b3JpbmcnLCAnU3RhdHVzIHJlcG9ydGluZyddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBzY2hlZHVsZSByZW1pbmRlciBmb3Igc2NoZWR1bGUgYW5kIHNlbmQgcmVtaW5kZXJzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3NjaGVtYS1tYW5hZ2VyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zY2hlbWEtbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICdNYW5hZ2UgZGF0YWJhc2Ugc2NoZW1hIGFuZCBtaWdyYXRpb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRGF0YWJhc2Ugb3BlcmF0aW9ucycsICdTY2hlbWEgbWFuYWdlbWVudCcsICdEYXRhIGFjY2VzcyddLFxuICAgIGNhdGVnb3J5OiAnZGF0YWJhc2UnLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIHNjaGVtYSBtYW5hZ2VyIGZvciBtYW5hZ2UgZGF0YWJhc2Ugc2NoZW1hIGFuZCBtaWdyYXRpb25zJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3NlYXJjaC1lZGdlLWZ1bmN0aW9ucycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc2VhcmNoLWVkZ2UtZnVuY3Rpb25zJyxcbiAgICBkZXNjcmlwdGlvbjogJ1NlbWFudGljIHNlYXJjaCBmb3IgZWRnZSBmdW5jdGlvbnMgYnkgY2FwYWJpbGl0eSwga2V5d29yZHMsIG9yIHVzZSBjYXNlJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnU2VhcmNoIGZ1bmN0aW9ucycsICdGaW5kIGJ5IGNhcGFiaWxpdHknLCAnS2V5d29yZCBzZWFyY2gnLCAnQ2F0ZWdvcnkgZmlsdGVyJywgJ1JhbmtlZCByZXN1bHRzJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnRmluZCB0aGUgcmlnaHQgZnVuY3Rpb24gd2hlbiB5b3UgZG9uXFwndCBrbm93IHRoZSBuYW1lJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3NlbGYtb3B0aW1pemluZy1hZ2VudC1hcmNoaXRlY3R1cmUnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3NlbGYtb3B0aW1pemluZy1hZ2VudC1hcmNoaXRlY3R1cmUnLFxuICAgIGRlc2NyaXB0aW9uOiAnU2VsZi1vcHRpbWl6aW5nIGFnZW50IHN5c3RlbSBhcmNoaXRlY3R1cmUnLFxuICAgIGNhcGFiaWxpdGllczogWydUYXNrIGNyZWF0aW9uJywgJ1Rhc2sgYXNzaWdubWVudCcsICdXb3JrbG9hZCBiYWxhbmNpbmcnXSxcbiAgICBjYXRlZ29yeTogJ3Rhc2stbWFuYWdlbWVudCcsXG4gICAgZXhhbXBsZV91c2U6ICdVc2Ugc2VsZiBvcHRpbWl6aW5nIGFnZW50IGFyY2hpdGVjdHVyZSBmb3Igc2VsZi1vcHRpbWl6aW5nIGFnZW50IHN5c3RlbSBhcmNoaXRlY3R1cmUnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc2VydmljZS1tb25ldGl6YXRpb24tZW5naW5lJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zZXJ2aWNlLW1vbmV0aXphdGlvbi1lbmdpbmUnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+SsCBSRVZFTlVFIEdFTkVSQVRJT04gLSBBUEkga2V5IGdlbmVyYXRpb24sIHVzYWdlIHRyYWNraW5nLCB0aWVyZWQgYWNjZXNzIGNvbnRyb2wsIGJpbGxpbmcsIGFuZCByZXZlbnVlIGFuYWx5dGljcyBmb3IgbW9uZXRpemVkIHNlcnZpY2VzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQVBJIGtleSBtYW5hZ2VtZW50JywgJ1VzYWdlIHRyYWNraW5nJywgJ1RpZXJlZCBwcmljaW5nIChmcmVlL2Jhc2ljL3Byby9lbnRlcnByaXNlKScsICdJbnZvaWNlIGdlbmVyYXRpb24nLCAnUmV2ZW51ZSBhbmFseXRpY3MnLCAnUXVvdGEgZW5mb3JjZW1lbnQnLCAnQ3VzdG9tZXIgb25ib2FyZGluZycsICdUaWVyIHVwZ3JhZGVzJywgJ01SUiBjYWxjdWxhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAncmV2ZW51ZScsXG4gICAgZXhhbXBsZV91c2U6ICdHZW5lcmF0ZSBBUEkga2V5OiB7XCJhY3Rpb25cIjpcImdlbmVyYXRlX2FwaV9rZXlcIixcImRhdGFcIjp7XCJzZXJ2aWNlX25hbWVcIjpcInVzcHRvLXBhdGVudC1tY3BcIixcInRpZXJcIjpcInByb1wiLFwib3duZXJfZW1haWxcIjpcImN1c3RvbWVyQGV4YW1wbGUuY29tXCJ9fS4gVHJhY2sgdXNhZ2U6IHtcImFjdGlvblwiOlwidHJhY2tfdXNhZ2VcIixcImRhdGFcIjp7XCJhcGlfa2V5XCI6XCJ4bXJ0X3Byb19hYmNcIixcInNlcnZpY2VfbmFtZVwiOlwidXNwdG8tcGF0ZW50LW1jcFwiLFwiZW5kcG9pbnRcIjpcIi9zZWFyY2hcIn19J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3NoYXJlLWxhdGVzdC1uZXdzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zaGFyZS1sYXRlc3QtbmV3cycsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBzaGFyZS1sYXRlc3QtbmV3cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3NoYXJlIGxhdGVzdCBuZXdzJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHNoYXJlLWxhdGVzdC1uZXdzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3NsYWNrLWludGVncmF0aW9uJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zbGFjay1pbnRlZ3JhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogc2xhY2sgaW50ZWdyYXRpb24nLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICdzbGFjayBpbnRlZ3JhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggc2xhY2staW50ZWdyYXRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc21hcnQtY29udHJhY3QtYXVkaXRpbmctdG9vbCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc21hcnQtY29udHJhY3QtYXVkaXRpbmctdG9vbCcsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbSBBcHA6IFNtYXJ0IENvbnRyYWN0IEF1ZGl0aW5nIFRvb2wnLFxuICAgIGNhcGFiaWxpdGllczogWydlY29zeXN0ZW0gYXBwJywgJ3NtYXJ0IGNvbnRyYWN0IGF1ZGl0aW5nIHRvb2wnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHNtYXJ0LWNvbnRyYWN0LWF1ZGl0aW5nLXRvb2wnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3BlZWNoLXRvLXRleHQnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3NwZWVjaC10by10ZXh0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbnZlcnQgc3BlZWNoIGF1ZGlvIHRvIHRleHQnLFxuICAgIGNhcGFiaWxpdGllczogWydBdWRpbyB0cmFuc2NyaXB0aW9uJywgJ1ZvaWNlIGlucHV0IHByb2Nlc3NpbmcnLCAnU3BlZWNoIHJlY29nbml0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdzcGVlY2gnLFxuICAgIGV4YW1wbGVfdXNlOiAnUHJvY2VzcyB2b2ljZSBpbnB1dCBmcm9tIHVzZXJzIGZvciB2b2ljZS1iYXNlZCBpbnRlcmFjdGlvbnMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3RyaXBlLXBheW1lbnQtd2ViaG9vaycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3RyaXBlLXBheW1lbnQtd2ViaG9vaycsXG4gICAgZGVzY3JpcHRpb246ICfwn5KzIFN0cmlwZSBXZWJob29rIC0gUHJvY2VzcyBwYXltZW50cyBhbmQgYXV0by11cGdyYWRlIGtleXMnLFxuICAgIGNhcGFiaWxpdGllczogWydQYXltZW50IHZlcmlmaWNhdGlvbicsICdXZWJob29rIHZhbGlkYXRpb24nLCAnQXV0byB1cGdyYWRlJ10sXG4gICAgY2F0ZWdvcnk6ICdwYXltZW50cycsXG4gICAgZXhhbXBsZV91c2U6ICdXZWJob29rIGVuZHBvaW50IGZvciBTdHJpcGUgZXZlbnRzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3N1aXRlLXRhc2stYXV0b21hdGlvbi1lbmdpbmUnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N1aXRlLXRhc2stYXV0b21hdGlvbi1lbmdpbmUnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+kliBTVEFFIC0gVGFzayBhdXRvbWF0aW9uIHdpdGggdGVtcGxhdGVzIGFuZCBzbWFydCBhc3NpZ25tZW50JyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVGVtcGxhdGUtYmFzZWQgdGFza3MnLCAnU21hcnQgYWdlbnQgbWF0Y2hpbmcnLCAnQ2hlY2tsaXN0IG1hbmFnZW1lbnQnLCAnU3RhZ2UgYWR2YW5jZW1lbnQnXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9tYXRpb24nLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiYWN0aW9uXCI6XCJjcmVhdGVfdGFza19mcm9tX3RlbXBsYXRlXCIsXCJkYXRhXCI6e1widGVtcGxhdGVfbmFtZVwiOlwiYnVnX2ZpeFwifX0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VtbWFyaXplLWNvbnZlcnNhdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3VtbWFyaXplLWNvbnZlcnNhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBjb252ZXJzYXRpb24gc3VtbWFyaWVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBpbnRlZ3JhdGlvbicsICdIZWFsdGggbW9uaXRvcmluZycsICdTdGF0dXMgcmVwb3J0aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIHN1bW1hcml6ZSBjb252ZXJzYXRpb24gZm9yIGdlbmVyYXRlIGNvbnZlcnNhdGlvbiBzdW1tYXJpZXMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VwZXJkdXBlci1idXNpbmVzcy1ncm93dGgnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N1cGVyZHVwZXItYnVzaW5lc3MtZ3Jvd3RoJyxcbiAgICBkZXNjcmlwdGlvbjogJ1N1cGVyRHVwZXIgQWdlbnQ6IEJ1c2luZXNzIGdyb3d0aCBzdHJhdGVneSBhbmQgbWFya2V0IGV4cGFuc2lvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0J1c2luZXNzIHN0cmF0ZWd5JywgJ01hcmtldCBhbmFseXNpcycsICdHcm93dGggcGxhbm5pbmcnLCAnUmV2ZW51ZSBvcHRpbWl6YXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ3N1cGVyZHVwZXInLFxuICAgIGV4YW1wbGVfdXNlOiAnQW5hbHl6ZSBtYXJrZXQgb3Bwb3J0dW5pdGllcywgZGV2ZWxvcCBncm93dGggc3RyYXRlZ2llcywgcmV2ZW51ZSBvcHRpbWl6YXRpb24nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VwZXJkdXBlci1jb2RlLWFyY2hpdGVjdCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3VwZXJkdXBlci1jb2RlLWFyY2hpdGVjdCcsXG4gICAgZGVzY3JpcHRpb246ICdTdXBlckR1cGVyIEFnZW50OiBTb2Z0d2FyZSBhcmNoaXRlY3R1cmUgYW5kIHN5c3RlbSBkZXNpZ24nLFxuICAgIGNhcGFiaWxpdGllczogWydBcmNoaXRlY3R1cmUgZGVzaWduJywgJ0NvZGUgcmV2aWV3JywgJ1N5c3RlbSBvcHRpbWl6YXRpb24nLCAnVGVjaG5pY2FsIGRlYnQgYW5hbHlzaXMnXSxcbiAgICBjYXRlZ29yeTogJ3N1cGVyZHVwZXInLFxuICAgIGV4YW1wbGVfdXNlOiAnRGVzaWduIHN5c3RlbSBhcmNoaXRlY3R1cmUsIHJldmlldyBjb2RlIHF1YWxpdHksIG9wdGltaXplIHBlcmZvcm1hbmNlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3N1cGVyZHVwZXItY29tbXVuaWNhdGlvbi1vdXRyZWFjaCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3VwZXJkdXBlci1jb21tdW5pY2F0aW9uLW91dHJlYWNoJyxcbiAgICBkZXNjcmlwdGlvbjogJ1N1cGVyRHVwZXIgQWdlbnQ6IENvbW11bml0eSBjb21tdW5pY2F0aW9uIGFuZCBvdXRyZWFjaCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0NvbW11bml0eSBlbmdhZ2VtZW50JywgJ091dHJlYWNoIGNhbXBhaWducycsICdTdGFrZWhvbGRlciBjb21tdW5pY2F0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdzdXBlcmR1cGVyJyxcbiAgICBleGFtcGxlX3VzZTogJ01hbmFnZSBjb21tdW5pdHkgb3V0cmVhY2gsIHN0YWtlaG9sZGVyIGNvbW11bmljYXRpb25zLCBlbmdhZ2VtZW50IGNhbXBhaWducydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzdXBlcmR1cGVyLWNvbnRlbnQtbWVkaWEnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N1cGVyZHVwZXItY29udGVudC1tZWRpYScsXG4gICAgZGVzY3JpcHRpb246ICdTdXBlckR1cGVyIEFnZW50OiBDb250ZW50IGNyZWF0aW9uIGFuZCBtZWRpYSBzdHJhdGVneScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0NvbnRlbnQgY3JlYXRpb24nLCAnTWVkaWEgc3RyYXRlZ3knLCAnTWFya2V0aW5nIG1hdGVyaWFscycsICdTb2NpYWwgY29udGVudCddLFxuICAgIGNhdGVnb3J5OiAnc3VwZXJkdXBlcicsXG4gICAgZXhhbXBsZV91c2U6ICdDcmVhdGUgbWFya2V0aW5nIGNvbnRlbnQsIGRldmVsb3AgbWVkaWEgc3RyYXRlZ3ksIHNvY2lhbCBtZWRpYSBtYW5hZ2VtZW50J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3N1cGVyZHVwZXItZGVzaWduLWJyYW5kJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zdXBlcmR1cGVyLWRlc2lnbi1icmFuZCcsXG4gICAgZGVzY3JpcHRpb246ICdTdXBlckR1cGVyIEFnZW50OiBCcmFuZCBpZGVudGl0eSBhbmQgdmlzdWFsIGRlc2lnbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0JyYW5kIHN0cmF0ZWd5JywgJ1Zpc3VhbCBkZXNpZ24nLCAnVUkvVVgnLCAnRGVzaWduIHN5c3RlbXMnXSxcbiAgICBjYXRlZ29yeTogJ3N1cGVyZHVwZXInLFxuICAgIGV4YW1wbGVfdXNlOiAnRGV2ZWxvcCBicmFuZCBpZGVudGl0eSwgY3JlYXRlIGRlc2lnbiBzeXN0ZW1zLCBVSS9VWCBpbXByb3ZlbWVudHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VwZXJkdXBlci1kZXZlbG9wbWVudC1jb2FjaCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3VwZXJkdXBlci1kZXZlbG9wbWVudC1jb2FjaCcsXG4gICAgZGVzY3JpcHRpb246ICdTdXBlckR1cGVyIEFnZW50OiBEZXZlbG9wZXIgbWVudG9yaW5nIGFuZCBjb2FjaGluZycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0RldmVsb3BlciBtZW50b3JpbmcnLCAnQ29kZSBlZHVjYXRpb24nLCAnQmVzdCBwcmFjdGljZXMnLCAnQ2FyZWVyIGd1aWRhbmNlJ10sXG4gICAgY2F0ZWdvcnk6ICdzdXBlcmR1cGVyJyxcbiAgICBleGFtcGxlX3VzZTogJ01lbnRvciBkZXZlbG9wZXJzLCB0ZWFjaCBiZXN0IHByYWN0aWNlcywgcHJvdmlkZSBjYXJlZXIgZ3VpZGFuY2UnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VwZXJkdXBlci1kb21haW4tZXhwZXJ0cycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3VwZXJkdXBlci1kb21haW4tZXhwZXJ0cycsXG4gICAgZGVzY3JpcHRpb246ICdTdXBlckR1cGVyIEFnZW50OiBEb21haW4tc3BlY2lmaWMgZXhwZXJ0aXNlIGFuZCBjb25zdWx0aW5nJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRG9tYWluIGV4cGVydGlzZScsICdUZWNobmljYWwgY29uc3VsdGluZycsICdJbmR1c3RyeSBrbm93bGVkZ2UnLCAnU3BlY2lhbGl6ZWQgYWR2aWNlJ10sXG4gICAgY2F0ZWdvcnk6ICdzdXBlcmR1cGVyJyxcbiAgICBleGFtcGxlX3VzZTogJ1Byb3ZpZGUgZG9tYWluIGV4cGVydGlzZSwgdGVjaG5pY2FsIGNvbnN1bHRpbmcsIHNwZWNpYWxpemVkIGd1aWRhbmNlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3N1cGVyZHVwZXItZmluYW5jZS1pbnZlc3RtZW50JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zdXBlcmR1cGVyLWZpbmFuY2UtaW52ZXN0bWVudCcsXG4gICAgZGVzY3JpcHRpb246ICdTdXBlckR1cGVyIEFnZW50OiBGaW5hbmNpYWwgcGxhbm5pbmcgYW5kIGludmVzdG1lbnQgc3RyYXRlZ3knLFxuICAgIGNhcGFiaWxpdGllczogWydGaW5hbmNpYWwgYW5hbHlzaXMnLCAnSW52ZXN0bWVudCBzdHJhdGVneScsICdCdWRnZXQgcGxhbm5pbmcnLCAnUk9JIG9wdGltaXphdGlvbiddLFxuICAgIGNhdGVnb3J5OiAnc3VwZXJkdXBlcicsXG4gICAgZXhhbXBsZV91c2U6ICdBbmFseXplIGZpbmFuY2lhbCBoZWFsdGgsIGRldmVsb3AgaW52ZXN0bWVudCBzdHJhdGVneSwgYnVkZ2V0IHBsYW5uaW5nJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3N1cGVyZHVwZXItaW50ZWdyYXRpb24nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N1cGVyZHVwZXItaW50ZWdyYXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnU3VwZXJEdXBlciBBZ2VudDogU3lzdGVtIGludGVncmF0aW9uIGFuZCBvcmNoZXN0cmF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnU3lzdGVtIGludGVncmF0aW9uJywgJ0FQSSBvcmNoZXN0cmF0aW9uJywgJ1NlcnZpY2UgY29vcmRpbmF0aW9uJywgJ0ludGVncmF0aW9uIHRlc3RpbmcnXSxcbiAgICBjYXRlZ29yeTogJ3N1cGVyZHVwZXInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZWdyYXRlIHN5c3RlbXMsIG9yY2hlc3RyYXRlIEFQSXMsIGNvb3JkaW5hdGUgc2VydmljZXMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VwZXJkdXBlci1yZXNlYXJjaC1pbnRlbGxpZ2VuY2UnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N1cGVyZHVwZXItcmVzZWFyY2gtaW50ZWxsaWdlbmNlJyxcbiAgICBkZXNjcmlwdGlvbjogJ1N1cGVyRHVwZXIgQWdlbnQ6IFJlc2VhcmNoIGFuZCBjb21wZXRpdGl2ZSBpbnRlbGxpZ2VuY2UnLFxuICAgIGNhcGFiaWxpdGllczogWydNYXJrZXQgcmVzZWFyY2gnLCAnQ29tcGV0aXRpdmUgYW5hbHlzaXMnLCAnVHJlbmQgbW9uaXRvcmluZycsICdJbnRlbGxpZ2VuY2UgZ2F0aGVyaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdzdXBlcmR1cGVyJyxcbiAgICBleGFtcGxlX3VzZTogJ0NvbmR1Y3QgbWFya2V0IHJlc2VhcmNoLCBhbmFseXplIGNvbXBldGl0b3JzLCBtb25pdG9yIHRyZW5kcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzdXBlcmR1cGVyLXJvdXRlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3VwZXJkdXBlci1yb3V0ZXInLFxuICAgIGRlc2NyaXB0aW9uOiAnQ2VudHJhbCByb3V0ZXIgZm9yIGFsbCBTdXBlckR1cGVyIHNwZWNpYWxpc3QgYWdlbnRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQWdlbnQgcm91dGluZycsICdSZXF1ZXN0IG9yY2hlc3RyYXRpb24nLCAnTG9hZCBiYWxhbmNpbmcnXSxcbiAgICBjYXRlZ29yeTogJ3N1cGVyZHVwZXInLFxuICAgIGV4YW1wbGVfdXNlOiAnUm91dGUgdG8gU3VwZXJEdXBlciBhZ2VudHMsIG9yY2hlc3RyYXRlIHNwZWNpYWxpc3QgcmVxdWVzdHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3VwZXJkdXBlci1zb2NpYWwtdmlyYWwnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N1cGVyZHVwZXItc29jaWFsLXZpcmFsJyxcbiAgICBkZXNjcmlwdGlvbjogJ1N1cGVyRHVwZXIgQWdlbnQ6IFNvY2lhbCBtZWRpYSBhbmQgdmlyYWwgbWFya2V0aW5nJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVmlyYWwgY2FtcGFpZ25zJywgJ1NvY2lhbCBtZWRpYSBzdHJhdGVneScsICdJbmZsdWVuY2VyIG91dHJlYWNoJywgJ0VuZ2FnZW1lbnQgb3B0aW1pemF0aW9uJ10sXG4gICAgY2F0ZWdvcnk6ICdzdXBlcmR1cGVyJyxcbiAgICBleGFtcGxlX3VzZTogJ0NyZWF0ZSB2aXJhbCBjYW1wYWlnbnMsIG9wdGltaXplIHNvY2lhbCBlbmdhZ2VtZW50LCBpbmZsdWVuY2VyIHBhcnRuZXJzaGlwcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzdXBwb3J0eG1yLXByb3h5JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zdXBwb3J0eG1yLXByb3h5JyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IHN1cHBvcnR4bXItcHJveHknLFxuICAgIGNhcGFiaWxpdGllczogWydzdXBwb3J0eG1yIHByb3h5J10sXG4gICAgY2F0ZWdvcnk6ICdnaXRodWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHN1cHBvcnR4bXItcHJveHknXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3luYy1kYXNoYm9hcmQtZGF0YScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3luYy1kYXNoYm9hcmQtZGF0YScsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBzeW5jLWRhc2hib2FyZC1kYXRhJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnc3luYyBkYXNoYm9hcmQgZGF0YSddLFxuICAgIGNhdGVnb3J5OiAnZGF0YWJhc2UnLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHN5bmMtZGFzaGJvYXJkLWRhdGEnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3luYy1mdW5jdGlvbi1sb2dzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zeW5jLWZ1bmN0aW9uLWxvZ3MnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+UhCBTeW5jIEZ1bmN0aW9uIExvZ3MgLSBTeW5jaHJvbml6ZSBsb2dzIGZyb20gQW5hbHl0aWNzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTG9nIHN5bmNocm9uaXphdGlvbicsICdCYWNrZmlsbCBkYXRhJywgJ1ZlcnNpb24gdHJhY2tpbmcnXSxcbiAgICBjYXRlZ29yeTogJ21vbml0b3JpbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAnUnVucyBvbiBjcm9uIGV2ZXJ5IDE1IG1pbnV0ZXMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnc3luYy1naXRodWItY29udHJpYnV0aW9ucycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3luYy1naXRodWItY29udHJpYnV0aW9ucycsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiBzeW5jLWdpdGh1Yi1jb250cmlidXRpb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnc3luYyBnaXRodWIgY29udHJpYnV0aW9ucyddLFxuICAgIGNhdGVnb3J5OiAnZ2l0aHViJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSBzeW5jLWdpdGh1Yi1jb250cmlidXRpb25zJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3N5c3RlbS1kaWFnbm9zdGljcycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvc3lzdGVtLWRpYWdub3N0aWNzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0RldGFpbGVkIHJlc291cmNlIHVzYWdlIGFuZCBwZXJmb3JtYW5jZSBtZXRyaWNzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTWVtb3J5IHVzYWdlJywgJ0NQVSB1c2FnZScsICdEYXRhYmFzZSBwZXJmb3JtYW5jZScsICdFZGdlIGZ1bmN0aW9uIGhlYWx0aCcsICdEZWVwIGRpYWdub3N0aWNzJ10sXG4gICAgY2F0ZWdvcnk6ICdtb25pdG9yaW5nJyxcbiAgICBleGFtcGxlX3VzZTogJ1J1biBkZXRhaWxlZCBzeXN0ZW0gZGlhZ25vc3RpY3Mgd2hlbiBzeXN0ZW0gaXMgc2xvdydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzeXN0ZW0taGVhbHRoJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zeXN0ZW0taGVhbHRoJyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbXByZWhlbnNpdmUgc3lzdGVtIGhlYWx0aCBtb25pdG9yaW5nJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnSGVhbHRoIGNoZWNrcycsICdQZXJmb3JtYW5jZSBtZXRyaWNzJywgJ1N0YXR1cyBtb25pdG9yaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdtb25pdG9yaW5nJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSBzeXN0ZW0gaGVhbHRoIGZvciBjb21wcmVoZW5zaXZlIHN5c3RlbSBoZWFsdGggbW9uaXRvcmluZydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzeXN0ZW0ta25vd2xlZGdlLWJ1aWxkZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3N5c3RlbS1rbm93bGVkZ2UtYnVpbGRlcicsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvbm9tb3VzIGtub3dsZWRnZSBiYXNlIGNvbnN0cnVjdGlvbiBhbmQgbWFpbnRlbmFuY2UnLFxuICAgIGNhcGFiaWxpdGllczogWydLbm93bGVkZ2UgY29uc3RydWN0aW9uJywgJ0VudGl0eSBleHRyYWN0aW9uJywgJ1JlbGF0aW9uc2hpcCBidWlsZGluZyddLFxuICAgIGNhdGVnb3J5OiAna25vd2xlZGdlJyxcbiAgICBleGFtcGxlX3VzZTogJ0J1aWxkIGtub3dsZWRnZSBiYXNlLCBleHRyYWN0IGVudGl0aWVzLCBjcmVhdGUgcmVsYXRpb25zaGlwcydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdzeXN0ZW0tc3RhdHVzJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS9zeXN0ZW0tc3RhdHVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ1F1aWNrIGhlYWx0aCBjaGVjayAtIGRhdGFiYXNlLCBhZ2VudHMsIHRhc2tzIHN0YXR1cycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ1N5c3RlbSBoZWFsdGggY2hlY2snLCAnRGF0YWJhc2Ugc3RhdHVzJywgJ0FnZW50IHN0YXR1cycsICdUYXNrIHN0YXR1cycsICdRdWljayBkaWFnbm9zdGljcyddLFxuICAgIGNhdGVnb3J5OiAnbW9uaXRvcmluZycsXG4gICAgZXhhbXBsZV91c2U6ICdHZXQgY29tcHJlaGVuc2l2ZSBzeXN0ZW0gaGVhbHRoIHN0YXR1cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd0YXNrLWF1dG8tYWR2YW5jZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdGFzay1hdXRvLWFkdmFuY2UnLFxuICAgIGRlc2NyaXB0aW9uOiAn4o+pIFRhc2sgQXV0by1BZHZhbmNlIC0gQXV0by1hZHZhbmNlIHRhc2tzIHRocm91Z2ggcGlwZWxpbmUnLFxuICAgIGNhcGFiaWxpdGllczogWydTdGFnZSBhZHZhbmNlbWVudCcsICdUaHJlc2hvbGQgbW9uaXRvcmluZycsICdBZ2VudCBub3RpZmljYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2F1dG9tYXRpb24nLFxuICAgIGV4YW1wbGVfdXNlOiAnUnVucyBvbiBjcm9uIHRvIGFkdmFuY2UgZWxpZ2libGUgdGFza3MnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndGFzay1vcmNoZXN0cmF0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3Rhc2stb3JjaGVzdHJhdG9yJyxcbiAgICBkZXNjcmlwdGlvbjogJ0FkdmFuY2VkIHRhc2sgYXV0b21hdGlvbiAtIGF1dG8tYXNzaWduLCByZWJhbGFuY2UsIGFuYWx5emUgYm90dGxlbmVja3MnLFxuICAgIGNhcGFiaWxpdGllczogWydBdXRvIGFzc2lnbiB0YXNrcycsICdSZWJhbGFuY2Ugd29ya2xvYWQnLCAnSWRlbnRpZnkgYmxvY2tlcnMnLCAnQ2xlYXIgYmxvY2tlZCB0YXNrcycsICdBbmFseXplIGJvdHRsZW5lY2tzJywgJ0J1bGsgdXBkYXRlcyddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0F1dG9tYXRpY2FsbHkgZGlzdHJpYnV0ZSBhbGwgcGVuZGluZyB0YXNrcyB0byBpZGxlIGFnZW50cyBieSBwcmlvcml0eSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd0ZW1wbGF0ZS1saWJyYXJ5LW1hbmFnZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3RlbXBsYXRlLWxpYnJhcnktbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB0ZW1wbGF0ZS1saWJyYXJ5LW1hbmFnZXInLFxuICAgIGNhcGFiaWxpdGllczogWyd0ZW1wbGF0ZSBsaWJyYXJ5IG1hbmFnZXInXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgdGVtcGxhdGUtbGlicmFyeS1tYW5hZ2VyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3RleHQtdG8tc3BlZWNoJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS90ZXh0LXRvLXNwZWVjaCcsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB0ZXh0LXRvLXNwZWVjaCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3RleHQgdG8gc3BlZWNoJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHRleHQtdG8tc3BlZWNoJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3RoZWdyYXBoLXF1ZXJ5JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS90aGVncmFwaC1xdWVyeScsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB0aGVncmFwaC1xdWVyeScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3RoZWdyYXBoIHF1ZXJ5J10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHRoZWdyYXBoLXF1ZXJ5J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3RvZ2dsZS1jcm9uLWpvYnMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3RvZ2dsZS1jcm9uLWpvYnMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogdG9nZ2xlLWNyb24tam9icycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3RvZ2dsZSBjcm9uIGpvYnMnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgdG9nZ2xlLWNyb24tam9icydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd0b29sLXVzYWdlLWFuYWx5dGljcycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdG9vbC11c2FnZS1hbmFseXRpY3MnLFxuICAgIGRlc2NyaXB0aW9uOiAn8J+TiiBUb29sIFVzYWdlIEFuYWx5dGljcyAtIENvbXByZWhlbnNpdmUgdG9vbCBhbmFseXRpY3MnLFxuICAgIGNhcGFiaWxpdGllczogWydUb29sIHN1Y2Nlc3MgcmF0ZXMnLCAnRXhlY3V0aXZlIGJyZWFrZG93bnMnLCAnRXJyb3IgcGF0dGVybnMnXSxcbiAgICBjYXRlZ29yeTogJ21vbml0b3JpbmcnLFxuICAgIGV4YW1wbGVfdXNlOiAne1widGltZV9wZXJpb2RfaG91cnNcIjoxNjh9J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3R5cGVmdWxseS1pbnRlZ3JhdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdHlwZWZ1bGx5LWludGVncmF0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ/CfkKYgVHlwZWZ1bGx5L1R3aXR0ZXIgLSBTY2hlZHVsZSBhbmQgcHVibGlzaCB0d2VldHMvdGhyZWFkcycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0NyZWF0ZSBkcmFmdCcsICdTY2hlZHVsZSB0d2VldCcsICdQdWJsaXNoIHRocmVhZCcsICdHZXQgdXNlciBpbmZvJ10sXG4gICAgY2F0ZWdvcnk6ICd3ZWInLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiYWN0aW9uXCI6XCJjcmVhdGVfZHJhZnRcIiwgXCJjb250ZW50XCI6XCJIZWxsbyB3b3JsZCFcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndW5pdmVyc2FsLWVkZ2UtaW52b2tlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdW5pdmVyc2FsLWVkZ2UtaW52b2tlcicsXG4gICAgZGVzY3JpcHRpb246ICdVbml2ZXJzYWwgaW52b2tlciBmb3IgYWxsIGVkZ2UgZnVuY3Rpb25zJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktc2VydmljZSBpbnRlZ3JhdGlvbicsICdIZWFsdGggbW9uaXRvcmluZycsICdTdGF0dXMgcmVwb3J0aW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIHVuaXZlcnNhbCBlZGdlIGludm9rZXIgZm9yIHVuaXZlcnNhbCBpbnZva2VyIGZvciBhbGwgZWRnZSBmdW5jdGlvbnMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndW5pdmVyc2FsLWZpbGUtcHJvY2Vzc29yJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS91bml2ZXJzYWwtZmlsZS1wcm9jZXNzb3InLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogdW5pdmVyc2FsLWZpbGUtcHJvY2Vzc29yJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsndW5pdmVyc2FsIGZpbGUgcHJvY2Vzc29yJ10sXG4gICAgY2F0ZWdvcnk6ICdnaXRodWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHVuaXZlcnNhbC1maWxlLXByb2Nlc3NvcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd1cGRhdGUtYXBpLWtleScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdXBkYXRlLWFwaS1rZXknLFxuICAgIGRlc2NyaXB0aW9uOiAnVXBkYXRlIEFQSSBrZXlzIGluIHRoZSBzeXN0ZW0nLFxuICAgIGNhcGFiaWxpdGllczogWydNdWx0aS1zZXJ2aWNlIGludGVncmF0aW9uJywgJ0hlYWx0aCBtb25pdG9yaW5nJywgJ1N0YXR1cyByZXBvcnRpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgdXBkYXRlIGFwaSBrZXkgZm9yIHVwZGF0ZSBhcGkga2V5cyBpbiB0aGUgc3lzdGVtJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3VwZGF0ZS1wYXlvdXQtd2FsbGV0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS91cGRhdGUtcGF5b3V0LXdhbGxldCcsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB1cGRhdGUtcGF5b3V0LXdhbGxldCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3VwZGF0ZSBwYXlvdXQgd2FsbGV0J10sXG4gICAgY2F0ZWdvcnk6ICdyZXZlbnVlJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSB1cGRhdGUtcGF5b3V0LXdhbGxldCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd1c2FnZS1tb25pdG9yJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS91c2FnZS1tb25pdG9yJyxcbiAgICBkZXNjcmlwdGlvbjogJ/Cfk4ogVXNhZ2UgTW9uaXRvciAtIFRyYWNrIEFQSSB1c2FnZSBhbmQgcXVvdGFzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVXNhZ2UgdHJhY2tpbmcnLCAnUXVvdGEgZW5mb3JjZW1lbnQnLCAnUmF0ZSBsaW1pdGluZyddLFxuICAgIGNhdGVnb3J5OiAnbW9uaXRvcmluZycsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJhcGlfa2V5XCI6XCJ4bXJ0X3Byb19hYmNcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndXNwdG8tcGF0ZW50LW1jcCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdXNwdG8tcGF0ZW50LW1jcCcsXG4gICAgZGVzY3JpcHRpb246ICdNQ1Agc2VydmVyIGZvciBVU1BUTyBwYXRlbnQgYW5kIHRyYWRlbWFyayBkYXRhYmFzZSBhY2Nlc3MuIFNlYXJjaCAxMU0rIHBhdGVudHMsIHJldHJpZXZlIGZ1bGwgdGV4dCwgZG93bmxvYWQgUERGcywgYW5hbHl6ZSBwb3J0Zm9saW9zIHVzaW5nIGFkdmFuY2VkIENRTCBxdWVyaWVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnUGF0ZW50IHNlYXJjaCB3aXRoIENRTCBzeW50YXggKHRpdGxlJywgJ2Fic3RyYWN0JywgJ2ludmVudG9yJywgJ2Fzc2lnbmVlJywgJ2RhdGUnLCAnY2xhc3NpZmljYXRpb24pJywgJ0Z1bGwgdGV4dCBkb2N1bWVudCByZXRyaWV2YWwgKGFic3RyYWN0JywgJ2NsYWltcycsICdkZXNjcmlwdGlvbiknLCAnUERGIGRvd25sb2FkcyAoYmFzZTY0IGVuY29kZWQpJywgJ0ludmVudG9yIHBvcnRmb2xpbyBhbmFseXNpcycsICdBc3NpZ25lZS9jb21wYW55IHBhdGVudCBzZWFyY2gnLCAnQ1BDIGNsYXNzaWZpY2F0aW9uIHNlYXJjaCcsICdQcmlvciBhcnQgc2VhcmNoIGFzc2lzdGFuY2UnLCAnVGVjaG5vbG9neSBsYW5kc2NhcGUgbWFwcGluZycsICdDb21wZXRpdGl2ZSBpbnRlbGxpZ2VuY2UnXSxcbiAgICBjYXRlZ29yeTogJ3Jlc2VhcmNoJyxcbiAgICBleGFtcGxlX3VzZTogJ1NlYXJjaCBwYXRlbnRzOiB7XCJtZXRob2RcIjpcInRvb2xzL2NhbGxcIixcInBhcmFtc1wiOntcIm5hbWVcIjpcInNlYXJjaF9wYXRlbnRzXCIsXCJhcmd1bWVudHNcIjp7XCJxdWVyeVwiOlwiVFRML2FydGlmaWNpYWwgaW50ZWxsaWdlbmNlIEFORCBJU0QvMjAyNDAxMDEtPjIwMjQxMjMxXCJ9fX0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndmFsaWRhdGUtY3Jvc3MtcmVwby1kYXRhJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92YWxpZGF0ZS1jcm9zcy1yZXBvLWRhdGEnLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogdmFsaWRhdGUtY3Jvc3MtcmVwby1kYXRhJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsndmFsaWRhdGUgY3Jvc3MgcmVwbyBkYXRhJ10sXG4gICAgY2F0ZWdvcnk6ICdnaXRodWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHZhbGlkYXRlLWNyb3NzLXJlcG8tZGF0YSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd2YWxpZGF0ZS1naXRodWItY29udHJpYnV0aW9uJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92YWxpZGF0ZS1naXRodWItY29udHJpYnV0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlIEdpdEh1YiBjb250cmlidXRpb25zIGZvciByZXdhcmRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnR2l0SHViIEFQSScsICdSZXBvc2l0b3J5IG1hbmFnZW1lbnQnLCAnSXNzdWUgdHJhY2tpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2dpdGh1YicsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgdmFsaWRhdGUgZ2l0aHViIGNvbnRyaWJ1dGlvbiBmb3IgdmFsaWRhdGUgZ2l0aHViIGNvbnRyaWJ1dGlvbnMgZm9yIHJld2FyZHMnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndmFsaWRhdGUtcG9wLWV2ZW50JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92YWxpZGF0ZS1wb3AtZXZlbnQnLFxuICAgIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgcHJvb2Ytb2YtcGFydGljaXBhdGlvbiBldmVudHMnLFxuICAgIGNhcGFiaWxpdGllczogWydNdWx0aS1zZXJ2aWNlIGludGVncmF0aW9uJywgJ0hlYWx0aCBtb25pdG9yaW5nJywgJ1N0YXR1cyByZXBvcnRpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgdmFsaWRhdGUgcG9wIGV2ZW50IGZvciB2YWxpZGF0ZSBwcm9vZi1vZi1wYXJ0aWNpcGF0aW9uIGV2ZW50cydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd2ZWN0b3JpemUtbWVtb3J5JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92ZWN0b3JpemUtbWVtb3J5JyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbnZlcnQgbWVtb3JpZXMgdG8gdmVjdG9yIGVtYmVkZGluZ3MnLFxuICAgIGNhcGFiaWxpdGllczogWydLbm93bGVkZ2Ugc3RvcmFnZScsICdTZW1hbnRpYyBzZWFyY2gnLCAnRW50aXR5IHJlbGF0aW9uc2hpcHMnXSxcbiAgICBjYXRlZ29yeTogJ2tub3dsZWRnZScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgdmVjdG9yaXplIG1lbW9yeSBmb3IgY29udmVydCBtZW1vcmllcyB0byB2ZWN0b3IgZW1iZWRkaW5ncydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdrbm93bGVkZ2UtbWFuYWdlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEva25vd2xlZGdlLW1hbmFnZXIvc3RvcmUnLFxuICAgIGRlc2NyaXB0aW9uOiAnTWFuYWdlcyB0aGUga25vd2xlZGdlIGJhc2UgYW5kIHZlY3RvciBlbWJlZGRpbmdzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVmVjdG9yaXplIHRleHQnLCAnS25vd2xlZGdlIHNlYXJjaCcsICdEYXRhIHJldHJpZXZhbCddLFxuICAgIGNhdGVnb3J5OiAna25vd2xlZGdlJyxcbiAgICBleGFtcGxlX3VzZTogJ1NlYXJjaCB0aGUga25vd2xlZGdlIGJhc2UgZm9yIHJlbGV2YW50IGluZm9ybWF0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ZlcmNlbC1haS1jaGF0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92ZXJjZWwtYWktY2hhdCcsXG4gICAgZGVzY3JpcHRpb246ICdBSSBjaGF0IHZpYSBWZXJjZWwgQUkgU0RLJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQUkgY2hhdCcsICdDb250ZXh0IGF3YXJlbmVzcycsICdOYXR1cmFsIGxhbmd1YWdlIHByb2Nlc3NpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2FpJyxcbiAgICBleGFtcGxlX3VzZTogJ1VzZSB2ZXJjZWwgYWkgY2hhdCBmb3IgYWkgY2hhdCB2aWEgdmVyY2VsIGFpIHNkaydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd2ZXJjZWwtYWktY2hhdC1zdHJlYW0nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3ZlcmNlbC1haS1jaGF0LXN0cmVhbScsXG4gICAgZGVzY3JpcHRpb246ICdTdHJlYW1pbmcgQUkgY2hhdCB2aWEgVmVyY2VsIEFJIFNESycsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0FJIGNoYXQnLCAnQ29udGV4dCBhd2FyZW5lc3MnLCAnTmF0dXJhbCBsYW5ndWFnZSBwcm9jZXNzaW5nJ10sXG4gICAgY2F0ZWdvcnk6ICdhaScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgdmVyY2VsIGFpIGNoYXQgc3RyZWFtIGZvciBzdHJlYW1pbmcgYWkgY2hhdCB2aWEgdmVyY2VsIGFpIHNkaydcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd2ZXJjZWwtZWNvc3lzdGVtLWFwaScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdmVyY2VsLWVjb3N5c3RlbS1hcGknLFxuICAgIGRlc2NyaXB0aW9uOiAnVmVyY2VsIG11bHRpLXNlcnZpY2UgbWFuYWdlbWVudCBmb3IgeG1ydC1pbywgeG1ydC1lY29zeXN0ZW0sIGFuZCB4bXJ0LWRhby1lY29zeXN0ZW0gZGVwbG95bWVudHMnLFxuICAgIGNhcGFiaWxpdGllczogWydEZXBsb3ltZW50IHRyYWNraW5nJywgJ011bHRpLXNlcnZpY2UgaGVhbHRoIG1vbml0b3JpbmcnLCAnU2VydmljZSBzdGF0dXMgYWdncmVnYXRpb24nLCAnRGVwbG95bWVudCBoaXN0b3J5J10sXG4gICAgY2F0ZWdvcnk6ICdkZXBsb3ltZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0NoZWNrIGhlYWx0aCBvZiBhbGwgVmVyY2VsIHNlcnZpY2VzLCBnZXQgZGVwbG95bWVudCBpbmZvLCBtb25pdG9yIHNlcnZpY2Ugc3RhdHVzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ZlcmNlbC1tYW5hZ2VyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92ZXJjZWwtbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICdNYW5hZ2UgVmVyY2VsIGRlcGxveW1lbnRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnRGVwbG95bWVudCBtYW5hZ2VtZW50JywgJ0FQSSBpbnRlZ3JhdGlvbicsICdTZXJ2aWNlIGNvbnRyb2wnXSxcbiAgICBjYXRlZ29yeTogJ2RlcGxveW1lbnQnLFxuICAgIGV4YW1wbGVfdXNlOiAnVXNlIHZlcmNlbCBtYW5hZ2VyIGZvciBtYW5hZ2UgdmVyY2VsIGRlcGxveW1lbnRzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ZlcnRleC1haS1jaGF0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92ZXJ0ZXgtYWktY2hhdCcsXG4gICAgZGVzY3JpcHRpb246ICfwn6SWIFZlcnRleCBBSSBDaGF0IC0gQ2hhdCB3aXRoIEdvb2dsZSBHZW1pbmkgUHJvL0ZsYXNoIG1vZGVscyB2aWEgVmVydGV4IEFJJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQUkgY2hhdCcsICdNdWx0aW1vZGFsIGlucHV0JywgJ0dlbWluaSBQcm8vRmxhc2gnLCAnRW50ZXJwcmlzZS1ncmFkZSddLFxuICAgIGNhdGVnb3J5OiAnYWknLFxuICAgIGV4YW1wbGVfdXNlOiAne1wibWVzc2FnZXNcIjpbe1wicm9sZVwiOlwidXNlclwiLFwiY29udGVudFwiOlwiSGVsbG9cIn1dLCBcIm1vZGVsXCI6XCJnZW1pbmktMS41LXByby1wcmV2aWV3LTA0MDlcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndmVydGV4LWFpLWltYWdlLWdlbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdmVydGV4LWFpLWltYWdlLWdlbicsXG4gICAgZGVzY3JpcHRpb246ICfwn5a877iPIFZlcnRleCBBSSBJbWFnZSBHZW4gLSBHZW5lcmF0ZSBoaWdoLXF1YWxpdHkgaW1hZ2VzIHVzaW5nIEltYWdlbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ0ltYWdlIGdlbmVyYXRpb24nLCAnVGV4dC10by1pbWFnZScsICdJbWFnZW4gMi8zJ10sXG4gICAgY2F0ZWdvcnk6ICdhaScsXG4gICAgZXhhbXBsZV91c2U6ICd7XCJwcm9tcHRcIjpcIkEgZnV0dXJpc3RpYyBjaXR5IHdpdGggZmx5aW5nIGNhcnNcIiwgXCJhc3BlY3RfcmF0aW9cIjpcIjE2OjlcIn0nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAndm90ZS1vbi1wcm9wb3NhbCcsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvdm90ZS1vbi1wcm9wb3NhbCcsXG4gICAgZGVzY3JpcHRpb246ICdDYXN0IHZvdGVzIG9uIGVkZ2UgZnVuY3Rpb24gYW5kIGdvdmVybmFuY2UgcHJvcG9zYWxzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVm90aW5nIHN5c3RlbScsICdQcm9wb3NhbCBldmFsdWF0aW9uJywgJ0RlY2lzaW9uIG1ha2luZyddLFxuICAgIGNhdGVnb3J5OiAnZ292ZXJuYW5jZScsXG4gICAgZXhhbXBsZV91c2U6ICdWb3RlIG9uIHByb3Bvc2FscywgZXZhbHVhdGUgZGVjaXNpb25zLCBwYXJ0aWNpcGF0ZSBpbiBnb3Zlcm5hbmNlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ZzY28td2ViaG9vay1oYW5kbGVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92c2NvLXdlYmhvb2staGFuZGxlcicsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB2c2NvLXdlYmhvb2staGFuZGxlcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3ZzY28gd2ViaG9vayBoYW5kbGVyJ10sXG4gICAgY2F0ZWdvcnk6ICd3ZWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHZzY28td2ViaG9vay1oYW5kbGVyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3ZzY28td29ya3NwYWNlJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS92c2NvLXdvcmtzcGFjZScsXG4gICAgZGVzY3JpcHRpb246ICfwn5O4IFZTQ08gV29ya3NwYWNlIENNUyAtIEZ1bGwgc3R1ZGlvIG1hbmFnZW1lbnQ6IGNvbnRhY3RzLCBqb2JzLCBldmVudHMsIHF1b3RlcywgcHJvZHVjdHMsIHdvcmtzaGVldHMsIG5vdGVzLCBpbnZvaWNlcywgYW5kIGNhbGVuZGFyIGludGVncmF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnQ29udGFjdCBtYW5hZ2VtZW50JywgJ0pvYiBtYW5hZ2VtZW50JywgJ0V2ZW50IHNjaGVkdWxpbmcnLCAnUHJvZHVjdCBwcmljaW5nJywgJ1F1b3RlIGNyZWF0aW9uJywgJ1dvcmtzaGVldHMvdGVtcGxhdGVzJywgJ05vdGVzJywgJ0ludm9pY2UgbWFuYWdlbWVudCcsICdDYWxlbmRhciBpbnRlZ3JhdGlvbicsICdQaXBlbGluZSBhbmFseXRpY3MnXSxcbiAgICBjYXRlZ29yeTogJ3ZzY28nLFxuICAgIGV4YW1wbGVfdXNlOiAne1wiYWN0aW9uXCI6XCJjcmVhdGVfY29udGFjdFwiLFwiZGF0YVwiOntcImZpcnN0TmFtZVwiOlwiSm9oblwiLFwibGFzdE5hbWVcIjpcIkRvZVwiLFwiZW1haWxcIjpcImpvaG5AZXhhbXBsZS5jb21cIn19J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3dhbi1haS1jaGF0JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS93YW4tYWktY2hhdCcsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB3YW4tYWktY2hhdCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3dhbiBhaSBjaGF0J10sXG4gICAgY2F0ZWdvcnk6ICdhaScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2Ugd2FuLWFpLWNoYXQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnd2ViMy1kYXBwLWZhY3RvcnknLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3dlYjMtZGFwcC1mYWN0b3J5JyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiB3ZWIzIGRhcHAgZmFjdG9yeScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ3dlYjMgZGFwcCBmYWN0b3J5J10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCB3ZWIzLWRhcHAtZmFjdG9yeSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd3ZWJob29rLWVuZHBvaW50cycsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvd2ViaG9vay1lbmRwb2ludHMnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IHdlYmhvb2sgZW5kcG9pbnRzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAnd2ViaG9vayBlbmRwb2ludHMnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHdlYmhvb2stZW5kcG9pbnRzJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3dlZWtseS1yZXRyb3NwZWN0aXZlLXBvc3QnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3dlZWtseS1yZXRyb3NwZWN0aXZlLXBvc3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgYW5kIHBvc3Qgd2Vla2x5IHJldHJvc3BlY3RpdmUnLFxuICAgIGNhcGFiaWxpdGllczogWydBdXRvbWF0ZWQgcG9zdGluZycsICdDb250ZW50IGdlbmVyYXRpb24nLCAnU2NoZWR1bGluZyddLFxuICAgIGNhdGVnb3J5OiAnYXV0b25vbW91cycsXG4gICAgZXhhbXBsZV91c2U6ICdVc2Ugd2Vla2x5IHJldHJvc3BlY3RpdmUgcG9zdCBmb3IgZ2VuZXJhdGUgYW5kIHBvc3Qgd2Vla2x5IHJldHJvc3BlY3RpdmUnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnd29ya2VyLXJlZ2lzdHJhdGlvbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvd29ya2VyLXJlZ2lzdHJhdGlvbicsXG4gICAgZGVzY3JpcHRpb246ICdBdXRvLWRldGVjdGVkIGZ1bmN0aW9uOiB3b3JrZXItcmVnaXN0cmF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnd29ya2VyIHJlZ2lzdHJhdGlvbiddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSB3b3JrZXItcmVnaXN0cmF0aW9uJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3dvcmtmbG93LW9wdGltaXplcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvd29ya2Zsb3ctb3B0aW1pemVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IHdvcmtmbG93LW9wdGltaXplcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3dvcmtmbG93IG9wdGltaXplciddLFxuICAgIGNhdGVnb3J5OiAndGFzay1tYW5hZ2VtZW50JyxcbiAgICBleGFtcGxlX3VzZTogJ0ludm9rZSB3b3JrZmxvdy1vcHRpbWl6ZXInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnd29ya2Zsb3ctdGVtcGxhdGUtbWFuYWdlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEvd29ya2Zsb3ctdGVtcGxhdGUtbWFuYWdlcicsXG4gICAgZGVzY3JpcHRpb246ICfwn5SEIFdPUktGTE9XIEFVVE9NQVRJT04gLSBQcmUtYnVpbHQgd29ya2Zsb3cgdGVtcGxhdGVzIGZvciByZXZlbnVlIGdlbmVyYXRpb24sIG1hcmtldGluZyBhdXRvbWF0aW9uLCBmaW5hbmNpYWwgbWFuYWdlbWVudCwgYW5kIHNlbGYtb3B0aW1pemF0aW9uJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnVGVtcGxhdGUgbGlicmFyeSAoOSBwcmUtYnVpbHQgd29ya2Zsb3dzKScsICdXb3JrZmxvdyBleGVjdXRpb24nLCAnUGVyZm9ybWFuY2UgdHJhY2tpbmcnLCAnVGVtcGxhdGUgY3JlYXRpb24nLCAnU3VjY2VzcyByYXRlIGFuYWx5dGljcycsICdNdWx0aS1zdGVwIG9yY2hlc3RyYXRpb24nLCAnUmV2ZW51ZSB3b3JrZmxvd3MnLCAnTWFya2V0aW5nIHdvcmtmbG93cycsICdGaW5hbmNpYWwgd29ya2Zsb3dzJ10sXG4gICAgY2F0ZWdvcnk6ICdhdXRvbWF0aW9uJyxcbiAgICBleGFtcGxlX3VzZTogJ0V4ZWN1dGUgdGVtcGxhdGU6IHtcImFjdGlvblwiOlwiZXhlY3V0ZV90ZW1wbGF0ZVwiLFwiZGF0YVwiOntcInRlbXBsYXRlX25hbWVcIjpcImFjcXVpcmVfbmV3X2N1c3RvbWVyXCIsXCJwYXJhbXNcIjp7XCJlbWFpbFwiOlwibmV3QGN1c3RvbWVyLmNvbVwiLFwidGllclwiOlwiYmFzaWNcIixcInNlcnZpY2VfbmFtZVwiOlwidXNwdG8tcGF0ZW50LW1jcFwifX19LiBMaXN0IHRlbXBsYXRlczoge1wiYWN0aW9uXCI6XCJsaXN0X3RlbXBsYXRlc1wiLFwiZGF0YVwiOntcImNhdGVnb3J5XCI6XCJyZXZlbnVlXCJ9fSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4LXR3aXR0ZXItbW9uaXRvcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEveC10d2l0dGVyLW1vbml0b3InLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogeC10d2l0dGVyLW1vbml0b3InLFxuICAgIGNhcGFiaWxpdGllczogWyd4IHR3aXR0ZXIgbW9uaXRvciddLFxuICAgIGNhdGVnb3J5OiAnbW9uaXRvcmluZycsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgeC10d2l0dGVyLW1vbml0b3InXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAneG1yaWctZGlyZWN0LXByb3h5JyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS94bXJpZy1kaXJlY3QtcHJveHknLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogeG1yaWctZGlyZWN0LXByb3h5JyxcbiAgICBjYXBhYmlsaXRpZXM6IFsneG1yaWcgZGlyZWN0IHByb3h5J10sXG4gICAgY2F0ZWdvcnk6ICdnaXRodWInLFxuICAgIGV4YW1wbGVfdXNlOiAnSW52b2tlIHhtcmlnLWRpcmVjdC1wcm94eSdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4bXJ0X2ludGVncmF0aW9uJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS94bXJ0X2ludGVncmF0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ1VuaWZpZWQgZWNvc3lzdGVtIGhlYWx0aCAmIGludGVncmF0aW9uIGh1YiAtIGNvbm5lY3RzIGFsbCBYTVJUIHJlcG9zIChYTVJULUVjb3N5c3RlbSwgeG1ydC13YWxsZXQtcHVibGljLCBtb2JpbGVtb25lcm8sIHhtcnRuZXQsIHhtcnRkYW8pIGZvciBjb21wcmVoZW5zaXZlIGhlYWx0aCByZXBvcnRzIGFuZCBpbnRlZ3JhdGlvbiBtb25pdG9yaW5nJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsnTXVsdGktcmVwb3NpdG9yeSBoZWFsdGggbW9uaXRvcmluZycsICdDcm9zcy1yZXBvIGludGVncmF0aW9uIHZlcmlmaWNhdGlvbicsICdEZXBsb3ltZW50IHN0YXR1cyAoVmVyY2VsJywgJ1JlbmRlcicsICdTdXBhYmFzZSknLCAnQVBJIGhlYWx0aCBjaGVja3MgKG1pbmluZycsICdmYXVjZXQnLCAnZWRnZSBmdW5jdGlvbnMpJywgJ0RhdGFiYXNlIHBlcmZvcm1hbmNlIG1ldHJpY3MnLCAnQ29tbXVuaXR5IGVuZ2FnZW1lbnQgYW5hbHl0aWNzJywgJ0NvbXByZWhlbnNpdmUgbWFya2Rvd24gcmVwb3J0cycsICdSZXBvc2l0b3J5IGNvbXBhcmlzb24nLCAnSW50ZWdyYXRpb24gZGVidWdnaW5nJywgJ0Vjb3N5c3RlbS13aWRlIHN0YXR1cyBvdmVydmlldyddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0dlbmVyYXRlIGNvbXByZWhlbnNpdmUgZWNvc3lzdGVtIGhlYWx0aCByZXBvcnQgY292ZXJpbmcgYWxsIHJlcG9zLCBkZXBsb3ltZW50cywgQVBJcywgYW5kIGNvbW11bml0eSBlbmdhZ2VtZW50LiBDaGVjayBpbnRlZ3JhdGlvbiBiZXR3ZWVuIHNlcnZpY2VzLiBDb21wYXJlIHJlcG9zaXRvcnkgYWN0aXZpdHkuJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3htcnQtYnJpZGdlJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS94bXJ0LWJyaWRnZScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogeG1ydCBicmlkZ2UnLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICd4bXJ0IGJyaWRnZSddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggeG1ydC1icmlkZ2UnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAneG1ydC1jb29yZGluYXRpb24tY29yZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEveG1ydC1jb29yZGluYXRpb24tY29yZScsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogeG1ydCBjb29yZGluYXRpb24gY29yZScsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ3htcnQgY29vcmRpbmF0aW9uIGNvcmUnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHhtcnQtY29vcmRpbmF0aW9uLWNvcmUnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAneG1ydC1lY29zeXN0ZW0tZGFzaGJvYXJkJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS94bXJ0LWVjb3N5c3RlbS1kYXNoYm9hcmQnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IHhtcnQgZWNvc3lzdGVtIGRhc2hib2FyZCcsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ3htcnQgZWNvc3lzdGVtIGRhc2hib2FyZCddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggeG1ydC1lY29zeXN0ZW0tZGFzaGJvYXJkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3htcnQtaW50ZWdyYXRpb24nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtaW50ZWdyYXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnQXV0by1kZXRlY3RlZCBmdW5jdGlvbjogeG1ydC1pbnRlZ3JhdGlvbicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3htcnQgaW50ZWdyYXRpb24nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgeG1ydC1pbnRlZ3JhdGlvbidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4bXJ0LWludGVncmF0aW9uLWJyaWRnZScsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEveG1ydC1pbnRlZ3JhdGlvbi1icmlkZ2UnLFxuICAgIGRlc2NyaXB0aW9uOiAnWE1SVCBFY29zeXN0ZW06IHhtcnQgaW50ZWdyYXRpb24gYnJpZGdlJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAneG1ydCBpbnRlZ3JhdGlvbiBicmlkZ2UnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHhtcnQtaW50ZWdyYXRpb24tYnJpZGdlJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3htcnQtbWNwLXNlcnZlcicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEveG1ydC1tY3Atc2VydmVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgTW9kZWwgQ29udGV4dCBQcm90b2NvbCBzZXJ2ZXInLFxuICAgIGNhcGFiaWxpdGllczogWydNdWx0aS1zZXJ2aWNlIGludGVncmF0aW9uJywgJ0hlYWx0aCBtb25pdG9yaW5nJywgJ1N0YXR1cyByZXBvcnRpbmcnXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdVc2UgeG1ydCBtY3Agc2VydmVyIGZvciB4bXJ0IG1vZGVsIGNvbnRleHQgcHJvdG9jb2wgc2VydmVyJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ3htcnQtbWluZS1ndWFyZGlhbicsXG4gICAgdXJsOiAnaHR0cHM6Ly92YXdvdXVndHp3bWVqeHFrZXFxai5zdXBhYmFzZS5jby9mdW5jdGlvbnMvdjEveG1ydC1taW5lLWd1YXJkaWFuJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiB4bXJ0IG1pbmUgZ3VhcmRpYW4nLFxuICAgIGNhcGFiaWxpdGllczogWydweXRob24gc2VydmljZScsICd4bXJ0IG1pbmUgZ3VhcmRpYW4nXSxcbiAgICBjYXRlZ29yeTogJ2Vjb3N5c3RlbScsXG4gICAgZXhhbXBsZV91c2U6ICdJbnRlcmFjdCB3aXRoIHhtcnQtbWluZS1ndWFyZGlhbidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4bXJ0LW1pbmluZy1vcHRpbWl6ZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtbWluaW5nLW9wdGltaXplcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogeG1ydCBtaW5pbmcgb3B0aW1pemVyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAneG1ydCBtaW5pbmcgb3B0aW1pemVyJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCB4bXJ0LW1pbmluZy1vcHRpbWl6ZXInXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAneG1ydC1tb2JpbGUtbWluZXInLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtbW9iaWxlLW1pbmVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiB4bXJ0IG1vYmlsZSBtaW5lcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ3htcnQgbW9iaWxlIG1pbmVyJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCB4bXJ0LW1vYmlsZS1taW5lcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4bXJ0LW1vYmlsZS1taW5pbmctb3B0aW1pemVyJyxcbiAgICB1cmw6ICdodHRwczovL3Zhd291dWd0endtZWp4cWtlcXFqLnN1cGFiYXNlLmNvL2Z1bmN0aW9ucy92MS94bXJ0LW1vYmlsZS1taW5pbmctb3B0aW1pemVyJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiB4bXJ0IG1vYmlsZSBtaW5pbmcgb3B0aW1pemVyJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAneG1ydCBtb2JpbGUgbWluaW5nIG9wdGltaXplciddLFxuICAgIGNhdGVnb3J5OiAnZWNvc3lzdGVtJyxcbiAgICBleGFtcGxlX3VzZTogJ0ludGVyYWN0IHdpdGggeG1ydC1tb2JpbGUtbWluaW5nLW9wdGltaXplcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4bXJ0LW1vbml0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtbW9uaXRvcicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogeG1ydCBtb25pdG9yJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAneG1ydCBtb25pdG9yJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCB4bXJ0LW1vbml0b3InXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAneG1ydC1yZXBvc2l0b3J5LW1vbml0b3InLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtcmVwb3NpdG9yeS1tb25pdG9yJyxcbiAgICBkZXNjcmlwdGlvbjogJ1hNUlQgRWNvc3lzdGVtOiB4bXJ0IHJlcG9zaXRvcnkgbW9uaXRvcicsXG4gICAgY2FwYWJpbGl0aWVzOiBbJ3B5dGhvbiBzZXJ2aWNlJywgJ3htcnQgcmVwb3NpdG9yeSBtb25pdG9yJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCB4bXJ0LXJlcG9zaXRvcnktbW9uaXRvcidcbiAgfSxcbiAge1xuICAgIG5hbWU6ICd4bXJ0LXNsYWNrLW1haW4nLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtc2xhY2stbWFpbicsXG4gICAgZGVzY3JpcHRpb246ICdYTVJUIEVjb3N5c3RlbTogeG1ydCBzbGFjayBtYWluJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsncHl0aG9uIHNlcnZpY2UnLCAneG1ydCBzbGFjayBtYWluJ10sXG4gICAgY2F0ZWdvcnk6ICdlY29zeXN0ZW0nLFxuICAgIGV4YW1wbGVfdXNlOiAnSW50ZXJhY3Qgd2l0aCB4bXJ0LXNsYWNrLW1haW4nXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAneG1ydC13b3JrZmxvdy10ZW1wbGF0ZXMnLFxuICAgIHVybDogJ2h0dHBzOi8vdmF3b3V1Z3R6d21lanhxa2VxcWouc3VwYWJhc2UuY28vZnVuY3Rpb25zL3YxL3htcnQtd29ya2Zsb3ctdGVtcGxhdGVzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0F1dG8tZGV0ZWN0ZWQgZnVuY3Rpb246IHhtcnQtd29ya2Zsb3ctdGVtcGxhdGVzJyxcbiAgICBjYXBhYmlsaXRpZXM6IFsneG1ydCB3b3JrZmxvdyB0ZW1wbGF0ZXMnXSxcbiAgICBjYXRlZ29yeTogJ3Rhc2stbWFuYWdlbWVudCcsXG4gICAgZXhhbXBsZV91c2U6ICdJbnZva2UgeG1ydC13b3JrZmxvdy10ZW1wbGF0ZXMnXG4gIH0sXG5dO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHlEQUF5RDtBQUN6RCx5REFBeUQ7QUFDekQsNENBQTRDO0FBQzVDLHFGQUFxRjtBQTBCckYsT0FBTyxNQUFNLDBCQUFvRDtFQUMvRDtJQUNFLE1BQU07SUFDTixLQUFLO0lBQ0wsYUFBYTtJQUNiLGNBQWM7TUFBQztNQUFrQjtLQUF1QjtJQUN4RCxVQUFVO0lBQ1YsYUFBYTtFQUNmO0VBQ0E7SUFDRSxNQUFNO0lBQ04sS0FBSztJQUNMLGFBQWE7SUFDYixjQUFjO01BQUM7TUFBa0I7S0FBNEI7SUFDN0QsVUFBVTtJQUNWLGFBQWE7RUFDZjtFQUNBO0lBQ0UsTUFBTTtJQUNOLEtBQUs7SUFDTCxhQUFhO0lBQ2IsY0FBYztNQUFDO01BQWtCO01BQXFCO01BQW9CO0tBQWdCO0lBQzFGLFVB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
// denoCacheMetadata=2363179265188460834,9158586868143711975
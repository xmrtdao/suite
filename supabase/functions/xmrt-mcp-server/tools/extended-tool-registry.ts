/**
 * Extended Tool Registry for XMRT MCP Server
 *
 * Contains ALL additional edge functions from suite/supabase/functions/
 * that are not in the core tool-registry.ts
 *
 * This module exports EXTENDED_TOOLS which is merged with TOOL_REGISTRY
 * in the main MCP server index.ts.
 */

export const EXTENDED_TOOLS = [
  // ─── AI Chat ───
  {
    name: "ai-chat",
    description: "Chat with the default AI model",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        model: { type: "string", description: "Model identifier" },
        max_tokens: { type: "number", description: "Max tokens" },
        system_prompt: { type: "string", description: "System prompt" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "coo-chat",
    description: "Chat with the COO executive AI",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        context: { type: "object", description: "Conversation context" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "kimi-chat",
    description: "Chat with Kimi AI model",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        model: { type: "string", description: "Model identifier" },
        max_tokens: { type: "number", description: "Max tokens" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "lovable-chat",
    description: "Chat with Lovable AI assistant",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        context: { type: "object", description: "Conversation context" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "openai-chat",
    description: "Chat with OpenAI GPT models",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        model: { type: "string", description: "Model identifier" },
        max_tokens: { type: "number", description: "Max tokens" },
        temperature: { type: "number", description: "Temperature" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "openai-tts",
    description: "Text-to-speech using OpenAI",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to synthesize" },
        voice: { type: "string", description: "Voice to use" },
        model: { type: "string", description: "TTS model" }
      },
      required: ["text"]
    }
  },
  {
    name: "vercel-ai-chat",
    description: "Chat via Vercel AI SDK",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        model: { type: "string", description: "Model identifier" },
        stream: { type: "boolean", description: "Stream response" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "vercel-ai-chat-stream",
    description: "Streaming chat via Vercel AI SDK",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        model: { type: "string", description: "Model identifier" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "vertex-ai-chat",
    description: "Chat with Google Vertex AI",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        model: { type: "string", description: "Model identifier" },
        max_tokens: { type: "number", description: "Max tokens" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "vertex-ai-image-gen",
    description: "Generate images with Vertex AI",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Image prompt" },
        model: { type: "string", description: "Model identifier" },
        size: { type: "string", description: "Image dimensions" }
      },
      required: ["prompt"]
    }
  },

  // ─── AI Orchestration ───
  {
    name: "agent-deployment-coordinator",
    description: "Coordinate agent deployment across nodes",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent identifier" },
        target_nodes: { type: "array", items: { type: "string" }, description: "Target node IDs" },
        config: { type: "object", description: "Deployment configuration" }
      },
      required: ["agent_id"]
    }
  },
  {
    name: "agent-manager",
    description: "Manage AI agent lifecycle and configuration",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        agent_id: { type: "string", description: "Agent identifier" },
        config: { type: "object", description: "Agent configuration" }
      },
      required: ["action"]
    }
  },
  {
    name: "agent-work-executor",
    description: "Execute work assigned to an agent",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent identifier" },
        work_id: { type: "string", description: "Work item ID" },
        payload: { type: "object", description: "Work payload" }
      },
      required: ["agent_id", "work_id"]
    }
  },
  {
    name: "cleanup-duplicate-tasks",
    description: "Remove duplicate or stale tasks",
    inputSchema: {
      type: "object",
      properties: {
        task_ids: { type: "array", items: { type: "string" }, description: "Task IDs to clean" },
        dry_run: { type: "boolean", description: "Preview only" }
      },
      required: ["task_ids"]
    }
  },
  {
    name: "diagnose-workflow-failure",
    description: "Analyze and report workflow failure reasons",
    inputSchema: {
      type: "object",
      properties: {
        workflow_id: { type: "string", description: "Workflow ID" },
        error_log: { type: "string", description: "Error log content" }
      },
      required: ["workflow_id"]
    }
  },
  {
    name: "eliza-intelligence-coordinator",
    description: "Coordinate Eliza AI intelligence operations",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Query to process" },
        context: { type: "object", description: "Operation context" }
      },
      required: ["query"]
    }
  },
  {
    name: "execute-approved-proposal",
    description: "Execute an approved governance proposal",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        executor: { type: "string", description: "Executing agent ID" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "execute-scheduled-actions",
    description: "Run scheduled or delayed actions",
    inputSchema: {
      type: "object",
      properties: {
        action_ids: { type: "array", items: { type: "string" }, description: "Action IDs to execute" },
        force: { type: "boolean", description: "Force execution" }
      },
      required: ["action_ids"]
    }
  },
  {
    name: "gemini-agent-creator",
    description: "Create a new AI agent using Gemini",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Agent name" },
        role: { type: "string", description: "Agent role" },
        instructions: { type: "string", description: "Agent instructions" }
      },
      required: ["name", "role"]
    }
  },
  {
    name: "governance-phase-manager",
    description: "Manage governance proposal phases",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        phase: { type: "string", description: "Phase to set" }
      },
      required: ["proposal_id", "phase"]
    }
  },
  {
    name: "inbox-notify",
    description: "Send notification to user inbox",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        message: { type: "string", description: "Notification message" },
        type: { type: "string", description: "Notification type" }
      },
      required: ["user_id", "message"]
    }
  },
  {
    name: "memory-consolidator",
    description: "Consolidate and optimize agent memory",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        lookback_days: { type: "number", description: "Days to look back" }
      },
      required: ["agent_id"]
    }
  },
  {
    name: "multi-step-orchestrator",
    description: "Orchestrate complex multi-step workflows",
    inputSchema: {
      type: "object",
      properties: {
        workflow_id: { type: "string", description: "Workflow ID" },
        steps: { type: "array", items: { type: "object" }, description: "Workflow steps" },
        context: { type: "object", description: "Execution context" }
      },
      required: ["workflow_id"]
    }
  },
  {
    name: "react-agent",
    description: "React-based interactive agent interface",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "User prompt" },
        context: { type: "object", description: "Conversation context" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "schedule-reminder",
    description: "Create a scheduled reminder notification",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        message: { type: "string", description: "Reminder message" },
        scheduled_at: { type: "string", description: "ISO scheduled time" },
        channel: { type: "string", description: "Notification channel" }
      },
      required: ["user_id", "message", "scheduled_at"]
    }
  },
  {
    name: "supervisor-state-manager",
    description: "Manage supervisor agent state machine",
    inputSchema: {
      type: "object",
      properties: {
        supervisor_id: { type: "string", description: "Supervisor ID" },
        state: { type: "string", description: "State to transition to" },
        data: { type: "object", description: "State data" }
      },
      required: ["supervisor_id", "state"]
    }
  },
  {
    name: "task-orchestrator",
    description: "Orchestrate distributed task execution",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Task ID" },
        operations: { type: "array", items: { type: "object" }, description: "Operations to run" },
        priority: { type: "number", description: "Priority 1-10" }
      },
      required: ["task_id"]
    }
  },
  {
    name: "toggle-cron-jobs",
    description: "Enable or disable scheduled cron jobs",
    inputSchema: {
      type: "object",
      properties: {
        job_names: { type: "array", items: { type: "string" }, description: "Job names" },
        enable: { type: "boolean", description: "Enable or disable" }
      },
      required: ["job_names", "enable"]
    }
  },
  {
    name: "workflow-optimizer",
    description: "Analyze and optimize workflow efficiency",
    inputSchema: {
      type: "object",
      properties: {
        workflow_id: { type: "string", description: "Workflow ID" },
        metrics: { type: "object", description: "Current metrics" }
      },
      required: ["workflow_id"]
    }
  },

  // ─── Blockchain ───
  {
    name: "hume-access-token",
    description: "Manage Hume blockchain access tokens",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        token_id: { type: "string", description: "Token ID" }
      },
      required: ["action"]
    }
  },
  {
    name: "python-db-bridge",
    description: "Bridge between Python services and database",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        table: { type: "string", description: "Target table" },
        data: { type: "object", description: "Data payload" }
      },
      required: ["action"]
    }
  },
  {
    name: "update-payout-wallet",
    description: "Update mining payout wallet address",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        wallet_address: { type: "string", description: "New wallet address" }
      },
      required: ["worker_id", "wallet_address"]
    }
  },

  // ─── Mining ───
  {
    name: "mining-proxy",
    description: "Proxy mining work to/from pool",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        pool_url: { type: "string", description: "Pool URL" },
        worker_id: { type: "string", description: "Worker ID" }
      },
      required: ["action"]
    }
  },
  {
    name: "playwright-browse",
    description: "Headless browser automation for web tasks",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Target URL" },
        action: { type: "string", description: "Browser action" },
        selector: { type: "string", description: "CSS selector" }
      },
      required: ["url", "action"]
    }
  },
  {
    name: "supportxmr-proxy",
    description: "Proxy for SupportXMR mining pool",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        worker_id: { type: "string", description: "Worker ID" },
        stats: { type: "boolean", description: "Get statistics" }
      },
      required: ["action"]
    }
  },
  {
    name: "worker-registration",
    description: "Register a new mining worker",
    inputSchema: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Device ID" },
        wallet_address: { type: "string", description: "Wallet address" },
        nickname: { type: "string", description: "Worker nickname" }
      },
      required: ["device_id", "wallet_address"]
    }
  },
  {
    name: "xmrig-direct-proxy",
    description: "Direct proxy to XMRig mining daemon",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        config: { type: "object", description: "XMRig configuration" }
      },
      required: ["action"]
    }
  },
  {
    name: "xmrt-integration",
    description: "Integrate with XMRT ecosystem services",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        service: { type: "string", description: "Target service" },
        payload: { type: "object", description: "Request payload" }
      },
      required: ["action", "service"]
    }
  },
  {
    name: "xmrt_integration",
    description: "Secondary XMRT integration endpoint",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        service: { type: "string", description: "Target service" },
        payload: { type: "object", description: "Request payload" }
      },
      required: ["action", "service"]
    }
  },

  // ─── Notifications ───
  {
    name: "broadcast-state-change",
    description: "Broadcast system state changes to subscribers",
    inputSchema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Broadcast channel" },
        state: { type: "object", description: "State data" },
        recipients: { type: "array", items: { type: "string" }, description: "Recipient IDs" }
      },
      required: ["channel", "state"]
    }
  },

  // ─── Web / API ───
  {
    name: "api-key-health-monitor",
    description: "Monitor health of configured API keys",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "API provider" },
        alert_threshold: { type: "number", description: "Alert threshold" }
      },
      required: ["provider"]
    }
  },
  {
    name: "fetch-auto-fix-results",
    description: "Fetch results from automated fix operations",
    inputSchema: {
      type: "object",
      properties: {
        fix_id: { type: "string", description: "Fix operation ID" },
        include_logs: { type: "boolean", description: "Include logs" }
      },
      required: ["fix_id"]
    }
  },
  {
    name: "render-api",
    description: "Access Render.com deployment API",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        service_id: { type: "string", description: "Service ID" },
        payload: { type: "object", description: "Request payload" }
      },
      required: ["action"]
    }
  },
  {
    name: "request-executive-votes",
    description: "Request votes from AI executive team",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        executive_ids: { type: "array", items: { type: "string" }, description: "Executive IDs" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "stripe-payment-webhook",
    description: "Handle Stripe payment webhooks",
    inputSchema: {
      type: "object",
      properties: {
        event_type: { type: "string", description: "Stripe event type" },
        payload: { type: "object", description: "Webhook payload" }
      },
      required: ["event_type", "payload"]
    }
  },
  {
    name: "update-api-key",
    description: "Rotate or update an API key",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "API provider" },
        new_key: { type: "string", description: "New API key" },
        notify: { type: "boolean", description: "Notify team" }
      },
      required: ["provider", "new_key"]
    }
  },
  {
    name: "vercel-ecosystem-api",
    description: "Vercel ecosystem deployment API",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        project: { type: "string", description: "Project name" },
        config: { type: "object", description: "Deployment config" }
      },
      required: ["action"]
    }
  },
  {
    name: "vsco-webhook-handler",
    description: "Handle VSCO social media webhooks",
    inputSchema: {
      type: "object",
      properties: {
        event: { type: "string", description: "Event type" },
        payload: { type: "object", description: "Webhook payload" }
      },
      required: ["event", "payload"]
    }
  },

  // ─── Governance ───
  {
    name: "handle-rejected-proposal",
    description: "Process a rejected governance proposal",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        reason: { type: "string", description: "Rejection reason" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "list-function-proposals",
    description: "List all pending function proposals",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        limit: { type: "number", description: "Max results" },
        offset: { type: "number", description: "Pagination offset" }
      },
      required: []
    }
  },

  // ─── Dashboard ───
  {
    name: "prometheus-metrics",
    description: "Expose metrics in Prometheus format",
    inputSchema: {
      type: "object",
      properties: {
        metric_names: { type: "array", items: { type: "string" }, description: "Metric names" },
        format: { type: "string", description: "Output format" }
      },
      required: []
    }
  },
  {
    name: "sync-dashboard-data",
    description: "Synchronize dashboard data sources",
    inputSchema: {
      type: "object",
      properties: {
        sources: { type: "array", items: { type: "string" }, description: "Data sources" },
        force: { type: "boolean", description: "Force sync" }
      },
      required: ["sources"]
    }
  },

  // ─── Analytics ───
  {
    name: "auth-health-monitor",
    description: "Monitor authentication system health",
    inputSchema: {
      type: "object",
      properties: {
        check_providers: { type: "array", items: { type: "string" }, description: "Providers to check" },
        timeout: { type: "number", description: "Check timeout" }
      },
      required: []
    }
  },
  {
    name: "check-frontend-health",
    description: "Check frontend application health",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Frontend URL" },
        checks: { type: "array", items: { type: "string" }, description: "Health checks" }
      },
      required: ["url"]
    }
  },
  {
    name: "code-monitor-daemon",
    description: "Daemon for monitoring code changes",
    inputSchema: {
      type: "object",
      properties: {
        repository: { type: "string", description: "Repository name" },
        branch: { type: "string", description: "Branch to monitor" },
        interval: { type: "number", description: "Check interval seconds" }
      },
      required: ["repository", "branch"]
    }
  },
  {
    name: "debug-analytics-data-flow",
    description: "Debug analytics data pipeline",
    inputSchema: {
      type: "object",
      properties: {
        pipeline_id: { type: "string", description: "Pipeline ID" },
        trace: { type: "boolean", description: "Enable tracing" }
      },
      required: ["pipeline_id"]
    }
  },
  {
    name: "ecosystem-health-check",
    description: "Full ecosystem health diagnostics",
    inputSchema: {
      type: "object",
      properties: {
        components: { type: "array", items: { type: "string" }, description: "Components to check" },
        detailed: { type: "boolean", description: "Detailed output" }
      },
      required: []
    }
  },
  {
    name: "ecosystem-monitor",
    description: "Continuous ecosystem monitoring",
    inputSchema: {
      type: "object",
      properties: {
        interval: { type: "number", description: "Check interval seconds" },
        alerts: { type: "boolean", description: "Enable alerts" }
      },
      required: []
    }
  },
  {
    name: "function-usage-analytics",
    description: "Track edge function usage metrics",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Function name" },
        timeframe: { type: "string", description: "Time range" },
        granularity: { type: "string", description: "Data granularity" }
      },
      required: ["function_name"]
    }
  },
  {
    name: "get-edge-function-logs",
    description: "Retrieve edge function execution logs",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Function name" },
        start_time: { type: "string", description: "Start time ISO" },
        end_time: { type: "string", description: "End time ISO" },
        limit: { type: "number", description: "Max log lines" }
      },
      required: ["function_name"]
    }
  },
  {
    name: "get-function-version-analytics",
    description: "Analyze function version adoption",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Function name" },
        versions: { type: "array", items: { type: "string" }, description: "Versions to compare" }
      },
      required: ["function_name"]
    }
  },
  {
    name: "log-payload-function",
    description: "Log and analyze function payloads",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Function name" },
        payload: { type: "object", description: "Payload to log" },
        level: { type: "string", description: "Log level" }
      },
      required: ["function_name", "payload"]
    }
  },

  // ─── Automation ───
  {
    name: "get-cron-registry",
    description: "Get all registered cron jobs",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter jobs" },
        include_disabled: { type: "boolean", description: "Include disabled" }
      },
      required: []
    }
  },
  {
    name: "process-contributor-reward",
    description: "Process contributor reward payouts",
    inputSchema: {
      type: "object",
      properties: {
        contributor_id: { type: "string", description: "Contributor ID" },
        amount: { type: "number", description: "Reward amount" },
        currency: { type: "string", description: "Currency code" }
      },
      required: ["contributor_id", "amount"]
    }
  },
  {
    name: "process-license-application",
    description: "Process software license applications",
    inputSchema: {
      type: "object",
      properties: {
        applicant: { type: "string", description: "Applicant ID" },
        license_type: { type: "string", description: "License type" },
        project: { type: "string", description: "Project name" }
      },
      required: ["applicant", "license_type"]
    }
  },
  {
    name: "video-job-processor",
    description: "Process video encoding/transcoding jobs",
    inputSchema: {
      type: "object",
      properties: {
        job_id: { type: "string", description: "Job ID" },
        action: { type: "string", description: "Action to perform" },
        settings: { type: "object", description: "Processing settings" }
      },
      required: ["job_id", "action"]
    }
  },

  // ─── Device ───
  {
    name: "mobile-miner-config",
    description: "Configure mobile mining settings",
    inputSchema: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Device ID" },
        pool_url: { type: "string", description: "Pool URL" },
        threads: { type: "number", description: "Thread count" },
        intensity: { type: "number", description: "Mining intensity" }
      },
      required: ["device_id"]
    }
  },
  {
    name: "mobile-miner-register",
    description: "Register a mobile mining device",
    inputSchema: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Device ID" },
        wallet_address: { type: "string", description: "Wallet address" },
        device_model: { type: "string", description: "Device model" }
      },
      required: ["device_id", "wallet_address"]
    }
  },
  {
    name: "mobile-miner-script",
    description: "Generate mobile mining setup script",
    inputSchema: {
      type: "object",
      properties: {
        device_type: { type: "string", description: "Device type" },
        pool_url: { type: "string", description: "Pool URL" },
        wallet_address: { type: "string", description: "Wallet address" }
      },
      required: ["device_type"]
    }
  },

  // ─── Network ───
  {
    name: "eliza-relay",
    description: "Relay messages through Eliza network",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message content" },
        target: { type: "string", description: "Target node" },
        priority: { type: "number", description: "Priority 1-10" }
      },
      required: ["message", "target"]
    }
  },
  {
    name: "openclaw-relay",
    description: "Relay messages through OpenClaw network",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message content" },
        target: { type: "string", description: "Target node" },
        protocol: { type: "string", description: "Protocol to use" }
      },
      required: ["message", "target"]
    }
  },
  {
    name: "python-network-proxy",
    description: "Proxy network requests through Python backend",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Target URL" },
        method: { type: "string", description: "HTTP method" },
        headers: { type: "object", description: "Request headers" },
        body: { type: "object", description: "Request body" }
      },
      required: ["url", "method"]
    }
  },

  // ─── Security ───
  {
    name: "conversation-access",
    description: "Manage conversation access controls",
    inputSchema: {
      type: "object",
      properties: {
        conversation_id: { type: "string", description: "Conversation ID" },
        user_id: { type: "string", description: "User ID" },
        action: { type: "string", description: "Access action" }
      },
      required: ["conversation_id", "user_id", "action"]
    }
  },
  {
    name: "google-cloud-auth",
    description: "Authenticate with Google Cloud services",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Auth action" },
        credentials: { type: "object", description: "Credentials" },
        scopes: { type: "array", items: { type: "string" }, description: "OAuth scopes" }
      },
      required: ["action"]
    }
  },
  {
    name: "google-oauth-handler",
    description: "Handle Google OAuth callbacks",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Authorization code" },
        state: { type: "string", description: "State parameter" },
        redirect_uri: { type: "string", description: "Redirect URI" }
      },
      required: ["code"]
    }
  },

  // ─── Social ───
  {
    name: "superduper-social-viral",
    description: "Create viral social media content",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", description: "Target platform" },
        topic: { type: "string", description: "Content topic" },
        tone: { type: "string", description: "Content tone" },
        hashtags: { type: "array", items: { type: "string" }, description: "Hashtags" }
      },
      required: ["platform", "topic"]
    }
  },

  // ─── Integrations ───
  {
    name: "generate-stripe-link",
    description: "Generate Stripe payment links",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount in cents" },
        currency: { type: "string", description: "Currency code" },
        description: { type: "string", description: "Payment description" },
        metadata: { type: "object", description: "Stripe metadata" }
      },
      required: ["amount", "currency"]
    }
  },
  {
    name: "github-issue-scanner",
    description: "Scan GitHub repository issues",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        labels: { type: "array", items: { type: "string" }, description: "Issue labels" },
        state: { type: "string", description: "Issue state" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "google-calendar",
    description: "Interact with Google Calendar",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Calendar action" },
        calendar_id: { type: "string", description: "Calendar ID" },
        event: { type: "object", description: "Event data" }
      },
      required: ["action"]
    }
  },
  {
    name: "google-drive",
    description: "Interact with Google Drive",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Drive action" },
        file_id: { type: "string", description: "File ID" },
        folder_id: { type: "string", description: "Folder ID" },
        data: { type: "object", description: "File data" }
      },
      required: ["action"]
    }
  },
  {
    name: "google-drive-deliverables",
    description: "Manage deliverables in Google Drive",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID" },
        deliverables: { type: "array", items: { type: "object" }, description: "Deliverables" },
        folder_id: { type: "string", description: "Drive folder ID" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "google-gmail",
    description: "Send and manage Gmail messages",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Gmail action" },
        to: { type: "string", description: "Recipient" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" },
        attachments: { type: "array", items: { type: "string" }, description: "Attachment IDs" }
      },
      required: ["action"]
    }
  },
  {
    name: "google-sheets",
    description: "Read and write Google Sheets",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Sheet action" },
        spreadsheet_id: { type: "string", description: "Spreadsheet ID" },
        range: { type: "string", description: "Cell range" },
        values: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Cell values" }
      },
      required: ["action", "spreadsheet_id"]
    }
  },
  {
    name: "ingest-github-contribution",
    description: "Ingest GitHub contribution data",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username" },
        repository: { type: "string", description: "Repository" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["username"]
    }
  },
  {
    name: "supabase-integration",
    description: "General Supabase integration operations",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        table: { type: "string", description: "Target table" },
        data: { type: "object", description: "Data payload" }
      },
      required: ["action"]
    }
  },
  {
    name: "superduper-integration",
    description: "Superduper platform integration",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform" },
        endpoint: { type: "string", description: "API endpoint" },
        payload: { type: "object", description: "Request payload" }
      },
      required: ["action"]
    }
  },

  // ─── Storage ───
  {
    name: "universal-file-processor",
    description: "Universal file processing pipeline",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Processing action" },
        file_path: { type: "string", description: "File path" },
        options: { type: "object", description: "Processing options" }
      },
      required: ["action", "file_path"]
    }
  },

  // ─── Analytics / Metrics ───
  {
    name: "get-all-functions",
    description: "List all deployed edge functions",
    inputSchema: {
      type: "object",
      properties: {
        include_inactive: { type: "boolean", description: "Include inactive" },
        filter: { type: "string", description: "Name filter" }
      },
      required: []
    }
  },
  {
    name: "get-analytics-summary",
    description: "Get summary analytics data",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: { type: "string", description: "Time range" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        granularity: { type: "string", description: "Data granularity" }
      },
      required: ["timeframe"]
    }
  },
  {
    name: "get-autonomous-agents",
    description: "List all autonomous agents",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        capabilities: { type: "array", items: { type: "string" }, description: "Filter by capability" },
        include_metrics: { type: "boolean", description: "Include metrics" }
      },
      required: []
    }
  },
  {
    name: "get-changelog",
    description: "Get project changelog",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name" },
        since: { type: "string", description: "Start date" },
        format: { type: "string", description: "Output format" }
      },
      required: ["project"]
    }
  },
  {
    name: "get-completion-metrics",
    description: "Get AI completion metrics",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Model name" },
        timeframe: { type: "string", description: "Time range" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" }
      },
      required: ["model"]
    }
  },
  {
    name: "get-contributor-dashboard",
    description: "Get contributor dashboard data",
    inputSchema: {
      type: "object",
      properties: {
        contributor_id: { type: "string", description: "Contributor ID" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" }
      },
      required: ["contributor_id"]
    }
  },
  {
    name: "get-contributor-insights",
    description: "Get contributor performance insights",
    inputSchema: {
      type: "object",
      properties: {
        contributor_id: { type: "string", description: "Contributor ID" },
        depth: { type: "string", description: "Analysis depth" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["contributor_id"]
    }
  },
  {
    name: "get-dashboard-metrics",
    description: "Get dashboard performance metrics",
    inputSchema: {
      type: "object",
      properties: {
        dashboard_id: { type: "string", description: "Dashboard ID" },
        widgets: { type: "array", items: { type: "string" }, description: "Widget IDs" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["dashboard_id"]
    }
  },
  {
    name: "get-development-metrics",
    description: "Get development team metrics",
    inputSchema: {
      type: "object",
      properties: {
        team: { type: "string", description: "Team name" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["team"]
    }
  },
  {
    name: "get-discord-analytics",
    description: "Get Discord community analytics",
    inputSchema: {
      type: "object",
      properties: {
        server_id: { type: "string", description: "Discord server ID" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["server_id"]
    }
  },
  {
    name: "get-discord-stats",
    description: "Get Discord server statistics",
    inputSchema: {
      type: "object",
      properties: {
        server_id: { type: "string", description: "Discord server ID" },
        channels: { type: "array", items: { type: "string" }, description: "Channel IDs" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["server_id"]
    }
  },
  {
    name: "get-ecosystem-metrics",
    description: "Get ecosystem-wide metrics",
    inputSchema: {
      type: "object",
      properties: {
        components: { type: "array", items: { type: "string" }, description: "Components to check" },
        timeframe: { type: "string", description: "Time range" },
        detailed: { type: "boolean", description: "Detailed output" }
      },
      required: []
    }
  },
  {
    name: "get-github-stats",
    description: "Get GitHub statistics",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "get-mesh-network-stats",
    description: "Get MESHNET network statistics",
    inputSchema: {
      type: "object",
      properties: {
        node_id: { type: "string", description: "Node ID" },
        timeframe: { type: "string", description: "Time range" },
        include_peers: { type: "boolean", description: "Include peer data" }
      },
      required: []
    }
  },
  {
    name: "get-miner-dashboard-data",
    description: "Get miner dashboard data",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "get-miner-metrics",
    description: "Get detailed miner metrics",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        timeframe: { type: "string", description: "Time range" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "get-miner-stats",
    description: "Get mining pool statistics",
    inputSchema: {
      type: "object",
      properties: {
        pool: { type: "string", description: "Pool identifier" },
        timeframe: { type: "string", description: "Time range" },
        workers: { type: "array", items: { type: "string" }, description: "Worker IDs" }
      },
      required: ["pool"]
    }
  },
  {
    name: "get-mining-workers",
    description: "List all registered mining workers",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        pool: { type: "string", description: "Filter by pool" },
        limit: { type: "number", description: "Max results" }
      },
      required: []
    }
  },
  {
    name: "get-mobile-miners",
    description: "List mobile mining devices",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        platform: { type: "string", description: "Filter by platform" },
        limit: { type: "number", description: "Max results" }
      },
      required: []
    }
  },
  {
    name: "get-network-stats",
    description: "Get network statistics",
    inputSchema: {
      type: "object",
      properties: {
        network: { type: "string", description: "Network identifier" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["network"]
    }
  },
  {
    name: "get-pool-metrics",
    description: "Get mining pool metrics",
    inputSchema: {
      type: "object",
      properties: {
        pool_url: { type: "string", description: "Pool URL" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["pool_url"]
    }
  },
  {
    name: "get-project-metrics",
    description: "Get project development metrics",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["project"]
    }
  },
  {
    name: "get-proposal-details",
    description: "Get governance proposal details",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        include_votes: { type: "boolean", description: "Include votes" },
        include_comments: { type: "boolean", description: "Include comments" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "get-queue-status",
    description: "Get task queue status",
    inputSchema: {
      type: "object",
      properties: {
        queue_name: { type: "string", description: "Queue name" },
        include_items: { type: "boolean", description: "Include queue items" }
      },
      required: []
    }
  },
  {
    name: "get-reward-summary",
    description: "Get reward distribution summary",
    inputSchema: {
      type: "object",
      properties: {
        wallet_address: { type: "string", description: "Wallet address" },
        timeframe: { type: "string", description: "Time range" },
        currency: { type: "string", description: "Currency code" }
      },
      required: ["wallet_address"]
    }
  },
  {
    name: "get-social-stats",
    description: "Get social media statistics",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", description: "Platform name" },
        account: { type: "string", description: "Account handle" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["platform", "account"]
    }
  },
  {
    name: "get-staking-metrics",
    description: "Get token staking metrics",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token identifier" },
        timeframe: { type: "string", description: "Time range" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" }
      },
      required: ["token"]
    }
  },
  {
    name: "get-task-assignments",
    description: "Get agent task assignments",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        status: { type: "string", description: "Filter by status" },
        limit: { type: "number", description: "Max results" }
      },
      required: ["agent_id"]
    }
  },
  {
    name: "get-task-metrics",
    description: "Get task execution metrics",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: { type: "string", description: "Time range" },
        status: { type: "string", description: "Filter by status" },
        granularity: { type: "string", description: "Data granularity" }
      },
      required: ["timeframe"]
    }
  },
  {
    name: "get-task-queue",
    description: "Get pending task queue",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        priority: { type: "number", description: "Filter by priority" },
        limit: { type: "number", description: "Max results" }
      },
      required: []
    }
  },
  {
    name: "get-task-status",
    description: "Get detailed task status",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Task ID" },
        include_operations: { type: "boolean", description: "Include operations" }
      },
      required: ["task_id"]
    }
  },
  {
    name: "get-team-metrics",
    description: "Get team performance metrics",
    inputSchema: {
      type: "object",
      properties: {
        team: { type: "string", description: "Team name" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["team"]
    }
  },
  {
    name: "get-token-metrics",
    description: "Get XMRT token metrics",
    inputSchema: {
      type: "object",
      properties: {
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" },
        include_price: { type: "boolean", description: "Include price data" }
      },
      required: []
    }
  },
  {
    name: "get-user-analytics",
    description: "Get user engagement analytics",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["user_id"]
    }
  },
  {
    name: "get-user-profile",
    description: "Get user profile data",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        include_activity: { type: "boolean", description: "Include activity" },
        include_rewards: { type: "boolean", description: "Include rewards" }
      },
      required: ["user_id"]
    }
  },
  {
    name: "get-worker-dashboard",
    description: "Get mining worker dashboard",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "get-worker-metrics",
    description: "Get detailed worker metrics",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        timeframe: { type: "string", description: "Time range" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to include" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "handle-payment-webhook",
    description: "Handle payment provider webhooks",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Payment provider" },
        event_type: { type: "string", description: "Event type" },
        payload: { type: "object", description: "Webhook payload" }
      },
      required: ["provider", "event_type", "payload"]
    }
  },
  {
    name: "health-check",
    description: "System health check endpoint",
    inputSchema: {
      type: "object",
      properties: {
        component: { type: "string", description: "Component to check" },
        depth: { type: "string", description: "Check depth" }
      },
      required: []
    }
  },
  {
    name: "improve-governance-idea",
    description: "Improve governance proposal ideas",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        suggestions: { type: "array", items: { type: "string" }, description: "Suggestions" },
        auto_apply: { type: "boolean", description: "Auto apply changes" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "initialize-project",
    description: "Initialize new project workspace",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        template: { type: "string", description: "Project template" },
        config: { type: "object", description: "Initial configuration" }
      },
      required: ["name"]
    }
  },
  {
    name: "invite-collaborator",
    description: "Invite a new collaborator",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Collaborator email" },
        role: { type: "string", description: "Assigned role" },
        project: { type: "string", description: "Project name" },
        message: { type: "string", description: "Invitation message" }
      },
      required: ["email", "role"]
    }
  },
  {
    name: "list-active-miners",
    description: "List currently active miners",
    inputSchema: {
      type: "object",
      properties: {
        pool: { type: "string", description: "Pool identifier" },
        limit: { type: "number", description: "Max results" },
        include_stats: { type: "boolean", description: "Include statistics" }
      },
      required: []
    }
  },
  {
    name: "list-all-miners",
    description: "List all registered miners",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        pool: { type: "string", description: "Filter by pool" },
        limit: { type: "number", description: "Max results" }
      },
      required: []
    }
  },
  {
    name: "list-all-workers",
    description: "List all mining workers",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        pool: { type: "string", description: "Filter by pool" },
        limit: { type: "number", description: "Max results" }
      },
      required: []
    }
  },
  {
    name: "list-available-models",
    description: "List available AI models",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Filter by provider" },
        capability: { type: "string", description: "Filter by capability" }
      },
      required: []
    }
  },
  {
    name: "list-cron-jobs",
    description: "List all scheduled cron jobs",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        function: { type: "string", description: "Filter by function" }
      },
      required: []
    }
  },
  {
    name: "list-miner-rewards",
    description: "List miner reward history",
    inputSchema: {
      type: "object",
      properties: {
        wallet_address: { type: "string", description: "Wallet address" },
        timeframe: { type: "string", description: "Time range" },
        limit: { type: "number", description: "Max results" }
      },
      required: ["wallet_address"]
    }
  },
  {
    name: "list-mining-pools",
    description: "List available mining pools",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "Filter by region" },
        fee_threshold: { type: "number", description: "Max fee percentage" }
      },
      required: []
    }
  },
  {
    name: "list-proposals",
    description: "List governance proposals",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        category: { type: "string", description: "Filter by category" },
        limit: { type: "number", description: "Max results" },
        offset: { type: "number", description: "Pagination offset" }
      },
      required: []
    }
  },
  {
    name: "list-recent-tasks",
    description: "List recently completed tasks",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        limit: { type: "number", description: "Max results" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: []
    }
  },
  {
    name: "list-worker-rewards",
    description: "List worker reward history",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        timeframe: { type: "string", description: "Time range" },
        limit: { type: "number", description: "Max results" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "load-test-function",
    description: "Load test edge function performance",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Function to test" },
        concurrent: { type: "number", description: "Concurrent requests" },
        duration: { type: "number", description: "Test duration seconds" },
        payload: { type: "object", description: "Test payload" }
      },
      required: ["function_name"]
    }
  },
  {
    name: "log-function-metrics",
    description: "Log function execution metrics",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Function name" },
        metrics: { type: "object", description: "Metrics data" },
        level: { type: "string", description: "Log level" }
      },
      required: ["function_name", "metrics"]
    }
  },
  {
    name: "monitor-miner-heartbeat",
    description: "Monitor mining worker heartbeats",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        timeout: { type: "number", description: "Heartbeat timeout" },
        alert: { type: "boolean", description: "Send alerts" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "monitor-worker-health",
    description: "Monitor mining worker health",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        checks: { type: "array", items: { type: "string" }, description: "Health checks" },
        alert: { type: "boolean", description: "Send alerts" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "node-config-sync",
    description: "Synchronize node configuration",
    inputSchema: {
      type: "object",
      properties: {
        node_id: { type: "string", description: "Node ID" },
        config: { type: "object", description: "Configuration" },
        force: { type: "boolean", description: "Force sync" }
      },
      required: ["node_id"]
    }
  },
  {
    name: "notify-reward-distribution",
    description: "Notify about reward distributions",
    inputSchema: {
      type: "object",
      properties: {
        wallet_address: { type: "string", description: "Wallet address" },
        amount: { type: "number", description: "Reward amount" },
        currency: { type: "string", description: "Currency code" },
        channel: { type: "string", description: "Notification channel" }
      },
      required: ["wallet_address", "amount"]
    }
  },
  {
    name: "notify-worker-status",
    description: "Notify about worker status changes",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        status: { type: "string", description: "New status" },
        details: { type: "object", description: "Status details" },
        channels: { type: "array", items: { type: "string" }, description: "Notification channels" }
      },
      required: ["worker_id", "status"]
    }
  },
  {
    name: "post-daily-update",
    description: "Post daily project update",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name" },
        content: { type: "string", description: "Update content" },
        channels: { type: "array", items: { type: "string" }, description: "Channels" }
      },
      required: ["project", "content"]
    }
  },
  {
    name: "process-miner-reward",
    description: "Process mining reward payout",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        amount: { type: "number", description: "Reward amount" },
        wallet_address: { type: "string", description: "Wallet address" },
        currency: { type: "string", description: "Currency code" }
      },
      required: ["worker_id", "amount", "wallet_address"]
    }
  },
  {
    name: "process-payment",
    description: "Process incoming payment",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Payment amount" },
        currency: { type: "string", description: "Currency code" },
        source: { type: "string", description: "Payment source" },
        metadata: { type: "object", description: "Payment metadata" }
      },
      required: ["amount", "currency"]
    }
  },
  {
    name: "process-reward",
    description: "Process reward distribution",
    inputSchema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Recipient address" },
        amount: { type: "number", description: "Reward amount" },
        currency: { type: "string", description: "Currency code" },
        reason: { type: "string", description: "Reward reason" }
      },
      required: ["recipient", "amount"]
    }
  },
  {
    name: "process-worker-payment",
    description: "Process worker payment",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        amount: { type: "number", description: "Payment amount" },
        wallet_address: { type: "string", description: "Wallet address" },
        currency: { type: "string", description: "Currency code" }
      },
      required: ["worker_id", "amount"]
    }
  },
  {
    name: "proposal-reviewer",
    description: "Review governance proposals",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        criteria: { type: "array", items: { type: "string" }, description: "Review criteria" },
        auto_vote: { type: "boolean", description: "Auto vote" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "publish-release-notes",
    description: "Publish project release notes",
    inputSchema: {
      type: "object",
      properties: {
        version: { type: "string", description: "Version number" },
        project: { type: "string", description: "Project name" },
        notes: { type: "string", description: "Release notes" },
        channels: { type: "array", items: { type: "string" }, description: "Channels" }
      },
      required: ["version", "project", "notes"]
    }
  },
  {
    name: "queue-worker-task",
    description: "Queue a task for a worker",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        task: { type: "object", description: "Task definition" },
        priority: { type: "number", description: "Priority 1-10" },
        deadline: { type: "string", description: "Deadline ISO" }
      },
      required: ["worker_id", "task"]
    }
  },
  {
    name: "register-miner",
    description: "Register a new miner",
    inputSchema: {
      type: "object",
      properties: {
        wallet_address: { type: "string", description: "Wallet address" },
        device_id: { type: "string", description: "Device ID" },
        pool_url: { type: "string", description: "Pool URL" },
        nickname: { type: "string", description: "Miner nickname" }
      },
      required: ["wallet_address", "device_id"]
    }
  },
  {
    name: "register-new-model",
    description: "Register a new AI model",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Model name" },
        provider: { type: "string", description: "Model provider" },
        endpoint: { type: "string", description: "API endpoint" },
        capabilities: { type: "array", items: { type: "string" }, description: "Capabilities" }
      },
      required: ["name", "provider"]
    }
  },
  {
    name: "render-agent-interface",
    description: "Render agent web interface",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        view: { type: "string", description: "View name" },
        data: { type: "object", description: "View data" }
      },
      required: ["agent_id", "view"]
    }
  },
  {
    name: "request-miner-stats",
    description: "Request miner statistics from pool",
    inputSchema: {
      type: "object",
      properties: {
        pool_url: { type: "string", description: "Pool URL" },
        worker_id: { type: "string", description: "Worker ID" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to request" }
      },
      required: ["pool_url"]
    }
  },
  {
    name: "resolve-agent-task",
    description: "Resolve an agent task manually",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Task ID" },
        resolution: { type: "string", description: "Resolution status" },
        notes: { type: "string", description: "Resolution notes" }
      },
      required: ["task_id", "resolution"]
    }
  },
  {
    name: "reward-top-contributors",
    description: "Reward top project contributors",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name" },
        count: { type: "number", description: "Number of contributors" },
        amount: { type: "number", description: "Reward amount" },
        currency: { type: "string", description: "Currency code" }
      },
      required: ["project", "count", "amount"]
    }
  },
  {
    name: "scan-codebase",
    description: "Scan codebase for issues",
    inputSchema: {
      type: "object",
      properties: {
        repository: { type: "string", description: "Repository name" },
        branch: { type: "string", description: "Branch to scan" },
        checks: { type: "array", items: { type: "string" }, description: "Checks to run" },
        severity: { type: "string", description: "Min severity" }
      },
      required: ["repository"]
    }
  },
  {
    name: "send-bulk-message",
    description: "Send bulk messages to users",
    inputSchema: {
      type: "object",
      properties: {
        recipients: { type: "array", items: { type: "string" }, description: "Recipient IDs" },
        message: { type: "string", description: "Message content" },
        channel: { type: "string", description: "Channel" },
        priority: { type: "number", description: "Priority 1-10" }
      },
      required: ["recipients", "message"]
    }
  },
  {
    name: "send-dm",
    description: "Send direct message to user",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        message: { type: "string", description: "Message content" },
        channel: { type: "string", description: "Channel" }
      },
      required: ["user_id", "message"]
    }
  },
  {
    name: "send-miner-alert",
    description: "Send alert to miner",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        alert_type: { type: "string", description: "Alert type" },
        message: { type: "string", description: "Alert message" },
        severity: { type: "string", description: "Severity level" }
      },
      required: ["worker_id", "alert_type", "message"]
    }
  },
  {
    name: "send-worker-notification",
    description: "Send notification to worker",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        title: { type: "string", description: "Notification title" },
        body: { type: "string", description: "Notification body" },
        channel: { type: "string", description: "Channel" }
      },
      required: ["worker_id", "title", "body"]
    }
  },
  {
    name: "set-miner-config",
    description: "Set miner configuration",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        config: { type: "object", description: "Configuration" },
        restart: { type: "boolean", description: "Restart miner" }
      },
      required: ["worker_id", "config"]
    }
  },
  {
    name: "set-worker-config",
    description: "Set worker configuration",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        config: { type: "object", description: "Configuration" },
        restart: { type: "boolean", description: "Restart worker" }
      },
      required: ["worker_id", "config"]
    }
  },
  {
    name: "sync-agent-state",
    description: "Synchronize agent state across nodes",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        state: { type: "object", description: "State data" },
        nodes: { type: "array", items: { type: "string" }, description: "Target nodes" }
      },
      required: ["agent_id"]
    }
  },
  {
    name: "sync-miner-config",
    description: "Synchronize miner configuration",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        config: { type: "object", description: "Configuration" },
        propagate: { type: "boolean", description: "Propagate to pool" }
      },
      required: ["worker_id", "config"]
    }
  },
  {
    name: "sync-miner-state",
    description: "Synchronize miner state across pool",
    inputSchema: {
      type: "object",
      properties: {
        pool_url: { type: "string", description: "Pool URL" },
        worker_id: { type: "string", description: "Worker ID" },
        state: { type: "object", description: "State data" }
      },
      required: ["pool_url"]
    }
  },
  {
    name: "sync-worker-config",
    description: "Synchronize worker configuration",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        config: { type: "object", description: "Configuration" },
        propagate: { type: "boolean", description: "Propagate changes" }
      },
      required: ["worker_id", "config"]
    }
  },
  {
    name: "track-conversion",
    description: "Track user conversion events",
    inputSchema: {
      type: "object",
      properties: {
        event: { type: "string", description: "Event name" },
        user_id: { type: "string", description: "User ID" },
        value: { type: "number", description: "Event value" },
        metadata: { type: "object", description: "Event metadata" }
      },
      required: ["event"]
    }
  },
  {
    name: "track-event",
    description: "Track analytics event",
    inputSchema: {
      type: "object",
      properties: {
        event: { type: "string", description: "Event name" },
        user_id: { type: "string", description: "User ID" },
        properties: { type: "object", description: "Event properties" },
        timestamp: { type: "string", description: "Event timestamp" }
      },
      required: ["event"]
    }
  },
  {
    name: "track-page-view",
    description: "Track page view analytics",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "string", description: "Page path" },
        user_id: { type: "string", description: "User ID" },
        referrer: { type: "string", description: "Referrer URL" },
        metadata: { type: "object", description: "View metadata" }
      },
      required: ["page"]
    }
  },
  {
    name: "update-miner-status",
    description: "Update miner operational status",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        status: { type: "string", description: "New status" },
        details: { type: "object", description: "Status details" }
      },
      required: ["worker_id", "status"]
    }
  },
  {
    name: "update-payment-status",
    description: "Update payment status",
    inputSchema: {
      type: "object",
      properties: {
        payment_id: { type: "string", description: "Payment ID" },
        status: { type: "string", description: "New status" },
        metadata: { type: "object", description: "Update metadata" }
      },
      required: ["payment_id", "status"]
    }
  },
  {
    name: "update-project-status",
    description: "Update project status",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name" },
        status: { type: "string", description: "New status" },
        milestone: { type: "string", description: "Current milestone" },
        notes: { type: "string", description: "Status notes" }
      },
      required: ["project", "status"]
    }
  },
  {
    name: "update-reward-status",
    description: "Update reward distribution status",
    inputSchema: {
      type: "object",
      properties: {
        reward_id: { type: "string", description: "Reward ID" },
        status: { type: "string", description: "New status" },
        tx_hash: { type: "string", description: "Transaction hash" }
      },
      required: ["reward_id", "status"]
    }
  },
  {
    name: "update-task-progress",
    description: "Update task progress",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Task ID" },
        progress: { type: "number", description: "Progress 0-100" },
        notes: { type: "string", description: "Progress notes" },
        deliverables: { type: "array", items: { type: "string" }, description: "Deliverables" }
      },
      required: ["task_id", "progress"]
    }
  },
  {
    name: "update-worker-status",
    description: "Update worker operational status",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        status: { type: "string", description: "New status" },
        details: { type: "object", description: "Status details" }
      },
      required: ["worker_id", "status"]
    }
  },
  {
    name: "validate-miner-config",
    description: "Validate miner configuration",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        config: { type: "object", description: "Configuration to validate" },
        strict: { type: "boolean", description: "Strict validation" }
      },
      required: ["worker_id", "config"]
    }
  },
  {
    name: "verify-miner-reward",
    description: "Verify mining reward calculation",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        amount: { type: "number", description: "Expected amount" },
        period: { type: "string", description: "Reward period" }
      },
      required: ["worker_id", "amount"]
    }
  },
  {
    name: "vote-on-proposal",
    description: "Vote on governance proposal",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        vote: { type: "string", description: "Vote value" },
        voter: { type: "string", description: "Voter ID" },
        reason: { type: "string", description: "Vote reason" }
      },
      required: ["proposal_id", "vote", "voter"]
    }
  },

  // ─── Content Generation ───
  {
    name: "community-spotlight-post",
    description: "Create community spotlight content",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Spotlight topic" },
        author: { type: "string", description: "Content author" },
        content: { type: "string", description: "Content body" }
      },
      required: ["topic"]
    }
  },
  {
    name: "convert-session-to-user",
    description: "Convert anonymous session to registered user",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Session ID" },
        email: { type: "string", description: "User email" },
        metadata: { type: "object", description: "User metadata" }
      },
      required: ["session_id", "email"]
    }
  },
  {
    name: "correlate-user-identity",
    description: "Correlate user identities across services",
    inputSchema: {
      type: "object",
      properties: {
        user_ids: { type: "array", items: { type: "string" }, description: "User IDs to correlate" },
        confidence_threshold: { type: "number", description: "Min confidence 0-1" }
      },
      required: ["user_ids"]
    }
  },
  {
    name: "create-suite-quote",
    description: "Generate a project quote",
    inputSchema: {
      type: "object",
      properties: {
        client: { type: "string", description: "Client name" },
        services: { type: "array", items: { type: "string" }, description: "Services" },
        timeline: { type: "string", description: "Delivery timeline" },
        budget: { type: "number", description: "Budget amount" }
      },
      required: ["client", "services"]
    }
  },
  {
    name: "daily-discussion-post",
    description: "Create daily discussion forum post",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Discussion topic" },
        category: { type: "string", description: "Forum category" },
        scheduled_at: { type: "string", description: "Post time ISO" }
      },
      required: ["topic"]
    }
  },
  {
    name: "daily-news-finder",
    description: "Find and summarize daily news",
    inputSchema: {
      type: "object",
      properties: {
        topics: { type: "array", items: { type: "string" }, description: "News topics" },
        sources: { type: "array", items: { type: "string" }, description: "News sources" },
        max_articles: { type: "number", description: "Max articles" }
      },
      required: []
    }
  },
  {
    name: "db-schema-sync",
    description: "Synchronize database schemas",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Source schema" },
        target: { type: "string", description: "Target schema" },
        tables: { type: "array", items: { type: "string" }, description: "Tables to sync" }
      },
      required: ["source", "target"]
    }
  },
  {
    name: "decision-proposal-notifier",
    description: "Notify about decision proposals",
    inputSchema: {
      type: "object",
      properties: {
        proposal_id: { type: "string", description: "Proposal ID" },
        recipients: { type: "array", items: { type: "string" }, description: "Recipients" },
        urgency: { type: "string", description: "Urgency level" }
      },
      required: ["proposal_id"]
    }
  },
  {
    name: "discover-next-task",
    description: "Discover next task for an agent",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID" },
        context: { type: "object", description: "Discovery context" },
        priority: { type: "number", description: "Min priority" }
      },
      required: ["agent_id"]
    }
  },
  {
    name: "ecosystem-news-monitor",
    description: "Monitor ecosystem news and updates",
    inputSchema: {
      type: "object",
      properties: {
        sources: { type: "array", items: { type: "string" }, description: "News sources" },
        keywords: { type: "array", items: { type: "string" }, description: "Keywords" },
        interval: { type: "number", description: "Check interval minutes" }
      },
      required: []
    }
  },
  {
    name: "ecosystem-orchestrator",
    description: "Orchestrate ecosystem-wide operations",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Operation name" },
        targets: { type: "array", items: { type: "string" }, description: "Target components" },
        config: { type: "object", description: "Operation config" }
      },
      required: ["operation"]
    }
  },
  {
    name: "eliza-github-callback",
    description: "Handle Eliza GitHub integration callbacks",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Auth code" },
        state: { type: "string", description: "State param" },
        installation_id: { type: "string", description: "Installation ID" }
      },
      required: ["code"]
    }
  },
  {
    name: "eliza-telegram-webhook",
    description: "Handle Eliza Telegram bot webhooks",
    inputSchema: {
      type: "object",
      properties: {
        update_id: { type: "number", description: "Update ID" },
        message: { type: "object", description: "Message data" },
        bot_token: { type: "string", description: "Bot token" }
      },
      required: ["update_id"]
    }
  },
  {
    name: "execute-parallel-actions",
    description: "Execute multiple actions in parallel",
    inputSchema: {
      type: "object",
      properties: {
        actions: { type: "array", items: { type: "object" }, description: "Actions to run" },
        timeout: { type: "number", description: "Timeout seconds" },
        max_concurrency: { type: "number", description: "Max concurrent" }
      },
      required: ["actions"]
    }
  },
  {
    name: "fetch-github-stats",
    description: "Fetch GitHub repository statistics",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to fetch" }
      },
      required: ["owner", "repo"]
    }
  },
  {
    name: "fetch-miner-metrics",
    description: "Fetch mining worker metrics",
    inputSchema: {
      type: "object",
      properties: {
        worker_id: { type: "string", description: "Worker ID" },
        timeframe: { type: "string", description: "Time range" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics to fetch" }
      },
      required: ["worker_id"]
    }
  },
  {
    name: "fetch-payment-history",
    description: "Fetch payment and payout history",
    inputSchema: {
      type: "object",
      properties: {
        wallet_address: { type: "string", description: "Wallet address" },
        start_date: { type: "string", description: "Start date" },
        end_date: { type: "string", description: "End date" }
      },
      required: ["wallet_address"]
    }
  },
  {
    name: "generate-completion",
    description: "Generate text completion with AI",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Completion prompt" },
        model: { type: "string", description: "Model name" },
        max_tokens: { type: "number", description: "Max tokens" },
        temperature: { type: "number", description: "Temperature" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "generate-meme-content",
    description: "Generate viral meme content",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Meme topic" },
        format: { type: "string", description: "Meme format" },
        platform: { type: "string", description: "Target platform" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate-viral-content",
    description: "Generate viral marketing content",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Content topic" },
        platform: { type: "string", description: "Target platform" },
        tone: { type: "string", description: "Content tone" },
        length: { type: "number", description: "Content length" }
      },
      required: ["topic", "platform"]
    }
  },
  {
    name: "get-aggregator-dashboard",
    description: "Get data for aggregator dashboard",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "Data source" },
        metrics: { type: "array", items: { type: "string" }, description: "Metrics" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["source"]
    }
  },
  {
    name: "get-aggregator-report",
    description: "Generate aggregator performance report",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", description: "Report period" },
        format: { type: "string", description: "Output format" },
        include_charts: { type: "boolean", description: "Include charts" }
      },
      required: ["period"]
    }
  },
  {
    name: "get-ai-models-status",
    description: "Get status of available AI models",
    inputSchema: {
      type: "object",
      properties: {
        providers: { type: "array", items: { type: "string" }, description: "Filter providers" },
        include_latency: { type: "boolean", description: "Include latency" }
      },
      required: []
    }
  },
  {
    name: "get-all-contributors",
    description: "Get all project contributors",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project name" },
        include_anonymous: { type: "boolean", description: "Include anonymous" },
        timeframe: { type: "string", description: "Time range" }
      },
      required: ["project"]
    }
  },
  {
    name: "admin-db-tool",
    description: "Admin database management tools",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Admin action" },
        table: { type: "string", description: "Target table" },
        query: { type: "string", description: "SQL query" },
        data: { type: "object", description: "Query data" }
      },
      required: ["action"]
    }
  },
  {
    name: "android-control",
    description: "Remote control Android devices",
    inputSchema: {
      type: "object",
      properties: {
        device_id: { type: "string", description: "Device ID" },
        command: { type: "string", description: "Remote command" },
        params: { type: "object", description: "Command params" }
      },
      required: ["device_id", "command"]
    }
  },
  {
    name: "autonomous-code-fixer",
    description: "Autonomous code repair and patching",
    inputSchema: {
      type: "object",
      properties: {
        repository: { type: "string", description: "Repository" },
        issue_id: { type: "string", description: "Issue ID" },
        files: { type: "array", items: { type: "string" }, description: "Files to fix" }
      },
      required: ["repository"]
    }
  },
  {
    name: "autonomous-decision-maker",
    description: "Autonomous decision making engine",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "object", description: "Decision context" },
        constraints: { type: "array", items: { type: "string" }, description: "Constraints" },
        options: { type: "array", items: { type: "string" }, description: "Options" }
      },
      required: ["context"]
    }
  }
];

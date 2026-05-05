# DenoClaw / SupaClaw

A task orchestration framework built for Supabase Edge Functions (Deno runtime). Designed to overcome the 60-second timeout by decomposing agent work into checkpointed sub-operations that persist state in Supabase Postgres.

## Vision

> An agent execution system like OpenClaw or Kimi Claw — but entirely within the Supabase Deno runtime. No external servers. No Lambda. Just edge functions, a Postgres database, and 60-second bursts of computation chained into infinite workflows.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Agent Request │────►│  DenoClaw Task   │────►│  Decompose Plan │
│   (Objective)   │     │   (Create Task)  │     │  (Operations)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supabase Cron  │◄────│  Checkpoint DB   │◄────│  Execute (≤60s) │
│  (Continue…)    │     │  (Persist State) │     │  Edge Function  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Core Concepts

- **Task**: A high-level objective (e.g., "Merge these PDFs, add a signature, and email the result")
- **Operation**: A single unit of work that fits within ~30-50 seconds
- **Continuation**: If a task needs more time, it checkpoints to Postgres and a cron job or webhook resumes it
- **State Machine**: Every task and operation tracks status: `pending → decomposed → running → checkpoint → completed/failed`

## Project Structure

```
supabase/functions/
  denoclaw/              # Core orchestrator edge function
    index.ts            # HTTP API for task management
  pdf-handler/           # Direct PDF manipulation edge function
    index.ts            # Merge, split, sign, watermark, metadata, compress
  _shared/
    denoclaw/
      core.ts           # DenoClaw class + operation registry
      pdf-handlers.ts   # PDF operation implementations (pdf-lib)
```

## Database Schema

### `agent_tasks`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | text | Agent or user identifier |
| status | enum | pending, decomposed, running, checkpoint, completed, failed, cancelled |
| objective | text | Human-readable task description |
| context | jsonb | Arbitrary context data |
| priority | int | 1-10 priority level |
| result | jsonb | Final task output |
| checkpoint_data | jsonb | Resume state for long-running tasks |
| parent_task_id | UUID | For sub-task hierarchies |

### `task_operations`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| task_id | UUID | FK to agent_tasks |
| sequence | int | Execution order |
| op_type | text | Operation type (pdf.merge, ai.generate, etc.) |
| input | jsonb | Operation parameters |
| output | jsonb | Operation result |
| status | enum | pending, running, completed, failed |
| retry_count | int | Current retry count |
| max_retries | int | Max retry attempts |

## API Reference

### DenoClaw Orchestrator

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create a new task |
| POST | `/decompose` | Decompose task into operations |
| POST | `/execute` | Execute next pending operation |
| POST | `/continue` | Process checkpointed tasks (cron) |
| GET | `/status/:taskId` | Get full task + operations |

#### Create Task
```json
POST /denoclaw/
{
  "agentId": "eliza",
  "objective": "Merge Q1 reports, add XMRT DAO watermark, and compress for email",
  "context": {
    "sources": ["reports/q1-part1.pdf", "reports/q1-part2.pdf"]
  },
  "priority": 7
}
```

#### Decompose
```json
POST /denoclaw/decompose
{ "taskId": "uuid-here" }
```

#### Execute
```json
POST /denoclaw/execute
{ "taskId": "uuid-here" }
```

### PDF Handler (Direct)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/merge` | Merge multiple PDFs |
| POST | `/split` | Split by page ranges |
| POST | `/sign` | Add signature field |
| POST | `/watermark` | Add text watermark |
| POST | `/metadata` | Read/edit metadata |
| POST | `/compress` | Optimize PDF |

#### Merge PDFs
```json
POST /pdf-handler/merge
{
  "sources": ["uploads/report1.pdf", "uploads/report2.pdf"]
}
```

#### Sign PDF
```json
POST /pdf-handler/sign
{
  "source": "uploads/contract.pdf",
  "text": "Signed by Eliza (AI Agent)",
  "position": { "x": 100, "y": 100, "page": 1 },
  "reason": "Contract execution by XMRT DAO"
}
```

#### Watermark
```json
POST /pdf-handler/watermark
{
  "source": "uploads/nda.pdf",
  "text": "XMRT DAO — CONFIDENTIAL",
  "opacity": 0.25
}
```

## Operation Types

### PDF Operations
- `pdf.merge` — Combine multiple PDFs
- `pdf.split` — Extract page ranges
- `pdf.sign` — Add signature appearance
- `pdf.watermark` — Add text watermark
- `pdf.metadata` — Read/edit document info
- `pdf.compress` — Optimize PDF size
- `pdf.extract_text` — Extract text content
- `pdf.ocr` — OCR (requires external service)

### AI Operations
- `ai.generate` — Content generation
- `ai.summarize` — Summarize content
- `ai.classify` — Classify documents

### Blockchain Operations
- `blockchain.read` — Read contract state
- `blockchain.call` — Execute contract call

### Web Operations
- `web.fetch` — HTTP fetch
- `web.scrape` — Page scraping

### Storage Operations
- `storage.upload` — Upload to Supabase Storage
- `storage.download` — Download from Storage

## Installation

1. Apply the database migration:
```bash
supabase db push
```

2. Deploy edge functions:
```bash
supabase functions deploy denoclaw
supabase functions deploy pdf-handler
```

3. Set environment variables in Supabase Dashboard:
```
SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

4. (Optional) Set up a cron trigger for continuation:
```bash
supabase functions deploy denoclaw --cron "*/5 * * * *"
```

## The 60-Second Rule

Every operation is designed to complete within 30-50 seconds, leaving buffer for network overhead. The DenoClaw orchestrator:

1. Measures remaining time before each operation
2. If insufficient time remains, checkpoints to Postgres
3. A cron job or webhook resumes from the checkpoint
4. Tasks with many operations run across multiple edge function invocations

## Extending DenoClaw

Register custom operation handlers:

```typescript
import { registerHandler } from "./_shared/denoclaw/core.ts";

registerHandler("my.custom.op", async (input, supabase) => {
  // Your logic here
  return { success: true };
});
```

## PDF Library

Uses [pdf-lib](https://pdf-lib.js.org/) via [esm.sh](https://esm.sh) for Deno compatibility. All PDF processing happens server-side within the edge function — no client-side WASM required.

## Security

- All operations use the Supabase Service Role Key for storage access
- RLS policies restrict user access to their own tasks
- CORS headers are configured for cross-origin requests
- File uploads/downloads go through Supabase Storage (not exposed directly)

## License

MIT — XMRT DAO

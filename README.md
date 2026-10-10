# XMRT Suite

**The AI operations console for the XMRT ecosystem — one dashboard where Eliza (the executive AI) chats, browses the web, reads your documents, and drives the fleet.**

**Live Site:** [https://xmrtdao.github.io/suite/](https://xmrtdao.github.io/suite/) · **Fleet Relay:** [relay.mobilemonero.com](https://relay.mobilemonero.com)

[![CI/CD Pipeline](https://github.com/xmrtdao/suite/actions/workflows/ci.yml/badge.svg)](https://github.com/xmrtdao/suite/actions/workflows/ci.yml)
[![Security Analysis](https://github.com/xmrtdao/suite/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/xmrtdao/suite/actions/workflows/codeql-analysis.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React 18](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Deno](https://img.shields.io/badge/Deno-runtime-000000?logo=deno&logoColor=white)](https://deno.land)
[![Postgres](https://img.shields.io/badge/Postgres-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![HF Space](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Space-blue)](https://huggingface.co/spaces/XMRTDAO/suite)

---

## What Suite is

Suite is the operator's cockpit for a solo-run, full-stack agency. It fronts the **XMRT relay** — a supervised process stack (relay API, local Supabase-compatible runtime, Postgres, Cloudflare tunnel, fleet agents) — and gives you a single screen to talk to the system, watch it work, and hand it work.

The centerpiece is the **Unified Chat**: Eliza, an executive AI with a cascading model router (cloud and local models), native tool calling, and long-term memory. She doesn't just answer — she acts through **168+ relay tools** (web search, Playwright browsing, page-agent browser control, GitHub, shell, Python, service control, fleet tasks) plus her own edge-function toolkit.

## What it does

- 💬 **Unified Chat with Eliza** — multi-executive routing, council mode, voice in/out, file attachments, and an **Automation mode** that auto-advances multi-step runs with "Proceed Intelligently".
- 🗂️ **Dynamic aside panel** — a 33% side pane that opens *only when needed* (Kimi Work / Claude Desktop style):
  - **Document** — drop a PDF/DOCX/TXT; it's parsed server-side (`/api/upload-temp`) and rendered next to the chat so you can ask questions about it.
  - **Web** — a real browser inside the dashboard. Pages are fetched through the relay (`/api/browse` → Playwright/browserless with fetch fallback), rendered in a sandboxed pane, and **link clicks re-browse in-window — you never leave Suite**. Non-URL input becomes an exa-backed search. When Eliza browses a page herself, it opens here automatically so you watch what she saw.
  - **Image / Video** — generated media surfaces here instead of clogging the chat.
  - **Ops** — live supervisor services and fleet task-pipeline status.
- 📊 **Agent & Task Visualizer** — live kanban of the fleet's task pipeline (33+ pending, per-agent load), drag between stages, provision agents.
- ⛏️ **Mining & DAO tooling** — real-time MobileMonero mining stats, governance, treasury views.
- 🧠 **Memory & learning** — knowledge entities, conversation memory, learning patterns baked into every reply.
- 🔌 **290+ edge functions** served by the built-in Deno runtime — no cloud dependency required.

## How to use it

1. **Open the dashboard** — the relay serves the built SPA at `http://localhost:8080/suite/dashboard` (or `https://relay.mobilemonero.com/suite/dashboard` through the tunnel). Log in with the relay API key.
2. **Chat normally** — ask Eliza for system status, to research something, to write and run code. Tool calls render as sticky notes on the message.
3. **Attach a document** — paperclip or drag-and-drop; it opens in the aside. Ask questions about it.
4. **Browse the web** — click **Web** (or ask Eliza to open a page). Type a URL or a search query; everything stays in the panel.
5. **Watch the fleet** — the visualizer and **Ops** panel show live task and service health.
6. **Automation** — toggle the ⚡ button in the chat toolbar to let Eliza self-advance long tasks.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (for local-sb mode)
- Git

---

## 🏗️ Architecture

```
suite/
├── src/                    # Source code
│   ├── components/         # React components (UnifiedChat, AsidePanel, AgentTaskVisualizer, …)
│   ├── pages/              # Dashboard, Landing, Governance, Mining, …
│   ├── services/           # Eliza service layer, telemetry, persistence
│   └── integrations/       # local-api (relay REST), supabase client
├── supabase/               # Supabase configuration
│   ├── functions/          # 290+ edge functions (ai-chat, playwright-browse, xmrt-university, …)
│   └── migrations/         # Database migrations
├── scripts/                # Utility scripts
├── .github/                # GitHub Actions workflows
└── docs/                   # GitHub Pages landing
```

The SPA is always served **by the relay** at `/suite/`; all API calls resolve against `window.location.origin`, so the same build works loopback (`localhost:8080`, fully offline-capable) and through the public tunnel with zero config changes.

Two backend modes:

| Mode | Backend | Best For |
|------|---------|----------|
| **Supabase Cloud** | supabase.co (hosted) | Production / remote teams |
| **local-sb** | local-supabase/ + local Postgres | Offline dev / low-resource environments |

---

## ☁️ Mode 1: Supabase Cloud

### Setup

```bash
git clone https://github.com/xmrtdao/suite.git
cd suite
npm install --legacy-peer-deps
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` — uncomment the **Cloud** block and enter your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role)
SUPABASE_ACCESS_TOKEN=sbp_... (management token)
```

### Run

```bash
npm run dev
```

### Deploy Edge Functions

```bash
# Requires Supabase CLI
npx supabase login
npx supabase functions deploy <function-name>
```

### Run Migrations

```bash
npx supabase db push
```

---

## 🏠 Mode 2: Local Supabase (local-sb)

Local-sb is a drop-in Supabase replacement — zero Docker containers, runs entirely on Node + Deno + Postgres.

### 1. Start Postgres

Ensure PostgreSQL is running locally with the `xmrt_suite` database:

```bash
# Windows (using relay supervisor)
cd relay && node start-pg.mjs

# Or manually via pg_ctl / service
```

The default connection string is:
```
postgres://postgres@127.0.0.1:5432/xmrt_suite
```

### 2. Apply Schema Migrations

```bash
node scripts/apply-schema.mjs
```

This runs all `.sql` files from `supabase/migrations/` against your local DB.

### 3. Configure

Edit `.env` — make sure the **local-sb** block is active:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=local-anon-key
SUPABASE_SERVICE_ROLE_KEY=local-dev-service-role-key
SUPABASE_ACCESS_TOKEN=local
```

### 4. Start local-sb Server

Navigate to the `local-supabase/` directory (sibling of `suite/`) and run:

```bash
cd ../local-supabase
node server.mjs
```

This starts the Supabase-compatible proxy on **port 54321** serving:
- `http://127.0.0.1:54321/rest/v1/*` — PostgREST-compatible REST API
- `http://127.0.0.1:54321/functions/v1/*` — Deno edge function runner
- `http://127.0.0.1:54321/auth/v1/*` — Auth stub
- `http://127.0.0.1:54321/storage/v1/*` — Storage stub

### 5. Start Vite Dev Server

```bash
cd suite && npm run dev
```

### 6. Test the Stack

```bash
# Smoke test: edge function runner
curl http://127.0.0.1:54321/functions/v1/_local_smoke

# Smoke test: REST API
curl http://127.0.0.1:54321/rest/v1/knowledge_entities?limit=1 \
  -H "apikey: local-anon-key" \
  -H "Authorization: Bearer local-anon-key"
```

### 7. (Optional) Backfill Knowledge

Seed the memory pipeline with structured domain knowledge:

```bash
node scripts/backfill-knowledge.mjs
```

This inserts 5 core entities (XMRT DAO, local-sb, Memory Pipeline, Fleet Chat, PFP) into `knowledge_entities` + `memory_contexts`, then triggers `vectorize-memory` for embeddings.

### local-sb Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `LOCAL_SUPABASE_PORT` | `54321` | Port for the local-sb server |
| `LOCAL_SUPABASE_HOST` | `127.0.0.1` | Bind address |
| `LOCAL_DATABASE_URL` | `postgres://postgres@127.0.0.1:5432/xmrt_suite` | Postgres connection |
| `SUPABASE_FUNCTIONS_DIR` | `../suite/supabase/functions` | Edge function source |

### Known local-sb Limitations

- **Realtime**: WebSocket stub broadcasts NOOP — no live subscriptions
- **Auth**: GoTrue stub provides basic token validation only — no signup/oauth flow
- **Storage**: File-backed stub — no CDN, no image transforms
- **Deno**: Cold-start per function call (~500ms) — no long-running workers
- **PostgREST edge cases**: Some advanced queries (`.single()`, enum `in.(...)`) may need workarounds — see `local-supabase/routes/rest.mjs`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run type-check` - TypeScript type checking

### Code Quality

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Jest** for unit testing
- **Playwright** for E2E testing

### Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

## 🛡️ Security

Security is a top priority. Please see our [Security Policy](SECURITY.md) for reporting vulnerabilities.

## 🚀 eliza-direct (ZeroClaw Integration)

A gatekeeper-free AI chat endpoint is available at `supabase/functions/eliza-direct/`.

- **Memory-aware**: Loads `conversation_memory`, `conversation_summaries`, and `conversation_context`
- **Gatekeeper-free**: No forced 5-iteration tool loop, no `🫎🔧` regex parsing
- **Tool discipline**: Tools only execute on native DeepSeek `tool_calls`
- **ZeroClaw-ready**: Designed for the AMD Developer Hackathon governance layer

```bash
curl -X POST https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/eliza-direct \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "What is XMRT?", "user_id": "user-123", "session_id": "sess-456"}'
```

Learn more: [github.com/xmrtdao/zero-claw](https://github.com/xmrtdao/zero-claw)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 📧 Email: support@devgrugold.com
- 💬 Discord: [Join our community](https://discord.gg/xmrt)
- 🐛 Issues: [GitHub Issues](https://github.com/xmrtdao/suite/issues)

---

Made with ❤️ by [DevGruGold](https://github.com/DevGruGold)

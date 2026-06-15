# XMRT Suite 🚀

**Live Site:** [https://xmrtdao.github.io/suite/](https://xmrtdao.github.io/suite/) | [Fleet Dashboard](https://relay.mobilemonero.com)

---

[![HF Space](https://img.shields.io/badge/🤗%20Hugging%20Face-Space-blue)](https://huggingface.co/spaces/XMRTDAO/suite)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black)](https://github.com/xmrtdao/suite)

[![CI/CD Pipeline](https://github.com/xmrtdao/suite/actions/workflows/ci.yml/badge.svg)](https://github.com/xmrtdao/suite/actions/workflows/ci.yml)
[![Security Analysis](https://github.com/xmrtdao/suite/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/xmrtdao/suite/actions/workflows/codeql-analysis.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-Powered Mining & DAO Management Platform for XMRT Ecosystem with real-time mining statistics and autonomous agent integration.

## ✨ Features

- 🤖 **AI-Powered Chat Functions**: Multiple AI gateways (OpenAI, DeepSeek, Gemini, etc.)
- ⛏️ **Mining Management**: Real-time mining statistics and management
- 🏛️ **DAO Governance**: Decentralized autonomous organization tools
- 📊 **Analytics Dashboard**: Comprehensive mining and performance analytics
- 🔧 **Edge Functions**: Supabase-powered serverless functions
- 🛡️ **Security**: Comprehensive security scanning and best practices

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
│   ├── components/         # React components
│   ├── services/          # Business logic
│   └── types/             # TypeScript types
├── supabase/              # Supabase configuration
│   ├── functions/         # 120+ Edge functions
│   └── migrations/        # Database migrations
├── scripts/               # Utility scripts
├── .github/               # GitHub Actions workflows
└── docs/                  # Documentation
```

The suite has **two deployment modes**:

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



## 🚀 eliza-direct (ZeroClaw Integration)

A new gatekeeper-free AI chat endpoint is available at `supabase/functions/eliza-direct/`.

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


## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📞 Support

- 📧 Email: support@devgrugold.com
- 💬 Discord: [Join our community](https://discord.gg/xmrt)
- 🐛 Issues: [GitHub Issues](https://github.com/xmrtdao/suite/issues)

---

Made with ❤️ by [DevGruGold](https://github.com/DevGruGold)
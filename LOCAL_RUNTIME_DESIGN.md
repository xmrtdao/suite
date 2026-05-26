# Local Edge Function Runtime Design

## Goal

Create a Node.js runtime that mirrors the Supabase Edge Functions API, allowing all 209 functions to run locally without Supabase.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Runtime (Node.js)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Function   │  │   Function   │  │   Function   │      │
│  │   Handler    │  │   Handler    │  │   Handler    │      │
│  │  (pfp-booking)│ │ (ai-chat)    │  │  (gossip-hub)│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  Runtime Core   │                        │
│                  │  (manager.mjs)  │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│     ┌─────────────────────┼─────────────────────┐          │
│     │                     │                     │           │
│     ▼                     ▼                     ▼           │
│ ┌────────┐         ┌────────────┐        ┌──────────┐      │
│ │ SQLite │         │   Secrets  │        │  Static  │      │
│ │   DB   │         │    Store   │        │  Files   │      │
│ └────────┘         └────────────┘        └──────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Runtime Manager (`manager.mjs`)

**Responsibilities:**
- Load function handlers from `supabase/functions/*/index.ts`
- Transpile TypeScript to JavaScript (using esbuild or ts-node)
- Route HTTP requests to correct function
- Provide Supabase-compatible API surface

**Key APIs to Mirror:**
```javascript
// Supabase Edge Function API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Local Runtime Equivalent
import { serve } from "./runtime/serve.js";
import { createClient } from "./runtime/supabase-client.js";
```

### 2. Supabase Client Shim (`supabase-client.js`)

**Purpose:** Intercept Supabase calls and redirect to local SQLite

```javascript
// Original (Supabase)
const supabase = createClient(URL, KEY);
const { data } = await supabase.from('leads').select('*');

// Local (SQLite)
const supabase = createClient(SQLITE_PATH, SECRETS);
const { data } = await supabase.from('leads').select('*');
// → Internally runs: SELECT * FROM leads;
```

**Implementation:**
```javascript
export function createClient(dbPath, secrets) {
  const db = new Database(dbPath); // better-sqlite3
  
  return {
    from(table) {
      return {
        select: (columns = '*') => {
          const sql = `SELECT ${columns} FROM ${table}`;
          const data = db.prepare(sql).all();
          return Promise.resolve({ data, error: null });
        },
        insert: (rows) => {
          // INSERT INTO table (...) VALUES (...)
        },
        update: (updates) => {
          // UPDATE table SET ... WHERE ...
        },
        delete: () => {
          // DELETE FROM table WHERE ...
        }
      };
    },
    // Storage, Auth, etc. shims
  };
}
```

### 3. Secrets Store

**Location:** `~/.hermes/supabase.env` or `.env.local`

**Format:**
```env
SUPABASE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=local_dev_key
RESEND_API_KEY=re_***
STRIPE_WEBHOOK_SECRET=whsec_***
MUAPI_API_KEY=***
```

### 4. SQLite Schema

**Critical Tables (from Task 3/4):**
- `leads` - PFP booking leads
- `bookings` - Confirmed bookings
- `agent_certifications` - XMRT University certs
- `agent_registry` - Fleet agent registry
- `fleet_messages` - Gossip hub messages
- `knowledge_pages` - System knowledge

## Migration Phases

### Phase 1: Standalone Functions (30 functions)

**No DB dependencies - just HTTP + secrets**

Examples:
- `coo-chat`, `gemini-chat`, `kimi-chat`, `openai-chat`
- `google-calendar`, `google-sheets`
- `mobile-miner-config`, `mobile-miner-script`

**Action:** Copy to local runtime, update imports

### Phase 2: Simple DB Functions (2 functions)

**Read-only or simple CRUD**

**Action:** Add SQLite shim, test queries

### Phase 3: Complex Functions (153 functions)

**Heavy Supabase integration**

**Action:** 
1. Build full Supabase client shim
2. Migrate critical tables to SQLite
3. Test each function category

## Implementation Steps

1. **Scaffold runtime** (`runtime/manager.mjs`)
2. **Add esbuild** for TS → JS transpilation
3. **Create Supabase client shim** (`runtime/supabase-client.js`)
4. **Set up SQLite** with critical tables
5. **Migrate Phase 1 functions** (30 standalone)
6. **Test end-to-end** (HTTP → Function → Response)
7. **Migrate Phase 2-3** (DB-dependent)

## File Structure

```
suite/
├── supabase/functions/       # Original functions (209)
├── runtime/
│   ├── manager.mjs           # Runtime core
│   ├── serve.js              # HTTP server (Deno.serve shim)
│   ├── supabase-client.js    # Supabase → SQLite shim
│   ├── secrets.js            # Environment variable loader
│   └── transpiler.js         # TypeScript compiler
├── local-db/
│   └── suite.sqlite          # SQLite database
├── .env.local                # Secrets
└── LOCAL_RUNTIME_DESIGN.md   # This document
```

## Testing Strategy

1. **Unit tests** for Supabase client shim
2. **Integration tests** for each function category
3. **E2E tests** comparing local vs Supabase responses

## Success Criteria

- ✅ All 209 functions load without errors
- ✅ HTTP requests route correctly
- ✅ Database queries return same results
- ✅ Secrets injected properly
- ✅ Performance acceptable (<100ms overhead)

---

**Next:** Task 3/4 - Identify critical DB tables for SQLite migration

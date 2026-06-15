#!/usr/bin/env node
/**
 * backfill-knowledge.mjs
 *
 * Seeds the Suite memory pipeline with comprehensive domain knowledge.
 * Batch-inserts structured entities into knowledge_entities + memory_contexts,
 * then triggers vectorize-memory for each inserted memory context.
 *
 * Usage:
 *   node scripts/backfill-knowledge.mjs                # auto-detect local-sb
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-knowledge.mjs
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "http://127.0.0.1:54321";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-service-role-key";

const ENTRIES = [
  {
    entity_name: "XMRT DAO Ecosystem",
    entity_type: "project",
    description:
      "XMRT DAO — a decentralized Monero mining collective governed by AI agents (Eliza/COO, DeepSeek/CTO, Gemini/CIO, OpenAI/CAO) with hardware node operators earning proportional XMR rewards. Core mission: AI governs, humans run hardware.",
    content: `# XMRT DAO

## Mission
Decentralized Monero (XMR) mining collective where AI agents govern operations
and humans run the hardware. Rewards are proportional to hash contributed.

## Core Agents
- **Eliza (COO)** — Chief Operating Officer, day-to-day coordination
- **DeepSeek (CTO)** — Technical architecture and tool building
- **Gemini (CIO)** — Information synthesis and research
- **OpenAI (CAO)** — Creative and administrative
- **Office Clerk** — Last-resort browser-based ML fallback (Phi-3-mini 3.8B)

## Key Repositories
- suite: Full-stack dashboard with 120+ edge functions
- relay: Node.js local webhook relay + fleet chat + cron engine
- zero-claw: AI chat endpoint (gatekeeper-free DeepSeek integration)
- xmrt-mesh: P2P libp2p fleet messaging layer

## Token / Economics
- XMRT (XMRT): ERC-20 governance token on base
- xUSD (xUSD): stablecoin for ecosystem transactions
- Rewards are paid in Monero (XMR), proportional to contributed hashrate`,
  },
  {
    entity_name: "local-sb (Local Supabase)",
    entity_type: "infrastructure",
    description:
      "local-sb is a drop-in local replacement for Supabase Cloud. Runs on port 54321 with PostgREST-compatible REST, Deno edge function runner, GoTrue auth stub, and storage stub — all without Docker or internet.",
    content: `# local-sb — Local Supabase Replacement

## What it is
An Express.js server at local-supabase/server.mjs that serves the exact same
path layout as supabase.co so the suite's @supabase/supabase-js client works
without code changes.

## Routes
- /rest/v1/*  — PostgREST-compatible REST (Node + pg)
- /functions/v1/*  — Deno edge function runner
- /auth/v1/*  — GoTrue-compatible stub
- /storage/v1/*  — Storage stub (local disk)
- /realtime/v1/*  — WebSocket stub (NOOP broadcast)

## Stack
- Express + pg (Postgres) for REST
- Deno subprocess per edge function call
- No Docker, no cloud dependency

## Configuration
- Port: 54321 (overridable via LOCAL_SUPABASE_PORT)
- Functions dir: suite/supabase/functions (overridable via SUPABASE_FUNCTIONS_DIR)
- Database: postgres://postgres@127.0.0.1:5432/xmrt_suite`,
  },
  {
    entity_name: "Memory & Vectorization Pipeline",
    entity_type: "infrastructure",
    description:
      "The Suite memory pipeline stores AI agent context in memory_contexts and knowledge_entities tables. New entries are auto-queued for vectorization (384-dim all-minilm embeddings stored as jsonb arrays) via the vectorize-memory edge function.",
    content: `# Memory & Vectorization Pipeline

## Tables
- **memory_contexts** — Per-session conversation memory with embeddings
- **knowledge_entities** — Curated knowledge graph (tools, projects, agents)
- **entity_relationships** — Directed edges between knowledge entities

## Vectorization Flow
1. An insert on memory_contexts fires a DB trigger that enqueues a
   vectorization_jobs row with status 'pending'
2. A cron job or manual call invokes vectorize-memory edge function
3. The edge function generates a 384-dim embedding (all-minilm via Gemini/Ollama)
4. The embedding is written back to the memory_contexts row as a jsonb array

## Backfill
Run: node scripts/backfill-knowledge.mjs
This seeds knowledge_entities + memory_contexts, then triggers vectorization.`,
  },
  {
    entity_name: "Fleet Chat / Agent Mesh",
    entity_type: "system",
    description:
      "Perpetual multi-agent conversation loop connecting Vex, Alice, Eliza (cloud), and Hermes via the relay at server.js:routeFleetMessage(). Agents are grounded with live system-state JSON to prevent hallucination.",
    content: `# Fleet Chat / Agent Mesh

## Agents
- **Vex** — Relay-local LLM agent (Ollama gemma4:2b), orchestrates fleet
- **Alice** — Parses inbound email, writes fleet_memory digests
- **Eliza** — Cloud-based (Eliza-Cloud / DeepSeek v4 flash)
- **Hermes** — Form-filling / contract agent

## Architecture
- routeFleetMessage() in relay/server.js chains Vex → Eliza → Alice → Hermes
- Each agent gets a grounding block: /health + /monitor + /ollama + /supervisor JSON
- 5-minute idle heartbeat keeps the loop alive when no messages flow
- DeepSeek fallback when Eliza-Cloud persona-dumps

## Memory
- app.fleet_memory table stores 1-line digests synthesized by Alice
- fleet_pulse tracks agent status and tool-counts`,
  },
  {
    entity_name: "Party Favor Photo (PFP)",
    entity_type: "project",
    description:
      "Photo booth rental business operated through the Suite. Includes daily email campaigns via Resend (6x/day UTC), Stripe payment processing, venue partnerships, and automated lead follow-up.",
    content: `# Party Favor Photo (PFP)

## Business
Photo booth rental for events (weddings, corporate, festivals) in the
Costa Rica market. Operating under the XMRT DAO umbrella.

## Suite Integration
- **pfp-booking** edge function — booking management
- **pfp-email-outreach** — automated campaign sending
- **pfp-dashboard** — business metrics dashboard
- **pfp-stripe-webhook** — payment processing
- **daily-campaign.mjs** — relay-based 6x/day email scheduler

## Campaign Schedule (UTC)
- 14:30, 16:30, 18:30, 20:30, 22:30, 00:30
- Sends from: bookings@partyfavorphoto.com via Resend native API`,
  },
];

async function main() {
  const headers = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  console.log(`🌱 Backfilling knowledge to ${SUPABASE_URL}`);

  // ── Step 1: Insert knowledge_entities ──
  const insertedIds = [];
  for (const entry of ENTRIES) {
    // Check if already exists
    const check = await fetch(
      `${SUPABASE_URL}/rest/v1/knowledge_entities?entity_name=eq.${encodeURIComponent(entry.entity_name)}&select=id`,
      { headers }
    );
    const existing = await check.json();
    if (existing && existing.length > 0) {
      console.log(`  ⏭️  "${entry.entity_name}" already exists (id=${existing[0].id})`);
      insertedIds.push(existing[0].id);
      continue;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_entities`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        entity_name: entry.entity_name,
        entity_type: entry.entity_type,
        description: entry.description,
        content: entry.content,
        confidence_score: 0.98,
        metadata: { source: "backfill-knowledge.mjs", backfilled_at: new Date().toISOString() },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ Failed to insert "${entry.entity_name}": ${res.status} ${err}`);
      continue;
    }
    const data = await res.json();
    console.log(`  ✅ "${entry.entity_name}" inserted (id=${data.id})`);
    insertedIds.push(data.id);
  }

  // ── Step 2: Insert memory_contexts (trigger vectorization) ──
  for (const entry of ENTRIES) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/memory_contexts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: "00000000-0000-0000-0000-000000000000",
        session_id: "backfill",
        context_type: "knowledge_entity_" + entry.entity_type,
        content: entry.content,
        metadata: {
          entity_name: entry.entity_name,
          source: "backfill-knowledge.mjs",
        },
        importance_score: 0.9,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ Failed to insert memory for "${entry.entity_name}": ${res.status} ${err}`);
      continue;
    }
    const data = await res.json();
    console.log(`  🧠 Memory context for "${entry.entity_name}" created (id=${data.id})`);
  }

  // ── Step 3: Trigger batch vectorization ──
  console.log("");
  console.log("⚡ Triggering batch vectorization...");
  const vecRes = await fetch(
    `${SUPABASE_URL}/functions/v1/vectorize-memory`,
    {
      method: "POST",
      headers,
    }
  );
  const vecResult = await vecRes.text();
  console.log(`  📡 vectorize-memory response (${vecRes.status}): ${vecResult}`);

  console.log("");
  console.log("✅ Backfill complete!");
}

main().catch((err) => {
  console.error("💥 Backfill failed:", err);
  process.exit(1);
});
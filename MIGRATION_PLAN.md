# Supabase → Local Migration Plan

## Executive Summary

**Goal:** Migrate from Supabase (hosted PostgreSQL + Edge Functions) to fully local stack (SQLite + Node.js runtime)

**Timeline:** 2-4 weeks

**Risk:** Low (phased approach, rollback available)

---

## Current State

| Component | Platform | Count |
|-----------|----------|-------|
| Edge Functions | Supabase | 209 |
| Database Tables | PostgreSQL | 296 |
| Critical Tables | (to migrate) | 9 |
| Standalone Functions | (no DB) | 30 |

---

## Target State

| Component | Platform | Count |
|-----------|----------|-------|
| Edge Functions | Node.js local | 209 |
| Database | SQLite | 9 tables |
| Runtime | manager.mjs | 1 |
| Secrets | .env.local | ~10 keys |

---

## Phase 0: Preparation (Week 1)

### Day 1-2: Environment Setup

```bash
mkdir -p suite/runtime suite/local-db
cd suite
npm init -y
npm install better-sqlite3 express dotenv cors
npm install -D esbuild typescript @types/node
```

**Deliverables:** Runtime scaffold, dependencies, secrets configured

### Day 3-4: SQLite Database Setup

```bash
sqlite3 local-db/suite.sqlite < critical-tables-schema.sql
sqlite3 local-db/suite.sqlite ".tables"
```

**Deliverables:** SQLite DB created, 9 critical tables, seed data

### Day 5-7: Supabase Client Shim

**File:** `runtime/supabase-client.js`

Mirror Supabase API: `createClient()`, `from().select()`, `insert()`, etc.

**Deliverables:** Supabase API shimmed, unit tests passing

---

## Phase 1: Standalone Functions (Week 2)

**30 functions with no DB dependencies**

### Day 8-10: Runtime Core

**File:** `runtime/manager.mjs`

HTTP server + function routing + TypeScript transpilation

### Day 11-12: Migrate Phase 1 Functions

coo-chat, deepseek-chat, gemini-chat, kimi-chat, openai-chat, google-calendar, google-sheets, mobile-miner-config, mobile-miner-script, etc.

### Day 13-14: Testing & Validation

Load testing, response parity, performance benchmarks

---

## Phase 2: Simple DB Functions (Week 3)

**2 functions with basic CRUD**

### Day 15-16: Migrate Phase 2 Functions

Test Supabase client shim with each function

### Day 17-18: Data Migration

Export from Supabase → Transform → Import to SQLite

### Day 19-21: Testing & Validation

E2E tests, data consistency, performance benchmarks

---

## Phase 3: Complex Functions (Week 4)

**153 functions with heavy Supabase integration**

### Day 22-24: Advanced Shim Features

Transactions, RLS emulation, real-time subscriptions, storage buckets, auth

### Day 25-27: Migrate Phase 3 Functions

Batch by category: fleet, AI/chat, Google, Superduper, Vercel, infrastructure

### Day 28-29: Final Testing

Load testing, stress testing, failover testing, rollback testing

---

## Phase 4: Cutover (Week 5)

### Day 30: Pre-Cutover Checklist

- [ ] All 209 functions tested
- [ ] All 9 tables migrated
- [ ] Data integrity verified
- [ ] Performance benchmarks met
- [ ] Rollback plan tested

### Day 31: Cutover

1. Stop Supabase functions
2. Start local runtime
3. Verify health
4. Monitor for 1 hour

### Day 32-35: Monitoring & Optimization

Error rates, response times, memory usage, database performance

---

## Rollback Plan

If issues occur:

```bash
# Stop local runtime
pkill -f manager.mjs

# Re-enable Supabase functions
# (via Supabase dashboard)

# Verify Supabase responding
curl https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/health
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Functions migrated | 209/209 |
| Tables migrated | 9/9 critical |
| Response time | <100ms overhead |
| Error rate | <1% |
| Data integrity | 100% |
| Rollback time | <5 min |

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss | High | Backup before cutover, rollback plan |
| Performance degradation | Medium | Load testing, optimization phase |
| Function incompatibility | Medium | Phased migration, testing |

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-26  
**Owner:** Hermes (Migration Sprint Lead)

# XMRT DAO - Monthly Financial Review Process

## Overview

Monthly review process to track progress toward:
- **Party Favor Photo:** $10K MRR by Q4 2026
- **XMRT-DAO:** $50K ARR by Q4 2026

---

## 📅 Schedule

**When:** Last Friday of each month, 2-4 PM  
**Duration:** 2 hours  
**Attendees:** Joey (XMRT DAO Tech Lead), Hermes (AI Agent)

---

## 📊 Data Collection (30 min)

### Party Favor Photo Metrics

| Metric | Source | Query |
|--------|--------|-------|
| Total Leads | Supabase | `SELECT COUNT(*) FROM pfp_leads WHERE created_at >= date_trunc('month', now())` |
| Leads Contacted | Supabase | `SELECT COUNT(*) FROM pfp_leads WHERE status = 'contacted'` |
| Active Partnerships | Supabase | `SELECT COUNT(*) FROM pfp_partnerships WHERE status = 'partner'` |
| Bookings Count | Supabase | `SELECT COUNT(*) FROM bookings WHERE created_at >= date_trunc('month', now())` |
| Revenue | Stripe + Supabase | `SELECT SUM(amount) FROM bookings WHERE created_at >= date_trunc('month', now())` |
| MRR | Calculation | `SUM(recurring_revenue)` |

### XMRT-DAO Metrics

| Metric | Source | Query |
|--------|--------|-------|
| University Enrollments | Supabase | `SELECT COUNT(*) FROM xmrt_university_enrollments` |
| University Revenue | Stripe | `SELECT SUM(amount) FROM payments WHERE product = 'university'` |
| MUAPI Generations | Supabase | `SELECT COUNT(*) FROM muapi_generations` |
| MUAPI Revenue | Supabase | `SELECT SUM(cost) FROM muapi_generations` |
| Fleet SaaS Clients | Manual | Count of active contracts |
| Fleet SaaS Revenue | Stripe | `SELECT SUM(amount) WHERE product = 'fleet_saas'` |
| Consulting Contracts | Manual | Count of active engagements |
| Consulting Revenue | Invoices | Sum of paid invoices |

---

## 📝 Review Template

```markdown
# Monthly Financial Review - [Month Year]

## Date
[Review Date]

## Attendees
- [Names]

---

## 📊 Performance Summary

### Party Favor Photo
| Metric | Target | Actual | Progress |
|--------|--------|--------|----------|
| MRR | $10,000 | $X,XXX | XX% |
| Active Partners | 10 | X | XX% |
| Bookings (month) | 20 | X | XX% |
| Revenue (month) | $8,000 | $X,XXX | XX% |

### XMRT-DAO
| Metric | Target | Actual | Progress |
|--------|--------|--------|----------|
| ARR | $50,000 | $XX,XXX | XX% |
| University Revenue | $X,XXX | $X,XXX | XX% |
| MUAPI Revenue | $X,XXX | $X,XXX | XX% |
| Fleet SaaS MRR | $X,XXX | $X,XXX | XX% |
| Consulting Revenue | $X,XXX | $X,XXX | XX% |

---

## ✅ Key Wins

1. [Win 1]
2. [Win 2]
3. [Win 3]

---

## ⚠️ Challenges

1. [Challenge 1]
2. [Challenge 2]

---

## 🎯 Goals Met

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

---

## ❌ Goals Missed

- [ ] Goal 1 (reason)
- [ ] Goal 2 (reason)

---

## 📋 Action Items

| Task | Owner | Due Date | Priority |
|------|-------|----------|----------|
| [Task] | [Name] | [Date] | High/Med/Low |

---

## 🎯 Next Month Goals

| Goal | Target | Metric |
|------|--------|--------|
| [Goal 1] | [Number] | [Metric] |
| [Goal 2] | [Number] | [Metric] |

---

## 📝 Notes

[Any additional observations, insights, or decisions]
```

---

## 🔧 Supabase Queries

### Current Month Review

```sql
-- Insert monthly review
INSERT INTO public.monthly_financial_reviews (
    review_month,
    pfp_leads_total,
    pfp_partnerships_active,
    pfp_bookings_count,
    pfp_revenue,
    pfp_mrr,
    xmt_university_enrollments,
    xmt_university_revenue,
    xmt_muapi_generations,
    xmt_muapi_revenue,
    xmt_fleet_saas_clients,
    xmt_fleet_saas_revenue,
    xmt_consulting_contracts,
    xmt_consulting_revenue,
    goals_met,
    goals_missed,
    key_wins,
    challenges,
    action_items,
    next_month_goals,
    notes,
    reviewed_by
) VALUES (
    '2026-05-01',  -- review_month
    150,            -- pfp_leads_total
    5,              -- pfp_partnerships_active
    8,              -- pfp_bookings_count
    4000.00,        -- pfp_revenue
    3500.00,        -- pfp_mrr
    12,             -- xmt_university_enrollments
    3588.00,        -- xmt_university_revenue
    450,            -- xmt_muapi_generations
    450.00,         -- xmt_muapi_revenue
    0,              -- xmt_fleet_saas_clients
    0.00,           -- xmt_fleet_saas_revenue
    0,              -- xmt_consulting_contracts
    0.00,           -- xmt_consulting_revenue
    ['Lead gen deployed'],  -- goals_met
    ['Fleet SaaS launch'],  -- goals_missed
    ['Melissa partnership', '150 leads scraped'],  -- key_wins
    ['Vex deployment delay'],  -- challenges
    '[{"task":"Deploy lead-gen","owner":"Vex","due_date":"2026-06-15","priority":"High"}]'::jsonb,
    '[{"goal":"10 partners","target":10,"metric":"pfp_partnerships"}]'::jsonb,
    'Strong month for PFP, awaiting XMRT deployments',
    'Hermes'
);
```

### Dashboard Query

```sql
-- View goal progress
SELECT 
    review_month,
    pfp_mrr,
    pfp_mrr_target,
    pfp_mrr_progress,
    xmt_total_arr,
    xmt_arr_target,
    xmt_arr_progress
FROM public.financial_goal_dashboard
ORDER BY review_month DESC
LIMIT 12;
```

### Revenue Trends

```sql
-- View monthly trends
SELECT 
    review_month,
    total_revenue,
    mom_growth_pct,
    ytd_revenue
FROM public.monthly_revenue_trends
ORDER BY review_month DESC
LIMIT 12;
```

### Revenue by Stream

```sql
-- View revenue breakdown
SELECT 
    stream,
    SUM(revenue) AS total_revenue,
    AVG(revenue) AS avg_monthly
FROM public.revenue_by_stream
GROUP BY stream
ORDER BY total_revenue DESC;
```

---

## 🤖 Automation

### Cron Job (Monthly)

Create a cron job to remind and auto-collect data:

```bash
# Last Friday of every month at 2 PM
0 14 * * 5 [ $(date +\%d) -ge 25 ] && hermes run monthly-review
```

### Edge Function (Auto-Collection)

Create `monthly-review-collector` edge function:

```typescript
// Runs on last Friday of month
// Queries all revenue tables
// Creates draft review record
// Notifies team to complete review
```

---

## 📈 Quarterly Goals

### Q2 2026 (April-June)
- [ ] PFP: $3K MRR (30% of goal)
- [ ] PFP: 5 active partners
- [ ] XMRT: Deploy all edge functions
- [ ] XMRT: $10K ARR (20% of goal)

### Q3 2026 (July-September)
- [ ] PFP: $6K MRR (60% of goal)
- [ ] PFP: 8 active partners
- [ ] XMRT: 3 Fleet SaaS clients
- [ ] XMRT: $25K ARR (50% of goal)

### Q4 2026 (October-December)
- [ ] PFP: $10K MRR (100% of goal)
- [ ] PFP: 12 active partners
- [ ] XMRT: 10 Fleet SaaS clients
- [ ] XMRT: $50K ARR (100% of goal)

---

## 🎯 Success Criteria

### On Track
- PFP MRR progress ≥ 25% per quarter
- XMRT ARR progress ≥ 25% per quarter
- All action items completed

### At Risk
- PFP MRR progress < 15% per quarter
- XMRT ARR progress < 15% per quarter
- Action items overdue > 2 weeks

### Intervention Needed
- PFP MRR progress < 10% per quarter
- XMRT ARR progress < 10% per quarter
- Review: Pivot strategy, increase resources

---

## 📞 Contact

**Maintained by:** Hermes (XMRT DAO)  
**Review Schedule:** Last Friday of each month  
**Schema:** `suite/monthly_financial_review_schema.sql`

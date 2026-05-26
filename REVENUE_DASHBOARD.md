# XMRT DAO + Party Favor Photo - Revenue Dashboard

## Overview

Track weekly revenue across both business units:
- **Party Favor Photo:** $10K MRR target by Q4 2026
- **XMRT-DAO:** $50K ARR target by Q4 2026

---

## 📊 TRACKING SPREADSHEET (Google Sheets / Supabase)

### Sheet 1: Weekly Summary

| Week | PFP Revenue | XMRT Revenue | Total | PFP Goal | XMRT Goal | Status |
|------|-------------|--------------|-------|----------|-----------|--------|
| 2026-W22 (May 26-Jun 1) | $996 | $0 | $996 | $2,500 | $0 | 🟡 On Track |
| 2026-W23 (Jun 2-8) | | | | $2,500 | $1,000 | |
| 2026-W24 (Jun 9-15) | | | | $2,500 | $1,000 | |
| 2026-W25 (Jun 16-22) | | | | $2,500 | $1,000 | |
| 2026-W26 (Jun 23-29) | | | | $2,500 | $1,000 | |

**Goal Progress:**
- PFP Monthly Target: $10,000
- XMRT Monthly Target: $4,167 ($50K/12)

---

### Sheet 2: Party Favor Photo - Detailed

| Date | Client | Event Type | Package | Base Price | Upsells | Total | Status | Source |
|------|--------|------------|---------|------------|---------|-------|--------|--------|
| 2026-05-26 | Melissa Dotimas | ANGP (2 events) | 2hr Studio | $996 | $0 | $996 | ⏳ Pending | Website |
| | | | | | | | | |

**Upsell Tracking:**
| Upsell Type | Attach Rate | Avg Value | Monthly Target |
|-------------|-------------|-----------|----------------|
| Premium Prints | 30% | $100 | $900 |
| Photo Albums | 20% | $200 | $1,200 |
| Rush Delivery | 10% | $250 | $750 |

**Lead Source Tracking:**
| Source | Leads | Conversions | Conversion Rate | Revenue |
|--------|-------|-------------|-----------------|---------|
| Website | | | | |
| Instagram | | | | |
| Google My Business | | | | |
| School Partnerships | | | | |
| Referrals | | | | |
| Facebook | | | | |

---

### Sheet 3: XMRT-DAO - Detailed

| Date | Revenue Stream | Customer | Amount | Type | Status |
|------|----------------|----------|--------|------|--------|
| | XMRT University Cert | | $299 | One-time | |
| | MUAPI Media Gen | | $0.50/gen | Usage | |
| | API Endpoint | | $99/mo | Recurring | |
| | Enterprise SaaS | | $999/mo | Recurring | |
| | Consulting | | $5,000 | One-time | |
| | GitHub Sponsor | | $50-1000/mo | Recurring | |

**Revenue Stream Targets:**
| Stream | Price | Customers Needed | Monthly Target |
|--------|-------|-----------------|----------------|
| XMRT University | $299/cert | 17 certs | $5,000 |
| MUAPI | $0.50/gen | 10,000 gens | $5,000 |
| API Endpoints | $99/mo | 50 customers | $5,000 |
| Enterprise SaaS | $999/mo | 5 customers | $5,000 |
| Consulting | $5,000 | 1 contract | $5,000 |
| Sponsorships | $250/mo avg | 20 sponsors | $5,000 |

---

### Sheet 4: Monthly Review

| Month | PFP Revenue | PFP Goal | Variance | XMRT Revenue | XMRT Goal | Variance | Total | Actions |
|-------|-------------|----------|----------|--------------|-----------|----------|-------|---------|
| June 2026 | | $10,000 | | $4,167 | $4,167 | | | |
| July 2026 | | $10,000 | | $4,167 | $4,167 | | | |
| August 2026 | | $10,000 | | $4,167 | $4,167 | | | |
| Q4 2026 | | $10,000 | | $4,167 | $4,167 | | | |

**Review Questions:**
1. Did we hit revenue targets? If not, why?
2. Which lead sources performed best?
3. What upsells had highest attach rate?
4. Which XMRT revenue streams gained traction?
5. What experiments to run next month?

---

## 🔧 IMPLEMENTATION OPTIONS

### Option A: Google Sheets (Recommended for Start)
**Pros:** Free, easy, shareable, mobile-friendly  
**Cons:** Manual entry, no automation

**Setup:**
1. Create Google Sheet with 4 tabs above
2. Share with accounting/email
3. Update every Friday (15 min)
4. Review 1st of each month (30 min)

**Template Link:** [Create new]

---

### Option B: Supabase Dashboard (Automated)
**Pros:** Auto-tracking, API integration, real-time  
**Cons:** Requires dev time, Supabase costs

**Schema:**
```sql
-- Revenue tracking tables
CREATE TABLE revenue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    business_unit TEXT NOT NULL, -- 'pfp' or 'xmrt'
    revenue_stream TEXT NOT NULL,
    customer_name TEXT,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL, -- 'one-time' or 'recurring'
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    source TEXT, -- lead source for PFP
    notes TEXT
);

CREATE TABLE monthly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month DATE NOT NULL,
    business_unit TEXT NOT NULL,
    goal_amount DECIMAL(10,2) NOT NULL,
    actual_amount DECIMAL(10,2) DEFAULT 0,
    variance DECIMAL(10,2) GENERATED ALWAYS AS (actual_amount - goal_amount) STORED
);

CREATE VIEW weekly_summary AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    business_unit,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count
FROM revenue_entries
WHERE status = 'paid'
GROUP BY week, business_unit;
```

**Edge Function:** `/revenue-track`
- POST new revenue entries
- GET weekly/monthly summaries
- Auto-calculate goal variance

---

### Option C: Hybrid (Sheets + Supabase)
**Pros:** Best of both worlds  
**Cons:** More complex

**Setup:**
1. Supabase tracks transactions (auto from Stripe/webhooks)
2. Google Sheets for manual entries + analysis
3. Weekly export from Supabase → Sheets
4. Monthly review in Sheets

---

## 📈 KEY METRICS TO TRACK

### Party Favor Photo
| Metric | Target | Current |
|--------|--------|---------|
| Leads/Month | 10 | 1 (Melissa) |
| Conversion Rate | 30% | TBD |
| Avg Booking Value | $500 | $498 |
| Upsell Attach Rate | 50% | 0% |
| Referral Rate | 20% | 0% |

### XMRT-DAO
| Metric | Target | Current |
|--------|--------|---------|
| API Customers | 50 | 0 |
| Cert Students | 17/month | 0 |
| MUAPI Gens | 10,000/month | 0 |
| Enterprise Clients | 5 | 0 |
| Consulting Deals | 1/month | 0 |

---

## 🔄 UPDATE SCHEDULE

| Task | Frequency | Time | Owner |
|------|-----------|------|-------|
| Enter new revenue | Daily (as happens) | 2 min | You |
| Review weekly summary | Every Friday | 10 min | You |
| Update lead sources | Every Monday | 5 min | You |
| Monthly review | 1st of month | 30 min | You |
| Goal adjustment | Quarterly | 1 hour | You |

---

## 🎯 ALERTS (Optional Automation)

| Trigger | Action |
|---------|--------|
| Revenue < 50% of goal (mid-month) | Email alert |
| New booking received | Slack/Telegram notification |
| Upsell added | Celebration message |
| Goal achieved | Fleet broadcast |

---

**Owner:** Joey (XMRT DAO)  
**Created:** 2026-05-26  
**First Review:** June 2, 2026 (Friday)
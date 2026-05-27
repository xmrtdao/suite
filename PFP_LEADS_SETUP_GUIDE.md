# Party Favor Photo - Leads Table Setup Guide

## Overview

This schema creates the `pfp_leads` table in Supabase for tracking wedding planner and venue partnership leads.

---

## 📋 TABLE STRUCTURE

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Contact email |
| name | TEXT | Contact name |
| company | TEXT | Business name |
| phone | TEXT | Phone number |
| website | TEXT | Website URL |
| category | TEXT | wedding_planner, venue, photographer, etc. |
| source | TEXT | exa_search, manual_theknot, etc. |
| location | TEXT | e.g., "Arlington VA", "Dallas TX" |
| status | TEXT | new, contacted, responded, partner, etc. |

### Partnership Tracking

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| commission_rate | DECIMAL | 15.00 | % commission per referral |
| referrals_sent | INT | 0 | Number of client referrals |
| bookings_completed | INT | 0 | Converted bookings |
| total_revenue | DECIMAL | 0.00 | Total revenue generated |
| commission_owed | DECIMAL | 0.00 | Unpaid commission |
| commission_paid | DECIMAL | 0.00 | Paid commission |

### Outreach Tracking

| Field | Type | Description |
|-------|------|-------------|
| first_contacted_at | TIMESTAMPTZ | Initial outreach date |
| last_contacted_at | TIMESTAMPTZ | Most recent contact |
| responded_at | TIMESTAMPTZ | When they replied |
| meeting_date | TIMESTAMPTZ | Scheduled meeting |
| partnership_start_date | TIMESTAMPTZ | Partnership began |

---

## 🚀 DEPLOYMENT

### Option 1: Supabase SQL Editor (Recommended)

1. Go to: https://vawouugtzwmejxqkeqqj.supabase.co/sql
2. Copy contents of `pfp_leads_schema.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Verify table created

### Option 2: Supabase CLI

```bash
cd /path/to/suite
supabase db push --project-ref vawouugtzwmejxqkeqqj
```

### Option 3: Edge Function (Automated)

Once `lead-generator` edge function is deployed, it will auto-create the table if it doesn't exist.

---

## ✅ VERIFICATION

After deployment, verify the table exists:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'pfp_leads';

-- Check row count
SELECT COUNT(*) FROM public.pfp_leads;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'pfp_leads';
```

---

## 🔧 USAGE EXAMPLES

### Insert a New Lead

```sql
INSERT INTO public.pfp_leads (
    email, name, company, category, source, location, status
) VALUES (
    'planner@example.com',
    'Jane Doe',
    'Elegant Events',
    'wedding_planner',
    'exa_search',
    'Arlington VA',
    'new'
);
```

### Update Lead Status

```sql
UPDATE public.pfp_leads
SET 
    status = 'contacted',
    first_contacted_at = NOW(),
    last_contacted_at = NOW()
WHERE email = 'planner@example.com';
```

### Mark as Partner

```sql
UPDATE public.pfp_leads
SET 
    status = 'partner',
    partnership_start_date = NOW(),
    responded_at = NOW()
WHERE email = 'planner@example.com';
```

### Track a Referral

```sql
UPDATE public.pfp_leads
SET 
    referrals_sent = referrals_sent + 1,
    last_contacted_at = NOW()
WHERE email = 'planner@example.com';
```

### Track a Booking

```sql
UPDATE public.pfp_leads
SET 
    bookings_completed = bookings_completed + 1,
    total_revenue = total_revenue + 500.00,
    commission_owed = commission_owed + 75.00
WHERE email = 'planner@example.com';
```

### Mark Commission Paid

```sql
UPDATE public.pfp_leads
SET 
    commission_paid = commission_paid + 75.00,
    commission_owed = commission_owed - 75.00
WHERE email = 'planner@example.com';
```

---

## 📊 VIEWS

### Active Partners

```sql
SELECT * FROM public.pfp_active_partners;
```

Shows all current partners with revenue/commission tracking.

### Needs Follow-Up

```sql
SELECT * FROM public.pfp_needs_followup;
```

Shows leads that need outreach, sorted by priority.

---

## 📈 QUERIES FOR REPORTING

### Leads by Status

```sql
SELECT status, COUNT(*) as count
FROM public.pfp_leads
GROUP BY status
ORDER BY count DESC;
```

### Leads by Location

```sql
SELECT location, COUNT(*) as count
FROM public.pfp_leads
WHERE category = 'wedding_planner'
GROUP BY location
ORDER BY count DESC;
```

### Partnership Revenue

```sql
SELECT 
    name,
    company,
    location,
    referrals_sent,
    bookings_completed,
    total_revenue,
    commission_owed,
    commission_paid
FROM public.pfp_leads
WHERE status = 'partner'
ORDER BY total_revenue DESC;
```

### Conversion Funnel

```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM public.pfp_leads
GROUP BY status;
```

---

## 🔐 SECURITY

### Row Level Security (RLS)

The schema includes RLS policies:

- **Authenticated users:** Can read/write leads
- **Service role:** Full access (for edge functions)
- **Anonymous:** No access

### API Access

Edge functions use service role key to insert leads automatically.

Dashboard/users use authenticated user key with RLS policies.

---

## 📝 NOTES

- Email is indexed for fast lookups and duplicate checking
- Status field drives workflow automation
- Metadata JSONB stores flexible data (snippets, social links, etc.)
- Updated_at trigger auto-updates on every change
- Views simplify common queries

---

## 🦑 INTEGRATION

### Lead Generator Edge Function

When deployed, `lead-generator` will:
1. Search Exa.ai for wedding planners
2. Extract emails
3. Insert into `pfp_leads` table
4. Set status = 'new'

### Outreach Automation

Future edge functions can:
1. Query `pfp_needs_followup` view
2. Send emails via Resend
3. Update `last_contacted_at`
4. Track responses

### Dashboard

Build a dashboard showing:
- Total leads
- Conversion rate
- Active partners
- Revenue pipeline
- Commission owed/paid

---

## 📞 SUPPORT

**Maintained by:** Hermes (XMRT DAO)  
**For:** Party Favor Photo partnership program  
**Schema:** `suite/pfp_leads_schema.sql`

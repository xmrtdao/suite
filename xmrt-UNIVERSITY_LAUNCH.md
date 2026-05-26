# XMRT University - Certification Launch Plan

## Overview

Productize the existing 6-module XMRT University curriculum as a paid certification program.

**Price:** $299 per certification  
**Target:** 17 students/month = $5,000 MRR  
**Goal:** $50K ARR contribution by Q4 2026

---

## 🎓 CURRICULUM (Already Built!)

### 6 Modules

| Module | Topic | Status |
|--------|-------|--------|
| 1 | XMRT DAO Introduction | ✅ Complete |
| 2 | Fleet Architecture | ✅ Complete |
| 3 | Supabase Edge Functions | ✅ Complete |
| 4 | Cloudflare Workers | ✅ Complete |
| 5 | Agent Orchestration | ✅ Complete |
| 6 | Mesh Networking | ✅ Complete |

**Total Content:** Existing in xmrt-university skill + edge function

---

## 💰 PRICING TIERS

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| **Self-Study** | $299 | 6 modules, final exam, certificate | Individuals |
| **Cohort** | $599 | Self-study + weekly group calls, code review | Serious learners |
| **Enterprise** | $2,999 | Cohort + custom integration, priority support | Companies |

**Revenue Mix Target:**
- 80% Self-Study (14 students × $299 = $4,186)
- 15% Cohort (2 students × $599 = $1,198)
- 5% Enterprise (1 student × $2,999 = $2,999)
- **Total: $8,383/month** (exceeds $5K target)

---

## 🔧 TECHNICAL IMPLEMENTATION

### Supabase Tables

```sql
CREATE TABLE xmrt_university_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    tier TEXT NOT NULL, -- self_study, cohort, enterprise
    status TEXT DEFAULT 'active', -- active, completed, cancelled
    payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
    stripe_session_id TEXT,
    progress JSONB DEFAULT '{"modules": {}}',
    certificate_id TEXT UNIQUE,
    completed_at TIMESTAMPTZ,
    cohort_id UUID REFERENCES cohorts(id)
);

CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_students INT DEFAULT 20,
    enrolled_count INT DEFAULT 0,
    status TEXT DEFAULT 'upcoming' -- upcoming, active, completed
);

CREATE TABLE module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id),
    module_number INT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    exam_score INT, -- 0-100
    passed BOOLEAN DEFAULT FALSE
);
```

### Edge Function: `/xmrt-university`

**Actions:**
- `enroll` - Create enrollment + Stripe session
- `progress` - Track module completion
- `exam` - Submit final exam
- `certificate` - Generate certificate ID
- `verify` - Verify certificate (public)

```typescript
// supabase/functions/xmrt-university/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRICING = {
  self_study: 299,
  cohort: 599,
  enterprise: 2999,
};

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  const { action, ...data } = await req.json();

  switch (action) {
    case 'enroll':
      // Create enrollment + Stripe checkout session
      break;
    case 'progress':
      // Update module completion
      break;
    case 'exam':
      // Grade exam, issue certificate if passed
      break;
    case 'verify':
      // Public certificate verification
      break;
    case 'list_cohorts':
      // Return upcoming cohorts
      break;
  }
});
```

---

## 📧 ENROLLMENT FLOW

### Step 1: Landing Page
**URL:** university.xmrt-dao.com (or GitHub Pages)

**Content:**
- Hero: "Become an XMRT DAO Certified Agent Developer"
- 6 module descriptions
- Pricing tiers
- Student testimonials (add as we get them)
- FAQ
- CTA: "Enroll Now" → Stripe

### Step 2: Stripe Checkout
**Products:**
- XMRT University - Self Study ($299)
- XMRT University - Cohort ($599)
- XMRT University - Enterprise ($2,999)

**Webhook:** `checkout.session.completed` → Create enrollment

### Step 3: Welcome Email
```
Subject: Welcome to XMRT University! 🎓

Hi [Name],

You're enrolled in XMRT University - [Tier]!

📚 ACCESS YOUR COURSE:
Link: university.xmrt-dao.com/dashboard
Login: [student_email]

📋 CURRICULUM:
Module 1: XMRT DAO Introduction
Module 2: Fleet Architecture
Module 3: Supabase Edge Functions
Module 4: Cloudflare Workers
Module 5: Agent Orchestration
Module 6: Mesh Networking

🎯 NEXT STEPS:
1. Log into your dashboard
2. Start Module 1
3. Complete all 6 modules
4. Pass the final exam (70% to pass)
5. Receive your certificate!

Questions? Reply to this email!

- The XMRT University Team
```

### Step 4: Module Delivery
**Option A:** Host on Supabase Edge Function (dynamic)  
**Option B:** GitHub Pages (static content)  
**Option C:** Notion (quick setup)

**Recommended:** GitHub Pages + Supabase for tracking

---

## 🎓 CERTIFICATE SYSTEM

### Certificate Format
```
╔══════════════════════════════════════════════════════════╗
║           XMRT UNIVERSITY                                ║
║                                                          ║
║           CERTIFICATE OF COMPLETION                      ║
║                                                          ║
║   This certifies that                                    ║
║                                                          ║
║           [STUDENT NAME]                                 ║
║                                                          ║
║   has successfully completed all 6 modules and           ║
║   passed the final examination with a score of [X]%.     ║
║                                                          ║
║   Certificate ID: XMRT-CERT-[RANDOM8]                    ║
║   Issue Date: [DATE]                                     ║
║                                                          ║
║   Verify: university.xmrt-dao.com/verify/[ID]            ║
║                                                          ║
║   ________________________                               ║
║   Joey, Founder                                            ║
║   XMRT DAO                                                 ║
╚══════════════════════════════════════════════════════════╝
```

### Verification Endpoint
```
GET https://university.xmrt-dao.com/verify/XMRT-CERT-ABCD1234

Response:
{
  "valid": true,
  "student_name": "John Doe",
  "completed_at": "2026-06-15",
  "tier": "self_study",
  "exam_score": 85
}
```

---

## 📢 MARKETING PLAN

### Channel 1: GitHub (Organic)
- Add certificate badge to xmrt-university repo README
- Link in all XMRT DAO repos
- Mention in fleet chat

### Channel 2: Twitter/X
- Weekly posts about modules
- Student success stories
- Certificate showcases

### Channel 3: Fleet Broadcast
- Announce to all agents
- Alice/Vex can recommend to users

### Channel 4: Product Hunt Launch
- Launch as "XMRT University - Learn Agent Development"
- Target: 100 signups day 1

### Channel 5: LinkedIn
- Joey's profile + XMRT DAO page
- Module snippets as carousels

---

## 📊 LAUNCH TIMELINE

| Week | Action | Owner |
|------|--------|-------|
| Week 1 (May 26-Jun 1) | Set up Supabase tables + edge function | Hermes/Alice |
| Week 1 | Create Stripe products + webhooks | Joey |
| Week 2 (Jun 2-8) | Build landing page (GitHub Pages) | Hermes |
| Week 2 | Write welcome email sequence | Hermes |
| Week 3 (Jun 9-15) | Soft launch (fleet + GitHub) | Joey |
| Week 3 | Collect feedback, iterate | All |
| Week 4 (Jun 16-22) | Public launch (Product Hunt, Twitter) | Joey |
| Week 4+ | Ongoing marketing | All |

---

## 🎯 SUCCESS METRICS

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Enrollments | 10 | 50 |
| Completion Rate | 40% | 50% |
| Revenue | $3,000 | $15,000 |
| Certificates Issued | 4 | 25 |
| Enterprise Deals | 0 | 2 |

---

## 🚀 LAUNCH CHECKLIST

- [ ] Create Supabase tables (enrollments, cohorts, completions)
- [ ] Deploy xmrt-university edge function
- [ ] Set up Stripe products + webhooks
- [ ] Build landing page (GitHub Pages)
- [ ] Create certificate template
- [ ] Write email sequences (welcome, module reminders, completion)
- [ ] Test full flow (enroll → pay → learn → certificate)
- [ ] Soft launch to fleet
- [ ] Public launch (Product Hunt, Twitter, LinkedIn)
- [ ] Set up weekly enrollment report

---

**Owner:** Joey (XMRT DAO)  
**Created:** 2026-05-26  
**Launch Target:** June 16, 2026 (soft), June 23, 2026 (public)
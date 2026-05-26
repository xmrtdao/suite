# MUAPI - Paid Media Generation Service

## Overview

Productize MUAPI (AI media generation) as a paid service.

**Current:** Free API with key `060188b635eecb7ba11b3b634d3f373463c458cfb9cd0624cdab69a197e5b119`  
**Target:** $0.10-1.00 per generation = $5,000/month (10,000 gens)

---

## 💰 PRICING MODEL

### Pay-Per-Use (Recommended for Launch)

| Media Type | Price | Avg Cost | Margin |
|------------|-------|----------|--------|
| Image Generation | $0.50/image | $0.10 | 80% |
| Video Generation | $2.00/video | $0.50 | 75% |
| Talking Avatar | $5.00/video | $1.50 | 70% |
| Bulk (100+ gens) | $0.30/image | $0.10 | 67% |

### Subscription Tiers

| Tier | Price | Included | Overage | Best For |
|------|-------|----------|---------|----------|
| **Starter** | $29/mo | 50 images | $0.40/image | Hobbyists |
| **Pro** | $99/mo | 200 images + 20 videos | $0.30/image | Content creators |
| **Business** | $299/mo | 1000 images + 100 videos + 10 avatars | $0.20/image | Agencies |
| **Enterprise** | $999/mo | Unlimited | None | High volume |

**Revenue Target Mix:**
- 50 Starter × $29 = $1,450
- 20 Pro × $99 = $1,980
- 5 Business × $299 = $1,495
- 2 Enterprise × $999 = $1,998
- **Total: $6,923/month** (exceeds $5K target)

---

## 🔧 TECHNICAL IMPLEMENTATION

### Supabase Tables

```sql
CREATE TABLE muapi_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    tier TEXT DEFAULT 'free', -- free, starter, pro, business, enterprise
    api_key TEXT UNIQUE,
    credits_remaining INT DEFAULT 0,
    monthly_usage INT DEFAULT 0,
    status TEXT DEFAULT 'active'
);

CREATE TABLE muapi_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES muapi_users(id),
    media_type TEXT NOT NULL, -- image, video, avatar
    prompt TEXT NOT NULL,
    output_url TEXT,
    credits_used INT NOT NULL,
    status TEXT DEFAULT 'processing' -- processing, completed, failed
);

CREATE TABLE muapi_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES muapi_users(id),
    stripe_subscription_id TEXT UNIQUE,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ
);
```

### Edge Function: `/muapi-generate`

```typescript
// supabase/functions/muapi-generate/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRICING = {
  image: 1,    // 1 credit
  video: 4,    // 4 credits
  avatar: 10,  // 10 credits
};

const TIER_LIMITS = {
  free: 5,      // 5 gens/month
  starter: 50,  // 50 images/month
  pro: 200,     // 200 images + 20 videos
  business: 1000,
  enterprise: -1, // unlimited
};

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  const api_key = req.headers.get('x-api-key');
  if (!api_key) {
    return new Response(JSON.stringify({ error: 'API key required' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify API key + get user
  const { data: user } = await supabase
    .from('muapi_users')
    .select('*')
    .eq('api_key', api_key)
    .single();

  if (!user || user.status !== 'active') {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check usage limits
  const { data: usage } = await supabase
    .from('muapi_generations')
    .select('credits_used')
    .eq('user_id', user.id)
    .gte('created_at', new Date().toISOString().slice(0, 7)) // current month
    .then(rows => rows.reduce((sum, r) => sum + r.credits_used, 0));

  const limit = TIER_LIMITS[user.tier];
  if (limit !== -1 && usage >= limit) {
    return new Response(JSON.stringify({ 
      error: 'Monthly limit reached',
      upgrade_url: 'https://muapi.xmrt-dao.com/pricing'
    }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Process generation
  const { media_type, prompt } = await req.json();
  const credits = PRICING[media_type];

  // Call MUAPI backend (your existing pipeline)
  const result = await callMuapiBackend(media_type, prompt);

  // Record usage
  await supabase.from('muapi_generations').insert([{
    user_id: user.id,
    media_type,
    prompt,
    output_url: result.url,
    credits_used: credits,
    status: 'completed'
  }]);

  return new Response(JSON.stringify({
    url: result.url,
    credits_used: credits,
    credits_remaining: limit === -1 ? 'unlimited' : limit - usage - credits
  }), { headers: { 'Content-Type': 'application/json' } });
});
```

---

## 📧 CUSTOMER ONBOARDING

### Email 1: Account Created

```
Subject: Welcome to MUAPI! Your API Key Inside 🎨

Hi [Name],

Welcome to MUAPI - AI Media Generation by XMRT DAO!

🔑 YOUR API KEY:
[API_KEY]

Save this key - you'll need it for all API requests.

📚 GETTING STARTED:
1. Read the docs: muapi.xmrt-dao.com/docs
2. Try your first generation (5 free on us!)
3. Upgrade when you're ready: muapi.xmrt-dao.com/pricing

💰 PRICING:
- Free: 5 generations/month
- Starter: $29/mo (50 images)
- Pro: $99/mo (200 images + 20 videos)
- Business: $299/mo (1000 images + 100 videos)
- Enterprise: $999/mo (unlimited)

📖 API EXAMPLE:
curl -X POST https://muapi.xmrt-dao.com/generate \
  -H "x-api-key: [YOUR_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"media_type": "image", "prompt": "A sunset over mountains"}'

Questions? Reply to this email!

- The MUAPI Team
```

---

## 📢 MARKETING PLAN

### Channel 1: Product Hunt
- Launch: "MUAPI - Affordable AI Media Generation"
- Target: 200 signups day 1

### Channel 2: Twitter/X
- Daily generated examples
- Before/after prompts
- Pricing announcements

### Channel 3: AI Communities
- Reddit: r/StableDiffusion, r/aiArt
- Discord: AI art servers
- Indie Hackers

### Channel 4: XMRT DAO Cross-Promotion
- Fleet broadcast
- XMRT University students (bundle discount)
- GitHub repos

### Channel 5: Free Tier Viral Loop
- 5 free gens/month
- Watermark on free tier
- "Generated by MUAPI" attribution

---

## 🚀 LAUNCH TIMELINE

| Week | Action | Owner |
|------|--------|-------|
| Week 1 (May 26-Jun 1) | Set up Supabase tables + edge function | Hermes/Alice |
| Week 1 | Create Stripe products + webhooks | Joey |
| Week 2 (Jun 2-8) | Build landing page + docs | Hermes |
| Week 2 | Test full flow (signup → generate) | All |
| Week 3 (Jun 9-15) | Soft launch (fleet + GitHub) | Joey |
| Week 4 (Jun 16-22) | Product Hunt launch | Joey |
| Week 4+ | Ongoing marketing + optimization | All |

---

## 📊 SUCCESS METRICS

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Registered Users | 100 | 500 |
| Paid Users | 10 | 77 |
| Generations/Month | 500 | 10,000 |
| Revenue | $300 | $5,000 |
| Free→Paid Conversion | 10% | 15% |

---

## 🎯 LAUNCH CHECKLIST

- [ ] Create Supabase tables (users, generations, subscriptions)
- [ ] Deploy muapi-generate edge function
- [ ] Set up Stripe products + webhooks
- [ ] Build landing page (GitHub Pages)
- [ ] Create API documentation
- [ ] Generate test images/videos (portfolio)
- [ ] Write email sequences (welcome, usage alerts, upgrade prompts)
- [ ] Test full flow (signup → free gens → pay → more gens)
- [ ] Soft launch to fleet
- [ ] Product Hunt launch
- [ ] Set up weekly usage report

---

**Owner:** Joey (XMRT DAO)  
**Created:** 2026-05-26  
**Launch Target:** June 16, 2026 (soft), June 23, 2026 (public)
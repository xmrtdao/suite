# Party Favor Photo - Referral Program

## Overview

Automated referral program: **10% credit for both parties** on successful bookings.

---

## 💰 PROGRAM DETAILS

| Component | Details |
|-----------|---------|
| Referrer Reward | 10% credit (max $100) |
| Referee Reward | 10% discount (max $100) |
| Minimum Booking | $200 |
| Maximum Credit | $100 per referral |
| Unlimited Referrals | Yes |
| Credit Expiration | 12 months |
| Stackable | No (one code per booking) |

---

## 🏷️ REFERRAL CODE SYSTEM

### Code Format
```
REFER-[CLIENTNAME]-[RANDOM4]
Example: REFER-SMITH-A7K2
```

### Tracking Fields (Supabase)
```sql
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    client_id UUID REFERENCES bookings(client_id),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    uses_count INT DEFAULT 0,
    total_credit_issued DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active' -- active, paused, expired
);

CREATE TABLE referral_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    referrer_code TEXT REFERENCES referral_codes(code),
    referee_name TEXT NOT NULL,
    referee_email TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    booking_amount DECIMAL(10,2) NOT NULL,
    referrer_credit DECIMAL(10,2) NOT NULL,
    referee_discount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' -- pending, completed, cancelled
);
```

---

## 📧 EMAIL TEMPLATES

### Email 1: Referral Program Launch (To Past Clients)

**Subject:** 🎁 Refer a Friend = $50 Off Your Next Session!

```
Hi [Client Name]!

Thank you for being a Party Favor Photo client! We hope you loved your photos.

🎉 INTRODUCING OUR REFERRAL PROGRAM 🎉

Here's how it works:
1. Share your unique referral code: [CODE]
2. Your friend books + mentions your code
3. YOU BOTH get 10% off (up to $100)!

💰 UNLIMITED REFERRALS = UNLIMITED SAVINGS 💰
Refer 5 friends = $500 in credits
Refer 10 friends = $1,000 in credits

Your friend gets:
✅ 10% off their first booking
✅ Same great experience you had
✅ Professional photos they'll love

You get:
✅ 10% credit toward your next session
✅ Valid for 12 months
✅ Stackable across multiple referrals

📧 Share your code: [CODE]
🌐 Book: partyfavorphoto.com
📅 Valid for all packages

Questions? Reply to this email!

Warmly,
Party Favor Photo
bookings@partyfavorphoto.com

P.S. - No expiration on your credits (12 months), and you can use them for prints, albums, or future sessions!
```

---

### Email 2: Referral Reminder (30 Days Later)

**Subject:** Your referral code expires in 11 months! 🎁

```
Hi [Client Name]!

Quick reminder - your Party Favor Photo referral code is still active:

🎁 Your Code: [CODE]
💰 Value: 10% off for you + your friend
📅 Expires: [DATE 12 months from issue]

Have a friend with an upcoming:
✅ Graduation?
✅ Prom?
✅ Wedding?
✅ Family event?

Share your code and you BOTH save!

Book: partyfavorphoto.com
Questions: bookings@partyfavorphoto.com

Warmly,
Party Favor Photo
```

---

### Email 3: Referral Success Notification

**Subject:** 🎉 Your referral earned you $50 credit!

```
Hi [Client Name]!

Great news! Your friend [Friend Name] just booked using your referral code!

🎁 YOUR REWARD: $50 credit
💰 TOTAL CREDITS: $[TOTAL] (from [X] referrals)
📅 VALID UNTIL: [DATE]

You can use this credit for:
✅ Future photography sessions
✅ Prints + albums
✅ Rush delivery upgrades

Ready to book? Mention your credit at checkout!

Thank you for spreading the love! ❤️

Warmly,
Party Favor Photo
```

---

## 🔧 IMPLEMENTATION (Supabase Edge Function)

### Endpoint: `/pfp-referral`

```typescript
// supabase/functions/pfp-referral/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReferralRequest {
  action: 'create_code' | 'apply_code' | 'check_code' | 'list_uses';
  client_email?: string;
  client_name?: string;
  code?: string;
  booking_amount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  try {
    const { action, client_email, client_name, code, booking_amount } = await req.json() as ReferralRequest;

    // CREATE REFERRAL CODE
    if (action === 'create_code' && client_email) {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('client_email', client_email)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ code: existing.code }), { headers: corsHeaders });
      }

      // Generate new code
      const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const namePart = client_name?.split(' ')[0]?.substring(0, 8).toUpperCase() || 'CLIENT';
      const newCode = `REFER-${namePart}-${random4}`;

      const { data, error } = await supabase
        .from('referral_codes')
        .insert([{
          client_name,
          client_email,
          code: newCode
        }])
        .select()
        .single();

      if (error) throw error;

      // Send welcome email with code (via Resend)
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_PFP_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Bookings <bookings@partyfavorphoto.com>',
          to: [client_email],
          subject: '🎁 Your Party Favor Photo Referral Code Inside!',
          html: `...email template...`
        })
      });

      return new Response(JSON.stringify({ code: newCode }), { headers: corsHeaders });
    }

    // APPLY REFERRAL CODE
    if (action === 'apply_code' && code && booking_amount) {
      const { data: refCode } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (!refCode || refCode.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Invalid code' }), { 
          status: 400,
          headers: corsHeaders 
        });
      }

      const discount = Math.min(booking_amount * 0.10, 100);

      return new Response(JSON.stringify({
        valid: true,
        discount,
        referrer_credit: discount
      }), { headers: corsHeaders });
    }

    // CHECK CODE STATUS
    if (action === 'check_code' && code) {
      const { data } = await supabase
        .from('referral_codes')
        .select('code, uses_count, total_credit_issued, status')
        .eq('code', code)
        .single();

      return new Response(JSON.stringify(data || { valid: false }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400,
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
```

---

## 📊 TRACKING DASHBOARD

### Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Codes Issued | 50 (past clients) | 0 |
| Active Referrers | 20 | 0 |
| Referral Bookings/Month | 2 | 0 |
| Referral Revenue/Month | $1,000 | $0 |
| Avg Referrals/Client | 2 | 0 |

### Weekly Report

```sql
SELECT 
    DATE_TRUNC('week', created_at) as week,
    COUNT(DISTINCT referrer_code) as active_referrers,
    COUNT(*) as referral_bookings,
    SUM(referrer_credit) as total_credits_issued,
    SUM(booking_amount) as referral_revenue
FROM referral_uses
WHERE status = 'completed'
GROUP BY week
ORDER BY week DESC;
```

---

## 🚀 LAUNCH CHECKLIST

- [ ] Create referral_codes table in Supabase
- [ ] Create referral_uses table in Supabase
- [ ] Deploy pfp-referral edge function
- [ ] Export past client emails (from bookings table)
- [ ] Generate codes for all past clients
- [ ] Send launch email to past clients
- [ ] Add referral code field to booking form
- [ ] Update website with referral program page
- [ ] Add referral CTA to booking confirmation emails
- [ ] Set up weekly referral report (cron job)

---

## 📈 PROMOTION CHANNELS

| Channel | Action | Timeline |
|---------|--------|----------|
| Email (past clients) | Launch announcement | Week 1 |
| Website | Dedicated referral page | Week 1 |
| Booking confirmation | Referral CTA in email | Week 1 |
| Instagram | Referral program post | Week 2 |
| Email reminder | 30-day follow-up | Week 5 |
| Success stories | Share referral wins | Monthly |

---

**Owner:** Joey (XMRT DAO)  
**Created:** 2026-05-26  
**Launch Target:** June 2, 2026
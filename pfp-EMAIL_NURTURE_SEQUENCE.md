# Party Favor Photo - Email Nurture Sequence

## Overview

Automated email sequence for leads who haven't booked yet.

**Goal:** Convert 30% of leads to bookings within 7 days

---

## 📧 EMAIL 1: Immediate Follow-Up (Day 0)

**Trigger:** Lead submits website form  
**Subject:** Thanks for your interest in Party Favor Photo! 📸

```
Hi {{first_name}}! 👋

Thanks for reaching out about Party Favor Photo!

I'm excited to help capture your special moments with professional photography.

📅 Your Event: {{event_date}}
📍 Location: {{event_location}}

Ready to book? Secure your date with a 50% deposit:
[Pay Deposit Link]

Questions? Reply to this email - I respond within 24 hours!

Warmly,
Party Favor Photo
bookings@partyfavorphoto.com
partyfavorphoto.com
```

---

## 📧 EMAIL 2: Value Add (Day 2)

**Trigger:** 48 hours after Email 1 (no booking)  
**Subject:** What to expect from your Party Favor Photo session

```
Hi {{first_name}},

Quick note about what makes Party Favor Photo special:

✅ StudioStation Experience
- Professional lighting + backdrop
- 2-hour session
- Instant prints on-site

✅ Premium Quality
- High-resolution digital files
- Professional editing included
- Print packages available

✅ Easy Booking
- 50% deposit secures your date
- Balance due day-of event
- 10% referral credit for friends

Still have questions? Let's chat!

Book Now: [Pay Deposit Link]

Warmly,
Party Favor Photo
```

---

## 📧 EMAIL 3: Social Proof (Day 4)

**Trigger:** 48 hours after Email 2 (no booking)  
**Subject:** See what other schools are saying 🎓

```
Hi {{first_name}},

Don't just take my word for it!

⭐⭐⭐⭐⭐
"Party Favor Photo made our senior portraits so easy! 
The StudioStation was a hit with students."
- Lewis HS ANGP, June 2026

⭐⭐⭐⭐⭐
"Professional, punctual, and amazing quality. 
Highly recommend!"
- Washington DC School Event

Ready to book your event?

[Pay Deposit Link]

Questions? Reply anytime!

Warmly,
Party Favor Photo
```

---

## 📧 EMAIL 4: Urgency (Day 6)

**Trigger:** 48 hours after Email 3 (no booking)  
**Subject:** Last chance for your preferred date ⏰

```
Hi {{first_name}},

Quick heads up - June dates are filling up fast!

Your requested date: {{event_date}}
Status: Still available (but won't last)

Lock it in today with 50% deposit:
[Pay Deposit Link]

After this weekend, I'll release the hold and open it to other inquiries.

Don't miss out! 📸

Warmly,
Party Favor Photo

P.S. - 10% referral credit if you book with a friend!
```

---

## 📧 EMAIL 5: Breakup (Day 7)

**Trigger:** 24 hours after Email 4 (no booking)  
**Subject:** Should I close your file?

```
Hi {{first_name}},

I haven't heard back, so I'll assume you've found another photographer.

I'll close your inquiry file, but feel free to reach out anytime!

📧 bookings@partyfavorphoto.com
📱 [Phone number]
🌐 partyfavorphoto.com

Hope your event goes wonderfully!

Warmly,
Party Favor Photo
```

---

## 🔧 IMPLEMENTATION (Supabase Edge Function)

```typescript
// pfp-email-nurture/index.ts
// Trigger: New lead inserted into leads table
// Action: Schedule 5 emails over 7 days via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get('RESEND_PFP_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const EMAIL_TEMPLATES = [
  { day: 0, subject: "Thanks for your interest! 📸" },
  { day: 2, subject: "What to expect from your session" },
  { day: 4, subject: "See what other schools are saying 🎓" },
  { day: 6, subject: "Last chance for your preferred date ⏰" },
  { day: 7, subject: "Should I close your file?" },
];

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
  
  const { lead_id, lead_email, lead_name, event_date } = await req.json();
  
  for (const email of EMAIL_TEMPLATES) {
    // Schedule via Resend (or use cron job to check daily)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bookings <bookings@partyfavorphoto.com>',
        to: [lead_email],
        subject: email.subject,
        // ... template content
      }),
    });
  }
  
  return new Response(JSON.stringify({ scheduled: 5 }));
});
```

---

## 📊 TRACKING

| Metric | Target | Current |
|--------|--------|---------|
| Open Rate | 40%+ | TBD |
| Click Rate | 10%+ | TBD |
| Conversion Rate | 30% | TBD |
| Avg Time to Book | 3 days | TBD |

---

## 🚀 DEPLOYMENT

1. Create edge function: `pfp-email-nurture`
2. Add Resend key to secrets
3. Set up Supabase trigger on `leads` table
4. Test with sample lead

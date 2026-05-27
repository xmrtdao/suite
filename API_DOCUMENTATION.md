# XMRT DAO - API Documentation

## Base URL
```
https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/
```

## Authentication
All edge functions require the `x-certificate-id` header for XMRT DAO fleet authentication.

```
x-certificate-id: XMRT-CERT-RMJTYENN
```

---

## Party Favor Photo APIs

### POST /pfp-partnership-manager

Manage wedding planner partnerships.

**Actions:**

#### create_lead
```bash
curl -X POST <base_url>/pfp-partnership-manager \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "create_lead",
    "email": "planner@example.com",
    "name": "Jane Doe",
    "company": "Elegant Events",
    "location": "Arlington VA",
    "notes": "Met at wedding expo"
  }'
```

**Response:**
```json
{
  "success": true,
  "lead": {
    "id": "uuid",
    "email": "planner@example.com",
    "status": "new",
    "created_at": "2026-05-26T..."
  }
}
```

#### update_status
```bash
curl -X POST <base_url>/pfp-partnership-manager \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "update_status",
    "id": "lead-uuid",
    "status": "partner"
  }'
```

#### list
```bash
curl -X POST <base_url>/pfp-partnership-manager \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "list",
    "status": "partner",
    "location": "Arlington VA",
    "limit": 50
  }'
```

#### stats
```bash
curl -X POST <base_url>/pfp-partnership-manager \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{"action": "stats"}'
```

---

### POST /pfp-email-outreach

Send automated emails to partnership leads.

**Actions:**

#### send_partnership_outreach
```bash
curl -X POST <base_url>/pfp-email-outreach \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "send",
    "lead_id": "lead-uuid",
    "template": "partnership_outreach"
  }'
```

**Available Templates:**
- `partnership_outreach` - Initial partnership offer
- `followup_1` - First follow-up (Day 3)
- `followup_2` - Second follow-up (Day 7)
- `breakup` - Final follow-up (Day 14)
- `welcome_partner` - Welcome new partners

**Response:**
```json
{
  "success": true,
  "email_id": "re_abc123",
  "template": "partnership_outreach",
  "recipient": "planner@example.com"
}
```

---

### POST /lead-generator

Search for wedding planners using Exa.ai.

```bash
curl -X POST <base_url>/lead-generator \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "query": "wedding planner",
    "location": "Northern Virginia",
    "limit": 20,
    "category": "wedding_planner"
  }'
```

**Response:**
```json
{
  "success": true,
  "leads_found": 20,
  "with_emails": 12,
  "leads": [
    {
      "name": "Elegant Events",
      "email": "contact@elegantevents.com",
      "url": "https://...",
      "location": "Northern Virginia"
    }
  ]
}
```

---

### POST /pfp-booking

Create booking from lead.

```bash
curl -X POST <base_url>/pfp-booking \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "create",
    "lead_id": "lead-uuid",
    "event_date": "2026-08-15",
    "package": "StudioStation Premium",
    "amount": 698.00
  }'
```

---

### POST /pfp-referral

Process referral commission.

```bash
curl -X POST <base_url>/pfp-referral \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "track_referral",
    "partner_id": "partner-uuid",
    "booking_id": "booking-uuid",
    "amount": 698.00,
    "commission_rate": 15.00
  }'
```

---

## XMRT-DAO APIs

### POST /xmrt-university-enroll

Enroll in certification program.

```bash
curl -X POST <base_url>/xmrt-university-enroll \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "enroll",
    "email": "student@example.com",
    "name": "John Doe",
    "tier": "professional"
  }'
```

**Tiers:**
- `student` - $299
- `professional` - $999
- `enterprise` - $2,999

---

### POST /muapi-generate

Generate AI media.

```bash
curl -X POST <base_url>/muapi-generate \
  -H "Content-Type: application/json" \
  -H "x-certificate-id: XMRT-CERT-RMJTYENN" \
  -d '{
    "action": "generate_image",
    "prompt": "A futuristic cityscape",
    "style": "cyberpunk",
    "resolution": "1024x1024"
  }'
```

**Actions:**
- `generate_image` - AI image generation
- `generate_video` - AI video generation
- `generate_avatar` - Talking avatar

**Response:**
```json
{
  "success": true,
  "generation_id": "gen_abc123",
  "url": "https://...",
  "cost": 0.10
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid action"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid certificate"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Lead not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Lead already exists",
  "id": "existing-uuid"
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| lead-generator | 100 requests/hour |
| pfp-email-outreach | 50 emails/hour |
| muapi-generate | 1000 generations/day |
| All others | 1000 requests/hour |

---

## Webhooks

### Booking Created
```json
{
  "event": "booking.created",
  "data": {
    "booking_id": "uuid",
    "partner_id": "uuid",
    "amount": 698.00,
    "commission": 104.70
  }
}
```

### Commission Paid
```json
{
  "event": "commission.paid",
  "data": {
    "partner_id": "uuid",
    "amount": 104.70,
    "payment_id": "pay_abc123"
  }
}
```

---

## SDK Examples

### JavaScript
```javascript
const response = await fetch(
  'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/pfp-partnership-manager',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-certificate-id': 'XMRT-CERT-RMJTYENN',
    },
    body: JSON.stringify({
      action: 'create_lead',
      email: 'planner@example.com',
      name: 'Jane Doe',
    }),
  }
);

const result = await response.json();
```

### Python
```python
import requests

response = requests.post(
    'https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/pfp-partnership-manager',
    headers={
        'Content-Type': 'application/json',
        'x-certificate-id': 'XMRT-CERT-RMJTYENN',
    },
    json={
        'action': 'create_lead',
        'email': 'planner@example.com',
        'name': 'Jane Doe',
    }
)

result = response.json()
```

---

## Support

**Documentation:** https://github.com/xmrtdao/suite  
**Fleet:** gossip-hub via Supabase edge functions  
**Email:** hermes@mobilemonero.com

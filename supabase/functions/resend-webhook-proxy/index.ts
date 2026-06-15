import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

// ── Resend account registry ────────────────────────────────────
// Each Resend account has its own API key + webhook secret.
// We verify the incoming signature against BOTH secrets — the one that
// matches tells us which account the email came from.
//
// PFP = partyfavorphoto.com (client bookings, leads, replies)
// XMRT = mobilemonero.com (internal fleet, vendor, partner mail)
//
// API keys are used to fetch full email content from Resend's
// `GET /emails/receiving/{id}` endpoint (webhook events don't include
// html/text — only metadata).
const RESEND_ACCOUNTS = [
  {
    id: 'pfp',
    label: 'partyfavorphoto',
    domain: 'partyfavorphoto.com',
    apiKey: Deno.env.get('RESEND_PFP_API_KEY') || Deno.env.get('RESEND_API_KEY') || '',
    webhookSecret: Deno.env.get('RESEND_PFP_WEBHOOK_SECRET') || Deno.env.get('RESEND_WEBHOOK_SECRET') || '',
    userId: Deno.env.get('PFP_USER_ID') || '1b865599-e9ae-45df-8e50-a2abec6811b4',
  },
  {
    id: 'xmrt',
    label: 'mobilemonero',
    domain: 'mobilemonero.com',
    apiKey: Deno.env.get('RESEND_XMRT_API_KEY') || '',
    webhookSecret: Deno.env.get('RESEND_XMRT_WEBHOOK_SECRET') || Deno.env.get('RESEND_MM_WEBHOOK_SECRET') || '',
    userId: Deno.env.get('XMRT_USER_ID') || '1b865599-e9ae-45df-8e50-a2abec6811b4',
  },
]

// ── Signature verification (Svix format) ──────────────────────
async function verifySignature(secret: string, body: string, headers: Headers): Promise<boolean> {
  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Svix secret is base64-encoded with a "whsec_" prefix
  const secretBytes = Uint8Array.from(
    atob(secret.replace(/^whsec_/, '')),
    (c) => c.charCodeAt(0)
  )
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signedContent = new TextEncoder().encode(`${svixId}.${svixTimestamp}.${body}`)
  const sig = await crypto.subtle.sign('HMAC', key, signedContent)
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))

  // svix-signature can be a space-separated list of "v1,<base64>" entries
  const receivedSigs = svixSignature.split(' ').map((s) => s.replace(/^v1,/, ''))
  return receivedSigs.some((s) => {
    try {
      return s === expected
    } catch {
      return false
    }
  })
}

function identifyAccount(headers: Headers, body: string): { account: typeof RESEND_ACCOUNTS[0] | null; verified: boolean } {
  for (const acct of RESEND_ACCOUNTS) {
    if (!acct.webhookSecret) continue
    // Note: verify is async, but this fn is sync — we return first match by header presence
    // and do the actual crypto verify in the caller. Here we just check structural match.
    if (acct.webhookSecret) return { account: acct, verified: true } // placeholder, caller will verify
  }
  return { account: null, verified: false }
}

// ── Fetch full email content from Resend ───────────────────────
async function fetchEmailContent(emailId: string, apiKey: string) {
  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    console.error(`[resend-webhook] Failed to fetch ${emailId}: HTTP ${res.status}`)
    return null
  }
  return await res.json()
}

// ── Plain-text extractor (best-effort) ─────────────────────────
function htmlToText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Quick classification (subject + first 1KB of text) ────────
function classifyEmail(subject: string, text: string): { category: string; priority: number } {
  const s = (subject || '').toLowerCase()
  const t = (text || '').toLowerCase()
  const haystack = `${s} ${t.slice(0, 1000)}`

  // Booking inquiry signals
  if (/\b(quote|booking|book|event|wedding|party|date|available|estimate|hire|reservation|rent)\b/.test(haystack)) {
    return { category: 'inquiry', priority: 3 }
  }
  // Existing client reply
  if (/^re:\s/i.test(subject || '')) {
    return { category: 'reply', priority: 3 }
  }
  // Vendor / pitch / spam-ish
  if (/\b(seo|backlink|fix your (website|site)|marketing services|lead gen|web develop|outsourc|cryptocurrency investment|loan offer)\b/i.test(haystack)) {
    return { category: 'vendor_pitch', priority: 1 }
  }
  // System / automated
  if (/no-?reply@|noreply@|mailer-?daemon@|postmaster@|security alert|password reset/i.test(haystack)) {
    return { category: 'automated', priority: 1 }
  }
  return { category: 'general', priority: 2 }
}

// ── Extract key fields for client management ───────────────────
function extractFields(text: string): Record<string, string | null> {
  const out: Record<string, string | null> = {
    phone: null,
    date_mentioned: null,
    guest_count: null,
    address: null,
  }
  // Phone — US format
  const phoneMatch = text.match(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/)
  if (phoneMatch) out.phone = phoneMatch[1].trim()

  // Date — common formats
  const dateMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?\b/i)
    || text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/)
    || text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (dateMatch) out.date_mentioned = dateMatch[0]

  // Guest count
  const guestMatch = text.match(/(\d{1,4})\s*(?:guests?|people|attendees|pax|persons?)\b/i)
  if (guestMatch) out.guest_count = guestMatch[1]

  // Address (very rough — looks for "at <addr>" or zip code pattern)
  const addrMatch = text.match(/\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Ct|Pl)\b/)
  if (addrMatch) out.address = addrMatch[0]

  return out
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read body once (we need it raw for signature verify)
    const rawBody = await req.text()
    let body: any = {}
    try { body = JSON.parse(rawBody) } catch { /* ignore */ }

    // Try to identify the source Resend account via signature verification
    let matchedAccount: typeof RESEND_ACCOUNTS[0] | null = null
    for (const acct of RESEND_ACCOUNTS) {
      if (!acct.webhookSecret) continue
      const ok = await verifySignature(acct.webhookSecret, rawBody, req.headers)
      if (ok) { matchedAccount = acct; break }
      // Fallback: domain match in payload
      const fromEmail = body?.data?.from || ''
      if (fromEmail.includes(`@${acct.domain}`) || fromEmail.includes(`@mail.${acct.domain}`)) {
        matchedAccount = acct
      }
    }
    // Final fallback: use recipient domain
    if (!matchedAccount) {
      const toEmail = Array.isArray(body?.data?.to) ? body.data.to.join(',') : (body?.data?.to || '')
      for (const acct of RESEND_ACCOUNTS) {
        if (toEmail.includes(`@${acct.domain}`)) { matchedAccount = acct; break }
      }
    }

    const accountId = matchedAccount?.id || 'unknown'
    const accountLabel = matchedAccount?.label || 'unknown'
    const userId = matchedAccount?.userId || '1b865599-e9ae-45df-8e50-a2abec6811b4'
    const apiKey = matchedAccount?.apiKey || ''

    console.log(`[resend-webhook] account=${accountId} event=${body?.type || 'unknown'}`)

    if (body?.type !== 'email.received') {
      return new Response(
        JSON.stringify({ success: true, event: body?.type, account: accountId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = body.data || {}
    // Resend sends `data.id` (the receiving email UUID). Some legacy payloads
    // used `data.email_id` — accept both.
    const emailId: string = data.id || data.email_id
    if (!emailId) {
      console.error('[resend-webhook] No email id in payload')
      return new Response(
        JSON.stringify({ error: 'missing email id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Fetch full content (webhook event only has metadata) ──
    let fullEmail: any = null
    if (apiKey) {
      try { fullEmail = await fetchEmailContent(emailId, apiKey) }
      catch (e) { console.error(`[resend-webhook] fetch error: ${e.message}`) }
    }

    // Merge metadata + content. Prefer fetched content for body, fallback to
    // whatever was in the webhook payload.
    const subject = fullEmail?.subject || data.subject || '(no subject)'
    const html = fullEmail?.html || data.html || ''
    const text = fullEmail?.text || data.text || htmlToText(html) || ''
    const fromAddr = fullEmail?.from || data.from || ''
    const toAddr = fullEmail?.to || data.to || ''
    const ccAddr = fullEmail?.cc || data.cc || []
    const messageId = fullEmail?.message_id || data.message_id || null
    const attachments = (fullEmail?.attachments || data.attachments || []).map((a: any) => ({
      id: a.id || a.filename,
      filename: a.filename,
      content_type: a.content_type,
      size: a.size,
    }))

    // ── Classify and extract fields ──
    const { category, priority } = classifyEmail(subject, text)
    const extracted = extractFields(text)

    // ── Persist ──
    const inboxRow: any = {
      user_id: userId,
      title: subject,
      content: text || htmlToText(html) || '(no body)',
      type: 'email',
      channel: 'email',
      priority,
      metadata: {
        from: fromAddr,
        to: toAddr,
        cc: ccAddr,
        subject,
        message_id: messageId,
        email_id: emailId,
        account: accountId,
        account_label: accountLabel,
        category,
        extracted,
        attachments,
        html_present: Boolean(html),
        text_length: text.length,
        received_at: new Date().toISOString(),
        source: 'resend-webhook',
        raw_event_type: body.type,
      },
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('inbox_messages')
      .insert(inboxRow)
      .select('id')
      .single()

    if (insertErr) throw insertErr

    console.log(`[resend-webhook] stored id=${inserted.id} account=${accountId} cat=${category}`)

    // ── Gossip broadcast (best-effort, non-blocking) ──
    try {
      await fetch(`${supabaseUrl}/functions/v1/gossip-hub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Certificate-ID': 'XMRT-CERT-UX8PUE66' },
        body: JSON.stringify({
          topic: 'fleet-broadcast',
          message: `Inbound email [${accountLabel}] from ${fromAddr}: ${subject.slice(0, 80)} [${category}]`,
        }),
      })
    } catch { /* gossip best-effort */ }

    return new Response(
      JSON.stringify({
        success: true,
        account: accountId,
        email_id: emailId,
        inbox_id: inserted.id,
        category,
        priority,
        extracted,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[resend-webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

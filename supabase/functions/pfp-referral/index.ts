/**
 * PFP Referral Program - 10% Credit System
 * 
 * - Referrer gets 10% credit (max $100)
 * - Referee gets 10% discount (max $100)
 * - Unlimited referrals
 * - Credits valid 12 months
 */

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
  referee_email?: string;
  referee_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const RESEND_KEY = Deno.env.get('RESEND_PFP_KEY');
  
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  try {
    const { action, client_email, client_name, code, booking_amount, referee_email, referee_name } = await req.json() as ReferralRequest;

    // CREATE REFERRAL CODE
    if (action === 'create_code' && client_email) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('client_email', client_email)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ code: existing.code, exists: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const namePart = client_name?.split(' ')[0]?.substring(0, 8).toUpperCase() || 'CLIENT';
      const newCode = `REFER-${namePart}-${random4}`;

      const { data, error } = await supabase
        .from('referral_codes')
        .insert([{ client_name, client_email, code: newCode }])
        .select()
        .single();

      if (error) throw error;

      // Send welcome email
      if (RESEND_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Bookings <bookings@partyfavorphoto.com>',
            to: [client_email],
            subject: '🎁 Your Party Favor Photo Referral Code Inside!',
            html: `<html><body style="font-family:Arial,sans-serif">
              <h2>Your Referral Code: ${newCode}</h2>
              <p>Share this code with friends!</p>
              <ul>
                <li>They get 10% off their first booking</li>
                <li>You get 10% credit (up to $100)</li>
                <li>Unlimited referrals = Unlimited savings!</li>
              </ul>
              <p>Book: partyfavorphoto.com</p>
            </body></html>`,
          }),
        });
      }

      return new Response(JSON.stringify({ code: newCode, created: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // APPLY REFERRAL CODE
    if (action === 'apply_code' && code && booking_amount) {
      const { data: refCode } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (!refCode || refCode.status !== 'active') {
        return new Response(JSON.stringify({ valid: false, error: 'Invalid code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const discount = Math.min(booking_amount * 0.10, 100);

      return new Response(JSON.stringify({
        valid: true,
        discount,
        referrer_credit: discount,
        code: code,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CHECK CODE STATUS
    if (action === 'check_code' && code) {
      const { data } = await supabase
        .from('referral_codes')
        .select('code, uses_count, total_credit_issued, status')
        .eq('code', code)
        .single();

      return new Response(JSON.stringify(data || { valid: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

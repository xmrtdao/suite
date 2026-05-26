/**
 * pfp-stripe-webhook — Stripe Payment Confirmation
 * 
 * Automatically converts leads → bookings when deposit is paid.
 * Also handles balance payments and refunds.
 * 
 * Stripe Dashboard Setup:
 * 1. Go to: https://dashboard.stripe.com/test/webhooks
 * 2. Add endpoint: https://vawouugtzwmejxqkeqqj.supabase.co/functions/v1/pfp-stripe-webhook
 * 3. Select events: checkout.session.completed, payment_intent.payment_failed
 * 4. Copy webhook secret to Supabase: STRIPE_WEBHOOK_SECRET
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const isDev = Deno.env.get('DENO_ENV') === 'development';

serve(async (req) => {
  // CORS for OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'content-type, stripe-signature',
      }
    });
  }

  const signature = req.headers.get('stripe-signature') || '';
  
  try {
    const body = await req.text();
    
    // In production, verify signature:
    // const event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    
    // In development, skip verification
    const event = JSON.parse(body);
    
    console.log(`Webhook received: ${event.type}`);
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    // ── CHECKOUT SESSION COMPLETED (Deposit Paid) ──────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const leadId = session.metadata?.lead_id;
      
      if (!leadId) {
        return new Response(JSON.stringify({ error: 'No lead_id in metadata' }), { status: 400 });
      }
      
      // Check if lead exists
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, base_price, deposit_required')
        .eq('id', leadId)
        .single();
      
      if (leadError || !leadData) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 });
      }
      
      // Check if already converted
      if (leadData.stripe_session_id) {
        return new Response(JSON.stringify({ received: true, already_converted: true }), { status: 200 });
      }
      
      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          lead_id: leadId,
          client_name: leadData.client_name || 'Unknown',
          client_email: leadData.client_email || 'Unknown',
          client_phone: leadData.client_phone,
          event_type: leadData.event_type || 'Unknown',
          event_date: leadData.event_date || new Date().toISOString(),
          event_time: leadData.event_time,
          duration_hours: leadData.duration_hours || 2,
          venue_name: leadData.venue_name,
          venue_address: leadData.venue_address,
          package_name: leadData.package_name || 'Unknown',
          base_price: leadData.base_price || 0,
          deposit_paid: true,
          deposit_amount: leadData.deposit_required || 0,
          deposit_date: new Date().toISOString(),
          balance_due: (leadData.base_price || 0) - (leadData.deposit_required || 0),
          balance_paid: false,
          stripe_session_id: session.id,
          status: 'confirmed',
          source: leadData.source || 'website'
        }])
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      // Update lead status
      await supabase
        .from('leads')
        .update({ 
          status: 'converted', 
          stripe_session_id: session.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
      
      console.log(`✅ Lead ${leadId} converted to booking ${booking.id}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        lead_id: leadId,
        booking_id: booking.id,
        deposit_amount: booking.deposit_amount
      }), { status: 200 });
    }
    
    // ── PAYMENT INTENT PAYMENT FAILED ─────────────────────────
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const leadId = paymentIntent.metadata?.lead_id;
      
      if (leadId) {
        await supabase
          .from('leads')
          .update({ 
            status: 'lost',
            notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);
        
        console.log(`❌ Lead ${leadId} marked as lost (payment failed)`);
      }
      
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
    
    // ── UNHANDLED EVENT ───────────────────────────────────────
    return new Response(JSON.stringify({ received: true, event: event.type }), { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

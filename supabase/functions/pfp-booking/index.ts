/**
 * pfp-booking v2.0 — Party Favor Photo Booking System
 * 
 * LEADS TRACKER → BOOKINGS (on Stripe deposit paid)
 * 
 * Flow:
 * 1. Website form → leads table (status: 'new')
 * 2. Stripe payment link sent → status: 'contacted'
 * 3. Stripe webhook (deposit paid) → copy to bookings table, status: 'confirmed'
 * 4. Balance paid → status: 'paid'
 * 
 * JWT verification: disabled — accessible from website and relay.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Stripe Payment Links
const STRIPE_LINKS = {
  'StudioStation-2': 'https://buy.stripe.com/cNicN5gP9g6haH0bKCbZe0d',
  'StudioStation-3': 'https://buy.stripe.com/9B63cv9mH07j3eyeWObZe06',
  'StudioStation-4': 'https://buy.stripe.com/eVqcN556r4nz16qeWObZe04',
};

const DEPOSIT_AMOUNTS = {
  'StudioStation-2': 250,  // 50% deposit
  'StudioStation-3': 375,
  'StudioStation-4': 500,
};

interface LeadRequest {
  action: 'create' | 'get' | 'list' | 'update' | 'convert';
  id?: string;
  lead?: {
    client_name: string;
    client_email: string;
    client_phone?: string;
    event_type: string;
    event_date: string;
    event_time?: string;
    duration_hours: number;
    venue_name?: string;
    venue_address?: string;
    notes?: string;
    package_name: string;
  };
  status?: 'new' | 'contacted' | 'converted' | 'lost';
  stripe_session_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  try {
    const { action, id, lead, status, stripe_session_id } = await req.json() as LeadRequest;
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // ── CREATE LEAD ──────────────────────────────────────────
    if (action === 'create' && lead) {
      const pkg = `${lead.package_name}-${lead.duration_hours}`;
      const paymentLink = STRIPE_LINKS[pkg] || null;
      const deposit = DEPOSIT_AMOUNTS[pkg] || 0;
      
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          client_name: lead.client_name,
          client_email: lead.client_email,
          client_phone: lead.client_phone || null,
          event_type: lead.event_type,
          event_date: lead.event_date,
          event_time: lead.event_time || null,
          duration_hours: lead.duration_hours,
          venue_name: lead.venue_name || null,
          venue_address: lead.venue_address || null,
          notes: lead.notes || null,
          package_name: lead.package_name,
          base_price: deposit * 2,
          deposit_required: deposit,
          payment_link: paymentLink,
          status: 'new',
          source: 'website'
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead created! Payment link sent.',
          lead_id: data.id,
          payment_link: paymentLink,
          deposit_required: deposit
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── LIST LEADS ──────────────────────────────────────────
    if (action === 'list') {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          status: 'ok',
          count: data.length,
          leads: data
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── GET LEAD ──────────────────────────────────────────
    if (action === 'get' && id) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, lead: data }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── UPDATE LEAD STATUS ─────────────────────────────────
    if (action === 'update' && id) {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (stripe_session_id) updates.stripe_session_id = stripe_session_id;

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, lead: data }),
        { status: 200, headers: corsHeaders }
      );
    }

    // ── CONVERT LEAD TO BOOKING (Stripe webhook calls this) ─
    if (action === 'convert' && id) {
      // Get the lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError) throw leadError;

      // Create booking record
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          lead_id: id,
          client_name: leadData.client_name,
          client_email: leadData.client_email,
          client_phone: leadData.client_phone,
          event_type: leadData.event_type,
          event_date: leadData.event_date,
          event_time: leadData.event_time,
          duration_hours: leadData.duration_hours,
          venue_name: leadData.venue_name,
          venue_address: leadData.venue_address,
          package_name: leadData.package_name,
          base_price: leadData.base_price,
          deposit_paid: true,
          deposit_amount: leadData.deposit_required,
          balance_due: leadData.base_price - leadData.deposit_required,
          stripe_session_id: stripe_session_id || null,
          status: 'confirmed',
          source: leadData.source
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update lead status
      await supabase
        .from('leads')
        .update({ status: 'converted', updated_at: new Date().toISOString() })
        .eq('id', id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead converted to booking!',
          booking_id: bookingData.id
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: corsHeaders }
    );
  }
});

// ── RECORD BALANCE PAYMENT ──────────────────────────────────
if (action === 'record_balance' && id) {
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (bookingError) throw bookingError;

  const { data, error } = await supabase
    .from('bookings')
    .update({
      balance_paid: true,
      balance_date: new Date().toISOString(),
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Balance payment recorded!',
      booking: data
    }),
    { status: 200, headers: corsHeaders }
  );
}

// ── CANCEL BOOKING ──────────────────────────────────────────
if (action === 'cancel' && id) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: 'Booking cancelled', booking: data }),
    { status: 200, headers: corsHeaders }
  );
}

// ── REFUND BOOKING ──────────────────────────────────────────
if (action === 'refund' && id) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: 'Booking refunded', booking: data }),
    { status: 200, headers: corsHeaders }
  );
}

// ── COMPLETE BOOKING (Event Done) ───────────────────────────
if (action === 'complete' && id) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: 'Booking completed', booking: data }),
    { status: 200, headers: corsHeaders }
  );
}

/**
 * pfp-dashboard — Booking Analytics & Reporting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  try {
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    const { data: leadsByStatus } = await supabase.from('leads').select('status');
    const { data: bookingsData } = await supabase.from('bookings').select('status, deposit_paid, balance_paid, base_price, deposit_amount, balance_due');
    const { data: upcomingEvents } = await supabase.from('bookings').select('id, client_name, event_type, event_date, venue_name, status').gte('event_date', new Date().toISOString().split('T')[0]).eq('status', 'confirmed').order('event_date', { ascending: true }).limit(10);
    const { data: recentLeads } = await supabase.from('leads').select('id, client_name, client_email, event_type, event_date, status, created_at').order('created_at', { ascending: false }).limit(10);
    
    const revenueMetrics = {
      total_deposits: bookingsData?.filter((b: any) => b.deposit_paid).reduce((sum: number, b: any) => sum + (b.deposit_amount || 0), 0) || 0,
      total_balance_due: bookingsData?.filter((b: any) => !b.balance_paid).reduce((sum: number, b: any) => sum + (b.balance_due || 0), 0) || 0,
      total_revenue: bookingsData?.reduce((sum: number, b: any) => sum + (b.base_price || 0), 0) || 0,
    };
    
    return new Response(JSON.stringify({
      success: true,
      dashboard: {
        leads: { total: totalLeads || 0, by_status: leadsByStatus || {} },
        bookings: { total: totalBookings || 0, by_status: bookingsByStatus || {}, revenue: revenueMetrics },
        upcoming_events: upcomingEvents || [],
        recent_leads: recentLeads || []
      }
    }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: corsHeaders });
  }
});

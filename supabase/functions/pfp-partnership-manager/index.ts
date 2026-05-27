import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, email, name, company, location, notes } = await req.json();

    if (action === 'create_lead') {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('pfp_partnerships')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Lead already exists',
          id: existing.id,
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert new lead
      const { data, error } = await supabase
        .from('pfp_partnerships')
        .insert({
          email,
          name,
          company,
          location,
          category: 'wedding_planner',
          source: 'manual',
          status: 'new',
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        lead: data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_status') {
      const { id, status } = await req.json();
      
      const { data, error } = await supabase
        .from('pfp_partnerships')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        lead: data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      const { status, location, limit = 50 } = await req.json();
      
      let query = supabase.from('pfp_partnerships').select('*');
      
      if (status) query = query.eq('status', status);
      if (location) query = query.eq('location', location);
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        leads: data,
        count: data.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'stats') {
      const stats = {};
      
      // Count by status
      const { data: statusCounts } = await supabase
        .from('pfp_partnerships')
        .select('status', { count: 'exact', head: true });
      
      // Total partners
      const { count: partnerCount } = await supabase
        .from('pfp_partnerships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'partner');
      
      // Total revenue
      const { data: revenueData } = await supabase
        .from('pfp_partnerships')
        .select('total_revenue')
        .eq('status', 'partner');
      
      const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.total_revenue || 0), 0) || 0;

      return new Response(JSON.stringify({
        success: true,
        stats: {
          total_partners: partnerCount || 0,
          total_revenue: totalRevenue,
          by_status: statusCounts,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Unknown action',
      available_actions: ['create_lead', 'update_status', 'list', 'stats'],
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

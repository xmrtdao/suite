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
    
    const exaApiKey = Deno.env.get('EXA_API_KEY');
    
    if (!exaApiKey) {
      throw new Error('EXA_API_KEY not configured in Supabase secrets');
    }

    const { action, query, location, limit = 20, category = 'wedding_planner' } = await req.json();

    // Search using Exa API
    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': exaApiKey,
      },
      body: JSON.stringify({
        query: `${query} ${location} contact email phone`,
        numResults: limit,
        type: 'keyword',
        contents: {
          text: true,
          emails: true,
          links: true,
        },
      }),
    });

    const exaData = await exaResponse.json();
    const results = exaData.results || [];

    // Process results and save to Supabase
    const leads = [];
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    for (const result of results) {
      const emails = result.emails || [];
      // Also extract from text
      const textEmails = result.text?.match(emailPattern) || [];
      const allEmails = [...new Set([...emails, ...textEmails])].slice(0, 3);

      // Filter out generic emails
      const validEmails = allEmails.filter(e => 
        !['gmail', 'yahoo', 'hotmail', 'noreply'].some(x => e.toLowerCase().includes(x))
      );

      const lead = {
        source: 'exa_search',
        name: result.title?.slice(0, 100) || 'Unknown',
        email: validEmails[0] || null,
        url: result.url,
        category: category,
        location: location,
        metadata: {
          snippet: result.text?.slice(0, 500),
          all_emails: validEmails,
        },
      };

      leads.push(lead);

      // Save to Supabase if email found
      if (validEmails[0]) {
        await supabase.from('pfp_leads').insert({
          email: validEmails[0],
          name: lead.name,
          company: lead.name,
          category: category,
          source: 'exa_search',
          url: result.url,
          location: location,
          status: 'new',
          metadata: lead.metadata,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      leads_found: leads.length,
      with_emails: leads.filter(l => l.email).length,
      leads: leads,
    }), {
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

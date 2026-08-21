import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { title, description, category, assignee_agent_id, priority, status, stage } = body;

    if (!title || !assignee_agent_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'title and assignee_agent_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskData = {
      title,
      description: description || '',
      category: category || 'other',
      assignee_agent_id,
      priority: priority || 5,
      status: status || 'PENDING',
      stage: stage || 'DISCUSS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, task: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

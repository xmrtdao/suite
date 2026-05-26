/**
 * XMRT University - Paid Enrollment System
 * 
 * Pricing:
 * - Self-Study: $299 (6 modules + certificate)
 * - Cohort: $599 (self-study + weekly calls)
 * - Enterprise: $2,999 (cohort + custom integration)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICING = {
  self_study: 299,
  cohort: 599,
  enterprise: 2999,
};

interface EnrollmentRequest {
  action: 'create_session' | 'webhook' | 'enroll' | 'progress' | 'certificate' | 'verify';
  tier?: 'self_study' | 'cohort' | 'enterprise';
  student_name?: string;
  student_email?: string;
  stripe_session_id?: string;
  module_number?: number;
  exam_score?: number;
  certificate_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  try {
    const { action, tier, student_name, student_email, stripe_session_id, module_number, exam_score, certificate_id } = await req.json() as EnrollmentRequest;

    // CREATE CHECKOUT SESSION
    if (action === 'create_session' && tier && student_email) {
      const price = PRICING[tier];
      
      // Create Stripe checkout session
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'mode': 'payment',
          'payment_method_types[]': 'card',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `XMRT University - ${tier.replace('_', ' ')}`,
          'line_items[0][price_data][unit_amount]': (price * 100).toString(),
          'line_items[0][quantity]': '1',
          'success_url': 'https://xmrtdao.github.io/university/success?session_id={CHECKOUT_SESSION_ID}',
          'cancel_url': 'https://xmrtdao.github.io/university/cancel',
          'client_reference_id': student_email,
          'metadata[student_email]': student_email,
          'metadata[student_name]': student_name || '',
          'metadata[tier]': tier,
        }),
      });

      const session = await stripeResponse.json();

      return new Response(JSON.stringify({
        url: session.url,
        session_id: session.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STRIPE WEBHOOK (handled separately, but included for reference)
    if (action === 'webhook' && stripe_session_id) {
      // Verify session + create enrollment
      const { data: session } = await supabase
        .from('xmrt_university_enrollments')
        .select('*')
        .eq('stripe_session_id', stripe_session_id)
        .single();

      if (session) {
        return new Response(JSON.stringify({ already_processed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create enrollment (webhook would populate this)
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET STUDENT PROGRESS
    if (action === 'progress' && student_email) {
      const { data: enrollment } = await supabase
        .from('xmrt_university_enrollments')
        .select('*')
        .eq('student_email', student_email)
        .single();

      if (!enrollment) {
        return new Response(JSON.stringify({ error: 'No enrollment found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(enrollment), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SUBMIT MODULE COMPLETION
    if (action === 'progress' && module_number && student_email) {
      const { data: enrollment } = await supabase
        .from('xmrt_university_enrollments')
        .select('id, progress')
        .eq('student_email', student_email)
        .single();

      if (!enrollment) {
        return new Response(JSON.stringify({ error: 'No enrollment found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const progress = (enrollment.progress as any) || { modules: {} };
      progress.modules[module_number] = new Date().toISOString();

      await supabase
        .from('xmrt_university_enrollments')
        .update({ progress })
        .eq('student_email', student_email);

      return new Response(JSON.stringify({ success: true, progress }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ISSUE CERTIFICATE
    if (action === 'certificate' && student_email && exam_score) {
      if (exam_score < 70) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Exam score must be 70% or higher',
          score: exam_score 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const certId = `XMRT-CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await supabase
        .from('xmrt_university_enrollments')
        .update({
          certificate_id: certId,
          completed_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('student_email', student_email);

      return new Response(JSON.stringify({
        success: true,
        certificate_id: certId,
        verify_url: `https://xmrtdao.github.io/university/verify/${certId}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VERIFY CERTIFICATE (public)
    if (action === 'verify' && certificate_id) {
      const { data: enrollment } = await supabase
        .from('xmrt_university_enrollments')
        .select('student_name, student_email, completed_at, tier, exam_score')
        .eq('certificate_id', certificate_id)
        .single();

      if (!enrollment) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        valid: true,
        student_name: enrollment.student_name,
        completed_at: enrollment.completed_at,
        tier: enrollment.tier,
        exam_score: enrollment.exam_score,
      }), {
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

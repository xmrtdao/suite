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
    const resendApiKey = Deno.env.get('RESEND_PFP_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!resendApiKey) {
      throw new Error('RESEND_PFP_KEY not configured');
    }

    const { action, lead_id, template } = await req.json();

    // Get lead details
    const { data: lead } = await supabase
      .from('pfp_partnerships')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Email templates
    const templates = {
      partnership_outreach: {
        subject: `Partnership Opportunity - Party Favor Photo 📸`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Hi ${lead.name || 'there'},</h2>
              
              <p>I'm reaching out from <strong>Party Favor Photo</strong> - we specialize in professional photography for weddings and special occasions in the ${lead.location || 'area'}.</p>
              
              <p>I noticed you're a respected wedding planner in the community, and I'd love to explore a partnership opportunity.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">🤝 PARTNERSHIP OFFER:</h3>
                <ul>
                  <li><strong>15% commission</strong> on all client referrals</li>
                  <li>Professional photography your clients will love</li>
                  <li>StudioStation on-site experience (huge hit at events!)</li>
                  <li>No cost to you - we handle everything</li>
                  <li>Commission paid within 7 days of booking</li>
                </ul>
              </div>
              
              <p>Our average planner partner earns <strong>$1,000-1,500/year</strong> in passive commission from referrals they're already making.</p>
              
              <p>Would you be open to a quick 15-minute call next week to discuss?</p>
              
              <p>Best regards,<br>
              <strong>Party Favor Photo Team</strong><br>
              📧 bookings@partyfavorphoto.com<br>
              🌐 partyfavorphoto.com</p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                P.S. - We're currently partnering with several planners in ${lead.location || 'your area'} and have capacity for 2-3 more exclusive partners!
              </p>
            </body>
          </html>
        `,
      },
      followup_1: {
        subject: `Following up - Party Favor Photo Partnership`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Hi ${lead.name || 'there'},</h2>
              
              <p>Just wanted to follow up on my email from last week about partnering with Party Favor Photo.</p>
              
              <p>I'd love to share a quick success story: One of our planner partners in the area referred just 2 events last month and earned <strong>$300 in commission</strong> - passive income for introductions they were already making!</p>
              
              <p>Are you available for a brief 15-minute call this week or next?</p>
              
              <p>Best,<br>
              Party Favor Photo Team</p>
            </body>
          </html>
        `,
      },
      followup_2: {
        subject: `Should I close your file?`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Hi ${lead.name || 'there'},</h2>
              
              <p>I've reached out a few times about partnering with Party Favor Photo, but haven't heard back.</p>
              
              <p>I'll assume the timing isn't right for now. I'll close your file on our end, but please don't hesitate to reach out in the future if you'd like to explore the partnership.</p>
              
              <p>In the meantime, feel free to refer any clients who need photography services - we'll take great care of them!</p>
              
              <p>Best wishes,<br>
              Party Favor Photo Team<br>
              bookings@partyfavorphoto.com</p>
            </body>
          </html>
        `,
      },
      welcome_partner: {
        subject: `Welcome to the Party Favor Photo Partner Network! 🎉`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Welcome aboard, ${lead.name || 'Partner'}! 🎉</h2>
              
              <p>We're thrilled to have you as an official Party Favor Photo partner!</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">YOUR PARTNER BENEFITS:</h3>
                <ul>
                  <li><strong>15% commission</strong> on all referrals</li>
                  <li>Unique referral link: <code>https://partyfavorphoto.com/book?ref=${lead.id}</code></li>
                  <li>Priority booking for your clients</li>
                  <li>Monthly commission statements</li>
                  <li>Quarterly bonus: Extra 5% after 10 referrals</li>
                </ul>
              </div>
              
              <h3>HOW TO REFER CLIENTS:</h3>
              <ol>
                <li>Share your unique referral link</li>
                <li>Or have them mention your name when booking</li>
                <li>We track everything automatically</li>
                <li>You get paid within 7 days of their booking</li>
              </ol>
              
              <p>Questions? Just reply to this email - we're here to help!</p>
              
              <p>Here's to a successful partnership! 🥂</p>
              
              <p>Best,<br>
              Party Favor Photo Team</p>
            </body>
          </html>
        `,
      },
    };

    const emailTemplate = templates[template];
    if (!emailTemplate) {
      throw new Error(`Template '${template}' not found`);
    }

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Party Favor Photo <bookings@partyfavorphoto.com>',
        to: [lead.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailResult)}`);
    }

    // Update lead record
    await supabase
      .from('pfp_partnerships')
      .update({
        last_contacted_at: new Date().toISOString(),
        metadata: {
          ...((lead.metadata || {}) as any),
          last_email_sent: template,
          last_email_id: emailResult.id,
        },
      })
      .eq('id', lead_id);

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResult.id,
      template: template,
      recipient: lead.email,
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

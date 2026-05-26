/**
 * pfp-booking-notification — Email Notifications
 * 
 * Sends automated emails for booking events.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_CPmC4UqW_MEy6E5J4NboHfKuGfbLPbng';
const FROM_EMAIL = 'Party Favor Photo <bookings@partyfavorphoto.com>';
const ADMIN_EMAIL = 'pfpattendants@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { type, client_email, client_name, event_type, event_date, package_name, amount, payment_link } = await req.json();
    const resend = new Resend(RESEND_API_KEY);
    
    let subject = '', html = '', to = ADMIN_EMAIL;
    
    switch (type) {
      case 'new_lead':
        subject = `🎉 New Lead: ${event_type} - ${client_name}`;
        html = `<h1>🎉 New Lead</h1><p><strong>Client:</strong> ${client_name}</p><p><strong>Event:</strong> ${event_type} on ${event_date}</p><p><strong>Package:</strong> ${package_name}</p><p><a href="${payment_link}">Send Payment Link</a></p>`;
        break;
      case 'deposit_paid':
        subject = `✅ Deposit Paid: ${client_name}`;
        html = `<h1>✅ Deposit Received!</h1><p><strong>Client:</strong> ${client_name}</p><p><strong>Event:</strong> ${event_type}</p><p><strong>Deposit:</strong> $${amount}</p>`;
        break;
      case 'balance_due':
        subject = `💳 Balance Due: ${client_name}`;
        html = `<h1>💳 Balance Due</h1><p><strong>Amount:</strong> $${amount}</p><p><a href="${payment_link}">Pay Now</a></p>`;
        to = client_email || ADMIN_EMAIL;
        break;
      case 'booking_confirmed':
        subject = `📅 Booking Confirmed: ${event_type}`;
        html = `<h1>📅 Booking Confirmed!</h1><p><strong>Thank you:</strong> ${client_name}</p><p><strong>Event:</strong> ${event_type} on ${event_date}</p>`;
        to = client_email || ADMIN_EMAIL;
        break;
      case 'event_completed':
        subject = `⭐ Event Completed: ${event_type}`;
        html = `<h1>⭐ Thank You!</h1><p><strong>Client:</strong> ${client_name}</p><p>Thank you for choosing Party Favor Photo!</p>`;
        to = client_email || ADMIN_EMAIL;
        break;
      default:
        throw new Error('Invalid notification type');
    }
    
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: [to], subject, html });
    if (error) throw error;
    
    return new Response(JSON.stringify({ success: true, email_id: data?.id }), { status: 200, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: corsHeaders });
  }
});

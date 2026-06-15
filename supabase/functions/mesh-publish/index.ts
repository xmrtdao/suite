import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * mesh-publish
 *
 * Allows any agent (Eliza-Cloud, Hermes, etc.) to publish a message
 * to the gossipsub mesh network via Vex's relay tunnel.
 *
 * POST /functions/v1/mesh-publish
 * Body: {
 *   "topic": "fleet-broadcast",       // Required: agent-heartbeat | agent-tasks | agent-discovery | fleet-broadcast
 *   "payload": { ... },               // Required: arbitrary JSON payload
 *   "agent": "eliza-cloud"            // Optional: agent identifier
 * }
 *
 * Returns the relay's mesh publish response.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Relay tunnel URL — the public endpoint for Vex's relay
const RELAY_TUNNEL_URL = "https://relay.mobilemonero.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { topic, payload, agent } = body;

    // Validate required fields
    if (!topic) {
      return new Response(
        JSON.stringify({ error: "topic is required", valid_topics: ["agent-heartbeat", "agent-tasks", "agent-discovery", "fleet-broadcast"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload) {
      return new Response(
        JSON.stringify({ error: "payload is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate topic
    const validTopics = ["agent-heartbeat", "agent-tasks", "agent-discovery", "fleet-broadcast"];
    if (!validTopics.includes(topic)) {
      return new Response(
        JSON.stringify({ error: `Invalid topic "${topic}"`, valid_topics: validTopics }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[mesh-publish] Publishing to "${topic}" from agent "${agent || 'unknown'}"`);

    // Include agent metadata in payload if provided
    const enrichedPayload = agent ? { ...payload, _agent: agent, _timestamp: Date.now() } : { ...payload, _timestamp: Date.now() };

    // Forward to relay's mesh publish endpoint through the tunnel
    const response = await fetch(`${RELAY_TUNNEL_URL}/mesh/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        payload: enrichedPayload,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[mesh-publish] Relay returned ${response.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Relay error: ${response.status}`, detail: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`[mesh-publish] Published successfully to "${topic}"`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(`[mesh-publish] Error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

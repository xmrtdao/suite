/**
 * eliza-relay — DEPRECATED as of 2026-06-10
 *
 * Why deprecated: This EF was designed for the OpenClaw → cloud-Eliza path
 * and writes to a stale `inbox_messages` table while routing through
 * `ai-chat` (which is the cloud Supabase function and is now offline in
 * the local-first stack). In the new architecture the local relay's
 * /ollama/chat endpoint provides the same capability against local Ollama
 * with a Gemini/DeepSeek fallback chain, without the extra hop and without
 * the dead tunnel.
 *
 * This stub returns 200 with a clear deprecation pointer so callers that
 * still hit /functions/v1/eliza-relay get a useful response instead of a
 * 504 timeout from the missing ai-chat upstream. The function is kept
 * registered so existing clients don't get 404s; the actual chat is
 * routed through the local relay instead.
 *
 * Migration: POST to {LOCAL_RELAY_URL}/ollama/chat with
 *   { "messages": [...], "model": "optional" }
 * Default LOCAL_RELAY_URL is http://127.0.0.1:8080.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const LOCAL_RELAY_URL = Deno.env.get("LOCAL_RELAY_URL") ?? "http://127.0.0.1:8080";
const DEPRECATED_SINCE = "2026-06-10";
const REPLACEMENT = `${LOCAL_RELAY_URL}/ollama/chat`;

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    let body: Record<string, unknown> = {};
    try {
        body = await req.json().catch(() => ({}));
    } catch { /* no body */ }
    const action = (body.action as string) ?? "send";

    // status is the one action that still does real work
    if (action === "status") {
        return json({
            status: "deprecated",
            deprecated_since: DEPRECATED_SINCE,
            function: "eliza-relay",
            replacement: REPLACEMENT,
            reason:
                "OpenClaw→cloud-Eliza path is offline; local-first stack uses /ollama/chat on the local relay",
            actions_supported_now: ["status"],
        });
    }

    // For send / check_reply / anything else, proxy to the local relay
    // when we can; otherwise return a clear deprecation notice.
    try {
        const upstream = await fetch(REPLACEMENT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: (body.message as string) ?? "",
                model: body.model,
            }),
        });
        const text = await upstream.text();
        let parsed: any = {};
        try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
        // Preserve legacy contract: callers expect a top-level `reply` field.
        // /ollama/chat returns { response: "<text>", model, done, ... } — hoist
        // that text so existing clients (relay's relayToElizaCloud, dashboard
        // fleet-chat router) keep working without code changes.
        const reply = typeof parsed?.response === "string"
            ? parsed.response
            : (parsed?.reply ?? null);
        return json({
            ok: upstream.ok,
            deprecated: true,
            deprecated_since: DEPRECATED_SINCE,
            replacement: REPLACEMENT,
            upstream_status: upstream.status,
            reply,                      // legacy field — hoisted from upstream
            response: parsed,           // full upstream payload (unchanged)
        });
    } catch (e) {
        // Local relay also unreachable — return explicit deprecation
        return json({
            ok: false,
            deprecated: true,
            deprecated_since: DEPRECATED_SINCE,
            replacement: REPLACEMENT,
            error: `Local relay unreachable at ${REPLACEMENT}: ${(e as Error).message}`,
            hint:
                "Start the local relay (node relay/server.js) or update LOCAL_RELAY_URL to point at a live relay.",
        }, 503);
    }
});

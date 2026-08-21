/**
 * _shared/cuttlefish-proxy.ts — Shared utility for cuttlefishclaws edge functions
 * Proxies tool calls to the relay's /tools/run endpoint
 */
export async function callRelayTool(toolName: string, args: Record<string, unknown> = {}): Promise<Response> {
  const RELAY_URL = Deno.env.get('RELAY_URL') || 'http://127.0.0.1:8080';
  const API_KEY = Deno.env.get('RELAY_API_KEY') || '3a02d6eecc89f1c700c097f9034479c24a56787acfbc996c5d17086ecd364602';

  try {
    const res = await fetch(`${RELAY_URL}/tools/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-agent-id': 'eliza',
      },
      body: JSON.stringify({ tool: toolName, args }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

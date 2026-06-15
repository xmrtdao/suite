// Simple hello-world Deno function for local-stack smoke tests
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const method = req.method;
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    /* no body */
  }
  return new Response(
    JSON.stringify({
      hello: "from deno",
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      ts: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});

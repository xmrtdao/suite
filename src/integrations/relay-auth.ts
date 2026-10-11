// ─────────────────────────────────────────────────────────────
// Relay auth headers — the dashboard session's API key, forwarded.
//
// The relay requires auth on every request that arrives through the
// Cloudflare tunnel (cf-ray header present) and on all /api/* paths from
// non-loopback clients. Whoever signed into the dashboard already holds the
// credential — this reads the stored session and attaches it as x-api-key so
// the browser pane, task visualizer, telemetry, and every other panel stay
// authorized without a second login. Loopback is exempt from relay auth, so
// on localhost this header is simply redundant.
// ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'suite-api-session';
const LEGACY_SESSION_KEY = 'local-dev-session';

export function getRelayApiKey(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return null;
    const key = JSON.parse(raw)?.apiKey;
    return typeof key === 'string' && key ? key : null;
  } catch {
    return null;
  }
}

export function relayAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = getRelayApiKey();
  return key ? { ...extra, 'x-api-key': key } : { ...extra };
}

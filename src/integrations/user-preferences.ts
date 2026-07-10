// ── User Preferences API (workspace persistence) ─────────────
// Saves/restores pinned tasks, column order, filters per user.

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('suite-api-token');
  if (token) return { 'x-api-key': token, 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json' };
}

const USER_ID = 'default'; // single-user for now; could be derived from API key

export interface UserPreferences {
  user_id: string;
  workspace_state: Record<string, any>;
  pinned_tasks: string[];
  pinned_agents: string[];
  column_order: string[];
  filters: Record<string, any>;
}

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const res = await fetch(`/api/suite/preferences/${USER_ID}`, { headers: authHeaders() });
    if (res.ok) return await res.json();
  } catch {}
  return { user_id: USER_ID, workspace_state: {}, pinned_tasks: [], pinned_agents: [], column_order: [], filters: {} };
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<boolean> {
  try {
    const res = await fetch(`/api/suite/preferences/${USER_ID}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(prefs),
    });
    return res.ok;
  } catch { return false; }
}

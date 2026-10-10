import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'user' | 'contributor' | 'moderator' | 'admin' | 'superadmin';

interface ApiKeySession {
  id: string;
  email: string;
  apiKey: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: any;
  profile: any;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  signInWithApiKey: (apiKey: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stable pseudo-user id for API-key sessions. Must be a syntactically valid
// UUID: it gets compared against uuid columns (inbox_messages.user_id), and
// Postgres rejects anything else with "invalid input syntax for type uuid".
const API_KEY_USER_ID = '00000000-0000-4000-8000-000000000001';

const isUuidLike = (value: unknown): boolean =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// API key is the only way in, so the store is named for that rather than for
// the local-dev scaffold it replaced.
const SESSION_KEY = 'suite-api-session';
// Sessions issued under the old name. Read once and migrated on restore, so
// shipping the rename does not sign every existing user out.
const LEGACY_SESSION_KEY = 'local-dev-session';

function persistSession(session: ApiKeySession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readStoredSession(): ApiKeySession | null {
  const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
  if (!raw) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  // Both fields are load-bearing. An id that is not a uuid 500s every query
  // that filters a uuid column; a session with no key cannot call anything.
  // Drop the whole thing rather than half-use it.
  if (!isUuidLike(parsed?.id) || typeof parsed?.apiKey !== 'string' || !parsed.apiKey) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  const session: ApiKeySession = {
    id: parsed.id,
    email: parsed.email ?? '',
    apiKey: parsed.apiKey,
  };
  persistSession(session);
  return session;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on mount (critical for page reloads).
  useEffect(() => {
    const restoreSession = async () => {
      // Try Supabase auth session first.
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.user) {
          setUser({ id: sbSession.user.id, email: sbSession.user.email || '' });
          setSession(sbSession);
          return;
        }
      } catch {
        // Supabase auth throws in local-sb mode — that's ok.
      }

      // ?api_key=... arrives from the login redirect.
      const urlApiKey = new URLSearchParams(window.location.search).get('api_key')?.trim();
      if (urlApiKey) {
        // Strip the key from the URL so it does not survive in history or in a
        // shared link.
        window.history.replaceState({}, '', window.location.pathname);
        const fresh: ApiKeySession = { id: API_KEY_USER_ID, email: 'api@suite.local', apiKey: urlApiKey };
        persistSession(fresh);
        setUser(fresh);
        setSession(fresh);
        return;
      }

      const stored = readStoredSession();
      if (stored) {
        setUser(stored);
        setSession(stored);
      }
    };

    // Every exit above — including a thrown one — has to clear isLoading.
    // ProtectedLayout renders a spinner for as long as it is true, so an early
    // return that skips this hangs the app on every route with no way out but
    // clearing storage by hand.
    restoreSession().finally(() => setIsLoading(false));
  }, []);

  const signInWithApiKey = useCallback((apiKey: string) => {
    const key = apiKey.trim();
    if (!key) throw new Error('Enter your API key');
    const fresh: ApiKeySession = { id: API_KEY_USER_ID, email: 'api@suite.local', apiKey: key };
    persistSession(fresh);
    setUser(fresh);
    setSession(fresh);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    // no-op: API-key sessions carry no profile
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    roles,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: roles.includes('admin') || roles.includes('superadmin'),
    isSuperadmin: roles.includes('superadmin'),
    signInWithApiKey,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

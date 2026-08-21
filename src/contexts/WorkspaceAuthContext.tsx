import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * WorkspaceAuthContext — IP-based auto-authentication
 *
 * Flow:
 *   1. On mount, check localStorage for a saved token
 *   2. If no token, call /api/auth/check-ip to see if this IP has an account
 *   3. If found, auto-login and redirect to dashboard
 *   4. If not found, show landing page with username input
 *   5. On username submit, POST /api/auth/workspace to create account
 *   6. Token is stored in localStorage and used for all subsequent requests
 */

type WorkspaceUser = {
  id: string;
  username: string;
  displayName: string;
  token: string;
};

interface WorkspaceAuthContextType {
  user: WorkspaceUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;  // IP not found, user needs to pick a username
  createWorkspace: (username: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
}

const WorkspaceAuthContext = createContext<WorkspaceAuthContextType | undefined>(undefined);

const TOKEN_KEY = 'workspace-auth-token';
const USER_KEY = 'workspace-auth-user';

// Use relative path so it works through the Cloudflare tunnel
const API_BASE = '';  // requests go to same origin (relay.mobilemonero.com or localhost:8080)

export function WorkspaceAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // On mount: try to restore session
  useEffect(() => {
    const restore = async () => {
      // 1. Check localStorage for saved token
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        try {
          // Verify token is still valid
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'x-workspace-token': savedToken },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.user) {
              setUser(data.user);
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
              setIsLoading(false);
              return;
            }
          }
          // Token invalid — clear and fall through to IP check
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        } catch {
          // Network error — try to use saved user as fallback
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setIsLoading(false);
            return;
          } catch {
            // Fall through
          }
        }
      }

      // 2. Check if IP has an existing account (auto-detect)
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-ip`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.found && data.user) {
            setUser(data.user);
            localStorage.setItem(TOKEN_KEY, data.user.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Network error — will show landing page
      }

      // 3. No account found — show onboarding (username input)
      setNeedsOnboarding(true);
      setIsLoading(false);
    };

    restore();
  }, []);

  const createWorkspace = useCallback(async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setNeedsOnboarding(false);
        localStorage.setItem(TOKEN_KEY, data.user.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { ok: true };
      }
      return { ok: false, error: data.error || 'Failed to create workspace' };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Network error' };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setNeedsOnboarding(true);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value: WorkspaceAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsOnboarding,
    createWorkspace,
    signOut,
  };

  return (
    <WorkspaceAuthContext.Provider value={value}>
      {children}
    </WorkspaceAuthContext.Provider>
  );
}

export function useWorkspaceAuth() {
  const ctx = useContext(WorkspaceAuthContext);
  if (!ctx) throw new Error('useWorkspaceAuth must be used within WorkspaceAuthProvider');
  return ctx;
}

// Helper: get auth token for API calls
export function getWorkspaceToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Helper: auth headers for fetch calls
export function workspaceAuthHeaders(): Record<string, string> {
  const token = getWorkspaceToken();
  return token ? { 'x-workspace-token': token } : {};
}
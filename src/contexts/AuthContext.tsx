import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'user' | 'contributor' | 'moderator' | 'admin' | 'superadmin';

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: any;
  profile: any;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  hasGoogleCloudConnection: boolean;
  signInWithGoogle: (email?: string) => Promise<void>;
  connectGoogleCloud: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount (critical for page reloads)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try Supabase auth session first
        const { data: { session: sbSession }, error } = await supabase.auth.getSession();
        if (sbSession?.user) {
          setUser({ id: sbSession.user.id, email: sbSession.user.email || '' });
          setSession(sbSession);
          setIsLoading(false);
          return;
        }
      } catch {
        // Supabase auth would throw in local-sb mode — that's ok
      }

      // Local-dev fallback: check for an existing local-dev session in localStorage
      const saved = localStorage.getItem('local-dev-session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setSession(parsed);
        } catch {
          localStorage.removeItem('local-dev-session');
        }
      }

      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const signInWithGoogle = useCallback(async (_email?: string) => {
    console.log('[Auth] Google sign-in bypassed for local dev');
  }, []);

  const connectGoogleCloud = useCallback(async () => {
    console.log('[Auth] Google Cloud connect bypassed for local dev');
  }, []);

  const signInWithEmail = useCallback(async (_email: string, _password: string) => {
    const sessionData = { id: 'local-dev', email: _email };
    setUser(sessionData);
    setSession(sessionData);
    localStorage.setItem('local-dev-session', JSON.stringify(sessionData));
    return { error: null };
  }, []);

  const signUpWithEmail = useCallback(async (_email: string, _password: string, _fullName?: string) => {
    setUser({ id: 'local-dev', email: _email });
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('local-dev-session');
  }, []);

  const refreshProfile = useCallback(async () => {
    // no-op for local dev
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
    hasGoogleCloudConnection: false,
    signInWithGoogle,
    connectGoogleCloud,
    signInWithEmail,
    signUpWithEmail,
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

import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const [session] = useState<any>(null);
  const [profile] = useState<any>(null);
  const [roles] = useState<AppRole[]>([]);
  const [isLoading] = useState(false);

  const signInWithGoogle = useCallback(async (_email?: string) => {
    console.log('[Auth] Google sign-in bypassed for local dev');
  }, []);

  const connectGoogleCloud = useCallback(async () => {
    console.log('[Auth] Google Cloud connect bypassed for local dev');
  }, []);

  const signInWithEmail = useCallback(async (_email: string, _password: string) => {
    setUser({ id: 'local-dev', email: _email });
    return { error: null };
  }, []);

  const signUpWithEmail = useCallback(async (_email: string, _password: string, _fullName?: string) => {
    setUser({ id: 'local-dev', email: _email });
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
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

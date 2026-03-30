import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import api from '@/services/api';

export type UserRole = 'guest' | 'staff' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  dbUser: Record<string, unknown> | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [dbUser, setDbUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const syncAndFetchUser = useCallback(async (supabaseUser: User) => {
    console.log('AuthContext: syncAndFetchUser starting for', supabaseUser.email);
    try {
      // Sync user to MongoDB backend
      console.log('AuthContext: Posting to /auth/sync-user...');
      const syncRes = await api.post('/auth/sync-user', {
        supabaseUserId: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email,
      });
      console.log('AuthContext: Sync successful:', syncRes.data);

      // Fetch user role from backend
      console.log('AuthContext: Fetching /users/me...');
      const res = await api.get('/users/me');
      console.log('AuthContext: DB User fetched:', res.data);
      setDbUser(res.data);
      setRole(res.data.role as UserRole);
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number }; message?: string };
      console.error('AuthContext: syncAndFetchUser error:', errObj?.response || errObj?.message || err);
      
      if (errObj?.response?.status === 403) {
        console.warn('AuthContext: Sync failed with 403. This usually indicates a token/ID mismatch between Supabase and Backend.');
      }

      // EMERGENCY FALLBACK: If sync fails but this is our main dev account, grant access anyway
      if (supabaseUser.email === 'u8294342@gmail.com') {
        console.warn('AuthContext: Sync failed but granting EMERGENCY ADMIN access for', supabaseUser.email);
        setRole('admin');
        setDbUser({ 
          email: supabaseUser.email, 
          role: 'admin', 
          name: 'Admin User (Emergency Access)' 
        });
      } else {
        setRole('guest');
        setDbUser(null);
      }
    }
  }, []);

  useEffect(() => {
    let initialized = false;

    const handleInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await syncAndFetchUser(session.user);
        }
      } catch (err) {
        console.error('AuthContext: Initial session error:', err);
      } finally {
        if (!initialized) {
          setLoading(false);
          initialized = true;
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('AuthContext: onAuthStateChange event:', _event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await syncAndFetchUser(session.user);
        } else {
          setRole(null);
          setDbUser(null);
        }
        
        if (!initialized) {
          setLoading(false);
          initialized = true;
        }
      }
    );

    handleInitialSession();

    return () => subscription.unsubscribe();
  }, [syncAndFetchUser]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    console.log('AuthContext: Starting signOut...');
    try {
      await supabase.auth.signOut();
      console.log('AuthContext: Supabase signOut successful');
    } catch (error) {
      console.error('AuthContext: Supabase signOut error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setDbUser(null);
      console.log('AuthContext: Local state cleared');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, role, dbUser, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

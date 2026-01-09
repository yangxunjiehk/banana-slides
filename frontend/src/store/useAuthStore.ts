/**
 * Authentication state management
 * Reference: MandarinTest/frontend/src/store/authStore.ts
 */
import { create } from 'zustand';
import { supabase, isAuthEnabled } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    // If auth is not enabled, mark as authenticated (no login required)
    if (!isAuthEnabled || !supabase) {
      set({
        isLoading: false,
        isAuthenticated: true,
        isInitialized: true,
      });
      return;
    }

    set({ isLoading: true });

    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isInitialized: true,
        isLoading: false,
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) return;

    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Sign in error:', error);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      set({ isLoading: false });
    }
  },

  signInWithMagicLink: async (email: string) => {
    if (!supabase) return { success: false, error: 'Auth not configured' };

    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      set({ isLoading: false });

      if (error) {
        console.error('Magic link error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Magic link error:', error);
      set({ isLoading: false });
      return { success: false, error: error.message || 'Failed to send magic link' };
    }
  },

  signOut: async () => {
    // Clear state immediately (reference: MandarinTest pattern)
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isInitialized: true,
    });

    // Clear project state
    localStorage.removeItem('currentProjectId');

    // Call Supabase signOut asynchronously
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
  },

  clearAuth: () => {
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },
}));

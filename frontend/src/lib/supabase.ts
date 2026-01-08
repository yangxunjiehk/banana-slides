/**
 * Supabase client initialization
 *
 * Authentication is optional - if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are not configured, auth features are disabled and the app works without login.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if both URL and key are configured
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

// Check if authentication is enabled
export const isAuthEnabled = !!supabase;

// Log auth status for debugging
if (isAuthEnabled) {
  console.log('Supabase authentication enabled');
} else {
  console.log('Supabase authentication disabled (no credentials configured)');
}

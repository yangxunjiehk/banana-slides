/**
 * OAuth callback handler
 * Handles the redirect from Supabase OAuth providers
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        navigate('/', { replace: true });
        return;
      }

      try {
        // Get the session from URL hash (Supabase stores tokens in URL fragment)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (!session) {
          // No session yet, wait for onAuthStateChange to trigger
          // The auth listener in useAuthStore will update the state
          console.log('Waiting for auth state to update...');
        }
        // Don't navigate here - let the effect below handle it based on isAuthenticated
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  // Navigate based on actual auth state from store
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        navigate('/', { replace: true });
      } else {
        // Give a small delay to allow auth state to update
        const timer = setTimeout(() => {
          if (!useAuthStore.getState().isAuthenticated) {
            navigate('/login', { replace: true });
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, isInitialized, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

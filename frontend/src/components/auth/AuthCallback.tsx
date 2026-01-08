/**
 * OAuth callback handler
 * Handles the redirect from Supabase OAuth providers
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/api/client';

export function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

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

        if (session) {
          // Session obtained, now verify whitelist before proceeding
          setVerifying(true);
          try {
            await apiClient.get('/api/auth/verify');
            // User is in whitelist, allow access
            setVerified(true);
          } catch (verifyError: any) {
            if (verifyError.response?.status === 403) {
              // User not in whitelist - sign out and redirect to login
              console.error('User not in whitelist');
              await supabase.auth.signOut();
              navigate('/login?error=forbidden', { replace: true });
              return;
            }
            // Other errors - let them through, will be handled by normal flow
            console.error('Verify error:', verifyError);
            setVerified(true);
          } finally {
            setVerifying(false);
          }
        } else {
          // No session yet, wait for onAuthStateChange to trigger
          console.log('Waiting for auth state to update...');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  // Navigate based on actual auth state from store (only after verification)
  useEffect(() => {
    if (isInitialized && verified) {
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
  }, [isAuthenticated, isInitialized, verified, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">
          {verifying ? 'Verifying access...' : 'Completing sign in...'}
        </p>
      </div>
    </div>
  );
}

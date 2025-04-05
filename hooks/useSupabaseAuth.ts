
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { toast } from 'sonner';
import { isDevelopmentMode, logDevModeBypass } from '@/utils/devMode';

export function useSupabaseAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthState = async () => {
      setIsLoading(true);
      
      // Development mode bypass - simulate authenticated admin user
      if (isDevelopmentMode()) {
        logDevModeBypass('authentication');
        setUserId('dev-admin-user-id');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          setIsAuthenticated(true);
        } else {
          setUserId(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error checking auth state:', err);
        setUserId(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();

    // Skip auth listener setup in development mode
    if (isDevelopmentMode()) {
      return;
    }

    // Listen for auth state changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
        setIsAuthenticated(!!user);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getCurrentUser = async () => {
    // In development mode, return a mock user
    if (isDevelopmentMode()) {
      logDevModeBypass('getCurrentUser');
      return {
        id: 'dev-admin-user-id',
        email: 'dev-admin@example.com',
        user_metadata: {
          name: 'Dev Admin'
        },
        // Add any other user properties needed for testing
      };
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  };

  return {
    isLoading,
    isAuthenticated,
    userId,
    getCurrentUser
  };
}

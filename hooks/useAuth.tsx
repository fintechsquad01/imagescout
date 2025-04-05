
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isDevelopmentMode } from '@/utils/devMode';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // In development mode, simulate being authenticated
      if (isDevelopmentMode()) {
        setIsAuthenticated(true);
        setUserId('dev-user-id');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        setIsAuthenticated(!!data.user);
        setUserId(data.user?.id || null);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setUserId(session?.user?.id || null);
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      if (isDevelopmentMode()) {
        console.log('[DEV] Sign out simulated');
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default useAuth;

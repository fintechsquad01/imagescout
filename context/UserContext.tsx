
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { toast } from 'sonner';

type UserContextType = {
  userProfile: any | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  userProfile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isAuthenticated } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!userId || !isAuthenticated) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in user profile fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId, isAuthenticated]);

  return (
    <UserContext.Provider 
      value={{ 
        userProfile, 
        isLoading,
        refreshProfile: fetchUserProfile 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

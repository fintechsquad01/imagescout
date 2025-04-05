
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';

// Use camelCase for type definitions
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  requiredPlan?: string;
  createdAt?: string;
  defaultValue?: any;
  metadata?: Record<string, any>;
}

export interface UserFeatureFlag extends FeatureFlag {
  userId: string;
  value: any;
}

interface FeatureFlagValues {
  [key: string]: any;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [userFlags, setUserFlags] = useState<UserFeatureFlag[]>([]);
  const [flagValues, setFlagValues] = useState<FeatureFlagValues>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, getCurrentUser } = useSupabaseAuth();

  const fetchFeatureFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');
        
      if (error) {
        console.error('Error fetching feature flags:', error);
        setError(error.message);
        toast.error(`Failed to load feature flags: ${error.message}`);
      } else {
        setFlags(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching feature flags:', err);
      setError('An unexpected error occurred while loading feature flags.');
      toast.error('An unexpected error occurred while loading feature flags.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserFeatureFlags = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_feature_flags')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user feature flags:', error);
        setError(error.message);
        toast.error(`Failed to load user-specific feature flags: ${error.message}`);
      } else {
        setUserFlags(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching user feature flags:', err);
      setError('An unexpected error occurred while loading user-specific feature flags.');
      toast.error('An unexpected error occurred while loading user-specific feature flags.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  useEffect(() => {
    fetchUserFeatureFlags();
  }, [fetchUserFeatureFlags]);

  useEffect(() => {
    const initialFlagValues: FeatureFlagValues = {};
    flags.forEach(flag => {
      initialFlagValues[flag.name] = flag.enabled;
    });
    setFlagValues(initialFlagValues);
  }, [flags]);

  // Fixed function to get flag value with proper arguments
  const getFlagValue = useCallback((flagName: string) => {
    if (!flagName) return false;
    
    const flag = userFlags.find(f => f.name === flagName);
    
    if (flag) {
      // User has a specific value set
      return flag.value;
    }
    
    // Get global flag
    const globalFlag = flags.find(f => f.name === flagName);
    
    if (globalFlag) {
      // Return default value if available
      return globalFlag.enabled ? (globalFlag.defaultValue !== undefined ? globalFlag.defaultValue : true) : false;
    }
    
    // Flag not found
    return false;
  }, [flags, userFlags]);

  const hasFeatureAccess = useCallback((featureName: string) => {
    return getFlagValue(featureName) === true;
  }, [getFlagValue]);

  // Add the missing isFeatureEnabled function that's being called in many components
  const isFeatureEnabled = useCallback((featureName: string) => {
    return hasFeatureAccess(featureName);
  }, [hasFeatureAccess]);

  return {
    flags,
    userFlags,
    flagValues,
    isLoading,
    error,
    getFlagValue,
    hasFeatureAccess,
    isFeatureEnabled // Export the missing function
  };
};


import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { toast } from 'sonner';
import { ScoringConfig, DEFAULT_SCORING_CONFIG, scoringConfigSchema } from '@/types/scoring-config';
import { isDevelopmentMode } from '@/utils/devMode';
import { useRoleCheck } from '@/hooks/useRoleCheck';

/**
 * Fetch the active scoring configuration from Supabase
 */
const fetchActiveScoringConfig = async (): Promise<ScoringConfig> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('scoring_configs')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.warn('Error fetching scoring config:', error.message);
      throw error;
    }
    
    // If no active configuration found, return default
    if (!data) {
      console.warn('No active scoring config found, using default');
      return DEFAULT_SCORING_CONFIG;
    }
    
    // Validate the data against schema
    const parsedConfig = scoringConfigSchema.safeParse(data);
    
    if (!parsedConfig.success) {
      console.error('Invalid scoring config format:', parsedConfig.error);
      throw new Error('The scoring configuration format is invalid');
    }
    
    return parsedConfig.data;
  } catch (error) {
    console.error('Error fetching scoring config:', error);
    // Return default config instead of throwing
    return DEFAULT_SCORING_CONFIG;
  }
};

/**
 * Fetch all available scoring configurations
 */
const fetchAllScoringConfigs = async (): Promise<ScoringConfig[]> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('scoring_configs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Always ensure we have at least the default config
    if (!data || data.length === 0) {
      return [DEFAULT_SCORING_CONFIG];
    }
    
    return data as ScoringConfig[];
  } catch (error) {
    console.error('Error fetching all scoring configs:', error);
    // Return array with just the default config
    return [DEFAULT_SCORING_CONFIG];
  }
};

/**
 * Fetch specific scoring configurations by their IDs
 */
const fetchScoringConfigsByIds = async (configIds: string[]): Promise<ScoringConfig[]> => {
  if (!configIds || configIds.length === 0) {
    return [];
  }
  
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('scoring_configs')
      .select('*')
      .in('id', configIds);
    
    if (error) {
      throw error;
    }
    
    return data as ScoringConfig[];
  } catch (error) {
    console.error('Error fetching scoring configs by IDs:', error);
    return [];
  }
};

/**
 * Hook to fetch and manage the active scoring configuration
 */
export function useScoringConfig() {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const queryClient = useQueryClient();
  const { isAuthorized: isAdmin } = useRoleCheck(['admin']);
  
  // Fetch the active scoring config
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['scoringConfig'],
    queryFn: fetchActiveScoringConfig,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
  
  // Fetch all available configs for admin users or dev mode
  const { 
    data: allConfigs,
    isLoading: isLoadingAllConfigs,
    error: allConfigsError,
    refetch: refetchAllConfigs
  } = useQuery({
    queryKey: ['allScoringConfigs'],
    queryFn: fetchAllScoringConfigs,
    enabled: isAdmin || isDevelopmentMode(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Create a mutation to activate a config
  const activateConfigMutation = useMutation({
    mutationFn: async (configId: string) => {
      const supabase = getSupabaseClient();
      
      // First deactivate all configs
      const { error: deactivateError } = await supabase
        .from('scoring_configs')
        .update({ is_active: false })
        .eq('is_active', true);
      
      if (deactivateError) throw deactivateError;
      
      // Then activate the selected one
      const { error: activateError } = await supabase
        .from('scoring_configs')
        .update({ is_active: true })
        .eq('id', configId);
      
      if (activateError) throw activateError;
      
      return true;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['scoringConfig'] });
      queryClient.invalidateQueries({ queryKey: ['allScoringConfigs'] });
      
      toast.success('Scoring configuration activated successfully');
    },
    onError: (error) => {
      console.error('Error activating config:', error);
      toast.error('Failed to activate configuration');
    }
  });
  
  useEffect(() => {
    if (data) {
      setConfig(data);
      setIsUsingFallback(false);
    } else if (error) {
      console.warn('Using fallback scoring config due to error:', error);
      setConfig(DEFAULT_SCORING_CONFIG);
      setIsUsingFallback(true);
      
      if (isDevelopmentMode()) {
        console.warn('Using fallback scoring config:', DEFAULT_SCORING_CONFIG);
      }
    }
  }, [data, error]);
  
  // Always ensure config is not undefined at minimum
  useEffect(() => {
    if (!config) {
      setConfig(DEFAULT_SCORING_CONFIG);
      setIsUsingFallback(true);
      console.warn('Config was undefined, using fallback');
    }
  }, [config]);

  const calculateScore = (visionData: any): number => {
    // Use the current config, falling back to DEFAULT_SCORING_CONFIG if not available
    const currentConfig = config || DEFAULT_SCORING_CONFIG;
    
    if (!visionData) {
      return Math.floor(Math.random() * 46) + currentConfig.weights.baseScore;
    }
    
    let score = 0;
    
    // Apply weights from config with nullish coalescing for safety
    score += Math.min((visionData.labels?.length ?? 0) * currentConfig.weights.labels, 25);
    score += Math.min((visionData.objects?.length ?? 0) * currentConfig.weights.objects, 20);
    score += ((visionData.landmarks?.length ?? 0) * currentConfig.weights.landmarks);
    score += Math.min((visionData.colors?.length ?? 0) * currentConfig.weights.colors, 15);
    
    // Base score to ensure minimum
    const baseScore = currentConfig.weights.baseScore;
    
    // Combine all factors
    const totalScore = baseScore + score;
    
    // Cap score at max
    return Math.min(Math.round(totalScore), currentConfig.weights.maxScore);
  };
  
  /**
   * Activate a different scoring configuration
   */
  const activateConfig = async (configId: string) => {
    if (!isAdmin && !isDevelopmentMode()) {
      toast.error('You do not have permission to change scoring configurations');
      return;
    }
    
    return activateConfigMutation.mutate(configId);
  };
  
  /**
   * Fetch multiple scoring configurations by their IDs
   */
  const getConfigsByIds = async (configIds: string[]): Promise<ScoringConfig[]> => {
    if (!configIds || configIds.length === 0) {
      return [];
    }
    
    try {
      const configs = await fetchScoringConfigsByIds(configIds);
      
      // If we can't fetch or got no results, try to extract from allConfigs if available
      if (configs.length === 0 && allConfigs) {
        return allConfigs.filter(config => configIds.includes(config.id));
      }
      
      return configs;
    } catch (error) {
      console.error('Error fetching configs by IDs:', error);
      
      // If we can't fetch, try to extract from allConfigs if available
      if (allConfigs) {
        return allConfigs.filter(config => configIds.includes(config.id));
      }
      
      // Last resort, return default config
      return [DEFAULT_SCORING_CONFIG];
    }
  };
  
  return {
    // Always return a safe config even if data loading fails
    config: config || DEFAULT_SCORING_CONFIG,
    isLoading,
    error,
    isUsingFallback,
    calculateScore,
    refetch,
    // Admin/dev features
    allConfigs: allConfigs || [DEFAULT_SCORING_CONFIG], // Ensure allConfigs is never undefined
    isLoadingAllConfigs,
    allConfigsError,
    refetchAllConfigs,
    activateConfig,
    getConfigsByIds,
    isActivating: activateConfigMutation.isPending
  };
}

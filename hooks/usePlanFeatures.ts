
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlanType } from '@/types/ui';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { getSafePlanType } from '@/types/ui';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

// Define plan feature limits
const planLimits = {
  [PlanType.FREE]: {
    maxUploadsPerDay: 20,
    maxModelsPerProject: 3,
    advancedAnalytics: false,
    priorityProcessing: false,
    customDomain: false,
    teamSeats: 1,
    supportResponseTime: '48 hours',
    maxProjects: 3
  },
  [PlanType.PRO]: {
    maxUploadsPerDay: 100,
    maxModelsPerProject: 10,
    advancedAnalytics: true,
    priorityProcessing: true,
    customDomain: true,
    teamSeats: 1,
    supportResponseTime: '24 hours',
    maxProjects: 10
  },
  [PlanType.TEAM]: {
    maxUploadsPerDay: 500,
    maxModelsPerProject: 20,
    advancedAnalytics: true,
    priorityProcessing: true,
    customDomain: true,
    teamSeats: 5,
    supportResponseTime: '12 hours',
    maxProjects: 100
  },
  [PlanType.ENTERPRISE]: {
    maxUploadsPerDay: 2000,
    maxModelsPerProject: 100,
    advancedAnalytics: true,
    priorityProcessing: true,
    customDomain: true,
    teamSeats: 100,
    supportResponseTime: '4 hours',
    maxProjects: 1000 // Changed from 'Unlimited' to a numeric value
  }
};

export type PlanFeatures = typeof planLimits[PlanType.FREE];

export const usePlanFeatures = () => {
  const { isAuthenticated, userId } = useSupabaseAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanType>(PlanType.FREE);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user's subscription data
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      if (!isAuthenticated || !userId) {
        setCurrentPlan(PlanType.FREE);
        return null;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            console.error('Error fetching subscription:', error);
            toast({
              title: 'Error',
              description: 'Could not load subscription data',
              variant: 'destructive'
            });
          }
          
          setCurrentPlan(PlanType.FREE);
          return null;
        }
        
        if (data) {
          const planName = data.plan_name?.toLowerCase() || 'free';
          
          if (planName.includes('enterprise')) {
            setCurrentPlan(PlanType.ENTERPRISE);
          } else if (planName.includes('team')) {
            setCurrentPlan(PlanType.TEAM);
          } else if (planName.includes('pro')) {
            setCurrentPlan(PlanType.PRO);
          } else {
            setCurrentPlan(PlanType.FREE);
          }
          
          return data;
        } else {
          setCurrentPlan(PlanType.FREE);
          return null;
        }
      } catch (error) {
        console.error('Error in usePlanFeatures:', error);
        setCurrentPlan(PlanType.FREE);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: isAuthenticated && !!userId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Set the default plan for unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPlan(PlanType.FREE);
    }
  }, [isAuthenticated]);
  
  // Get features based on the current plan
  const getPlanFeatures = (plan: PlanType): PlanFeatures => {
    const safePlan = getSafePlanType(plan);
    return planLimits[safePlan];
  };
  
  // Check if a specific feature is available in the current plan
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    const features = getPlanFeatures(currentPlan);
    return Boolean(features[feature]);
  };

  // Function to check if user has access to a specific feature
  const hasFeatureAccess = (featureName: string): boolean => {
    switch (featureName) {
      case 'advanced_analytics':
        return hasFeature('advancedAnalytics');
      case 'custom_domain':
        return hasFeature('customDomain');
      case 'priority_processing':
        return hasFeature('priorityProcessing');
      default:
        return false;
    }
  };
  
  // Get the current limit for a numeric feature
  const getFeatureLimit = (feature: keyof PlanFeatures): number => {
    const features = getPlanFeatures(currentPlan);
    return Number(features[feature]);
  };
  
  // Reset to free plan for testing
  const resetToFreePlan = () => {
    setCurrentPlan(PlanType.FREE);
  };
  
  return {
    plan: currentPlan, // Renamed from currentPlan to plan for compatibility
    currentPlan,
    isLoading: isLoading || isSubscriptionLoading,
    subscriptionData,
    features: getPlanFeatures(currentPlan),
    hasFeature,
    hasFeatureAccess,
    getFeatureLimit,
    resetToFreePlan
  };
};

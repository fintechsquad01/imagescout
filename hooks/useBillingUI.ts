
import { useState } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { BillingPlan } from '@/types/admin-dashboard';
import { PlanType, getSafePlanType } from '@/types/types';
import { toast } from 'sonner';

// Mock plans data - in a real implementation, this would come from Supabase
const PLANS: BillingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic access with limited features',
    price: 0,
    interval: 'month',
    features: [
      '5 daily generations',
      'Basic models only',
      '7-day history retention',
      'Standard support'
    ],
    color: '#6E59A5'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for power users',
    price: 19.90,
    interval: 'month',
    features: [
      '50 daily generations',
      'Premium models',
      '30-day history retention',
      'Multi-project support',
      'Advanced analytics',
      'Priority support'
    ],
    isPopular: true,
    color: '#9b87f5'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for businesses',
    price: 49.90,
    interval: 'month',
    features: [
      'Unlimited generations',
      'All models including custom',
      '90-day history retention',
      'Unlimited projects',
      'Advanced analytics',
      'Dedicated support',
      'Custom feature development'
    ],
    color: '#D6BCFA'
  }
];

interface UseBillingUIOptions {
  onError?: (error: Error) => void;
}

export function useBillingUI(options?: UseBillingUIOptions) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const { plan, isLoading: planLoading } = usePlanFeatures();
  const { 
    handleUpgrade,
    handleManageBilling,
    isRedirecting,
    isProcessing,
    inviteOnly,
    enableStripeBilling 
  } = useBilling();

  // Enhanced upgrade handler with better error handling
  const handlePlanUpgrade = async (planId: string) => {
    try {
      // Verify this is a valid plan before proceeding
      const safePlanId = getSafePlanType(planId);
      
      console.log('[Stripe Billing] Initiating plan upgrade to:', safePlanId);
      await handleUpgrade(safePlanId);
    } catch (error) {
      console.error('[Stripe Billing] Upgrade error:', error);
      toast.error('Failed to process upgrade. Please try again later.');
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
    }
  };

  // Enhanced billing management handler with better error handling
  const handleBillingManagement = async () => {
    try {
      console.log('[Stripe Billing] Opening billing portal');
      await handleManageBilling();
    } catch (error) {
      console.error('[Stripe Billing] Billing portal error:', error);
      toast.error('Unable to access billing portal. Please try again later.');
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }
    }
  };

  // Get plans with adjusted prices based on billing interval
  const getPlans = () => {
    return PLANS.map(planData => ({
      ...planData,
      // Adjust price for yearly billing (15% discount)
      price: billingInterval === 'year' 
        ? planData.price * 12 * 0.85 
        : planData.price,
      interval: billingInterval
    }));
  };

  return {
    billingInterval,
    setBillingInterval,
    plan,
    planLoading,
    isRedirecting,
    isProcessing,
    inviteOnly,
    enableStripeBilling,
    handlePlanUpgrade,
    handleBillingManagement,
    plans: getPlans(),
    isCurrent: (planId: string): boolean => planId === plan,
  };
}

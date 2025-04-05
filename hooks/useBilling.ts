import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { createStripeCheckoutSession, createStripePortalSession, syncUserPlanAfterCheckout } from '@/utils/stripe-api';
import { useSearchParams } from 'react-router-dom';
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { isDevelopmentMode, logDevModeBypass, logStripeBillingBypass } from '@/utils/devMode';

export function useBilling() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isFeatureEnabled } = useFeatureFlags();
  const { userId } = useSupabaseAuth();
  const [searchParams] = useSearchParams();
  
  // In development mode, override these flags
  const inviteOnly = isDevelopmentMode() ? false : !isFeatureEnabled('invite_system');
  const enableStripeBilling = isDevelopmentMode() ? true : isFeatureEnabled('enable_stripe_billing');

  // Handle post-checkout sync
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    
    async function handleCheckoutReturn() {
      if (sessionId && success === 'true' && userId && enableStripeBilling) {
        setIsProcessing(true);
        try {
          console.log('[Stripe Billing] Processing checkout return, session ID:', sessionId);
          
          if (isDevelopmentMode()) {
            logStripeBillingBypass();
            // Simulate processing delay in development
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            await syncUserPlanAfterCheckout(userId, sessionId);
          }
          // Toast notification is handled in BillingPage through URL params
        } catch (error) {
          console.error('[Stripe Billing] Checkout sync error:', error);
          toast.error('Failed to update subscription. Please contact support.');
        } finally {
          setIsProcessing(false);
        }
      }
    }
    
    handleCheckoutReturn();
  }, [searchParams, userId, enableStripeBilling]);

  const handleUpgrade = async (planId: string) => {
    // Development mode bypass
    if (isDevelopmentMode()) {
      logStripeBillingBypass();
      toast.info(`[DEV MODE] Simulating upgrade to ${planId} plan`);
      setIsRedirecting(true);
      
      // Simulate a redirect delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success redirect
      window.location.href = `?success=true&message=Dev%20mode%20upgrade%20to%20${planId}%20plan%20simulated`;
      return;
    }
    
    // Feature flag check
    if (!enableStripeBilling) {
      toast.info('Billing system is currently in demo mode. No actual charges will be made.');
      // Still allow the upgrade in demo mode for testing
    }
    
    if (inviteOnly) {
      toast.info('Upgrades are currently invite-only. Please contact support for access.');
      return;
    }

    if (!userId) {
      toast.error('You must be logged in to upgrade your plan');
      return;
    }
    
    setIsRedirecting(true);
    
    try {
      console.log('[Stripe Billing] Initiating upgrade to plan:', planId);
      
      if (enableStripeBilling) {
        // Real Stripe implementation
        const checkoutSession = await createStripeCheckoutSession(planId, userId);
        
        if (checkoutSession?.url) {
          toast.success(`Redirecting to Stripe checkout...`);
          window.location.href = checkoutSession.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // Placeholder for when Stripe is not enabled
        toast.success(`Redirecting to upgrade for ${planId} plan...`);
        // Simulate success after a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In demo mode, we'll just show a success message
        window.location.href = `?success=true&message=Demo%20upgrade%20to%20${planId}%20plan%20successful`;
      }
    } catch (error) {
      console.error('[Stripe Billing] Error creating checkout session:', error);
      toast.error('Failed to redirect to checkout. Please try again later.');
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleManageBilling = async () => {
    // Development mode bypass
    if (isDevelopmentMode()) {
      logStripeBillingBypass();
      toast.info('[DEV MODE] Simulating access to billing portal');
      setIsRedirecting(true);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('[DEV MODE] Billing portal access simulated');
      setIsRedirecting(false);
      return;
    }
    
    if (!userId) {
      toast.error('You must be logged in to manage your billing');
      return;
    }
    
    // Feature flag check
    if (!enableStripeBilling) {
      toast.info('Billing system is currently in demo mode. No actual management is available.');
      return;
    }
    
    setIsRedirecting(true);
    
    try {
      console.log('[Stripe Billing] Opening billing portal');
      const stripeCustomerId = await getStripeCustomerId();
      
      if (!stripeCustomerId) {
        toast.error('No billing information found. Please upgrade to a paid plan first.');
        setIsRedirecting(false);
        return;
      }
      
      // Real Stripe Customer Portal implementation
      const portalSession = await createStripePortalSession(userId);
      
      if (portalSession?.url) {
        toast.success('Redirecting to billing portal...');
        window.location.href = portalSession.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('[Stripe Billing] Error creating portal session:', error);
      toast.error('Failed to redirect to billing portal. Please try again later.');
    } finally {
      setIsRedirecting(false);
    }
  };

  // Helper function to check if a user has a Stripe customer ID
  const getStripeCustomerId = async (): Promise<string | null> => {
    // In development mode, return a fake customer ID
    if (isDevelopmentMode()) {
      logDevModeBypass('Stripe customer ID check');
      return 'dev-stripe-customer-id';
    }
    
    if (!userId || !enableStripeBilling) return null;

    try {
      console.log('[Stripe Billing] Fetching customer ID for user:', userId);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Stripe Billing] Error fetching Stripe customer ID:', error);
        return null;
      }

      return data?.stripe_customer_id || null;
    } catch (error) {
      console.error('[Stripe Billing] Error in getStripeCustomerId:', error);
      return null;
    }
  };

  return {
    isRedirecting,
    isProcessing,
    inviteOnly,
    enableStripeBilling,
    handleUpgrade,
    handleManageBilling,
    getStripeCustomerId
  };
}

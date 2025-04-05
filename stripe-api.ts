
/**
 * This file contains utility functions for interacting with Stripe API.
 * In a real implementation, these would be Edge Functions or serverless functions.
 */

import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabaseLogger';

// This is just a mock function - in a real implementation, this would be a serverless function
export async function createStripeCheckoutSession(planId: string, userId: string): Promise<{ url: string } | null> {
  try {
    console.log('[Stripe API] Creating checkout session for plan:', planId, 'user:', userId);
    // In a real implementation, this would call a serverless function
    // that uses the Stripe API to create a checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, userId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Stripe API] Checkout session error:', errorData);
      throw new Error(errorData.message || 'Failed to create checkout session');
    }
    
    const data = await response.json();
    console.log('[Stripe API] Checkout session created successfully');
    return data;
  } catch (error) {
    console.error('[Stripe API] Error creating checkout session:', error);
    toast.error('Failed to create checkout session. Please try again later.');
    return null;
  }
}

export async function createStripePortalSession(userId: string): Promise<{ url: string } | null> {
  try {
    console.log('[Stripe API] Creating customer portal session for user:', userId);
    // In a real implementation, this would call a serverless function
    const response = await fetch('/api/create-stripe-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Stripe API] Portal session error:', errorData);
      throw new Error(errorData.message || 'Failed to create portal session');
    }
    
    const data = await response.json();
    console.log('[Stripe API] Portal session created successfully');
    return data;
  } catch (error) {
    console.error('[Stripe API] Error creating portal session:', error);
    toast.error('Failed to redirect to billing portal. Please try again later.');
    return null;
  }
}

// Function to sync user plan after returning from Stripe checkout
export async function syncUserPlanAfterCheckout(userId: string, sessionId?: string): Promise<void> {
  try {
    if (!userId || !sessionId) {
      console.log('[Stripe API] Missing userId or sessionId for plan sync');
      return;
    }
    
    console.log('[Stripe API] Syncing plan after checkout for user:', userId, 'session:', sessionId);
    // In a real implementation, this would call a serverless function
    const response = await fetch('/api/sync-plan-after-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sessionId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Stripe API] Plan sync error:', errorData);
      throw new Error(errorData.message || 'Failed to sync plan data');
    }
    
    const { success, plan } = await response.json();
    console.log('[Stripe API] Plan sync result:', success, 'new plan:', plan);
    
    if (success && plan) {
      toast.success(`Your subscription has been updated to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
      // Force a refresh of the application state
      window.location.reload();
    }
  } catch (error) {
    console.error('[Stripe API] Error syncing plan after checkout:', error);
    toast.error('Failed to sync subscription data. Please refresh the page.');
  }
}

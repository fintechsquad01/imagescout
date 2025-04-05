
/**
 * This file serves as the main entry point for Stripe server-side operations.
 * It exports all the necessary functions for use in edge functions or serverless functions.
 */

// Import the handleStripeWebhook function at the top of the file
import { handleStripeWebhook } from './webhookHandler';

// Re-export it immediately to avoid hoisting issues
export { handleStripeWebhook };

// Re-export other necessary functions and types
export { 
  createCheckoutSession,
  createCustomerPortalSession,
  getPriceIdForPlan 
} from './checkoutHandler';
export { 
  updateUserSubscription,
  updateUserSubscriptionByCustomerId,
  syncUserPlanAfterCheckout 
} from './subscriptionHandler';
export type { 
  StripeWebhookPayload,
  StripeEventType,
  CheckoutSessionCompletedEvent,
  SubscriptionEvent,
  StripeSubscriptionStatus
} from './stripeTypes';
export { parseStripeEvent, validateEventPayload } from './parseStripeEvent';

/**
 * Main webhook handler function that can be used in Edge Function routes
 * 
 * @param payload The raw request body from the webhook
 * @param signature The Stripe signature from request headers
 * @returns Success status and message
 */
export async function processStripeWebhook(
  payload: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  if (!payload || !signature) {
    return { 
      success: false, 
      message: 'Missing required webhook parameters' 
    };
  }
  
  try {
    // Use the imported handleStripeWebhook function
    return await handleStripeWebhook(payload, signature);
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return { 
      success: false, 
      message: `Internal server error: ${(error as Error).message}` 
    };
  }
}

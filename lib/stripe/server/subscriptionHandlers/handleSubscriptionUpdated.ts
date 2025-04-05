
import { SubscriptionEvent } from '../stripeTypes';
import { updateUserSubscriptionByCustomerId } from '../subscriptionHandler';

/**
 * Handles customer.subscription.updated events
 * Updates the user's subscription details when an existing subscription is updated
 */
export async function handleSubscriptionUpdated(subscription: SubscriptionEvent): Promise<void> {
  if (!subscription) return;
  
  const customerId = subscription.customer;
  const status = subscription.status;
  
  if (!customerId) {
    throw new Error('Missing customer ID in subscription updated event');
  }
  
  let planId = 'free';
  
  // Get plan from subscription items
  if (subscription.items.data.length > 0) {
    const productId = subscription.items.data[0].price.product;
    // Import STRIPE_PLAN_MAP from stripeTypes
    const STRIPE_PLAN_MAP: Record<string, string> = {
      'prod_free': 'free',
      'prod_pro': 'pro',
      'prod_enterprise': 'enterprise',
    };
    planId = STRIPE_PLAN_MAP[productId] || 'free';
  }
  
  // Update the user's profile in Supabase by customer ID
  await updateUserSubscriptionByCustomerId(
    customerId, 
    planId, 
    status,
    subscription.id
  );
}


import { SubscriptionEvent } from '../stripeTypes';
import { updateUserSubscriptionByCustomerId } from '../subscriptionHandler';

/**
 * Handles customer.subscription.deleted events
 * Downgrades the user to free plan when their subscription is canceled
 */
export async function handleSubscriptionDeleted(subscription: SubscriptionEvent): Promise<void> {
  if (!subscription) return;
  
  const customerId = subscription.customer;
  
  if (!customerId) {
    throw new Error('Missing customer ID in subscription deleted event');
  }
  
  // Downgrade the user to free plan
  await updateUserSubscriptionByCustomerId(
    customerId, 
    'free', 
    'canceled',
    subscription.id
  );
}

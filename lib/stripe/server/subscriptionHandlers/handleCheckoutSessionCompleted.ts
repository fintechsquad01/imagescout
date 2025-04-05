
import { CheckoutSessionCompletedEvent } from '../stripeTypes';
import { updateUserSubscription } from '../subscriptionHandler';

/**
 * Handles checkout.session.completed events
 * Updates the user's profile after a successful checkout
 */
export async function handleCheckoutSessionCompleted(session: CheckoutSessionCompletedEvent): Promise<void> {
  if (!session || session.mode !== 'subscription') return;
  
  const customerId = session.customer;
  const userId = session.client_reference_id;
  const planId = session.metadata.plan_id || 'free';
  
  if (!customerId || !userId) {
    throw new Error('Missing required customer or user data in checkout session');
  }
  
  // Update the user's profile in Supabase
  await updateUserSubscription({
    userId,
    planId,
    status: 'active',
    stripeCustomerId: customerId,
    stripeSubscriptionId: session.subscription || ''
  });
}

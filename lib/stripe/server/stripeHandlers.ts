
import { 
  StripeWebhookPayload, 
  getEventObject,
  CheckoutSessionCompletedEvent,
  SubscriptionEvent
} from './stripeTypes';

import {
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted
} from './subscriptionHandlers';

type EventHandler = (event: StripeWebhookPayload) => Promise<{ success: boolean; message: string }>;

/**
 * Maps Stripe event types to their corresponding handlers
 */
export const eventHandlers: Record<string, EventHandler> = {
  'checkout.session.completed': async (event) => {
    await handleCheckoutSessionCompleted(getEventObject<CheckoutSessionCompletedEvent>(event));
    return { success: true, message: `Processed checkout.session.completed event ${event.id}` };
  },
  'customer.subscription.created': async (event) => {
    await handleSubscriptionCreated(getEventObject<SubscriptionEvent>(event));
    return { success: true, message: `Processed customer.subscription.created event ${event.id}` };
  },
  'customer.subscription.updated': async (event) => {
    await handleSubscriptionUpdated(getEventObject<SubscriptionEvent>(event));
    return { success: true, message: `Processed customer.subscription.updated event ${event.id}` };
  },
  'customer.subscription.deleted': async (event) => {
    await handleSubscriptionDeleted(getEventObject<SubscriptionEvent>(event));
    return { success: true, message: `Processed customer.subscription.deleted event ${event.id}` };
  }
};

/**
 * Processes a Stripe webhook event based on its type
 */
export async function processStripeEvent(
  event: StripeWebhookPayload
): Promise<{ success: boolean; message: string }> {
  const eventType = event.type;
  const handler = eventHandlers[eventType];
  
  if (handler) {
    return await handler(event);
  }
  
  // Return success for unhandled event types to avoid retries
  console.log(`Unhandled event type: ${eventType}`);
  return { success: true, message: `Unhandled event type: ${eventType}` };
}

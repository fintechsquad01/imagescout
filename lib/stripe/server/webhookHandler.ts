
import { StripeWebhookPayload } from './stripeTypes';
import { parseStripeEvent, validateEventPayload } from './parseStripeEvent';
import { processStripeEvent } from './stripeHandlers';

/**
 * Handles incoming Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string | StripeWebhookPayload, 
  signature: string
): Promise<{ success: boolean; message: string }> {
  // Get webhook secret from environment
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  
  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret');
    return { success: false, message: 'Configuration error' };
  }

  try {
    // Validate the webhook if payload is a string
    let event: StripeWebhookPayload;
    
    if (typeof payload === 'string') {
      const validatedEvent = parseStripeEvent(payload, signature, webhookSecret);
      if (!validatedEvent) {
        return { success: false, message: 'Invalid webhook signature' };
      }
      event = validatedEvent;
    } else if (validateEventPayload(payload)) {
      // If payload is already an object (for testing), use it directly
      event = payload;
    } else {
      return { success: false, message: 'Invalid event payload structure' };
    }
    
    // Process the event using the appropriate handler
    return await processStripeEvent(event);
    
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return { success: false, message: `Error: ${(error as Error).message}` };
  }
}


import Stripe from 'stripe';
import { StripeWebhookPayload } from './stripeTypes';

/**
 * Validates and parses the Stripe webhook payload
 * @param payload Raw request body from the webhook
 * @param signature Stripe signature from request headers
 * @param webhookSecret Stripe webhook secret for validation
 * @returns Parsed Stripe event or null if invalid
 */
export function parseStripeEvent(
  payload: string,
  signature: string,
  webhookSecret: string
): StripeWebhookPayload | null {
  if (!payload || !signature || !webhookSecret) {
    console.error('Missing required webhook parameters');
    return null;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    ) as unknown as StripeWebhookPayload;
    
    return event;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return null;
  }
}

/**
 * Validates the structure of a webhook payload
 */
export function validateEventPayload(payload: any): payload is StripeWebhookPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    typeof payload.type === 'string' &&
    payload.data &&
    typeof payload.data === 'object' &&
    payload.data.object
  );
}

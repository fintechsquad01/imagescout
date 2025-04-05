
/**
 * Type definitions for Stripe webhook events and related data structures
 */

export interface StripeWebhookPayload {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  api_version?: string;
  livemode: boolean;
  pending_webhooks?: number;
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
}

export type StripeEventType = 
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';

export interface CheckoutSessionCompletedEvent {
  customer: string;
  client_reference_id: string;
  mode: string;
  subscription?: string;
  metadata: {
    plan_id?: string;
  };
}

export interface SubscriptionEvent {
  id: string;
  customer: string;
  status: string;
  items: {
    data: Array<{
      price: {
        product: string;
      };
    }>;
  };
}

export interface StripeSubscriptionStatus {
  userId: string;
  planId: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

// Plan map from Stripe product IDs to internal plan IDs
export const STRIPE_PLAN_MAP: Record<string, string> = {
  'prod_free': 'free',
  'prod_pro': 'pro',
  'prod_enterprise': 'enterprise',
};

// Helper functions to check event types
export function isCheckoutSessionCompleted(event: StripeWebhookPayload): boolean {
  return event.type === 'checkout.session.completed';
}

export function isSubscriptionEvent(event: StripeWebhookPayload): boolean {
  return (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  );
}

export function getEventObject<T>(event: StripeWebhookPayload): T {
  return event.data.object as T;
}

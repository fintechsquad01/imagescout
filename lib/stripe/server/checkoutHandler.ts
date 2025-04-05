
import Stripe from 'stripe';

/**
 * Helper function to get Stripe price ID for a plan
 */
export function getPriceIdForPlan(planId: string): string {
  if (!planId) {
    return getDefaultPriceId();
  }
  
  // This would map to actual Stripe price IDs in a real implementation
  const priceMap: Record<string, string> = {
    'free': 'price_free', // Usually free plans don't have a price ID
    'pro': 'price_1234567890',
    'enterprise': 'price_2468101214',
  };
  
  return priceMap[planId] || getDefaultPriceId();
}

/**
 * Helper function to get default plan ID
 */
export function getDefaultPlanId(): string {
  return 'free';
}

/**
 * Helper function to get default price ID
 */
export function getDefaultPriceId(): string {
  return 'price_1234567890'; // Default to Pro plan
}

/**
 * Creates a Stripe checkout session for subscription
 */
export async function createCheckoutSession(planId: string, userId: string): Promise<{ url: string }> {
  if (!planId || !userId) {
    throw new Error('Missing required parameters: planId and userId are required');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key');

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPriceIdForPlan(planId),
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.APP_URL || 'http://localhost:5173'}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/billing?canceled=true`,
    client_reference_id: userId,
    customer_creation: 'always',
    metadata: {
      plan_id: planId,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return { url: session.url };
}

/**
 * Creates a Stripe customer portal session
 */
export async function createCustomerPortalSession(userId: string, stripeCustomerId: string): Promise<{ url: string }> {
  if (!userId || !stripeCustomerId) {
    throw new Error('Missing required parameters: userId and stripeCustomerId are required');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key');

  // Create the portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.APP_URL || 'http://localhost:5173'}/billing`,
  });

  if (!session.url) {
    throw new Error('Failed to create portal session URL');
  }

  return { url: session.url };
}

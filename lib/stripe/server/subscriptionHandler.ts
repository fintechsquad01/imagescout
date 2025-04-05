
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { StripeSubscriptionStatus } from './stripeTypes';

/**
 * Updates a user's subscription details in Supabase
 */
export async function updateUserSubscription({
  userId,
  planId,
  status,
  stripeCustomerId,
  stripeSubscriptionId = '',
  currentPeriodStart,
  currentPeriodEnd
}: StripeSubscriptionStatus): Promise<void> {
  if (!userId || !stripeCustomerId || !planId || !status) {
    throw new Error('Missing required parameters for updating user subscription');
  }
  
  const supabase = getSupabaseClient();
  
  // Update the user's profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan: planId,
      stripe_customer_id: stripeCustomerId,
      subscription_status: status
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw new Error('Failed to update user profile');
  }
  
  // Add a record to user_subscriptions table
  const { error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      status: status,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      current_period_start: currentPeriodStart || new Date(),
      current_period_end: currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      updated_at: new Date(),
    }, {
      onConflict: 'user_id',
    });
  
  if (subscriptionError) {
    console.error('Error updating user subscription:', subscriptionError);
    throw new Error('Failed to update user subscription');
  }
  
  console.log(`Successfully updated subscription for user ${userId} to plan ${planId}`);
}

/**
 * Updates a user's subscription details in Supabase by customer ID
 */
export async function updateUserSubscriptionByCustomerId(
  stripeCustomerId: string, 
  planId: string, 
  status: string,
  stripeSubscriptionId: string = '',
  currentPeriodStart?: Date,
  currentPeriodEnd?: Date
): Promise<void> {
  if (!stripeCustomerId || !planId || !status) {
    throw new Error('Missing required parameters for updating subscription by customer ID');
  }
  
  const supabase = getSupabaseClient();
  
  // Find the user by customer ID
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  
  if (userError || !userData) {
    console.error('Error finding user by customer ID:', userError);
    throw new Error('Failed to find user by customer ID');
  }
  
  // Update the user's subscription
  await updateUserSubscription({
    userId: userData.id,
    planId,
    status,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd
  });
}

/**
 * Syncs user plan data after returning from Stripe checkout
 */
export async function syncUserPlanAfterCheckout(
  userId: string, 
  sessionId?: string
): Promise<{ success: boolean; plan?: string }> {
  if (!userId) {
    return { success: false };
  }
  
  try {
    if (!sessionId) {
      return { success: false };
    }
    
    // Verify the checkout session with Stripe (for production)
    // In a production environment, you'd want to verify the session with Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    // const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // For now, we'll just check if the user's plan has been updated
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching user plan:', error);
      return { success: false };
    }
    
    return { 
      success: true, 
      plan: data.plan || 'free'
    };
  } catch (error) {
    console.error('Error syncing user plan after checkout:', error);
    return { success: false };
  }
}

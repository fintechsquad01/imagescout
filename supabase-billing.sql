
-- This file contains SQL that should be executed in the Supabase SQL editor
-- to set up the required tables for the billing system

-- Add a plan column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise'));

-- Add stripe_customer_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) DEFAULT NULL;

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL,
  yearly_price INTEGER NOT NULL,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(20) NOT NULL REFERENCES public.subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id VARCHAR(50),
  stripe_subscription_id VARCHAR(50),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_entitlements table to map features to plans
CREATE TABLE IF NOT EXISTS public.feature_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id VARCHAR(20) NOT NULL REFERENCES public.subscription_plans(id),
  feature_name VARCHAR(50) NOT NULL,
  allowed_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, feature_name)
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_entitlements ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can modify subscription data
CREATE POLICY "Only admins can modify subscriptions" ON public.user_subscriptions
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Anyone can read feature entitlements
CREATE POLICY "Anyone can view feature entitlements" ON public.feature_entitlements
  FOR SELECT USING (true);

-- Seed initial plan data
INSERT INTO public.subscription_plans (id, name, description, monthly_price, yearly_price, features, is_active, stripe_price_id_monthly, stripe_price_id_yearly)
VALUES
  ('free', 'Free', 'Basic access with limited features', 0, 0, '["5 daily generations", "Basic models", "Standard support"]'::jsonb, true, NULL, NULL),
  ('pro', 'Pro', 'Advanced features for power users', 1990, 19900, '["Unlimited generations", "Premium models", "Priority support", "Advanced analytics"]'::jsonb, true, 'price_1234567890', 'price_0987654321'),
  ('enterprise', 'Enterprise', 'Custom solutions for businesses', 4990, 49900, '["Unlimited everything", "All models", "Dedicated support", "Custom features", "Team management"]'::jsonb, true, 'price_2468101214', 'price_1357911131')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly,
  stripe_price_id_yearly = EXCLUDED.stripe_price_id_yearly,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Seed feature entitlements for each plan
INSERT INTO public.feature_entitlements (plan_id, feature_name, allowed_value)
VALUES
  -- Free plan features
  ('free', 'daily_generations', '{"limit": 5}'::jsonb),
  ('free', 'history_retention_days', '{"days": 7}'::jsonb),
  ('free', 'premium_models', '{"enabled": false}'::jsonb),
  ('free', 'multi_project', '{"enabled": false}'::jsonb),
  ('free', 'advanced_analytics', '{"enabled": false}'::jsonb),
  
  -- Pro plan features
  ('pro', 'daily_generations', '{"limit": 50}'::jsonb),
  ('pro', 'history_retention_days', '{"days": 30}'::jsonb),
  ('pro', 'premium_models', '{"enabled": true, "models": ["enhance", "creative"]}'::jsonb),
  ('pro', 'multi_project', '{"enabled": true, "limit": 10}'::jsonb),
  ('pro', 'advanced_analytics', '{"enabled": true}'::jsonb),
  
  -- Enterprise plan features
  ('enterprise', 'daily_generations', '{"limit": -1}'::jsonb),
  ('enterprise', 'history_retention_days', '{"days": 90}'::jsonb),
  ('enterprise', 'premium_models', '{"enabled": true, "models": ["enhance", "creative", "professional", "custom"]}'::jsonb),
  ('enterprise', 'multi_project', '{"enabled": true, "limit": -1}'::jsonb),
  ('enterprise', 'advanced_analytics', '{"enabled": true}'::jsonb)
ON CONFLICT (plan_id, feature_name) DO UPDATE SET
  allowed_value = EXCLUDED.allowed_value,
  updated_at = NOW();

-- Create a function to check feature access based on user's plan
CREATE OR REPLACE FUNCTION public.check_feature_access(feature_name TEXT)
RETURNS JSONB AS $$
DECLARE
  user_plan VARCHAR(20);
  is_admin BOOLEAN;
  feature_access JSONB;
BEGIN
  -- Check if user is admin (they get everything)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF is_admin THEN
    RETURN '{"enabled": true, "limit": -1, "admin": true}'::jsonb;
  END IF;
  
  -- Get user's current plan
  SELECT plan INTO user_plan FROM public.profiles
  WHERE id = auth.uid();
  
  IF user_plan IS NULL THEN
    user_plan := 'free'; -- Default to free plan
  END IF;
  
  -- Get feature access for this plan
  SELECT fe.allowed_value INTO feature_access
  FROM public.feature_entitlements fe
  WHERE fe.plan_id = user_plan AND fe.feature_name = feature_name;
  
  RETURN COALESCE(feature_access, '{"enabled": false}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function comments for documentation
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans with Stripe price IDs';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription records and Stripe metadata';
COMMENT ON TABLE public.feature_entitlements IS 'Features available for each subscription plan';
COMMENT ON FUNCTION public.check_feature_access IS 'Checks if a user has access to a specific feature based on their plan';

-- Add the enable_stripe_billing feature flag to the feature_access table
-- This would be executed by an admin to enable Stripe billing
/*
INSERT INTO public.feature_access (user_id, feature_name, enabled)
SELECT id, 'enable_stripe_billing', true
FROM auth.users
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
ON CONFLICT (user_id, feature_name) DO UPDATE
SET enabled = EXCLUDED.enabled;
*/

-- This file contains SQL that should be executed in the Supabase SQL editor
-- to set up the required tables for the feature flags system

-- Create feature_access table
CREATE TABLE IF NOT EXISTS public.feature_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON public.feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_feature_name ON public.feature_access(feature_name);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.feature_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own feature access
CREATE POLICY "Users can view their own feature access" ON public.feature_access
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can modify feature access
CREATE POLICY "Admins can manage feature access" ON public.feature_access
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Add some default feature flags (to be managed by admins)
INSERT INTO public.feature_access (user_id, feature_name, enabled)
VALUES
  -- Replace with your admin user ID in a real environment
  ('00000000-0000-0000-0000-000000000000', 'prompt_history', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'intent_selector', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'experimental_mode', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'advanced_analytics', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'multi_project', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'invite_system', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'custom_models', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'enable_stripe_billing', TRUE)
ON CONFLICT (user_id, feature_name) DO NOTHING;

-- Add function to check if a user has access to a specific feature
CREATE OR REPLACE FUNCTION public.has_feature_access(feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_internal BOOLEAN;
  has_access BOOLEAN;
BEGIN
  -- Check if user is internal/admin (they get all features)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'internal')
  ) INTO is_internal;
  
  IF is_internal THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific feature access
  SELECT enabled FROM public.feature_access
  WHERE user_id = auth.uid() AND feature_name = $1
  INTO has_access;
  
  RETURN COALESCE(has_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to grant a feature to a user
CREATE OR REPLACE FUNCTION public.grant_feature_access(target_user_id UUID, feature TEXT, is_enabled BOOLEAN DEFAULT TRUE)
RETURNS void AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can grant feature access';
  END IF;

  -- Insert or update feature access
  INSERT INTO public.feature_access (user_id, feature_name, enabled)
  VALUES (target_user_id, feature, is_enabled)
  ON CONFLICT (user_id, feature_name) 
  DO UPDATE SET 
    enabled = is_enabled,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update prompt_history to include content_intent field
ALTER TABLE public.prompt_history
ADD COLUMN IF NOT EXISTS content_intent TEXT;

-- Add comments for documentation
COMMENT ON TABLE public.feature_access IS 'Stores user-specific feature access flags';
COMMENT ON FUNCTION public.has_feature_access IS 'Checks if the current user has access to a specific feature';
COMMENT ON FUNCTION public.grant_feature_access IS 'Grants access to a feature for a specific user (admin only)';

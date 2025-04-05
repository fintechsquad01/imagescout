
-- This file contains SQL that should be executed in the Supabase SQL editor
-- to set up the user_roles table for internal users and experimental features

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'internal', 'beta', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage user roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Add a function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(requested_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = requested_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to check if user is internal or admin (has elevated privileges)
CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'internal')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utility function to grant internal role to a user
CREATE OR REPLACE FUNCTION public.grant_internal_role(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can grant roles';
  END IF;

  -- Insert internal role for target user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'internal')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add test data for local development
-- This will only be used in development environments and should be removed in production
DO $$
BEGIN
  -- Only run in development
  IF current_setting('request.headers', true)::json->>'origin' LIKE '%localhost%' THEN
    -- Add a test admin user based on your test user ID
    -- Replace '00000000-0000-0000-0000-000000000000' with your actual test user UUID
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000000', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Add internal role as well
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('00000000-0000-0000-0000-000000000000', 'internal')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Silently ignore errors in this development-only section
    NULL;
END;
$$;

-- Add soft delete functionality to the prompt_history table
ALTER TABLE public.prompt_history
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update prompt_history queries to filter out deleted records
-- Automatically exclude deleted records in queries
CREATE POLICY "Hide deleted prompt history records" ON public.prompt_history
  FOR SELECT USING (is_deleted = FALSE OR is_deleted IS NULL);

-- Allow admins to see all records including deleted ones
CREATE POLICY "Admins can see all prompt history records" ON public.prompt_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create a function for soft-deleting prompt history
CREATE OR REPLACE FUNCTION public.soft_delete_prompt_history(prompt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INT;
BEGIN
  UPDATE public.prompt_history
  SET is_deleted = TRUE
  WHERE id = prompt_id
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
      )
    );
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_roles IS 'Stores user roles for feature access control';
COMMENT ON FUNCTION public.has_role IS 'Checks if the current user has a specific role';
COMMENT ON FUNCTION public.is_internal_user IS 'Checks if the current user has internal or admin access';
COMMENT ON FUNCTION public.grant_internal_role IS 'Grants internal role to a user (admin only)';
COMMENT ON FUNCTION public.soft_delete_prompt_history IS 'Soft-deletes a prompt history record';

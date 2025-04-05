
-- This file contains SQL for setting up the feedback tables in Supabase

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  generation_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_project_id ON public.user_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_generation_id ON public.user_feedback(generation_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_image_id ON public.user_feedback(image_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON public.user_feedback(rating);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view their own feedback" ON public.user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own feedback
CREATE POLICY "Users can update their own feedback" ON public.user_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own feedback
CREATE POLICY "Users can delete their own feedback" ON public.user_feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can see all feedback
CREATE POLICY "Admins can see all feedback" ON public.user_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create invite_codes table for the invite system
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add invite_code to user metadata
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB;

-- Add function to validate and use an invite code
CREATE OR REPLACE FUNCTION public.validate_invite_code(code_to_validate TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  valid BOOLEAN;
  invite_record RECORD;
BEGIN
  -- Check if invite code exists and is valid
  SELECT *
  INTO invite_record
  FROM public.invite_codes
  WHERE code = code_to_validate
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses = 0 OR uses < max_uses);
    
  IF invite_record.id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update usage count
  UPDATE public.invite_codes
  SET uses = uses + 1,
      is_active = CASE WHEN max_uses > 0 AND uses + 1 >= max_uses THEN FALSE ELSE TRUE END
  WHERE id = invite_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table for tracking onboarding status
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  first_login_at TIMESTAMP WITH TIME ZONE,
  welcome_shown BOOLEAN DEFAULT FALSE,
  default_project_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Set up RLS policies for invite_codes and user_onboarding
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Only admins and internal users can manage invite codes
CREATE POLICY "Admins and internal users can manage invite codes" ON public.invite_codes
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
    )
  );

-- Users can view their own onboarding status
CREATE POLICY "Users can view their own onboarding" ON public.user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own onboarding status
CREATE POLICY "Users can update their own onboarding" ON public.user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to create a default project for a new user
CREATE OR REPLACE FUNCTION public.create_default_project_for_user(user_id_param UUID)
RETURNS UUID AS $$
DECLARE
  new_project_id UUID;
BEGIN
  INSERT INTO public.projects (user_id, name, description)
  VALUES (
    user_id_param,
    'My First Project',
    'Default project created automatically on first login'
  )
  RETURNING id INTO new_project_id;
  
  -- Update onboarding status
  INSERT INTO public.user_onboarding (
    user_id, 
    default_project_created,
    first_login_at
  )
  VALUES (
    user_id_param,
    TRUE,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    default_project_created = TRUE,
    updated_at = NOW();
  
  RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.user_feedback IS 'Stores user feedback on generated content';
COMMENT ON TABLE public.invite_codes IS 'Stores invite codes for controlled user registration';
COMMENT ON TABLE public.user_onboarding IS 'Tracks user onboarding progress and status';
COMMENT ON FUNCTION public.validate_invite_code IS 'Validates an invite code and increments its usage';
COMMENT ON FUNCTION public.create_default_project_for_user IS 'Creates a default project for a new user and initializes onboarding';

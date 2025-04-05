
-- This file contains SQL that should be executed in the Supabase SQL editor
-- to set up the required tables for the project selection feature

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add project_id columns to existing tables
ALTER TABLE public.uploads
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create prompt history table
CREATE TABLE IF NOT EXISTS public.prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  image_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model_used TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_project_id ON public.uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON public.generations(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON public.prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_project_id ON public.prompt_history(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_image_id ON public.prompt_history(image_id);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own projects
CREATE POLICY "Users can insert their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own projects
CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own prompt history
CREATE POLICY "Users can view their own prompt history" ON public.prompt_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own prompt history
CREATE POLICY "Users can insert their own prompt history" ON public.prompt_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own prompt history
CREATE POLICY "Users can delete their own prompt history" ON public.prompt_history
  FOR DELETE USING (auth.uid() = user_id);

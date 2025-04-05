
-- Create scoring_feedback table for test environment feedback
CREATE TABLE IF NOT EXISTS public.scoring_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  image_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  model_id UUID,
  model_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  labels TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scoring_feedback_user_id ON public.scoring_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_feedback_project_id ON public.scoring_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_scoring_feedback_model_id ON public.scoring_feedback(model_id);
CREATE INDEX IF NOT EXISTS idx_scoring_feedback_rating ON public.scoring_feedback(rating);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.scoring_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view their own feedback" ON public.scoring_feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can only insert their own feedback
CREATE POLICY "Users can insert feedback" ON public.scoring_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can see all feedback
CREATE POLICY "Admins can see all feedback" ON public.scoring_feedback
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create scoring_ab_tests table for A/B test results
CREATE TABLE IF NOT EXISTS public.scoring_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  image_id TEXT NOT NULL,
  winner_model_id UUID NOT NULL,
  winner_model_name TEXT NOT NULL,
  loser_model_id UUID NOT NULL,
  loser_model_name TEXT NOT NULL,
  winner_score INTEGER,
  loser_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for A/B tests
CREATE INDEX IF NOT EXISTS idx_scoring_ab_tests_user_id ON public.scoring_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_ab_tests_project_id ON public.scoring_ab_tests(project_id);
CREATE INDEX IF NOT EXISTS idx_scoring_ab_tests_winner_model_id ON public.scoring_ab_tests(winner_model_id);

-- Set up RLS policies for A/B tests
ALTER TABLE public.scoring_ab_tests ENABLE ROW LEVEL SECURITY;

-- Users can insert A/B test results
CREATE POLICY "Users can insert A/B test results" ON public.scoring_ab_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can see all A/B test results
CREATE POLICY "Admins can see all A/B test results" ON public.scoring_ab_tests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.scoring_feedback IS 'Stores user feedback on scoring system performance';
COMMENT ON TABLE public.scoring_ab_tests IS 'Stores results of A/B testing between scoring models';

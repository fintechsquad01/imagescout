
-- Create scoring_configs table
CREATE TABLE IF NOT EXISTS public.scoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  model TEXT NOT NULL,
  weights JSONB NOT NULL,
  prompt_template TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add comment to table
COMMENT ON TABLE public.scoring_configs IS 'Stores configurations for the image scoring system';

-- Only one config can be active at a time (exclusion constraint)
CREATE UNIQUE INDEX idx_scoring_configs_active ON public.scoring_configs (is_active) 
WHERE is_active = true;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.scoring_configs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies
ALTER TABLE public.scoring_configs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all scoring configs
CREATE POLICY "Allow admins to read scoring configs"
  ON public.scoring_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to insert new scoring configs
CREATE POLICY "Allow admins to insert scoring configs"
  ON public.scoring_configs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to update scoring configs
CREATE POLICY "Allow admins to update scoring configs"
  ON public.scoring_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow everyone to read active scoring config
CREATE POLICY "Allow everyone to read active scoring config"
  ON public.scoring_configs
  FOR SELECT
  USING (is_active = true);

-- Insert a default scoring config if none exists
INSERT INTO public.scoring_configs (
  version,
  model,
  weights,
  prompt_template,
  is_active
)
SELECT
  '1.0.0',
  'default',
  '{"labels": 5, "objects": 7, "landmarks": 10, "colors": 5, "baseScore": 50, "maxScore": 100}'::jsonb,
  'Analyze the image for {{objects}} and {{labels}}.',
  true
WHERE
  NOT EXISTS (SELECT 1 FROM public.scoring_configs);

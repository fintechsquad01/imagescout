
-- Create score cache table
CREATE TABLE IF NOT EXISTS public.score_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id TEXT NOT NULL,
  scoring_config_id TEXT NOT NULL,
  cache_key TEXT NOT NULL UNIQUE,
  vision_data JSONB NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT score_cache_image_scoring_unique UNIQUE (image_id, scoring_config_id)
);

-- Create index on cache_key for faster lookups
CREATE INDEX IF NOT EXISTS score_cache_cache_key_idx ON public.score_cache (cache_key);
CREATE INDEX IF NOT EXISTS score_cache_image_id_idx ON public.score_cache (image_id);
CREATE INDEX IF NOT EXISTS score_cache_expiry_idx ON public.score_cache (expires_at);

-- Create scoring errors table
CREATE TABLE IF NOT EXISTS public.scoring_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id TEXT NOT NULL,
  scoring_config_id TEXT,
  model_name TEXT,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  stack_trace TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on image_id for faster lookups
CREATE INDEX IF NOT EXISTS scoring_errors_image_id_idx ON public.scoring_errors (image_id);
CREATE INDEX IF NOT EXISTS scoring_errors_model_name_idx ON public.scoring_errors (model_name);

-- Add RLS policies for both tables
ALTER TABLE public.score_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_errors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read from cache
CREATE POLICY "Authenticated users can read score cache" 
ON public.score_cache
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to add to cache
CREATE POLICY "Authenticated users can add to score cache" 
ON public.score_cache
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow service role to update/delete cache
CREATE POLICY "Service role can manage score cache" 
ON public.score_cache
USING (auth.jwt() ? 'service_role');

-- Allow authenticated users to read errors
CREATE POLICY "Authenticated users can read scoring errors" 
ON public.scoring_errors
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to add errors
CREATE POLICY "Authenticated users can add scoring errors" 
ON public.scoring_errors
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.score_cache TO anon, authenticated;
GRANT INSERT ON public.score_cache TO authenticated;
GRANT SELECT ON public.scoring_errors TO anon, authenticated;
GRANT INSERT ON public.scoring_errors TO authenticated;

-- Admin access policies
CREATE POLICY "Admins can manage score cache" 
ON public.score_cache
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
  )
);

CREATE POLICY "Admins can manage scoring errors" 
ON public.scoring_errors
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
  )
);

-- COMMENT on tables
COMMENT ON TABLE public.score_cache IS 'Cache for vision API scoring results to reduce API calls';
COMMENT ON TABLE public.scoring_errors IS 'Log of errors encountered during image scoring';

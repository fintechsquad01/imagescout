
-- Function to get user role counts
CREATE OR REPLACE FUNCTION public.get_user_role_counts()
RETURNS TABLE (
  role TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ur.role, 
    COUNT(*) 
  FROM 
    public.user_roles ur
  GROUP BY 
    ur.role
  UNION ALL
  -- Add users without roles (regular users)
  SELECT 
    'user' as role,
    COUNT(*) 
  FROM 
    auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get model usage stats
CREATE OR REPLACE FUNCTION public.get_model_usage_stats(start_date TIMESTAMP, end_date TIMESTAMP)
RETURNS TABLE (
  model TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(gl.model, 'unknown') as model, 
    COUNT(*) 
  FROM 
    public.generation_logs gl
  WHERE 
    gl.created_at >= start_date AND
    gl.created_at <= end_date
  GROUP BY 
    gl.model;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily prompt counts
CREATE OR REPLACE FUNCTION public.get_daily_prompt_counts(start_date TIMESTAMP, end_date TIMESTAMP)
RETURNS TABLE (
  date DATE,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ph.created_at) as date, 
    COUNT(*) 
  FROM 
    public.prompt_history ph
  WHERE 
    ph.created_at >= start_date AND
    ph.created_at <= end_date
  GROUP BY 
    DATE(ph.created_at)
  ORDER BY
    date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to properly join user_roles with auth.users
CREATE OR REPLACE VIEW public.user_role_details AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  u.email,
  u.last_sign_in_at
FROM 
  public.user_roles ur
JOIN 
  auth.users u ON ur.user_id = u.id;

-- Add RLS policies for the admin dashboard queries
-- Allow admins and internal users to access user analytics
CREATE POLICY IF NOT EXISTS "Admins and internal users can access user analytics" ON public.user_roles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
    )
  );

-- Allow admins to access invite code analytics
CREATE POLICY IF NOT EXISTS "Admins and internal users can access invite analytics" ON public.invite_codes
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
    )
  );

-- Allow admins to access generation logs for analytics
CREATE POLICY IF NOT EXISTS "Admins and internal users can access generation logs" ON public.generation_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
    )
  );

-- Allow admins to access prompt history for analytics
CREATE POLICY IF NOT EXISTS "Admins and internal users can access prompt history" ON public.prompt_history
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
    )
  );

-- Add RLS policy for user_role_details view
CREATE POLICY IF NOT EXISTS "Admins and internal users can access user role details" ON public.user_role_details
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'internal')
    )
  );

COMMENT ON FUNCTION public.get_user_role_counts IS 'Returns count of users by role, including those without roles';
COMMENT ON FUNCTION public.get_model_usage_stats IS 'Returns count of generations by model within a date range';
COMMENT ON FUNCTION public.get_daily_prompt_counts IS 'Returns count of prompts by day within a date range';
COMMENT ON VIEW public.user_role_details IS 'Joins user_roles with auth.users for admin dashboard';

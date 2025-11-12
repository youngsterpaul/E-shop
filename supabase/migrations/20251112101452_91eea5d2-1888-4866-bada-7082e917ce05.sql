-- Create login_audit table for tracking all authentication attempts
CREATE TABLE IF NOT EXISTS public.login_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email character varying,
  success boolean NOT NULL,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  failure_reason text,
  session_id character varying,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view login audits
CREATE POLICY "Superadmins can view login audits"
ON public.login_audit
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Service role can insert login audits
CREATE POLICY "Service role can insert login audits"
ON public.login_audit
FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_login_audit_user_id ON public.login_audit(user_id);
CREATE INDEX idx_login_audit_created_at ON public.login_audit(created_at DESC);
CREATE INDEX idx_login_audit_success ON public.login_audit(success);
CREATE INDEX idx_login_audit_ip_address ON public.login_audit(ip_address);

-- Create session_activity table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.session_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id character varying NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.session_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.session_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Superadmins can view all sessions
CREATE POLICY "Superadmins can view all sessions"
ON public.session_activity
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Service role can manage sessions
CREATE POLICY "Service role can manage sessions"
ON public.session_activity
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_session_activity_user_id ON public.session_activity(user_id);
CREATE INDEX idx_session_activity_session_id ON public.session_activity(session_id);
CREATE INDEX idx_session_activity_last_activity ON public.session_activity(last_activity DESC);

-- Function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM session_activity 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
-- Create M-Pesa rate limiting table
CREATE TABLE IF NOT EXISTS public.mpesa_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier varchar(100) NOT NULL,
  request_type varchar(50) NOT NULL DEFAULT 'payment_init',
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  last_attempt timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, request_type)
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
ON public.mpesa_rate_limit(identifier, request_type, blocked_until);

-- Enable RLS
ALTER TABLE public.mpesa_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.mpesa_rate_limit
FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- Superadmins can view rate limits for monitoring
CREATE POLICY "Superadmins view rate limits"
ON public.mpesa_rate_limit
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

-- Create security alerts table for monitoring
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type varchar(50) NOT NULL,
  severity varchar(20) NOT NULL,
  identifier varchar(100) NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz
);

-- Enable RLS on security alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view/manage security alerts
CREATE POLICY "Superadmins manage security alerts"
ON public.security_alerts
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));
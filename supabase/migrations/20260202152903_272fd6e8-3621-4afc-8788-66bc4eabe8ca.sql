-- Secure email_verifications table by restricting RLS to service_role only
-- This table appears to be legacy (not used in application code)
-- The application uses Supabase Auth's native OTP for email verification

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Allow insert verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Allow update verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Read email verifications" ON public.email_verifications;

-- Create restrictive policies that only allow service_role access
-- SELECT: Only service_role can read verification records
CREATE POLICY "Service role can read verifications"
ON public.email_verifications
FOR SELECT
USING (
  (SELECT current_setting('role', true)) = 'service_role'
);

-- INSERT: Only service_role can create verification records
CREATE POLICY "Service role can insert verifications"
ON public.email_verifications
FOR INSERT
WITH CHECK (
  (SELECT current_setting('role', true)) = 'service_role'
);

-- UPDATE: Only service_role can update verification records
CREATE POLICY "Service role can update verifications"
ON public.email_verifications
FOR UPDATE
USING (
  (SELECT current_setting('role', true)) = 'service_role'
)
WITH CHECK (
  (SELECT current_setting('role', true)) = 'service_role'
);

-- DELETE: Only service_role can delete verification records
CREATE POLICY "Service role can delete verifications"
ON public.email_verifications
FOR DELETE
USING (
  (SELECT current_setting('role', true)) = 'service_role'
);
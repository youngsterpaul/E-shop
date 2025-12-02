-- Fix email_verifications RLS - codes should NOT be publicly readable
-- Drop existing permissive SELECT policy
DROP POLICY IF EXISTS "Allow read access to verification records" ON public.email_verifications;
DROP POLICY IF EXISTS "Anyone can read verification records" ON public.email_verifications;

-- Create proper policy - only allow reading own verification by email
CREATE POLICY "Users can only read their own verification by email"
  ON public.email_verifications
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Fix admin_settings RLS - should only be readable by admins
DROP POLICY IF EXISTS "Anyone can view admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Allow read access to admin settings" ON public.admin_settings;

-- Create proper policy for admin_settings
CREATE POLICY "Only admins can view admin settings"
  ON public.admin_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );
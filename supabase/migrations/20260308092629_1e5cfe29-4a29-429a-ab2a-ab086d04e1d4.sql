
-- Allow superadmins to read all user behavior for the admin insights page
CREATE POLICY "Superadmins can view all user behavior"
  ON public.user_behavior FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role));

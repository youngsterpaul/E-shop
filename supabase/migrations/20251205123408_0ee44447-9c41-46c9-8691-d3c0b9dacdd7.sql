-- Drop the overlapping SELECT policies
DROP POLICY IF EXISTS "Public can view active A/B tests" ON public.ab_tests;

-- Update the admin policy to be for non-SELECT operations only
DROP POLICY IF EXISTS "Admins can manage A/B tests" ON public.ab_tests;

-- Create consolidated SELECT policy
CREATE POLICY "View A/B tests" ON public.ab_tests
FOR SELECT
USING (
  ((status)::text = 'active'::text) 
  OR is_any_admin(( SELECT auth.uid() AS uid))
);

-- Create admin-only policies for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert A/B tests" ON public.ab_tests
FOR INSERT
WITH CHECK (is_any_admin(( SELECT auth.uid() AS uid)));

CREATE POLICY "Admins can update A/B tests" ON public.ab_tests
FOR UPDATE
USING (is_any_admin(( SELECT auth.uid() AS uid)));

CREATE POLICY "Admins can delete A/B tests" ON public.ab_tests
FOR DELETE
USING (is_any_admin(( SELECT auth.uid() AS uid)));
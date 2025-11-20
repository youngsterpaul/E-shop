-- Consolidate multiple SELECT policies on user_roles into one
-- This resolves the multiple_permissive_policies warning

-- Drop the two separate SELECT policies
DROP POLICY IF EXISTS "Superadmins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create a single consolidated SELECT policy
CREATE POLICY "View user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role((select auth.uid()), 'superadmin'::app_role) 
  OR (select auth.uid()) = user_id
);
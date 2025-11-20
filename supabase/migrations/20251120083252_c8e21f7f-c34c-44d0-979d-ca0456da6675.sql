-- Optimize user_roles table RLS policies
-- Fix auth_rls_initplan warnings and remove duplicate policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create optimized consolidated policies
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role((select auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role((select auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role((select auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role((select auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);
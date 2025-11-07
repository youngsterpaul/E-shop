-- Optimize orders table RLS policies by using subqueries for auth.uid()
-- This prevents re-evaluation of auth.uid() for each row, improving performance

-- Drop existing policies
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Superadmins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Superadmins update orders" ON public.orders;

-- Recreate policies with optimized auth.uid() calls
CREATE POLICY "Public can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users view own orders" 
ON public.orders 
FOR SELECT 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Superadmins view all orders" 
ON public.orders 
FOR SELECT 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role));

CREATE POLICY "Superadmins update orders" 
ON public.orders 
FOR UPDATE 
USING (has_role((SELECT auth.uid()), 'superadmin'::app_role))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'::app_role));
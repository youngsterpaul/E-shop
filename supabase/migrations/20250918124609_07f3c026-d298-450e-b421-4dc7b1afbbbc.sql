-- Fix RLS performance issues: optimize auth function calls and consolidate policies

-- 1. Drop redundant policies that cause multiple permissive policy warnings
DROP POLICY IF EXISTS "Users can access their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can access their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can create their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can delete their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can view their own carts" ON public.carts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.categories;
DROP POLICY IF EXISTS "Service role can manage payment records" ON public.mpesa_payments;

-- 2. Update existing policies to use optimized auth function calls with (select auth.uid())

-- Reviews policies
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
FOR UPDATE USING ((select auth.uid()) = user_id);

-- Profiles policies
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING ((select auth.uid()) = user_id);

-- Cart items policies - consolidate into single comprehensive policy
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage cart items" ON public.cart_items
FOR ALL USING (
  -- User owns the cart item directly
  (select auth.uid()) = user_id
  OR
  -- User owns the cart that contains the item
  EXISTS (
    SELECT 1 FROM carts 
    WHERE carts.id = cart_items.cart_id 
    AND ((carts.user_id = (select auth.uid())) OR ((carts.user_id IS NULL) AND (carts.session_id IS NOT NULL)))
  )
);

-- Carts policies - consolidate into single comprehensive policy
DROP POLICY IF EXISTS "Guests can access carts by session_id" ON public.carts;
CREATE POLICY "Users and guests can access carts" ON public.carts
FOR ALL USING (
  -- Authenticated user owns the cart
  ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
  OR
  -- Guest cart accessed by session_id (when no user authenticated)
  ((select auth.uid()) IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
) WITH CHECK (
  -- Allow creation for authenticated users or guests with session_id
  ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
  OR
  ((select auth.uid()) IS NULL AND session_id IS NOT NULL)
);

-- Wishlists policies
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (((select auth.uid()) = user_id) OR check_is_admin());

-- M-Pesa payments policies - keep admin policy, optimize user viewing policy
DROP POLICY IF EXISTS "Users can view their own payment records" ON public.mpesa_payments;
CREATE POLICY "Users can view their own payment records" ON public.mpesa_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.order_id = mpesa_payments.order_id 
    AND orders.user_id = (select auth.uid())
  )
);

-- Update admin policies to use proper current_setting check for service role
DROP POLICY IF EXISTS "Admins only" ON public.mpesa_payments;
CREATE POLICY "Service role and admins can manage payments" ON public.mpesa_payments
FOR ALL USING (
  check_is_admin() OR 
  (current_setting('role'::text) = 'service_role'::text)
) WITH CHECK (
  check_is_admin() OR 
  (current_setting('role'::text) = 'service_role'::text)
);
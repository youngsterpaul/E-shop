-- Consolidate multiple permissive policies for better performance
-- Replace multiple SELECT policies with single combined policies

-- discounts table - combine SELECT policies
DROP POLICY IF EXISTS "Admins can manage discounts" ON public.discounts;
DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.discounts;

CREATE POLICY "View active discounts" ON public.discounts
FOR SELECT USING (
  is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now())
  OR is_any_admin((select auth.uid()))
);

CREATE POLICY "Admins manage discounts" ON public.discounts
FOR INSERT WITH CHECK (is_any_admin((select auth.uid())));

CREATE POLICY "Admins update discounts" ON public.discounts
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins delete discounts" ON public.discounts
FOR DELETE USING (is_any_admin((select auth.uid())));

-- flash_sale_products - combine SELECT policies
DROP POLICY IF EXISTS "Admins can manage flash sale products" ON public.flash_sale_products;
DROP POLICY IF EXISTS "Everyone can view flash sale products" ON public.flash_sale_products;

CREATE POLICY "View flash sale products" ON public.flash_sale_products
FOR SELECT USING (true);

CREATE POLICY "Admins manage flash sale products" ON public.flash_sale_products
FOR INSERT WITH CHECK (is_any_admin((select auth.uid())));

CREATE POLICY "Admins update flash sale products" ON public.flash_sale_products
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins delete flash sale products" ON public.flash_sale_products
FOR DELETE USING (is_any_admin((select auth.uid())));

-- flash_sales - combine SELECT policies
DROP POLICY IF EXISTS "Admins can manage flash sales" ON public.flash_sales;
DROP POLICY IF EXISTS "Everyone can view all flash sales" ON public.flash_sales;

CREATE POLICY "View flash sales" ON public.flash_sales
FOR SELECT USING (true);

CREATE POLICY "Admins manage flash sales" ON public.flash_sales
FOR INSERT WITH CHECK (is_any_admin((select auth.uid())));

CREATE POLICY "Admins update flash sales" ON public.flash_sales
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins delete flash sales" ON public.flash_sales
FOR DELETE USING (is_any_admin((select auth.uid())));

-- loyalty_points - separate system operations from user viewing
DROP POLICY IF EXISTS "System can manage points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can view their own points" ON public.loyalty_points;

CREATE POLICY "View own points" ON public.loyalty_points
FOR SELECT USING ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

CREATE POLICY "System insert points" ON public.loyalty_points
FOR INSERT WITH CHECK (true);

CREATE POLICY "System update points" ON public.loyalty_points
FOR UPDATE USING (true);

CREATE POLICY "System delete points" ON public.loyalty_points
FOR DELETE USING (true);

-- order_status_history - combine SELECT policies
DROP POLICY IF EXISTS "Admins can view order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Users can view their order status history" ON public.order_status_history;

CREATE POLICY "View order status history" ON public.order_status_history
FOR SELECT USING (
  is_any_admin((select auth.uid()))
  OR EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.order_id = order_status_history.order_id 
    AND orders.user_id = (select auth.uid())
  )
);

-- returns - combine SELECT policies
DROP POLICY IF EXISTS "Admins can view all returns" ON public.returns;
DROP POLICY IF EXISTS "Users can view their own returns" ON public.returns;
DROP POLICY IF EXISTS "Users can create returns" ON public.returns;
DROP POLICY IF EXISTS "Admins can update returns" ON public.returns;
DROP POLICY IF EXISTS "Admins can delete returns" ON public.returns;

CREATE POLICY "View returns" ON public.returns
FOR SELECT USING ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

CREATE POLICY "Create own returns" ON public.returns
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins update returns" ON public.returns
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins delete returns" ON public.returns
FOR DELETE USING (is_any_admin((select auth.uid())));

-- reward_redemptions - separate operations
DROP POLICY IF EXISTS "Admins can manage redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Users can redeem rewards" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.reward_redemptions;

CREATE POLICY "View redemptions" ON public.reward_redemptions
FOR SELECT USING ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

CREATE POLICY "Create redemptions" ON public.reward_redemptions
FOR INSERT WITH CHECK ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

CREATE POLICY "Admins update redemptions" ON public.reward_redemptions
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins delete redemptions" ON public.reward_redemptions
FOR DELETE USING (is_any_admin((select auth.uid())));

-- rewards - combine SELECT policies
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;

CREATE POLICY "View rewards" ON public.rewards
FOR SELECT USING (is_active = true OR is_any_admin((select auth.uid())));

CREATE POLICY "Admins manage rewards" ON public.rewards
FOR INSERT WITH CHECK (is_any_admin((select auth.uid())));

CREATE POLICY "Admins update rewards" ON public.rewards
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins delete rewards" ON public.rewards
FOR DELETE USING (is_any_admin((select auth.uid())));
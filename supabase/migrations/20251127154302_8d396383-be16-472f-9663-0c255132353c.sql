-- Fix Auth RLS Initialization Plan performance issues
-- Wrap auth.uid() and is_any_admin() calls in SELECT to prevent per-row evaluation

-- discounts table
DROP POLICY IF EXISTS "Admins can manage discounts" ON public.discounts;
CREATE POLICY "Admins can manage discounts" ON public.discounts
FOR ALL USING (is_any_admin((select auth.uid())));

DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.discounts;
CREATE POLICY "Anyone can view active discounts" ON public.discounts
FOR SELECT USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

-- discount_usage table - combine policies
DROP POLICY IF EXISTS "Admins can view all discount usage" ON public.discount_usage;
DROP POLICY IF EXISTS "Users can view their own discount usage" ON public.discount_usage;
DROP POLICY IF EXISTS "System can insert discount usage" ON public.discount_usage;

CREATE POLICY "Users and admins can view discount usage" ON public.discount_usage
FOR SELECT USING ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

CREATE POLICY "System can insert discount usage" ON public.discount_usage
FOR INSERT WITH CHECK (true);

-- returns table
DROP POLICY IF EXISTS "Users can view their own returns" ON public.returns;
DROP POLICY IF EXISTS "Users can create returns" ON public.returns;
DROP POLICY IF EXISTS "Admins can view all returns" ON public.returns;
DROP POLICY IF EXISTS "Admins can update returns" ON public.returns;
DROP POLICY IF EXISTS "Admins can delete returns" ON public.returns;

CREATE POLICY "Users can view their own returns" ON public.returns
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create returns" ON public.returns
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can view all returns" ON public.returns
FOR SELECT USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins can update returns" ON public.returns
FOR UPDATE USING (is_any_admin((select auth.uid())));

CREATE POLICY "Admins can delete returns" ON public.returns
FOR DELETE USING (is_any_admin((select auth.uid())));

-- email_templates table
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates" ON public.email_templates
FOR ALL USING (is_any_admin((select auth.uid())));

-- review_votes table
DROP POLICY IF EXISTS "Authenticated users can vote on reviews" ON public.review_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.review_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.review_votes;

CREATE POLICY "Authenticated users can vote on reviews" ON public.review_votes
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own votes" ON public.review_votes
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own votes" ON public.review_votes
FOR DELETE USING ((select auth.uid()) = user_id);

-- review_replies table
DROP POLICY IF EXISTS "Admins and moderators can create replies" ON public.review_replies;
DROP POLICY IF EXISTS "Reply authors can update their replies" ON public.review_replies;
DROP POLICY IF EXISTS "Admins can delete replies" ON public.review_replies;

CREATE POLICY "Admins and moderators can create replies" ON public.review_replies
FOR INSERT WITH CHECK (is_any_admin((select auth.uid())) OR has_role((select auth.uid()), 'moderator'::app_role));

CREATE POLICY "Reply authors can update their replies" ON public.review_replies
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Admins can delete replies" ON public.review_replies
FOR DELETE USING (is_any_admin((select auth.uid())));

-- loyalty_points table
DROP POLICY IF EXISTS "Users can view their own points" ON public.loyalty_points;
CREATE POLICY "Users can view their own points" ON public.loyalty_points
FOR SELECT USING ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

-- points_transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.points_transactions;
CREATE POLICY "Users can view their own transactions" ON public.points_transactions
FOR SELECT USING ((select auth.uid()) = user_id OR is_any_admin((select auth.uid())));

-- rewards table
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;

CREATE POLICY "Anyone can view active rewards" ON public.rewards
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.rewards
FOR ALL USING (is_any_admin((select auth.uid())));

-- reward_redemptions table
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Users can redeem rewards" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Admins can manage redemptions" ON public.reward_redemptions;

CREATE POLICY "Users can view their own redemptions" ON public.reward_redemptions
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can redeem rewards" ON public.reward_redemptions
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can manage redemptions" ON public.reward_redemptions
FOR ALL USING (is_any_admin((select auth.uid())));

-- referrals table
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

CREATE POLICY "Users can view their referrals" ON public.referrals
FOR SELECT USING ((select auth.uid()) = referrer_user_id OR (select auth.uid()) = referred_user_id OR is_any_admin((select auth.uid())));

CREATE POLICY "Users can create referrals" ON public.referrals
FOR INSERT WITH CHECK ((select auth.uid()) = referrer_user_id);

-- login_audit table
DROP POLICY IF EXISTS "Superadmins can delete login audits" ON public.login_audit;
CREATE POLICY "Superadmins can delete login audits" ON public.login_audit
FOR DELETE USING (has_role((select auth.uid()), 'superadmin'::app_role));

-- admin_activity_logs table
DROP POLICY IF EXISTS "Superadmins can delete activity logs" ON public.admin_activity_logs;
CREATE POLICY "Superadmins can delete activity logs" ON public.admin_activity_logs
FOR DELETE USING (has_role((select auth.uid()), 'superadmin'::app_role));

-- flash_sales table
DROP POLICY IF EXISTS "Admins can manage flash sales" ON public.flash_sales;
CREATE POLICY "Admins can manage flash sales" ON public.flash_sales
FOR ALL USING (is_any_admin((select auth.uid())));

-- flash_sale_products table - combine policies
DROP POLICY IF EXISTS "Admins can manage flash sale products" ON public.flash_sale_products;
DROP POLICY IF EXISTS "Everyone can view flash sale products" ON public.flash_sale_products;

CREATE POLICY "Everyone can view flash sale products" ON public.flash_sale_products
FOR SELECT USING (true);

CREATE POLICY "Admins can manage flash sale products" ON public.flash_sale_products
FOR ALL USING (is_any_admin((select auth.uid())));

-- order_status_history table
DROP POLICY IF EXISTS "Admins can view order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Users can view their order status history" ON public.order_status_history;

CREATE POLICY "Admins can view order status history" ON public.order_status_history
FOR SELECT USING (is_any_admin((select auth.uid())));

CREATE POLICY "Users can view their order status history" ON public.order_status_history
FOR SELECT USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.order_id = order_status_history.order_id 
  AND orders.user_id = (select auth.uid())
));
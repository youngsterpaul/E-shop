-- Fix RLS performance issue on mpesa_payments table
-- Drop existing policy
DROP POLICY IF EXISTS "mpesa_payments_access" ON public.mpesa_payments;

-- Create optimized policy with subquery to prevent re-evaluation
CREATE POLICY "mpesa_payments_access" 
ON public.mpesa_payments
FOR ALL
USING (
  check_is_admin() 
  OR (current_setting('role'::text) = 'service_role'::text)
  OR (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.order_id = mpesa_payments.order_id 
      AND orders.user_id = (SELECT auth.uid())
    )
  )
)
WITH CHECK (
  check_is_admin() 
  OR (current_setting('role'::text) = 'service_role'::text)
);
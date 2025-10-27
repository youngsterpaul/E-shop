<<<<<<< HEAD
-- Fix critical security vulnerability in mpesa_payments table
-- Remove the overly permissive public_insert policy and add proper user access controls

-- Drop the insecure public_insert policy
DROP POLICY IF EXISTS "public_insert" ON public.mpesa_payments;

-- Add policy for users to view their own payment records
-- Users can only see payments for orders they created
CREATE POLICY "Users can view their own payment records" 
ON public.mpesa_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.order_id = mpesa_payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Add policy to allow service role to manage payment records
-- This is needed for M-Pesa callback system to work
CREATE POLICY "Service role can manage payment records" 
ON public.mpesa_payments 
FOR ALL 
USING (current_setting('role') = 'service_role')
=======
-- Fix critical security vulnerability in mpesa_payments table
-- Remove the overly permissive public_insert policy and add proper user access controls

-- Drop the insecure public_insert policy
DROP POLICY IF EXISTS "public_insert" ON public.mpesa_payments;

-- Add policy for users to view their own payment records
-- Users can only see payments for orders they created
CREATE POLICY "Users can view their own payment records" 
ON public.mpesa_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.order_id = mpesa_payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Add policy to allow service role to manage payment records
-- This is needed for M-Pesa callback system to work
CREATE POLICY "Service role can manage payment records" 
ON public.mpesa_payments 
FOR ALL 
USING (current_setting('role') = 'service_role')
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
WITH CHECK (current_setting('role') = 'service_role');
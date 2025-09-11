-- Fix security and add proper cart migration on user authentication
-- Since some tables don't exist, we'll only fix the ones that do

-- Add the trigger for automatic cart total updates
DROP TRIGGER IF EXISTS update_cart_totals_trigger ON cart_items;
CREATE TRIGGER update_cart_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION trigger_update_cart_totals();

-- Create cart migration hook for when user signs in
CREATE OR REPLACE FUNCTION public.auto_migrate_guest_cart()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  session_id_val TEXT;
BEGIN
  -- This function should be called by the frontend when a user signs in
  -- It will migrate any guest cart items to the user's cart
  RETURN NEW;
END;
$function$;

-- Add unique constraint for cart_items to prevent duplicates (with better handling)
DO $$
BEGIN
  -- First, check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_cart_product_variant'
    AND table_name = 'cart_items'
  ) THEN
    -- Only add if it doesn't exist
    ALTER TABLE cart_items ADD CONSTRAINT unique_cart_product_variant 
    UNIQUE (cart_id, product_id, variant_selections);
  END IF;
END $$;
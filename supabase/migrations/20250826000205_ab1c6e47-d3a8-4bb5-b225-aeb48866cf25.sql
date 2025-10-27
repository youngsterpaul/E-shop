<<<<<<< HEAD
-- Fix all security issues identified by the linter

-- 1. Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Update all functions to have proper search_path for security
CREATE OR REPLACE FUNCTION public.update_cart_totals(cart_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update the cart totals based on current cart_items with product prices
  UPDATE carts 
  SET 
    item_count = (
      SELECT COALESCE(SUM(quantity), 0) 
      FROM cart_items 
      WHERE cart_items.cart_id = update_cart_totals.cart_id
    ),
    total_amount = (
      SELECT COALESCE(SUM(p.price * ci.quantity), 0.00)
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = update_cart_totals.cart_id
    ),
    updated_at = NOW()
  WHERE id = update_cart_totals.cart_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_cart_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %, quantity: %', 
      TG_OP, NEW.cart_id, NEW.product_id, NEW.quantity;
    PERFORM update_cart_totals(NEW.cart_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %', 
      TG_OP, OLD.cart_id, OLD.product_id;
    PERFORM update_cart_totals(OLD.cart_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Create the trigger for automatic cart total updates
DROP TRIGGER IF EXISTS update_cart_totals_trigger ON cart_items;
CREATE TRIGGER update_cart_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION trigger_update_cart_totals();

-- 3. Add unique constraint for cart_items to prevent duplicates
ALTER TABLE cart_items ADD CONSTRAINT unique_cart_product_variant 
=======
-- Fix all security issues identified by the linter

-- 1. Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Update all functions to have proper search_path for security
CREATE OR REPLACE FUNCTION public.update_cart_totals(cart_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update the cart totals based on current cart_items with product prices
  UPDATE carts 
  SET 
    item_count = (
      SELECT COALESCE(SUM(quantity), 0) 
      FROM cart_items 
      WHERE cart_items.cart_id = update_cart_totals.cart_id
    ),
    total_amount = (
      SELECT COALESCE(SUM(p.price * ci.quantity), 0.00)
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = update_cart_totals.cart_id
    ),
    updated_at = NOW()
  WHERE id = update_cart_totals.cart_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_cart_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %, quantity: %', 
      TG_OP, NEW.cart_id, NEW.product_id, NEW.quantity;
    PERFORM update_cart_totals(NEW.cart_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    RAISE NOTICE 'Trigger fired for % on cart_id: %, product_id: %', 
      TG_OP, OLD.cart_id, OLD.product_id;
    PERFORM update_cart_totals(OLD.cart_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Create the trigger for automatic cart total updates
DROP TRIGGER IF EXISTS update_cart_totals_trigger ON cart_items;
CREATE TRIGGER update_cart_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION trigger_update_cart_totals();

-- 3. Add unique constraint for cart_items to prevent duplicates
ALTER TABLE cart_items ADD CONSTRAINT unique_cart_product_variant 
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
UNIQUE (cart_id, product_id, variant_selections);
-- SECURITY FIX: Enable Row Level Security on all tables with customer data
-- This addresses the critical security vulnerability where customer PII was publicly accessible

-- 1. Enable RLS on profiles table (contains customer PII)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on orders table (contains customer orders and addresses)  
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on carts table (ensure it's enabled)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on cart_items table (ensure it's enabled)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 5. Clean up redundant/conflicting policies on carts table
-- Keep only the essential policies and remove duplicates

-- Drop redundant policies on carts table
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.carts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.carts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.carts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.carts;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.carts;

-- Keep the comprehensive policies that handle both authenticated and guest users
-- These policies already exist and are properly configured:
-- - "Guests can access carts by session_id" 
-- - "Users can access their own carts"
-- - "Users can delete their own carts"
-- - "Users can update their own carts" 
-- - "Users can create their own carts"
-- - "Users can view their own carts"

-- 6. Ensure database functions have proper security
-- Update functions to include proper search_path setting

CREATE OR REPLACE FUNCTION public.get_or_create_cart(p_user_id uuid DEFAULT NULL::uuid, p_session_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  cart_id UUID;
BEGIN
  -- Validate input
  IF (p_user_id IS NULL AND p_session_id IS NULL) OR 
     (p_user_id IS NOT NULL AND p_session_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Must provide either user_id or session_id, but not both';
  END IF;
  
  -- Try to find existing active cart
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO cart_id
    FROM carts
    WHERE user_id = p_user_id
    AND status = 'active'
    AND session_id IS NULL;
  ELSE
    SELECT id INTO cart_id
    FROM carts
    WHERE session_id = p_session_id
    AND status = 'active'
    AND user_id IS NULL;
  END IF;
  
  -- Create new cart if none exists
  IF cart_id IS NULL THEN
    INSERT INTO carts (user_id, session_id, status, total_amount, item_count)
    VALUES (p_user_id, p_session_id, 'active', 0.00, 0)
    RETURNING id INTO cart_id;
  END IF;
  
  RETURN cart_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.migrate_guest_cart_to_user(p_user_id uuid, p_session_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  guest_cart_id UUID;
  user_cart_id UUID;
  cart_migrated BOOLEAN := FALSE;
BEGIN
  -- Find the guest cart
  SELECT id INTO guest_cart_id
  FROM carts
  WHERE session_id = p_session_id
  AND status = 'active'
  AND user_id IS NULL;
  
  IF guest_cart_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already has an active cart
  SELECT id INTO user_cart_id
  FROM carts
  WHERE user_id = p_user_id
  AND status = 'active'
  AND session_id IS NULL;
  
  IF user_cart_id IS NOT NULL THEN
    -- User has existing cart, migrate items from guest cart to user cart
    -- Update existing items or insert new ones
    INSERT INTO cart_items (cart_id, product_id, variant_selections, quantity, user_id, added_at, updated_at)
    SELECT 
      user_cart_id,
      gc.product_id,
      gc.variant_selections,
      gc.quantity,
      p_user_id,
      gc.added_at,
      NOW()
    FROM cart_items gc
    WHERE gc.cart_id = guest_cart_id
    ON CONFLICT (cart_id, product_id, variant_selections) 
    DO UPDATE SET 
      quantity = cart_items.quantity + EXCLUDED.quantity,
      updated_at = NOW();
    
    -- Delete the guest cart and its items
    DELETE FROM cart_items WHERE cart_id = guest_cart_id;
    DELETE FROM carts WHERE id = guest_cart_id;
    
    cart_migrated := TRUE;
  ELSE
    -- Convert guest cart to user cart
    UPDATE carts 
    SET user_id = p_user_id,
        session_id = NULL,
        updated_at = NOW()
    WHERE id = guest_cart_id;
    
    -- Update cart items to have user_id
    UPDATE cart_items 
    SET user_id = p_user_id,
        updated_at = NOW()
    WHERE cart_id = guest_cart_id;
    
    cart_migrated := TRUE;
  END IF;
  
  RETURN cart_migrated;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_cart_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Update the cart totals based on current cart_items with product prices
  UPDATE carts 
  SET 
    item_count = (
      SELECT COALESCE(SUM(quantity), 0) 
      FROM cart_items 
      WHERE cart_items.cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
    ),
    total_amount = (
      SELECT COALESCE(SUM(p.price * ci.quantity), 0.00)
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
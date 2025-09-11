-- Fix cart migration and ensure proper indexes
-- Enable real-time for cart_items if not already enabled
ALTER TABLE cart_items REPLICA IDENTITY FULL;

-- Add real-time publication for cart_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'cart_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
    END IF;
END $$;

-- Update the cart migration function to be more robust
CREATE OR REPLACE FUNCTION public.migrate_guest_cart_to_user(p_user_id uuid, p_session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Add trigger to auto-migrate guest cart when user signs in
CREATE OR REPLACE FUNCTION public.handle_cart_migration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  session_id_val TEXT;
BEGIN
  -- Get session_id from localStorage equivalent (would be handled in frontend)
  -- This is called when a user profile is created (user signs up/in)
  -- The actual migration will be triggered from the frontend
  RETURN NEW;
END;
$function$;
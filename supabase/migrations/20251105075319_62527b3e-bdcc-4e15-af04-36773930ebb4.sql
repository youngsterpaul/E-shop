-- Fix function search_path mutable vulnerability
-- The ensure_single_default_address function is missing SET search_path
-- This is a security risk as it could be exploited via schema manipulation

-- Step 1: Drop the trigger that depends on the function
DROP TRIGGER IF EXISTS trigger_ensure_single_default ON public.delivery_addresses;

-- Step 2: Drop and recreate the function with proper search_path
DROP FUNCTION IF EXISTS public.ensure_single_default_address();

CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE delivery_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Step 3: Recreate the trigger
CREATE TRIGGER trigger_ensure_single_default
  BEFORE INSERT OR UPDATE ON public.delivery_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();
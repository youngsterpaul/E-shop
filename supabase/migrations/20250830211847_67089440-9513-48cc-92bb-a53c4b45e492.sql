-- SECURITY FIX: Update the last remaining function with mutable search_path
-- Fix the update_order_first_name function

CREATE OR REPLACE FUNCTION public.update_order_first_name(order_id integer, first_name character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    UPDATE orders 
    SET first_name = update_order_first_name.first_name,
        updated_at = NOW()
    WHERE order_id = update_order_first_name.order_id;
END;
$function$;
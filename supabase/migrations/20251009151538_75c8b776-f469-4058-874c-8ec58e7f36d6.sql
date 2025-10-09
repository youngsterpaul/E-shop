-- Fix search_path security issue on trigger functions

CREATE OR REPLACE FUNCTION public.update_user_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.profiles
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        NEW.last_sign_in_at,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$function$;
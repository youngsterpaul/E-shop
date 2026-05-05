
-- Revoke EXECUTE from PUBLIC (the source of broad access).
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid)              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code(uuid)          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.migrate_guest_cart_to_user(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_or_create_cart(uuid, text)        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_user_review_product(uuid, uuid)   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_any_admin(uuid)                    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_route_permission(uuid, text)      FROM PUBLIC;

-- Re-grant only what RLS evaluation needs (RLS runs as the calling role).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_any_admin(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_route_permission(uuid, text) TO authenticated;

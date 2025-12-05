-- Add missing route permissions
INSERT INTO public.admin_route_permissions (route_path, route_name, route_group, role, is_allowed) VALUES
('/supersmartkenyaadmin123/site-content', 'Site Content', 'Content', 'admin', true),
('/supersmartkenyaadmin123/site-content', 'Site Content', 'Content', 'moderator', false)
ON CONFLICT (route_path, role) DO NOTHING;
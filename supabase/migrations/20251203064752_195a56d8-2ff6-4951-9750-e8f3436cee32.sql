-- Add missing routes to admin_route_permissions
INSERT INTO public.admin_route_permissions (route_path, route_name, route_group, role, is_allowed)
VALUES
  -- Dashboard
  ('/supersmartkenyaadmin123', 'Dashboard', 'Overview', 'admin', true),
  ('/supersmartkenyaadmin123', 'Dashboard', 'Overview', 'moderator', true),
  -- Daily Sales
  ('/supersmartkenyaadmin123/daily-sales', 'Daily Sales', 'Analytics', 'admin', false),
  ('/supersmartkenyaadmin123/daily-sales', 'Daily Sales', 'Analytics', 'moderator', false),
  -- Stores
  ('/supersmartkenyaadmin123/stores', 'Stores', 'Catalog', 'admin', true),
  ('/supersmartkenyaadmin123/stores', 'Stores', 'Catalog', 'moderator', false),
  -- Users
  ('/supersmartkenyaadmin123/users', 'Users', 'Management', 'admin', false),
  ('/supersmartkenyaadmin123/users', 'Users', 'Management', 'moderator', false),
  -- Security Alerts
  ('/supersmartkenyaadmin123/security-alerts', 'Security Alerts', 'Security', 'admin', false),
  ('/supersmartkenyaadmin123/security-alerts', 'Security Alerts', 'Security', 'moderator', false),
  -- Login Audit
  ('/supersmartkenyaadmin123/login-audit', 'Login Audit', 'Security', 'admin', false),
  ('/supersmartkenyaadmin123/login-audit', 'Login Audit', 'Security', 'moderator', false),
  -- Activity Log
  ('/supersmartkenyaadmin123/activity-log', 'Activity Log', 'Security', 'admin', false),
  ('/supersmartkenyaadmin123/activity-log', 'Activity Log', 'Security', 'moderator', false),
  -- Settings
  ('/supersmartkenyaadmin123/settings', 'Settings', 'System', 'admin', false),
  ('/supersmartkenyaadmin123/settings', 'Settings', 'System', 'moderator', false),
  -- Route Permissions (superadmin only, but add entries for completeness)
  ('/supersmartkenyaadmin123/route-permissions', 'Route Permissions', 'System', 'admin', false),
  ('/supersmartkenyaadmin123/route-permissions', 'Route Permissions', 'System', 'moderator', false)
ON CONFLICT DO NOTHING;
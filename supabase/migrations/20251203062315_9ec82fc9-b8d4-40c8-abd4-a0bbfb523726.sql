-- Create table for admin route permissions
CREATE TABLE public.admin_route_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path text NOT NULL,
  route_name text NOT NULL,
  route_group text NOT NULL DEFAULT 'General',
  role app_role NOT NULL,
  is_allowed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(route_path, role)
);

-- Enable RLS
ALTER TABLE public.admin_route_permissions ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage all permissions
CREATE POLICY "Superadmins can manage route permissions"
ON public.admin_route_permissions
FOR ALL
USING (has_role((SELECT auth.uid()), 'superadmin'))
WITH CHECK (has_role((SELECT auth.uid()), 'superadmin'));

-- All admins can view permissions
CREATE POLICY "Admins can view route permissions"
ON public.admin_route_permissions
FOR SELECT
USING (is_any_admin((SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'moderator'));

-- Create function to check route permission
CREATE OR REPLACE FUNCTION public.has_route_permission(_user_id uuid, _route_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Superadmins always have access
  SELECT CASE 
    WHEN has_role(_user_id, 'superadmin') THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.admin_route_permissions arp
      JOIN public.user_roles ur ON ur.role = arp.role
      WHERE ur.user_id = _user_id
        AND arp.route_path = _route_path
        AND arp.is_allowed = true
    )
  END
$$;

-- Insert default route permissions for admin and moderator roles
INSERT INTO public.admin_route_permissions (route_path, route_name, route_group, role, is_allowed) VALUES
-- Dashboard
('/supersmartkenyaadmin123', 'Dashboard', 'Overview', 'admin', true),
('/supersmartkenyaadmin123', 'Dashboard', 'Overview', 'moderator', true),
('/supersmartkenyaadmin123/daily-sales', 'Daily Sales', 'Overview', 'admin', false),
('/supersmartkenyaadmin123/daily-sales', 'Daily Sales', 'Overview', 'moderator', false),

-- Catalog
('/supersmartkenyaadmin123/products', 'Products', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/products', 'Products', 'Catalog', 'moderator', true),
('/supersmartkenyaadmin123/products/add', 'Add Product', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/products/add', 'Add Product', 'Catalog', 'moderator', true),
('/supersmartkenyaadmin123/categories', 'Categories', 'Catalog', 'admin', false),
('/supersmartkenyaadmin123/categories', 'Categories', 'Catalog', 'moderator', false),
('/supersmartkenyaadmin123/category-icons', 'Category Icons', 'Catalog', 'admin', false),
('/supersmartkenyaadmin123/category-icons', 'Category Icons', 'Catalog', 'moderator', false),
('/supersmartkenyaadmin123/inventory', 'Inventory', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/inventory', 'Inventory', 'Catalog', 'moderator', false),
('/supersmartkenyaadmin123/suppliers', 'Suppliers', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/suppliers', 'Suppliers', 'Catalog', 'moderator', false),
('/supersmartkenyaadmin123/purchase-orders', 'Purchase Orders', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/purchase-orders', 'Purchase Orders', 'Catalog', 'moderator', false),

-- Content
('/supersmartkenyaadmin123/heroslides', 'Hero Slides', 'Content', 'admin', true),
('/supersmartkenyaadmin123/heroslides', 'Hero Slides', 'Content', 'moderator', false),
('/supersmartkenyaadmin123/flash-sales', 'Flash Sales', 'Content', 'admin', true),
('/supersmartkenyaadmin123/flash-sales', 'Flash Sales', 'Content', 'moderator', false),
('/supersmartkenyaadmin123/discounts', 'Discounts', 'Content', 'admin', true),
('/supersmartkenyaadmin123/discounts', 'Discounts', 'Content', 'moderator', false),
('/supersmartkenyaadmin123/faq', 'FAQ', 'Content', 'admin', true),
('/supersmartkenyaadmin123/faq', 'FAQ', 'Content', 'moderator', false),
('/supersmartkenyaadmin123/careers', 'Careers', 'Content', 'admin', true),
('/supersmartkenyaadmin123/careers', 'Careers', 'Content', 'moderator', false),
('/supersmartkenyaadmin123/contact', 'Contact', 'Content', 'admin', false),
('/supersmartkenyaadmin123/contact', 'Contact', 'Content', 'moderator', false),

-- Management
('/supersmartkenyaadmin123/orders', 'Orders', 'Management', 'admin', true),
('/supersmartkenyaadmin123/orders', 'Orders', 'Management', 'moderator', true),
('/supersmartkenyaadmin123/returns', 'Returns', 'Management', 'admin', true),
('/supersmartkenyaadmin123/returns', 'Returns', 'Management', 'moderator', false),
('/supersmartkenyaadmin123/reviews', 'Reviews', 'Management', 'admin', true),
('/supersmartkenyaadmin123/reviews', 'Reviews', 'Management', 'moderator', true),
('/supersmartkenyaadmin123/customers', 'Customers', 'Management', 'admin', false),
('/supersmartkenyaadmin123/customers', 'Customers', 'Management', 'moderator', false),
('/supersmartkenyaadmin123/stores', 'Stores', 'Management', 'admin', true),
('/supersmartkenyaadmin123/stores', 'Stores', 'Management', 'moderator', false),
('/supersmartkenyaadmin123/locations', 'Locations', 'Management', 'admin', false),
('/supersmartkenyaadmin123/locations', 'Locations', 'Management', 'moderator', false),
('/supersmartkenyaadmin123/email-templates', 'Email Templates', 'Management', 'admin', true),
('/supersmartkenyaadmin123/email-templates', 'Email Templates', 'Management', 'moderator', false),

-- Analytics
('/supersmartkenyaadmin123/analytics', 'Analytics', 'Analytics', 'admin', false),
('/supersmartkenyaadmin123/analytics', 'Analytics', 'Analytics', 'moderator', false),
('/supersmartkenyaadmin123/reports', 'Reports', 'Analytics', 'admin', true),
('/supersmartkenyaadmin123/reports', 'Reports', 'Analytics', 'moderator', false),
('/supersmartkenyaadmin123/revenue-dashboard', 'Revenue Dashboard', 'Analytics', 'admin', true),
('/supersmartkenyaadmin123/revenue-dashboard', 'Revenue Dashboard', 'Analytics', 'moderator', false),

-- Security
('/supersmartkenyaadmin123/users', 'Users', 'Security', 'admin', false),
('/supersmartkenyaadmin123/users', 'Users', 'Security', 'moderator', false),
('/supersmartkenyaadmin123/security-alerts', 'Security Alerts', 'Security', 'admin', false),
('/supersmartkenyaadmin123/security-alerts', 'Security Alerts', 'Security', 'moderator', false),
('/supersmartkenyaadmin123/login-audit', 'Login Audit', 'Security', 'admin', false),
('/supersmartkenyaadmin123/login-audit', 'Login Audit', 'Security', 'moderator', false),
('/supersmartkenyaadmin123/activity-log', 'Activity Log', 'Security', 'admin', false),
('/supersmartkenyaadmin123/activity-log', 'Activity Log', 'Security', 'moderator', false),

-- System
('/supersmartkenyaadmin123/settings', 'Settings', 'System', 'admin', false),
('/supersmartkenyaadmin123/settings', 'Settings', 'System', 'moderator', false);
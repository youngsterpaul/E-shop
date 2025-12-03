-- Add missing admin routes and fix route groups

-- First, delete existing entries to avoid duplicates and fix groups
DELETE FROM admin_route_permissions WHERE route_path IN (
  '/supersmartkenyaadmin123',
  '/supersmartkenyaadmin123/daily-sales',
  '/supersmartkenyaadmin123/discounts',
  '/supersmartkenyaadmin123/flash-sales',
  '/supersmartkenyaadmin123/stores',
  '/supersmartkenyaadmin123/reviews',
  '/supersmartkenyaadmin123/contact',
  '/supersmartkenyaadmin123/email-templates',
  '/supersmartkenyaadmin123/products/add',
  '/supersmartkenyaadmin123/products/edit',
  '/supersmartkenyaadmin123/customers/:id',
  '/supersmartkenyaadmin123/users/add',
  '/supersmartkenyaadmin123/users/edit',
  '/supersmartkenyaadmin123/purchase-orders/create'
);

-- Insert routes with correct groups
INSERT INTO admin_route_permissions (route_path, route_name, route_group, role, is_allowed) VALUES
-- Overview group
('/supersmartkenyaadmin123', 'Dashboard', 'Overview', 'admin', true),
('/supersmartkenyaadmin123', 'Dashboard', 'Overview', 'moderator', true),

-- Analytics group  
('/supersmartkenyaadmin123/daily-sales', 'Daily Sales', 'Analytics', 'admin', true),
('/supersmartkenyaadmin123/daily-sales', 'Daily Sales', 'Analytics', 'moderator', false),

-- Catalog group
('/supersmartkenyaadmin123/products/add', 'Add Product', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/products/add', 'Add Product', 'Catalog', 'moderator', true),
('/supersmartkenyaadmin123/products/edit', 'Edit Product', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/products/edit', 'Edit Product', 'Catalog', 'moderator', true),
('/supersmartkenyaadmin123/stores', 'Stores', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/stores', 'Stores', 'Catalog', 'moderator', false),
('/supersmartkenyaadmin123/reviews', 'Reviews', 'Catalog', 'admin', true),
('/supersmartkenyaadmin123/reviews', 'Reviews', 'Catalog', 'moderator', true),

-- Management group
('/supersmartkenyaadmin123/discounts', 'Discounts', 'Management', 'admin', true),
('/supersmartkenyaadmin123/discounts', 'Discounts', 'Management', 'moderator', false),
('/supersmartkenyaadmin123/flash-sales', 'Flash Sales', 'Management', 'admin', true),
('/supersmartkenyaadmin123/flash-sales', 'Flash Sales', 'Management', 'moderator', false),
('/supersmartkenyaadmin123/customers/:id', 'Customer Details', 'Management', 'admin', true),
('/supersmartkenyaadmin123/customers/:id', 'Customer Details', 'Management', 'moderator', false),

-- Users group
('/supersmartkenyaadmin123/users/add', 'Add User', 'Users', 'admin', false),
('/supersmartkenyaadmin123/users/add', 'Add User', 'Users', 'moderator', false),
('/supersmartkenyaadmin123/users/edit', 'Edit User', 'Users', 'admin', false),
('/supersmartkenyaadmin123/users/edit', 'Edit User', 'Users', 'moderator', false),

-- Inventory group
('/supersmartkenyaadmin123/purchase-orders/create', 'Create Purchase Order', 'Inventory', 'admin', true),
('/supersmartkenyaadmin123/purchase-orders/create', 'Create Purchase Order', 'Inventory', 'moderator', false),

-- System group
('/supersmartkenyaadmin123/contact', 'Contact Settings', 'System', 'admin', true),
('/supersmartkenyaadmin123/contact', 'Contact Settings', 'System', 'moderator', false),
('/supersmartkenyaadmin123/email-templates', 'Email Templates', 'System', 'admin', true),
('/supersmartkenyaadmin123/email-templates', 'Email Templates', 'System', 'moderator', false);
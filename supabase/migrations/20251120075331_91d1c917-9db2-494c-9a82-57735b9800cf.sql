-- Add moderator permissions to products table
-- Moderators can view, insert, update products
CREATE POLICY "Moderators can view products"
ON products FOR SELECT
TO authenticated
USING (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Moderators can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Moderators can update products"
ON products FOR UPDATE
TO authenticated
USING (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
)
WITH CHECK (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Drop old policies first
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;

-- Moderators cannot delete products (only admins and superadmins)
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
TO authenticated
USING (is_any_admin(auth.uid()));

-- Add moderator permissions to orders table
-- Drop old policies
DROP POLICY IF EXISTS "Superadmins update orders" ON orders;
DROP POLICY IF EXISTS "View orders" ON orders;

-- Moderators can view and update orders
CREATE POLICY "Admins and moderators can view orders"
ON orders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR 
  user_id = auth.uid()
);

CREATE POLICY "Admins and moderators can update orders"
ON orders FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Add moderator permissions to product_variants
DROP POLICY IF EXISTS "Admins can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;

CREATE POLICY "Admins and moderators can insert product variants"
ON product_variants FOR INSERT
TO authenticated
WITH CHECK (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins and moderators can update product variants"
ON product_variants FOR UPDATE
TO authenticated
USING (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
)
WITH CHECK (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Moderators can view admin activity logs (read-only for their own actions)
DROP POLICY IF EXISTS "Admins can view activity logs" ON admin_activity_logs;

CREATE POLICY "Admins and moderators can view activity logs"
ON admin_activity_logs FOR SELECT
TO authenticated
USING (
  is_any_admin(auth.uid()) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);
-- Create role enum with superadmin, admin, moderator, user
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create SECURITY DEFINER function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('superadmin', 'admin')
  )
$$;

-- Migrate existing admins to superadmin role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superadmin'::app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- RLS Policy: Only superadmins can manage roles
CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- RLS Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Profiles consolidated" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Superadmins view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmins update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- Update products RLS policies
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (is_any_admin(auth.uid()))
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (is_any_admin(auth.uid()));

-- Update product_variants RLS policies
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;

CREATE POLICY "Admins can insert product variants"
ON public.product_variants
FOR INSERT
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can update product variants"
ON public.product_variants
FOR UPDATE
USING (is_any_admin(auth.uid()))
WITH CHECK (is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete product variants"
ON public.product_variants
FOR DELETE
USING (is_any_admin(auth.uid()));

-- Update categories RLS policies (superadmin only)
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;

CREATE POLICY "Superadmins can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update categories"
ON public.categories
FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete categories"
ON public.categories
FOR DELETE
USING (has_role(auth.uid(), 'superadmin'));

-- Update orders RLS policies (superadmin only)
DROP POLICY IF EXISTS "Orders consolidated" ON public.orders;

CREATE POLICY "Users view own orders"
ON public.orders
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Superadmins view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Update mpesa_payments RLS policies (superadmin only)
DROP POLICY IF EXISTS "mpesa_payments_access" ON public.mpesa_payments;

CREATE POLICY "Users view own payments"
ON public.mpesa_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.order_id = mpesa_payments.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmins view all payments"
ON public.mpesa_payments
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Service role can manage payments"
ON public.mpesa_payments
FOR ALL
USING (current_setting('role', true) = 'service_role')
WITH CHECK (current_setting('role', true) = 'service_role');

-- Update hero_slides RLS policies (superadmin only)
DROP POLICY IF EXISTS "Admin bcan update heroslides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admin can delete heroslides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admin can insert heroslide" ON public.hero_slides;

CREATE POLICY "Superadmins can insert hero slides"
ON public.hero_slides
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update hero slides"
ON public.hero_slides
FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete hero slides"
ON public.hero_slides
FOR DELETE
USING (has_role(auth.uid(), 'superadmin'));

-- Update admin_settings, daily_sales, store, callback_ip_whitelist (superadmin only)
DROP POLICY IF EXISTS "Admins can manage admin settings" ON public.admin_settings;
CREATE POLICY "Superadmins can manage admin settings"
ON public.admin_settings
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Admins only" ON public.daily_sales;
CREATE POLICY "Superadmins only"
ON public.daily_sales
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Admins only" ON public.store;
CREATE POLICY "Superadmins only store"
ON public.store
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Admins only" ON public.callback_ip_whitelist;
CREATE POLICY "Superadmins only callback"
ON public.callback_ip_whitelist
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- Drop is_admin column from profiles (after migration complete)
-- ALTER TABLE public.profiles DROP COLUMN is_admin;
-- Commented out - run manually after verifying everything works

-- Create index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
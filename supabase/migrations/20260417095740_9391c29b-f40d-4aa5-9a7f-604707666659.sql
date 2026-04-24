
-- 1. Migrate any remaining webhook secrets from orders to order_secrets, then drop the column
INSERT INTO public.order_secrets (order_id, webhook_secret)
SELECT order_id, webhook_secret
FROM public.orders
WHERE webhook_secret IS NOT NULL
  AND order_id NOT IN (SELECT order_id FROM public.order_secrets)
ON CONFLICT (order_id) DO NOTHING;

ALTER TABLE public.orders DROP COLUMN IF EXISTS webhook_secret;

-- 2. Restrict storage INSERT policies for product-images and hero-slides to admins/moderators
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hero slides" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload hero slides" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update hero slides" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete hero slides" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images' AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images' AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

CREATE POLICY "Admins can upload hero slides"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hero-slides' AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

CREATE POLICY "Admins can update hero slides"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'hero-slides' AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

CREATE POLICY "Admins can delete hero slides"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'hero-slides' AND (
    public.has_role(auth.uid(), 'superadmin'::public.app_role) OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

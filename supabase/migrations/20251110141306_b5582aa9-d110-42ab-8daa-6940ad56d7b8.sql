-- Add DELETE policy for orders table so superadmins can delete orders
CREATE POLICY "Superadmins can delete orders" ON orders
FOR DELETE
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'superadmin'::app_role)
);
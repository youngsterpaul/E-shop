-- Add DELETE policy for login_audit table
CREATE POLICY "Superadmins can delete login audits"
ON public.login_audit
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
);
-- Add DELETE policy for admin_activity_logs table
CREATE POLICY "Superadmins can delete activity logs"
ON public.admin_activity_logs
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'superadmin'::app_role)
);
-- Create role change history table
CREATE TABLE IF NOT EXISTS public.role_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  reason TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('add', 'remove', 'update')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reverted_at TIMESTAMP WITH TIME ZONE,
  reverted_by UUID
);

-- Enable RLS
ALTER TABLE public.role_change_history ENABLE ROW LEVEL SECURITY;

-- Policy: Superadmins can view all role history
CREATE POLICY "Superadmins can view role history"
ON public.role_change_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Policy: Service role can insert (for triggers)
CREATE POLICY "Service role can insert role history"
ON public.role_change_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Superadmins can update (for reverting)
CREATE POLICY "Superadmins can update role history"
ON public.role_change_history
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_change_history_user_id ON public.role_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_history_changed_by ON public.role_change_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_change_history_created_at ON public.role_change_history(created_at DESC);
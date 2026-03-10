
-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Service role can insert login audits" ON public.login_audit;

-- Create a PERMISSIVE INSERT policy that allows anyone (including anon) to insert audit records
CREATE POLICY "Anyone can insert login audits"
  ON public.login_audit
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create email_verifications table for OTP storage
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5
);

-- Create index for faster lookups
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own verifications
CREATE POLICY "Users can read own verifications"
  ON public.email_verifications
  FOR SELECT
  USING (true);

-- Policy to allow inserting new verifications
CREATE POLICY "Allow insert verifications"
  ON public.email_verifications
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow updating verifications
CREATE POLICY "Allow update verifications"
  ON public.email_verifications
  FOR UPDATE
  USING (true);

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verifications 
  WHERE expires_at < NOW()
  OR (verified = TRUE AND created_at < NOW() - INTERVAL '1 day');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create MFA settings table (for future use)
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method TEXT, -- 'totp', 'sms', 'email'
  totp_secret TEXT,
  backup_codes TEXT[], -- Encrypted backup codes
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on MFA settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own MFA settings
CREATE POLICY "Users can manage own MFA settings"
  ON public.user_mfa_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
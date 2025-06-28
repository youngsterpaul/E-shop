
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PasswordResetHandlerProps {
  children: (props: {
    isValidToken: boolean;
    isLoading: boolean;
    errorMessage: string | null;
  }) => React.ReactNode;
}

export const PasswordResetHandler = ({ children }: PasswordResetHandlerProps) => {
  const [searchParams] = useSearchParams();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateResetToken = async () => {
      try {
        // Get URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors in URL parameters
        if (error) {
          console.error('Reset URL error:', error, errorDescription);
          setErrorMessage(
            errorDescription === 'Email link is invalid or has expired'
              ? 'This password reset link has expired or is invalid. Please request a new one.'
              : 'Invalid password reset link. Please request a new one.'
          );
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Check if we have the required parameters
        if (!accessToken || !refreshToken || type !== 'recovery') {
          console.error('Missing required reset parameters');
          setErrorMessage('Invalid password reset link. Please request a new one.');
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Attempt to set the session with the tokens
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setErrorMessage(
            sessionError.message.includes('expired') 
              ? 'This password reset link has expired. Please request a new one.'
              : 'Invalid password reset link. Please request a new one.'
          );
          setIsValidToken(false);
        } else if (data.session && data.user) {
          // Token is valid, user can proceed with password reset
          setIsValidToken(true);
          setErrorMessage(null);
          toast({
            title: "Link verified",
            description: "You can now set your new password.",
          });
        } else {
          setErrorMessage('Unable to verify reset link. Please try again.');
          setIsValidToken(false);
        }
      } catch (error: any) {
        console.error('Token validation error:', error);
        setErrorMessage('An error occurred while verifying your reset link. Please try again.');
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateResetToken();
  }, [searchParams, toast]);

  return <>{children({ isValidToken, isLoading, errorMessage })}</>;
};

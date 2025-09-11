
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
        // Get URL parameters - check both hash and search params
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Try to get tokens from either location
        const accessToken = searchParams.get('access_token') || 
                           urlParams.get('access_token') || 
                           hashParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token') || 
                            urlParams.get('refresh_token') || 
                            hashParams.get('refresh_token');
        const type = searchParams.get('type') || 
                    urlParams.get('type') || 
                    hashParams.get('type');
        const error = searchParams.get('error') || 
                     urlParams.get('error') || 
                     hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || 
                                urlParams.get('error_description') || 
                                hashParams.get('error_description');

        console.log('Reset token validation - URL params:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          error,
          errorDescription
        });

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

        // Check if we have the required parameters for recovery
        if (!accessToken || !refreshToken) {
          console.error('Missing required reset parameters');
          setErrorMessage('Invalid password reset link. Please request a new one.');
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // For password recovery, type should be 'recovery'
        if (type !== 'recovery') {
          console.error('Invalid type for password reset:', type);
          setErrorMessage('Invalid password reset link. Please request a new one.');
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Clear any existing session before setting the new one
        await supabase.auth.signOut();

        // Attempt to set the session with the tokens
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setErrorMessage(
            sessionError.message.includes('expired') || sessionError.message.includes('invalid')
              ? 'This password reset link has expired. Please request a new one.'
              : 'Unable to verify reset link. Please request a new one.'
          );
          setIsValidToken(false);
        } else if (data.session && data.user) {
          // Token is valid, user can proceed with password reset
          console.log('Password reset session established successfully');
          setIsValidToken(true);
          setErrorMessage(null);
          toast({
            title: "Link verified",
            description: "You can now set your new password.",
          });
        } else {
          console.error('No session or user returned after setting session');
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

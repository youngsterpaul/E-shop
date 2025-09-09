
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PasswordResetHandlerProps {
  children: (props: {
    isValidToken: boolean;
    isLoading: boolean;
    errorMessage: string | null;
    hasAuthError: boolean;
  }) => React.ReactNode;
}

export const PasswordResetHandler = ({ children }: PasswordResetHandlerProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAuthError, setHasAuthError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateResetToken = async () => {
      try {
        // Check for URL errors first (in hash fragment)
        const hashFragment = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(hashFragment.substring(1));
        
        // Check for auth errors in URL
        const error = searchParams.get('error') || 
                     urlParams.get('error') || 
                     hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || 
                                urlParams.get('error_description') || 
                                hashParams.get('error_description');
        const errorCode = searchParams.get('error_code') || 
                         urlParams.get('error_code') || 
                         hashParams.get('error_code');

        // Handle auth errors first
        if (error) {
          console.log('Auth error detected in URL:', { error, errorCode, errorDescription });
          setHasAuthError(true);
          setIsValidToken(false);
          
          if (error === 'access_denied' && errorCode === 'otp_expired') {
            setErrorMessage('This password reset link has expired or is invalid. Please request a new one.');
          } else if (errorDescription === 'Email link is invalid or has expired') {
            setErrorMessage('This password reset link has expired or is invalid. Please request a new one.');
          } else {
            setErrorMessage('Invalid password reset link. Please request a new one.');
          }
          
          setIsLoading(false);
          return;
        }

        // Try to get tokens from different locations
        const accessToken = searchParams.get('access_token') || 
                           urlParams.get('access_token') || 
                           hashParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token') || 
                            urlParams.get('refresh_token') || 
                            hashParams.get('refresh_token');
        const type = searchParams.get('type') || 
                    urlParams.get('type') || 
                    hashParams.get('type');

        console.log('Reset token validation - URL params:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          hasError: !!error,
          currentUrl: window.location.href
        });

        // Check if user is already signed in but accessing reset page without valid tokens
        const { data: { session } } = await supabase.auth.getSession();
        if (session && (!accessToken || !refreshToken || type !== 'recovery')) {
          console.log('User already signed in, redirecting to home');
          setErrorMessage('You are already signed in. If you want to change your password, please use the profile settings.');
          setIsValidToken(false);
          setIsLoading(false);
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
          return;
        }

        // Check if we have the required parameters for recovery
        if (!accessToken || !refreshToken) {
          console.log('Missing required reset parameters');
          setErrorMessage('Invalid password reset link. Please request a new one.');
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // For password recovery, type should be 'recovery'
        if (type !== 'recovery') {
          console.log('Invalid type for password reset:', type);
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
  }, [searchParams, location.hash, toast, navigate]);

  return <>{children({ isValidToken, isLoading, errorMessage, hasAuthError })}</>;
};

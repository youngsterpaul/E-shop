
import { AlertCircle, XCircle, Clock, Mail, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EnhancedAuthErrorProps {
  error: string;
  type?: 'login' | 'signup' | 'reset' | 'verify' | 'general';
  onRetry?: () => void;
  className?: string;
}

export const EnhancedAuthError = ({ 
  error, 
  type = 'general', 
  onRetry,
  className = '' 
}: EnhancedAuthErrorProps) => {
  // Enhanced error message mapping
  const getErrorDetails = (error: string, type: string) => {
    const errorLower = error.toLowerCase();
    
    // Email/Account related errors
    if (errorLower.includes('email not confirmed') || errorLower.includes('email not verified')) {
      return {
        icon: Mail,
        title: 'Email verification required',
        message: 'Please check your email and click the verification link before signing in.',
        variant: 'default' as const,
        actionText: 'Resend verification email',
        actionLink: '/auth/forgot-password'
      };
    }
    
    if (errorLower.includes('user not found') || errorLower.includes('invalid login')) {
      return {
        icon: XCircle,
        title: type === 'login' ? 'Account not found' : 'Invalid credentials',
        message: type === 'login' 
          ? 'No account found with this email address. Please check your email or sign up for a new account.'
          : 'The email or password you entered is incorrect.',
        variant: 'destructive' as const,
        actionText: 'Create new account',
        actionLink: '/auth/signup'
      };
    }
    
    if (errorLower.includes('invalid password') || errorLower.includes('wrong password')) {
      return {
        icon: Shield,
        title: 'Incorrect password',
        message: 'The password you entered is incorrect. Please try again or reset your password.',
        variant: 'destructive' as const,
        actionText: 'Reset password',
        actionLink: '/auth/forgot-password'
      };
    }
    
    // Token/Link related errors
    if (errorLower.includes('expired') || errorLower.includes('token')) {
      return {
        icon: Clock,
        title: 'Link expired',
        message: 'This link has expired or is no longer valid. Please request a new one.',
        variant: 'destructive' as const,
        actionText: type === 'reset' ? 'Request new reset link' : 'Try again',
        actionLink: type === 'reset' ? '/auth/forgot-password' : '/auth/signin'
      };
    }
    
    // Rate limiting
    if (errorLower.includes('too many') || errorLower.includes('rate limit')) {
      return {
        icon: AlertCircle,
        title: 'Too many attempts',
        message: 'You\'ve made too many attempts. Please wait a few minutes before trying again.',
        variant: 'destructive' as const,
        actionText: null,
        actionLink: null
      };
    }
    
    // Generic/Network errors
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return {
        icon: AlertCircle,
        title: 'Connection error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        variant: 'destructive' as const,
        actionText: 'Try again',
        actionLink: null
      };
    }
    
    // Default fallback
    return {
      icon: AlertCircle,
      title: 'Authentication error',
      message: error || 'An unexpected error occurred. Please try again.',
      variant: 'destructive' as const,
      actionText: 'Try again',
      actionLink: null
    };
  };

  const errorDetails = getErrorDetails(error, type);
  const IconComponent = errorDetails.icon;

  return (
    <Alert variant={errorDetails.variant} className={`${className}`}>
      <IconComponent className="h-4 w-4" />
      <AlertDescription className="ml-2">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm">{errorDetails.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{errorDetails.message}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="text-xs"
              >
                {errorDetails.actionText || 'Try again'}
              </Button>
            )}
            
            {errorDetails.actionLink && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="text-xs"
              >
                <Link to={errorDetails.actionLink}>
                  {errorDetails.actionText}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

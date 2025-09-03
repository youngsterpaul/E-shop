import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string>('');

  // Token validation effect
  useEffect(() => {
    const validateResetToken = async () => {
      // Check URL parameters for reset token and errors
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      // Also check hash parameters (common for auth callbacks)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const hashAccessToken = hashParams.get('access_token');
      const hashRefreshToken = hashParams.get('refresh_token');
      const hashError = hashParams.get('error');
      const hashErrorCode = hashParams.get('error_code');

      // Check for errors first
      if (error || hashError || errorCode || hashErrorCode) {
        const errorMsg = errorDescription || hashParams.get('error_description') || 'Reset link is invalid or has expired';
        setTokenError(errorMsg.replace(/\+/g, ' '));
        setIsValidToken(false);
        
        toast({
          title: "Reset link expired",
          description: "Your password reset link has expired. Please request a new one.",
          variant: "destructive",
        });
        return;
      }

      // Check for valid tokens
      const finalAccessToken = accessToken || hashAccessToken;
      const finalRefreshToken = refreshToken || hashRefreshToken;

      if (!finalAccessToken || !finalRefreshToken || type !== 'recovery') {
        setTokenError('Invalid or missing reset tokens');
        setIsValidToken(false);
        
        toast({
          title: "Invalid reset link",
          description: "This reset link is invalid. Please request a new password reset.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Validate the session with Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: finalAccessToken,
          refresh_token: finalRefreshToken,
        });

        if (sessionError) {
          console.error('Session validation error:', sessionError);
          throw sessionError;
        }

        setIsValidToken(true);
        console.log('Password reset token validated successfully');
        
      } catch (error: any) {
        console.error('Token validation failed:', error);
        setTokenError(error.message || 'Failed to validate reset token');
        setIsValidToken(false);
        
        toast({
          title: "Invalid reset link",
          description: "This reset link is invalid or has expired. Please request a new password reset.",
          variant: "destructive",
        });
      }
    };

    validateResetToken();
  }, [searchParams, toast]);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    // Password validation
    if (!password) {
      newErrors.password = 'Please enter a new password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      console.log('Attempting to update password...');
      
      const { data: { user }, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      if (user) {
        console.log('Password updated successfully for user:', user.id);
        setIsSuccess(true);
        
        toast({
          title: "Password updated successfully!",
          description: "Your password has been reset. You can now sign in with your new password.",
        });

        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          navigate('/auth/signin');
        }, 3000);
      }

    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SuccessContent = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-600">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-medium mb-1">What's next:</p>
        <ul className="space-y-1 text-left">
          <li>• You'll be redirected to the sign-in page shortly</li>
          <li>• Use your email and new password to sign in</li>
          <li>• Consider updating your password manager</li>
        </ul>
      </div>
      
      <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors">
        <Link to="/auth/signin">
          Continue to Sign In
        </Link>
      </Button>
    </div>
  );

  const ExpiredTokenContent = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Reset Link Expired</h3>
        <p className="text-gray-600">
          {tokenError || 'Your password reset link has expired or is invalid.'}
        </p>
      </div>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        <p className="font-medium mb-1">What happened:</p>
        <ul className="space-y-1 text-left">
          <li>• Password reset links expire after 1 hour for security</li>
          <li>• The link may have already been used</li>
          <li>• You need to request a new password reset</li>
        </ul>
      </div>
      
      <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors">
        <Link to="/auth/forgot-password">
          Request New Reset Link
        </Link>
      </Button>
      
      <div className="text-center pt-4">
        <Link
          to="/auth/signin"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );

  const ResetForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          New password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirm new password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            className={`pl-10 pr-10 h-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Updating password...
          </div>
        ) : (
          'Update password'
        )}
      </Button>

      <div className="text-center pt-4">
        <Link
          to="/auth/signin"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center /py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
        {/* SmartKenya Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SmartKenya</h1>
        </div>

        {/* Reset Password Card */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              {isSuccess 
                ? 'Password Reset Complete' 
                : isValidToken === false 
                  ? 'Reset Link Issue' 
                  : isValidToken === null 
                    ? 'Validating Reset Link...' 
                    : 'Reset your password'
              }
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              {isSuccess 
                ? 'Your password has been successfully updated' 
                : isValidToken === false 
                  ? 'There was an issue with your reset link'
                  : isValidToken === null 
                    ? 'Please wait while we validate your reset link'
                    : 'Enter your new password below'
              }
            </p>
          </div>

          {isValidToken === null ? (
            <div className="text-center space-y-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600">Validating reset link...</p>
            </div>
          ) : isValidToken === false ? (
            <ExpiredTokenContent />
          ) : isSuccess ? (
            <SuccessContent />
          ) : (
            <ResetForm />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 SmartKenya. All rights reserved.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

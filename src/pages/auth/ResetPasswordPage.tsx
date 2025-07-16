
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, Check, X, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { PasswordResetHandler } from '@/components/auth/PasswordResetHandler';
import { EnhancedAuthError } from '@/components/auth/EnhancedAuthError';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validatePassword = (password: string) => {
    if (!password) return { score: 0, requirements: null };
    
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(requirements).forEach(req => {
      if (req) score++;
    });

    return { score, requirements };
  };

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const { score } = validatePassword(password);
      if (score < 3) {
        newErrors.password = 'Password is too weak. Please meet at least 3 requirements.';
      }
    }

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
    const { score } = validatePassword(value);
    setPasswordScore(score);
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

  const passwordRequirements = password ? validatePassword(password).requirements : null;

  return (
    <PasswordResetHandler>
      {({ isValidToken, isLoading, errorMessage }) => {
        if (isLoading) {
          return (
            <AuthLayout
              title="Verifying reset link..."
              subtitle="Please wait while we verify your password reset link"
            >
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            </AuthLayout>
          );
        }

        if (!isValidToken || errorMessage) {
          return (
            <AuthLayout
              title="Invalid Reset Link"
              subtitle="This password reset link is invalid or has expired"
            >
              <div className="space-y-6">
                <EnhancedAuthError 
                  error={errorMessage || "Invalid reset link"} 
                  type="reset"
                />
                
                <div className="space-y-3">
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link to="/auth/forgot-password">
                      Request New Reset Link
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth/signin">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Link>
                  </Button>
                </div>
              </div>
            </AuthLayout>
          );
        }

        if (isSuccess) {
          return (
            <AuthLayout
              title="Password Reset Successful"
              subtitle="Your password has been successfully updated"
            >
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
                
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                  <Link to="/auth/signin">
                    Continue to Sign In
                  </Link>
                </Button>
              </div>
            </AuthLayout>
          );
        }

        return (
          <AuthLayout
            title="Reset your password"
            subtitle="Enter your new password below"
          >
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
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
                {password && (
                  <PasswordStrengthIndicator password={password} score={passwordScore} />
                )}
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {password && passwordRequirements && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    {Object.entries({
                      'At least 8 characters': passwordRequirements.length,
                      'One lowercase letter': passwordRequirements.lowercase,
                      'One uppercase letter': passwordRequirements.uppercase,
                      'One number': passwordRequirements.number,
                      'One special character': passwordRequirements.special
                    }).map(([requirement, met]) => (
                      <div key={requirement} className={`flex items-center ${met ? 'text-green-600' : 'text-gray-400'}`}>
                        {met ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        {requirement}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
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
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors"
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

              <div className="text-center">
                <Link
                  to="/auth/signin"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          </AuthLayout>
        );
      }}
    </PasswordResetHandler>
  );
};

export default ResetPasswordPage;

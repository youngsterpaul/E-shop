import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading, user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [authError, setAuthError] = useState<string>('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLinkError, setResetLinkError] = useState<string>('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  
  useEffect(() => {
    // Listen for auth state changes to detect password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setAuthMode('reset');
        } else if (event === 'SIGNED_IN' && isPasswordRecovery) {
          // Keep them on reset form during recovery process
          setAuthMode('reset');
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isPasswordRecovery]);

  useEffect(() => {
    // Check for error parameters in URL hash (for password reset errors)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');
    
    if (error && errorCode) {
      let errorMessage = '';
      if (errorCode === 'otp_expired') {
        errorMessage = 'The password reset link has expired. Please request a new one.';
      } else if (error === 'access_denied') {
        errorMessage = 'The password reset link is invalid or has expired. Please request a new one.';
      } else {
        errorMessage = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : 'Invalid password reset link.';
      }
      setResetLinkError(errorMessage);
      setAuthMode('forgot');
      return;
    }
    
    // Check if this is a password reset flow first
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setAuthMode('reset');
      return; // Don't redirect to homepage, stay for password reset
    }
    
    // Only redirect to homepage if user exists and we're not in password recovery or reset flow
    if (user && authMode !== 'reset' && mode !== 'reset' && !isPasswordRecovery) {
      navigate('/');
    }
  }, [user, navigate, searchParams, authMode, isPasswordRecovery]);

  useEffect(() => {
    // Set initial mode based on URL parameter
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setAuthMode('reset');
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Only validate password for signin and signup modes
    if (authMode !== 'forgot') {
      if (authMode === 'reset') {
        if (!newPassword.trim()) {
          newErrors.password = 'New password is required';
        } else if (newPassword.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (newPassword !== confirmNewPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      } else {
        if (!password.trim()) {
          newErrors.password = 'Password is required';
        } else if (password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
      }
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      setAuthError(error.message || 'Failed to send reset email');
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      // Reset the recovery state and redirect to homepage
      setIsPasswordRecovery(false);
      navigate('/');
    } catch (error: any) {
      setAuthError(error.message || 'Failed to update password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setAuthError('');
    
    try {
      if (authMode === 'forgot') {
        await handleForgotPassword();
        return;
      } else if (authMode === 'reset') {
        await handlePasswordReset();
        return;
      } else if (authMode === 'signup') {
        await signUp(email, password);
      } else {
        await signIn(email, password);
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = error.message || 'Authentication failed';
      
      if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox for a verification link.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (authError) {
      setAuthError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (authError) {
      setAuthError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="mb-6 flex items-center justify-center relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-0 p-2 h-8 w-8"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">SmartKenya</h1>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {authMode === 'signup' ? 'Create your account' : 
               authMode === 'forgot' ? 'Reset your password' : 
               authMode === 'reset' ? 'Set your new password' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {authMode === 'signup' ? 'Join thousands of happy customers' : 
               authMode === 'forgot' ? 'Enter your email to receive a reset link' : 
               authMode === 'reset' ? 'Please enter your new password below' : 'Welcome back! Please enter your details'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(authError || resetLinkError) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{authError || resetLinkError}</div>
              </div>
            )}

            {authMode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`pl-10 h-12 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    autoComplete="email"
                    autoFocus={!(authMode as AuthMode === 'reset')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}

            {authMode === 'reset' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
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
                  <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={`pl-10 h-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {authMode !== 'forgot' && authMode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
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
            )}

            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 h-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {authMode === 'signin' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-12 rounded-lg font-medium transition-colors"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {authMode === 'signup' ? 'Creating account...' : 
                   authMode === 'forgot' ? 'Sending reset link...' : 
                   authMode === 'reset' ? 'Updating password...' : 'Signing in...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {authMode === 'signup' ? 'Create account' : 
                   authMode === 'forgot' ? 'Send reset link' : 
                   authMode === 'reset' ? 'Update password' : 'Sign in'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>

            {authMode !== 'forgot' && authMode !== 'reset' && !resetEmailSent && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {authMode === 'signup' ? 'Sign in' : 'Sign up for free'}
                  </button>
                </p>
              </div>
            )}

            {authMode === 'signin' && !resetEmailSent && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {authMode === 'forgot' && !resetEmailSent && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setResetLinkError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to sign in
                </button>
              </div>
            )}

            {resetEmailSent && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Check your email for a reset link
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    setAuthMode('signin');
                    setEmail('');
                    setAuthError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to sign in
                </button>
              </div>
            )}
          </form>

          {authMode !== 'forgot' && authMode !== 'reset' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6">
                <GoogleSignInButton />
              </div>
            </div>
          )}

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

export default AuthPage;
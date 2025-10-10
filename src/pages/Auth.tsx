
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ChevronLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import { isMobileUserAgent } from '@/hooks/use-mobile';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [authError, setAuthError] = useState<string>('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetLinkError, setResetLinkError] = useState<string>('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [passwordResetComplete, setPasswordResetComplete] = useState(false);
  const isMobile = isMobileUserAgent();
  
  useEffect(() => {
    // Listen for auth state changes to detect password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        //console.log('Auth event:', event, 'Session:', !!session);
        
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setAuthMode('reset');
        } else if (event === 'SIGNED_IN' && isPasswordRecovery) {
          // Keep them on reset form during recovery process
          setAuthMode('reset');
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
          setPasswordResetComplete(false);
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
      setIsPasswordRecovery(true); // Set recovery state for reset mode
      return; // Don't redirect to homepage, stay for password reset
    }
    
    // Only redirect to homepage if user exists and we're not in password recovery or reset flow
    if (user && authMode !== 'reset' && mode !== 'reset' && !isPasswordRecovery && !passwordResetComplete) {
      navigate('/');
    }
  }, [user, navigate, searchParams, authMode, isPasswordRecovery, passwordResetComplete]);

  useEffect(() => {
    // Set initial mode based on URL parameter
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setAuthMode('reset');
      setIsPasswordRecovery(true);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    // Email validation for non-reset modes
    if (authMode !== 'reset') {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (authMode === 'reset') {
      // Validate new password for reset mode
      if (!newPassword.trim()) {
        newErrors.password = 'New password is required';
      } else if (newPassword.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      
      // Validate confirm password for reset mode
      if (!confirmNewPassword.trim()) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (newPassword !== confirmNewPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (authMode !== 'forgot') {
      // Validate password for signin and signup modes
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      // Additional validation for signup
      if (authMode === 'signup') {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        
        if (!confirmPassword.trim()) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
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
      //console.log('Starting password reset with password:', newPassword);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        //console.error('Password reset error:', error);
        throw error;
      }

      //console.log('Password reset successful');
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You will be redirected to the homepage.",
      });

      // Set completion state and redirect after a short delay
      setPasswordResetComplete(true);
      setIsPasswordRecovery(false);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      //console.error('Password reset failed:', error);
      setAuthError(error.message || 'Failed to update password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    //console.log('Form submitted, mode:', authMode);
    //console.log('Validation result:', validateForm());
    
    if (!validateForm()) {
      //console.log('Form validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    setAuthError('');
    
    try {
      if (authMode === 'forgot') {
        //console.log('Handling forgot password');
        await handleForgotPassword();
        return;
      } else if (authMode === 'reset') {
        //console.log('Handling password reset');
        await handlePasswordReset();
        return;
      } else if (authMode === 'signup') {
        //console.log('Handling signup');
        await signUp(email, password);
      } else {
        //console.log('Handling signin');
        await signIn(email, password);
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
    } catch (error: any) {
      //console.error('Auth error:', error);
      
      let errorMessage = error.message || 'Authentication failed';
      
      if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox for a verification link.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (errorMessage.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 8 characters long with uppercase, lowercase, and number.';
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

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (authError) {
      setAuthError('');
    }
  };

  const handleConfirmNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmNewPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
    if (authError) {
      setAuthError('');
    }
  };

  const handleHomeNavigation = () => {
    if (isPasswordRecovery && authMode === 'reset' && !passwordResetComplete) {
      // Warn user they haven't completed password reset
      if (confirm('You have not completed your password reset. Are you sure you want to leave this page?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

return (
  <>
    {isMobile ? (
      // ✅ MOBILE LAYOUT
      <div className="min-h-screen bg-white flex flex-col">
        {/* 🔝 Fixed Header */}
        <div className="flex sticky top-0 right-0 left-0 items-center justify-between px-4 py-3 shadow-sm border-b border-gray-100 bg-white z-40">
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={handleHomeNavigation}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <img
            src={smartkenyaLogo}
            alt="SmartKenya Logo"
            className="h-8 object-contain"
          />
          <div className="w-8" /> {/* spacer to balance header */}
        </div>

        {/* Success message for password reset completion */}
        {passwordResetComplete && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="text-sm text-green-700 font-medium">
                Password successfully updated! Redirecting to homepage...
              </div>
            </div>
          </div>
        )}

        {/* Title and description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authMode === 'signup' ? 'Create Account' : 
              authMode === 'forgot' ? 'Reset Password' : 
              authMode === 'reset' ? 'Set New Password' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {authMode === 'signup' ? 'Join thousands of satisfied customers' : 
              authMode === 'forgot' ? 'Enter your email to receive a secure reset link' : 
              authMode === 'reset' ? 'Please enter your new password below' : 'Sign in to continue to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-4">
          {/* Error display */}
          {(authError || resetLinkError) && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="text-sm text-red-700 font-medium">{authError || resetLinkError}</div>
              </div>
            </div>
          )}

          {/* Email field (not shown in reset mode) */}
          {authMode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  className={`pl-12 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  autoComplete="email"
                  autoFocus={!(authMode as AuthMode === 'reset')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          )}

          {/* Password reset fields */}
          {authMode === 'reset' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                  New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                      errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span>{errors.password}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmNewPassword}
                    onChange={handleConfirmNewPasswordChange}
                    className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                      errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {/* Regular password fields for signin/signup */}
          {authMode !== 'forgot' && authMode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  <span>{errors.password}</span>
                </p>
              )}
              {authMode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>
          )}

          {/* Confirm password for signup */}
          {authMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          )}

          {/* Remember me checkbox for signin */}
          {authMode === 'signin' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="rounded-md"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 font-medium">
                  Remember me for 30 days
                </Label>
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 h-14 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            disabled={isSubmitting || loading || passwordResetComplete}
          >
            {isSubmitting || loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>
                  {authMode === 'signup' ? 'Creating Account...' : 
                    authMode === 'forgot' ? 'Sending Reset Link...' : 
                    authMode === 'reset' ? 'Updating Password...' : 'Signing In...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>
                  {authMode === 'signup' ? 'Create Account' : 
                    authMode === 'forgot' ? 'Send Reset Link' : 
                    authMode === 'reset' ? 'Update Password' : 'Sign In'}
                </span>
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </Button>

          {/* Forgot password link for signin mode */}
          {authMode === 'signin' && !resetEmailSent && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Mode switching links */}
          {authMode !== 'forgot' && authMode !== 'reset' && !resetEmailSent && (
            <div className="text-center pt-4">
              <p className="text-gray-600">
                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  {authMode === 'signup' ? 'Sign In' : 'Sign Up Free'}
                </button>
              </p>
            </div>
          )}

          {/* Back to signin for forgot password mode */}
          {authMode === 'forgot' && !resetEmailSent && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setResetLinkError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center justify-center space-x-1 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          {/* Reset email sent confirmation */}
          {resetEmailSent && (
            <div className="text-center pt-4 space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-700 font-semibold">Check Your Email</span>
                </div>
                <p className="text-sm text-blue-600">
                  We've sent a secure reset link to your email address
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetEmailSent(false);
                  setAuthMode('signin');
                  setEmail('');
                  setAuthError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center justify-center space-x-1 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </form>

        {/* Google Sign In - only for signin/signup modes */}
        {authMode !== 'forgot' && authMode !== 'reset' && (
          <div className="mt-8 px-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-3 border-t border-gray-100 bg-white left-0 right-0">
          © 2025 SmartKenya. All rights reserved.
        </div>
      </div>
    ) : (
    <div className="min-h-screen py-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white/80 backdrop-blur-sm py-10 px-6 shadow-2xl /rounded-2xl sm:px-12 border border-white/20 max-w-md mx-auto">
        {/* Header with brand and navigation */}
        <div className="mb-8 flex items-center justify-center relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 p-2 h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleHomeNavigation}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
            <img
              src={smartkenyaLogo}
              alt="SmartKenya Logo"
              className="h-14 w-64 object-fill"
            />
          </div>
          </div>
        </div>

        {/* Success message for password reset completion */}
        {passwordResetComplete && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="text-sm text-green-700 font-medium">
                Password successfully updated! Redirecting to homepage...
              </div>
            </div>
          </div>
        )}

        {/* Title and description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authMode === 'signup' ? 'Create Account' : 
              authMode === 'forgot' ? 'Reset Password' : 
              authMode === 'reset' ? 'Set New Password' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {authMode === 'signup' ? 'Join thousands of satisfied customers' : 
              authMode === 'forgot' ? 'Enter your email to receive a secure reset link' : 
              authMode === 'reset' ? 'Please enter your new password below' : 'Sign in to continue to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error display */}
          {(authError || resetLinkError) && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="text-sm text-red-700 font-medium">{authError || resetLinkError}</div>
              </div>
            </div>
          )}

          {/* Email field (not shown in reset mode) */}
          {authMode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  className={`pl-12 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  autoComplete="email"
                  autoFocus={!(authMode as AuthMode === 'reset')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          )}

          {/* Forgot password link for signin mode */}
          {authMode === 'signin' && !resetEmailSent && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {/* Password reset fields */}
          {authMode === 'reset' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                  New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                      errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span>{errors.password}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmNewPassword}
                    onChange={handleConfirmNewPasswordChange}
                    className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                      errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {/* Regular password fields for signin/signup */}
          {authMode !== 'forgot' && authMode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  <span>{errors.password}</span>
                </p>
              )}
              {authMode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">
                  Must contain at least 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>
          )}

          {/* Confirm password for signup */}
          {authMode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-12 pr-14 h-14 text-base rounded-xl border-2 transition-all duration-200 focus:ring-4 focus:ring-green-100 ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          )}

          {/* Remember me checkbox for signin */}
          {authMode === 'signin' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="rounded-md"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 font-medium">
                  Remember me for 30 days
                </Label>
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 h-14 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            disabled={isSubmitting || loading || passwordResetComplete}
          >
            {isSubmitting || loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>
                  {authMode === 'signup' ? 'Creating Account...' : 
                    authMode === 'forgot' ? 'Sending Reset Link...' : 
                    authMode === 'reset' ? 'Updating Password...' : 'Signing In...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>
                  {authMode === 'signup' ? 'Create Account' : 
                    authMode === 'forgot' ? 'Send Reset Link' : 
                    authMode === 'reset' ? 'Update Password' : 'Sign In'}
                </span>
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </Button>

          {/* Mode switching links */}
          {authMode !== 'forgot' && authMode !== 'reset' && !resetEmailSent && (
            <div className="text-center pt-4">
              <p className="text-gray-600">
                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  {authMode === 'signup' ? 'Sign In' : 'Sign Up Free'}
                </button>
              </p>
            </div>
          )}

          {/* Back to signin for forgot password mode */}
          {authMode === 'forgot' && !resetEmailSent && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setResetLinkError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center justify-center space-x-1 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          {/* Reset email sent confirmation */}
          {resetEmailSent && (
            <div className="text-center pt-4 space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-700 font-semibold">Check Your Email</span>
                </div>
                <p className="text-sm text-blue-600">
                  We've sent a secure reset link to your email address
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetEmailSent(false);
                  setAuthMode('signin');
                  setEmail('');
                  setAuthError('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center justify-center space-x-1 mx-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </form>

        {/* Google Sign In - only for signin/signup modes */}
        {authMode !== 'forgot' && authMode !== 'reset' && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <GoogleSignInButton />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            © 2025 SmartKenya. All rights reserved. Secured with industry-standard encryption.
          </p>
        </div>
      </div>
    </div>
    )}
    </>
  );
};

export default AuthPage;
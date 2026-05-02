import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ChevronLeft, Shield, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import { isMobileUserAgent } from '@/hooks/use-mobile';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

const RATE_LIMIT_KEY = 'otp_requests_reset_';
const MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading, user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [successMessage, setSuccessMessage] = useState('');
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
  
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (authMode === 'signup') {
        confirmPasswordRef.current?.focus();
      } else {
        submitRef.current?.click();
      }
    }
  };

  const handleConfirmPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitRef.current?.click();
    }
  };
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setAuthMode('reset');
        } else if (event === 'SIGNED_IN' && isPasswordRecovery) {
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
    
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setAuthMode('reset');
      setIsPasswordRecovery(true);
      return;
    }
    
    if (user && authMode !== 'reset' && mode !== 'reset' && !isPasswordRecovery && !passwordResetComplete) {
      // Check for redirect URL stored during "Buy Now" flow
      const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterAuth');
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    }
  }, [user, navigate, searchParams, authMode, isPasswordRecovery, passwordResetComplete]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setAuthMode('reset');
      setIsPasswordRecovery(true);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    if (authMode !== 'reset') {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (authMode === 'reset') {
      if (!newPassword.trim()) {
        newErrors.password = 'New password is required';
      } else if (newPassword.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      
      if (!confirmNewPassword.trim()) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (newPassword !== confirmNewPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (authMode !== 'forgot') {
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
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

  const checkRateLimit = (email: string): boolean => {
    const key = RATE_LIMIT_KEY + email;
    const stored = localStorage.getItem(key);
    
    if (!stored) return true;
    
    const requests = JSON.parse(stored);
    const now = Date.now();
    
    const recentRequests = requests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      const oldestRequest = Math.min(...recentRequests);
      const timeUntilReset = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 60000);
      setAuthError(`Too many password reset attempts. Please wait ${timeUntilReset} minutes before trying again.`);
      return false;
    }
    
    return true;
  };

  const addRateLimitRequest = (email: string) => {
    const key = RATE_LIMIT_KEY + email;
    const stored = localStorage.getItem(key);
    const requests = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    
    const recentRequests = requests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
    recentRequests.push(now);
    
    localStorage.setItem(key, JSON.stringify(recentRequests));
  };

  const handleForgotPassword = async () => {
    if (!checkRateLimit(email)) {
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      addRateLimitRequest(email);

      navigate('/verify-password-reset-otp', { state: { email } });
      
      toast({
        title: "Reset code sent",
        description: "Check your email for a 6-digit verification code.",
      });
    } catch (error: any) {
      setAuthError(error.message || 'Failed to send reset code');
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You will be redirected to the homepage.",
      });

      setPasswordResetComplete(true);
      setIsPasswordRecovery(false);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setAuthError(error.message || 'Failed to update password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setAuthError('');
    setSuccessMessage('');

    try {
      if (authMode === 'forgot') {
        await handleForgotPassword();
        return;
      } else if (authMode === 'reset') {
        await handlePasswordReset();
        return;
      } else if (authMode === 'signup') {
        const result = await signUp(email, password);
        if (result.success) {
          navigate('/verify-otp', { 
            state: { 
              email: result.email || email, 
              password: result.password || password 
            } 
          });
        }
        return;
      } else {
        await signIn(email, password);

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      }
    } catch (error: any) {
      let errorMessage = error.message || 'Authentication failed';

      if (errorMessage.includes('Email not confirmed')) {
        errorMessage =
          'Please verify your email address before signing in. Check your inbox for a verification link.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage =
          'The email or password you entered is incorrect. Please try again.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage =
          'An account with this email already exists. Please sign in instead.';
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (errorMessage.includes('Password should be at least')) {
        errorMessage =
          'Password must be at least 8 characters long with uppercase, lowercase, and number.';
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
        <div className="fixed inset-0 h-[100dvh] bg-background flex flex-col overflow-y-auto">
          {/* Top brand bar */}
          <div className="relative bg-card pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 px-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleHomeNavigation}
                aria-label="Back to home"
                className="inline-flex items-center justify-center h-9 w-9 -ml-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <img
                src={smartkenyaLogo}
                alt="SmartKenya Logo"
                className="h-7 object-contain"
              />
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Trusted
              </span>
            </div>
          </div>

          {/* Hero copy */}
          <div className="bg-card px-5 pt-6 pb-5 border-b border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-[3px] w-6 bg-primary rounded-full" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                Online Shopping Kenya
              </span>
            </div>
            <h1 className="text-[34px] leading-[1.05] font-extrabold text-foreground tracking-tight font-serif">
              {authMode === 'signup' ? <>Create<br/>Account.</> :
                authMode === 'forgot' ? <>Reset<br/>Password.</> :
                authMode === 'reset' ? <>New<br/>Password.</> : <>Welcome<br/>Back.</>}
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
              {authMode === 'signup' ? 'Create your account to start shopping in seconds.' :
                authMode === 'forgot' ? 'Enter your email to receive a 6-digit reset code.' :
                authMode === 'reset' ? 'Choose a strong new password to secure your account.' :
                'Sign in to continue your shopping experience.'}
            </p>
          </div>

          {/* Form area */}
          <div className="flex-1 bg-muted/30 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            <div className="px-5 pt-5 animate-fade-in">
              {passwordResetComplete && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="text-xs text-primary font-medium">
                      Password updated! Redirecting...
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {successMessage && (
                  <div className="bg-primary/10 text-primary p-3 rounded-xl text-xs font-medium">
                    {successMessage}
                  </div>
                )}

                {(authError || resetLinkError) && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-1.5 flex-shrink-0" />
                      <div className="text-xs text-destructive font-medium leading-relaxed">{authError || resetLinkError}</div>
                    </div>
                  </div>
                )}

                {authMode !== 'reset' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={handleEmailChange}
                        onKeyDown={handleEmailKeyDown}
                        className={`pl-11 h-12 text-sm rounded-xl border bg-muted/30 focus:bg-background transition-all ${
                          errors.email ? 'border-destructive' : 'border-border'
                        }`}
                        autoComplete="email"
                        autoFocus={!(authMode as AuthMode === 'reset')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5">
                        <span className="w-1 h-1 bg-destructive rounded-full" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                )}

                {authMode === 'reset' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
                        New Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={handleNewPasswordChange}
                          ref={passwordRef}
                          onKeyDown={handlePasswordKeyDown}
                          className={`pl-11 pr-11 h-12 text-sm rounded-xl border bg-muted/30 focus:bg-background transition-all ${
                            errors.password ? 'border-destructive' : 'border-border'
                          }`}
                          autoComplete="new-password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5">
                          <span className="w-1 h-1 bg-destructive rounded-full" />
                          <span>{errors.password}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmNewPassword" className="text-xs font-semibold text-foreground">
                        Confirm New Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="confirmNewPassword"
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={handleConfirmNewPasswordChange}
                          ref={confirmPasswordRef}
                          onKeyDown={handleConfirmPasswordKeyDown}
                          className={`pl-11 pr-11 h-12 text-sm rounded-xl border bg-muted/30 focus:bg-background transition-all ${
                            errors.confirmPassword ? 'border-destructive' : 'border-border'
                          }`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5">
                          <span className="w-1 h-1 bg-destructive rounded-full" />
                          <span>{errors.confirmPassword}</span>
                        </p>
                      )}
                    </div>
                  </>
                )}

                {authMode !== 'forgot' && authMode !== 'reset' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                        Password
                      </Label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot')}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        ref={passwordRef}
                        onKeyDown={handlePasswordKeyDown}
                        className={`pl-11 pr-11 h-12 text-sm rounded-xl border bg-muted/30 focus:bg-background transition-all ${
                          errors.password ? 'border-destructive' : 'border-border'
                        }`}
                        autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5">
                        <span className="w-1 h-1 bg-destructive rounded-full" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        ref={confirmPasswordRef}
                        onKeyDown={handleConfirmPasswordKeyDown}
                        className={`pl-11 pr-11 h-12 text-sm rounded-xl border bg-muted/30 focus:bg-background transition-all ${
                          errors.confirmPassword ? 'border-destructive' : 'border-border'
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5">
                        <span className="w-1 h-1 bg-destructive rounded-full" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  ref={submitRef}
                  className="w-full h-12 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
                  disabled={isSubmitting || loading || passwordResetComplete}
                >
                  {isSubmitting || loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      <span>
                        {authMode === 'signup' ? 'Creating...' :
                          authMode === 'forgot' ? 'Sending...' :
                          authMode === 'reset' ? 'Updating...' : 'Signing In...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>
                        {authMode === 'signup' ? 'Create Account' :
                          authMode === 'forgot' ? 'Send Reset Code' :
                          authMode === 'reset' ? 'Update Password' : 'Sign In'}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>

                {authMode === 'forgot' && !resetEmailSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setResetLinkError('');
                    }}
                    className="w-full text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span>Back to Sign In</span>
                  </button>
                )}

                {resetEmailSent && (
                  <div className="space-y-3 pt-1">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-xs text-primary font-semibold">Check Your Email</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        We've sent a verification code to your email
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
                      className="w-full text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                )}
              </form>

              {authMode !== 'forgot' && authMode !== 'reset' && (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-card text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <GoogleSignInButton />

                  <div className="text-center mt-5 pt-4 border-t border-border/60">
                    <p className="text-xs text-muted-foreground">
                      {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                        className="font-bold text-primary hover:underline"
                      >
                        {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Trust footer */}
            <div className="mt-6 px-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="bg-card/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-border/50 max-w-md w-full">
            <div className="mb-6 flex items-center justify-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 p-1.5 h-8 w-8 rounded-full hover:bg-muted transition-colors"
                onClick={handleHomeNavigation}
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <div className="flex items-center">
                <img
                  src={smartkenyaLogo}
                  alt="SmartKenya Logo"
                  className="h-11 w-52 object-contain"
                />
              </div>
            </div>

            {passwordResetComplete && (
              <div className="mb-5 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                  <div className="text-xs text-primary font-medium">
                    Password successfully updated! Redirecting to homepage...
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-foreground mb-1.5">
                {authMode === 'signup' ? 'Create Account' : 
                  authMode === 'forgot' ? 'Reset Password' : 
                  authMode === 'reset' ? 'Set New Password' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {authMode === 'signup' ? 'Join thousands of satisfied customers' : 
                  authMode === 'forgot' ? 'Enter your email to receive a reset code' : 
                  authMode === 'reset' ? 'Please enter your new password below' : 'Sign in to continue to your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(authError || resetLinkError) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                    <div className="text-xs text-destructive font-medium">{authError || resetLinkError}</div>
                  </div>
                </div>
              )}

              {authMode !== 'reset' && (
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={handleEmailChange}
                      onKeyDown={handleEmailKeyDown}
                      className={`pl-10 h-10 text-sm rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.email ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                      }`}
                      autoComplete="email"
                      autoFocus={!(authMode as AuthMode === 'reset')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                      <span className="w-1 h-1 bg-destructive rounded-full"></span>
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              )}

              {authMode === 'signin' && !resetEmailSent && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-xs text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {authMode === 'reset' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs font-medium text-foreground">
                      New Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        ref={passwordRef}
                        onKeyDown={handlePasswordKeyDown}
                        className={`pl-10 pr-11 h-10 text-sm rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                          errors.password ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                        }`}
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="w-1 h-1 bg-destructive rounded-full"></span>
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmNewPassword" className="text-xs font-medium text-foreground">
                      Confirm New Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={confirmNewPassword}
                        onChange={handleConfirmNewPasswordChange}
                        ref={confirmPasswordRef}
                        onKeyDown={handleConfirmPasswordKeyDown}
                        className={`pl-10 pr-11 h-10 text-sm rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                          errors.confirmPassword ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      >
                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <span className="w-1 h-1 bg-destructive rounded-full"></span>
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                </>
              )}

              {authMode !== 'forgot' && authMode !== 'reset' && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handlePasswordChange}
                      ref={passwordRef}
                      onKeyDown={handlePasswordKeyDown}
                      className={`pl-10 pr-11 h-10 text-sm rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.password ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                      }`}
                      autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                      <span className="w-1 h-1 bg-destructive rounded-full"></span>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>
              )}

              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      ref={confirmPasswordRef}
                      onKeyDown={handleConfirmPasswordKeyDown}
                      className={`pl-10 pr-11 h-10 text-sm rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.confirmPassword ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                      <span className="w-1 h-1 bg-destructive rounded-full"></span>
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              )}

              {authMode === 'signin' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="h-4 w-4 rounded"
                    />
                    <Label htmlFor="remember" className="text-xs text-muted-foreground font-medium">
                      Remember me for 30 days
                    </Label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                ref={submitRef}
                className="w-full h-10 rounded-xl font-semibold text-sm"
                disabled={isSubmitting || loading || passwordResetComplete}
              >
                {isSubmitting || loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                    <span className="text-sm">
                      {authMode === 'signup' ? 'Creating Account...' : 
                        authMode === 'forgot' ? 'Sending Reset Code...' : 
                        authMode === 'reset' ? 'Updating Password...' : 'Signing In...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm">
                      {authMode === 'signup' ? 'Create Account' : 
                        authMode === 'forgot' ? 'Send Reset Code' : 
                        authMode === 'reset' ? 'Update Password' : 'Sign In'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {authMode !== 'forgot' && authMode !== 'reset' && !resetEmailSent && (
                <div className="text-center pt-4">
                  <p className="text-muted-foreground text-sm">
                    {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                      className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {authMode === 'signup' ? 'Sign In' : 'Sign Up Free'}
                    </button>
                  </p>
                </div>
              )}

              {authMode === 'forgot' && !resetEmailSent && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setResetLinkError('');
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-medium hover:underline transition-colors flex items-center justify-center gap-0.5 mx-auto"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )}

              {resetEmailSent && (
                <div className="text-center pt-2 space-y-2">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary font-semibold">Check Your Email</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We've sent a verification code to your email address
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
                    className="text-xs text-primary hover:text-primary/80 font-medium hover:underline transition-colors flex items-center justify-center gap-0.5 mx-auto"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )}
            </form>

            {authMode !== 'forgot' && authMode !== 'reset' && (
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground font-medium">Or continue with</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <GoogleSignInButton />
                </div>
              </div>
            )}

            <div className="mt-10 text-center">
              <p className="text-xs text-muted-foreground">
                © 2025 SmartKenya. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthPage;

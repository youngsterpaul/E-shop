import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { EnhancedAuthError } from '@/components/auth/EnhancedAuthError';
import { MobileHeader } from '@/components/ui/mobile-header';

const SignInPage = () => {
  const navigate = useNavigate();
  const { signIn, loading, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string>('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setAuthError('');
    
    try {
      await signIn(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      // Navigation will be handled by the auth context redirect
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = error.message || 'Sign in failed';
      
      // Map common Supabase error messages to user-friendly ones
      if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox for a verification link.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = 'Too many sign-in attempts. Please wait a few minutes before trying again.';
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

  const handleRetry = () => {
    setAuthError('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center /py-12 sm:px-6 lg:px-8">

    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-8 w-8"
          onClick={navigate('/')};
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
    </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
        {/* SmartKenya Logo/Brand */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900">SmartKenya</h1>
        </div>

        {/* Sign In Card */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Welcome back! Please enter your details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enhanced Error Display */}
            {authError && (
              <EnhancedAuthError 
                error={authError} 
                type="login" 
                onRetry={handleRetry}
                className="mb-4"
              />
            )}

            {/* Email Field */}
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
                  className={`pl-10 h-12 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
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
                  className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`}
                  autoComplete="current-password"
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

            {/* Remember Me & Forgot Password */}
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
              <Link
                to="/auth/forgot-password"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <GoogleSignInButton />

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/auth/signup"
                  className="font-medium text-orange-600 hover:text-orange-700"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </form>
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

export default SignInPage;

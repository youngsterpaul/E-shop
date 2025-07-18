
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { EnhancedAuthError } from '@/components/auth/EnhancedAuthError';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [authError, setAuthError] = useState<string>('');
  const { toast } = useToast();
  
  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setIsSubmitted(true);
      
      toast({
        title: "Reset link sent!",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = error.message || 'Failed to send reset link';
      
      // Map common errors to user-friendly messages
      if (errorMessage.includes('User not found')) {
        errorMessage = 'If an account with this email exists, you will receive a password reset link shortly.';
      } else if (errorMessage.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many password reset requests. Please wait a few minutes before trying again.';
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAuthError('');
    setErrors({});
  };
  
  const SuccessContent = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-600">
          We've sent a password reset link to:
        </p>
        <p className="font-semibold text-gray-900">{email}</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Next steps:</p>
        <ul className="space-y-1 text-left">
          <li>• Check your email inbox for the reset link</li>
          <li>• Click the link to reset your password</li>
          <li>• If you don't see it, check your spam folder</li>
          <li>• The link will expire in 1 hour for security</li>
        </ul>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={() => {
            setIsSubmitted(false);
            setEmail('');
          }}
          variant="outline"
          className="w-full h-12 rounded-lg font-medium"
        >
          Send another link
        </Button>
        
        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 rounded-lg font-medium transition-colors">
          <Link to="/auth/signin">
            Return to sign in
          </Link>
        </Button>
      </div>
    </div>
  );

  const ForgotPasswordForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enhanced Error Display */}
      {authError && (
        <EnhancedAuthError 
          error={authError} 
          type="reset" 
          onRetry={handleRetry}
          className="mb-4"
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={handleEmailChange}
            className={`pl-10 h-12 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
            autoComplete="email"
            autoFocus
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
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
            Sending reset link...
          </div>
        ) : (
          'Send reset link'
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* SmartKenya Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SmartKenya</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your smart shopping destination
          </p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              {isSubmitted ? 'Reset Link Sent' : 'Forgot your password?'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              {isSubmitted 
                ? 'Check your email for reset instructions' 
                : 'Enter your email address and we\'ll send you a reset link'
              }
            </p>
          </div>

          {isSubmitted ? <SuccessContent /> : <ForgotPasswordForm />}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 SmartKenya. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
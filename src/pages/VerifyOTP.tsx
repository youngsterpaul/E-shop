import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';

const STORAGE_KEY = 'otp_timer_signup_';
const RATE_LIMIT_KEY = 'otp_requests_signup_';
const MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = isMobileUserAgent();
  
  const email = location.state?.email || '';
  const password = location.state?.password || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check rate limiting
  const checkRateLimit = (email: string): boolean => {
    const key = RATE_LIMIT_KEY + email;
    const stored = localStorage.getItem(key);
    
    if (!stored) return true;
    
    const requests = JSON.parse(stored);
    const now = Date.now();
    
    // Filter out old requests
    const recentRequests = requests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      const oldestRequest = Math.min(...recentRequests);
      const timeUntilReset = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 60000);
      toast({
        title: "Too many requests",
        description: `Please wait ${timeUntilReset} minutes before requesting another code`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Add request to rate limit tracking
  const addRateLimitRequest = (email: string) => {
    const key = RATE_LIMIT_KEY + email;
    const stored = localStorage.getItem(key);
    const requests = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    
    // Keep only recent requests
    const recentRequests = requests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
    recentRequests.push(now);
    
    localStorage.setItem(key, JSON.stringify(recentRequests));
  };

  useEffect(() => {
    if (!email || !password) {
      navigate('/auth?mode=signup');
      return;
    }

    // Focus first input
    inputRefs.current[0]?.focus();

    // Check for persisted timer
    const storageKey = STORAGE_KEY + email;
    const stored = localStorage.getItem(storageKey);
    
    let initialTime = 60;
    if (stored) {
      const { expiry } = JSON.parse(stored);
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      initialTime = remaining;
      if (remaining === 0) {
        setCanResend(true);
      }
    }
    
    setTimeLeft(initialTime);

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        
        // Update localStorage
        if (newTime > 0) {
          const expiry = Date.now() + (newTime * 1000);
          localStorage.setItem(storageKey, JSON.stringify({ expiry, email }));
        } else {
          localStorage.removeItem(storageKey);
          setCanResend(true);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, password, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    // Clear any previous messages
    setErrorMessage('');
    setSuccessMessage('');

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      setTimeout(() => {
        const otpCode = newOtp.join('');
        handleVerify(otpCode);
      }, 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp.slice(0, 6));
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    
    if (otpCode.length !== 6) {
      const msg = "Please enter the complete 6-digit code";
      setErrorMessage(msg);
      toast({
        title: "Invalid OTP",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Verify the OTP token - this will automatically sign in the user
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'signup'
      });

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        throw verifyError;
      }

      // OTP verified successfully - user is now signed in
      const msg = "Account verified! Redirecting...";
      setSuccessMessage(msg);
      toast({
        title: "Account verified!",
        description: "Your account has been successfully created",
      });

      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      console.error('Verification error:', error);
      
      const errorMsg = "OTP is Invalid";
      setErrorMessage(errorMsg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      toast({
        title: "Verification failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    // Check rate limit
    if (!checkRateLimit(email)) {
      return;
    }

    setIsResending(true);
    try {
      // Resend OTP by re-triggering signup
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      // Track request
      addRateLimitRequest(email);

      toast({
        title: "OTP resent",
        description: "A new verification code has been sent to your email",
      });

      setOtp(['', '', '', '', '', '']);
      setTimeLeft(60);
      setCanResend(false);
      
      // Update localStorage
      const storageKey = STORAGE_KEY + email;
      const expiry = Date.now() + (60 * 1000);
      localStorage.setItem(storageKey, JSON.stringify({ expiry, email }));
      
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: "Failed to resend",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const content = (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-xl font-bold transition-colors ${
                    errorMessage ? 'border-destructive' : ''
                  } ${successMessage ? 'border-green-500' : ''}`}
                  disabled={isVerifying}
                />
              ))}
            </div>
            
            {/* Error/Success Messages */}
            {errorMessage && (
              <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium">{successMessage}</p>
              </div>
            )}
            
            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {timeLeft > 0 ? (
                  <>Code expires in <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span></>
                ) : (
                  <span className="text-destructive font-semibold">Code expired</span>
                )}
              </p>
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            disabled={otp.some(digit => !digit) || isVerifying}
            className="w-full h-11 mb-4"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>

          {/* Resend */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? "Sending..." : "Resend Code"}
            </Button>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth?mode=signup')}
              className="text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign Up
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Didn't receive the code? Check your spam folder or try resending
          </p>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileHeader title="Verify Email" onBack={() => navigate('/auth?mode=signup')} />
        <div className="pt-16">
          {content}
        </div>
      </>
    );
  }

  return content;
};

export default VerifyOTP;

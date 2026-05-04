import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Shield, ArrowLeft, RefreshCw, ChevronLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import OptimizedImage from '@/components/OptimizedImage';

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
      toast({
        title: 'Too many requests',
        description: `Please wait ${timeUntilReset} minutes before requesting another code`,
        variant: 'destructive',
      });
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

  useEffect(() => {
    if (!email || !password) {
      navigate('/auth?mode=signup');
      return;
    }

    inputRefs.current[0]?.focus();

    const storageKey = STORAGE_KEY + email;
    const stored = localStorage.getItem(storageKey);
    let initialTime = 60;
    if (stored) {
      const { expiry } = JSON.parse(stored);
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      initialTime = remaining;
      if (remaining === 0) setCanResend(true);
    }
    setTimeLeft(initialTime);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime > 0) {
          const expiry = Date.now() + newTime * 1000;
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
    if (value && !/^\d$/.test(value)) return;
    setErrorMessage('');
    setSuccessMessage('');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5 && newOtp.every((digit) => digit !== '')) {
      setTimeout(() => handleVerify(newOtp.join('')), 300);
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
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      const msg = 'Please enter the complete 6-digit code';
      setErrorMessage(msg);
      toast({ title: 'Invalid OTP', description: msg, variant: 'destructive' });
      return;
    }
    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (verifyError) throw verifyError;
      const msg = 'Account verified! Redirecting...';
      setSuccessMessage(msg);
      toast({ title: 'Account verified!', description: 'Your account has been successfully created' });
      setTimeout(() => navigate('/'), 1000);
    } catch (error: any) {
      const errorMsg = 'OTP is Invalid';
      setErrorMessage(errorMsg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast({ title: 'Verification failed', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!checkRateLimit(email)) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      addRateLimitRequest(email);
      toast({ title: 'OTP resent', description: 'A new verification code has been sent to your email' });
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(60);
      setCanResend(false);
      const storageKey = STORAGE_KEY + email;
      const expiry = Date.now() + 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ expiry, email }));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast({ title: 'Failed to resend', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  };

  /* ─── OTP input cluster (shared) ─── */
  const otpCluster = (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
          className={`
            w-12 h-14 text-center text-xl font-bold transition-all duration-200
            border-2 rounded-xl focus:ring-4 focus:ring-primary/20
            ${errorMessage
              ? 'border-destructive focus:border-destructive'
              : 'border-border focus:border-primary'}
            ${successMessage ? 'border-primary bg-primary/5' : ''}
          `}
          disabled={isVerifying}
        />
      ))}
    </div>
  );

  /* ════════════════════════════════════════
     MOBILE — matches AuthPage mobile layout
  ════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="fixed inset-0 h-[100dvh] bg-background flex flex-col overflow-y-auto">

        {/* Hero — mirrors AuthPage mobile hero */}
        <div className="bg-card px-5 pt-20 items-center text-center justify-center">
          <div className="flex items-center text-center justify-center">
            <OptimizedImage
              src={smartkenyaLogo}
              alt="SmartKenya Logo"
              className="h-12 object-contain"
            />
          </div>
          <h1 className="pt-4 text-[18px] leading-[1.05] font-extrabold text-foreground tracking-tight">
            Verify Your Email.
          </h1>
        </div>

        {/* Form area — mirrors AuthPage mobile form area */}
        <div className="flex-1 bg-card pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <div className="px-5 pt-5 animate-fade-in space-y-4">

            {/* Email hint */}
            <p className="text-xs text-muted-foreground text-center">
              We've sent a 6-digit code to{' '}
              <span className="font-semibold text-foreground">{email}</span>
            </p>

            {/* Error */}
            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-1.5 flex-shrink-0" />
                  <div className="text-xs text-destructive font-medium leading-relaxed">
                    {errorMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <div className="text-xs text-primary font-medium">{successMessage}</div>
                </div>
              </div>
            )}

            {/* OTP inputs */}
            {otpCluster}

            {/* Timer */}
            <p className="text-xs text-muted-foreground text-center">
              {timeLeft > 0 ? (
                <>
                  Code expires in{' '}
                  <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span>
                </>
              ) : (
                <span className="text-destructive font-semibold">Code expired</span>
              )}
            </p>

            {/* Verify button — matches AuthPage submit button */}
            <Button
              onClick={() => handleVerify()}
              disabled={otp.some((d) => !d) || isVerifying}
              className="w-full h-12 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Verify & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            {/* Resend — matches AuthPage secondary link style */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isResending}
                className={`text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-colors
                  ${canResend && !isResending
                    ? 'text-primary hover:underline'
                    : 'text-muted-foreground cursor-not-allowed'}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            {/* Back link — matches AuthPage back-to-sign-in style */}
            <button
              type="button"
              onClick={() => navigate('/auth?mode=signup')}
              className="w-full text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Back to Sign Up</span>
            </button>

            {/* Footer hint */}
            <p className="text-xs text-muted-foreground text-center pb-2">
              Didn't receive the code? Check your spam folder or try resending.
            </p>

          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     DESKTOP — original layout kept intact
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
            <p className="text-sm text-muted-foreground">We've sent a 6-digit code to</p>
            <p className="text-sm font-semibold text-foreground mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="mb-4">{otpCluster}</div>

            {errorMessage && (
              <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <p className="text-sm text-primary text-center font-medium">{successMessage}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {timeLeft > 0 ? (
                  <>
                    Code expires in{' '}
                    <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span>
                  </>
                ) : (
                  <span className="text-destructive font-semibold">Code expired</span>
                )}
              </p>
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            disabled={otp.some((digit) => !digit) || isVerifying}
            className="w-full h-12 mb-4 rounded-xl font-semibold"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Continue'
            )}
          </Button>

          {/* Resend */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-sm hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Sending...' : 'Resend Code'}
            </Button>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth?mode=signup')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign Up
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Didn't receive the code? Check your spam folder or try resending
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
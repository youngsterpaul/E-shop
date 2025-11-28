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
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email || !password) {
      navigate('/auth?mode=signup');
      return;
    }

    // Focus first input
    inputRefs.current[0]?.focus();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
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

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

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
      toast({
        title: "Account verified!",
        description: "Your account has been successfully created",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Verification error:', error);
      
      let errorMessage = error.message || "Please try again";
      
      if (error.message?.includes('expired') || error.message?.includes('token_expired')) {
        errorMessage = "OTP has expired. Please request a new code.";
        setCanResend(true);
      } else if (error.message?.includes('invalid') || error.message?.includes('token_hash')) {
        errorMessage = "Invalid OTP code. Please check and try again.";
      }

      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
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

      toast({
        title: "OTP resent",
        description: "A new verification code has been sent to your email",
      });

      setOtp(['', '', '', '', '', '']);
      setTimeLeft(600);
      setCanResend(false);
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
                  className="w-12 h-14 text-center text-xl font-bold"
                  disabled={isVerifying}
                />
              ))}
            </div>
            
            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {timeLeft > 0 ? (
                  <>Code expires in <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span></>
                ) : (
                  <span className="text-destructive">Code expired</span>
                )}
              </p>
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={otp.some(digit => !digit) || isVerifying}
            className="w-full h-11 mb-4"
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
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

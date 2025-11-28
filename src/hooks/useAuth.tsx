import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; email?: string; password?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  lastActivity: number;
  refreshSession: () => Promise<void>;
  validatePassword: (password: string) => string[]; // Add to interface
}

interface FailedAttempt {
  email: string;
  timestamp: number;
  attempts: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Security constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { toast } = useToast();

  // Security: Track failed login attempts
  const getFailedAttempts = (email: string): FailedAttempt | null => {
    const stored = localStorage.getItem(`failed_attempts_${email}`);
    if (!stored) return null;
    
    const attempt = JSON.parse(stored) as FailedAttempt;
    // Clear old attempts
    if (Date.now() - attempt.timestamp > LOCKOUT_DURATION) {
      localStorage.removeItem(`failed_attempts_${email}`);
      return null;
    }
    return attempt;
  };

  const recordFailedAttempt = (email: string) => {
    const existing = getFailedAttempts(email);
    const newAttempt: FailedAttempt = {
      email,
      timestamp: Date.now(),
      attempts: existing ? existing.attempts + 1 : 1
    };
    localStorage.setItem(`failed_attempts_${email}`, JSON.stringify(newAttempt));
  };

  const clearFailedAttempts = (email: string) => {
    localStorage.removeItem(`failed_attempts_${email}`);
  };

  const isAccountLocked = (email: string): boolean => {
    const attempts = getFailedAttempts(email);
    return attempts ? attempts.attempts >= MAX_FAILED_ATTEMPTS : false;
  };

  // Security: Input sanitization
  const sanitizeInput = (input: string): string => {
    return input.trim().toLowerCase().replace(/[<>\"']/g, '');
  };

  // Security: Password strength validation
  const validatePasswordStrength = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    
    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password cannot contain common words');
    }
    
    return errors;
  };

  // Export for reuse in password reset
  const validatePassword = validatePasswordStrength;

  // Security: Session activity tracking
  const updateActivity = () => {
    setLastActivity(Date.now());
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  // Security: Check session validity
  const checkSessionValidity = async () => {
    if (!session || !user) return true;
    
    const lastActivityTime = parseInt(localStorage.getItem('lastActivity') || '0');
    const timeSinceActivity = Date.now() - lastActivityTime;
    
    if (timeSinceActivity > SESSION_TIMEOUT) {
      toast({
        title: "Session expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      await signOut();
      return false;
    }
    
    return true;
  };

  // Security: Refresh session periodically
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        ////console.error('Session refresh error:', error);
        if (error.message.includes('refresh_token_not_found') || error.message.includes('invalid_refresh_token')) {
          await signOut();
        }
      }
    } catch (error) {
      ////console.error('Session refresh failed:', error);
    }
  };

  const cleanupAuthState = () => {
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('supabase.auth.') || key.includes('sb-')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (typeof sessionStorage !== 'undefined') {
      const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
        key.startsWith('supabase.auth.') || key.includes('sb-')
      );
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  };

  useEffect(() => {
    // Activity tracking
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Periodic session check
    const sessionCheckInterval = setInterval(checkSessionValidity, ACTIVITY_CHECK_INTERVAL);
    
    // Session refresh interval
    const refreshInterval = setInterval(refreshSession, 30 * 60 * 1000); // 30 minutes

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(sessionCheckInterval);
      clearInterval(refreshInterval);
    };
  }, [session, user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        //console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          updateActivity();
        }
        
        if (session?.user?.id) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      //console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        fetchProfile(session.user.id);
        updateActivity();
      }
      setLoading(false);
    }).catch((error) => {
      //console.error('Error getting initial session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        //console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      //console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    let auditSuccess = false;
    let failureReason = '';
    let userId: string | null = null;

    try {
      setLoading(true);
      
      // Security: Sanitize input
      const sanitizedEmail = sanitizeInput(email);
      
      // Security: Check if account is locked
      if (isAccountLocked(sanitizedEmail)) {
        const attempts = getFailedAttempts(sanitizedEmail);
        const timeRemaining = Math.ceil((LOCKOUT_DURATION - (Date.now() - attempts!.timestamp)) / 60000);
        failureReason = `Account locked. ${timeRemaining} minutes remaining.`;
        throw new Error(failureReason);
      }
      
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        //console.warn('Failed to sign out existing session:', err);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      if (error) {
        //console.error('Sign in error:', error);
        recordFailedAttempt(sanitizedEmail);
        failureReason = error.message;
        
        // Create security alert for failed login
        const remainingAttempts = MAX_FAILED_ATTEMPTS - (getFailedAttempts(sanitizedEmail)?.attempts || 0);
        if (remainingAttempts <= 2) {
          await supabase.from('security_alerts').insert({
            alert_type: 'failed_login',
            severity: remainingAttempts === 0 ? 'high' : 'medium',
            identifier: sanitizedEmail,
            details: {
              attempts: getFailedAttempts(sanitizedEmail)?.attempts || 0,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        throw error;
      }
      
      if (data.user) {
        clearFailedAttempts(sanitizedEmail);
        updateActivity();
        auditSuccess = true;
        userId = data.user.id;
        
        // Security: Log successful login
        //console.log(`User ${sanitizedEmail} logged in successfully at ${new Date().toISOString()}`);
        
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
      }
    } catch (error: any) {
      //console.error('Login error:', error);
      throw error;
    } finally {
      // Log all login attempts to audit table
      try {
        await supabase.from('login_audit').insert({
          email: email,
          success: auditSuccess,
          user_id: userId,
          user_agent: navigator.userAgent,
          device_info: {
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
          },
          failure_reason: auditSuccess ? null : failureReason,
        });
      } catch (auditError) {
        console.error('Failed to log audit:', auditError);
      }
      
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Security: Sanitize input
      const sanitizedEmail = sanitizeInput(email);
      
      // Security: Validate password strength
      const passwordErrors = validatePasswordStrength(password);
      if (passwordErrors.length > 0) {
        throw new Error(passwordErrors[0]);
      }
      
      // Check if user already exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: 'dummy-check-password'
      });
      
      // If we get any response (even error), check if it's "Invalid login credentials"
      // which could mean either wrong password OR user doesn't exist
      // Better approach: try to sign up and handle the error
      
      cleanupAuthState();
      
      // Use Supabase native OTP - create user and send OTP
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        
        // Handle user already exists
        if (signUpError.message.includes('User already registered') || 
            signUpError.message.includes('already been registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        
        throw signUpError;
      }

      // If signup successful but email confirmation is disabled, user is created immediately
      // If email confirmation is enabled, user needs to verify OTP
      if (data.user && !data.session) {
        toast({
          title: "Verification code sent",
          description: "Please check your email for the 6-digit verification code",
        });
        
        return { success: true, email: sanitizedEmail, password };
      } else if (data.session) {
        // User created and signed in immediately (confirmations disabled)
        toast({
          title: "Account created!",
          description: "You've been successfully registered and logged in.",
        });
        return { success: false }; // Don't redirect to OTP page
      }

      return { success: true, email: sanitizedEmail, password };
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Security: Clear all auth-related data
      cleanupAuthState();
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('rememberMe');
      
      // Clear failed attempt records for current user
      if (user?.email) {
        clearFailedAttempts(user.email);
      }
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        //console.error('Sign out error:', error);
        throw error;
      }
      
      // Security: Log successful logout
      //console.log(`User logged out successfully at ${new Date().toISOString()}`);
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      
      // Force page refresh to clear any cached data
      window.location.href = '/';
    } catch (error: any) {
      //console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Security: Sanitize profile data
      const sanitizedData = Object.keys(data).reduce((acc, key) => {
        if (typeof data[key] === 'string') {
          acc[key] = data[key].trim().replace(/[<>\"']/g, '');
        } else {
          acc[key] = data[key];
        }
        return acc;
      }, {} as any);
      
      const { error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await fetchProfile(user.id);
      updateActivity();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      //console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    lastActivity,
    refreshSession,
    validatePassword: validatePasswordStrength,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
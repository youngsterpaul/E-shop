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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Security constants
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// NOTE: Login attempt rate limiting is enforced server-side by Supabase Auth.
// Do NOT store lockout state in localStorage — it can be trivially cleared by
// attackers and provides a false sense of security. For stronger protection,
// enable Captcha (hCaptcha/Turnstile) in the Supabase dashboard under
// Authentication → Settings.

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { toast } = useToast();

  // Cleanup any legacy localStorage lockout entries from prior versions.
  // These were a security anti-pattern (client-controlled), so we purge them.
  const purgeLegacyFailedAttempts = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('failed_attempts_'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore
    }
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

      // Purge any legacy client-side lockout markers (no longer used).
      purgeLegacyFailedAttempts();

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
        failureReason = error.message;

        // Log a security alert server-side for visibility/auditing.
        // Server-side aggregation in security_alerts is the source of truth;
        // Supabase Auth handles actual rate limiting.
        try {
          await supabase.from('security_alerts').insert({
            alert_type: 'failed_login',
            severity: 'medium',
            identifier: sanitizedEmail,
            details: {
              reason: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {
          // best-effort; do not block the login flow on logging failures
        }

        throw error;
      }

      if (data.user) {
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
      // Log all login attempts via secure server-side edge function.
      // Direct client inserts to login_audit are no longer permitted by RLS,
      // preventing log pollution by anonymous users.
      try {
        await supabase.functions.invoke('log-login-attempt', {
          body: {
            email: email,
            success: auditSuccess,
            user_agent: navigator.userAgent,
            device_info: {
              platform: navigator.platform,
              language: navigator.language,
              screen: `${screen.width}x${screen.height}`,
            },
            failure_reason: auditSuccess ? null : failureReason,
          },
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
      purgeLegacyFailedAttempts();

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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const GoogleSignInButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Handle deep link for native OAuth callback
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const setupListener = async () => {
      listenerHandle = await CapacitorApp.addListener('appUrlOpen', async (event) => {
        const url = event.url;
        
        // Check if this is an OAuth callback
        if (url.includes('auth/callback') || url.includes('access_token') || url.includes('code=')) {
          try {
            // Close the browser
            await Browser.close();
            
            // Extract tokens from URL
            const urlObj = new URL(url);
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              // Set the session manually
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) throw error;
              
              toast({
                title: "Success",
                description: "Signed in with Google successfully!",
              });
              
              navigate('/');
            } else {
              // Try to get session from URL query params (authorization code flow)
              const code = urlObj.searchParams.get('code');
              if (code) {
                // Exchange code for session - Supabase handles this automatically
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) throw error;
                
                toast({
                  title: "Success",
                  description: "Signed in with Google successfully!",
                });
                
                navigate('/');
              }
            }
          } catch (error: any) {
            console.error('OAuth callback error:', error);
            toast({
              title: "Sign in failed",
              description: "Failed to complete Google sign in. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        }
      });
    };

    setupListener();
    
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, toast]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Native app: Use in-app browser for OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'com.smartkenya.app://auth/callback',
            skipBrowserRedirect: true, // Don't let Supabase handle the redirect
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Open OAuth URL in Chrome Custom Tab (in-app overlay)
          await Browser.open({
            url: data.url,
            presentationStyle: 'popover',
            toolbarColor: '#16a34a',
            windowName: '_blank',
          });
        }
      } else {
        // Web: Standard OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;
        // OAuth redirect will handle the rest for web
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Google sign in error:', error);
      }
      toast({
        title: "Sign in failed",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full py-3 border-gray-300 hover:bg-gray-50 transition-colors"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          Signing in...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </div>
      )}
    </Button>
  );
};

export default GoogleSignInButton;

<<<<<<< HEAD
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isChunkError: boolean;
  hasAttemptedReload: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      isChunkError: false,
      hasAttemptedReload: false 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a chunk loading error
    const isChunkError = 
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed');

    return {
      hasError: true,
      error,
      isChunkError,
      hasAttemptedReload: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Check if we haven't attempted a reload yet for chunk errors
    const hasReloadedKey = 'chunk_error_reloaded';
    const hasReloaded = sessionStorage.getItem(hasReloadedKey);

    if (this.state.isChunkError && !hasReloaded) {
      console.log('[ErrorBoundary] Chunk load error detected, attempting automatic reload...');
      
      // Mark that we've attempted a reload
      sessionStorage.setItem(hasReloadedKey, 'true');
      this.setState({ hasAttemptedReload: true });
      
      // Clear caches and reload after a brief moment
      setTimeout(async () => {
        try {
          // Clear service worker caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          
          // Clear version marker to force fresh check
          localStorage.removeItem('app_version');
          
          // Hard reload
          window.location.reload();
        } catch (e) {
          console.error('[ErrorBoundary] Failed to clear caches:', e);
          window.location.reload();
        }
      }, 100);
      
      return; // Don't show error UI yet
    }

    // Clear the reload flag if we're showing the error UI
    if (this.state.isChunkError && hasReloaded) {
      sessionStorage.removeItem(hasReloadedKey);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global Error Boundary caught an error:', error, errorInfo);
      // You can add error reporting here (e.g., Sentry, LogRocket, etc.)
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Don't show error UI if we're attempting automatic reload for chunk errors
      if (this.state.isChunkError && this.state.hasAttemptedReload) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-center text-muted-foreground">
                  Loading updated version...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {this.state.isChunkError ? 'Update Required' : 'Oops! Something went wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                {this.state.isChunkError 
                  ? "A new version of the app is available. Please reload the page to get the latest updates."
                  : "We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists."
                }
              </p>
              {/*
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-lg text-xs">
                  <summary className="cursor-pointer font-semibold">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )} */}


              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
=======
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global Error Boundary caught an error:', error, errorInfo);
      // You can add error reporting here (e.g., Sentry, LogRocket, etc.)
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </p>
              {/*
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-lg text-xs">
                  <summary className="cursor-pointer font-semibold">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )} */}


              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
}
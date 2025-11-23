import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logError } from '@/lib/sentry';

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
    // Check if it's a chunk loading / runtime update error
    const isChunkError = 
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      // Handle React runtime hook errors caused by mixed bundle versions
      error.message?.includes("Cannot read properties of null (reading 'useState')") ||
      error.message?.includes("Cannot read property 'useState' of null");

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

    // Report to Sentry with component stack
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      isChunkError: this.state.isChunkError,
      timestamp: new Date().toISOString(),
    });

    // Enhanced reload logic with retry limit
    const hasReloadedKey = 'chunk_error_reloaded';
    const reloadCountKey = 'chunk_error_reload_count';
    const reloadTimestampKey = 'chunk_error_reload_timestamp';
    
    const hasReloaded = sessionStorage.getItem(hasReloadedKey);
    const reloadCount = parseInt(sessionStorage.getItem(reloadCountKey) || '0');
    const lastReloadTime = parseInt(sessionStorage.getItem(reloadTimestampKey) || '0');
    const now = Date.now();
    
    // Reset count if last reload was more than 5 minutes ago
    if (now - lastReloadTime > 5 * 60 * 1000) {
      sessionStorage.setItem(reloadCountKey, '0');
    }
    
    // Only auto-reload for chunk errors if we haven't exceeded retry limit
    if (this.state.isChunkError && !hasReloaded && reloadCount < 3) {
      console.log(`[ErrorBoundary] Chunk/React error detected (attempt ${reloadCount + 1}/3), clearing caches and reloading...`);
      
      // Increment reload count and mark that we've attempted a reload
      sessionStorage.setItem(hasReloadedKey, 'true');
      sessionStorage.setItem(reloadCountKey, (reloadCount + 1).toString());
      sessionStorage.setItem(reloadTimestampKey, now.toString());
      this.setState({ hasAttemptedReload: true });
      
      // Aggressive cache clearing
      setTimeout(async () => {
        try {
          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('[ErrorBoundary] Cleared', cacheNames.length, 'caches');
          }
          
          // Clear all local/session storage except reload tracking
          const reloadData = {
            hasReloaded: sessionStorage.getItem(hasReloadedKey),
            reloadCount: sessionStorage.getItem(reloadCountKey),
            reloadTimestamp: sessionStorage.getItem(reloadTimestampKey)
          };
          
          localStorage.clear();
          sessionStorage.clear();
          
          // Restore reload tracking
          Object.entries(reloadData).forEach(([key, value]) => {
            if (value) sessionStorage.setItem(key.replace(/([A-Z])/g, '_$1').toLowerCase(), value);
          });
          
          console.log('[ErrorBoundary] Cleared storage, performing hard reload...');
          
          // Hard reload without cache
          window.location.reload();
        } catch (e) {
          console.error('[ErrorBoundary] Failed to clear caches:', e);
          window.location.reload();
        }
      }, 100);
      
      return; // Don't show error UI yet
    }

    // Clear the reload flags if we're showing the error UI or exceeded retries
    if (this.state.isChunkError) {
      sessionStorage.removeItem(hasReloadedKey);
      if (reloadCount >= 3) {
        console.error('[ErrorBoundary] Max reload attempts reached, showing error UI');
        sessionStorage.removeItem(reloadCountKey);
        sessionStorage.removeItem(reloadTimestampKey);
      }
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
                  ? "A new version of the app is available, or there was a loading error. We'll try to fix this automatically."
                  : "We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists."
                }
              </p>
              
              {this.state.isChunkError && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
                  <p className="font-semibold">If the issue persists:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Try reloading the page</li>
                    <li>Clear your browser cache (Ctrl+Shift+Delete)</li>
                    <li>Try opening in an incognito/private window</li>
                  </ol>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-lg text-xs">
                  <summary className="cursor-pointer font-semibold">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )} 

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
}

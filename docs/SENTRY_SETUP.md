# Sentry Error Logging Setup

This application includes comprehensive error tracking with Sentry integration.

## Features

✅ **Client-side error tracking** - All JavaScript errors are automatically captured
✅ **API failure monitoring** - Failed API calls are logged with context
✅ **Performance monitoring** - Track slow operations and bottlenecks
✅ **Session replay** - View user sessions when errors occur
✅ **Automatic alerting** - Get notified of critical errors in real-time
✅ **User context** - Track which users experience errors
✅ **Breadcrumbs** - See the sequence of events leading to errors

## Configuration

### 1. Sentry DSN

The Sentry DSN is stored as a secret: `VITE_SENTRY_DSN`

To update it:
1. Go to your Sentry project settings
2. Copy your DSN (Data Source Name)
3. Update the secret in your environment

### 2. Environment Settings

Sentry is automatically configured to:
- **Production**: Full error tracking, performance monitoring, and session replay
- **Development**: Disabled (errors only logged to console)

## Usage

### Automatic Error Tracking

Most errors are tracked automatically:
- Unhandled exceptions
- Promise rejections
- Component errors (via Error Boundary)
- Resource loading failures

### Manual Error Logging

```typescript
import { logError, logMessage, addBreadcrumb } from '@/lib/sentry';

// Log an error with context
try {
  // risky operation
} catch (error) {
  logError(error as Error, {
    userId: user.id,
    action: 'checkout',
    cartTotal: 150.00
  });
}

// Log a message
logMessage('User completed checkout', 'info', {
  orderId: '12345',
  total: 150.00
});

// Add breadcrumbs for context
addBreadcrumb('User clicked checkout button', 'user-action');
```

### Track API Calls

```typescript
import { useSentryApi } from '@/hooks/useSentryApi';

const { trackRequest } = useSentryApi();

const fetchData = async () => {
  return trackRequest(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    {
      endpoint: '/api/data',
      method: 'GET',
      description: 'Fetching user data'
    }
  );
};
```

### User Context

```typescript
import { setUserContext, clearUserContext } from '@/lib/sentry';

// After login
setUserContext(user.id, user.email, user.username);

// After logout
clearUserContext();
```

## Monitoring Dashboard

Access your Sentry dashboard to:
- View error trends and frequency
- Analyze performance metrics
- Watch session replays
- Set up custom alerts
- Create release tracking

## Best Practices

1. **Add context to errors** - Include relevant data when logging errors
2. **Use breadcrumbs** - Track user actions leading to errors
3. **Track API failures** - Monitor backend integration issues
4. **Set user context** - Know which users are affected
5. **Monitor performance** - Track slow operations
6. **Review regularly** - Check Sentry dashboard for trends

## Error Filtering

The following errors are automatically filtered:
- Browser extension errors
- Service Worker errors
- Known development noise
- Chunk loading errors (handled with auto-reload)
- ResizeObserver errors (benign browser quirks)

## Performance Monitoring

Performance tracking includes:
- Page load times
- API response times
- Component render performance
- Database query durations
- Asset loading times

## Session Replay

Session replay captures:
- 10% of normal sessions (configurable)
- 100% of sessions with errors
- User interactions and navigation
- Console logs and network requests
- All text and media are masked for privacy

## Alerting Rules

Configure alerts in Sentry for:
- New errors introduced
- Error spike detected
- Performance degradation
- Critical path failures
- User-reported issues

## Support

For issues with Sentry integration:
1. Check the console for Sentry initialization warnings
2. Verify VITE_SENTRY_DSN is set correctly
3. Ensure you're in production mode for full tracking
4. Review Sentry project settings and quotas

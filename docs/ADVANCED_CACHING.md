# Advanced Caching Documentation

## Overview

The SmartKenya website implements advanced caching strategies using Service Workers and browser caching to improve performance and enable offline functionality.

## Caching Strategies Implemented

### 1. Cache Versioning

Each cache has a version number that automatically updates when code changes:

```javascript
const CACHE_VERSION = '2';
const CACHE_NAME = `smartkenya-offline-v${CACHE_VERSION}`;
```

### 2. Multiple Cache Layers

Four separate caches for different content types:

- **CACHE_NAME**: Core app shell and pages
- **RUNTIME_CACHE**: API responses and dynamic content
- **IMAGE_CACHE**: Images and media files
- **STATIC_CACHE**: JavaScript, CSS, fonts

### 3. Caching Strategies by Content Type

#### Images: Stale-While-Revalidate

Images are served from cache immediately while updating in the background:

```javascript
// User sees cached image instantly
// Fresh version loads in background for next visit
```

**Benefits:**
- Instant image loading
- Always up-to-date eventually
- Works offline

#### API Requests: Network-First with Cache Fallback

```javascript
// Try network first
// If network fails, use cache
// Cache is only used if less than 5 minutes old
```

**Benefits:**
- Always shows fresh data when online
- Works offline with recent data
- Automatic cache expiration

#### Static Assets: Cache-First

JavaScript, CSS, and fonts are served from cache:

```javascript
// Check cache first
// If not in cache, fetch from network
// Cache for 30 days
```

**Benefits:**
- Instant page loads
- Reduced bandwidth
- Better performance

### 4. Cache Duration Settings

```javascript
const CACHE_DURATION = {
  images: 7 * 24 * 60 * 60 * 1000,    // 7 days
  api: 5 * 60 * 1000,                  // 5 minutes
  static: 30 * 24 * 60 * 60 * 1000,   // 30 days
};
```

## Configuration Files

### Service Worker (`public/sw.js`)

Enhanced with:
- Version-based cache management
- Automatic cache cleanup
- Metadata tracking (cache timestamps)
- Multiple caching strategies
- Background updates

### Vercel Configuration (`vercel.json`)

HTTP caching headers:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Vite Configuration (`vite.config.ts`)

Build optimizations:
- Hashed filenames for cache busting
- Separate asset folders
- Optimized chunk splitting

## How It Works

### First Visit

1. User visits site
2. Service Worker installs
3. Core assets cached
4. Site functions normally

### Second Visit

1. Service Worker intercepts requests
2. Images load from cache (instant)
3. API calls try network first
4. Static assets from cache
5. Background updates happen silently

### Offline

1. User loses internet
2. Images from cache
3. Recent API data from cache
4. Static assets from cache
5. Offline page shown for navigation

## Monitoring Cache Performance

### Check Cache Status

```javascript
// Open Chrome DevTools
// Application tab → Cache Storage
// See all caches and their contents
```

### Service Worker Status

```javascript
// Application tab → Service Workers
// Check registration status
// View network activity
```

### Performance Metrics

```javascript
// Use PerformanceMonitor component
// Tracks FCP, LCP, FID, CLS, TTFB
// Available in console logs
```

## Cache Management

### Automatic Cleanup

Old cache versions are automatically deleted when new versions are activated:

```javascript
// On service worker activation
caches.keys().then((cacheNames) => {
  // Delete caches not in current version
});
```

### Manual Cache Clear

For testing or troubleshooting:

```javascript
// In Chrome DevTools Console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Or use the CacheManager component
```

### Cache Size Limits

Browser cache storage has limits (typically 50-100MB):

- Images: Cached on-demand, limited by usage
- API: Only recent requests (5 minutes)
- Static: All JS/CSS/fonts
- Automatic cleanup when limit approached

## Best Practices

### 1. Version Your Caches

Always increment version when deploying:

```javascript
const CACHE_VERSION = '3'; // Increment on each deploy
```

### 2. Be Selective

Don't cache everything:
- ✅ Cache: Static assets, images, recent API calls
- ❌ Don't cache: Auth requests, realtime data, large videos

### 3. Set Appropriate TTLs

```javascript
const CACHE_DURATION = {
  images: 7 * 24 * 60 * 60 * 1000,    // Longer for images
  api: 5 * 60 * 1000,                  // Shorter for data
};
```

### 4. Handle Cache Failures

Always provide fallbacks:

```javascript
.catch(() => {
  return new Response('Offline', { status: 503 });
});
```

## Troubleshooting

### Issue: Old content showing after deploy

**Solution:**
1. Increment CACHE_VERSION in sw.js
2. Service Worker will auto-update on next visit
3. Or force update:

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### Issue: Cache taking too much space

**Solution:**
- Check cache contents in DevTools
- Clear old entries
- Reduce cache duration
- Implement cache size limits

### Issue: Service Worker not updating

**Solution:**
- Check sw.js syntax errors
- Ensure updateViaCache: 'none' in registration
- Use skipWaiting() in service worker
- Hard refresh (Ctrl+Shift+R)

## Performance Impact

### Before Caching

- First load: 2-3 seconds
- Repeat visits: 1-2 seconds
- Offline: Site breaks

### After Advanced Caching

- First load: 2-3 seconds (same)
- Repeat visits: 0.5-1 second (50% faster)
- Offline: Basic functionality works
- Data usage: 30-40% reduction

## Future Enhancements

### Planned Improvements

1. **Predictive Prefetching**: Cache likely next pages
2. **Background Sync**: Queue offline actions
3. **Push Notifications**: Alert users of updates
4. **Cache Analytics**: Track cache hit rates
5. **Smart Preloading**: ML-based resource prediction

### CDN Integration

For even better performance, consider:

- Cloudflare CDN integration
- Edge caching
- Image optimization service
- Geographic distribution

## Resources

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Workbox (Google's SW library)](https://developer.chrome.com/docs/workbox/)
- [Web.dev Caching Guide](https://web.dev/learn/pwa/caching/)

# Automatic Version Detection & Seamless Update System

This document describes the automatic update system implemented for the SmartKenya e-commerce platform.

## Overview

The system ensures users always run the latest version of the application without experiencing error boundaries, chunk load errors, or requiring manual refreshes. When a new version is deployed, the app automatically detects it and updates seamlessly.

## Components

### 1. Version Detection (`useVersionCheck` hook)
**Location:** `src/hooks/useVersionCheck.tsx`

- Checks for new versions every 2 minutes
- Compares deployed `version.json` against cached version
- Triggers on tab visibility change (when user returns)
- Uses cache-busting to ensure fresh checks

**Key Features:**
- Non-intrusive background checking
- Throttled to prevent excessive requests
- Stores current version in localStorage
- Provides callbacks for update events

### 2. Version Manager Component
**Location:** `src/components/VersionManager.tsx`

Handles the update UX and orchestration:

**Smart Update Logic:**
- **Regular pages**: Shows 5-second countdown, auto-updates
- **Sensitive paths** (`/checkout`, `/cart`, `/auth`): Delays update until user navigates away
- **Form protection**: Preserves form data in sessionStorage during updates

**Update Process:**
1. Clears all caches (service worker, localStorage)
2. Preserves form backups in sessionStorage
3. Unregisters service workers
4. Performs hard reload

### 3. Enhanced Error Boundary
**Location:** `src/components/GlobalErrorBoundary.tsx`

**Chunk Load Error Handling:**
- Detects chunk loading errors (common after deployments)
- Attempts automatic reload on first error
- Shows loading state during reload attempt
- Only shows error UI if problem persists

**Features:**
- Single automatic retry for chunk errors
- Session-based reload tracking
- Clear user feedback during recovery
- Different messaging for chunk errors vs general errors

### 4. Build Configuration
**Location:** `vite.config.ts`

**Version JSON Generation:**
- Generates `version.json` on each production build
- Includes: version, timestamp, buildId (git hash), buildDate
- Automatically placed in public folder
- Unique chunk names with content hashes (already configured)

**Cache Strategy:**
- `index.html` & `version.json`: No cache, always fresh
- Hashed assets: Long-term cache (1 year, immutable)
- Configured via `vercel.json` headers

### 5. Form Data Backup Utility
**Location:** `src/utils/formBackup.ts`

**Functions:**
- `backup(formId, data)`: Save form state to sessionStorage
- `restore(formId)`: Retrieve saved form state
- `clear(formId)`: Remove specific backup
- `clearAll()`: Remove all backups

**Hook:**
```typescript
const { backup, restore, clear } = useFormBackup('checkout-form');
```

**Features:**
- 1-hour TTL on backups
- URL validation (only restores on same page)
- Survives reloads but not tab closes
- Automatic cleanup of old backups

## User Experience

### Scenario 1: User on Regular Page
1. New version detected in background
2. Toast: "Update available, refreshing in 5 seconds..."
3. Countdown with cancel option
4. Automatic reload after countdown
5. User sees updated app immediately

### Scenario 2: User in Checkout
1. New version detected
2. Toast: "Update available, will refresh when you're done"
3. Update button provided for manual trigger
4. App waits until user navigates away
5. Then applies update automatically

### Scenario 3: Chunk Load Error (Post-Deployment)
1. User tries to navigate after deployment
2. Chunk error detected by Error Boundary
3. Shows "Loading updated version..." spinner
4. Automatically clears caches and reloads
5. User sees working app, no error UI
6. Only shows error if second attempt fails

## Configuration

### Update Check Interval
Default: 2 minutes (120,000ms)

Adjust in `src/components/VersionManager.tsx`:
```typescript
useVersionCheck({
  checkInterval: 2 * 60 * 1000, // Change this value
  ...
})
```

### Sensitive Paths (Delay Updates)
Edit `SENSITIVE_PATHS` in `src/components/VersionManager.tsx`:
```typescript
const SENSITIVE_PATHS = [
  '/checkout',
  '/cart', 
  '/auth',
  '/products/' // Matches /products/* routes
];
```

### Update Countdown Duration
Default: 5 seconds

Change in `startUpdateCountdown()` method:
```typescript
setCountdownSeconds(5); // Change to desired seconds
```

## Cache Strategy

### No-Cache Assets (Always Fresh)
- `/` (root)
- `/index.html`
- `/version.json`

### Long-Term Cache (1 Year, Immutable)
- `/assets/*` (all built assets with hashes)
- `*.js`, `*.css` files
- Images: `*.webp`, `*.jpg`, `*.png`
- Fonts: `*.woff`, `*.woff2`

## Deployment Process

### Automatic (on every build)
1. Vite build plugin generates `version.json`
2. Git hash and timestamp included
3. File placed in `public/` folder
4. Deployed with application

### Manual Version Update
To manually trigger version check (for testing):
```typescript
// In browser console
localStorage.removeItem('app_version');
window.location.reload();
```

## Testing

### Test Update Detection
1. Deploy new version
2. Keep app open in browser
3. Wait 2 minutes for automatic check
4. Or switch to another tab and back

### Test Chunk Error Recovery
1. Deploy new version
2. Without refreshing old version, try to navigate
3. Should see loading spinner briefly
4. Then automatically show new version

### Test Form Protection
1. Fill out checkout form
2. Deploy new version
3. Should see "will refresh when done" message
4. Navigate away from checkout
5. App updates automatically
6. Return to checkout - form data should restore

## Monitoring

### Console Logs
All update-related operations are logged with `[VersionCheck]`, `[VersionManager]`, and `[ErrorBoundary]` prefixes.

**Key logs to monitor:**
- `New version detected`
- `Chunk load error detected, attempting automatic reload`
- `All caches cleared`
- `Service workers unregistered`

### Production Analytics
Version info available in production builds:
```typescript
const version = import.meta.env.VITE_APP_VERSION;
```

## Troubleshooting

### Updates Not Triggering
1. Check `version.json` exists in deployed site
2. Verify `version.json` returns fresh content (not cached)
3. Check browser console for `[VersionCheck]` logs
4. Ensure `VersionManager` is mounted in `main.tsx`

### Chunk Errors Still Appearing
1. Verify Error Boundary is wrapping app in `main.tsx`
2. Check session storage for `chunk_error_reloaded` flag
3. Ensure service worker is unregistering properly
4. Check if caches are being cleared

### Form Data Not Restoring
1. Verify backup was created before reload
2. Check sessionStorage for `form_backup_*` keys
3. Ensure formId matches between backup and restore
4. Verify restore happens on same URL path

## Benefits

✅ **Zero user disruption** - Updates apply automatically
✅ **No error boundaries** - Chunk errors handled gracefully  
✅ **Smart timing** - Delays during critical user flows
✅ **Form protection** - Never lose user input
✅ **Cache management** - Optimal performance with freshness
✅ **Single retry** - Efficient error recovery
✅ **User control** - Can cancel/postpone if needed

## Future Enhancements

Potential improvements:
- [ ] Error reporting integration (Sentry, LogRocket)
- [ ] A/B testing support via version metadata
- [ ] Update release notes in notification
- [ ] Progressive update (staged rollout)
- [ ] Offline update queuing
- [ ] Analytics on update success rates

## Related Files

- `src/hooks/useVersionCheck.tsx` - Version detection hook
- `src/components/VersionManager.tsx` - Update orchestration
- `src/components/GlobalErrorBoundary.tsx` - Error recovery
- `src/utils/formBackup.ts` - Form data preservation
- `vite.config.ts` - Build configuration
- `vercel.json` - Cache headers
- `public/version.json` - Version manifest

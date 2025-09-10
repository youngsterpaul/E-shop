// Service Worker for SmartKenya - Enhanced with cache busting
const CACHE_NAME = 'smartkenya-v2';
const STATIC_CACHE = 'smartkenya-static-v2';
const DYNAMIC_CACHE = 'smartkenya-dynamic-v2';

// Build timestamp for cache versioning
const BUILD_TIMESTAMP = new Date().getTime();

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest'
];

// Network-first strategy for API calls
const API_URLS = [
  'https://sgpjnbdrmwrupeqhjqpj.supabase.co'
];

// Cache-first strategy for static assets
const CACHE_FIRST_URLS = [
  '/static/',
  '/assets/',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// Install event - cache static assets with versioning
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with build timestamp:', BUILD_TIMESTAMP);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached, skipping waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches and notify clients of updates
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
      // Notify all clients about the update
      notifyClientsOfUpdate()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Network-first for API calls
  if (API_URLS.some(apiUrl => event.request.url.startsWith(apiUrl))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses - clone BEFORE checking status
          if (response.ok && response.status === 200) {
            try {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(event.request, responseClone))
                .catch(error => {
                  // Silently handle cache errors to prevent console spam
                  if (error.name !== 'QuotaExceededError') {
                    console.log('Cache put failed:', error.message);
                  }
                });
            } catch (error) {
              // Ignore cloning errors
            }
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first for static assets
  if (CACHE_FIRST_URLS.some(pattern => event.request.url.includes(pattern))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(response => {
              // Clone immediately after fetch
              if (response.ok) {
                try {
                  const responseClone = response.clone();
                  caches.open(STATIC_CACHE)
                    .then(cache => cache.put(event.request, responseClone))
                    .catch(error => {
                      if (error.name !== 'QuotaExceededError') {
                        console.log('Cache put failed:', error.message);
                      }
                    });
                } catch (error) {
                  // Ignore cloning errors
                }
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Stale-while-revalidate for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Clone IMMEDIATELY after fetch, before any other operations
            if (networkResponse.ok) {
              try {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(event.request, responseClone))
                  .catch(error => {
                    if (error.name !== 'QuotaExceededError') {
                      console.log('Cache put failed:', error.message);
                    }
                  });
              } catch (error) {
                // Ignore cloning errors
              }
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('Network fetch failed:', error);
            return response; // Return cached response if available
          });
        
        return response || fetchPromise;
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Handle offline data sync
  const offlineData = await getOfflineData();
  if (offlineData.length > 0) {
    for (const data of offlineData) {
      try {
        await submitData(data);
        await removeOfflineData(data.id);
      } catch (error) {
        console.error('Sync failed for:', data, error);
      }
    }
  }
}

async function getOfflineData() {
  // Retrieve offline data from IndexedDB
  return [];
}

async function submitData(data) {
  // Submit data to server
  return fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
}

async function removeOfflineData(id) {
// Remove synced data from IndexedDB
}

// Notify clients of service worker updates
async function notifyClientsOfUpdate() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SW_UPDATE',
      message: 'New version available',
      timestamp: BUILD_TIMESTAMP
    });
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});
const CACHE_VERSION = '2';
const CACHE_NAME = `smartkenya-offline-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `smartkenya-runtime-v${CACHE_VERSION}`;
const IMAGE_CACHE = `smartkenya-images-v${CACHE_VERSION}`;
const STATIC_CACHE = `smartkenya-static-v${CACHE_VERSION}`;

// Cache duration in milliseconds
const CACHE_DURATION = {
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000, // 5 minutes
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Assets to cache on install - expanded for better offline experience
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/smartkenya-logo.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
];

// Install event - precache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase realtime and auth requests
  if (url.hostname.includes('supabase.co') && 
      (url.pathname.includes('/realtime/') || url.pathname.includes('/auth/'))) {
    return;
  }

  // Handle images with stale-while-revalidate strategy
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              // Add cache metadata
              const headers = new Headers(networkResponse.headers);
              headers.set('sw-cache-time', Date.now().toString());
              const responseToCache = new Response(networkResponse.body, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: headers
              });
              cache.put(request, responseToCache);
            }
            return networkResponse;
          }).catch(() => null);

          // Return cached response immediately if available, but still fetch in background
          return cachedResponse || fetchPromise || new Response('Image unavailable', { status: 503 });
        });
      })
    );
    return;
  }

  // Handle static assets (JS, CSS, fonts) with cache-first strategy
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Handle API requests with network-first + stale-while-revalidate
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Cache successful GET responses with timestamp
              if (networkResponse.ok && request.method === 'GET') {
                const headers = new Headers(networkResponse.headers);
                headers.set('sw-cache-time', Date.now().toString());
                const responseToCache = new Response(networkResponse.body, {
                  status: networkResponse.status,
                  statusText: networkResponse.statusText,
                  headers: headers
                });
                cache.put(request, responseToCache.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback to cache on network failure
              if (cachedResponse) {
                return cachedResponse;
              }
              return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });

          // Check if cache is fresh (less than 5 minutes old)
          if (cachedResponse) {
            const cacheTime = cachedResponse.headers.get('sw-cache-time');
            if (cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION.api) {
              // Return cached response and update in background
              fetchPromise.catch(() => {});
              return cachedResponse;
            }
          }

          // Cache is stale or doesn't exist, wait for network
          return fetchPromise;
        });
      })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html').then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Default: cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME_CACHE).then((cache) => {
        return fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  console.log('[SW] Syncing offline actions...');
  // This will be handled by the useOfflineSync hook in the app
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    caches.open(IMAGE_CACHE).then((cache) => {
      cache.addAll(urls).catch(console.error);
    });
  }
});

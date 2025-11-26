const CACHE_VERSION = '4';
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
              cache.put(request, networkResponse.clone());
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

  // Handle static assets (JS, CSS, fonts) - use network-first for module scripts
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Only cache successful responses with correct MIME types
          if (networkResponse.ok && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type');
            // Don't cache if MIME type is wrong or if it's octet-stream
            if (contentType && 
                !contentType.includes('octet-stream') &&
                (contentType.includes('javascript') || 
                 contentType.includes('css') || 
                 contentType.includes('font'))) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, networkResponse.clone()).catch(err => {
                  console.warn('[SW] Failed to cache:', request.url, err);
                });
              });
            }
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Fetch failed, trying cache:', request.url, err);
          // Fallback to cache only if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle API requests with network-first strategy (NO CACHING to avoid issues)
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/')) {
    event.respondWith(fetch(request));
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
            cache.put(request, networkResponse.clone()).catch(err => {
              console.warn('[SW] Failed to cache runtime:', request.url, err);
            });
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
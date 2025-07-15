// Service Worker for SmartKenya
const CACHE_NAME = 'smartkenya-v1';
const STATIC_CACHE = 'smartkenya-static-v1';
const DYNAMIC_CACHE = 'smartkenya-dynamic-v1';

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
  'https://uxrtbpdmgypzpbghhthf.supabase.co'
];

// Cache-first strategy for static assets
const CACHE_FIRST_URLS = [
  '/static/',
  '/assets/',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
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
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, responseClone));
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
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(event.request, responseClone));
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
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, networkResponse.clone()));
            return networkResponse;
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
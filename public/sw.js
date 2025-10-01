// ✅ SmartKenya Service Worker (Optimized)
// ----------------------------------------
// Handles caching, updates, offline sync, and notifications

const STATIC_CACHE = 'smartkenya-static-v2';
const DYNAMIC_CACHE = 'smartkenya-dynamic-v2';
const BUILD_TIMESTAMP = self.__BUILD_TIMESTAMP__ || Date.now();

// ✅ Core assets (no offline.html)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest',
];

// ✅ API endpoints for network-first
const API_URLS = [
  'https://sgpjnbdrmwrupeqhjqpj.supabase.co',
];

// ✅ Cache-first URL patterns
const CACHE_FIRST_URLS = [
  '/assets/',
  '/static/',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// Utility: Limit cache size
async function limitCacheSize(cacheName, maxItems = 50) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return limitCacheSize(cacheName, maxItems);
  }
}

// 🧱 INSTALL: Cache core files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing with build timestamp:', BUILD_TIMESTAMP);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install error:', err))
  );
});

// 🧹 ACTIVATE: Clean old caches + notify
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE].includes(name)) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
      await self.clients.claim();
      await notifyClientsOfUpdate();
    })()
  );
});

// ⚡ FETCH: Smart strategy routing
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ✅ API requests: Network first
  if (API_URLS.some((api) => request.url.startsWith(api))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ✅ Cache-first for static assets
  if (CACHE_FIRST_URLS.some((pattern) => request.url.includes(pattern))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ✅ Default: Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// 🌐 Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      await limitCacheSize(DYNAMIC_CACHE);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || fallbackResponse();
  }
}

// 💾 Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return fallbackResponse();
  }
}

// ♻️ Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
        await limitCacheSize(DYNAMIC_CACHE);
      }
      return response;
    })
    .catch(() => cached || fallbackResponse());

  return cached || networkFetch;
}

// 🧱 Fallback response (no offline.html needed)
function fallbackResponse() {
  return new Response(
    `<html><body style="text-align:center;padding:2rem;font-family:sans-serif;">
      <h2>⚠️ You are offline</h2>
      <p>Content will be available once you’re reconnected.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// 🔁 Background Sync: retry queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const offlineData = await getOfflineData();
  for (const data of offlineData) {
    try {
      await submitData(data);
      await removeOfflineData(data.id);
    } catch (err) {
      console.error('[SW] Sync failed for item:', data, err);
    }
  }
}

// ⚙️ Stub: IndexedDB methods (to be implemented)
async function getOfflineData() {
  return []; // to be replaced with IndexedDB logic
}
async function removeOfflineData(id) {
  // TODO: implement IndexedDB removal
}
async function submitData(data) {
  return fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
}

// 📢 Notify clients on update
async function notifyClientsOfUpdate() {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({
      type: 'SW_UPDATE',
      message: 'A new version is available',
      timestamp: BUILD_TIMESTAMP,
    });
  }
}

// 📬 Listen for messages from app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received');
    self.skipWaiting();
  }

  if (event.data?.type === 'QUEUE_OFFLINE_DATA') {
    console.log('[SW] Queuing offline data:', event.data.payload);
    // TODO: Save payload to IndexedDB
  }
});

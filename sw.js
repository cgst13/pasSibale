const CACHE_NAME = 'passibale-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/css/theme.css',
  '/css/user.css'
];

// Install Event - Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Static Assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // If any single asset 404s, addAll rejects and the whole SW install fails.
        // Keep the SW install resilient by not failing the entire install.
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First, then Cache (for API calls) or Cache First (for static)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For Supabase or API calls, try network first, but don't fail if offline
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return a minimal offline response
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For static assets and navigation, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache new valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }).catch(() => {
      // Fallback for navigation (e.g., return index.html for SPA routing)
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});

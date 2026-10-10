// Service Worker for Instant Auto-Updates
// Ensures mobile apps & PWAs immediately receive latest changes from Google AI Studio without reinstalling

const CACHE_NAME = 'epos-live-cache-v2';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing tabs/windows to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Always fetch HTML, Navigation, and API calls from Network (never stale)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. API routes & version checks always bypass cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Navigation / HTML requests - Network first with no-store
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // 3. Other static assets: Network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Listen for skip waiting message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

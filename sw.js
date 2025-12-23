
const CACHE_NAME = 'focusread-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/manifest.json',
  '/components/Sidebar.tsx',
  '/components/SpeedReader.tsx',
  '/components/Controls.tsx',
  '/components/TextDisplay.tsx',
  '/components/HighlighterReader.tsx',
  // External Dependencies
  'https://esm.sh/react@^19.2.3',
  'https://esm.sh/react-dom@^19.2.3',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with caution; if one fails, the whole install fails.
      // For external dependencies, we use a more resilient approach.
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cache-first strategy for assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Only cache valid successful responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Optional: Return a fallback offline page if both fail
      });
    })
  );
});

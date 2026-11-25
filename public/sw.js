const CACHE_NAME = 'gasapp-v4';

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(e.request.url);
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // Network-first so updates appear immediately, falling back to cache offline
  e.respondWith(
    fetch(e.request)
      .then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});

const CACHE_NAME = 'room41-v1';

// We fetch fresh assets from the web server in real-time so your tasks text file updates instantly
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

const CACHE_NAME = 'room41-v2';

// Files we want to cache so the app layout loads instantly
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './sub/tasks.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Forces the new service worker to take over instantly
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // Deletes old versions of the app layout
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ⚡ THE FIX: Smart Fetch Routing
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // IF the request is for tasks.txt or files inside the images folder, ALWAYS go straight to the network!
  if (url.pathname.endsWith('.txt') || url.pathname.includes('/images/')) {
    event.respondWith(fetch(event.request));
  } else {
    // For regular layout files (HTML/CSS), try network first, fallback to cache if offline
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

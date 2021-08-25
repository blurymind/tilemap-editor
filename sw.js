const cacheName = "1629829956916";

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll([
      '/tilemap-editor/',
      '/tilemap-editor/index.html',
      '/tilemap-editor/src/tilemap-editor.js',
      '/tilemap-editor/src/styles.css',
    ])),
  );
});

self.addEventListener('message',  (e) => {
    if (e.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
    if (e.request.url.match( /^.*(imgur=).*$/) ) {
        return false;
    }
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});

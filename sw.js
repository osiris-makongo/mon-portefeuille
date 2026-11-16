const CACHE = 'pf-v6';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192-v2.png', 'icon-512-v2.png', 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js'];

self.addEventListener('install', (event) => {
  const requests = SHELL.map((url) => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => /^pf-v\d+$/.test(key) && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const host = new URL(request.url).hostname;
  if (request.method !== 'GET' || /(^|\.)(google\.com|googleusercontent\.com)$/.test(host)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const navigation = request.mode === 'navigate';
    try {
      const response = navigation ? await fetch(request, { cache: 'reload' }) : await fetch(request);
      if (response.ok || response.type === 'opaque') {
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (navigation) {
        const shell = await cache.match('./');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});

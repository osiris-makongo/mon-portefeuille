const CACHE = 'pf-v25';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'DSEG14Classic-Regular.woff2', 'pop-smoke-portrait-32.png', 'pop-smoke-portrait-192.png', 'pop-smoke-portrait-512.png', 'pop-smoke-portrait-maskable-512.png', 'portrait-fond-mobile.jpg', 'portrait-fond-pc.jpg', 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js'];

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

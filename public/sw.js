const CACHE = 'algospark-shell-v19';
const FILES = ['/algospark/', '/algospark/manifest.webmanifest', '/algospark/icon.svg', '/algospark/sandbox.html', '/algospark/sandbox-runner.js'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(FILES);
  const html = await (await cache.match('/algospark/')).text();
  const assets = [...html.matchAll(/(?:src|href)="(\/algospark\/assets\/[^"?#]+)"/g)].map(match => match[1]);
  await cache.addAll(assets);
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).filter(key => key.startsWith('algospark-shell-') && key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/algospark/')) return;
  if (event.request.mode === 'navigate' && ['/algospark/', '/algospark/index.html'].includes(url.pathname)) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('/algospark/', copy)));
      }
      return response;
    }).catch(() => caches.match('/algospark/')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  })));
});

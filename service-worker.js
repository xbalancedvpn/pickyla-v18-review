// Retired PICKYLA v18 service worker.
// Removes legacy caches and unregisters itself so this repository cannot serve stale app code.
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('pickyla-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});

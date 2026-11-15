/* Adaptjetons — service worker : l'application fonctionne hors ligne une fois ouverte une fois. */
const VERSION = 'adaptjetons-2.1b';
const FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone-192.png',
  './icone-512.png',
  './icone-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réponse immédiate depuis le cache, mise à jour en arrière-plan quand le réseau est là. */
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.endsWith('.apk')) return;
  ev.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req, {ignoreSearch: true}).then(enCache => {
        const reseau = fetch(req).then(rep => {
          if (rep && rep.ok) cache.put(req, rep.clone());
          return rep;
        }).catch(() => enCache || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
        return enCache || reseau;
      })
    )
  );
});

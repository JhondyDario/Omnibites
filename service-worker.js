// ============================================
// OMNIBITES — Service Worker
// Cachea solo lo estático (shell de la app) para que
// PWABuilder/Android tenga soporte offline básico.
// NUNCA cachea Firebase, RAWG ni Archive.org — esos
// siempre van a la red para no servir datos viejos.
// ============================================

const CACHE_NAME = 'omnibites-shell-v1';
const ROOT = '/Omnibites';

// Shell mínimo — páginas y assets que casi no cambian
const PRECACHE_URLS = [
  `${ROOT}/index.html`,
  `${ROOT}/css/style.css`,
  `${ROOT}/assets/logo.png`,
  `${ROOT}/assets/icons/logo-192.png`,
  `${ROOT}/assets/icons/logo-512.png`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // si algún asset falla, no tumba la instalación
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Dominios que NUNCA se cachean — siempre en vivo
const NO_CACHE_HOSTS = [
  'firestore.googleapis.com',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com',
  'archive.org',
  'rawg.io',
  'weserv.nl'
];

function esNoCacheable(url) {
  return NO_CACHE_HOSTS.some(host => url.hostname.includes(host));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // nunca interceptar POST/PUT/etc (Firestore writes, etc.)

  const url = new URL(req.url);

  // APIs externas / Firebase → siempre red, nunca cache
  if (esNoCacheable(url)) {
    event.respondWith(fetch(req).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Assets propios del sitio → cache-first con actualización en segundo plano
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Todo lo demás (fuentes de Google, etc.) → pasa directo
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

// ============================================
// OMNIBITES — Service Worker mínimo
// Solo existe para cumplir el requisito de PWA
// (no cachea nada agresivo para no romper Firestore/RAWG/Archive.org)
// ============================================

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Passthrough — deja pasar todo tal cual, sin cachear.
// Si más adelante quieres soporte offline real, aquí se le
// puede meter un cache de assets estáticos (css, logo, etc.)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

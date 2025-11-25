const CACHE_NAME = 'loco-alitas-v1';
// Lista de archivos básicos para que la app "arranque" incluso si falla la red momentáneamente
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  // Forzar la activación inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Intentamos cachear lo básico, pero no bloqueamos si falla alguno
        return cache.addAll(urlsToCache).catch(err => console.error('Fallo en cache inicial', err));
      })
  );
});

// Activación y limpieza de caches viejas
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Intercepción de peticiones (Estrategia Network First para un POS)
// Intentamos ir a internet primero para tener datos frescos. Si falla, miramos el caché.
self.addEventListener('fetch', event => {
  // No cachear llamadas a APIs o bases de datos externas si es posible evitarlo aquí
  // Para simplificar, usamos Network First para todo
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, podríamos actualizar el caché aquí si quisiéramos
        return response;
      })
      .catch(() => {
        // Si falla internet, intentamos servir del caché
        return caches.match(event.request);
      })
  );
});
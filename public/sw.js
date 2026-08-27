const CACHE_NAME = "notedifede-v1.6.0";

// Asset statici principali pre-memorizzati in cache all'installazione
const PRECACHE_ASSETS = [
  "/",
  "/liturgia",
  "/preghiera/infermi",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/apple-touch-icon.png",
];


// Installazione Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Attivazione e pulizia cache obsolete
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Intercettazione richieste di rete
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET o schemi non-HTTP (es. chrome-extension, blob, data)
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Asset statici immutabili di Next.js (_next/static/*) -> Cache-First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. File spartiti, audio e testi Liturgia (/api/song-files/*, /api/liturgia*, Supabase storage) -> Stale-While-Revalidate
  if (
    url.pathname.startsWith("/api/song-files/") ||
    url.pathname.startsWith("/api/liturgia") ||
    url.hostname.includes("supabase.co")
  ) {

    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Pagine di navigazione (/canti, /messe, /messe/*, /) -> Network-First con fallback su Cache
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se la pagina specifica non e in cache, prova a restituire la root /
          const rootCached = await caches.match("/");
          return rootCached || new Response("Contenuto offline non disponibile", { status: 503 });
        })
    );
    return;
  }

  // 4. Tutte le altre risorse -> Network con Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

const CACHE_NAME = "notedifede-v2.5.8";

// Asset statici principali pre-memorizzati in cache all'installazione
const PRECACHE_ASSETS = [
  "/",
  "/liturgia",
  "/preghiera/infermi",
  "/preghiera/bibbia",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon.png",
];

// Installazione Service Worker (resiliente su singolo asset)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((asset) => cache.add(asset))
        )
      )
      .then(() => self.skipWaiting())
  );
});

// Attivazione e pulizia cache obsolete
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Intercettazione richieste di rete
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET, schemi non-HTTP o richieste Range (streaming audio/video 206 Partial Content)
  if (
    request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    request.headers.has("range")
  ) {
    return;
  }

  // Non intercettare mai chiamate di autenticazione o endpoint cron/admin
  if (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/api/cron/")
  ) {
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

  // 2. File spartiti PDF e testi Liturgia/Bibbia (/api/song-files/*, /api/liturgia*, /api/bibbia*) -> Stale-While-Revalidate
  if (
    url.pathname.startsWith("/api/song-files/") ||
    url.pathname.startsWith("/api/liturgia") ||
    url.pathname.startsWith("/api/bibbia")
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
          // Se la pagina specifica non è in cache, prova a restituire la root /
          const rootCached = await caches.match("/");
          return rootCached || new Response("Contenuto offline non disponibile", { status: 503 });
        })
    );
    return;
  }

  // 4. Tutte le altre risorse same-origin -> Network con Cache Fallback
  if (url.origin === self.location.origin) {
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
  }
});

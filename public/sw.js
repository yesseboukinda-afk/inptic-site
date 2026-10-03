const CACHE_NAME = "inptic-pwa-v2";

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  /*
   * IMPORTANT :
   * Ne jamais mettre en cache les fichiers Next.js.
   * Sinon un ancien bundle peut continuer à être exécuté
   * après une modification du code.
   */
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  const privatePaths = [
    "/candidat",
    "/scolarite",
    "/directeur",
    "/agent",
    "/reset-password",
  ];

  if (
    privatePaths.some((path) =>
      url.pathname.startsWith(path)
    )
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() =>
          caches.match("/offline.html")
        )
    );

    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();

        caches
          .open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseClone);
          });

        return response;
      });
    })
  );
});
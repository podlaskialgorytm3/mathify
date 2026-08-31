/*
 * Service worker aplikacji Mathify.
 *
 * Zasady cache'owania:
 * - nawigacje (HTML): zawsze sieć, offline fallback na /offline,
 * - statyczne zasoby Next.js (/_next/static): cache first, bo są hashowane,
 * - obrazy i ikony: stale-while-revalidate,
 * - zapytania do /api: zawsze sieć (dane muszą być aktualne i prywatne).
 */

const VERSION = "v1";
const PRECACHE = `mathify-precache-${VERSION}`;
const RUNTIME = `mathify-runtime-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  );
}

function isImage(request) {
  return request.destination === "image";
}

async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Stron z danymi użytkownika celowo nie cache'ujemy (mogą być prywatne),
    // więc offline pokazujemy dedykowany ekran zastępczy.
    const offline = await caches.match(OFFLINE_URL);

    if (offline) {
      return offline;
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }

  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => cached);

  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // Dane użytkownika nigdy nie trafiają do cache'u.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, PRECACHE));
    return;
  }

  if (isImage(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkWithOfflineFallback(request));
  }
});

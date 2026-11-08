// Service worker: guarda la app completa en el teléfono para que funcione sin internet.
const VERSION = "nido-v1.0.0";
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "data.js",
  "pdf.js",
  "manifest.webmanifest",
  "vendor/jspdf.umd.min.js",
  "fonts/nunito-latin-400-normal.woff2",
  "fonts/nunito-latin-700-normal.woff2",
  "fonts/nunito-latin-800-normal.woff2",
  "fonts/bricolage-grotesque-latin-600-normal.woff2",
  "fonts/bricolage-grotesque-latin-800-normal.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la copia guardada; si hay internet, se actualiza en segundo plano.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      if (res) return res;
      if (req.mode === "navigate") return cache.match("index.html");
      return new Response("", { status: 504 });
    })
  );
});

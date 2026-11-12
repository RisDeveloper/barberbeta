const CACHE = "barberstory-v2";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/applogo.png"]).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // network-first: always try network, cache only 200 OK (never cache redirects)
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok && r.status === 200 && !r.redirected) {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
      }
      return r;
    }).catch(() => {
      return caches.match(e.request).then((r) => r || caches.match("/"));
    })
  );
});
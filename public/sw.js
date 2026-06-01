const SHELL_CACHE = "xms-shell-v1";
const ART_CACHE = "xms-art-runtime-v1";
const ART_CACHE_LIMIT = 60;
const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/assets/critical/") || url.pathname.includes("/thumb-")) {
    event.respondWith(cacheRuntimeArt(request));
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});

async function cacheRuntimeArt(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (!response.ok) return response;

  const cache = await caches.open(ART_CACHE);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  if (keys.length > ART_CACHE_LIMIT) {
    await cache.delete(keys[0]);
  }
  return response;
}

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(payload.title || "戏命师唤你回来", {
      body: payload.body || "你的今日流日快散了，再不看就归天机库。",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"));
});

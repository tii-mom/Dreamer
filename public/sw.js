self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("xms-shell-v1")
      .then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/icon.svg"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});

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

// Baqal service worker — network-first with offline fallback
const CACHE = "baqal-shell-v1";
const APP_SHELL = ["/", "/manifest.json", "/offline.html", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept socket.io, API endpoints, or cross-origin
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/socket.io")) return;
  if (url.pathname.startsWith("/api/")) return;

  const isNavigation =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Network-first for other GETs
  event.respondWith(
    fetch(req)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});

// ---------- Web Push ----------

self.addEventListener("push", (event) => {
  let payload = { title: "بقالك", body: "" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    try {
      if (event.data) payload.body = event.data.text();
    } catch (_) {}
  }
  const title = payload.title || "بقالك";
  const options = {
    body: payload.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag || undefined,
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          try {
            const u = new URL(client.url);
            if (u.origin === self.location.origin) {
              client.focus();
              if ("navigate" in client) return client.navigate(target);
              return;
            }
          } catch (_) {}
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});

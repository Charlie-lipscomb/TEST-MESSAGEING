// Whisp Service Worker
const CACHE_NAME = "whisp-cache-v1";
const FILES_TO_CACHE = ["/", "/index.html", "/manifest.json", "/icon.png"];

// Install service worker and cache assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate service worker and clear old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Serve cached content if offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// Handle push notifications
self.addEventListener("push", event => {
  if (!event.data) return;
  const data = event.data.json();

  const options = {
    body: data.body || "New message on Whisp",
    icon: "/icon.png",
    badge: "/icon.png",
    data: data,
    vibrate: [100, 50, 100],
    tag: data.chatId || "message",
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Whisp", options)
  );
});

// Remove notification when clicked
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const urlToOpen = new URL("/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          client.postMessage({ type: "CHAT_OPENED", chatId: event.notification.data.chatId });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Clear notifications when chat is opened
self.addEventListener("message", event => {
  if (event.data && event.data.type === "CLEAR_CHAT_NOTIFICATIONS") {
    self.registration.getNotifications({ tag: event.data.chatId }).then(notifications => {
      notifications.forEach(notification => notification.close());
    });
  }
});

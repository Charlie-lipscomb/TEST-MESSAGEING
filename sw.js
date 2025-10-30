// sw.js - Whisp service worker
const CACHE_NAME = "whisp-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/sw.js",
  // add icons or manifest if you have them
];

// Install and cache basic files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate and clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Serve cached resources when possible
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// handle push events if you later use a push service
self.addEventListener("push", event => {
  if(!event.data) return;
  const data = event.data.json();
  const title = data.title || "Whisp";
  const options = {
    body: data.body || "New message",
    icon: "/icon.png",
    badge: "/icon.png",
    tag: data.chatId || "whisp-message",
    data: data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// when a notification is clicked, open the app and notify the client
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const chatId = event.notification.data && event.notification.data.chatId;
  const urlToOpen = new URL("/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        // post message to focused client that chat was opened
        try {
          client.postMessage({ type: "CHAT_OPENED", chatId });
        } catch(e){}
        if("focus" in client) return client.focus();
      }
      if(clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// listen for messages from the page
self.addEventListener("message", event => {
  const data = event.data || {};
  if(data.type === "CLEAR_CHAT_NOTIFICATIONS" && data.chatId){
    // close notifications with that tag
    self.registration.getNotifications({ tag: data.chatId }).then(list => {
      list.forEach(n => n.close());
    }).catch(()=>{});
  }
});

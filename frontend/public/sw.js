// Service Worker for Push Notifications
const CACHE_NAME = "hexagon-v1";
const urlsToCache = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    data: data.data || {},
    tag: data.tag || "default",
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data;
  let urlToOpen = data?.url || "/";

  // Handle different notification types
  if (data?.postId) {
    urlToOpen = `/profile`;
  } else if (data?.reelId) {
    urlToOpen = `/reels`;
  } else if (data?.userId) {
    urlToOpen = `/profile/${data.userId}`;
  } else if (data?.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ("focus" in client) {
            // Focus existing window and navigate
            client.focus();
            if (client.navigate) {
              client.navigate(urlToOpen);
            } else {
              // Fallback: open new window
              return clients.openWindow(urlToOpen);
            }
            return;
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});


/**
 * Utility to check notification status and help debug issues
 */

export async function checkNotificationStatus() {
  try {
    const status = {
      serviceWorkerSupported: "serviceWorker" in navigator,
      notificationsSupported: "Notification" in window,
      notificationPermission: Notification?.permission || "default",
      serviceWorkerRegistered: false,
      pushSubscription: null,
      pushSupported: false,
    };

    // Check service worker
    if (status.serviceWorkerSupported) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        status.serviceWorkerRegistered = !!registration;

        if (registration && registration.pushManager) {
          // Check push subscription
          try {
            const subscription =
              await registration.pushManager.getSubscription();
            status.pushSubscription = subscription;
            status.pushSupported = "PushManager" in window;
          } catch (err) {
            console.error("Error checking push subscription:", err);
            status.pushSupported = false;
          }
        }
      } catch (err) {
        console.error("Error checking service worker:", err);
      }
    }

    return status;
  } catch (err) {
    console.error("Error in checkNotificationStatus:", err);
    return {
      serviceWorkerSupported: false,
      notificationsSupported: false,
      notificationPermission: "default",
      serviceWorkerRegistered: false,
      pushSubscription: null,
      pushSupported: false,
      error: err.message,
    };
  }
}

export function logNotificationStatus() {
  checkNotificationStatus()
    .then((status) => {
      console.log("=== Notification Status ===");
      console.log("Service Worker Supported:", status.serviceWorkerSupported);
      console.log("Notifications Supported:", status.notificationsSupported);
      console.log("Notification Permission:", status.notificationPermission);
      console.log("Service Worker Registered:", status.serviceWorkerRegistered);
      console.log("Push Supported:", status.pushSupported);
      console.log("Push Subscribed:", !!status.pushSubscription);

      if (status.pushSubscription) {
        console.log("Push Endpoint:", status.pushSubscription.endpoint);
      } else {
        console.log("⚠️ Not subscribed to push notifications");
        console.log("💡 Try logging out and back in to subscribe");
      }

      if (status.notificationPermission !== "granted") {
        console.log("⚠️ Notification permission not granted");
        console.log("💡 User needs to grant notification permission");
      }

      console.log("==========================");
    })
    .catch((err) => {
      console.error("Error checking notification status:", err);
    });
}

// Make it available globally for debugging
if (typeof window !== "undefined") {
  window.checkNotificationStatus = checkNotificationStatus;
  window.logNotificationStatus = logNotificationStatus;
}

/**
 * Simple Browser Notifications Service
 * Shows native browser notifications for real-time events
 */

// Request notification permission
export async function requestBrowserNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.warn("Notification permission was denied");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Check if notifications are supported and permitted
export function canShowNotifications() {
  if (!("Notification" in window)) {
    return false;
  }
  return Notification.permission === "granted";
}

// Show a browser notification
export function showBrowserNotification(title, options = {}) {
  if (!canShowNotifications()) {
    console.warn("Cannot show notification: permission not granted");
    return null;
  }

  const defaultOptions = {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: options.tag || "default", // Prevent duplicate notifications
    requireInteraction: false,
    silent: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click
    notification.onclick = (event) => {
      event.preventDefault();
      notification.close();
      
      // Focus window if it exists
      if (window) {
        window.focus();
      }

      // Navigate if URL is provided
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
    };

    return notification;
  } catch (error) {
    console.error("Error showing browser notification:", error);
    return null;
  }
}

// Show notification from notification object
export function showNotificationFromObject(notification) {
  if (!notification || !notification.message) {
    return null;
  }

  // Map notification types to titles
  const typeTitles = {
    new_post: "New Post",
    new_reel: "New Reel",
    like: "New Like",
    comment: "New Comment",
    follow: "New Follower",
    fund: "New Funding",
    repost: "New Repost",
  };

  const title = typeTitles[notification.type] || "Notification";
  const body = notification.message;

  const data = {
    url: notification.relatedPostId
      ? `/profile`
      : notification.relatedReelId
      ? `/reels`
      : notification.relatedUserId
      ? `/u/${notification.relatedUserId}`
      : `/profile`,
    postId: notification.relatedPostId || "",
    reelId: notification.relatedReelId || "",
    userId: notification.relatedUserId || "",
  };

  return showBrowserNotification(title, {
    body,
    tag: `notification-${notification._id || Date.now()}`,
    data,
  });
}

// Initialize browser notifications (call this on app load)
export async function initializeBrowserNotifications() {
  // Request permission on app load
  await requestBrowserNotificationPermission();
  
  console.log("Browser notifications initialized");
}


import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import API_CONFIG from "../config/api";

export const usePostNotifications = (token, userId) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !userId) return;

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Connect to Socket.IO notifications namespace
    const socketInstance = io(`${API_CONFIG.getApiUrl("")}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("[Post Notifications] Connected to notification socket");
    });

    // Receive initial notifications on connect
    socketInstance.on("notifications", (notificationsList) => {
      console.log(
        "[Post Notifications] Received initial notifications:",
        notificationsList.length
      );
      setNotifications(notificationsList || []);
    });

    // Receive new notification (singular)
    socketInstance.on("newNotification", (notification) => {
      console.log(
        "[Post Notifications] Received new notification:",
        notification
      );

      // Add to state
      setNotifications((prev) => [notification, ...prev]);

      // Show browser notification
      if (
        notification.type === "new_post" &&
        Notification.permission === "granted"
      ) {
        const notif = new Notification("New Post", {
          body: notification.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `post-${notification.relatedPostId}`,
        });

        notif.onclick = () => {
          window.focus();
          window.location.href = `/profile`;
          notif.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => notif.close(), 5000);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Post Notifications] Connection error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, userId]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return { notifications, clearNotifications, socket };
};

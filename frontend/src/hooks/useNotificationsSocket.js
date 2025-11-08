import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import API_CONFIG from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import {
  showNotificationFromObject,
  canShowNotifications,
} from "../utils/browserNotifications";

export function useNotificationsSocket() {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const { token, user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated and has a token
    if (!token || !user) {
      console.log(
        "[Notifications] Not authenticated, skipping socket connection",
        { hasToken: !!token, hasUser: !!user }
      );
      // Disconnect if already connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Get base URL from API config
    const baseUrl = API_CONFIG.getCurrentBackendUrl();
    const socketUrl = baseUrl || "http://localhost:5003";

    console.log("[Notifications] Connecting to socket with token...");

    // Connect to notifications namespace
    const socket = io(`${socketUrl}/notifications`, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Notifications] Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Notifications] Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error(
        "[Notifications] Connection error:",
        error.message || error
      );
      setIsConnected(false);

      // If token is invalid/expired, try to get a fresh token
      if (
        error.message &&
        (error.message.includes("Invalid") || error.message.includes("expired"))
      ) {
        console.log(
          "[Notifications] Token appears invalid/expired, will retry with fresh token"
        );
        // The AuthContext should handle token refresh, so we'll just disconnect
        // and let the effect re-run when token is updated
        socket.disconnect();
      }
    });

    // Receive initial notifications list
    socket.on("notifications", (data) => {
      setNotifications(Array.isArray(data) ? data : []);
    });

    // Receive new notification
    socket.on("newNotification", (notification) => {
      console.log(
        "[Notifications] Received new notification via WebSocket:",
        notification
      );
      setNotifications((prev) => [notification, ...prev]);

      // Show browser notification if permission granted (fallback for when push notifications aren't available)
      if (canShowNotifications()) {
        console.log(
          "[Notifications] Showing browser notification for:",
          notification.type
        );
        showNotificationFromObject(notification);
      } else {
        console.log(
          "[Notifications] Browser notification permission not granted, notification stored but not shown"
        );
      }
    });

    // Handle notification read confirmation
    socket.on("notificationRead", (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === data.notificationId ? { ...n, isRead: true } : n
        )
      );
    });

    socket.on("error", (error) => {
      console.error("[Notifications] Socket error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user]); // Reconnect when token or user changes

  const markAsRead = (notificationId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("markRead", { notificationId });
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    }
  };

  return {
    notifications,
    isConnected,
    markAsRead,
  };
}

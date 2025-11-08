import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-change-please-update-in-production";

// Store connected users: userId -> socket
const connectedUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1] ||
      socket.handshake.query?.token;

    if (!token) {
      console.log("[Socket Auth] No token provided");
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        console.log(
          `[Socket Auth] User not found for userId: ${decoded.userId}`
        );
        return next(new Error("Invalid token or user not found"));
      }

      if (!user.isActive) {
        console.log(`[Socket Auth] User ${user._id} is not active`);
        return next(new Error("User account is deactivated"));
      }

      socket.userId = String(user._id);
      socket.user = user;
      console.log(
        `[Socket Auth] Authenticated user: ${user._id} (${
          user.username || user.email
        })`
      );
      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        console.log("[Socket Auth] Token expired");
        return next(new Error("Token expired. Please refresh and try again."));
      } else if (jwtError.name === "JsonWebTokenError") {
        console.log("[Socket Auth] Invalid token format");
        return next(new Error("Invalid token format"));
      } else {
        console.error("[Socket Auth] JWT verification error:", jwtError);
        return next(new Error("Token verification failed"));
      }
    }
  } catch (error) {
    console.error("[Socket Auth] Authentication error:", error);
    return next(new Error("Authentication failed"));
  }
};

// Setup notifications socket namespace
export const setupNotificationsSocket = (io) => {
  console.log("[Notifications Socket] Setting up /notifications namespace...");
  const notificationsNamespace = io.of("/notifications");
  console.log(
    "[Notifications Socket] Namespace created:",
    notificationsNamespace.name
  );

  // Apply authentication middleware
  notificationsNamespace.use(authenticateSocket);

  notificationsNamespace.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`[Notifications] User connected: ${userId}`);

    // Store user connection
    connectedUsers.set(userId, socket);

    // Send existing notifications on connect
    try {
      const existingNotifications = await Notification.find({
        recipientId: userId,
      })
        .sort({ createdAt: -1 })
        .limit(50);
      socket.emit("notifications", existingNotifications);
    } catch (error) {
      console.error("Error fetching notifications on connect:", error);
    }

    // Handle marking notification as read
    socket.on("markRead", async (data) => {
      try {
        const { notificationId } = data;
        const notification = await Notification.findById(notificationId);

        if (notification && String(notification.recipientId) === userId) {
          notification.isRead = true;
          await notification.save();
          socket.emit("notificationRead", { notificationId, isRead: true });
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
        socket.emit("error", {
          message: "Failed to mark notification as read",
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[Notifications] User disconnected: ${userId}`);
      connectedUsers.delete(userId);
    });
  });

  console.log("[Notifications Socket] ✅ Namespace setup complete");

  // Return function to send notification to a user
  return {
    sendNotification: (userId, notification) => {
      const socket = connectedUsers.get(String(userId));
      if (socket) {
        socket.emit("newNotification", notification);
        console.log(
          `[Notifications Socket] Sent notification to user ${userId}`
        );
      } else {
        console.log(`[Notifications Socket] User ${userId} not connected`);
      }
    },
  };
};

import LiveTunnel from "../models/LiveTunnel.js";

/**
 * Setup Socket.IO namespace for live tunnel events
 * @param {Server} io - Socket.IO server instance
 */
export function setupTunnelSocket(io) {
  const tunnelNamespace = io.of("/tunnels");

  tunnelNamespace.on("connection", (socket) => {
    console.log(`[Tunnel Socket] Client connected: ${socket.id}`);

    // Join a specific tunnel room
    socket.on("join-tunnel", async ({ tunnelId, userId, username }) => {
      try {
        const tunnel = await LiveTunnel.findOne({
          tunnelId,
          status: "active",
        });

        if (!tunnel) {
          socket.emit("error", { message: "Tunnel not found or offline" });
          return;
        }

        // Check viewer limit
        if (tunnel.stats.viewersCount >= tunnel.maxViewers) {
          socket.emit("error", {
            message: `Viewer limit reached (${tunnel.maxViewers} viewers)`,
          });
          return;
        }

        // Join the tunnel room
        socket.join(`tunnel:${tunnelId}`);
        socket.tunnelId = tunnelId;
        socket.userId = userId;
        socket.username = username;

        // Add viewer to tunnel
        if (userId) {
          await tunnel.addViewer(userId, username);
        }

        // Notify everyone in the tunnel
        tunnelNamespace.to(`tunnel:${tunnelId}`).emit("viewer-joined", {
          userId,
          username,
          viewersCount: tunnel.stats.viewersCount,
          timestamp: new Date(),
        });

        // Send tunnel info to the joining user
        socket.emit("tunnel-joined", {
          tunnelId: tunnel.tunnelId,
          projectName: tunnel.projectName,
          username: tunnel.username,
          publicUrl: tunnel.publicUrl,
          viewersCount: tunnel.stats.viewersCount,
          stats: tunnel.stats,
        });

        console.log(
          `[Tunnel Socket] User ${username} joined tunnel ${tunnelId}`
        );
      } catch (error) {
        console.error("[Tunnel Socket] Error joining tunnel:", error);
        socket.emit("error", { message: "Failed to join tunnel" });
      }
    });

    // Leave tunnel room
    socket.on("leave-tunnel", async ({ tunnelId, userId }) => {
      try {
        const tunnel = await LiveTunnel.findOne({ tunnelId });

        if (tunnel && userId) {
          await tunnel.removeViewer(userId);

          // Notify everyone in the tunnel
          tunnelNamespace.to(`tunnel:${tunnelId}`).emit("viewer-left", {
            userId,
            username: socket.username,
            viewersCount: tunnel.stats.viewersCount,
            timestamp: new Date(),
          });
        }

        socket.leave(`tunnel:${tunnelId}`);
        console.log(
          `[Tunnel Socket] User ${socket.username} left tunnel ${tunnelId}`
        );
      } catch (error) {
        console.error("[Tunnel Socket] Error leaving tunnel:", error);
      }
    });

    // Creator sends status update
    socket.on("creator-status", async ({ tunnelId, status, message }) => {
      try {
        // Verify creator ownership
        const tunnel = await LiveTunnel.findOne({ tunnelId });
        if (!tunnel || tunnel.userId.toString() !== socket.userId) {
          return;
        }

        // Broadcast to all viewers
        tunnelNamespace.to(`tunnel:${tunnelId}`).emit("creator-status", {
          status,
          message,
          timestamp: new Date(),
        });

        console.log(`[Tunnel Socket] Creator status update: ${status}`);
      } catch (error) {
        console.error("[Tunnel Socket] Error sending creator status:", error);
      }
    });

    // Viewer sends a comment/reaction
    socket.on("viewer-comment", async ({ tunnelId, comment }) => {
      try {
        // Broadcast to all in tunnel
        tunnelNamespace.to(`tunnel:${tunnelId}`).emit("viewer-comment", {
          userId: socket.userId,
          username: socket.username,
          comment,
          timestamp: new Date(),
        });

        console.log(
          `[Tunnel Socket] Comment from ${socket.username}: ${comment}`
        );
      } catch (error) {
        console.error("[Tunnel Socket] Error sending comment:", error);
      }
    });

    // Viewer sends a reaction
    socket.on("viewer-reaction", async ({ tunnelId, reaction }) => {
      try {
        // Broadcast to all in tunnel
        tunnelNamespace.to(`tunnel:${tunnelId}`).emit("viewer-reaction", {
          userId: socket.userId,
          username: socket.username,
          reaction,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Tunnel Socket] Error sending reaction:", error);
      }
    });

    // Request tunnel stats
    socket.on("get-stats", async ({ tunnelId }) => {
      try {
        const tunnel = await LiveTunnel.findOne({ tunnelId });
        if (!tunnel) {
          socket.emit("error", { message: "Tunnel not found" });
          return;
        }

        socket.emit("tunnel-stats", {
          tunnelId: tunnel.tunnelId,
          stats: tunnel.stats,
          viewersCount: tunnel.stats.viewersCount,
          currentViewers: tunnel.currentViewers.map((v) => ({
            username: v.username,
            joinedAt: v.joinedAt,
          })),
        });
      } catch (error) {
        console.error("[Tunnel Socket] Error getting stats:", error);
        socket.emit("error", { message: "Failed to get stats" });
      }
    });

    // Tunnel health check ping
    socket.on("ping-tunnel", async ({ tunnelId }) => {
      try {
        const tunnel = await LiveTunnel.findOne({ tunnelId, status: "active" });
        socket.emit("pong-tunnel", {
          tunnelId,
          isAlive: !!tunnel,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[Tunnel Socket] Error pinging tunnel:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        if (socket.tunnelId && socket.userId) {
          const tunnel = await LiveTunnel.findOne({
            tunnelId: socket.tunnelId,
          });

          if (tunnel) {
            await tunnel.removeViewer(socket.userId);

            // Notify others
            tunnelNamespace
              .to(`tunnel:${socket.tunnelId}`)
              .emit("viewer-left", {
                userId: socket.userId,
                username: socket.username,
                viewersCount: tunnel.stats.viewersCount,
                timestamp: new Date(),
              });
          }
        }

        console.log(`[Tunnel Socket] Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error("[Tunnel Socket] Error handling disconnect:", error);
      }
    });
  });

  console.log("[Tunnel Socket] ✅ Tunnel Socket.IO namespace initialized");
  return tunnelNamespace;
}

/**
 * Broadcast tunnel event to all viewers
 * @param {Namespace} tunnelSocket - Tunnel namespace
 * @param {string} tunnelId - Tunnel ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export function broadcastTunnelEvent(tunnelSocket, tunnelId, event, data) {
  if (tunnelSocket) {
    tunnelSocket.to(`tunnel:${tunnelId}`).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }
}

/**
 * Notify tunnel closed
 * @param {Namespace} tunnelSocket - Tunnel namespace
 * @param {string} tunnelId - Tunnel ID
 */
export function notifyTunnelClosed(tunnelSocket, tunnelId) {
  if (tunnelSocket) {
    tunnelSocket.to(`tunnel:${tunnelId}`).emit("tunnel-closed", {
      tunnelId,
      message: "The creator has ended this live session",
      timestamp: new Date(),
    });
  }
}

/**
 * Notify tunnel error
 * @param {Namespace} tunnelSocket - Tunnel namespace
 * @param {string} tunnelId - Tunnel ID
 * @param {string} error - Error message
 */
export function notifyTunnelError(tunnelSocket, tunnelId, error) {
  if (tunnelSocket) {
    tunnelSocket.to(`tunnel:${tunnelId}`).emit("tunnel-error", {
      tunnelId,
      error,
      timestamp: new Date(),
    });
  }
}

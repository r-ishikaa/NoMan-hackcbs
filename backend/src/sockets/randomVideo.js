import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

// Store waiting users and active calls
const waitingQueue = new Set(); // Users waiting for a match
const activeCalls = new Map(); // socketId -> { partnerId, roomId }
const socketToUser = new Map(); // socketId -> userId

export function setupRandomVideoSocket(io) {
  const videoNamespace = io.of("/random-video");

  // Authentication middleware
  videoNamespace.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1] ||
        socket.handshake.query?.token;

      if (!token) {
        console.log("[Random Video] No token provided");
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        console.log("[Random Video] User not found");
        return next(new Error("User not found"));
      }

      if (!user.isActive) {
        console.log("[Random Video] User account inactive");
        return next(new Error("Account is deactivated"));
      }

      socket.userId = String(user._id);
      socket.username = user.username || "Anonymous";
      console.log(
        `[Random Video] User authenticated: ${socket.username} (${socket.userId})`
      );
      next();
    } catch (error) {
      console.error("[Random Video] Authentication error:", error.message);
      return next(new Error("Authentication failed"));
    }
  });

  videoNamespace.on("connection", (socket) => {
    console.log(
      `[Random Video] User connected: ${socket.username} (${socket.id})`
    );
    socketToUser.set(socket.id, socket.userId);

    // User wants to find a match
    socket.on("findMatch", () => {
      console.log(`[Random Video] ${socket.username} looking for match...`);

      // Remove from any existing call first
      leaveCurrentCall(socket);

      // Check if there's someone waiting
      if (waitingQueue.size > 0) {
        // Get the first person in queue
        const waitingSocketId = Array.from(waitingQueue)[0];
        const waitingSocket = videoNamespace.sockets.get(waitingSocketId);

        if (waitingSocket && waitingSocket.id !== socket.id) {
          // Remove from queue
          waitingQueue.delete(waitingSocketId);

          // Create a room for these two users
          const roomId = `room-${socket.id}-${waitingSocketId}`;

          // Store active call info
          activeCalls.set(socket.id, {
            partnerId: waitingSocketId,
            partnerUsername: waitingSocket.username,
            roomId,
          });
          activeCalls.set(waitingSocketId, {
            partnerId: socket.id,
            partnerUsername: socket.username,
            roomId,
          });

          // Join both to the room
          socket.join(roomId);
          waitingSocket.join(roomId);

          console.log(
            `[Random Video] Matched ${socket.username} with ${waitingSocket.username} in ${roomId}`
          );

          // Notify both users about the match
          socket.emit("matched", {
            roomId,
            partnerId: waitingSocketId,
            partnerUsername: waitingSocket.username,
            isInitiator: true, // This user will create the offer
          });

          waitingSocket.emit("matched", {
            roomId,
            partnerId: socket.id,
            partnerUsername: socket.username,
            isInitiator: false, // This user will wait for offer
          });
        } else {
          // Waiting socket no longer valid, add current user to queue
          waitingQueue.delete(waitingSocketId);
          waitingQueue.add(socket.id);
          socket.emit("waiting");
          console.log(`[Random Video] ${socket.username} added to queue`);
        }
      } else {
        // No one waiting, add to queue
        waitingQueue.add(socket.id);
        socket.emit("waiting");
        console.log(
          `[Random Video] ${socket.username} added to queue (first in line)`
        );
      }
    });

    // WebRTC signaling: offer
    socket.on("offer", ({ offer, roomId }) => {
      console.log(`[Random Video] Offer from ${socket.username} in ${roomId}`);
      socket.to(roomId).emit("offer", {
        offer,
        from: socket.id,
        fromUsername: socket.username,
      });
    });

    // WebRTC signaling: answer
    socket.on("answer", ({ answer, roomId }) => {
      console.log(`[Random Video] Answer from ${socket.username} in ${roomId}`);
      socket.to(roomId).emit("answer", {
        answer,
        from: socket.id,
      });
    });

    // WebRTC signaling: ICE candidate
    socket.on("ice-candidate", ({ candidate, roomId }) => {
      console.log(`[Random Video] ICE candidate from ${socket.username}`);
      socket.to(roomId).emit("ice-candidate", {
        candidate,
        from: socket.id,
      });
    });

    // Skip current match and find new one
    socket.on("skip", () => {
      console.log(`[Random Video] ${socket.username} skipped current match`);

      const callInfo = activeCalls.get(socket.id);
      if (callInfo) {
        // Notify partner that user skipped
        const partnerSocket = videoNamespace.sockets.get(callInfo.partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partnerSkipped");
          // Put partner back in queue automatically
          leaveCurrentCall(partnerSocket);
          waitingQueue.add(callInfo.partnerId);
          partnerSocket.emit("waiting");
        }
      }

      // Leave current call and find new match
      leaveCurrentCall(socket);
      socket.emit("findMatch"); // Trigger client to find new match
    });

    // User manually stops searching
    socket.on("stopSearching", () => {
      console.log(`[Random Video] ${socket.username} stopped searching`);
      leaveCurrentCall(socket);
      waitingQueue.delete(socket.id);
      socket.emit("searchStopped");
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[Random Video] User disconnected: ${socket.username}`);

      const callInfo = activeCalls.get(socket.id);
      if (callInfo) {
        // Notify partner about disconnect
        const partnerSocket = videoNamespace.sockets.get(callInfo.partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partnerDisconnected");
          // Put partner back in queue
          leaveCurrentCall(partnerSocket);
          waitingQueue.add(callInfo.partnerId);
          partnerSocket.emit("waiting");
        }
      }

      // Clean up
      leaveCurrentCall(socket);
      waitingQueue.delete(socket.id);
      socketToUser.delete(socket.id);
    });
  });

  // Helper function to leave current call
  function leaveCurrentCall(socket) {
    const callInfo = activeCalls.get(socket.id);
    if (callInfo) {
      // Leave the room
      socket.leave(callInfo.roomId);

      // Clean up partner's call info
      activeCalls.delete(callInfo.partnerId);

      // Clean up own call info
      activeCalls.delete(socket.id);

      console.log(
        `[Random Video] ${socket.username} left call ${callInfo.roomId}`
      );
    }

    // Remove from waiting queue if present
    waitingQueue.delete(socket.id);
  }

  console.log("[Random Video] Socket.IO namespace initialized");
  return videoNamespace;
}

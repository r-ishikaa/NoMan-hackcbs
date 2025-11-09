import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

const router = express.Router();

// Store connected users per classroom
const classroomUsers = new Map(); // classroomId -> Map(socketId -> { username, socket })
// Store whiteboard state per classroom
const classroomWhiteboards = new Map(); // classroomId -> { imageUrl, username, timestamp }
// Store chat messages per classroom
const classroomMessages = new Map(); // classroomId -> Array of { username, message, timestamp }

// Available classrooms
const CLASSROOMS = [
  { id: "classroom-1", name: "Room 1 - Mathematics" },
  { id: "classroom-2", name: "Room 2 - Science" },
  { id: "classroom-3", name: "Room 3 - Literature" },
  { id: "classroom-4", name: "Room 4 - History" },
  { id: "classroom-5", name: "Room 5 - Arts" },
];

// Initialize classroom maps
CLASSROOMS.forEach((classroom) => {
  if (!classroomUsers.has(classroom.id)) {
    classroomUsers.set(classroom.id, new Map());
  }
  if (!classroomWhiteboards.has(classroom.id)) {
    classroomWhiteboards.set(classroom.id, null);
  }
  if (!classroomMessages.has(classroom.id)) {
    classroomMessages.set(classroom.id, []);
  }
});

// Socket.IO setup will be done in server.js, but we export the handler
export const setupVRSocket = (io) => {
  // VR namespace for voice chat
  const vrNamespace = io.of("/vr");

  vrNamespace.on("connection", (socket) => {
    console.log(`[VR] Client connected: ${socket.id}`);

    // Store current classroom for this socket
    let currentRoomId = null;
    let userUsername = null;
    let userPosition = [0, 1, 0];
    let userRotation = [0, 0, 0];

    // Handle user joining (can join without a classroom initially)
    socket.on("join", (data) => {
      const { username, classroomId } = data;

      if (!username || username.trim().length === 0) {
        socket.emit("error", { message: "Username is required" });
        return;
      }

      userUsername = username.trim();

      // Default to first classroom if no classroomId provided (single classroom mode)
      const targetRoomId = classroomId || CLASSROOMS[0].id;
      const validRoom = CLASSROOMS.find((c) => c.id === targetRoomId);

      if (!validRoom) {
        socket.emit("error", { message: "Invalid classroom ID" });
        return;
      }

      // Leave previous classroom if any
      if (currentRoomId && classroomUsers.has(currentRoomId)) {
        const prevRoom = classroomUsers.get(currentRoomId);
        prevRoom.delete(socket.id);
        socket.leave(currentRoomId);

        // Notify others in previous classroom
        socket.to(currentRoomId).emit("userLeft", {
          username: userUsername,
          socketId: socket.id,
          classroomId: currentRoomId,
          timestamp: new Date().toISOString(),
        });
      }

      // Join classroom (default to first classroom)
      currentRoomId = targetRoomId;
      const classroomUsersMap = classroomUsers.get(targetRoomId);

      // Store user info in classroom
      classroomUsersMap.set(socket.id, {
        username: userUsername,
        socket: socket,
        joinedAt: new Date(),
        position: userPosition,
        rotation: userRotation,
      });

      // Join socket room
      socket.join(targetRoomId);

      // Notify the user they joined
      socket.emit("joined", {
        username: userUsername,
        socketId: socket.id,
        classroomId: targetRoomId,
      });

      // Notify other users in the classroom about the new user
      socket.to(targetRoomId).emit("userJoined", {
        username: userUsername,
        socketId: socket.id,
        classroomId: targetRoomId,
        position: userPosition,
        rotation: userRotation,
        timestamp: new Date().toISOString(),
      });

      // Send list of currently connected users in this classroom
      const usersList = Array.from(classroomUsersMap.values())
        .filter((u) => u.socket.id !== socket.id)
        .map((u) => ({
          username: u.username,
          socketId: u.socket.id,
        }));

      socket.emit("usersList", { users: usersList });

      // Send current whiteboard state to new user
      const whiteboardState = classroomWhiteboards.get(targetRoomId);
      if (whiteboardState) {
        socket.emit("whiteboardUpdate", whiteboardState);
      }

      // Send chat history to new user
      const messages = classroomMessages.get(targetRoomId) || [];
      socket.emit("chatHistory", { messages });

      console.log(
        `[VR] User ${userUsername} joined classroom ${targetRoomId} (${socket.id})`
      );
      console.log(
        `[VR] Total users in ${targetRoomId}: ${classroomUsersMap.size}`
      );
    });

    // Handle classroom change (position-based)
    socket.on("classroomChange", (data) => {
      const { username, previousRoomId, newRoomId, position, rotation } = data;

      userPosition = position || userPosition;
      userRotation = rotation || userRotation;

      // Leave previous classroom
      if (previousRoomId && classroomUsers.has(previousRoomId)) {
        const prevRoom = classroomUsers.get(previousRoomId);
        prevRoom.delete(socket.id);
        socket.leave(previousRoomId);

        socket.to(previousRoomId).emit("userLeft", {
          username: username || userUsername,
          socketId: socket.id,
          classroomId: previousRoomId,
          timestamp: new Date().toISOString(),
        });
      }

      // Join new classroom
      if (newRoomId) {
        const validRoom = CLASSROOMS.find((c) => c.id === newRoomId);
        if (validRoom) {
          currentRoomId = newRoomId;
          const classroomUsersMap = classroomUsers.get(newRoomId);

          classroomUsersMap.set(socket.id, {
            username: username || userUsername,
            socket: socket,
            joinedAt: new Date(),
            position: userPosition,
            rotation: userRotation,
          });

          socket.join(newRoomId);

          // Send list of users in new classroom
          const usersInRoom = Array.from(classroomUsersMap.values())
            .filter((user) => user.socket.id !== socket.id)
            .map((user) => ({
              username: user.username,
              socketId: user.socket.id,
              classroomId: newRoomId,
            }));

          socket.emit("usersList", {
            users: usersInRoom,
            classroomId: newRoomId,
          });

          // Send whiteboard state
          const whiteboardState = classroomWhiteboards.get(newRoomId);
          if (whiteboardState) {
            socket.emit("whiteboardUpdate", {
              ...whiteboardState,
              classroomId: newRoomId,
            });
          }

          // Notify others in new classroom
          socket.to(newRoomId).emit("userJoined", {
            username: username || userUsername,
            socketId: socket.id,
            classroomId: newRoomId,
            position: userPosition,
            rotation: userRotation,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Left all classrooms
        currentRoomId = null;
      }
    });

    // Handle voice audio data
    socket.on("voice", (data) => {
      if (!currentRoomId) {
        socket.emit("error", { message: "You must join a classroom first" });
        return;
      }

      const classroomUsersMap = classroomUsers.get(currentRoomId);
      const user = classroomUsersMap.get(socket.id);
      if (!user) {
        socket.emit("error", { message: "You must join first" });
        return;
      }

      // Broadcast audio to all other users in the same classroom
      socket.to(currentRoomId).emit("voice", {
        socketId: socket.id,
        username: user.username,
        audioData: data.audioData,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle voice stream start
    socket.on("voiceStart", () => {
      if (!currentRoomId) return;

      const classroomUsersMap = classroomUsers.get(currentRoomId);
      const user = classroomUsersMap.get(socket.id);
      if (!user) return;

      socket.to(currentRoomId).emit("userVoiceStart", {
        socketId: socket.id,
        username: user.username,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle voice stream end
    socket.on("voiceEnd", () => {
      if (!currentRoomId) return;

      const classroomUsersMap = classroomUsers.get(currentRoomId);
      const user = classroomUsersMap.get(socket.id);
      if (!user) return;

      socket.to(currentRoomId).emit("userVoiceEnd", {
        socketId: socket.id,
        username: user.username,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle user position update (broadcast to all users in classroom)
    socket.on("positionUpdate", (data) => {
      const { position, rotation } = data;

      userPosition = position || userPosition;
      userRotation = rotation || userRotation;

      // Update user position in classroom
      if (currentRoomId && classroomUsers.has(currentRoomId)) {
        const classroomUsersMap = classroomUsers.get(currentRoomId);
        const user = classroomUsersMap.get(socket.id);
        if (user) {
          user.position = userPosition;
          user.rotation = userRotation;
        }

        // Broadcast position update to others in the same classroom
        socket.to(currentRoomId).emit("userPositionUpdate", {
          socketId: socket.id,
          username: userUsername || "Unknown",
          position: userPosition,
          rotation: userRotation,
        });
      }
    });

    // Handle whiteboard image upload
    socket.on("whiteboardImage", (data) => {
      if (!currentRoomId) {
        socket.emit("error", { message: "You must join a classroom first" });
        return;
      }

      const classroomUsersMap = classroomUsers.get(currentRoomId);
      const user = classroomUsersMap?.get(socket.id);
      if (!user) {
        socket.emit("error", { message: "You must join first" });
        return;
      }

      // Store whiteboard state for this classroom
      const whiteboardState = {
        imageUrl: data.imageUrl,
        username: user.username,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      };

      classroomWhiteboards.set(currentRoomId, whiteboardState);

      // Broadcast whiteboard image to all users in this classroom (including sender for sync)
      vrNamespace.to(currentRoomId).emit("whiteboardUpdate", whiteboardState);
      // Also send to sender to ensure sync
      socket.emit("whiteboardUpdate", whiteboardState);

      console.log(
        `[VR] Whiteboard updated by ${user.username} in ${currentRoomId}`
      );
    });

    // Handle chat message
    socket.on("chatMessage", (data) => {
      if (!currentRoomId) {
        socket.emit("error", { message: "You must join a classroom first" });
        return;
      }

      const classroomUsersMap = classroomUsers.get(currentRoomId);
      const user = classroomUsersMap?.get(socket.id);
      if (!user) {
        socket.emit("error", { message: "You must join first" });
        return;
      }

      const messageData = {
        username: user.username,
        message: data.message,
        timestamp: new Date().toISOString(),
      };

      // Store message in classroom history (keep last 100 messages)
      const messages = classroomMessages.get(currentRoomId) || [];
      messages.push(messageData);
      if (messages.length > 100) {
        messages.shift(); // Remove oldest message if over limit
      }
      classroomMessages.set(currentRoomId, messages);

      // Broadcast message to all users in this classroom
      vrNamespace.to(currentRoomId).emit("chatMessage", messageData);

      console.log(
        `[VR] Chat message from ${user.username} in ${currentRoomId}: ${data.message}`
      );
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      if (currentRoomId && classroomUsers.has(currentRoomId)) {
        const classroomUsersMap = classroomUsers.get(currentRoomId);
        const user = classroomUsersMap.get(socket.id);

        if (user) {
          const username = user.username;
          classroomUsersMap.delete(socket.id);

          // Notify other users in the classroom
          socket.to(currentRoomId).emit("userLeft", {
            username: username,
            socketId: socket.id,
            classroomId: currentRoomId,
            timestamp: new Date().toISOString(),
          });

          console.log(
            `[VR] User left: ${username} from ${currentRoomId} (${socket.id}) - Reason: ${reason}`
          );
          console.log(
            `[VR] Total users in ${currentRoomId}: ${classroomUsersMap.size}`
          );
        }
      } else {
        console.log(
          `[VR] Client disconnected: ${socket.id} (${
            userUsername || "unknown"
          }) - Reason: ${reason}`
        );
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`[VR] Socket error for ${socket.id}:`, error);
      socket.emit("error", { message: "An error occurred" });
    });
  });

  return vrNamespace;
};

// REST endpoint to get available classrooms
router.get("/classrooms", (req, res) => {
  const classroomsInfo = CLASSROOMS.map((classroom) => {
    const usersCount = classroomUsers.get(classroom.id)?.size || 0;
    return {
      id: classroom.id,
      name: classroom.name,
      usersCount: usersCount,
    };
  });

  res.json({
    status: "ok",
    classrooms: classroomsInfo,
    timestamp: new Date().toISOString(),
  });
});

// REST endpoint to get VR room info
router.get("/", (req, res) => {
  const classroomId = req.query.classroomId;

  if (classroomId && classroomUsers.has(classroomId)) {
    const classroomUsersMap = classroomUsers.get(classroomId);
    const usersCount = classroomUsersMap.size;
    const users = Array.from(classroomUsersMap.values()).map((u) => ({
      username: u.username,
      joinedAt: u.joinedAt,
    }));

    res.json({
      status: "ok",
      message: `VR room endpoint for ${classroomId}`,
      classroomId: classroomId,
      connectedUsers: usersCount,
      users: users,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.json({
      status: "ok",
      message: "VR room endpoint",
      classrooms: CLASSROOMS.map((c) => ({
        id: c.id,
        name: c.name,
        usersCount: classroomUsers.get(c.id)?.size || 0,
      })),
      timestamp: new Date().toISOString(),
    });
  }
});

// REST endpoint to get connected users list for a classroom
router.get("/users", (req, res) => {
  const classroomId = req.query.classroomId;

  if (!classroomId || !classroomUsers.has(classroomId)) {
    return res.status(400).json({
      status: "error",
      message: "Room ID is required",
    });
  }

  const classroomUsersMap = classroomUsers.get(classroomId);
  const users = Array.from(classroomUsersMap.values()).map((u) => ({
    username: u.username,
    socketId: u.socket.id,
    joinedAt: u.joinedAt,
  }));

  res.json({
    status: "ok",
    classroomId: classroomId,
    users: users,
    count: users.length,
    timestamp: new Date().toISOString(),
  });
});

// Export classrooms for frontend
export { CLASSROOMS };

export default router;

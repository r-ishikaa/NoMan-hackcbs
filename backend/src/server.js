import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import { createServer } from "http";
import { Server } from "socket.io";
import os from "os";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import profileRoutes from "./routes/profiles.js";
import followRoutes from "./routes/follow.js";
import likeRoutes from "./routes/likes.js";
import commentRoutes from "./routes/comments.js";
import postRoutes from "./routes/posts.js";
import courseRoutes from "./routes/courses.js";
import enrollmentRoutes from "./routes/enrollments.js";
import reelsRoutes from "./routes/reels.js";
import reelsRouter from "./routes/reels.js";
import courseReviewRoutes from "./routes/courseReviews.js";
import assignmentRoutes from "./routes/assignments.js";
import notificationsRoutes from "./routes/notifications.js";
import pushRoutes from "./routes/push.js";
import vrRoutes, { setupVRSocket } from "./routes/vr.js";
import analyticsRoutes from "./routes/analytics.js";
import paymentsRoutes from "./routes/payments.js";
import communityRoutes from "./routes/communities.js";
import periodRoutes from "./routes/periods.js";
import { setupNotificationsSocket } from "./sockets/notifications.js";
import { setNotificationsSocket } from "./utils/notificationBroadcaster.js";
import { setupRandomVideoSocket } from "./sockets/randomVideo.js";
import { initRedis, closeRedis } from "./config/redis.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5003; // Different port from FastAPI

// Initialize Socket.IO with permissive CORS for local development
const socketIOCorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hexagon-eran.vercel.app",
      "https://hexagon-steel.vercel.app",
      "https://hexagon.vercel.app",
    ];

    // In development, allow local network IPs
    if (process.env.NODE_ENV !== "production") {
      const localNetworkRegex =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/;
      if (localNetworkRegex.test(origin)) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST"],
};

const io = new Server(httpServer, {
  cors: socketIOCorsOptions,
  transports: ["websocket", "polling"],
});

// Setup VR Socket.IO namespace
setupVRSocket(io);

// Setup Notifications Socket.IO namespace
const notificationsSocket = setupNotificationsSocket(io);
setNotificationsSocket(notificationsSocket);

// Setup Random Video Call Socket.IO namespace
setupRandomVideoSocket(io);

// Trust proxy for Vercel deployment
app.set("trust proxy", 1);

// Security middleware (allow cross-origin images for frontend rendering)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS must be BEFORE rate limiting so errors still include CORS headers
// More permissive CORS for local development to allow network connections
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hexagon-eran.vercel.app",
      "https://hexagon-steel.vercel.app",
      "https://hexagon.vercel.app",
    ];

    // In development, allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (process.env.NODE_ENV !== "production") {
      const localNetworkRegex =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/;
      if (localNetworkRegex.test(origin)) {
        return callback(null, true);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Rate limiting (after CORS so 429 responses still have ACAO)
// More lenient rate limiter for auth routes
// In development, allow more requests; in production, be stricter
const isDevelopment = process.env.NODE_ENV !== "production";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 50, // More lenient in development
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// General rate limiter for other routes (skips /auth routes and critical user endpoints)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 500, // Very lenient in development
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for:
    // 1. Auth routes (they have their own limiter)
    // 2. User profile endpoints (critical for app functionality)
    // 3. Static assets
    const skipPaths = [
      "/auth",
      "/users/me",
      "/users/search",
      "/profiles",
      "/uploads",
    ];
    return skipPaths.some((path) => req.path.startsWith(path));
  },
});

// Apply auth rate limiter to auth routes first
app.use("/auth", authLimiter);
// Apply general rate limiter to all other routes
app.use(limiter);
// After your cors() middleware, add:
app.options("*", cors());
// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files for uploads
app.use("/uploads", express.static("uploads"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/hexagon",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;

    if (!mongoUrl) {
      console.error("MONGO_URL environment variable is not set");
      process.exit(1);
    }

    // Validate MongoDB URL format
    if (
      !mongoUrl.startsWith("mongodb://") &&
      !mongoUrl.startsWith("mongodb+srv://")
    ) {
      console.error("Invalid MongoDB URL format:", mongoUrl);
      console.error("URL must start with 'mongodb://' or 'mongodb+srv://'");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Ensure DB is connected in serverless environments BEFORE routes
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB().catch(next);
  }
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/profiles", profileRoutes);
app.use("/follow", followRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/posts", postRoutes);
app.use("/courses", courseRoutes);
app.use("/enrollments", enrollmentRoutes);
app.use("/reels", reelsRoutes);
app.use("/course-reviews", courseReviewRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/push", pushRoutes);
app.use("/vr", vrRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/payments", paymentsRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/periods", periodRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Hexagon Node.js Backend is running",
    version: "1.0.1",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// (moved DB ensure middleware above routes)

// Get local network IP address
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
};

// Start server only when not running on Vercel serverless
const startServer = async () => {
  await connectDB();

  // Initialize Redis (non-blocking - app works without Redis)
  initRedis().catch((err) => {
    console.warn(
      "[Redis] Failed to connect, continuing without cache:",
      err.message
    );
  });

  // Listen on all interfaces (0.0.0.0) to allow network connections
  httpServer.listen(PORT, "0.0.0.0", () => {
    const localIP = getLocalIP();
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}`);
    console.log(`🎮 VR Socket.IO endpoint: http://localhost:${PORT}/vr`);
    console.log(`\n🌐 Network Access:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${localIP}:${PORT}`);
    console.log(`   VR Room: http://${localIP}:${PORT}/vr`);
    console.log(
      `\n💡 For other devices on your network, use: http://${localIP}:${PORT}\n`
    );
  });
};

if (!process.env.VERCEL) {
  startServer().catch(console.error);

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("\n🛑 SIGTERM signal received: closing HTTP server");
    await closeRedis();
    httpServer.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("\n🛑 SIGINT signal received: closing HTTP server");
    await closeRedis();
    httpServer.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });
  });
}

// Export io for potential use in other modules
export { io };

export default app;

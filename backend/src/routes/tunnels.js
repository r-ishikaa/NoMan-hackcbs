import express from "express";
import { body, param, validationResult } from "express-validator";
import LiveTunnel from "../models/LiveTunnel.js";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import crypto from "crypto";

const router = express.Router();

// Tunnel service configuration
const TUNNEL_SERVICE_URL =
  process.env.TUNNEL_SERVICE_URL || "http://localhost:8001";
const TUNNEL_SECRET_KEY =
  process.env.TUNNEL_SECRET_KEY || "your-secret-key-change-in-production";

/**
 * @route   POST /api/tunnels/create
 * @desc    Create a new tunnel (returns SSH command for creator)
 * @access  Private
 */
router.post(
  "/create",
  authenticateToken,
  [
    body("projectName")
      .trim()
      .notEmpty()
      .withMessage("Project name is required")
      .isLength({ min: 3, max: 50 })
      .withMessage("Project name must be 3-50 characters")
      .matches(/^[a-zA-Z0-9-_]+$/)
      .withMessage(
        "Project name can only contain letters, numbers, hyphens, and underscores"
      ),
    body("localPort")
      .isInt({ min: 1, max: 65535 })
      .withMessage("Local port must be between 1 and 65535"),
    body("description").optional().trim().isLength({ max: 500 }),
    body("tags").optional().isArray(),
    body("framework").optional().trim(),
    body("language").optional().trim(),
    body("category").optional().trim(),
    body("isPublic").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.userId;
      const {
        projectName,
        localPort,
        description,
        tags,
        framework,
        language,
        category,
        isPublic,
      } = req.body;

      // Get user info
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has an active tunnel with this project name
      const existingTunnel = await LiveTunnel.findOne({
        userId,
        projectName,
        status: "active",
      });

      if (existingTunnel) {
        return res.status(400).json({
          error: "You already have an active tunnel with this project name",
          tunnel: existingTunnel,
        });
      }

      // Check user's tunnel limit (free tier: 1, pro: 5)
      const userTier = user.role === "creator" ? "pro" : "free";
      const maxTunnels = userTier === "pro" ? 5 : 1;
      const activeTunnels = await LiveTunnel.countDocuments({
        userId,
        status: "active",
      });

      if (activeTunnels >= maxTunnels) {
        return res.status(403).json({
          error: `You have reached your tunnel limit (${maxTunnels} for ${userTier} tier)`,
          upgrade:
            userTier === "free" ? "Upgrade to Pro for more tunnels" : null,
        });
      }

      // Generate unique tunnel ID
      const tunnelId = `tunnel_${userId}_${Date.now()}_${crypto
        .randomBytes(4)
        .toString("hex")}`;

      // Determine max viewers based on tier
      const maxViewers = userTier === "pro" ? 1000 : 10;

      // Create tunnel record in database
      const tunnel = new LiveTunnel({
        tunnelId,
        userId,
        username: user.username,
        projectName,
        description: description || "",
        tags: tags || [],
        localPort,
        remotePort: 0, // Will be assigned by tunnel service
        publicUrl: "", // Will be set by webhook
        status: "active",
        tier: userTier,
        maxViewers,
        metadata: {
          framework,
          language,
          category,
        },
        isPublic: isPublic !== undefined ? isPublic : true,
      });

      await tunnel.save();

      // Generate SSH command for creator
      const sshHost = process.env.SSH_HOST || "localhost";
      const sshPort = process.env.SSH_PORT || 2222;
      const sshUsername = `${userId}:${tunnelId}:${projectName}`;
      const sshPassword = `${localPort}:${TUNNEL_SECRET_KEY}`;

      const sshCommand = `ssh -R 0:localhost:${localPort} ${sshUsername}@${sshHost} -p ${sshPort}`;

      res.status(201).json({
        message: "Tunnel created successfully",
        tunnel: {
          tunnelId: tunnel.tunnelId,
          projectName: tunnel.projectName,
          status: tunnel.status,
          tier: tunnel.tier,
          maxViewers: tunnel.maxViewers,
        },
        connection: {
          sshCommand,
          sshHost,
          sshPort,
          sshUsername,
          sshPassword,
          localPort,
        },
        instructions: [
          "1. Run the SSH command in your terminal",
          "2. Enter the password when prompted",
          "3. Keep the terminal open while sharing",
          "4. Your project will be accessible at the public URL",
        ],
      });
    } catch (error) {
      console.error("Error creating tunnel:", error);
      res.status(500).json({ error: "Failed to create tunnel" });
    }
  }
);

/**
 * @route   GET /api/tunnels/my-tunnels
 * @desc    Get current user's tunnels
 * @access  Private
 */
router.get("/my-tunnels", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = req.query.status || "active";

    const query = { userId };
    if (status !== "all") {
      query.status = status;
    }

    const tunnels = await LiveTunnel.find(query).sort({ startedAt: -1 });

    res.json({
      tunnels,
      count: tunnels.length,
    });
  } catch (error) {
    console.error("Error fetching user tunnels:", error);
    res.status(500).json({ error: "Failed to fetch tunnels" });
  }
});

/**
 * @route   GET /api/tunnels/discover
 * @desc    Discover public active tunnels
 * @access  Public
 */
router.get("/discover", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search = req.query.search;

    const query = { status: "active", isPublic: true };

    if (category) {
      query["metadata.category"] = category;
    }

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const tunnels = await LiveTunnel.find(query)
      .populate("userId", "username profilePicture bio")
      .sort({ "stats.viewersCount": -1, startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await LiveTunnel.countDocuments(query);

    res.json({
      tunnels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error discovering tunnels:", error);
    res.status(500).json({ error: "Failed to discover tunnels" });
  }
});

/**
 * @route   GET /api/tunnels/:tunnelId
 * @desc    Get tunnel details
 * @access  Public
 */
router.get("/:tunnelId", async (req, res) => {
  try {
    const { tunnelId } = req.params;

    const tunnel = await LiveTunnel.findOne({ tunnelId }).populate(
      "userId",
      "username profilePicture bio"
    );

    if (!tunnel) {
      return res.status(404).json({ error: "Tunnel not found" });
    }

    // Check if tunnel is public or user has access
    if (!tunnel.isPublic) {
      if (!req.user || req.user.userId !== tunnel.userId.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.json({ tunnel });
  } catch (error) {
    console.error("Error fetching tunnel:", error);
    res.status(500).json({ error: "Failed to fetch tunnel" });
  }
});

/**
 * @route   GET /api/tunnels/user/:username/:projectName
 * @desc    Get tunnel by username and project name
 * @access  Public
 */
router.get("/user/:username/:projectName", async (req, res) => {
  try {
    const { username, projectName } = req.params;

    const tunnel = await LiveTunnel.findOne({
      username,
      projectName,
      status: "active",
    }).populate("userId", "username profilePicture bio");

    if (!tunnel) {
      return res.status(404).json({ error: "Tunnel not found or offline" });
    }

    if (!tunnel.isPublic) {
      if (!req.user || req.user.userId !== tunnel.userId.toString()) {
        return res.status(403).json({ error: "This tunnel is private" });
      }
    }

    res.json({ tunnel });
  } catch (error) {
    console.error("Error fetching tunnel:", error);
    res.status(500).json({ error: "Failed to fetch tunnel" });
  }
});

/**
 * @route   DELETE /api/tunnels/:tunnelId
 * @desc    Close a tunnel
 * @access  Private (owner only)
 */
router.delete("/:tunnelId", authenticateToken, async (req, res) => {
  try {
    const { tunnelId } = req.params;
    const userId = req.user.userId;

    const tunnel = await LiveTunnel.findOne({ tunnelId });

    if (!tunnel) {
      return res.status(404).json({ error: "Tunnel not found" });
    }

    // Check ownership
    if (tunnel.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only close your own tunnels" });
    }

    // End the tunnel
    await tunnel.endTunnel();

    // Notify tunnel service to close SSH connection
    try {
      await fetch(`${TUNNEL_SERVICE_URL}/tunnels/${tunnelId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to notify tunnel service:", err);
    }

    res.json({
      message: "Tunnel closed successfully",
      tunnel: {
        tunnelId: tunnel.tunnelId,
        status: tunnel.status,
        stats: tunnel.stats,
      },
    });
  } catch (error) {
    console.error("Error closing tunnel:", error);
    res.status(500).json({ error: "Failed to close tunnel" });
  }
});

/**
 * @route   POST /api/tunnels/:tunnelId/join
 * @desc    Join a tunnel as a viewer
 * @access  Private
 */
router.post("/:tunnelId/join", authenticateToken, async (req, res) => {
  try {
    const { tunnelId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const tunnel = await LiveTunnel.findOne({ tunnelId, status: "active" });

    if (!tunnel) {
      return res.status(404).json({ error: "Tunnel not found or offline" });
    }

    // Check viewer limit
    if (tunnel.stats.viewersCount >= tunnel.maxViewers) {
      return res.status(403).json({
        error: `Viewer limit reached (${tunnel.maxViewers} viewers)`,
      });
    }

    // Add viewer
    await tunnel.addViewer(userId, user.username);

    // Notify tunnel service
    try {
      await fetch(
        `${TUNNEL_SERVICE_URL}/tunnels/${tunnelId}/viewers/${userId}`,
        {
          method: "POST",
        }
      );
    } catch (err) {
      console.error("Failed to notify tunnel service:", err);
    }

    res.json({
      message: "Joined tunnel successfully",
      tunnel: {
        tunnelId: tunnel.tunnelId,
        publicUrl: tunnel.publicUrl,
        viewersCount: tunnel.stats.viewersCount,
      },
    });
  } catch (error) {
    console.error("Error joining tunnel:", error);
    res.status(500).json({ error: "Failed to join tunnel" });
  }
});

/**
 * @route   POST /api/tunnels/:tunnelId/leave
 * @desc    Leave a tunnel as a viewer
 * @access  Private
 */
router.post("/:tunnelId/leave", authenticateToken, async (req, res) => {
  try {
    const { tunnelId } = req.params;
    const userId = req.user.userId;

    const tunnel = await LiveTunnel.findOne({ tunnelId });

    if (!tunnel) {
      return res.status(404).json({ error: "Tunnel not found" });
    }

    // Remove viewer
    await tunnel.removeViewer(userId);

    // Notify tunnel service
    try {
      await fetch(
        `${TUNNEL_SERVICE_URL}/tunnels/${tunnelId}/viewers/${userId}`,
        {
          method: "DELETE",
        }
      );
    } catch (err) {
      console.error("Failed to notify tunnel service:", err);
    }

    res.json({
      message: "Left tunnel successfully",
      viewersCount: tunnel.stats.viewersCount,
    });
  } catch (error) {
    console.error("Error leaving tunnel:", error);
    res.status(500).json({ error: "Failed to leave tunnel" });
  }
});

/**
 * @route   POST /api/tunnels/webhook/created
 * @desc    Webhook from tunnel service when tunnel is created
 * @access  Internal (tunnel service only)
 */
router.post("/webhook/created", async (req, res) => {
  try {
    const {
      tunnel_id,
      user_id,
      username,
      project_name,
      remote_port,
      public_url,
    } = req.body;

    const tunnel = await LiveTunnel.findOne({ tunnelId: tunnel_id });

    if (tunnel) {
      tunnel.remotePort = remote_port;
      tunnel.publicUrl = public_url;
      tunnel.status = "active";
      await tunnel.save();

      console.log(`✅ Tunnel ${tunnel_id} activated: ${public_url}`);
    }

    res.json({ message: "Webhook received" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * @route   POST /api/tunnels/webhook/closed
 * @desc    Webhook from tunnel service when tunnel is closed
 * @access  Internal (tunnel service only)
 */
router.post("/webhook/closed", async (req, res) => {
  try {
    const { tunnel_id, stats } = req.body;

    const tunnel = await LiveTunnel.findOne({ tunnelId: tunnel_id });

    if (tunnel) {
      tunnel.status = "inactive";
      tunnel.endedAt = new Date();
      tunnel.currentViewers = [];

      if (stats) {
        tunnel.stats.bytesTransferred = stats.bytes_transferred || 0;
        tunnel.stats.requestsCount = stats.requests_count || 0;
        tunnel.stats.viewersCount = 0;
      }

      await tunnel.save();

      console.log(`🛑 Tunnel ${tunnel_id} closed`);
    }

    res.json({ message: "Webhook received" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Cleanup expired tunnels (run periodically)
setInterval(async () => {
  try {
    const result = await LiveTunnel.cleanupExpiredTunnels();
    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${result.modifiedCount} expired tunnels`);
    }
  } catch (error) {
    console.error("Error cleaning up expired tunnels:", error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

export default router;

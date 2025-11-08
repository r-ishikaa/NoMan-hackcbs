import express from "express";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendPushNotification } from "./push.js";
import { broadcastNotification } from "../utils/notificationBroadcaster.js";
import { cacheGet, cacheDel } from "../config/redis.js";
import { publishEvent, KAFKA_TOPICS, EVENT_TYPES } from "../config/kafka.js";

const router = express.Router();

// Minimal placeholder stats endpoint for new profile UI
// GET /follow/stats?accountId=<id>
router.get("/stats", async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) return res.json({ followers: 0, following: 0 });

    const cacheKey = `follow:stats:${accountId}`;

    // Try to get from cache, or fetch from database
    const stats = await cacheGet(
      cacheKey,
      async () => {
        const followers = await Follow.countDocuments({
          followingId: String(accountId),
        });
        const following = await Follow.countDocuments({
          followerId: String(accountId),
        });
        return { followers, following };
      },
      60 // Cache for 1 minute (frequently updated)
    );

    res.json(stats);
  } catch (err) {
    console.error("follow stats error:", err);
    res.status(500).json({ followers: 0, following: 0 });
  }
});

// GET /follow/status?followerId=&followingId=
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const followerId = String(req.query.followerId || req.user._id);
    const followingId = String(req.query.followingId || "");
    if (!followingId)
      return res.status(400).json({ error: "followingId required" });
    const exists = await Follow.findOne({ followerId, followingId });
    res.json({ following: !!exists });
  } catch (err) {
    console.error("follow status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /follow { followingId }  (follower inferred from token)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const followerId = String(req.user._id);
    const followingId = String(req.body?.followingId || "");
    if (!followingId)
      return res.status(400).json({ error: "followingId required" });
    if (followerId === followingId)
      return res.status(400).json({ error: "cannot follow self" });

    // Check if already following
    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      return res.status(200).json({ ok: true, alreadyFollowing: true });
    }

    await Follow.findOneAndUpdate(
      { followerId, followingId },
      { $setOnInsert: { followerId, followingId } },
      { upsert: true, new: true }
    );

    // 🚀 Publish event to Kafka for async processing
    try {
      const follower = await User.findById(followerId).select("username");
      const username = follower?.username || "Someone";

      await publishEvent(KAFKA_TOPICS.USER_EVENTS, {
        eventType: EVENT_TYPES.USER_FOLLOWED,
        followerId: followerId,
        followingId: followingId,
        username: username,
        timestamp: Date.now(),
      });

      console.log(`[Kafka] ✅ Published USER_FOLLOWED event`);
    } catch (kafkaError) {
      console.error(
        "[Kafka] Failed to publish USER_FOLLOWED event:",
        kafkaError
      );
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("follow create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /follow { followingId }
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const followerId = String(req.user._id);
    const followingId = String(
      req.body?.followingId || req.query.followingId || ""
    );
    if (!followingId)
      return res.status(400).json({ error: "followingId required" });
    await Follow.deleteOne({ followerId, followingId });

    // Invalidate follow stats cache for both users
    await Promise.all([
      cacheDel(`follow:stats:${followerId}`),
      cacheDel(`follow:stats:${followingId}`),
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("follow delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

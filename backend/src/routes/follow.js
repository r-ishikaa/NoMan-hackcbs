import express from "express";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendPushNotification } from "./push.js";
import { broadcastNotification } from "../utils/notificationBroadcaster.js";

const router = express.Router();

// Minimal placeholder stats endpoint for new profile UI
// GET /follow/stats?accountId=<id>
router.get("/stats", async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) return res.json({ followers: 0, following: 0 });
    const followers = await Follow.countDocuments({
      followingId: String(accountId),
    });
    const following = await Follow.countDocuments({
      followerId: String(accountId),
    });
    res.json({ followers, following });
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

    // Send notification to the user being followed
    try {
      const follower = await User.findById(followerId).select("username");
      const username = follower?.username || "Someone";

      console.log(
        `[Follow Notification] User ${followerId} (${username}) followed user ${followingId}`
      );

      const notification = await Notification.create({
        recipientId: followingId,
        type: "follow",
        message: `${username} started following you.`,
        relatedUserId: followerId,
        relatedUsername: username,
        relatedPostId: "",
        relatedReelId: "",
      });

      console.log(
        `[Follow Notification] Created notification in database: ${notification._id}`
      );

      // Send via WebSocket (real-time)
      try {
        broadcastNotification(
          followingId,
          notification.toObject ? notification.toObject() : notification
        );
        console.log(
          `[Follow Notification] Sent WebSocket notification to user ${followingId}`
        );
      } catch (wsError) {
        console.error(
          `[Follow Notification] WebSocket error for user ${followingId}:`,
          wsError
        );
      }

      // Send web push notification
      try {
        await sendPushNotification(followingId, {
          title: "New Follower",
          body: `${username} started following you.`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: {
            url: `/profile/${followerId}`,
            userId: followerId,
          },
        });
        console.log(
          `[Follow Notification] Sent push notification to user ${followingId}`
        );
      } catch (pushErr) {
        console.error(
          `[Follow Notification] Push notification error for user ${followingId}:`,
          pushErr
        );
      }
    } catch (notifErr) {
      console.error("[Follow Notification] Error:", notifErr);
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
    res.json({ ok: true });
  } catch (err) {
    console.error("follow delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

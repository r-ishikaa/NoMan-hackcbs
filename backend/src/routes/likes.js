import express from "express";
import Like from "../models/Like.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /likes?count=1&targetType=post&targetId=... [&accountId=...]
router.get("/", async (req, res) => {
  try {
    const { targetType, targetId, accountId, count } = req.query;
    if (!targetType || !targetId) {
      return res
        .status(400)
        .json({ error: "targetType and targetId are required" });
    }
    const filter = {
      targetType: String(targetType),
      targetId: String(targetId),
    };
    if (accountId) filter.accountId = String(accountId);
    if (String(count) === "1") {
      const c = await Like.countDocuments(filter);
      return res.json({ count: c });
    }
    const list = await Like.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(list);
  } catch (err) {
    console.error("likes GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /likes { targetType, targetId, accountId }
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { targetType, targetId, accountId } = req.body || {};
    if (!targetType || !targetId || !accountId) {
      return res
        .status(400)
        .json({ error: "targetType, targetId, accountId required" });
    }
    // ensure accountId matches token when available
    if (req.user?._id && String(req.user._id) !== String(accountId)) {
      return res.status(403).json({ error: "account mismatch" });
    }
    // Check if like already exists
    const existing = await Like.findOne({ targetType, targetId, accountId });
    const isNewLike = !existing;
    
    const created = await Like.findOneAndUpdate(
      { targetType, targetId, accountId },
      { $setOnInsert: { targetType, targetId, accountId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    // Send notification if this is a new like
    if (isNewLike) {
      try {
        const Notification = (await import("../models/Notification.js")).default;
        const User = (await import("../models/User.js")).default;
        const Post = (await import("../models/Post.js")).default;
        const Reel = (await import("../models/Reel.js")).default;
        const { broadcastNotification } = await import("../utils/notificationBroadcaster.js");
        const { sendPushNotification } = await import("./push.js");
        
        const liker = await User.findById(accountId).select("username");
        const username = liker?.username || "Someone";
        
        // Handle post likes
        if (targetType === "post") {
          const post = await Post.findById(targetId);
          if (post && String(post.accountId) !== String(accountId)) {
            const notification = await Notification.create({
              recipientId: String(post.accountId),
              type: "like",
              message: `${username} liked your post.`,
              relatedUserId: accountId,
              relatedUsername: username,
              relatedPostId: String(targetId),
              relatedReelId: "",
            });
            
            // Send via WebSocket
            broadcastNotification(String(post.accountId), notification.toObject ? notification.toObject() : notification);
            
            // Send web push notification
            sendPushNotification(String(post.accountId), {
              title: "New Like",
              body: `${username} liked your post.`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              data: {
                url: `/profile`,
                postId: String(targetId),
              },
            }).catch((err) => {
              console.error(`[Like Notification] Push notification error:`, err);
            });
            
            console.log(`[Like Notification] Sent notification for post like to ${post.accountId}`);
          }
        }
        // Handle reel likes (if using the Like model for reels)
        else if (targetType === "reel") {
          const reel = await Reel.findById(targetId);
          if (reel && String(reel.author) !== String(accountId)) {
            const notification = await Notification.create({
              recipientId: String(reel.author),
              type: "like",
              message: `${username} liked your reel.`,
              relatedUserId: accountId,
              relatedUsername: username,
              relatedPostId: "",
              relatedReelId: String(targetId),
            });
            
            // Send via WebSocket
            broadcastNotification(String(reel.author), notification.toObject ? notification.toObject() : notification);
            
            // Send web push notification
            sendPushNotification(String(reel.author), {
              title: "New Like",
              body: `${username} liked your reel.`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              data: {
                url: `/reels`,
                reelId: String(targetId),
              },
            }).catch((err) => {
              console.error(`[Like Notification] Push notification error:`, err);
            });
            
            console.log(`[Like Notification] Sent notification for reel like to ${reel.author}`);
          }
        }
      } catch (notifErr) {
        console.error("[Like Notification] Error:", notifErr);
      }
    }
    
    return res.status(201).json(created);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(200).json({ message: "already liked" });
    }
    console.error("likes POST error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /likes { targetType, targetId } - Unlike (dislike)
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const { targetType, targetId } = req.body || req.query || {};
    if (!targetType || !targetId) {
      return res.status(400).json({ error: "targetType and targetId required" });
    }
    const accountId = String(req.user._id);
    await Like.deleteOne({ targetType, targetId, accountId });
    res.json({ ok: true });
  } catch (err) {
    console.error("likes DELETE error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import express from "express";
import Comment from "../models/Comment.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /comments?targetType=post&targetId=... [&count=1]
router.get("/", async (req, res) => {
  try {
    const { targetType, targetId, count } = req.query;
    if (!targetType || !targetId) {
      return res
        .status(400)
        .json({ error: "targetType and targetId are required" });
    }
    const filter = {
      targetType: String(targetType),
      targetId: String(targetId),
    };
    if (String(count) === "1") {
      const c = await Comment.countDocuments(filter);
      return res.json({ count: c });
    }
    const list = await Comment.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(list);
  } catch (err) {
    console.error("comments GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /comments { targetType, targetId, accountId, content }
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { targetType, targetId, accountId, content } = req.body || {};
    if (!targetType || !targetId || !accountId || !content) {
      return res
        .status(400)
        .json({ error: "targetType, targetId, accountId, content required" });
    }
    if (req.user?._id && String(req.user._id) !== String(accountId)) {
      return res.status(403).json({ error: "account mismatch" });
    }
    const created = await Comment.create({
      targetType,
      targetId,
      accountId,
      content: String(content).slice(0, 1000),
    });
    
    // Send notification for comments
    try {
      const Notification = (await import("../models/Notification.js")).default;
      const User = (await import("../models/User.js")).default;
      const Post = (await import("../models/Post.js")).default;
      const Reel = (await import("../models/Reel.js")).default;
      const { broadcastNotification } = await import("../utils/notificationBroadcaster.js");
      const { sendPushNotification } = await import("./push.js");
      
      const commenter = await User.findById(accountId).select("username");
      const username = commenter?.username || "Someone";
      
      // Handle post comments
      if (targetType === "post") {
        const post = await Post.findById(targetId);
        if (post && String(post.accountId) !== String(accountId)) {
          const notification = await Notification.create({
            recipientId: String(post.accountId),
            type: "comment",
            message: `${username} commented on your post.`,
            relatedUserId: accountId,
            relatedUsername: username,
            relatedPostId: String(targetId),
            relatedReelId: "",
          });
          
          // Send via WebSocket
          broadcastNotification(String(post.accountId), notification.toObject ? notification.toObject() : notification);
          
          // Send web push notification
          sendPushNotification(String(post.accountId), {
            title: "New Comment",
            body: `${username} commented on your post.`,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
              url: `/profile`,
              postId: String(targetId),
            },
          }).catch((err) => {
            console.error(`[Comment Notification] Push notification error:`, err);
          });
          
          console.log(`[Comment Notification] Sent notification for post comment to ${post.accountId}`);
        }
      }
      // Handle reel comments
      else if (targetType === "reel") {
        const reel = await Reel.findById(targetId);
        if (reel && String(reel.author) !== String(accountId)) {
          const notification = await Notification.create({
            recipientId: String(reel.author),
            type: "comment",
            message: `${username} commented on your reel.`,
            relatedUserId: accountId,
            relatedUsername: username,
            relatedPostId: "",
            relatedReelId: String(targetId),
          });
          
          // Send via WebSocket
          broadcastNotification(String(reel.author), notification.toObject ? notification.toObject() : notification);
          
          // Send web push notification
          sendPushNotification(String(reel.author), {
            title: "New Comment",
            body: `${username} commented on your reel.`,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
              url: `/reels`,
              reelId: String(targetId),
            },
          }).catch((err) => {
            console.error(`[Comment Notification] Push notification error:`, err);
          });
          
          console.log(`[Comment Notification] Sent notification for reel comment to ${reel.author}`);
        }
      }
    } catch (notifErr) {
      console.error("[Comment Notification] Error:", notifErr);
    }
    
    res.status(201).json(created);
  } catch (err) {
    console.error("comments POST error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

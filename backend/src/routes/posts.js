import express from "express";
import multer from "multer";
import Post from "../models/Post.js";
import { authenticateToken } from "../middleware/auth.js";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPushNotification } from "./push.js";
import { broadcastNotification } from "../utils/notificationBroadcaster.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
});

// GET /posts?accountId=<id>
router.get("/", async (req, res) => {
  try {
    const { accountId } = req.query;
    const filter = {};
    if (accountId) filter.accountId = String(accountId);
    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(100);
    // Convert images to URL references
    const mapped = posts.map((p) => ({
      _id: String(p._id),
      id: String(p._id),
      accountId: p.accountId,
      content: p.content,
      images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
      likes: p.likesCount,
      comments: p.commentsCount,
      fundingTotal: p.fundingTotal || 0,
      fundingCount: p.fundingCount || 0,
      createdAt: p.createdAt,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("posts GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /posts/following - Get posts from users you follow (requires auth)
router.get("/following", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user._id);

    // Get list of users being followed
    const follows = await Follow.find({ followerId: userId }).select("followingId");
    const followingIds = follows.map((f) => String(f.followingId));

    if (followingIds.length === 0) {
      return res.json([]);
    }

    // Get posts from followed users
    const posts = await Post.find({
      accountId: { $in: followingIds },
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // Convert images to URL references
    const mapped = posts.map((p) => ({
      _id: String(p._id),
      id: String(p._id),
      accountId: p.accountId,
      content: p.content,
      images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
      likes: p.likesCount,
      comments: p.commentsCount,
      fundingTotal: p.fundingTotal || 0,
      fundingCount: p.fundingCount || 0,
      createdAt: p.createdAt,
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error("posts following GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /posts (multipart/form-data) fields: content, images[]
router.post(
  "/",
  authenticateToken,
  upload.array("images", 6),
  async (req, res) => {
    try {
      const accountId = String(req.user._id);
      const content = String(req.body.content || "").slice(0, 5000);
      const images = (req.files || []).map((f) => ({
        filename: f.originalname,
        contentType: f.mimetype,
        data: f.buffer.toString("base64"),
        size: f.size,
      }));
      const post = await Post.create({ accountId, content, images });

      // Notify followers asynchronously (no await for each to keep latency low)
      try {
        // Get the poster's username
        const poster = await User.findById(accountId).select("username");
        const username = poster?.username || "Someone";
        
        const followers = await Follow.find({ followingId: accountId }).select("followerId");
        console.log(`[Post Notification] User ${accountId} (${username}) posted. Found ${followers.length} followers.`);
        
        if (followers.length === 0) {
          console.log(`[Post Notification] No followers found for user ${accountId}`);
        } else {
          const bulk = followers.map((f) => ({
            recipientId: String(f.followerId),
            type: "new_post",
            message: `${username} posted something new.`,
            relatedUserId: accountId,
            relatedUsername: username,
            relatedPostId: String(post._id),
            relatedReelId: "",
          }));
          
          try {
            const notifications = await Notification.insertMany(bulk, { ordered: false });
            console.log(`[Post Notification] Created ${notifications.length} notifications in database.`);
            
            // Send notifications via WebSocket and web push
            for (let i = 0; i < followers.length; i++) {
              const followerId = String(followers[i].followerId);
              const notification = notifications[i];
              
              if (!notification) {
                console.warn(`[Post Notification] No notification found for follower ${followerId} at index ${i}`);
                continue;
              }
              
              // Send via WebSocket (real-time)
              try {
                // Convert Mongoose document to plain object for WebSocket
                const notificationObj = notification.toObject ? notification.toObject() : notification;
                broadcastNotification(followerId, notificationObj);
                console.log(`[Post Notification] Sent WebSocket notification to user ${followerId}`);
              } catch (wsError) {
                console.error(`[Post Notification] WebSocket error for user ${followerId}:`, wsError);
              }
              
              // Send web push notification
              sendPushNotification(followerId, {
                title: "New Post",
                body: `${username} posted something new.`,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                data: {
                  url: `/profile`,
                  postId: String(post._id),
                },
              }).catch((err) => {
                console.error(`[Post Notification] Push notification error for user ${followerId}:`, err);
              });
            }
          } catch (insertError) {
            console.error("[Post Notification] Error inserting notifications:", insertError);
            // If bulk insert fails, try inserting one by one
            console.log("[Post Notification] Attempting individual notification insertion...");
            for (const notifData of bulk) {
              try {
                const notif = await Notification.create(notifData);
                const followerId = notifData.recipientId;
                broadcastNotification(followerId, notif.toObject ? notif.toObject() : notif);
                console.log(`[Post Notification] Created and sent notification to user ${followerId}`);
              } catch (individualError) {
                console.error(`[Post Notification] Failed to create notification for ${notifData.recipientId}:`, individualError);
              }
            }
          }
        }
      } catch (e) {
        console.error("[Post Notification] notify followers error:", e?.message || e);
        console.error("[Post Notification] Stack trace:", e?.stack);
      }
      res.status(201).json({
        _id: String(post._id),
        id: String(post._id),
        accountId: post.accountId,
        content: post.content,
        images: (post.images || []).map(
          (_, idx) => `/posts/image/${post._id}/${idx}`
        ),
        likes: post.likesCount,
        comments: post.commentsCount,
        fundingTotal: post.fundingTotal || 0,
        fundingCount: post.fundingCount || 0,
        createdAt: post.createdAt,
      });
    } catch (err) {
      console.error("posts POST error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /posts/image/:postId/:index
router.get("/image/:postId/:index", async (req, res) => {
  try {
    const { postId, index } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).send();
    const idx = Number(index);
    const img = post.images?.[idx];
    if (!img) return res.status(404).send();
    const buffer = Buffer.from(img.data, "base64");
    res.set({
      "Content-Type": img.contentType || "application/octet-stream",
      "Content-Length": buffer.length,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    res.send(buffer);
  } catch (err) {
    console.error("posts image GET error:", err);
    res.status(500).send();
  }
});

// Optional: DELETE /posts/:id (owner only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Not found" });
    if (String(post.accountId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await Post.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (err) {
    console.error("posts DELETE error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

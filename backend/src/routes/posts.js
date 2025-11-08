import express from "express";
import multer from "multer";
import mongoose from "mongoose";
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

/* ============================================================
   ✅ GET /posts 
   Supports optional filters: accountId, community
============================================================ */
router.get("/", async (req, res) => {
  try {
    const { accountId, community } = req.query;

    // Build filters dynamically
    const filter = {};
    if (accountId) filter.accountId = String(accountId);
    if (community) {
      // Support both ObjectId strings and regular strings
      filter.community = mongoose.Types.ObjectId.isValid(community) 
        ? new mongoose.Types.ObjectId(community)
        : String(community);
    }
    
    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(100);
    
    // Fetch user profiles for all posts in parallel to get author information
    const userIds = [...new Set(posts.map((p) => p.accountId).filter(Boolean))];
    let userMap = new Map();
    if (userIds.length > 0) {
      try {
        // Convert userIds to ObjectIds if they're valid ObjectId strings
        const validUserIds = userIds
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
        
        if (validUserIds.length > 0) {
          const users = await User.find({ _id: { $in: validUserIds } }).select(
            "username profile.full_name profile.avatar"
          );
          userMap = new Map(
            users.map((u) => [
              String(u._id),
              {
                name: u.profile?.full_name || u.username || "Anonymous",
                username: u.username,
                avatarUrl: u.profile?.avatar || null,
              },
            ])
          );
        }
      } catch (userError) {
        console.error("Error fetching users for posts:", userError);
        // Continue with empty userMap - will use fallback values
      }
    }
    
    // Convert images to URL references
    const mapped = posts.map((p) => {
      const author = userMap.get(String(p.accountId)) || {
        name: "Anonymous",
        username: p.accountId,
        avatarUrl: null,
      };
      return {
        _id: String(p._id),
        id: String(p._id),
        accountId: p.isAnonymous ? null : p.accountId, // Hide accountId for anonymous posts
        content: p.content,
        community: p.community || null,
        images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
        likes: p.likesCount,
        comments: p.commentsCount,
        fundingTotal: p.fundingTotal || 0,
        fundingCount: p.fundingCount || 0,
        isAnonymous: p.isAnonymous || false,
        createdAt: p.createdAt,
        author: {
          name: author.name,
          username: author.username,
          avatarUrl: author.avatarUrl,
        },
      };
    });
    
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
    const follows = await Follow.find({ followerId: userId }).select(
      "followingId"
    );
    const followingIds = follows.map((f) => String(f.followingId));

    if (followingIds.length === 0) {
      return res.json([]);
    }

    // Get posts from followed users (exclude their anonymous posts)
    const posts = await Post.find({
      accountId: { $in: followingIds },
      isAnonymous: { $ne: true }, // Don't show anonymous posts in following feed
    })
      .sort({ createdAt: -1 })
      .limit(100);

    // Convert images to URL references
    const mapped = posts.map((p) => ({
      _id: String(p._id),
      id: String(p._id),
      accountId: p.isAnonymous ? null : p.accountId, // Hide accountId for anonymous posts
      content: p.content,
      images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
      likes: p.likesCount,
      comments: p.commentsCount,
      fundingTotal: p.fundingTotal || 0,
      fundingCount: p.fundingCount || 0,
      isAnonymous: p.isAnonymous || false,
      createdAt: p.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("posts following GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /posts/recommended - Get recommended posts (trending, popular, similar interests)
router.get("/recommended", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const limit = parseInt(req.query.limit) || 20;

    // Get list of users being followed (to exclude from recommendations)
    const follows = await Follow.find({ followerId: userId }).select(
      "followingId"
    );
    const followingIds = follows.map((f) => String(f.followingId));

    // Also exclude user's own posts
    const excludeIds = [...followingIds, userId];

    // Strategy 1: Trending posts (high engagement in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const trendingPosts = await Post.find({
      accountId: { $nin: excludeIds },
      createdAt: { $gte: oneDayAgo },
    })
      .sort({
        // Calculate engagement score: likes * 2 + comments * 3 + fundingCount
        // We'll sort by a combination of these metrics
        likesCount: -1,
        commentsCount: -1,
        fundingCount: -1,
        createdAt: -1,
      })
      .limit(Math.floor(limit * 0.4))
      .lean();

    // Strategy 2: Popular posts from users with similar followers
    // Find users who follow similar people (users who follow at least 2 of the same people you follow)
    let similarUserIds = [];
    if (followingIds.length >= 2) {
      // Find users who follow at least 2 people you follow
      const similarFollows = await Follow.aggregate([
        {
          $match: {
            followerId: { $ne: userId },
            followingId: { $in: followingIds },
          },
        },
        {
          $group: {
            _id: "$followerId",
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gte: 2 }, // At least 2 common follows
          },
        },
        {
          $limit: 10, // Top 10 users with similar interests
        },
      ]);

      similarUserIds = similarFollows.map((f) => String(f._id));
    }

    // If we have similar users, get their posts
    let similarPosts = [];
    if (similarUserIds.length > 0) {
      // Filter out users already in excludeIds
      const filteredSimilarUserIds = similarUserIds.filter(
        (id) => !excludeIds.includes(id)
      );
      if (filteredSimilarUserIds.length > 0) {
        similarPosts = await Post.find({
          accountId: { $in: filteredSimilarUserIds },
        })
          .sort({ likesCount: -1, createdAt: -1 })
          .limit(Math.floor(limit * 0.3))
          .lean();
      }
    }

    // Strategy 3: General popular posts (high engagement overall)
    const popularPosts = await Post.find({
      accountId: { $nin: excludeIds },
      likesCount: { $gte: 5 }, // At least 5 likes
    })
      .sort({
        likesCount: -1,
        commentsCount: -1,
        createdAt: -1,
      })
      .limit(Math.floor(limit * 0.3))
      .lean();

    // Combine and deduplicate posts
    const allPosts = [...trendingPosts, ...similarPosts, ...popularPosts];
    const postMap = new Map();

    allPosts.forEach((post) => {
      const postId = String(post._id);
      if (!postMap.has(postId)) {
        postMap.set(postId, post);
      }
    });

    // Convert to array and shuffle for variety
    let recommendedPosts = Array.from(postMap.values());

    // If we don't have enough recommendations, fill with recent posts
    if (recommendedPosts.length < limit) {
      const remaining = limit - recommendedPosts.length;
      const recentPostIds = new Set(recommendedPosts.map((p) => String(p._id)));

      const recentPosts = await Post.find({
        accountId: { $nin: excludeIds },
        _id: {
          $nin: Array.from(recentPostIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .lean();

      recommendedPosts = [...recommendedPosts, ...recentPosts];
    }

    // Mix in anonymous posts randomly (20% of recommendations)
    const anonymousLimit = Math.floor(limit * 0.2);
    const anonymousPosts = await Post.find({
      isAnonymous: true,
      accountId: { $ne: userId }, // Exclude user's own anonymous posts
    })
      .sort({ createdAt: -1 })
      .limit(anonymousLimit)
      .lean();

    // Combine recommended and anonymous posts
    const allRecommendedPosts = [...recommendedPosts, ...anonymousPosts];

    // Shuffle to mix anonymous posts randomly
    allRecommendedPosts.sort(() => Math.random() - 0.5);

    // Limit to requested amount
    const finalRecommendedPosts = allRecommendedPosts.slice(0, limit);

    // Convert images to URL references
    const mapped = finalRecommendedPosts.map((p) => ({
      _id: String(p._id),
      id: String(p._id),
      accountId: p.isAnonymous ? null : p.accountId, // Hide accountId for anonymous posts
      content: p.content,
      images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
      likes: p.likesCount,
      comments: p.commentsCount,
      fundingTotal: p.fundingTotal || 0,
      fundingCount: p.fundingCount || 0,
      isAnonymous: p.isAnonymous || false,
      createdAt: p.createdAt,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("posts recommended GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /posts (multipart/form-data) fields: content, images[], optional community
router.post(
  "/",
  authenticateToken,
  upload.array("images", 6),
  async (req, res) => {
    try {
      const accountId = String(req.user._id);
      const content = String(req.body.content || "").slice(0, 5000);
      const isAnonymous =
        req.body.isAnonymous === "true" || req.body.isAnonymous === true;
      const community = mongoose.Types.ObjectId.isValid(req.body.community)
        ? req.body.community
        : null;
      const images = (req.files || []).map((f) => ({
        filename: f.originalname,
        contentType: f.mimetype,
        data: f.buffer.toString("base64"),
        size: f.size,
      }));
      const post = await Post.create({
        accountId,
        content,
        images,
        isAnonymous,
        community,
      });

      // Notify followers asynchronously (only for non-anonymous posts)
      // Anonymous posts don't send notifications to followers
      if (!isAnonymous) {
        try {
          // Get the poster's username
          const poster = await User.findById(accountId).select("username");
          const username = poster?.username || "Someone";

          const followers = await Follow.find({
            followingId: accountId,
          }).select("followerId");
          console.log(
            `[Post Notification] User ${accountId} (${username}) posted. Found ${followers.length} followers.`
          );

          if (followers.length === 0) {
            console.log(
              `[Post Notification] No followers found for user ${accountId}`
            );
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
              const notifications = await Notification.insertMany(bulk, {
                ordered: false,
              });
              console.log(
                `[Post Notification] Created ${notifications.length} notifications in database.`
              );

              // Send notifications via WebSocket and web push
              for (let i = 0; i < followers.length; i++) {
                const followerId = String(followers[i].followerId);
                const notification = notifications[i];

                if (!notification) {
                  console.warn(
                    `[Post Notification] No notification found for follower ${followerId} at index ${i}`
                  );
                  continue;
                }

                // Send via WebSocket (real-time)
                try {
                  // Convert Mongoose document to plain object for WebSocket
                  const notificationObj = notification.toObject
                    ? notification.toObject()
                    : notification;
                  broadcastNotification(followerId, notificationObj);
                  console.log(
                    `[Post Notification] Sent WebSocket notification to user ${followerId}`
                  );
                } catch (wsError) {
                  console.error(
                    `[Post Notification] WebSocket error for user ${followerId}:`,
                    wsError
                  );
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
                  console.error(
                    `[Post Notification] Push notification error for user ${followerId}:`,
                    err
                  );
                });
              }
            } catch (insertError) {
              console.error(
                "[Post Notification] Error inserting notifications:",
                insertError
              );
              // If bulk insert fails, try inserting one by one
              console.log(
                "[Post Notification] Attempting individual notification insertion..."
              );
              for (const notifData of bulk) {
                try {
                  const notif = await Notification.create(notifData);
                  const followerId = notifData.recipientId;
                  broadcastNotification(
                    followerId,
                    notif.toObject ? notif.toObject() : notif
                  );
                  console.log(
                    `[Post Notification] Created and sent notification to user ${followerId}`
                  );
                } catch (individualError) {
                  console.error(
                    `[Post Notification] Failed to create notification for ${notifData.recipientId}:`,
                    individualError
                  );
                }
              }
            }
          }
        } catch (e) {
          console.error(
            "[Post Notification] notify followers error:",
            e?.message || e
          );
          console.error("[Post Notification] Stack trace:", e?.stack);
        }
      }
      res.status(201).json({
        _id: String(post._id),
        id: String(post._id),
        accountId: post.accountId,
        content: post.content,
        community: post.community || null,
        images: (post.images || []).map(
          (_, idx) => `/posts/image/${post._id}/${idx}`
        ),
        likes: post.likesCount,
        comments: post.commentsCount,
        fundingTotal: post.fundingTotal || 0,
        fundingCount: post.fundingCount || 0,
        isAnonymous: post.isAnonymous || false,
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

// GET /posts/anonymous - Get all anonymous posts (public, no auth required)
router.get("/anonymous", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      isAnonymous: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({ isAnonymous: true });

    // Convert images to URL references
    const mapped = posts.map((p) => ({
      _id: String(p._id),
      id: String(p._id),
      accountId: null, // Always hide accountId for anonymous posts
      content: p.content,
      images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
      likes: p.likesCount,
      comments: p.commentsCount,
      fundingTotal: p.fundingTotal || 0,
      fundingCount: p.fundingCount || 0,
      isAnonymous: true,
      createdAt: p.createdAt,
    }));

    res.json({
      posts: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("posts anonymous GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /posts/my-anonymous - Get user's own anonymous posts (requires auth)
router.get("/my-anonymous", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      accountId: userId,
      isAnonymous: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({
      accountId: userId,
      isAnonymous: true,
    });

    // Convert images to URL references
    // For user's own posts, we can show accountId so they know it's theirs
    const mapped = posts.map((p) => ({
      _id: String(p._id),
      id: String(p._id),
      accountId: p.accountId, // Show accountId for user's own posts
      content: p.content,
      images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
      likes: p.likesCount,
      comments: p.commentsCount,
      fundingTotal: p.fundingTotal || 0,
      fundingCount: p.fundingCount || 0,
      isAnonymous: true,
      createdAt: p.createdAt,
    }));

    res.json({
      posts: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("posts my-anonymous GET error:", err);
    res.status(500).json({ error: "Internal server error" });
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

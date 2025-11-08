import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import ScheduledPost from "../models/ScheduledPost.js";
import { authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
});

// Helper function to convert image buffer to base64
const bufferToBase64 = (buffer, contentType) => {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
};

// Helper function to get userId from request (after authenticateToken middleware)
const getUserId = (req) => {
  return req.user ? String(req.user._id) : null;
};

/* ============================================================
   ✅ GET /scheduled-posts
   Get all scheduled posts for a user (or all if admin)
   Query params: accountId (optional)
============================================================ */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.query;
    const filter = {};

    // If accountId is provided, filter by it
    if (accountId) {
      filter.accountId = String(accountId);
    } else {
      // If no accountId, get current user's scheduled posts
      const userId = getUserId(req);
      if (userId) {
        filter.accountId = userId;
      }
    }

    // Check and release any posts that should be released
    await ScheduledPost.checkAndRelease();

    const scheduledPosts = await ScheduledPost.find(filter)
      .sort({ scheduledDate: -1 })
      .limit(100);

    // Fetch user profiles for author information
    const userIds = [...new Set(scheduledPosts.map((p) => p.accountId).filter(Boolean))];
    let userMap = new Map();
    if (userIds.length > 0) {
      try {
        // Try ObjectId first
        const validUserIds = userIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        if (validUserIds.length > 0) {
          const users = await User.find({ _id: { $in: validUserIds } }).select(
            "username profile.full_name profile.avatar"
          );
          users.forEach((u) => {
            userMap.set(String(u._id), {
              name: u.profile?.full_name || u.username || "Anonymous",
              username: u.username || String(u._id),
              avatarUrl: u.profile?.avatar || null,
            });
          });
        }

        // Also try by username for non-ObjectId accountIds
        const stringUserIds = userIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
        if (stringUserIds.length > 0) {
          const usersByUsername = await User.find({ 
            $or: [
              { username: { $in: stringUserIds } },
              { _id: { $in: stringUserIds } }
            ]
          }).select("username profile.full_name profile.avatar");
          
          usersByUsername.forEach((u) => {
            const key = String(u._id);
            if (!userMap.has(key)) {
              userMap.set(key, {
                name: u.profile?.full_name || u.username || "Anonymous",
                username: u.username || key,
                avatarUrl: u.profile?.avatar || null,
              });
            }
            // Also map by username if it matches
            if (stringUserIds.includes(u.username)) {
              userMap.set(u.username, {
                name: u.profile?.full_name || u.username || "Anonymous",
                username: u.username,
                avatarUrl: u.profile?.avatar || null,
              });
            }
          });
        }
      } catch (userError) {
        console.error("Error fetching users for scheduled posts:", userError);
      }
    }

    // Format response
    const mapped = scheduledPosts.map((p) => {
      // Try to get author info by accountId (as string) or by ObjectId string
      const author = userMap.get(String(p.accountId)) || 
                     userMap.get(p.accountId) || 
                     {
        name: "Anonymous",
        username: p.accountId ? String(p.accountId).substring(0, 20) : "anonymous",
        avatarUrl: null,
      };

      return {
        _id: String(p._id),
        id: String(p._id),
        accountId: p.isAnonymous && !p.isReleased ? null : p.accountId, // Hide accountId for anonymous unreleased posts
        content: p.content,
        images: (p.images || []).map((_, idx) => `/scheduled-posts/image/${p._id}/${idx}`),
        scheduledDate: p.scheduledDate,
        isReleased: p.isReleased,
        releasedAt: p.releasedAt,
        likes: p.likesCount,
        comments: p.commentsCount,
        fundingTotal: p.fundingTotal || 0,
        fundingCount: p.fundingCount || 0,
        isAnonymous: p.isAnonymous || false,
        community: p.community || null,
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
    console.error("scheduled-posts GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   ✅ GET /scheduled-posts/:id
   Get a single scheduled post by ID
============================================================ */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ScheduledPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    // Check and release if needed
    await ScheduledPost.checkAndRelease();

    // Fetch author information
    let author = {
      name: "Anonymous",
      username: post.accountId,
      avatarUrl: null,
    };

    if (post.accountId && mongoose.Types.ObjectId.isValid(post.accountId)) {
      try {
        const user = await User.findById(post.accountId).select(
          "username profile.full_name profile.avatar"
        );
        if (user) {
          author = {
            name: user.profile?.full_name || user.username || "Anonymous",
            username: user.username,
            avatarUrl: user.profile?.avatar || null,
          };
        }
      } catch (userError) {
        console.error("Error fetching user for scheduled post:", userError);
      }
    }

    res.json({
      _id: String(post._id),
      id: String(post._id),
      accountId: post.isAnonymous && !post.isReleased ? null : post.accountId,
      content: post.content,
      images: (post.images || []).map((_, idx) => `/scheduled-posts/image/${post._id}/${idx}`),
      scheduledDate: post.scheduledDate,
      isReleased: post.isReleased,
      releasedAt: post.releasedAt,
      likes: post.likesCount,
      comments: post.commentsCount,
      fundingTotal: post.fundingTotal || 0,
      fundingCount: post.fundingCount || 0,
      isAnonymous: post.isAnonymous || false,
      community: post.community || null,
      createdAt: post.createdAt,
      author: author,
    });
  } catch (err) {
    console.error("scheduled-posts GET by ID error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   ✅ POST /scheduled-posts
   Create a new scheduled post
============================================================ */
router.post("/", authenticateToken, upload.array("images", 6), async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { content, scheduledDate, isAnonymous, community } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ error: "scheduledDate is required" });
    }

    const scheduledDateObj = new Date(scheduledDate);
    if (isNaN(scheduledDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid scheduledDate format" });
    }

    // Don't allow scheduling in the past
    if (scheduledDateObj <= new Date()) {
      return res.status(400).json({ error: "scheduledDate must be in the future" });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          filename: file.originalname,
          contentType: file.mimetype,
          data: bufferToBase64(file.buffer, file.mimetype),
          size: file.size,
        });
      }
    }

    const scheduledPost = new ScheduledPost({
      accountId: String(userId),
      content: content || "",
      images: images,
      scheduledDate: scheduledDateObj,
      isReleased: false,
      isAnonymous: isAnonymous === "true" || isAnonymous === true,
      community: community && mongoose.Types.ObjectId.isValid(community)
        ? new mongoose.Types.ObjectId(community)
        : null,
    });

    await scheduledPost.save();

    // Fetch author information
    let author = {
      name: "Anonymous",
      username: String(userId),
      avatarUrl: null,
    };

    try {
      const user = await User.findById(userId).select(
        "username profile.full_name profile.avatar"
      );
      if (user) {
        author = {
          name: user.profile?.full_name || user.username || "Anonymous",
          username: user.username,
          avatarUrl: user.profile?.avatar || null,
        };
      }
    } catch (userError) {
      console.error("Error fetching user for scheduled post:", userError);
    }

    res.status(201).json({
      _id: String(scheduledPost._id),
      id: String(scheduledPost._id),
      accountId: scheduledPost.accountId,
      content: scheduledPost.content,
      images: scheduledPost.images.map((_, idx) => `/scheduled-posts/image/${scheduledPost._id}/${idx}`),
      scheduledDate: scheduledPost.scheduledDate,
      isReleased: scheduledPost.isReleased,
      likes: scheduledPost.likesCount,
      comments: scheduledPost.commentsCount,
      fundingTotal: scheduledPost.fundingTotal || 0,
      fundingCount: scheduledPost.fundingCount || 0,
      isAnonymous: scheduledPost.isAnonymous || false,
      community: scheduledPost.community || null,
      createdAt: scheduledPost.createdAt,
      author: author,
    });
  } catch (err) {
    console.error("scheduled-posts POST error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   ✅ PUT /scheduled-posts/:id
   Update a scheduled post (only if not released)
============================================================ */
router.put("/:id", authenticateToken, upload.array("images", 6), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const post = await ScheduledPost.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    // Check ownership
    if (String(post.accountId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Don't allow editing if already released
    if (post.isReleased) {
      return res.status(400).json({ error: "Cannot edit a released post" });
    }

    const { content, scheduledDate, isAnonymous, community } = req.body;

    if (content !== undefined) post.content = content;
    if (scheduledDate !== undefined) {
      const scheduledDateObj = new Date(scheduledDate);
      if (isNaN(scheduledDateObj.getTime())) {
        return res.status(400).json({ error: "Invalid scheduledDate format" });
      }
      if (scheduledDateObj <= new Date()) {
        return res.status(400).json({ error: "scheduledDate must be in the future" });
      }
      post.scheduledDate = scheduledDateObj;
    }
    if (isAnonymous !== undefined) {
      post.isAnonymous = isAnonymous === "true" || isAnonymous === true;
    }
    if (community !== undefined) {
      post.community =
        community && mongoose.Types.ObjectId.isValid(community)
          ? new mongoose.Types.ObjectId(community)
          : null;
    }

    // Update images if provided
    if (req.files && req.files.length > 0) {
      const images = [];
      for (const file of req.files) {
        images.push({
          filename: file.originalname,
          contentType: file.mimetype,
          data: bufferToBase64(file.buffer, file.mimetype),
          size: file.size,
        });
      }
      post.images = images;
    }

    await post.save();

    // Fetch author information
    let author = {
      name: "Anonymous",
      username: String(userId),
      avatarUrl: null,
    };

    try {
      const user = await User.findById(userId).select(
        "username profile.full_name profile.avatar"
      );
      if (user) {
        author = {
          name: user.profile?.full_name || user.username || "Anonymous",
          username: user.username,
          avatarUrl: user.profile?.avatar || null,
        };
      }
    } catch (userError) {
      console.error("Error fetching user for scheduled post:", userError);
    }

    res.json({
      _id: String(post._id),
      id: String(post._id),
      accountId: post.accountId,
      content: post.content,
      images: post.images.map((_, idx) => `/scheduled-posts/image/${post._id}/${idx}`),
      scheduledDate: post.scheduledDate,
      isReleased: post.isReleased,
      likes: post.likesCount,
      comments: post.commentsCount,
      fundingTotal: post.fundingTotal || 0,
      fundingCount: post.fundingCount || 0,
      isAnonymous: post.isAnonymous || false,
      community: post.community || null,
      createdAt: post.createdAt,
      author: author,
    });
  } catch (err) {
    console.error("scheduled-posts PUT error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   ✅ DELETE /scheduled-posts/:id
   Delete a scheduled post
============================================================ */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const post = await ScheduledPost.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Scheduled post not found" });
    }

    // Check ownership
    if (String(post.accountId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await ScheduledPost.findByIdAndDelete(id);
    res.json({ message: "Scheduled post deleted successfully" });
  } catch (err) {
    console.error("scheduled-posts DELETE error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================================================
   ✅ GET /scheduled-posts/image/:id/:index
   Get image for a scheduled post
============================================================ */
router.get("/image/:id/:index", async (req, res) => {
  try {
    const { id, index } = req.params;
    const post = await ScheduledPost.findById(id);

    if (!post || !post.images || !post.images[parseInt(index)]) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = post.images[parseInt(index)];
    const base64Data = image.data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("scheduled-posts image GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;


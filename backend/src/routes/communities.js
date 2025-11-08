import express from "express";
import mongoose from "mongoose";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import CommunityMembership from "../models/CommunityMembership.js";
import { authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Get all communities
router.get("/", async (req, res) => {
  try {
    const communities = await Community.find().sort({ name: 1 });
    res.json(communities);
  } catch (err) {
    console.error("GET /communities error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's joined communities (MUST be before /:slug routes)
router.get("/me/joined", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get all memberships for this user
    const memberships = await CommunityMembership.find({ userId }).populate(
      "communityId",
      "name slug description image tags memberCount bgColor createdAt"
    );

    const communities = memberships
      .map((m) => m.communityId)
      .filter((c) => c !== null)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "",
        tags: c.tags || [],
        memberCount: c.memberCount || 0,
        bgColor: c.bgColor || "bg-purple-300",
        joinedAt: memberships.find((m) => String(m.communityId._id) === String(c._id))?.createdAt,
      }));

    res.json(communities);
  } catch (err) {
    console.error("GET /communities/me/joined error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Create a new community (MUST be before GET /:slug to avoid route conflicts)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, image, tags, bgColor } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Community name is required" });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") // Replace multiple dashes with single dash
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes

    if (!slug) {
      return res.status(400).json({ error: "Invalid community name" });
    }

    // Check if community with same name or slug already exists
    const existing = await Community.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Community with this name already exists" });
    }

    // Create new community
    const community = await Community.create({
      name: name.trim(),
      slug,
      description: description || "",
      image: image || "",
      tags: Array.isArray(tags) ? tags : tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      memberCount: 1, // Creator is the first member
      bgColor: bgColor || "bg-purple-300", // Default to purple if not provided
    });

    // Automatically add creator as a member
    const userId = req.user._id;
    try {
      await CommunityMembership.create({
        userId,
        communityId: community._id,
      });
    } catch (membershipError) {
      // If membership creation fails, log but don't fail the community creation
      console.error("Failed to create membership for community creator:", membershipError);
    }

    res.status(201).json(community);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Community already exists" });
    }
    console.error("Create community error:", err);
    res.status(500).json({ error: err.message || "Failed to create community" });
  }
});

// Check if user is member of a community (MUST be before GET /:slug)
router.get("/:slug/is-member", authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const community = await Community.findOne({ slug });
    if (!community) {
      // Community doesn't exist yet (static/dummy data) - user is not a member
      return res.json({ isMember: false });
    }

    const membership = await CommunityMembership.findOne({
      userId,
      communityId: community._id,
    });

    res.json({ isMember: !!membership });
  } catch (err) {
    console.error("GET /communities/:slug/is-member error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Get single community (by slug) - MUST be after specific routes
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const community = await Community.findOne({ slug });
    
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Fetch posts for this community
    let postsWithAuthors = [];
    try {
      // community._id is already an ObjectId from Mongoose
      const posts = await Post.find({ community: community._id })
        .sort({ createdAt: -1 })
        .limit(100);

      if (posts.length > 0) {
        // Fetch user profiles for all posts in parallel
        // accountId in posts is stored as String, but it represents User._id which is ObjectId
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

        // Map posts with author information
        postsWithAuthors = posts.map((p) => {
          const author = userMap.get(String(p.accountId)) || {
            name: "Anonymous",
            username: p.accountId,
            avatarUrl: null,
          };
          return {
            _id: String(p._id),
            id: String(p._id),
            accountId: p.accountId,
            content: p.content,
            community: p.community || null,
            images: (p.images || []).map((_, idx) => `/posts/image/${p._id}/${idx}`),
            likes: p.likesCount,
            comments: p.commentsCount,
            createdAt: p.createdAt,
            author: {
              name: author.name,
              username: author.username,
              avatarUrl: author.avatarUrl,
            },
          };
        });
      }
    } catch (postsError) {
      console.error("Error fetching posts for community:", postsError);
      // Continue even if posts fail to load
    }

    // Fetch reels for this community
    let reels = [];
    try {
      // community._id is already an ObjectId from Mongoose
      reels = await Reel.find({ community: community._id }).sort({
        createdAt: -1,
      });
    } catch (reelsError) {
      console.error("Error fetching reels for community:", reelsError);
      // Continue even if reels fail to load
    }

    res.json({ 
      community: {
        _id: community._id,
        name: community.name,
        slug: community.slug,
        description: community.description,
        image: community.image,
        tags: community.tags || [],
        memberCount: community.memberCount || 0,
        bgColor: community.bgColor || "bg-purple-300",
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
      },
      posts: postsWithAuthors,
      reels: reels || [],
    });
  } catch (err) {
    console.error("GET /communities/:slug error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Join a community
router.post("/:slug/join", authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description, image, tags, bgColor } = req.body; // Allow creating community on join if it doesn't exist
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    let community = await Community.findOne({ slug });
    
    // If community doesn't exist and we have data to create it, create it
    if (!community && name) {
      try {
        // Generate slug from name to ensure it matches
        const generatedSlug = name
          .toLowerCase()
          .trim()
          .replace(/&/g, "and")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Only create if slug matches
        if (generatedSlug === slug) {
          // Check if community with same name or slug already exists
          const existing = await Community.findOne({
            $or: [{ name: name.trim() }, { slug }],
          });

          if (!existing) {
            community = await Community.create({
              name: name.trim(),
              slug,
              description: description || "",
              image: image || "",
              tags: Array.isArray(tags) ? tags : tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
              memberCount: 0, // Start with 0, will be incremented below
              bgColor: bgColor || "bg-purple-300",
            });
          } else {
            community = existing;
          }
        }
      } catch (createError) {
        console.error("Error creating community on join:", createError);
        // Continue to check if it exists now
        community = await Community.findOne({ slug });
      }
    }

    if (!community) {
      return res.status(404).json({ 
        message: "Community not found. Please create it first or provide community details.",
        requiresCreation: true 
      });
    }

    // Check if already a member
    const existingMembership = await CommunityMembership.findOne({
      userId,
      communityId: community._id,
    });

    if (existingMembership) {
      return res.status(400).json({ error: "Already a member of this community" });
    }

    // Create membership
    await CommunityMembership.create({
      userId,
      communityId: community._id,
    });

    // Update member count
    community.memberCount = (community.memberCount || 0) + 1;
    await community.save();

    res.json({ 
      message: "Joined successfully", 
      community: {
        _id: community._id,
        name: community.name,
        slug: community.slug,
        memberCount: community.memberCount,
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Already a member of this community" });
    }
    console.error("POST /communities/:slug/join error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Leave a community
router.post("/:slug/leave", authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const community = await Community.findOne({ slug });
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is a member
    const membership = await CommunityMembership.findOne({
      userId,
      communityId: community._id,
    });

    if (!membership) {
      return res.status(400).json({ error: "Not a member of this community" });
    }

    // Remove membership
    await CommunityMembership.deleteOne({ _id: membership._id });

    // Update member count (don't go below 0)
    community.memberCount = Math.max(0, (community.memberCount || 1) - 1);
    await community.save();

    res.json({ 
      message: "Left community successfully", 
      community: {
        _id: community._id,
        name: community.name,
        slug: community.slug,
        memberCount: community.memberCount,
      }
    });
  } catch (err) {
    console.error("POST /communities/:slug/leave error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;


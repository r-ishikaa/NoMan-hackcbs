import express from "express";
import User from "../models/User.js";
import { cacheGet, cacheDel } from "../config/redis.js";

const router = express.Router();

// GET /profiles?accountId=<mongoId>
// Returns a simplified profile structure for the new frontend UI
router.get("/", async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    // Cache key based on accountId
    const cacheKey = `profile:${accountId}`;

    // Try to get from cache, or fetch from database
    const result = await cacheGet(
      cacheKey,
      async () => {
        let user = null;
        const isObjectId = /^[a-f\d]{24}$/i.test(String(accountId));
        if (isObjectId) {
          user = await User.findById(accountId).select(
            "username profile.full_name profile.avatar profile.cover profile.bio profile.location profile.website"
          );
        }
        if (!user) {
          user = await User.findOne({ username: String(accountId) }).select(
            "username profile.full_name profile.avatar profile.cover profile.bio profile.location profile.website"
          );
        }

        if (!user) {
          return null; // Cache the "not found" result too
        }

        return {
          accountId: String(user._id),
          displayName: user.profile?.full_name || user.username || "",
          avatarUrl: user.profile?.avatar || null,
          coverUrl: user.profile?.cover || null,
          about: user.profile?.bio || "",
          location: user.profile?.location || "",
          website: user.profile?.website || "",
          _id: String(user._id),
        };
      },
      300 // Cache for 5 minutes
    );

    if (!result) {
      return res.status(404).json([]);
    }

    // For consistency with the frontend code that expects an array
    res.json([result]);
  } catch (err) {
    console.error("profiles GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

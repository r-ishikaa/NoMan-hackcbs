import express from "express";
import {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
} from "../middleware/auth.js";
import Advertisement from "../models/Advertisement.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import mongoose from "mongoose";

const router = express.Router();

// POST /advertisements/:id/track/view - Track advertisement view
router.post("/:id/track/view", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // "post" or "reel"

    if (!type || !["post", "reel"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid type. Must be 'post' or 'reel'" });
    }

    // Find advertisement
    const advertisement = await Advertisement.findOne({
      [type === "post" ? "postId" : "reelId"]: id,
      isActive: true,
    });

    if (!advertisement) {
      return res.status(404).json({ error: "Advertisement not found" });
    }

    // Check if budget is exhausted
    if (advertisement.spent >= advertisement.budget) {
      advertisement.isActive = false;
      await advertisement.save();
      return res.status(400).json({ error: "Advertisement budget exhausted" });
    }

    // Update view count
    advertisement.views += 1;

    // Calculate cost for this view
    const costPerView = 1; // 1 cent per view
    const newSpent = advertisement.spent + costPerView;

    // Check if this view would exceed budget
    if (newSpent > advertisement.budget) {
      advertisement.isActive = false;
      await advertisement.save();
      return res.status(400).json({ error: "Advertisement budget exceeded" });
    }

    advertisement.spent = newSpent;
    await advertisement.save();

    // Update Post/Reel advertisement views
    if (type === "post") {
      await Post.findByIdAndUpdate(id, {
        $inc: { advertisementViews: 1, advertisementSpent: costPerView },
      });
    } else {
      await Reel.findByIdAndUpdate(id, {
        $inc: { advertisementViews: 1, advertisementSpent: costPerView },
      });
    }

    res.json({
      success: true,
      views: advertisement.views,
      spent: advertisement.spent,
    });
  } catch (error) {
    console.error("Advertisement view tracking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /advertisements/:id/track/click - Track advertisement click
router.post("/:id/track/click", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // "post" or "reel"

    if (!type || !["post", "reel"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid type. Must be 'post' or 'reel'" });
    }

    // Find advertisement
    const advertisement = await Advertisement.findOne({
      [type === "post" ? "postId" : "reelId"]: id,
      isActive: true,
    });

    if (!advertisement) {
      return res.status(404).json({ error: "Advertisement not found" });
    }

    // Check if budget is exhausted
    if (advertisement.spent >= advertisement.budget) {
      advertisement.isActive = false;
      await advertisement.save();
      return res.status(400).json({ error: "Advertisement budget exhausted" });
    }

    // Update click count
    advertisement.clicks += 1;

    // Calculate cost for this click
    const costPerClick = 10; // 10 cents per click
    const newSpent = advertisement.spent + costPerClick;

    // Check if this click would exceed budget
    if (newSpent > advertisement.budget) {
      advertisement.isActive = false;
      await advertisement.save();
      return res.status(400).json({ error: "Advertisement budget exceeded" });
    }

    advertisement.spent = newSpent;
    await advertisement.save();

    // Update Post/Reel advertisement clicks
    if (type === "post") {
      await Post.findByIdAndUpdate(id, {
        $inc: { advertisementClicks: 1, advertisementSpent: costPerClick },
      });
    } else {
      await Reel.findByIdAndUpdate(id, {
        $inc: { advertisementClicks: 1, advertisementSpent: costPerClick },
      });
    }

    res.json({
      success: true,
      clicks: advertisement.clicks,
      spent: advertisement.spent,
      targetUrl: advertisement.targetUrl,
    });
  } catch (error) {
    console.error("Advertisement click tracking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /advertisements - Get all advertisements for enterprise user
router.get(
  "/",
  authenticateToken,
  authorizeRoles("enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);
      const { status } = req.query; // "active", "inactive", or "all"

      const query = { userId };
      if (status === "active") {
        query.isActive = true;
      } else if (status === "inactive") {
        query.isActive = false;
      }

      const advertisements = await Advertisement.find(query)
        .sort({ createdAt: -1 })
        .populate("postId", "content images createdAt")
        .populate("reelId", "title videoUrl createdAt")
        .lean();

      res.json({ advertisements, count: advertisements.length });
    } catch (error) {
      console.error("Get advertisements error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /advertisements/analytics - Get advertisement analytics
router.get(
  "/analytics",
  authenticateToken,
  authorizeRoles("enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get all advertisements
      const advertisements = await Advertisement.find({
        userId,
        createdAt: { $gte: startDate },
      }).lean();

      // Calculate totals
      const totalViews = advertisements.reduce(
        (sum, ad) => sum + (ad.views || 0),
        0
      );
      const totalClicks = advertisements.reduce(
        (sum, ad) => sum + (ad.clicks || 0),
        0
      );
      const totalReactions = advertisements.reduce(
        (sum, ad) => sum + (ad.reactions || 0),
        0
      );
      const totalBudget = advertisements.reduce(
        (sum, ad) => sum + (ad.budget || 0),
        0
      );
      const totalSpent = advertisements.reduce(
        (sum, ad) => sum + (ad.spent || 0),
        0
      );
      const activeAds = advertisements.filter((ad) => ad.isActive).length;

      // Calculate engagement metrics
      const clickThroughRate =
        totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      const costPerView = totalViews > 0 ? totalSpent / totalViews : 0;
      const costPerClick = totalClicks > 0 ? totalSpent / totalClicks : 0;

      // Group by date
      const dailyStats = {};
      advertisements.forEach((ad) => {
        const date = new Date(ad.createdAt).toISOString().split("T")[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { views: 0, clicks: 0, reactions: 0, spent: 0 };
        }
        dailyStats[date].views += ad.views || 0;
        dailyStats[date].clicks += ad.clicks || 0;
        dailyStats[date].reactions += ad.reactions || 0;
        dailyStats[date].spent += ad.spent || 0;
      });

      res.json({
        overview: {
          totalViews,
          totalClicks,
          totalReactions,
          totalBudget,
          totalSpent,
          activeAds,
          clickThroughRate: Math.round(clickThroughRate * 100) / 100,
          costPerView: Math.round(costPerView * 100) / 100,
          costPerClick: Math.round(costPerClick * 100) / 100,
          remainingBudget: totalBudget - totalSpent,
        },
        dailyStats,
        advertisements: advertisements.slice(0, 50), // Latest 50 ads
      });
    } catch (error) {
      console.error("Advertisement analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/auth.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Like from "../models/Like.js";
import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import Advertisement from "../models/Advertisement.js";

const router = express.Router();

// Helper function to get date range
const getDateRange = (days = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate };
};

// Helper function to group data by date
const groupByDate = (data, dateField = "createdAt", valueField = "count") => {
  const grouped = {};
  data.forEach((item) => {
    const date = new Date(item[dateField]).toISOString().split("T")[0];
    if (!grouped[date]) {
      grouped[date] = 0;
    }
    grouped[date] += item[valueField] || 1;
  });
  return grouped;
};

// GET /analytics/overview - Get overall analytics overview
router.get(
  "/overview",
  authenticateToken,
  authorizeRoles("creator", "enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);
      const { days = 30 } = req.query;
      const { startDate, endDate } = getDateRange(parseInt(days));

      // Get post IDs and reel IDs first (needed for other queries)
      const [postDocs, reelDocs] = await Promise.all([
        Post.find({ accountId: userId }).select("_id").lean(),
        Reel.find({
          $or: [{ author: userId }, { createdBy: userId }],
          isPublished: true,
          isDeleted: false,
        })
          .select("_id")
          .lean(),
      ]);

      const postIds = postDocs.map((p) => String(p._id));
      const reelIds = reelDocs.map((r) => String(r._id));

      // Get total counts
      const likeQuery = [];
      const commentQuery = [];

      if (postIds.length > 0) {
        likeQuery.push({ targetType: "post", targetId: { $in: postIds } });
        commentQuery.push({ targetType: "post", targetId: { $in: postIds } });
      }
      if (reelIds.length > 0) {
        likeQuery.push({ targetType: "reel", targetId: { $in: reelIds } });
        commentQuery.push({ targetType: "reel", targetId: { $in: reelIds } });
      }

      const [
        totalPosts,
        totalReels,
        totalLikes,
        totalComments,
        totalFollowers,
        totalFollowing,
      ] = await Promise.all([
        Promise.resolve(postIds.length),
        Promise.resolve(reelIds.length),
        likeQuery.length > 0
          ? Like.countDocuments({ $or: likeQuery })
          : Promise.resolve(0),
        commentQuery.length > 0
          ? Comment.countDocuments({ $or: commentQuery })
          : Promise.resolve(0),
        Follow.countDocuments({ followingId: userId }),
        Follow.countDocuments({ followerId: userId }),
      ]);

      // Get likes on posts and reels
      const likesOnPosts =
        postIds.length > 0
          ? await Like.countDocuments({
              targetType: "post",
              targetId: { $in: postIds },
            })
          : 0;
      const likesOnReels =
        reelIds.length > 0
          ? await Like.countDocuments({
              targetType: "reel",
              targetId: { $in: reelIds },
            })
          : 0;
      const totalLikesReceived = likesOnPosts + likesOnReels;

      // Get comments on posts and reels
      const commentsOnPosts =
        postIds.length > 0
          ? await Comment.countDocuments({
              targetType: "post",
              targetId: { $in: postIds },
            })
          : 0;
      const commentsOnReels =
        reelIds.length > 0
          ? await Comment.countDocuments({
              targetType: "reel",
              targetId: { $in: reelIds },
            })
          : 0;
      const totalCommentsReceived = commentsOnPosts + commentsOnReels;

      // Get advertisement analytics (enterprise only)
      let advertisementStats = null;
      if (req.user.role === "enterprise") {
        const advertisements = await Advertisement.find({
          userId,
          createdAt: { $gte: startDate, $lte: endDate },
        }).lean();

        const totalAdViews = advertisements.reduce(
          (sum, ad) => sum + (ad.views || 0),
          0
        );
        const totalAdClicks = advertisements.reduce(
          (sum, ad) => sum + (ad.clicks || 0),
          0
        );
        const totalAdReactions = advertisements.reduce(
          (sum, ad) => sum + (ad.reactions || 0),
          0
        );
        const totalAdBudget = advertisements.reduce(
          (sum, ad) => sum + (ad.budget || 0),
          0
        );
        const totalAdSpent = advertisements.reduce(
          (sum, ad) => sum + (ad.spent || 0),
          0
        );
        const activeAds = advertisements.filter((ad) => ad.isActive).length;

        advertisementStats = {
          totalAds: advertisements.length,
          activeAds,
          totalViews: totalAdViews,
          totalClicks: totalAdClicks,
          totalReactions: totalAdReactions,
          totalBudget: totalAdBudget,
          totalSpent: totalAdSpent,
          remainingBudget: totalAdBudget - totalAdSpent,
          clickThroughRate:
            totalAdViews > 0 ? (totalAdClicks / totalAdViews) * 100 : 0,
          costPerView: totalAdViews > 0 ? totalAdSpent / totalAdViews : 0,
          costPerClick: totalAdClicks > 0 ? totalAdSpent / totalAdClicks : 0,
        };
      }

      // Get total views (reels only, posts don't have view tracking)
      const reels = await Reel.find({
        $or: [{ author: userId }, { createdBy: userId }],
        isPublished: true,
        isDeleted: false,
      }).select("viewCount");
      const totalViews = reels.reduce(
        (sum, reel) => sum + (reel.viewCount || 0),
        0
      );

      // Get recent activity (last 7 days)
      const recentStartDate = new Date();
      recentStartDate.setDate(recentStartDate.getDate() - 7);

      const recentLikeQuery = [];
      const recentCommentQuery = [];

      if (postIds.length > 0) {
        recentLikeQuery.push({
          targetType: "post",
          targetId: { $in: postIds },
          createdAt: { $gte: recentStartDate },
        });
        recentCommentQuery.push({
          targetType: "post",
          targetId: { $in: postIds },
          createdAt: { $gte: recentStartDate },
        });
      }
      if (reelIds.length > 0) {
        recentLikeQuery.push({
          targetType: "reel",
          targetId: { $in: reelIds },
          createdAt: { $gte: recentStartDate },
        });
        recentCommentQuery.push({
          targetType: "reel",
          targetId: { $in: reelIds },
          createdAt: { $gte: recentStartDate },
        });
      }

      const [
        recentPosts,
        recentReels,
        recentLikes,
        recentComments,
        recentFollowers,
      ] = await Promise.all([
        Post.countDocuments({
          accountId: userId,
          createdAt: { $gte: recentStartDate },
        }),
        Reel.countDocuments({
          $or: [{ author: userId }, { createdBy: userId }],
          isPublished: true,
          isDeleted: false,
          createdAt: { $gte: recentStartDate },
        }),
        recentLikeQuery.length > 0
          ? Like.countDocuments({ $or: recentLikeQuery })
          : Promise.resolve(0),
        recentCommentQuery.length > 0
          ? Comment.countDocuments({ $or: recentCommentQuery })
          : Promise.resolve(0),
        Follow.countDocuments({
          followingId: userId,
          createdAt: { $gte: recentStartDate },
        }),
      ]);

      res.json({
        overview: {
          totalPosts,
          totalReels,
          totalViews,
          totalLikes: totalLikesReceived,
          totalComments: totalCommentsReceived,
          totalFollowers,
          totalFollowing,
          ...(advertisementStats && { advertisements: advertisementStats }),
        },
        recent: {
          posts: recentPosts,
          reels: recentReels,
          likes: recentLikes,
          comments: recentComments,
          followers: recentFollowers,
        },
        period: {
          days: parseInt(days),
          startDate,
          endDate,
        },
      });
    } catch (error) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /analytics/heatmap - Get activity heatmap data for last 365 days
router.get(
  "/heatmap",
  authenticateToken,
  authorizeRoles("creator", "enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);

      // Get data for last 365 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
      const endDate = new Date();

      // Get post IDs and reel IDs
      const postIds = (
        await Post.find({ accountId: userId }).select("_id")
      ).map((p) => String(p._id));
      const reelIds = (
        await Reel.find({
          $or: [{ author: userId }, { createdBy: userId }],
        }).select("_id")
      ).map((r) => String(r._id));

      // Get all activities in the date range
      const [posts, reels, likes, comments] = await Promise.all([
        Post.find({
          accountId: userId,
          createdAt: { $gte: startDate, $lte: endDate },
        }).select("createdAt"),

        Reel.find({
          $or: [{ author: userId }, { createdBy: userId }],
          isPublished: true,
          isDeleted: false,
          createdAt: { $gte: startDate, $lte: endDate },
        }).select("createdAt"),

        postIds.length > 0 || reelIds.length > 0
          ? Like.find({
              $or: [
                ...(postIds.length > 0
                  ? [{ targetType: "post", targetId: { $in: postIds } }]
                  : []),
                ...(reelIds.length > 0
                  ? [{ targetType: "reel", targetId: { $in: reelIds } }]
                  : []),
              ],
              createdAt: { $gte: startDate, $lte: endDate },
            }).select("createdAt")
          : Promise.resolve([]),

        postIds.length > 0 || reelIds.length > 0
          ? Comment.find({
              $or: [
                ...(postIds.length > 0
                  ? [{ targetType: "post", targetId: { $in: postIds } }]
                  : []),
                ...(reelIds.length > 0
                  ? [{ targetType: "reel", targetId: { $in: reelIds } }]
                  : []),
              ],
              createdAt: { $gte: startDate, $lte: endDate },
            }).select("createdAt")
          : Promise.resolve([]),
      ]);

      // Create activity map by date
      const activityByDate = {};

      // Count posts
      posts.forEach((post) => {
        const date = new Date(post.createdAt).toISOString().split("T")[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      });

      // Count reels
      reels.forEach((reel) => {
        const date = new Date(reel.createdAt).toISOString().split("T")[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      });

      // Count likes received
      likes.forEach((like) => {
        const date = new Date(like.createdAt).toISOString().split("T")[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      });

      // Count comments received
      comments.forEach((comment) => {
        const date = new Date(comment.createdAt).toISOString().split("T")[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      });

      // Generate array for all 365 days
      const heatmapData = [];
      for (let i = 364; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const count = activityByDate[dateStr] || 0;

        heatmapData.push({
          date: dateStr,
          count: count,
          level:
            count === 0
              ? 0
              : count < 5
              ? 1
              : count < 10
              ? 2
              : count < 20
              ? 3
              : 4,
        });
      }

      res.json({
        heatmap: heatmapData,
        totalDays: 365,
        totalActivity: Object.values(activityByDate).reduce(
          (sum, count) => sum + count,
          0
        ),
      });
    } catch (error) {
      console.error("Analytics heatmap error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /analytics/activity - Get activity data over time (for graphs)
router.get(
  "/activity",
  authenticateToken,
  authorizeRoles("creator", "enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);
      const { days = 30, groupBy = "day" } = req.query;
      const { startDate, endDate } = getDateRange(parseInt(days));

      // Get post IDs and reel IDs
      const postIds = (
        await Post.find({ accountId: userId }).select("_id")
      ).map((p) => String(p._id));
      const reelIds = (
        await Reel.find({
          $or: [{ author: userId }, { createdBy: userId }],
        }).select("_id")
      ).map((r) => String(r._id));

      // Get posts over time
      const posts = await Post.find({
        accountId: userId,
        createdAt: { $gte: startDate, $lte: endDate },
      }).select("createdAt");

      // Get reels over time
      const reels = await Reel.find({
        $or: [{ author: userId }, { createdBy: userId }],
        isPublished: true,
        isDeleted: false,
        createdAt: { $gte: startDate, $lte: endDate },
      }).select("createdAt viewCount");

      // Get likes over time
      const likeTimeQuery = [];
      if (postIds.length > 0) {
        likeTimeQuery.push({
          targetType: "post",
          targetId: { $in: postIds },
          createdAt: { $gte: startDate, $lte: endDate },
        });
      }
      if (reelIds.length > 0) {
        likeTimeQuery.push({
          targetType: "reel",
          targetId: { $in: reelIds },
          createdAt: { $gte: startDate, $lte: endDate },
        });
      }
      const likes =
        likeTimeQuery.length > 0
          ? await Like.find({ $or: likeTimeQuery }).select("createdAt")
          : [];

      // Get comments over time
      const commentTimeQuery = [];
      if (postIds.length > 0) {
        commentTimeQuery.push({
          targetType: "post",
          targetId: { $in: postIds },
          createdAt: { $gte: startDate, $lte: endDate },
        });
      }
      if (reelIds.length > 0) {
        commentTimeQuery.push({
          targetType: "reel",
          targetId: { $in: reelIds },
          createdAt: { $gte: startDate, $lte: endDate },
        });
      }
      const comments =
        commentTimeQuery.length > 0
          ? await Comment.find({ $or: commentTimeQuery }).select("createdAt")
          : [];

      // Get followers over time
      const followers = await Follow.find({
        followingId: userId,
        createdAt: { $gte: startDate, $lte: endDate },
      }).select("createdAt");

      // Group by date
      const postsByDate = groupByDate(posts, "createdAt");
      const reelsByDate = groupByDate(reels, "createdAt");
      const likesByDate = groupByDate(likes, "createdAt");
      const commentsByDate = groupByDate(comments, "createdAt");
      const followersByDate = groupByDate(followers, "createdAt");

      // Get all unique dates
      const allDates = new Set();
      [
        ...Object.keys(postsByDate),
        ...Object.keys(reelsByDate),
        ...Object.keys(likesByDate),
        ...Object.keys(commentsByDate),
        ...Object.keys(followersByDate),
      ].forEach((date) => allDates.add(date));

      // Create time series data
      const timeSeries = Array.from(allDates)
        .sort()
        .map((date) => ({
          date,
          posts: postsByDate[date] || 0,
          reels: reelsByDate[date] || 0,
          likes: likesByDate[date] || 0,
          comments: commentsByDate[date] || 0,
          followers: followersByDate[date] || 0,
        }));

      // Calculate cumulative followers
      let cumulativeFollowers = 0;
      const followersData = await Follow.find({
        followingId: userId,
        createdAt: { $lte: endDate },
      })
        .select("createdAt")
        .sort({ createdAt: 1 });

      const followersTimeSeries = followersData.map((f) => {
        cumulativeFollowers++;
        return {
          date: new Date(f.createdAt).toISOString().split("T")[0],
          count: cumulativeFollowers,
        };
      });

      res.json({
        timeSeries,
        followersGrowth: followersTimeSeries,
        period: {
          days: parseInt(days),
          startDate,
          endDate,
        },
      });
    } catch (error) {
      console.error("Analytics activity error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /analytics/posts - Get post-specific analytics
router.get(
  "/posts",
  authenticateToken,
  authorizeRoles("creator", "enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);
      const { limit = 10 } = req.query;

      const posts = await Post.find({ accountId: userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      const postIds = posts.map((p) => String(p._id));

      // Get likes and comments for each post
      const [likes, comments] = await Promise.all([
        Like.find({ targetType: "post", targetId: { $in: postIds } }),
        Comment.find({ targetType: "post", targetId: { $in: postIds } }),
      ]);

      const likesMap = {};
      const commentsMap = {};

      likes.forEach((like) => {
        if (!likesMap[like.targetId]) likesMap[like.targetId] = 0;
        likesMap[like.targetId]++;
      });

      comments.forEach((comment) => {
        if (!commentsMap[comment.targetId]) commentsMap[comment.targetId] = 0;
        commentsMap[comment.targetId]++;
      });

      const postsWithStats = posts.map((post) => ({
        _id: post._id,
        content: post.content?.substring(0, 100) || "",
        createdAt: post.createdAt,
        likes: likesMap[String(post._id)] || 0,
        comments: commentsMap[String(post._id)] || 0,
        engagement:
          (likesMap[String(post._id)] || 0) +
          (commentsMap[String(post._id)] || 0) * 2,
      }));

      // Sort by engagement
      postsWithStats.sort((a, b) => b.engagement - a.engagement);

      res.json({
        posts: postsWithStats,
        total: posts.length,
      });
    } catch (error) {
      console.error("Analytics posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /analytics/reels - Get reel-specific analytics
router.get(
  "/reels",
  authenticateToken,
  authorizeRoles("creator", "enterprise"),
  async (req, res) => {
    try {
      const userId = String(req.user._id);
      const { limit = 10 } = req.query;

      const reels = await Reel.find({
        $or: [{ author: userId }, { createdBy: userId }],
        isPublished: true,
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      const reelIds = reels.map((r) => String(r._id));

      // Get likes and comments for each reel
      const [likes, comments] = await Promise.all([
        Like.find({ targetType: "reel", targetId: { $in: reelIds } }),
        Comment.find({ targetType: "reel", targetId: { $in: reelIds } }),
      ]);

      const likesMap = {};
      const commentsMap = {};

      likes.forEach((like) => {
        if (!likesMap[like.targetId]) likesMap[like.targetId] = 0;
        likesMap[like.targetId]++;
      });

      comments.forEach((comment) => {
        if (!commentsMap[comment.targetId]) commentsMap[comment.targetId] = 0;
        commentsMap[comment.targetId]++;
      });

      const reelsWithStats = reels.map((reel) => ({
        _id: reel._id,
        title: reel.title || "",
        createdAt: reel.createdAt,
        views: reel.viewCount || 0,
        likes: likesMap[String(reel._id)] || 0,
        comments: commentsMap[String(reel._id)] || 0,
        engagement:
          (reel.viewCount || 0) * 0.1 +
          (likesMap[String(reel._id)] || 0) +
          (commentsMap[String(reel._id)] || 0) * 2,
      }));

      // Sort by engagement
      reelsWithStats.sort((a, b) => b.engagement - a.engagement);

      res.json({
        reels: reelsWithStats,
        total: reels.length,
      });
    } catch (error) {
      console.error("Analytics reels error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

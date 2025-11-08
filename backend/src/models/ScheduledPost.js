import mongoose from "mongoose";
import Post from "./Post.js";

const ImageSchema = new mongoose.Schema(
  {
    filename: { type: String },
    contentType: { type: String, required: true },
    data: { type: String, required: true }, // base64 string
    size: { type: Number },
  },
  { _id: false }
);

const ScheduledPostSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, index: true },
    content: { type: String, default: "", maxlength: 5000 },
    images: { type: [ImageSchema], default: [] },
    scheduledDate: { type: Date, required: true, index: true },
    isReleased: { type: Boolean, default: false, index: true },
    releasedAt: { type: Date, default: null },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    fundingTotal: { type: Number, default: 0 }, // Total funding in cents
    fundingCount: { type: Number, default: 0 }, // Number of donations
    isAnonymous: { type: Boolean, default: false, index: true },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: false,
      index: true,
    },
    // Reference to the actual Post created when released
    releasedPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
ScheduledPostSchema.index({ scheduledDate: 1, isReleased: 1 });
ScheduledPostSchema.index({ accountId: 1, scheduledDate: -1 });
ScheduledPostSchema.index({ isReleased: 1, scheduledDate: 1 });

// Static method to check and release scheduled posts
ScheduledPostSchema.statics.checkAndRelease = async function () {
  try {
    const now = new Date();

    // Find all scheduled posts that should be released
    const postsToRelease = await this.find({
      isReleased: false,
      scheduledDate: { $lte: now },
    });

    if (postsToRelease.length === 0) {
      return { released: 0 };
    }

    let releasedCount = 0;

    for (const scheduledPost of postsToRelease) {
      try {
        // Create the actual Post
        const post = await Post.create({
          accountId: scheduledPost.accountId,
          content: scheduledPost.content,
          images: scheduledPost.images,
          isAnonymous: scheduledPost.isAnonymous,
          community: scheduledPost.community,
          likesCount: scheduledPost.likesCount,
          commentsCount: scheduledPost.commentsCount,
          fundingTotal: scheduledPost.fundingTotal,
          fundingCount: scheduledPost.fundingCount,
        });

        // Update scheduled post
        scheduledPost.isReleased = true;
        scheduledPost.releasedAt = now;
        scheduledPost.releasedPostId = post._id;
        await scheduledPost.save();

        releasedCount++;
        console.log(
          `[ScheduledPost] Released scheduled post ${scheduledPost._id} as post ${post._id}`
        );
      } catch (error) {
        console.error(
          `[ScheduledPost] Error releasing post ${scheduledPost._id}:`,
          error
        );
      }
    }

    return { released: releasedCount };
  } catch (error) {
    console.error("[ScheduledPost] Error in checkAndRelease:", error);
    return { released: 0, error: error.message };
  }
};

const ScheduledPost =
  mongoose.models.ScheduledPost ||
  mongoose.model("ScheduledPost", ScheduledPostSchema);

export default ScheduledPost;

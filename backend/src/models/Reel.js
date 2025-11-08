import mongoose from "mongoose";

const SceneSchema = new mongoose.Schema(
  {
    duration: { type: Number, required: true },
    text: { type: String, required: true },
    description: { type: String, default: "" },
    voiceover: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imageSource: { type: String, default: "" },
    photographer: { type: String, default: "" },
    photographerUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ReelSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // For AI-generated reels
    script: { type: String, default: "" }, // Not required for uploaded videos
    narration: { type: String, default: "" },
    totalDuration: { type: Number, default: 0 },
    scenes: { type: [SceneSchema], default: [] },

    // For uploaded videos
    videoUrl: { type: String, default: "" },
    videoPath: { type: String, default: "" },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // Video duration in seconds

    // Metadata
    topic: { type: String, default: "" },
    prompt: { type: String, default: "" },
    generatedAt: { type: Date, default: Date.now },

    // Creator info
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      // Keep for backward compatibility
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Engagement metrics
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    // Tags for recommendation
    tags: { type: [String], default: [] },

    // Status
    isPublished: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    // Advertisement fields
    isAdvertisement: { type: Boolean, default: false, index: true },
    advertisementViews: { type: Number, default: 0 },
    advertisementClicks: { type: Number, default: 0 },
    advertisementReactions: { type: Number, default: 0 }, // Likes + comments
    advertisementTargetUrl: { type: String, default: "" }, // URL to redirect on click
    advertisementBudget: { type: Number, default: 0 }, // Budget in cents
    advertisementSpent: { type: Number, default: 0 }, // Amount spent in cents
  },
  { timestamps: true }
);

// Indexes for faster queries
ReelSchema.index({ createdAt: -1 });
ReelSchema.index({ viewCount: -1 });
ReelSchema.index({ likeCount: -1 });
ReelSchema.index({ topic: 1 });
ReelSchema.index({ tags: 1 });
ReelSchema.index({ isPublished: 1, isDeleted: 1 });
ReelSchema.index({ isAdvertisement: 1, createdAt: -1 });

export default mongoose.model("Reel", ReelSchema);

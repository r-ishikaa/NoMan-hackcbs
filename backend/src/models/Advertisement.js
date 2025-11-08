import mongoose from "mongoose";

const AdvertisementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    reelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel",
      default: null,
    },
    type: {
      type: String,
      enum: ["post", "reel"],
      required: true,
    },
    targetUrl: {
      type: String,
      default: "",
    },
    budget: {
      type: Number,
      default: 0, // Budget in cents
    },
    spent: {
      type: Number,
      default: 0, // Amount spent in cents
    },
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    reactions: {
      type: Number,
      default: 0, // Likes + comments
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
AdvertisementSchema.index({ userId: 1, createdAt: -1 });
AdvertisementSchema.index({ postId: 1 });
AdvertisementSchema.index({ reelId: 1 });
AdvertisementSchema.index({ isActive: 1 });

// Pricing model: $0.01 per view, $0.10 per click, $0.05 per reaction
AdvertisementSchema.methods.calculateCost = function () {
  const costPerView = 0.01; // $0.01 = 1 cent
  const costPerClick = 0.1; // $0.10 = 10 cents
  const costPerReaction = 0.05; // $0.05 = 5 cents

  const viewCost = this.views * costPerView * 100; // Convert to cents
  const clickCost = this.clicks * costPerClick * 100;
  const reactionCost = this.reactions * costPerReaction * 100;

  return Math.round(viewCost + clickCost + reactionCost);
};

const Advertisement =
  mongoose.models.Advertisement ||
  mongoose.model("Advertisement", AdvertisementSchema);

export default Advertisement;

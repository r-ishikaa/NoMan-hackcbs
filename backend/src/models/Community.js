import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    image: String,
    tags: [String],
    memberCount: { type: Number, default: 0 },
    bgColor: { type: String, default: "bg-purple-300" }, // Background color for theme
  },
  { timestamps: true }
);

// Index for faster queries
communitySchema.index({ createdAt: -1 });
communitySchema.index({ memberCount: -1 });

const Community = mongoose.models.Community || mongoose.model("Community", communitySchema);
export default Community;


import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    filename: { type: String },
    contentType: { type: String, required: true },
    data: { type: String, required: true }, // base64 string
    size: { type: Number },
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, index: true },
    content: { type: String, default: "", maxlength: 5000 },
    images: { type: [ImageSchema], default: [] },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    fundingTotal: { type: Number, default: 0 }, // Total funding in cents
    fundingCount: { type: Number, default: 0 }, // Number of donations
    isAnonymous: { type: Boolean, default: false, index: true }, // Anonymous posting flag
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: false, // make it optional so old posts don't break
      index: true,
    },
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ isAnonymous: 1, createdAt: -1 });
PostSchema.index({ accountId: 1, isAnonymous: 1 });

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
export default Post;

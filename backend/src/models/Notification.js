import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      required: true,
      // Notification types: "new_post", "new_reel", "follow", "like", "comment"
    },
    message: { type: String, required: true },
    relatedUserId: { type: String, default: "" }, // User who triggered the notification
    relatedUsername: { type: String, default: "" }, // Username of the user who triggered the notification
    relatedPostId: { type: String, default: "" }, // Post ID if notification is about a post
    relatedReelId: { type: String, default: "" }, // Reel ID if notification is about a reel
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export default Notification;



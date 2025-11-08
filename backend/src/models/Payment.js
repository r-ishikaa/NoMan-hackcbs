import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true, index: true },
    donorId: { type: String, required: true, index: true }, // User who made the donation
    recipientId: { type: String, required: true, index: true }, // Post author
    amount: { type: Number, required: true }, // Amount in cents
    currency: { type: String, default: "usd" },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "canceled"],
      default: "pending",
    },
    message: { type: String, default: "" }, // Optional message from donor
  },
  { timestamps: true }
);

PaymentSchema.index({ postId: 1, createdAt: -1 });
PaymentSchema.index({ recipientId: 1, createdAt: -1 });
PaymentSchema.index({ donorId: 1, createdAt: -1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

export default Payment;


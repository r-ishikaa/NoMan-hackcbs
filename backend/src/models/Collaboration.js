import mongoose from 'mongoose';

const collaborationSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    walletType: {
      type: String,
      enum: ['metamask', 'phantom'],
      required: true,
    },
    network: {
      type: String,
      enum: ['ethereum', 'solana'],
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 1,
    },
    duration: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    deliverables: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    creatorResponse: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    transactionHash: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
collaborationSchema.index({ creatorId: 1, status: 1 });
collaborationSchema.index({ brandId: 1, status: 1 });
collaborationSchema.index({ createdAt: -1 });

const Collaboration = mongoose.model('Collaboration', collaborationSchema);

export default Collaboration;


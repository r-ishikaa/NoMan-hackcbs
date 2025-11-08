import mongoose from 'mongoose';

const CommunityMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a user can only join a community once
CommunityMembershipSchema.index({ userId: 1, communityId: 1 }, { unique: true });

const CommunityMembership = mongoose.models.CommunityMembership || mongoose.model('CommunityMembership', CommunityMembershipSchema);
export default CommunityMembership;


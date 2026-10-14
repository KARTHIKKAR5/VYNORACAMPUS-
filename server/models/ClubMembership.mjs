import mongoose from 'mongoose';

const ClubMembershipSchema = new mongoose.Schema(
  {
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['MEMBER', 'LEAD', 'COORDINATOR'], default: 'MEMBER' },
    status: { type: String, enum: ['ACTIVE', 'PENDING', 'LEFT'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

ClubMembershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });

export const ClubMembership = mongoose.model('ClubMembership', ClubMembershipSchema);

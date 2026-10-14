import mongoose from 'mongoose';

const ProjectMembershipSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, default: '' },
    role: { type: String, default: 'Member' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' }
  },
  { timestamps: true }
);

ProjectMembershipSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const ProjectMembership = mongoose.model('ProjectMembership', ProjectMembershipSchema);

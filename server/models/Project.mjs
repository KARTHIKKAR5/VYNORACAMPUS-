import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    about: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: { type: String, default: 'Aarav Mehta' },
    skills: [{ type: String, trim: true }],
    membersCount: { type: Number, default: 1 },
    maxMembers: { type: Number, default: 5 },
    status: { type: String, enum: ['Idea', 'Planning', 'Building', 'Testing', 'Complete'], default: 'Idea' },
    recruiting: { type: Boolean, default: true, index: true },
    accent: { type: String, default: '#9b5a3d' }
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', ProjectSchema);

import mongoose from 'mongoose';

const CommunityPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String },
    authorDept: { type: String },
    topic: { type: String, default: 'Academics', index: true },
    category: { type: String, default: 'HELP REQUEST' },
    skills: [{ type: String }],
    featured: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'REPORTED', 'REMOVED'], default: 'ACTIVE', index: true }
  },
  { timestamps: true }
);

export const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

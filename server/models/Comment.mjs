import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'REMOVED'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

export const Comment = mongoose.model('Comment', CommentSchema);

import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['POST', 'COMMENT'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['LIKE', 'CLAP', 'HELPFUL'], default: 'LIKE' }
  },
  { timestamps: true }
);

ReactionSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

export const Reaction = mongoose.model('Reaction', ReactionSchema);

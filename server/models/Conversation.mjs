import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['DIRECT', 'GROUP'], default: 'DIRECT' },
    name: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', ConversationSchema);

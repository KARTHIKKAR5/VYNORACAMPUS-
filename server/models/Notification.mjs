import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    detail: { type: String, default: '' },
    kind: {
      type: String,
      enum: ['announcement', 'event', 'project', 'message', 'club', 'admin', 'community', 'opportunity'],
      default: 'announcement',
      index: true
    },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', NotificationSchema);

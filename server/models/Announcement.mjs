import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', index: true },
    clubName: { type: String },
    category: {
      type: String,
      enum: ['GENERAL', 'RECRUITMENT', 'WORKSHOP', 'COMPETITION', 'EVENT', 'INTERNSHIP', 'OPPORTUNITY', 'IMPORTANT_NOTICE'],
      default: 'GENERAL',
      index: true
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      index: true
    },
    isOfficial: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true
    },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

AnnouncementSchema.index({ priority: 1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', AnnouncementSchema);

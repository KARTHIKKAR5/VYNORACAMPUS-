import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

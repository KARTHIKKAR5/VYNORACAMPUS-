import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reporterName: { type: String },
    targetType: {
      type: String,
      enum: ['USER', 'POST', 'EVENT', 'PROJECT', 'CLUB', 'MESSAGE'],
      required: true,
      index: true
    },
    targetId: { type: String, required: true },
    targetTitle: { type: String },
    reason: { type: String, required: true },
    details: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true
    },
    actionTaken: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Report = mongoose.model('Report', ReportSchema);

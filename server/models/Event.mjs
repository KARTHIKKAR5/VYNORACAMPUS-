import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', index: true },
    clubName: { type: String },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    venue: { type: String, required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    deadline: { type: Date },
    maxCapacity: { type: Number, default: 100 },
    registeredCount: { type: Number, default: 0 },
    category: { type: String, default: 'Workshop', index: true },
    code: { type: String, default: 'CAMPUS' },
    artClass: { type: String, default: 'art0' },
    poster: { type: String },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'CANCELLED'],
      default: 'PUBLISHED',
      index: true
    }
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', EventSchema);

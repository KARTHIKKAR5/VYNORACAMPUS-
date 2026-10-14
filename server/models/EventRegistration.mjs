import mongoose from 'mongoose';

const EventRegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['CONFIRMED', 'WAITLIST', 'CANCELLED'], default: 'CONFIRMED' },
    registeredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventRegistration = mongoose.model('EventRegistration', EventRegistrationSchema);

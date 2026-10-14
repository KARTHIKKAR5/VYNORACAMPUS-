import mongoose from 'mongoose';

const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    logo: { type: String },
    banner: { type: String },
    clubHeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    facultyCoordinator: { type: String, default: 'Faculty Advisor' },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'APPROVED',
      index: true
    },
    membersCount: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const Club = mongoose.model('Club', ClubSchema);

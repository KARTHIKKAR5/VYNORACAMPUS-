import mongoose from 'mongoose';

const TimetableEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    subject: { type: String, required: true },
    courseCode: { type: String },
    faculty: { type: String },
    room: { type: String },
    type: { type: String, default: 'Lecture' }
  },
  { _id: false }
);

const TimetableSchema = new mongoose.Schema(
  {
    degree: { type: String, default: 'B.Tech' },
    program: { type: String, required: true },
    year: { type: String, required: true },
    batch: { type: String, required: true },
    sruBatchCode: { type: String, required: true, unique: true, index: true },
    academicSession: { type: String, default: '2026-27' },
    entries: [TimetableEntrySchema],
    source: { type: String, default: 'SR University Academic Schedule' },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'System Academic Admin' }
  },
  { timestamps: true }
);

export const Timetable = mongoose.model('Timetable', TimetableSchema);

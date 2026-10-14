import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: [
        'Mid-term Exam Paper',
        'End-term Exam Paper',
        'Lecture Notes',
        'Lab Manual',
        'Photo / Handwritten',
        'Assignment Solution',
        'Syllabus & Guide',
        'General'
      ],
      default: 'Mid-term Exam Paper',
      index: true
    },
    format: {
      type: String,
      default: 'PDF',
      index: true
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: 'Student' },
    authorDept: { type: String, default: 'Engineering' },
    fileData: { type: String }, // Base64 Data URL or remote URL
    fileName: { type: String },
    fileType: { type: String, enum: ['document', 'photo', 'link'], default: 'document' },
    fileSize: { type: String },
    url: { type: String },
    isVerified: { type: Boolean, default: true },
    downloadsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Resource = mongoose.model('Resource', ResourceSchema);

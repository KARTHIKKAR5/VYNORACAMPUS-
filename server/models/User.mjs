import mongoose from 'mongoose';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String, trim: true },
    role: {
      type: String,
      enum: ['STUDENT', 'CLUB_HEAD', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'],
      default: 'STUDENT',
      index: true
    },
    isVerified: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
    avatarColor: { type: String, default: '#c3e1d2' },
    avatarInitials: { type: String },
    academicProfile: {
      university: { type: String, default: 'SR University' },
      degree: { type: String, default: 'B.Tech' },
      program: { type: String, default: 'CSE-AIML' },
      year: { type: String, default: 'Third year' },
      batch: { type: String, default: '10' },
      batchCode: { type: String, default: '24BTCAIAIB10' },
      sruBatchCode: { type: String, default: '24BTCAIAIB10' },
      academicYear: { type: String, default: '2026-27' },
      department: { type: String, default: 'Computer Science' }
    },
    skills: [{ type: String, trim: true }],
    interest: { type: String, default: 'Exploring collaborative campus projects' },
    interests: [{ type: String, trim: true }],
    bio: { type: String, default: '' },
    socialLinks: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      portfolio: { type: String, trim: true }
    },
    profileCompleted: { type: Boolean, default: true },
    privacy: {
      showEmail: { type: Boolean, default: false },
      profileVisibility: { type: String, enum: ['PUBLIC', 'CAMPUS', 'CONNECTIONS'], default: 'CAMPUS' }
    }
  },
  { timestamps: true }
);

UserSchema.pre('save', function () {
  if (this.name && !this.avatarInitials) {
    const parts = this.name.trim().split(/\s+/);
    this.avatarInitials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
  }
});


UserSchema.statics.hashPassword = function (password) {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${digest}`;
};

UserSchema.methods.verifyPassword = function (password) {
  if (!this.passwordHash || typeof password !== 'string') return false;
  const [salt, digest] = this.passwordHash.split(':');
  if (!salt || !digest) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
};

UserSchema.methods.toPublicProfile = function (isOwner = false) {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    name: this.name,
    email: isOwner || this.privacy?.showEmail ? this.email : undefined,
    role: this.role,
    isVerified: this.isVerified,
    avatarColor: this.avatarColor,
    avatarInitials: this.avatarInitials,
    avatarUrl: this.avatarUrl,
    dept: this.academicProfile?.department || 'Computer Science',
    year: this.academicProfile?.year ? (this.academicProfile.year.includes('year') ? this.academicProfile.year : `${this.academicProfile.year} year`) : 'Third year',
    skills: this.skills || [],
    interest: this.interest,
    interests: Array.isArray(this.interests) && this.interests.length ? this.interests : (this.interest ? [this.interest] : []),
    bio: this.bio,
    academicProfile: this.academicProfile,
    socialLinks: this.socialLinks || {},
    profileCompleted: this.profileCompleted ?? true,
    authProvider: isOwner ? this.authProvider : undefined,
    online: true
  };
};

export const User = mongoose.model('User', UserSchema);

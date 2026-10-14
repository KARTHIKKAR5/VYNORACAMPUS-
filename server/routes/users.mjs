import express from 'express';
import { User } from '../models/User.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';

const router = express.Router();

// GET /api/v1/users - Search and discovery
router.get('/', authenticate, async (req, res) => {
  try {
    const { q, dept, skill, limit = 50, page = 1 } = req.query;
    const filter = { isSuspended: false };

    if (dept && dept !== 'All') {
      filter['academicProfile.department'] = new RegExp(`^${dept}`, 'i');
    }

    if (skill) {
      filter.skills = new RegExp(skill, 'i');
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { skills: regex },
        { 'academicProfile.department': regex },
        { 'academicProfile.program': regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    return res.json({
      users: users.map((u) => u.toPublicProfile()),
      total,
      page: Number(page)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to fetch users.' });
  }
});

// GET /api/v1/users/me - Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  return res.json({ student: req.user.toPublicProfile(true) });
});

// GET /api/v1/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isSuspended) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    return res.json({ user: user.toPublicProfile() });
  } catch {
    return res.status(404).json({ error: 'User not found.' });
  }
});

// PATCH /api/v1/users/me - Update profile
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, bio, interest, interests, skills, academicProfile, socialLinks, avatarUrl, privacy } = req.body;
    const user = req.user;

    // Strict role escalation protection: ignore any attempts to change role/isVerified/isSuspended
    if (name?.trim()) user.name = name.trim();
    if (bio !== undefined) user.bio = String(bio).trim();
    if (interest !== undefined) user.interest = String(interest).trim();
    if (Array.isArray(interests)) {
      user.interests = interests.map((i) => String(i).trim()).filter(Boolean);
      if (user.interests.length && !user.interest) {
        user.interest = user.interests.join(' · ');
      }
    }
    if (Array.isArray(skills)) user.skills = skills.map((s) => String(s).trim()).filter(Boolean);

    if (academicProfile && typeof academicProfile === 'object') {
      user.academicProfile = {
        ...user.academicProfile,
        ...(academicProfile.university ? { university: String(academicProfile.university).trim() } : {}),
        ...(academicProfile.degree ? { degree: String(academicProfile.degree).trim() } : {}),
        ...(academicProfile.program ? { program: String(academicProfile.program).trim() } : {}),
        ...(academicProfile.year ? { year: String(academicProfile.year).trim() } : {}),
        ...(academicProfile.batch ? { batch: String(academicProfile.batch).trim() } : {}),
        ...(academicProfile.batchCode ? { batchCode: String(academicProfile.batchCode).trim() } : {}),
        ...(academicProfile.sruBatchCode ? { sruBatchCode: String(academicProfile.sruBatchCode).trim() } : {}),
        ...(academicProfile.department ? { department: String(academicProfile.department).trim() } : {})
      };
    }

    if (socialLinks && typeof socialLinks === 'object') {
      user.socialLinks = {
        ...user.socialLinks,
        ...(socialLinks.github !== undefined ? { github: String(socialLinks.github).trim() } : {}),
        ...(socialLinks.linkedin !== undefined ? { linkedin: String(socialLinks.linkedin).trim() } : {}),
        ...(socialLinks.portfolio !== undefined ? { portfolio: String(socialLinks.portfolio).trim() } : {})
      };
    }

    if (avatarUrl && typeof avatarUrl === 'string') {
      user.avatarUrl = avatarUrl.trim();
    }

    if (privacy && typeof privacy === 'object') {
      user.privacy = { ...user.privacy, ...privacy };
    }

    // Check if required profile fields are completed
    if (
      user.name &&
      user.academicProfile?.department &&
      user.academicProfile?.year &&
      (user.interests?.length > 0 || user.interest)
    ) {
      user.profileCompleted = true;
    }

    await user.save();
    return res.json({ student: user.toPublicProfile(true) });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update profile.' });
  }
});

export default router;

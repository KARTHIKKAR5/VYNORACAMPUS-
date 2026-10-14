import express from 'express';
import { Club } from '../models/Club.mjs';
import { ClubMembership } from '../models/ClubMembership.mjs';
import { Announcement } from '../models/Announcement.mjs';
import { Event } from '../models/Event.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// GET /api/v1/clubs - List approved clubs
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, q } = req.query;
    const filter = { status: 'APPROVED' };

    if (category && category !== 'All') {
      filter.category = new RegExp(category, 'i');
    }

    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') }
      ];
    }

    const clubs = await Club.find(filter)
      .populate('clubHeadId', 'name email avatarColor avatarInitials')
      .sort({ membersCount: -1 });

    return res.json({ clubs });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch clubs.' });
  }
});

// GET /api/v1/clubs/:id - Club detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('clubHeadId', 'name email avatarColor avatarInitials academicProfile');

    if (!club) {
      return res.status(404).json({ error: 'Club not found.' });
    }

    const [announcements, events, isMember] = await Promise.all([
      Announcement.find({ clubId: club._id, status: 'PUBLISHED' }).sort({ createdAt: -1 }).limit(10),
      Event.find({ clubId: club._id, status: 'PUBLISHED' }).sort({ startTime: 1 }).limit(5),
      req.user ? ClubMembership.exists({ clubId: club._id, userId: req.user._id, status: 'ACTIVE' }) : false
    ]);

    return res.json({ club, announcements, events, isMember: Boolean(isMember) });
  } catch (error) {
    return res.status(404).json({ error: 'Club not found.' });
  }
});

// POST /api/v1/clubs - Submit club application
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, category, facultyCoordinator } = req.body;
    if (!name?.trim() || !description?.trim() || !category?.trim()) {
      return res.status(400).json({ error: 'Club name, description, and category are required.' });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Club.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({ error: 'A club with this name or slug already exists.' });
    }

    const isAutoApprove = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const club = await Club.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      category: category.trim(),
      clubHeadId: req.user._id,
      facultyCoordinator: facultyCoordinator || 'To be assigned',
      status: isAutoApprove ? 'APPROVED' : 'PENDING',
      membersCount: 1
    });

    await ClubMembership.create({
      clubId: club._id,
      userId: req.user._id,
      role: 'LEAD',
      status: 'ACTIVE'
    });

    await logAudit({
      actor: req.user,
      action: isAutoApprove ? 'CLUB_CREATED' : 'CLUB_APPLICATION_SUBMITTED',
      targetType: 'CLUB',
      targetId: club._id,
      details: { name: club.name, status: club.status },
      req
    });

    return res.status(201).json({
      club,
      message: isAutoApprove ? 'Club created and active.' : 'Club application submitted for administrator review.'
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create club.' });
  }
});

// PATCH /api/v1/clubs/:id - Update club (Authorized club head or admin)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    const isAuthorized =
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN' ||
      (club.clubHeadId && club.clubHeadId.equals(req.user._id));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to manage this club.' });
    }

    const { description, category, logo, banner, facultyCoordinator } = req.body;
    if (description) club.description = description.trim();
    if (category) club.category = category.trim();
    if (logo !== undefined) club.logo = logo;
    if (banner !== undefined) club.banner = banner;
    if (facultyCoordinator) club.facultyCoordinator = facultyCoordinator.trim();

    await club.save();
    return res.json({ club });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update club.' });
  }
});

// POST /api/v1/clubs/:id/join - Join club
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club || club.status !== 'APPROVED') {
      return res.status(404).json({ error: 'Club not available to join.' });
    }

    const existing = await ClubMembership.findOne({ clubId: club._id, userId: req.user._id });
    if (existing && existing.status === 'ACTIVE') {
      return res.status(400).json({ error: 'You are already an active member of this club.' });
    }

    if (existing) {
      existing.status = 'ACTIVE';
      await existing.save();
    } else {
      await ClubMembership.create({
        clubId: club._id,
        userId: req.user._id,
        role: 'MEMBER',
        status: 'ACTIVE'
      });
      club.membersCount += 1;
      await club.save();
    }

    return res.json({ success: true, message: `You have joined ${club.name}!` });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to join club.' });
  }
});

// DELETE /api/v1/clubs/:id/leave - Leave club
router.delete('/:id/leave', requireAuth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    const deleted = await ClubMembership.findOneAndDelete({ clubId: club._id, userId: req.user._id });
    if (deleted) {
      club.membersCount = Math.max(1, club.membersCount - 1);
      await club.save();
    }

    return res.json({ success: true, message: `You have left ${club.name}.` });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to leave club.' });
  }
});

export default router;

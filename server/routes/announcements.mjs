import express from 'express';
import { Announcement } from '../models/Announcement.mjs';
import { Club } from '../models/Club.mjs';
import { Notification } from '../models/Notification.mjs';
import { User } from '../models/User.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// GET /api/v1/announcements
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, priority, official, clubId, limit = 50 } = req.query;
    const filter = { status: 'PUBLISHED' };

    if (category && category !== 'All') filter.category = category;
    if (priority) filter.priority = priority;
    if (official !== undefined) filter.isOfficial = official === 'true';
    if (clubId) filter.clubId = clubId;

    const announcements = await Announcement.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .limit(Number(limit));

    return res.json({ announcements });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch announcements.' });
  }
});

// POST /api/v1/announcements
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, body, clubId, category, priority, isOfficial, expiresAt } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    let clubName = null;
    if (clubId) {
      const club = await Club.findById(clubId);
      if (!club) return res.status(404).json({ error: 'Club not found.' });

      const isClubHead = club.clubHeadId && club.clubHeadId.equals(req.user._id);
      const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
      if (!isClubHead && !isAdmin) {
        return res.status(403).json({ error: 'Only authorized club heads or administrators can publish club announcements.' });
      }
      clubName = club.name;
    }

    const officialFlag = Boolean(isOfficial);
    if (officialFlag && !['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only faculty and administrators can publish official college announcements.' });
    }

    // Prevent duplicate announcement submissions within 1 minute
    const recentDuplicate = await Announcement.findOne({
      title: title.trim(),
      authorId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 60000) }
    });
    if (recentDuplicate) {
      return res.status(409).json({ error: 'An announcement with this title was already published recently.' });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      body: body.trim(),
      authorId: req.user._id,
      authorName: req.user.name,
      clubId: clubId || undefined,
      clubName,
      category: category || 'GENERAL',
      priority: priority || (officialFlag ? 'HIGH' : 'NORMAL'),
      isOfficial: officialFlag,
      status: 'PUBLISHED',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    // Notify only members if club-specific, or all active students if official
    if (clubId) {
      const { ClubMembership } = await import('../models/ClubMembership.mjs');
      const clubMembers = await ClubMembership.find({ clubId, status: 'ACTIVE' }).select('userId');
      if (clubMembers.length > 0) {
        const notifs = clubMembers.map((m) => ({
          recipientId: m.userId,
          title: announcement.title,
          detail: `Club Update · ${clubName || 'College Club'}`,
          kind: 'club',
          clubId,
          link: '#clubs'
        }));
        await Notification.insertMany(notifs).catch(() => {});
      }
    } else if (officialFlag || priority === 'URGENT') {
      const allUsers = await User.find({ isSuspended: false }).select('_id');
      const notifs = allUsers.map((u) => ({
        recipientId: u._id,
        title: announcement.title,
        detail: officialFlag ? 'Official SR University Notice' : 'Campus Update',
        kind: 'announcement',
        link: '#announcements'
      }));
      await Notification.insertMany(notifs).catch(() => {});
    }

    await logAudit({
      actor: req.user,
      action: 'ANNOUNCEMENT_PUBLISHED',
      targetType: 'ANNOUNCEMENT',
      targetId: announcement._id,
      details: { title: announcement.title, official: officialFlag, priority },
      req
    });

    return res.status(201).json({ announcement });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to publish announcement.' });
  }
});

// DELETE /api/v1/announcements/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found.' });

    const isAuthor = announcement.authorId.equals(req.user._id);
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this announcement.' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    await logAudit({
      actor: req.user,
      action: 'ANNOUNCEMENT_DELETED',
      targetType: 'ANNOUNCEMENT',
      targetId: req.params.id,
      details: { title: announcement.title },
      req
    });

    return res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to delete announcement.' });
  }
});

export default router;

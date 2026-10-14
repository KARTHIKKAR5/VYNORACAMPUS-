import express from 'express';
import { Notification } from '../models/Notification.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';

const router = express.Router();

import { ClubMembership } from '../models/ClubMembership.mjs';

// GET /api/v1/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    // Find clubs the current student has actively joined
    const activeMemberships = await ClubMembership.find({
      userId: req.user._id,
      status: 'ACTIVE'
    }).select('clubId');
    const activeClubIds = new Set(activeMemberships.map((m) => m.clubId.toString()));

    const rawNotifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(40);

    // Only keep notifications for clubs the user is actually interested in / joined
    const notifications = rawNotifications.filter((n) => {
      if (n.kind === 'club' && n.clubId) {
        return activeClubIds.has(n.clubId.toString());
      }
      return true;
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch notifications.' });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });
    return res.json({ notification: notif });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to update notification.' });
  }
});

// POST /api/v1/notifications/read-all
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to clear notifications.' });
  }
});

export default router;

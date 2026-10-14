import express from 'express';
import { User } from '../models/User.mjs';
import { Club } from '../models/Club.mjs';
import { Event } from '../models/Event.mjs';
import { Announcement } from '../models/Announcement.mjs';
import { Report } from '../models/Report.mjs';
import { Order } from '../models/Order.mjs';
import { AuditLog } from '../models/AuditLog.mjs';
import { FeatureSetting } from '../models/FeatureSetting.mjs';
import { requireAuth } from '../middleware/auth.mjs';
import { requireRole } from '../middleware/rbac.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// Require ADMIN or SUPER_ADMIN for all routes in this file
router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

// GET /api/v1/admin/metrics - Real aggregated metrics
router.get('/metrics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalClubHeads,
      totalFaculty,
      totalClubs,
      pendingClubs,
      totalEvents,
      totalAnnouncements,
      pendingReports,
      totalOrders,
      recentAuditLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'CLUB_HEAD' }),
      User.countDocuments({ role: 'FACULTY' }),
      Club.countDocuments({ status: 'APPROVED' }),
      Club.countDocuments({ status: 'PENDING' }),
      Event.countDocuments({ status: 'PUBLISHED' }),
      Announcement.countDocuments({ status: 'PUBLISHED' }),
      Report.countDocuments({ status: 'PENDING' }),
      Order.countDocuments({ status: 'PAID' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    return res.json({
      metrics: {
        totalUsers,
        totalStudents,
        totalClubHeads,
        totalFaculty,
        totalClubs,
        pendingClubs,
        totalEvents,
        totalAnnouncements,
        pendingReports,
        totalOrders,
        totalRevenue
      },
      recentActivity: recentAuditLogs
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to calculate platform metrics.' });
  }
});

// GET /api/v1/admin/users - User management
router.get('/users', async (req, res) => {
  try {
    const { role, isSuspended, q, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (role && role !== 'All') filter.role = role;
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { 'academicProfile.department': new RegExp(q, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);
    return res.json({ users, total, page: Number(page) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch users list.' });
  }
});

// PATCH /api/v1/admin/users/:id - Update user role or suspension
router.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Super Admin protection
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Administrators can modify Super Admin accounts.' });
    }

    const { role, isSuspended, suspensionReason } = req.body;

    if (role && ['STUDENT', 'CLUB_HEAD', 'FACULTY', 'ADMIN'].includes(role)) {
      user.role = role;
    }

    if (isSuspended !== undefined) {
      user.isSuspended = Boolean(isSuspended);
      user.suspensionReason = isSuspended ? (suspensionReason || 'Administrative suspension.') : undefined;
    }

    await user.save();

    await logAudit({
      actor: req.user,
      action: isSuspended ? 'USER_SUSPENDED' : 'USER_ROLE_UPDATED',
      targetType: 'USER',
      targetId: user._id,
      details: { role: user.role, isSuspended: user.isSuspended, suspensionReason: user.suspensionReason },
      req
    });

    return res.json({ user: user.toPublicProfile() });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update user.' });
  }
});

// GET /api/v1/admin/clubs - Club requests and review
router.get('/clubs', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const clubs = await Club.find(filter)
      .populate('clubHeadId', 'name email avatarColor')
      .sort({ createdAt: -1 });

    return res.json({ clubs });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch clubs.' });
  }
});

// PATCH /api/v1/admin/clubs/:id/approve - Approve club
router.patch('/clubs/:id/approve', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    club.status = 'APPROVED';
    await club.save();

    // Promote club head to CLUB_HEAD role if student
    if (club.clubHeadId) {
      await User.findByIdAndUpdate(club.clubHeadId, { role: 'CLUB_HEAD' });
    }

    await logAudit({
      actor: req.user,
      action: 'CLUB_APPROVED',
      targetType: 'CLUB',
      targetId: club._id,
      details: { name: club.name },
      req
    });

    return res.json({ club, message: `${club.name} has been approved.` });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to approve club.' });
  }
});

// PATCH /api/v1/admin/clubs/:id/reject - Reject club
router.patch('/clubs/:id/reject', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ error: 'Club not found.' });

    club.status = 'REJECTED';
    await club.save();

    await logAudit({
      actor: req.user,
      action: 'CLUB_REJECTED',
      targetType: 'CLUB',
      targetId: club._id,
      details: { name: club.name, reason: req.body.reason },
      req
    });

    return res.json({ club, message: `${club.name} application has been rejected.` });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to reject club.' });
  }
});

// GET /api/v1/admin/reports - Moderation report queue
router.get('/reports', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await Report.find(filter)
      .populate('reporterId', 'name email avatarColor')
      .sort({ createdAt: -1 });

    return res.json({ reports });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch reports queue.' });
  }
});

// PATCH /api/v1/admin/reports/:id - Resolve or dismiss report
router.patch('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    const { status, actionTaken } = req.body;
    if (status) report.status = status;
    if (actionTaken) report.actionTaken = actionTaken;
    report.reviewedBy = req.user._id;

    await report.save();

    await logAudit({
      actor: req.user,
      action: 'REPORT_REVIEWED',
      targetType: 'REPORT',
      targetId: report._id,
      details: { status: report.status, actionTaken: report.actionTaken },
      req
    });

    return res.json({ report, message: 'Report updated.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to update report.' });
  }
});

// GET /api/v1/admin/audit-logs - Immutable audit history
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments();
    return res.json({ logs, total, page: Number(page) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch audit logs.' });
  }
});

// GET /api/v1/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await FeatureSetting.find();
    return res.json({ settings });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch settings.' });
  }
});

// PATCH /api/v1/admin/settings
router.patch('/settings', async (req, res) => {
  try {
    const { key, value, description } = req.body;
    if (!key) return res.status(400).json({ error: 'Setting key is required.' });

    const setting = await FeatureSetting.findOneAndUpdate(
      { key },
      { key, value, description },
      { upsert: true, new: true }
    );

    await logAudit({
      actor: req.user,
      action: 'PLATFORM_SETTING_UPDATED',
      targetType: 'SETTING',
      targetId: key,
      details: { value },
      req
    });

    return res.json({ setting });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to update setting.' });
  }
});

export default router;

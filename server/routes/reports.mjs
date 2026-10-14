import express from 'express';
import { Report } from '../models/Report.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// POST /api/v1/reports
router.post('/', requireAuth, async (req, res) => {
  try {
    const { targetType, targetId, targetTitle, reason, details } = req.body;
    if (!targetType || !targetId || !reason?.trim()) {
      return res.status(400).json({ error: 'Target type, target ID, and reason are required.' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reporterName: req.user.name,
      targetType,
      targetId: String(targetId),
      targetTitle: targetTitle || '',
      reason: reason.trim(),
      details: details ? String(details).trim() : '',
      status: 'PENDING'
    });

    await logAudit({
      actor: req.user,
      action: 'REPORT_SUBMITTED',
      targetType,
      targetId,
      details: { reason },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted to campus moderators for review.',
      reportId: report._id
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to submit report.' });
  }
});

export default router;

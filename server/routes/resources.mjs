import express from 'express';
import { Resource } from '../models/Resource.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// GET /api/v1/resources
router.get('/', authenticate, async (req, res) => {
  try {
    const { format, category, q } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (format && format !== 'All') filter.format = format;
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
        { format: new RegExp(q, 'i') },
        { authorName: new RegExp(q, 'i') }
      ];
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    return res.json({ resources });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch resources.' });
  }
});

// POST /api/v1/resources - Upload document or photo (Mid-term papers, notes, etc.)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, subject, category, format, fileData, fileName, fileType, fileSize, url } = req.body;
    if (!title?.trim() || !subject?.trim()) {
      return res.status(400).json({ error: 'Title and subject are required.' });
    }

    const resource = await Resource.create({
      title: title.trim(),
      subject: subject.trim(),
      category: category || 'Mid-term Exam Paper',
      format: format || (fileType === 'photo' ? 'Photo' : 'PDF'),
      fileData: fileData || '',
      fileName: fileName || '',
      fileType: fileType || 'document',
      fileSize: fileSize || '',
      authorId: req.user._id,
      authorName: req.user.name,
      authorDept: req.user.academicProfile?.department || 'Engineering',
      url: url || ''
    });

    await logAudit({
      actor: req.user,
      action: 'RESOURCE_UPLOADED',
      targetType: 'RESOURCE',
      targetId: resource._id,
      details: { title: resource.title, category: resource.category, fileType: resource.fileType },
      req
    });

    return res.status(201).json({ resource });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to upload resource.' });
  }
});

// POST /api/v1/resources/:id/download
router.post('/:id/download', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadsCount: 1 } },
      { new: true }
    );
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });
    return res.json({ resource, downloadUrl: resource.fileData || resource.url });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to track download.' });
  }
});

// DELETE /api/v1/resources/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const isAuthor = resource.authorId && resource.authorId.equals(req.user._id);
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this resource.' });
    }

    await Resource.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Resource removed.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to delete resource.' });
  }
});

export default router;

import express from 'express';
import { Project } from '../models/Project.mjs';
import { ProjectMembership } from '../models/ProjectMembership.mjs';
import { Notification } from '../models/Notification.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';

const router = express.Router();

// GET /api/v1/projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, recruiting, skill, q } = req.query;
    const filter = {};

    if (recruiting !== undefined) filter.recruiting = recruiting === 'true';
    if (status && status !== 'All projects') filter.status = status;
    if (skill) filter.skills = new RegExp(skill, 'i');
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { about: new RegExp(q, 'i') },
        { skills: new RegExp(q, 'i') }
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    return res.json({ projects });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch projects.' });
  }
});

// GET /api/v1/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    let pendingRequests = [];
    if (req.user && project.ownerId.equals(req.user._id)) {
      pendingRequests = await ProjectMembership.find({ projectId: project._id, status: 'PENDING' })
        .populate('userId', 'name email avatarColor avatarInitials dept');
    }

    return res.json({ project, pendingRequests });
  } catch (error) {
    return res.status(404).json({ error: 'Project not found.' });
  }
});

// POST /api/v1/projects - Create project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, about, skills, maxMembers, accent } = req.body;
    if (!name?.trim() || !about?.trim()) {
      return res.status(400).json({ error: 'Project name and about description are required.' });
    }

    const project = await Project.create({
      name: name.trim(),
      about: about.trim(),
      ownerId: req.user._id,
      ownerName: req.user.name,
      skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : ['React', 'Python'],
      membersCount: 1,
      maxMembers: Number(maxMembers) || 4,
      status: 'Idea',
      recruiting: true,
      accent: accent || '#9b5a3d'
    });

    return res.status(201).json({ project });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create project.' });
  }
});

// POST /api/v1/projects/:id/join - Request to join
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || !project.recruiting) {
      return res.status(400).json({ error: 'This project is not currently recruiting.' });
    }

    if (project.ownerId.equals(req.user._id)) {
      return res.status(400).json({ error: 'You are the owner of this project.' });
    }

    const existing = await ProjectMembership.findOne({ projectId: project._id, userId: req.user._id });
    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a join request for this project.' });
    }

    const membership = await ProjectMembership.create({
      projectId: project._id,
      userId: req.user._id,
      message: req.body.message || 'Ready to contribute.',
      status: 'PENDING'
    });

    // Notify project owner
    await Notification.create({
      recipientId: project.ownerId,
      title: `${req.user.name} wants to join ${project.name}`,
      detail: req.body.message || 'Reviewed from campus discovery',
      kind: 'project',
      link: '#projects'
    }).catch(() => {});

    return res.status(201).json({ success: true, message: 'Request sent to project owner!', membership });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to send join request.' });
  }
});

// POST /api/v1/projects/:id/accept-request
router.post('/:id/accept-request', requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    if (!project.ownerId.equals(req.user._id) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only the project owner can accept join requests.' });
    }

    const { requestId } = req.body;
    const request = await ProjectMembership.findById(requestId);
    if (!request || !request.projectId.equals(project._id)) {
      return res.status(404).json({ error: 'Join request not found.' });
    }

    request.status = 'ACCEPTED';
    await request.save();

    project.membersCount = Math.min(project.maxMembers, project.membersCount + 1);
    if (project.membersCount >= project.maxMembers) {
      project.recruiting = false;
    }
    await project.save();

    // Notify the accepted user
    await Notification.create({
      recipientId: request.userId,
      title: `You’re now on ${project.name}!`,
      detail: 'Your join request was accepted by the project owner.',
      kind: 'project',
      link: '#projects'
    }).catch(() => {});

    return res.json({ success: true, project });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to accept request.' });
  }
});

export default router;

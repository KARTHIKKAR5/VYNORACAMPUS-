import express from 'express';
import { User } from '../models/User.mjs';
import { Club } from '../models/Club.mjs';
import { Project } from '../models/Project.mjs';
import { Announcement } from '../models/Announcement.mjs';
import { Event } from '../models/Event.mjs';
import { Product } from '../models/Product.mjs';
import { Resource } from '../models/Resource.mjs';
import { authenticate } from '../middleware/auth.mjs';

const router = express.Router();

// GET /api/v1/search
router.get('/', authenticate, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return res.json({
        students: [],
        clubs: [],
        projects: [],
        announcements: [],
        events: [],
        products: [],
        resources: []
      });
    }

    const regex = new RegExp(q, 'i');

    const [students, clubs, projects, announcements, events, products, resources] = await Promise.all([
      User.find({
        isSuspended: false,
        $or: [{ name: regex }, { skills: regex }, { 'academicProfile.department': regex }]
      })
        .select('name role avatarColor avatarInitials skills interest academicProfile')
        .limit(5),

      Club.find({ status: 'APPROVED', $or: [{ name: regex }, { category: regex }, { description: regex }] })
        .select('name slug category description membersCount')
        .limit(5),

      Project.find({ $or: [{ name: regex }, { about: regex }, { skills: regex }] })
        .select('name about status recruiting skills membersCount maxMembers accent')
        .limit(5),

      Announcement.find({ status: 'PUBLISHED', $or: [{ title: regex }, { category: regex }] })
        .select('title category priority isOfficial publishedAt')
        .limit(5),

      Event.find({ status: 'PUBLISHED', $or: [{ title: regex }, { venue: regex }, { category: regex }] })
        .select('title venue startTime category code')
        .limit(5),

      Product.find({ status: 'ACTIVE', $or: [{ name: regex }, { description: regex }, { tagline: regex }] })
        .select('name slug tagline price isFree isExternal externalUrl badge')
        .limit(5),

      Resource.find({ $or: [{ title: regex }, { subject: regex }, { format: regex }] })
        .select('title subject format authorName')
        .limit(5)
    ]);

    return res.json({
      query: q,
      results: {
        students: students.map((s) => s.toPublicProfile ? s.toPublicProfile() : s),
        clubs,
        projects,
        announcements,
        events,
        products,
        resources
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Search operation failed.' });
  }
});

export default router;

import express from 'express';
import { Event } from '../models/Event.mjs';
import { EventRegistration } from '../models/EventRegistration.mjs';
import { Club } from '../models/Club.mjs';
import { Notification } from '../models/Notification.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// GET /api/v1/events
router.get('/', authenticate, async (req, res) => {
  try {
    const { clubId, category } = req.query;
    const filter = { status: 'PUBLISHED' };

    if (clubId) filter.clubId = clubId;
    if (category && category !== 'All') filter.category = category;

    const events = await Event.find(filter).sort({ startTime: 1 });

    // Check registrations for current user
    let userRegistrations = new Set();
    if (req.user) {
      const regs = await EventRegistration.find({
        userId: req.user._id,
        status: 'CONFIRMED'
      }).select('eventId');
      userRegistrations = new Set(regs.map((r) => r.eventId.toString()));
    }

    const payload = events.map((e) => ({
      ...e.toObject(),
      isRegistered: userRegistrations.has(e._id.toString())
    }));

    return res.json({ events: payload });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch events.' });
  }
});

// GET /api/v1/events/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    let isRegistered = false;
    if (req.user) {
      isRegistered = Boolean(
        await EventRegistration.exists({
          eventId: event._id,
          userId: req.user._id,
          status: 'CONFIRMED'
        })
      );
    }

    return res.json({ event, isRegistered });
  } catch (error) {
    return res.status(404).json({ error: 'Event not found.' });
  }
});

// POST /api/v1/events - Create event (Club Head or Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, venue, startTime, endTime, deadline, maxCapacity, category, clubId, code, artClass } = req.body;
    if (!title?.trim() || !description?.trim() || !venue?.trim() || !startTime) {
      return res.status(400).json({ error: 'Title, description, venue, and start time are required.' });
    }

    let clubName = 'Campus';
    if (clubId) {
      const club = await Club.findById(clubId);
      if (!club) return res.status(404).json({ error: 'Club not found.' });

      const isClubHead = club.clubHeadId && club.clubHeadId.equals(req.user._id);
      const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
      if (!isClubHead && !isAdmin) {
        return res.status(403).json({ error: 'Only authorized club heads or administrators can create events for this club.' });
      }
      clubName = club.name;
    }

    // Prevent duplicate submissions within 1 minute
    const recentDuplicate = await Event.findOne({
      title: title.trim(),
      organizerId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 60000) }
    });
    if (recentDuplicate) {
      return res.status(409).json({ error: 'An event with this title was already created recently.' });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim(),
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      maxCapacity: Number(maxCapacity) || 100,
      registeredCount: 0,
      category: category || 'Workshop',
      code: code || 'CAMPUS',
      artClass: artClass || 'art0',
      clubId: clubId || undefined,
      clubName,
      organizerId: req.user._id,
      status: 'PUBLISHED'
    });

    await logAudit({
      actor: req.user,
      action: 'EVENT_CREATED',
      targetType: 'EVENT',
      targetId: event._id,
      details: { title: event.title, venue: event.venue },
      req
    });

    return res.status(201).json({ event });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create event.' });
  }
});

// POST /api/v1/events/:id/register - Register for event
router.post('/:id/register', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Event is not available for registration.' });
    }

    if (event.deadline && new Date() > event.deadline) {
      return res.status(400).json({ error: 'Registration deadline has passed.' });
    }

    const existing = await EventRegistration.findOne({ eventId: event._id, userId: req.user._id });
    if (existing && existing.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'You are already registered for this event.' });
    }

    if (event.registeredCount >= event.maxCapacity) {
      return res.status(400).json({ error: 'This event has reached full capacity.' });
    }

    if (existing) {
      existing.status = 'CONFIRMED';
      await existing.save();
    } else {
      await EventRegistration.create({
        eventId: event._id,
        userId: req.user._id,
        status: 'CONFIRMED'
      });
      event.registeredCount += 1;
      await event.save();
    }

    // Confirmation notification
    await Notification.create({
      recipientId: req.user._id,
      title: `Registration Confirmed: ${event.title}`,
      detail: `Your seat is reserved at ${event.venue}. We look forward to seeing you!`,
      kind: 'event',
      link: '#events'
    }).catch(() => {});

    return res.json({ success: true, message: `Successfully registered for ${event.title}!`, registeredCount: event.registeredCount });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to complete registration.' });
  }
});

// DELETE /api/v1/events/:id/register - Cancel registration
router.delete('/:id/register', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const deleted = await EventRegistration.findOneAndDelete({ eventId: event._id, userId: req.user._id });
    if (deleted) {
      event.registeredCount = Math.max(0, event.registeredCount - 1);
      await event.save();
    }

    return res.json({ success: true, message: 'Registration cancelled.', registeredCount: event.registeredCount });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to cancel registration.' });
  }
});

export default router;

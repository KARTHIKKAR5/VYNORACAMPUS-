import express from 'express';
import { Conversation } from '../models/Conversation.mjs';
import { Message } from '../models/Message.mjs';
import { User } from '../models/User.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';

const router = express.Router();

// GET /api/v1/conversations
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    let conversations = await Conversation.find({ members: userId })
      .populate('members', 'name email avatarColor avatarInitials academicProfile online')
      .sort({ lastMessageAt: -1 });

    // Return real database conversations without fabricating mock threads
    return res.json({ conversations });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch conversations.' });
  }
});

// GET /api/v1/conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    const isMember = conversation.members.some((m) => m.equals(req.user._id));
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not a member of this conversation.' });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(100);

    // Mark unread messages as read
    await Message.updateMany(
      { conversationId: conversation._id, senderId: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch messages.' });
  }
});

// POST /api/v1/conversations/:id/messages
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    const isMember = conversation.members.some((m) => m.equals(req.user._id));
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not a member of this conversation.' });
    }

    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Message body cannot be empty.' });

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderName: req.user.name,
      body: body.trim(),
      readBy: [req.user._id]
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = body.trim().slice(0, 80);
    await conversation.save();

    // Broadcast via Socket.IO if attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('new_message', {
        message: message.toObject(),
        conversationId: conversation._id.toString()
      });
    }

    return res.status(201).json({ message });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to send message.' });
  }
});

// POST /api/v1/conversations - Create or find direct conversation
router.post('/', requireAuth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID is required.' });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found.' });

    let conversation = await Conversation.findOne({
      type: 'DIRECT',
      members: { $all: [req.user._id, targetUser._id], $size: 2 }
    }).populate('members', 'name email avatarColor avatarInitials academicProfile');

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'DIRECT',
        members: [req.user._id, targetUser._id],
        lastMessageAt: new Date(),
        lastMessagePreview: 'Conversation started'
      });
      await conversation.populate('members', 'name email avatarColor avatarInitials academicProfile');
    }

    return res.json({ conversation });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to start conversation.' });
  }
});

export default router;

import express from 'express';
import { CommunityPost } from '../models/CommunityPost.mjs';
import { Comment } from '../models/Comment.mjs';
import { Reaction } from '../models/Reaction.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';

const router = express.Router();

// GET /api/v1/community/posts
router.get('/posts', authenticate, async (req, res) => {
  try {
    const { topic, q } = req.query;
    const filter = { status: 'ACTIVE' };

    if (topic && topic !== 'All activity') {
      filter.topic = topic;
    }

    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { body: new RegExp(q, 'i') },
        { skills: new RegExp(q, 'i') }
      ];
    }

    const posts = await CommunityPost.find(filter)
      .populate('authorId', 'name email avatarColor avatarInitials academicProfile')
      .sort({ featured: -1, createdAt: -1 });

    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch community posts.' });
  }
});

// POST /api/v1/community/posts
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { title, body, topic, category, skills } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const post = await CommunityPost.create({
      title: title.trim(),
      body: body.trim(),
      authorId: req.user._id,
      authorName: req.user.name,
      authorDept: req.user.academicProfile?.department || 'Computer Science',
      topic: topic || 'Academics',
      category: category || 'HELP REQUEST',
      skills: Array.isArray(skills) ? skills : ['Community', 'Campus'],
      featured: false,
      likesCount: 0,
      commentsCount: 0
    });

    return res.status(201).json({ post });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to publish post.' });
  }
});

// GET /api/v1/community/posts/:id/comments
router.get('/posts/:id/comments', authenticate, async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id, status: 'ACTIVE' }).sort({ createdAt: 1 });
    return res.json({ comments });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch comments.' });
  }
});

// POST /api/v1/community/posts/:id/comments
router.post('/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body cannot be empty.' });

    const comment = await Comment.create({
      postId: post._id,
      authorId: req.user._id,
      authorName: req.user.name,
      body: body.trim()
    });

    post.commentsCount += 1;
    await post.save();

    return res.status(201).json({ comment });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to add comment.' });
  }
});

// POST /api/v1/community/posts/:id/react
router.post('/posts/:id/react', requireAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const existing = await Reaction.findOne({
      targetType: 'POST',
      targetId: post._id,
      userId: req.user._id
    });

    if (existing) {
      await Reaction.findByIdAndDelete(existing._id);
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();
      return res.json({ liked: false, likesCount: post.likesCount });
    }

    await Reaction.create({
      targetType: 'POST',
      targetId: post._id,
      userId: req.user._id,
      type: 'LIKE'
    });

    post.likesCount += 1;
    await post.save();

    return res.json({ liked: true, likesCount: post.likesCount });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to update reaction.' });
  }
});

// DELETE /api/v1/community/posts/:id
router.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const isAuthor = post.authorId.equals(req.user._id);
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this post.' });
    }

    post.status = 'REMOVED';
    await post.save();
    return res.json({ success: true, message: 'Post removed.' });
  } catch (error) {
    return res.status(400).json({ error: 'Unable to delete post.' });
  }
});

export default router;

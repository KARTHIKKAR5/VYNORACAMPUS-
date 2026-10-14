import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.mjs';
import { authenticate, requireAuth } from '../middleware/auth.mjs';
import { logAudit } from '../middleware/audit.mjs';

const router = express.Router();

// In-memory rate limiter for authentication endpoints
const authAttempts = new Map();
function rateLimitAuth(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 25;

  const userAttempts = authAttempts.get(ip) || [];
  const recent = userAttempts.filter((t) => now - t < windowMs);
  if (recent.length >= maxAttempts) {
    return res.status(429).json({
      error: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
    });
  }
  recent.push(now);
  authAttempts.set(ip, recent);
  next();
}

// GET /api/v1/auth/me or /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  if (!req.user) {
    return res.json({ student: null, user: null, authenticated: false });
  }
  const profile = req.user.toPublicProfile(true);
  return res.json({
    student: profile,
    user: profile,
    authenticated: true,
    role: req.user.role,
    profileCompleted: Boolean(req.user.profileCompleted)
  });
});

// POST /api/v1/auth/register - Student registration only
router.post('/register', rateLimitAuth, async (req, res) => {
  try {
    const { name, email, password, academicProfile, skills, interest, interests } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ error: 'Name, valid email, and a password of at least 6 characters are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const structuredInterests = Array.isArray(interests) && interests.length
      ? interests.map((s) => String(s).trim()).filter(Boolean)
      : (interest ? [String(interest).trim()] : ['technology', 'campus']);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: User.hashPassword(password),
      role: 'STUDENT', // Public registration is strictly restricted to STUDENT
      authProvider: 'local',
      academicProfile: {
        university: academicProfile?.university?.trim() || 'SR University',
        degree: academicProfile?.degree?.trim() || 'B.Tech',
        program: academicProfile?.program?.trim() || 'Computer Science & Engineering',
        year: academicProfile?.year?.trim() || 'First year',
        batch: academicProfile?.batch?.trim() || '01',
        academicYear: academicProfile?.academicYear?.trim() || '2026-27',
        department: academicProfile?.department?.trim() || 'Computer Science'
      },
      skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : [],
      interest: interest || structuredInterests.join(' · '),
      interests: structuredInterests,
      profileCompleted: Boolean(academicProfile?.department && academicProfile?.year)
    });

    res.cookie('vynora_session', user._id.toString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    await logAudit({ actor: user, action: 'USER_REGISTERED', targetType: 'USER', targetId: user._id, req });

    return res.status(201).json({
      student: user.toPublicProfile(true),
      message: 'Account registered successfully.'
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Registration failed.' });
  }
});

// POST /api/v1/auth/login - Student & Ordinary user login
router.post('/login', rateLimitAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.verifyPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: `Account suspended: ${user.suspensionReason || 'Contact campus administration.'}` });
    }

    res.cookie('vynora_session', user._id.toString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    await logAudit({ actor: user, action: 'USER_LOGIN', targetType: 'USER', targetId: user._id, req });

    return res.json({
      student: user.toPublicProfile(true),
      profileCompleted: Boolean(user.profileCompleted)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Login service encountered an error.' });
  }
});

// POST /api/v1/auth/google - Secure Google / Gmail Identity Token Verification
router.post('/google', rateLimitAuth, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google ID token credential is required.' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    let payload = null;

    if (clientId && clientId !== 'your_google_client_id_here.apps.googleusercontent.com') {
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId
        });
        payload = ticket.getPayload();
      } catch (clientErr) {
        // Fallback to official Google tokeninfo verification
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (response.ok) {
          payload = await response.json();
        } else {
          throw new Error('Google token signature verification failed.');
        }
      }
    } else {
      // Validate token via Google's tokeninfo API endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (response.ok) {
        payload = await response.json();
      } else {
        return res.status(400).json({
          error: 'Google Sign-In requires a valid GOOGLE_CLIENT_ID configured in .env. Please see the Google Cloud Console setup guide.'
        });
      }
    }

    if (!payload || !payload.email || (payload.email_verified !== true && payload.email_verified !== 'true')) {
      return res.status(401).json({ error: 'Google account is unverified or token is invalid.' });
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || cleanEmail.split('@')[0];
    const picture = payload.picture || '';
    const googleId = payload.sub;

    let user = await User.findOne({ email: cleanEmail });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        name,
        email: cleanEmail,
        authProvider: 'google',
        googleId,
        avatarUrl: picture,
        role: 'STUDENT', // GOOGLE SIGN-IN ALONE CAN NEVER GRANT ADMIN PRIVILEGES
        isVerified: true,
        academicProfile: {
          university: 'SR University',
          year: 'First year',
          department: 'Computer Science'
        },
        interests: ['technology', 'coding'],
        profileCompleted: false // New Google users must complete required profile fields
      });

      await logAudit({
        actor: user,
        action: 'GOOGLE_SIGNUP',
        targetType: 'USER',
        targetId: user._id,
        req
      });
    } else {
      if (user.isSuspended) {
        return res.status(403).json({ error: `Account suspended: ${user.suspensionReason || 'Contact campus administration.'}` });
      }

      if (!user.googleId) user.googleId = googleId;
      if (!user.avatarUrl && picture) user.avatarUrl = picture;
      user.isVerified = true;
      await user.save();

      await logAudit({
        actor: user,
        action: 'GOOGLE_LOGIN',
        targetType: 'USER',
        targetId: user._id,
        req
      });
    }

    res.cookie('vynora_session', user._id.toString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    return res.json({
      student: user.toPublicProfile(true),
      isNewUser,
      profileCompleted: Boolean(user.profileCompleted)
    });
  } catch (error) {
    return res.status(401).json({ error: error.message || 'Google token validation failed.' });
  }
});

// POST /api/v1/auth/admin/login - Completely separate administrator login gateway
router.post('/admin/login', rateLimitAuth, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Administrator email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.verifyPassword(password)) {
      await logAudit({
        actor: null,
        action: 'ADMIN_LOGIN_FAILED',
        targetType: 'ADMIN',
        targetId: cleanEmail,
        details: { reason: 'Invalid administrator credentials' },
        req
      });
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    // STRICT ROLE AUTHORIZATION: Must possess ADMIN or SUPER_ADMIN role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      await logAudit({
        actor: user,
        action: 'ADMIN_LOGIN_REJECTED',
        targetType: 'ADMIN',
        targetId: user._id,
        details: { reason: 'Unauthorized role attempted admin login', role: user.role },
        req
      });
      return res.status(403).json({
        error: 'Access denied: This portal is strictly restricted to authorized platform administrators.'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Administrator account is suspended.' });
    }

    res.cookie('vynora_session', user._id.toString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 3600 * 1000, // 24-hour admin session limit
      secure: process.env.NODE_ENV === 'production'
    });

    await logAudit({
      actor: user,
      action: 'ADMIN_LOGIN_SUCCESS',
      targetType: 'ADMIN',
      targetId: user._id,
      req
    });

    return res.json({
      admin: user.toPublicProfile(true),
      message: 'Administrator authentication verified.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Administrator login encountered an error.' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('vynora_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res.json({ ok: true, message: 'Signed out successfully.' });
});

// GET /api/v1/auth/academic-options
router.get('/academic-options', async (req, res) => {
  return res.json({
    years: ['First year', 'Second year', 'Third year', 'Fourth year', 'Other'],
    departments: [
      'Computer Science & Engineering',
      'Artificial Intelligence & Machine Learning',
      'Data Science & Analytics',
      'Information Technology',
      'Electronics & Communication Engineering',
      'Electrical & Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Product & Industrial Design',
      'Business Administration & Management',
      'Biotechnology & Life Sciences',
      'Other'
    ],
    interests: [
      'Coding & Software Development',
      'Artificial Intelligence & ML',
      'UI/UX & Product Design',
      'Robotics & IoT Hardware',
      'Hackathons & Competitions',
      'Entrepreneurship & Startups',
      'Academic Research & Papers',
      'Creative Arts & Photography',
      'Sports & Athletics',
      'Community & Volunteering'
    ],
    options: [
      { degree: 'B.Tech', program: 'CSE-AIML', year: 'Third year', batch: '10', academicYear: '2026-27' },
      { degree: 'B.Tech', program: 'CSE-AIML', year: 'Third year', batch: '09', academicYear: '2026-27' },
      { degree: 'B.Tech', program: 'CSE', year: 'Third year', batch: '01', academicYear: '2026-27' },
      { degree: 'B.Tech', program: 'ECE', year: 'Second year', batch: '01', academicYear: '2026-27' }
    ]
  });
});

export default router;

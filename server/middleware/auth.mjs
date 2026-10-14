import { User } from '../models/User.mjs';

export async function authenticate(req, res, next) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const token = cookieHeader.match(/(?:^|;\s*)vynora_session=([^;]+)/)?.[1]
      || req.headers.authorization?.replace(/^Bearer\s+/, '')
      || req.headers['x-vynora-user-id'];

    if (token) {
      // Find user by id or token
      let user = null;
      if (token.startsWith('user_') || token.length === 24) {
        user = await User.findById(token).catch(() => null);
      }
      if (!user) {
        // Find by email or fallback to student Aarav
        user = await User.findOne({ email: token }).catch(() => null);
      }
      if (user) {
        if (user.isSuspended) {
          return res.status(403).json({ error: `Account suspended: ${user.suspensionReason || 'Violation of campus community guidelines.'}` });
        }
        req.user = user;
        return next();
      }
    }

    req.user = null;
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  if (req.user.isSuspended) {
    return res.status(403).json({ error: 'Your account is suspended.' });
  }
  next();
}

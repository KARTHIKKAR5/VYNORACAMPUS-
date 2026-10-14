export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.isSuspended) {
      return res.status(403).json({ error: 'Your account is suspended.' });
    }
    // SUPER_ADMIN has access to all roles
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
}

const Visitor = require('./Visitor.model');

// Requires a logged-in user (session.userId set)
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  next();
}

// Requires the hidden admin panel to have been unlocked (session.isAdmin)
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Admin access required.' });
  }
  next();
}

// Lightweight visitor logger - fires on page views only, never blocks the request
function logVisitor(req, res, next) {
  const skip =
    req.path.startsWith('/api/') ||
    req.path.startsWith('/css/') ||
    req.path.startsWith('/js/') ||
    req.path.startsWith('/favicon');

  if (!skip) {
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '';
    Visitor.create({
      ip,
      path: req.path,
      userAgent: req.headers['user-agent'] || '',
    }).catch(() => {});
  }
  next();
}

module.exports = { requireAuth, requireAdmin, logVisitor };

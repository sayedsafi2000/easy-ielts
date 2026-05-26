/**
 * JWT authentication middleware.
 *
 * Reads the token from either:
 *   1. Authorization: Bearer <token>     (preferred for cross-origin clients)
 *   2. Cookie:        eielts_token=<jwt> (set on login by the API)
 *
 * On success, attaches req.user = { id, role } and calls next().
 * On failure, returns 401.
 */
const jwt = require('jsonwebtoken');

const COOKIE_NAME = process.env.COOKIE_NAME || 'eielts_token';

function readToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  return null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Restrict a route to one or more roles.
 *   requireRole('admin')               -> admin only
 *   requireRole('admin', 'examiner')   -> admin OR examiner
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
}

/**
 * Optional auth — populates req.user if a valid token is present, but does
 * not reject the request if it is missing.
 */
function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch (_) {
    /* ignore */
  }
  return next();
}

module.exports = { requireAuth, requireRole, optionalAuth, readToken, COOKIE_NAME };

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to authenticate requests using JWT Bearer Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

/**
 * Optional authentication middleware: if token is provided, decodes user, else proceeds anonymously
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
}

/**
 * Check if user is the immutable Platform Owner / Super Admin
 */
function isSuperAdmin(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const ownerEmail = (config.superAdminEmail || 'admin@zipbi.com').toLowerCase().trim();
  if (email === ownerEmail) return true;
  if (user.role === 'SUPER_ADMIN' || user.isSuperAdmin === true || user.isOwner === true) return true;
  return false;
}

/**
 * Administrator role authorization middleware (allows both Super Admin and standard Admin)
 */
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && !isSuperAdmin(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }
    req.user.isSuperAdmin = isSuperAdmin(req.user);
    next();
  });
}

/**
 * Platform Owner / Super Admin authorization middleware (strictly blocks non-Super Admins)
 */
function requireSuperAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Platform Owner (Super Admin) privileges required.',
      });
    }
    req.user.isSuperAdmin = true;
    next();
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireSuperAdmin,
  isSuperAdmin,
};


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
 * Administrator role authorization middleware
 */
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }
    next();
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
};


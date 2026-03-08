/**
 * Auth middleware for the ATS API.
 * - authenticateToken: validates JWT from Authorization: Bearer <token>, sets req.user
 * - isAdmin: must be used after authenticateToken; rejects non-admin roles
 */

const jwt = require('jsonwebtoken');

/** Expects Authorization: Bearer <token>. On success sets req.user (e.g. user_id, role). */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

/** Use after authenticateToken. Returns 403 if req.user.role is not 'admin'. */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin };
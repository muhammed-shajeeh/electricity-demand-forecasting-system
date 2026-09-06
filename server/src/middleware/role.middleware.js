/**
 * Role-Based Authorization Middleware
 * Should be used AFTER verifyAuth middleware has populated req.user
 *
 * @param {...string} allowedRoles - The roles permitted to access the route
 * @returns {Function} Express middleware function
 */
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    // 1. If req.user does not exist, authentication failed or verifyAuth was missed
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // 2. If req.user exists but role is missing, deny access
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }

    // 3. If req.user.role is not included in the allowed roles, deny access
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }

    // 4. Authorized successfully
    next();
  };
}

module.exports = {
  requireRole
};

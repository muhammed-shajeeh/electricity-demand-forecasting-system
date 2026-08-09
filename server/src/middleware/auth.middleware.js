const { verifyToken } = require('../utils/jwt');

/**
 * Express middleware to verify JWT Bearer tokens.
 * Only validates cryptographic integrity and basic payload requirements.
 * Does NOT perform database lookups or role authorization.
 */
function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Reject missing or empty Authorization header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Reject incorrect scheme or missing token (Must be "Bearer <token>")
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Extract the token part
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token using the existing centralized utility
    // This inherently throws on expired, malformed, or tampered tokens
    const decodedPayload = verifyToken(token);

    // Explicitly validate application payload requirements
    if (!decodedPayload || !decodedPayload.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Attach minimal identity to req.user
    // Explicitly omitting any sensitive information
    req.user = {
      userId: decodedPayload.userId
    };

    // Preserve role if present (for later authorization middleware)
    if (decodedPayload.role) {
      req.user.role = decodedPayload.role;
    }

    next();
  } catch (error) {
    // Catch-all for JWT errors (TokenExpiredError, JsonWebTokenError, etc)
    // Never expose detailed cryptographic errors to the client
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
}

module.exports = {
  verifyAuth
};

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generates a JSON Web Token for the provided payload.
 * @param {Object} payload - The non-sensitive payload to encode (e.g., { userId: '123' }).
 * @returns {string} The signed JWT.
 */
function generateToken(payload) {
  // Ensure config contains the secret
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is missing. Cannot generate token.');
  }

  // Create token with configured expiration
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verifies the validity of a JSON Web Token.
 * @param {string} token - The JWT string to verify.
 * @returns {Object} The decoded payload if valid.
 * @throws {Error} If the token is expired, malformed, or has an invalid signature.
 */
function verifyToken(token) {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is missing. Cannot verify token.');
  }

  // jwt.verify automatically throws errors for invalid/expired tokens
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};

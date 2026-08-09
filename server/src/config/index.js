const dotenv = require('dotenv');
dotenv.config();

// Enforce JWT_SECRET at startup to prevent silent fallback vulnerabilities
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || '*',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;

const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || '*',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-key-change-in-prod',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;

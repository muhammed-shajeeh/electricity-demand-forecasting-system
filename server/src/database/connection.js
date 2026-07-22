const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const connStr = process.env.MONGODB_URI;
  if (!connStr) {
    console.error('[Mongoose] Error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  // Force Node.js DNS resolver to use public DNS servers to resolve MongoDB Atlas SRV records
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  } catch (dnsErr) {
    console.warn(`[DNS Resolver] Warning: Failed to set custom DNS servers: ${dnsErr.message}`);
  }

  try {
    const conn = await mongoose.connect(connStr);
    console.log(`[Mongoose] Database connection established: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Mongoose] Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

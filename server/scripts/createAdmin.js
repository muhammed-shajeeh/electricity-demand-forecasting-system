const path = require('path');
// Load environment variables directly from the project root .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import existing modules strictly according to the architecture
const connectDB = require('../src/database/connection');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/password');

async function createAdmin() {
  console.log('--- Initial Admin Setup ---');

  // 1. Verify existence of required environment variables
  const { INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;

  if (!INITIAL_ADMIN_NAME || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
    console.error('[ERROR] Missing one or more required environment variables:');
    console.error('  - INITIAL_ADMIN_NAME');
    console.error('  - INITIAL_ADMIN_EMAIL');
    console.error('  - INITIAL_ADMIN_PASSWORD');
    console.error('Setup aborted safely.');
    process.exit(1);
  }

  try {
    // 2. Connect to MongoDB Atlas
    await connectDB();
    console.log('[INFO] Connected to Database successfully.');

    // 3. Check for existing Admin
    const existingAdmin = await User.findOne({ role: 'Admin' });

    if (existingAdmin) {
      console.log(`[INFO] An Admin account already exists (${existingAdmin.email}).`);
      console.log('[INFO] Duplicate creation aborted. System is secure.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 4. Hash password using the centralized bcrypt utility
    //    NEVER log the plaintext password or the resulting hash
    console.log('[INFO] Hashing bootstrap password securely...');
    const passwordHash = await hashPassword(INITIAL_ADMIN_PASSWORD);

    // 5. Create the Initial Admin User
    console.log('[INFO] Inserting Admin user into database...');
    const adminUser = new User({
      name: INITIAL_ADMIN_NAME,
      email: INITIAL_ADMIN_EMAIL,
      passwordHash: passwordHash,
      role: 'Admin',
      isActive: true,
    });

    await adminUser.save();
    console.log('[SUCCESS] Initial Admin user created successfully.');
    
    // 6. Safely disconnect and exit
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('[FATAL ERROR] An error occurred during Admin creation:');
    console.error(error.message);
    process.exit(1);
  }
}

// Execute the bootstrap function
createAdmin();

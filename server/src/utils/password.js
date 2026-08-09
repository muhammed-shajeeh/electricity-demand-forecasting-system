const bcrypt = require('bcrypt');

/**
 * Hashes a plaintext password securely.
 * @param {string} plaintextPassword - The password to hash.
 * @returns {Promise<string>} The generated bcrypt hash.
 */
async function hashPassword(plaintextPassword) {
  // Use a sensible default salt round factor (10 is industry standard)
  const saltRounds = 10;
  return await bcrypt.hash(plaintextPassword, saltRounds);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * @param {string} plaintextPassword - The provided plaintext password.
 * @param {string} storedHash - The hash retrieved from the database.
 * @returns {Promise<boolean>} True if they match, false otherwise.
 */
async function comparePassword(plaintextPassword, storedHash) {
  if (!plaintextPassword || !storedHash) {
    return false;
  }
  return await bcrypt.compare(plaintextPassword, storedHash);
}

module.exports = {
  hashPassword,
  comparePassword,
};

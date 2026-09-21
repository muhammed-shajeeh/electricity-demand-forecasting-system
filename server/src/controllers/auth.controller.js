const User = require('../models/User');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Authenticate user and get JWT
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate request body
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(400, 'Invalid request body format');
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  if (!normalizedEmail || !password.trim()) {
    throw new ApiError(400, 'Email and password cannot be empty');
  }

  // 2. Find user by email
  const user = await User.findOne({ email: normalizedEmail });

  // 3. Verify existence and account status
  // We use a generic message to prevent account enumeration
  const genericAuthErrorMessage = 'Invalid email or password';
  
  if (!user) {
    throw new ApiError(401, genericAuthErrorMessage);
  }

  if (!user.isActive) {
    throw new ApiError(401, genericAuthErrorMessage);
  }

  // 4. Verify password
  const isMatch = await comparePassword(password, user.passwordHash);

  if (!isMatch) {
    throw new ApiError(401, genericAuthErrorMessage);
  }

  // 5. Generate JWT token
  const token = generateToken({
    userId: user._id,
    role: user.role
  });

  // 6. Return success response
  // Excluding sensitive info like passwordHash
  res.status(200).json(
    new ApiResponse(200, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 'Login successful')
  );
});

module.exports = {
  login
};

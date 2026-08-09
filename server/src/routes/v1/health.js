const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

// Health check handler implementing standard response classes
router.get('/', asyncHandler(async (req, res) => {
  const apiResponse = new ApiResponse(200, null, 'Backend Running');
  
  return res.status(apiResponse.statusCode).json({
    success: apiResponse.success,
    message: apiResponse.message
  });
}));

module.exports = router;

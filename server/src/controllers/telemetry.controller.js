const Telemetry = require('../models/Telemetry');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create a new telemetry record
 * @route   POST /api/v1/telemetry
 * @access  Private (Admin, Grid Operator)
 */
const createTelemetry = asyncHandler(async (req, res) => {
  const { timestamp, actualLoadMW, temperatureC, humidity } = req.body;

  // 1. Basic Request Validation
  if (!timestamp) {
    throw new ApiError(400, 'timestamp is required');
  }
  
  if (actualLoadMW === undefined || actualLoadMW === null) {
    throw new ApiError(400, 'actualLoadMW is required');
  }

  if (temperatureC === undefined || temperatureC === null) {
    throw new ApiError(400, 'temperatureC is required');
  }

  if (humidity === undefined || humidity === null) {
    throw new ApiError(400, 'humidity is required');
  }

  if (typeof actualLoadMW !== 'number' || actualLoadMW < 0) {
    throw new ApiError(400, 'actualLoadMW must be a positive number');
  }

  if (typeof temperatureC !== 'number') {
    throw new ApiError(400, 'temperatureC must be a number');
  }

  if (typeof humidity !== 'number' || humidity < 0 || humidity > 100) {
    throw new ApiError(400, 'humidity must be a number between 0 and 100');
  }

  const dateObj = new Date(timestamp);
  if (isNaN(dateObj.getTime())) {
    throw new ApiError(400, 'invalid timestamp format');
  }

  // 2. Create Telemetry Document
  try {
    const newTelemetry = await Telemetry.create({
      timestamp: dateObj,
      actualLoadMW,
      temperatureC,
      humidity
    });

    // 3. Return Success Response
    res.status(201).json(
      new ApiResponse(201, {
        id: newTelemetry._id,
        timestamp: newTelemetry.timestamp,
        actualLoadMW: newTelemetry.actualLoadMW,
        temperatureC: newTelemetry.temperatureC,
        humidity: newTelemetry.humidity
      }, 'Telemetry created successfully')
    );
  } catch (error) {
    // 4. Handle Duplicate Timestamp Conflict (MongoDB E11000)
    if (error.code === 11000) {
      throw new ApiError(409, 'Telemetry record for this timestamp already exists');
    }
    // Let global error handler process other mongoose validation errors
    throw error;
  }
});

module.exports = {
  createTelemetry
};

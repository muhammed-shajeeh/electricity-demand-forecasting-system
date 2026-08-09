const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    actualLoadMW: {
      type: Number,
      required: true,
      min: 0,
    },
    temperatureC: {
      type: Number,
      required: true,
      // Validating it's a finite number is inherently handled by Mongoose Number type casting,
      // but we do not arbitrarily constrain minimum or maximum values as requested.
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    // Do NOT enable timestamps: true, as the database insertion time is irrelevant
    // compared to the actual observation timestamp.
    timestamps: false,
    collection: 'telemetry' // Ensure exact collection name
  }
);

// Unified grid architecture: Enforce ONE telemetry observation per timestamp.
// This index serves a dual purpose:
// 1. It guarantees data integrity (no duplicate hourly observations).
// 2. It optimizes chronological queries sorting by latest (-1).
telemetrySchema.index({ timestamp: -1 }, { unique: true });

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

module.exports = Telemetry;

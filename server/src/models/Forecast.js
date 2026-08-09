const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema(
  {
    targetTime: {
      type: Date,
      required: true,
    },
    forecastTime: {
      type: Date,
      required: true,
    },
    predictedLoadMW: {
      type: Number,
      required: true,
      min: 0,
    },
    confidenceLowerMW: {
      type: Number,
      required: true,
      min: 0,
    },
    confidenceUpperMW: {
      type: Number,
      required: true,
      min: 0,
    },
    modelVersion: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return v.trim().length > 0;
        },
        message: 'modelVersion cannot be empty',
      },
    },
  },
  {
    timestamps: false,
    collection: 'forecasts',
  }
);

// Schema-level validation for uncertainty consistency
forecastSchema.pre('validate', function (next) {
  // Only run this validation if all required fields are present and valid numbers
  if (
    this.confidenceLowerMW !== undefined &&
    this.predictedLoadMW !== undefined &&
    this.confidenceUpperMW !== undefined &&
    !isNaN(this.confidenceLowerMW) &&
    !isNaN(this.predictedLoadMW) &&
    !isNaN(this.confidenceUpperMW)
  ) {
    if (this.confidenceLowerMW > this.predictedLoadMW || this.predictedLoadMW > this.confidenceUpperMW) {
      this.invalidate(
        'predictedLoadMW',
        'Uncertainty consistency violated: confidenceLowerMW <= predictedLoadMW <= confidenceUpperMW must hold'
      );
    }
  }
  next();
});

// Index for efficient chronological retrieval
// NOTE: Not unique. Multiple forecasts can predict the same target time.
forecastSchema.index({ targetTime: -1 });

const Forecast = mongoose.model('Forecast', forecastSchema);

module.exports = Forecast;

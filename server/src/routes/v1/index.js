const express = require('express');
const router = express.Router();
const healthRouter = require('./health');
const authRouter = require('./auth.routes');
const telemetryRouter = require('./telemetry.routes');

// Register endpoints
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/telemetry', telemetryRouter);

module.exports = router;

const express = require('express');
const router = express.Router();
const healthRouter = require('./health');
const authRouter = require('./auth.routes');

// Register endpoints
router.use('/health', healthRouter);
router.use('/auth', authRouter);

module.exports = router;

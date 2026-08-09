const express = require('express');
const router = express.Router();
const healthRouter = require('./health');

// Register health endpoint router
router.use('/health', healthRouter);

module.exports = router;

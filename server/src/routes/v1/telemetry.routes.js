const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { createTelemetry } = require('../../controllers/telemetry.controller');

// All telemetry routes require authentication and specific roles
// Order MUST be verifyAuth -> requireRole -> controller
router.post('/', verifyAuth, requireRole('Admin', 'Grid Operator'), createTelemetry);

module.exports = router;

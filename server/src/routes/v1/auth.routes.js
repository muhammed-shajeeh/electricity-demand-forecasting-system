const express = require('express');
const router = express.Router();
const { login } = require('../../controllers/auth.controller');

// PUBLIC route
router.post('/login', login);

module.exports = router;

const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getDashboardStats } = require('../controllers/analyticsController');

router.get('/dashboard', verifySupabaseToken, roleMiddleware(['admin']), getDashboardStats);

module.exports = router;

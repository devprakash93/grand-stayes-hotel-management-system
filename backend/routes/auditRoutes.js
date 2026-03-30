const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getAllAuditLogs } = require('../controllers/auditController');

// Admin only
router.get('/', verifySupabaseToken, roleMiddleware(['admin']), getAllAuditLogs);

module.exports = router;

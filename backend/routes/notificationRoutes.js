const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');

router.get('/', verifySupabaseToken, getMyNotifications);
router.put('/mark-read', verifySupabaseToken, markAsRead);

module.exports = router;

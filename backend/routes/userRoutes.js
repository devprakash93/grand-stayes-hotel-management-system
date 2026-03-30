const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const { getMe, getAllGuests } = require('../controllers/userController');

// GET /api/users/me
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/me', verifySupabaseToken, getMe);
router.get('/guests', verifySupabaseToken, roleMiddleware(['admin', 'staff']), getAllGuests);

module.exports = router;

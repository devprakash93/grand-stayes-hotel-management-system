const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createStaff, getAllStaff } = require('../controllers/staffController');

router.post('/', verifySupabaseToken, roleMiddleware(['admin']), createStaff);
router.get('/', verifySupabaseToken, roleMiddleware(['admin']), getAllStaff);

module.exports = router;

const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const { syncUser } = require('../controllers/authController');

router.post('/sync-user', verifySupabaseToken, syncUser);

module.exports = router;

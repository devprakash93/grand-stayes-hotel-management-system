const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const { createPayment, getPayments } = require('../controllers/paymentController');

router.post('/', verifySupabaseToken, createPayment);
router.get('/', verifySupabaseToken, getPayments);

module.exports = router;

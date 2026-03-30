const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const roleMiddleware = require('../middleware/roleMiddleware');
const { 
  createBooking, 
  getMyBookings, 
  getAllBookings, 
  cancelBooking, 
  checkInBooking, 
  checkOutBooking,
  confirmBooking
} = require('../controllers/bookingController');

router.post('/', verifySupabaseToken, createBooking);
router.get('/my', verifySupabaseToken, getMyBookings);
router.put('/cancel/:id', verifySupabaseToken, cancelBooking);

// Admin/Staff routes
router.get('/', verifySupabaseToken, roleMiddleware(['admin', 'staff']), getAllBookings);
router.put('/confirm/:id', verifySupabaseToken, roleMiddleware(['admin', 'staff']), confirmBooking);
router.post('/checkin/:id', verifySupabaseToken, roleMiddleware(['admin', 'staff']), checkInBooking);
router.post('/checkout/:id', verifySupabaseToken, roleMiddleware(['admin', 'staff']), checkOutBooking);

module.exports = router;

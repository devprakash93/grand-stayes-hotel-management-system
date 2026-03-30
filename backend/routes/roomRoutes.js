const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const roleMiddleware = require('../middleware/roleMiddleware');
const { 
  getAllRooms, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  deleteRoom 
} = require('../controllers/roomController');

router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Admin only routes
router.post('/', verifySupabaseToken, roleMiddleware(['admin']), createRoom);
router.put('/:id', verifySupabaseToken, roleMiddleware(['admin', 'staff']), updateRoom);
router.delete('/:id', verifySupabaseToken, roleMiddleware(['admin']), deleteRoom);

module.exports = router;

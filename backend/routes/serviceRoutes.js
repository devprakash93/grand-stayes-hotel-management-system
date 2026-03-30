const express = require('express');
const router = express.Router();
const verifySupabaseToken = require('../middleware/verifySupabaseToken');
const roleMiddleware = require('../middleware/roleMiddleware');
const { 
  createServiceRequest, 
  getServiceRequests, 
  updateServiceRequestStatus 
} = require('../controllers/serviceController');

router.post('/', verifySupabaseToken, createServiceRequest);
router.get('/', verifySupabaseToken, getServiceRequests); // Both staff/admin & guest handles inside controller
router.put('/:id', verifySupabaseToken, roleMiddleware(['admin', 'staff']), updateServiceRequestStatus);

module.exports = router;

const ServiceRequest = require('../models/ServiceRequest');
const Room = require('../models/Room');
const { logAudit } = require('../utils/auditLogger');

const createServiceRequest = async (req, res) => {
  try {
    // ensure guest belongs to the room they're requesting for, or assume passed from client
    const request = new ServiceRequest({
      guest: req.user._id,
      room: req.body.room,
      requestType: req.body.requestType,
      description: req.body.description,
      price: req.body.price || 0
    });
    const saved = await request.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getServiceRequests = async (req, res) => {
  try {
    if (req.user.role === 'guest') {
      const requests = await ServiceRequest.find({ guest: req.user._id }).populate('room');
      return res.json(requests);
    }
    const requests = await ServiceRequest.find().populate('room').populate('guest');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateServiceRequestStatus = async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // If service was room cleaning and completed, automation rule mapping
    if (req.body.status === 'completed' && request.requestType.toLowerCase().includes('clean')) {
      const room = await Room.findById(request.room);
      if (room && room.status === 'cleaning') {
        room.status = 'available';
        await room.save();
      }
    }

    await logAudit(req.user.supabaseId, 'UPDATE_SERVICE', `Staff updated service request ${request._id} to ${req.body.status}`, request._id, 'serviceRequest');
    
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createServiceRequest, getServiceRequests, updateServiceRequestStatus };

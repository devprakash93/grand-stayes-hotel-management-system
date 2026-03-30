const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  requestType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  price: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

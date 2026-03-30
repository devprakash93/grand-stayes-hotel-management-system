const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'deluxe', 'suite'],
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    default: 1,
  },
  floor: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['available', 'booked', 'cleaning', 'maintenance'],
    default: 'available',
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);

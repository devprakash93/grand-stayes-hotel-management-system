const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Can be null for 'all admin/staff' notifications
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'staff', 'guest'],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['booking_new', 'booking_confirmed', 'booking_cancelled', 'service_request'],
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

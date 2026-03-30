const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'online'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending',
  },
  transactionId: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, method, transactionId } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const payment = new Payment({
      booking: bookingId,
      amount,
      method,
      transactionId,
      status: 'completed' // In a real app, this waits for gateway callback
    });

    await payment.save();
    
    booking.paymentStatus = 'paid';
    await booking.save();

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getPayments = async (req, res) => {
  try {
    // Admins see all. Guests should probably only see theirs, but for simplicity returning all or logic switch based on role
    if (req.user.role === 'admin') {
      const payments = await Payment.find().populate('booking');
      return res.json(payments);
    } 
    // If guest, find their bookings first
    const userBookings = await Booking.find({ guest: req.user._id }).select('_id');
    const bookingIds = userBookings.map(b => b._id);
    const payments = await Payment.find({ booking: { $in: bookingIds } }).populate('booking');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPayment, getPayments };

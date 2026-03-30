const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { calculateTotalPrice } = require('../utils/priceCalculator');
const { isRoomAvailable } = require('../utils/roomAvailability');
const { createNotification } = require('./notificationController');
const { logAudit } = require('../utils/auditLogger');

const createBooking = async (req, res) => {
  try {
    const { room: roomId, checkInDate, checkOutDate, totalGuests } = req.body;
    
    // Check room availability
    const available = await isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!available) {
      return res.status(400).json({ message: 'Room is not available for these dates' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const totalPrice = calculateTotalPrice(room.pricePerNight, checkInDate, checkOutDate);

    const booking = new Booking({
      guest: req.user._id,
      room: roomId,
      checkInDate,
      checkOutDate,
      totalGuests,
      totalPrice
    });

    await booking.save();
    
    // Create notification for admin and staff
    await createNotification({
      recipientRole: 'admin',
      title: 'New Booking Request',
      message: `New booking request for Room ${room.roomNumber} from ${req.user.email}`,
      type: 'booking_new',
      relatedId: booking._id
    });

    await createNotification({
      recipientRole: 'staff',
      title: 'New Booking Request',
      message: `New booking request for Room ${room.roomNumber} from ${req.user.email}`,
      type: 'booking_new',
      relatedId: booking._id
    });
    
    // Automation Rule: When booking created -> room.status = booked (but still waiting for confirmation)
    room.status = 'booked';
    await room.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id }).populate('room');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('guest').populate('room');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Only the guest who booked or an admin/staff can cancel
    if (booking.guest.toString() !== req.user._id.toString() && req.user.role === 'guest') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Free up room if it was booked
    const room = await Room.findById(booking.room);
    if (room && room.status === 'booked') {
      room.status = 'available';
      await room.save();
    }

    await logAudit(req.user.supabaseId, 'CANCEL_BOOKING', `Booking ${booking._id} cancelled by ${req.user.role}`, booking._id, 'booking');

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff logic
const checkInBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.bookingStatus = 'checked-in';
    await booking.save();

    await logAudit(req.user.supabaseId, 'CHECK_IN', `Staff checked in guest for booking ${booking._id}`, booking._id, 'booking');

    res.json({ message: 'Check-in successful', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkOutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.bookingStatus = 'checked-out';
    await booking.save();

    // Automation: When guest checks out -> room.status = cleaning
    const room = await Room.findById(booking.room);
    if (room) {
      room.status = 'cleaning';
      await room.save();
    }

    res.json({ message: 'Check-out successful, room needs cleaning', booking });
    
    await logAudit(req.user.supabaseId, 'CHECK_OUT', `Staff checked out guest for booking ${booking._id}`, booking._id, 'booking');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.bookingStatus = 'reserved'; // reserved = confirmed/active
    await booking.save();

    // Notify the guest
    await createNotification({
      recipient: booking.guest,
      recipientRole: 'guest',
      title: 'Booking Confirmed!',
      message: `Your booking for Room ${booking.room.roomNumber} has been confirmed. We look forward to seeing you!`,
      type: 'booking_confirmed',
      relatedId: booking._id
    });

    await logAudit(req.user.supabaseId, 'CONFIRM_BOOKING', `Staff confirmed booking ${booking._id}`, booking._id, 'booking');

    res.json({ message: 'Booking confirmed successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  createBooking, 
  getMyBookings, 
  getAllBookings, 
  cancelBooking, 
  checkInBooking, 
  checkOutBooking,
  confirmBooking
};

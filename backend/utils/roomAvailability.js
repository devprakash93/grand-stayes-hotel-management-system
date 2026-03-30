const Booking = require('../models/Booking');

const isRoomAvailable = async (roomId, checkInDate, checkOutDate) => {
  const conflictingBookings = await Booking.find({
    room: roomId,
    bookingStatus: { $in: ['reserved', 'checked-in'] },
    $or: [
      { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } }
    ]
  });

  return conflictingBookings.length === 0;
};

module.exports = { isRoomAvailable };

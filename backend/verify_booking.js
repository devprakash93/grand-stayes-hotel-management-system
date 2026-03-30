const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Room = require('./models/Room');
const User = require('./models/User');
require('dotenv').config();

async function verifyBooking() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const guest = await User.findOne({ email: 'u8294342@gmail.com' });
  const room = await Room.findOne({ status: 'available' });

  if (!guest || !room) {
    console.log('Guest or Room not found for test');
    process.exit(1);
  }

  console.log(`Testing with Guest: ${guest.email}, Room: ${room.roomNumber}`);

  const booking = new Booking({
    guest: guest._id,
    room: room._id,
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 86400000),
    totalGuests: 2,
    totalPrice: room.pricePerNight
  });

  await booking.save();
  console.log('Booking saved successfully!');

  room.status = 'booked';
  await room.save();
  console.log('Room status updated to booked');

  const myBookings = await Booking.find({ guest: guest._id }).populate('room');
  console.log(`Found ${myBookings.length} bookings for this guest`);

  process.exit(0);
}

verifyBooking().catch(err => {
  console.error(err);
  process.exit(1);
});

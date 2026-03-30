require('dotenv').config();
const mongoose = require('mongoose');

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await mongoose.connection.db.collection('bookings').updateMany(
    { bookingStatus: 'reserved' },
    { $set: { bookingStatus: 'pending' } }
  );
  console.log('Reset Bookings:', result);
  process.exit();
}

reset();

const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config();

const rooms = [
  { roomNumber: '101', roomType: 'single', pricePerNight: 8000, capacity: 1, floor: 1, status: 'available', amenities: ['wifi', 'ac', 'tv'], description: 'A cozy single room for solo travelers.' },
  { roomNumber: '102', roomType: 'double', pricePerNight: 14000, capacity: 2, floor: 1, status: 'available', amenities: ['wifi', 'ac', 'tv', 'minibar'], description: 'Spacious double room with premium amenities.' },
  { roomNumber: '201', roomType: 'deluxe', pricePerNight: 24000, capacity: 2, floor: 2, status: 'available', amenities: ['wifi', 'ac', 'tv', 'minibar', 'room-service'], description: 'Luxury deluxe room with a great view.' },
  { roomNumber: '301', roomType: 'suite', pricePerNight: 40000, capacity: 4, floor: 3, status: 'available', amenities: ['wifi', 'ac', 'tv', 'minibar', 'room-service', 'king-bed'], description: 'The ultimate royal suite experience.' }
];

async function seedRooms() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  await Room.deleteMany({});
  await Room.insertMany(rooms);
  
  console.log('Successfully seeded rooms!');
  process.exit(0);
}

seedRooms().catch(err => {
  console.error(err);
  process.exit(1);
});

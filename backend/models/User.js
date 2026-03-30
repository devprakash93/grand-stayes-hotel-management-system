const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  supabaseUserId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  role: {
    type: String,
    enum: ['guest', 'staff', 'admin'],
    default: 'guest',
  },
  profileImage: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

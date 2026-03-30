const User = require('../models/User');

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
};

const getAllGuests = async (req, res) => {
  try {
    const guests = await User.find({ role: 'guest' });
    res.json(guests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching guests', error: err.message });
  }
};

module.exports = { getMe, getAllGuests };

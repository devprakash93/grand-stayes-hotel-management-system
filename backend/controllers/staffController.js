const User = require('../models/User');
const supabase = require('../config/supabase');

const createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    let supabaseUserId = `user-pending-${Date.now()}`;

    // If Supabase is configured with a service key, create the user in Supabase
    if (supabase && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_key') {
      console.log(`Staff Controller: Attempting to create ${role || 'guest'} in Supabase...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          full_name: name,
          role: role || 'guest'
        }
      });

      if (error) {
        console.error('Staff Controller: Supabase Auth error:', error.message);
        return res.status(error.status || 400).json({ message: 'Error creating user in Supabase', error: error.message });
      }
      
      if (data?.user) {
        supabaseUserId = data.user.id;
        console.log('Staff Controller: Supabase user created with ID:', supabaseUserId);
      }
    }

    const newUser = new User({
      supabaseUserId,
      name,
      email,
      role: role || 'guest'
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Staff Controller: General error:', err.message);
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching staff', error: err.message });
  }
};

module.exports = { createStaff, getAllStaff };

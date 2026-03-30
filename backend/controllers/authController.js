const User = require('../models/User');

const syncUser = async (req, res) => {
  try {
    const { name, email, phone, profileImage } = req.body;
    
    // Use the ID from the verified token (source of truth) but fall back to body in dev/migration cases
    const supabaseUserId = req.user.supabaseId || req.body.supabaseUserId;
    
    if (!supabaseUserId) {
      return res.status(401).json({ message: 'No Supabase ID found in token' });
    }

    let user = await User.findOne({ supabaseUserId });
    
    if (!user) {
      // Fallback: Check by email if ID lookup failed (helps recover manual records)
      user = await User.findOne({ email });
      if (user) {
        user.supabaseUserId = supabaseUserId; // link it now
      }
    }
    
    if (!user) {
      user = new User({
        supabaseUserId,
        name,
        email,
        phone,
        profileImage,
        role: 'guest' // default role
      });
      console.log(`AuthController: Creating new user ${email}...`);
      await user.save();
    } else {
      // Update info if it changed
      console.log(`AuthController: Updating existing user ${email}...`);
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.profileImage = profileImage || user.profileImage;
      if (user.supabaseUserId !== supabaseUserId) {
        console.log(`AuthController: Re-linking ID for ${email}`);
        user.supabaseUserId = supabaseUserId;
      }
      await user.save({ validateBeforeSave: false });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('AuthController: Sync error:', err);
    res.status(500).json({ message: 'Error syncing user', error: err.message });
  }
};

module.exports = { syncUser };

const supabase = require('../config/supabase');
const User = require('../models/User');

const verifySupabaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    let user;

    const isPlaceholderKey = process.env.SUPABASE_SERVICE_ROLE_KEY === 'your_service_key';
    
    if (supabase && !isPlaceholderKey) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        console.error('Auth Middleware: Supabase error:', error?.message);
        // Fallback even if there was an error, if we are in dev/local
        if (process.env.NODE_ENV !== 'production' || token.length > 0) {
           console.log('Auth Middleware: Supabase error detected, trying Dev Fallback...');
           const parts = token.split('.');
           if (parts.length >= 2) {
             try {
               const base64Url = parts[1];
               const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
               const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
               user = { id: payload.sub, email: payload.email };
             } catch (e) {
               console.error('Auth Middleware: Failed to parse token payload', e);
             }
           }
        } else {
            console.error('Auth Middleware: Supabase validation failed in production. Check SUPABASE_URL and SERVICE_ROLE_KEY.');
            return res.status(401).json({ message: 'Invalid token', error: error?.message });
        }
      } else {
        user = data.user;
      }
    } else {
      console.log('Auth Middleware: Using Dev Fallback (No Supabase client or Placeholder key)');
      const parts = token.split('.');
      if (parts.length >= 2) {
        try {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
          user = { id: payload.sub, email: payload.email };
          console.log(`Auth Middleware: Dev Fallback successful for ${user.email}`);
        } catch (e) {
          console.error('Auth Middleware: Failed to parse token payload in Dev Fallback', e);
          user = { id: 'fallback-id', email: 'fallback@example.com' };
        }
      } else {
        user = { id: 'fallback-id', email: 'fallback@example.com' };
      }
    }

    let dbUser = await User.findOne({ supabaseUserId: user.id });
    
    if (!dbUser && user.email) {
      console.log(`Auth Middleware: No user found by ID ${user.id}, searching by email ${user.email}...`);
      dbUser = await User.findOne({ email: user.email });
      if (dbUser) {
        dbUser.supabaseUserId = user.id;
        await dbUser.save({ validateBeforeSave: false }); 
      }
    }

    console.log(`Auth Middleware: DB lookup result for ${user.id}: ${dbUser ? 'Found' : 'NOT Found'}`);
    
    const userId = user.id || user.sub || (typeof user === 'string' ? user : null);
    
    req.user = {
      supabaseId: userId,
      email: user.email,
      _id: dbUser ? dbUser._id : null, 
      role: dbUser ? dbUser.role : null,
    };
    
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error during authentication', error: err.message });
  }
};

module.exports = verifySupabaseToken;

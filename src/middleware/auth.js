const { admin } = require('../config/firebase');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify Firebase ID Token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Find user in MongoDB by firebaseUid
      let user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        // AUTO-SYNC: If user exists in Firebase but not in DB (e.g. manual creation)
        console.log('🔄 User not found in DB. Auto-syncing from Firebase...');
        
        let role = 'member';
        const email = decodedToken.email || '';
        if (email.includes('admin')) role = 'admin';
        else if (email.includes('leader')) role = 'leader';

        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: email,
          name: decodedToken.name || email.split('@')[0],
          role: role
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };

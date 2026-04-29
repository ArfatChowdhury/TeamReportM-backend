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
        return res.status(401).json({ message: 'User not found in database' });
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

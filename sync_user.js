const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const admin = require('firebase-admin');
const User = require('./src/models/User');

const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const syncAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get users from Firebase
    const listUsersResult = await admin.auth().listUsers();
    
    for (const userRecord of listUsersResult.users) {
      console.log(`Found Firebase user: ${userRecord.email} (${userRecord.uid})`);
      
      let user = await User.findOne({ firebaseUid: userRecord.uid });
      
      if (!user) {
        user = await User.findOne({ email: userRecord.email });
      }
      
      if (!user) {
        console.log(`Creating user ${userRecord.email} in MongoDB...`);
        user = new User({
          firebaseUid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || userRecord.email.split('@')[0],
          role: 'member' // default
        });
      } else {
        user.firebaseUid = userRecord.uid; // Update UID if it was missing
      }
      
      // Role Logic: Prioritize test accounts
      if (userRecord.email === 'admin@test.com' || userRecord.email === 'admin@a.com') {
        user.role = 'admin';
      } else if (userRecord.email === 'leader@test.com') {
        user.role = 'leader';
      } else if (userRecord.email === 'member@test.com') {
        user.role = 'member';
      } else if (!user.role) {
        user.role = 'member';
      }
      
      await user.save();
      console.log(`Saved user ${user.email} in MongoDB with role ${user.role}`);
    }

    console.log('Sync complete');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing user:', error);
    process.exit(1);
  }
};

syncAdmin();

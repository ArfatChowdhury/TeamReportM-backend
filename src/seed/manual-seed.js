require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const manualSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const userData = {
      name: 'Admin User',
      email: 'admin@gmail.com',
      firebaseUid: 'nIjRxs8BEWaGVKhXjS9TgSQmE5w2',
      role: 'admin'
    };

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: userData.firebaseUid });
    
    if (existingUser) {
      console.log('ℹ️ User already exists in MongoDB. Updating email/name...');
      existingUser.email = userData.email;
      existingUser.name = userData.name;
      existingUser.role = userData.role;
      await existingUser.save();
    } else {
      await User.create(userData);
      console.log('✅ User created successfully in MongoDB!');
    }

    console.log('🚀 You can now log in with admin@gmail.com');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

manualSeed();

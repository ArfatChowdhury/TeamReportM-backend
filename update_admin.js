const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email: 'admin@a.com' },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log('Successfully updated user role to admin:', user.email);
    } else {
      console.log('User not found with email admin@a.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
};

updateAdmin();

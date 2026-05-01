const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'leader', 'member'], 
    required: true 
  },
  assignedLeader: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  assignedMembers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  fcmToken: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

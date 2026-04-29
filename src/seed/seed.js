require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Report = require('../models/Report');
const { admin, initializeFirebase } = require('../config/firebase');

initializeFirebase();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Report.deleteMany({});

    console.log('Cleared existing data.');

    // Sample Users
    const users = [
      { name: 'Admin User', email: 'admin@teamreport.com', role: 'admin', firebaseUid: 'admin-uid-123' },
      { name: 'Team Leader', email: 'leader@teamreport.com', role: 'leader', firebaseUid: 'leader-uid-456' },
      { name: 'John Member', email: 'member@teamreport.com', role: 'member', firebaseUid: 'member-uid-789' },
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Users seeded.');

    const adminUser = createdUsers[0];
    const leaderUser = createdUsers[1];
    const memberUser = createdUsers[2];

    // Assign member to leader
    leaderUser.assignedMembers.push(memberUser._id);
    await leaderUser.save();
    memberUser.assignedLeader = leaderUser._id;
    await memberUser.save();

    // Sample Project
    const project = await Project.create({
      title: 'Initial Project',
      description: 'The first project in the system',
      createdBy: adminUser._id,
      visibleTo: [leaderUser._id, memberUser._id],
      order: 1
    });
    console.log('Project seeded.');

    // Sample Tasks
    const tasks = [
      { 
        title: 'Task 1', 
        description: 'First task for member', 
        project: project._id, 
        assignedTo: memberUser._id, 
        assignedBy: leaderUser._id, 
        status: 'todo' 
      },
      { 
        title: 'Task 2', 
        description: 'Second task for member', 
        project: project._id, 
        assignedTo: memberUser._id, 
        assignedBy: leaderUser._id, 
        status: 'in-progress',
        startedAt: new Date()
      }
    ];

    await Task.insertMany(tasks);
    console.log('Tasks seeded.');

    console.log('✅ Seeding complete!');
    process.exit();
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('Cleared existing data.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      firebaseUid: 'SEED_ADMIN'
    });

    // 2. Create Leader
    const leader = await User.create({
      name: 'Team Leader',
      email: 'leader@test.com',
      password: 'password123',
      role: 'leader',
      firebaseUid: 'SEED_LEADER'
    });

    // 3. Create Member
    const member = await User.create({
      name: 'Team Member',
      email: 'member@test.com',
      password: 'password123',
      role: 'member',
      firebaseUid: 'SEED_MEMBER'
    });

    console.log('Users created.');

    // 4. Create a Sample Project
    const project = await Project.create({
      title: 'Hiring Assessment App',
      description: 'Build a React Native app with AI integration.',
      leader: leader._id,
      createdBy: admin._id,
      deadline: new Date('2026-05-01')
    });

    // 5. Create a Sample Task
    await Task.create({
      title: 'Complete UI Polish',
      description: 'Add charts and professional styling.',
      project: project._id,
      assignedTo: member._id,
      assignedBy: leader._id,
      priority: 'high',
      dueDate: new Date('2026-04-30')
    });

    console.log('Seed data created successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();

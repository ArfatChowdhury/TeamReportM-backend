const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Report = require('../models/Report');
const { admin } = require('../config/firebase');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All routes here are protected
router.use(protect);

// @desc    Get all users (Filtered by role)
// @route   GET /api/users
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // If leader, only show members assigned to them
    if (req.user.role === 'leader') {
      query = { assignedLeader: req.user._id, role: 'member' };
    } 
    // If admin, show all (can also use filters from query params)
    else if (req.user.role === 'admin') {
      if (req.query.role) query.role = req.query.role;
      
      // AUTO-SYNC: Sync users from Firebase to MongoDB if we are an admin
      // This ensures manual Firebase users show up in the lists
      try {
        const listUsersResult = await admin.auth().listUsers();
        for (const userRecord of listUsersResult.users) {
            const exists = await User.findOne({ $or: [{ firebaseUid: userRecord.uid }, { email: userRecord.email }] });
            if (!exists) {
                let role = 'member';
                if (userRecord.email.includes('admin')) role = 'admin';
                else if (userRecord.email.includes('leader')) role = 'leader';

                await User.create({
                    firebaseUid: userRecord.uid,
                    email: userRecord.email,
                    name: userRecord.displayName || userRecord.email.split('@')[0],
                    role: role
                });
            } else {
                // Update role if it doesn't match the test convention
                let targetRole = exists.role;
                if (userRecord.email.includes('admin')) targetRole = 'admin';
                else if (userRecord.email.includes('leader')) targetRole = 'leader';

                if (exists.role !== targetRole) {
                    exists.role = targetRole;
                    await exists.save();
                }
            }
        }
      } catch (syncError) {
        console.error('User Sync Error:', syncError);
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to view users' });
    }

    const users = await User.find(query).populate('assignedLeader', 'name email');
    
    // Add workload info (active task count)
    const usersWithWorkload = await Promise.all(users.map(async (u) => {
        const activeTasks = await Task.countDocuments({ assignedTo: u._id, status: { $ne: 'done' } });
        return { ...u.toObject(), activeTasks };
    }));

    res.json(usersWithWorkload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/users/profile
router.get('/profile', async (req, res) => {
  res.json(req.user);
});

// Admin-only routes below
router.use(authorize('admin'));

// @desc    Create a new user
// @route   POST /api/users
router.post('/', async (req, res) => {
  const { name, email, password, role, assignedLeader } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 1. Create user in Firebase Auth via Admin SDK
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
    } catch (fbError) {
      console.error('Firebase Auth Error:', fbError);
      return res.status(400).json({ message: `Firebase Error: ${fbError.message}` });
    }

    // 2. Create user in MongoDB
    const user = await User.create({
      name,
      email,
      firebaseUid: firebaseUser.uid,
      role,
      assignedLeader: assignedLeader || null
    });

    if (assignedLeader) {
        await User.findByIdAndUpdate(assignedLeader, {
            $addToSet: { assignedMembers: user._id }
        });
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      
      if (req.body.assignedLeader !== undefined) {
          // Remove from old leader if exists
          if (user.assignedLeader) {
              await User.findByIdAndUpdate(user.assignedLeader, {
                  $pull: { assignedMembers: user._id }
              });
          }
          
          user.assignedLeader = req.body.assignedLeader;
          
          // Add to new leader if exists
          if (user.assignedLeader) {
              await User.findByIdAndUpdate(user.assignedLeader, {
                  $addToSet: { assignedMembers: user._id }
              });
          }
      }

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Remove from leader's assignedMembers
      if (user.assignedLeader) {
          await User.findByIdAndUpdate(user.assignedLeader, {
              $pull: { assignedMembers: user._id }
          });
      }
      
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Assign member to leader
// @route   POST /api/users/:id/assign
router.post('/:id/assign', async (req, res) => {
    const { leaderId } = req.body;
    try {
        const user = await User.findById(req.params.id);
        const leader = await User.findById(leaderId);
        
        if (!user || !leader) {
            return res.status(404).json({ message: 'User or Leader not found' });
        }
        
        if (leader.role !== 'leader' && leader.role !== 'admin') {
            return res.status(400).json({ message: 'Assigned person must be a leader or admin' });
        }
        
        // Remove from old leader
        if (user.assignedLeader) {
            await User.findByIdAndUpdate(user.assignedLeader, {
                $pull: { assignedMembers: user._id }
            });
        }
        
        user.assignedLeader = leaderId;
        await user.save();
        
        await User.findByIdAndUpdate(leaderId, {
            $addToSet: { assignedMembers: user._id }
        });
        
        res.json({ message: 'Member assigned to leader successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Wipeout all data (Tasks, Projects, Reports, non-admin Users)
// @route   POST /api/users/wipeout
router.post('/wipeout', async (req, res) => {
    try {
        console.log('🚀 WIPE OUT INITIATED BY:', req.user.email);
        
        // 1. Delete all Tasks
        await Task.deleteMany({});
        
        // 2. Delete all Projects
        await Project.deleteMany({});
        
        // 3. Delete all Reports
        await Report.deleteMany({});
        
        // 4. Delete all non-admin Users from MongoDB
        // We keep the admins so they can still log in
        await User.deleteMany({ role: { $ne: 'admin' } });

        // Note: We don't delete from Firebase Auth here to avoid orphan accounts 
        // if some non-admin users were created there but not in DB, 
        // but for a "wipeout" for testing, this should be enough to clear the UI.

        res.json({ message: 'System wiped successfully. All tasks, projects, and members have been removed.' });
    } catch (error) {
        console.error('Wipeout Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

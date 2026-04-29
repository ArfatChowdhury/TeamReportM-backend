const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All routes here are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users
// @route   GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).populate('assignedLeader', 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new user
// @route   POST /api/users
router.post('/', async (req, res) => {
  const { name, email, firebaseUid, role, assignedLeader } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      firebaseUid,
      role,
      assignedLeader
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

module.exports = router;

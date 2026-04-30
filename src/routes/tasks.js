const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

// @desc    Get all tasks (filtered by role)
// @route   GET /api/tasks
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'leader') {
      // Leader sees tasks assigned to their members or themselves
      query = { 
        $or: [
          { assignedTo: { $in: req.user.assignedMembers || [] } },
          { assignedTo: req.user._id },
          { assignedBy: req.user._id }
        ]
      };
    } else if (req.user.role === 'member') {
      query = { assignedTo: req.user._id };
    }

    // Add project filter if provided
    if (req.query.project) {
        query.project = req.query.project;
    }
    const tasks = await Task.find(query).populate('project assignedTo assignedBy');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create multiple tasks (Bulk)
// @route   POST /api/tasks/bulk
router.post('/bulk', authorize('admin', 'leader'), async (req, res) => {
  const { tasks } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: 'Invalid tasks data' });
  }

  try {
    const preparedTasks = tasks.map(task => ({
      ...task,
      assignedBy: req.user._id,
      status: 'todo'
    }));

    const createdTasks = await Task.insertMany(preparedTasks);
    res.status(201).json(createdTasks);
  } catch (error) {
    console.error('Bulk Task Creation Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a task

// @desc    Update task details
// @route   PATCH /api/tasks/:id
router.patch('/:id', authorize('admin', 'leader'), async (req, res) => {
  const { title, description, assignedTo, dueDate, priority } = req.body;

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.isLocked) {
      return res.status(403).json({ message: 'Locked tasks cannot be edited' });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update task status (enforces flow)
// @route   PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in-progress', 'pause', 'done'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Role check: Only assignedTo or admin/leader can update status
    if (req.user.role === 'member' && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this task status' });
    }

    if (task.isLocked) {
        return res.status(403).json({ message: 'This task is locked and cannot be modified' });
    }

    const prevStatus = task.status;
    task.status = status;

    if (status === 'in-progress') {
      if (!task.startedAt) {
        task.startedAt = new Date();
      }
      // If resuming from pause, we don't reset startedAt
    } else if (status === 'done') {
      task.completedAt = new Date();
      if (task.startedAt) {
          const diffInMs = task.completedAt - task.startedAt;
          task.timeTracked = Math.round(diffInMs / 60000); // Minutes
      }
    } else if (status === 'pause') {
        // Just set status to pause
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Carry over task
// @route   POST /api/tasks/:id/carryover
router.post('/:id/carryover', authorize('admin', 'leader'), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        if (task.status === 'done') {
            return res.status(400).json({ message: 'Cannot carry over a completed task' });
        }
        
        // Create new task based on old one
        const newTask = await Task.create({
            title: task.title,
            description: task.description,
            project: task.project,
            assignedTo: task.assignedTo,
            assignedBy: req.user._id,
            isCarryOver: true,
            originalTask: task._id,
            dueDate: task.dueDate
        });

        // Mark original task as locked
        task.isLocked = true;
        await task.save();
        
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

// @desc    Get all reports (filtered by role)
// @route   GET /api/reports
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'leader') {
        // Leader sees reports of their members or themselves
        query = { createdBy: { $in: [...req.user.assignedMembers, req.user._id] } };
    } else if (req.user.role === 'member') {
      query = { createdBy: req.user._id };
    }
    // Admin sees all

    const reports = await Report.find(query).populate('createdBy project tasks');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a report
// @route   POST /api/reports
router.post('/', async (req, res) => {
  const { project, tasks, summary } = req.body;

  try {
    const report = await Report.create({
      createdBy: req.user._id,
      project,
      tasks,
      summary
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get daily reports
// @route   GET /api/reports/daily
router.get('/daily', async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        
        let query = {
            date: { $gte: startOfDay, $lte: endOfDay }
        };
        
        if (req.user.role === 'leader') {
            query.createdBy = { $in: [...req.user.assignedMembers, req.user._id] };
        } else if (req.user.role === 'member') {
            query.createdBy = req.user._id;
        }

        const reports = await Report.find(query).populate('createdBy project tasks');
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get dashboard summary (Today's recap)
// @route   GET /api/reports/summary
router.get('/summary', async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Find all tasks completed today
        const completedTasks = await Task.find({
            status: 'done',
            completedAt: { $gte: startOfDay, $lte: endOfDay }
        }).populate('project assignedTo');

        const totalCompleted = completedTasks.length;
        const totalMinutes = completedTasks.reduce((acc, task) => acc + (task.timeTracked || 0), 0);
        
        // Group by project
        const projectSummary = {};
        completedTasks.forEach(task => {
            const pTitle = task.project?.title || 'Unknown';
            projectSummary[pTitle] = (projectSummary[pTitle] || 0) + 1;
        });

        res.json({
            totalCompleted,
            totalMinutes,
            projectSummary,
            tasks: completedTasks.map(t => ({
                title: t.title,
                member: t.assignedTo?.name,
                project: t.project?.title
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

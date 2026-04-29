const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

// @desc    Get all projects (filtered by role)
// @route   GET /api/projects
router.get('/', async (req, res) => {
  try {
    let query = { isDeleted: false };

    if (req.user.role === 'leader') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'member') {
      query.visibleTo = req.user._id;
    }
    // Admin sees all not deleted

    const projects = await Project.find(query).sort({ order: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a project
// @route   POST /api/projects
router.post('/', authorize('admin', 'leader'), async (req, res) => {
  const { title, description, visibleTo, order } = req.body;

  try {
    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      visibleTo: visibleTo || [],
      order: order || 0
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update project
// @route   PUT /api/projects/:id
router.put('/:id', authorize('admin', 'leader'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Leaders can only edit their own projects
    if (req.user.role === 'leader' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this project' });
    }

    project.title = req.body.title || project.title;
    project.description = req.body.description || project.description;
    project.visibleTo = req.body.visibleTo || project.visibleTo;
    project.order = req.body.order !== undefined ? req.body.order : project.order;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Soft delete project
// @route   DELETE /api/projects/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      project.isDeleted = true;
      await project.save();
      res.json({ message: 'Project removed (soft delete)' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reorder projects
// @route   PUT /api/projects/reorder
router.put('/reorder', authorize('admin', 'leader'), async (req, res) => {
    const { orders } = req.body; // Array of { id, order }
    try {
        const updates = orders.map(item => 
            Project.findByIdAndUpdate(item.id, { order: item.order })
        );
        await Promise.all(updates);
        res.json({ message: 'Projects reordered' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

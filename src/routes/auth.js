const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;

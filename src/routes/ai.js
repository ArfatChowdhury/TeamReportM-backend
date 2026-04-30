const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

// @desc    Suggest tasks for a project using AI (Groq)
// @route   POST /api/ai/suggest-tasks
router.post('/suggest-tasks', authorize('admin', 'leader'), async (req, res) => {
    const { title, description } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ message: 'Groq API Key not configured' });
    }

    try {
        const prompt = `You are a professional project manager. 
        Given the project title: "${title}" and description: "${description}", 
        suggest 5-7 core tasks to complete this project. 
        Return ONLY a JSON array of strings. No extra text.
        Example format: ["Task 1", "Task 2"]`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiContent = response.data.choices[0].message.content;
        // Parse the response if it's a string, or send as is
        const tasks = JSON.parse(aiContent);
        
        // Handle both object { tasks: [] } and direct array [] formats
        const result = Array.isArray(tasks) ? tasks : (tasks.tasks || []);
        
        res.json(result);
    } catch (error) {
        console.error('AI Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate AI suggestions' });
    }
});
// @desc    General AI Chat (Improve writing)
// @route   POST /api/ai/chat
router.post('/chat', protect, async (req, res) => {
    const { prompt } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ message: 'Groq API Key not configured' });
    }

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            },
            {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
            }
        );

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ message: 'AI Chat failed' });
    }
});

module.exports = router;

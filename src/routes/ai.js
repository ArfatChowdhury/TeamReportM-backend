const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

// @desc    Suggest tasks for a project using AI (Groq)
// @route   POST /api/ai/suggest-tasks
router.post('/suggest-tasks', authorize('admin', 'leader'), async (req, res) => {
    const { title, description, deadline } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ message: 'Groq API Key not configured' });
    }

    try {
        const prompt = `You are a professional project manager. 
        Given the project title: "${title}", description: "${description}", and deadline: "${deadline || 'No strict deadline'}", 
        generate a list of 5-10 actionable sub-tasks.
        For each task, provide:
        1. A clear "title"
        2. A helpful "description" 
        3. A suggested "priority" (must be "high", "medium", or "low")
        4. A realistic "allocatedMinutes" as an integer (e.g., 360 for 6 hours, 2880 for 2 days), ensuring all tasks can realistically be completed before the project deadline.

        Return ONLY a JSON object with a "tasks" key containing the array of objects.
        Example: { "tasks": [{ "title": "Setup", "description": "...", "priority": "high", "allocatedMinutes": 360 }] }`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
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
        const result = JSON.parse(aiContent);
        
        res.json(result.tasks || []);
    } catch (error) {
        console.error('AI Suggest Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to generate AI suggestions' });
    }
});

// @desc    Improve task title and description
// @route   POST /api/ai/improve-task
router.post('/improve-task', protect, async (req, res) => {
    const { title, description } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ message: 'Groq API Key not configured' });
    }

    try {
        const prompt = `You are a professional writing assistant. 
        Improve the following task to make it sound professional and clear.
        Title: "${title}"
        Description: "${description}"
        
        Return ONLY a JSON object with "title" and "description" keys.
        Do not change the core meaning, just improve the clarity and tone.`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        console.error('AI Improve Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'AI failed to improve task' });
    }
});

// @desc    General AI Chat (Cleanup)
router.post('/chat', protect, async (req, res) => {
    // ... rest of the existing code if needed, but we'll keep it simple for now
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
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

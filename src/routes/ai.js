const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// @desc    Improve task title and description
// @route   POST /api/ai/improve-task
router.post('/improve-task', authorize('admin', 'leader'), async (req, res) => {
  const { title, description } = req.body;

  try {
    const response = await axios.post(GROQ_API_URL, {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a professional project manager. Improve the following task title and description to be more clear, concise, and professional. Return the result in JSON format: { "title": "...", "description": "..." }'
        },
        {
          role: 'user',
          content: `Title: ${title}\nDescription: ${description}`
        }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const improved = JSON.parse(response.data.choices[0].message.content);
    res.json(improved);
  } catch (error) {
    console.error('AI Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'AI processing failed' });
  }
});

// @desc    Generate bulk tasks from prompt
// @route   POST /api/ai/bulk-tasks
router.post('/bulk-tasks', authorize('admin', 'leader'), async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(GROQ_API_URL, {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a project manager. Generate a list of tasks based on the user prompt. Return the result as a JSON array of objects: [{ "title": "...", "description": "..." }]'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Handle potential wrapper object if model returns { "tasks": [...] }
    const content = JSON.parse(response.data.choices[0].message.content);
    const tasks = Array.isArray(content) ? content : (content.tasks || []);
    
    res.json(tasks);
  } catch (error) {
    console.error('AI Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'AI bulk task generation failed' });
  }
});

// @desc    Generate HTML email body for report
// @route   POST /api/ai/email-report
router.post('/email-report', async (req, res) => {
    const { reportData } = req.body;
    try {
        const response = await axios.post(GROQ_API_URL, {
            model: 'mixtral-8x7b-32768',
            messages: [
                {
                    role: 'system',
                    content: 'Generate a professional HTML email body for a daily status report. Use the provided data.'
                },
                {
                    role: 'user',
                    content: JSON.stringify(reportData)
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ html: response.data.choices[0].message.content });
    } catch (error) {
        console.error('AI Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'AI email generation failed' });
    }
});

module.exports = router;

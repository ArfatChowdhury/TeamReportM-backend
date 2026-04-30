const express = require('express');
const router = express.Router();
const axios = require('axios');
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
const nodemailer = require('nodemailer');

// SMTP Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// @desc    Send AI-powered email report
// @route   POST /api/reports/email-report
router.post('/email-report', async (req, res) => {
    const { to, cc, subject, tasks, projectTitle } = req.body;

    try {
        // 1. Generate AI Summary using Groq
        let aiSummary = "Daily project update for " + projectTitle;
        if (process.env.GROQ_API_KEY) {
            const prompt = `Write a professional executive summary for a project report. 
            Project: ${projectTitle}. 
            Tasks completed/in-progress: ${tasks.map(t => t.title).join(', ')}. 
            Keep it under 100 words.`;

            const aiResponse = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: prompt }],
                },
                {
                    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
                }
            );
            aiSummary = aiResponse.data.choices[0].message.content;
        }

        // 2. Build HTML Table
        const taskRows = tasks.map(t => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${t.title}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-transform: capitalize;">${t.status}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${t.timeTracked || 0}m</td>
            </tr>
        `).join('');

        const htmlBody = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px;">
                <h2 style="color: #6366F1;">Project Report: ${projectTitle}</h2>
                <p><strong>Executive Summary:</strong></p>
                <p style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6366F1;">
                    ${aiSummary}
                </p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f1f5f9;">
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Task</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Status</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${taskRows}
                    </tbody>
                </table>
                <p style="margin-top: 25px; font-size: 12px; color: #64748B;">
                    Generated by Team Report Manager AI
                </p>
            </div>
        `;

        // 3. Send Email
        await transporter.sendMail({
            from: `"Team Report AI" <${process.env.SMTP_USER}>`,
            to,
            cc,
            subject: subject || `Daily Report: ${projectTitle}`,
            html: htmlBody,
        });

        res.json({ message: 'Report sent successfully' });
    } catch (error) {
        console.error('Email Error:', error);
        res.status(500).json({ message: 'Failed to send email report' });
    }
});

// @desc    Proxy an external image to prevent SSRF and tracking
// @route   GET /api/reports/proxy-image
router.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
        return res.status(400).send('Image URL is required');
    }

    try {
        const parsedUrl = new URL(imageUrl);
        const hostname = parsedUrl.hostname.toLowerCase();

        // Basic SSRF Protection: Block local and internal IPs
        const isInternal = 
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
            hostname.endsWith('.internal');

        if (isInternal || (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:')) {
            return res.status(403).send('Forbidden: Invalid or internal URL');
        }

        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 5000 // 5 second timeout
        });

        // Forward content type
        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
        
    } catch (error) {
        res.status(500).send('Error fetching image');
    }
});

module.exports = router;

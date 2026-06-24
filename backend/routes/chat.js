const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/aiHelpCenter');
const SupportTicket = require('../models/SupportTicket');

// In-memory stores (use Redis in production)
const memoryStore = {};
const sessionMeta = {};

function sanitizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];

  // Keep response payloads small & avoid junk shapes
  return history
    .slice(-30)
    .filter(m => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'ai'))
    .map(m => ({
      role: m.role,
      text: m.text.slice(0, 1200),
      timestamp: m.timestamp || new Date().toISOString(),
    }));
}



// POST /api/chat - Main AI Help Center endpoint
router.post('/chat', async (req, res) => {
  try {
    const { userId, sessionId, message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sid = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize session meta if new
    if (!sessionMeta[sid]) {
      sessionMeta[sid] = { failedAttempts: 0, escalationTriggered: 0 };
    }

    // Process through AI Help Center engine
    const result = await processMessage({
      userId,
      sessionId: sid,
      message: message.trim(),
      memoryStore,
      sessionMeta: sessionMeta[sid],
    });

    // Track failed attempts (simple heuristic: if reply contains "sorry" or "try again")
    const lowerReply = result.reply.toLowerCase();
    if (lowerReply.includes('sorry') && lowerReply.includes('try again')) {
      sessionMeta[sid].failedAttempts = (sessionMeta[sid].failedAttempts || 0) + 1;
    }

    res.json({
      reply: result.reply,
      intent: result.intent,
      suggestions: result.suggestions,
      escalated: result.escalated,
      emotionScore: result.emotionScore,
      step: result.step,
      language: result.language,
      sessionId: sid,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/chat/ticket - Create escalation ticket
router.post('/chat/ticket', async (req, res) => {
  // Defensive limits: prevent very large payloads

  try {
    const {
      userId,
      name,
      email,
      phone,
      intent,
      subject,
      description,
      conversationHistory,
      emotionScore,
    } = req.body;

    if (!name || !email || !subject || !description) {
      return res.status(400).json({ error: 'Name, email, subject, and description are required' });
    }

    const safeConversationHistory = sanitizeConversationHistory(conversationHistory);

    const ticket = new SupportTicket({
      // always store sanitized history to reduce DB/document size
      conversationHistory: safeConversationHistory,

      userId: userId || undefined,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      intent: intent || 'general_inquiry',
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
      priority: emotionScore?.frustration >= 7 ? 'urgent' : emotionScore?.frustration >= 5 ? 'high' : 'medium',
      emotionScore: {
        frustration: emotionScore?.frustration || 0,
        confusion: emotionScore?.confusion || 0,
      },
    });

    await ticket.save();

    res.json({
      success: true,
      ticketId: ticket._id,
      ticketNumber: `TKT-${ticket._id.toString().slice(-6).toUpperCase()}`,
      message: 'Ticket created successfully. Our support team will contact you shortly.',
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({ error: 'Failed to create ticket', message: error.message });
  }
});

// GET /api/chat/ticket/:ticketId - Check ticket status
router.get('/chat/ticket/:ticketId', async (req, res) => {
  // Exclude conversationHistory to keep response small

  try {
    const ticket = await SupportTicket.findById(req.params.ticketId).select('-conversationHistory');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket', message: error.message });
  }
});

// GET /api/chat/health - Health check for AI service
router.get('/chat/health', (req, res) => {
  res.json({ status: 'OK', service: 'AI Help Center Agent', timestamp: new Date().toISOString() });
});

module.exports = router;

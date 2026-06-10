const { runAIAgent } = require('../services/ai.service');

// POST /ai/chat
const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const result = await runAIAgent(messages);
    res.json(result);
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message || 'AI service error' });
  }
};

module.exports = { chat };

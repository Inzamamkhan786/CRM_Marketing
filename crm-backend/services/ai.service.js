/**
 * AI Service — OpenAI Function Calling Agent
 *
 * Runs a multi-turn loop: sends messages + tool definitions to OpenAI,
 * executes any tool calls, and repeats until the model gives a final text response.
 *
 * To enable: add OPENAI_API_KEY to your .env file
 */

const OpenAI = require('openai');

// ── Tool imports ─────────────────────────────────────────────────────────────
const { createSegmentTool,          createSegmentHandler          } = require('../tools/createSegment');
const { generateCampaignMessageTool, generateCampaignMessageHandler } = require('../tools/generateCampaignMessage');
const { createCampaignTool,         createCampaignHandler         } = require('../tools/createCampaign');
const { sendCampaignTool,           sendCampaignHandler           } = require('../tools/sendCampaign');
const { getAnalyticsTool,           getAnalyticsHandler           } = require('../tools/getAnalytics');

// ── OpenAI client setup ───────────────────────────────────────────────────────
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error(
        'OpenAI API key not configured. Add OPENAI_API_KEY to your .env file.'
      );
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// ── Tool registry ─────────────────────────────────────────────────────────────
const TOOLS = [
  createSegmentTool,
  generateCampaignMessageTool,
  createCampaignTool,
  sendCampaignTool,
  getAnalyticsTool,
];

const TOOL_HANDLERS = {
  createSegment:           createSegmentHandler,
  generateCampaignMessage: generateCampaignMessageHandler,
  createCampaign:          createCampaignHandler,
  sendCampaign:            sendCampaignHandler,
  getAnalytics:            getAnalyticsHandler,
};

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI marketing assistant for a CRM platform called XenoCRM.
You help marketers:
- Find the right customer segments based on behavior (spend, inactivity, city, etc.)
- Generate compelling, personalized campaign messages
- Create and manage marketing campaigns
- Send campaigns to audiences
- Analyze campaign performance

You have access to tools to perform these actions directly.

Important rules:
1. Always use createSegment first to find the audience before creating a campaign.
2. Always show the user the segment size and suggested message BEFORE sending. Ask for confirmation.
3. Only call sendCampaign after the user confirms with "yes", "send it", "go ahead", or similar.
4. Be concise but friendly. Present numbers clearly.
5. If the user asks about performance, use getAnalytics.
6. When creating a message, make it personal, warm, and action-oriented.`;

// ── Main agent loop ────────────────────────────────────────────────────────────
/**
 * @param {Array<{role: string, content: string}>} userMessages
 * @returns {Promise<{reply: string, toolsUsed: string[]}>}
 */
async function runAIAgent(userMessages) {
  const client = getOpenAIClient();

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages,
  ];

  const toolsUsed = [];
  const MAX_ITERATIONS = 10;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
    });

    const message = response.choices[0].message;
    messages.push(message);

    // No more tool calls — return the final text response
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content, toolsUsed };
    }

    // Execute each tool call
    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      console.log(`🔧 AI calling tool: ${toolName}`, toolArgs);
      toolsUsed.push(toolName);

      const handler = TOOL_HANDLERS[toolName];
      let toolResult;

      if (!handler) {
        toolResult = { error: `Unknown tool: ${toolName}` };
      } else {
        try {
          toolResult = await handler(toolArgs);
        } catch (err) {
          console.error(`Tool ${toolName} error:`, err);
          toolResult = { error: err.message };
        }
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return {
    reply: 'I reached the maximum number of steps. Please try a simpler request.',
    toolsUsed,
  };
}

module.exports = { runAIAgent };

/**
 * AI Service — OpenAI Function Calling Agent
 *
 * Runs a multi-turn loop: sends messages + tool definitions to OpenAI,
 * executes any tool calls, and repeats until the model gives a final text response.
 *
 * Returns the full internal messages array so the frontend can resend it
 * on the next turn — giving the AI persistent memory of tool results (IDs, etc.)
 */

const OpenAI = require('openai');

// ── Tool imports ─────────────────────────────────────────────────────────────
const { createSegmentTool,          createSegmentHandler          } = require('../tools/createSegment');
const { listSegmentsTool,           listSegmentsHandler           } = require('../tools/listSegments');
const { listCampaignsTool,          listCampaignsHandler          } = require('../tools/listCampaigns');
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
  listSegmentsTool,
  listCampaignsTool,
  createSegmentTool,
  generateCampaignMessageTool,
  createCampaignTool,
  sendCampaignTool,
  getAnalyticsTool,
];

const TOOL_HANDLERS = {
  listSegments:            listSegmentsHandler,
  listCampaigns:           listCampaignsHandler,
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

You have access to these tools: listSegments, listCampaigns, createSegment, generateCampaignMessage, createCampaign, sendCampaign, getAnalytics.

CRITICAL RULES — follow these exactly:

1. AVOID DUPLICATE SEGMENTS: Before creating a segment, ALWAYS call listSegments first to check if one with that name already exists. If the user wants to EDIT a segment's rules, call createSegment with the EXACT SAME NAME — it will UPDATE the existing one, not create a duplicate.

2. SEGMENT FIRST: Always get a segment_id (from listSegments or createSegment) before creating a campaign.

3. REMEMBER IDs: When a tool returns a segment_id or campaign_id, REMEMBER IT for later calls in this conversation. Never ask the user for IDs — you already have them from tool results.

4. CONFIRMATION BEFORE SEND: Always show the audience size and draft message BEFORE sending. Only call sendCampaign after the user explicitly confirms with "yes", "send it", "go ahead", or similar.

5. ANALYTICS LOOKUP: When asked about analytics, first call listCampaigns to find the correct campaign_id by name, then call getAnalytics with that ID.

6. TONE: Be concise but friendly. Present numbers clearly. Don't ask unnecessary follow-up questions if you already have the information.`;

// ── Main agent loop ────────────────────────────────────────────────────────────
/**
 * @param {Array<{role: string, content: string}>} userMessages
 *   The full conversation history from the frontend — includes prior tool call
 *   messages if the frontend is resending them for memory continuity.
 * @returns {Promise<{reply: string, toolsUsed: string[], messages: Array}>}
 *   Returns reply text, tools used, AND the full internal messages array
 *   (minus system prompt) so the frontend can resend it next turn for memory.
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
      return {
        reply: message.content,
        toolsUsed,
        // Return full messages (excluding system prompt) so frontend can resend
        // them next turn, giving the AI memory of all tool results and IDs.
        messages: messages.slice(1),
      };
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
    messages: messages.slice(1),
  };
}

module.exports = { runAIAgent };

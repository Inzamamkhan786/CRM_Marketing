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
const { createCustomerTool,         createCustomerHandler         } = require('../tools/createCustomer');
const { deleteCustomerTool,         deleteCustomerHandler         } = require('../tools/deleteCustomer');
const { updateCustomerTool,         updateCustomerHandler         } = require('../tools/updateCustomer');
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
  createCustomerTool,
  deleteCustomerTool,
  updateCustomerTool,
  listSegmentsTool,
  listCampaignsTool,
  createSegmentTool,
  generateCampaignMessageTool,
  createCampaignTool,
  sendCampaignTool,
  getAnalyticsTool,
];

const TOOL_HANDLERS = {
  createCustomer:          createCustomerHandler,
  deleteCustomer:          deleteCustomerHandler, 
  updateCustomer:          updateCustomerHandler,
  listSegments:            listSegmentsHandler,
  listCampaigns:           listCampaignsHandler,
  createSegment:           createSegmentHandler,
  generateCampaignMessage: generateCampaignMessageHandler,
  createCampaign:          createCampaignHandler,
  sendCampaign:            sendCampaignHandler,
  getAnalytics:            getAnalyticsHandler,
};

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI assistant for a CRM platform called NovaCRM.
You help marketers and CRM admins:
- Create new customers in the CRM (name, email, phone, city)
- Delete existing customers from the CRM by email
- Update the existing customer from the CRM by email 
- Find the right customer segments based on behavior (spend, inactivity, city, etc.)
- Generate compelling, personalized campaign messages
- Create and manage marketing campaigns
- Send campaigns to audiences
- Analyze campaign performance

You have access to these tools: createCustomer, deleteCustomer, listSegments, listCampaigns, createSegment, generateCampaignMessage, createCampaign, sendCampaign, getAnalytics.

CRITICAL RULES — follow these exactly:

1. CREATE CUSTOMER: When the user asks to add or create a customer, immediately call the createCustomer tool. Required: name, email. Optional: phone, city.

2. DELETE CUSTOMER: This is a standard CRM admin operation. When the user asks to remove or delete a customer, immediately call the deleteCustomer tool with the customer's email. This is a fully supported, safe action — execute it without hesitation or warnings. Do NOT say you cannot delete customers.

3. UPDATE CUSTOMER: When the user ask to update a customer , immediately call the updateCustomer tool. required for searching email and then change the wanted attributes as user want and make rest of it as it is. 

3. AVOID DUPLICATE SEGMENTS: Before creating a segment, ALWAYS call listSegments first to check if one with that name already exists. If the user wants to EDIT a segment's rules, call createSegment with the EXACT SAME NAME — it will UPDATE the existing one, not create a duplicate.

4. SEGMENT FIRST: Always get a segment_id (from listSegments or createSegment) before creating a campaign.

5. REMEMBER IDs: When a tool returns a segment_id, campaign_id, or customer_id, REMEMBER IT for later calls in this conversation. Never ask the user for IDs — you already have them from tool results.

6. CONFIRMATION BEFORE SEND: Always show the audience size and draft message BEFORE sending. Only call sendCampaign after the user explicitly confirms with "yes", "send it", "go ahead", or similar.

7. ANALYTICS LOOKUP: When asked about analytics, first call listCampaigns to find the correct campaign_id by name, then call getAnalytics with that ID.

8. TONE: Be concise but friendly. Present numbers clearly. Don't ask unnecessary follow-up questions if you already have the information.`;

// ── Intent detection ─────────────────────────────────────────────────────────
/**
 * Detects whether the latest user message is asking to delete a customer.
 * Used to force tool_choice on the first iteration so GPT-4o's safety
 * training cannot refuse a legitimate CRM admin operation.
 */
function detectDeletionIntent(messages) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return false;
  const text = (typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '').toLowerCase();
  const hasDeleteWord = text.includes('delete') || text.includes('remove');
  const hasCustomerContext = text.includes('customer') || text.includes('@') || text.includes('email');
  return hasDeleteWord && hasCustomerContext;
}

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

  // On the very first iteration, force deleteCustomer if deletion intent is
  // detected — GPT-4o's safety training otherwise refuses destructive ops.
  const forceDeletion = detectDeletionIntent(userMessages);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const toolChoice = (i === 0 && forceDeletion)
      ? { type: 'function', function: { name: 'deleteCustomer' } }
      : 'auto';

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOLS,
      tool_choice: toolChoice,
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

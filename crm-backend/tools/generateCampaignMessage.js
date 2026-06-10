/**
 * Tool 2: generateCampaignMessage
 * Uses OpenAI to write compelling marketing copy based on segment context.
 * Falls back to a template-based message if no OpenAI key is present.
 */

const generateCampaignMessageTool = {
  type: 'function',
  function: {
    name: 'generateCampaignMessage',
    description:
      'Generates a personalized marketing message for a campaign given the audience context and campaign goal.',
    parameters: {
      type: 'object',
      properties: {
        segment_name: {
          type: 'string',
          description: 'Name of the target segment, e.g. "Inactive High Spenders"',
        },
        campaign_goal: {
          type: 'string',
          description:
            'The goal of the campaign, e.g. "win-back inactive customers", "promote new collection", "announce sale"',
        },
        channel: {
          type: 'string',
          enum: ['WhatsApp', 'SMS', 'Email', 'RCS'],
          description: 'The delivery channel — affects message length and tone',
        },
        brand_tone: {
          type: 'string',
          description: 'Optional tone: "friendly", "urgent", "premium", "casual"',
        },
      },
      required: ['segment_name', 'campaign_goal', 'channel'],
    },
  },
};

async function generateCampaignMessageHandler({ segment_name, campaign_goal, channel, brand_tone }) {
  // Template-based message generation (works without OpenAI key)
  // When OpenAI is available, the model itself generates richer messages in its final reply.

  const tone = brand_tone || 'friendly';
  const isShortChannel = ['WhatsApp', 'SMS'].includes(channel);

  const templates = {
    'win-back': {
      friendly: `We miss you! 💛 It's been a while since your last visit. Come back and enjoy 20% OFF your next order. Use code: COMEBACK20. Valid for 48 hours only!`,
      urgent:   `⚠️ Last chance! Your exclusive 25% discount expires in 24 hours. Don't miss out — shop now!`,
      premium:  `You deserve the best. As a valued customer, we've reserved an exclusive offer just for you: complimentary shipping + 15% off your next purchase.`,
    },
    'promote': {
      friendly: `🎉 Something exciting just dropped! Our latest collection is here and we thought you'd love it. Shop now and get free shipping this weekend!`,
      urgent:   `🔥 Limited stock alert! Our new arrivals are selling fast. Grab yours before they're gone!`,
      premium:  `We're delighted to present our newest curated collection, crafted exclusively for discerning shoppers like you.`,
    },
    'sale': {
      friendly: `Big SALE is here! 🛍️ Up to 50% off on your favourite items. This weekend only — shop now and save big!`,
      urgent:   `SALE ENDS TONIGHT! Up to 60% off. Don't wait — prices go back up at midnight!`,
      premium:  `An exclusive sale event, by invitation only. Enjoy curated discounts of up to 40% on premium selections.`,
    },
  };

  // Match goal to template key
  let templateKey = 'promote';
  if (campaign_goal.toLowerCase().includes('win') || campaign_goal.toLowerCase().includes('inactive') || campaign_goal.toLowerCase().includes('re-engage')) {
    templateKey = 'win-back';
  } else if (campaign_goal.toLowerCase().includes('sale') || campaign_goal.toLowerCase().includes('discount') || campaign_goal.toLowerCase().includes('off')) {
    templateKey = 'sale';
  }

  let message = templates[templateKey][tone] || templates[templateKey]['friendly'];

  // Trim for short channels
  if (isShortChannel && message.length > 160) {
    message = message.substring(0, 157) + '...';
  }

  return {
    message,
    channel,
    character_count: message.length,
    template_used: `${templateKey}/${tone}`,
  };
}

module.exports = { generateCampaignMessageTool, generateCampaignMessageHandler };

const pool = require('../db/pool');

/**
 * Tool: listCampaigns
 * Lets the AI find campaign IDs by name for analytics lookups.
 */
const listCampaignsTool = {
  type: 'function',
  function: {
    name: 'listCampaigns',
    description:
      'Lists recent campaigns with their IDs, names, channels, and statuses. Use this to find a campaign_id when the user asks about analytics for a specific campaign by name.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

async function listCampaignsHandler() {
  const result = await pool.query(
    `SELECT id, name, channel, status, created_at
     FROM campaigns
     ORDER BY created_at DESC
     LIMIT 20`
  );
  return { campaigns: result.rows };
}

module.exports = { listCampaignsTool, listCampaignsHandler };

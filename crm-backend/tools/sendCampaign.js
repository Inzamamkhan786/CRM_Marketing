const pool = require('../db/pool');
const { buildSegmentQuery } = require('../services/segment.service');
const { dispatchCampaign } = require('../services/campaign.service');

const sendCampaignTool = {
  type: 'function',
  function: {
    name: 'sendCampaign',
    description:
      'Sends a campaign to its audience via the channel service. Only call this after user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        campaign_id: {
          type: 'number',
          description: 'ID of the campaign to send (from createCampaign)',
        },
      },
      required: ['campaign_id'],
    },
  },
};

async function sendCampaignHandler({ campaign_id }) {
  const campResult = await pool.query(`
    SELECT c.*, s.rules FROM campaigns c
    LEFT JOIN segments s ON c.segment_id = s.id
    WHERE c.id = $1
  `, [campaign_id]);

  if (campResult.rows.length === 0) {
    throw new Error(`Campaign ${campaign_id} not found`);
  }

  const campaign = campResult.rows[0];

  if (campaign.status === 'SENT') {
    return { message: 'Campaign already sent', campaign_id };
  }

  // Resolve audience
  let customers = [];
  if (campaign.rules) {
    const { sql, params } = buildSegmentQuery(campaign.rules);
    const result = await pool.query(sql, params);
    customers = result.rows;
  } else {
    const result = await pool.query('SELECT * FROM customers');
    customers = result.rows;
  }

  // Create communication records
  const commInserts = customers.map(c =>
    pool.query(
      `INSERT INTO communications (campaign_id, customer_id, status)
       VALUES ($1, $2, 'PENDING') RETURNING id`,
      [campaign_id, c.id]
    )
  );
  const commResults = await Promise.all(commInserts);

  // Dispatch to channel service (fire and forget)
  const dispatches = commResults.map((r, i) =>
    dispatchCampaign({
      communicationId: r.rows[0].id,
      campaignId: campaign_id,
      customerId: customers[i].id,
      channel: campaign.channel,
      message: campaign.message,
    })
  );
  Promise.all(dispatches).catch(err => console.error('Tool dispatch error:', err));

  // Update status
  await pool.query(`UPDATE campaigns SET status='SENT' WHERE id=$1`, [campaign_id]);

  return {
    success: true,
    campaign_id,
    messages_dispatched: customers.length,
    channel: campaign.channel,
    note: 'Delivery events will arrive asynchronously via callbacks. Check analytics in a few seconds.',
  };
}

module.exports = { sendCampaignTool, sendCampaignHandler };
